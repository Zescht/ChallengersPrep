#!/usr/bin/env python3
"""Build FOKUS stats spreadsheet matching VCL3 Stats template structure."""

import json
import datetime
import os
from collections import defaultdict, Counter
from io import BytesIO

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side, numbers
    from openpyxl.utils import get_column_letter
    from openpyxl.drawing.image import Image as XlImage
except ImportError:
    import subprocess
    subprocess.check_call(['pip', 'install', 'openpyxl'])
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side, numbers
    from openpyxl.utils import get_column_letter
    from openpyxl.drawing.image import Image as XlImage

# ── Constants ──
FOKUS_TAG = 'FKS'
OPERATOR_UUID = 'A03B24D3-4319-996D-0F8C-94BBFBA1DFC7'
ICON_DIR = 'data/icons'
MAP_ORDER = ['Abyss', 'Bind', 'Breeze', 'Corrode', 'Haven', 'Pearl', 'Split']

AGENT_MAP = {
    '0e38b510-41a8-5780-5e8f-568b2a4f2d6c': 'Iso',
    '117ed9e3-49f3-6512-3ccf-0cada7e3823b': 'Cypher',
    '1dbf2edd-4729-0984-3115-daa5eed44993': 'Clove',
    '1e58de9c-4950-5125-93e9-a0aee9f98746': 'Killjoy',
    '22697a3d-45bf-8dd7-4fec-84a9e28c69d7': 'Chamber',
    '320b2a48-4d9b-a075-30f1-1f93a9b638fa': 'Sova',
    '41fb69c1-4189-7b37-f117-bcaf1e96f1bf': 'Astra',
    '569fdd95-4d10-43ab-ca70-79becc718b46': 'Sage',
    '5f8d3a7f-467b-97f3-062c-13acf203c006': 'Breach',
    '601dbbe7-43ce-be57-2a40-4abd24953621': 'KAY/O',
    '6f2a04ca-43e0-be17-7f36-b3908627744d': 'Skye',
    '707eab51-4836-f488-046a-cda6bf494859': 'Viper',
    '7f94d92c-4234-0a36-9646-3a87eb8b5c89': 'Yoru',
    '8e253930-4c05-31dd-1b6c-968525494517': 'Omen',
    '92eeef5d-43b5-1d4a-8d03-b3927a09034b': 'Veto',
    '95b78ed7-4637-86d9-7e41-71ba8c293152': 'Harbor',
    '9f0d8ba9-4140-b941-57d3-a7ad57c6b417': 'Brimstone',
    'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc': 'Reyna',
    'add6443a-41bd-e414-f6ad-e58d267f4e95': 'Jett',
    'b444168c-4e35-8076-db47-ef9bf368f384': 'Tejo',
    'bb2a4828-46eb-8cd1-e765-15848195d751': 'Neon',
    'cc8b64c8-4b25-4ff9-6e7f-37b4da43d235': 'Deadlock',
    'dade69b4-4f5a-8528-247b-219e5a1facd6': 'Fade',
    'df1cb487-4902-002e-5c17-d28e83e78588': 'Waylay',
    'e370fa57-4757-3604-3648-499e1f642d3f': 'Gekko',
    'eb93336a-449b-9c1b-0a54-a891f7921d69': 'Phoenix',
    'efba5359-4016-a1e5-7626-b1ae76895940': 'Vyse',
    'f94c3b30-42be-e959-889c-5aa313dba261': 'Raze',
}

# ── Styling ──
DARK_BG = PatternFill('solid', fgColor='1a1a2e')
HEADER_BG = PatternFill('solid', fgColor='16213e')
SUBHEADER_BG = PatternFill('solid', fgColor='0f3460')
ROW_BG = PatternFill('solid', fgColor='1a1a2e')
ALT_ROW_BG = PatternFill('solid', fgColor='162447')
ALLMAP_BG = PatternFill('solid', fgColor='0f3460')
WHITE_FONT = Font(color='FFFFFF', size=10, name='Calibri')
HEADER_FONT = Font(color='FFFFFF', size=10, bold=True, name='Calibri')
TITLE_FONT = Font(color='FFFFFF', size=14, bold=True, name='Calibri')
PCT_FONT_GREEN = Font(color='00FF88', size=10, name='Calibri')
PCT_FONT_RED = Font(color='FF6B6B', size=10, name='Calibri')
PCT_FONT_YELLOW = Font(color='FFD93D', size=10, name='Calibri')
THIN_BORDER = Border(
    left=Side(style='thin', color='333355'),
    right=Side(style='thin', color='333355'),
    top=Side(style='thin', color='333355'),
    bottom=Side(style='thin', color='333355'),
)


def pct_font(val, neutral=0.5):
    """Color a percentage value green/yellow/red."""
    if val is None:
        return WHITE_FONT
    if val >= neutral + 0.1:
        return PCT_FONT_GREEN
    elif val <= neutral - 0.1:
        return PCT_FONT_RED
    return PCT_FONT_YELLOW


def safe_pct(num, den):
    return num / den if den > 0 else None


# ── Load & Parse Match Data ──
print("Loading match data...")
raw_matches = []
with open('data/raw/fks_2026_raw_responses.jsonl', 'r') as f:
    for line in f:
        raw_matches.append(json.loads(line))

print(f"Loaded {len(raw_matches)} matches")


# ── Classify and filter matches ──
class MatchData:
    """Parsed match with computed stats."""
    pass


valid_matches = []
excluded_matches = []

