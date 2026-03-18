# VCL Stats Project

## Compaction Rules
When compacting, always preserve the full list of modified files and any test commands.

## Project Overview
Valorant Challengers League (VCL) EMEA 2026 stats analysis tool. Scrapes and processes match data from the Valolytics API and VLR.gg to produce team/player statistics spreadsheets.

## Valolytics API

### Authentication
All requests use `x-api-key` header only:
```
x-api-key: <VALOLYTICS_API_KEY>
```

### Endpoints (base: `https://api.valolytics.gg`)

1. **Resolve Riot ID → PUUID**
   ```
   GET /api/riot/account/v1/accounts/by-riot-id/esports/{gameName}/{tagLine}
   ```

2. **Match History by PUUID**
   ```
   GET /api/riot/match/v1/matchlists/by-puuid/esports/{puuid}
   ```
   Returns `{ puuid, history: [{ matchId, gameStartTimeMillis, gameStartTime, queueId }] }`

3. **Match Details**
   ```
   GET /api/matches/esports/{matchId}
   ```
   Returns full match object: `matchInfo`, `players`, `coaches`, `teams`, `roundResults`

### API Notes
- Python `urllib` fails with 403 on Windows due to SSL issues. **Always use `curl`** for API calls.
- All esports players use tagLine `epval`.
- A "series" = multiple maps played on the same day vs the same opponent. A "game" typically refers to a series, not a single map.

## VCL EMEA 2026 Stage 1 — Team Registry

| # | Team Name | In-Game Tag | Key Player PUUID Resolved |
|---|-----------|-------------|---------------------------|
| 1 | Eintracht Frankfurt | **SGE** | SGE musashi |
| 2 | FOKUS | **FKS** | FKS Serial |
| 3 | Joblife | **JL** | JL chiwa |
| 4 | Mandatory | **MDR** | MDR TakaS |
| 5 | Enterprise Esports | **EP** | EP MAGNUM |
| 6 | Team Liquid Academy | **TL** | TL Kicks |
| 7 | Pixel Lumina | **PXL** | PXL elllement |
| 8 | MIR | **M1R** | M1R Redgar |
| 9 | Barça eSports | **BAR** | BAR Stonezy |
| 10 | UCAM Esports | **UCAM** | UCAM Jesse |
| 11 | Misa Esports | **MISA** | MISA Brave |
| 12 | S2G Esports | **S2G** | S2G reazy |
| 13 | Stallions Esports | **STS** | STS Avvix |
| 14 | GnG Amazigh | **GNG** | GNG LOOP |

### Other Known Tags (opponents from qualifiers/scrims)
- **ATN** — unknown org (roster overlaps with VAL: prayy moved ATN→VAL)
- **6GPA**, **DXG**, **RZN**, **AX**, **BJK** (Beşiktaş), **BDX**, **VIT** (Vitality), **ECO**, **TOG**, **VAL**, **VR2**, **KC**, **GX**, **FUT**, **BONK**

## Match Data Structure

### `matchInfo`
- `matchId`, `map`, `mapId`, `gameLengthMillis`, `gameStartMillis`, `region`, `gameMode`

### `players[]`
- `puuid`, `gameName`, `tagLine`, `teamId` (Red/Blue), `characterId` (agent UUID), `isObserver`
- `stats`: `score`, `roundsPlayed`, `kills`, `deaths`, `assists`, `playtimeMillis`, `vlrRating2`
- `stats.abilityCasts`: `grenadeCasts`, `ability1Casts`, `ability2Casts`, `ultimateCasts`
- `competitiveTier`, `playerCard`, `playerTitle`, `accountLevel`

### `teams[]`
- `teamId`, `won`, `roundsPlayed`, `roundsWon`, `numPoints`

