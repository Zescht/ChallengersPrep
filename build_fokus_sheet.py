#!/usr/bin/env python3
"""Build VCL3 Stats spreadsheet with dropdown team selector, matching reference template."""

import json
import datetime
import os
from collections import defaultdict, Counter

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
    from openpyxl.utils import get_column_letter
    from openpyxl.worksheet.datavalidation import DataValidation
except ImportError:
    import subprocess
    subprocess.check_call(['pip', 'install', 'openpyxl'])
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
    from openpyxl.utils import get_column_letter
    from openpyxl.worksheet.datavalidation import DataValidation

# ── Constants ──
OPERATOR_UUID = 'A03B24D3-4319-996D-0F8C-94BBFBA1DFC7'
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

WEAPON_MAP = {
    '29A0CFAB-485B-F5D5-779A-B59F85E204A8': 'Classic',
    '42DA8CCC-40D5-AFFC-BEEC-15AA47B42EDA': 'Shorty',
    '44D4E95C-4157-0037-81B2-17841BF2E8E3': 'Frenzy',
    '1BAA85B4-4C70-1284-64BB-6481DFC3BB4E': 'Ghost',
    'E336C6B8-418D-9340-D77F-7A9E4CFE0702': 'Sheriff',
    'F7E1B454-4AD4-1063-EC0A-159E56B58941': 'Stinger',
    '462080D1-4035-2937-7C09-27AA2A5C27A7': 'Spectre',
    '910BE174-449B-C412-AB22-D0873436B21B': 'Bucky',
    'EC845BF4-4F79-DDDA-A3DA-0DB3774B2794': 'Judge',
    'AE3DE142-4D85-2547-DD26-4E90BED35CF7': 'Bulldog',
    '4ADE7FAA-4CF1-8376-95EF-39884480959B': 'Guardian',
    'EE8E8D15-496B-07AC-E5F6-8FAE5D4C7B1A': 'Phantom',
    '9C82E19D-4575-0200-1A81-3EACF00CF872': 'Vandal',
    'C4883E50-4494-202C-3EC3-6B8A9284F00B': 'Marshal',
    'A03B24D3-4319-996D-0F8C-94BBFBA1DFC7': 'Operator',
    '55D8A0F4-4274-CA67-FE2C-06AB45AC8543': 'Ares',
    '63E6C2B6-4A8E-869C-3D4C-E38355226584': 'Odin',
    '2F59173C-4BED-B6C3-2191-DEE9B58166A2': 'Melee',
}

TEAMS = [
    {'tag': 'FKS',  'name': 'FOKUS',                'data_file': 'data/raw/fks_2026_raw_responses.jsonl'},
    {'tag': 'SGE',  'name': 'Eintracht Frankfurt',  'data_file': 'data/raw/sge_2026_raw_responses.jsonl'},
    {'tag': 'JL',   'name': 'Joblife',              'data_file': 'data/raw/jl_2026_raw_responses.jsonl'},
    {'tag': 'MDR',  'name': 'Mandatory',             'data_file': 'data/raw/mdr_2026_raw_responses.jsonl'},
    {'tag': 'EP',   'name': 'Enterprise Esports',    'data_file': 'data/raw/ep_2026_raw_responses.jsonl'},
    {'tag': 'TL',   'name': 'Team Liquid Academy',   'data_file': 'data/raw/tl_2026_raw_responses.jsonl'},
    {'tag': 'PXL',  'name': 'Pixel Lumina',          'data_file': 'data/raw/pxl_2026_raw_responses.jsonl'},
    {'tag': 'M1R',  'name': 'MIR',                   'data_file': 'data/raw/m1r_2026_raw_responses.jsonl'},
    {'tag': 'BAR',  'name': 'Barça eSports',         'data_file': 'data/raw/bar_2026_raw_responses.jsonl'},
    {'tag': 'UCAM', 'name': 'UCAM Esports',          'data_file': 'data/raw/ucam_2026_raw_responses.jsonl'},
    {'tag': 'MISA', 'name': 'Misa Esports',          'data_file': 'data/raw/misa_2026_raw_responses.jsonl'},
    {'tag': 'S2G',  'name': 'S2G Esports',           'data_file': 'data/raw/s2g_2026_raw_responses.jsonl'},
    {'tag': 'STS',  'name': 'Stallions Esports',     'data_file': 'data/raw/sts_2026_raw_responses.jsonl'},
    {'tag': 'GNG',  'name': 'GnG Amazigh',           'data_file': 'data/raw/gng_2026_raw_responses.jsonl'},
]

TEAM_NAMES = [t['name'] for t in TEAMS]

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
THIN_BORDER = Border(
    left=Side(style='thin', color='333355'),
    right=Side(style='thin', color='333355'),
    top=Side(style='thin', color='333355'),
    bottom=Side(style='thin', color='333355'),
)
CENTER = Alignment(horizontal='center', vertical='center')


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


def safe_pct(num, den):
    return num / den if den > 0 else None


# ══════════════════════════════════════════════════
# DATA PROCESSING
# ══════════════════════════════════════════════════

class MatchData:
    pass


def get_team_side_per_round(md, team_puuids):
    """Return dict: round_num -> 'atk' or 'def' for the team."""
    sides = {}
    team_started_atk = None
    for rr in md.round_results:
        rnum = rr['roundNum']
        if rnum >= 12:
            break
        planter = rr.get('bombPlanter')
        if planter:
            team_started_atk = planter in team_puuids
            break

    if team_started_atk is None:
        for rr in md.round_results:
            rnum = rr['roundNum']
            if rnum < 12:
                continue
            planter = rr.get('bombPlanter')
            if planter:
                team_started_atk = planter not in team_puuids
                break

    if team_started_atk is None:
        team_started_atk = True

    for rr in md.round_results:
        rnum = rr['roundNum']
        if rnum < 12:
            sides[rnum] = 'atk' if team_started_atk else 'def'
        elif rnum < 24:
            sides[rnum] = 'def' if team_started_atk else 'atk'
        else:
            r24_side = 'def' if team_started_atk else 'atk'
            ot_round = rnum - 24
            if ot_round % 2 == 0:
                sides[rnum] = 'atk' if r24_side == 'def' else 'def'
            else:
                sides[rnum] = r24_side
    return sides


def classify_round_economy(rr, round_num, team_puuids):
    if round_num == 0 or round_num == 12:
        return 'pistol'
    if round_num == 1 or round_num == 13:
        return 'antieco'
    total_loadout = 0
    count = 0
    for ps in rr.get('playerStats', []):
        if ps['puuid'] in team_puuids:
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


