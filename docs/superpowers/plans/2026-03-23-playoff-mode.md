# Playoff Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two global navbar toggles ("Playoff-Teams" and "CL Data Only") that filter the dashboard to 4 playoff teams and optionally swap to a Challengers-only dataset.

**Architecture:** FilterContext manages two booleans (`playoffOnly`, `clDataOnly`) persisted in localStorage. StatsContext loads both `stats.json` and `stats_playoffs.json` on mount, then exposes filtered data and appropriate averages based on the active mode. No page components change — filtering happens at the context level.

**Tech Stack:** React, TypeScript, Vite, Python (pipeline), openpyxl

**Spec:** `docs/superpowers/specs/2026-03-23-playoff-mode-design.md`

---

## File Structure

### New files:
| File | Responsibility |
|------|---------------|
| `vcl-frontend/src/context/FilterContext.tsx` | FilterProvider + useFilter hook. Manages `playoffOnly` and `clDataOnly` booleans with localStorage persistence. |
| `vcl-frontend/public/data/stats_playoffs.json` | Playoff-only database (4 teams, 19 matches). Same schema as stats.json. |

### Modified files:
| File | Change |
|------|--------|
| `lib/constants.py` | Add `PLAYOFF_TEAMS` list and `PLAYOFF_MATCH_IDS` set |
| `scripts/build_json.py` | Add `--playoff` flag to filter teams and matches |
| `lib/match_parser.py` | Accept optional `match_ids` filter parameter |
| `vcl-frontend/src/App.tsx` | Wrap with FilterProvider |
| `vcl-frontend/src/context/StatsContext.tsx` | Load both datasets, filter data based on mode, manage averages |
| `vcl-frontend/src/components/Navbar.tsx` | Add two toggle buttons left of SearchBar |
| `vcl-frontend/src/pages/TeamOverview.tsx` | Auto-redirect when selected team not in filtered set |

---

## Task 1: Pipeline — Add playoff constants and `--playoff` flag

**Files:**
- Modify: `lib/constants.py:69-84`
- Modify: `lib/match_parser.py:18-101`
- Modify: `scripts/build_json.py:1-57`

- [ ] **Step 1: Add playoff constants to `lib/constants.py`**

Add after line 84 (after the `TEAMS` list closing bracket):

```python
PLAYOFF_TAGS = {'EP', 'MDR', 'MISA', 'UCAM'}

PLAYOFF_TEAMS = [t for t in TEAMS if t['tag'] in PLAYOFF_TAGS]

PLAYOFF_MATCH_IDS = {
    # MISA (4 maps, Mar 19-20)
    '5cadffcf-1f28-4e7e-9eaf-ed57375868b4',
    'ea6e413d-f95f-404d-a8f6-7da51c5befdf',
    '1c4f285c-f4e1-411a-94ae-48bdd9a50167',
    '0cafb898-666e-4980-a856-61772ca83ff4',
    # EP (5 maps, Mar 19-20)
    '22607544-de81-49bc-8f37-85c70f596d0b',
    '25d172f7-f241-41ad-bddd-dde81c56e5a1',
    '995243f6-943b-4ea3-98f0-2be7a292c796',
    '5e8c7871-73b1-4f22-ac3a-779f6682cd63',
    'a23565be-b405-40d6-8c9d-bdc7592ccbaf',
    # UCAM (4 maps, Mar 19-22)
    '8cb578c4-a675-45c7-8405-155b2b80da28',
    '9abce8ee-7847-4f91-abc3-17d68e077229',
    'c8d0a2ff-529e-4c34-ab6f-02535841d196',
    '1ac7f08d-1f04-4c5c-98ad-c1f5f3ec75d9',
    # MDR (6 maps, Mar 19-22)
    '45021724-cf69-4b1c-be00-e033ada8f9f4',
    '552d7ee1-e6b1-47fc-99b1-d421663f1253',
    'fe848444-9df2-4991-97d6-f88c2b06646d',
    '225163c0-ece4-4477-a611-327fb837230e',
    '47977248-3e6c-4721-a2a8-60fca030c393',
    '65177388-7b7f-4740-ad96-1d38a0309ac4',
}
```