for m in raw_matches:
    mi = m['matchInfo']
    dt = datetime.datetime.fromtimestamp(mi['gameStartMillis'] / 1000, tz=datetime.timezone.utc)
    map_name = mi['map'].split('/')[-1]

    # Identify FKS team
    fks_team_id = None
    opp_team_id = None
    opp_tag = None
    fks_players = []
    opp_players = []

    for p in m['players']:
        if p.get('isObserver'):
            continue
        name = p.get('gameName', '')
        tag = name.split(' ')[0] if ' ' in name else name
        if tag == FOKUS_TAG:
            fks_team_id = p['teamId']
            fks_players.append(p)
        else:
            if opp_tag is None and tag:
                opp_tag = tag
            opp_players.append(p)

    if fks_team_id is None:
        continue

    opp_team_id = 'Blue' if fks_team_id == 'Red' else 'Red'

    # Scores
    fks_score = opp_score = 0
    for t in m['teams']:
        if t['teamId'] == fks_team_id:
            fks_score = t['roundsWon']
        else:
            opp_score = t['roundsWon']

    # Tech issue check
    is_tech = max(fks_score, opp_score) < 13

    md = MatchData()
    md.match_id = mi['matchId']
    md.map = map_name
    md.date = dt.strftime('%Y-%m-%d')
    md.dt = dt
    md.fks_team_id = fks_team_id
    md.opp_team_id = opp_team_id
    md.fks_score = fks_score
    md.opp_score = opp_score
    md.opp = opp_tag or '???'
    md.fks_won = fks_score > opp_score
    md.fks_players = fks_players
    md.opp_players = opp_players
    md.round_results = m['roundResults']
    md.raw = m

    if is_tech:
        excluded_matches.append(md)
    else:
        valid_matches.append(md)

print(f"Valid: {len(valid_matches)}, Excluded: {len(excluded_matches)}")


# ── Determine attack/defense sides ──
# In Valorant, the team that starts on attack is determined by the first round.
# roundResults[0].winningTeam tells us the winner of round 1, but we need
# to figure out which side FKS started on. We can use the convention:
# In standard maps, the team with teamId that matches the attacking team in round 0.
# Actually, we can infer from the roundResultCode or just assume:
# Rounds 0-11 = first half, 12-23 = second half (OT follows different pattern)
# The team on attack first half is typically the team listed as the "attacker" side.
# We can check the bombPlanter field: if an FKS player planted in early rounds, FKS started attack.

def get_fks_side_per_round(md):
    """Return dict: round_num -> 'atk' or 'def' for FKS."""
    fks_puuids = {p['puuid'] for p in md.fks_players}
    sides = {}
    total_rounds = len(md.round_results)

    # Check who planted in first few rounds to determine starting side
    fks_started_atk = None
    for rr in md.round_results:
        rnum = rr['roundNum']
        if rnum >= 12:
            break
        planter = rr.get('bombPlanter')
        if planter:
            if planter in fks_puuids:
                fks_started_atk = True
            else:
                fks_started_atk = False
            break

    if fks_started_atk is None:
        # No plant found in first half - check second half
        for rr in md.round_results:
            rnum = rr['roundNum']
            if rnum < 12:
                continue
            planter = rr.get('bombPlanter')
            if planter:
                if planter in fks_puuids:
                    fks_started_atk = False  # Planted in 2nd half means started DEF
                else:
                    fks_started_atk = True
                break

    if fks_started_atk is None:
        fks_started_atk = True  # Default assumption

    for rr in md.round_results:
        rnum = rr['roundNum']
        # Rounds 0-11: first half
        # Rounds 12-23: second half (sides swap)
        # OT: rounds 24-25 (MR1), 26-27, etc. - sides alternate every 2 rounds
        if rnum < 12:
            sides[rnum] = 'atk' if fks_started_atk else 'def'
        elif rnum < 24:
            sides[rnum] = 'def' if fks_started_atk else 'atk'
        else:
            # Overtime: alternates every 2 rounds starting from the starting side
            ot_round = rnum - 24
            ot_pair = ot_round // 2
            if ot_pair % 2 == 0:
                sides[rnum] = 'atk' if fks_started_atk else 'def'
            else:
                sides[rnum] = 'def' if fks_started_atk else 'atk'
    return sides


# ── Round Economy Classification ──
def classify_round_economy(rr, round_num, fks_puuids, fks_team_id):
    """Classify round as pistol/antieco/gun/eco/force for FKS."""
    if round_num == 0 or round_num == 12:
        return 'pistol'
    if round_num == 1 or round_num == 13:
        return 'antieco'

    # Calculate FKS team total loadout
    total_loadout = 0
    count = 0
    for ps in rr.get('playerStats', []):
        if ps['puuid'] in fks_puuids:
            total_loadout += ps.get('economy', {}).get('loadoutValue', 0)
            count += 1

    if count == 0:
        return 'gun'

    if total_loadout > 20000:
        return 'gun'
    elif total_loadout < 5000:
        return 'eco'
    elif total_loadout < 10000:
        return 'force'
    else:
        return 'gun'


# ── Compute Per-Map Stats ──
print("Computing stats...")

# Map stats structure
map_stats = {}
for map_name in MAP_ORDER:
    map_stats[map_name] = {
        'plays': 0, 'wins': 0, 'losses': 0,
        'comps': [],  # list of agent compositions
        'rounds': {'all': {'w': 0, 't': 0, 'aw': 0, 'at': 0, 'dw': 0, 'dt': 0},
                    'pistol': {'w': 0, 't': 0, 'aw': 0, 'at': 0, 'dw': 0, 'dt': 0},
                    'gun': {'w': 0, 't': 0, 'aw': 0, 'at': 0, 'dw': 0, 'dt': 0},
                    'antieco': {'w': 0, 't': 0, 'aw': 0, 'at': 0, 'dw': 0, 'dt': 0},
                    'eco': {'w': 0, 't': 0, 'aw': 0, 'at': 0, 'dw': 0, 'dt': 0}},
        'post_plant': {'scenarios': 0, 't_rounds': 0, 'wins': 0},
        'retake': {'scenarios': 0, 'ct_rounds': 0, 'wins': 0},
    }

