import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import { formatRatio, formatCount, formatPct } from '../utils/format'
import type { Player } from '../types'

const MIN_ROUNDS = 100

interface Column {
  key: string
  label: string
  getValue: (p: Player) => number
  format: (v: number) => string
  ascending?: boolean // true = lower is better (deaths, FD)
}

const COLUMNS: Column[] = [
  { key: 'acs', label: 'ACS', getValue: p => p.acs_split, format: formatCount },
  { key: 'kills', label: 'Kills', getValue: p => p.kills, format: formatCount },
  { key: 'deaths', label: 'Deaths', getValue: p => p.deaths, format: formatCount, ascending: true },
  { key: 'assists', label: 'Assists', getValue: p => p.assists, format: formatCount },
  { key: 'kd', label: 'K/D', getValue: p => p.kd, format: formatRatio },
  { key: 'kad', label: 'KA/D', getValue: p => p.kad, format: formatRatio },
  { key: 'kast', label: 'KAST', getValue: p => p.kast, format: formatPct },
  { key: 'fk', label: 'FK', getValue: p => p.fk, format: formatCount },
  { key: 'fd', label: 'FD', getValue: p => p.fd, format: formatCount, ascending: true },
  { key: 'fk_pct', label: 'FK%', getValue: p => p.fk_pct, format: formatPct },
  { key: 'fd_pct', label: 'FD%', getValue: p => p.fd_pct, format: formatPct, ascending: true },
  { key: 'cl_pct', label: 'CL%', getValue: p => p.clutch_pct, format: formatPct },
  { key: 'awp_pct', label: 'AWP%', getValue: p => p.awp_pct, format: formatPct },
]

export default function Leaderboards() {
  const { data } = useStats()
  const [sortKey, setSortKey] = useState('acs')
  const [teamFilter, setTeamFilter] = useState<string | null>(null)

  if (!data) return null

  const col = COLUMNS.find(c => c.key === sortKey) || COLUMNS[0]

  // Filter players by minimum rounds, then sort
  const players = data.players
    .filter(p => p.rounds >= MIN_ROUNDS)
    .sort((a, b) => {
      const va = col.getValue(a)
      const vb = col.getValue(b)
      return col.ascending ? va - vb : vb - va
    })

  const teams = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="p-4">
      {/* Team Filter */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-text-muted text-xs uppercase tracking-wider">Filter:</span>
        <select
          value={teamFilter ?? ''}
          onChange={e => setTeamFilter(e.target.value || null)}
          className="bg-card border border-border rounded px-2 py-1 text-sm text-text focus:outline-none focus:border-primary"
        >
          <option value="">All Teams</option>
          {teams.map(t => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
        </select>
        <span className="text-text-dim text-xs ml-2">Min {MIN_ROUNDS} rounds</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-nav border-b border-border">
              <th className="px-2 py-1.5 text-left text-black font-medium w-10">#</th>
              <th className="px-2 py-1.5 text-left text-black font-medium">Player</th>
              <th className="px-2 py-1.5 text-left text-black font-medium">Team</th>
              <th className="px-2 py-1.5 text-right text-black font-medium">Rnds</th>
              {COLUMNS.map(c => (
                <th
                  key={c.key}
                  onClick={() => setSortKey(c.key)}
                  className="px-2 py-1.5 text-right text-black font-medium cursor-pointer select-none whitespace-nowrap hover:bg-card/50"
                >
                  {c.label}
                  {sortKey === c.key && (
                    <span className="ml-0.5 text-xs">{c.ascending ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => {
              const dimmed = teamFilter && p.team !== teamFilter
              return (
                <tr
                  key={p.ign}
                  className={`border-b border-border hover:bg-card/50 ${dimmed ? 'opacity-30' : ''}`}
                >
                  <td className="px-2 py-1 text-black font-mono">{i + 1}</td>
                  <td className="px-2 py-1">
                    <Link
                      to={`/player/${encodeURIComponent(p.ign)}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {p.ign}
                    </Link>
                  </td>
                  <td className="px-2 py-1 text-black">{p.team}</td>
                  <td className="px-2 py-1 text-right font-mono text-black">{p.rounds}</td>
                  {COLUMNS.map(c => (
                    <td
                      key={c.key}
                      className="px-2 py-1 text-right font-mono text-black"
                    >
                      {c.format(c.getValue(p))}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
