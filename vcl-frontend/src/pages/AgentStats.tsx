import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import AgentIcon from '../components/AgentIcon'
import type { AgentStat } from '../types'

const MIN_ROUNDS = 30

const AGENTS_WITH_STATS = ['Sova', 'Raze', 'Omen'] as const

const TEAM_LOGOS: Record<string, string> = {
  FKS: 'fks.png', SGE: 'sge.png', JL: 'jl.png', MDR: 'mdr.png',
  EP: 'ep.png', TL: 'tl.png', PXL: 'pxl.png', M1R: 'm1r.png',
  BAR: 'bar.png', UCAM: 'ucam.png', MISA: 'misa.png', S2G: 's2g.png',
  STS: 'sts.png', GNG: 'gng.png',
}

// Which slots can produce kills per agent
const DAMAGING_SLOTS: Record<string, Set<string>> = {
  Sova: new Set(['ability1', 'ultimate']),      // Shock Bolt, Hunter's Fury
  Raze: new Set(['grenade', 'ability2', 'ultimate']), // Boom Bot, Paint Shells, Showstopper
  Omen: new Set([]),                             // No damaging abilities
}

interface Column {
  key: string
  label: string
  getValue: (p: AgentStat) => number
  format: (v: number) => string
  defaultAsc?: boolean
  invertColor?: boolean
}

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

function percentileToColor(pct: number): string {
  if (pct <= 0.5) {
    const t = pct / 0.5
    const h = Math.round(0 + 120 * t)
    const s = Math.round(55 - 15 * t + 15 * t)
    const l = Math.round(65 + 18 * t)
    return `hsl(${h}, ${s}%, ${l}%)`
  } else {
    const t = (pct - 0.5) / 0.5
    const h = Math.round(120 + 150 * t)
    const s = Math.round(55 - 15 * t + 15 * t)
    const l = Math.round(83 - 8 * t)
    return `hsl(${h}, ${s}%, ${l}%)`
  }
}

export default function AgentStats() {
  const { data } = useStats()
  const [agentFilter, setAgentFilter] = useState<string>('Sova')
  const [sortKey, setSortKey] = useState('casts_ability2_per_round')
  const [sortAsc, setSortAsc] = useState(false)

  const tagMap = useMemo(() => {
    if (!data) return new Map<string, string>()
    return new Map(data.teams.map(t => [t.name, t.tag]))
  }, [data])

  // Build columns dynamically based on selected agent
  const columns = useMemo((): Column[] => {
    if (!data) return []
    const abilityNames = data.ability_names[agentFilter]
    if (!abilityNames) return []
    const damaging = DAMAGING_SLOTS[agentFilter] ?? new Set()

    const cols: Column[] = []
    const slots = [
      { slot: 'grenade', name: abilityNames.grenade },
      { slot: 'ability1', name: abilityNames.ability1 },
      { slot: 'ability2', name: abilityNames.ability2 },
      { slot: 'ultimate', name: abilityNames.ultimate },
    ]

    for (const { slot, name } of slots) {
      cols.push({
        key: `casts_${slot}_per_round`,
        label: `${name} /r`,
        getValue: (p: AgentStat) => p[`casts_${slot}_per_round` as keyof AgentStat] as number ?? 0,
        format: v => v.toFixed(3),
      })
      if (damaging.has(slot)) {
        cols.push({
          key: `kills_${slot}`,
          label: `${name} Kills`,
          getValue: (p: AgentStat) => p[`kills_${slot}` as keyof AgentStat] as number ?? 0,
          format: v => v.toString(),
        })
      }
    }
    return cols
  }, [data, agentFilter])

  // Filtered players for selected agent
  const players = useMemo(() => {
    if (!data) return []
    return data.agent_stats
      .filter(p => p.agent === agentFilter && p.rounds >= MIN_ROUNDS)
      .sort((a, b) => {
        const col = columns.find(c => c.key === sortKey)
        if (!col) return 0
        const va = col.getValue(a)
        const vb = col.getValue(b)
        return sortAsc ? va - vb : vb - va
      })
  }, [data, agentFilter, sortKey, sortAsc, columns])

  // Percentile values per column
  const colValues = useMemo(() => {
    const map = new Map<string, number[]>()
    for (const c of columns) {
      map.set(c.key, players.map(p => c.getValue(p)))
    }
    return map
  }, [columns, players])

  if (!data) return null

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortAsc(prev => !prev)
    } else {
      const col = columns.find(c => c.key === key)
      setSortKey(key)
      setSortAsc(col?.defaultAsc ?? false)
    }
  }

  // Reset sort when agent changes to first meaningful column
  const handleAgentChange = (agent: string) => {
    setAgentFilter(agent)
    // Default sort: first casts/r column
    const abilityNames = data.ability_names[agent]
    if (abilityNames) {
      setSortKey('casts_ability2_per_round')
      setSortAsc(false)
    }
  }

  const thBase = 'px-2 py-1.5 text-black font-medium whitespace-nowrap'
  const tdBase = 'px-2 py-1 font-table text-black whitespace-nowrap'

  return (
    <div className="p-4">
      {/* Filters */}
      <div className="mb-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-xs uppercase tracking-wider">Agent:</span>
          <select
            value={agentFilter}
            onChange={e => handleAgentChange(e.target.value)}
            className="bg-card border border-border rounded px-2 py-1 text-sm text-text focus:outline-none focus:border-primary"
          >
            {AGENTS_WITH_STATS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <span className="text-text-dim text-xs">Min {MIN_ROUNDS} rounds on agent</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm [&_td]:border-y-[1.5px] [&_td]:border-border [&_th]:border-y-[1.5px] [&_th]:border-border">
          <thead>
            <tr className="bg-nav">
              <th className={`${thBase} text-left`}>#</th>
              <th className={`${thBase} text-left`}>Player</th>
              <th className={`${thBase} text-left`}>Team</th>
              <th className={`${thBase} text-right border-r-[3px] !border-r-black`}>Rnds</th>
              {columns.map(c => (
                <th key={c.key} className={`${thBase} text-right select-none`}>
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
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => {
              const tag = tagMap.get(p.team) ?? p.team
              const logo = TEAM_LOGOS[tag]
              return (
                <tr key={`${p.ign}-${p.team}`} className="hover:bg-card/50">
                  <td className={tdBase}>{i + 1}</td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <AgentIcon agent={agentFilter} size={18} />
                      <Link
                        to={`/player/${encodeURIComponent(p.ign)}`}
                        className="text-player-link hover:underline font-medium"
                      >
                        {p.ign}
                      </Link>
                    </div>
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {logo && (
                        <img
                          src={`${import.meta.env.BASE_URL}logos/${logo}`}
                          alt={tag}
                          className="h-4 w-4 object-contain"
                        />
                      )}
                      <span className="font-medium text-black text-sm">{tag}</span>
                    </div>
                  </td>
                  <td className={`${tdBase} text-right border-r-[3px] !border-r-black`}>{p.rounds}</td>
                  {columns.map(c => {
                    const val = c.getValue(p)
                    const allVals = colValues.get(c.key) ?? []
                    const pct = getPercentile(val, allVals, c.invertColor ?? false)
                    const bg = percentileToColor(pct)
                    return (
                      <td
                        key={c.key}
                        className={`${tdBase} text-right`}
                        style={{ backgroundColor: bg }}
                      >
                        {c.format(val)}
                      </td>
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