# Player stats accumulators
player_stats = defaultdict(lambda: {
    'name': '', 'agents': set(), 'rounds': 0,
    'kills': 0, 'deaths': 0, 'assists': 0, 'score': 0,
    'first_kills': 0, 'first_deaths': 0,
    'operator_kills': 0, 'total_kills_for_awp': 0,
    'clutch_wins': 0, 'clutch_attempts': 0,
    'kast_rounds': 0,  # rounds with kill/assist/survive/trade
    'maps_played': 0,
})

# XvY stats
xvy_stats = {i: {'wins': 0, 'total': 0} for i in range(1, 6)}  # 1v1..5v5

for md in valid_matches:
    map_name = md.map
    if map_name not in map_stats:
        continue

    ms = map_stats[map_name]
    ms['plays'] += 1
    if md.fks_won:
        ms['wins'] += 1
    else:
        ms['losses'] += 1

    fks_puuids = {p['puuid'] for p in md.fks_players}
    sides = get_fks_side_per_round(md)

    # Composition
    comp = sorted([AGENT_MAP.get(p['characterId'], '?') for p in md.fks_players])
    ms['comps'].append(comp)

    # Per-round analysis
    round_first_kill = {}  # round_num -> (killer_puuid, victim_puuid)
    round_survivors = {}  # round_num -> set of surviving puuids

    for rr in md.round_results:
        rnum = rr['roundNum']
        fks_side = sides.get(rnum, 'atk')
        won = rr['winningTeam'] == md.fks_team_id

        # Economy classification
        econ = classify_round_economy(rr, rnum, fks_puuids, md.fks_team_id)

        # Count round in all categories
        for cat in ['all', econ]:
            if cat not in ms['rounds']:
                continue
            ms['rounds'][cat]['t'] += 1
            if won:
                ms['rounds'][cat]['w'] += 1
            if fks_side == 'atk':
                ms['rounds'][cat]['at'] += 1
                if won:
                    ms['rounds'][cat]['aw'] += 1
            else:
                ms['rounds'][cat]['dt'] += 1
                if won:
                    ms['rounds'][cat]['dw'] += 1

        # Post-plant / Retake
        planter = rr.get('bombPlanter')
        if planter:
            if planter in fks_puuids:
                # FKS planted = post-plant situation
                ms['post_plant']['scenarios'] += 1
                if fks_side == 'atk':
                    ms['post_plant']['t_rounds'] += 1
                if won:
                    ms['post_plant']['wins'] += 1
            else:
                # Opponent planted = retake situation
                ms['retake']['scenarios'] += 1
                if fks_side == 'def':
                    ms['retake']['ct_rounds'] += 1
                if won:
                    ms['retake']['wins'] += 1

        # First kill/death per round
        all_kills_in_round = []
        for ps in rr.get('playerStats', []):
            for k in ps.get('kills', []):
                all_kills_in_round.append(k)

        all_kills_in_round.sort(key=lambda k: k.get('timeSinceRoundStartMillis', 999999))

        first_kill_puuid = None
        first_death_puuid = None
        if all_kills_in_round:
            fk = all_kills_in_round[0]
            first_kill_puuid = fk['killer']
            first_death_puuid = fk['victim']

        # Track per-player stats
        # First determine who survived
        all_victims = set()
        for ps in rr.get('playerStats', []):
            for k in ps.get('kills', []):
                all_victims.add(k['victim'])

        all_player_puuids = set()
        for ps in rr.get('playerStats', []):
            all_player_puuids.add(ps['puuid'])

        survivors = all_player_puuids - all_victims

        # Track traded deaths (killed within 5s of getting a kill or being killed)
        kill_times = {}
        for ps in rr.get('playerStats', []):
            for k in ps.get('kills', []):
                t = k.get('timeSinceRoundStartMillis', 0)
                victim = k['victim']
                killer = k['killer']
                if victim not in kill_times:
                    kill_times[victim] = {'death_time': t, 'killer': killer}

        for ps in rr.get('playerStats', []):
            puuid = ps['puuid']
            if puuid not in fks_puuids:
                continue

            pname = ''
            for p in md.fks_players:
                if p['puuid'] == puuid:
                    pname = p['gameName'].replace(f'{FOKUS_TAG} ', '')
                    break

            pstats = player_stats[puuid]
            pstats['name'] = pname
            pstats['rounds'] += 1

            # Agents
            for p in md.fks_players:
                if p['puuid'] == puuid:
                    agent = AGENT_MAP.get(p['characterId'], '?')
                    pstats['agents'].add(agent)

            # K/D/A
            kills = ps.get('kills', [])
            pstats['kills'] += len(kills)
            pstats['score'] += ps.get('score', 0)

            # Count deaths
            is_dead = puuid in all_victims
            if is_dead:
                pstats['deaths'] += 1

            # Assists - count from damage dealt to victims killed by teammates
            assists = 0
            for k in all_kills_in_round:
                if k['killer'] != puuid and puuid in k.get('assistants', []):
                    assists += 1
            pstats['assists'] += assists

            # First kill/death
            if first_kill_puuid == puuid:
                pstats['first_kills'] += 1
            if first_death_puuid == puuid:
                pstats['first_deaths'] += 1

            # Operator kills
            for k in kills:
                pstats['total_kills_for_awp'] += 1
                if k.get('finishingDamage', {}).get('damageItem', '').upper() == OPERATOR_UUID:
                    pstats['operator_kills'] += 1

            # KAST: Kill, Assist, Survived, or Traded
            has_kill = len(kills) > 0
            has_assist = assists > 0
            survived = puuid in survivors
            # Traded: died but teammate got the killer within 5s
            traded = False
            if is_dead and puuid in kill_times:
                death_time = kill_times[puuid]['death_time']
                my_killer = kill_times[puuid]['killer']
                # Check if my killer was killed within 5000ms of my death
                if my_killer in kill_times:
                    killer_death_time = kill_times[my_killer]['death_time']
                    if killer_death_time - death_time <= 5000 and killer_death_time >= death_time:
                        traded = True

            if has_kill or has_assist or survived or traded:
                pstats['kast_rounds'] += 1

        # XvY situations - track man-advantage situations when round ends
        # Count alive players on each side at each kill
        fks_alive = {p for p in fks_puuids if p in all_player_puuids}
        opp_alive = {p for p in all_player_puuids - fks_puuids}

        # Process kills in order to find XvY moments
        kills_ordered = sorted(all_kills_in_round, key=lambda k: k.get('timeSinceRoundStartMillis', 0))
        for k in kills_ordered:
            victim = k['victim']
            if victim in fks_alive:
                fks_alive.discard(victim)
            elif victim in opp_alive:
                opp_alive.discard(victim)

        # At end of round, what was the man count?
        # Actually XvY = situations where the round was decided in an X vs Y
        # Let's track 1vX clutch situations
        fks_alive_reset = {p for p in fks_puuids if p in all_player_puuids}
        opp_alive_reset = {p for p in all_player_puuids - fks_puuids}
        min_fks = len(fks_alive_reset)
        min_opp = len(opp_alive_reset)

        fks_alive_track = set(fks_alive_reset)
        opp_alive_track = set(opp_alive_reset)

        for k in kills_ordered:
            victim = k['victim']
            if victim in fks_alive_track:
                fks_alive_track.discard(victim)
            elif victim in opp_alive_track:
                opp_alive_track.discard(victim)

            f_count = len(fks_alive_track)
            o_count = len(opp_alive_track)

            # Track XvY: when equal numbers face off
            if f_count == o_count and 1 <= f_count <= 5:
                xvy_stats[f_count]['total'] += 1
                if won:
                    xvy_stats[f_count]['wins'] += 1
                break  # Only count once per round

    # Update maps played per player
    for p in md.fks_players:
        player_stats[p['puuid']]['maps_played'] += 1

    # Clutch tracking: 1vX situations
    for rr in md.round_results:
        all_kills_in_round = []
        for ps in rr.get('playerStats', []):
            for k in ps.get('kills', []):
                all_kills_in_round.append(k)
        all_kills_in_round.sort(key=lambda k: k.get('timeSinceRoundStartMillis', 0))

        all_ps_puuids = {ps['puuid'] for ps in rr.get('playerStats', [])}
        fks_a = {p for p in fks_puuids if p in all_ps_puuids}
        opp_a = {p for p in all_ps_puuids - fks_puuids}

        fks_track = set(fks_a)
        opp_track = set(opp_a)
        won = rr['winningTeam'] == md.fks_team_id

        clutch_player = None
        for k in all_kills_in_round:
            victim = k['victim']
            if victim in fks_track:
                fks_track.discard(victim)
            elif victim in opp_track:
                opp_track.discard(victim)

            # 1vX situation for FKS
            if len(fks_track) == 1 and len(opp_track) >= 1:
                clutch_player = list(fks_track)[0]
                if clutch_player in fks_puuids:
                    player_stats[clutch_player]['clutch_attempts'] += 1
                    if won:
                        player_stats[clutch_player]['clutch_wins'] += 1
                break


