# VCL Broadcast Stats Dashboard — Frontend Design Spec

## Context and Goals

Build a React frontend that serves as a broadcast analyst tool for VCL EMEA 2026 Stage 1. The dashboard loads static data from `public/data/stats.json` (14 teams, 78 players, 372 matches, 11 leaderboards) and presents it in a dense, spreadsheet-inspired layout modeled after the existing VCL3 Stats Excel workbook.

Primary users: broadcast analysts doing pre-match prep and live stat lookup during production. Design priorities are data density, speed, and readability in dark broadcast environments.

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | React 19 + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS v4 |
| Fonts | Jost (primary), Overpass Mono (data) |
| State | React Context (read-only static data) |
| Deployment | GitHub Pages (`base: "./"`) |
| Data | Static JSON at `/data/stats.json` |

## Design Tokens

```
Surface:     #0a0a0f (page background)
Nav:         #12121a (top bar, table headers)
Card:        #1a1a28 (elevated surfaces, borders)
Border:      #1e1e2e (subtle dividers)
Text:        #dddddd (primary text)
TextMuted:   #888888 (column headers, labels)
TextDim:     #555555 (placeholders)
Primary:     #C800DF (branding, active states, player links)
Secondary:   #E60076 (secondary accents)
Success:     #16A34A (win indicators)
Danger:      #DC2626 (loss indicators)
HeatGreen:   #2a5a2a → #5a8a2a (above average cells)
HeatYellow:  #4a4020 (neutral cells)
HeatRed:     #5a3030 → #6a2020 (below average cells)
```

Group header colors (matching VCL3 Stats Excel):
- Team Statistics: `#2d5a27` bg / `#c4e8be` text
- Map: `#1e3a5f` bg / `#8cc4f0` text
- All Rounds: `#4a3080` bg / `#c4a8f0` text
- Pistols: `#7a3030` bg / `#f0b8b8` text
- Gun: `#2d5a27` bg / `#c4e8be` text
- Anti Eco: `#5a5a27` bg / `#e8e4a0` text
- Eco: `#5a3a27` bg / `#e8c8a0` text
- Post Plant: `#1e5a5a` bg / `#a0e8e4` text
- XvY: `#4a3080` bg / `#c4a8f0` text
- XvY Delta: `#5a5a27` bg / `#e8e4a0` text

## Layout Architecture

**Top Navigation Bar** (fixed, all pages):
- Left: VCL STATS logo, page tabs (Teams, Leaderboards, Versus, History)
- Right: Global search bar (searches teams + players)
- Active tab highlighted with primary color background
- "Teams" tab navigates to `/team/{first-alphabetical-team}` (or last viewed team via localStorage)
- Root `/` redirects to the same

**Content Area** fills remaining viewport below nav bar. No sidebar.

## Pages

### 1. Team Overview — `/team/:name` (P0)

The main dashboard, modeled directly on VCL3 Stats.xlsx "Team View" sheet.

**Team Header:**
- Team selector dropdown (all 14 teams, alphabetical)
- Overall series record (W-L)
- Form strip: last 5 map results as colored squares (green=win, red=loss), tooltips show opponent/map/score

**Map Statistics + Post Plant** (two table blocks, side by side, filling full width):

Left block — Team Statistics:
- Grouped column headers with colored backgrounds
- Groups: Team Statistics (Map, Comp, x) | Map (Plays, Win, Loss) | All Rounds (rW%, aW%, dW%) | Pistols (rW%, aW%, dW%) | Gun (rW%, aW%, dW%) | Anti Eco (rW%, aW%, dW%) | Eco (rW%, aW%, dW%)
- One row per map played, "All Maps" aggregate row at bottom (bold, separator)
- Comp column shows agent icons (18px circles from `data/icons/`)
- Percentage cells heat-mapped against tournament average

Right block — Post Plant:
- Columns: Map, post scens, post/Map, post rW%, event avg, post rank, ret scens, ret/Map, ret rW%, ret event avg, ret rank
- Note: `t_rounds` and `ct_rounds` are NOT in stats.json. Use `post_scens / post_per_map` to back-calculate if needed, or omit those columns. Available fields: `post_scens`, `post_per_map`, `post_rW_pct`, `post_rW_event_avg`, `post_rank`, `ret_scens`, `ret_per_map`, `ret_rW_pct`, `ret_rW_event_avg`, `ret_rank`
- Same rows as left block, aligned horizontally
- Left block should flex to fill available space (no dead space to the right)

**Player Stats + XvY** (below, side by side):

Left — Statistics Per Player:
- Columns: Players, Agents (top 3 icons), r, K/D, KA/D, KAST, fk/r, fd/r, fk/fd, CL%, AWP%
- Player names clickable (link to Player Profile)
- Heat-mapped stat cells

Right — Three XvY tables side by side:
1. Team XvY (5x5 matrix, absolute win rates)
2. XvY vs Attending Average (delta values, +/- with green/red coloring)
3. Attending Team Average (tournament baseline)

XvY matrix layout: rows = team's alive count (5 down to 1), columns = opponent's alive count (5 down to 1). The flat `xvy` array in stats.json has entries like `{situation: "3v2", wins, losses, win_pct}` — parse `situation` string to get row/column indices. Tournament average XvY computed at load time by averaging all 14 teams' win_pct per situation.

