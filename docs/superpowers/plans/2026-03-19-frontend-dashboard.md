# VCL Broadcast Stats Dashboard — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React dashboard that loads `public/data/stats.json` and presents VCL EMEA 2026 team/player stats in a dense, dark-themed broadcast analyst tool across 5 pages.

**Architecture:** Static React SPA with no backend. Data loaded once via React Context. Five route-based pages (Team Overview, Player Profile, Leaderboards, Versus, Match History) sharing a persistent top nav bar with global search. All styling via Tailwind CSS with custom design tokens.

**Tech Stack:** React 19 + Vite, React Router v6, Tailwind CSS v4, Jost + Overpass Mono fonts, React Context for state.

**Key references:**
- Design spec: `docs/superpowers/specs/2026-03-19-frontend-dashboard-design.md`
- PRD: `PRD.md`
- Data: `public/data/stats.json` (712 KB — 14 teams, 78 players, 372 matches, 11 leaderboards)
- Visual reference: `VCLStats.png` (Excel screenshot showing target layout)
- Agent icons: `data/icons/*.png` (28 files, copy to `public/icons/`)

**Design decisions (deviations from PRD):**
- Agent icons use local PNGs instead of PRD's remote URLs (`valorantstats.xyz`). Rationale: no runtime API calls, faster loading, works offline. User-approved during design spec review.
- Uses `HashRouter` instead of `BrowserRouter` since GitHub Pages doesn't support server-side routing. URLs will be `/#/team/...` format.
- Match History expanded row derives "starting side" from half-time data (team1 = attack first half in Valorant) since no explicit `starting_side` field exists in match data.

---

## File Structure

```
vcl-frontend/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  public/
    data/stats.json          (copied from repo root public/data/)
    icons/*.png              (copied from data/icons/)
  src/
    main.tsx                 Entry point, mounts App
    App.tsx                  Router setup, StatsProvider wrapper
    index.css                Tailwind directives, @font-face, global styles
    types.ts                 TypeScript interfaces for Team, Player, Match, etc.
    context/
      StatsContext.tsx        Load stats.json, compute tournament averages, provide via context
    components/
      Navbar.tsx             Top nav bar: logo, page tabs, search bar
      SearchBar.tsx          Global search across teams + players, keyboard navigable
      AgentIcon.tsx          Agent PNG renderer (handles KAY/O → KAYO, fallback to text)
      StatCell.tsx           Heat-mapped percentage cell (red/neutral/green vs tournament avg)
      FormStrip.tsx          Last 5 results as colored squares with tooltips
      TeamSelector.tsx       Dropdown to pick a team (used on Team Overview)
      PlayerSelector.tsx     Dropdown to pick a player (used on Player Profile, Versus)
      XvYMatrix.tsx          5x5 XvY grid component (used on Team Overview + Versus)
    pages/
      TeamOverview.tsx       Main dashboard — map stats, post plant, player stats, XvY, talking points
      PlayerProfile.tsx      Player stat cards + agent pool + clutch breakdown
      Leaderboards.tsx       Tab bar + ranked tables with team filter
      Versus.tsx             Team vs Team + Player vs Player comparison tabs
      MatchHistory.tsx       Chronological match log per team
    utils/
      colors.ts              Heat-map color interpolation (value + average → bg color)
      format.ts              formatPct, formatRatio, formatCount helpers
      talkingPoints.ts       Rule-based insight generator for Team Overview
      xvy.ts                 Parse "3v2" situation strings into matrix positions
```

---

## Task 1: Project Scaffolding + Vite Setup

**Files:**
- Create: `vcl-frontend/package.json`
- Create: `vcl-frontend/vite.config.ts`
- Create: `vcl-frontend/tsconfig.json`, `vcl-frontend/tsconfig.app.json`, `vcl-frontend/tsconfig.node.json`
- Create: `vcl-frontend/index.html`
- Create: `vcl-frontend/src/main.tsx`
- Create: `vcl-frontend/src/App.tsx` (placeholder)
- Create: `vcl-frontend/src/index.css`
- Copy: `data/icons/*.png` → `vcl-frontend/public/icons/`
- Copy: `public/data/stats.json` → `vcl-frontend/public/data/stats.json`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd C:/Users/Vincent/Claude/VLR
npm create vite@latest vcl-frontend -- --template react-ts
cd vcl-frontend
```

- [ ] **Step 2: Install dependencies**

```bash
cd C:/Users/Vincent/Claude/VLR/vcl-frontend
npm install react-router-dom@6
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configure Vite with Tailwind and GitHub Pages base path**

Write `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
})
```

- [ ] **Step 4: Set up Tailwind in index.css**

Replace `src/index.css` with:
```css
@import "tailwindcss";

@theme {
  --color-surface: #0a0a0f;
  --color-nav: #12121a;
  --color-card: #1a1a28;
  --color-border: #1e1e2e;
  --color-text: #dddddd;
  --color-text-muted: #888888;
  --color-text-dim: #555555;
  --color-primary: #C800DF;
  --color-secondary: #E60076;
  --color-success: #16A34A;
  --color-danger: #DC2626;

  --font-sans: 'Jost', sans-serif;
  --font-mono: 'Overpass Mono', monospace;
}

body {
  background-color: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-sans);
  margin: 0;
}
```

- [ ] **Step 5: Set up index.html with Google Fonts**

Write `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VCL Stats Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=Overpass+Mono:wght@400;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Write placeholder App.tsx and main.tsx**

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx`:
```tsx
export default function App() {
  return <div className="min-h-screen bg-surface text-text">VCL Stats Dashboard</div>
}
```

