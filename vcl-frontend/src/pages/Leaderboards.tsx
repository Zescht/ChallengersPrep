import { Fragment, useState, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import { useFilter } from '../context/FilterContext'
import { formatRatio, formatPct } from '../utils/format'
import AgentIcon from '../components/AgentIcon'
import type { Player, AgentPlayer } from '../types'

const MIN_ROUNDS = 100

/**
 * Compute percentile rank (0 = worst, 1 = best) for a value within a sorted array.
 * If invert is true, lower values are better (get percentile 1).
 */
function getPercentile(value: number, allValues: number[], invert: boolean): number {
  if (allValues.length <= 1) return 0.5
  const sorted = [...allValues].sort((a, b) => a - b)
  let rank = 0
  for (const v of sorted) {
    if (v < value) rank++
    else break
  }
  const pct = rank / (sorted.length - 1)
  return invert ? 1 - pct : pct
}

/**
 * Interpolate from deep red (worst) → green (good) → deep purple (best)
 */
function isDarkMode(): boolean {
  return document.documentElement.getAttribute('data-theme') !== 'light'
}

function percentileToColor(pct: number): string {
  const dark = isDarkMode()
  if (pct <= 0.5) {
    const t = pct / 0.5
    const h = Math.round(120 * t)
    const s = dark ? Math.round(45 + 10 * t) : Math.round(55 - 15 * t + 15 * t)
    const l = dark ? Math.round(25 + 5 * t) : Math.round(65 + 5 * t)
    return `hsl(${h}, ${s}%, ${l}%)`
  } else {
    const t = (pct - 0.5) / 0.5
    const h = Math.round(120 + 150 * t)
    const s = dark ? Math.round(55 - 10 * t) : Math.round(55 - 15 * t + 15 * t)
    const l = dark ? Math.round(30 - 3 * t) : Math.round(70 - 5 * t)
    return `hsl(${h}, ${s}%, ${l}%)`
  }
}

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
  STS: 'sts.png', GNG: 'gng.png', NVJ: 'nvj.png', RB: 'rb.png',
}

interface Column {
  key: string
  label: string
  getValue: (p: Player) => number
  format: (v: number) => string
  renderCell?: (p: Player) => ReactNode
  defaultAsc?: boolean
  invertColor?: boolean // true = lower value is better
}

