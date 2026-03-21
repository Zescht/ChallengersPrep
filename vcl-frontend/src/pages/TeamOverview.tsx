import { Fragment, useEffect, useState } from 'react'
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

const TEAM_LOGOS: Record<string, string> = {
  FKS: 'fks.png', SGE: 'sge.png', JL: 'jl.png', MDR: 'mdr.png',
  EP: 'ep.png', TL: 'tl.png', PXL: 'pxl.png', M1R: 'm1r.png',
  BAR: 'bar.png', UCAM: 'ucam.png', MISA: 'misa.png', S2G: 's2g.png',
  STS: 'sts.png', GNG: 'gng.png',
}

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
  if (!team) return <div className="p-8 text-error">Team not found: {teamName}</div>

  const teamPlayers = data.players.filter(p => p.team === team.name)
  const mapRows = [...team.maps].sort((a, b) => b.plays - a.plays)
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
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-outline mt-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                VCL EMEA 2026
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                Stage 1
              </span>
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
              <thead className="bg-surface-container/60 sticky top-0 z-10">
                {/* Group headers */}
                <tr>
                  <th colSpan={5} className="px-3 py-2 scannable-label text-center border-b border-white/5"></th>
                  <th colSpan={3} className="px-3 py-2 scannable-label text-center text-on-surface/60 border-b border-white/5 border-l border-white/5">All Rounds</th>
                  <th colSpan={3} className="px-3 py-2 scannable-label text-center text-secondary/80 border-b border-white/5 border-l border-white/5">Pistols</th>
                  <th colSpan={3} className="px-3 py-2 scannable-label text-center text-primary/80 border-b border-white/5 border-l border-white/5">Gun</th>
                  <th colSpan={3} className="px-3 py-2 scannable-label text-center text-tertiary/80 border-b border-white/5 border-l border-white/5">Anti Eco</th>
                  <th colSpan={3} className="px-3 py-2 scannable-label text-center text-error/60 border-b border-white/5 border-l border-white/5">Eco</th>
                </tr>
                {/* Column headers */}
                <tr>
                  <th className="px-3 py-2 scannable-label text-left">Map</th>
                  <th className="px-2 py-2 scannable-label text-center">Comp</th>
                  <th className="px-2 py-2 scannable-label text-center">P</th>
                  <th className="px-2 py-2 scannable-label text-center">W</th>
                  <th className="px-2 py-2 scannable-label text-center">L</th>
                  <th className="px-2 py-2 scannable-label text-center border-l border-white/5">rW%</th>
                  <th className="px-2 py-2 scannable-label text-center">aW%</th>
                  <th className="px-2 py-2 scannable-label text-center">dW%</th>
                  <th className="px-2 py-2 scannable-label text-center border-l border-white/5">rW%</th>
                  <th className="px-2 py-2 scannable-label text-center">aW%</th>
                  <th className="px-2 py-2 scannable-label text-center">dW%</th>
                  <th className="px-2 py-2 scannable-label text-center border-l border-white/5">rW%</th>
                  <th className="px-2 py-2 scannable-label text-center">aW%</th>
                  <th className="px-2 py-2 scannable-label text-center">dW%</th>
                  <th className="px-2 py-2 scannable-label text-center border-l border-white/5">rW%</th>
                  <th className="px-2 py-2 scannable-label text-center">aW%</th>
                  <th className="px-2 py-2 scannable-label text-center">dW%</th>
                  <th className="px-2 py-2 scannable-label text-center border-l border-white/5">rW%</th>
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
                  <th className="px-2 py-2 scannable-label text-center">Scens</th>
                  <th className="px-2 py-2 scannable-label text-center">/Map</th>
                  <th className="px-2 py-2 scannable-label text-center">rW%</th>
                  <th className="px-2 py-2 scannable-label text-center">Avg</th>
                  <th className="px-2 py-2 scannable-label text-center">Rk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mapRows.map(ms => (
                  <PostPlantRow key={ms.map} ms={ms} avgs={averages.perMap[ms.map]} siteAvgs={averages.perMapSiteAvgs[ms.map]} type="post" />
                ))}
                <PostPlantRow ms={team.allMaps} avgs={averages.team} siteAvgs={averages.siteAvgs} isAggregate type="post" />
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
                  <th className="px-2 py-2 scannable-label text-center">Scens</th>
                  <th className="px-2 py-2 scannable-label text-center">/Map</th>
                  <th className="px-2 py-2 scannable-label text-center">rW%</th>
                  <th className="px-2 py-2 scannable-label text-center">Avg</th>
                  <th className="px-2 py-2 scannable-label text-center">Rk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mapRows.map(ms => (
                  <PostPlantRow key={ms.map} ms={ms} avgs={averages.perMap[ms.map]} siteAvgs={averages.perMapSiteAvgs[ms.map]} type="ret" />
                ))}
                <PostPlantRow ms={team.allMaps} avgs={averages.team} siteAvgs={averages.siteAvgs} isAggregate type="ret" />
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── Player Stats + XvY ── */}
      <div className="flex gap-6">
        {/* Player Metrics */}
        <section className="flex-1 min-w-0 bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 flex flex-col">
          <div className="px-5 py-3 bg-surface-container-high/60 flex items-center gap-2 border-b border-white/5">
            <span className="material-symbols-outlined text-secondary text-lg">person</span>
            <h3 className="font-headline font-bold text-xs tracking-tight uppercase">Individual Elite Metrics</h3>
          </div>
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left ghost-borders">
              <thead className="bg-surface-container/60 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 scannable-label text-left">Player</th>
                  <th className="px-2 py-2 scannable-label text-center">Agents</th>
                  <th className="px-2 py-2 scannable-label text-center">Rnds</th>
                  <th className="px-2 py-2 scannable-label text-center">K/D</th>
                  <th className="px-2 py-2 scannable-label text-center">KA/D</th>
                  <th className="px-2 py-2 scannable-label text-center">KAST</th>
                  <th className="px-2 py-2 scannable-label text-center">FK/r</th>
                  <th className="px-2 py-2 scannable-label text-center">FD/r</th>
                  <th className="px-2 py-2 scannable-label text-center">FK/FD</th>
                  <th className="px-2 py-2 scannable-label text-center">CL%</th>
                  <th className="px-2 py-2 scannable-label text-center">OP%</th>
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
        <div className="shrink-0 flex gap-3">
          <XvYMatrix title="Team XvY" entries={team.xvy} mode="absolute" />
          <XvYMatrix title="XvY vs Avg" entries={team.xvy} averages={averages.xvy} mode="delta" />
          <XvYMatrix title="Attending Avg" averages={averages.xvy} mode="average" />
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
  const a = avgs || {}
  const rowClass = isAggregate
    ? 'bg-surface-container-high/40 border-t border-white/10'
    : highlight
      ? 'bg-primary/5 border-l-2 border-l-primary'
      : 'hover:bg-white/5 transition-colors'

  return (
    <tr className={rowClass}>
      <td className="px-3 py-2.5 text-left font-bold text-on-surface text-sm whitespace-nowrap">{isAggregate ? 'All Maps' : ms.map}</td>
      <td className="px-2 py-2.5 text-center">
        <div className="flex gap-0.5 justify-center">
          {ms.comp.slice(0, 5).map((agent, i) => (
            <AgentIcon key={i} agent={agent} size={16} />
          ))}
        </div>
      </td>
      <td className="px-2 py-2.5 text-center text-xs text-on-surface">{ms.plays}</td>
      <td className="px-2 py-2.5 text-center text-xs text-on-surface">{ms.wins}</td>
      <td className="px-2 py-2.5 text-center text-xs text-on-surface">{ms.losses}</td>
      {/* All rounds */}
      <StatCell value={ms.rW_pct} mean={a.rW_pct?.mean} std={a.rW_pct?.std} format={formatPct} className="border-l border-white/5" />
      <StatCell value={ms.atk_rW_pct} mean={a.atk_rW_pct?.mean} std={a.atk_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.def_rW_pct} mean={a.def_rW_pct?.mean} std={a.def_rW_pct?.std} format={formatPct} />
      {/* Pistols */}
      <StatCell value={ms.pistol_rW_pct} mean={a.pistol_rW_pct?.mean} std={a.pistol_rW_pct?.std} format={formatPct} className="border-l border-white/5" />
      <StatCell value={ms.pistol_atk_rW_pct} mean={a.pistol_atk_rW_pct?.mean} std={a.pistol_atk_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.pistol_def_rW_pct} mean={a.pistol_def_rW_pct?.mean} std={a.pistol_def_rW_pct?.std} format={formatPct} />
      {/* Gun */}
      <StatCell value={ms.gun_rW_pct} mean={a.gun_rW_pct?.mean} std={a.gun_rW_pct?.std} format={formatPct} className="border-l border-white/5" />
      <StatCell value={ms.gun_atk_rW_pct} mean={a.gun_atk_rW_pct?.mean} std={a.gun_atk_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.gun_def_rW_pct} mean={a.gun_def_rW_pct?.mean} std={a.gun_def_rW_pct?.std} format={formatPct} />
      {/* Anti Eco */}
      <StatCell value={ms.antieco_rW_pct} mean={a.antieco_rW_pct?.mean} std={a.antieco_rW_pct?.std} format={formatPct} className="border-l border-white/5" />
      <StatCell value={ms.antieco_atk_rW_pct} mean={a.antieco_atk_rW_pct?.mean} std={a.antieco_atk_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.antieco_def_rW_pct} mean={a.antieco_def_rW_pct?.mean} std={a.antieco_def_rW_pct?.std} format={formatPct} />
      {/* Eco */}
      <StatCell value={ms.eco_rW_pct} mean={a.eco_rW_pct?.mean} std={a.eco_rW_pct?.std} format={formatPct} className="border-l border-white/5" />
      <StatCell value={ms.eco_atk_rW_pct} mean={a.eco_atk_rW_pct?.mean} std={a.eco_atk_rW_pct?.std} format={formatPct} />
      <StatCell value={ms.eco_def_rW_pct} mean={a.eco_def_rW_pct?.mean} std={a.eco_def_rW_pct?.std} format={formatPct} />
    </tr>
  )
}

