/**
 * On-Device MediaPipe Obstacle Detector
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 4 Steps 2 - 4, 7
 *
 * Runs EfficientDet-Lite0 locally via WebAssembly with zero internet dependency.
 * Loops at 8-10 fps using requestAnimationFrame and detectForVideo.
 */

import { FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision'
import { selectPrimaryObstacle, ProcessedObstacle } from './logic'
import { alertManager } from '../../speech/alertManager'
import { recordMetric } from '../../core/metrics'

export interface DetectorStats {
  fps: number
  avgLatencyMs: number
  delegate: 'GPU' | 'CPU'
  active: boolean
  lastObstacle: ProcessedObstacle | null
}

let detectorInstance: ObjectDetector | null = null
let isInitializing = false
let isRunning = false
let animFrameId: number | null = null
let activeDelegate: 'GPU' | 'CPU' = 'GPU'

// Frame rate throttling (8 to 10 fps -> ~110ms interval)
const TARGET_FRAME_INTERVAL_MS = 110
let lastFrameTime = 0

// Performance tracking
let frameCount = 0
let lastFpsUpdateTime = 0
let currentFps = 0
let latencySum = 0
let latencyCount = 0
let currentAvgLatency = 0
let lastDetectedObstacle: ProcessedObstacle | null = null

type StatsListener = (stats: DetectorStats) => void
const statsListeners: Set<StatsListener> = new Set()

export function subscribeDetectorStats(listener: StatsListener): () => void {
  statsListeners.add(listener)
  return () => statsListeners.delete(listener)
}

function notifyStats(): void {
  const stats: DetectorStats = {
    fps: currentFps,
    avgLatencyMs: currentAvgLatency,
    delegate: activeDelegate,
    active: isRunning,
    lastObstacle: lastDetectedObstacle,
  }
  statsListeners.forEach((fn) => fn(stats))
}

/**
 * Lazy loads MediaPipe ObjectDetector with GPU delegate and CPU fallback.
 */
export async function getDetector(): Promise<ObjectDetector> {
  if (detectorInstance) return detectorInstance
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 50))
    }
    if (detectorInstance) return detectorInstance
  }

  isInitializing = true
  try {
    // Load wasm bundle offline from public/mediapipe/wasm
    const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')

    // Try GPU acceleration first
    try {
      detectorInstance = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/efficientdet_lite0.tflite',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        scoreThreshold: 0.5,
        maxResults: 5,
      })
      activeDelegate = 'GPU'
    } catch (gpuError) {
      console.warn('GPU delegate failed, falling back to CPU:', gpuError)
      detectorInstance = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/efficientdet_lite0.tflite',
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        scoreThreshold: 0.5,
        maxResults: 5,
      })
      activeDelegate = 'CPU'
    }

    return detectorInstance
  } finally {
    isInitializing = false
  }
}

/**
 * Starts real-time obstacle detection loop on the live camera video element.
 */
export async function startObstacleDetection(video: HTMLVideoElement): Promise<void> {
  if (isRunning) return
  isRunning = true
  alertManager.reset()

  const detector = await getDetector()
  lastFpsUpdateTime = performance.now()
  frameCount = 0
  latencySum = 0
  latencyCount = 0

  const loop = () => {
    if (!isRunning) return

    const now = performance.now()

    // Enforce 8 - 10 FPS detection rate
    if (now - lastFrameTime >= TARGET_FRAME_INTERVAL_MS) {
      lastFrameTime = now

      if (video && video.readyState >= 2 && video.videoWidth && video.videoHeight) {
        const detectStart = performance.now()

        try {
          const result = detector.detectForVideo(video, now)
          const detectDuration = performance.now() - detectStart

          // Track latency and fps
          latencySum += detectDuration
          latencyCount++
          frameCount++

          // Process spatial logic and speak alerts
          const obstacle = selectPrimaryObstacle(
            result.detections,
            video.videoWidth,
            video.videoHeight
          )
          lastDetectedObstacle = obstacle

          if (obstacle) {
            alertManager.processObstacle(obstacle)
          }

          // Update FPS & average latency every second
          if (now - lastFpsUpdateTime >= 1000) {
            currentFps = Math.round((frameCount * 1000) / (now - lastFpsUpdateTime))
            currentAvgLatency = Math.round(latencySum / (latencyCount || 1))

            recordMetric({
              mode: 'alert',
              durationMs: currentAvgLatency,
              source: 'offline',
              timestamp: new Date().toISOString(),
              details: `FPS: ${currentFps}, Delegate: ${activeDelegate}`,
            })

            frameCount = 0
            latencySum = 0
            latencyCount = 0
            lastFpsUpdateTime = now
          }

          notifyStats()
        } catch (err) {
          console.error('Obstacle detection error:', err)
        }
      }
    }

    animFrameId = requestAnimationFrame(loop)
  }

  animFrameId = requestAnimationFrame(loop)
}

/**
 * Stops obstacle detection and cancels scheduled frames.
 */
export function stopObstacleDetection(): void {
  isRunning = false
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
  alertManager.reset()
  lastDetectedObstacle = null
  notifyStats()
}

export function isObstacleDetectionActive(): boolean {
  return isRunning
}
