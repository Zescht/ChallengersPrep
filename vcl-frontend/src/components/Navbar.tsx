import { useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import { useTheme } from '../context/ThemeContext'
import { useFilter } from '../context/FilterContext'
import SearchBar from './SearchBar'

export default function Navbar() {
  const { data } = useStats()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { playoffOnly, clDataOnly, setPlayoffOnly, setClDataOnly } = useFilter()

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
    `px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors ${
      active
        ? 'bg-primary/10 text-primary'
        : 'text-on-surface hover:bg-white/5'
    }`

  return (
    <nav className="bg-surface-dim/50 backdrop-blur-md border-b border-white/5 px-6 h-14 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-10">
        <span className="font-headline font-black text-lg tracking-tight text-on-surface uppercase">
          VCL <span className="text-primary">Stats</span>
        </span>
        <div className="flex gap-1">
          {tabs.slice(0, 1).map(tab => (
            <NavLink key={tab.label} to={tab.path} className={tabClass(tab.active)}>
              {tab.label}
            </NavLink>
          ))}

          {/* Leaderboards with hover dropdown */}
          <div
            className="relative flex items-center"
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
              <div className="absolute top-full left-0 mt-1 bg-surface-container-high border border-white/10 rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.4)] z-50 min-w-[140px] overflow-hidden">
                <NavLink
                  to="/leaderboards/agents"
                  onClick={() => setDropdownOpen(false)}
                  className={`block px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    location.pathname === '/leaderboards/agents'
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface hover:bg-white/5'
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
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPlayoffOnly(!playoffOnly)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors ${
            playoffOnly
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'text-on-surface hover:bg-white/5'
          }`}
          title="Show only playoff teams"
        >
          Playoff-Teams
        </button>
        <button
          onClick={() => setClDataOnly(!clDataOnly)}
          disabled={!playoffOnly}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors ${
            clDataOnly
              ? 'bg-primary/20 text-primary border border-primary/30'
              : playoffOnly
                ? 'text-on-surface hover:bg-white/5'
                : 'text-on-surface/30 cursor-not-allowed'
          }`}
          title={playoffOnly ? 'Show only Challengers playoff data' : 'Enable Playoff-Teams first'}
        >
          CL Data Only
        </button>
        <SearchBar />
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-dim hover:text-on-surface hover:bg-white/5 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="material-symbols-outlined text-lg">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>
    </nav>
  )
}
