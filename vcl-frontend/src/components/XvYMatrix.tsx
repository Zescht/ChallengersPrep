import { buildXvYMatrix, buildAvgMatrix } from '../utils/xvy'
import { heatColor, xvyDeltaColor } from '../utils/colors'
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

  return (
    <div className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5">
      <div className="px-5 py-3 bg-surface-container-high/60 border-b border-white/5">
        <h3 className="font-headline font-bold text-xs text-on-surface uppercase tracking-tight">{title}</h3>
      </div>
      <table className="w-full text-sm xvy-grid">
        <thead>
          <tr className="bg-surface-container/60">
            <th className="px-3 py-2.5 text-center scannable-label text-xs">XvY</th>
            {labels.map(n => (
              <th key={n} className="px-3 py-2.5 text-center scannable-label text-xs">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((rowLabel, rowIdx) => (
            <tr key={rowLabel} className="hover:bg-white/5 transition-colors">
              <td className="px-3 py-2 text-center font-bold text-sm">{rowLabel}</td>
              {labels.map((_, colIdx) => {
                const val = displayMatrix[rowIdx][colIdx]
                if (val == null) {
                  return <td key={colIdx} className="px-3 py-2 text-center text-sm">-</td>
                }

                const bg = mode === 'delta'
                  ? xvyDeltaColor(val)
                  : heatColor(val, 0.5, 1, false)
                const text = mode === 'delta' ? formatDelta(val) : formatPct(val)

                return (
                  <td
                    key={colIdx}
                    className="px-3 py-2 text-center font-table font-bold text-sm"
                    style={{ backgroundColor: bg }}
                  >
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