# ── Build Workbook ──
print("Building spreadsheet...")
wb = Workbook()


def style_cell(ws, row, col, value, font=WHITE_FONT, fill=ROW_BG, alignment=None, num_fmt=None):
    cell = ws.cell(row=row, column=col, value=value)
    cell.font = font
    cell.fill = fill
    cell.border = THIN_BORDER
    if alignment:
        cell.alignment = alignment
    if num_fmt:
        cell.number_format = num_fmt
    return cell


def write_pct(ws, row, col, num, den, fill=ROW_BG, neutral=0.5):
    val = safe_pct(num, den)
    if val is not None:
        cell = style_cell(ws, row, col, val, font=pct_font(val, neutral), fill=fill)
        cell.number_format = '0.0%'
    else:
        style_cell(ws, row, col, '', fill=fill)


# ══════ TEAM VIEW SHEET ══════
ws = wb.active
ws.title = 'Team View'
ws.sheet_properties.tabColor = '1a1a2e'

# Set dark background for entire visible area
for row in range(1, 45):
    for col in range(1, 42):
        cell = ws.cell(row=row, column=col)
        cell.fill = DARK_BG
        cell.font = WHITE_FONT

# Title
ws.merge_cells('C2:H2')
style_cell(ws, 2, 3, 'Team', font=Font(color='888888', size=10, name='Calibri'), fill=DARK_BG)
ws.merge_cells('C3:H3')
style_cell(ws, 3, 3, 'FOKUS', font=TITLE_FONT, fill=DARK_BG)

# ── Team Statistics Headers ──
hdr_row = 5
# Main section headers
sections = [
    ('C', 'H', 'Team Statistics'),
    ('I', 'I', 'Map'),
    ('J', 'L', 'All Rounds'),
    ('M', 'O', 'Pistols'),
    ('P', 'R', 'Gun'),
    ('S', 'U', 'Anti Eco'),
    ('V', 'X', 'Eco'),
]

center = Alignment(horizontal='center', vertical='center')

# Row 5: Section headers
for start_col_letter, end_col_letter, label in sections:
    start_col = ord(start_col_letter) - ord('A') + 1
    end_col = ord(end_col_letter) - ord('A') + 1
    if start_col != end_col:
        ws.merge_cells(start_row=hdr_row, start_column=start_col, end_row=hdr_row, end_column=end_col)
    style_cell(ws, hdr_row, start_col, label, font=HEADER_FONT, fill=HEADER_BG, alignment=center)

