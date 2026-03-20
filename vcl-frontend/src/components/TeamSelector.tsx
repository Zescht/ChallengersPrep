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
      className="bg-surface-container-highest/50 border border-white/10 rounded-lg px-4 py-2 text-on-surface font-headline font-bold text-lg tracking-tight focus:outline-none focus:ring-1 focus:ring-primary/40"
    >
      {sorted.map(t => (
        <option key={t.name} value={t.name}>{t.name}</option>
      ))}
    </select>
  )
}
