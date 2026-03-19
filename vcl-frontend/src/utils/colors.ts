/**
 * Returns a CSS background-color string for a stat cell based on how its value
 * compares to the tournament average, using standard deviations.
 *
 * Scale: red (below avg) → neutral (at avg) → green (above avg)
 */
export function heatColor(value: number, mean: number, std: number, invert = false): string {
  if (std === 0 || isNaN(value)) return 'transparent'

  let z = (value - mean) / std
  z = Math.max(-2, Math.min(2, z)) // clamp to ±2 std devs

  if (invert) z = -z

  if (z > 0) {
    // Green scale
    const t = z / 2
    const r = Math.round(42 + t * 48)
    const g = Math.round(90 + t * 48)
    const b = Math.round(42)
    return `rgb(${r}, ${g}, ${b})`
  } else if (z < 0) {
    // Red scale
    const t = Math.abs(z) / 2
    const r = Math.round(90 + t * 16)
    const g = Math.round(48 - t * 16)
    const b = Math.round(48 - t * 16)
    return `rgb(${r}, ${g}, ${b})`
  }
  return '#4a4020' // neutral
}

/** Simple green/red for delta values */
export function deltaColor(value: number): string {
  if (value > 0.01) return 'rgb(90, 138, 42)' // green
  if (value < -0.01) return 'rgb(106, 32, 32)' // red
  return '#4a4020'
}
