# Database Structure — VCL Stats Dashboard

This document describes the data pipeline and the structure of `stats.json`, the single JSON file that powers the frontend dashboard.

## Pipeline Overview

```
Raw JSONL files (per team)          Python pipeline              Frontend
─────────────────────────      ─────────────────────────    ──────────────
data/raw/{tag}_2026_raw_       lib/match_parser.py          stats.json
  responses.jsonl         ──►  lib/stats_engine.py     ──►  (served from
  (one JSON object              lib/json_builder.py          public/data/)
   per line = 1 map)            lib/constants.py
```

**Build command:** `python scripts/build_json.py --output vcl-frontend/public/data/stats.json`

---

## Raw Data Layer (`data/raw/*.jsonl`)

Each file contains one JSON object per line. Each object is a full Valolytics API match response for a single map.

### Key fields per match object:
| Field | Path | Description |
|-------|------|-------------|
| Match ID | `matchInfo.matchId` | Unique map identifier |
| Map | `matchInfo.map` | Map URL (parsed to short name) |
| Start time | `matchInfo.gameStartMillis` | Epoch ms |
| Players | `players[]` | Array of 10 player objects |
| Teams | `teams[]` | Red/Blue team results |
| Rounds | `roundResults[]` | Per-round detail (economy, kills, spike) |

### Player object (per match):
- `puuid`, `gameName`, `tagLine`, `teamId` (Red/Blue), `characterId` (agent UUID)
- `stats`: `score`, `kills`, `deaths`, `assists`, `roundsPlayed`, `vlrRating2`
- `stats.abilityCasts`: `grenadeCasts`, `ability1Casts`, `ability2Casts`, `ultimateCasts`
- `economy` per round: `loadoutValue`, `weapon`, `armor`, `remaining`, `spent`

### Round object:
- `roundNum`, `winningTeam`, `roundResultCode`
- Spike: `bombPlanter`, `plantSite`, `bombDefuser`
- `playerStats[]`: kills (with weapon, location, timing), damage (headshots/bodyshots/legshots), economy

---

## Processed Data Layer (`stats.json`)

### Top-level structure:
```typescript
{
  teams: Team[]                              // 14 team objects (full league)
  players: Player[]                          // ~74 player objects
  players_by_role: RolePlayer[]              // players duplicated per role played
  players_by_agent: AgentPlayer[]            // players duplicated per agent played
  matches: Match[]                           // all individual map results
  leaderboards: Record<string, Leaderboard>  // pre-sorted stat rankings
  agent_stats: AgentStat[]                   // per-player per-agent ability usage
  ability_names: Record<string, AbilityNames> // agent ability display names
}
```

### Team object:
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Full team name |
| `tag` | string | In-game tag (e.g. "FKS") |
| `maps[]` | MapStats[] | Per-map stats with compositions |
| `allMaps` | MapStats | Aggregated across all maps |
| `players` | string[] | Player IGNs on roster |
| `xvy` | XvYEntry[] | Clutch situation win rates (1v1 through 5v5) |
| `series_record` | {wins, losses} | Best-of-series record |
| `form` | FormEntry[] | Last 5 map results |

### MapStats object (used in `maps[]` and `allMaps`):
| Field | Description |
|-------|-------------|
| `map`, `plays`, `wins`, `losses` | Basic record |
| `comp[]`, `comp_count`, `comps[]` | Most common composition, expandable list |
| `rW_pct`, `atk_rW_pct`, `def_rW_pct` | Round win % (overall, attack, defense) |
| `pistol_rW_pct`, `pistol_atk_rW_pct`, `pistol_def_rW_pct` | Pistol round win % |
| `gun_rW_pct`, `antieco_rW_pct`, `eco_rW_pct` | Economy-type round win % |
| `post_scens`, `post_per_map`, `post_rW_pct`, `post_rank` | Post-plant stats |
| `post_by_site` | Per-site (A/B/C) post-plant breakdown |
| `ret_scens`, `ret_per_map`, `ret_rW_pct`, `ret_rank` | Retake stats |
| `ret_by_site` | Per-site retake breakdown |

### Player object:
| Field | Description |
|-------|-------------|
| `ign`, `team` | Identity |
| `rounds` | Total rounds played |
| `acs_split`, `acs_year` | Average Combat Score |
| `adr` | Average Damage per Round |
| `vlr_rating` | Weighted VLR Rating |
| `kills`, `deaths`, `assists` | Raw counts |
| `kd`, `kad` | K/D and KA/D ratios |
| `fk`, `fd`, `fk_pct`, `fd_pct`, `first_conversion` | First kill/death stats |
| `clutch_scens`, `clutches`, `clutch_pct` | Clutch stats |
| `kast` | Kill/Assist/Survive/Trade % |
| `awp_pct` | Operator kill % |
| `agents[]` | Agent picks with play % |

### Match object:
| Field | Description |
|-------|-------------|
| `match_id`, `series_id` | Identifiers |
| `date`, `map`, `event` | Context |
| `team1`, `team2` | Team names |
| `team1_score`, `team2_score` | Final score |
| `team1_score_at_half`, `team2_score_at_half` | Halftime score |
| `team1/2_atk_pistol_wins`, `team1/2_def_pistol_wins` | Pistol results |
| `team1_atk_wins/losses`, `team1_def_wins/losses` | Side breakdown |
| `winner` | Winning team name |

### Leaderboards:
Pre-computed rankings for: `acs`, `kd`, `kad`, `kast`, `fk_pct`, `fd_pct`, `clutch_pct`, `awp_pct`, `vlr_rating`, `adr`, `first_conversion`

Each leaderboard has `entries[]` (rank, ign, team, value, rounds) and `tournament_avg`.

### Tournament Averages (computed client-side):
| Key | Description |
|-----|-------------|
| `team` | Mean/std for team-level stats across all teams |
| `perMap` | Per-map mean/std for team stats |
| `xvy` | Average clutch win % per situation |
| `player` | Mean/std for player-level stats |
| `siteAvgs` | Per-site post-plant/retake averages |
| `perMapSiteAvgs` | Per-map per-site averages |

---

## Constants (`lib/constants.py`)

- **TEAMS[]** — 14-team registry: tag, name, data file path
- **AGENT_MAP** — UUID → agent name (35 agents)
- **AGENT_ROLE** — agent name → role (Duelist/Initiator/Controller/Sentinel)
- **WEAPON_MAP** — UUID → weapon name
- **TAG_TO_NAME** — team tag → full name
- **ABILITY_NAMES** — per-agent ability slot names

## Data Quality Filters

- Matches with abnormal scores (1-5, 5-0, 3-3, 5-2, 6-0) are excluded as tech issues/forfeits
- TLA matches from 2026-01-23 excluded (TL main roster contamination)
- Players deduplicated by name+team (handles multi-PUUID cases)
