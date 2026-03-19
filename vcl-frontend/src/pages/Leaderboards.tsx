import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import { formatRatio, formatCount, formatPct } from '../utils/format'

const TABS = [
  { key: 'acs', label: 'ACS', format: formatCount },
  { key: 'kills', label: 'Kills', format: formatCount },
  { key: 'deaths', label: 'Deaths', format: formatCount },
  { key: 'assists', label: 'Assists', format: formatCount },
  { key: 'kd', label: 'K/D', format: formatRatio },
  { key: 'kast', label: 'KAST', format: formatPct },
  { key: 'fk', label: 'FK', format: formatCount },
  { key: 'fd', label: 'FD', format: formatCount },
  { key: 'fk_pct', label: 'FK%', format: formatPct },
  { key: 'fd_pct', label: 'FD%', format: formatPct },
  { key: 'cl_pct', label: 'CL%', format: formatPct },
]

export default function Leaderboards() {
  const { data } = useStats()
  const [activeTab, setActiveTab] = useState('acs')
  const [teamFilter, setTeamFilter] = useState<string | null>(null)

  if (!data) return null

  const tabDef = TABS.find(t => t.key === activeTab) || TABS[0]
  const lb = data.leaderboards[activeTab]
  if (!lb) return <div className="p-4 text-danger">No leaderboard data for "{activeTab}".</div>

  const teams = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="p-4">
      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary/20 text-primary'
                : 'text-text-muted hover:text-text hover:bg-card'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
      </div>

      {/* Table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-nav border-b border-border">
            <th className="px-2 py-1.5 text-left text-text-muted font-medium w-12">#</th>
            <th className="px-2 py-1.5 text-left text-text-muted font-medium">Player</th>
            <th className="px-2 py-1.5 text-left text-text-muted font-medium">Team</th>
            <th className="px-2 py-1.5 text-right text-text-muted font-medium">{tabDef.label}</th>
            <th className="px-2 py-1.5 text-right text-text-muted font-medium">Rounds</th>
          </tr>
        </thead>
        <tbody>
          {lb.entries.map(entry => {
            const dimmed = teamFilter && entry.team !== teamFilter
            return (
              <tr
                key={entry.ign}
                className={`border-b border-border hover:bg-card/50 ${dimmed ? 'opacity-30' : ''}`}
              >
                <td className="px-2 py-1 text-text-muted font-mono">{entry.rank}</td>
                <td className="px-2 py-1">
                  <Link
                    to={`/player/${encodeURIComponent(entry.ign)}`}
                    className="text-primary hover:underline"
                  >
                    {entry.ign}
                  </Link>
                </td>
                <td className="px-2 py-1 text-text-muted">{entry.team}</td>
                <td className="px-2 py-1 text-right font-mono">{tabDef.format(entry.value)}</td>
                <td className="px-2 py-1 text-right font-mono text-text-dim">{entry.rounds}</td>
              </tr>
            )
          })}
          {/* Tournament Average Row */}
          <tr className="bg-primary/10 border-t-2 border-primary/30">
            <td className="px-2 py-1.5"></td>
            <td className="px-2 py-1.5 font-semibold text-primary" colSpan={2}>Tournament Average</td>
            <td className="px-2 py-1.5 text-right font-mono font-semibold text-primary">{tabDef.format(lb.tournament_avg)}</td>
            <td className="px-2 py-1.5"></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
