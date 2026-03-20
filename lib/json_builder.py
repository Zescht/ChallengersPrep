"""Assemble PRD-compliant stats.json from engine output."""

import hashlib
from collections import defaultdict
from .constants import TAG_TO_NAME, ABILITY_NAMES

EVENT_NAME = "VCL EMEA 2026 Stage 1"
MIN_LEADERBOARD_ROUNDS = 100


def _safe_pct(num, denom):
    return round(num / denom, 3) if denom > 0 else 0


def _make_series_id(date, team1, team2):
    teams = tuple(sorted([team1, team2]))
    return hashlib.md5(f"{date}_{teams[0]}_{teams[1]}".encode()).hexdigest()[:8]


def _compute_form(match_rows, team_name):
    """Last 5 map results sorted chronologically (most recent last)."""
    sorted_matches = sorted(match_rows, key=lambda m: m['date'], reverse=True)[:5]
    form = []
    for m in reversed(sorted_matches):
        form.append({
            'opponent': m['team2'],
            'map': m['map'],
            'score': f"{m['team1_score']}-{m['team2_score']}",
            'result': 'W' if m['winner'] == team_name else 'L',
        })
    return form


def _compute_series_record(match_rows, team_name):
    """Group matches by date+opponent into series, return (wins, losses)."""
    series = defaultdict(lambda: {'w': 0, 'l': 0})
    for m in match_rows:
        sid = _make_series_id(m['date'], m['team1'], m['team2'])
        if m['winner'] == team_name:
            series[sid]['w'] += 1
        else:
            series[sid]['l'] += 1

    s_wins = s_losses = 0
    for sid, record in series.items():
        if record['w'] > record['l']:
            s_wins += 1
        elif record['l'] > record['w']:
            s_losses += 1
    return s_wins, s_losses


