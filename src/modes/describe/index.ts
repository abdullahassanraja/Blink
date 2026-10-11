/**
 * Blink Describe Scene Mode
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 3
 *
 * Captures the current camera frame and describes obstacles, people, and objects
 * in front of the blind user in at most 2 concise spoken sentences under 25 words.
 */

import { captureFrame } from '../../camera/captureFrame'
import { hashFrameGrayscale, getCached, setCached } from '../../core/cache'
import { recordMetric } from '../../core/metrics'
import { isOffline } from '../../core/offline'
import { speak } from '../../speech/speak'
import { playChime } from '../../speech/sound'
import { strings } from '../../config/strings'

export interface DescribeResponse {
  text: string
  confident: boolean
}

export interface DescribeOptions {
  lang?: 'en' | 'ur'
  onProgress?: (status: string) => void
}

// 3-second cooldown to prevent spam and quota overuse
const COOLDOWN_MS = 3000
let lastDescribeTime = 0

export async function describeScene(
  video: HTMLVideoElement | null,
  options: DescribeOptions = {}
): Promise<void> {
  const { lang = 'en', onProgress } = options
  const langStrings = strings[lang] ?? strings.en
  const now = Date.now()

  // 1. Enforce 3-second cooldown
  if (now - lastDescribeTime < COOLDOWN_MS) {
    return
  }
  lastDescribeTime = now

  const startTime = Date.now()

  // 2. Play feedback chime & provide immediate visual status
  playChime(659.25, 0.12) // Instant earcon chime confirms tap without blocking TTS queue
  onProgress?.(langStrings.describing)

  // 3. Offline check
  if (isOffline()) {
    const elapsed = Date.now() - startTime
    recordMetric({
      mode: 'describe',
      durationMs: elapsed,
      source: 'offline',
      timestamp: new Date().toISOString(),
    })
    speak(langStrings.describeOffline, { interrupt: true, lang })
    return
  }

  if (!video) {
    speak(langStrings.cameraError, { interrupt: true, lang })
    return
  }

  // 4. Capture frame scaled to 480px JPEG for fast transmission & single vision tile processing
  const base64Jpeg = captureFrame(video, 480, 0.6)
  if (!base64Jpeg) {
    speak('Could not capture frame. Try again.', { interrupt: true, lang })
    return
  }

  // 5. Vision Cache check using 16x16 grayscale hash
  const frameHash = await hashFrameGrayscale(base64Jpeg)
  const cached = getCached<DescribeResponse>(frameHash)
  if (cached) {
    const elapsed = Date.now() - startTime
    recordMetric({
      mode: 'describe',
      durationMs: elapsed,
      source: 'cache',
      timestamp: new Date().toISOString(),
    })
    speak(cached.text, { interrupt: true, lang })
    return
  }

  // 6. Online Gemini Vision scene description
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Jpeg,
        task: 'describe',
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

    const data: DescribeResponse = await response.json()
    const elapsed = Date.now() - startTime

    let spokenText = data.text

    // If not confident, prefix honest uncertainty phrase
    if (!data.confident) {
      spokenText = `${langStrings.describeUnsure} ${spokenText}`
    }

    // Cache the spoken description for 60 seconds
    setCached(frameHash, { ...data, text: spokenText })

    recordMetric({
      mode: 'describe',
      durationMs: elapsed,
      source: 'gemini',
      timestamp: new Date().toISOString(),
      details: data.confident ? 'confident' : 'uncertain',
    })

    speak(spokenText, { interrupt: true, lang })
  } catch (err: unknown) {
    console.error('Describe scene request failed:', err)
    const elapsed = Date.now() - startTime
    recordMetric({
      mode: 'describe',
      durationMs: elapsed,
      source: 'gemini',
      timestamp: new Date().toISOString(),
      details: 'error',
    })
    speak(langStrings.networkError, { interrupt: true, lang })
  }
}
