# Changelog

All notable changes to this project will be documented in this file.

## Versioning Scheme

This project uses **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

| Component | When to bump | Example |
|-----------|-------------|---------|
| **MAJOR** | Full rebuild or breaking changes to spreadsheet structure / data pipeline | `1.0.0` → `2.0.0` |
| **MINOR** | New team added, new stat category, new feature (e.g. post-plant analysis) | `0.2.0` → `0.3.0` |
| **PATCH** | Bug fixes, data corrections, formatting tweaks, refactors | `0.2.1` → `0.2.2` |

### Milestone targets

- **0.x.x** — Development phase: building tooling, data pipeline, single-team proof of concept
- **1.0.0** — All 14 VCL teams with complete stats spreadsheet matching VCL3 template
- **2.0.0** — Reserved for major structural changes (new stage, new league, full rewrite)

---

## [0.9.0] - 2026-03-24 — Playoff Mode & Map Vetoes

### Context & Goals
VCL EMEA 2026 Stage 1 has reached playoffs. Only 4 teams remain: **MISA**, **Enterprise (EP)**, **UCAM**, and **Mandatory (MDR)**. This version adds a full playoff mode to the dashboard, map veto data from Liquipedia, and updates match data with 19 new playoff maps.

### Added
- **Playoff mode frontend**: two navbar toggles — "Playoff-Teams" (filters to 4 teams) and "CL Data Only" (swaps to Challengers-only dataset)
- **FilterContext**: manages `playoffOnly` and `clDataOnly` booleans with localStorage persistence
- **Dual dataset loading**: StatsContext loads both `stats.json` and `stats_playoffs.json`, switches based on mode
- **Auto-redirect**: navigates to first available team when current team is filtered out by playoff mode
- **Map veto data**: `vetoData.ts` with full veto history for all 4 playoff teams sourced from Liquipedia
- **Veto labels on Versus page**: "FIRST BAN" / "FIRST PICK" badges on map pool bars per team
- **CL Data Only toggle on Versus roster**: per-section toggle to compare rosters using playoff-only stats
- **Plant time tracking**: `stats_engine.py` now computes average plant time per map per team
- `DATABASE_STRUCTURE.md` — full documentation of the data pipeline, raw JSONL format, stats.json schema, and constants
- `Playoff_New_Matches.xlsx` — catalog of 19 newly fetched playoff maps
- `build_new_playoff_matches.py`, `build_mdr_vetoes.py`, `build_sge_matches.py` — data export utility scripts
- `MDR_Map_Vetoes_2026.xlsx`, `SGE_Included_Matches.xlsx` — exported data references
- `veto_data.py` — Python source for veto data collection
- Playoff mode design spec and implementation plan (`docs/superpowers/`)
- `--playoff` pipeline flag in `build_json.py` to generate `stats_playoffs.json`

### Changed
- StatsContext now exposes `fullData` and `playoffData` alongside filtered `data`
- Versus page roster comparison: larger text, bigger agent icons, team logos sized up
- Navbar toggle styling: `text-on-surface` replaces `text-text-dim` for better contrast
- Playoff mode averages remain computed from full 14-team league (design decision — keeps color scales consistent)
- Updated raw data for 4 playoff teams with new matches:
  - MISA: 24 → 28 maps (+4: vs SGE, TL)
  - EP: 32 → 36 maps (+5: vs BAR, FKS)
  - UCAM: 51 → 55 maps (+4: vs PXL, JL)
  - MDR: 32 → 38 maps (+6: vs M1R, GNG, S2G)

### Data Quality Notes
- MDR vs M1R Haven (13-1) — flagged as potential forfeit/tech issue, included in raw data pending review

---

## [0.8.0] - 2026-03-23

### Added
- **Versus page overhaul**: full Team vs Team and Player vs Player comparison modes
- **Team VS header**: team logos, map/series records, rW%, form strips in a mirrored card layout with gradient accents
- **Map Pool Dominance**: side-by-side horizontal bars per map with rW%, W-L records, and delta badges
- **Head-to-Head History**: table of previous meetings (date, map, score, winner) sorted by recency
- **Pistol Win Rate comparison**: proportional split bar with attack/defense breakdown cards
- **Tactical Execution cards**: post-plant and retake rW% with event rank, side-by-side layout
- **Roster Comparison**: dual roster tables with agent icons, ACS, K/D, KAST, FK/r, CL%
- **Player VS mode**: mirrored player cards with team logos, stat comparison table (winner highlighting), and agent pool display
- **Team logos in Versus**: inline `TEAM_LOGOS` map using `BASE_URL`-aware paths

### Changed
- Removed `XvYMatrix` import from Versus page (unused)
- Versus page constrained to `max-w-7xl` with centered layout

## [0.7.0] - 2026-03-21

### Added
- **Team Overview overhaul**: XvY matrix, form strip, persistent navbar, global search bar, stat cell refinements
- **Per-comp expandable rows**: click to expand composition details per map
- **Custom color scales**: team-tab stat cells use tailored red–green gradients with unified intensity constants
- **XvY scaling**: clutch table sizing adjusted for readability; dedicated `xvyDeltaColor` for delta mode
- **Percentile-based leaderboard coloring**: replaced z-score/std-dev system with percentile ranking for more intuitive color gradients
- **Retake custom color scale**: `retakeColor` function for post-plant/retake win% cells

