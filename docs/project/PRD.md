# Product Requirements Document
## VCL Broadcast Stats Dashboard

**Version:** 1.0  
**Role context:** This tool is built for a broadcast analyst covering a VALORANT Challengers League tournament. The primary use case is pre-match preparation, live broadcast reference, and on-demand stat lookup during production. All design and UX decisions must serve that context.

---

## 1. Data Source

All data is loaded from a static JSON file (`/data/stats.json`) exported from the source Excel workbook (`VCL3_Stats.xlsx`). The site does not connect to a live backend — data is refreshed by replacing the JSON file and reloading.

### Source Sheets and Their Role

| Sheet | Purpose |
|---|---|
| `MatchesInput` | Raw match-level data. Source of truth for all map results, scores, agents, and dates. |
| `Player Stats` | Per-player aggregated stats: ACS, K/D, KA/D, KAST, FK, FD, FK%, FD%, Clutch%, AWP%. |
| `ecos` | Eco round win/loss per team per map per side (atk/def). |
| `Antieco` | Anti-eco round win/loss per team per map per side. |
| `Gun v Gun` | Full-buy round win/loss per team per map per side. |
| `Post Plants` | Post-plant and retake scenarios per team per map per site (A/B). |
| `XvY` | Clutch situation win rates (5v1 through 1v1) per team. |
| `Picks` | Agent pick counts and percentages per player. |
| `Clutches` | Raw clutch wins, failures, and scenarios per player. |
| `ACS`, `Kills`, `Deaths`, `Assists`, `FKS`, `FDS` | Single-stat leaderboard sheets (flat ranked lists). |
| `Assets` | Agent name to headshot URL mapping. Map pool list. |

### Derived Data (computed at load time, not stored)

- Map record per team (W-L from `MatchesInput`)
- Overall series record per team
- Tournament leaderboards (ranked lists across all players per stat)
- Form string (last 5 map results per team, chronological from `MatchesInput`)
- Match history per team (filtered from `MatchesInput`)
- Agent pool per player (from `Picks`, top 5 by percentage)

---

## 2. Data Model

### Team Object
```json
{
  "name": "Team Liquid Academy",
  "maps": [
    {
      "map": "Lotus",
      "comp": ["Cypher", "Phoenix", "Omen", "Yoru", "Fade"],
      "plays": 10,
      "wins": 5,
      "losses": 5,
      "rW_pct": 0.539,
      "atk_rW_pct": 0.491,
      "def_rW_pct": 0.587,
      "pistol_rW_pct": 0.5,
      "pistol_atk_rW_pct": 0.4,
      "pistol_def_rW_pct": 0.6,
      "gun_rW_pct": 0.55,
      "gun_atk_rW_pct": 0.48,
      "gun_def_rW_pct": 0.62,
      "antieco_rW_pct": 0.71,
      "antieco_atk_rW_pct": 0.65,
      "antieco_def_rW_pct": 0.77,
      "eco_rW_pct": 0.22,
      "eco_atk_rW_pct": 0.18,
      "eco_def_rW_pct": 0.26,
      "post_scens": 108,
      "post_per_map": 7.3,
      "post_rW_pct": 0.61,
      "post_rW_event_avg": 0.55,
      "post_rank": 3,
      "ret_scens": 109,
      "ret_per_map": 6.8,
      "ret_rW_pct": 0.48,
      "ret_rW_event_avg": 0.52,
      "ret_rank": 5
    }
  ],
  "allMaps": {},
  "players": ["GSR", "rexxtoned", "Donatello", "NINJA", "Qpert"],
  "xvy": [
    { "situation": "5v1", "wins": 27, "losses": 0, "win_pct": 1.0 },
    { "situation": "5v2", "wins": 55, "losses": 3, "win_pct": 0.948 }
  ]
}
```

### Player Object
```json
{
  "ign": "GSR",
  "team": "Team Liquid Academy",
  "acs_split": 210,
  "acs_year": 205,
  "rounds": 641,
  "kills": 820,
  "deaths": 641,
  "assists": 180,
  "fk": 46,
  "fd": 35,
  "kd": 1.278,
  "kad": 1.657,
  "first_pct": 0.287,
  "fk_pct": 0.072,
  "fd_pct": 0.055,
  "first_conversion": 0.568,
  "clutch_scens": 81,
  "clutches": 10,
  "clutch_pct": 0.123,
  "kast": 0.75,
  "awp_pct": 0.062,
  "agents": [
    { "agent": "Cypher", "picks": 40, "matches": 45, "pct": 88.9 }
  ]
}
```

