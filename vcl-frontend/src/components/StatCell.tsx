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
    return <td className={`px-1.5 py-0.5 text-center text-text-dim ${className}`}>-</td>
  }

  const bg = mean != null && std != null && std > 0
    ? heatColor(value, mean, std, invert)
    : 'transparent'

  return (
    <td
      className={`px-1.5 py-0.5 text-center font-mono text-sm ${className}`}
      style={{ backgroundColor: bg }}
    >
      {format(value)}
    </td>
  )
}