### Changed
- **Typography overhaul**: leaderboard and team page font hierarchy rewritten for density and clarity
- Player name links styled dark blue (replacing green) for better contrast
- rW% column values bold black; thick 3px separator between identity and stat columns
- Player table layout refined with `font-table` class for compact broadcast-ready display
- Maps sorted alphabetically in Team Overview (was by play count)
- "rW%" column header renamed to "WIN%" in post-plant/retake tables
- Color system unified: shared `MAX_OPACITY` (0.55) and `CURVE_POWER` (0.45) constants across all color scales
- StatCell: colored text (green/red) only in light mode; dark mode uses white text on colored backgrounds

### Fixed
- TypeScript build errors in `AgentStats.tsx` and CI pipeline (bumped Node.js)
- Player link color specificity issue resolved
- GitHub Pages team logo paths use `BASE_URL` correctly
- Dark mode: ghost-borders tables now use theme `on-surface` color

## [0.6.0] - 2026-03-20

### Added
- **Leaderboards rewrite**: sortable columns with stacked ▲/▼ arrows, color-coded cells (red→green→purple percentile gradient)
- **VLR Rating**: weighted average of `vlrRating2` from raw match data, added to pipeline and leaderboard
- **ADR**: average damage per round computed from per-round `damage[]` array
- **Role filter**: dropdown (Duelist/Initiator/Controller/Sentinel) — filters players who play any agent of that role
- **Role stats toggle**: checkbox that switches between overall stats and role-only stats (per-role accumulation in pipeline)
- **Expandable CL-WIN%**: `+` button expands inline ATMP/WON sub-columns to the right
- **Team logos**: downloaded from Liquipedia, stored locally at `vcl-frontend/public/logos/`
- **Agent role mapping**: `AGENT_ROLE` in `lib/constants.py` (all 28 agents)
- **Per-role pipeline**: `role_accum` in stats_engine, `players_by_role` array in stats.json
- `compact.md` — session summary for context continuity

### Changed
- Leaderboard columns: removed Kills/Deaths/Assists/KA/D individual tabs; added VLR, ADR, FK/FD (merged), FK%, CL-WIN%, OP% Kill
- Team column shows logo + tag abbreviation instead of full team name
- Sort: click toggles asc/desc per column; columns have sensible defaults (Deaths ascending, etc.)
- Thick 3px separator between identity columns and stat columns
- `.gitignore`: added superpowers skills, misc non-project files

### Fixed
- **TLA data contamination**: removed 3 matches (2026-01-23) where TL main roster (nAts, Miniboo, kamo, purp0) was mixed with TLA; exported `TLA_Included_Matches.xlsx` for transparency
- Player count: 78 → 74 (removed 4 TL main roster players from TLA data)

## [0.5.0] - 2026-03-19

### Added
- **Data pipeline**: `scripts/build_json.py` — converts raw JSONL → `stats.json` for frontend
- **Shared library** `lib/` — extracted from `build_fokus_sheet.py`:
  - `lib/constants.py` — agent/weapon UUID maps, team registry
  - `lib/match_parser.py` — JSONL loading, team resolution, tech-issue filtering
  - `lib/stats_engine.py` — core stat computation (economy, XvY, post-plant, KAST, FK/FD, clutch)
  - `lib/json_builder.py` — assembles PRD-compliant JSON (teams, players, matches, leaderboards)
- `DATA_ANOMALIES.md` — log of data quirks (5 entries: TL multi-PUUID, forfeits, name casing, etc.)
- Output: `public/data/stats.json` (712 KB, 14 teams, 78 players, 372 matches, 11 leaderboards)

### Fixed
- Player deduplication: TL roster members with multiple PUUIDs merged by name+team
- Case-insensitive player name matching (WanZeru/Wanzeru)

## [0.4.0] - 2026-03-19

### Added
- `Data_Catalog.xlsx` + `build_data_catalog.py` — comprehensive catalog of all 207 available stats (team, player, derived)
- `Suspicious_Matches.xlsx` + `build_suspicious_tab2.py` — 32 identified forfeit/tech issue matches with score-based validation
- `PRD.md` — full product requirements for VCL Broadcast Stats Dashboard (React frontend)
- `VCL_Stats.xlsx` — updated multi-team stats workbook

### Changed
- `CLAUDE.md` — added PRD.md startup reference

## [0.3.0] - 2026-03-19

### Added
- GitHub repository (private) at `Zescht/ChallengersPrep`
- Proper `.gitignore` (Excel temp files, `.env`, raw data, IDE files)

### Fixed
- Removed tracked files that should be ignored (`~$FOKUS_Stats.xlsx`, `.claude/settings.local.json`)

## [0.2.0] - 2026-03-18

### Added
- `build_fokus_sheet.py` — generates FOKUS team stats spreadsheet from API data
- `collect_team_data.py` — fetches and stores match data for any VCL team
- `VCL_Stats.xlsx` — multi-team stats workbook with dropdown-driven team selector
- `VCL3_Stats_2026.xlsx` — 2026 season stats output
- `FOKUS_Stats.xlsx` — dedicated FOKUS stats sheet (proof of concept)
- All 14 VCL EMEA 2026 teams registered in `CLAUDE.md`
- Agent icon images for all agents (`data/icons/`)
- XvX clutch analysis (`XvX.png`)

### Changed
- Expanded `CLAUDE.md` with full API reference, match data structure, economy classification, and team registry

## [0.1.0] - 2026-03-16

### Added
- Initial project setup with git repository
- VLR.gg web scraper (`scraper/vlr_scraper.py`, `scraper/display.py`)
- API reference documentation (`API_REFERENCE.md`)
- CGN Esports scraped data (`data/cgn-esports_20260316_094537.json`)
- CGN composition summary (`data/compositions_by_map.txt`)
- VCL3 Stats template spreadsheet (`VCL3 Stats.xlsx`)
- `requirements.txt` (requests, bs4, lxml)
- `VERSION` file