def _build_map_stats(match_rows, econ_rows, pp_rows, team_name):
    """Build per-map stats array + allMaps aggregate."""
    # Group matches by map
    map_matches = defaultdict(list)
    for m in match_rows:
        map_matches[m['map']].append(m)

    # Index economy rows by (map, type, side)
    econ_idx = {}
    for e in econ_rows:
        econ_idx[(e['map'], e['type'], e['side'])] = e

    # Index post-plant rows by (map, site, role)
    pp_idx = {}
    for pp in pp_rows:
        pp_idx[(pp['map'], pp['site'], pp['role'])] = pp

    maps_list = []
    # Accumulators for allMaps
    all_plays = all_wins = all_losses = 0
    all_atk_w = all_atk_l = all_def_w = all_def_l = 0
    all_pistol_w = all_pistol_l = 0
    all_pistol_atk_w = all_pistol_atk_l = 0
    all_pistol_def_w = all_pistol_def_l = 0
    all_gun_w = all_gun_l = 0
    all_gun_atk_w = all_gun_atk_l = all_gun_def_w = all_gun_def_l = 0
    all_antieco_w = all_antieco_l = 0
    all_antieco_atk_w = all_antieco_atk_l = all_antieco_def_w = all_antieco_def_l = 0
    all_eco_w = all_eco_l = 0
    all_eco_atk_w = all_eco_atk_l = all_eco_def_w = all_eco_def_l = 0
    all_post_scens = all_post_wins = 0
    all_ret_scens = all_ret_wins = 0

    for map_name, mm in sorted(map_matches.items()):
        plays = len(mm)
        wins = sum(1 for m in mm if m['winner'] == team_name)
        losses = plays - wins

        atk_w = sum(m['team1_atk_wins'] for m in mm)
        atk_l = sum(m['team1_atk_losses'] for m in mm)
        def_w = sum(m['team1_def_wins'] for m in mm)
        def_l = sum(m['team1_def_losses'] for m in mm)
        total_rounds = atk_w + atk_l + def_w + def_l

        # Latest comp
        latest = sorted(mm, key=lambda m: m['date'], reverse=True)[0]
        comp = latest['team1_agents']

        # Pistol
        pistol_atk_w = sum(m['team1_atk_pistol'] for m in mm)
        pistol_def_w = sum(m['team1_def_pistol'] for m in mm)
        pistol_w = pistol_atk_w + pistol_def_w
        pistol_total = plays * 2  # 2 pistol rounds per map
        pistol_atk_total = plays
        pistol_def_total = plays

        # Economy stats from econ_rows
        def get_econ(etype, side):
            e = econ_idx.get((map_name, etype, side))
            return (e['wins'], e['losses']) if e else (0, 0)

        gun_atk_w, gun_atk_l = get_econ('gun', 'atk')
        gun_def_w, gun_def_l = get_econ('gun', 'def')
        gun_w, gun_l = gun_atk_w + gun_def_w, gun_atk_l + gun_def_l

        antieco_atk_w, antieco_atk_l = get_econ('antieco', 'atk')
        antieco_def_w, antieco_def_l = get_econ('antieco', 'def')
        antieco_w, antieco_l = antieco_atk_w + antieco_def_w, antieco_atk_l + antieco_def_l

        eco_atk_w, eco_atk_l = get_econ('eco', 'atk')
        eco_def_w, eco_def_l = get_econ('eco', 'def')
        eco_w, eco_l = eco_atk_w + eco_def_w, eco_atk_l + eco_def_l

        # Post-plant / retake
        post_scens = post_wins = ret_scens = ret_wins = 0
        for site in ('A', 'B', '?'):
            pp_atk = pp_idx.get((map_name, site, 'atk'))
            if pp_atk:
                post_scens += pp_atk['plants']
                post_wins += pp_atk['wins']
            pp_def = pp_idx.get((map_name, site, 'def'))
            if pp_def:
                ret_scens += pp_def['plants']
                ret_wins += pp_def['wins']

        map_obj = {
            'map': map_name,
            'comp': comp,
            'plays': plays,
            'wins': wins,
            'losses': losses,
            'rW_pct': _safe_pct(atk_w + def_w, total_rounds),
            'atk_rW_pct': _safe_pct(atk_w, atk_w + atk_l),
            'def_rW_pct': _safe_pct(def_w, def_w + def_l),
            'pistol_rW_pct': _safe_pct(pistol_w, pistol_total),
            'pistol_atk_rW_pct': _safe_pct(pistol_atk_w, pistol_atk_total),
            'pistol_def_rW_pct': _safe_pct(pistol_def_w, pistol_def_total),
            'gun_rW_pct': _safe_pct(gun_w, gun_w + gun_l),
            'gun_atk_rW_pct': _safe_pct(gun_atk_w, gun_atk_w + gun_atk_l),
            'gun_def_rW_pct': _safe_pct(gun_def_w, gun_def_w + gun_def_l),
            'antieco_rW_pct': _safe_pct(antieco_w, antieco_w + antieco_l),
            'antieco_atk_rW_pct': _safe_pct(antieco_atk_w, antieco_atk_w + antieco_atk_l),
            'antieco_def_rW_pct': _safe_pct(antieco_def_w, antieco_def_w + antieco_def_l),
            'eco_rW_pct': _safe_pct(eco_w, eco_w + eco_l),
            'eco_atk_rW_pct': _safe_pct(eco_atk_w, eco_atk_w + eco_atk_l),
            'eco_def_rW_pct': _safe_pct(eco_def_w, eco_def_w + eco_def_l),
            'post_scens': post_scens,
            'post_per_map': round(post_scens / plays, 1) if plays > 0 else 0,
            'post_rW_pct': _safe_pct(post_wins, post_scens),
            'ret_scens': ret_scens,
            'ret_per_map': round(ret_scens / plays, 1) if plays > 0 else 0,
            'ret_rW_pct': _safe_pct(ret_wins, ret_scens),
            # post_rank, ret_rank, event_avg added later
            'post_rank': 0,
            'post_rW_event_avg': 0,
            'ret_rank': 0,
            'ret_rW_event_avg': 0,
        }
        maps_list.append(map_obj)

        # Accumulate for allMaps
        all_plays += plays; all_wins += wins; all_losses += losses
        all_atk_w += atk_w; all_atk_l += atk_l
        all_def_w += def_w; all_def_l += def_l
        all_pistol_w += pistol_w; all_pistol_l += pistol_total - pistol_w
        all_pistol_atk_w += pistol_atk_w; all_pistol_atk_l += pistol_atk_total - pistol_atk_w
        all_pistol_def_w += pistol_def_w; all_pistol_def_l += pistol_def_total - pistol_def_w
        all_gun_w += gun_w; all_gun_l += gun_l
        all_gun_atk_w += gun_atk_w; all_gun_atk_l += gun_atk_l
        all_gun_def_w += gun_def_w; all_gun_def_l += gun_def_l
        all_antieco_w += antieco_w; all_antieco_l += antieco_l
        all_antieco_atk_w += antieco_atk_w; all_antieco_atk_l += antieco_atk_l
        all_antieco_def_w += antieco_def_w; all_antieco_def_l += antieco_def_l
        all_eco_w += eco_w; all_eco_l += eco_l
        all_eco_atk_w += eco_atk_w; all_eco_atk_l += eco_atk_l
        all_eco_def_w += eco_def_w; all_eco_def_l += eco_def_l
        all_post_scens += post_scens; all_post_wins += post_wins
        all_ret_scens += ret_scens; all_ret_wins += ret_wins

    all_total_rounds = all_atk_w + all_atk_l + all_def_w + all_def_l
    all_maps_obj = {
        'map': 'All Maps',
        'comp': [],
        'plays': all_plays,
        'wins': all_wins,
        'losses': all_losses,
        'rW_pct': _safe_pct(all_atk_w + all_def_w, all_total_rounds),
        'atk_rW_pct': _safe_pct(all_atk_w, all_atk_w + all_atk_l),
        'def_rW_pct': _safe_pct(all_def_w, all_def_w + all_def_l),
        'pistol_rW_pct': _safe_pct(all_pistol_w, all_pistol_w + all_pistol_l),
        'pistol_atk_rW_pct': _safe_pct(all_pistol_atk_w, all_pistol_atk_w + all_pistol_atk_l),
        'pistol_def_rW_pct': _safe_pct(all_pistol_def_w, all_pistol_def_w + all_pistol_def_l),
        'gun_rW_pct': _safe_pct(all_gun_w, all_gun_w + all_gun_l),
        'gun_atk_rW_pct': _safe_pct(all_gun_atk_w, all_gun_atk_w + all_gun_atk_l),
        'gun_def_rW_pct': _safe_pct(all_gun_def_w, all_gun_def_w + all_gun_def_l),
        'antieco_rW_pct': _safe_pct(all_antieco_w, all_antieco_w + all_antieco_l),
        'antieco_atk_rW_pct': _safe_pct(all_antieco_atk_w, all_antieco_atk_w + all_antieco_atk_l),
        'antieco_def_rW_pct': _safe_pct(all_antieco_def_w, all_antieco_def_w + all_antieco_def_l),
        'eco_rW_pct': _safe_pct(all_eco_w, all_eco_w + all_eco_l),
        'eco_atk_rW_pct': _safe_pct(all_eco_atk_w, all_eco_atk_w + all_eco_atk_l),
        'eco_def_rW_pct': _safe_pct(all_eco_def_w, all_eco_def_w + all_eco_def_l),
        'post_scens': all_post_scens,
        'post_per_map': round(all_post_scens / all_plays, 1) if all_plays > 0 else 0,
        'post_rW_pct': _safe_pct(all_post_wins, all_post_scens),
        'ret_scens': all_ret_scens,
        'ret_per_map': round(all_ret_scens / all_plays, 1) if all_plays > 0 else 0,
        'ret_rW_pct': _safe_pct(all_ret_wins, all_ret_scens),
        'post_rank': 0,
        'post_rW_event_avg': 0,
        'ret_rank': 0,
        'ret_rW_event_avg': 0,
    }

    return maps_list, all_maps_obj


