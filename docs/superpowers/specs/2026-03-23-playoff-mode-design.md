# Playoff Mode — Design Spec

**Date:** 2026-03-23
**Version:** 0.9.0

## Overview

Add two global toggles to the navbar that filter the dashboard to the 4 remaining playoff teams (EP, MDR, MISA, UCAM) and optionally restrict data to only Challengers playoff matches.

## Constraints

- **No design changes** — existing pages, components, and styling remain untouched. Only the navbar gets the two new toggle buttons.
- **No modifications to the original database** — the existing `stats.json` is rebuilt with the 19 new playoff matches included (already appended to raw JSONL files), but its structure and pipeline are unchanged.
- **Color scales remain unchanged** — no changes to StatCell, percentileToColor, or any color functions.

## Modes

### Mode 1: "Playoff-Teams" (ON/OFF)

Client-side filter on the existing `stats.json`. When active:

- **Teams tab:** dropdown shows only EP, MDR, MISA, UCAM. If current team is outside this set, auto-redirect to first playoff team alphabetically (Enterprise Esports).
- **Leaderboards:** only players from the 4 playoff teams appear. Percentile rankings recomputed within this filtered pool. Tournament averages recomputed for 4 teams only.
- **Versus:** Team dropdowns restricted to 4 teams. Player dropdowns restricted to players on those 4 teams.
- **History/Matches:** filtered to matches involving at least one playoff team.
- **Averages:** unchanged — still computed from the full 14-team league. Color scales stay the same.

### Mode 2: "CL Data Only" (ON/OFF, requires Mode 1)

Swaps the data source from `stats.json` to `stats_playoffs.json` — a separate database built from only the 19 Challengers playoff matches (Mar 19–22, 2026). When active:

- All pages show stats computed exclusively from playoff match data.
- Same filtering as Mode 1 (4 teams only) since the data only contains those teams.
- Averages computed from playoff data only.

**Dependency:** Mode 2 is disabled/grayed out when Mode 1 is off. Turning off Mode 1 auto-deactivates Mode 2.

## Data Layer

### Rebuild stats.json

Run existing pipeline with no changes:
```
python scripts/build_json.py --output vcl-frontend/public/data/stats.json
```
This picks up the 19 new matches already appended to the JSONL files.

### New: stats_playoffs.json

Build a playoff-only database from a subset of match data:

- **Approach:** Add a `--playoff` flag (or separate config) to `build_json.py` that filters to only the 19 playoff match IDs and only the 4 playoff teams.
- **Output:** `vcl-frontend/public/data/stats_playoffs.json`
- **Structure:** Identical to `stats.json` (same TypeScript types) but containing only 4 teams, their players, 19 matches, and recomputed leaderboards/averages.

### Match ID list for playoff data

```
# MISA (4 matches)
5cadffcf-1f28-4e7e-9eaf-ed57375868b4
ea6e413d-f95f-404d-a8f6-7da51c5befdf
1c4f285c-f4e1-411a-94ae-48bdd9a50167
0cafb898-666e-4980-a856-61772ca83ff4

# EP (5 matches)
22607544-de81-49bc-8f37-85c70f596d0b
25d172f7-f241-41ad-bddd-dde81c56e5a1
995243f6-943b-4ea3-98f0-2be7a292c796
5e8c7871-73b1-4f22-ac3a-779f6682cd63
a23565be-b405-40d6-8c9d-bdc7592ccbaf

# UCAM (4 matches)
8cb578c4-a675-45c7-8405-155b2b80da28
9abce8ee-7847-4f91-abc3-17d68e077229
c8d0a2ff-529e-4c34-ab6f-02535841d196
1ac7f08d-1f04-4c5c-98ad-c1f5f3ec75d9

# MDR (6 matches)
45021724-cf69-4b1c-be00-e033ada8f9f4
552d7ee1-e6b1-47fc-99b1-d421663f1253
fe848444-9df2-4991-97d6-f88c2b06646d
225163c0-ece4-4477-a611-327fb837230e
47977248-3e6c-4721-a2a8-60fca030c393
65177388-7b7f-4740-ad96-1d38a0309ac4
```

## UI Changes

### Navbar (only change)

Two pill-style toggles added to the right side of the navbar, positioned **left of the search bar**:

```
[Teams] [Leaderboards v] [Versus] [History]     [Playoff-Teams] [CL Data Only] [Search...] [theme]
```

- **"Playoff-Teams"** — toggle button. Active state: highlighted (primary color). Inactive: muted.
- **"CL Data Only"** — toggle button. Disabled (grayed out, not clickable) when Playoff-Teams is off. When Playoff-Teams is on: clickable, same active/inactive styling.
- Style consistent with existing navbar elements (same font, padding, border-radius as the theme toggle).

## State Management

### New: FilterContext

```typescript
interface FilterState {
  playoffOnly: boolean
  clDataOnly: boolean
  setPlayoffOnly: (v: boolean) => void
  setClDataOnly: (v: boolean) => void
}
```

- Wraps the app alongside StatsContext and ThemeContext.
- Persisted in localStorage: `vcl-playoff-mode`, `vcl-cl-data-only`.
- When `playoffOnly` set to false, `clDataOnly` auto-set to false.

### StatsContext Changes

- Loads both `stats.json` and `stats_playoffs.json` on mount.
- Reads `clDataOnly` from FilterContext to decide which dataset is active.
- When `playoffOnly` is on (but `clDataOnly` off): uses `stats.json` but exposes filtered data (4 teams only). Averages remain from full 14-team league.
- When `clDataOnly` is on: uses `stats_playoffs.json` directly.
- Exposes same `{ data, averages }` shape — consuming components don't need changes.

### Average Recomputation

When Mode 1 is active (filtering stats.json to 4 teams):
- Averages stay the same — still computed from the full 14-team `stats.json`.
- Only the exposed `data` (teams, players, matches) is filtered for visibility.

When Mode 2 is active:
- `stats_playoffs.json` already contains only playoff data.
- `computeAverages()` runs on that dataset naturally.

## Pages — No Code Changes Needed (if filtering in context)

If StatsContext exposes pre-filtered `data` and recomputed `averages` based on the active mode, **no page components need modification** except:

- **TeamSelector.tsx:** The dropdown already reads `data.teams` — if filtered at context level, it auto-restricts.
- **TeamOverview.tsx:** Auto-redirect if current team not in filtered set (small addition to existing fallback logic).
- **Versus.tsx:** Dropdowns read from `data.teams` and `data.players` — auto-restricted.
- **Leaderboards.tsx:** Reads `data.players` — auto-restricted. Percentiles recomputed from filtered set.

## Files to Create/Modify

### New files:
- `vcl-frontend/src/context/FilterContext.tsx` — FilterProvider, useFilter hook
- `vcl-frontend/public/data/stats_playoffs.json` — playoff-only database

### Modified files:
- `vcl-frontend/src/components/Navbar.tsx` — add two toggle buttons
- `vcl-frontend/src/context/StatsContext.tsx` — load both datasets, filter based on mode
- `vcl-frontend/src/App.tsx` — wrap with FilterProvider
- `vcl-frontend/src/pages/TeamOverview.tsx` — auto-redirect fallback for non-playoff team
- `scripts/build_json.py` — add `--playoff` flag for building stats_playoffs.json
- `lib/constants.py` — add PLAYOFF_TEAMS list and PLAYOFF_MATCH_IDS set

### Unchanged:
- All page designs, component styling, color scales
- stats.json structure and pipeline logic
- All other components (StatCell, FormStrip, XvYMatrix, etc.)