- [ ] **Step 7: Copy static assets**

```bash
mkdir -p vcl-frontend/public/icons vcl-frontend/public/data
cp data/icons/*.png vcl-frontend/public/icons/
cp public/data/stats.json vcl-frontend/public/data/stats.json
```

- [ ] **Step 8: Clean up Vite scaffolding**

Delete default Vite files that we don't need:
```bash
cd vcl-frontend
rm -f src/App.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 9: Verify dev server starts**

```bash
cd C:/Users/Vincent/Claude/VLR/vcl-frontend
npm run dev
```

Expected: Dev server starts, browser shows "VCL Stats Dashboard" on dark background at `http://localhost:5173`.

- [ ] **Step 10: Commit**

```bash
git add vcl-frontend/
git commit -m "feat: scaffold Vite + React + Tailwind project with design tokens and static assets"
```

---

## Task 2: TypeScript Types + Data Context

**Files:**
- Create: `vcl-frontend/src/types.ts`
- Create: `vcl-frontend/src/context/StatsContext.tsx`
- Modify: `vcl-frontend/src/App.tsx`

- [ ] **Step 1: Define TypeScript interfaces**

Create `src/types.ts` with all data model types matching stats.json:

```ts
export interface MapStats {
  map: string
  comp: string[]
  plays: number
  wins: number
  losses: number
  rW_pct: number
  atk_rW_pct: number
  def_rW_pct: number
  pistol_rW_pct: number
  pistol_atk_rW_pct: number
  pistol_def_rW_pct: number
  gun_rW_pct: number
  gun_atk_rW_pct: number
  gun_def_rW_pct: number
  antieco_rW_pct: number
  antieco_atk_rW_pct: number
  antieco_def_rW_pct: number
  eco_rW_pct: number
  eco_atk_rW_pct: number
  eco_def_rW_pct: number
  post_scens: number
  post_per_map: number
  post_rW_pct: number
  post_rW_event_avg: number
  post_rank: number
  ret_scens: number
  ret_per_map: number
  ret_rW_pct: number
  ret_rW_event_avg: number
  ret_rank: number
}

export interface XvYEntry {
  situation: string
  wins: number
  losses: number
  win_pct: number
}

export interface FormEntry {
  opponent: string
  map: string
  score: string
  result: 'W' | 'L'
}

export interface Team {
  name: string
  tag: string
  maps: MapStats[]
  allMaps: MapStats
  players: string[]
  xvy: XvYEntry[]
  series_record: { wins: number; losses: number }
  form: FormEntry[]
}

export interface AgentPick {
  agent: string
  picks: number
  matches: number
  pct: number
}

export interface Player {
  ign: string
  team: string
  acs_split: number
  acs_year: number
  rounds: number
  kills: number
  deaths: number
  assists: number
  fk: number
  fd: number
  kd: number
  kad: number
  first_pct: number
  fk_pct: number
  fd_pct: number
  first_conversion: number
  clutch_scens: number
  clutches: number
  clutch_pct: number
  kast: number
  awp_pct: number
  agents: AgentPick[]
}

export interface Match {
  match_id: string
  series_id: string
  event: string
  map: string
  team1: string
  team2: string
  team1_agents: string[]
  team2_agents: string[]
  team1_score: number
  team2_score: number
  team1_score_at_half: number
  team2_score_at_half: number
  team1_atk_pistol_wins: number
  team1_def_pistol_wins: number
  team2_atk_pistol_wins: number
  team2_def_pistol_wins: number
  team1_atk_wins: number
  team1_atk_losses: number
  team1_def_wins: number
  team1_def_losses: number
  winner: string
  date: string
}

export interface LeaderboardEntry {
  rank: number
  ign: string
  team: string
  value: number
  rounds: number
}

export interface Leaderboard {
  entries: LeaderboardEntry[]
  tournament_avg: number
}

export interface StatsData {
  teams: Team[]
  players: Player[]
  matches: Match[]
  leaderboards: Record<string, Leaderboard>
}

export interface TournamentAverages {
  // Per-stat mean + stddev across all teams' allMaps
  team: Record<string, { mean: number; std: number }>
  // Per-map per-stat averages
  perMap: Record<string, Record<string, { mean: number; std: number }>>
  // XvY averages per situation
  xvy: Record<string, number>
  // Player stat averages (for heat-mapping player tables)
  player: Record<string, { mean: number; std: number }>
}
```

- [ ] **Step 2: Create StatsContext**

Create `src/context/StatsContext.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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
  // Team-level averages from allMaps
  const team: Record<string, { mean: number; std: number }> = {}
  for (const key of STAT_KEYS) {
    const values = data.teams
      .map(t => (t.allMaps as any)[key])
      .filter((v: any): v is number => v != null && !isNaN(v))
    team[key] = meanStd(values)
  }

  // Per-map averages
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

  // XvY averages
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

  // Player stat averages (min 100 rounds)
  const player: Record<string, { mean: number; std: number }> = {}
  const qualifiedPlayers = data.players.filter(p => p.rounds >= 100)
  for (const key of PLAYER_STAT_KEYS) {
    const values = qualifiedPlayers
      .map(p => (p as any)[key])
      .filter((v: any): v is number => v != null && !isNaN(v))
    player[key] = meanStd(values)
  }

  return { team, perMap, xvy, player }
}

export function StatsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StatsData | null>(null)
  const [averages, setAverages] = useState<TournamentAverages | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('./data/stats.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load stats.json: ${res.status}`)
        return res.json()
      })
      .then((json: StatsData) => {
        setData(json)
        setAverages(computeAverages(json))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <StatsContext.Provider value={{ data, averages, loading, error }}>
      {children}
    </StatsContext.Provider>
  )
}
```

- [ ] **Step 3: Wire context into App.tsx**

Update `src/App.tsx`:
```tsx
import { StatsProvider, useStats } from './context/StatsContext'

