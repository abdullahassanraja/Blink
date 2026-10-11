/**
 * Blink Money Identifier API Client
 * Interacts with the deployed FastAPI / Docker inference service on Render.
 */

import { MoneyPrediction } from './confidence'

export function getMoneyServiceUrl(): string {
  const envUrl = import.meta.env.VITE_MONEY_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '')
  }
  // Default to Render deployment
  return 'https://blink-ok3b.onrender.com'
}

/**
 * Checks service health. If the request takes longer than 3 seconds (e.g. cold start),
 * calls onSlow to notify the user ("Getting ready.").
 * Times out after 60 seconds.
 */
export async function checkHealth(options?: {
  signal?: AbortSignal
  onSlow?: () => void
  timeoutMs?: number
}): Promise<boolean> {
  const baseUrl = getMoneyServiceUrl()
  const timeoutMs = options?.timeoutMs ?? 60000
  const controller = new AbortController()

  // Link external abort signal if provided
  if (options?.signal) {
    options.signal.addEventListener('abort', () => controller.abort())
  }

  // 60-second total timeout
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  // 3-second timer for cold start notification
  const slowTimerId = setTimeout(() => {
    if (options?.onSlow) {
      options.onSlow()
    }
  }, 3000)

  try {
    const res = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(slowTimerId)
    clearTimeout(timeoutId)

    if (!res.ok) {
      return false
    }

    const data = await res.json()
    return data.status === 'ok'
  } catch (err) {
    clearTimeout(slowTimerId)
    clearTimeout(timeoutId)
    console.warn('Money health check failed:', err)
    return false
  }
}

/**
 * Sends a single JPEG frame to /predict and returns grouped scores.
 */
export async function predictFrame(
  imageBlob: Blob,
  signal?: AbortSignal
): Promise<MoneyPrediction> {
  const baseUrl = getMoneyServiceUrl()
  const formData = new FormData()
  formData.append('file', imageBlob, 'frame.jpg')

  const res = await fetch(`${baseUrl}/predict`, {
    method: 'POST',
    body: formData,
    signal,
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`)
  }

  const data = await res.json()
  return {
    scores: data.scores || {},
    top: data.top || 'others',
    top_p: typeof data.top_p === 'number' ? data.top_p : 0,
    second_p: typeof data.second_p === 'number' ? data.second_p : 0,
    latency_ms: typeof data.latency_ms === 'number' ? data.latency_ms : 0,
  }
}
