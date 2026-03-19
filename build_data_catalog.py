#!/usr/bin/env python3
"""Build Data Catalog spreadsheet listing all available stats from the Valolytics API."""

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
except ImportError:
    import subprocess
    subprocess.check_call(['pip', 'install', 'openpyxl'])
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

# ── Styling ──
DARK_BG = PatternFill('solid', fgColor='1a1a2e')
HEADER_BG = PatternFill('solid', fgColor='16213e')
CAT_BG = PatternFill('solid', fgColor='0f3460')
WHITE = Font(color='FFFFFF', size=11)
WHITE_BOLD = Font(color='FFFFFF', size=11, bold=True)
TITLE_FONT = Font(color='FFFFFF', size=14, bold=True)
CAT_FONT = Font(color='53cfcf', size=11, bold=True)
WRAP = Alignment(wrap_text=True, vertical='top')
THIN_BORDER = Border(
    left=Side(style='thin', color='333355'),
    right=Side(style='thin', color='333355'),
    top=Side(style='thin', color='333355'),
    bottom=Side(style='thin', color='333355'),
)

COLUMNS = ['A', 'B', 'C', 'D']
COL_WIDTHS = {'A': 6, 'B': 38, 'C': 16, 'D': 70}


def style_sheet(ws):
    """Apply base styling to a worksheet."""
    ws.sheet_properties.tabColor = '1a1a2e'
    for col, width in COL_WIDTHS.items():
        ws.column_dimensions[col].width = width
    # Fill background for a large area
    for row in range(1, 200):
        for col in COLUMNS:
            cell = ws[f'{col}{row}']
            cell.fill = DARK_BG
            cell.font = WHITE
            cell.border = THIN_BORDER


def write_header(ws, title, subtitle):
    """Write sheet title and column headers."""
    ws.merge_cells('A1:D1')
    ws['A1'].value = title
    ws['A1'].font = TITLE_FONT
    ws['A1'].alignment = Alignment(vertical='center')

    ws.merge_cells('A2:D2')
    ws['A2'].value = subtitle
    ws['A2'].font = Font(color='888888', size=10, italic=True)

    headers = ['#', 'Stat Name', 'Data Type', 'Description / Source']
    for i, h in enumerate(headers):
        cell = ws[f'{COLUMNS[i]}3']
        cell.value = h
        cell.font = WHITE_BOLD
        cell.fill = HEADER_BG
        cell.alignment = Alignment(horizontal='center', vertical='center')

    return 4  # next row


def write_category(ws, row, name):
    """Write a category separator row."""
    ws.merge_cells(f'A{row}:D{row}')
    ws[f'A{row}'].value = name
    ws[f'A{row}'].font = CAT_FONT
    ws[f'A{row}'].fill = CAT_BG
    for col in COLUMNS:
        ws[f'{col}{row}'].fill = CAT_BG
    return row + 1


def write_rows(ws, row, items):
    """Write data rows. items = list of (stat, dtype, description)."""
    for idx, (stat, dtype, desc) in enumerate(items, 1):
        ws[f'A{row}'].value = idx
        ws[f'A{row}'].alignment = Alignment(horizontal='center')
        ws[f'B{row}'].value = stat
        ws[f'C{row}'].value = dtype
        ws[f'C{row}'].alignment = Alignment(horizontal='center')
        ws[f'D{row}'].value = desc
        ws[f'D{row}'].alignment = WRAP
        row += 1
    return row


