import { buildXvYMatrix, buildAvgMatrix } from '../utils/xvy'
import { deltaColor } from '../utils/colors'
import { formatPct, formatDelta } from '../utils/format'
import type { XvYEntry } from '../types'

interface XvYMatrixProps {
  title: string
  entries?: XvYEntry[]
  averages?: Record<string, number>
  mode: 'absolute' | 'delta' | 'average'
}

export default function XvYMatrix({ title, entries, averages, mode }: XvYMatrixProps) {
  const labels = [5, 4, 3, 2, 1]

  let matrix: (number | null)[][]

  if (mode === 'average' && averages) {
    matrix = buildAvgMatrix(averages)
  } else if (entries) {
    matrix = buildXvYMatrix(entries)
  } else {
    matrix = Array.from({ length: 5 }, () => Array(5).fill(null))
  }

  let deltaMatrix: (number | null)[][] | null = null
  if (mode === 'delta' && entries && averages) {
    const teamMatrix = buildXvYMatrix(entries)
    const avgMatrix = buildAvgMatrix(averages)
    deltaMatrix = Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 5 }, (_, c) => {
        const tv = teamMatrix[r][c]
        const av = avgMatrix[r][c]
        return tv != null && av != null ? tv - av : null
      })
    )
  }

  const displayMatrix = deltaMatrix || matrix

  const headerStyle = mode === 'delta'
    ? { backgroundColor: '#f0edd0', color: '#5a5a10' }
    : { backgroundColor: '#e8ddf8', color: '#4a2080' }

  return (
    <div>
      <table className="border-collapse text-sm">
        <thead>
          <tr>
            <th colSpan={6} className="px-1 py-1 text-center font-semibold text-sm border border-border" style={headerStyle}>
              {title}
            </th>
          </tr>
          <tr className="bg-nav">
            <th className="px-1.5 py-1 text-center text-text-muted font-medium text-sm border border-border">XvY</th>
            {labels.map(n => (
              <th key={n} className="px-1.5 py-1 text-center text-text-muted font-medium text-sm border border-border w-12">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((rowLabel, rowIdx) => (
            <tr key={rowLabel} className="border-b border-border">
              <td className="px-1.5 py-0.5 text-center font-medium text-text-muted border border-border">{rowLabel}</td>
              {labels.map((_, colIdx) => {
                const val = displayMatrix[rowIdx][colIdx]
                if (val == null) {
                  return <td key={colIdx} className="px-1.5 py-0.5 text-center text-text-dim border border-border">-</td>
                }

                const bg = mode === 'delta' ? deltaColor(val) : deltaColor(val - 0.5)
                const text = mode === 'delta' ? formatDelta(val) : formatPct(val)

                return (
                  <td key={colIdx} className="px-1.5 py-0.5 text-center font-mono text-sm border border-border" style={{ backgroundColor: bg }}>
                    {text}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
