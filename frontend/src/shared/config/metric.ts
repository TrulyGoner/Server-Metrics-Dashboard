export const MAX_HISTORY_POINTS = 30
export const CPU_ALERT_THRESHOLD = 90
export const CPU_ALERT_DURATION_MS = 10_000
export const WS_RECONNECT_DELAY_MS = 3_000

export function getMetricStatusColor(value: number): string {
  if (value < 60) return '#22c55e'
  if (value <= 85) return '#eab308'
  return '#ef4444'
}
