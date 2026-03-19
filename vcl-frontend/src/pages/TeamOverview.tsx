import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import TeamSelector from '../components/TeamSelector'
import FormStrip from '../components/FormStrip'
import AgentIcon from '../components/AgentIcon'
import StatCell from '../components/StatCell'
import XvYMatrix from '../components/XvYMatrix'
import { formatPct, formatRatio } from '../utils/format'
import { generateTalkingPoints } from '../utils/talkingPoints'
import type { MapStats, Player } from '../types'

export default function TeamOverview() {
  const { name } = useParams<{ name: string }>()
  const { data, averages } = useStats()

  const teamName = decodeURIComponent(name || '')
  const team = data?.teams.find(t => t.name === teamName)

  useEffect(() => {
    if (team) {
      try { localStorage.setItem('vcl-last-team', team.name) } catch { /* noop */ }
    }
  }, [team])

  if (!data || !averages) return null
  if (!team) return <div className="p-8 text-danger">Team not found: {teamName}</div>

  const teamPlayers = data.players.filter(p => p.team === team.name)
  const mapRows = [...team.maps].sort((a, b) => b.plays - a.plays)
  const talkingPoints = generateTalkingPoints(team, data, averages)

  const mapWins = mapRows.reduce((s, m) => s + m.wins, 0)
  const mapLosses = mapRows.reduce((s, m) => s + m.losses, 0)

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <TeamSelector currentTeam={team.name} />
        <div className="flex items-center gap-4 text-sm text-text-muted">
          <span>Series: <span className="text-text font-semibold">{team.series_record.wins}W-{team.series_record.losses}L</span></span>
          <span>Maps: <span className="text-text font-semibold">{mapWins}W-{mapLosses}L</span></span>
        </div>
        <FormStrip form={team.form} count={8} />
      </div>

      {/* Map Stats + Post Plant side by side */}
      <div className="flex gap-3 overflow-x-auto">
        {/* Left: Map Statistics */}
        <div className="flex-1 min-w-0">
          <table className="border-collapse text-sm w-full">
            <thead>
              {/* Group headers */}
              <tr>
                <th colSpan={2} className="px-1 py-1 text-center font-semibold text-sm border border-border" style={{ backgroundColor: '#d4edcf', color: '#1a4a14' }}>Team Statistics</th>
                <th colSpan={3} className="px-1 py-1 text-center font-semibold text-sm border border-border" style={{ backgroundColor: '#d0e4f5', color: '#1a3a5f' }}>Map</th>
                <th colSpan={3} className="px-1 py-1 text-center font-semibold text-sm border border-border" style={{ backgroundColor: '#e8ddf8', color: '#4a2080' }}>All Rounds</th>
                <th colSpan={3} className="px-1 py-1 text-center font-semibold text-sm border border-border" style={{ backgroundColor: '#f8d8d8', color: '#7a2020' }}>Pistols</th>
                <th colSpan={3} className="px-1 py-1 text-center font-semibold text-sm border border-border" style={{ backgroundColor: '#d4edcf', color: '#1a4a14' }}>Gun</th>
                <th colSpan={3} className="px-1 py-1 text-center font-semibold text-sm border border-border" style={{ backgroundColor: '#f0edd0', color: '#5a5a10' }}>Anti Eco</th>
                <th colSpan={3} className="px-1 py-1 text-center font-semibold text-sm border border-border" style={{ backgroundColor: '#f0e0d0', color: '#5a3a10' }}>Eco</th>
              </tr>
              {/* Column headers */}
              <tr className="bg-nav">
                <th className="px-1 py-0.5 text-left text-text font-medium border border-border">Map</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">Comp</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">P</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">W</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">L</th>
                {/* All rounds */}
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">rW%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">aW%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">dW%</th>
                {/* Pistols */}
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">rW%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">aW%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">dW%</th>
                {/* Gun */}
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">rW%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">aW%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">dW%</th>
                {/* Anti Eco */}
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">rW%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">aW%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">dW%</th>
                {/* Eco */}
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">rW%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">aW%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">dW%</th>
              </tr>
            </thead>
            <tbody>
              {mapRows.map(ms => (
                <MapStatsRow key={ms.map} ms={ms} avgs={averages.perMap[ms.map]} />
              ))}
              <MapStatsRow ms={team.allMaps} avgs={averages.team} isAggregate />
            </tbody>
          </table>
        </div>

        {/* Right: Post Plant */}
        <div className="shrink-0">
          <table className="border-collapse text-sm">
            <thead>
              <tr>
                <th className="px-1 py-1 border border-border bg-nav" />
                <th colSpan={5} className="px-1 py-1 text-center font-semibold text-sm border border-border" style={{ backgroundColor: '#d0f0f0', color: '#1a5a5a' }}>Post Plant</th>
                <th colSpan={5} className="px-1 py-1 text-center font-semibold text-sm border border-border" style={{ backgroundColor: '#f8d8d8', color: '#7a2020' }}>Retake</th>
              </tr>
              <tr className="bg-nav">
                <th className="px-1 py-0.5 text-left text-text font-medium border border-border">Map</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">Scens</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">/Map</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">rW%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">Avg</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">Rk</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">Scens</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">/Map</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">rW%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">Avg</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">Rk</th>
              </tr>
            </thead>
            <tbody>
              {mapRows.map(ms => (
                <PostPlantRow key={ms.map} ms={ms} avgs={averages.perMap[ms.map]} />
              ))}
              <PostPlantRow ms={team.allMaps} avgs={averages.team} isAggregate />
            </tbody>
          </table>
        </div>
      </div>

      {/* Player Stats + XvY side by side */}
      <div className="flex gap-3 overflow-x-auto">
        {/* Left: Player Stats */}
        <div className="flex-1 min-w-0">
          <table className="border-collapse text-sm w-full">
            <thead>
              <tr>
                <th colSpan={11} className="px-1 py-1 text-center font-semibold text-sm border border-border" style={{ backgroundColor: '#d4edcf', color: '#1a4a14' }}>Statistics Per Player</th>
              </tr>
              <tr className="bg-nav">
                <th className="px-1 py-0.5 text-left text-text font-medium border border-border">Players</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">Agents</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">r</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">K/D</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">KA/D</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">KAST</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">fk/r</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">fd/r</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">fk/fd</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">CL%</th>
                <th className="px-1 py-0.5 text-center text-text font-medium border border-border">AWP%</th>
              </tr>
            </thead>
            <tbody>
              {teamPlayers.map(p => (
                <PlayerRow key={p.ign} player={p} avgP={averages.player} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: XvY matrices */}
        <div className="shrink-0 flex gap-2">
          <XvYMatrix title="Team XvY" entries={team.xvy} mode="absolute" />
          <XvYMatrix title="XvY vs Attending Average" entries={team.xvy} averages={averages.xvy} mode="delta" />
          <XvYMatrix title="Attending Team Average" averages={averages.xvy} mode="average" />
        </div>
      </div>

      {/* Talking Points */}
      {talkingPoints.length > 0 && (
        <div className="border-l-4 border-primary bg-card/50 rounded-r-lg px-4 py-3">
          <h3 className="text-primary font-semibold text-sm mb-2">Talking Points</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-text-muted">
            {talkingPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ──── Sub-components ──── */

function MapStatsRow({ ms, avgs, isAggregate = false }: { ms: MapStats; avgs?: Record<string, { mean: number; std: number }>; isAggregate?: boolean }) {
  const cls = isAggregate ? 'font-bold border-t-2 border-border' : 'border-b border-border'
  const a = avgs || {}

  return (
    <tr className={cls}>
      <td className="px-1.5 py-0.5 text-left font-bold border border-border whitespace-nowrap">{isAggregate ? 'All Maps' : ms.map}</td>
      <td className="px-1.5 py-0.5 text-center border border-border">
        <div className="flex gap-0.5 justify-center">
          {ms.comp.slice(0, 5).map((agent, i) => (
            <AgentIcon key={i} agent={agent} size={16} />
          ))}
        </div>
      </td>
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{ms.plays}</td>
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{ms.wins}</td>
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{ms.losses}</td>
      {/* All rounds */}
      <StatCell value={ms.rW_pct} mean={a.rW_pct?.mean} std={a.rW_pct?.std} format={formatPct} />
      <StatCell value={ms.atk_rW_pct} mean={a.atk_rW_pct?.mean} std={a.atk_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.def_rW_pct} mean={a.def_rW_pct?.mean} std={a.def_rW_pct?.std} format={formatPct} />
      {/* Pistols */}
      <StatCell value={ms.pistol_rW_pct} mean={a.pistol_rW_pct?.mean} std={a.pistol_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.pistol_atk_rW_pct} mean={a.pistol_atk_rW_pct?.mean} std={a.pistol_atk_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.pistol_def_rW_pct} mean={a.pistol_def_rW_pct?.mean} std={a.pistol_def_rW_pct?.std} format={formatPct} />
      {/* Gun */}
      <StatCell value={ms.gun_rW_pct} mean={a.gun_rW_pct?.mean} std={a.gun_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.gun_atk_rW_pct} mean={a.gun_atk_rW_pct?.mean} std={a.gun_atk_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.gun_def_rW_pct} mean={a.gun_def_rW_pct?.mean} std={a.gun_def_rW_pct?.std} format={formatPct} />
      {/* Anti Eco */}
      <StatCell value={ms.antieco_rW_pct} mean={a.antieco_rW_pct?.mean} std={a.antieco_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.antieco_atk_rW_pct} mean={a.antieco_atk_rW_pct?.mean} std={a.antieco_atk_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.antieco_def_rW_pct} mean={a.antieco_def_rW_pct?.mean} std={a.antieco_def_rW_pct?.std} format={formatPct} />
      {/* Eco */}
      <StatCell value={ms.eco_rW_pct} mean={a.eco_rW_pct?.mean} std={a.eco_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.eco_atk_rW_pct} mean={a.eco_atk_rW_pct?.mean} std={a.eco_atk_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.eco_def_rW_pct} mean={a.eco_def_rW_pct?.mean} std={a.eco_def_rW_pct?.std} format={formatPct} />
    </tr>
  )
}

function PostPlantRow({ ms, avgs, isAggregate = false }: { ms: MapStats; avgs?: Record<string, { mean: number; std: number }>; isAggregate?: boolean }) {
  const cls = isAggregate ? 'font-bold border-t-2 border-border' : 'border-b border-border'
  const a = avgs || {}

  return (
    <tr className={cls}>
      <td className="px-1.5 py-0.5 text-left font-bold border border-border whitespace-nowrap">{isAggregate ? 'All Maps' : ms.map}</td>
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{ms.post_scens}</td>
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{formatRatio(ms.post_per_map)}</td>
      <StatCell value={ms.post_rW_pct} mean={a.post_rW_pct?.mean} std={a.post_rW_pct?.std} format={formatPct} />
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{formatPct(ms.post_rW_event_avg)}</td>
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{ms.post_rank}</td>
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{ms.ret_scens}</td>
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{formatRatio(ms.ret_per_map)}</td>
      <StatCell value={ms.ret_rW_pct} mean={a.ret_rW_pct?.mean} std={a.ret_rW_pct?.std} format={formatPct} />
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{formatPct(ms.ret_rW_event_avg)}</td>
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{ms.ret_rank}</td>
    </tr>
  )
}

function PlayerRow({ player, avgP }: { player: Player; avgP: Record<string, { mean: number; std: number }> }) {
  const topAgents = [...player.agents].sort((a, b) => b.picks - a.picks).slice(0, 3)
  const fkPerR = player.rounds > 0 ? player.fk / player.rounds : 0
  const fdPerR = player.rounds > 0 ? player.fd / player.rounds : 0
  const fkfd = player.fd > 0 ? player.fk / player.fd : player.fk > 0 ? Infinity : 0

  return (
    <tr className="border-b border-border">
      <td className="px-1.5 py-0.5 text-left font-bold border border-border whitespace-nowrap">
        <Link to={`/player/${encodeURIComponent(player.ign)}`} className="text-primary hover:underline">
          {player.ign}
        </Link>
      </td>
      <td className="px-1.5 py-0.5 text-center border border-border">
        <div className="flex gap-0.5 justify-center">
          {topAgents.map((ap, i) => (
            <AgentIcon key={i} agent={ap.agent} size={16} />
          ))}
        </div>
      </td>
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{player.rounds}</td>
      <StatCell value={player.kd} mean={avgP.kd?.mean} std={avgP.kd?.std} format={formatRatio} />
      <StatCell value={player.kad} mean={avgP.kad?.mean} std={avgP.kad?.std} format={formatRatio} />
      <StatCell value={player.kast} mean={avgP.kast?.mean} std={avgP.kast?.std} format={formatPct} />
      <StatCell value={fkPerR} mean={avgP.fk_pct?.mean} std={avgP.fk_pct?.std} format={formatRatio} />
      <StatCell value={fdPerR} mean={avgP.fd_pct?.mean} std={avgP.fd_pct?.std} format={formatRatio} invert />
      <td className="px-1.5 py-0.5 text-center font-mono border border-border">{fkfd === Infinity ? '-' : formatRatio(fkfd)}</td>
      <StatCell value={player.clutch_pct} mean={avgP.clutch_pct?.mean} std={avgP.clutch_pct?.std} format={formatPct} />
      <StatCell value={player.awp_pct} mean={avgP.awp_pct?.mean} std={avgP.awp_pct?.std} format={formatPct} />
    </tr>
  )
}