- [ ] **Step 2: Add `match_ids` filter to `lib/match_parser.py`**

Change the function signature at line 18 from:

```python
def load_team_matches(team_tag, team_name, data_file):
```

to:

```python
def load_team_matches(team_tag, team_name, data_file, match_ids=None):
```

Then at line 98, change the filter logic from:

```python
        if not is_tech:
            matches.append(md)
```

to:

```python
        if not is_tech:
            if match_ids is None or md.match_id in match_ids:
                matches.append(md)
```

- [ ] **Step 3: Add `--playoff` flag to `scripts/build_json.py`**

Replace the entire `main()` function (lines 18-53) with:

```python
def main():
    parser = argparse.ArgumentParser(description='Build stats.json from JSONL match data')
    parser.add_argument('--output', default='public/data/stats.json',
                        help='Output path for stats.json')
    parser.add_argument('--playoff', action='store_true',
                        help='Build playoff-only database (4 teams, CL matches only)')
    args = parser.parse_args()

    if args.playoff:
        from lib.constants import PLAYOFF_TEAMS, PLAYOFF_MATCH_IDS
        teams_list = PLAYOFF_TEAMS
        match_filter = PLAYOFF_MATCH_IDS
        print("Building PLAYOFF stats.json (4 teams, CL matches only)...")
    else:
        teams_list = TEAMS
        match_filter = None
        print("Building stats.json from raw match data...")

    print(f"Processing {len(teams_list)} teams\n")

    all_team_data = {}
    for team_cfg in teams_list:
        data_file = team_cfg['data_file']
        if not os.path.exists(data_file):
            print(f"  WARNING: {data_file} not found, skipping {team_cfg['name']}")
            continue

        matches = load_team_matches(team_cfg['tag'], team_cfg['name'], data_file, match_ids=match_filter)
        stats = compute_team_stats(matches, team_cfg['tag'], team_cfg['name'])
        all_team_data[team_cfg['tag']] = {
            'name': team_cfg['name'],
            'tag': team_cfg['tag'],
            **stats,
        }

    result = build_stats_json(all_team_data)

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, 'w') as f:
        json.dump(result, f, indent=2)

    size_kb = os.path.getsize(args.output) / 1024
    print(f"\nWrote {args.output} ({size_kb:.0f} KB)")
    print(f"  {len(result['teams'])} teams")
    print(f"  {len(result['players'])} players")
    print(f"  {len(result['matches'])} matches")
    print(f"  {len(result['leaderboards'])} leaderboard categories")
```

- [ ] **Step 4: Rebuild stats.json (full league with new matches)**

Run:
```bash
python scripts/build_json.py --output vcl-frontend/public/data/stats.json
```
Expected: 14 teams, ~74+ players, ~370+ matches. Confirm output prints success.

- [ ] **Step 5: Build stats_playoffs.json**

Run:
```bash
python scripts/build_json.py --playoff --output vcl-frontend/public/data/stats_playoffs.json
```
Expected: 4 teams, ~20 players, 19 matches (some may be filtered as tech issues — check output). Confirm file is created.

- [ ] **Step 6: Commit**

```bash
git add lib/constants.py lib/match_parser.py scripts/build_json.py vcl-frontend/public/data/stats.json vcl-frontend/public/data/stats_playoffs.json
git commit -m "feat: add --playoff pipeline flag, rebuild stats.json, generate stats_playoffs.json"
```

---

## Task 2: FilterContext — Global state for mode toggles

**Files:**
- Create: `vcl-frontend/src/context/FilterContext.tsx`
- Modify: `vcl-frontend/src/App.tsx`

- [ ] **Step 1: Create `vcl-frontend/src/context/FilterContext.tsx`**

