---
name: veto-implementation
description: Use when asked to add, update, pull, or implement map veto / veto history data for a team on the VCL site (the "Vetoes" button in the Versus tab). Applies to onboarding a new team's vetoes and to extending an existing team's veto history with recent matches.
---

# Veto Implementation

## Overview
Sources map-veto sequences from Liquipedia match pages and hardcodes them into
`vcl-frontend/src/data/vetoData.ts`, which powers the "Vetoes" button on a
team's card in the Versus tab (`vcl-frontend/src/pages/Versus.tsx`). This is a
**manual transcription pipeline, not an API pull** — there is no automated
scraper, and Liquipedia has no public API in use here. Budget one `WebFetch`
call per match page (or two, if a re-check is needed), not one per team.

There is no shortcut around fetching each match individually — Liquipedia's
match-history table pages do not reliably return every row through a single
summarized fetch (see Step 2). Treat every fetched summary as provisional
until cross-checked.

## Step 0 — Establish scope and the ground truth

1. Confirm the team tag (must match `lib/constants.py` TEAMS registry, e.g. `NVJ`, `EP`).
2. Read `vcl-frontend/src/data/vetoData.ts` — find the team's existing array
   (if any) and its **last recorded date**. That date is the starting point;
   never re-fetch matches already covered.
3. Build the **authoritative match list** from our own data, not Liquipedia,
   using `vcl-frontend/public/data/stats.json` (already built, always current):

```python
import json
from collections import defaultdict
with open('vcl-frontend/public/data/stats.json', encoding='utf-8') as f:
    data = json.load(f)
team_full_name = 'NAVI Junior'  # full name as it appears in match rows
rows = [m for m in data['matches'] if team_full_name in (m['team1'], m['team2'])]
series = defaultdict(list)
for m in rows:
    series[m['series_id']].append(m)
out = []
for sid, maps in series.items():
    d = maps[0]['date']
    if d < '2026-05-18':   # the cutoff = day after last recorded veto
        continue
    opp = maps[0]['team2'] if maps[0]['team1'] == team_full_name else maps[0]['team1']
    out.append((d, sid, opp, len(maps)))
out.sort()
for r in out: print(r)
```

This gives the exact count of series, their dates, opponents, and map counts
(map count matters — see Step 4 for format detection). **This list is the
source of truth for completeness.** Liquipedia is only the source of truth
for the veto sequence itself.

## Step 1 — Pull Liquipedia's match list, then reconcile counts

Fetch `https://liquipedia.net/valorant/{Team_Name}/Matches` asking for matches
from the cutoff date onward, with the match detail URL for each
(`/valorant/Match:ID_...`).

**Liquipedia will not match our count on the first pass, for two independent reasons:**

1. **Lag** — the team's most recent match (especially within the last few
   days) is often not yet added to Liquipedia at all, even though it's
   already in our own dataset (which pulls from Valolytics directly). This is
   expected, not a bug. Flag it and move on — there is no veto to pull yet.
