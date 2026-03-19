import { StatsProvider, useStats } from './context/StatsContext'

function Dashboard() {
  const { data, loading, error } = useStats()
  if (loading) return <div className="p-8 text-text-muted">Loading stats...</div>
  if (error) return <div className="p-8 text-danger">Error: {error}</div>
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">VCL Stats Dashboard</h1>
      <p className="text-text-muted mt-2">
        Loaded {data!.teams.length} teams, {data!.players.length} players, {data!.matches.length} matches
      </p>
    </div>
  )
}

export default function App() {
  return (
    <StatsProvider>
      <div className="min-h-screen bg-surface text-text">
        <Dashboard />
      </div>
    </StatsProvider>
  )
}
