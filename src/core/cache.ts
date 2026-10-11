/**
 * Blink Vision Cache
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 2 Step 6
 *
 * Hashes a 16x16 grayscale version of the frame,
 * reuses the result for 60 seconds to preserve free-tier Gemini API quota.
 */

interface CacheEntry<T> {
  value: T
  timestamp: number
}

const CACHE_TTL_MS = 60 * 1000 // 60 seconds
const cache = new Map<string, CacheEntry<unknown>>()

/**
 * Generate a 16x16 grayscale hash string from a base64 JPEG image.
 */
export async function hashFrameGrayscale(base64Jpeg: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 16
      canvas.height = 16
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(`fallback_${base64Jpeg.slice(0, 32)}`)
        return
      }

      ctx.drawImage(img, 0, 0, 16, 16)
      const imgData = ctx.getImageData(0, 0, 16, 16).data

      // Compute average brightness & create bit hash
      let sum = 0
      const grays: number[] = []
      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i]
        const g = imgData[i + 1]
        const b = imgData[i + 2]
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
        grays.push(gray)
        sum += gray
      }

      const avg = sum / grays.length
      let hash = ''
      for (let i = 0; i < grays.length; i++) {
        hash += grays[i] >= avg ? '1' : '0'
      }

      resolve(hash)
    }

    img.onerror = () => {
      resolve(`err_${base64Jpeg.slice(0, 32)}`)
    }

    img.src = `data:image/jpeg;base64,${base64Jpeg}`
  })
}

/**
 * Get cached result if still valid (under 60s).
 */
export function getCached<T>(hash: string): T | null {
  const entry = cache.get(hash) as CacheEntry<T> | undefined
  if (!entry) return null

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(hash)
    return null
  }

  return entry.value
}

/**
 * Store result in cache.
 */
export function setCached<T>(hash: string, value: T): void {
  cache.set(hash, {
    value,
    timestamp: Date.now(),
  })
}

/**
 * Clear expired cache entries.
 */
export function pruneCache(): void {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key)
    }
  }
}