### Match Object
```json
{
  "match_id": 212063,
  "series_id": 93451,
  "event": "Challengers League 2025 NORTH EAST: Split 3 - Playoffs",
  "map": "Haven",
  "team1": "Team Liquid Academy",
  "team2": "Enterprise Esports",
  "team1_agents": ["Cypher", "Sova", "Omen", "Yoru", "Iso"],
  "team2_agents": ["Sova", "Killjoy", "Viper", "Omen", "Neon"],
  "team1_score": 2,
  "team2_score": 13,
  "team1_score_at_half": 2,
  "team2_score_at_half": 10,
  "team1_atk_pistol_wins": 0,
  "team1_def_pistol_wins": 0,
  "team1_atk_wins": 0,
  "team1_atk_losses": 3,
  "team1_def_wins": 2,
  "team1_def_losses": 10,
  "winner": "Enterprise Esports",
  "date": "2025-08-17"
}
```

---

## 3. Pages Overview

| Page | Route | Priority |
|---|---|---|
| Team Overview | `/team/:name` | P0 |
| Player Profile | `/player/:ign` | P0 |
| Cross-Team Leaderboards | `/leaderboards` | P0 |
| Versus | `/versus` | P0 |
| Match History | `/team/:name/history` | P1 |

The app root `/` redirects to the first team alphabetically.

Search bar is a persistent global component present on all pages.

---

## 4. Page Specifications

---

### 4.1 Team Overview Page — `/team/:name`

**Purpose:** Single-page view of everything known about a team. The primary reference page during broadcast prep.

**Navigation:**
- Team selector dropdown at the top. Contains all team names in the dataset, sorted alphabetically. On load, defaults to the first team alphabetically or the last viewed team (stored in `localStorage`).
- URL updates when team changes: `/team/Team-Liquid-Academy`

**Layout — top to bottom:**

#### Section A: Team Header
- Team name (large)
- Overall record displayed as: `W – L` across all maps
- Form strip: last 5 map results displayed as colored squares (green = win, red = loss), ordered most recent on the right. Hovering a square shows opponent name, map, and score as a tooltip.

#### Section B: Map Statistics Table
One row per map the team has played. Columns:

| Column | Source |
|---|---|
| Map | map name |
| Comp | agent icons (headshot URLs from `Assets`) for the most recent comp played on that map |
| Plays | number of maps played |
| W – L | wins and losses |
| rW% | overall round win % |
| aW% | attack round win % |
| dW% | defense round win % |
| Pistol rW% | pistol round win % |
| Pistol aW% | pistol attack win % |
| Pistol dW% | pistol defense win % |
| Gun rW% | full-buy round win % |
| Gun aW% | full-buy attack win % |
| Gun dW% | full-buy defense win % |
| Anti-Eco rW% | anti-eco win % |
| Eco rW% | eco round win % |
| Post rW% | post-plant win % |
| Post Rank | tournament rank for post-plant win % |
| Ret rW% | retake win % |
| Ret Rank | tournament rank for retake win % |

Last row is an **All Maps** aggregate row, visually distinct (bold, separator above it).

Percentage cells are color-coded on a red–neutral–green scale relative to the tournament average for that column. Values at or above average trend green, below trend red. The color scale is subtle — not garish.

#### Section C: Player Statistics Table
One row per player. Columns:

| Column | Source |
|---|---|
| Player | IGN (clickable — navigates to Player Profile page) |
| Agents | top 3 agent icons from `Picks` |
| Rounds | rounds played |
| K/D | kill/death ratio |
| KA/D | kills+assists/deaths |
| KAST | KAST % |
| FK/r | first kills per round |
| FD/r | first deaths per round |
| FK/FD | first kill / first death ratio |
| CL% | clutch win % |
| AWP% | AWP/Operator usage % |

Clicking a player row navigates to `/player/:ign`.

#### Section D: XvY Clutch Table
Two sub-tables side by side:
1. **Team XvY** — this team's win rates for each situation (5v1, 5v2, 5v3, 5v4, 4v3, 4v2, 3v2, 3v1, 2v1, 1v1 — whatever situations exist in the data)
2. **vs Tournament Average** — delta per situation (positive = above average, negative = below). Color-coded green/red.

#### Section E: Talking Points Panel
Auto-generated. Surfaces 3–5 notable stats about this team using rule-based logic.

**Rules (evaluate all, display top 3–5 that fire, prioritize superlatives):**
- Stat ranks #1 in the tournament: "Best [stat] in the tournament: [value]"
- Stat ranks #2 in the tournament: "[Team] ranks 2nd in [stat]: [value]"
- Stat ranks last in the tournament: "Lowest [stat] in the tournament: [value]"
- Map win rate ≥ 70%: "[Team] wins [X]% of rounds on [Map]"
- Map win rate ≤ 35%: "[Team] struggles on [Map] ([X]% round win rate)"
- Post-plant rank is top 3: "Top [N] post-plant team in the tournament ([X]%)"
- Retake rank is top 3: "Top [N] retake team in the tournament ([X]%)"
- Eco win rate ≥ 35%: "Strong eco game: [X]% eco round win rate (tournament avg: [Y]%)"
- A player's clutch% is ≥ 20%: "[Player] closes out [X]% of clutch scenarios"
- Form last 5 is 5W or 4W-1L: "Strong recent form — [W]W[L]L in last 5 maps"
- Form last 5 is 5L or 4L-1W: "Poor recent form — [W]W[L]L in last 5 maps"

