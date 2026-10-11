/**
 * Blink Read Text Mode
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 2 Steps 4 - 8
 *
 * Reads medicine packages, product labels, and signs using Gemini Flash.
 * Falls back seamlessly to offline Tesseract.js OCR when network fails.
 */

import { captureFrame } from '../../camera/captureFrame'
import { hashFrameGrayscale, getCached, setCached } from '../../core/cache'
import { recordMetric } from '../../core/metrics'
import { isOffline, runOfflineOCR } from '../../core/offline'
import { speak } from '../../speech/speak'
import { playChime } from '../../speech/sound'
import { strings } from '../../config/strings'

export interface ReadResponse {
  text: string
  type: 'medicine' | 'sign' | 'menu' | 'other'
  legible: boolean
}

export interface ReadTextOptions {
  lang?: 'en' | 'ur'
  onProgress?: (status: string) => void
}

export async function readText(
  video: HTMLVideoElement | null,
  options: ReadTextOptions = {}
): Promise<void> {
  const { lang = 'en', onProgress } = options
  const langStrings = strings[lang] ?? strings.en
  const startTime = Date.now()

  // 1. Audio tone and immediate visual/spoken feedback
  playChime(587.33, 0.14) // D5 chime
  onProgress?.(langStrings.reading)
  speak(langStrings.reading, { interrupt: true, lang })

  if (!video) {
    speak(langStrings.cameraError, { interrupt: true, lang })
    return
  }

  // 2. Capture frame downscaled to max 1024px JPEG
  const base64Jpeg = captureFrame(video)
  if (!base64Jpeg) {
    speak('Could not capture frame. Try again.', { interrupt: true, lang })
    return
  }

  // 3. Check vision cache using 16x16 grayscale hash
  const frameHash = await hashFrameGrayscale(base64Jpeg)
  const cached = getCached<ReadResponse>(frameHash)
  if (cached) {
    const elapsed = Date.now() - startTime
    recordMetric({
      mode: 'read',
      durationMs: elapsed,
      source: 'cache',
      timestamp: new Date().toISOString(),
      details: cached.type,
    })
    speak(cached.text, { interrupt: true, lang })
    return
  }

  // 4. Handle Offline mode directly
  if (isOffline()) {
    onProgress?.('Running offline OCR...')
    const ocrText = await runOfflineOCR(base64Jpeg)
    const elapsed = Date.now() - startTime

    recordMetric({
      mode: 'read',
      durationMs: elapsed,
      source: 'offline',
      timestamp: new Date().toISOString(),
    })

    if (!ocrText) {
      speak(langStrings.readUnlegible, { interrupt: true, lang })
    } else {
      speak(`${langStrings.readOffline} ${ocrText}`, { interrupt: true, lang })
    }
    return
  }

  // 5. Online Gemini Vision via proxy
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Jpeg,
        task: 'read',
        lang,
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        speak(langStrings.rateLimited, { interrupt: true, lang })
        return
      }
      throw new Error(`HTTP ${response.status}`)
    }

    const data: ReadResponse = await response.json()
    const elapsed = Date.now() - startTime

    if (!data.legible) {
      recordMetric({
        mode: 'read',
        durationMs: elapsed,
        source: 'gemini',
        timestamp: new Date().toISOString(),
        details: 'unlegible',
      })
      speak(langStrings.readUnlegible, { interrupt: true, lang })
      return
    }

    let speechText = data.text

    // If medicine, append safety warning
    if (data.type === 'medicine') {
      speechText = `${speechText} ${langStrings.readMedicineWarning}`
    }

    // Cache result for 60s
    setCached(frameHash, { ...data, text: speechText })

    recordMetric({
      mode: 'read',
      durationMs: elapsed,
      source: 'gemini',
      timestamp: new Date().toISOString(),
      details: data.type,
    })

    speak(speechText, { interrupt: true, lang })
  } catch (err: unknown) {
    console.warn('Gemini proxy call failed, falling back to offline OCR:', err)

    // Fallback: Lazy load Tesseract.js
    onProgress?.(langStrings.readOffline)
    const ocrText = await runOfflineOCR(base64Jpeg)
    const elapsed = Date.now() - startTime

    recordMetric({
      mode: 'read',
      durationMs: elapsed,
      source: 'ocr_fallback',
      timestamp: new Date().toISOString(),
    })

    if (!ocrText) {
      speak(langStrings.readUnlegible, { interrupt: true, lang })
    } else {
      speak(`${langStrings.readOffline} ${ocrText}`, { interrupt: true, lang })
    }
  }
}
