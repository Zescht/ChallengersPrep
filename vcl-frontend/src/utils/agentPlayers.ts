import type { AgentPlayer } from '../types'

/**
 * Given a composition (list of agents) and the team's agent-player data,
 * return a mapping of agent → player name such that no player appears twice.
 *
 * Uses maximum-weight bipartite matching via backtracking (only 5 agents,
 * so the search space is tiny). This correctly handles flex players who
 * appear on multiple agents — the greedy approach fails when a high-rounds
 * player blocks a later agent that has no other candidate.
 */
export function resolveCompPlayers(
  comp: string[],
  teamAgentData: AgentPlayer[],
): Record<string, string> {
  const compSet = new Set(comp)

  // Build candidates per agent: agent → [{ign, rounds}] sorted by rounds desc
  const candidatesPerAgent: Record<string, { ign: string; rounds: number }[]> = {}
  for (const agent of comp) {
    candidatesPerAgent[agent] = []
  }
  for (const ap of teamAgentData) {
    if (compSet.has(ap.agent)) {
      candidatesPerAgent[ap.agent].push({ ign: ap.ign, rounds: ap.rounds })
    }
  }
  for (const agent of comp) {
    candidatesPerAgent[agent].sort((a, b) => b.rounds - a.rounds)
  }

  // Backtracking search for maximum-weight complete assignment
  const agents = [...comp]
  let bestAssignment: Record<string, string> = {}
  let bestScore = -1

  function backtrack(
    idx: number,
    assignment: Record<string, string>,
    usedPlayers: Set<string>,
    score: number,
  ) {
    if (idx === agents.length) {
      if (score > bestScore) {
        bestScore = score
        bestAssignment = { ...assignment }
      }
      return
    }

    const agent = agents[idx]
    let assigned = false

    for (const c of candidatesPerAgent[agent]) {
      if (usedPlayers.has(c.ign)) continue
      assignment[agent] = c.ign
      usedPlayers.add(c.ign)
      backtrack(idx + 1, assignment, usedPlayers, score + c.rounds)
      usedPlayers.delete(c.ign)
      delete assignment[agent]
      assigned = true
    }

    // If no candidate available for this agent, skip it
    if (!assigned) {
      backtrack(idx + 1, assignment, usedPlayers, score)
    }
  }

  backtrack(0, {}, new Set(), 0)
  return bestAssignment
}
