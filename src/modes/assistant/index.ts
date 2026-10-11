/**
 * Blink Multimodal Voice LLM Assistant
 *
 * Allows the user to ask ANY question using natural voice about what the camera sees:
 * "What am I holding?", "What color is this?", "Where is my cup?", "What's in front of me?"
 *
 * Captures the current camera frame, queries Gemini Flash via the serverless proxy,
 * and speaks the answer in concise, natural speech.
 */

import { captureFrame } from '../../camera/captureFrame'
import { isOffline } from '../../core/offline'
import { recordMetric } from '../../core/metrics'
import { speak } from '../../speech/speak'
import { playChime } from '../../speech/sound'
import { getStrings } from '../../config/strings'

export interface AskAssistantOptions {
  lang?: 'en' | 'ur'
  onStatusChange?: (status: string) => void
}

export interface AssistantResponse {
  text: string
  confident: boolean
}

export async function askAssistant(
  video: HTMLVideoElement | null,
  query: string,
  options: AskAssistantOptions = {}
): Promise<{ ok: boolean; text: string }> {
  const lang = options.lang ?? 'en'
  const strings = getStrings(lang)
  const startTime = Date.now()

  if (isOffline()) {
    const offlineMsg = lang === 'ur'
      ? 'اسسٹنٹ کے لیے انٹرنیٹ ضروری ہے۔'
      : 'Voice assistant needs internet right now. Try Read or Alert.'
    speak(offlineMsg, { interrupt: true, lang })
    return { ok: false, text: offlineMsg }
  }

  if (!video) {
    speak(strings.cameraError, { interrupt: true, lang })
    return { ok: false, text: strings.cameraError }
  }

  // Visual & audio feedback: D5 chime + spoken cue
  playChime(587.33, 0.12)
  options.onStatusChange?.('Thinking...')
  speak(lang === 'ur' ? 'دیکھ رہا ہوں...' : 'Checking...', { interrupt: true, lang })

  // Capture crisp 640px JPEG frame
  const base64Jpeg = captureFrame(video, 640, 0.75)
  if (!base64Jpeg) {
    const errorMsg = 'Could not capture frame. Try again.'
    speak(errorMsg, { interrupt: true, lang })
    return { ok: false, text: errorMsg }
  }

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Jpeg,
        task: 'ask',
        prompt: query,
        lang,
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        speak(strings.rateLimited, { interrupt: true, lang })
        return { ok: false, text: strings.rateLimited }
      }
      throw new Error(`HTTP ${response.status}`)
    }

    const data: AssistantResponse = await response.json()
    const elapsed = Date.now() - startTime

    recordMetric({
      mode: 'assistant',
      durationMs: elapsed,
      source: 'gemini',
      timestamp: new Date().toISOString(),
      details: query.slice(0, 40),
    })

    options.onStatusChange?.(data.text)
    await speak(data.text, { interrupt: true, lang })

    return { ok: true, text: data.text }
  } catch (err) {
    console.warn('Voice assistant query failed:', err)
    const fallbackMsg = lang === 'ur'
      ? 'معذرت، ابھی جواب نہیں مل سکا۔ دوبارہ کوشش کریں۔'
      : 'Could not check that right now. Please try again.'
    speak(fallbackMsg, { interrupt: true, lang })
    return { ok: false, text: fallbackMsg }
  }
}