function Dashboard() {
  const { data, loading, error } = useStats()
  if (loading) return <div className="p-8 text-text-muted">Loading stats...</div>
  if (error) return <div className="p-8 text-danger">Error: {error}</div>
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">VCL Stats Dashboard</h1>
      <p className="text-text-muted mt-2">
        Loaded {data!.teams.length} teams, {data!.players.length} players, {data!.matches.length} matches
      </p>
    </div>
  )
}

export default function App() {
  return (
    <StatsProvider>
      <div className="min-h-screen bg-surface text-text">
        <Dashboard />
      </div>
    </StatsProvider>
  )
}
```

- [ ] **Step 4: Verify data loads in browser**

```bash
cd C:/Users/Vincent/Claude/VLR/vcl-frontend && npm run dev
```

Expected: Page shows "Loaded 14 teams, 78 players, 372 matches".

- [ ] **Step 5: Commit**

```bash
git add vcl-frontend/src/types.ts vcl-frontend/src/context/StatsContext.tsx vcl-frontend/src/App.tsx
git commit -m "feat: add TypeScript types and StatsContext with tournament averages"
```

---

## Task 3: Utility Functions

**Files:**
- Create: `vcl-frontend/src/utils/colors.ts`
- Create: `vcl-frontend/src/utils/format.ts`
- Create: `vcl-frontend/src/utils/xvy.ts`

- [ ] **Step 1: Create heat-map color utility**

Create `src/utils/colors.ts`:

```ts
/**
 * Returns a CSS background-color string for a stat cell based on how its value
 * compares to the tournament average, using standard deviations.
 *
 * Scale: red (below avg) → neutral (at avg) → green (above avg)
 */
export function heatColor(value: number, mean: number, std: number, invert = false): string {
  if (std === 0 || isNaN(value)) return 'transparent'

  let z = (value - mean) / std
  z = Math.max(-2, Math.min(2, z)) // clamp to ±2 std devs

  if (invert) z = -z

  if (z > 0) {
    // Green scale
    const t = z / 2
    const r = Math.round(42 + t * 48)
    const g = Math.round(90 + t * 48)
    const b = Math.round(42)
    return `rgb(${r}, ${g}, ${b})`
  } else if (z < 0) {
    // Red scale
    const t = Math.abs(z) / 2
    const r = Math.round(90 + t * 16)
    const g = Math.round(48 - t * 16)
    const b = Math.round(48 - t * 16)
    return `rgb(${r}, ${g}, ${b})`
  }
  return '#4a4020' // neutral
}

/** Simple green/red for delta values */
export function deltaColor(value: number): string {
  if (value > 0.01) return 'rgb(90, 138, 42)' // green
  if (value < -0.01) return 'rgb(106, 32, 32)' // red
  return '#4a4020'
}
```

- [ ] **Step 2: Create formatting helpers**

Create `src/utils/format.ts`:

```ts
/** Format a decimal as percentage: 0.547 → "54.7%" */
export function formatPct(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '-'
  return `${(value * 100).toFixed(1)}%`
}

/** Format a ratio to 2 decimal places: 1.278 → "1.28" */
export function formatRatio(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '-'
  return value.toFixed(2)
}

/** Format a count (integer): 641 → "641" */
export function formatCount(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '-'
  return String(Math.round(value))
}

/** Format percentage already in 0-100 range: 61.2 → "61.2%" */
export function formatPctRaw(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '-'
  return `${value.toFixed(1)}%`
}

/** Format delta: +5.3% or -2.1% */
export function formatDelta(value: number): string {
  if (value > 0) return `+${(value * 100).toFixed(1)}%`
  return `${(value * 100).toFixed(1)}%`
}
```

- [ ] **Step 3: Create XvY matrix parser**

Create `src/utils/xvy.ts`:

```ts
import type { XvYEntry } from '../types'

/** Parse "3v2" → { team: 3, opp: 2 } */
export function parseSituation(situation: string): { team: number; opp: number } | null {
  const match = situation.match(/^(\d)v(\d)$/)
  if (!match) return null
  return { team: parseInt(match[1]), opp: parseInt(match[2]) }
}

/**
 * Build a 5x5 matrix from flat XvY array.
 * Rows = team alive (5 down to 1), Cols = opponent alive (5 down to 1).
 * Returns matrix[rowIndex][colIndex] = win_pct (or null if no data).
 */
export function buildXvYMatrix(entries: XvYEntry[]): (number | null)[][] {
  const matrix: (number | null)[][] = Array.from({ length: 5 }, () => Array(5).fill(null))

  for (const entry of entries) {
    const parsed = parseSituation(entry.situation)
    if (!parsed) continue
    const row = 5 - parsed.team // 5 → row 0, 1 → row 4
    const col = 5 - parsed.opp  // 5 → col 0, 1 → col 4
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      matrix[row][col] = entry.win_pct
    }
  }

  return matrix
}