function PostPlantRow({ ms, avgs, siteAvgs, isAggregate = false, type }: { ms: MapStats; avgs?: Record<string, { mean: number; std: number }>; siteAvgs?: Record<string, { mean: number; std: number }>; isAggregate?: boolean; type: 'post' | 'ret' }) {
  const [expanded, setExpanded] = useState(false)
  const a = avgs || {}
  const sa = siteAvgs || {}
  const rowClass = isAggregate ? 'bg-surface-container-high/40 border-t border-white/10' : 'hover:bg-white/5 transition-colors'

  const scens = type === 'post' ? ms.post_scens : ms.ret_scens
  const perMap = type === 'post' ? ms.post_per_map : ms.ret_per_map
  const rwPct = type === 'post' ? ms.post_rW_pct : ms.ret_rW_pct
  const avg = type === 'post' ? ms.post_rW_event_avg : ms.ret_rW_event_avg
  const rank = type === 'post' ? ms.post_rank : ms.ret_rank
  const statKey = type === 'post' ? 'post_rW_pct' : 'ret_rW_pct'
  const bySite = type === 'post' ? ms.post_by_site : ms.ret_by_site
  const sites = bySite ? Object.keys(bySite).filter(s => s !== '?').sort() : []
  const hasSites = sites.length > 0

  return (
    <Fragment>
      <tr className={`${rowClass} cursor-pointer`} onClick={() => hasSites && setExpanded(v => !v)}>
        <td className="px-3 py-2 text-left font-bold text-on-surface text-xs whitespace-nowrap">
          <div className="flex items-center gap-1">
            {hasSites && (
              <span className={`material-symbols-outlined text-sm text-text-dim transition-transform ${expanded ? 'rotate-90' : ''}`}>
                chevron_right
              </span>
            )}
            {isAggregate ? 'All Maps' : ms.map}
          </div>
        </td>
        <td className="px-2 py-2 text-center text-xs text-on-surface">{scens}</td>
        <td className="px-2 py-2 text-center text-xs text-on-surface">{formatRatio(perMap)}</td>
        <StatCell value={rwPct} mean={a[statKey]?.mean} std={a[statKey]?.std} format={formatPct} />
        <td className="px-2 py-2 text-center text-xs text-on-surface-variant">{formatPct(avg)}</td>
        <td className="px-2 py-2 text-center text-xs text-on-surface font-bold">{rank}</td>
      </tr>
      {expanded && sites.map(site => {
        const sd = bySite![site]
        const siteStatKey = `${type}_${site}`
        const siteStats = sa[siteStatKey]
        const siteAvg = siteStats?.mean ?? 0
        return (
          <tr key={site} className="bg-white/3 dark:bg-white/3" style={{ backgroundColor: 'var(--theme-site-expand-bg, rgba(255,255,255,0.03))' }}>
            <td className="pl-8 pr-3 py-1.5 text-left text-xs text-on-surface whitespace-nowrap">
              Site {site}
            </td>
            <td className="px-2 py-1.5 text-center text-xs text-on-surface">{sd.scens}</td>
            <td className="px-2 py-1.5 text-center text-xs text-on-surface">{ms.plays > 0 ? formatRatio(sd.scens / ms.plays) : '—'}</td>
            <StatCell value={sd.pct} mean={siteStats?.mean} std={siteStats?.std} format={formatPct} />
            <td className="px-2 py-1.5 text-center text-xs text-on-surface">{formatPct(siteAvg)}</td>
            <td className="px-2 py-1.5 text-center text-xs text-on-surface">—</td>
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
  const fkfd = player.fd > 0 ? player.fk / player.fd : player.fk > 0 ? Infinity : 0

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-3 py-2.5 text-left whitespace-nowrap">
        <Link to={`/player/${encodeURIComponent(player.ign)}`} className="text-player-link hover:underline font-bold text-xs">
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
      <td className="px-2 py-2.5 text-center font-table text-xs text-on-surface">{player.rounds}</td>
      <StatCell value={player.kd} mean={avgP.kd?.mean} std={avgP.kd?.std} format={formatRatio} />
      <StatCell value={player.kad} mean={avgP.kad?.mean} std={avgP.kad?.std} format={formatRatio} />
      <StatCell value={player.kast} mean={avgP.kast?.mean} std={avgP.kast?.std} format={formatPct} />
      <StatCell value={fkPerR} mean={avgP.fk_pct?.mean} std={avgP.fk_pct?.std} format={formatRatio} />
      <StatCell value={fdPerR} mean={avgP.fd_pct?.mean} std={avgP.fd_pct?.std} format={formatRatio} invert />
      <td className="px-2 py-2.5 text-center font-table text-xs text-on-surface">{fkfd === Infinity ? '-' : formatRatio(fkfd)}</td>
      <StatCell value={player.clutch_pct} mean={avgP.clutch_pct?.mean} std={avgP.clutch_pct?.std} format={formatPct} />
      <StatCell value={player.awp_pct} mean={avgP.awp_pct?.mean} std={avgP.awp_pct?.std} format={formatPct} />
    </tr>
  )
}