def process_team(team_tag, team_name, data_file):
    """Process a team's match data. Returns structured data for all sheets."""
    print(f"  Processing {team_name} ({team_tag})...")
    raw_matches = []
    with open(data_file, 'r') as f:
        for line in f:
            m = json.loads(line)
            if 'matchInfo' in m:
                raw_matches.append(m)

    # ── Parse matches ──
    matches = []
    for m in raw_matches:
        mi = m['matchInfo']
        dt = datetime.datetime.fromtimestamp(mi['gameStartMillis'] / 1000, tz=datetime.timezone.utc)
        map_name = mi['map'].split('/')[-1]

        team_id = None
        opp_tag = None
        team_players = []
        opp_players = []

        for p in m['players']:
            if p.get('isObserver'):
                continue
            name = p.get('gameName', '')
            tag = name.split(' ')[0] if ' ' in name else name
            if tag == team_tag:
                team_id = p['teamId']
                team_players.append(p)
            else:
                if opp_tag is None and tag:
                    opp_tag = tag
                opp_players.append(p)

        if team_id is None:
            continue

        opp_team_id = 'Blue' if team_id == 'Red' else 'Red'
        team_score = opp_score = 0
        for t in m['teams']:
            if t['teamId'] == team_id:
                team_score = t['roundsWon']
            else:
                opp_score = t['roundsWon']

        is_tech = max(team_score, opp_score) < 13

        md = MatchData()
        md.match_id = mi['matchId']
        md.map = map_name
        md.date = dt.strftime('%Y-%m-%d')
        md.dt = dt
        md.team_id = team_id
        md.opp_team_id = opp_team_id
        md.team_score = team_score
        md.opp_score = opp_score
        md.opp = opp_tag or '???'
        md.team_won = team_score > opp_score
        md.team_players = team_players
        md.opp_players = opp_players
        md.round_results = m['roundResults']
        md.raw = m
        md.is_tech = is_tech
        md.team_tag = team_tag
        md.team_name = team_name

        if not is_tech:
            matches.append(md)

    # ── Compute detailed stats per match ──
    match_rows = []       # For doubles/SelectedTeamStats
    round_econ_rows = []  # For ecos/antieco/gun
    xvy_rows = []         # For XvY sheet
    post_plant_rows = []  # For Post Plants sheet
    player_accum = defaultdict(lambda: {
        'name': '', 'team': team_name, 'agents': Counter(), 'rounds': 0,
        'kills': 0, 'deaths': 0, 'assists': 0, 'score': 0,
        'first_kills': 0, 'first_deaths': 0,
        'operator_kills': 0, 'total_kills_for_awp': 0,
        'clutch_wins': 0, 'clutch_attempts': 0,
        'kast_rounds': 0, 'maps_played': 0,
        'weapons': Counter(),
    })

    # Accumulators for round economy per map/side
    econ_accum = defaultdict(lambda: {'w': 0, 'l': 0})  # key: (map, econ_type, side)

    # XvY accumulator
    xvy_accum = defaultdict(lambda: {'wins': 0, 'total': 0})  # key: (team_alive, opp_alive)

    # Post-plant accumulator: key: (map, site, role)  role='atk' for team planted, 'def' for opp planted
    pp_accum = defaultdict(lambda: {'plants': 0, 'wins': 0, 'losses': 0})

    for md in matches:
        team_puuids = {p['puuid'] for p in md.team_players}
        sides = get_team_side_per_round(md, team_puuids)

        # Composition
        comp = sorted([AGENT_MAP.get(p['characterId'], '?') for p in md.team_players])
        opp_comp = sorted([AGENT_MAP.get(p['characterId'], '?') for p in md.opp_players])

        # Half scores: rounds 0-11 = first half
        team_first_half = 0
        opp_first_half = 0
        # Track per-side wins for match row
        atk_wins = atk_losses = def_wins = def_losses = 0
        atk_pistol_wins = def_pistol_wins = 0

        for rr in md.round_results:
            rnum = rr['roundNum']
            team_side = sides.get(rnum, 'atk')
            won = rr['winningTeam'] == md.team_id

            if rnum < 12:
                if won:
                    team_first_half += 1
                else:
                    opp_first_half += 1

            # Atk/def tracking
            if team_side == 'atk':
                if won:
                    atk_wins += 1
                else:
                    atk_losses += 1
            else:
                if won:
                    def_wins += 1
                else:
                    def_losses += 1

            # Pistol tracking
            if rnum == 0 or rnum == 12:
                if won:
                    if team_side == 'atk':
                        atk_pistol_wins += 1
                    else:
                        def_pistol_wins += 1

            # Economy classification
            econ = classify_round_economy(rr, rnum, team_puuids)
            if econ in ('eco', 'antieco', 'gun', 'force'):
                econ_key = econ if econ != 'force' else 'gun'  # merge force into gun
                key = (md.map, econ_key, team_side)
                if won:
                    econ_accum[key]['w'] += 1
                else:
                    econ_accum[key]['l'] += 1

            # Post-plant tracking
            planter = rr.get('bombPlanter')
            if planter:
                site = rr.get('plantSite', '?')
                if planter in team_puuids:
                    pp_key = (md.map, site, 'atk')
                    pp_accum[pp_key]['plants'] += 1
                    if won:
                        pp_accum[pp_key]['wins'] += 1
                    else:
                        pp_accum[pp_key]['losses'] += 1
                else:
                    pp_key = (md.map, site, 'def')
                    pp_accum[pp_key]['plants'] += 1
                    if won:
                        pp_accum[pp_key]['wins'] += 1
                    else:
                        pp_accum[pp_key]['losses'] += 1

            # ── Per-round player stats ──
            all_kills_in_round = []
            for ps in rr.get('playerStats', []):
                for k in ps.get('kills', []):
                    all_kills_in_round.append(k)
            all_kills_in_round.sort(key=lambda k: k.get('timeSinceRoundStartMillis', 999999))

            first_kill_puuid = all_kills_in_round[0]['killer'] if all_kills_in_round else None
            first_death_puuid = all_kills_in_round[0]['victim'] if all_kills_in_round else None

            all_victims = set()
            all_player_puuids = set()
            for ps in rr.get('playerStats', []):
                all_player_puuids.add(ps['puuid'])
                for k in ps.get('kills', []):
                    all_victims.add(k['victim'])
            survivors = all_player_puuids - all_victims

            kill_times = {}
            for ps in rr.get('playerStats', []):
                for k in ps.get('kills', []):
                    victim = k['victim']
                    if victim not in kill_times:
                        kill_times[victim] = {'death_time': k.get('timeSinceRoundStartMillis', 0), 'killer': k['killer']}

            for ps in rr.get('playerStats', []):
                puuid = ps['puuid']
                if puuid not in team_puuids:
                    continue
                pname = ''
                for p in md.team_players:
                    if p['puuid'] == puuid:
                        pname = p['gameName'].replace(f'{team_tag} ', '')
                        break

                pa = player_accum[puuid]
                pa['name'] = pname
                pa['rounds'] += 1

                for p in md.team_players:
                    if p['puuid'] == puuid:
                        agent = AGENT_MAP.get(p['characterId'], '?')
                        pa['agents'][agent] += 1

                kills = ps.get('kills', [])
                pa['kills'] += len(kills)
                pa['score'] += ps.get('score', 0)

                is_dead = puuid in all_victims
                if is_dead:
                    pa['deaths'] += 1

                assists = sum(1 for k in all_kills_in_round if k['killer'] != puuid and puuid in k.get('assistants', []))
                pa['assists'] += assists

                if first_kill_puuid == puuid:
                    pa['first_kills'] += 1
                if first_death_puuid == puuid:
                    pa['first_deaths'] += 1

                for k in kills:
                    pa['total_kills_for_awp'] += 1
                    dmg_item = k.get('finishingDamage', {}).get('damageItem', '').upper()
                    if dmg_item == OPERATOR_UUID:
                        pa['operator_kills'] += 1
                    weapon_name = WEAPON_MAP.get(dmg_item, None)
                    if weapon_name:
                        pa['weapons'][weapon_name] += 1

                # KAST
                has_kill = len(kills) > 0
                has_assist = assists > 0
                survived = puuid in survivors
                traded = False
                if is_dead and puuid in kill_times:
                    dt_ms = kill_times[puuid]['death_time']
                    my_killer = kill_times[puuid]['killer']
                    if my_killer in kill_times:
                        kdt = kill_times[my_killer]['death_time']
                        if 0 <= kdt - dt_ms <= 5000:
                            traded = True
                if has_kill or has_assist or survived or traded:
                    pa['kast_rounds'] += 1

            # XvY
            team_alive = {p for p in team_puuids if p in all_player_puuids}
            opp_alive = {p for p in all_player_puuids - team_puuids}
            seen_states = set()
            fc, oc = len(team_alive), len(opp_alive)
            if 1 <= fc <= 5 and 1 <= oc <= 5:
                seen_states.add((fc, oc))
                xvy_accum[(fc, oc)]['total'] += 1
                if won:
                    xvy_accum[(fc, oc)]['wins'] += 1

            for k in sorted(all_kills_in_round, key=lambda k: k.get('timeSinceRoundStartMillis', 0)):
                v = k['victim']
                if v in team_alive:
                    team_alive.discard(v)
                elif v in opp_alive:
                    opp_alive.discard(v)
                fc, oc = len(team_alive), len(opp_alive)
                if fc == 0 or oc == 0:
                    break
                if 1 <= fc <= 5 and 1 <= oc <= 5 and (fc, oc) not in seen_states:
                    seen_states.add((fc, oc))
                    xvy_accum[(fc, oc)]['total'] += 1
                    if won:
                        xvy_accum[(fc, oc)]['wins'] += 1

        # Clutch tracking (separate pass)
        for rr in md.round_results:
            all_kills_in_round = []
            for ps in rr.get('playerStats', []):
                for k in ps.get('kills', []):
                    all_kills_in_round.append(k)
            all_kills_in_round.sort(key=lambda k: k.get('timeSinceRoundStartMillis', 0))

            all_ps_puuids = {ps['puuid'] for ps in rr.get('playerStats', [])}
            t_track = {p for p in team_puuids if p in all_ps_puuids}
            o_track = {p for p in all_ps_puuids - team_puuids}
            won = rr['winningTeam'] == md.team_id

            for k in all_kills_in_round:
                v = k['victim']
                if v in t_track:
                    t_track.discard(v)
                elif v in o_track:
                    o_track.discard(v)
                if len(t_track) == 1 and len(o_track) >= 1:
                    cp = list(t_track)[0]
                    if cp in team_puuids:
                        player_accum[cp]['clutch_attempts'] += 1
                        if won:
                            player_accum[cp]['clutch_wins'] += 1
                    break

        for p in md.team_players:
            player_accum[p['puuid']]['maps_played'] += 1

        # Build match row (doubles format)
        match_rows.append({
            'match_id': md.match_id,
            'map': md.map,
            'team1': team_name,
            'team2': md.opp,
            'team1_agents': ','.join(comp),
            'team2_agents': ','.join(opp_comp),
            'team1_score': md.team_score,
            'team2_score': md.opp_score,
            'team1_half': team_first_half,
            'team2_half': opp_first_half,
            'team1_atk_pistol': atk_pistol_wins,
            'team1_def_pistol': def_pistol_wins,
            'team1_atk_wins': atk_wins,
            'team1_atk_losses': atk_losses,
            'team1_def_wins': def_wins,
            'team1_def_losses': def_losses,
            'date': md.date,
            'win_team': team_name if md.team_won else md.opp,
        })

    # Build economy rows
    for (map_name, econ_type, side), data in econ_accum.items():
        round_econ_rows.append({
            'team': team_name, 'map': map_name, 'type': econ_type, 'side': side,
            'wins': data['w'], 'losses': data['l'],
            'pct': data['w'] / (data['w'] + data['l']) if (data['w'] + data['l']) > 0 else 0,
        })

    # Build XvY rows
    for (fc, oc), data in xvy_accum.items():
        xvy_rows.append({
            'team': team_name, 'situation': f'{fc}v{oc}',
            'team_alive': fc, 'opp_alive': oc,
            'delta': fc - oc,
            'wins': data['wins'], 'losses': data['total'] - data['wins'],
            'pct': data['wins'] / data['total'] * 100 if data['total'] > 0 else 0,
        })

    # Build post-plant rows
    for (map_name, site, role), data in pp_accum.items():
        post_plant_rows.append({
            'team': team_name, 'map': map_name, 'site': site, 'role': role,
            'plants': data['plants'], 'wins': data['wins'], 'losses': data['losses'],
            'pct': data['wins'] / data['plants'] * 100 if data['plants'] > 0 else 0,
        })

    # Build player rows
    player_rows = []
    for puuid, pa in player_accum.items():
        if pa['rounds'] == 0:
            continue
        player_rows.append({
            'team': team_name,
            'name': pa['name'],
            'rounds': pa['rounds'],
            'kills': pa['kills'],
            'deaths': pa['deaths'],
            'assists': pa['assists'],
            'acs': round(pa['score'] / pa['rounds']) if pa['rounds'] > 0 else 0,
            'fk': pa['first_kills'],
            'fd': pa['first_deaths'],
            'kd': pa['kills'] / max(pa['deaths'], 1),
            'kad': (pa['kills'] + pa['assists']) / max(pa['deaths'], 1),
            'fk_pct': pa['first_kills'] / (pa['first_kills'] + pa['first_deaths']) if (pa['first_kills'] + pa['first_deaths']) > 0 else 0,
            'clutch_wins': pa['clutch_wins'],
            'clutch_attempts': pa['clutch_attempts'],
            'clutch_pct': pa['clutch_wins'] / pa['clutch_attempts'] if pa['clutch_attempts'] > 0 else 0,
            'kast': pa['kast_rounds'] / pa['rounds'] if pa['rounds'] > 0 else 0,
            'op_kills': pa['operator_kills'],
            'op_pct': pa['operator_kills'] / pa['total_kills_for_awp'] if pa['total_kills_for_awp'] > 0 else 0,
            'maps': pa['maps_played'],
            'agents': pa['agents'],
            'weapons': pa['weapons'],
        })

    print(f"    {len(matches)} valid maps, {len(player_rows)} players")

    return {
        'match_rows': match_rows,
        'round_econ_rows': round_econ_rows,
        'xvy_rows': xvy_rows,
        'post_plant_rows': post_plant_rows,
        'player_rows': player_rows,
    }