**Talking Points Panel:**
- Accent border left (#C800DF), subtle background
- 3-5 auto-generated insights using rule-based logic (see PRD Section 4.1 Section E for rules)

### 2. Player Profile — `/player/:ign` (P0)

- Player header: IGN, team name, rounds played
- Player dropdown to switch to any other player (all players across all teams, grouped by team)
- Back link to team page
- Stat cards grid: ACS, K/D, KA/D, KAST, FK/r, FD/r, FK/FD, CL%, AWP% — each with tournament rank
- Agent pool: top 5 agents with icons, pick %, match count

### 3. Leaderboards — `/leaderboards` (P0)

- Tab bar: ACS | Kills | Deaths | Assists | K/D | KAST | FK | FD | FK% | FD% | CL%
- Ranked table per stat (descending; Deaths/FD ascending)
- Columns: rank, IGN, team, stat value, rounds played
- Tournament average as highlighted reference row
- Team filter dropdown (highlights one team's players, dims others)
- Minimum 100 rounds threshold (configurable constant)

### 4. Versus — `/versus` (P0)

Two sub-tabs: Team vs Team | Player vs Player

**Team vs Team:**
- Two team dropdowns (can't select same team)
- Overall record comparison, form strips
- Head-to-head history (if they've played each other)
- Map pool comparison table (plays, W-L, rW% per map, edge indicator)
- Economy comparison (pistol/gun/anti-eco/eco side by side)
- Post-plant & retake comparison with tournament ranks
- Player roster comparison (two columns, ACS/K-D/KAST/FK-r/CL%)
- XvY comparison side by side

**Player vs Player:**
- Two player dropdowns ("IGN — Team" format)
- Stat comparison table (better value highlighted)
- Agent pools side by side

### 5. Match History — `/team/:name/history` (P1)

- Chronological table: Date, Opponent, Map, Score, Result, Comp
- Sorted newest first
- Expandable rows: opponent comp, half-time score, starting side

## File Structure

```
src/
  main.tsx
  App.tsx
  context/
    StatsContext.tsx          # Load stats.json, provide via React Context
  components/
    Navbar.tsx                # Top nav bar with tabs + search
    SearchBar.tsx             # Global search (teams + players)
    AgentIcon.tsx             # Agent PNG wrapper (handles KAY/O → KAYO)
    StatCell.tsx              # Heat-mapped percentage cell
    FormStrip.tsx             # Last 5 results as colored squares
  pages/
    TeamOverview.tsx          # VCL3-style dense dashboard
    PlayerProfile.tsx         # Player stat cards + agent pool
    Leaderboards.tsx          # Tab bar + ranked tables
    Versus.tsx                # Team/player comparison
    MatchHistory.tsx          # Match log per team
  utils/
    colors.ts                 # Heat-map color interpolation
    format.ts                 # Percentage/ratio formatting helpers
public/
  data/stats.json             # Static data (already exists)
  icons/                      # Agent PNGs (copied from data/icons/)
```

## Data Flow

```
stats.json → StatsContext.Provider → useStats() hook → pages
```

- `StatsContext` loads JSON once at app init, provides `{ teams, players, matches, leaderboards, tournamentAverages, loading }`
- Tournament averages computed at load time and cached in context:
  - **Team-level**: for each map stat column (rW%, atk_rW%, def_rW%, etc.), compute mean across all 14 teams' `allMaps` values. Also compute per-map averages for map-specific comparisons.
  - **Player-level**: already provided as `tournament_avg` in each leaderboard entry
  - **XvY**: average all 14 teams' `win_pct` per situation to get tournament baseline
- Each page pulls what it needs via `useStats()`
- No runtime API calls

## Shared Components

**StatCell**: Takes `value`, `average`, `format` (percent/ratio/count). Computes heat-map background color using HSL interpolation between red (below avg) → neutral → green (above avg). Used in every table.

**AgentIcon**: Maps agent name to PNG path in `public/icons/`. Handles edge cases: renders as 16-18px circle. Falls back to text abbreviation if image fails.

**FormStrip**: Renders array of `{result, opponent, map, score}` as colored squares. Tooltip on hover.

**SearchBar**: Filters across all team names + player IGNs. Results grouped by type. Keyboard navigable. Min 2 chars to trigger.

## Heat-Map Color Scale

Percentage cells are colored relative to tournament average for that stat:
- Value significantly above average → green background (`#2a5a2a` to `#5a8a2a`)
- Value near average → neutral/yellow (`#4a4020`)
- Value significantly below average → red background (`#5a3030` to `#6a2020`)

Scale is continuous, not stepped. "Significantly" = more than 1 standard deviation from mean for that column across all teams.

## Agent Icon Mapping

Icons stored as `public/icons/{AgentName}.png` (28 agents). Source: `data/icons/` (already exists in repo with all 28 agent PNGs). Copy to `public/icons/` during project setup.

Mapping from agent names in stats.json to filenames:
- Most are direct: `Cypher` → `Cypher.png`, `Viper` → `Viper.png`
- Special case: `KAY/O` → `KAYO.png`
- Icons rendered as small circles (16-18px) with `border-radius: 50%`

## GitHub Pages Deployment

- Vite config: `base: "./"` for relative asset paths
- Build output to `dist/`
- Deploy via `gh-pages` npm package or GitHub Actions
- `public/data/stats.json` included in build output automatically

## Accessibility

- Keyboard navigation for search, dropdowns, tab bars
- Visible focus states on interactive elements
- Semantic HTML tables with proper `<thead>/<tbody>` and scope attributes
- Color coding supplemented by text values (never color-only information)

## Out of Scope

- Charts (Recharts — deferred to later)
- Team logos (text-only for now)
- Map veto tendency
- Stat card export / clipboard copy
- Mobile-optimized layout (should not break, but not designed for)
- Light theme
