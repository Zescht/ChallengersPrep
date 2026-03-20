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

  return (
    <div className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5">
      <div className="px-3 py-2 bg-surface-container-high/60 border-b border-white/5">
        <h4 className="font-headline font-bold text-[10px] text-on-surface uppercase tracking-wider">{title}</h4>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-container/60">
            <th className="px-2 py-1.5 text-center scannable-label">XvY</th>
            {labels.map(n => (
              <th key={n} className="px-2 py-1.5 text-center scannable-label w-11">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {labels.map((rowLabel, rowIdx) => (
            <tr key={rowLabel} className="hover:bg-white/5 transition-colors">
              <td className="px-2 py-1 text-center font-medium text-text-muted text-[10px]">{rowLabel}</td>
              {labels.map((_, colIdx) => {
                const val = displayMatrix[rowIdx][colIdx]
                if (val == null) {
                  return <td key={colIdx} className="px-2 py-1 text-center text-text-dim text-[10px]">-</td>
                }

                const bg = mode === 'delta' ? deltaColor(val) : deltaColor(val - 0.5)
                const text = mode === 'delta' ? formatDelta(val) : formatPct(val)
                const textColor = mode === 'delta'
                  ? val > 0.01 ? 'text-primary' : val < -0.01 ? 'text-error' : 'text-on-surface'
                  : val > 0.5 ? 'text-primary' : val < 0.5 ? 'text-error' : 'text-on-surface'

                return (
                  <td
                    key={colIdx}
                    className={`px-2 py-1 text-center font-mono text-[10px] ${textColor}`}
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