def _build_xvy(xvy_rows):
    """Build XvY array sorted by situation."""
    result = []
    for x in sorted(xvy_rows, key=lambda r: (-r['team_alive'], r['opp_alive'])):
        result.append({
            'situation': x['situation'],
            'wins': x['wins'],
            'losses': x['losses'],
            'win_pct': x['pct'],
        })
    return result


def _build_player(pr):
    """Build a single player JSON object from a player_row."""
    # Agent list sorted by picks descending
    agents = []
    total_agent_maps = sum(pr['agents'].values()) // max(pr['rounds'], 1) or 1
    for agent, rounds_on_agent in sorted(pr['agents'].items(), key=lambda x: -x[1]):
        maps_on_agent = 0
        # Approximate maps: agent rounds / avg rounds per map
        avg_rds = pr['rounds'] / max(pr['maps'], 1)
        maps_on_agent = round(rounds_on_agent / avg_rds) if avg_rds > 0 else 0
        agents.append({
            'agent': agent,
            'picks': rounds_on_agent,
            'matches': maps_on_agent,
            'pct': round(maps_on_agent / pr['maps'] * 100, 1) if pr['maps'] > 0 else 0,
        })

    return {
        'ign': pr['name'],
        'team': pr['team'],
        'acs_split': pr['acs'],
        'acs_year': pr['acs'],
        'adr': pr.get('adr', 0),
        'rounds': pr['rounds'],
        'kills': pr['kills'],
        'deaths': pr['deaths'],
        'assists': pr['assists'],
        'fk': pr['fk'],
        'fd': pr['fd'],
        'kd': pr['kd'],
        'kad': pr['kad'],
        'first_pct': pr['first_pct'],
        'fk_pct': pr['fk_per_round'],
        'fd_pct': pr['fd_per_round'],
        'first_conversion': pr['first_pct'],
        'clutch_scens': pr['clutch_attempts'],
        'clutches': pr['clutch_wins'],
        'clutch_pct': pr['clutch_pct'],
        'kast': pr['kast'],
        'awp_pct': pr['op_pct'],
        'vlr_rating': pr.get('vlr_rating', 0),
        'agents': agents,
    }