### `roundResults[]`
- `roundNum` (0-indexed), `roundResult`, `roundCeremony`, `winningTeam`, `roundResultCode`
- **Spike**: `bombPlanter`, `plantRoundTime`, `plantLocation {x,y}`, `plantSite` (A/B), `bombDefuser`, `defuseRoundTime`, `defuseLocation {x,y}`
- **Player positions at plant/defuse**: `plantPlayerLocations[]`, `defusePlayerLocations[]` — each has `puuid`, `viewRadians`, `location {x,y}`
- **playerStats[]** (per player per round):
  - `kills[]`: `timeSinceGameStartMillis`, `timeSinceRoundStartMillis`, `killer`, `victim`, `victimLocation {x,y}`, `assistants[]`, `playerLocations[]` (all alive players' positions + viewRadians), `finishingDamage { damageType, damageItem (weapon UUID), isSecondaryFireMode }`
  - `damage[]`: `receiver`, `damage`, `headshots`, `bodyshots`, `legshots`
  - `score`, `economy { loadoutValue, weapon, armor, remaining, spent }`
  - `ability { grenadeEffects, ability1Effects, ability2Effects, ultimateEffects }`

## Round Economy Classification

Based on **team total loadout value** (sum of 5 players):
- **Pistol**: Always rounds 1 and 13 (first round of each half)
- **Anti-Eco**: Rounds 2 and 14 (round after pistol)
- **Gun Round**: Team equipment value > 20,000
- **Eco**: Team equipment value < 5,000
- **Force Buy**: Team equipment value between 5,000 and 10,000

## Post-Plant / Retake Classification

- **Post-Plant**: Rounds where FOKUS (or the team being analyzed) planted the spike (team is on attack)
- **Retake**: Rounds where the opponent planted the spike (team is on defense)

## Data Quality Notes

- Matches with abnormally low scores (e.g. 1-5, 5-0, 3-3, 5-2, 6-0) are **tech issues or forfeits**, not real gameplay. These must be **excluded** from all stats.
- Known example: FOKUS vs UCAM on 2026-02-19, Bind, 1-5 loss — tech issue, replayed immediately after (13-11 win).
- When excluding, provide a separate CSV listing all included matches for transparency.

## Spreadsheet Output Structure (VCL3 Stats.xlsx)

Target output mimics the existing Excel structure:

### Team View (main dashboard per team)
- Per-map: composition, plays, W/L, round win % (all/atk/def)
- Broken down by: Pistol, Gun, Anti-Eco, Eco round types
- Post-plant stats: scenarios, T-rounds, post/map, post rW%, event avg, rank
- Retake stats: scenarios, CT-rounds, ret/map, ret rW%, event avg, rank

### Player Stats
- Rounds played, K/D, KA/D (kills+assists/deaths), KAST%, FK/r (first kills per round), FD/r (first deaths per round), FK/FD ratio, CL% (clutch %), AWP% (Operator kill %)

### Supporting Data
- Kills, Deaths, Assists, ACS (Average Combat Score), XvY (clutch situations), Post Plants per map

## File Structure

```
VLR/
├── CLAUDE.md                          # This file
├── API_REFERENCE.md                   # API endpoint documentation
├── VERSION                            # Semantic version (0.1.0)
├── CHANGELOG.md                       # Version history
├── requirements.txt                   # Python deps (requests, bs4, lxml)
├── VCL3 Stats.xlsx                    # Template spreadsheet (2025 data)
├── scraper/
│   ├── vlr_scraper.py                 # VLR.gg web scraper
│   └── display.py                     # Terminal display formatter
└── data/
    ├── cgn-esports_20260316_094537.json   # CGN scraped stats from VLR.gg
    ├── compositions_by_map.txt            # CGN comp summary
    └── raw/
        ├── cgn_2026_match_ids.json        # 41 CGN match IDs
        ├── cgn_2026_matches_detail.json   # 41 CGN match summaries
        ├── fks_2026_raw_responses.jsonl   # 52 FOKUS full match details
        ├── sge_2026_raw_responses.jsonl   # 43 SGE full match details
        ├── ep_2026_raw_responses.jsonl    # 32 Enterprise full match details
        ├── sample_match.json              # Reference match structure
        ├── full_match_dump.json           # Full match example (Breeze)
        ├── stat_categories_sample.csv     # CSV showcase of all stat fields
        └── reference_sheet.xlsx           # Reference data
```

## Workflow: Adding a New Team

1. Find a core player's Riot ID (from existing match data or Liquipedia)
2. Resolve PUUID: `GET /api/riot/account/v1/accounts/by-riot-id/esports/{name}/epval`
3. Get match history: `GET /api/riot/match/v1/matchlists/by-puuid/esports/{puuid}`
4. Filter to 2026 matches
5. Fetch each match detail via curl (not Python urllib): `GET /api/matches/esports/{matchId}`
6. Save as JSONL file in `data/raw/{tag}_2026_raw_responses.jsonl`
7. Verify completeness by checking if the player was in all team matches (cross-reference with other roster members if needed)

## Weapon UUID Mapping

Weapon UUIDs appear in `finishingDamage.damageItem` and `economy.weapon`. These need to be mapped to human-readable names for AWP% and weapon stats. Mapping is still TODO — plan is to identify UUIDs from match data by cross-referencing known weapon behaviors.

## Current Task

Building a FOKUS stats spreadsheet (.xlsx) matching the VCL3 Stats template structure, populated entirely from Valolytics API data. This serves as the proof-of-concept before scaling to all 14 teams.