# ═══════════════════════════════════════════════════
# TAB 1 — TEAM DATA
# ═══════════════════════════════════════════════════
TEAM_DATA = {
    'Match & Series': [
        ('Matches Played', 'Count', 'Total maps played by the team across all series'),
        ('Series Played', 'Count', 'Number of series (Bo3/Bo5) the team has competed in'),
        ('Match Win / Loss', 'W-L', 'Map-level win-loss record'),
        ('Series Win / Loss', 'W-L', 'Series-level win-loss record'),
        ('Map Win Rate', '%', 'Percentage of maps won'),
        ('Match Result per Map', 'Score', 'Round score per map (e.g. 13-9)'),
        ('Match Date', 'Date', 'gameStartMillis converted to date'),
        ('Opponent', 'Tag', 'Opposing team tag (derived from player tags in match)'),
        ('Map Played', 'String', 'Map name per match (Bind, Pearl, etc.)'),
        ('Map Pool Distribution', 'Count', 'How many times each map was played'),
        ('Game Duration', 'ms / mm:ss', 'gameLengthMillis — total match length'),
        ('Average Match Duration', 'mm:ss', 'Mean game length across all maps'),
    ],
    'Round Stats': [
        ('Rounds Played', 'Count', 'Total rounds played (teams[].roundsPlayed)'),
        ('Rounds Won', 'Count', 'Total rounds won (teams[].roundsWon)'),
        ('Round Win Rate (Overall)', '%', 'roundsWon / roundsPlayed'),
        ('Attack Rounds Played', 'Count', 'Rounds where team was on attack side'),
        ('Attack Rounds Won', 'Count', 'Attack rounds won'),
        ('Attack Round Win Rate', '%', 'Attack rounds won / played'),
        ('Defense Rounds Played', 'Count', 'Rounds where team was on defense side'),
        ('Defense Rounds Won', 'Count', 'Defense rounds won'),
        ('Defense Round Win Rate', '%', 'Defense rounds won / played'),
        ('First Half Score', 'Score', 'Rounds 0-11 result'),
        ('Second Half Score', 'Score', 'Rounds 12-23 result'),
        ('Overtime Rounds', 'Count', 'Rounds beyond regulation (round 24+)'),
        ('Flawless Rounds', 'Count', 'Rounds won without any team deaths (roundCeremony = CeremonyFlawless)'),
    ],
    'Economy': [
        ('Pistol Round Win Rate', '%', 'Win rate on rounds 0 and 12'),
        ('Anti-Eco Round Win Rate', '%', 'Win rate on rounds 1 and 13 (post-pistol)'),
        ('Gun Round Win Rate', '%', 'Win rate when team loadout > 20,000 credits'),
        ('Eco Round Win Rate', '%', 'Win rate when team loadout < 5,000 credits'),
        ('Force Buy Round Win Rate', '%', 'Win rate when team loadout 5,000–10,000 credits'),
        ('Average Team Loadout Value', 'Credits', 'Mean sum of 5-player loadoutValue per round'),
        ('Average Credits Spent per Round', 'Credits', 'Mean of sum(economy.spent) across team per round'),
        ('Average Credits Remaining', 'Credits', 'Mean of sum(economy.remaining) across team per round'),
        ('Eco Rounds Played', 'Count', 'Number of eco rounds (team loadout < 5k)'),
        ('Force Buy Rounds Played', 'Count', 'Number of force buy rounds (5k–10k)'),
        ('Gun Rounds Played', 'Count', 'Number of full buy rounds (>20k)'),
    ],
    'Spike (Plant & Defuse)': [
        ('Spike Plants', 'Count', 'Rounds where bombPlanter is a team member'),
        ('Spike Plants per Attack Round', 'Ratio', 'Plants / attack rounds played'),
        ('Plant Site Distribution (A vs B)', 'Count', 'plantSite counts per site'),
        ('Average Plant Time', 'ms', 'Mean plantRoundTime across all plants'),
        ('Spike Defuses', 'Count', 'Rounds where bombDefuser is a team member'),
        ('Defuse Rate', '%', 'Defuses / rounds where opponent planted'),
        ('Average Defuse Time', 'ms', 'Mean defuseRoundTime across all defuses'),
        ('Post-Plant Round Win Rate', '%', 'Win rate after team plants the spike'),
        ('Retake Round Win Rate', '%', 'Win rate on rounds where opponent planted'),
        ('Post-Plant Rounds per Map', 'Ratio', 'Total post-plant rounds / maps played'),
        ('Retake Rounds per Map', 'Ratio', 'Total retake rounds / maps played'),
    ],
    'Compositions': [
        ('Agent Compositions Used', 'List', 'Unique 5-agent comps played, sorted alphabetically'),
        ('Composition Play Count', 'Count', 'How many maps each comp was used on'),
        ('Composition Win Rate', '%', 'Win rate per composition'),
        ('Composition per Map', 'Comp + Map', 'Which comp was used on which map'),
        ('Agent Pick Rate', '%', 'How often each agent appears in team compositions'),
        ('Agent Win Rate', '%', 'Map win rate when a specific agent is in the comp'),
    ],
    'Round Win Methods': [
        ('Wins by Elimination', 'Count', 'roundResult = "Eliminated" when team won'),
        ('Wins by Spike Detonation', 'Count', 'roundResult = "Spike Detonated" when team won (attack)'),
        ('Wins by Defuse', 'Count', 'roundResult = "Defused" when team won (defense)'),
        ('Wins by Time Expiry', 'Count', 'Rounds won by clock running out (defense, no plant)'),
        ('Losses by Elimination', 'Count', 'Rounds lost via team being eliminated'),
    ],
}