def _build_match(mr):
    """Build a single match JSON object."""
    return {
        'match_id': mr['match_id'],
        'series_id': _make_series_id(mr['date'], mr['team1'], mr['team2']),
        'event': EVENT_NAME,
        'map': mr['map'],
        'team1': mr['team1'],
        'team2': TAG_TO_NAME.get(mr['team2'], mr['team2']),
        'team1_agents': mr['team1_agents'],
        'team2_agents': mr['team2_agents'],
        'team1_score': mr['team1_score'],
        'team2_score': mr['team2_score'],
        'team1_score_at_half': mr['team1_half'],
        'team2_score_at_half': mr['team2_half'],
        'team1_atk_pistol_wins': mr['team1_atk_pistol'],
        'team1_def_pistol_wins': mr['team1_def_pistol'],
        'team2_atk_pistol_wins': mr.get('team2_atk_pistol', 0),
        'team2_def_pistol_wins': mr.get('team2_def_pistol', 0),
        'team1_atk_wins': mr['team1_atk_wins'],
        'team1_atk_losses': mr['team1_atk_losses'],
        'team1_def_wins': mr['team1_def_wins'],
        'team1_def_losses': mr['team1_def_losses'],
        'winner': TAG_TO_NAME.get(mr['winner'], mr['winner']),
        'date': mr['date'],
    }


