import { useNavigate } from 'react-router-dom'
import { useStats } from '../context/StatsContext'

interface TeamSelectorProps {
  currentTeam: string
}

export default function TeamSelector({ currentTeam }: TeamSelectorProps) {
  const { data } = useStats()
  const navigate = useNavigate()

  if (!data) return null
  const sorted = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <select
      value={currentTeam}
      onChange={e => navigate(`/team/${encodeURIComponent(e.target.value)}`)}
      className="bg-card border border-border rounded px-3 py-1.5 text-lg font-semibold text-text focus:outline-none focus:border-primary"
    >
      {sorted.map(t => (
        <option key={t.name} value={t.name}>{t.name}</option>
      ))}
    </select>
  )
}
