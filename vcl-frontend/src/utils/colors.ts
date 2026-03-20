/**
 * Returns a CSS background-color string for a stat cell based on how its value
 * compares to the tournament average, using standard deviations.
 *
 * Reads heat-map base colors from CSS custom properties so they adapt to theme.
 */
export function heatColor(value: number, mean: number, std: number, invert = false): string {
  if (std === 0 || isNaN(value)) return 'transparent'

  let z = (value - mean) / std
  z = Math.max(-2, Math.min(2, z)) // clamp to ±2 std devs

  if (invert) z = -z

  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const neg = getCSSVar('--theme-heat-negative', '255, 113, 108')

  if (z > 0) {
    const t = z / 2
    return `rgba(${pos}, ${(t * 0.25).toFixed(3)})`
  } else if (z < 0) {
    const t = Math.abs(z) / 2
    return `rgba(${neg}, ${(t * 0.25).toFixed(3)})`
  }
  return 'transparent'
}

/** Simple green/red for delta values */
export function deltaColor(value: number): string {
  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const neg = getCSSVar('--theme-heat-negative', '255, 113, 108')

  if (value > 0.01) return `rgba(${pos}, 0.15)`
  if (value < -0.01) return `rgba(${neg}, 0.15)`
  return 'rgba(128, 128, 128, 0.03)'
}

/** Read a CSS custom property from :root, with fallback */
function getCSSVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}
