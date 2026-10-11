/**
 * Blink Frame Capture Utility
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 2 Step 2
 *
 * Draws the current video frame to an offscreen canvas,
 * scales so the longest side is at most 1024px,
 * exports JPEG quality 0.7,
 * and returns raw base64 string without data URL prefix.
 */

export function captureFrame(
  video: HTMLVideoElement,
  maxDimension = 1024,
  quality = 0.7
): string | null {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return null
  }

  const origWidth = video.videoWidth
  const origHeight = video.videoHeight
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

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

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
