import { useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import SearchBar from './SearchBar'

export default function Navbar() {
  const { data } = useStats()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const firstTeam = data?.teams
    ? [...data.teams].sort((a, b) => a.name.localeCompare(b.name))[0]?.name
    : null

  const savedTeam = (() => { try { return localStorage.getItem('vcl-last-team') } catch { return null } })()
  const defaultTeam = savedTeam && data?.teams.find(t => t.name === savedTeam) ? savedTeam : firstTeam

  const isTeamsActive = location.pathname.startsWith('/team/') && !location.pathname.endsWith('/history')
  const isHistoryActive = location.pathname.endsWith('/history')
  const isLeaderboardsActive = location.pathname.startsWith('/leaderboards')

  const tabs = [
    { label: 'Teams', path: defaultTeam ? `/team/${encodeURIComponent(defaultTeam)}` : '/team', active: isTeamsActive },
    { label: 'Versus', path: '/versus', active: location.pathname === '/versus' },
    { label: 'History', path: defaultTeam ? `/team/${encodeURIComponent(defaultTeam)}/history` : '/history', active: isHistoryActive },
  ]

  const openDropdown = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    hoverTimeout.current = setTimeout(() => setDropdownOpen(true), 200)
  }

  const closeDropdown = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    hoverTimeout.current = setTimeout(() => setDropdownOpen(false), 150)
  }

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
      active
        ? 'bg-primary/20 text-primary'
        : 'text-text-muted hover:text-text hover:bg-card'
    }`

  return (
    <nav className="bg-nav border-b border-border px-4 h-12 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <span className="font-bold text-primary tracking-wide text-lg">VCL STATS</span>
        <div className="flex gap-1">
          {tabs.slice(0, 1).map(tab => (
            <NavLink key={tab.label} to={tab.path} className={tabClass(tab.active)}>
              {tab.label}
            </NavLink>
          ))}

          {/* Leaderboards with hover dropdown */}
          <div
            className="relative"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <NavLink
              to="/leaderboards"
              className={tabClass(isLeaderboardsActive)}
            >
              Leaderboards
            </NavLink>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-0.5 bg-nav border border-border rounded shadow-lg z-50 min-w-[140px]">
                <NavLink
                  to="/leaderboards/agents"
                  onClick={() => setDropdownOpen(false)}
                  className={`block px-3 py-1.5 text-sm font-medium transition-colors ${
                    location.pathname === '/leaderboards/agents'
                      ? 'bg-primary/20 text-primary'
                      : 'text-text-muted hover:text-text hover:bg-card'
                  }`}
                >
                  Agent Stats
                </NavLink>
              </div>
            )}
          </div>

          {tabs.slice(1).map(tab => (
            <NavLink key={tab.label} to={tab.path} className={tabClass(tab.active)}>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>
      <SearchBar />
    </nav>
  )
}
