import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StatsProvider, useStats } from './context/StatsContext'
import Navbar from './components/Navbar'

// Placeholder pages — will be replaced in later tasks
function TeamOverview() { return <div className="p-4">Team Overview (TODO)</div> }
function PlayerProfile() { return <div className="p-4">Player Profile (TODO)</div> }
function Leaderboards() { return <div className="p-4">Leaderboards (TODO)</div> }
function Versus() { return <div className="p-4">Versus (TODO)</div> }
function MatchHistory() { return <div className="p-4">Match History (TODO)</div> }

function AppRoutes() {
  const { data, loading, error } = useStats()

  if (loading) return <div className="p-8 text-text-muted">Loading stats...</div>
  if (error) return <div className="p-8 text-danger">Error: {error}</div>
  if (!data) return null

  const savedTeam = (() => { try { return localStorage.getItem('vcl-last-team') } catch { return null } })()
  const firstTeam = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))[0]?.name
  const defaultTeam = savedTeam && data.teams.find(t => t.name === savedTeam) ? savedTeam : firstTeam

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to={`/team/${encodeURIComponent(defaultTeam)}`} replace />} />
          <Route path="/team/:name" element={<TeamOverview />} />
          <Route path="/player/:ign" element={<PlayerProfile />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/versus" element={<Versus />} />
          <Route path="/team/:name/history" element={<MatchHistory />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <StatsProvider>
        <div className="min-h-screen bg-surface text-text">
          <AppRoutes />
        </div>
      </StatsProvider>
    </HashRouter>
  )
}
