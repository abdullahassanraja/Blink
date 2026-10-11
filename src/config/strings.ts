/**
 * All user-facing and spoken strings for Blink.
 * Structure supports English (en) and Urdu (ur) for Feature 7.
 * Rules: under 12 words for alerts, under 25 words for descriptions.
 * No em dashes. Plain spoken sentences only.
 */

export type Lang = 'en' | 'ur'

export interface StringSet {
  // App
  tagline: string
  howItWorks: string
  privacy: string
  startButton: string

  // Pills on welcome screen
  voiceOn: string
  languageLabel: string

  // Modes
  modeRead: string
  modeDescribe: string
  modeAlert: string
  modeMoney: string

  // Speech: greeting
  greeting: string

  // Speech: camera
  cameraReady: string
  cameraDenied: string
  cameraError: string

  // Speech: read mode
  reading: string
  readOffline: string
  readUnlegible: string
  readMedicineWarning: string

  // Speech: describe mode
  describing: string
  describeOffline: string
  describeUnsure: string

  // Speech: alert mode
  alertOn: string
  alertOff: string
  alertTooDark: string

  // Speech: money mode
  moneyScanning: string
  moneyNotSure: string
  moneyNoNote: string

  // Speech: voice commands
  helpText: string
  commandNotUnderstood: string

  // Speech: errors
  rateLimited: string
  networkError: string

  // Modes screen
  modesTitle: string
  modesSubtitle: string
  worksOffline: string

  // Settings
  settingsTitle: string
  speechRate: string
  vibration: string

  // Status
  statusReady: string
  statusOffline: string
  statusExperimental: string
}

export const strings: Record<Lang, StringSet> = {
  en: {
    // App
    tagline: 'One tap. One sentence.',
    howItWorks: 'How it works',
    privacy: 'We do not save your images. Photos are processed in real time.',
    startButton: 'Start',

    // Pills on welcome screen
    voiceOn: 'Voice on',
    languageLabel: 'English',

    // Modes
    modeRead: 'Read',
    modeDescribe: 'Describe',
    modeAlert: 'Alert',
    modeMoney: 'Money',

    // Speech: greeting
    greeting: 'Welcome to Blink. Tap any button to begin.',

    // Speech: camera
    cameraReady: 'Camera is ready.',
    cameraDenied: 'Camera access was denied. Please allow camera in your browser settings.',
    cameraError: 'Camera could not start. Check your browser settings.',

    // Speech: read mode
    reading: 'Reading...',
    readOffline: 'Offline. Basic reading.',
    readUnlegible: 'I could not read that. Hold it closer, flat, and in light.',
    readMedicineWarning: 'Please confirm with a person before taking it.',

    // Speech: describe mode
    describing: 'Describing...',
    describeOffline: 'Scene description needs internet. Try Read or Alert.',
    describeUnsure: 'I am not sure, but',

    // Speech: alert mode
    alertOn: 'Obstacle alert on.',
    alertOff: 'Alert stopped.',
    alertTooDark: 'It is too dark. Turn on a light.',

    // Speech: money mode
    moneyScanning: 'Scanning note...',
    moneyNotSure: 'I am not sure. Hold the note flat and closer.',
    moneyNoNote: 'I do not see a note.',

    // Speech: voice commands
    helpText: 'Say read, describe, alert, money, stop, repeat, or help.',
    commandNotUnderstood: 'I did not catch that. Try again.',

    // Speech: errors
    rateLimited: 'Too many requests. Please wait a moment.',
    networkError: 'Could not connect. Check your internet.',

    // Modes screen
    modesTitle: 'Modes',
    modesSubtitle: 'What Blink can do',
    worksOffline: 'Works offline',

    // Settings
    settingsTitle: 'Settings',
    speechRate: 'Speech rate',
    vibration: 'Vibration',

    // Status
    statusReady: 'Ready',
    statusOffline: 'Offline',
    statusExperimental: 'Experimental',
  },

  ur: {
    // App
    tagline: 'ایک ٹیپ۔ ایک جملہ۔',
    howItWorks: 'یہ کیسے کام کرتا ہے',
    privacy: 'تصاویر Gemini کو بھیجی جاتی ہیں۔ محفوظ نہیں کی جاتیں۔',
    startButton: 'شروع کریں',

    // Pills on welcome screen
    voiceOn: 'آواز آن',
    languageLabel: 'اردو',

    // Modes
    modeRead: 'پڑھیں',
    modeDescribe: 'بیان کریں',
    modeAlert: 'الرٹ',
    modeMoney: 'پیسے',

    // Speech: greeting
    greeting: 'Blink میں خوش آمدید۔ شروع کرنے کے لیے کوئی بھی بٹن دبائیں۔',

    // Speech: camera
    cameraReady: 'کیمرہ تیار ہے۔',
    cameraDenied: 'کیمرے تک رسائی نہیں ملی۔ براہ کرم ترتیبات میں اجازت دیں۔',
    cameraError: 'کیمرہ شروع نہ ہو سکا۔',

    // Speech: read mode
    reading: 'پڑھ رہا ہوں...',
    readOffline: 'آف لائن۔ بنیادی پڑھائی۔',
    readUnlegible: 'میں یہ نہ پڑھ سکا۔ اسے قریب، سیدھا اور روشنی میں رکھیں۔',
    readMedicineWarning: 'لینے سے پہلے کسی سے تصدیق کریں۔',

    // Speech: describe mode
    describing: 'بیان کر رہا ہوں...',
    describeOffline: 'منظر بیان کرنے کے لیے انٹرنیٹ ضروری ہے۔',
    describeUnsure: 'مجھے یقین نہیں، لیکن',

    // Speech: alert mode
    alertOn: 'رکاوٹ الرٹ آن۔',
    alertOff: 'الرٹ بند۔',
    alertTooDark: 'بہت اندھیرا ہے۔ روشنی کریں۔',

    // Speech: money mode
    moneyScanning: 'نوٹ اسکین ہو رہا ہے...',
    moneyNotSure: 'مجھے یقین نہیں۔ نوٹ کو سیدھا اور قریب رکھیں۔',
    moneyNoNote: 'مجھے کوئی نوٹ نظر نہیں آ رہا۔',

    // Speech: voice commands
    helpText: 'پڑھیں، بیان کریں، الرٹ، پیسے، رکیں، دہرائیں، یا مدد کہیں۔',
    commandNotUnderstood: 'سمجھ نہ آیا۔ دوبارہ کوشش کریں۔',

    // Speech: errors
    rateLimited: 'بہت زیادہ درخواستیں۔ تھوڑا انتظار کریں۔',
    networkError: 'جڑ نہ سکا۔ انٹرنیٹ چیک کریں۔',

    // Modes screen
    modesTitle: 'طریقے',
    modesSubtitle: 'Blink کیا کر سکتا ہے',
    worksOffline: 'آف لائن کام کرتا ہے',

    // Settings
    settingsTitle: 'ترتیبات',
    speechRate: 'بولنے کی رفتار',
    vibration: 'وائبریشن',

    // Status
    statusReady: 'تیار',
    statusOffline: 'آف لائن',
    statusExperimental: 'تجرباتی',
  },
}

/** Get strings for a given language, falling back to English. */
export function getStrings(lang: Lang = 'en'): StringSet {
  return strings[lang] ?? strings.en
}
