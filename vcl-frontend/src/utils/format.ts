/** Format a decimal as percentage: 0.547 → "54.7%" */
export function formatPct(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '-'
  return `${(value * 100).toFixed(1)}%`
}

/** Format a ratio to 2 decimal places: 1.278 → "1.28" */
export function formatRatio(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '-'
  return value.toFixed(2)
}

/** Format a count (integer): 641 → "641" */
export function formatCount(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '-'
  return String(Math.round(value))
}

/** Format percentage already in 0-100 range: 61.2 → "61.2%" */
export function formatPctRaw(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '-'
  return `${value.toFixed(1)}%`
}

/** Format delta: +5.3% or -2.1% */
export function formatDelta(value: number): string {
  if (value > 0) return `+${(value * 100).toFixed(1)}%`
  return `${(value * 100).toFixed(1)}%`
}