# ═══════════════════════════════════════════════════
# TAB 2 — PLAYER DATA
# ═══════════════════════════════════════════════════
PLAYER_DATA = {
    'Identity & Agent': [
        ('Player Name', 'String', 'gameName from players[]'),
        ('Tag', 'String', 'tagLine (always "epval" for esports)'),
        ('PUUID', 'UUID', 'Unique player identifier, used for cross-match tracking'),
        ('Agent Played', 'Agent', 'characterId mapped to agent name'),
        ('Agent Play Count', 'Count', 'Number of maps played on each agent'),
        ('Maps Played', 'Count', 'Total maps the player appeared in'),
        ('Rounds Played', 'Count', 'stats.roundsPlayed — total rounds'),
    ],
    'Core Combat Stats (Match-Level)': [
        ('Kills', 'Count', 'stats.kills — total kills across all rounds'),
        ('Deaths', 'Count', 'stats.deaths — total deaths'),
        ('Assists', 'Count', 'stats.assists — total assists'),
        ('K/D Ratio', 'Ratio', 'kills / deaths'),
        ('KA/D Ratio', 'Ratio', '(kills + assists) / deaths'),
        ('Score', 'Integer', 'stats.score — Riot combat score'),
        ('ACS (Avg Combat Score)', 'Float', 'stats.score / stats.roundsPlayed'),
        ('VLR Rating 2.0', 'Float', 'stats.vlrRating2 — proprietary performance metric'),
        ('Playtime', 'ms', 'stats.playtimeMillis — time alive in match'),
    ],
    'Per-Round Combat (from roundResults.playerStats)': [
        ('Kills per Round', 'Float', 'Sum of kills[] entries per round, averaged'),
        ('Deaths per Round', 'Float', 'Counted from being a victim in others\' kills[]'),
        ('Round Score', 'Integer', 'playerStats[].score — combat score per round'),
        ('Multi-Kills per Round', 'Count', 'Rounds with 2+ kills (2K, 3K, 4K, 5K/Ace)'),
        ('2K Rounds', 'Count', 'Rounds with exactly 2 kills'),
        ('3K Rounds', 'Count', 'Rounds with exactly 3 kills'),
        ('4K Rounds', 'Count', 'Rounds with exactly 4 kills'),
        ('Aces (5K)', 'Count', 'Rounds with 5 kills'),
    ],
    'Damage Stats (per round)': [
        ('Total Damage Dealt', 'Integer', 'Sum of damage[].damage across all rounds'),
        ('Average Damage per Round (ADR)', 'Float', 'Total damage / rounds played'),
        ('Headshots', 'Count', 'Sum of damage[].headshots'),
        ('Bodyshots', 'Count', 'Sum of damage[].bodyshots'),
        ('Legshots', 'Count', 'Sum of damage[].legshots'),
        ('Headshot %', '%', 'headshots / (headshots + bodyshots + legshots)'),
        ('Damage per Kill', 'Float', 'Total damage / total kills'),
    ],
    'First Engagements': [
        ('First Kills (FK)', 'Count', 'First kill event in each round (lowest timeSinceRoundStartMillis)'),
        ('First Deaths (FD)', 'Count', 'First death in each round'),
        ('FK per Round', 'Float', 'First kills / rounds played'),
        ('FD per Round', 'Float', 'First deaths / rounds played'),
        ('FK / FD Ratio', 'Ratio', 'First kills / first deaths'),
        ('First Kill Time', 'ms', 'timeSinceRoundStartMillis of first kill in round'),
        ('Opening Duel Win Rate', '%', 'Rounds where player got FK / (FK + FD)'),
    ],
    'Kill Details (from kills[])': [
        ('Kill Weapon', 'Weapon', 'finishingDamage.damageItem mapped to weapon name'),
        ('Kill Damage Type', 'Type', 'finishingDamage.damageType (Weapon, Ability, etc.)'),
        ('Alt-Fire Kills', 'Count', 'Kills where finishingDamage.isSecondaryFireMode = true'),
        ('Operator Kills', 'Count', 'Kills with Operator UUID'),
        ('Operator Kill %', '%', 'Operator kills / total kills'),
        ('Kill Timing', 'ms', 'timeSinceRoundStartMillis — when in the round the kill happened'),
        ('Kill Location', 'x, y', 'victimLocation coordinates'),
        ('Killer Location', 'x, y', 'Killer position from playerLocations[] at time of kill'),
        ('Assistants', 'PUUIDs', 'List of players who assisted each kill'),
    ],
    'Ability Usage': [
        ('Grenade Casts', 'Count', 'stats.abilityCasts.grenadeCasts (C ability)'),
        ('Ability 1 Casts (Q)', 'Count', 'stats.abilityCasts.ability1Casts'),
        ('Ability 2 Casts (E)', 'Count', 'stats.abilityCasts.ability2Casts'),
        ('Ultimate Casts (X)', 'Count', 'stats.abilityCasts.ultimateCasts'),
        ('Total Ability Casts', 'Count', 'Sum of all 4 ability casts'),
        ('Ability Casts per Round', 'Float', 'Total casts / rounds played'),
        ('Ability Kills', 'Count', 'Kills where damageType = "Ability"'),
        ('Ability Kill %', '%', 'Ability kills / total kills'),
        ('Grenade Effects (per round)', 'Data', 'ability.grenadeEffects from playerStats'),
        ('Ability 1 Effects (per round)', 'Data', 'ability.ability1Effects from playerStats'),
        ('Ability 2 Effects (per round)', 'Data', 'ability.ability2Effects from playerStats'),
        ('Ultimate Effects (per round)', 'Data', 'ability.ultimateEffects from playerStats'),
    ],
    'Economy (per round)': [
        ('Loadout Value', 'Credits', 'economy.loadoutValue — total equipment value'),
        ('Weapon Equipped', 'Weapon', 'economy.weapon mapped to weapon name'),
        ('Armor Type', 'Armor', 'economy.armor — light/heavy shield UUID'),
        ('Credits Spent', 'Credits', 'economy.spent'),
        ('Credits Remaining', 'Credits', 'economy.remaining'),
        ('Average Loadout Value', 'Credits', 'Mean loadoutValue across all rounds'),
    ],
    'Spike Interactions': [
        ('Spike Plants', 'Count', 'Rounds where player is bombPlanter'),
        ('Spike Defuses', 'Count', 'Rounds where player is bombDefuser'),
        ('Plant Site Preference', 'A / B', 'Distribution of plantSite when player plants'),
        ('Player Position at Plant', 'x, y', 'From plantPlayerLocations[]'),
        ('Player Position at Defuse', 'x, y', 'From defusePlayerLocations[]'),
        ('View Direction at Plant', 'Radians', 'viewRadians from plantPlayerLocations[]'),
    ],
    'Positioning': [
        ('Position at Kill', 'x, y', 'playerLocations[] in kill events — killer\'s position'),
        ('Position at Death', 'x, y', 'victimLocation when player is the victim'),
        ('View Direction', 'Radians', 'viewRadians from playerLocations[]'),
    ],
}