/** Build a 5x5 matrix from a Record<situation, avg_win_pct> */
export function buildAvgMatrix(avgMap: Record<string, number>): (number | null)[][] {
  const matrix: (number | null)[][] = Array.from({ length: 5 }, () => Array(5).fill(null))

  for (const [situation, value] of Object.entries(avgMap)) {
    const parsed = parseSituation(situation)
    if (!parsed) continue
    const row = 5 - parsed.team
    const col = 5 - parsed.opp
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      matrix[row][col] = value
    }
  }

  return matrix
}
```

- [ ] **Step 4: Verify build still works**

```bash
cd C:/Users/Vincent/Claude/VLR/vcl-frontend && npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add vcl-frontend/src/utils/
git commit -m "feat: add heat-map color, formatting, and XvY matrix utilities"
```

---

## Task 4: Shared Components (AgentIcon, StatCell, FormStrip)

**Files:**
- Create: `vcl-frontend/src/components/AgentIcon.tsx`
- Create: `vcl-frontend/src/components/StatCell.tsx`
- Create: `vcl-frontend/src/components/FormStrip.tsx`

- [ ] **Step 1: Create AgentIcon component**

Create `src/components/AgentIcon.tsx`:

```tsx
import { useState } from 'react'

/** Map agent names from stats.json to icon filenames */
function agentToFilename(agent: string): string {
  return agent.replace('/', '') // KAY/O → KAYO
}

interface AgentIconProps {
  agent: string
  size?: number
  className?: string
}

export default function AgentIcon({ agent, size = 18, className = '' }: AgentIconProps) {
  const [failed, setFailed] = useState(false)
  const filename = agentToFilename(agent)

  if (failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-card text-[10px] text-text-muted font-mono ${className}`}
        style={{ width: size, height: size }}
        title={agent}
      >
        {agent.slice(0, 2)}
      </span>
    )
  }

  return (
    <img
      src={`./icons/${filename}.png`}
      alt={agent}
      title={agent}
      width={size}
      height={size}
      className={`rounded-full inline-block ${className}`}
      onError={() => setFailed(true)}
    />
  )
}
```

- [ ] **Step 2: Create StatCell component**

Create `src/components/StatCell.tsx`:

```tsx
import { heatColor } from '../utils/colors'

interface StatCellProps {
  value: number | null | undefined
  mean?: number
  std?: number
  format: (v: number) => string
  invert?: boolean // true for stats where lower is better (deaths, fd/r)
  className?: string
}

export default function StatCell({ value, mean, std, format, invert = false, className = '' }: StatCellProps) {
  if (value == null || isNaN(value)) {
    return <td className={`px-1.5 py-0.5 text-center text-text-dim ${className}`}>-</td>
  }

  const bg = mean != null && std != null && std > 0
    ? heatColor(value, mean, std, invert)
    : 'transparent'

  return (
    <td
      className={`px-1.5 py-0.5 text-center font-mono text-sm ${className}`}
      style={{ backgroundColor: bg }}
    >
      {format(value)}
    </td>
  )
}
```

- [ ] **Step 3: Create FormStrip component**

Create `src/components/FormStrip.tsx`:

```tsx
import type { FormEntry } from '../types'

interface FormStripProps {
  form: FormEntry[]
  count?: number
}

export default function FormStrip({ form, count = 5 }: FormStripProps) {
  // Reverse so most recent is on the right (form array is newest-first)
  const recent = form.slice(0, count).reverse()

  return (
    <div className="flex gap-1 items-center">
      {recent.map((entry, i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded-sm ${
            entry.result === 'W' ? 'bg-success' : 'bg-danger'
          }`}
          title={`${entry.result === 'W' ? 'Win' : 'Loss'} vs ${entry.opponent} on ${entry.map} (${entry.score})`}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
cd C:/Users/Vincent/Claude/VLR/vcl-frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add vcl-frontend/src/components/AgentIcon.tsx vcl-frontend/src/components/StatCell.tsx vcl-frontend/src/components/FormStrip.tsx
git commit -m "feat: add AgentIcon, StatCell, and FormStrip shared components"
```

---

## Task 5: Navbar + Search Bar + Routing

**Files:**
- Create: `vcl-frontend/src/components/Navbar.tsx`
- Create: `vcl-frontend/src/components/SearchBar.tsx`
- Modify: `vcl-frontend/src/App.tsx` (add router + navbar)

- [ ] **Step 1: Create SearchBar component**

Create `src/components/SearchBar.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStats } from '../context/StatsContext'

