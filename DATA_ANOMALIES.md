# Data Anomalies Log

Tracks data quirks, edge cases, and oddities found during processing. Each entry documents what was found, how it was handled, and whether it needs follow-up.

---

## ANO-001: TL players with multiple PUUIDs
- **Date found:** 2026-03-19
- **Status:** HANDLED — merged by name+team in json_builder.py
- **Affected:** Team Liquid Academy — GSR, rexxtoned, Wanzeru
- **Detail:** Each player has two different Riot accounts (PUUIDs) across different time periods. Likely from TLA → TL tag/account migration.
  ```
  GSR       puuid=aWxmti0l  200 rounds  ACS 256
  GSR       puuid=NUju4SQb  391 rounds  ACS 246
  rexxtoned puuid=AgpIKgYA  200 rounds  ACS 196
  rexxtoned puuid=x4Svw6oR  391 rounds  ACS 206
  WanZeru   puuid=wruoyKj5  200 rounds  ACS 186
  Wanzeru   puuid=OIKE31qD  391 rounds  ACS 237
  ```
- **Fix:** `_merge_player_rows()` merges by name+team, weighted-averages ACS/KAST, sums raw counts.
- **Risk:** If two different humans shared a name on the same roster, they'd be incorrectly merged. Not a real risk in VCL.
- **Follow-up:** None needed unless TL makes another roster change mid-season.

---

## ANO-002: 32 forfeit / tech issue matches
- **Date found:** 2026-03-19
- **Status:** HANDLED — excluded by score validation (max score < 13)
- **Detail:** 32 matches across all teams where no team reached 13 rounds. Both teams marked as `won: false` in all cases. Full list in `Suspicious_Matches.xlsx`.
- **Examples:**
  - FKS vs UCAM, 2026-02-19, Bind, 1-5
  - JL vs FUT, 2026-02-19, Corrode, 1-5
  - EP vs GX, 2026-02-24, Ascent, 6-0
  - MDR vs MDR, 2026-02-01, Piazza, 0-1 (warmup lobby)
- **Fix:** `match_parser.py` filters with `is_tech = max(team_score, opp_score) < 13`.
- **Follow-up:** Re-run `Suspicious_Matches.xlsx` generator after collecting new data to catch any new tech issues.

---

## ANO-003: WanZeru vs Wanzeru capitalization
- **Date found:** 2026-03-19
- **Status:** HANDLED — merge uses case-insensitive name matching
- **Affected:** Team Liquid Academy — WanZeru / Wanzeru
- **Detail:** Same player appears with different capitalization across accounts. The `_merge_player_rows()` function keys on `name.lower()` to catch this.
- **Follow-up:** None.

---

## ANO-004: MDR kAdavra vs K4davra
- **Date found:** 2026-03-19
- **Status:** HANDLED — same PUUID, merged automatically
- **Affected:** Mandatory — kAdavra / K4davra
- **Detail:** Same player changed their in-game name mid-season. Confirmed same PUUID (`sg394fWfN9u8`), so the stats engine merges them correctly since it keys by PUUID. The latest name (`kAdavra`) is kept.
- **Follow-up:** None.

---

## ANO-005: EP Proxh Sova data from forfeit match
- **Date found:** 2026-03-19
- **Status:** HANDLED — match excluded by tech issue filter
- **Affected:** Enterprise Esports — Proxh
- **Detail:** Proxh appeared as a Sova player in 3 maps, but one was the EP vs GX 6-0 forfeit on 2026-02-24 (Ascent). Only 6 rounds played. This match is excluded from stats.json but was visible in earlier ad-hoc queries against raw JSONL.
- **Follow-up:** None — pipeline correctly excludes it.

---

## Template for new entries

```
## ANO-XXX: Short description
- **Date found:** YYYY-MM-DD
- **Status:** HANDLED / OPEN / MONITORING
- **Affected:** Team — Player(s)
- **Detail:** What was found.
- **Fix:** What was done about it.
- **Follow-up:** What still needs checking.
```