Each talking point is one sentence. Panel has a visually distinct style (accent border, different background).

---

### 4.2 Player Profile Page — `/player/:ign`

**Purpose:** Deep-dive on a single player. Reached by clicking a player on the Team Overview page.

**Navigation:**
- Back link → returns to that player's team page
- Player name and team name in header
- Dropdown to switch to any other player (all players across all teams, grouped by team)

**Layout:**

#### Section A: Player Header
IGN (large), team name (smaller), rounds played as context.

#### Section B: Core Stats Grid
Stat cards in a grid — one card per stat, showing value and tournament rank:
- ACS (split season / full year)
- K/D
- KA/D
- KAST
- FK per round + rank
- FD per round + rank
- FK/FD ratio
- Clutch % + total scenarios
- AWP %

Tournament rank shown as: "#3 of [N] players"

#### Section C: Agent Pool
Visual display of the player's top 5 agents:
- Agent headshot image
- Agent name
- Pick % and total matches on that agent

Sorted by pick percentage descending.

#### Section D: Clutch Breakdown
From `Clutches` sheet:
- Total clutch scenarios faced
- Total clutch wins
- Clutch win %

If individual XvY breakdown per player is unavailable (data only exists at team level), show the team XvY data with a note: "Team clutch situations."

---

### 4.3 Cross-Team Leaderboards — `/leaderboards`

**Purpose:** Rank all players in the tournament by any stat. Used for broadcast "tournament leaders" segments.

