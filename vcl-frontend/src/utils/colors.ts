/**
 * Returns a CSS background-color string for a stat cell based on how its value
 * compares to the tournament average, using standard deviations.
 *
 * Dark-mode scale: dim red (below avg) → transparent (at avg) → neon green (above avg)
 */
export function heatColor(value: number, mean: number, std: number, invert = false): string {
  if (std === 0 || isNaN(value)) return 'transparent'

  let z = (value - mean) / std
  z = Math.max(-2, Math.min(2, z)) // clamp to ±2 std devs

  if (invert) z = -z

  if (z > 0) {
    // Green scale — neon tint on dark
    const t = z / 2
    return `rgba(161, 255, 194, ${(t * 0.25).toFixed(3)})`
  } else if (z < 0) {
    // Red scale — dim red tint on dark
    const t = Math.abs(z) / 2
    return `rgba(255, 113, 108, ${(t * 0.25).toFixed(3)})`
  }
  return 'transparent' // neutral — no tint
}

/** Simple green/red for delta values (dark mode) */
export function deltaColor(value: number): string {
  if (value > 0.01) return 'rgba(161, 255, 194, 0.15)' // green tint
  if (value < -0.01) return 'rgba(255, 113, 108, 0.15)' // red tint
  return 'rgba(255, 255, 255, 0.03)' // neutral
}