const COLUMNS: Column[] = [
  { key: 'vlr', label: 'VLR', getValue: p => p.vlr_rating, format: v => v.toFixed(2) },
  { key: 'acs', label: 'ACS', getValue: p => p.acs_split, format: v => Math.round(v).toString() },
  { key: 'kd', label: 'K/D', getValue: p => p.kd, format: formatRatio },
  { key: 'adr', label: 'ADR', getValue: p => p.adr, format: v => v.toFixed(1) },
  { key: 'kast', label: 'KAST', getValue: p => p.kast, format: formatPct },
  { key: 'apr', label: 'APR', getValue: p => p.rounds > 0 ? p.assists / p.rounds : 0, format: v => v.toFixed(2) },
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

/** Compute mean and std for an array of numbers */

export default function Leaderboards() {
  const { data } = useStats()
  const { clDataOnly } = useFilter()
  const [sortKey, setSortKey] = useState('acs')
  const [sortAsc, setSortAsc] = useState(false)
  const [teamFilter, setTeamFilter] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [roleStats, setRoleStats] = useState(false)
  const [clExpanded, setClExpanded] = useState(false)
  const [opExpanded, setOpExpanded] = useState(false)
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set())

  const togglePlayerExpand = (ign: string) => {
    setExpandedPlayers(prev => {
      const next = new Set(prev)
      if (next.has(ign)) next.delete(ign)
      else next.add(ign)
      return next
    })
  }

  const tagMap = useMemo(() => {
    if (!data) return new Map<string, string>()
    return new Map(data.teams.map(t => [t.name, t.tag]))
  }, [data])

  // Build per-player agent breakdown lookup: ign → AgentPlayer[]
  const agentBreakdown = useMemo(() => {
    if (!data?.players_by_agent) return new Map<string, AgentPlayer[]>()
    const map = new Map<string, AgentPlayer[]>()
    for (const ap of data.players_by_agent) {
      const existing = map.get(ap.ign) ?? []
      existing.push(ap)
      map.set(ap.ign, existing)
    }
    // Sort each player's agents by rounds descending
    for (const [, agents] of map) {
      agents.sort((a, b) => b.rounds - a.rounds)
    }
    return map
  }, [data])

  // Pre-compute all values per column for percentile ranking (based on eligible players)
  const colValues = useMemo(() => {
    if (!data) return new Map<string, number[]>()
    const useRole = roleFilter && roleStats
    const source: Player[] = useRole
      ? (data.players_by_role ?? []).filter(p => (p as Player & { role?: string }).role === roleFilter)
      : data.players
    const eligible = source
      .filter(p => clDataOnly || p.rounds >= MIN_ROUNDS)
      .filter(p => !roleFilter || useRole || playerPlaysRole(p, roleFilter!))
    const map = new Map<string, number[]>()
    for (const c of COLUMNS) {
      map.set(c.key, eligible.map(p => c.getValue(p)))
    }
    return map
  }, [data, roleFilter, roleStats, clDataOnly])

  if (!data) return null

  const col = COLUMNS.find(c => c.key === sortKey) || COLUMNS[0]

  // Extra sort definitions for expanded CL sub-columns
  const extraSortGetters: Record<string, (p: Player) => number> = {
    cl_atmp: p => p.clutch_scens,
    cl_won: p => p.clutches,
    op_rnds: p => p.op_rounds,
    op_won: p => p.op_rounds_won,
    op_rw: p => p.op_rw_pct,
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
    .filter(p => clDataOnly || p.rounds >= MIN_ROUNDS)
    .filter(p => !roleFilter || useRoleData || playerPlaysRole(p, roleFilter))
    .sort((a, b) => {
      const va = sortGetter(a)
      const vb = sortGetter(b)
      return sortAsc ? va - vb : vb - va
    })

  const teams = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))

  const SortHeader = ({ label, sortId }: { label: string; sortId: string }) => (
    <span className="inline-flex items-center gap-1">
      <button
        onClick={() => handleSort(sortId)}
        className="hover:text-primary cursor-pointer transition-colors"
        title={`Sort by ${label}`}
      >
        {label}
      </button>
      <button
        onClick={() => handleSort(sortId)}
        className="inline-flex flex-col items-center leading-none text-[9px] hover:text-on-surface -my-1 transition-colors"
        title={`Sort by ${label}`}
      >
        <span className={sortKey === sortId && !sortAsc ? 'text-primary' : 'text-text-dim/40'}>▲</span>
        <span className={sortKey === sortId && sortAsc ? 'text-primary' : 'text-text-dim/40'}>▼</span>
      </button>
    </span>
  )

  return (
    <div className="p-6 space-y-6">
      {/* ── Filters ── */}
      <section className="flex items-center gap-6 bg-surface-container-low/40 rounded-2xl px-5 py-3 border border-white/5">
        <div className="flex items-center gap-2">
          <span className="scannable-label">Team:</span>
          <select
            value={teamFilter ?? ''}
            onChange={e => setTeamFilter(e.target.value || null)}
            className="bg-surface-container border border-white/10 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
          >
            <option value="">All Teams</option>
            {teams.map(t => (
              <option key={t.name} value={t.name}>{t.tag} — {t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="scannable-label">Role:</span>
          <select
            value={roleFilter ?? ''}
            onChange={e => setRoleFilter(e.target.value || null)}
            className="bg-surface-container border border-white/10 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
          >
            <option value="">All Roles</option>
            {ROLE_LIST.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {roleFilter && (
            <label className="flex items-center gap-1.5 ml-1 cursor-pointer">
              <input
                type="checkbox"
                checked={roleStats}
                onChange={e => setRoleStats(e.target.checked)}
                className="accent-primary"
              />
              <span className="text-on-surface text-xs">Role stats</span>
            </label>
          )}
        </div>
        {!clDataOnly && <span className="text-text-dim text-[10px] font-bold uppercase tracking-[0.15em]">Min {MIN_ROUNDS} rounds</span>}
      </section>

      {/* ── Leaderboard Table ── */}
      <section className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 flex flex-col">
        <div className="px-5 py-3 bg-surface-container-high/60 flex items-center gap-2 border-b border-white/5">
          <span className="material-symbols-outlined text-primary text-xl">leaderboard</span>
          <h3 className="font-headline font-bold text-sm tracking-tight uppercase">Player Leaderboard</h3>
          <span className="text-text-dim text-[10px] ml-2">{players.length} players</span>
        </div>
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left ghost-borders">
            <thead className="bg-surface-container/60 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 scannable-label text-center">#</th>
                <th className="px-3 py-2 scannable-label text-left">Player</th>
                <th className="px-3 py-2 scannable-label text-left">Team</th>
                <th className="px-2 py-2 scannable-label text-center">Agents</th>
                <th className="px-2 py-2 scannable-label text-center border-r border-white/10">Rnds</th>
                {COLUMNS.map(c => (
                  <Fragment key={c.key}>
                    <th className="px-2 py-2 scannable-label text-center select-none">
                      <SortHeader label={c.label} sortId={c.key} />
                      {c.key === 'cl' && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setClExpanded(v => !v) }}
                          className="ml-1 w-4 h-4 border border-white/10 rounded cursor-pointer text-text-dim hover:text-on-surface hover:border-white/20 transition-colors"
                          title={clExpanded ? 'Collapse ATMP & WON' : 'Expand ATMP & WON'}
                          style={{ display: 'inline-grid', placeItems: 'center', fontSize: '12px', fontWeight: 700, lineHeight: 1 }}
                        >
                          {clExpanded ? '−' : '+'}
                        </span>
                      )}
                      {c.key === 'op_pct' && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setOpExpanded(v => !v) }}
                          className="ml-1 w-4 h-4 border border-white/10 rounded cursor-pointer text-text-dim hover:text-on-surface hover:border-white/20 transition-colors"
                          title={opExpanded ? 'Collapse OP round stats' : 'Expand OP round stats'}
                          style={{ display: 'inline-grid', placeItems: 'center', fontSize: '12px', fontWeight: 700, lineHeight: 1 }}
                        >
                          {opExpanded ? '−' : '+'}
                        </span>
                      )}
                    </th>
                    {c.key === 'cl' && clExpanded && (
                      <>
                        <th className="px-2 py-2 scannable-label text-center select-none">
                          <SortHeader label="ATMP" sortId="cl_atmp" />
                        </th>
                        <th className="px-2 py-2 scannable-label text-center select-none">
                          <SortHeader label="WON" sortId="cl_won" />
                        </th>
                      </>
                    )}
                    {c.key === 'op_pct' && opExpanded && (
                      <>
                        <th className="px-2 py-2 scannable-label text-center select-none">
                          <SortHeader label="RNDS" sortId="op_rnds" />
                        </th>
                        <th className="px-2 py-2 scannable-label text-center select-none">
                          <SortHeader label="WON" sortId="op_won" />
                        </th>
                        <th className="px-2 py-2 scannable-label text-center select-none">
                          <SortHeader label="rW%" sortId="op_rw" />
                        </th>
                      </>
                    )}
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => {
                const dimmed = teamFilter && p.team !== teamFilter
                const top3agents = p.agents?.slice(0, 3) ?? []
                const tag = tagMap.get(p.team) ?? p.team
                const logo = TEAM_LOGOS[tag]
                const isExpanded = expandedPlayers.has(p.ign)
                const agentRows = agentBreakdown.get(p.ign) ?? []
                const hasAgents = agentRows.length > 0
                return (
                  <Fragment key={p.ign}>
                    <tr
                      className={`hover:bg-white/5 transition-colors border-t-[1.5px] border-outline-variant ${dimmed ? 'opacity-30' : ''}`}
                    >
                      <td className="px-3 py-2 text-center font-table text-xs text-text-dim">{i + 1}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {hasAgents && (
                            <button
                              onClick={() => togglePlayerExpand(p.ign)}
                              className="w-4 h-4 flex items-center justify-center text-text-dim hover:text-on-surface transition-colors shrink-0"
                              title={isExpanded ? 'Collapse agent breakdown' : 'Expand agent breakdown'}
                            >
                              <span className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                chevron_right
                              </span>
                            </button>
                          )}
                          <Link
                            to={`/player/${encodeURIComponent(p.ign)}`}
                            className="text-player-link hover:underline font-bold text-xs"
                          >
                            {p.ign}
                          </Link>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {logo && (
                            <img
                              src={`${import.meta.env.BASE_URL}logos/${logo}`}
                              alt={tag}
                              className="h-4 w-4 object-contain"
                            />
                          )}
                          <span className="font-medium text-on-surface text-xs">{tag}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="flex gap-0.5 justify-center">
                          {top3agents.map((a, j) => (
                            <AgentIcon key={j} agent={a.agent} size={16} />
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center font-table text-xs text-on-surface border-r border-white/10">{p.rounds}</td>
                      {COLUMNS.map(c => {
                        const val = c.getValue(p)
                        const allVals = colValues.get(c.key) ?? []
                        const pct = getPercentile(val, allVals, c.invertColor ?? false)
                        const bg = percentileToColor(pct)

                        return (
                          <Fragment key={c.key}>
                            <td
                              className="px-2 py-1.5 text-center font-table text-xs whitespace-nowrap text-on-surface"
                              style={{ backgroundColor: bg }}
                            >
                              {c.renderCell ? c.renderCell(p) : c.format(val)}
                            </td>
                            {c.key === 'cl' && clExpanded && (
                              <>
                                <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{p.clutch_scens}</td>
                                <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{p.clutches}</td>
                              </>
                            )}
                            {c.key === 'op_pct' && opExpanded && (
                              <>
                                <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{p.op_rounds}</td>
                                <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{p.op_rounds_won}</td>
                                <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{formatPct(p.op_rw_pct)}</td>
                              </>
                            )}
                          </Fragment>
                        )
                      })}
                    </tr>
                    {/* Agent breakdown sub-rows */}
                    {isExpanded && agentRows.map(ap => (
                      <tr
                        key={`${p.ign}-${ap.agent}`}
                        className=""
                      >
                        <td className="px-3 py-1.5" />
                        <td className="px-3 py-1.5 whitespace-nowrap" colSpan={2}>
                          <div className="flex items-center gap-2 pl-5">
                            <AgentIcon agent={ap.agent} size={18} />
                            <span className="text-on-surface text-xs font-medium">{ap.agent}</span>
                            <span className="text-text-dim text-[10px]">({ap.rounds} rnds)</span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5" />
                        <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface border-r border-white/10">{ap.rounds}</td>
                        {COLUMNS.map(c => {
                          const val = c.getValue(ap)
                          const allVals = colValues.get(c.key) ?? []
                          const pct = getPercentile(val, allVals, c.invertColor ?? false)
                          const bg = percentileToColor(pct)

                          return (
                            <Fragment key={c.key}>
                              <td
                                className="px-2 py-1.5 text-center font-table text-xs whitespace-nowrap text-on-surface"
                                style={{ backgroundColor: bg }}
                              >
                                {c.renderCell ? c.renderCell(ap) : c.format(val)}
                              </td>
                              {c.key === 'cl' && clExpanded && (
                                <>
                                  <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{ap.clutch_scens}</td>
                                  <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{ap.clutches}</td>
                                </>
                              )}
                              {c.key === 'op_pct' && opExpanded && (
                                <>
                                  <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{ap.op_rounds}</td>
                                  <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{ap.op_rounds_won}</td>
                                  <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{formatPct(ap.op_rw_pct)}</td>
                                </>
                              )}
                            </Fragment>
                          )
                        })}
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
