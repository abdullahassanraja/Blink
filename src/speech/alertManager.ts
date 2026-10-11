/**
 * Obstacle Alert Manager & Anti-Spam Gate
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 4 Step 5 & § 1. Product rules
 *
 * Rules:
 * - Speak short: under 12 words per alert
 * - Key = label + position + bucket
 * - Speak only if the key is new, or the bucket got closer
 * - Global minimum gap: 2.5s (2500ms)
 * - Per-key cooldown: 6.0s (6000ms)
 * - "Very close" and "ahead" interrupts current speech
 * - Sentence format: "Chair, left, close." or "Person ahead, very close."
 * - Optional vibration feedback on "very close"
 */

import { ProcessedObstacle, DistanceBucket } from '../modes/obstacle/logic'
import { speak } from './speak'

const GLOBAL_MIN_GAP_MS = 2500
const PER_KEY_COOLDOWN_MS = 6000

// Bucket proximity rank (higher number = closer)
const BUCKET_RANK: Record<DistanceBucket, number> = {
  near: 1,
  close: 2,
  'very close': 3,
}

class AlertManager {
  private lastSpokenGlobalTime = 0
  private keyHistory = new Map<string, { timestamp: number; rank: number }>()

  /**
   * Evaluates obstacle against anti-spam and urgency criteria.
   * Dispatches speech and vibration if criteria pass.
   */
  processObstacle(obstacle: ProcessedObstacle | null): boolean {
    if (!obstacle) return false

    const now = Date.now()
    const { label, position, bucket } = obstacle
    const key = `${label}_${position}`
    const rank = BUCKET_RANK[bucket]
    const previous = this.keyHistory.get(key)

    // Check if bucket got closer
    const gotCloser = previous ? rank > previous.rank : true

    // Check per-key cooldown
    const isPerKeyCooledDown = previous ? now - previous.timestamp >= PER_KEY_COOLDOWN_MS : true

    // Check global gap
    const isGlobalGapSatisfied = now - this.lastSpokenGlobalTime >= GLOBAL_MIN_GAP_MS

    // Speak only if: (it got closer) OR (per-key cooled down AND global gap satisfied)
    const canSpeak = gotCloser || (isPerKeyCooledDown && isGlobalGapSatisfied)

    if (!canSpeak) {
      return false
    }

    // Determine urgency: "very close" and "ahead" interrupts current speech
    const isUrgent = bucket === 'very close' && position === 'ahead'

    // Format concise spoken sentence (under 12 words)
    // Examples: "Chair, left, close." or "Person ahead, very close."
    const sentence = position === 'ahead'
      ? `${label} ahead, ${bucket}.`
      : `${label}, ${position}, ${bucket}.`

    // Update history
    this.keyHistory.set(key, { timestamp: now, rank })
    this.lastSpokenGlobalTime = now

    // Optional haptic vibration for immediate hazard on supported Android devices
    if (bucket === 'very close' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 100])
      } catch (e) {
        // Haptic blocked or unsupported
      }
    }

    speak(sentence, { interrupt: isUrgent })
    return true
  }

  /**
   * Resets alert history when stopping alert mode.
   */
  reset(): void {
    this.keyHistory.clear()
    this.lastSpokenGlobalTime = 0
  }
}

export const alertManager = new AlertManager()
