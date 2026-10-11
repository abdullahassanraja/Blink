/**
 * Blink Camera Hook
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 1
 *
 * Requests the rear/environment camera with standard mobile constraints.
 * Exposes videoRef, camera status ('idle' | 'ready' | 'denied' | 'error'), start(), stop().
 * Stops all tracks cleanly on unmount.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { speak } from '../speech/speak'
import { strings } from '../config/strings'

export type CameraStatus = 'idle' | 'ready' | 'denied' | 'error'

export interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement>
  status: CameraStatus
  errorMessage: string | null
  start: () => Promise<boolean>
  stop: () => void
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch (e) {
          console.warn('Track stop error:', e)
        }
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setStatus('idle')
  }, [])

  const start = useCallback(async (): Promise<boolean> => {
    // If stream already exists, reconnect to video element and ensure playback
    if (streamRef.current) {
      if (videoRef.current) {
        if (videoRef.current.srcObject !== streamRef.current) {
          videoRef.current.srcObject = streamRef.current
        }
        videoRef.current.setAttribute('playsinline', 'true')
        try {
          await videoRef.current.play()
        } catch (playErr) {
          console.warn('Video play deferred or interrupted:', playErr)
        }
      }
      setStatus('ready')
      setErrorMessage(null)
      return true
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = strings.en.cameraError
      setStatus('error')
      setErrorMessage(msg)
      speak(msg, { interrupt: true })
      return false
    }

    try {
      // First try rear camera, then fallback to any video
      let mediaStream: MediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch (err) {
        // Fallback without specific constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      streamRef.current = mediaStream

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        // Needed for iOS Safari
        videoRef.current.setAttribute('playsinline', 'true')
        try {
          await videoRef.current.play()
        } catch (playErr) {
          console.warn('Video play deferred or interrupted:', playErr)
        }
      }

      setStatus('ready')
      setErrorMessage(null)
      return true
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string }
      console.error('Camera access error:', error)

      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError' ||
        error.name === 'SecurityError'
      ) {
        setStatus('denied')
        const msg = strings.en.cameraDenied
        setErrorMessage(msg)
        speak(msg, { interrupt: true })
      } else {
        setStatus('error')
        const msg = strings.en.cameraError
        setErrorMessage(msg)
        speak(msg, { interrupt: true })
      }
      return false
    }
  }, [status])

  // Stop camera tracks cleanly on component unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    videoRef,
    status,
    errorMessage,
    start,
    stop,
  }
}