# ══════════════════════════════════════════════════
# SHEET BUILDERS
# ══════════════════════════════════════════════════

def write_header_row(ws, row, headers, start_col=1):
    for i, h in enumerate(headers):
        style_cell(ws, row, start_col + i, h, font=HEADER_FONT, fill=HEADER_BG, alignment=CENTER)


def write_data_row(ws, row, values, start_col=1):
    fill = ROW_BG if row % 2 == 0 else ALT_ROW_BG
    for i, v in enumerate(values):
        style_cell(ws, row, start_col + i, v, fill=fill)


def build_assets_sheet(wb):
    ws = wb.create_sheet('Assets')
    ws.sheet_properties.tabColor = '333333'
    # Agents
    style_cell(ws, 1, 1, 'Agents', font=HEADER_FONT, fill=HEADER_BG)
    agents_sorted = sorted(AGENT_MAP.values())
    for i, a in enumerate(agents_sorted):
        style_cell(ws, 2 + i, 1, a)

    # Map Pool
    style_cell(ws, 1, 6, 'Map Pool', font=HEADER_FONT, fill=HEADER_BG)
    for i, m in enumerate(MAP_ORDER):
        style_cell(ws, 2 + i, 6, m)

    # Team names (H column — this is the dropdown source)
    style_cell(ws, 1, 8, 'Team Names', font=HEADER_FONT, fill=HEADER_BG)
    for i, name in enumerate(TEAM_NAMES):
        style_cell(ws, 2 + i, 8, name)

    return ws


def build_doubles_sheet(wb, all_match_rows):
    """Doubles sheet: each match appears with the analyzed team as Team 1."""
    ws = wb.create_sheet('doubles')
    ws.sheet_properties.tabColor = '333333'
    headers = ['Match Id', 'Map Name', 'Team 1 Name', 'Team 2 Name',
               'Team 1 Agents', 'Team 2 Agents',
               'Team 1 Score', 'Team 2 Score',
               'Team 1 Score At Half', 'Team 2 Score At Half',
               'Team 1 Atk Pistol Wins', 'Team 1 Def Pistol Wins',
               'Team 1 Atk Wins', 'Team 1 Atk Losses',
               'Team 1 Def Wins', 'Team 1 Def Losses',
               'Date', 'Win Team', 'Comp_Map']
    write_header_row(ws, 1, headers)

    for i, mr in enumerate(all_match_rows):
        r = 2 + i
        comp_map = f"{mr['map']}_{mr['team1_agents']}"
        vals = [mr['match_id'], mr['map'], mr['team1'], mr['team2'],
                mr['team1_agents'], mr['team2_agents'],
                mr['team1_score'], mr['team2_score'],
                mr['team1_half'], mr['team2_half'],
                mr['team1_atk_pistol'], mr['team1_def_pistol'],
                mr['team1_atk_wins'], mr['team1_atk_losses'],
                mr['team1_def_wins'], mr['team1_def_losses'],
                mr['date'], mr['win_team'], comp_map]
        write_data_row(ws, r, vals)

    last = len(all_match_rows) + 1
    ws.auto_filter.ref = f'A1:S{last}'
    return ws, last