# ═══════════════════════════════════════════════════
# TAB 3 — DERIVED / COMPUTED STATS
# ═══════════════════════════════════════════════════
DERIVED_DATA = {
    'Advanced Player Metrics': [
        ('KAST %', '%', 'Percentage of rounds where player had a Kill, Assist, Survived, or was Traded. Computed per-round from kills[], damage[], and death tracking.'),
        ('Clutch Win Rate (CL%)', '%', 'Win rate in 1vX situations. Detected by counting alive players at each kill event timestamp.'),
        ('Clutch Situations Count', 'Count', 'Number of 1v1, 1v2, 1v3, 1v4, 1v5 situations encountered'),
        ('Trade Kill Rate', '%', 'Percentage of deaths that were traded (teammate gets a kill within ~5s of player dying). Uses timeSinceRoundStartMillis.'),
        ('Kill Participation %', '%', 'Rounds where player got a kill or assist / total rounds played'),
        ('Impact Rating', 'Float', 'Custom metric combining multi-kills, first kills, and clutch wins — weighted above raw K/D'),
        ('Survival Rate', '%', 'Rounds survived (not in any victim field) / rounds played'),
        ('Average Kills per Death', 'Float', 'Kills in rounds where player dies — measures value extracted before death'),
    ],
    'XvX Clutch Breakdown': [
        ('1v1 Record', 'W-L', 'Win-loss in 1v1 post-plant/retake situations'),
        ('1v2 Record', 'W-L', 'Win-loss in 1v2 situations'),
        ('1v3 Record', 'W-L', 'Win-loss in 1v3 situations'),
        ('1v4 Record', 'W-L', 'Win-loss in 1v4 situations'),
        ('1v5 Record', 'W-L', 'Win-loss in 1v5 situations'),
        ('2v1 Record', 'W-L', 'Team has 2 alive vs opponent 1'),
        ('3v1 Record', 'W-L', 'Team has 3+ alive vs opponent 1 — measures throw rate'),
    ],
    'Weapon Analytics': [
        ('Weapon Kill Distribution', '%', 'Percentage of kills per weapon type (Vandal, Phantom, Operator, etc.)'),
        ('Weapon Headshot % per Weapon', '%', 'Headshot rate broken down by weapon used'),
        ('AWP/Operator Frequency', '%', 'Rounds where player bought Operator / total gun rounds'),
        ('Pistol Round Weapon Choice', 'Weapon', 'Ghost vs Classic vs Sheriff on pistol rounds'),
        ('Eco Weapon Choice', 'Weapon', 'Most common weapon on eco/force rounds'),
        ('Alt-Fire Kill Rate', '%', 'Secondary fire kills / total kills (right-click Spectre, Judge, etc.)'),
    ],
    'Economy Analytics': [
        ('Win Rate by Economy Type', '%', 'Team win rate segmented by pistol/eco/force/gun/anti-eco'),
        ('Economy Conversion Rate', '%', 'Bonus round win rate after winning pistol (anti-eco success)'),
        ('Eco Round Damage', 'Float', 'Average damage dealt on eco rounds — measures eco impact'),
        ('Save Rate', '%', 'Rounds where team saved (low buy) vs forced — economy discipline'),
        ('Post-Loss Economy Pattern', 'Pattern', 'Buy pattern after 1, 2, 3+ round losses (eco/force/full buy)'),
        ('Economy Differential', 'Credits', 'Average loadout difference vs opponent per round'),
    ],
    'Tempo & Timing': [
        ('Average Round Duration (Won)', 'ms', 'Mean round length for won rounds'),
        ('Average Round Duration (Lost)', 'ms', 'Mean round length for lost rounds'),
        ('Average Time to First Kill', 'ms', 'Mean timeSinceRoundStartMillis of first kill in round'),
        ('Average Time to Spike Plant', 'ms', 'Mean plantRoundTime — indicates execute speed'),
        ('Fast Executes', 'Count', 'Attack rounds with plant in first 30s — measures aggression'),
        ('Late Plants', 'Count', 'Attack rounds with plant after 60s — indicates defaulting/slow play'),
        ('Kill Timing Distribution', 'Histogram', 'Kills binned by timeSinceRoundStartMillis (early/mid/late round)'),
        ('Post-Plant Duration', 'ms', 'Time between plant and round end — post-plant hold effectiveness'),
    ],
    'Streaks & Momentum': [
        ('Win Streak (Max)', 'Count', 'Longest consecutive rounds won in a match'),
        ('Loss Streak (Max)', 'Count', 'Longest consecutive rounds lost'),
        ('Win Rate After Losing Round', '%', 'Response/bounce-back rate'),
        ('Win Rate After Winning Round', '%', 'Momentum maintenance rate'),
        ('Pistol Round Impact', 'Correlation', 'Correlation between pistol round result and map result'),
        ('Half Comeback Rate', '%', 'Win rate when losing the first half'),
        ('Overtime Win Rate', '%', 'Win rate in maps that go to overtime'),
    ],
    'Map & Side Analysis': [
        ('Attack Win Rate per Map', '%', 'Attack-side round win rate broken down by map'),
        ('Defense Win Rate per Map', '%', 'Defense-side round win rate broken down by map'),
        ('Map-Specific Agent Pool', 'List', 'Agents used on each specific map'),
        ('Side Win Differential per Map', '+/-', 'Attack WR - Defense WR per map — shows side preference'),
        ('First Pick / Ban Tendency', 'Map', 'Most/least played maps (proxy for pick/ban preference)'),
        ('Map Depth', 'Score', 'Average rounds per map — tight vs dominant games'),
    ],
    'Post-Plant & Retake Deep Dive': [
        ('Post-Plant Win Rate by Site', '%', 'Win rate on A-site vs B-site plants'),
        ('Post-Plant Win Rate by Player Count', '%', 'Win rate in post-plant 5v5, 4v5, 3v5, etc.'),
        ('Retake Win Rate by Site', '%', 'Retake success broken down by site'),
        ('Post-Plant Kills per Scenario', 'Float', 'Average kills in post-plant rounds'),
        ('Retake Kills per Scenario', 'Float', 'Average kills in retake rounds'),
        ('Post-Plant Scenarios per Map', 'Ratio', 'Post-plant frequency by map'),
        ('Defuse Under Pressure', '%', 'Defuses with ≤1 teammate alive'),
    ],
    'Player Comparison & Roles': [
        ('Entry Fragger Score', 'Index', 'Composite of FK rate, FK/FD ratio, opening duel win rate — identifies entry players'),
        ('Support Score', 'Index', 'Composite of assist rate, trade rate, flash assists (if Initiator)'),
        ('Consistency Score', 'Std Dev', 'Standard deviation of ACS across maps — lower = more consistent'),
        ('Carry Index', 'Float', 'Player ACS / team avg ACS — >1.0 = above-average carry'),
        ('Agent Versatility', 'Count', 'Number of unique agents played'),
        ('Performance by Agent', 'Table', 'K/D, ACS, WR broken down by agent played'),
        ('Teammate Synergy', 'Kill Pairs', 'Most frequent assist pairs — which players combo-kill together (from assistants[])'),
        ('Head-to-Head vs Opponent', 'K/D', 'Kill/death record against specific opponent players'),
    ],
    'Spatial / Positional Analysis': [
        ('Heatmap: Kill Locations', 'x,y grid', 'Density of victimLocation coordinates per map — shows where kills happen'),
        ('Heatmap: Death Locations', 'x,y grid', 'Where this player/team tends to die'),
        ('Heatmap: Plant Locations', 'x,y grid', 'plantLocation distribution — default vs non-default plants'),
        ('Engagement Distance', 'Float', 'Euclidean distance between killer and victim location at time of kill'),
        ('Rotation Detection', 'Pattern', 'Player position changes between plantPlayerLocations across rounds — identifies rotate patterns'),
        ('Crosshair Placement', 'Radians', 'viewRadians distribution at time of kill — indicates pre-aim tendency'),
    ],
    'Statistical Models': [
        ('Expected Kills (xK)', 'Float', 'Based on damage dealt per round, predict expected kills — compares actual vs expected'),
        ('Round Win Probability Model', '%', 'Given alive count + economy, predict round win chance using logistic regression'),
        ('ELO / Power Ranking', 'Score', 'Running ELO system across series — weights recent results higher'),
        ('Performance Trend (Rolling Avg)', 'Float', 'Rolling 5-map average of ACS, KD, WR — shows form trajectory'),
        ('Opponent-Adjusted Rating', 'Float', 'VLR Rating weighted by opponent strength — performing well vs strong teams scores higher'),
        ('Win Probability by Round Score', '%', 'Historical win rate given current round score (e.g. leading 7-5)'),
    ],
}