# Post-plant headers
pp_start = 30  # Column AD
style_cell(ws, hdr_row, pp_start, 'Post Plant', font=HEADER_FONT, fill=HEADER_BG, alignment=center)
ws.merge_cells(start_row=hdr_row, start_column=pp_start, end_row=hdr_row, end_column=pp_start + 5)
rt_start = pp_start + 6
style_cell(ws, hdr_row, rt_start, 'Retake', font=HEADER_FONT, fill=HEADER_BG, alignment=center)
ws.merge_cells(start_row=hdr_row, start_column=rt_start, end_row=hdr_row, end_column=rt_start + 5)

# Row 6: Sub-headers
sub_row = 6
sub_headers_team = ['Maps', 'Comp', '', '', '', '', '']
for i, h in enumerate(sub_headers_team):
    style_cell(ws, sub_row, 3 + i, h, font=HEADER_FONT, fill=SUBHEADER_BG, alignment=center)

# Map column
style_cell(ws, sub_row, 9, 'x', font=HEADER_FONT, fill=SUBHEADER_BG, alignment=center)

# Round stat sub-headers (repeated for each category)
round_sub = ['rW%', 'aW%', 'dW%']
col = 10
for _ in range(5):  # All, Pistol, Gun, AntiEco, Eco
    for h in round_sub:
        style_cell(ws, sub_row, col, h, font=HEADER_FONT, fill=SUBHEADER_BG, alignment=center)
        ws.column_dimensions[get_column_letter(col)].width = 7
        col += 1

# Sub-headers row extras
style_cell(ws, sub_row, 10, 'Plays', font=HEADER_FONT, fill=SUBHEADER_BG, alignment=center)
style_cell(ws, sub_row, 11, 'Win', font=HEADER_FONT, fill=SUBHEADER_BG, alignment=center)
style_cell(ws, sub_row, 12, 'Loss', font=HEADER_FONT, fill=SUBHEADER_BG, alignment=center)

# Actually let me redo the sub-header row properly
# Columns: C=Maps, D-H=Comp(agents), I=x(plays), then stats
sub_row = 6
col_labels = {
    3: 'Maps', 4: 'Comp', 9: 'x',
    10: 'Plays', 11: 'Win', 12: 'Loss',
    13: 'rW%', 14: 'aW%', 15: 'dW%',  # All Rounds
    16: 'rW%', 17: 'aW%', 18: 'dW%',  # Pistols
    19: 'rW%', 20: 'aW%', 21: 'dW%',  # Gun
    22: 'rW%', 23: 'aW%', 24: 'dW%',  # Anti Eco
    25: 'rW%', 26: 'aW%', 27: 'dW%',  # Eco
}

for col, label in col_labels.items():
    style_cell(ws, sub_row, col, label, font=HEADER_FONT, fill=SUBHEADER_BG, alignment=center)

# Post-plant sub-headers
pp_sub = ['Map', 'scens', 't rounds', '/Map', 'rW%', 'rank']
for i, h in enumerate(pp_sub):
    style_cell(ws, sub_row, pp_start + i, h, font=HEADER_FONT, fill=SUBHEADER_BG, alignment=center)
    ws.column_dimensions[get_column_letter(pp_start + i)].width = 8

rt_sub = ['scens', 'ct rounds', '/Map', 'rW%', 'rank']
# Add map column before retake
style_cell(ws, sub_row, rt_start, 'scens', font=HEADER_FONT, fill=SUBHEADER_BG, alignment=center)
for i, h in enumerate(rt_sub):
    style_cell(ws, sub_row, rt_start + i, h, font=HEADER_FONT, fill=SUBHEADER_BG, alignment=center)
    ws.column_dimensions[get_column_letter(rt_start + i)].width = 8

