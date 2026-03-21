import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { StatsData, TournamentAverages } from '../types'

interface StatsContextValue {
  data: StatsData | null
  averages: TournamentAverages | null
  loading: boolean
  error: string | null
}

const StatsContext = createContext<StatsContextValue>({
  data: null,
  averages: null,
  loading: true,
  error: null,
})

export function useStats() {
  return useContext(StatsContext)
}

function meanStd(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 }
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return { mean, std: Math.sqrt(variance) }
}

const STAT_KEYS = [
  'rW_pct', 'atk_rW_pct', 'def_rW_pct',
  'pistol_rW_pct', 'pistol_atk_rW_pct', 'pistol_def_rW_pct',
  'gun_rW_pct', 'gun_atk_rW_pct', 'gun_def_rW_pct',
  'antieco_rW_pct', 'antieco_atk_rW_pct', 'antieco_def_rW_pct',
  'eco_rW_pct', 'eco_atk_rW_pct', 'eco_def_rW_pct',
  'post_rW_pct', 'post_per_map', 'post_rW_event_avg',
  'ret_rW_pct', 'ret_per_map', 'ret_rW_event_avg',
]

const PLAYER_STAT_KEYS = ['acs_split', 'kd', 'kad', 'kast', 'fk_pct', 'fd_pct', 'clutch_pct', 'awp_pct']

function computeAverages(data: StatsData): TournamentAverages {
  const team: Record<string, { mean: number; std: number }> = {}
  for (const key of STAT_KEYS) {
    const values = data.teams
      .map(t => (t.allMaps as any)[key])
      .filter((v: any): v is number => v != null && !isNaN(v))
    team[key] = meanStd(values)
  }

  const allMapNames = new Set<string>()
  for (const t of data.teams) for (const m of t.maps) allMapNames.add(m.map)

  const perMap: Record<string, Record<string, { mean: number; std: number }>> = {}
  for (const mapName of allMapNames) {
    perMap[mapName] = {}
    for (const key of STAT_KEYS) {
      const values = data.teams
        .map(t => t.maps.find(m => m.map === mapName))
        .filter(Boolean)
        .map(m => (m as any)[key])
        .filter((v: any): v is number => v != null && !isNaN(v))
      perMap[mapName][key] = meanStd(values)
    }
  }

  const xvySums: Record<string, { total: number; count: number }> = {}
  for (const t of data.teams) {
    for (const entry of t.xvy) {
      if (!xvySums[entry.situation]) xvySums[entry.situation] = { total: 0, count: 0 }
      xvySums[entry.situation].total += entry.win_pct
      xvySums[entry.situation].count += 1
    }
  }
  const xvy: Record<string, number> = {}
  for (const [sit, { total, count }] of Object.entries(xvySums)) {
    xvy[sit] = total / count
  }

  const player: Record<string, { mean: number; std: number }> = {}
  const qualifiedPlayers = data.players.filter(p => p.rounds >= 100)
  for (const key of PLAYER_STAT_KEYS) {
    const values = qualifiedPlayers
      .map(p => (p as any)[key])
      .filter((v: any): v is number => v != null && !isNaN(v))
    player[key] = meanStd(values)
  }

  // Per-site averages (allMaps level)
  const siteAvgs: Record<string, { mean: number; std: number }> = {}
  for (const mode of ['post', 'ret'] as const) {
    const siteKey = mode === 'post' ? 'post_by_site' : 'ret_by_site'
    const allSites = new Set<string>()
    for (const t of data.teams) {
      const bs = (t.allMaps as any)[siteKey]
      if (bs) Object.keys(bs).forEach(s => { if (s !== '?') allSites.add(s) })
    }
    for (const site of allSites) {
      const values = data.teams
        .map(t => (t.allMaps as any)[siteKey]?.[site]?.pct)
        .filter((v: any): v is number => v != null && !isNaN(v))
      siteAvgs[`${mode}_${site}`] = meanStd(values)
    }
  }

  // Per-map per-site averages
  const perMapSiteAvgs: Record<string, Record<string, { mean: number; std: number }>> = {}
  for (const mapName of allMapNames) {
    perMapSiteAvgs[mapName] = {}
    for (const mode of ['post', 'ret'] as const) {
      const siteKey = mode === 'post' ? 'post_by_site' : 'ret_by_site'
      const allSites = new Set<string>()
      for (const t of data.teams) {
        const m = t.maps.find(m => m.map === mapName)
        const bs = m ? (m as any)[siteKey] : null
        if (bs) Object.keys(bs).forEach(s => { if (s !== '?') allSites.add(s) })
      }
      for (const site of allSites) {
        const values = data.teams
          .map(t => {
            const m = t.maps.find(m => m.map === mapName)
            return m ? (m as any)[siteKey]?.[site]?.pct : undefined
          })
          .filter((v: any): v is number => v != null && !isNaN(v))
        perMapSiteAvgs[mapName][`${mode}_${site}`] = meanStd(values)
      }
    }
  }

  return { team, perMap, xvy, player, siteAvgs, perMapSiteAvgs }
}

export function StatsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StatsData | null>(null)
  const [averages, setAverages] = useState<TournamentAverages | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('./data/stats.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load stats.json: ${res.status}`)
        return res.json()
      })
      .then((json: StatsData) => {
        setData(json)
        setAverages(computeAverages(json))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <StatsContext.Provider value={{ data, averages, loading, error }}>
      {children}
    </StatsContext.Provider>
  )
}
