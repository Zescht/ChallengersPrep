# Session Summary — 2026-03-24

## Previous Session (2026-03-20) — v0.6.0
Leaderboards rewrite (sortable, color-coded, VLR Rating, ADR, role filter), TLA data cleanup, team logos, pipeline additions (vlr_rating, adr, role_accum). See CHANGELOG.md v0.6.0 for details.

## v0.7.0 (2026-03-21)
Team Overview overhaul: XvY matrix, form strip, persistent navbar, global search bar, custom color scales, percentile-based leaderboard coloring, per-comp expandable rows.

## v0.8.0 (2026-03-23)
Versus page: full Team vs Team and Player vs Player comparison modes. Team VS header with logos, map pool dominance bars, H2H history, pistol win rate, tactical execution cards, roster comparison, player VS mode.

## v0.9.0 (2026-03-23–24) — Playoff Mode & Map Vetoes

### Playoff Mode (Frontend)
- **FilterContext** (`vcl-frontend/src/context/FilterContext.tsx`): manages `playoffOnly` and `clDataOnly` booleans, persisted in localStorage
- **StatsContext** (`vcl-frontend/src/context/StatsContext.tsx`):
  - Loads both `stats.json` (14 teams) and `stats_playoffs.json` (4 teams) on mount
  - Exposes `fullData`, `playoffData`, and filtered `data` based on active mode
  - `filterHiddenPlayers()` removes hidden players (e.g. "swagzor" from EP) at load time — `HIDDEN_PLAYERS` set
  - Playoff mode averages remain from full 14-team league (design decision for consistent color scales)
- **Navbar toggles** (`vcl-frontend/src/components/Navbar.tsx`):
  - "Playoff-Teams" — filters to MISA, EP, UCAM, MDR
  - "CL Data Only" — requires Playoff-Teams, swaps to `stats_playoffs.json`
  - Styling: `text-on-surface` replaces `text-text-dim`
- **Auto-redirect**: navigates to first available team when current team filtered out
- **Pipeline**: `--playoff` flag on `build_json.py` generates `stats_playoffs.json`

### Versus Page Changes (`vcl-frontend/src/pages/Versus.tsx`)

#### External Link Buttons
- 3 buttons per team in header cards: VLR, Liquipedia, Vetoes
- URL mappings: `TEAM_VLR`, `TEAM_LIQUIPEDIA` (all 14 teams)
- `TeamLinks` component with align left/right based on card position

#### Veto Modal
- `VetoModal` component with full veto history table for playoff teams
- Data from `vetoData.ts` (MISA: 12, EP: 18, UCAM: 11, MDR: 14 matches)
- Columns: Date/Event | Opponent | Score || Ban 1 | Ban 2 || Pick 1 | Pick 2 || Ban 3 | Ban 4 || Decider
- `VetoChip` component: fixed w-[65px], team = white bg, opponent = grey bg (bg-gray-200)
- Colors: ban = text-red-400, pick = text-green-700, decider = text-blue-700
- Header row: bg-gray-300, text-black, text-xs
- Vertical dividers (border-r-2) between groups, horizontal (border-b border-white/10) between rows
- Score: both numbers text-on-surface, format badge text-[10px]
- Opponent names: text-on-surface (not colored)
- Decider chip: always white bg
- OPP/team labels: text-[9px]

#### Map Pool Expandable Panels
- Click map name to expand detail panel showing both teams' stats
- `MapDetailPanel` component: comp icons, Overall/Attack/Defense rW%, Post-Plant rW%, Retake rW%, Avg Plant Time
- Expand/collapse with rotate arrow indicator, bg-white/5 highlight on expanded row

#### Other Versus Changes
- Veto labels: "FIRST BAN" / "FIRST PICK" badges on map pool bars
- CL Data Only toggle on Roster Comparison section
- Roster table: larger text (text-sm), bigger agent icons (18px), team logos (w-20)
- Map bar text: white with drop shadow for both themes

### Veto Data (`vcl-frontend/src/data/vetoData.ts`)
- Full veto history for 4 playoff teams from Liquipedia
- `getFirstBanPick()` — computes most common first ban/pick per team
- Exports: `VETO_DATA`, `getFirstBanPick`, `VetoMatch` type
- Bo3: 7 steps (Ban1, Ban2, Pick1, Pick2, Ban3, Ban4, Decider)
- Bo5: 7 steps (Ban1, Ban2, Pick1, Pick2, Pick3, Pick4, Decider)

### Pipeline Changes
- `lib/stats_engine.py`: `plant_time_accum` — tracks plantRoundTime per map, computes avg in seconds
- `lib/json_builder.py`: passes `plant_time_rows` to `_build_map_stats()`, adds `avg_plant_time` to map objects
- `types.ts`: `avg_plant_time?: number | null` on `MapStats`
- Both JSON files rebuilt with plant time data populated

### Data & Documentation
- `DATABASE_STRUCTURE.md`: full pipeline and schema docs
- `README.md`: rewritten for GitHub (tech stack, setup, structure, all versions)
- `CHANGELOG.md`: comprehensive v0.9.0 entry
- Utility scripts: `build_new_playoff_matches.py`, `build_mdr_vetoes.py`, `build_sge_matches.py`, `veto_data.py`
- Excel exports: `Playoff_New_Matches.xlsx`, `MDR_Map_Vetoes_2026.xlsx`, `SGE_Included_Matches.xlsx`

### Key Files Modified This Session
- `vcl-frontend/src/pages/Versus.tsx` — veto modal, map expand, team links, roster CL toggle
- `vcl-frontend/src/context/StatsContext.tsx` — dual dataset, hidden players, fullData/playoffData
- `vcl-frontend/src/components/Navbar.tsx` — text-on-surface styling
- `vcl-frontend/src/data/vetoData.ts` — new
- `vcl-frontend/src/types.ts` — avg_plant_time
- `lib/stats_engine.py` — plant time tracking
- `lib/json_builder.py` — plant time passthrough
- `CHANGELOG.md`, `README.md`, `VERSION`, `DATABASE_STRUCTURE.md`

## Important Notes for Next Context
- **Dev server**: running at `http://localhost:5173/`
- **Rebuild command**: `python scripts/build_json.py --output vcl-frontend/public/data/stats.json`
- **Playoff rebuild**: `python scripts/build_json.py --output vcl-frontend/public/data/stats_playoffs.json --playoff`
- **Git**: 7 commits ahead of origin (unpushed), plus uncommitted changes from this session
- **Hidden players**: managed via `HIDDEN_PLAYERS` set in StatsContext — currently only "swagzor"
- **Veto data**: only exists for 4 playoff teams (MISA, EP, UCAM, MDR) — Vetoes button only shows for them
- **Plant time**: populated in rebuilt JSON, shows as "Avg Plant" in map expand panels
- **Bo5 veto format**: Ban3/Ban4 columns will show as Pick3/Pick4 with green color — by design
