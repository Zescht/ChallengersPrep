import React, { useState, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import { formatRatio, formatPct } from '../utils/format'
import AgentIcon from '../components/AgentIcon'
import type { Player } from '../types'

const MIN_ROUNDS = 100

const AGENT_ROLES: Record<string, string> = {
  // Controllers
  Astra: 'Controller', Brimstone: 'Controller', Clove: 'Controller', Harbor: 'Controller',
  Omen: 'Controller', Miks: 'Controller', Viper: 'Controller',
  // Duelists
  Iso: 'Duelist', Jett: 'Duelist', Neon: 'Duelist', Phoenix: 'Duelist',
  Raze: 'Duelist', Reyna: 'Duelist', Waylay: 'Duelist', Yoru: 'Duelist',
  // Initiators
  Breach: 'Initiator', Fade: 'Initiator', Gekko: 'Initiator', 'KAY/O': 'Initiator',
  Skye: 'Initiator', Sova: 'Initiator', Tejo: 'Initiator',
  // Sentinels
  Chamber: 'Sentinel', Cypher: 'Sentinel', Deadlock: 'Sentinel', Killjoy: 'Sentinel',
  Sage: 'Sentinel', Vyse: 'Sentinel', Veto: 'Sentinel',
}

const ROLE_LIST = ['Duelist', 'Initiator', 'Controller', 'Sentinel']

function playerPlaysRole(p: Player, role: string): boolean {
  return (p.agents ?? []).some(a => AGENT_ROLES[a.agent] === role)
}

// Team tag → logo filename mapping
const TEAM_LOGOS: Record<string, string> = {
  FKS: 'fks.png', SGE: 'sge.png', JL: 'jl.png', MDR: 'mdr.png',
  EP: 'ep.png', TL: 'tl.png', PXL: 'pxl.png', M1R: 'm1r.png',
  BAR: 'bar.png', UCAM: 'ucam.png', MISA: 'misa.png', S2G: 's2g.png',
  STS: 'sts.png', GNG: 'gng.png',
}

interface Column {
  key: string
  label: string
  getValue: (p: Player) => number
  format: (v: number) => string
  renderCell?: (p: Player) => ReactNode
  defaultAsc?: boolean
  invertColor?: boolean // true = lower value is better (gets purple)
}

const COLUMNS: Column[] = [
  { key: 'vlr', label: 'VLR', getValue: p => p.vlr_rating, format: v => v.toFixed(2) },
  { key: 'acs', label: 'ACS', getValue: p => p.acs_split, format: v => Math.round(v).toString() },
  { key: 'kd', label: 'K/D', getValue: p => p.kd, format: formatRatio },
  { key: 'adr', label: 'ADR', getValue: p => p.adr, format: v => v.toFixed(1) },
  { key: 'kast', label: 'KAST', getValue: p => p.kast, format: formatPct },
  {
    key: 'fkfd', label: 'FK/FD',
    getValue: p => p.fk - p.fd,
    format: v => (v > 0 ? `+${v}` : `${v}`),
    renderCell: p => <>{p.fk}/{p.fd}</>,
  },
  { key: 'fk_success', label: 'FK%', getValue: p => p.first_conversion, format: formatPct },
  { key: 'cl', label: 'CL-WIN%', getValue: p => p.clutch_pct, format: formatPct },
  { key: 'op_pct', label: 'OP% Kill', getValue: p => p.awp_pct, format: formatPct },
]

/**
 * Compute percentile rank (0 = worst, 1 = best) for a value within a sorted array.
 * If invertColor is true, lower values are better (get percentile 1).
 */
function getPercentile(value: number, allValues: number[], invert: boolean): number {
  if (allValues.length <= 1) return 0.5
  const sorted = [...allValues].sort((a, b) => a - b)
  // Find rank position
  let rank = 0
  for (const v of sorted) {
    if (v < value) rank++
    else break
  }
  const pct = rank / (sorted.length - 1)
  return invert ? 1 - pct : pct
}

/**
 * Interpolate from deep red (worst) → neutral → deep purple (best)
 * matching the example screenshot's color scheme.
 */
function percentileToColor(pct: number): string {
  // 3-stop gradient: deep red (bad) → green (good) → deep purple (excellent)
  if (pct <= 0.5) {
    // Red → green
    const t = pct / 0.5 // 0..1
    const h = Math.round(0 + 120 * t) // 0 (red) → 120 (green)
    const s = Math.round(55 - 15 * t + 15 * t) // stay ~50-55%
    const l = Math.round(65 + 18 * t) // 65→83
    return `hsl(${h}, ${s}%, ${l}%)`
  } else {
    // Green → purple
    const t = (pct - 0.5) / 0.5 // 0..1
    const h = Math.round(120 + 150 * t) // 120 (green) → 270 (purple)
    const s = Math.round(55 - 15 * t + 15 * t)
    const l = Math.round(83 - 8 * t) // 83→75
    return `hsl(${h}, ${s}%, ${l}%)`
  }
}

export default function Leaderboards() {
  const { data } = useStats()
  const [sortKey, setSortKey] = useState('acs')
  const [sortAsc, setSortAsc] = useState(false)
  const [teamFilter, setTeamFilter] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [roleStats, setRoleStats] = useState(false)
  const [clExpanded, setClExpanded] = useState(false)

  const tagMap = useMemo(() => {
    if (!data) return new Map<string, string>()
    return new Map(data.teams.map(t => [t.name, t.tag]))
  }, [data])

  // Pre-compute all values per column for percentile ranking (based on visible players)
  const colValues = useMemo(() => {
    if (!data) return new Map<string, number[]>()
    const useRole = roleFilter && roleStats
    const source: Player[] = useRole
      ? (data.players_by_role ?? []).filter(p => (p as Player & { role?: string }).role === roleFilter)
      : data.players
    const eligible = source
      .filter(p => p.rounds >= MIN_ROUNDS)
      .filter(p => !roleFilter || useRole || playerPlaysRole(p, roleFilter!))
    const map = new Map<string, number[]>()
    for (const c of COLUMNS) {
      map.set(c.key, eligible.map(p => c.getValue(p)))
    }
    return map
  }, [data, roleFilter, roleStats])

  if (!data) return null

  const col = COLUMNS.find(c => c.key === sortKey) || COLUMNS[0]

  // Extra sort definitions for expanded CL sub-columns
  const extraSortGetters: Record<string, (p: Player) => number> = {
    cl_atmp: p => p.clutch_scens,
    cl_won: p => p.clutches,
  }

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortAsc(prev => !prev)
    } else {
      const newCol = COLUMNS.find(c => c.key === key)
      setSortKey(key)
      setSortAsc(newCol?.defaultAsc ?? false)
    }
  }

  const sortGetter = extraSortGetters[sortKey] ?? col.getValue

  // When role filter + role stats are both on, use per-role data
  const useRoleData = roleFilter && roleStats
  const playerSource: Player[] = useRoleData
    ? (data.players_by_role ?? []).filter(p => (p as Player & { role?: string }).role === roleFilter)
    : data.players

  const players = playerSource
    .filter(p => p.rounds >= MIN_ROUNDS)
    .filter(p => !roleFilter || useRoleData || playerPlaysRole(p, roleFilter))
    .sort((a, b) => {
      const va = sortGetter(a)
      const vb = sortGetter(b)
      return sortAsc ? va - vb : vb - va
    })

  const teams = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))

  const thBase = 'px-2 py-1.5 text-black font-medium whitespace-nowrap'
  const tdBase = 'px-2 py-1 font-mono text-black whitespace-nowrap'

  return (
    <div className="p-4">
      {/* Team Filter */}
      <div className="mb-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-xs uppercase tracking-wider">Team:</span>
          <select
            value={teamFilter ?? ''}
            onChange={e => setTeamFilter(e.target.value || null)}
            className="bg-card border border-border rounded px-2 py-1 text-sm text-text focus:outline-none focus:border-primary"
          >
            <option value="">All Teams</option>
            {teams.map(t => (
              <option key={t.name} value={t.name}>{t.tag} — {t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-xs uppercase tracking-wider">Role:</span>
          <select
            value={roleFilter ?? ''}
            onChange={e => setRoleFilter(e.target.value || null)}
            className="bg-card border border-border rounded px-2 py-1 text-sm text-text focus:outline-none focus:border-primary"
          >
            <option value="">All Roles</option>
            {ROLE_LIST.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {roleFilter && (
            <label className="flex items-center gap-1 ml-1 cursor-pointer">
              <input
                type="checkbox"
                checked={roleStats}
                onChange={e => setRoleStats(e.target.checked)}
                className="accent-primary"
              />
              <span className="text-text text-xs">Role stats</span>
            </label>
          )}
        </div>
        <span className="text-text-dim text-xs">Min {MIN_ROUNDS} rounds</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm [&_td]:border-y-[1.5px] [&_td]:border-border [&_th]:border-y-[1.5px] [&_th]:border-border">
          <thead>
            <tr className="bg-nav">
              <th className={`${thBase} text-left`}>#</th>
              <th className={`${thBase} text-left`}>Player</th>
              <th className={`${thBase} text-left`}>Team</th>
              <th className={`${thBase} text-left`}>Agents</th>
              <th className={`${thBase} text-right border-r-[3px] !border-r-black`}>Rnds</th>
              {COLUMNS.map(c => (
                <React.Fragment key={c.key}>
                  <th className={`${thBase} text-right select-none`}>
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      <button
                        onClick={() => handleSort(c.key)}
                        className="inline-flex flex-col items-center leading-none text-[9px] text-text-muted hover:text-black -my-1"
                        title={`Sort by ${c.label}`}
                      >
                        <span className={sortKey === c.key && !sortAsc ? 'text-black' : 'opacity-40'}>▲</span>
                        <span className={sortKey === c.key && sortAsc ? 'text-black' : 'opacity-40'}>▼</span>
                      </button>
                      {c.key === 'cl' && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setClExpanded(v => !v) }}
                          className="ml-0.5 w-4 h-4 border border-border rounded cursor-pointer text-text-muted hover:text-black"
                          title={clExpanded ? 'Collapse ATMP & WON' : 'Expand ATMP & WON'}
                          style={{ display: 'inline-grid', placeItems: 'center', fontSize: '12px', fontWeight: 700, lineHeight: 1 }}
                        >
                          {clExpanded ? '−' : '+'}
                        </span>
                      )}
                    </span>
                  </th>
                  {c.key === 'cl' && clExpanded && (
                    <>
                      <th className={`${thBase} text-right select-none`}>
                        <span className="inline-flex items-center gap-1">
                          ATMP
                          <button
                            onClick={() => handleSort('cl_atmp')}
                            className="inline-flex flex-col items-center leading-none text-[9px] text-text-muted hover:text-black -my-1"
                          >
                            <span className={sortKey === 'cl_atmp' && !sortAsc ? 'text-black' : 'opacity-40'}>▲</span>
                            <span className={sortKey === 'cl_atmp' && sortAsc ? 'text-black' : 'opacity-40'}>▼</span>
                          </button>
                        </span>
                      </th>
                      <th className={`${thBase} text-right select-none`}>
                        <span className="inline-flex items-center gap-1">
                          WON
                          <button
                            onClick={() => handleSort('cl_won')}
                            className="inline-flex flex-col items-center leading-none text-[9px] text-text-muted hover:text-black -my-1"
                          >
                            <span className={sortKey === 'cl_won' && !sortAsc ? 'text-black' : 'opacity-40'}>▲</span>
                            <span className={sortKey === 'cl_won' && sortAsc ? 'text-black' : 'opacity-40'}>▼</span>
                          </button>
                        </span>
                      </th>
                    </>
                  )}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => {
              const dimmed = teamFilter && p.team !== teamFilter
              const top3agents = p.agents?.slice(0, 3) ?? []
              const tag = tagMap.get(p.team) ?? p.team
              const logo = TEAM_LOGOS[tag]
              return (
                <tr
                  key={p.ign}
                  className={`hover:bg-card/50 ${dimmed ? 'opacity-30' : ''}`}
                >
                  <td className={tdBase}>{i + 1}</td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    <Link
                      to={`/player/${encodeURIComponent(p.ign)}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {p.ign}
                    </Link>
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {logo && (
                        <img
                          src={`/logos/${logo}`}
                          alt={tag}
                          className="h-4 w-4 object-contain"
                        />
                      )}
                      <span className="font-medium text-black text-sm">{tag}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    <div className="flex gap-0.5">
                      {top3agents.map((a, j) => (
                        <AgentIcon key={j} agent={a.agent} size={18} />
                      ))}
                    </div>
                  </td>
                  <td className={`${tdBase} text-right border-r-[3px] !border-r-black`}>{p.rounds}</td>
                  {COLUMNS.map(c => {
                    const val = c.getValue(p)
                    const allVals = colValues.get(c.key) ?? []
                    const pct = getPercentile(val, allVals, c.invertColor ?? false)
                    const bg = percentileToColor(pct)
                    return (
                      <React.Fragment key={c.key}>
                        <td
                          className={`${tdBase} text-right`}
                          style={{ backgroundColor: bg }}
                        >
                          {c.renderCell ? c.renderCell(p) : c.format(val)}
                        </td>
                        {c.key === 'cl' && clExpanded && (
                          <>
                            <td className={`${tdBase} text-right`}>{p.clutch_scens}</td>
                            <td className={`${tdBase} text-right`}>{p.clutches}</td>
                          </>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