def build_econ_sheets(wb, all_econ_rows):
    """Build ecos, Antieco, Gun v Gun sheets."""
    sheets = {}
    for econ_type, sheet_name in [('eco', 'ecos'), ('antieco', 'Antieco'), ('gun', 'Gun v Gun')]:
        ws = wb.create_sheet(sheet_name)
        ws.sheet_properties.tabColor = '333333'
        headers = ['Team', 'Map', 'Wins', 'Losses', 'Win Percentage', 'Side']
        write_header_row(ws, 1, headers)
        rows = [r for r in all_econ_rows if r['type'] == econ_type]
        rows.sort(key=lambda r: (r['team'], r['map'], r['side']))
        for i, row_data in enumerate(rows):
            r = 2 + i
            write_data_row(ws, r, [row_data['team'], row_data['map'],
                                    row_data['wins'], row_data['losses'],
                                    round(row_data['pct'], 2), row_data['side']])
        sheets[econ_type] = (ws, len(rows) + 1)
    return sheets


def build_xvy_sheet(wb, all_xvy_rows):
    ws = wb.create_sheet('XvY')
    ws.sheet_properties.tabColor = '333333'
    headers = ['Team', 'Situation', 'team1', 'team2', 'Delta', 'Wins', 'Losses', 'Win %']
    write_header_row(ws, 1, headers)
    all_xvy_rows.sort(key=lambda r: (r['team'], -r['delta'], -r['team_alive']))
    for i, row_data in enumerate(all_xvy_rows):
        r = 2 + i
        delta_str = f"+{row_data['delta']}" if row_data['delta'] > 0 else str(row_data['delta'])
        write_data_row(ws, r, [row_data['team'], row_data['situation'],
                                row_data['team_alive'], row_data['opp_alive'],
                                delta_str, row_data['wins'], row_data['losses'],
                                round(row_data['pct'], 2)])
    return ws, len(all_xvy_rows) + 1


def build_post_plants_sheet(wb, all_pp_rows):
    ws = wb.create_sheet('Post Plants')
    ws.sheet_properties.tabColor = '333333'
    headers = ['Team', 'Map', 'Site', 'Role', 'Plants',
               'Wins', 'Losses', 'Win %', 'Key']
    write_header_row(ws, 1, headers)
    all_pp_rows.sort(key=lambda r: (r['team'], r['map'], r['site']))
    for i, row_data in enumerate(all_pp_rows):
        r = 2 + i
        key = f"{row_data['team']}_{row_data['map']}"
        write_data_row(ws, r, [row_data['team'], row_data['map'], row_data['site'],
                                row_data['role'], row_data['plants'],
                                row_data['wins'], row_data['losses'],
                                round(row_data['pct'], 2), key])
    return ws, len(all_pp_rows) + 1


def build_player_stats_sheet(wb, all_player_rows):
    ws = wb.create_sheet('Player Stats')
    ws.sheet_properties.tabColor = '333333'
    headers = ['Team', 'Playername', 'ACS', 'Rounds', 'Kills', 'Deaths', 'Assists',
               'FK', 'FD', 'K/D', 'KA/D', 'FK%', 'Clutch Scens', 'Clutches',
               'Clutch%', 'KAST', 'AWP%']
    write_header_row(ws, 1, headers)
    all_player_rows.sort(key=lambda r: -r['kills'])
    for i, pr in enumerate(all_player_rows):
        r = 2 + i
        write_data_row(ws, r, [
            pr['team'], pr['name'], pr['acs'], pr['rounds'],
            pr['kills'], pr['deaths'], pr['assists'],
            pr['fk'], pr['fd'],
            round(pr['kd'], 2), round(pr['kad'], 2),
            round(pr['fk_pct'], 2),
            pr['clutch_attempts'], pr['clutch_wins'],
            round(pr['clutch_pct'], 2), round(pr['kast'], 2),
            round(pr['op_pct'], 4),
        ])
    return ws, len(all_player_rows) + 1


def build_leaderboard_sheets(wb, all_player_rows):
    """Build Kills, Deaths, Assists, ACS, FKS, FDS sheets."""
    for sheet_name, key, label in [
        ('Kills', 'kills', 'Kills'), ('Deaths', 'deaths', 'Deaths'),
        ('Assists', 'assists', 'Assists'), ('ACS', 'acs', 'Acs'),
        ('FKS', 'fk', 'First Kills'), ('FDS', 'fd', 'First Deaths'),
    ]:
        ws = wb.create_sheet(sheet_name)
        ws.sheet_properties.tabColor = '333333'
        write_header_row(ws, 1, ['Ign', 'Team', label])
        sorted_rows = sorted(all_player_rows, key=lambda r: -r[key])
        for i, pr in enumerate(sorted_rows):
            write_data_row(ws, 2 + i, [pr['name'], pr['team'], pr[key]])


def build_clutches_sheet(wb, all_player_rows):
    ws = wb.create_sheet('Clutches')
    ws.sheet_properties.tabColor = '333333'
    write_header_row(ws, 1, ['Ign', 'Team', 'Clutches', 'Clutch Failures', 'Scens'])
    rows = sorted(all_player_rows, key=lambda r: -r['clutch_wins'])
    for i, pr in enumerate(rows):
        failures = pr['clutch_attempts'] - pr['clutch_wins']
        write_data_row(ws, 2 + i, [pr['name'], pr['team'], pr['clutch_wins'], failures, pr['clutch_attempts']])
    return ws


def build_picks_sheet(wb, all_player_rows):
    ws = wb.create_sheet('Picks')
    ws.sheet_properties.tabColor = '333333'
    write_header_row(ws, 1, ['Ign', 'Team', 'Agent', 'Picks', 'Matches', 'Percentage'])
    r = 2
    for pr in all_player_rows:
        for agent, count in pr['agents'].most_common():
            pct = count / pr['maps'] * 100 if pr['maps'] > 0 else 0
            write_data_row(ws, r, [pr['name'], pr['team'], agent, count, pr['maps'], round(pct, 2)])
            r += 1
    return ws


def build_post_ranking_sheet(wb, all_match_rows, all_pp_rows):
    """Build Post Ranking and Post Rank General sheets."""
    # Post Rank General: per-team overall retake% and postplant%
    ws = wb.create_sheet('Post Rank General')
    ws.sheet_properties.tabColor = '333333'
    write_header_row(ws, 1, ['Team', 'retake rW%', 'postplant rW%'])

    team_pp = defaultdict(lambda: {'atk_wins': 0, 'atk_total': 0, 'def_wins': 0, 'def_total': 0})
    for pp in all_pp_rows:
        t = team_pp[pp['team']]
        if pp['role'] == 'atk':
            t['atk_wins'] += pp['wins']
            t['atk_total'] += pp['plants']
        else:
            t['def_wins'] += pp['wins']
            t['def_total'] += pp['plants']

    rank_data = []
    for team_name in TEAM_NAMES:
        t = team_pp[team_name]
        pp_pct = t['atk_wins'] / t['atk_total'] if t['atk_total'] > 0 else 0
        ret_pct = t['def_wins'] / t['def_total'] if t['def_total'] > 0 else 0
        rank_data.append({'team': team_name, 'retake': ret_pct, 'postplant': pp_pct})

    rank_data.sort(key=lambda r: -r['retake'])
    for i, rd in enumerate(rank_data):
        write_data_row(ws, 2 + i, [rd['team'], round(rd['retake'], 4), round(rd['postplant'], 4)])

    # Post Ranking: per team per map
    ws2 = wb.create_sheet('Post Ranking')
    ws2.sheet_properties.tabColor = '333333'
    headers = ['Team', 'Map', 'retake rW%', 'post rW%']
    write_header_row(ws2, 1, headers)
    r = 2
    for team_name in TEAM_NAMES:
        for map_name in MAP_ORDER:
            atk_w = atk_t = def_w = def_t = 0
            for pp in all_pp_rows:
                if pp['team'] == team_name and pp['map'] == map_name:
                    if pp['role'] == 'atk':
                        atk_w += pp['wins']
                        atk_t += pp['plants']
                    else:
                        def_w += pp['wins']
                        def_t += pp['plants']
            pp_pct = atk_w / atk_t if atk_t > 0 else 0
            ret_pct = def_w / def_t if def_t > 0 else 0
            write_data_row(ws2, r, [team_name, map_name, round(ret_pct, 4), round(pp_pct, 4)])
            r += 1

    return ws, ws2


