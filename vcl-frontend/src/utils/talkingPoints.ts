import type { Team, StatsData, TournamentAverages } from '../types'

export function generateTalkingPoints(team: Team, data: StatsData, averages: TournamentAverages): string[] {
  const points: string[] = []

  const last5 = team.form.slice(0, 5)
  if (last5.length >= 5) {
    const wins = last5.filter(f => f.result === 'W').length
    const losses = last5.length - wins
    if (wins >= 4) points.push(`Strong recent form — ${wins}W${losses}L in last 5 maps`)
    if (losses >= 4) points.push(`Poor recent form — ${wins}W${losses}L in last 5 maps`)
  }

  for (const mapStat of team.maps) {
    if (mapStat.plays >= 3) {
      if (mapStat.rW_pct >= 0.7) points.push(`${team.name} wins ${(mapStat.rW_pct * 100).toFixed(1)}% of rounds on ${mapStat.map}`)
      if (mapStat.rW_pct <= 0.35) points.push(`${team.name} struggles on ${mapStat.map} (${(mapStat.rW_pct * 100).toFixed(1)}% round win rate)`)
    }
  }

  if (team.allMaps.post_rank <= 3) {
    points.push(`Top ${team.allMaps.post_rank} post-plant team in the tournament (${(team.allMaps.post_rW_pct * 100).toFixed(1)}%)`)
  }
  if (team.allMaps.ret_rank <= 3) {
    points.push(`Top ${team.allMaps.ret_rank} retake team in the tournament (${(team.allMaps.ret_rW_pct * 100).toFixed(1)}%)`)
  }

  const ecoAvg = averages.team.eco_rW_pct?.mean ?? 0
  if (team.allMaps.eco_rW_pct >= 0.35) {
    points.push(`Strong eco game: ${(team.allMaps.eco_rW_pct * 100).toFixed(1)}% eco round win rate (tournament avg: ${(ecoAvg * 100).toFixed(1)}%)`)
  }

  const teamPlayers = data.players.filter(p => p.team === team.name)
  for (const player of teamPlayers) {
    if (player.clutch_pct >= 0.2) {
      points.push(`${player.ign} closes out ${(player.clutch_pct * 100).toFixed(1)}% of clutch scenarios`)
    }
  }

  for (const [stat, lb] of Object.entries(data.leaderboards)) {
    const lastRank = lb.entries.length
    for (const player of teamPlayers) {
      const entry = lb.entries.find(e => e.ign === player.ign)
      if (entry?.rank === 1) {
        points.push(`Best ${stat.toUpperCase()} in the tournament: ${player.ign}`)
      } else if (entry?.rank === 2) {
        points.push(`${player.ign} ranks 2nd in ${stat.toUpperCase()}`)
      } else if (entry?.rank === lastRank) {
        points.push(`Lowest ${stat.toUpperCase()} in the tournament: ${player.ign}`)
      }
    }
  }

  return points.slice(0, 5)
}