# ── Data Rows (per map) ──
data_row = 7
for map_idx, map_name in enumerate(MAP_ORDER):
    ms = map_stats[map_name]
    row = data_row + map_idx
    fill = ROW_BG if map_idx % 2 == 0 else ALT_ROW_BG

    # Map name
    style_cell(ws, row, 3, map_name, font=WHITE_FONT, fill=fill)

    # Composition (most common)
    if ms['comps']:
        comp_counter = Counter(tuple(c) for c in ms['comps'])
        most_common = comp_counter.most_common(1)[0][0]
        comp_str = ', '.join(most_common)
        style_cell(ws, row, 4, comp_str, font=Font(color='AAAAAA', size=9, name='Calibri'), fill=fill)
        ws.merge_cells(start_row=row, start_column=4, end_row=row, end_column=8)

        # Try to add agent icons
        for agent_idx, agent_name in enumerate(most_common):
            icon_name = agent_name.replace('/', '')  # KAY/O -> KAYO
            icon_path = os.path.join(ICON_DIR, f'{icon_name}.png')
            if os.path.exists(icon_path):
                try:
                    img = XlImage(icon_path)
                    img.width = 18
                    img.height = 18
                    cell_ref = f'{get_column_letter(4 + agent_idx)}{row}'
                    ws.add_image(img, cell_ref)
                except Exception:
                    pass

    # Plays (x)
    style_cell(ws, row, 9, ms['plays'] if ms['plays'] > 0 else '', font=WHITE_FONT, fill=fill, alignment=center)

    if ms['plays'] > 0:
        r = ms['rounds']
        # Plays, Win, Loss (map level, not rounds)
        style_cell(ws, row, 10, ms['plays'], font=WHITE_FONT, fill=fill, alignment=center)
        style_cell(ws, row, 11, ms['wins'], font=WHITE_FONT, fill=fill, alignment=center)
        style_cell(ws, row, 12, ms['losses'], font=WHITE_FONT, fill=fill, alignment=center)

        # All rounds rW%/aW%/dW%
        write_pct(ws, row, 13, r['all']['w'], r['all']['t'], fill)
        write_pct(ws, row, 14, r['all']['aw'], r['all']['at'], fill)
        write_pct(ws, row, 15, r['all']['dw'], r['all']['dt'], fill)

        # Pistol
        write_pct(ws, row, 16, r['pistol']['w'], r['pistol']['t'], fill)
        write_pct(ws, row, 17, r['pistol']['aw'], r['pistol']['at'], fill)
        write_pct(ws, row, 18, r['pistol']['dw'], r['pistol']['dt'], fill)

        # Gun
        write_pct(ws, row, 19, r['gun']['w'], r['gun']['t'], fill)
        write_pct(ws, row, 20, r['gun']['aw'], r['gun']['at'], fill)
        write_pct(ws, row, 21, r['gun']['dw'], r['gun']['dt'], fill)

        # Anti Eco
        write_pct(ws, row, 22, r['antieco']['w'], r['antieco']['t'], fill)
        write_pct(ws, row, 23, r['antieco']['aw'], r['antieco']['at'], fill)
        write_pct(ws, row, 24, r['antieco']['dw'], r['antieco']['dt'], fill)

        # Eco
        write_pct(ws, row, 25, r['eco']['w'], r['eco']['t'], fill)
        write_pct(ws, row, 26, r['eco']['aw'], r['eco']['at'], fill)
        write_pct(ws, row, 27, r['eco']['dw'], r['eco']['dt'], fill)

        # Post-plant
        pp = ms['post_plant']
        style_cell(ws, row, pp_start, map_name, font=WHITE_FONT, fill=fill)
        style_cell(ws, row, pp_start + 1, pp['scenarios'], font=WHITE_FONT, fill=fill, alignment=center)
        style_cell(ws, row, pp_start + 2, pp['t_rounds'], font=WHITE_FONT, fill=fill, alignment=center)
        pp_per_map = pp['scenarios'] / ms['plays'] if ms['plays'] > 0 else 0
        style_cell(ws, row, pp_start + 3, round(pp_per_map, 2), font=WHITE_FONT, fill=fill, alignment=center)
        write_pct(ws, row, pp_start + 4, pp['wins'], pp['scenarios'], fill)
        style_cell(ws, row, pp_start + 5, '', font=WHITE_FONT, fill=fill, alignment=center)  # rank placeholder

        # Retake
        rt = ms['retake']
        style_cell(ws, row, rt_start, rt['scenarios'], font=WHITE_FONT, fill=fill, alignment=center)
        style_cell(ws, row, rt_start + 1, rt['ct_rounds'], font=WHITE_FONT, fill=fill, alignment=center)
        rt_per_map = rt['scenarios'] / ms['plays'] if ms['plays'] > 0 else 0
        style_cell(ws, row, rt_start + 2, round(rt_per_map, 2), font=WHITE_FONT, fill=fill, alignment=center)
        write_pct(ws, row, rt_start + 3, rt['wins'], rt['scenarios'], fill)
        style_cell(ws, row, rt_start + 4, '', font=WHITE_FONT, fill=fill, alignment=center)  # rank placeholder
    else:
        for c in range(10, 28):
            style_cell(ws, row, c, '', fill=fill)

# ── All Maps Row ──
all_row = data_row + len(MAP_ORDER)
fill = ALLMAP_BG
style_cell(ws, all_row, 3, 'All Maps', font=HEADER_FONT, fill=fill)
ws.merge_cells(start_row=all_row, start_column=3, end_row=all_row, end_column=8)

total_plays = sum(ms['plays'] for ms in map_stats.values())
total_wins = sum(ms['wins'] for ms in map_stats.values())
style_cell(ws, all_row, 9, total_plays, font=HEADER_FONT, fill=fill, alignment=center)

# Aggregate all rounds
totals = {}
for cat in ['all', 'pistol', 'gun', 'antieco', 'eco']:
    totals[cat] = {'w': 0, 't': 0, 'aw': 0, 'at': 0, 'dw': 0, 'dt': 0}
    for ms in map_stats.values():
        for k in totals[cat]:
            totals[cat][k] += ms['rounds'][cat][k]

style_cell(ws, all_row, 10, total_plays, font=HEADER_FONT, fill=fill, alignment=center)
style_cell(ws, all_row, 11, total_wins, font=HEADER_FONT, fill=fill, alignment=center)
style_cell(ws, all_row, 12, total_plays - total_wins, font=HEADER_FONT, fill=fill, alignment=center)

col = 13
for cat in ['all', 'pistol', 'gun', 'antieco', 'eco']:
    write_pct(ws, all_row, col, totals[cat]['w'], totals[cat]['t'], fill)
    write_pct(ws, all_row, col + 1, totals[cat]['aw'], totals[cat]['at'], fill)
    write_pct(ws, all_row, col + 2, totals[cat]['dw'], totals[cat]['dt'], fill)
    col += 3

# All maps post-plant/retake totals
total_pp = {'scenarios': 0, 't_rounds': 0, 'wins': 0}
total_rt = {'scenarios': 0, 'ct_rounds': 0, 'wins': 0}
for ms in map_stats.values():
    for k in total_pp:
        total_pp[k] += ms['post_plant'][k]
    for k in total_rt:
        total_rt[k] += ms['retake'][k]

style_cell(ws, all_row, pp_start, 'All Maps', font=HEADER_FONT, fill=fill)
style_cell(ws, all_row, pp_start + 1, total_pp['scenarios'], font=HEADER_FONT, fill=fill, alignment=center)
style_cell(ws, all_row, pp_start + 2, total_pp['t_rounds'], font=HEADER_FONT, fill=fill, alignment=center)
pp_per = total_pp['scenarios'] / total_plays if total_plays > 0 else 0
style_cell(ws, all_row, pp_start + 3, round(pp_per, 2), font=HEADER_FONT, fill=fill, alignment=center)
write_pct(ws, all_row, pp_start + 4, total_pp['wins'], total_pp['scenarios'], fill)

