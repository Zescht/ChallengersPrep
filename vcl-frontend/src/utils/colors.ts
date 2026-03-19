/**
 * Returns a CSS background-color string for a stat cell based on how its value
 * compares to the tournament average, using standard deviations.
 *
 * Light-mode scale: red tint (below avg) → white (at avg) → green tint (above avg)
 */
export function heatColor(value: number, mean: number, std: number, invert = false): string {
  if (std === 0 || isNaN(value)) return 'transparent'

  let z = (value - mean) / std
  z = Math.max(-2, Math.min(2, z)) // clamp to ±2 std devs

  if (invert) z = -z

  if (z > 0) {
    // Green scale — light tint
    const t = z / 2
    const r = Math.round(255 - t * 90)
    const g = Math.round(255 - t * 30)
    const b = Math.round(255 - t * 90)
    return `rgb(${r}, ${g}, ${b})`
  } else if (z < 0) {
    // Red scale — light tint
    const t = Math.abs(z) / 2
    const r = Math.round(255 - t * 20)
    const g = Math.round(255 - t * 80)
    const b = Math.round(255 - t * 80)
    return `rgb(${r}, ${g}, ${b})`
  }
  return 'transparent' // neutral — no tint
}

/** Simple green/red for delta values (light mode) */
export function deltaColor(value: number): string {
  if (value > 0.01) return 'rgb(200, 240, 200)' // light green
  if (value < -0.01) return 'rgb(245, 200, 200)' // light red
  return 'rgb(245, 240, 210)' // neutral yellowish
}
