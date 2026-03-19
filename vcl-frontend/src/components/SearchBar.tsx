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
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setSelectedIndex(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search teams or players..."
        className="bg-card border border-border rounded px-3 py-1.5 text-sm text-text placeholder-text-dim w-64 focus:outline-none focus:border-primary"
      />
      {open && allResults.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-full bg-card border border-border rounded shadow-lg z-50 max-h-80 overflow-y-auto">
          {teamResults.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs text-text-muted uppercase tracking-wider">Teams</div>
              {teamResults.map((t, i) => (
                <button
                  key={t.name}
                  className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-border ${selectedIndex === i ? 'bg-border' : ''}`}
                  onClick={() => { navigate(`/team/${encodeURIComponent(t.name)}`); setQuery(''); setOpen(false) }}
                >
                  {t.name}
                </button>
              ))}
            </>
          )}
          {playerResults.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs text-text-muted uppercase tracking-wider">Players</div>
              {playerResults.map((p, j) => {
                const idx = teamResults.length + j
                return (
                  <button
                    key={p.ign}
                    className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-border ${selectedIndex === idx ? 'bg-border' : ''}`}
                    onClick={() => { navigate(`/player/${encodeURIComponent(p.ign)}`); setQuery(''); setOpen(false) }}
                  >
                    {p.ign} <span className="text-text-muted">— {p.team}</span>
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
