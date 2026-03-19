import { NavLink, useLocation } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import SearchBar from './SearchBar'

export default function Navbar() {
  const { data } = useStats()
  const location = useLocation()

  const firstTeam = data?.teams
    ? [...data.teams].sort((a, b) => a.name.localeCompare(b.name))[0]?.name
    : null

  const savedTeam = (() => { try { return localStorage.getItem('vcl-last-team') } catch { return null } })()
  const defaultTeam = savedTeam && data?.teams.find(t => t.name === savedTeam) ? savedTeam : firstTeam

  const isTeamsActive = location.pathname.startsWith('/team/') && !location.pathname.endsWith('/history')
  const isHistoryActive = location.pathname.endsWith('/history')

  const tabs = [
    { label: 'Teams', path: defaultTeam ? `/team/${encodeURIComponent(defaultTeam)}` : '/team', active: isTeamsActive },
    { label: 'Leaderboards', path: '/leaderboards', active: location.pathname === '/leaderboards' },
    { label: 'Versus', path: '/versus', active: location.pathname === '/versus' },
    { label: 'History', path: defaultTeam ? `/team/${encodeURIComponent(defaultTeam)}/history` : '/history', active: isHistoryActive },
  ]

  return (
    <nav className="bg-nav border-b border-border px-4 h-12 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <span className="font-bold text-primary tracking-wide text-lg">VCL STATS</span>
        <div className="flex gap-1">
          {tabs.map(tab => (
            <NavLink
              key={tab.label}
              to={tab.path}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                tab.active
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-muted hover:text-text hover:bg-card'
              }`}
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>
      <SearchBar />
    </nav>
  )
}
