/**
 * Blink Money Identifier Mode
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 5 & Part B requirements
 *
 * Captures up to 8 frames (320px, JPEG quality 0.7, ~600ms intervals),
 * queries the deployed inference service, applies confidence rules,
 * speaks the denomination or guidance, and logs latency metrics.
 */

import { captureFrame } from '../../camera/captureFrame'
import { isOffline } from '../../core/offline'
import { recordMetric } from '../../core/metrics'
import { getStrings, getDenominationWords } from '../../config/strings'
import { speak } from '../../speech/speak'
import { unsure } from '../../core/confidence'
import { MoneyConfidenceTracker, MoneyPrediction } from './confidence'
import { checkHealth, predictFrame } from './api'

let activeAbortController: AbortController | null = null
let isScanning = false

export interface MoneyResult {
  ok: boolean
  group: string | null
  spokenText: string
  reason?: 'not_sure' | 'no_note' | 'offline' | 'aborted' | 'error'
}

export interface MoneyDebugData {
  frameIndex: number
  dataUrl: string
  prediction: MoneyPrediction | null
  consecutiveWins: number
  isDecided: boolean
  decidedGroup: string | null
}

type DebugListener = (data: MoneyDebugData | null) => void
const debugListeners = new Set<DebugListener>()

export function onMoneyDebugUpdate(cb: DebugListener): () => void {
  debugListeners.add(cb)
  return () => {
    debugListeners.delete(cb)
  }
}

function emitDebug(data: MoneyDebugData | null) {
  for (const cb of debugListeners) {
    try {
      cb(data)
    } catch (e) {
      console.warn('Debug listener error:', e)
    }
  }
}

export function isMoneyScanning(): boolean {
  return isScanning
}

export function stopMoneyScan(): void {
  if (activeAbortController) {
    activeAbortController.abort()
    activeAbortController = null
  }
  isScanning = false
}

function base64ToBlob(base64: string, mimeType = 'image/jpeg'): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

