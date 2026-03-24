import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useFilter } from './FilterContext'
import type { StatsData, TournamentAverages } from '../types'

interface StatsContextValue {
  data: StatsData | null
  averages: TournamentAverages | null
  fullData: StatsData | null
  playoffData: StatsData | null
  loading: boolean
  error: string | null
}

const StatsContext = createContext<StatsContextValue>({
  data: null,
  averages: null,
  fullData: null,
  playoffData: null,
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

const PLAYOFF_TAGS = new Set(['EP', 'MDR', 'MISA', 'UCAM'])

function filterPlayoffData(data: StatsData): StatsData {
  const teams = data.teams.filter(t => PLAYOFF_TAGS.has(t.tag))
  const teamNames = new Set(teams.map(t => t.name))
  const players = data.players.filter(p => teamNames.has(p.team))
  const playersByRole = data.players_by_role.filter(p => teamNames.has(p.team))
  const playersByAgent = data.players_by_agent.filter(p => teamNames.has(p.team))
  const matches = data.matches.filter(m => teamNames.has(m.team1) || teamNames.has(m.team2))
  const agentStats = data.agent_stats.filter(a => teamNames.has(a.team))

  // Recompute leaderboards from filtered players (spread to avoid mutating originals)
  const leaderboards: typeof data.leaderboards = {}
  for (const [key, lb] of Object.entries(data.leaderboards)) {
    const filtered = lb.entries.filter(e => teamNames.has(e.team))
    const sorted = [...filtered].sort((a, b) => b.value - a.value)
    const reranked = sorted.map((e, i) => ({ ...e, rank: i + 1 }))
    const values = sorted.map(e => e.value)
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    leaderboards[key] = { entries: reranked, tournament_avg: avg }
  }

  return {
    teams,
    players,
    players_by_role: playersByRole,
    players_by_agent: playersByAgent,
    matches,
    leaderboards,
    agent_stats: agentStats,
    ability_names: data.ability_names,
  }
}

export function StatsProvider({ children }: { children: ReactNode }) {
  const { playoffOnly, clDataOnly } = useFilter()
  const [fullData, setFullData] = useState<StatsData | null>(null)
  const [playoffData, setPlayoffData] = useState<StatsData | null>(null)
  const [fullAverages, setFullAverages] = useState<TournamentAverages | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load both datasets on mount
  useEffect(() => {
    Promise.all([
      fetch('./data/stats.json').then(r => {
        if (!r.ok) throw new Error(`Failed to load stats.json: ${r.status}`)
        return r.json()
      }),
      fetch('./data/stats_playoffs.json')
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ])
      .then(([full, playoff]: [StatsData, StatsData | null]) => {
        setFullData(full)
        setPlayoffData(playoff)
        setFullAverages(computeAverages(full))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Compute active data + averages based on filter mode
  const { data, averages } = useMemo(() => {
    if (!fullData || !fullAverages) return { data: null, averages: null }

    if (clDataOnly && playoffData) {
      // Mode 2: use playoff dataset entirely, with its own averages
      return { data: playoffData, averages: computeAverages(playoffData) }
    }

    if (playoffOnly) {
      // Mode 1: filter full data to 4 teams, keep full-league averages
      return { data: filterPlayoffData(fullData), averages: fullAverages }
    }

    // Default: full data, full averages
    return { data: fullData, averages: fullAverages }
  }, [fullData, playoffData, fullAverages, playoffOnly, clDataOnly])

  return (
    <StatsContext.Provider value={{ data, averages, fullData, playoffData, loading, error }}>
      {children}
    </StatsContext.Provider>
  )
}
