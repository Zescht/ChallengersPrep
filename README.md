# ChallengersPrep

VCL EMEA 2026 stats analysis tool for broadcast preparation. Pulls match data from the Valolytics API and produces team/player statistics for all 14 VCL teams.

**Current version: 0.4.0**

## What's in here

| Component | Description |
|-----------|-------------|
| `build_fokus_sheet.py` | Generates team stats Excel workbook from raw API data (all 14 teams) |
| `collect_team_data.py` | Fetches match data from Valolytics API per team |
| `build_data_catalog.py` | Generates a catalog of all 207 available stats |
| `build_suspicious_tab2.py` | Identifies forfeit/tech issue matches via score validation |
| `scraper/` | VLR.gg web scraper (legacy) |
| `data/raw/` | Raw match data JSONL files for all 14 VCL teams (gitignored) |
| `PRD.md` | Product requirements for the upcoming broadcast dashboard |

## VCL EMEA 2026 Teams

SGE, FKS, JL, MDR, EP, TL, PXL, M1R, BAR, UCAM, MISA, S2G, STS, GNG

## Version History

See [CHANGELOG.md](CHANGELOG.md) for full details.

| Version | Date | Highlights |
|---------|------|------------|
| 0.4.0 | 2026-03-19 | Data catalog (207 stats), suspicious match detection, PRD for dashboard |
| 0.3.0 | 2026-03-19 | GitHub repo setup, proper .gitignore |
| 0.2.0 | 2026-03-18 | All 14 teams, stats workbook, data collection pipeline |
| 0.1.0 | 2026-03-16 | Initial setup, VLR.gg scraper, API reference |
