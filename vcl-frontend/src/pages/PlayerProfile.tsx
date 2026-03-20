import { useParams, Link } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import PlayerSelector from '../components/PlayerSelector'
import AgentIcon from '../components/AgentIcon'
import { formatPct, formatRatio, formatCount } from '../utils/format'

interface StatCardProps {
  label: string
  value: string
  rank?: number
  total?: number
}

function StatCard({ label, value, rank, total }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded px-3 py-2">
      <div className="text-text-muted text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-semibold font-table">{value}</div>
      {rank != null && total != null && (
        <div className="text-text-dim text-xs mt-0.5">#{rank} of {total} players</div>
      )}
    </div>
  )
}

export default function PlayerProfile() {
  const { ign } = useParams<{ ign: string }>()
  const { data } = useStats()

  if (!data || !ign) return null

  const decodedIgn = decodeURIComponent(ign)
  const player = data.players.find(p => p.ign === decodedIgn)
  if (!player) {
    return (
      <div className="p-6">
        <p className="text-danger">Player "{decodedIgn}" not found.</p>
        <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">Back to home</Link>
      </div>
    )
  }

  // Get rank from leaderboard
  function getRank(lbKey: string): { rank: number; total: number } | null {
    if (!lbKey || !data!.leaderboards[lbKey]) return null
    const lb = data!.leaderboards[lbKey]
    const entry = lb.entries.find(e => e.ign === player!.ign)
    if (!entry) return null
    return { rank: entry.rank, total: lb.entries.length }
  }

  const acsRank = getRank('acs')
  const kdRank = getRank('kd')
  const kastRank = getRank('kast')
  const fkRank = getRank('fk_pct')
  const fdRank = getRank('fd_pct')
  const clRank = getRank('cl_pct')
  const killsRank = getRank('kills')
  const deathsRank = getRank('deaths')
  const assistsRank = getRank('assists')
  const fkAbsRank = getRank('fk')
  const fdAbsRank = getRank('fd')

  // FK/FD ratio — no direct leaderboard
  const fkfd = player.fd > 0 ? player.fk / player.fd : 0

  // Agent pool — top 5 sorted by pct
  const topAgents = [...player.agents].sort((a, b) => b.pct - a.pct).slice(0, 5)

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          to={`/team/${encodeURIComponent(player.team)}`}
          className="text-primary hover:underline text-sm"
        >
          &larr; {player.team}
        </Link>
        <PlayerSelector currentIgn={player.ign} />
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{player.ign}</h1>
        <div className="text-text-muted text-sm mt-1">
          {player.team} &middot; {formatCount(player.rounds)} rounds played
        </div>
      </div>

      {/* Core Stats Grid */}
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Core Stats</h2>
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
        <StatCard
          label="ACS"
          value={`${formatCount(player.acs_split)} split / ${formatCount(player.acs_year)} year`}
          rank={acsRank?.rank}
          total={acsRank?.total}
        />
        <StatCard
          label="K/D"
          value={formatRatio(player.kd)}
          rank={kdRank?.rank}
          total={kdRank?.total}
        />
        <StatCard
          label="KA/D"
          value={formatRatio(player.kad)}
        />
        <StatCard
          label="KAST"
          value={formatPct(player.kast)}
          rank={kastRank?.rank}
          total={kastRank?.total}
        />
        <StatCard
          label="FK / round"
          value={formatPct(player.fk_pct)}
          rank={fkRank?.rank}
          total={fkRank?.total}
        />
        <StatCard
          label="FD / round"
          value={formatPct(player.fd_pct)}
          rank={fdRank?.rank}
          total={fdRank?.total}
        />
        <StatCard
          label="FK / FD"
          value={formatRatio(fkfd)}
        />
        <StatCard
          label="Clutch %"
          value={`${formatPct(player.clutch_pct)} (${player.clutches}/${player.clutch_scens})`}
          rank={clRank?.rank}
          total={clRank?.total}
        />
        <StatCard
          label="AWP %"
          value={formatPct(player.awp_pct)}
        />
        <StatCard
          label="First %"
          value={formatPct(player.first_pct)}
        />
      </div>

      {/* Raw Stats */}
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Raw Numbers</h2>
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
        <StatCard
          label="Kills"
          value={formatCount(player.kills)}
          rank={killsRank?.rank}
          total={killsRank?.total}
        />
        <StatCard
          label="Deaths"
          value={formatCount(player.deaths)}
          rank={deathsRank?.rank}
          total={deathsRank?.total}
        />
        <StatCard
          label="Assists"
          value={formatCount(player.assists)}
          rank={assistsRank?.rank}
          total={assistsRank?.total}
        />
        <StatCard
          label="First Kills"
          value={formatCount(player.fk)}
          rank={fkAbsRank?.rank}
          total={fkAbsRank?.total}
        />
        <StatCard
          label="First Deaths"
          value={formatCount(player.fd)}
          rank={fdAbsRank?.rank}
          total={fdAbsRank?.total}
        />
      </div>

      {/* Agent Pool + Clutch Breakdown side by side */}
      <div className="flex gap-6 flex-wrap">
        {/* Agent Pool */}
        <div className="flex-1 min-w-[280px]">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Agent Pool</h2>
          <div className="bg-card border border-border rounded p-3">
            {topAgents.length === 0 ? (
              <p className="text-text-dim text-sm">No agent data available.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topAgents.map(a => (
                  <div key={a.agent} className="flex items-center gap-3">
                    <AgentIcon agent={a.agent} size={32} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{a.agent}</div>
                      <div className="text-text-muted text-xs">{a.pct.toFixed(1)}% pick rate &middot; {a.matches} maps</div>
                    </div>
                    <div className="text-text-dim text-xs font-table">{a.picks} rds</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clutch Breakdown */}
        <div className="min-w-[200px]">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Clutch Breakdown</h2>
          <div className="bg-card border border-border rounded p-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <span className="text-text-muted">Scenarios</span>
              <span className="font-table text-right">{player.clutch_scens}</span>
              <span className="text-text-muted">Wins</span>
              <span className="font-table text-right">{player.clutches}</span>
              <span className="text-text-muted">Win %</span>
              <span className="font-table text-right">{formatPct(player.clutch_pct)}</span>
              <span className="text-text-muted">Conversion</span>
              <span className="font-table text-right">{formatPct(player.first_conversion)}</span>
            </div>
          </div>

          {/* Team XvY note */}
          <div className="mt-3">
            {(() => {
              const team = data.teams.find(t => t.name === player.team)
              if (!team || team.xvy.length === 0) return null
              return (
                <div className="bg-card border border-border rounded p-3">
                  <div className="text-xs text-text-muted mb-2">Team clutch situations ({team.tag})</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                    {team.xvy.map(x => (
                      <div key={x.situation} className="contents">
                        <span className="text-text-muted font-table">{x.situation}</span>
                        <span className="font-table text-right">{formatPct(x.win_pct)} ({x.wins}W-{x.losses}L)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
