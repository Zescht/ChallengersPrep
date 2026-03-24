import { Fragment, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import TeamSelector from '../components/TeamSelector'
import FormStrip from '../components/FormStrip'
import AgentIcon from '../components/AgentIcon'
import StatCell from '../components/StatCell'
import XvYMatrix from '../components/XvYMatrix'
import { formatPct, formatRatio } from '../utils/format'
import { fkColor, fkfdColor, clColor, opColor, adrColor, aprColor, retakeColor, retakeOnlyColor, kdColor } from '../utils/colors'
import { generateTalkingPoints } from '../utils/talkingPoints'
import type { MapStats, CompStats, Player } from '../types'

const TEAM_LOGOS: Record<string, string> = {
  FKS: 'fks.png', SGE: 'sge.png', JL: 'jl.png', MDR: 'mdr.png',
  EP: 'ep.png', TL: 'tl.png', PXL: 'pxl.png', M1R: 'm1r.png',
  BAR: 'bar.png', UCAM: 'ucam.png', MISA: 'misa.png', S2G: 's2g.png',
  STS: 'sts.png', GNG: 'gng.png',
}

export default function TeamOverview() {
  const { name } = useParams<{ name: string }>()
  const { data, averages } = useStats()
  const navigate = useNavigate()

  const teamName = decodeURIComponent(name || '')
  const team = data?.teams.find(t => t.name === teamName)

  useEffect(() => {
    if (team) {
      try { localStorage.setItem('vcl-last-team', team.name) } catch { /* noop */ }
    }
  }, [team])

  useEffect(() => {
    if (data && !data.teams.find(t => t.name === teamName)) {
      const first = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))[0]
      if (first) navigate(`/team/${encodeURIComponent(first.name)}`, { replace: true })
    }
  }, [data, teamName, navigate])

  if (!data || !averages) return null
  if (!team) return null

  const teamPlayers = data.players.filter(p => p.team === team.name)
  const mapRows = [...team.maps].sort((a, b) => a.map.localeCompare(b.map))
  const talkingPoints = generateTalkingPoints(team, data, averages)

  const mapWins = mapRows.reduce((s, m) => s + m.wins, 0)
  const mapLosses = mapRows.reduce((s, m) => s + m.losses, 0)

  const logo = TEAM_LOGOS[team.tag]

  return (
    <div className="p-6 space-y-6">
      {/* ── Team Profile Header ── */}
      <section className="flex items-center justify-between bg-surface-container-low/40 rounded-2xl p-5 border border-white/5">
        <div className="flex items-center gap-5">
          {logo && (
            <div className="w-16 h-16 bg-surface-container-highest rounded-xl flex items-center justify-center p-2 border border-outline-variant/20">
              <img
                src={`${import.meta.env.BASE_URL}logos/${logo}`}
                alt={team.tag}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div>
            <div className="flex items-center gap-4">
              <TeamSelector currentTeam={team.name} />
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          {/* Series Record */}
          <div className="px-5 py-2 glass-card rounded-xl border-l-2 border-primary">
            <div className="scannable-label">Series Record</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl stat-value text-primary">{team.series_record.wins}W</span>
              <span className="text-sm stat-value text-outline">/</span>
              <span className="text-xl stat-value text-error-dim">{team.series_record.losses}L</span>
            </div>
          </div>
          {/* Map Record */}
          <div className="px-5 py-2 glass-card rounded-xl border-l-2 border-tertiary">
            <div className="scannable-label">Map Record</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl stat-value text-tertiary">{mapWins}W</span>
              <span className="text-sm stat-value text-outline">/</span>
              <span className="text-xl stat-value text-outline">{mapLosses}L</span>
            </div>
          </div>
          {/* Form History */}
          <div className="px-4 py-2 glass-card rounded-xl flex flex-col justify-center">
            <div className="scannable-label mb-1.5">Form History</div>
            <FormStrip form={team.form} count={8} />
          </div>
        </div>
      </section>

      {/* ── Map Intelligence + Post Plant row ── */}
      <div className="flex gap-6">
        {/* Map Intelligence Table */}
        <section className="flex-1 min-w-0 bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 flex flex-col">
          <div className="px-5 py-3 bg-surface-container-high/60 flex items-center gap-2 border-b border-white/5">
            <span className="material-symbols-outlined text-primary text-xl">map</span>
            <h3 className="font-headline font-bold text-sm tracking-tight uppercase">Map Intelligence</h3>
          </div>
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left ghost-borders">
              <thead className="bg-surface-container sticky top-0 z-10">
                {/* Group headers */}
                <tr>
                  <th colSpan={3} className="px-3 py-2 scannable-label text-center border-b border-white/5"></th>
                  <th colSpan={3} className="px-3 py-2 scannable-label text-center border-b border-white/5 thick-sep"></th>
                  <th colSpan={3} className="px-3 py-2 scannable-label text-center text-on-surface/60 border-b border-white/5 thick-sep">All Rounds</th>
                  <th colSpan={3} className="px-3 py-2 scannable-label text-center text-secondary/80 border-b border-white/5 thick-sep">Pistols</th>
                  <th colSpan={3} className="px-3 py-2 scannable-label text-center text-primary/80 border-b border-white/5 thick-sep">Gun</th>
                  <th colSpan={3} className="px-3 py-2 scannable-label text-center text-tertiary/80 border-b border-white/5 thick-sep">Anti Eco</th>
                  <th colSpan={3} className="px-3 py-2 scannable-label text-center text-error/60 border-b border-white/5 thick-sep">Eco</th>
                </tr>
                {/* Column headers */}
                <tr>
                  <th className="px-3 py-2 scannable-label text-left">Map</th>
                  <th className="px-2 py-2 scannable-label text-center">Comp</th>
                  <th className="px-2 py-2 scannable-label text-center">x</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep">P</th>
                  <th className="px-2 py-2 scannable-label text-center">W</th>
                  <th className="px-2 py-2 scannable-label text-center">L</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep">rW%</th>
                  <th className="px-2 py-2 scannable-label text-center">aW%</th>
                  <th className="px-2 py-2 scannable-label text-center">dW%</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep">rW%</th>
                  <th className="px-2 py-2 scannable-label text-center">aW%</th>
                  <th className="px-2 py-2 scannable-label text-center">dW%</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep">rW%</th>
                  <th className="px-2 py-2 scannable-label text-center">aW%</th>
                  <th className="px-2 py-2 scannable-label text-center">dW%</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep">rW%</th>
                  <th className="px-2 py-2 scannable-label text-center">aW%</th>
                  <th className="px-2 py-2 scannable-label text-center">dW%</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep">rW%</th>
                  <th className="px-2 py-2 scannable-label text-center">aW%</th>
                  <th className="px-2 py-2 scannable-label text-center">dW%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mapRows.map((ms, i) => (
                  <MapStatsRow key={ms.map} ms={ms} avgs={averages.perMap[ms.map]} highlight={i === 0} />
                ))}
                <MapStatsRow ms={team.allMaps} avgs={averages.team} isAggregate />
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── Post Plant & Retake ── */}
      <div className="flex gap-6">
        <section className="flex-1 bg-surface-container-low rounded-2xl overflow-hidden border border-white/5">
          <div className="px-5 py-3 bg-surface-container-high/60 flex items-center gap-2 border-b border-white/5">
            <span className="material-symbols-outlined text-secondary text-lg">explosion</span>
            <h3 className="font-headline font-bold text-xs tracking-tight uppercase">Post Plant</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left ghost-borders">
              <thead className="bg-surface-container/60">
                <tr>
                  <th className="px-3 py-2 scannable-label text-left">Map</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep cursor-help" title="Amount of post-plant scenarios">Scens</th>
                  <th className="px-2 py-2 scannable-label text-center cursor-help" title="Average amount of scenarios per map">/Map</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep w-[100px] cursor-help" title="Average time to plant the spike (in seconds)">Avg Plant</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep">WIN%</th>
                  <th className="px-2 py-2 scannable-label text-center cursor-help" title="Average win rate of all teams in the competition">Avg</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep cursor-help" title="Rank compared to other teams in the competition">Rk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mapRows.map(ms => (
                  <PostPlantRow key={ms.map} ms={ms} siteAvgs={averages.perMapSiteAvgs[ms.map]} type="post" showPlantTime />
                ))}
                <PostPlantRow ms={team.allMaps} siteAvgs={averages.siteAvgs} isAggregate type="post" showPlantTime />
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex-1 bg-surface-container-low rounded-2xl overflow-hidden border border-white/5">
          <div className="px-5 py-3 bg-surface-container-high/60 flex items-center gap-2 border-b border-white/5">
            <span className="material-symbols-outlined text-tertiary text-lg">shield</span>
            <h3 className="font-headline font-bold text-xs tracking-tight uppercase">Retake</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left ghost-borders">
              <thead className="bg-surface-container/60">
                <tr>
                  <th className="px-3 py-2 scannable-label text-left">Map</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep cursor-help" title="Amount of retake scenarios">Scens</th>
                  <th className="px-2 py-2 scannable-label text-center cursor-help" title="Average amount of scenarios per map">/Map</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep">WIN%</th>
                  <th className="px-2 py-2 scannable-label text-center cursor-help" title="Average win rate of all teams in the competition">Avg</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep cursor-help" title="Rank compared to other teams in the competition">Rk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mapRows.map(ms => (
                  <PostPlantRow key={ms.map} ms={ms} siteAvgs={averages.perMapSiteAvgs[ms.map]} type="ret" />
                ))}
                <PostPlantRow ms={team.allMaps} siteAvgs={averages.siteAvgs} isAggregate type="ret" />
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── Player Stats + XvY ── */}
      <div className="flex gap-6">
        {/* Player Metrics */}
        <section className="w-1/2 shrink-0 bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 flex flex-col">
          <div className="px-5 py-3 bg-surface-container-high/60 flex items-center gap-2 border-b border-white/5">
            <span className="material-symbols-outlined text-secondary text-lg">person</span>
            <h3 className="font-headline font-bold text-xs tracking-tight uppercase">Players</h3>
          </div>
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left ghost-borders">
              <thead className="bg-surface-container/60 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 scannable-label text-left whitespace-nowrap">Player</th>
                  <th className="px-2 py-2 scannable-label text-center whitespace-nowrap">Agents</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep">Rnds</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep">K/D</th>
                  <th className="px-2 py-2 scannable-label text-center cursor-help" title="Average Damage per Round">ADR</th>
                  <th className="px-2 py-2 scannable-label text-center cursor-help" title="Assists per Round">APR</th>
                  <th className="px-2 py-2 scannable-label text-center thick-sep">FK/r</th>
                  <th className="px-2 py-2 scannable-label text-center">FD/r</th>
                  <th className="px-2 py-2 scannable-label text-center cursor-help" title="Percentage of opening duels won (FK / (FK + FD))">FK%</th>
                  <th className="px-2 py-2 scannable-label text-center cursor-help thick-sep" title="Percentage of clutch situations won">CL%</th>
                  <th className="px-2 py-2 scannable-label text-center cursor-help thick-sep" title="Percentage of kills made with the Operator">OP%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teamPlayers.map(p => (
                  <PlayerRow key={p.ign} player={p} avgP={averages.player} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* XvY Matrices */}
        <div className="flex-1 flex gap-3 self-start">
          <div className="flex-1"><XvYMatrix title="Team XvY" entries={team.xvy} mode="absolute" /></div>
          <div className="flex-1"><XvYMatrix title="XvY vs Avg" entries={team.xvy} averages={averages.xvy} mode="delta" /></div>
        </div>
      </div>

      {/* ── Talking Points ── */}
      {talkingPoints.length > 0 && (
        <section className="bg-surface-container rounded-2xl p-5 border-l-4 border-secondary border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <span className="material-symbols-outlined text-6xl">lightbulb</span>
          </div>
          <h3 className="font-headline font-bold text-on-surface mb-4 uppercase tracking-wider flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            Talking Points
          </h3>
          <ul className="space-y-3">
            {talkingPoints.map((point, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-1 h-1 rounded-full bg-secondary mt-1.5 shrink-0"></span>
                <p className="text-[11px] text-on-surface/90 leading-relaxed font-medium">{point}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/* ──── Sub-components ──── */

function MapStatsRow({ ms, avgs, isAggregate = false, highlight = false }: { ms: MapStats; avgs?: Record<string, { mean: number; std: number }>; isAggregate?: boolean; highlight?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const a = avgs || {}
  const hasComps = !isAggregate && ms.comps && ms.comps.length > 1
  const rowClass = isAggregate
    ? 'bg-surface-container-high/40 border-t border-white/10'
    : highlight
      ? 'bg-primary/5'
      : 'hover:bg-white/5 transition-colors'

  return (
    <Fragment>
      <tr className={`${rowClass} ${hasComps ? 'cursor-pointer' : ''}`} onClick={() => hasComps && setExpanded(v => !v)}>
        <td className="px-3 py-2.5 text-left font-bold font-table text-on-surface text-xs whitespace-nowrap">
          {isAggregate ? 'All Maps' : ms.map}
        </td>
        <td className="px-2 py-2.5 text-center">
          <div className="flex gap-0.5 justify-center">
            {ms.comp.slice(0, 5).map((agent, i) => (
              <AgentIcon key={i} agent={agent} size={16} />
            ))}
          </div>
        </td>
        <td className="px-2 py-2.5 text-center font-table text-xs text-on-surface">{ms.comp_count || ''}</td>
        <td className="px-2 py-2.5 text-center font-table text-xs text-on-surface thick-sep">{ms.plays}</td>
        <td className="px-2 py-2.5 text-center font-table text-xs text-on-surface">{ms.wins}</td>
        <td className="px-2 py-2.5 text-center font-table text-xs text-on-surface">{ms.losses}</td>
        {/* All rounds */}
        <StatCell value={ms.rW_pct} mean={a.rW_pct?.mean} std={a.rW_pct?.std} format={formatPct} className="thick-sep" boldBlack />
        <StatCell value={ms.atk_rW_pct} mean={a.atk_rW_pct?.mean} std={a.atk_rW_pct?.std} format={formatPct} />
        <StatCell value={ms.def_rW_pct} mean={a.def_rW_pct?.mean} std={a.def_rW_pct?.std} format={formatPct} />
        {/* Pistols */}
        <StatCell value={ms.pistol_rW_pct} mean={a.pistol_rW_pct?.mean} std={a.pistol_rW_pct?.std} format={formatPct} className="thick-sep" boldBlack />
        <StatCell value={ms.pistol_atk_rW_pct} mean={a.pistol_atk_rW_pct?.mean} std={a.pistol_atk_rW_pct?.std} format={formatPct} />
        <StatCell value={ms.pistol_def_rW_pct} mean={a.pistol_def_rW_pct?.mean} std={a.pistol_def_rW_pct?.std} format={formatPct} />
        {/* Gun */}
        <StatCell value={ms.gun_rW_pct} mean={a.gun_rW_pct?.mean} std={a.gun_rW_pct?.std} format={formatPct} className="thick-sep" boldBlack />
        <StatCell value={ms.gun_atk_rW_pct} mean={a.gun_atk_rW_pct?.mean} std={a.gun_atk_rW_pct?.std} format={formatPct} />
        <StatCell value={ms.gun_def_rW_pct} mean={a.gun_def_rW_pct?.mean} std={a.gun_def_rW_pct?.std} format={formatPct} />
        {/* Anti Eco */}
        <StatCell value={ms.antieco_rW_pct} mean={a.antieco_rW_pct?.mean} std={a.antieco_rW_pct?.std} format={formatPct} className="thick-sep" boldBlack />
        <StatCell value={ms.antieco_atk_rW_pct} mean={a.antieco_atk_rW_pct?.mean} std={a.antieco_atk_rW_pct?.std} format={formatPct} />
        <StatCell value={ms.antieco_def_rW_pct} mean={a.antieco_def_rW_pct?.mean} std={a.antieco_def_rW_pct?.std} format={formatPct} />
        {/* Eco */}
        <StatCell value={ms.eco_rW_pct} mean={a.eco_rW_pct?.mean} std={a.eco_rW_pct?.std} format={formatPct} className="thick-sep" boldBlack />
        <StatCell value={ms.eco_atk_rW_pct} mean={a.eco_atk_rW_pct?.mean} std={a.eco_atk_rW_pct?.std} format={formatPct} />
        <StatCell value={ms.eco_def_rW_pct} mean={a.eco_def_rW_pct?.mean} std={a.eco_def_rW_pct?.std} format={formatPct} />
      </tr>
      {expanded && ms.comps?.map((c, i) => (
        <CompRow key={i} c={c} avgs={a} />
      ))}
    </Fragment>
  )
}

function CompRow({ c, avgs }: { c: CompStats; avgs: Record<string, { mean: number; std: number }> }) {
  const a = avgs
  return (
    <tr className="bg-surface-container/10">
      <td className="px-3 py-1.5 text-left text-xs text-text-dim pl-8"></td>
      <td className="px-2 py-1.5 text-center">
        <div className="flex gap-0.5 justify-center">
          {c.comp.slice(0, 5).map((agent, i) => (
            <AgentIcon key={i} agent={agent} size={14} />
          ))}
        </div>
      </td>
      <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{c.comp_count}</td>
      <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface thick-sep">{c.plays}</td>
      <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{c.wins}</td>
      <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface">{c.losses}</td>
      {/* All rounds */}
      <StatCell value={c.rW_pct} mean={a.rW_pct?.mean} std={a.rW_pct?.std} format={formatPct} className="thick-sep" boldBlack />
      <StatCell value={c.atk_rW_pct} mean={a.atk_rW_pct?.mean} std={a.atk_rW_pct?.std} format={formatPct} />
      <StatCell value={c.def_rW_pct} mean={a.def_rW_pct?.mean} std={a.def_rW_pct?.std} format={formatPct} />
      {/* Pistols */}
      <StatCell value={c.pistol_rW_pct} mean={a.pistol_rW_pct?.mean} std={a.pistol_rW_pct?.std} format={formatPct} className="thick-sep" boldBlack />
      <StatCell value={c.pistol_atk_rW_pct} mean={a.pistol_atk_rW_pct?.mean} std={a.pistol_atk_rW_pct?.std} format={formatPct} />
      <StatCell value={c.pistol_def_rW_pct} mean={a.pistol_def_rW_pct?.mean} std={a.pistol_def_rW_pct?.std} format={formatPct} />
      {/* Gun — not available per comp */}
      <td className="px-2 py-1.5 text-center font-table text-text-dim text-xs thick-sep">-</td>
      <td className="px-2 py-1.5 text-center font-table text-text-dim text-xs">-</td>
      <td className="px-2 py-1.5 text-center font-table text-text-dim text-xs">-</td>
      {/* Anti Eco — not available per comp */}
      <td className="px-2 py-1.5 text-center font-table text-text-dim text-xs thick-sep">-</td>
      <td className="px-2 py-1.5 text-center font-table text-text-dim text-xs">-</td>
      <td className="px-2 py-1.5 text-center font-table text-text-dim text-xs">-</td>
      {/* Eco — not available per comp */}
      <td className="px-2 py-1.5 text-center font-table text-text-dim text-xs thick-sep">-</td>
      <td className="px-2 py-1.5 text-center font-table text-text-dim text-xs">-</td>
      <td className="px-2 py-1.5 text-center font-table text-text-dim text-xs">-</td>
    </tr>
  )
}

function PostPlantRow({ ms, siteAvgs, isAggregate = false, type, showPlantTime = false }: { ms: MapStats; siteAvgs?: Record<string, { mean: number; std: number }>; isAggregate?: boolean; type: 'post' | 'ret'; showPlantTime?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const sa = siteAvgs || {}
  const rowClass = isAggregate ? 'bg-surface-container-high/40 border-t border-white/10' : 'hover:bg-white/5 transition-colors'

  const scens = type === 'post' ? ms.post_scens : ms.ret_scens
  const perMap = type === 'post' ? ms.post_per_map : ms.ret_per_map
  const rwPct = type === 'post' ? ms.post_rW_pct : ms.ret_rW_pct
  const avg = type === 'post' ? ms.post_rW_event_avg : ms.ret_rW_event_avg
  const rank = type === 'post' ? ms.post_rank : ms.ret_rank
  const bySite = type === 'post' ? ms.post_by_site : ms.ret_by_site
  const sites = bySite ? Object.keys(bySite).filter(s => s !== '?').sort() : []
  const colorFn = type === 'post' ? retakeColor : retakeOnlyColor
  const hasSites = sites.length > 0

  return (
    <Fragment>
      <tr className={`${rowClass} cursor-pointer`} onClick={() => hasSites && setExpanded(v => !v)}>
        <td className="px-3 py-2 text-left font-bold font-table text-on-surface text-xs whitespace-nowrap">
          <div className="flex items-center gap-1">
            {hasSites && (
              <span className={`material-symbols-outlined text-sm text-text-dim transition-transform ${expanded ? 'rotate-90' : ''}`}>
                chevron_right
              </span>
            )}
            {isAggregate ? 'All Maps' : ms.map}
          </div>
        </td>
        <td className="px-2 py-2 text-center font-table text-xs text-on-surface font-bold thick-sep">{scens}</td>
        <td className="px-2 py-2 text-center font-table text-xs text-on-surface font-bold">{formatRatio(perMap)}</td>
        {showPlantTime && (
          <td className="px-2 py-2 text-center font-table text-xs text-on-surface font-bold thick-sep">
            {ms.avg_plant_time != null ? `${ms.avg_plant_time.toFixed(1)}s` : '—'}
          </td>
        )}
        <StatCell value={rwPct} format={formatPct} customColor={colorFn} className="thick-sep" />
        <td className="px-2 py-2 text-center font-table text-xs text-on-surface-variant font-bold">{formatPct(avg)}</td>
        <td className="px-2 py-2 text-center font-table text-xs text-on-surface font-bold thick-sep">{rank}</td>
      </tr>
      {expanded && sites.map(site => {
        const sd = bySite![site]
        const siteStatKey = `${type}_${site}`
        const siteStats = sa[siteStatKey]
        const siteAvg = siteStats?.mean ?? 0
        const sitePlantTime = showPlantTime && ms.plant_time_by_site ? ms.plant_time_by_site[site] : undefined
        return (
          <tr key={site} className="bg-white/3 dark:bg-white/3" style={{ backgroundColor: 'var(--theme-site-expand-bg, rgba(255,255,255,0.03))' }}>
            <td className="pl-8 pr-3 py-1.5 text-left font-table text-xs text-on-surface whitespace-nowrap">
              Site {site}
            </td>
            <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface font-bold thick-sep">{sd.scens}</td>
            <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface font-bold">{ms.plays > 0 ? formatRatio(sd.scens / ms.plays) : '—'}</td>
            {showPlantTime && (
              <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface font-bold thick-sep">
                {sitePlantTime != null ? `${sitePlantTime.toFixed(1)}s` : '—'}
              </td>
            )}
            <StatCell value={sd.pct} format={formatPct} customColor={colorFn} className="thick-sep" />
            <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface font-bold">{formatPct(siteAvg)}</td>
            <td className="px-2 py-1.5 text-center font-table text-xs text-on-surface font-bold thick-sep">—</td>
          </tr>
        )
      })}
    </Fragment>
  )
}

function PlayerRow({ player, avgP }: { player: Player; avgP: Record<string, { mean: number; std: number }> }) {
  const topAgents = [...player.agents].sort((a, b) => b.picks - a.picks).slice(0, 3)
  const fkPerR = player.rounds > 0 ? player.fk / player.rounds : 0
  const fdPerR = player.rounds > 0 ? player.fd / player.rounds : 0
  const fkfdPct = (player.fk + player.fd) > 0 ? player.fk / (player.fk + player.fd) : 0
  const aprVal = player.rounds > 0 ? player.assists / player.rounds : 0

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-3 py-2.5 text-left whitespace-nowrap font-bold font-table">
        <Link to={`/player/${encodeURIComponent(player.ign)}`} className="text-player-link hover:underline">
          {player.ign}
        </Link>
      </td>
      <td className="px-2 py-2.5 text-center">
        <div className="flex gap-0.5 justify-center">
          {topAgents.map((ap, i) => (
            <AgentIcon key={i} agent={ap.agent} size={16} />
          ))}
        </div>
      </td>
      <td className="px-2 py-2.5 text-center font-table text-xs text-on-surface thick-sep">{player.rounds}</td>
      <StatCell value={player.kd} format={formatRatio} customColor={kdColor} className="thick-sep" />
      <StatCell value={player.adr} format={(v: number) => Math.round(v).toString()} customColor={adrColor} />
      <StatCell value={aprVal} format={formatRatio} customColor={aprColor} />
      <StatCell value={fkPerR} mean={avgP.fk_pct?.mean} std={avgP.fk_pct?.std} format={formatRatio} customColor={fkColor} className="thick-sep" />
      <StatCell value={fdPerR} mean={avgP.fd_pct?.mean} std={avgP.fd_pct?.std} format={formatRatio} invert />
      <StatCell value={fkfdPct} format={formatPct} customColor={fkfdColor} />
      <StatCell value={player.clutch_pct} mean={avgP.clutch_pct?.mean} std={avgP.clutch_pct?.std} format={formatPct} customColor={clColor} className="thick-sep" />
      <StatCell value={player.awp_pct} mean={avgP.awp_pct?.mean} std={avgP.awp_pct?.std} format={formatPct} customColor={opColor} className="thick-sep" />
    </tr>
  )
}