```typescript
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface FilterContextValue {
  playoffOnly: boolean
  clDataOnly: boolean
  setPlayoffOnly: (v: boolean) => void
  setClDataOnly: (v: boolean) => void
}

const FilterContext = createContext<FilterContextValue>({
  playoffOnly: false,
  clDataOnly: false,
  setPlayoffOnly: () => {},
  setClDataOnly: () => {},
})

export function FilterProvider({ children }: { children: ReactNode }) {
  const [playoffOnly, setPlayoffOnlyState] = useState(() => {
    try { return localStorage.getItem('vcl-playoff-mode') === 'true' } catch { return false }
  })
  const [clDataOnly, setClDataOnlyState] = useState(() => {
    try { return localStorage.getItem('vcl-cl-data-only') === 'true' } catch { return false }
  })

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem('vcl-playoff-mode', String(playoffOnly)) } catch { /* noop */ }
  }, [playoffOnly])

  useEffect(() => {
    try { localStorage.setItem('vcl-cl-data-only', String(clDataOnly)) } catch { /* noop */ }
  }, [clDataOnly])

  const setPlayoffOnly = (v: boolean) => {
    setPlayoffOnlyState(v)
    if (!v) setClDataOnlyState(false) // turning off Mode 1 auto-disables Mode 2
  }

  const setClDataOnly = (v: boolean) => {
    if (playoffOnly) setClDataOnlyState(v) // Mode 2 only works when Mode 1 is on
  }

  return (
    <FilterContext.Provider value={{ playoffOnly, clDataOnly, setPlayoffOnly, setClDataOnly }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  return useContext(FilterContext)
}
```

- [ ] **Step 2: Wrap App with FilterProvider in `vcl-frontend/src/App.tsx`**

Add import at top:
```typescript
import { FilterProvider } from './context/FilterContext'
```

Wrap `FilterProvider` around `StatsProvider` in the App component (line 44-45). Change from:

```tsx
      <ThemeProvider>
        <StatsProvider>
```

to:

```tsx
      <ThemeProvider>
        <FilterProvider>
          <StatsProvider>
```

And update the closing tags (lines 49-50) from:

```tsx
        </StatsProvider>
      </ThemeProvider>
```

to:

```tsx
          </StatsProvider>
        </FilterProvider>
      </ThemeProvider>
```

- [ ] **Step 3: Verify the app still compiles**

Run:
```bash
cd vcl-frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add vcl-frontend/src/context/FilterContext.tsx vcl-frontend/src/App.tsx
git commit -m "feat: add FilterContext with playoffOnly and clDataOnly state"
```

---

## Task 3: StatsContext — Load both datasets, filter based on mode

**Files:**
- Modify: `vcl-frontend/src/context/StatsContext.tsx`

- [ ] **Step 1: Update StatsContext to load both datasets and apply filtering**

Replace the entire file `vcl-frontend/src/context/StatsContext.tsx` with the following. Key changes: (a) loads both JSON files, (b) reads filter state, (c) exposes filtered data + correct averages.