def _build_leaderboards(all_player_rows):
    """Build ranked player lists for all stat categories."""
    qualified = [p for p in all_player_rows if p['rounds'] >= MIN_LEADERBOARD_ROUNDS]

    stats_config = {
        'acs':    {'key': 'acs',          'desc': True},
        'kills':  {'key': 'kills',        'desc': True},
        'deaths': {'key': 'deaths',       'desc': False},  # lower is better
        'assists':{'key': 'assists',      'desc': True},
        'kd':     {'key': 'kd',           'desc': True},
        'kast':   {'key': 'kast',         'desc': True},
        'fk':     {'key': 'fk',           'desc': True},
        'fd':     {'key': 'fd',           'desc': False},  # lower is better
        'fk_pct': {'key': 'fk_per_round', 'desc': True},
        'fd_pct': {'key': 'fd_per_round', 'desc': False},  # lower is better
        'cl_pct': {'key': 'clutch_pct',   'desc': True},
    }

    leaderboards = {}
    for stat_name, cfg in stats_config.items():
        sorted_players = sorted(qualified, key=lambda p: p[cfg['key']], reverse=cfg['desc'])
        entries = []
        for rank, p in enumerate(sorted_players, 1):
            entries.append({
                'rank': rank,
                'ign': p['name'],
                'team': p['team'],
                'value': p[cfg['key']],
                'rounds': p['rounds'],
            })
        # Tournament average
        if qualified:
            avg_val = sum(p[cfg['key']] for p in qualified) / len(qualified)
        else:
            avg_val = 0
        leaderboards[stat_name] = {
            'entries': entries,
            'tournament_avg': round(avg_val, 3),
        }

    return leaderboards


def _merge_player_rows(player_rows):
    """Merge player rows that share the same name+team (different PUUIDs, e.g. account changes)."""
    merged = {}
    for pr in player_rows:
        key = (pr['name'].lower(), pr['team'])
        if key not in merged:
            merged[key] = dict(pr)
            merged[key]['agents'] = dict(pr['agents'])
            merged[key]['weapons'] = dict(pr['weapons'])
        else:
            m = merged[key]
            # Keep latest name casing
            m['name'] = pr['name']
            # Sum raw counts
            old_rounds = m['rounds']
            new_rounds = pr['rounds']
            total_rounds = old_rounds + new_rounds
            # Weighted ACS
            m['acs'] = round((m['acs'] * old_rounds + pr['acs'] * new_rounds) / total_rounds) if total_rounds > 0 else 0
            m['rounds'] = total_rounds
            m['kills'] += pr['kills']
            m['deaths'] += pr['deaths']
            m['assists'] += pr['assists']
            m['score'] = m['acs'] * total_rounds  # reconstruct
            m['fk'] += pr['fk']
            m['fd'] += pr['fd']
            m['clutch_wins'] += pr['clutch_wins']
            m['clutch_attempts'] += pr['clutch_attempts']
            m['op_kills'] += pr['op_kills']
            m['maps'] += pr['maps']
            # Merge agent/weapon counters
            for a, c in pr['agents'].items():
                m['agents'][a] = m['agents'].get(a, 0) + c
            for w, c in pr['weapons'].items():
                m['weapons'][w] = m['weapons'].get(w, 0) + c
            # Recompute ratios
            fk, fd = m['fk'], m['fd']
            m['kd'] = round(m['kills'] / max(m['deaths'], 1), 3)
            m['kad'] = round((m['kills'] + m['assists']) / max(m['deaths'], 1), 3)
            m['fk_fd_ratio'] = round(fk / max(fd, 1), 3)
            m['fk_per_round'] = round(fk / total_rounds, 4)
            m['fd_per_round'] = round(fd / total_rounds, 4)
            m['first_pct'] = round(fk / (fk + fd), 3) if (fk + fd) > 0 else 0
            m['clutch_pct'] = round(m['clutch_wins'] / m['clutch_attempts'], 3) if m['clutch_attempts'] > 0 else 0
            total_kills = m['kills']
            m['op_pct'] = round(m['op_kills'] / total_kills, 3) if total_kills > 0 else 0
            # KAST: weighted average
            old_kast_rnds = round(m['kast'] * old_rounds)  # approximate
            new_kast_rnds = round(pr['kast'] * new_rounds)
            m['kast'] = round((old_kast_rnds + new_kast_rnds) / total_rounds, 3) if total_rounds > 0 else 0
    return list(merged.values())


