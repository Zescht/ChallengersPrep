export interface SiteStats {
  scens: number
  wins: number
  pct: number
}

export interface CompStats {
  comp: string[]
  comp_count: number
  plays: number
  wins: number
  losses: number
  rW_pct: number
  atk_rW_pct: number
  def_rW_pct: number
  pistol_rW_pct: number
  pistol_atk_rW_pct: number
  pistol_def_rW_pct: number
}

export interface MapStats {
  map: string
  comp: string[]
  comp_count: number
  comps?: CompStats[]
  plays: number
  wins: number
  losses: number
  rW_pct: number
  atk_rW_pct: number
  def_rW_pct: number
  pistol_rW_pct: number
  pistol_atk_rW_pct: number
  pistol_def_rW_pct: number
  gun_rW_pct: number
  gun_atk_rW_pct: number
  gun_def_rW_pct: number
  antieco_rW_pct: number
  antieco_atk_rW_pct: number
  antieco_def_rW_pct: number
  eco_rW_pct: number
  eco_atk_rW_pct: number
  eco_def_rW_pct: number
  post_scens: number
  post_per_map: number
  post_rW_pct: number
  post_rW_event_avg: number
  post_rank: number
  post_by_site: Record<string, SiteStats>
  ret_scens: number
  ret_per_map: number
  ret_rW_pct: number
  ret_rW_event_avg: number
  ret_rank: number
  ret_by_site: Record<string, SiteStats>
  avg_plant_time?: number | null
  plant_time_by_site?: Record<string, number> | null
}

export interface XvYEntry {
  situation: string
  wins: number
  losses: number
  win_pct: number
}

export interface FormEntry {
  opponent: string
  map: string
  score: string
  result: 'W' | 'L'
}

export interface Team {
  name: string
  tag: string
  maps: MapStats[]
  allMaps: MapStats
  players: string[]
  xvy: XvYEntry[]
  series_record: { wins: number; losses: number }
  form: FormEntry[]
}

export interface AgentPick {
  agent: string
  picks: number
  matches: number
  pct: number
}

export interface Player {
  ign: string
  team: string
  acs_split: number
  acs_year: number
  adr: number
  rounds: number
  kills: number
  deaths: number
  assists: number
  fk: number
  fd: number
  kd: number
  kad: number
  first_pct: number
  fk_pct: number
  fd_pct: number
  first_conversion: number
  clutch_scens: number
  clutches: number
  clutch_pct: number
  kast: number
  awp_pct: number
  op_rounds: number
  op_rounds_won: number
  op_rw_pct: number
  vlr_rating: number
  agents: AgentPick[]
}

export interface Match {
  match_id: string
  series_id: string
  event: string
  map: string
  team1: string
  team2: string
  team1_agents: string[]
  team2_agents: string[]
  team1_score: number
  team2_score: number
  team1_score_at_half: number
  team2_score_at_half: number
  team1_atk_pistol_wins: number
  team1_def_pistol_wins: number
  team2_atk_pistol_wins: number
  team2_def_pistol_wins: number
  team1_atk_wins: number
  team1_atk_losses: number
  team1_def_wins: number
  team1_def_losses: number
  winner: string
  date: string
}

export interface LeaderboardEntry {
  rank: number
  ign: string
  team: string
  value: number
  rounds: number
}

export interface Leaderboard {
  entries: LeaderboardEntry[]
  tournament_avg: number
}

export interface RolePlayer extends Player {
  role: string
}

export interface AgentPlayer extends Player {
  agent: string
}

export interface AgentStat {
  ign: string
  team: string
  agent: string
  rounds: number
  casts_grenade: number
  casts_grenade_per_round: number
  kills_grenade: number
  casts_ability1: number
  casts_ability1_per_round: number
  kills_ability1: number
  casts_ability2: number
  casts_ability2_per_round: number
  kills_ability2: number
  casts_ultimate: number
  casts_ultimate_per_round: number
  kills_ultimate: number
}

export interface AbilityNames {
  grenade: string
  ability1: string
  ability2: string
  ultimate: string
}

export interface StatsData {
  teams: Team[]
  players: Player[]
  players_by_role: RolePlayer[]
  players_by_agent: AgentPlayer[]
  matches: Match[]
  leaderboards: Record<string, Leaderboard>
  agent_stats: AgentStat[]
  ability_names: Record<string, AbilityNames>
}

export interface TournamentAverages {
  team: Record<string, { mean: number; std: number }>
  perMap: Record<string, Record<string, { mean: number; std: number }>>
  xvy: Record<string, number>
  player: Record<string, { mean: number; std: number }>
  /** per-site averages: key = "post_A", "ret_B", etc. → { mean, std } across all teams' allMaps */
  siteAvgs: Record<string, { mean: number; std: number }>
  /** per-map per-site averages: key = mapName → "post_A" etc. */
  perMapSiteAvgs: Record<string, Record<string, { mean: number; std: number }>>
}
