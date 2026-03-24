/** Shared intensity constants — ensures identical max green / max red across all scales */
const MAX_OPACITY = 0.55
const CURVE_POWER = 0.7

/**
 * Returns a CSS background-color string for a stat cell based on how its value
 * compares to the tournament average, using standard deviations.
 *
 * Reads heat-map base colors from CSS custom properties so they adapt to theme.
 */
export function heatColor(value: number, _mean: number, _std: number, invert = false): string {
  if (isNaN(value)) return 'transparent'

  // Absolute scale: 50% = neutral, 100% = full green, 0% = full red
  // value is 0–1 (percentage as decimal)
  let deviation = value - 0.5 // -0.5 to +0.5
  if (invert) deviation = -deviation

  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const neg = getCSSVar('--theme-heat-negative', '255, 113, 108')

  // t goes from 0 (at 50%) to 1 (at 0% or 100%)
  const t = Math.min(Math.abs(deviation) / 0.5, 1)
  const curved = Math.pow(t, CURVE_POWER)
  const opacity = (curved * MAX_OPACITY).toFixed(3)

  if (deviation > 0) {
    return `rgba(${pos}, ${opacity})`
  } else if (deviation < 0) {
    return `rgba(${neg}, ${opacity})`
  }
  return 'transparent'
}

/** FK/r color scale: 0 = red, 0.1 = yellow, 0.2+ = green */
export function fkColor(value: number): string {
  if (isNaN(value)) return 'transparent'

  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const neg = getCSSVar('--theme-heat-negative', '255, 113, 108')

  const clamped = Math.max(0, Math.min(0.2, value))

  if (clamped <= 0.1) {
    const t = clamped / 0.1
    const curved = Math.pow(1 - t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${neg}, ${opacity})`
  } else {
    const t = (clamped - 0.1) / 0.1
    const curved = Math.pow(t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${pos}, ${opacity})`
  }
}

/** CL% color scale: 0 = red, 0.15 = yellow, 0.35+ = green */
export function clColor(value: number): string {
  if (isNaN(value)) return 'transparent'

  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const neg = getCSSVar('--theme-heat-negative', '255, 113, 108')

  const clamped = Math.max(0, Math.min(0.35, value))

  if (clamped <= 0.15) {
    const t = clamped / 0.15
    const curved = Math.pow(1 - t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${neg}, ${opacity})`
  } else {
    const t = (clamped - 0.15) / 0.2
    const curved = Math.pow(t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${pos}, ${opacity})`
  }
}

/** OP% color scale: 0 = no color, 0.01+ = light green, 0.2+ = full green */
export function opColor(value: number): string {
  if (isNaN(value) || value <= 0) return 'transparent'

  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const clamped = Math.min(value, 0.2)
  const t = clamped / 0.2
  const curved = Math.pow(t, CURVE_POWER)
  const opacity = (curved * MAX_OPACITY).toFixed(3)
  return `rgba(${pos}, ${opacity})`
}

/** ADR color scale: 100 = red, 130 = yellow, 170+ = green */
export function adrColor(value: number): string {
  if (isNaN(value)) return 'transparent'

  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const neg = getCSSVar('--theme-heat-negative', '255, 113, 108')

  const clamped = Math.max(100, Math.min(170, value))

  if (clamped <= 130) {
    const t = (clamped - 100) / 30
    const curved = Math.pow(1 - t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${neg}, ${opacity})`
  } else {
    const t = (clamped - 130) / 40
    const curved = Math.pow(t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${pos}, ${opacity})`
  }
}

/** APR color scale: 0 = red, 0.2 = yellow, 0.5+ = green */
export function aprColor(value: number): string {
  if (isNaN(value)) return 'transparent'

  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const neg = getCSSVar('--theme-heat-negative', '255, 113, 108')

  const clamped = Math.max(0, Math.min(0.5, value))

  if (clamped <= 0.2) {
    const t = clamped / 0.2
    const curved = Math.pow(1 - t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${neg}, ${opacity})`
  } else {
    const t = (clamped - 0.2) / 0.3
    const curved = Math.pow(t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${pos}, ${opacity})`
  }
}

/** FK/FD% color scale: 0.4 = red, 0.5 = yellow, 0.6+ = green */
export function fkfdColor(value: number): string {
  if (isNaN(value)) return 'transparent'

  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const neg = getCSSVar('--theme-heat-negative', '255, 113, 108')

  const clamped = Math.max(0.4, Math.min(0.6, value))

  if (clamped <= 0.5) {
    const t = (clamped - 0.4) / 0.1
    const curved = Math.pow(1 - t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${neg}, ${opacity})`
  } else {
    const t = (clamped - 0.5) / 0.1
    const curved = Math.pow(t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${pos}, ${opacity})`
  }
}

/** XvY delta color scale: -10% = red, 0% = yellow, +10% = green */
export function xvyDeltaColor(value: number): string {
  if (isNaN(value)) return 'transparent'

  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const neg = getCSSVar('--theme-heat-negative', '255, 113, 108')

  const clamped = Math.max(-0.1, Math.min(0.1, value))

  if (clamped <= 0) {
    const t = (clamped + 0.1) / 0.1
    const curved = Math.pow(1 - t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${neg}, ${opacity})`
  } else {
    const t = clamped / 0.1
    const curved = Math.pow(t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${pos}, ${opacity})`
  }
}

/** Retake/Post-plant color scale: 0% = red, 50% = yellow, 80% = green */
export function retakeColor(value: number): string {
  if (isNaN(value)) return 'transparent'

  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const neg = getCSSVar('--theme-heat-negative', '255, 113, 108')

  const clamped = Math.max(0, Math.min(0.8, value))

  if (clamped <= 0.5) {
    const t = clamped / 0.5
    const curved = Math.pow(1 - t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${neg}, ${opacity})`
  } else {
    const t = (clamped - 0.5) / 0.3
    const curved = Math.pow(t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${pos}, ${opacity})`
  }
}

/** Retake-only color scale: 0% = red, 25% = yellow, 40%+ = green */
export function retakeOnlyColor(value: number): string {
  if (isNaN(value)) return 'transparent'

  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const neg = getCSSVar('--theme-heat-negative', '255, 113, 108')

  const clamped = Math.max(0, Math.min(0.4, value))

  if (clamped <= 0.25) {
    const t = clamped / 0.25
    const curved = Math.pow(1 - t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${neg}, ${opacity})`
  } else {
    const t = (clamped - 0.25) / 0.15
    const curved = Math.pow(t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${pos}, ${opacity})`
  }
}

/** K/D color scale: 0.8 = red, 1.0 = yellow, 1.2+ = green */
export function kdColor(value: number): string {
  if (isNaN(value)) return 'transparent'

  const pos = getCSSVar('--theme-heat-positive', '161, 255, 194')
  const neg = getCSSVar('--theme-heat-negative', '255, 113, 108')

  const clamped = Math.max(0.8, Math.min(1.2, value))

  if (clamped <= 1.0) {
    const t = (clamped - 0.8) / 0.2
    const curved = Math.pow(1 - t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${neg}, ${opacity})`
  } else {
    const t = (clamped - 1.0) / 0.2
    const curved = Math.pow(t, CURVE_POWER)
    const opacity = (curved * MAX_OPACITY).toFixed(3)
    return `rgba(${pos}, ${opacity})`
  }
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
