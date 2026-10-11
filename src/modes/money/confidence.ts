/**
 * Blink Money Identifier Confidence Decision Engine
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 5 & Part B requirements
 *
 * Decision rules:
 * - top_p >= 0.85
 * - top_p - second_p >= 0.20
 * - Same top group wins 3 frames in a row
 */

export interface MoneyPrediction {
  scores: Record<string, number>
  top: string
  top_p: number
  second_p: number
  latency_ms: number
}

export interface DecisionResult {
  isDecided: boolean
  group: string | null
  consecutiveWins: number
  reason: string
}

export class MoneyConfidenceTracker {
  private history: MoneyPrediction[] = []
  private currentGroup: string | null = null
  private consecutiveCount = 0

  /**
   * Reset tracker state for a fresh scanning session.
   */
  public reset(): void {
    this.history = []
    this.currentGroup = null
    this.consecutiveCount = 0
  }

  /**
   * Add a new frame prediction and evaluate confidence rules.
   */
  public addFrame(pred: MoneyPrediction): DecisionResult {
    this.history.push(pred)

    const meetsThreshold = pred.top_p >= 0.85 && pred.top_p - pred.second_p >= 0.20

    if (meetsThreshold) {
      if (this.currentGroup === pred.top) {
        this.consecutiveCount += 1
      } else {
        this.currentGroup = pred.top
        this.consecutiveCount = 1
      }
    } else {
      // Threshold not met resets consecutive count
      this.currentGroup = null
      this.consecutiveCount = 0
    }

    if (this.consecutiveCount >= 3 && this.currentGroup) {
      return {
        isDecided: true,
        group: this.currentGroup,
        consecutiveWins: this.consecutiveCount,
        reason: `Confidence passed: 3 consecutive frames with top_p >= 0.85 and margin >= 0.20 for ${this.currentGroup}`,
      }
    }

    return {
      isDecided: false,
      group: null,
      consecutiveWins: this.consecutiveCount,
      reason: `Frame ${this.history.length}: top=${pred.top} (${pred.top_p.toFixed(2)}), margin=${(pred.top_p - pred.second_p).toFixed(2)}, consecutive=${this.consecutiveCount}`,
    }
  }

  public getHistory(): MoneyPrediction[] {
    return [...this.history]
  }

  public getFrameCount(): number {
    return this.history.length
  }
}
