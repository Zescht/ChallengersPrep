import { useNavigate } from 'react-router-dom'
import { useStats } from '../context/StatsContext'

interface PlayerSelectorProps {
  currentIgn: string
}

export default function PlayerSelector({ currentIgn }: PlayerSelectorProps) {
  const { data } = useStats()
  const navigate = useNavigate()

  if (!data) return null

  // Group players by team, teams sorted alphabetically
  const teams = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))
  const playersByTeam = new Map<string, string[]>()
  for (const t of teams) {
    const players = data.players
      .filter(p => p.team === t.name)
      .map(p => p.ign)
      .sort()
    if (players.length > 0) playersByTeam.set(t.name, players)
  }

  return (
    <select
      value={currentIgn}
      onChange={e => navigate(`/player/${encodeURIComponent(e.target.value)}`)}
      className="bg-card border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none focus:border-primary"
    >
      {[...playersByTeam.entries()].map(([team, players]) => (
        <optgroup key={team} label={team}>
          {players.map(ign => (
            <option key={ign} value={ign}>{ign}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
