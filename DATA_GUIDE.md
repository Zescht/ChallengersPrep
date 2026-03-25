# VCL Stats — Data Interpretation Guide

This document explains how to read and work with the data files included in this archive.

---

## Architecture Overview

There is **no traditional database**. The data pipeline is file-based:

```
Raw JSONL (API responses)  →  Python pipeline  →  stats.json  →  React frontend
     data/raw/*.jsonl           lib/*.py          public/data/       vcl-frontend/
```

---

## 1. Raw Match Data (`data/raw/*.jsonl`)

Each `.jsonl` file contains one team's match data for VCL EMEA 2026. One JSON object per line = one map played.

### File naming: `{team_tag}_2026_raw_responses.jsonl`

| File prefix | Team |
|-------------|------|
| `fks` | FOKUS | `sge` | Eintracht Frankfurt |
| `ep` | Enterprise Esports | `tl` | Team Liquid Academy |
| `jl` | Joblife | `mdr` | Mandatory |
| `pxl` | Pixel Lumina | `m1r` | MIR |
| `bar` | Barca eSports | `ucam` | UCAM Esports |
| `misa` | Misa Esports | `s2g` | S2G Esports |
| `sts` | Stallions Esports | `gng` | GnG Amazigh |

### Structure of each line (one map):

```
matchInfo          → matchId, map, gameStartMillis, gameLengthMillis
players[10]        → puuid, gameName, tagLine, teamId (Red/Blue), characterId (agent UUID)
                     stats: score, kills, deaths, assists, roundsPlayed, vlrRating2
                     stats.abilityCasts: grenadeCasts, ability1Casts, ability2Casts, ultimateCasts
teams[2]           → teamId, won (bool), roundsWon, roundsPlayed
roundResults[]     → per-round breakdown (see below)
```

### Round results (per round):

- **Winner:** `winningTeam` (Red/Blue), `roundResultCode` (Elimination, Detonate, Defuse, etc.)
- **Spike:** `bombPlanter`, `plantSite` (A/B/C), `plantRoundTime`, `bombDefuser`, `defuseRoundTime`
- **Per-player stats:** kills (with weapon UUID, victim, timing, locations), damage (headshots/bodyshots/legshots), economy (`loadoutValue`, `weapon`, `armor`)
- **Positions:** `plantPlayerLocations[]` / `defusePlayerLocations[]` — x/y coordinates + view angle for all alive players at moment of plant/defuse

### Important notes:
- `teamId` is Red or Blue — it rotates between matches. The pipeline resolves this to actual team names using the player name prefix (e.g. "FKS Serial" → FOKUS).
- Agent UUIDs need mapping via `lib/constants.py` → `AGENT_MAP`.
- Weapon UUIDs need mapping via `lib/constants.py` → `WEAPON_MAP`.

---

## 2. Processing Pipeline (`lib/`)

| File | Purpose |
|------|---------|
| `constants.py` | UUID-to-name mappings (agents, weapons), team registry, map pool, ability names |
| `match_parser.py` | Loads JSONL, resolves Red/Blue → actual teams, filters tech issues/forfeits |
| `stats_engine.py` | Core computation: economy classification, side assignment, player stats, clutches, post-plant/retake |
| `json_builder.py` | Aggregates all teams into `stats.json` with leaderboards and tournament averages |

### Build command:
```bash
python scripts/build_json.py --output vcl-frontend/public/data/stats.json
```

---

## 3. Processed Output (`stats.json`)

The frontend reads this single file. Top-level keys:

| Key | Contents |
|-----|----------|
| `teams[]` | 14 team objects with per-map stats, compositions, post-plant/retake, XvY clutches, form |
| `players[]` | ~74 players with ACS, ADR, K/D, KA/D, KAST%, FK/FD, clutch%, AWP%, agent picks |
| `players_by_role[]` | Same players duplicated per role played (Duelist, Initiator, etc.) |
| `players_by_agent[]` | Same players duplicated per agent played |
| `matches[]` | Every map result: scores, sides, pistol outcomes, winner |
| `leaderboards` | Pre-sorted rankings for each stat (ACS, K/D, KAST, etc.) with tournament averages |
| `agent_stats[]` | Per-player per-agent ability usage (casts/round, kills) |
| `ability_names` | Human-readable ability slot names per agent |

### Key stat definitions:

| Stat | Definition |
|------|------------|
| **ACS** | Average Combat Score = total score / rounds played |
| **ADR** | Average Damage per Round |
| **K/D** | Kills / Deaths ratio |
| **KA/D** | (Kills + Assists) / Deaths |
| **KAST%** | % of rounds with a Kill, Assist, Survive, or Trade |
| **FK%** | First kills per round |
| **FD%** | First deaths per round |
| **Clutch%** | Clutch rounds won / clutch situations faced |
| **AWP%** | % of kills made with the Operator (sniper) |
| **VLR Rating** | Weighted performance rating (from Valolytics API) |

### Economy classification (team total loadout, 5 players):

| Type | Condition |
|------|-----------|
| Pistol | Rounds 1 and 13 (first round of each half) |
| Anti-Eco | Rounds 2 and 14 (round after pistol) |
| Gun | Team loadout > 20,000 credits |
| Eco | Team loadout < 5,000 credits |
| Force Buy | Team loadout 5,000–10,000 credits |

### Post-plant vs Retake:
- **Post-plant:** Your team planted the spike (you're on attack, defending the bomb)
- **Retake:** Opponent planted the spike (you're on defense, retaking the site)

---

## 4. Data Quality Filters

The pipeline automatically excludes:
- **Tech issues / forfeits:** Matches with abnormal final scores (1-5, 5-0, 3-3, 5-2, 6-0)
- **Roster contamination:** TLA (Team Liquid Academy) matches from 2026-01-23 where main roster played
- **Duplicate players:** Deduplicated by name + team (handles cases where a player has multiple PUUIDs)

---

## 5. Supplementary Files

| File | Description |
|------|-------------|
| `data/raw/sample_match.json` | Single match reference structure |
| `data/raw/full_match_dump.json` | Complete match example (Breeze) |
| `data/raw/cgn_2026_match_ids.json` | 41 CGN match IDs |
| `data/raw/cgn_2026_matches_detail.json` | 41 CGN match summaries |
| `data/raw/ep_recent5_detail.jsonl` | Enterprise last 5 matches (subset) |
| `data/raw/stat_categories_sample.csv` | CSV showcase of all available stat fields |
| `data/raw/reference_sheet.xlsx` | Reference data spreadsheet |

---

## Quick Start: Reading the Data

### Python — load raw match data:
```python
import json
with open('data/raw/fks_2026_raw_responses.jsonl') as f:
    matches = [json.loads(line) for line in f if line.strip()]
print(f"{len(matches)} maps loaded")
print(matches[0]['matchInfo']['map'])  # e.g. "/Game/Maps/Duality" → Bind
```

### Python — load processed stats:
```python
import json
with open('vcl-frontend/public/data/stats.json') as f:
    stats = json.load(f)
for team in stats['teams']:
    print(f"{team['tag']}: {team['allMaps']['wins']}W-{team['allMaps']['losses']}L")
```

### Rebuild stats.json after modifying pipeline:
```bash
python scripts/build_json.py --output vcl-frontend/public/data/stats.json
```
