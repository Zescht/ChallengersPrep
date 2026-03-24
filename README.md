# ChallengersPrep

Broadcast stats dashboard and data pipeline for **VCL EMEA 2026 Stage 1**. Built for analyst prep — dense stat tables, team comparisons, map veto tendencies, and playoff mode filtering, all from a single JSON file.

**Current version: 0.9.0** | [Changelog](CHANGELOG.md)

## Dashboard

React frontend served via GitHub Pages. Dark theme, desktop-first, no auth required.

| Page | What it shows |
|------|--------------|
| **Team Overview** | Map stats, compositions, player stats, XvY clutch matrix, talking points |
| **Player Profile** | Core stats with tournament rank, agent pool, clutch breakdown |
| **Leaderboards** | Sortable cross-team rankings with role filter, VLR rating, ADR |
| **Versus** | Team vs Team (map pool, H2H, economy, rosters) and Player vs Player comparison |
| **Match History** | Chronological log of all maps played, expandable rows |

### Playoff Mode

Two navbar toggles for the Stage 1 playoffs (MISA, EP, UCAM, MDR):
- **Playoff-Teams** — filters dashboard to the 4 remaining teams
- **CL Data Only** — swaps to a Challengers-only dataset (excludes regional league data)

Map veto tendencies (first ban / first pick) appear on the Versus page map pool bars.

## Data Pipeline

```
Valolytics API → raw JSONL (per team) → stats_engine.py → json_builder.py → stats.json → React frontend
```

| Script | Purpose |
|--------|---------|
| `collect_team_data.py` | Fetches match data from Valolytics API per team |
| `scripts/build_json.py` | Converts raw JSONL to `stats.json` (and `stats_playoffs.json` with `--playoff`) |
| `build_fokus_sheet.py` | Generates Excel workbook from raw API data (all 14 teams) |
| `build_data_catalog.py` | Catalog of all 207 available stats |
| `build_suspicious_tab2.py` | Identifies forfeit/tech issue matches via score validation |

### Shared Library (`lib/`)

| Module | Role |
|--------|------|
| `constants.py` | Agent/weapon UUID maps, team registry, agent roles |
| `match_parser.py` | JSONL loading, team resolution, tech-issue filtering |
| `stats_engine.py` | Core stat computation (economy, XvY, post-plant, KAST, FK/FD, clutch, plant time) |
| `json_builder.py` | Assembles PRD-compliant JSON output |

## VCL EMEA 2026 Teams

| Tag | Team | Tag | Team |
|-----|------|-----|------|
| SGE | Eintracht Frankfurt | BAR | Barca eSports |
| FKS | FOKUS | UCAM | UCAM Esports |
| JL | Joblife | MISA | Misa Esports |
| MDR | Mandatory | S2G | S2G Esports |
| EP | Enterprise Esports | STS | Stallions Esports |
| TL | Team Liquid Academy | GNG | GnG Amazigh |
| PXL | Pixel Lumina | M1R | MIR |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React (Vite), TypeScript, Tailwind CSS, React Router v6 |
| Data | Static JSON loaded at app init |
| Pipeline | Python 3, openpyxl |
| Hosting | GitHub Pages |
| API | Valolytics (esports match data) |

## Setup

### Frontend

```bash
cd vcl-frontend
npm install
npm run dev
```

### Data Pipeline

```bash
pip install -r requirements.txt

# Rebuild stats.json from raw data
python scripts/build_json.py --input data/raw --output vcl-frontend/public/data/stats.json

# Rebuild playoff-only dataset
python scripts/build_json.py --input data/raw --output vcl-frontend/public/data/stats_playoffs.json --playoff
```

### Adding a New Team

1. Find a core player's Riot ID from match data or Liquipedia
2. Resolve PUUID via Valolytics API
3. Fetch match history and filter to 2026
4. Save as `data/raw/{tag}_2026_raw_responses.jsonl`
5. Re-run the pipeline

## Project Structure

```
ChallengersPrep/
├── vcl-frontend/          # React dashboard
│   ├── src/
│   │   ├── components/    # Navbar, AgentIcon, FormStrip, StatCell, etc.
│   │   ├── context/       # StatsContext, FilterContext
│   │   ├── pages/         # TeamOverview, Player, Leaderboards, Versus, History
│   │   ├── data/          # vetoData.ts (map veto tendencies)
│   │   └── utils/         # Formatting, color scales
│   └── public/
│       ├── data/          # stats.json, stats_playoffs.json
│       └── logos/         # Team logos from Liquipedia
├── lib/                   # Shared Python library
├── scripts/               # build_json.py
├── scraper/               # VLR.gg scraper (legacy)
├── data/raw/              # Raw JSONL match data (gitignored)
├── PRD.md                 # Product requirements
├── DATABASE_STRUCTURE.md  # Data pipeline and schema docs
└── CLAUDE.md              # AI assistant context
```

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.9.0 | 2026-03-24 | Playoff mode, map veto data, dual dataset loading |
| 0.8.0 | 2026-03-23 | Versus page — team & player comparison |
| 0.7.0 | 2026-03-21 | Custom color scales, percentile leaderboards, XvY matrix |
| 0.6.0 | 2026-03-20 | Leaderboard rewrite, VLR rating, ADR, role filter, team logos |
| 0.5.0 | 2026-03-19 | JSONL → JSON data pipeline, shared lib |
| 0.4.0 | 2026-03-19 | Data catalog, suspicious match detection, PRD |
| 0.3.0 | 2026-03-19 | GitHub repo setup |
| 0.2.0 | 2026-03-18 | All 14 teams, stats workbook |
| 0.1.0 | 2026-03-16 | Initial setup, VLR.gg scraper |