```typescript
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useFilter } from './FilterContext'
import type { StatsData, TournamentAverages } from '../types'

interface StatsContextValue {
  data: StatsData | null
  averages: TournamentAverages | null
  loading: boolean
  error: string | null
}

const StatsContext = createContext<StatsContextValue>({
  data: null,
  averages: null,
  loading: true,
  error: null,
})

export function useStats() {
  return useContext(StatsContext)
}

function meanStd(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 }
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return { mean, std: Math.sqrt(variance) }
}

const STAT_KEYS = [
  'rW_pct', 'atk_rW_pct', 'def_rW_pct',
  'pistol_rW_pct', 'pistol_atk_rW_pct', 'pistol_def_rW_pct',
  'gun_rW_pct', 'gun_atk_rW_pct', 'gun_def_rW_pct',
  'antieco_rW_pct', 'antieco_atk_rW_pct', 'antieco_def_rW_pct',
  'eco_rW_pct', 'eco_atk_rW_pct', 'eco_def_rW_pct',
  'post_rW_pct', 'post_per_map', 'post_rW_event_avg',
  'ret_rW_pct', 'ret_per_map', 'ret_rW_event_avg',
]

const PLAYER_STAT_KEYS = ['acs_split', 'kd', 'kad', 'kast', 'fk_pct', 'fd_pct', 'clutch_pct', 'awp_pct']

function computeAverages(data: StatsData): TournamentAverages {
  const team: Record<string, { mean: number; std: number }> = {}
  for (const key of STAT_KEYS) {
    const values = data.teams
      .map(t => (t.allMaps as any)[key])
      .filter((v: any): v is number => v != null && !isNaN(v))
    team[key] = meanStd(values)
  }

  const allMapNames = new Set<string>()
  for (const t of data.teams) for (const m of t.maps) allMapNames.add(m.map)

  const perMap: Record<string, Record<string, { mean: number; std: number }>> = {}
  for (const mapName of allMapNames) {
    perMap[mapName] = {}
    for (const key of STAT_KEYS) {
      const values = data.teams
        .map(t => t.maps.find(m => m.map === mapName))
        .filter(Boolean)
        .map(m => (m as any)[key])
        .filter((v: any): v is number => v != null && !isNaN(v))
      perMap[mapName][key] = meanStd(values)
    }
  }

  const xvySums: Record<string, { total: number; count: number }> = {}
  for (const t of data.teams) {
    for (const entry of t.xvy) {
      if (!xvySums[entry.situation]) xvySums[entry.situation] = { total: 0, count: 0 }
      xvySums[entry.situation].total += entry.win_pct
      xvySums[entry.situation].count += 1
    }
  }
  const xvy: Record<string, number> = {}
  for (const [sit, { total, count }] of Object.entries(xvySums)) {
    xvy[sit] = total / count
  }

  const player: Record<string, { mean: number; std: number }> = {}
  const qualifiedPlayers = data.players.filter(p => p.rounds >= 100)
  for (const key of PLAYER_STAT_KEYS) {
    const values = qualifiedPlayers
      .map(p => (p as any)[key])
      .filter((v: any): v is number => v != null && !isNaN(v))
    player[key] = meanStd(values)
  }

  const siteAvgs: Record<string, { mean: number; std: number }> = {}
  for (const mode of ['post', 'ret'] as const) {
    const siteKey = mode === 'post' ? 'post_by_site' : 'ret_by_site'
    const allSites = new Set<string>()
    for (const t of data.teams) {
      const bs = (t.allMaps as any)[siteKey]
      if (bs) Object.keys(bs).forEach(s => { if (s !== '?') allSites.add(s) })
    }
    for (const site of allSites) {
      const values = data.teams
        .map(t => (t.allMaps as any)[siteKey]?.[site]?.pct)
        .filter((v: any): v is number => v != null && !isNaN(v))
      siteAvgs[`${mode}_${site}`] = meanStd(values)
    }
  }

  const perMapSiteAvgs: Record<string, Record<string, { mean: number; std: number }>> = {}
  for (const mapName of allMapNames) {
    perMapSiteAvgs[mapName] = {}
    for (const mode of ['post', 'ret'] as const) {
      const siteKey = mode === 'post' ? 'post_by_site' : 'ret_by_site'
      const allSites = new Set<string>()
      for (const t of data.teams) {
        const m = t.maps.find(m => m.map === mapName)
        const bs = m ? (m as any)[siteKey] : null
        if (bs) Object.keys(bs).forEach(s => { if (s !== '?') allSites.add(s) })
      }
      for (const site of allSites) {
        const values = data.teams
          .map(t => {
            const m = t.maps.find(m => m.map === mapName)
            return m ? (m as any)[siteKey]?.[site]?.pct : undefined
          })
          .filter((v: any): v is number => v != null && !isNaN(v))
        perMapSiteAvgs[mapName][`${mode}_${site}`] = meanStd(values)
      }
    }
  }

  return { team, perMap, xvy, player, siteAvgs, perMapSiteAvgs }
}

const PLAYOFF_TAGS = new Set(['EP', 'MDR', 'MISA', 'UCAM'])

function filterPlayoffData(data: StatsData): StatsData {
  const teams = data.teams.filter(t => PLAYOFF_TAGS.has(t.tag))
  const teamNames = new Set(teams.map(t => t.name))
  const players = data.players.filter(p => teamNames.has(p.team))
  const playersByRole = data.players_by_role.filter(p => teamNames.has(p.team))
  const playersByAgent = data.players_by_agent.filter(p => teamNames.has(p.team))
  const matches = data.matches.filter(m => teamNames.has(m.team1) || teamNames.has(m.team2))
  const agentStats = data.agent_stats.filter(a => teamNames.has(a.team))

  // Recompute leaderboards from filtered players
  const leaderboards: typeof data.leaderboards = {}
  for (const [key, lb] of Object.entries(data.leaderboards)) {
    const filtered = lb.entries.filter(e => teamNames.has(e.team))
    // Re-rank
    const sorted = [...filtered].sort((a, b) => b.value - a.value)
    const reranked = sorted.map((e, i) => ({ ...e, rank: i + 1 }))
    const values = sorted.map(e => e.value)
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    leaderboards[key] = { entries: reranked, tournament_avg: avg }
  }

  return {
    teams,
    players,
    players_by_role: playersByRole,
    players_by_agent: playersByAgent,
    matches,
    leaderboards,
    agent_stats: agentStats,
    ability_names: data.ability_names,
  }
}

export function StatsProvider({ children }: { children: ReactNode }) {
  const { playoffOnly, clDataOnly } = useFilter()
  const [fullData, setFullData] = useState<StatsData | null>(null)
  const [playoffData, setPlayoffData] = useState<StatsData | null>(null)
  const [fullAverages, setFullAverages] = useState<TournamentAverages | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load both datasets on mount
  useEffect(() => {
    Promise.all([
      fetch('./data/stats.json').then(r => {
        if (!r.ok) throw new Error(`Failed to load stats.json: ${r.status}`)
        return r.json()
      }),
      fetch('./data/stats_playoffs.json')
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ])
      .then(([full, playoff]: [StatsData, StatsData | null]) => {
        setFullData(full)
        setPlayoffData(playoff)
        setFullAverages(computeAverages(full))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Compute active data + averages based on filter mode
  const { data, averages } = useMemo(() => {
    if (!fullData || !fullAverages) return { data: null, averages: null }

    if (clDataOnly && playoffData) {
      // Mode 2: use playoff dataset entirely, with its own averages
      return { data: playoffData, averages: computeAverages(playoffData) }
    }

    if (playoffOnly) {
      // Mode 1: filter full data to 4 teams, keep full-league averages
      return { data: filterPlayoffData(fullData), averages: fullAverages }
    }

    // Default: full data, full averages
    return { data: fullData, averages: fullAverages }
  }, [fullData, playoffData, fullAverages, playoffOnly, clDataOnly])

  return (
    <StatsContext.Provider value={{ data, averages, loading, error }}>
      {children}
    </StatsContext.Provider>
  )
}
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd vcl-frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add vcl-frontend/src/context/StatsContext.tsx
git commit -m "feat: StatsContext loads both datasets, filters by playoff mode"
```