export async function identifyMoney(
  video: HTMLVideoElement | null,
  options?: {
    onStatusChange?: (status: string) => void
    lang?: 'en' | 'ur'
  }
): Promise<MoneyResult> {
  const lang = options?.lang ?? 'en'
  const strings = getStrings(lang)
  const startTime = Date.now()

  // 1. Offline pre-check
  if (isOffline()) {
    speak(strings.moneyOffline, { interrupt: true })
    recordMetric({
      mode: 'money',
      durationMs: 0,
      source: 'offline',
      timestamp: new Date().toISOString(),
      details: 'Device is offline',
    })
    return { ok: false, group: null, spokenText: strings.moneyOffline, reason: 'offline' }
  }

  // 2. Cancel any existing session
  stopMoneyScan()
  const controller = new AbortController()
  activeAbortController = controller
  isScanning = true

  try {
    options?.onStatusChange?.('Connecting...')
    speak(strings.moneyScanning, { interrupt: true })

    // 3. Health check with 60s timeout; speak "Getting ready." if > 3s
    const isHealthy = await checkHealth({
      signal: controller.signal,
      timeoutMs: 60000,
      onSlow: () => {
        if (isScanning && !controller.signal.aborted) {
          options?.onStatusChange?.('Waking service...')
          speak(strings.moneyGettingReady, { interrupt: true })
        }
      },
    })

    if (!isHealthy || controller.signal.aborted) {
      if (!controller.signal.aborted) {
        speak(strings.moneyOffline, { interrupt: true })
        recordMetric({
          mode: 'money',
          durationMs: Date.now() - startTime,
          source: 'money_service',
          timestamp: new Date().toISOString(),
          details: 'Health check failed or timed out',
        })
      }
      return { ok: false, group: null, spokenText: strings.moneyOffline, reason: 'offline' }
    }

    if (!video) {
      speak(strings.cameraError, { interrupt: true })
      return { ok: false, group: null, spokenText: strings.cameraError, reason: 'error' }
    }

    // 4. Multi-frame capture & classification loop (up to 8 frames)
    const tracker = new MoneyConfidenceTracker()
    let decidedGroup: string | null = null

    for (let frameIndex = 1; frameIndex <= 8; frameIndex++) {
      if (controller.signal.aborted || !isScanning) {
        return { ok: false, group: null, spokenText: '', reason: 'aborted' }
      }

      options?.onStatusChange?.(`Scanning frame ${frameIndex} of 8...`)

      // Capture frame: 320px center-cropped square (70% focus area), JPEG quality 0.7
      // Focuses on the banknote without requiring the user to hold it right against the lens
      const base64Jpeg = captureFrame(video, 320, 0.7, { cropSquare: true, cropScale: 0.70 })
      if (!base64Jpeg) {
        await new Promise((r) => setTimeout(r, 200))
        continue
      }

      const dataUrl = `data:image/jpeg;base64,${base64Jpeg}`
      emitDebug({
        frameIndex,
        dataUrl,
        prediction: null,
        consecutiveWins: 0,
        isDecided: false,
        decidedGroup: null,
      })

      const imageBlob = base64ToBlob(base64Jpeg)
      let prediction: MoneyPrediction
      try {
        prediction = await predictFrame(imageBlob, controller.signal)
      } catch (err) {
        console.warn(`Frame ${frameIndex} predict error:`, err)
        // If service error occurs repeatedly, continue or retry next frame
        await new Promise((r) => setTimeout(r, 400))
        continue
      }

      // Log prediction for every frame as requested
      console.log(
        `Frame ${frameIndex}: top=${prediction.top}, top_p=${prediction.top_p}, second_p=${prediction.second_p}, latency_ms=${prediction.latency_ms}`
      )

      const decision = tracker.addFrame(prediction)

      emitDebug({
        frameIndex,
        dataUrl,
        prediction,
        consecutiveWins: decision.consecutiveWins,
        isDecided: decision.isDecided,
        decidedGroup: decision.group,
      })

      if (decision.isDecided && decision.group) {
        decidedGroup = decision.group
        break
      }

      // 600 ms cadence between frames
      await new Promise((r) => setTimeout(r, 600))
    }

    // 5. Speak final decision
    const totalDuration = Date.now() - startTime

    if (decidedGroup) {
      if (decidedGroup === 'others') {
        const spokenMessage = unsure('money_no_note', lang)
        options?.onStatusChange?.(spokenMessage)
        await speak(spokenMessage, { interrupt: true })

        recordMetric({
          mode: 'money',
          durationMs: totalDuration,
          source: 'money_service',
          timestamp: new Date().toISOString(),
          details: `Decided: others in ${tracker.getFrameCount()} frames`,
        })

        return { ok: false, group: 'others', spokenText: spokenMessage, reason: 'no_note' }
      } else {
        const spokenMessage = getDenominationWords(decidedGroup, lang)
        options?.onStatusChange?.(spokenMessage)
        await speak(spokenMessage, { interrupt: true })

        recordMetric({
          mode: 'money',
          durationMs: totalDuration,
          source: 'money_service',
          timestamp: new Date().toISOString(),
          details: `Decided: ${decidedGroup} in ${tracker.getFrameCount()} frames`,
        })

        return { ok: true, group: decidedGroup, spokenText: spokenMessage }
      }
    } else {
      // Reached 8 frames without meeting confidence threshold
      const unsureMessage = unsure('money_not_sure', lang)
      options?.onStatusChange?.(unsureMessage)
      await speak(unsureMessage, { interrupt: true })

      recordMetric({
        mode: 'money',
        durationMs: totalDuration,
        source: 'money_service',
        timestamp: new Date().toISOString(),
        details: `Unsure after ${tracker.getFrameCount()} frames`,
      })

      return { ok: false, group: null, spokenText: unsureMessage, reason: 'not_sure' }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { ok: false, group: null, spokenText: '', reason: 'aborted' }
    }
    console.error('Money identification error:', err)
    speak(strings.moneyOffline, { interrupt: true })
    recordMetric({
      mode: 'money',
      durationMs: Date.now() - startTime,
      source: 'money_service',
      timestamp: new Date().toISOString(),
      details: `Error: ${err?.message || err}`,
    })
    return { ok: false, group: null, spokenText: strings.moneyOffline, reason: 'error' }
  } finally {
    isScanning = false
    activeAbortController = null
  }
}
