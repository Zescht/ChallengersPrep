import { heatColor } from '../utils/colors'

interface StatCellProps {
  value: number | null | undefined
  mean?: number
  std?: number
  format: (v: number) => string
  invert?: boolean
  className?: string
  boldBlack?: boolean
  customColor?: (value: number) => string
}

export default function StatCell({ value, mean, std, format, invert = false, className = '', boldBlack = false, customColor }: StatCellProps) {
  if (value == null || isNaN(value)) {
    return <td className={`px-2 py-1.5 text-center text-text-dim ${className}`}>-</td>
  }

  const bg = customColor
    ? customColor(value)
    : mean != null && std != null && std > 0
      ? heatColor(value, mean, std, invert)
      : 'transparent'

  // Determine text color based on z-score for stronger signals
  let textClass = 'text-on-surface'
  if (boldBlack) {
    textClass = 'stat-bold-black'
  } else if (mean != null && std != null && std > 0) {
    let z = (value - mean) / std
    if (invert) z = -z
    if (z >= 1.5) textClass = 'text-primary'
    else if (z >= 0.8) textClass = 'text-primary-dim'
    else if (z <= -1.5) textClass = 'text-error'
    else if (z <= -0.8) textClass = 'text-error-dim'
  }

  return (
    <td
      className={`px-2 py-1.5 text-center font-table text-xs whitespace-nowrap font-bold ${textClass} ${className}`}
      style={{ backgroundColor: bg }}
    >
      {format(value)}
    </td>
  )
}
