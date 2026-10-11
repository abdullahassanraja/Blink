/**
 * Blink Speech Recognition & Voice Commands Engine
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 6
 *
 * Wraps SpeechRecognition / webkitSpeechRecognition for push-to-talk
 * and conversational hands-free interaction.
 *
 * Supported commands:
 * - read: Read text, medicine labels, documents
 * - describe: Scene description using Gemini Flash
 * - alert: Obstacle warning system
 * - money: Banknote identifier
 * - stop: Stop active scans or alerts
 * - repeat: Replay the last spoken line
 * - help: List available options
 */

export type VoiceCommand =
  | 'read'
  | 'describe'
  | 'alert'
  | 'money'
  | 'stop'
  | 'repeat'
  | 'help'

export interface CommandMatch {
  command: VoiceCommand
  rawTranscript: string
  confidence: number
}

// English and Urdu keyword mappings
const COMMAND_KEYWORDS_EN: Record<VoiceCommand, string[]> = {
  read: ['read', 'reading', 'text', 'medicine', 'document', 'book', 'label', 'words', 'letter', 'page'],
  describe: ['describe', 'scene', 'look', 'surroundings', 'view', 'picture', 'what is this', 'what is around', 'front of me'],
  alert: ['alert', 'obstacle', 'obstacles', 'walk', 'hazard', 'danger', 'guide', 'detection', 'warning'],
  money: ['money', 'cash', 'rupee', 'rupees', 'note', 'currency', 'bill', 'banknote', 'how much'],
  stop: ['stop', 'cancel', 'pause', 'quit', 'exit', 'shut up', 'quiet', 'silence', 'turn off'],
  repeat: ['repeat', 'again', 'what did you say', 'say again', 'say that again', 'one more time'],
  help: ['help', 'options', 'what can you do', 'commands', 'instructions', 'menu', 'capabilities'],
}

const COMMAND_KEYWORDS_UR: Record<VoiceCommand, string[]> = {
  read: ['پڑھو', 'پڑھیں', 'پڑھنا', 'کتاب', 'دوا', 'تحریر'],
  describe: ['بیان', 'بتاؤ', 'دیکھو', 'کیا ہے', 'منظر'],
  alert: ['الرٹ', 'راستہ', 'رکاوٹ', 'خطرہ', 'وارننگ'],
  money: ['پیسے', 'نوٹ', 'روپے', 'روپیہ', 'کرنسی', 'رقم'],
  stop: ['روکو', 'روکیں', 'بند', 'بس', 'خاموش'],
  repeat: ['دوبارہ', 'پھر', 'دہرائیں', 'کیا کہا'],
  help: ['مدد', 'رہنمائی', 'اختیارات'],
}

// Common filler words to strip
const FILLER_WORDS = new Set([
  'please', 'can', 'you', 'could', 'blink', 'hey', 'hello', 'hi',
  'um', 'uh', 'a', 'an', 'the', 'i', 'want', 'to', 'like', 'just',
  'now', 'app', 'go', 'open', 'start'
])

/**
 * Match a raw spoken transcript to one of the 7 voice commands.
 * Tolerates prefixes, fillers, and conversational phrasing.
 */
export function parseVoiceCommand(transcript: string, lang = 'en'): CommandMatch | null {
  const clean = transcript.toLowerCase().trim().replace(/[.,!?;:]/g, '')
  if (!clean) return null

  const isUrdu = lang.startsWith('ur')
  const keywords = isUrdu ? COMMAND_KEYWORDS_UR : COMMAND_KEYWORDS_EN

  // 1. Direct match with keyword phrases
  for (const [cmd, list] of Object.entries(keywords) as [VoiceCommand, string[]][]) {
    for (const kw of list) {
      if (clean === kw || clean.startsWith(`${kw} `) || clean.endsWith(` ${kw}`) || clean.includes(` ${kw} `)) {
        return {
          command: cmd,
          rawTranscript: transcript,
          confidence: 0.95,
        }
      }
    }
  }

  // 2. Tokenized word check after filtering filler words
  const tokens = clean.split(/\s+/).filter((word) => !FILLER_WORDS.has(word))
  for (const token of tokens) {
    for (const [cmd, list] of Object.entries(keywords) as [VoiceCommand, string[]][]) {
      if (list.includes(token)) {
        return {
          command: cmd,
          rawTranscript: transcript,
          confidence: 0.85,
        }
      }
    }
  }

  return null
}

// Web Speech API interface definitions
interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any
  webkitSpeechRecognition?: any
}

function getSpeechRecognitionClass(): any | null {
  if (typeof window === 'undefined') return null
  const win = window as IWindowWithSpeech
  return win.SpeechRecognition || win.webkitSpeechRecognition || null
}

/** Check if Web Speech recognition is supported in current browser. */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionClass() !== null
}

export interface ListenOptions {
  lang?: string
  continuous?: boolean
  onResult?: (match: CommandMatch | null, rawTranscript: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

type ListenStateListener = (isListening: boolean) => void

let activeRecognition: any | null = null
let isListeningState = false
const stateListeners: Set<ListenStateListener> = new Set()

export function onListeningChange(listener: ListenStateListener): () => void {
  stateListeners.add(listener)
  listener(isListeningState)
  return () => {
    stateListeners.delete(listener)
  }
}

function setListeningState(listening: boolean) {
  isListeningState = listening
  for (const listener of stateListeners) {
    try {
      listener(listening)
    } catch (e) {
      console.error('Listen listener error:', e)
    }
  }
}

/** Check current listening state */
export function isListening(): boolean {
  return isListeningState
}

/**
 * Start listening for a voice command.
 */
export function startListening(options: ListenOptions = {}): boolean {
  const SpeechClass = getSpeechRecognitionClass()
  if (!SpeechClass) {
    options.onError?.('Speech recognition is not supported')
    return false
  }

  // Stop any active session first
  stopListening()

  try {
    const recognition = new SpeechClass()
    recognition.lang = options.lang || 'en-US'
    recognition.continuous = options.continuous ?? false
    recognition.interimResults = false
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      setListeningState(true)
    }

    recognition.onresult = (event: any) => {
      if (!event.results || !event.results[0] || !event.results[0][0]) {
        return
      }
      const rawTranscript = event.results[0][0].transcript || ''
      const match = parseVoiceCommand(rawTranscript, options.lang || 'en')
      options.onResult?.(match, rawTranscript)
    }

    recognition.onerror = (event: any) => {
      // 'no-speech' is normal when user stays silent
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('SpeechRecognition error:', event.error)
      }
      options.onError?.(event.error)
    }

    recognition.onend = () => {
      setListeningState(false)
      activeRecognition = null
      options.onEnd?.()
    }

    activeRecognition = recognition
    recognition.start()
    return true
  } catch (err: unknown) {
    console.warn('Failed to start speech recognition:', err)
    setListeningState(false)
    activeRecognition = null
    options.onError?.(String(err))
    return false
  }
}

/**
 * Stop active speech recognition immediately.
 */
export function stopListening(): void {
  if (activeRecognition) {
    try {
      activeRecognition.abort()
    } catch {
      // Ignore abort errors
    }
    activeRecognition = null
  }
  setListeningState(false)
}
