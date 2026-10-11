/**
 * Blink Speech Synthesis Engine
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 1 & § 1. Product rules
 *
 * Capabilities:
 * - Queue management with instant interrupt option
 * - Auto voice selection matching language ('en' | 'ur')
 * - iOS / Safari audio unlock on first user interaction
 * - Reactive listener support for live caption updates
 */

export interface SpeakOptions {
  interrupt?: boolean
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
}

type CaptionListener = (caption: string, isSpeaking: boolean) => void

// Active state
let synth: SpeechSynthesis | null = null
let isUnlocked = false
let currentCaption = ''
let isCurrentlySpeaking = false
const captionListeners: Set<CaptionListener> = new Set()

// Initialize synth safely (browser environment check)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  synth = window.speechSynthesis
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {
      // Refresh voice list
    }
  }
}

/** Subscribe to caption changes */
export function onCaptionChange(listener: CaptionListener): () => void {
  captionListeners.add(listener)
  listener(currentCaption, isCurrentlySpeaking)
  return () => {
    captionListeners.delete(listener)
  }
}

function notifyListeners(text: string, speaking: boolean) {
  currentCaption = text
  isCurrentlySpeaking = speaking
  for (const listener of captionListeners) {
    try {
      listener(text, speaking)
    } catch (e) {
      console.error('Caption listener error:', e)
    }
  }
}

/**
 * Mobile browsers (especially iOS Safari) require an initial speech invocation
 * during a direct user gesture before asynchronous TTS can play.
 */
export function unlockSpeech(): void {
  if (isUnlocked || !synth) return

  try {
    const silent = new SpeechSynthesisUtterance(' ')
    silent.volume = 0.01
    silent.rate = 2.0
    synth.speak(silent)
    isUnlocked = true
  } catch (err) {
    console.warn('Speech unlock attempt failed:', err)
  }
}

/**
 * Pick best voice matching given language code.
 */
export function pickVoice(langCode = 'en'): SpeechSynthesisVoice | null {
  if (!synth) return null

  const voices = synth.getVoices()
  if (!voices.length) return null

  const target = langCode.toLowerCase()
  // Match prefix e.g. 'en-US', 'en-GB', 'ur-PK'
  const match = voices.find(
    (v) => v.lang.toLowerCase().startsWith(target) || v.lang.toLowerCase().replace('_', '-').startsWith(target)
  )

  return match || voices.find((v) => v.default) || voices[0] || null
}

/**
 * Speak the provided text.
 */
export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  const { interrupt = false, lang = 'en', rate = 1.0, pitch = 1.0, volume = 1.0 } = options

  if (!synth || !text.trim()) {
    notifyListeners(text, false)
    return Promise.resolve()
  }

  // If interrupt requested, cancel pending and active utterances
  if (interrupt) {
    synth.cancel()
  }

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume
    utterance.lang = lang

    // Resolve voice
    const voice = pickVoice(lang)
    if (voice) {
      utterance.voice = voice
    }

    utterance.onstart = () => {
      notifyListeners(text, true)
    }

    utterance.onend = () => {
      notifyListeners(text, false)
      resolve()
    }

    utterance.onerror = (event) => {
      // 'interrupted' or 'canceled' are expected when user taps rapidly
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.warn('Speech synthesis error:', event.error)
      }
      notifyListeners(text, false)
      resolve()
    }

    synth.speak(utterance)
  })
}

/**
 * Stop any active and queued speech immediately.
 */
export function stopSpeaking(): void {
  if (!synth) return
  synth.cancel()
  notifyListeners(currentCaption, false)
}

/**
 * Get current caption text.
 */
export function getCurrentCaption(): string {
  return currentCaption
}
