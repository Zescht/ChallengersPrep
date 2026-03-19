import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import AgentIcon from '../components/AgentIcon'
import FormStrip from '../components/FormStrip'
import XvYMatrix from '../components/XvYMatrix'
import { formatPct, formatRatio, formatCount } from '../utils/format'
import type { Team, Player, StatsData, Match } from '../types'

type Mode = 'team' | 'player'

export default function Versus() {
  const { data, averages } = useStats()
  const [mode, setMode] = useState<Mode>('team')
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')
  const [playerA, setPlayerA] = useState('')
  const [playerB, setPlayerB] = useState('')

  if (!data || !averages) return null

  const teams = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))
  const sortedPlayers = [...data.players].sort((a, b) => a.ign.localeCompare(b.ign))

  // Resolve effective selections (fall back to first entries if state is empty)
  const effTeamA = teamA || teams[0]?.name || ''
  const effTeamB = teamB || (teams.find(t => t.name !== effTeamA)?.name ?? '')
  const effPlayerA = playerA || sortedPlayers[0]?.ign || ''
  const effPlayerB = playerB || (sortedPlayers.find(p => p.ign !== effPlayerA)?.ign ?? '')

  return (
    <div className="p-4">
      {/* Mode Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setMode('team')}
          className={`px-3 py-1.5 rounded text-sm font-medium ${mode === 'team' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text hover:bg-card'}`}
        >
          Team vs Team
        </button>
        <button
          onClick={() => setMode('player')}
          className={`px-3 py-1.5 rounded text-sm font-medium ${mode === 'player' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text hover:bg-card'}`}
        >
          Player vs Player
        </button>
      </div>

      {mode === 'team' ? (
        <TeamVsTeam
          teams={teams}
          teamAName={effTeamA}
          teamBName={effTeamB}
          onChangeA={setTeamA}
          onChangeB={setTeamB}
          data={data}
        />
      ) : (
        <PlayerVsPlayer
          playerAIgn={effPlayerA}
          playerBIgn={effPlayerB}
          onChangeA={setPlayerA}
          onChangeB={setPlayerB}
          data={data}
        />
      )}
    </div>
  )
}

/* ─── Team vs Team ─── */

function TeamVsTeam({ teams, teamAName, teamBName, onChangeA, onChangeB, data }: {
  teams: Team[]
  teamAName: string
  teamBName: string
  onChangeA: (v: string) => void
  onChangeB: (v: string) => void
  data: StatsData
}) {
  const tA = data.teams.find(t => t.name === teamAName)
  const tB = data.teams.find(t => t.name === teamBName)

  return (
    <div>
      {/* Selectors */}
      <div className="flex items-center gap-3 mb-4">
        <TeamDropdown teams={teams} value={teamAName} onChange={onChangeA} exclude={teamBName} />
        <span className="text-text-muted font-bold text-lg">vs</span>
        <TeamDropdown teams={teams} value={teamBName} onChange={onChangeB} exclude={teamAName} />
      </div>

      {tA && tB && (
        <div className="space-y-6">
          {/* Overall Record + Form */}
          <div className="grid grid-cols-2 gap-4">
            <TeamRecordCard team={tA} />
            <TeamRecordCard team={tB} />
          </div>

          {/* Head-to-Head History */}
          <HeadToHead teamA={tA} teamB={tB} matches={data.matches} />

          {/* Map Pool Comparison */}
          <MapPoolComparison teamA={tA} teamB={tB} />

          {/* Economy Comparison */}
          <EconomyComparison teamA={tA} teamB={tB} />

          {/* Post-Plant & Retakes */}
          <PostPlantComparison teamA={tA} teamB={tB} />

          {/* Player Roster Comparison */}
          <RosterComparison teamA={tA} teamB={tB} players={data.players} />

          {/* XvY Side by Side */}
          <div>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">XvY Clutch Situations</h3>
            <div className="flex gap-4 flex-wrap">
              <XvYMatrix title={`${tA.tag} XvY`} entries={tA.xvy} mode="absolute" />
              <XvYMatrix title={`${tB.tag} XvY`} entries={tB.xvy} mode="absolute" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TeamDropdown({ teams, value, onChange, exclude }: {
  teams: Team[]
  value: string
  onChange: (v: string) => void
  exclude: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-card border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none focus:border-primary"
    >
      {teams.map(t => (
        <option key={t.name} value={t.name} disabled={t.name === exclude}>{t.name}</option>
      ))}
    </select>
  )
}

function TeamRecordCard({ team }: { team: Team }) {
  return (
    <div className="bg-card border border-border rounded p-3">
      <div className="font-semibold mb-1">{team.name}</div>
      <div className="text-sm text-text-muted">
        Maps: {team.allMaps.wins}W – {team.allMaps.losses}L &middot;
        Series: {team.series_record.wins}W – {team.series_record.losses}L &middot;
        rW%: {formatPct(team.allMaps.rW_pct)}
      </div>
      <div className="mt-2">
        <FormStrip form={team.form} />
      </div>
    </div>
  )
}

function HeadToHead({ teamA, teamB, matches }: { teamA: Team; teamB: Team; matches: Match[] }) {
  const h2h = matches.filter(m =>
    (m.team1 === teamA.name && m.team2 === teamB.name) ||
    (m.team1 === teamB.name && m.team2 === teamA.name)
  ).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Head-to-Head History</h3>
      {h2h.length === 0 ? (
        <p className="text-text-dim text-sm">No previous meetings in dataset.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-nav border-b border-border">
              <th className="px-2 py-1 text-left text-text-muted font-medium">Date</th>
              <th className="px-2 py-1 text-left text-text-muted font-medium">Map</th>
              <th className="px-2 py-1 text-center text-text-muted font-medium">Score</th>
              <th className="px-2 py-1 text-left text-text-muted font-medium">Winner</th>
            </tr>
          </thead>
          <tbody>
            {h2h.map((m, i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-2 py-1 text-text-muted">{m.date}</td>
                <td className="px-2 py-1">{m.map}</td>
                <td className="px-2 py-1 text-center font-mono">{m.team1_score} – {m.team2_score}</td>
                <td className="px-2 py-1">
                  <span className={m.winner === teamA.name ? 'text-success' : 'text-danger'}>{m.winner}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function MapPoolComparison({ teamA, teamB }: { teamA: Team; teamB: Team }) {
  const allMaps = new Set([...teamA.maps.map(m => m.map), ...teamB.maps.map(m => m.map)])
  const sortedMaps = [...allMaps].sort()

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Map Pool</h3>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-nav border-b border-border">
            <th className="px-2 py-1 text-left text-text-muted font-medium" colSpan={3}>{teamA.tag}</th>
            <th className="px-2 py-1 text-center text-text-muted font-medium">Map</th>
            <th className="px-2 py-1 text-right text-text-muted font-medium" colSpan={3}>{teamB.tag}</th>
          </tr>
          <tr className="bg-nav/50 border-b border-border text-xs text-text-dim">
            <th className="px-2 py-0.5 text-left">Plays</th>
            <th className="px-2 py-0.5 text-left">W-L</th>
            <th className="px-2 py-0.5 text-left">rW%</th>
            <th></th>
            <th className="px-2 py-0.5 text-right">rW%</th>
            <th className="px-2 py-0.5 text-right">W-L</th>
            <th className="px-2 py-0.5 text-right">Plays</th>
          </tr>
        </thead>
        <tbody>
          {sortedMaps.map(mapName => {
            const mA = teamA.maps.find(m => m.map === mapName)
            const mB = teamB.maps.find(m => m.map === mapName)
            const aRW = mA?.rW_pct ?? 0
            const bRW = mB?.rW_pct ?? 0
            const edge = aRW > bRW ? 'A' : bRW > aRW ? 'B' : null
            return (
              <tr key={mapName} className="border-b border-border">
                <td className="px-2 py-1 font-mono">{mA?.plays ?? '-'}</td>
                <td className="px-2 py-1 font-mono">{mA ? `${mA.wins}-${mA.losses}` : '-'}</td>
                <td className={`px-2 py-1 font-mono ${edge === 'A' ? 'text-success font-semibold' : ''}`}>
                  {mA ? formatPct(mA.rW_pct) : '-'}
                </td>
                <td className="px-2 py-1 text-center font-medium">{mapName}</td>
                <td className={`px-2 py-1 text-right font-mono ${edge === 'B' ? 'text-success font-semibold' : ''}`}>
                  {mB ? formatPct(mB.rW_pct) : '-'}
                </td>
                <td className="px-2 py-1 text-right font-mono">{mB ? `${mB.wins}-${mB.losses}` : '-'}</td>
                <td className="px-2 py-1 text-right font-mono">{mB?.plays ?? '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EconomyComparison({ teamA, teamB }: { teamA: Team; teamB: Team }) {
  const categories = [
    { label: 'Pistol', key: 'pistol_rW_pct' as const },
    { label: 'Gun', key: 'gun_rW_pct' as const },
    { label: 'Anti-Eco', key: 'antieco_rW_pct' as const },
    { label: 'Eco', key: 'eco_rW_pct' as const },
  ]

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Economy</h3>
      <table className="border-collapse text-sm">
        <thead>
          <tr className="bg-nav border-b border-border">
            <th className="px-3 py-1 text-right text-text-muted font-medium w-24">{teamA.tag}</th>
            <th className="px-3 py-1 text-center text-text-muted font-medium">Category</th>
            <th className="px-3 py-1 text-left text-text-muted font-medium w-24">{teamB.tag}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => {
            const aVal = (teamA.allMaps as any)[cat.key] as number
            const bVal = (teamB.allMaps as any)[cat.key] as number
            const aHigher = aVal > bVal
            const bHigher = bVal > aVal
            return (
              <tr key={cat.key} className="border-b border-border">
                <td className={`px-3 py-1 text-right font-mono ${aHigher ? 'text-success font-semibold' : ''}`}>
                  {formatPct(aVal)}
                </td>
                <td className="px-3 py-1 text-center text-text-muted">{cat.label}</td>
                <td className={`px-3 py-1 text-left font-mono ${bHigher ? 'text-success font-semibold' : ''}`}>
                  {formatPct(bVal)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PostPlantComparison({ teamA, teamB }: { teamA: Team; teamB: Team }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Post-Plant & Retakes</h3>
      <table className="border-collapse text-sm">
        <thead>
          <tr className="bg-nav border-b border-border">
            <th className="px-3 py-1 text-right text-text-muted font-medium">{teamA.tag}</th>
            <th className="px-3 py-1 text-center text-text-muted font-medium">Rank</th>
            <th className="px-3 py-1 text-center text-text-muted font-medium">Stat</th>
            <th className="px-3 py-1 text-center text-text-muted font-medium">Rank</th>
            <th className="px-3 py-1 text-left text-text-muted font-medium">{teamB.tag}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className={`px-3 py-1 text-right font-mono ${teamA.allMaps.post_rW_pct > teamB.allMaps.post_rW_pct ? 'text-success font-semibold' : ''}`}>
              {formatPct(teamA.allMaps.post_rW_pct)}
            </td>
            <td className="px-3 py-1 text-center text-text-muted">#{teamA.allMaps.post_rank}</td>
            <td className="px-3 py-1 text-center">Post-Plant rW%</td>
            <td className="px-3 py-1 text-center text-text-muted">#{teamB.allMaps.post_rank}</td>
            <td className={`px-3 py-1 text-left font-mono ${teamB.allMaps.post_rW_pct > teamA.allMaps.post_rW_pct ? 'text-success font-semibold' : ''}`}>
              {formatPct(teamB.allMaps.post_rW_pct)}
            </td>
          </tr>
          <tr className="border-b border-border">
            <td className={`px-3 py-1 text-right font-mono ${teamA.allMaps.ret_rW_pct > teamB.allMaps.ret_rW_pct ? 'text-success font-semibold' : ''}`}>
              {formatPct(teamA.allMaps.ret_rW_pct)}
            </td>
            <td className="px-3 py-1 text-center text-text-muted">#{teamA.allMaps.ret_rank}</td>
            <td className="px-3 py-1 text-center">Retake rW%</td>
            <td className="px-3 py-1 text-center text-text-muted">#{teamB.allMaps.ret_rank}</td>
            <td className={`px-3 py-1 text-left font-mono ${teamB.allMaps.ret_rW_pct > teamA.allMaps.ret_rW_pct ? 'text-success font-semibold' : ''}`}>
              {formatPct(teamB.allMaps.ret_rW_pct)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function RosterComparison({ teamA, teamB, players }: { teamA: Team; teamB: Team; players: Player[] }) {
  const pA = players.filter(p => p.team === teamA.name)
  const pB = players.filter(p => p.team === teamB.name)

  function PlayerRow({ player }: { player: Player }) {
    return (
      <tr className="border-b border-border">
        <td className="px-2 py-1">
          <Link to={`/player/${encodeURIComponent(player.ign)}`} className="text-primary hover:underline text-sm">
            {player.ign}
          </Link>
        </td>
        <td className="px-2 py-1 font-mono text-sm text-right">{formatCount(player.acs_split)}</td>
        <td className="px-2 py-1 font-mono text-sm text-right">{formatRatio(player.kd)}</td>
        <td className="px-2 py-1 font-mono text-sm text-right">{formatPct(player.kast)}</td>
        <td className="px-2 py-1 font-mono text-sm text-right">{formatPct(player.fk_pct)}</td>
        <td className="px-2 py-1 font-mono text-sm text-right">{formatPct(player.clutch_pct)}</td>
      </tr>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Player Rosters</h3>
      <div className="grid grid-cols-2 gap-4">
        {[{ team: teamA, players: pA }, { team: teamB, players: pB }].map(({ team, players: tp }) => (
          <div key={team.name}>
            <div className="text-xs text-text-muted mb-1 font-semibold">{team.name}</div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-nav border-b border-border text-xs text-text-dim">
                  <th className="px-2 py-0.5 text-left">Player</th>
                  <th className="px-2 py-0.5 text-right">ACS</th>
                  <th className="px-2 py-0.5 text-right">K/D</th>
                  <th className="px-2 py-0.5 text-right">KAST</th>
                  <th className="px-2 py-0.5 text-right">FK/r</th>
                  <th className="px-2 py-0.5 text-right">CL%</th>
                </tr>
              </thead>
              <tbody>
                {tp.map(p => <PlayerRow key={p.ign} player={p} />)}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Player vs Player ─── */

function PlayerVsPlayer({ playerAIgn, playerBIgn, onChangeA, onChangeB, data }: {
  playerAIgn: string
  playerBIgn: string
  onChangeA: (v: string) => void
  onChangeB: (v: string) => void
  data: StatsData
}) {
  const teams = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))
  const pA = data.players.find(p => p.ign === playerAIgn)
  const pB = data.players.find(p => p.ign === playerBIgn)

  function PlayerDropdown({ value, onChange, exclude }: { value: string; onChange: (v: string) => void; exclude: string }) {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-card border border-border rounded px-3 py-1.5 text-sm text-text focus:outline-none focus:border-primary"
      >
        {teams.map(t => (
          <optgroup key={t.name} label={t.name}>
            {data.players
              .filter(p => p.team === t.name)
              .sort((a, b) => a.ign.localeCompare(b.ign))
              .map(p => (
                <option key={p.ign} value={p.ign} disabled={p.ign === exclude}>
                  {p.ign}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    )
  }

  const stats: { label: string; key: string; format: (v: number) => string; invert?: boolean }[] = [
    { label: 'ACS (Split)', key: 'acs_split', format: (v) => formatCount(v) },
    { label: 'K/D', key: 'kd', format: (v) => formatRatio(v) },
    { label: 'KA/D', key: 'kad', format: (v) => formatRatio(v) },
    { label: 'KAST', key: 'kast', format: (v) => formatPct(v) },
    { label: 'FK / round', key: 'fk_pct', format: (v) => formatPct(v) },
    { label: 'FD / round', key: 'fd_pct', format: (v) => formatPct(v), invert: true },
    { label: 'FK / FD', key: '_fkfd', format: (v) => formatRatio(v) },
    { label: 'Clutch %', key: 'clutch_pct', format: (v) => formatPct(v) },
    { label: 'AWP %', key: 'awp_pct', format: (v) => formatPct(v) },
  ]

  function getVal(player: Player, key: string): number {
    if (key === '_fkfd') return player.fd > 0 ? player.fk / player.fd : 0
    return (player as any)[key] ?? 0
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <PlayerDropdown value={playerAIgn} onChange={onChangeA} exclude={playerBIgn} />
        <span className="text-text-muted font-bold text-lg">vs</span>
        <PlayerDropdown value={playerBIgn} onChange={onChangeB} exclude={playerAIgn} />
      </div>

      {pA && pB && (
        <div className="space-y-6">
          {/* Stat Comparison Table */}
          <table className="border-collapse text-sm">
            <thead>
              <tr className="bg-nav border-b border-border">
                <th className="px-3 py-1.5 text-right text-text-muted font-medium w-28">
                  {pA.ign} <span className="text-text-dim">({pA.team})</span>
                </th>
                <th className="px-3 py-1.5 text-center text-text-muted font-medium">Stat</th>
                <th className="px-3 py-1.5 text-left text-text-muted font-medium w-28">
                  {pB.ign} <span className="text-text-dim">({pB.team})</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map(stat => {
                const aVal = getVal(pA, stat.key)
                const bVal = getVal(pB, stat.key)
                const aWins = stat.invert ? aVal < bVal : aVal > bVal
                const bWins = stat.invert ? bVal < aVal : bVal > aVal
                return (
                  <tr key={stat.key} className="border-b border-border">
                    <td className={`px-3 py-1 text-right font-mono ${aWins ? 'text-success font-semibold' : ''}`}>
                      {stat.format(aVal)}
                    </td>
                    <td className="px-3 py-1 text-center text-text-muted">{stat.label}</td>
                    <td className={`px-3 py-1 text-left font-mono ${bWins ? 'text-success font-semibold' : ''}`}>
                      {stat.format(bVal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Agent Pools Side by Side */}
          <div>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Agent Pools</h3>
            <div className="grid grid-cols-2 gap-4">
              {[pA, pB].map(player => (
                <div key={player.ign} className="bg-card border border-border rounded p-3">
                  <div className="text-xs text-text-muted mb-2 font-semibold">{player.ign}</div>
                  {[...player.agents].sort((a, b) => b.pct - a.pct).slice(0, 5).map(a => (
                    <div key={a.agent} className="flex items-center gap-2 mb-1">
                      <AgentIcon agent={a.agent} size={24} />
                      <span className="text-sm">{a.agent}</span>
                      <span className="text-text-muted text-xs ml-auto font-mono">{a.pct.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
