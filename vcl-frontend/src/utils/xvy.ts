import type { XvYEntry } from '../types'

/** Parse "3v2" → { team: 3, opp: 2 } */
export function parseSituation(situation: string): { team: number; opp: number } | null {
  const match = situation.match(/^(\d)v(\d)$/)
  if (!match) return null
  return { team: parseInt(match[1]), opp: parseInt(match[2]) }
}

/**
 * Build a 5x5 matrix from flat XvY array.
 * Rows = team alive (5 down to 1), Cols = opponent alive (5 down to 1).
 * Returns matrix[rowIndex][colIndex] = win_pct (or null if no data).
 */
export function buildXvYMatrix(entries: XvYEntry[]): (number | null)[][] {
  const matrix: (number | null)[][] = Array.from({ length: 5 }, () => Array(5).fill(null))

  for (const entry of entries) {
    const parsed = parseSituation(entry.situation)
    if (!parsed) continue
    const row = 5 - parsed.team // 5 → row 0, 1 → row 4
    const col = 5 - parsed.opp  // 5 → col 0, 1 → col 4
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      matrix[row][col] = entry.win_pct
    }
  }

  return matrix
}

/** Build a 5x5 matrix from a Record<situation, avg_win_pct> */
export function buildAvgMatrix(avgMap: Record<string, number>): (number | null)[][] {
  const matrix: (number | null)[][] = Array.from({ length: 5 }, () => Array(5).fill(null))

  for (const [situation, value] of Object.entries(avgMap)) {
    const parsed = parseSituation(situation)
    if (!parsed) continue
    const row = 5 - parsed.team
    const col = 5 - parsed.opp
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      matrix[row][col] = value
    }
  }

  return matrix
}