style_cell(ws, all_row, rt_start, total_rt['scenarios'], font=HEADER_FONT, fill=fill, alignment=center)
style_cell(ws, all_row, rt_start + 1, total_rt['ct_rounds'], font=HEADER_FONT, fill=fill, alignment=center)
rt_per = total_rt['scenarios'] / total_plays if total_plays > 0 else 0
style_cell(ws, all_row, rt_start + 2, round(rt_per, 2), font=HEADER_FONT, fill=fill, alignment=center)
write_pct(ws, all_row, rt_start + 3, total_rt['wins'], total_rt['scenarios'], fill)

# ══════ PLAYER STATS SECTION ══════
ps_start_row = all_row + 3
style_cell(ws, ps_start_row, 3, 'Statistics Per Player', font=HEADER_FONT, fill=HEADER_BG)
ws.merge_cells(start_row=ps_start_row, start_column=3, end_row=ps_start_row, end_column=15)

# XvY headers
xvy_col = 17
style_cell(ws, ps_start_row, xvy_col, 'Team XvY', font=HEADER_FONT, fill=HEADER_BG, alignment=center)
ws.merge_cells(start_row=ps_start_row, start_column=xvy_col, end_row=ps_start_row, end_column=xvy_col + 5)

# Player sub-headers
ps_sub_row = ps_start_row + 1
player_headers = ['Players', 'Agents', '', '', '', '', 'r', 'K/D', 'KA/D', 'KAST', 'fk/r', 'fd/r', 'fk/fd', 'CL%', 'AWP%']
for i, h in enumerate(player_headers):
    style_cell(ws, ps_sub_row, 3 + i, h, font=HEADER_FONT, fill=SUBHEADER_BG, alignment=center)

# XvY sub-headers
xvy_sub = ['X v Y', '5', '4', '3', '2', '1']
for i, h in enumerate(xvy_sub):
    style_cell(ws, ps_sub_row, xvy_col + i, h, font=HEADER_FONT, fill=SUBHEADER_BG, alignment=center)

# Sort players by K/D ratio (descending)
sorted_players = sorted(
    [(puuid, ps) for puuid, ps in player_stats.items()],
    key=lambda x: x[1]['kills'] / max(x[1]['deaths'], 1),
    reverse=True
)

for p_idx, (puuid, ps) in enumerate(sorted_players):
    row = ps_sub_row + 1 + p_idx
    fill = ROW_BG if p_idx % 2 == 0 else ALT_ROW_BG

    style_cell(ws, row, 3, ps['name'], font=WHITE_FONT, fill=fill)

    # Agents (as comma-separated text)
    agents_str = ', '.join(sorted(ps['agents']))
    style_cell(ws, row, 4, agents_str, font=Font(color='AAAAAA', size=9, name='Calibri'), fill=fill)
    ws.merge_cells(start_row=row, start_column=4, end_row=row, end_column=8)

    # Rounds
    style_cell(ws, row, 9, ps['rounds'], font=WHITE_FONT, fill=fill, alignment=center)

    # K/D
    kd = ps['kills'] / max(ps['deaths'], 1)
    style_cell(ws, row, 10, round(kd, 2), font=pct_font(kd, 1.0), fill=fill, alignment=center)

    # KA/D
    kad = (ps['kills'] + ps['assists']) / max(ps['deaths'], 1)
    style_cell(ws, row, 11, round(kad, 2), font=pct_font(kad, 1.0), fill=fill, alignment=center)

    # KAST
    kast = safe_pct(ps['kast_rounds'], ps['rounds'])
    if kast is not None:
        cell = style_cell(ws, row, 12, kast, font=pct_font(kast, 0.7), fill=fill, alignment=center)
        cell.number_format = '0%'

    # fk/r
    fkr = ps['first_kills'] / max(ps['rounds'], 1)
    style_cell(ws, row, 13, round(fkr, 2), font=WHITE_FONT, fill=fill, alignment=center)

    # fd/r
    fdr = ps['first_deaths'] / max(ps['rounds'], 1)
    style_cell(ws, row, 14, round(fdr, 2), font=WHITE_FONT, fill=fill, alignment=center)

    # fk/fd
    fkfd = ps['first_kills'] / max(ps['first_deaths'], 1)
    fkfd_pct = safe_pct(ps['first_kills'], ps['first_kills'] + ps['first_deaths'])
    style_cell(ws, row, 15, f"{int(fkfd_pct * 100)}%" if fkfd_pct is not None else '',
               font=pct_font(fkfd_pct, 0.5) if fkfd_pct else WHITE_FONT, fill=fill, alignment=center)

    # CL%
    cl_pct = safe_pct(ps['clutch_wins'], ps['clutch_attempts'])
    cell = style_cell(ws, row, 16, cl_pct if cl_pct is not None else '',
                       font=pct_font(cl_pct, 0.3) if cl_pct else WHITE_FONT, fill=fill, alignment=center)
    if cl_pct is not None:
        cell.number_format = '0.0%'

    # AWP%
    awp_pct = safe_pct(ps['operator_kills'], ps['total_kills_for_awp'])
    cell = style_cell(ws, row, 17, awp_pct if awp_pct is not None else '',
                       font=WHITE_FONT, fill=fill, alignment=center)
    if awp_pct is not None:
        cell.number_format = '0.0%'