export default function SearchBar() {
  const { data } = useStats()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!data) return null

  const q = query.toLowerCase().trim()
  const teamResults = q.length >= 2
    ? data.teams.filter(t => t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q))
    : []
  const playerResults = q.length >= 2
    ? data.players.filter(p => p.ign.toLowerCase().includes(q))
    : []
  const allResults = [
    ...teamResults.map(t => ({ type: 'team' as const, label: t.name, path: `/team/${encodeURIComponent(t.name)}` })),
    ...playerResults.map(p => ({ type: 'player' as const, label: `${p.ign} — ${p.team}`, path: `/player/${encodeURIComponent(p.ign)}` })),
  ]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, allResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      navigate(allResults[selectedIndex].path)
      setQuery('')
      setOpen(false)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setSelectedIndex(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search teams or players..."
        className="bg-card border border-border rounded px-3 py-1.5 text-sm text-text placeholder-text-dim w-64 focus:outline-none focus:border-primary"
      />
      {open && allResults.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-full bg-card border border-border rounded shadow-lg z-50 max-h-80 overflow-y-auto">
          {teamResults.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs text-text-muted uppercase tracking-wider">Teams</div>
              {teamResults.map((t, i) => (
                <button
                  key={t.name}
                  className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-border ${selectedIndex === i ? 'bg-border' : ''}`}
                  onClick={() => { navigate(`/team/${encodeURIComponent(t.name)}`); setQuery(''); setOpen(false) }}
                >
                  {t.name}
                </button>
              ))}
            </>
          )}
          {playerResults.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs text-text-muted uppercase tracking-wider">Players</div>
              {playerResults.map((p, j) => {
                const idx = teamResults.length + j
                return (
                  <button
                    key={p.ign}
                    className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-border ${selectedIndex === idx ? 'bg-border' : ''}`}
                    onClick={() => { navigate(`/player/${encodeURIComponent(p.ign)}`); setQuery(''); setOpen(false) }}
                  >
                    {p.ign} <span className="text-text-muted">— {p.team}</span>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create Navbar component**

Create `src/components/Navbar.tsx`:

```tsx
import { NavLink, useLocation } from 'react-router-dom'
import { useStats } from '../context/StatsContext'
import SearchBar from './SearchBar'

export default function Navbar() {
  const { data } = useStats()
  const location = useLocation()

  const firstTeam = data?.teams
    ? [...data.teams].sort((a, b) => a.name.localeCompare(b.name))[0]?.name
    : null

  const savedTeam = (() => { try { return localStorage.getItem('vcl-last-team') } catch { return null } })()
  const defaultTeam = savedTeam && data?.teams.find(t => t.name === savedTeam) ? savedTeam : firstTeam

  // Determine active tab from current path
  const isTeamsActive = location.pathname.startsWith('/team/') && !location.pathname.endsWith('/history')
  const isHistoryActive = location.pathname.endsWith('/history')

  const tabs = [
    { label: 'Teams', path: defaultTeam ? `/team/${encodeURIComponent(defaultTeam)}` : '/team', active: isTeamsActive },
    { label: 'Leaderboards', path: '/leaderboards', active: location.pathname === '/leaderboards' },
    { label: 'Versus', path: '/versus', active: location.pathname === '/versus' },
    { label: 'History', path: defaultTeam ? `/team/${encodeURIComponent(defaultTeam)}/history` : '/history', active: isHistoryActive },
  ]

  return (
    <nav className="bg-nav border-b border-border px-4 h-12 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <span className="font-bold text-primary tracking-wide text-lg">VCL STATS</span>
        <div className="flex gap-1">
          {tabs.map(tab => (
            <NavLink
              key={tab.label}
              to={tab.path}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                tab.active
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-muted hover:text-text hover:bg-card'
              }`}
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>
      <SearchBar />
    </nav>
  )
}
```

- [ ] **Step 3: Wire up routing in App.tsx**

Update `src/App.tsx`:

```tsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StatsProvider, useStats } from './context/StatsContext'
import Navbar from './components/Navbar'

// Placeholder pages — will be replaced in later tasks
function TeamOverview() { return <div className="p-4">Team Overview (TODO)</div> }
function PlayerProfile() { return <div className="p-4">Player Profile (TODO)</div> }
function Leaderboards() { return <div className="p-4">Leaderboards (TODO)</div> }
function Versus() { return <div className="p-4">Versus (TODO)</div> }
function MatchHistory() { return <div className="p-4">Match History (TODO)</div> }

function AppRoutes() {
  const { data, loading, error } = useStats()

  if (loading) return <div className="p-8 text-text-muted">Loading stats...</div>
  if (error) return <div className="p-8 text-danger">Error: {error}</div>
  if (!data) return null

  const savedTeam = (() => { try { return localStorage.getItem('vcl-last-team') } catch { return null } })()
  const firstTeam = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))[0]?.name
  const defaultTeam = savedTeam && data.teams.find(t => t.name === savedTeam) ? savedTeam : firstTeam

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to={`/team/${encodeURIComponent(defaultTeam)}`} replace />} />
          <Route path="/team/:name" element={<TeamOverview />} />
          <Route path="/player/:ign" element={<PlayerProfile />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/versus" element={<Versus />} />
          <Route path="/team/:name/history" element={<MatchHistory />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <StatsProvider>
        <div className="min-h-screen bg-surface text-text">
          <AppRoutes />
        </div>
      </StatsProvider>
    </HashRouter>
  )
}
```

- [ ] **Step 4: Verify navigation works**

```bash
cd C:/Users/Vincent/Claude/VLR/vcl-frontend && npm run dev
```

Expected: Nav bar shows with "VCL STATS" logo, tabs for Teams/Leaderboards/Versus/History, search bar. Root redirects to first team. Clicking tabs navigates between placeholder pages. Search finds teams and players.

- [ ] **Step 5: Commit**

```bash
git add vcl-frontend/src/components/Navbar.tsx vcl-frontend/src/components/SearchBar.tsx vcl-frontend/src/App.tsx
git commit -m "feat: add Navbar with tabs, global SearchBar, and React Router routes"
```

---

## Task 6: Team Overview Page — Full Build

This is the core page. It builds the entire Team Overview matching the VCL3 Stats Excel layout.

**Files:**
- Create: `vcl-frontend/src/pages/TeamOverview.tsx`
- Create: `vcl-frontend/src/components/TeamSelector.tsx`
- Create: `vcl-frontend/src/components/XvYMatrix.tsx`
- Create: `vcl-frontend/src/utils/talkingPoints.ts`
- Modify: `vcl-frontend/src/App.tsx` (replace placeholder import)

- [ ] **Step 1: Create TeamSelector dropdown**

Create `src/components/TeamSelector.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { useStats } from '../context/StatsContext'