# ══════════════════════════════════════════════════
# TEAM VIEW (formula-driven)
# ══════════════════════════════════════════════════

def build_team_view(wb, doubles_last, econ_sheets, xvy_last, pp_last, ps_last):
    """Build the formula-driven Team View with dropdown selector."""
    ws = wb.active
    ws.title = 'Team View'
    ws.sheet_properties.tabColor = '1a1a2e'

    # Dark background
    for row in range(1, 50):
        for col in range(1, 44):
            cell = ws.cell(row=row, column=col)
            cell.fill = DARK_BG
            cell.font = WHITE_FONT

    # ── Title + Dropdown ──
    ws.merge_cells('C2:H2')
    style_cell(ws, 2, 3, 'Team', font=Font(color='888888', size=10, name='Calibri'), fill=DARK_BG)
    ws.merge_cells('C3:H3')
    style_cell(ws, 3, 3, TEAM_NAMES[0], font=TITLE_FONT, fill=DARK_BG)

    # Data validation dropdown
    dv = DataValidation(type='list', formula1='Assets!$H$2:$H$15', allow_blank=False)
    dv.error = 'Please select a valid team'
    dv.errorTitle = 'Invalid Team'
    ws.add_data_validation(dv)
    dv.add(ws['C3'])

    # Doubles sheet range references
    D = 'doubles'
    DL = doubles_last  # last row in doubles

    # ── Section Headers (Row 5) ──
    sections = [
        (3, 8, 'Team Statistics'), (9, 9, ''), (10, 12, 'All Rounds'),
        (13, 15, 'Pistols'), (16, 18, 'Gun'), (19, 21, 'Anti Eco'),
        (22, 24, 'Eco'),
    ]
    for sc, ec, label in sections:
        if sc != ec:
            ws.merge_cells(start_row=5, start_column=sc, end_row=5, end_column=ec)
        style_cell(ws, 5, sc, label, font=HEADER_FONT, fill=HEADER_BG, alignment=CENTER)

    # Post Plant / Retake headers
    pp_col = 29
    style_cell(ws, 5, pp_col, 'Post Plant', font=HEADER_FONT, fill=HEADER_BG, alignment=CENTER)
    ws.merge_cells(start_row=5, start_column=pp_col, end_row=5, end_column=pp_col + 5)
    rt_col = pp_col + 6
    style_cell(ws, 5, rt_col, 'Retake', font=HEADER_FONT, fill=HEADER_BG, alignment=CENTER)
    ws.merge_cells(start_row=5, start_column=rt_col, end_row=5, end_column=rt_col + 4)

    # ── Sub-headers (Row 6) ──
    sub = {
        3: 'Maps', 4: 'Comp', 9: 'x',
        10: 'Plays', 11: 'Win', 12: 'Loss',
        13: 'rW%', 14: 'aW%', 15: 'dW%',
        16: 'rW%', 17: 'aW%', 18: 'dW%',
        19: 'rW%', 20: 'aW%', 21: 'dW%',
        22: 'rW%', 23: 'aW%', 24: 'dW%',
    }
    for col, label in sub.items():
        style_cell(ws, 6, col, label, font=HEADER_FONT, fill=SUBHEADER_BG, alignment=CENTER)

    pp_sub = {pp_col: 'Map', pp_col+1: 'post\nscens', pp_col+2: 't\nrounds',
              pp_col+3: 'post\n/Map', pp_col+4: 'post\nrW%', pp_col+5: 'rank'}
    for col, label in pp_sub.items():
        style_cell(ws, 6, col, label, font=HEADER_FONT, fill=SUBHEADER_BG, alignment=CENTER)

    rt_sub = {rt_col: 'ret.\nscens', rt_col+1: 'ct\nrounds', rt_col+2: 'ret.\n/Map',
              rt_col+3: 'ret.\nrW%', rt_col+4: 'rank'}
    for col, label in rt_sub.items():
        style_cell(ws, 6, col, label, font=HEADER_FONT, fill=SUBHEADER_BG, alignment=CENTER)

    # ── Per-Map Data Rows (7-13) with FORMULAS ──
    T = '$C$3'  # team reference cell

    for mi, map_name in enumerate(MAP_ORDER):
        row = 7 + mi
        fill = ROW_BG if mi % 2 == 0 else ALT_ROW_BG

        # Map name
        style_cell(ws, row, 3, map_name, fill=fill)
        MN = f'C{row}'  # map name cell ref

        # Comp: most common composition for this team+map
        # Use INDEX/MATCH on doubles Comp_Map column — find the most frequent
        # For simplicity, use a COUNTIFS approach: show the comp from the first matching row
        style_cell(ws, row, 4, '', fill=fill)  # comp placeholder
        c = style_cell(ws, row, 4, None, fill=fill)
        c.value = f'=IFERROR(INDEX({D}!$E$2:$E${DL},MATCH({MN}&"_"&{T},{D}!$S$2:$S${DL}&"_"&{D}!$C$2:$C${DL},0)),"")'
        ws.merge_cells(start_row=row, start_column=4, end_row=row, end_column=8)

        # x (comp count) — how many times this comp appeared
        c = style_cell(ws, row, 9, None, fill=fill, alignment=CENTER)
        c.value = f'=IFERROR(COUNTIFS({D}!$C$2:$C${DL},{T},{D}!$B$2:$B${DL},{MN},{D}!$E$2:$E${DL},D{row}),"")'

        # Plays
        c = style_cell(ws, row, 10, None, fill=fill, alignment=CENTER)
        c.value = f'=COUNTIFS({D}!$C$2:$C${DL},{T},{D}!$B$2:$B${DL},{MN})'

        # Win
        c = style_cell(ws, row, 11, None, fill=fill, alignment=CENTER)
        c.value = f'=COUNTIFS({D}!$C$2:$C${DL},{T},{D}!$B$2:$B${DL},{MN},{D}!$R$2:$R${DL},{T})'

        # Loss
        c = style_cell(ws, row, 12, None, fill=fill, alignment=CENTER)
        c.value = f'=J{row}-K{row}'

        # All Rounds rW%: (atkW + defW) / (atkW + atkL + defW + defL)
        aw = f'SUMIFS({D}!$M$2:$M${DL},{D}!$C$2:$C${DL},{T},{D}!$B$2:$B${DL},{MN})'
        al = f'SUMIFS({D}!$N$2:$N${DL},{D}!$C$2:$C${DL},{T},{D}!$B$2:$B${DL},{MN})'
        dw = f'SUMIFS({D}!$O$2:$O${DL},{D}!$C$2:$C${DL},{T},{D}!$B$2:$B${DL},{MN})'
        dl = f'SUMIFS({D}!$P$2:$P${DL},{D}!$C$2:$C${DL},{T},{D}!$B$2:$B${DL},{MN})'

        c = style_cell(ws, row, 13, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
        c.value = f'=IFERROR(({aw}+{dw})/({aw}+{al}+{dw}+{dl}),"")'

        # aW%
        c = style_cell(ws, row, 14, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
        c.value = f'=IFERROR({aw}/({aw}+{al}),"")'

        # dW%
        c = style_cell(ws, row, 15, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
        c.value = f'=IFERROR({dw}/({dw}+{dl}),"")'

        # Pistols: use pistol columns K (atk pistol) and L (def pistol)
        paw = f'SUMIFS({D}!$K$2:$K${DL},{D}!$C$2:$C${DL},{T},{D}!$B$2:$B${DL},{MN})'
        pdw = f'SUMIFS({D}!$L$2:$L${DL},{D}!$C$2:$C${DL},{T},{D}!$B$2:$B${DL},{MN})'
        plays = f'COUNTIFS({D}!$C$2:$C${DL},{T},{D}!$B$2:$B${DL},{MN})'

        c = style_cell(ws, row, 16, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
        c.value = f'=IFERROR(({paw}+{pdw})/(2*{plays}),"")'  # 2 pistol rounds per map
        c = style_cell(ws, row, 17, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
        c.value = f'=IFERROR({paw}/{plays},"")'
        c = style_cell(ws, row, 18, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
        c.value = f'=IFERROR({pdw}/{plays},"")'

        # Gun v Gun, Anti Eco, Eco — from their respective sheets
        for col_start, sheet_name in [(16, 'Gun v Gun'), (19, 'Antieco'), (22, 'ecos')]:
            # Actually cols 16-18=Gun is pistol above. Let me fix the layout.
            pass

        # Gun round stats (cols 16-18 are pistols per reference, 19-21 are gun)
        # Wait — looking at reference again: 13-15=All, 16-18=Pistols, 19-21=Gun, 22-24=Anti Eco, 25-27=Eco
        # But I set cols 13-15=All, 13-15=Pistols... let me re-check
        # My sub dict: 13=rW%(All), 16=rW%(Pistols), 19=rW%(Gun??)
        # Actually looking at the section headers: All Rounds=10-12, Pistols=13-15, Gun=16-18, Anti Eco=19-21, Eco=22-24
        # No wait, sections say: (10,12,'All Rounds'), (13,15,'Pistols'), (16,18,'Gun'), (19,21,'Anti Eco'), (22,24,'Eco')
        # But sub dict says: 10=Plays, 11=Win, 12=Loss — those aren't rW%
        # Let me re-read the reference more carefully...
        # Reference R6: 10:Plays, 11:Win, 12:Loss, 13:rW%, 14:aW%, 15:dW%, 16:rW%, 17:aW%, 18:dW%, 19:rW%...
        # So: cols 10-12 = Plays/Win/Loss, cols 13-15 = All Rounds rW%/aW%/dW%
        # cols 16-18 = Pistols rW%/aW%/dW%, cols 19-21 = Gun rW%/aW%/dW%
        # cols 22-24 = Anti Eco rW%/aW%/dW%, cols 25-27 = Eco rW%/aW%/dW%
        # This matches what I had. Pistols are 16-18, Gun are 19-21.

        # So pistol formulas go to 16-18 (already done above)
        # Gun v Gun: cols 19-21
        for econ_sheet, col_base in [('Gun v Gun', 19), ('Antieco', 22), ('ecos', 25)]:
            es = f"'{econ_sheet}'"
            ew_atk = f'SUMIFS({es}!$C$2:$C$500,{es}!$A$2:$A$500,{T},{es}!$B$2:$B$500,{MN},{es}!$F$2:$F$500,"atk")'
            el_atk = f'SUMIFS({es}!$D$2:$D$500,{es}!$A$2:$A$500,{T},{es}!$B$2:$B$500,{MN},{es}!$F$2:$F$500,"atk")'
            ew_def = f'SUMIFS({es}!$C$2:$C$500,{es}!$A$2:$A$500,{T},{es}!$B$2:$B$500,{MN},{es}!$F$2:$F$500,"def")'
            el_def = f'SUMIFS({es}!$D$2:$D$500,{es}!$A$2:$A$500,{T},{es}!$B$2:$B$500,{MN},{es}!$F$2:$F$500,"def")'

            # rW% (all sides)
            c = style_cell(ws, row, col_base, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
            c.value = f'=IFERROR(({ew_atk}+{ew_def})/({ew_atk}+{el_atk}+{ew_def}+{el_def}),"")'
            # aW%
            c = style_cell(ws, row, col_base + 1, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
            c.value = f'=IFERROR({ew_atk}/({ew_atk}+{el_atk}),"")'
            # dW%
            c = style_cell(ws, row, col_base + 2, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
            c.value = f'=IFERROR({ew_def}/({ew_def}+{el_def}),"")'

        # Post-plant section
        PP = "'Post Plants'"
        style_cell(ws, row, pp_col, map_name, fill=fill)

        # post scens (team planted = role 'atk')
        c = style_cell(ws, row, pp_col + 1, None, fill=fill, alignment=CENTER)
        c.value = f'=SUMIFS({PP}!$E$2:$E$500,{PP}!$A$2:$A$500,{T},{PP}!$B$2:$B$500,{MN},{PP}!$D$2:$D$500,"atk")'

        # t rounds (atk rounds = atkW + atkL from doubles)
        c = style_cell(ws, row, pp_col + 2, None, fill=fill, alignment=CENTER)
        c.value = f'={aw}+{al}'

        # post/Map
        c = style_cell(ws, row, pp_col + 3, None, fill=fill, alignment=CENTER, num_fmt='0.00')
        c.value = f'=IFERROR({get_column_letter(pp_col+1)}{row}/J{row},"")'

        # post rW%
        pp_wins = f'SUMIFS({PP}!$F$2:$F$500,{PP}!$A$2:$A$500,{T},{PP}!$B$2:$B$500,{MN},{PP}!$D$2:$D$500,"atk")'
        pp_total = f'SUMIFS({PP}!$E$2:$E$500,{PP}!$A$2:$A$500,{T},{PP}!$B$2:$B$500,{MN},{PP}!$D$2:$D$500,"atk")'
        c = style_cell(ws, row, pp_col + 4, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
        c.value = f'=IFERROR({pp_wins}/{pp_total},"")'

        # rank placeholder
        style_cell(ws, row, pp_col + 5, '', fill=fill, alignment=CENTER)

        # Retake section (opponent planted = role 'def')
        # ret scens
        c = style_cell(ws, row, rt_col, None, fill=fill, alignment=CENTER)
        c.value = f'=SUMIFS({PP}!$E$2:$E$500,{PP}!$A$2:$A$500,{T},{PP}!$B$2:$B$500,{MN},{PP}!$D$2:$D$500,"def")'

        # ct rounds
        c = style_cell(ws, row, rt_col + 1, None, fill=fill, alignment=CENTER)
        c.value = f'={dw}+{dl}'

        # ret/Map
        c = style_cell(ws, row, rt_col + 2, None, fill=fill, alignment=CENTER, num_fmt='0.00')
        c.value = f'=IFERROR({get_column_letter(rt_col)}{row}/J{row},"")'

        # ret rW%
        rt_wins = f'SUMIFS({PP}!$F$2:$F$500,{PP}!$A$2:$A$500,{T},{PP}!$B$2:$B$500,{MN},{PP}!$D$2:$D$500,"def")'
        rt_total = f'SUMIFS({PP}!$E$2:$E$500,{PP}!$A$2:$A$500,{T},{PP}!$B$2:$B$500,{MN},{PP}!$D$2:$D$500,"def")'
        c = style_cell(ws, row, rt_col + 3, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
        c.value = f'=IFERROR({rt_wins}/{rt_total},"")'

        # rank placeholder
        style_cell(ws, row, rt_col + 4, '', fill=fill, alignment=CENTER)

    # ── All Maps Row (Row 14) ──
    all_row = 7 + len(MAP_ORDER)
    fill = ALLMAP_BG
    style_cell(ws, all_row, 3, 'All Maps', font=HEADER_FONT, fill=fill)
    ws.merge_cells(start_row=all_row, start_column=3, end_row=all_row, end_column=8)

    # Plays (all maps)
    c = style_cell(ws, all_row, 10, None, fill=fill, alignment=CENTER, font=HEADER_FONT)
    c.value = f'=COUNTIFS({D}!$C$2:$C${DL},{T})'
    c = style_cell(ws, all_row, 11, None, fill=fill, alignment=CENTER, font=HEADER_FONT)
    c.value = f'=COUNTIFS({D}!$C$2:$C${DL},{T},{D}!$R$2:$R${DL},{T})'
    c = style_cell(ws, all_row, 12, None, fill=fill, alignment=CENTER, font=HEADER_FONT)
    c.value = f'=J{all_row}-K{all_row}'

    # All rounds rW%/aW%/dW% (no map filter)
    aw_all = f'SUMIFS({D}!$M$2:$M${DL},{D}!$C$2:$C${DL},{T})'
    al_all = f'SUMIFS({D}!$N$2:$N${DL},{D}!$C$2:$C${DL},{T})'
    dw_all = f'SUMIFS({D}!$O$2:$O${DL},{D}!$C$2:$C${DL},{T})'
    dl_all = f'SUMIFS({D}!$P$2:$P${DL},{D}!$C$2:$C${DL},{T})'

    c = style_cell(ws, all_row, 13, None, fill=fill, alignment=CENTER, num_fmt='0.0%', font=HEADER_FONT)
    c.value = f'=IFERROR(({aw_all}+{dw_all})/({aw_all}+{al_all}+{dw_all}+{dl_all}),"")'
    c = style_cell(ws, all_row, 14, None, fill=fill, alignment=CENTER, num_fmt='0.0%', font=HEADER_FONT)
    c.value = f'=IFERROR({aw_all}/({aw_all}+{al_all}),"")'
    c = style_cell(ws, all_row, 15, None, fill=fill, alignment=CENTER, num_fmt='0.0%', font=HEADER_FONT)
    c.value = f'=IFERROR({dw_all}/({dw_all}+{dl_all}),"")'

    # Pistols all maps
    paw_all = f'SUMIFS({D}!$K$2:$K${DL},{D}!$C$2:$C${DL},{T})'
    pdw_all = f'SUMIFS({D}!$L$2:$L${DL},{D}!$C$2:$C${DL},{T})'
    plays_all = f'COUNTIFS({D}!$C$2:$C${DL},{T})'
    c = style_cell(ws, all_row, 16, None, fill=fill, alignment=CENTER, num_fmt='0.0%', font=HEADER_FONT)
    c.value = f'=IFERROR(({paw_all}+{pdw_all})/(2*{plays_all}),"")'
    c = style_cell(ws, all_row, 17, None, fill=fill, alignment=CENTER, num_fmt='0.0%', font=HEADER_FONT)
    c.value = f'=IFERROR({paw_all}/{plays_all},"")'
    c = style_cell(ws, all_row, 18, None, fill=fill, alignment=CENTER, num_fmt='0.0%', font=HEADER_FONT)
    c.value = f'=IFERROR({pdw_all}/{plays_all},"")'

    # Gun/AntiEco/Eco all maps (no map filter)
    for econ_sheet, col_base in [('Gun v Gun', 19), ('Antieco', 22), ('ecos', 25)]:
        es = f"'{econ_sheet}'"
        ew_atk = f'SUMIFS({es}!$C$2:$C$500,{es}!$A$2:$A$500,{T},{es}!$F$2:$F$500,"atk")'
        el_atk = f'SUMIFS({es}!$D$2:$D$500,{es}!$A$2:$A$500,{T},{es}!$F$2:$F$500,"atk")'
        ew_def = f'SUMIFS({es}!$C$2:$C$500,{es}!$A$2:$A$500,{T},{es}!$F$2:$F$500,"def")'
        el_def = f'SUMIFS({es}!$D$2:$D$500,{es}!$A$2:$A$500,{T},{es}!$F$2:$F$500,"def")'
        c = style_cell(ws, all_row, col_base, None, fill=fill, alignment=CENTER, num_fmt='0.0%', font=HEADER_FONT)
        c.value = f'=IFERROR(({ew_atk}+{ew_def})/({ew_atk}+{el_atk}+{ew_def}+{el_def}),"")'
        c = style_cell(ws, all_row, col_base + 1, None, fill=fill, alignment=CENTER, num_fmt='0.0%', font=HEADER_FONT)
        c.value = f'=IFERROR({ew_atk}/({ew_atk}+{el_atk}),"")'
        c = style_cell(ws, all_row, col_base + 2, None, fill=fill, alignment=CENTER, num_fmt='0.0%', font=HEADER_FONT)
        c.value = f'=IFERROR({ew_def}/({ew_def}+{el_def}),"")'

    # Post-plant all maps
    PP = "'Post Plants'"
    style_cell(ws, all_row, pp_col, 'All Maps', font=HEADER_FONT, fill=fill)
    c = style_cell(ws, all_row, pp_col + 1, None, fill=fill, alignment=CENTER, font=HEADER_FONT)
    c.value = f'=SUMIFS({PP}!$E$2:$E$500,{PP}!$A$2:$A$500,{T},{PP}!$D$2:$D$500,"atk")'
    c = style_cell(ws, all_row, pp_col + 2, None, fill=fill, alignment=CENTER, font=HEADER_FONT)
    c.value = f'={aw_all}+{al_all}'
    c = style_cell(ws, all_row, pp_col + 3, None, fill=fill, alignment=CENTER, num_fmt='0.00', font=HEADER_FONT)
    c.value = f'=IFERROR({get_column_letter(pp_col+1)}{all_row}/J{all_row},"")'
    pp_wins_all = f'SUMIFS({PP}!$F$2:$F$500,{PP}!$A$2:$A$500,{T},{PP}!$D$2:$D$500,"atk")'
    pp_total_all = f'SUMIFS({PP}!$E$2:$E$500,{PP}!$A$2:$A$500,{T},{PP}!$D$2:$D$500,"atk")'
    c = style_cell(ws, all_row, pp_col + 4, None, fill=fill, alignment=CENTER, num_fmt='0.0%', font=HEADER_FONT)
    c.value = f'=IFERROR({pp_wins_all}/{pp_total_all},"")'

    c = style_cell(ws, all_row, rt_col, None, fill=fill, alignment=CENTER, font=HEADER_FONT)
    c.value = f'=SUMIFS({PP}!$E$2:$E$500,{PP}!$A$2:$A$500,{T},{PP}!$D$2:$D$500,"def")'
    c = style_cell(ws, all_row, rt_col + 1, None, fill=fill, alignment=CENTER, font=HEADER_FONT)
    c.value = f'={dw_all}+{dl_all}'
    c = style_cell(ws, all_row, rt_col + 2, None, fill=fill, alignment=CENTER, num_fmt='0.00', font=HEADER_FONT)
    c.value = f'=IFERROR({get_column_letter(rt_col)}{all_row}/J{all_row},"")'
    rt_wins_all = f'SUMIFS({PP}!$F$2:$F$500,{PP}!$A$2:$A$500,{T},{PP}!$D$2:$D$500,"def")'
    rt_total_all = f'SUMIFS({PP}!$E$2:$E$500,{PP}!$A$2:$A$500,{T},{PP}!$D$2:$D$500,"def")'
    c = style_cell(ws, all_row, rt_col + 3, None, fill=fill, alignment=CENTER, num_fmt='0.0%', font=HEADER_FONT)
    c.value = f'=IFERROR({rt_wins_all}/{rt_total_all},"")'

    # ══════ PLAYER STATS SECTION ══════
    ps_row = all_row + 3
    style_cell(ws, ps_row, 3, 'Statistics Per Player', font=HEADER_FONT, fill=HEADER_BG)
    ws.merge_cells(start_row=ps_row, start_column=3, end_row=ps_row, end_column=17)

    # XvY header
    xvy_col = 19
    style_cell(ws, ps_row, xvy_col, 'Team XvY', font=HEADER_FONT, fill=HEADER_BG, alignment=CENTER)
    ws.merge_cells(start_row=ps_row, start_column=xvy_col, end_row=ps_row, end_column=xvy_col + 5)

    # Player sub-headers
    ps_sub = ps_row + 1
    p_headers = {3: 'Players', 4: 'Agents', 9: 'r', 10: 'K/D', 11: 'KA/D', 12: 'KAST',
                 13: 'fk/r', 14: 'fd/r', 15: 'fk/fd', 16: 'CL%', 17: 'AWP%'}
    for col, label in p_headers.items():
        style_cell(ws, ps_sub, col, label, font=HEADER_FONT, fill=SUBHEADER_BG, alignment=CENTER)

    xvy_headers = {xvy_col: 'X v Y', xvy_col+1: '5', xvy_col+2: '4', xvy_col+3: '3', xvy_col+4: '2', xvy_col+5: '1'}
    for col, label in xvy_headers.items():
        style_cell(ws, ps_sub, col, label, font=HEADER_FONT, fill=SUBHEADER_BG, alignment=CENTER)

    # Player rows (up to 10 players) — formula-driven from Player Stats sheet
    PS = "'Player Stats'"
    for pi in range(10):
        row = ps_sub + 1 + pi
        fill = ROW_BG if pi % 2 == 0 else ALT_ROW_BG

        # Player name: use SMALL+IF to get the pi-th player for the selected team
        # Use IFERROR+INDEX+SMALL+IF (array formula in Excel 365)
        rank = pi + 1  # 1-based rank
        # Sort by kills descending: find the player with the rank-th most kills for this team
        c = style_cell(ws, row, 3, None, fill=fill)
        c.value = f'=IFERROR(INDEX({PS}!$B$2:$B$200,MATCH(LARGE(IF({PS}!$A$2:$A$200={T},{PS}!$E$2:$E$200),{rank}),IF({PS}!$A$2:$A$200={T},{PS}!$E$2:$E$200),0)),"")'

        # Agents: use INDEX/MATCH on player name
        pname = f'C{row}'
        c = style_cell(ws, row, 4, None, fill=fill, font=Font(color='AAAAAA', size=9, name='Calibri'))
        # We don't have an agents column in Player Stats — leave blank or show from Picks
        c.value = ''
        ws.merge_cells(start_row=row, start_column=4, end_row=row, end_column=8)

        # Rounds
        c = style_cell(ws, row, 9, None, fill=fill, alignment=CENTER)
        c.value = f'=IFERROR(INDEX({PS}!$D$2:$D$200,MATCH({pname},{PS}!$B$2:$B$200,0)),"")'

        # K/D
        c = style_cell(ws, row, 10, None, fill=fill, alignment=CENTER, num_fmt='0.00')
        c.value = f'=IFERROR(INDEX({PS}!$J$2:$J$200,MATCH({pname},{PS}!$B$2:$B$200,0)),"")'

        # KA/D
        c = style_cell(ws, row, 11, None, fill=fill, alignment=CENTER, num_fmt='0.00')
        c.value = f'=IFERROR(INDEX({PS}!$K$2:$K$200,MATCH({pname},{PS}!$B$2:$B$200,0)),"")'

        # KAST
        c = style_cell(ws, row, 12, None, fill=fill, alignment=CENTER, num_fmt='0%')
        c.value = f'=IFERROR(INDEX({PS}!$P$2:$P$200,MATCH({pname},{PS}!$B$2:$B$200,0)),"")'

        # fk/r
        c = style_cell(ws, row, 13, None, fill=fill, alignment=CENTER, num_fmt='0.00')
        c.value = f'=IFERROR(INDEX({PS}!$H$2:$H$200,MATCH({pname},{PS}!$B$2:$B$200,0))/INDEX({PS}!$D$2:$D$200,MATCH({pname},{PS}!$B$2:$B$200,0)),"")'

        # fd/r
        c = style_cell(ws, row, 14, None, fill=fill, alignment=CENTER, num_fmt='0.00')
        c.value = f'=IFERROR(INDEX({PS}!$I$2:$I$200,MATCH({pname},{PS}!$B$2:$B$200,0))/INDEX({PS}!$D$2:$D$200,MATCH({pname},{PS}!$B$2:$B$200,0)),"")'

        # fk/fd (as percentage)
        c = style_cell(ws, row, 15, None, fill=fill, alignment=CENTER, num_fmt='0%')
        c.value = f'=IFERROR(INDEX({PS}!$L$2:$L$200,MATCH({pname},{PS}!$B$2:$B$200,0)),"")'

        # CL%
        c = style_cell(ws, row, 16, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
        c.value = f'=IFERROR(INDEX({PS}!$O$2:$O$200,MATCH({pname},{PS}!$B$2:$B$200,0)),"")'

        # AWP%
        c = style_cell(ws, row, 17, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
        c.value = f'=IFERROR(INDEX({PS}!$Q$2:$Q$200,MATCH({pname},{PS}!$B$2:$B$200,0)),"")'

    # XvY 5x5 matrix (formula-driven)
    XVY = 'XvY'
    xvy_data_start = ps_sub + 1
    for ri, team_count in enumerate(range(5, 0, -1)):
        row = xvy_data_start + ri
        fill = ROW_BG if ri % 2 == 0 else ALT_ROW_BG
        style_cell(ws, row, xvy_col, str(team_count), font=HEADER_FONT, fill=fill, alignment=CENTER)

        for ci, opp_count in enumerate(range(5, 0, -1)):
            col = xvy_col + 1 + ci
            situation = f'{team_count}v{opp_count}'
            wins = f'SUMIFS({XVY}!$F$2:$F$500,{XVY}!$A$2:$A$500,{T},{XVY}!$B$2:$B$500,"{situation}")'
            losses = f'SUMIFS({XVY}!$G$2:$G$500,{XVY}!$A$2:$A$500,{T},{XVY}!$B$2:$B$500,"{situation}")'
            c = style_cell(ws, row, col, None, fill=fill, alignment=CENTER, num_fmt='0.0%')
            c.value = f'=IFERROR({wins}/({wins}+{losses}),"")'

    # ── Column widths ──
    ws.column_dimensions['A'].width = 2
    ws.column_dimensions['B'].width = 2
    ws.column_dimensions['C'].width = 14
    for c in ['D', 'E', 'F', 'G', 'H']:
        ws.column_dimensions[c].width = 5
    ws.column_dimensions['I'].width = 4
    for col_num in range(10, 44):
        ws.column_dimensions[get_column_letter(col_num)].width = 7

    return ws


# ══════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════

print('=' * 50)
print('VCL3 Stats 2026 — Database Builder')
print('=' * 50)

# Process all teams
all_match_rows = []
all_econ_rows = []
all_xvy_rows = []
all_pp_rows = []
all_player_rows = []

for team_cfg in TEAMS:
    data = process_team(team_cfg['tag'], team_cfg['name'], team_cfg['data_file'])
    all_match_rows.extend(data['match_rows'])
    all_econ_rows.extend(data['round_econ_rows'])
    all_xvy_rows.extend(data['xvy_rows'])
    all_pp_rows.extend(data['post_plant_rows'])
    all_player_rows.extend(data['player_rows'])

print(f'\nTotals: {len(all_match_rows)} match rows, {len(all_player_rows)} players')

# Build workbook
print('\nBuilding workbook...')
wb = Workbook()

# Data sheets
build_assets_sheet(wb)
_, doubles_last = build_doubles_sheet(wb, all_match_rows)
econ_sheets = build_econ_sheets(wb, all_econ_rows)
_, xvy_last = build_xvy_sheet(wb, all_xvy_rows)
_, pp_last = build_post_plants_sheet(wb, all_pp_rows)
_, ps_last = build_player_stats_sheet(wb, all_player_rows)
build_leaderboard_sheets(wb, all_player_rows)
build_clutches_sheet(wb, all_player_rows)
build_picks_sheet(wb, all_player_rows)
build_post_ranking_sheet(wb, all_match_rows, all_pp_rows)

# Formula-driven Team View
build_team_view(wb, doubles_last, econ_sheets, xvy_last, pp_last, ps_last)

# Move Team View to first position
team_view_idx = wb.sheetnames.index('Team View')
wb.move_sheet('Team View', offset=-team_view_idx)

# Save
output_path = 'VCL3_Stats_2026.xlsx'
wb.save(output_path)
print(f'\nSaved to {output_path}')
print(f'Sheets: {wb.sheetnames}')
