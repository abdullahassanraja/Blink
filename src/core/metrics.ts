/**
 * Blink Performance Metrics Logger
 * Ref: GEMINI_BUILD_GUIDE.md § Feature 2 Step 7
 *
 * Tracks latency from user tap to first spoken word across modes.
 * Logs timing data used for hackathon write-up and evaluation.
 */

export interface MetricEvent {
  mode: 'read' | 'describe' | 'alert' | 'money'
  durationMs: number
  source: 'gemini' | 'cache' | 'ocr_fallback' | 'offline'
  timestamp: string
  details?: string
}

const metricsLog: MetricEvent[] = []

export function recordMetric(event: MetricEvent): void {
  metricsLog.push(event)
  console.log(
    `[Blink Metric] ${event.mode.toUpperCase()} completed in ${event.durationMs}ms (${event.source})`
  )
}

export function getMetrics(): MetricEvent[] {
  return [...metricsLog]
}

export function getAverageLatency(mode?: MetricEvent['mode']): number {
  const filtered = mode ? metricsLog.filter((m) => m.mode === mode) : metricsLog
  if (!filtered.length) return 0
  const total = filtered.reduce((acc, m) => acc + m.durationMs, 0)
  return Math.round(total / filtered.length)
}