interface TeamSelectorProps {
  currentTeam: string
}

export default function TeamSelector({ currentTeam }: TeamSelectorProps) {
  const { data } = useStats()
  const navigate = useNavigate()

  if (!data) return null
  const sorted = [...data.teams].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <select
      value={currentTeam}
      onChange={e => navigate(`/team/${encodeURIComponent(e.target.value)}`)}
      className="bg-card border border-border rounded px-3 py-1.5 text-lg font-semibold text-text focus:outline-none focus:border-primary"
    >
      {sorted.map(t => (
        <option key={t.name} value={t.name}>{t.name}</option>
      ))}
    </select>
  )
}
```

- [ ] **Step 2: Create XvYMatrix component**

Create `src/components/XvYMatrix.tsx`:

```tsx
import { buildXvYMatrix, buildAvgMatrix } from '../utils/xvy'
import { deltaColor } from '../utils/colors'
import { formatPct, formatDelta } from '../utils/format'
import type { XvYEntry } from '../types'

interface XvYMatrixProps {
  title: string
  entries?: XvYEntry[]
  averages?: Record<string, number>
  mode: 'absolute' | 'delta' | 'average'
}

export default function XvYMatrix({ title, entries, averages, mode }: XvYMatrixProps) {
  const labels = [5, 4, 3, 2, 1]

  let matrix: (number | null)[][]

  if (mode === 'average' && averages) {
    matrix = buildAvgMatrix(averages)
  } else if (entries) {
    matrix = buildXvYMatrix(entries)
  } else {
    matrix = Array.from({ length: 5 }, () => Array(5).fill(null))
  }

  // For delta mode, compute difference from averages
  let deltaMatrix: (number | null)[][] | null = null
  if (mode === 'delta' && entries && averages) {
    const teamMatrix = buildXvYMatrix(entries)
    const avgMatrix = buildAvgMatrix(averages)
    deltaMatrix = Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 5 }, (_, c) => {
        const tv = teamMatrix[r][c]
        const av = avgMatrix[r][c]
        return tv != null && av != null ? tv - av : null
      })
    )
  }

  const displayMatrix = deltaMatrix || matrix

  const headerStyle = mode === 'delta'
    ? { backgroundColor: '#5a5a27', color: '#e8e4a0' }
    : { backgroundColor: '#4a3080', color: '#c4a8f0' }

  return (
    <div>
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th colSpan={6} className="px-1 py-1 text-center font-semibold text-xs border border-border" style={headerStyle}>
              {title}
            </th>
          </tr>
          <tr className="bg-nav">
            <th className="px-1.5 py-1 text-center text-text-muted font-medium text-xs border border-border">XvY</th>
            {labels.map(n => (
              <th key={n} className="px-1.5 py-1 text-center text-text-muted font-medium text-xs border border-border w-12">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((rowLabel, rowIdx) => (
            <tr key={rowLabel} className="border-b border-border">
              <td className="px-1.5 py-0.5 text-center font-medium text-text-muted border border-border">{rowLabel}</td>
              {labels.map((_, colIdx) => {
                const val = displayMatrix[rowIdx][colIdx]
                if (val == null) {
                  return <td key={colIdx} className="px-1.5 py-0.5 text-center text-text-dim border border-border">-</td>
                }

                const bg = mode === 'delta' ? deltaColor(val) : deltaColor(val - 0.5)
                const text = mode === 'delta' ? formatDelta(val) : formatPct(val)

                return (
                  <td key={colIdx} className="px-1.5 py-0.5 text-center font-mono text-xs border border-border" style={{ backgroundColor: bg }}>
                    {text}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Create talking points generator**

Create `src/utils/talkingPoints.ts`:

```ts
import type { Team, StatsData, TournamentAverages } from '../types'

export function generateTalkingPoints(team: Team, data: StatsData, averages: TournamentAverages): string[] {
  const points: string[] = []

  // Strong/poor form
  const last5 = team.form.slice(0, 5)
  if (last5.length >= 5) {
    const wins = last5.filter(f => f.result === 'W').length
    const losses = last5.length - wins
    if (wins >= 4) points.push(`Strong recent form — ${wins}W${losses}L in last 5 maps`)
    if (losses >= 4) points.push(`Poor recent form — ${wins}W${losses}L in last 5 maps`)
  }

  // Map-specific insights
  for (const mapStat of team.maps) {
    if (mapStat.plays >= 3) {
      if (mapStat.rW_pct >= 0.7) points.push(`${team.name} wins ${(mapStat.rW_pct * 100).toFixed(1)}% of rounds on ${mapStat.map}`)
      if (mapStat.rW_pct <= 0.35) points.push(`${team.name} struggles on ${mapStat.map} (${(mapStat.rW_pct * 100).toFixed(1)}% round win rate)`)
    }
  }

  // Post-plant / retake ranks
  if (team.allMaps.post_rank <= 3) {
    points.push(`Top ${team.allMaps.post_rank} post-plant team in the tournament (${(team.allMaps.post_rW_pct * 100).toFixed(1)}%)`)
  }
  if (team.allMaps.ret_rank <= 3) {
    points.push(`Top ${team.allMaps.ret_rank} retake team in the tournament (${(team.allMaps.ret_rW_pct * 100).toFixed(1)}%)`)
  }

  // Eco win rate
  const ecoAvg = averages.team.eco_rW_pct?.mean ?? 0
  if (team.allMaps.eco_rW_pct >= 0.35) {
    points.push(`Strong eco game: ${(team.allMaps.eco_rW_pct * 100).toFixed(1)}% eco round win rate (tournament avg: ${(ecoAvg * 100).toFixed(1)}%)`)
  }

  // Player-level insights
  const teamPlayers = data.players.filter(p => p.team === team.name)
  for (const player of teamPlayers) {
    if (player.clutch_pct >= 0.2) {
      points.push(`${player.ign} closes out ${(player.clutch_pct * 100).toFixed(1)}% of clutch scenarios`)
    }
  }

  // Tournament rank insights (#1, #2, last)
  for (const [stat, lb] of Object.entries(data.leaderboards)) {
    const lastRank = lb.entries.length
    for (const player of teamPlayers) {
      const entry = lb.entries.find(e => e.ign === player.ign)
      if (entry?.rank === 1) {
        points.push(`Best ${stat.toUpperCase()} in the tournament: ${player.ign}`)
      } else if (entry?.rank === 2) {
        points.push(`${player.ign} ranks 2nd in ${stat.toUpperCase()}`)
      } else if (entry?.rank === lastRank) {
        points.push(`Lowest ${stat.toUpperCase()} in the tournament: ${player.ign}`)
      }
    }
  }

  return points.slice(0, 5)
}
```

- [ ] **Step 4: Build the full TeamOverview page**

Create `src/pages/TeamOverview.tsx` — this is the largest component. It renders:

1. Team header (selector, series record, form strip)
2. Map statistics table with grouped column headers (colored backgrounds matching Excel)
3. Post plant table (right side, aligned with map rows)
4. Player stats table (below left)
5. Three XvY matrices (below right): Team XvY, Delta, Tournament Average
6. Talking points panel (accent border, different background)

The map stats table uses these column groups with colored headers:
- Team Statistics (`#2d5a27`): Map, Comp
- Map (`#1e3a5f`): Plays, Win, Loss
- All Rounds (`#4a3080`): rW%, aW%, dW%
- Pistols (`#7a3030`): rW%, aW%, dW%
- Gun (`#2d5a27`): rW%, aW%, dW%
- Anti Eco (`#5a5a27`): rW%, aW%, dW%
- Eco (`#5a3a27`): rW%, aW%, dW%

All percentage cells use `<StatCell>` with the per-map tournament averages (mean+std) for heat mapping. The "All Maps" aggregate row uses tournament-wide averages.

Player names link to `/player/:ign` using React Router `<Link>`.

Saves last viewed team to localStorage.

- [ ] **Step 5: Update App.tsx to import TeamOverview**

Replace the placeholder with the real import:
```tsx
import TeamOverview from './pages/TeamOverview'
```

- [ ] **Step 6: Verify Team Overview page renders**

```bash
cd C:/Users/Vincent/Claude/VLR/vcl-frontend && npm run dev
```

Expected: Full Team Overview page with all sections matching the VCL3 Stats Excel layout. Switching teams via dropdown updates all data. Heat-map colors visible on percentage cells.

- [ ] **Step 7: Commit**

```bash
git add vcl-frontend/src/pages/TeamOverview.tsx vcl-frontend/src/components/TeamSelector.tsx vcl-frontend/src/components/XvYMatrix.tsx vcl-frontend/src/utils/talkingPoints.ts vcl-frontend/src/App.tsx
git commit -m "feat: build Team Overview page with map stats, post plant, player stats, XvY, and talking points"
```

---

## Task 7: Player Profile Page

**Files:**
- Create: `vcl-frontend/src/pages/PlayerProfile.tsx`
- Create: `vcl-frontend/src/components/PlayerSelector.tsx`
- Modify: `vcl-frontend/src/App.tsx` (replace placeholder import)

- [ ] **Step 1: Create PlayerSelector dropdown**

Create `src/components/PlayerSelector.tsx` — dropdown with all players grouped by team via `<optgroup>`.

- [ ] **Step 2: Build PlayerProfile page**

Create `src/pages/PlayerProfile.tsx`:
- Player header: IGN (large), team name, rounds played
- Back link to team page
- PlayerSelector dropdown
- Stat cards grid (3 columns): ACS Split, ACS Year, K/D, KA/D, KAST, FK/r, FD/r, FK/FD, CL%, AWP%
  - ACS card shows both split and year values (e.g., "219 split / 219 year")
  - Each card shows value + tournament rank from leaderboards ("#3 of N players")
- Agent pool: top 5 agents with icons (32px), pick %, match count
- Clutch breakdown: scenarios, wins, win % in a simple grid

- [ ] **Step 3: Update App.tsx with real import**

```tsx
import PlayerProfile from './pages/PlayerProfile'
```

- [ ] **Step 4: Verify navigation from Team Overview**

Click player name on Team Overview → Player Profile loads with correct data.

- [ ] **Step 5: Commit**

```bash
git add vcl-frontend/src/pages/PlayerProfile.tsx vcl-frontend/src/components/PlayerSelector.tsx vcl-frontend/src/App.tsx
git commit -m "feat: add Player Profile page with stat cards, agent pool, and clutch breakdown"
```

---

## Task 8: Leaderboards Page

**Files:**
- Create: `vcl-frontend/src/pages/Leaderboards.tsx`
- Modify: `vcl-frontend/src/App.tsx` (replace placeholder)

- [ ] **Step 1: Build Leaderboards page**

Create `src/pages/Leaderboards.tsx`:
- Tab bar: ACS | Kills | Deaths | Assists | K/D | KAST | FK | FD | FK% | FD% | CL%
- Active tab with primary color styling
- Ranked table: rank, IGN (clickable → player profile), team, stat value, rounds
- Deaths and FD sorted ascending (lower = better, rank #1 = fewest)
- Tournament average as highlighted reference row (not ranked, primary color)
- Team filter dropdown: dims non-selected teams (opacity: 0.3)
- MIN_ROUNDS constant = 100

Data source: `data.leaderboards[activeTab]` — each has `{ entries[], tournament_avg }`.

- [ ] **Step 2: Update App.tsx**

```tsx
import Leaderboards from './pages/Leaderboards'
```

- [ ] **Step 3: Verify tab switching and team filter**

- [ ] **Step 4: Commit**

```bash
git add vcl-frontend/src/pages/Leaderboards.tsx vcl-frontend/src/App.tsx
git commit -m "feat: add Leaderboards page with tab bar, team filter, and tournament average"
```

---

## Task 9: Versus Page

**Files:**
- Create: `vcl-frontend/src/pages/Versus.tsx`
- Modify: `vcl-frontend/src/App.tsx` (replace placeholder)

- [ ] **Step 1: Build Versus page with both sub-modes**

Create `src/pages/Versus.tsx` with two internal tabs:

**Team vs Team:**
- Two team dropdowns (can't select same team)
- Overall record + form strips
- Head-to-head history (filter matches where both teams played)
- Map pool comparison table (plays, W-L, rW% per map, edge arrow indicator)
- Economy comparison (pistol/gun/anti-eco/eco, highlight higher value)
- Post-plant & retake with tournament ranks
- Player roster comparison (two columns: ACS, K/D, KAST, FK/r, CL%)
- XvY matrices side by side

**Player vs Player:**
- Two player dropdowns ("IGN — Team" format, grouped by team)
- Stat comparison table: better value highlighted in green
- Agent pools side by side (top 5 with icons)

- [ ] **Step 2: Update App.tsx**

```tsx
import Versus from './pages/Versus'
```

- [ ] **Step 3: Verify both comparison modes**

- [ ] **Step 4: Commit**

```bash
git add vcl-frontend/src/pages/Versus.tsx vcl-frontend/src/App.tsx
git commit -m "feat: add Versus page with Team vs Team and Player vs Player comparisons"
```

---

## Task 10: Match History Page

**Files:**
- Create: `vcl-frontend/src/pages/MatchHistory.tsx`
- Modify: `vcl-frontend/src/App.tsx` (replace placeholder)

- [ ] **Step 1: Build MatchHistory page**

Create `src/pages/MatchHistory.tsx`:
- TeamSelector at top + back link to team overview
- Table: Date, Opponent, Map, Score (from team's perspective), Result (Win/Loss badge), Comp (agent icons)
- Sorted newest first
- Clickable rows expand inline to show: opponent comp icons, half-time score, starting side (derived: team1 always attacks first half in Valorant, so if team is team1 → "Started Attack", else "Started Defense")
- Uses `useState<Set<string>>` for tracking expanded rows

- [ ] **Step 2: Update App.tsx**

```tsx
import MatchHistory from './pages/MatchHistory'
```

- [ ] **Step 3: Verify with multiple teams**

- [ ] **Step 4: Commit**

```bash
git add vcl-frontend/src/pages/MatchHistory.tsx vcl-frontend/src/App.tsx
git commit -m "feat: add Match History page with expandable match details"
```

---

## Task 11: Final Polish + Build Verification

**Files:**
- Modify various components for final fixes

- [ ] **Step 1: Verify all pages render correctly**

Manually check:
- Team Overview: all sections, heat-map colors, agent icons load, XvY matrices
- Player Profile: stat cards with ranks, agent pool, clutch breakdown
- Leaderboards: all tabs, team filter, tournament average row
- Versus: both modes with real team/player selections
- Match History: expandable rows, correct score perspective

- [ ] **Step 2: Run production build**

```bash
cd C:/Users/Vincent/Claude/VLR/vcl-frontend && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Test production build locally**

```bash
cd C:/Users/Vincent/Claude/VLR/vcl-frontend && npx serve dist
```

Expected: All pages work with relative asset paths.

- [ ] **Step 4: Commit**

```bash
git add vcl-frontend/
git commit -m "v0.6.0: VCL Broadcast Stats Dashboard frontend — all 5 pages complete"
```

- [ ] **Step 5: Tag release**

```bash
git tag v0.6.0
```

---

## Summary

| Task | Component | Key Files |
|------|-----------|-----------|
| 1 | Project scaffolding | package.json, vite.config, tailwind, index.html, icons |
| 2 | Types + Data Context | types.ts, StatsContext.tsx |
| 3 | Utilities | colors.ts, format.ts, xvy.ts |
| 4 | Shared components | AgentIcon, StatCell, FormStrip |
| 5 | Navbar + Search + Routing | Navbar, SearchBar, App.tsx |
| 6 | Team Overview (core page) | TeamOverview, TeamSelector, XvYMatrix, talkingPoints |
| 7 | Player Profile | PlayerProfile, PlayerSelector |
| 8 | Leaderboards | Leaderboards |
| 9 | Versus | Versus (Team + Player) |
| 10 | Match History | MatchHistory |
| 11 | Polish + build | Final fixes, production build, v0.6.0 tag |