def build_catalog():
    wb = Workbook()

    # ── Tab 1: Team Data ──
    ws1 = wb.active
    ws1.title = 'Team Data'
    style_sheet(ws1)
    row = write_header(ws1, 'TEAM DATA — Direct from API', 'Stats aggregated at the team level per map or series')
    for cat, items in TEAM_DATA.items():
        row = write_category(ws1, row, cat)
        row = write_rows(ws1, row, items)
        row += 1  # spacing

    # ── Tab 2: Player Data ──
    ws2 = wb.create_sheet('Player Data')
    style_sheet(ws2)
    row = write_header(ws2, 'PLAYER DATA — Direct from API', 'Stats available per player per map, round, or match')
    for cat, items in PLAYER_DATA.items():
        row = write_category(ws2, row, cat)
        row = write_rows(ws2, row, items)
        row += 1

    # ── Tab 3: Derived / Computed ──
    ws3 = wb.create_sheet('Derived & Computed')
    style_sheet(ws3)
    row = write_header(ws3, 'DERIVED & COMPUTED — Statistical Analysis', 'Stats computed by interpreting, combining, or modeling raw API data')
    for cat, items in DERIVED_DATA.items():
        row = write_category(ws3, row, cat)
        row = write_rows(ws3, row, items)
        row += 1

    # ── Summary counts ──
    team_count = sum(len(v) for v in TEAM_DATA.values())
    player_count = sum(len(v) for v in PLAYER_DATA.values())
    derived_count = sum(len(v) for v in DERIVED_DATA.values())

    ws_summary = wb.create_sheet('Summary', 0)
    style_sheet(ws_summary)
    ws_summary.merge_cells('A1:D1')
    ws_summary['A1'].value = 'VCL Data Catalog — Summary'
    ws_summary['A1'].font = TITLE_FONT

    summary_items = [
        (3, 'Tab', 'Stat Count', 'Description'),
        (4, 'Team Data', str(team_count), 'Stats aggregated at the team level (map pool, economy, rounds, comps, spike)'),
        (5, 'Player Data', str(player_count), 'Stats per player (combat, damage, kills, abilities, economy, positioning)'),
        (6, 'Derived & Computed', str(derived_count), 'Advanced metrics via statistical analysis (KAST, clutches, tempo, heatmaps, models)'),
        (7, 'TOTAL', str(team_count + player_count + derived_count), 'All unique stats available from the Valolytics API'),
    ]

    for r, a, b, c in summary_items:
        ws_summary[f'A{r}'].value = a
        ws_summary[f'B{r}'].value = b  # reuse col B for count
        ws_summary[f'B{r}'].alignment = Alignment(horizontal='center')
        ws_summary[f'C{r}'].value = c  # skip to D for description
        ws_summary.merge_cells(f'C{r}:D{r}')
        if r == 3:
            for col in ['A', 'B', 'C', 'D']:
                ws_summary[f'{col}{r}'].font = WHITE_BOLD
                ws_summary[f'{col}{r}'].fill = HEADER_BG
        elif r == 7:
            for col in ['A', 'B', 'C', 'D']:
                ws_summary[f'{col}{r}'].font = CAT_FONT
                ws_summary[f'{col}{r}'].fill = CAT_BG

    out = 'Data_Catalog.xlsx'
    wb.save(out)
    print(f'Saved {out} — {team_count} team stats, {player_count} player stats, {derived_count} derived stats ({team_count + player_count + derived_count} total)')


if __name__ == '__main__':
    build_catalog()