---

## Task 4: Navbar — Add toggle buttons

**Files:**
- Modify: `vcl-frontend/src/components/Navbar.tsx`

- [ ] **Step 1: Add the two toggle buttons to `Navbar.tsx`**

Add import at top (after existing imports):
```typescript
import { useFilter } from '../context/FilterContext'
```

Inside the `Navbar` function, after line 11 (`const hoverTimeout = ...`), add:
```typescript
  const { playoffOnly, clDataOnly, setPlayoffOnly, setClDataOnly } = useFilter()
```

Replace the right-side div (lines 97-108) from:
```tsx
      <div className="flex items-center gap-3">
        <SearchBar />
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-dim hover:text-on-surface hover:bg-white/5 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="material-symbols-outlined text-lg">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>
```

to:
```tsx
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPlayoffOnly(!playoffOnly)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors ${
            playoffOnly
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'text-text-dim hover:text-text hover:bg-white/5'
          }`}
          title="Show only playoff teams"
        >
          Playoff-Teams
        </button>
        <button
          onClick={() => setClDataOnly(!clDataOnly)}
          disabled={!playoffOnly}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors ${
            clDataOnly
              ? 'bg-primary/20 text-primary border border-primary/30'
              : playoffOnly
                ? 'text-text-dim hover:text-text hover:bg-white/5'
                : 'text-text-dim/30 cursor-not-allowed'
          }`}
          title={playoffOnly ? 'Show only Challengers playoff data' : 'Enable Playoff-Teams first'}
        >
          CL Data Only
        </button>
        <SearchBar />
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-dim hover:text-on-surface hover:bg-white/5 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="material-symbols-outlined text-lg">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd vcl-frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add vcl-frontend/src/components/Navbar.tsx
git commit -m "feat: add Playoff-Teams and CL Data Only toggles to navbar"
```

