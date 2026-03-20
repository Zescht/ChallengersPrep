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
