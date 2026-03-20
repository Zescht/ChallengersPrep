import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import AgentIcon from '../components/AgentIcon'

export default function MatchHistory() {
  const { name } = useParams<{ name: string }>()
  const { data } = useStats()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  if (!data || !name) return null

  const teamName = decodeURIComponent(name)
  const team = data.teams.find(t => t.name === teamName)
  if (!team) {
    return (
      <div className="p-6">
        <p className="text-danger">Team "{teamName}" not found.</p>
        <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">Back to home</Link>
      </div>
    )
  }

  const teams = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))

  // Filter matches for this team, sorted newest first
  const teamMatches = data.matches
    .filter(m => m.team1 === teamName || m.team2 === teamName)
    .sort((a, b) => b.date.localeCompare(a.date))

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <Link to={`/team/${encodeURIComponent(teamName)}`} className="text-primary hover:underline text-sm">
          &larr; Team Overview
        </Link>
        <select
          value={teamName}
          onChange={e => navigate(`/team/${encodeURIComponent(e.target.value)}/history`)}
          className="bg-card border border-border rounded px-3 py-1.5 text-lg font-semibold text-text focus:outline-none focus:border-primary"
        >
          {teams.map(t => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
        </select>
      </div>

      <h1 className="text-2xl font-bold mb-4">Match History — {team.tag}</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-nav border-b border-border">
            <th className="px-2 py-1.5 text-left text-text-muted font-medium w-24">Date</th>
            <th className="px-2 py-1.5 text-left text-text-muted font-medium">Opponent</th>
            <th className="px-2 py-1.5 text-left text-text-muted font-medium w-20">Map</th>
            <th className="px-2 py-1.5 text-center text-text-muted font-medium w-20">Score</th>
            <th className="px-2 py-1.5 text-center text-text-muted font-medium w-16">Result</th>
            <th className="px-2 py-1.5 text-left text-text-muted font-medium">Comp</th>
          </tr>
        </thead>
        <tbody>
          {teamMatches.map((match) => {
            const isTeam1 = match.team1 === teamName
            const opponent = isTeam1 ? match.team2 : match.team1
            const teamScore = isTeam1 ? match.team1_score : match.team2_score
            const oppScore = isTeam1 ? match.team2_score : match.team1_score
            const won = match.winner === teamName
            const teamAgents = isTeam1 ? match.team1_agents : match.team2_agents
            const oppAgents = isTeam1 ? match.team2_agents : match.team1_agents
            const matchKey = `${match.match_id}-${match.map}`
            const isExpanded = expanded.has(matchKey)

            // Starting side: team1 attacks first half in Valorant
            const startingSide = isTeam1 ? 'Attack' : 'Defense'
            const teamHalf = isTeam1 ? match.team1_score_at_half : match.team2_score_at_half
            const oppHalf = isTeam1 ? match.team2_score_at_half : match.team1_score_at_half

            return (
              <tr
                key={matchKey}
                className={`border-b border-border cursor-pointer hover:bg-card/50 ${isExpanded ? 'bg-card/30' : ''}`}
                onClick={() => toggleExpand(matchKey)}
              >
                <td className="px-2 py-1.5 text-text-muted align-top">{match.date}</td>
                <td className="px-2 py-1.5 align-top">{opponent}</td>
                <td className="px-2 py-1.5 align-top">{match.map}</td>
                <td className="px-2 py-1.5 text-center font-table align-top">{teamScore} – {oppScore}</td>
                <td className="px-2 py-1.5 text-center align-top">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${won ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                    {won ? 'W' : 'L'}
                  </span>
                </td>
                <td className="px-2 py-1.5 align-top">
                  <div className="flex gap-0.5">
                    {teamAgents.map((agent, i) => (
                      <AgentIcon key={i} agent={agent} size={16} />
                    ))}
                  </div>
                  {isExpanded && (
                    <div className="mt-2 text-xs space-y-1 pb-1">
                      <div>
                        <span className="text-text-dim">Started:</span>{' '}
                        <span className="text-text">{startingSide}</span>
                      </div>
                      <div>
                        <span className="text-text-dim">Half-time:</span>{' '}
                        <span className="font-table text-text">{teamHalf} – {oppHalf}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-text-dim">Opponent comp:</span>
                        {oppAgents.map((agent, i) => (
                          <AgentIcon key={i} agent={agent} size={16} />
                        ))}
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {teamMatches.length === 0 && (
        <p className="text-text-dim text-sm mt-4">No matches found for this team.</p>
      )}
    </div>
  )
}