def build_stats_json(all_team_data):
    """Top-level assembly. Returns {teams, players, matches, leaderboards}."""
    teams_out = []
    all_players_out = []
    all_match_rows = []
    all_player_rows = []
    all_role_players_out = []
    all_agent_players_out = []
    all_ability_rows = []

    # First pass: build team objects (without rankings)
    for tag, td in all_team_data.items():
        # Merge players with same name (different accounts)
        merged_players = _merge_player_rows(td['player_rows'])

        maps_list, all_maps_obj = _build_map_stats(
            td['match_rows'], td['round_econ_rows'], td['post_plant_rows'], td['name']
        )
        s_wins, s_losses = _compute_series_record(td['match_rows'], td['name'])
        form = _compute_form(td['match_rows'], td['name'])

        player_names = list({pr['name'] for pr in merged_players})

        team_obj = {
            'name': td['name'],
            'tag': tag,
            'maps': maps_list,
            'allMaps': all_maps_obj,
            'players': player_names,
            'xvy': _build_xvy(td['xvy_rows']),
            'series_record': {'wins': s_wins, 'losses': s_losses},
            'form': form,
        }
        teams_out.append(team_obj)

        for pr in merged_players:
            all_players_out.append(_build_player(pr))
            all_player_rows.append(pr)

        # Build per-role player entries (merge by name+team+role)
        role_merged = {}
        for pr in td.get('player_role_rows', []):
            key = (pr['name'].lower(), pr['team'], pr.get('role', 'Unknown'))
            if key not in role_merged:
                role_merged[key] = dict(pr)
                role_merged[key]['agents'] = dict(pr['agents'])
                role_merged[key]['weapons'] = dict(pr['weapons'])
            else:
                # Same merge logic but role-aware (rare: only for account changes)
                m = role_merged[key]
                m['rounds'] += pr['rounds']
                m['kills'] += pr['kills']
                m['deaths'] += pr['deaths']
                m['assists'] += pr['assists']
                m['fk'] = m.get('first_kills', 0) + pr.get('first_kills', 0)
                m['fd'] = m.get('first_deaths', 0) + pr.get('first_deaths', 0)
                m['clutch_wins'] += pr['clutch_wins']
                m['clutch_attempts'] += pr['clutch_attempts']
                m['kast_rounds'] = m.get('kast_rounds', 0) + pr.get('kast_rounds', 0)
                m['operator_kills'] = m.get('operator_kills', 0) + pr.get('operator_kills', 0)
                m['total_kills_for_awp'] = m.get('total_kills_for_awp', 0) + pr.get('total_kills_for_awp', 0)
        for (_, _, role_name), pr in role_merged.items():
            rp = _build_player(pr)
            rp['role'] = role_name
            all_role_players_out.append(rp)

        # Build per-agent player entries
        for pr in td.get('player_agent_rows', []):
            ap = _build_player(pr)
            ap['agent'] = pr.get('agent', '?')
            all_agent_players_out.append(ap)

        # Collect ability rows, merge by (name, team, agent)
        ab_merged = {}
        for ar in td.get('ability_rows', []):
            key = (ar['name'].lower(), ar['team'], ar['agent'])
            if key not in ab_merged:
                ab_merged[key] = dict(ar)
            else:
                m = ab_merged[key]
                m['rounds'] += ar['rounds']
                for slot in ('grenade', 'ability1', 'ability2', 'ultimate'):
                    m[f'casts_{slot}'] += ar[f'casts_{slot}']
                    m[f'kills_{slot}'] += ar[f'kills_{slot}']
        all_ability_rows.extend(ab_merged.values())

        all_match_rows.extend(td['match_rows'])

    # Compute tournament-wide post-plant/retake rankings per map
    _compute_rankings(teams_out)

    # Deduplicate matches by match_id
    seen = set()
    unique_matches = []
    for mr in sorted(all_match_rows, key=lambda m: m['date'], reverse=True):
        if mr['match_id'] not in seen:
            seen.add(mr['match_id'])
            unique_matches.append(_build_match(mr))

    # Build leaderboards
    leaderboards = _build_leaderboards(all_player_rows)

    # Build agent_stats array
    agent_stats_out = []
    for ar in all_ability_rows:
        rds = ar['rounds']
        entry = {
            'ign': ar['name'],
            'team': ar['team'],
            'agent': ar['agent'],
            'rounds': rds,
        }
        for slot in ('grenade', 'ability1', 'ability2', 'ultimate'):
            entry[f'casts_{slot}'] = ar[f'casts_{slot}']
            entry[f'casts_{slot}_per_round'] = round(ar[f'casts_{slot}'] / rds, 3) if rds > 0 else 0
            entry[f'kills_{slot}'] = ar[f'kills_{slot}']
        agent_stats_out.append(entry)

    return {
        'teams': teams_out,
        'players': all_players_out,
        'players_by_role': all_role_players_out,
        'players_by_agent': all_agent_players_out,
        'matches': unique_matches,
        'leaderboards': leaderboards,
        'agent_stats': agent_stats_out,
        'ability_names': ABILITY_NAMES,
    }


