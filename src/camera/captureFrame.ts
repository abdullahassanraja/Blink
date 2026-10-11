/**
 * Blink Frame Capture Utility
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 2 Step 2
 *
 * Draws the current video frame to an offscreen canvas,
 * scales so the longest side is at most 1024px,
 * exports JPEG quality 0.7,
 * and returns raw base64 string without data URL prefix.
 */

export interface CaptureFrameOptions {
  cropSquare?: boolean
  cropScale?: number
}

let sharedCanvas: HTMLCanvasElement | null = null

function getCanvas(width: number, height: number): HTMLCanvasElement {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas')
  }
  if (sharedCanvas.width !== width || sharedCanvas.height !== height) {
    sharedCanvas.width = width
    sharedCanvas.height = height
  }
  return sharedCanvas
}

export function captureFrame(
  video: HTMLVideoElement,
  maxDimension = 1024,
  quality = 0.7,
  options?: CaptureFrameOptions
): string | null {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return null
  }

  const origWidth = video.videoWidth
  const origHeight = video.videoHeight

  // Center square crop (1:1) to focus on the central subject without distortion or delay
  if (options?.cropSquare) {
    const minSide = Math.min(origWidth, origHeight)
    const scale = Math.max(0.3, Math.min(1.0, options.cropScale ?? 0.72))
    const cropSide = Math.round(minSide * scale)
    const sx = Math.round((origWidth - cropSide) / 2)
    const sy = Math.round((origHeight - cropSide) / 2)
    const targetSize = Math.min(maxDimension, cropSide)

    const canvas = getCanvas(targetSize, targetSize)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    ctx.drawImage(video, sx, sy, cropSide, cropSide, 0, 0, targetSize, targetSize)

    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    const commaIndex = dataUrl.indexOf(',')
    if (commaIndex === -1) return null

    return dataUrl.slice(commaIndex + 1)
  }

  let targetWidth = origWidth
  let targetHeight = origHeight

  if (origWidth > origHeight) {
    if (origWidth > maxDimension) {
      targetWidth = maxDimension
      targetHeight = Math.round((origHeight * maxDimension) / origWidth)
    }
  } else {
    if (origHeight > maxDimension) {
      targetHeight = maxDimension
      targetWidth = Math.round((origWidth * maxDimension) / origHeight)
    }
  }

  const canvas = getCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.drawImage(video, 0, 0, targetWidth, targetHeight)

  // Export JPEG with specified quality
  const dataUrl = canvas.toDataURL('image/jpeg', quality)

  // Strip 'data:image/jpeg;base64,' prefix to get pure base64
  const commaIndex = dataUrl.indexOf(',')
  if (commaIndex === -1) return null

  return dataUrl.slice(commaIndex + 1)
}
