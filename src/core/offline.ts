/**
 * Blink Offline OCR Fallback Engine
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 2 Step 5
 *
 * Lazy loads Tesseract.js only when needed (offline, rate limit, or network failure),
 * extracts basic text, and cleans up worker resources.
 */

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

export function cleanOCRText(raw: string): string {
  if (!raw) return ''

  // Split lines and strip non-standard noise
  const lines = raw.split(/\r?\n/)
  const cleanedLines: string[] = []

  for (const line of lines) {
    const trimmed = line
      .replace(/[^\w\s.,?!'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Retain meaningful words (at least 2 letters or a number)
    if (trimmed.length >= 2 && /[a-zA-Z0-9]/.test(trimmed)) {
      cleanedLines.push(trimmed)
    }
  }

  const combined = cleanedLines
    .join('. ')
    .replace(/\s*([.,?!])\s*/g, '$1 ')
    .replace(/([.,?!]){2,}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  if (!combined) return ''

  // Keep under 25 words per product rules
  const words = combined.split(' ')
  if (words.length > 25) {
    return words.slice(0, 25).join(' ') + '.'
  }
  return combined
}

export async function runOfflineOCR(base64Jpeg: string): Promise<string | null> {
  try {
    // Dynamic import to keep initial bundle size lean
    const { createWorker } = await import('tesseract.js')
    
    // Load 100% locally from public/tesseract so airplane mode works offline
    const worker = await createWorker('eng', 1, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/core',
      langPath: '/tesseract/lang',
      gzip: true,
    })

    const dataUrl = `data:image/jpeg;base64,${base64Jpeg}`
    const ret = await worker.recognize(dataUrl)
    await worker.terminate()

    const rawText = ret.data.text.trim()
    const cleaned = cleanOCRText(rawText)
    return cleaned || null
  } catch (err) {
    console.error('Offline OCR failed:', err)
    return null
  }
}