---

## Task 5: TeamOverview — Auto-redirect for non-playoff teams

**Files:**
- Modify: `vcl-frontend/src/pages/TeamOverview.tsx:21-35`

- [ ] **Step 1: Add redirect logic**

Add import at top of file:
```typescript
import { useNavigate } from 'react-router-dom'
import { useFilter } from '../context/FilterContext'
```

Update the existing import from `react-router-dom` (line 2) to include `useNavigate`:
```typescript
import { useParams, Link, useNavigate } from 'react-router-dom'
```

Inside the `TeamOverview` function, after line 23 (`const { data, averages } = useStats()`), add:
```typescript
  const navigate = useNavigate()
```

Since `data.teams` is already filtered by StatsContext, when `playoffOnly` is on and the URL has a non-playoff team, `team` will be `undefined`. We replace the "Team not found" guard at line 35 to auto-redirect instead. Change from:

```tsx
  if (!team) return <div className="p-8 text-error">Team not found: {teamName}</div>
```

to:

```tsx
  useEffect(() => {
    if (data && !data.teams.find(t => t.name === teamName)) {
      const first = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))[0]
      if (first) navigate(`/team/${encodeURIComponent(first.name)}`, { replace: true })
    }
  }, [data, teamName, navigate])

  if (!team) return null
```

This uses `useEffect` for the redirect (avoiding React render-phase warnings) and returns `null` while the redirect happens. The existing "Team not found" error is replaced since that case now auto-redirects. Note: `useEffect` import already exists on line 1.

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd vcl-frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add vcl-frontend/src/pages/TeamOverview.tsx
git commit -m "feat: auto-redirect to first available team when current team filtered out"
```

---

## Task 6: Build verification and production build

- [ ] **Step 1: Verify TypeScript compiles clean**

Run:
```bash
cd vcl-frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 2: Run production build**

Run:
```bash
cd vcl-frontend && npm run build
```
Expected: build succeeds with no errors. This is what GitHub Actions runs.

- [ ] **Step 3: Manual testing checklist**

Start dev server: `cd vcl-frontend && npm run dev`

Test the following in the browser at http://localhost:5173/:

1. Default state: both toggles off, all 14 teams visible, full leaderboard
2. Toggle "Playoff-Teams" ON:
   - Teams tab: only EP, MDR, MISA, UCAM selectable
   - Leaderboards: only players from those 4 teams
   - Versus: only those 4 teams in dropdowns
   - Averages/colors unchanged from full league
3. Toggle "CL Data Only" ON (while Playoff-Teams on):
   - Data changes to playoff matches only (19 maps)
   - Player stats reflect CL data only
   - Leaderboard values change
4. Toggle "Playoff-Teams" OFF: both toggles reset, full data restored
5. Try clicking "CL Data Only" while "Playoff-Teams" is off: button should be disabled/unclickable

- [ ] **Step 4: Final commit with any fixes**

If any TypeScript or build issues were found and fixed, commit them:
```bash
git add -A
git commit -m "fix: resolve build issues from playoff mode integration"
```