def _compute_rankings(teams_out):
    """Compute post_rank and ret_rank per map across all teams. Mutates team objects."""
    # Collect all map names
    all_map_names = set()
    for t in teams_out:
        for m in t['maps']:
            all_map_names.add(m['map'])
    all_map_names.add('All Maps')

    for map_name in all_map_names:
        # Gather (team_idx, map_idx, post_rW_pct, ret_rW_pct) for this map
        post_entries = []
        ret_entries = []
        for ti, t in enumerate(teams_out):
            if map_name == 'All Maps':
                m = t['allMaps']
                mi = -1
            else:
                found = None
                for mi2, m2 in enumerate(t['maps']):
                    if m2['map'] == map_name:
                        found = (mi2, m2)
                        break
                if found is None:
                    continue
                mi, m = found

            if m['post_scens'] > 0:
                post_entries.append((ti, mi, m['post_rW_pct']))
            if m['ret_scens'] > 0:
                ret_entries.append((ti, mi, m['ret_rW_pct']))

        # Event averages
        if post_entries:
            post_avg = sum(e[2] for e in post_entries) / len(post_entries)
        else:
            post_avg = 0
        if ret_entries:
            ret_avg = sum(e[2] for e in ret_entries) / len(ret_entries)
        else:
            ret_avg = 0

        # Rank by pct descending
        post_entries.sort(key=lambda e: -e[2])
        ret_entries.sort(key=lambda e: -e[2])

        for rank, (ti, mi, pct) in enumerate(post_entries, 1):
            target = teams_out[ti]['allMaps'] if mi == -1 else teams_out[ti]['maps'][mi]
            target['post_rank'] = rank
            target['post_rW_event_avg'] = round(post_avg, 3)

        for rank, (ti, mi, pct) in enumerate(ret_entries, 1):
            target = teams_out[ti]['allMaps'] if mi == -1 else teams_out[ti]['maps'][mi]
            target['ret_rank'] = rank
            target['ret_rW_event_avg'] = round(ret_avg, 3)
