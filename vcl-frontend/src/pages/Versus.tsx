import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import AgentIcon from '../components/AgentIcon'
import FormStrip from '../components/FormStrip'
import { formatPct, formatRatio, formatCount } from '../utils/format'
import { getFirstBanPick, VETO_DATA } from '../data/vetoData'
import type { Team, Player, StatsData, Match, MapStats } from '../types'

const TEAM_LOGOS: Record<string, string> = {
  FKS: 'fks.png', SGE: 'sge.png', JL: 'jl.png', MDR: 'mdr.png',
  EP: 'ep.png', TL: 'tl.png', PXL: 'pxl.png', M1R: 'm1r.png',
  BAR: 'bar.png', UCAM: 'ucam.png', MISA: 'misa.png', S2G: 's2g.png',
  STS: 'sts.png', GNG: 'gng.png',
}

const TEAM_VLR: Record<string, string> = {
  FKS: 'https://www.vlr.gg/team/7721/fokus',
  SGE: 'https://www.vlr.gg/team/14498/eintracht-frankfurt',
  JL: 'https://www.vlr.gg/team/10622/joblife',
  MDR: 'https://www.vlr.gg/team/7495/mandatory',
  EP: 'https://www.vlr.gg/team/876/enterprise-esports',
  TL: 'https://www.vlr.gg/team/21038/team-liquid-academy',
  PXL: 'https://www.vlr.gg/team/21072/pixel-lumina',
  M1R: 'https://www.vlr.gg/team/21084/mir',
  BAR: 'https://www.vlr.gg/team/12793/barça-esports',
  UCAM: 'https://www.vlr.gg/team/11055/ucam-esports',
  MISA: 'https://www.vlr.gg/team/16125/misa-esports',
  S2G: 'https://www.vlr.gg/team/9551/s2g-esports',
  STS: 'https://www.vlr.gg/team/21076/stallions-esports',
  GNG: 'https://www.vlr.gg/team/21083/gng-amazigh',
}