2. **Truncation** — a single `WebFetch` summarization pass over a large
   match-history table silently drops rows, even when explicitly asked for
   "the complete list, don't skip any." This is a small-model limitation, not
   a data gap. If Liquipedia's returned count is short of the ground-truth
   count by more than the known lag (reason 1), **re-query for the specific
   missing dates/opponents by name** — a targeted re-ask ("is there a match
   vs X around date Y?") reliably surfaces rows a bulk listing missed.

Do not proceed to Step 2 until every ground-truth series either has a
Liquipedia match URL or is confirmed absent (lag).

## Step 2 — Fetch each match page for its veto sequence

One `WebFetch` per match, with a prompt that forces **verbatim transcription**,
not summarization:

> "Find the map veto section. Quote it VERBATIM, step by step in the exact
> order shown, telling me for each map: which team banned/picked it, and
> whether it's BAN/PICK/DECIDER. Also give the exact final score and format
> (Bo3/Bo5)."

**Never trust a first-pass summary's interpretation of score or "who won
which map" without checking it against the veto's own BAN/PICK team
attributions.** The small model fetching the page has been observed to:
- Misread which side of a `"6-13"` score string belongs to which team,
  producing a series-score contradiction (e.g. reporting a 3-0 sweep when the
  real result was 2-1). If a discrepancy shows up between the stated series
  score and a per-map result list, re-fetch with an explicit instruction to
  quote the raw HTML score string without interpreting which side won.
- Mislabel `Pick 3`/`Pick 4` as `Ban 3`/`Ban 4` in Bo5 (Advantage) matches
  (see Step 4 — this is caught by cross-checking map count, not by re-reading).

If anything looks internally inconsistent (series score vs. maps-played
count, or a same-team back-to-back ban outside of the Advantage format), do
a second verbatim re-fetch before writing it into the file. Two independent
verbatim reads that agree are sufficient confidence — don't fetch a third
time.

## Step 3 — Detect the correct format from map count AND ban pattern, not from the fetch's label

Don't rely on the fetch summary's own "Bo3/Bo5" claim. Cross-check two
independent signals: the **map count from Step 0's ground truth**, and
**who bans in steps 1 and 2**.

| Maps played | Ban1/Ban2 | Real format | Veto shape |
|---|---|---|---|
| ≤3 (ends 2-0/2-1) | different teams | `Bo3` | Ban1, Ban2 (diff teams), Pick1, Pick2, Ban3, Ban4, Decider |
| 3–5 (best of 5, standard) | different teams | `Bo5` | Ban1, Ban2 (diff teams), Pick1–4 alternating, Decider — series can end 3-0 (3 maps), 3-1 (4 maps), or 3-2 (5 maps); map count alone does *not* imply Advantage |
| 3–5 (best of 5, one team seeded/advantaged) | **same team bans both** | `Bo5 (Advantage)` | Ban1, Ban2 (**same team**), Pick1–4 alternating, Decider |

**The map-count signal only rules out Bo3** (4+ maps played is structurally
impossible under a Bo3 veto — that shape has just 3 maps in the pool at all,
2 bans + 2 picks + 1 decider). It does **not** by itself distinguish `Bo5`
from `Bo5 (Advantage)` — a standard Bo5 can just as easily go to 4 maps
(3-1) as an Advantage one. The actual tell is **which team performs Ban1 and
Ban2**: same team both times → Advantage; different teams → standard Bo5.
Always check this before deciding the format label, even when the map count
alone would have suggested Advantage.

Separately, if a fetch reports `Ban 3`/`Ban 4` steps in a match where the
ground truth shows **4+ maps were actually played**, those steps are
mislabeled and should be corrected to `Pick 3`/`Pick 4` regardless of which
Bo5 variant it turns out to be.

## Step 4 — Write into `vetoData.ts`

Match the file's existing conventions exactly:

- **Team tag vs. full name in the `vetoes` tuples**: use the short tag
  (`NVJ`, `EP`, `MDR`, `MISA`, `UCAM`) **only** for teams that have their own
  entry in `VETO_DATA` (i.e., are cross-referenceable via `getFirstBanPick`).
  Every other opponent — even ones tracked elsewhere in the codebase with
  their own tag, like `RB`/REBORN, `FKS`/FOKUS, `JL`/Joblife — gets its full
  display name (`'REBORN'`, `'FOKUS'`, `'Joblife'`), not the short tag. This
  matters because `VetoChip`'s `isTeam` check in `Versus.tsx` is a literal
  string match against the modal's `tag` prop.
- `opponent` field: always the full display name, regardless of the above.
- `score`: `"X-Y"` from the named team's perspective, parsed by
  `m.score.split('-').map(Number)` — must be exactly two numbers joined by a
  single hyphen.
- Append new entries after the array's last existing entry; keep
  chronological ascending order like the rest of the file (the modal sorts
  descending for display, so input order doesn't affect rendering, only
  readability of the source file).
- New team: add a `{TAG}_MATCHES` const, register it in `VETO_DATA`, and add
  the tag to `TEAM_TAGS_IN_VETOES`. Both edits are required — `VETO_DATA`
  alone makes the modal work but `getFirstBanPick` silently returns nothing
  without the `TEAM_TAGS_IN_VETOES` entry.

## Step 5 — Verify

```bash
cd vcl-frontend && npx tsc --noEmit
```

Must be clean. This catches malformed tuples/typos but **not** data-accuracy
issues — those are only caught by Steps 1–3's cross-checks.

If a browser tool is available, click the "Vetoes" button for the team in
the Versus tab and confirm the modal renders with the new rows. If no
browser tool is available in the environment, say so explicitly rather than
claiming the UI was verified — starting the dev server and confirming it
serves `200` is not the same as confirming the button renders correctly.

## Output / handoff

A verified `vetoData.ts` diff plus a one-line count of matches added per
team. Rebuilding `stats.json`/`stats_playoffs.json` is unrelated to this
skill (vetoes are a separate hardcoded data source, not part of the
Valolytics build pipeline) — don't run `scripts/build_json.py` as part of
this workflow.

---

## Common mistakes

| Mistake | Prevention |
|---|---|
| Trusting a single bulk `WebFetch` of the whole match-history table as complete | Cross-check the returned count against `stats.json`'s ground-truth series count (Step 0/1); re-query specific missing dates by name |
| Taking a fetch's stated series score at face value when it contradicts the per-map results it also reports | Re-fetch with an explicit "quote the raw score string, don't interpret" instruction |
| Writing `Ban 3`/`Ban 4` for a match where 4 maps were actually played | Cross-check map count from Step 0; relabel as `Pick 3`/`Pick 4` — see Step 3 table |
| Using a team's short tag in `vetoes` tuples when that team has no `VETO_DATA` entry of its own | Use the full display name instead — short tags are reserved for cross-referenceable teams (Step 4) |
| Adding `{TAG}_MATCHES` to `VETO_DATA` but forgetting `TEAM_TAGS_IN_VETOES` | Both edits are required; `getFirstBanPick` silently no-ops without the latter |
| Claiming the UI was verified after just checking the dev server returns 200 | That confirms the server is up, not that the button/modal render — say so explicitly if no browser tool is available |
