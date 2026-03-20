import { heatColor } from '../utils/colors'

interface StatCellProps {
  value: number | null | undefined
  mean?: number
  std?: number
  format: (v: number) => string
  invert?: boolean
  className?: string
}

export default function StatCell({ value, mean, std, format, invert = false, className = '' }: StatCellProps) {
  if (value == null || isNaN(value)) {
    return <td className={`px-2 py-1.5 text-center text-text-dim ${className}`}>-</td>
  }

  const bg = mean != null && std != null && std > 0
    ? heatColor(value, mean, std, invert)
    : 'transparent'

  // Determine text color based on z-score for stronger signals
  let textClass = 'text-on-surface'
  if (mean != null && std != null && std > 0) {
    let z = (value - mean) / std
    if (invert) z = -z
    if (z >= 1.5) textClass = 'text-primary font-bold'
    else if (z >= 0.8) textClass = 'text-primary-dim'
    else if (z <= -1.5) textClass = 'text-error font-bold'
    else if (z <= -0.8) textClass = 'text-error-dim'
  }

  return (
    <td
      className={`px-2 py-1.5 text-center font-table text-xs whitespace-nowrap ${textClass} ${className}`}
      style={{ backgroundColor: bg }}
    >
      {format(value)}
    </td>
  )
}