**Layout:**
- Tab bar: ACS | Kills | Deaths | Assists | K/D | KAST | FK | FD | FK% | FD% | CL%
- Selecting a tab shows a ranked table of all players sorted by that stat
  - Descending by default
  - Deaths and FD: ascending (lower is better, so rank #1 = fewest)
- Each row: rank, IGN, team name, stat value, rounds played (sample size context)
- Tournament average shown as a reference row (highlighted, not ranked)
- Team filter: a team selector (dropdown or button group) that highlights only that team's players; all other rows are dimmed but not removed
- Minimum rounds threshold: players with fewer than 100 rounds are excluded from leaderboards to avoid small-sample outliers. This threshold should be configurable as a constant in the code.

---

### 4.4 Versus Page — `/versus`

**Purpose:** Side-by-side comparison between two teams or two players. Used for match preview prep.

**Sub-modes (tabs at top of page):**
- Team vs Team
- Player vs Player

---

#### 4.4a Team vs Team

**Selection:** Two dropdowns — Team A and Team B. Both populate from the full team list. Selecting the same team in both dropdowns is not allowed.

**Sections:**

**Overall Record**
- Maps played, W-L, overall round win %
- Form strip for each team (last 5 results)
- Head-to-head history: if the two teams have faced each other in `MatchesInput`, list each map played between them (date, map, score, winner). If no meetings found, display "No previous meetings in dataset."

**Map Pool Comparison**
Table of all maps that appear in the data. Columns: Map | Team A plays, W-L, rW% | Team B plays, W-L, rW% | Edge indicator (arrow or color showing who has the higher rW%).
Maps that neither team has played are omitted.

**Economy Comparison**
Side-by-side table for Pistol, Gun, Anti-Eco, Eco:
- Team A value | Category | Team B value
- Color highlight on the higher value per row

**Post-Plant & Retakes**
- Post-plant rW%: Team A vs Team B with tournament ranks
- Retake rW%: Team A vs Team B with tournament ranks

**Player Roster Comparison**
Two columns of player rows, one roster per column. No forced role pairing.
Stats shown per player: ACS, K/D, KAST, FK/r, CL%.

**XvY Comparison**
Side-by-side XvY table (5v1 through 1v1) showing both teams' win rates per situation. Color-code the higher value per row.

---

#### 4.4b Player vs Player

**Selection:** Two dropdowns populated with all players across all teams. Format: "IGN — Team". Selecting the same player twice is not allowed.

**Layout:** Two-column comparison table.

| Stat | Player A | Player B |
|---|---|---|
| ACS (split) | | |
| K/D | | |
| KA/D | | |
| KAST | | |
| FK per round | | |
| FD per round | | |
| FK/FD | | |
| Clutch % | | |
| AWP % | | |

For each row, the better value is visually highlighted (bold, accent color, or small indicator icon).

Below the stat table: Agent pool for each player (top 5 icons side by side).

---

### 4.5 Match History — `/team/:name/history` *(P1)*

**Purpose:** Chronological log of all maps a team has played.

**Access:** "View Match History" link on the Team Overview page (Section A or near Section B).

**Layout:**
- Table: Date | Event | Opponent | Map | Score | Result | Comp (agent icons)
- Sorted newest first
- Score: "team score – opponent score" from the perspective of the viewed team
- Result column: Win/Loss badge, green/red
- Clicking a row expands inline to reveal: opponent comp icons, half-time score, which side the team started on

---

## 5. Global Components

### 5.1 Search Bar
- Persistent in the top navigation bar on all pages
- Searches across all team names AND all player IGNs simultaneously
- Shows results in a dropdown grouped by type: "Teams" and "Players"
- Clicking a team result navigates to `/team/:name`
- Clicking a player result navigates to `/player/:ign`
- Keyboard accessible: arrow keys to navigate results, Enter to select, Escape to close
- Minimum 2 characters to trigger search

---

## 6. Design Directives

Claude Code is responsible for all visual design decisions. The following non-negotiable constraints apply:

- **Dark theme only.** Broadcast environments are dark. There is no light mode.
- **Dense information layout.** This is an analyst tool, not a marketing site. Data density is a feature.
- **Color-coded stat cells.** Win rates and stats benchmarked against tournament average use a red–neutral–green color scale. Keep it subtle — not garish.
- **Agent icons.** Use headshot URLs from `Assets` sheet: `https://static.valorantstats.xyz/agent-headshots/{agentname_lowercase}-headshot.png`
  - Example: `https://static.valorantstats.xyz/agent-headshots/cypher-headshot.png`
  - Agent names with spaces or slashes must be handled: "KAY/O" → `kayo`, "KAYO" → `kayo`
- **No external API calls at runtime.** All data comes from the locally loaded JSON file.
- **No authentication.** This is a local or privately hosted internal tool.
- **Desktop viewport primary.** Mobile layout is not required but should not be completely broken.

---

## 7. Tech Stack

| Concern | Choice |
|---|---|
| Framework | React (Vite) |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Data | Static JSON loaded at app init from `/public/data/stats.json` |
| Charts (optional) | Recharts |
| State | React Context or Zustand (no Redux) |

---

## 8. Feature Priority Reference

| Feature | Priority |
|---|---|
| Team Overview page (all sections A–E) | P0 |
| Player Profile page | P0 |
| Cross-team leaderboards | P0 |
| Versus page — Team vs Team | P0 |
| Versus page — Player vs Player | P0 |
| Global search bar | P0 |
| Talking Points panel | P0 |
| Agent pool display (per player) | P0 |
| Match History page | P1 |
| Form indicator strip | P1 |
| Map veto tendency | Future |
| Stat card export / clipboard copy | Future |

---

## 9. Data Ingestion Script

A Python script (`scripts/build_json.py`) must be written alongside the frontend. It takes `VCL3_Stats.xlsx` as input and outputs `/public/data/stats.json`.

**Run command:**
```
python scripts/build_json.py --input VCL3_Stats.xlsx --output public/data/stats.json
```

**The script must:**
- Read `MatchesInput` for all match-level data
- Read `Player Stats` for player aggregates
- Read `ecos`, `Antieco`, `Gun v Gun` for economy data per team per map per side
- Read `Post Plants` for post-plant and retake data per team per map
- Read `XvY` for clutch situation win rates per team
- Read `Picks` for agent pools per player
- Read `Clutches` for raw clutch data per player
- Read `Assets` for the canonical agent name list
- Compute derived fields:
  - Map W-L record per team (from `MatchesInput`)
  - Overall series record per team
  - Form (last 5 map results per team, sorted by date)
  - Tournament-wide per-stat player rankings
  - allMaps aggregate row per team
- Output a single `stats.json` with top-level keys: `teams`, `players`, `matches`, `leaderboards`

**The script must not rely on Google Sheets formula values.** All computed values must be re-derived from raw data in `MatchesInput`, `ecos`, `Antieco`, `Gun v Gun`, `Post Plants`, `XvY`, `Picks`, and `Clutches`. The formula-computed cells in sheets like `Team View` and `Player Stats` may be read as a convenience where they contain plain numeric values, but the script should not depend on formula strings.

---

## 10. Future Features (Do Not Implement — Remembered for Later)

**Map veto tendency:** Derived from `MatchesInput`. For each team, surface which maps they play most frequently vs. least. In a best-of series, teams pick and ban maps — knowing a team's map pool habits informs likely veto decisions. This feature requires understanding of which maps are in the current active pool, which changes seasonally.

**Stat card export:** Click any stat block to copy a clean broadcast-ready text snippet to clipboard. Example: "Team Liquid Academy — Lotus: 67% retake win rate, ranked #2 in tournament."