# XvY data row (team-level, written next to first player)
xvy_data_row = ps_sub_row + 1
for x in range(5, 0, -1):
    row_offset = 5 - x
    row = xvy_data_row + row_offset
    fill = ROW_BG if row_offset % 2 == 0 else ALT_ROW_BG
    style_cell(ws, row, xvy_col, str(x), font=HEADER_FONT, fill=fill, alignment=center)
    xvy_val = safe_pct(xvy_stats[x]['wins'], xvy_stats[x]['total'])
    if xvy_val is not None:
        cell = style_cell(ws, row, xvy_col + 1, xvy_val, font=pct_font(xvy_val), fill=fill, alignment=center)
        cell.number_format = '0.0%'
    style_cell(ws, row, xvy_col + 2, xvy_stats[x]['total'], font=WHITE_FONT, fill=fill, alignment=center)

# ── Column widths ──
ws.column_dimensions['A'].width = 2
ws.column_dimensions['B'].width = 2
ws.column_dimensions['C'].width = 12
for c in ['D', 'E', 'F', 'G', 'H']:
    ws.column_dimensions[c].width = 5
ws.column_dimensions['I'].width = 4
for col_num in range(10, 42):
    ws.column_dimensions[get_column_letter(col_num)].width = 7


# ══════ EXCLUDED MATCHES SHEET ══════
ws_ex = wb.create_sheet('Excluded Matches')
for row in range(1, 10):
    for col in range(1, 8):
        ws_ex.cell(row=row, column=col).fill = DARK_BG

style_cell(ws_ex, 1, 1, 'Date', font=HEADER_FONT, fill=HEADER_BG)
style_cell(ws_ex, 1, 2, 'Opponent', font=HEADER_FONT, fill=HEADER_BG)
style_cell(ws_ex, 1, 3, 'Map', font=HEADER_FONT, fill=HEADER_BG)
style_cell(ws_ex, 1, 4, 'FKS Score', font=HEADER_FONT, fill=HEADER_BG)
style_cell(ws_ex, 1, 5, 'Opp Score', font=HEADER_FONT, fill=HEADER_BG)
style_cell(ws_ex, 1, 6, 'Match ID', font=HEADER_FONT, fill=HEADER_BG)
style_cell(ws_ex, 1, 7, 'Reason', font=HEADER_FONT, fill=HEADER_BG)

for i, md in enumerate(sorted(excluded_matches, key=lambda x: x.date)):
    row = 2 + i
    fill = ROW_BG if i % 2 == 0 else ALT_ROW_BG
    style_cell(ws_ex, row, 1, md.date, font=WHITE_FONT, fill=fill)
    style_cell(ws_ex, row, 2, md.opp, font=WHITE_FONT, fill=fill)
    style_cell(ws_ex, row, 3, md.map, font=WHITE_FONT, fill=fill)
    style_cell(ws_ex, row, 4, md.fks_score, font=WHITE_FONT, fill=fill)
    style_cell(ws_ex, row, 5, md.opp_score, font=WHITE_FONT, fill=fill)
    style_cell(ws_ex, row, 6, md.match_id, font=Font(color='666666', size=9, name='Calibri'), fill=fill)
    style_cell(ws_ex, row, 7, 'Tech issue / forfeit', font=Font(color='FF6B6B', size=9, name='Calibri'), fill=fill)

ws_ex.column_dimensions['A'].width = 12
ws_ex.column_dimensions['B'].width = 10
ws_ex.column_dimensions['C'].width = 10
ws_ex.column_dimensions['F'].width = 40
ws_ex.column_dimensions['G'].width = 16


# ══════ INCLUDED MATCHES SHEET ══════
ws_inc = wb.create_sheet('Included Matches')
style_cell(ws_inc, 1, 1, 'Date', font=HEADER_FONT, fill=HEADER_BG)
style_cell(ws_inc, 1, 2, 'Opponent', font=HEADER_FONT, fill=HEADER_BG)
style_cell(ws_inc, 1, 3, 'Map', font=HEADER_FONT, fill=HEADER_BG)
style_cell(ws_inc, 1, 4, 'FKS Score', font=HEADER_FONT, fill=HEADER_BG)
style_cell(ws_inc, 1, 5, 'Opp Score', font=HEADER_FONT, fill=HEADER_BG)
style_cell(ws_inc, 1, 6, 'Result', font=HEADER_FONT, fill=HEADER_BG)
style_cell(ws_inc, 1, 7, 'Match ID', font=HEADER_FONT, fill=HEADER_BG)

for i, md in enumerate(sorted(valid_matches, key=lambda x: x.date)):
    row = 2 + i
    fill = ROW_BG if i % 2 == 0 else ALT_ROW_BG
    style_cell(ws_inc, row, 1, md.date, font=WHITE_FONT, fill=fill)
    style_cell(ws_inc, row, 2, md.opp, font=WHITE_FONT, fill=fill)
    style_cell(ws_inc, row, 3, md.map, font=WHITE_FONT, fill=fill)
    style_cell(ws_inc, row, 4, md.fks_score, font=WHITE_FONT, fill=fill)
    style_cell(ws_inc, row, 5, md.opp_score, font=WHITE_FONT, fill=fill)
    result = 'W' if md.fks_won else 'L'
    result_font = PCT_FONT_GREEN if md.fks_won else PCT_FONT_RED
    style_cell(ws_inc, row, 6, result, font=result_font, fill=fill, alignment=center)
    style_cell(ws_inc, row, 7, md.match_id, font=Font(color='666666', size=9, name='Calibri'), fill=fill)

ws_inc.column_dimensions['A'].width = 12
ws_inc.column_dimensions['B'].width = 10
ws_inc.column_dimensions['C'].width = 10
ws_inc.column_dimensions['G'].width = 40


# ── Save ──
output_path = 'FOKUS_Stats.xlsx'
wb.save(output_path)
print(f"\nSaved to {output_path}")
print(f"Maps: {total_plays} valid ({len(excluded_matches)} excluded)")
print(f"Players: {len(sorted_players)}")
print(f"Total rounds analyzed: {totals['all']['t']}")