const TEAM_LIQUIPEDIA: Record<string, string> = {
  FKS: 'https://liquipedia.net/valorant/FOKUS',
  SGE: 'https://liquipedia.net/valorant/Eintracht_Frankfurt',
  JL: 'https://liquipedia.net/valorant/Joblife',
  MDR: 'https://liquipedia.net/valorant/Mandatory',
  EP: 'https://liquipedia.net/valorant/Enterprise_Esports',
  TL: 'https://liquipedia.net/valorant/Team_Liquid_Academy',
  PXL: 'https://liquipedia.net/valorant/Pixel_Lumina',
  M1R: 'https://liquipedia.net/valorant/MIR_(European_Team)',
  BAR: 'https://liquipedia.net/valorant/Bar%C3%A7a_eSports',
  UCAM: 'https://liquipedia.net/valorant/UCAM_Esports',
  MISA: 'https://liquipedia.net/valorant/Misa_Esports',
  S2G: 'https://liquipedia.net/valorant/S2G_Esports',
  STS: 'https://liquipedia.net/valorant/Stallions_Esports',
  GNG: 'https://liquipedia.net/valorant/GnG_Amazigh',
}

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

  const effTeamA = teamA || teams[0]?.name || ''
  const effTeamB = teamB || (teams.find(t => t.name !== effTeamA)?.name ?? '')
  const effPlayerA = playerA || sortedPlayers[0]?.ign || ''
  const effPlayerB = playerB || (sortedPlayers.find(p => p.ign !== effPlayerA)?.ign ?? '')

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Mode Tabs */}
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setMode('team')}
          className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors ${mode === 'team' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-text-muted hover:text-text hover:bg-surface-container-high/60'}`}
        >
          Team vs Team
        </button>
        <button
          onClick={() => setMode('player')}
          className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors ${mode === 'player' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-text-muted hover:text-text hover:bg-surface-container-high/60'}`}
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

/* ─── Veto Modal ─── */

function VetoModal({ tag, onClose }: { tag: string; onClose: () => void }) {
  const matches = VETO_DATA[tag]
  if (!matches) return null

  const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date))

  /** Render a ban/pick/decider veto chip */
  function VetoChip({ step, type }: { step: [string, string, string]; type: 'ban' | 'pick' | 'decider' }) {
    const isTeam = step[1] === tag
    // Team's actions get white bg, opponent's get light grey bg
    const bgClass = (isTeam || type === 'decider') ? 'bg-white' : 'bg-gray-200'
    const textColor = type === 'ban' ? 'text-red-400' : type === 'pick' ? 'text-green-700' : 'text-blue-700'

    return (
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-[65px] py-1 rounded border border-gray-300 ${bgClass}`}>
          <span className={`text-[11px] font-headline font-bold uppercase ${textColor}`}>{step[2]}</span>
        </div>
        {type !== 'decider' && (
          <div className={`text-[10px] mt-0.5 font-bold uppercase ${isTeam ? 'text-on-surface' : 'text-text-muted'}`}>
            {isTeam ? tag : 'OPP'}
          </div>
        )}
        {type === 'decider' && (
          <div className="text-[10px] mt-0.5 text-text-muted font-medium uppercase">Remaining</div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-surface-container-low rounded-xl border border-white/10 shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
          <h2 className="font-headline font-bold text-lg uppercase tracking-tight text-on-surface">
            {tag} — Veto History
          </h2>
          <button onClick={onClose} className="text-text-dim hover:text-on-surface transition-colors text-xl leading-none">&times;</button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-300 border-b border-gray-400">
                <th className="px-4 py-3 text-xs font-headline font-bold uppercase tracking-widest text-black">Date / Event</th>
                <th className="px-4 py-3 text-xs font-headline font-bold uppercase tracking-widest text-black">Opponent</th>
                <th className="px-4 py-3 text-xs font-headline font-bold uppercase tracking-widest text-black border-r-2 border-gray-400">Score</th>
                <th className="px-2 py-3 text-xs font-headline font-bold uppercase tracking-widest text-red-500 text-center">Ban 1</th>
                <th className="px-2 py-3 text-xs font-headline font-bold uppercase tracking-widest text-red-500 text-center border-r-2 border-gray-400">Ban 2</th>
                <th className="px-2 py-3 text-xs font-headline font-bold uppercase tracking-widest text-green-700 text-center">Pick 1</th>
                <th className="px-2 py-3 text-xs font-headline font-bold uppercase tracking-widest text-green-700 text-center border-r-2 border-gray-400">Pick 2</th>
                <th className="px-2 py-3 text-xs font-headline font-bold uppercase tracking-widest text-red-500 text-center">Ban 3</th>
                <th className="px-2 py-3 text-xs font-headline font-bold uppercase tracking-widest text-red-500 text-center border-r-2 border-gray-400">Ban 4</th>
                <th className="px-4 py-3 text-xs font-headline font-bold uppercase tracking-widest text-blue-700 text-center">Decider</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => {
                // Map vetoes by position (index 0-6 in the veto array)
                const steps = m.vetoes
                const decider = steps.find(([a]) => a === 'Decider')
                // Steps 0-1: bans, 2-3: picks, 4-5: second bans (or picks in Bo5), 6: decider
                const slot = (idx: number) => steps[idx] as [string, string, string] | undefined
                const chipType = (step: [string, string, string]): 'ban' | 'pick' | 'decider' =>
                  step[0] === 'Decider' ? 'decider' : step[0].startsWith('Ban') ? 'ban' : 'pick'

                const [sA, sB] = m.score.split('-').map(Number)

                const dateObj = new Date(m.date)
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()

                return (
                  <tr key={i} className="border-b border-white/10 hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-headline font-bold text-sm text-on-surface">{dateStr}</div>
                      <div className="text-[10px] text-text-muted uppercase tracking-tight mt-0.5 max-w-[160px] truncate">{m.tournament}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-headline font-bold text-sm text-on-surface">{m.opponent}</span>
                    </td>
                    <td className="px-4 py-3 border-r-2 border-white/10">
                      <div className="flex items-center gap-1.5">
                        <span className="font-headline font-extrabold text-base text-on-surface">{sA}</span>
                        <span className="text-on-surface text-xs">-</span>
                        <span className="font-headline font-extrabold text-base text-on-surface">{sB}</span>
                        <span className="ml-1 text-[10px] bg-surface-container-highest px-1.5 py-0.5 rounded text-text-muted">{m.format}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3">{slot(0) && <VetoChip step={slot(0)!} type={chipType(slot(0)!)} />}</td>
                    <td className="px-2 py-3 border-r-2 border-white/10">{slot(1) && <VetoChip step={slot(1)!} type={chipType(slot(1)!)} />}</td>
                    <td className="px-2 py-3">{slot(2) && <VetoChip step={slot(2)!} type={chipType(slot(2)!)} />}</td>
                    <td className="px-2 py-3 border-r-2 border-white/10">{slot(3) && <VetoChip step={slot(3)!} type={chipType(slot(3)!)} />}</td>
                    <td className="px-2 py-3">{slot(4) && <VetoChip step={slot(4)!} type={chipType(slot(4)!)} />}</td>
                    <td className="px-2 py-3 border-r-2 border-white/10">{slot(5) && <VetoChip step={slot(5)!} type={chipType(slot(5)!)} />}</td>
                    <td className="px-4 py-3">{decider && <VetoChip step={decider} type="decider" />}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─── Team External Links ─── */

function TeamLinks({ tag, align }: { tag: string; align: 'left' | 'right' }) {
  const [showVeto, setShowVeto] = useState(false)
  const hasVeto = !!VETO_DATA[tag]

  const btnClass = "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors hover:bg-white/5"

  return (
    <>
      <div className={`flex gap-1.5 mt-2 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {TEAM_VLR[tag] && (
          <a href={TEAM_VLR[tag]} target="_blank" rel="noopener noreferrer"
            className={`${btnClass} text-text-muted border-white/10 hover:text-on-surface`}>
            VLR
          </a>
        )}
        {TEAM_LIQUIPEDIA[tag] && (
          <a href={TEAM_LIQUIPEDIA[tag]} target="_blank" rel="noopener noreferrer"
            className={`${btnClass} text-text-muted border-white/10 hover:text-on-surface`}>
            Liquipedia
          </a>
        )}
        {hasVeto && (
          <button onClick={() => setShowVeto(true)}
            className={`${btnClass} text-tertiary border-tertiary/20 hover:bg-tertiary/10`}>
            Vetoes
          </button>
        )}
      </div>
      {showVeto && <VetoModal tag={tag} onClose={() => setShowVeto(false)} />}
    </>
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
    <div className="space-y-6">
      {/* Team Header — VS layout */}
      <section className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        {/* Team A */}
        <div className="bg-surface-container-low rounded-xl p-5 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-primary/8 to-transparent" />
          <div className="flex items-center justify-end gap-5 relative">
            <div className="text-right">
              <TeamDropdown teams={teams} value={teamAName} onChange={onChangeA} exclude={teamBName} />
              {tA && (
                <>
                  <div className="text-sm text-text-muted mt-1">
                    Maps: {tA.allMaps.wins}W–{tA.allMaps.losses}L · Series: {tA.series_record.wins}W–{tA.series_record.losses}L
                  </div>
                  <div className="text-lg font-bold text-primary mt-0.5">{formatPct(tA.allMaps.rW_pct)} rW%</div>
                  <div className="flex justify-end mt-2"><FormStrip form={tA.form} /></div>
                  {tA.tag && <TeamLinks tag={tA.tag} align="right" />}
                </>
              )}
            </div>
            <TeamLogo tag={tA?.tag} />
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center px-2">
          <span className="text-3xl font-headline font-black text-secondary italic tracking-widest">VS</span>
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-text-dim to-transparent mt-1" />
        </div>

        {/* Team B */}
        <div className="bg-surface-container-low rounded-xl p-5 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-secondary/8 to-transparent" />
          <div className="flex items-center justify-start gap-5 relative">
            <TeamLogo tag={tB?.tag} />
            <div className="text-left">
              <TeamDropdown teams={teams} value={teamBName} onChange={onChangeB} exclude={teamAName} />
              {tB && (
                <>
                  <div className="text-sm text-text-muted mt-1">
                    Maps: {tB.allMaps.wins}W–{tB.allMaps.losses}L · Series: {tB.series_record.wins}W–{tB.series_record.losses}L
                  </div>
                  <div className="text-lg font-bold text-secondary mt-0.5">{formatPct(tB.allMaps.rW_pct)} rW%</div>
                  <div className="flex justify-start mt-2"><FormStrip form={tB.form} /></div>
                  {tB.tag && <TeamLinks tag={tB.tag} align="left" />}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {tA && tB && (
        <>
          {/* Map Pool Dominance */}
          <MapPoolBars teamA={tA} teamB={tB} data={data} />

          {/* Head-to-Head History */}
          <HeadToHead teamA={tA} teamB={tB} matches={data.matches} />

          {/* Pistol Win Rate + Post-Plant & Retake side by side */}
          <div className="grid grid-cols-2 gap-6">
            <PistolComparison teamA={tA} teamB={tB} />
            <PostPlantCards teamA={tA} teamB={tB} />
          </div>

          {/* Player Roster Comparison */}
          <RosterComparison teamA={tA} teamB={tB} players={data.players} />
        </>
      )}
    </div>
  )
}

/* ─── Shared Components ─── */

function TeamLogo({ tag }: { tag?: string }) {
  const logo = tag ? TEAM_LOGOS[tag] : undefined
  if (!logo) return <div className="w-[120px] h-[120px] rounded-xl bg-surface-container-highest border border-white/10" />
  return (
    <div className="w-[120px] h-[120px] bg-surface-container-highest rounded-xl flex items-center justify-center p-1.5 border border-white/10">
      <img src={`${import.meta.env.BASE_URL}logos/${logo}`} alt={tag} className="max-w-full max-h-full object-contain" />
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
      className="bg-surface-container border border-white/10 rounded-lg px-3 py-1.5 text-lg font-headline font-bold text-on-surface focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
    >
      {teams.map(t => (
        <option key={t.name} value={t.name} disabled={t.name === exclude}>{t.name}</option>
      ))}
    </select>
  )
}

/* ─── Map Pool Dominance ─── */

function MapDetailPanel({ mapStats, color, agentPlayerMap = {} }: { mapStats: MapStats | undefined; color: 'primary' | 'secondary'; agentPlayerMap?: Record<string, string> }) {
  if (!mapStats) return <div className="text-text-dim text-xs italic">No data</div>

  const stats = [
    { label: 'Overall', value: formatPct(mapStats.rW_pct) },
    { label: 'Attack', value: formatPct(mapStats.atk_rW_pct) },
    { label: 'Defense', value: formatPct(mapStats.def_rW_pct) },
    { label: 'Post-Plant', value: formatPct(mapStats.post_rW_pct) },
    { label: 'Retake', value: formatPct(mapStats.ret_rW_pct) },
    { label: 'Avg Plant', value: mapStats.avg_plant_time != null ? `${mapStats.avg_plant_time}s` : '-' },
  ]

  return (
    <div>
      {/* Comp */}
      <div className="flex items-center gap-1 mb-2">
        {mapStats.comp.slice(0, 5).map((agent, i) => (
          <AgentIcon key={i} agent={agent} size={22} tooltip={agentPlayerMap[agent]} />
        ))}
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1">
        {stats.map(s => (
          <div key={s.label} className="flex justify-between items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">{s.label}</span>
            <span className={`text-xs font-bold text-${color}`}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildAgentPlayerMap(data: StatsData, teamName: string): Record<string, string> {
  const map: Record<string, string> = {}
  const rounds: Record<string, number> = {}
  for (const ap of (data.players_by_agent ?? []).filter(p => p.team === teamName)) {
    if (!map[ap.agent] || ap.rounds > rounds[ap.agent]) {
      map[ap.agent] = ap.ign
      rounds[ap.agent] = ap.rounds
    }
  }
  return map
}

function MapPoolBars({ teamA, teamB, data }: { teamA: Team; teamB: Team; data: StatsData }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const allMaps = new Set([...teamA.maps.map(m => m.map), ...teamB.maps.map(m => m.map)])
  const sortedMaps = [...allMaps].sort()

  const agentMapA = buildAgentPlayerMap(data, teamA.name)
  const agentMapB = buildAgentPlayerMap(data, teamB.name)

  const vetoA = teamA.tag ? getFirstBanPick(teamA.tag) : { firstBan: null, firstPick: null }
  const vetoB = teamB.tag ? getFirstBanPick(teamB.tag) : { firstBan: null, firstPick: null }

  return (
    <section className="bg-surface-container-low rounded-xl p-5 border border-white/5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-headline font-bold text-sm uppercase tracking-tight text-on-surface">Map Pool</h3>
        <div className="flex gap-4 text-xs uppercase tracking-wider text-text-muted">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> {teamA.tag}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary" /> {teamB.tag}</span>
        </div>
      </div>
      <div className="space-y-1">
        {sortedMaps.map(mapName => {
          const mA = teamA.maps.find(m => m.map === mapName)
          const mB = teamB.maps.find(m => m.map === mapName)
          const aRW = mA?.rW_pct ?? 0
          const bRW = mB?.rW_pct ?? 0
          const delta = aRW - bRW
          const isExpanded = expanded === mapName

          const aLabel = vetoA.firstBan === mapName ? 'FIRST BAN' : vetoA.firstPick === mapName ? 'FIRST PICK' : null
          const bLabel = vetoB.firstBan === mapName ? 'FIRST BAN' : vetoB.firstPick === mapName ? 'FIRST PICK' : null

          return (
            <div key={mapName}>
              <div
                className={`grid grid-cols-[80px_1fr_80px_1fr] items-center gap-3 py-1.5 px-1 -mx-1 rounded-lg cursor-pointer transition-colors ${
                  isExpanded ? 'bg-white/5' : 'hover:bg-white/3'
                }`}
                onClick={() => setExpanded(isExpanded ? null : mapName)}
              >
                <div className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                  <span className={`text-[10px] text-text-dim transition-transform ${isExpanded ? 'rotate-90' : ''}`}>&#9654;</span>
                  {mapName}
                </div>

                {/* Team A bar + veto label */}
                <div className="h-7 bg-surface-container-highest rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(aRW * 100, 2)}%` }}
                  />
                  <span className="absolute inset-y-0 left-2.5 flex items-center text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                    {mA ? formatPct(aRW) : '-'}
                    {mA && <span className="text-white/80 ml-1">({mA.wins}-{mA.losses})</span>}
                  </span>
                  {aLabel && (
                    <span className={`absolute inset-y-0 right-2.5 flex items-center text-[11px] font-black uppercase tracking-wider ${
                      aLabel === 'FIRST BAN' ? 'text-red-500' : 'text-on-surface'
                    }`}>
                      {aLabel}
                    </span>
                  )}
                </div>

                {/* Delta */}
                <div className="flex justify-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    delta > 0.01 ? 'text-primary border-primary/20' : delta < -0.01 ? 'text-secondary border-secondary/20' : 'text-text-dim border-white/10'
                  }`}>
                    {delta > 0 ? '+' : ''}{(delta * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Team B bar + veto label */}
                <div className="h-7 bg-surface-container-highest rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(bRW * 100, 2)}%` }}
                  />
                  <span className="absolute inset-y-0 left-2.5 flex items-center text-xs font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
                    {mB ? formatPct(bRW) : '-'}
                    {mB && <span className="text-white/80 ml-1">({mB.wins}-{mB.losses})</span>}
                  </span>
                  {bLabel && (
                    <span className={`absolute inset-y-0 right-2.5 flex items-center text-[11px] font-black uppercase tracking-wider ${
                      bLabel === 'FIRST BAN' ? 'text-red-500' : 'text-on-surface'
                    }`}>
                      {bLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div className="grid grid-cols-[80px_1fr_80px_1fr] gap-3 mt-1 mb-2">
                  <div />
                  <div className="bg-surface-container rounded-lg p-3 border border-primary/10">
                    <MapDetailPanel mapStats={mA} color="primary" agentPlayerMap={agentMapA} />
                  </div>
                  <div />
                  <div className="bg-surface-container rounded-lg p-3 border border-secondary/10">
                    <MapDetailPanel mapStats={mB} color="secondary" agentPlayerMap={agentMapB} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ─── Head-to-Head History ─── */

function HeadToHead({ teamA, teamB, matches }: { teamA: Team; teamB: Team; matches: Match[] }) {
  const h2h = matches.filter(m =>
    (m.team1 === teamA.name && m.team2 === teamB.name) ||
    (m.team1 === teamB.name && m.team2 === teamA.name)
  ).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <section className="bg-surface-container-low rounded-xl p-5 border border-white/5">
      <h3 className="font-headline font-bold text-sm uppercase tracking-tight text-on-surface mb-3">Head-to-Head History</h3>
      {h2h.length === 0 ? (
        <p className="text-text-dim text-sm">No previous meetings in dataset.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-3 py-2 text-left text-text-muted text-xs uppercase tracking-wider font-medium">Date</th>
              <th className="px-3 py-2 text-left text-text-muted text-xs uppercase tracking-wider font-medium">Map</th>
              <th className="px-3 py-2 text-center text-text-muted text-xs uppercase tracking-wider font-medium">Score</th>
              <th className="px-3 py-2 text-left text-text-muted text-xs uppercase tracking-wider font-medium">Winner</th>
            </tr>
          </thead>
          <tbody>
            {h2h.map((m, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-3 py-2 text-text-muted">{m.date}</td>
                <td className="px-3 py-2 text-on-surface">{m.map}</td>
                <td className="px-3 py-2 text-center font-table font-bold">{m.team1_score} – {m.team2_score}</td>
                <td className="px-3 py-2">
                  <span className={`font-semibold ${m.winner === teamA.name ? 'text-primary' : 'text-secondary'}`}>
                    {m.winner === teamA.name ? teamA.tag : teamB.tag}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

/* ─── Pistol Win Rate ─── */

function PistolComparison({ teamA, teamB }: { teamA: Team; teamB: Team }) {
  const aPistol = teamA.allMaps.pistol_rW_pct
  const bPistol = teamB.allMaps.pistol_rW_pct
  // Proportional bar widths
  const total = (aPistol || 0) + (bPistol || 0)
  const aWidth = total > 0 ? (aPistol / total) * 100 : 50
  const bWidth = 100 - aWidth

  return (
    <section className="bg-surface-container-low rounded-xl p-5 border border-white/5">
      <h3 className="font-headline font-bold text-sm uppercase tracking-tight text-on-surface mb-4">Pistol Win Rate</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-text-muted">
          <span>{teamA.tag} <span className="text-primary">{formatPct(aPistol)}</span></span>
          <span><span className="text-secondary">{formatPct(bPistol)}</span> {teamB.tag}</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-surface-container-highest">
          <div className="bg-primary h-full rounded-l-full transition-all duration-500" style={{ width: `${aWidth}%` }} />
          <div className="bg-secondary h-full rounded-r-full transition-all duration-500" style={{ width: `${bWidth}%` }} />
        </div>

        {/* Attack / Defense breakdown */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-surface-container rounded-lg p-3 border border-white/5">
            <div className="text-[10px] uppercase font-bold text-text-dim mb-1">Attack Pistol</div>
            <div className="flex justify-between text-sm font-table font-bold">
              <span className="text-primary">{formatPct(teamA.allMaps.pistol_atk_rW_pct)}</span>
              <span className="text-secondary">{formatPct(teamB.allMaps.pistol_atk_rW_pct)}</span>
            </div>
          </div>
          <div className="bg-surface-container rounded-lg p-3 border border-white/5">
            <div className="text-[10px] uppercase font-bold text-text-dim mb-1">Defense Pistol</div>
            <div className="flex justify-between text-sm font-table font-bold">
              <span className="text-primary">{formatPct(teamA.allMaps.pistol_def_rW_pct)}</span>
              <span className="text-secondary">{formatPct(teamB.allMaps.pistol_def_rW_pct)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Post-Plant & Retake Cards ─── */

function PostPlantCards({ teamA, teamB }: { teamA: Team; teamB: Team }) {
  return (
    <section className="bg-surface-container-low rounded-xl p-5 border border-white/5 border-l-4 border-l-secondary">
      <h3 className="font-headline font-bold text-sm uppercase tracking-tight text-on-surface mb-4">Tactical Execution</h3>
      {/* Column headers: Team A | Team B */}
      <div className="grid grid-cols-[100px_1fr_1fr] gap-3 mb-2">
        <div />
        <div className="text-xs font-bold uppercase tracking-wider text-primary text-center">{teamA.tag}</div>
        <div className="text-xs font-bold uppercase tracking-wider text-secondary text-center">{teamB.tag}</div>
      </div>

      {/* Row 1: Post-Plant */}
      <div className="grid grid-cols-[100px_1fr_1fr] gap-3 mb-3">
        <div className="flex items-center text-sm uppercase font-bold text-on-surface">Post-Plant</div>
        <div className="bg-surface-container rounded-lg p-3 border border-white/5 text-center">
          <span className={`text-2xl font-headline font-black ${teamA.allMaps.post_rW_pct >= teamB.allMaps.post_rW_pct ? 'text-primary' : 'text-on-surface'}`}>
            {formatPct(teamA.allMaps.post_rW_pct)}
          </span>
          <span className="text-text-dim text-xs ml-1">#{teamA.allMaps.post_rank}</span>
        </div>
        <div className="bg-surface-container rounded-lg p-3 border border-white/5 text-center">
          <span className={`text-2xl font-headline font-black ${teamB.allMaps.post_rW_pct >= teamA.allMaps.post_rW_pct ? 'text-secondary' : 'text-on-surface'}`}>
            {formatPct(teamB.allMaps.post_rW_pct)}
          </span>
          <span className="text-text-dim text-xs ml-1">#{teamB.allMaps.post_rank}</span>
        </div>
      </div>

      {/* Row 2: Retake */}
      <div className="grid grid-cols-[100px_1fr_1fr] gap-3">
        <div className="flex items-center text-sm uppercase font-bold text-on-surface">Retake</div>
        <div className="bg-surface-container rounded-lg p-3 border border-white/5 text-center">
          <span className={`text-2xl font-headline font-black ${teamA.allMaps.ret_rW_pct >= teamB.allMaps.ret_rW_pct ? 'text-primary' : 'text-on-surface'}`}>
            {formatPct(teamA.allMaps.ret_rW_pct)}
          </span>
          <span className="text-text-dim text-xs ml-1">#{teamA.allMaps.ret_rank}</span>
        </div>
        <div className="bg-surface-container rounded-lg p-3 border border-white/5 text-center">
          <span className={`text-2xl font-headline font-black ${teamB.allMaps.ret_rW_pct >= teamA.allMaps.ret_rW_pct ? 'text-secondary' : 'text-on-surface'}`}>
            {formatPct(teamB.allMaps.ret_rW_pct)}
          </span>
          <span className="text-text-dim text-xs ml-1">#{teamB.allMaps.ret_rank}</span>
        </div>
      </div>
    </section>
  )
}

/* ─── Player Roster Comparison ─── */

function RosterComparison({ teamA, teamB, players }: { teamA: Team; teamB: Team; players: Player[] }) {
  const { playoffData } = useStats()
  const [clOnly, setClOnly] = useState(false)

  // When CL Only is on and playoff data exists, use playoff players; otherwise use passed-in players
  const activePlayers = (clOnly && playoffData) ? playoffData.players : players
  const pA = activePlayers.filter(p => p.team === teamA.name)
  const pB = activePlayers.filter(p => p.team === teamB.name)

  const statCols = [
    { label: 'ACS', get: (p: Player) => formatCount(p.acs_split) },
    { label: 'K/D', get: (p: Player) => formatRatio(p.kd) },
    { label: 'KAST', get: (p: Player) => formatPct(p.kast) },
    { label: 'FK/r', get: (p: Player) => formatPct(p.fk_pct) },
    { label: 'CL%', get: (p: Player) => formatPct(p.clutch_pct) },
  ]

  function RosterTable({ team, roster }: { team: Team; roster: Player[] }) {
    return (
      <div className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5">
        <div className={`px-4 py-2.5 bg-surface-container-high/60 border-b border-white/5 flex items-center gap-2`}>
          <TeamLogo tag={team.tag} />
          <h4 className="font-headline font-bold text-sm uppercase tracking-tight text-on-surface">{team.name}</h4>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container/60">
              <th className="px-3 py-2 text-left text-text-muted text-sm uppercase tracking-wider font-medium">Player</th>
              <th className="px-2 py-2 text-center text-text-muted text-sm uppercase tracking-wider font-medium">Agents</th>
              {statCols.map(c => (
                <th key={c.label} className="px-2 py-2 text-right text-text-muted text-sm uppercase tracking-wider font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.map(p => (
              <tr key={p.ign} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-3 py-2">
                  <Link to={`/player/${encodeURIComponent(p.ign)}`} className="text-player-link hover:underline font-bold text-sm">
                    {p.ign}
                  </Link>
                </td>
                <td className="px-2 py-2">
                  <div className="flex gap-0.5 justify-center">
                    {[...p.agents].sort((a, b) => b.pct - a.pct).slice(0, 3).map(a => (
                      <AgentIcon key={a.agent} agent={a.agent} size={18} />
                    ))}
                  </div>
                </td>
                {statCols.map(c => (
                  <td key={c.label} className="px-2 py-2 text-right font-table text-sm text-on-surface">{c.get(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-headline font-bold text-sm uppercase tracking-tight text-on-surface">Player Rosters</h3>
        {playoffData && (
          <button
            onClick={() => setClOnly(!clOnly)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors ${
              clOnly
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-on-surface hover:bg-white/5'
            }`}
          >
            CL Data Only
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <RosterTable team={teamA} roster={pA} />
        <RosterTable team={teamB} roster={pB} />
      </div>
    </section>
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
        className="bg-surface-container border border-white/10 rounded-lg px-3 py-1.5 text-lg font-headline font-bold text-on-surface focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
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
    { label: 'ACS (Split)', key: 'acs_split', format: v => formatCount(v) },
    { label: 'K/D', key: 'kd', format: v => formatRatio(v) },
    { label: 'KA/D', key: 'kad', format: v => formatRatio(v) },
    { label: 'KAST', key: 'kast', format: v => formatPct(v) },
    { label: 'FK / round', key: 'fk_pct', format: v => formatPct(v) },
    { label: 'FD / round', key: 'fd_pct', format: v => formatPct(v), invert: true },
    { label: 'FK / FD', key: '_fkfd', format: v => formatRatio(v) },
    { label: 'Clutch %', key: 'clutch_pct', format: v => formatPct(v) },
    { label: 'AWP %', key: 'awp_pct', format: v => formatPct(v) },
  ]

  function getVal(player: Player, key: string): number {
    if (key === '_fkfd') return player.fd > 0 ? player.fk / player.fd : 0
    return (player as any)[key] ?? 0
  }

  const tA = pA ? data.teams.find(t => t.name === pA.team) : undefined
  const tB = pB ? data.teams.find(t => t.name === pB.team) : undefined

  return (
    <div className="space-y-6">
      {/* Player Header — VS layout */}
      <section className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
        {/* Player A */}
        <div className="bg-surface-container-low rounded-xl p-5 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-primary/8 to-transparent" />
          <div className="flex items-center justify-end gap-4 relative">
            <div className="text-right">
              <PlayerDropdown value={playerAIgn} onChange={onChangeA} exclude={playerBIgn} />
              {pA && <div className="text-sm text-text-muted mt-1">{pA.team} · {pA.rounds} rounds</div>}
            </div>
            <TeamLogo tag={tA?.tag} />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-2">
          <span className="text-3xl font-headline font-black text-secondary italic tracking-widest">VS</span>
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-text-dim to-transparent mt-1" />
        </div>

        {/* Player B */}
        <div className="bg-surface-container-low rounded-xl p-5 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-secondary/8 to-transparent" />
          <div className="flex items-center justify-start gap-4 relative">
            <TeamLogo tag={tB?.tag} />
            <div className="text-left">
              <PlayerDropdown value={playerBIgn} onChange={onChangeB} exclude={playerAIgn} />
              {pB && <div className="text-sm text-text-muted mt-1">{pB.team} · {pB.rounds} rounds</div>}
            </div>
          </div>
        </div>
      </section>

      {pA && pB && (
        <>
          {/* Stat Comparison */}
          <section className="bg-surface-container-low rounded-xl overflow-hidden border border-white/5">
            <div className="px-5 py-3 bg-surface-container-high/60 border-b border-white/5">
              <h3 className="font-headline font-bold text-sm uppercase tracking-tight text-on-surface">Stat Comparison</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container/60 border-b border-white/5">
                  <th className="px-4 py-2 text-right text-primary text-xs uppercase tracking-wider font-bold w-1/3">{pA.ign}</th>
                  <th className="px-4 py-2 text-center text-text-muted text-xs uppercase tracking-wider font-medium">Stat</th>
                  <th className="px-4 py-2 text-left text-secondary text-xs uppercase tracking-wider font-bold w-1/3">{pB.ign}</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(stat => {
                  const aVal = getVal(pA, stat.key)
                  const bVal = getVal(pB, stat.key)
                  const aWins = stat.invert ? aVal < bVal : aVal > bVal
                  const bWins = stat.invert ? bVal < aVal : bVal > aVal
                  return (
                    <tr key={stat.key} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className={`px-4 py-2.5 text-right font-table text-sm ${aWins ? 'text-primary font-bold' : 'text-on-surface'}`}>
                        {stat.format(aVal)}
                      </td>
                      <td className="px-4 py-2.5 text-center text-text-muted text-xs">{stat.label}</td>
                      <td className={`px-4 py-2.5 text-left font-table text-sm ${bWins ? 'text-secondary font-bold' : 'text-on-surface'}`}>
                        {stat.format(bVal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          {/* Agent Pools Side by Side */}
          <section>
            <h3 className="font-headline font-bold text-sm uppercase tracking-tight text-on-surface mb-3">Agent Pools</h3>
            <div className="grid grid-cols-2 gap-4">
              {[pA, pB].map(player => (
                <div key={player.ign} className="bg-surface-container-low rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-text-muted mb-3 font-bold uppercase tracking-wider">{player.ign}</div>
                  <div className="space-y-2">
                    {[...player.agents].sort((a, b) => b.pct - a.pct).slice(0, 5).map(a => (
                      <div key={a.agent} className="flex items-center gap-3">
                        <AgentIcon agent={a.agent} size={28} />
                        <span className="text-sm text-on-surface font-medium">{a.agent}</span>
                        <span className="text-text-muted text-xs ml-auto font-table">{a.pct.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
