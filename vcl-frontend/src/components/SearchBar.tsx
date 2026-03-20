import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStats } from '../context/StatsContext'

export default function SearchBar() {
  const { data } = useStats()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!data) return null

  const q = query.toLowerCase().trim()
  const teamResults = q.length >= 2
    ? data.teams.filter(t => t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q))
    : []
  const playerResults = q.length >= 2
    ? data.players.filter(p => p.ign.toLowerCase().includes(q))
    : []
  const allResults = [
    ...teamResults.map(t => ({ type: 'team' as const, label: t.name, path: `/team/${encodeURIComponent(t.name)}` })),
    ...playerResults.map(p => ({ type: 'player' as const, label: `${p.ign} — ${p.team}`, path: `/player/${encodeURIComponent(p.ign)}` })),
  ]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      navigate(allResults[selectedIndex].path)
      setQuery('')
      setOpen(false)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setSelectedIndex(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search parameters..."
        className="bg-surface-container-highest/50 border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-xs text-on-surface placeholder-text-dim w-64 focus:outline-none focus:ring-1 focus:ring-tertiary transition-all"
      />
      {open && allResults.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-full bg-surface-container-high border border-white/10 rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.4)] z-50 max-h-80 overflow-y-auto">
          {teamResults.length > 0 && (
            <>
              <div className="px-3 py-1.5 scannable-label text-text-dim">Teams</div>
              {teamResults.map((t, i) => (
                <button
                  key={t.name}
                  className={`block w-full text-left px-3 py-1.5 text-xs text-on-surface transition-colors ${selectedIndex === i ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  onClick={() => { navigate(`/team/${encodeURIComponent(t.name)}`); setQuery(''); setOpen(false) }}
                >
                  {t.name}
                </button>
              ))}
            </>
          )}
          {playerResults.length > 0 && (
            <>
              <div className="px-3 py-1.5 scannable-label text-text-dim">Players</div>
              {playerResults.map((p, j) => {
                const idx = teamResults.length + j
                return (
                  <button
                    key={p.ign}
                    className={`block w-full text-left px-3 py-1.5 text-xs text-on-surface transition-colors ${selectedIndex === idx ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    onClick={() => { navigate(`/player/${encodeURIComponent(p.ign)}`); setQuery(''); setOpen(false) }}
                  >
                    {p.ign} <span className="text-text-dim">— {p.team}</span>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
