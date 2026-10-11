/**
 * Serverless Gemini Vision Proxy (Vercel Serverless Function)
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 2 & § 0. Agent operating rules (Rule 7)
 *
 * Capabilities:
 * - Direct REST call to Gemini generateContent with Flash model
 * - JSON structured response schema
 * - Base64 image payload check (< 1.5MB)
 * - Rate limiting per client IP
 * - Zero image logging/storage for strict user privacy
 */

export interface GeminiProxyRequest {
  image: string // base64 JPEG without data URL prefix
  task: 'read' | 'describe'
  lang?: 'en' | 'ur'
}

export interface ReadResponse {
  text: string
  type: 'medicine' | 'sign' | 'menu' | 'other'
  legible: boolean
}

export interface DescribeResponse {
  text: string
  confident: boolean
}

// In-memory rate limiting map: ip -> timestamps
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30 // generous for hackathon testing

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []
  const activeTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true
  }

  activeTimestamps.push(now)
  rateLimitMap.set(ip, activeTimestamps)
  return false
}

export async function handleGeminiRequest(body: GeminiProxyRequest, clientIp = '127.0.0.1') {
  if (isRateLimited(clientIp)) {
    return { status: 429, data: { error: 'rate_limited', message: 'Too many requests. Please wait a moment.' } }
  }

  const { image, task = 'read', lang = 'en' } = body

  if (!image || typeof image !== 'string') {
    return { status: 400, data: { error: 'invalid_image', message: 'Image base64 data is required.' } }
  }

  // Reject images over ~1.5 MB in base64 length (~2,000,000 chars)
  if (image.length > 2_100_000) {
    return { status: 413, data: { error: 'image_too_large', message: 'Image is too large. Must be under 1.5 MB.' } }
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
  let modelName = process.env.GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || 'gemini-3.8-flash'
  if (!modelName || modelName === 'gemini-1.5-flash' || modelName.includes('1.5')) {
    modelName = 'gemini-3.8-flash'
  }

  if (!apiKey) {
    return { status: 500, data: { error: 'missing_api_key', message: 'Gemini API key is not configured.' } }
  }

  const isUrdu = lang === 'ur'

  // Prompts as specified in the guide
  let systemInstruction = ''
  let responseSchema: Record<string, unknown> = {}

  if (task === 'read') {
    systemInstruction = isUrdu
      ? `You help a blind person who speaks Urdu. Read the main text in this image aloud-ready in Urdu.
If it is a medicine package: say the medicine name first, then strength, then directions only if clearly visible. Never advise dosage.
If the text is not readable, set legible=false.
Return JSON: {"text": string, "type": "medicine"|"sign"|"menu"|"other", "legible": boolean}
Keep text under 40 words. Plain spoken sentences without em dashes.`
      : `You help a blind person. Read the main text in this image aloud-ready in English.
If it is a medicine package: say the medicine name first, then strength, then directions only if clearly visible. Never advise dosage.
If the text is not readable, set legible=false.
Return JSON: {"text": string, "type": "medicine"|"sign"|"menu"|"other", "legible": boolean}
Keep text under 40 words. Plain spoken sentences without em dashes.`

    responseSchema = {
      type: 'OBJECT',
      properties: {
        text: { type: 'STRING' },
        type: { type: 'STRING', enum: ['medicine', 'sign', 'menu', 'other'] },
        legible: { type: 'BOOLEAN' },
      },
      required: ['text', 'type', 'legible'],
    }
  } else {
    // Describe task
    systemInstruction = isUrdu
      ? `You help a blind person who speaks Urdu. Describe the scene in at most 2 short sentences in Urdu, under 25 words total. Mention people and hazards first, then the main objects, left to right. Do not guess. If unclear, set confident=false. Return JSON: {"text": string, "confident": boolean}. No em dashes.`
      : `You help a blind person. Describe the scene in at most 2 short sentences, under 25 words total. Mention people and hazards first, then the main objects, left to right. Do not guess. If unclear, set confident=false. Return JSON: {"text": string, "confident": boolean}. No em dashes.`

    responseSchema = {
      type: 'OBJECT',
      properties: {
        text: { type: 'STRING' },
        confident: { type: 'BOOLEAN' },
      },
      required: ['text', 'confident'],
    }
  }

  // Candidate models ordered for reliability, quota stability, and speed
  const candidateModels = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.7-flash',
    'gemini-3.5-flash-lite',
    modelName,
  ].filter((v, idx, arr) => arr.indexOf(v) === idx)

  const payload = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: task === 'describe' ? 60 : 90,
      responseMimeType: 'application/json',
      responseSchema,
    },
  }

  let lastStatus = 500
  let lastErrorText = ''

  for (const currentModel of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8s realistic mobile timeout

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        lastStatus = response.status
        lastErrorText = await response.text()
        console.warn(`Gemini API HTTP ${response.status} on model ${currentModel}`)
        // If 503 (demand spike) or 429 (rate limit quota), immediately failover to next model
        if (response.status === 503 || response.status === 429) {
          continue
        }
        return {
          status: response.status,
          data: { error: 'gemini_error', message: `Gemini API returned status ${response.status}` },
        }
      }

      const result = await response.json()
      const contentText = result?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!contentText) {
        return {
          status: 500,
          data: { error: 'empty_response', message: 'No content received from Gemini.' },
        }
      }

      const parsed = JSON.parse(contentText)
      return { status: 200, data: parsed }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`Gemini fetch exception on model ${currentModel}:`, message)
      lastErrorText = message
    }
  }

  return {
    status: lastStatus,
    data: { error: 'gemini_error', message: `Gemini API unavailable: ${lastErrorText}` },
  }
}

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed', message: 'Only POST is supported.' })
  }

  const clientIp =
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1'

  const { status, data } = await handleGeminiRequest(req.body, clientIp)
  return res.status(status).json(data)
}
