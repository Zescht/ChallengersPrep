"""Core stat computation: economy, sides, player stats, XvY, post-plant."""

from collections import defaultdict, Counter
from .constants import AGENT_MAP, AGENT_ROLE, WEAPON_MAP, OPERATOR_UUID, ABILITY_NAMES, ABILITY_KILL_SLOTS


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
    """Classify round as pistol/antieco/gun/eco/force based on team loadout."""
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


def compute_team_stats(matches, team_tag, team_name):
    """Process all matches for a team. Returns structured stat accumulators."""
    match_rows = []
    econ_accum = defaultdict(lambda: {'w': 0, 'l': 0})
    xvy_accum = defaultdict(lambda: {'wins': 0, 'total': 0})
    pp_accum = defaultdict(lambda: {'plants': 0, 'wins': 0, 'losses': 0})
    plant_time_accum = defaultdict(list)  # map_name -> [plantRoundTimeMillis, ...]
    plant_time_by_site = defaultdict(list)  # (map_name, site) -> [plantRoundTimeMillis, ...]
    def _new_accum():
        return {
            'name': '', 'team': team_name, 'agents': Counter(), 'rounds': 0,
            'kills': 0, 'deaths': 0, 'assists': 0, 'score': 0,
            'total_damage': 0,
            'first_kills': 0, 'first_deaths': 0,
            'operator_kills': 0, 'total_kills_for_awp': 0,
            'clutch_wins': 0, 'clutch_attempts': 0,
            'kast_rounds': 0, 'maps_played': 0,
            'vlr_rating_sum': 0.0, 'vlr_rating_rounds': 0,
            'weapons': Counter(),
        }
    player_accum = defaultdict(_new_accum)
    # Per-role accumulators: role_accum[puuid][role] = same shape as player_accum
    role_accum = defaultdict(lambda: defaultdict(_new_accum))
    # Per-agent accumulators: agent_player_accum[puuid][agent] = same shape as player_accum
    agent_player_accum = defaultdict(lambda: defaultdict(_new_accum))
    # Per-player-per-agent ability stats: ability_accum[(puuid, agent)] = {rounds, casts_*, kills_*}
    def _new_ability_accum():
        return {
            'rounds': 0,
            'casts_grenade': 0, 'casts_ability1': 0, 'casts_ability2': 0, 'casts_ultimate': 0,
            'kills_grenade': 0, 'kills_ability1': 0, 'kills_ability2': 0, 'kills_ultimate': 0,
        }
    ability_accum = defaultdict(_new_ability_accum)

    for md in matches:
        team_puuids = {p['puuid'] for p in md.team_players}
        sides = get_team_side_per_round(md, team_puuids)

        comp = sorted([AGENT_MAP.get(p.get('characterId', ''), '?') for p in md.team_players])
        opp_comp = sorted([AGENT_MAP.get(p.get('characterId', ''), '?') for p in md.opp_players])

        team_first_half = 0
        opp_first_half = 0
        atk_wins = atk_losses = def_wins = def_losses = 0
        atk_pistol_wins = def_pistol_wins = 0
        opp_atk_pistol_wins = opp_def_pistol_wins = 0

        for rr in md.round_results:
            rnum = rr['roundNum']
            team_side = sides.get(rnum, 'atk')
            won = rr['winningTeam'] == md.team_id

            if rnum < 12:
                if won:
                    team_first_half += 1
                else:
                    opp_first_half += 1

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

            # Pistol tracking (both teams)
            if rnum == 0 or rnum == 12:
                if won:
                    if team_side == 'atk':
                        atk_pistol_wins += 1
                    else:
                        def_pistol_wins += 1
                else:
                    # Opponent won the pistol
                    if team_side == 'atk':
                        opp_def_pistol_wins += 1
                    else:
                        opp_atk_pistol_wins += 1

            # Economy classification
            econ = classify_round_economy(rr, rnum, team_puuids)
            if econ in ('eco', 'antieco', 'gun', 'force'):
                econ_key = econ if econ != 'force' else 'gun'
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
                else:
                    pp_key = (md.map, site, 'def')
                pp_accum[pp_key]['plants'] += 1
                if won:
                    pp_accum[pp_key]['wins'] += 1
                else:
                    pp_accum[pp_key]['losses'] += 1
                # Track plant time when team planted (attack side)
                if planter in team_puuids:
                    prt = rr.get('plantRoundTime')
                    if prt and prt > 0:
                        plant_time_accum[md.map].append(prt)
                        plant_time_by_site[(md.map, site)].append(prt)

            # Per-round player stats
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
                        kill_times[victim] = {
                            'death_time': k.get('timeSinceRoundStartMillis', 0),
                            'killer': k['killer'],
                        }

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

                # Determine agent and role for this match
                agent = '?'
                for p in md.team_players:
                    if p['puuid'] == puuid:
                        agent = AGENT_MAP.get(p.get('characterId', ''), '?')
                        break
                role = AGENT_ROLE.get(agent, 'Unknown')
                ra = role_accum[puuid][role]
                ra['name'] = pname
                apa = agent_player_accum[puuid][agent]
                apa['name'] = pname
                targets = [pa, ra, apa]  # write stats to overall, role-specific, and agent-specific

                for t in targets:
                    t['rounds'] += 1
                pa['agents'][agent] += 1
                ra['agents'][agent] += 1
                apa['agents'][agent] += 1
                # Track rounds on this agent for ability stats
                if agent in ABILITY_NAMES:
                    ability_accum[(puuid, agent)]['rounds'] += 1

                kills = ps.get('kills', [])
                kill_count = len(kills)
                score = ps.get('score', 0)
                dmg_total = sum(d.get('damage', 0) for d in ps.get('damage', []))
                for t in targets:
                    t['kills'] += kill_count
                    t['score'] += score
                    t['total_damage'] += dmg_total

                is_dead = puuid in all_victims
                if is_dead:
                    for t in targets:
                        t['deaths'] += 1

                assists = sum(1 for k in all_kills_in_round
                              if k['killer'] != puuid and puuid in k.get('assistants', []))
                for t in targets:
                    t['assists'] += assists

                if first_kill_puuid == puuid:
                    for t in targets:
                        t['first_kills'] += 1
                if first_death_puuid == puuid:
                    for t in targets:
                        t['first_deaths'] += 1

                for k in kills:
                    dmg_item = k.get('finishingDamage', {}).get('damageItem', '').upper()
                    is_op = dmg_item == OPERATOR_UUID
                    weapon_name = WEAPON_MAP.get(dmg_item, None)
                    for t in targets:
                        t['total_kills_for_awp'] += 1
                        if is_op:
                            t['operator_kills'] += 1
                        if weapon_name:
                            t['weapons'][weapon_name] += 1

                    # Track ability kills per agent
                    dmg_type = k.get('finishingDamage', {}).get('damageType', '')
                    raw_item = k.get('finishingDamage', {}).get('damageItem', '')
                    if dmg_type == 'Ability' and agent in ABILITY_NAMES:
                        slot = ABILITY_KILL_SLOTS.get(raw_item)
                        if slot:
                            ability_accum[(puuid, agent)][f'kills_{slot}'] += 1

                # KAST
                has_kill = kill_count > 0
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
                    for t in targets:
                        t['kast_rounds'] += 1

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
                        # Also accumulate into role-specific and agent-specific buckets
                        cp_agent = AGENT_MAP.get(
                            next((p.get('characterId', '') for p in md.team_players if p['puuid'] == cp), ''), '?')
                        cp_role = AGENT_ROLE.get(cp_agent, 'Unknown')
                        role_accum[cp][cp_role]['clutch_attempts'] += 1
                        agent_player_accum[cp][cp_agent]['clutch_attempts'] += 1
                        if won:
                            player_accum[cp]['clutch_wins'] += 1
                            role_accum[cp][cp_role]['clutch_wins'] += 1
                            agent_player_accum[cp][cp_agent]['clutch_wins'] += 1
                    break

        for p in md.team_players:
            puuid = p['puuid']
            agent = AGENT_MAP.get(p.get('characterId', ''), '?')
            role = AGENT_ROLE.get(agent, 'Unknown')
            player_accum[puuid]['maps_played'] += 1
            role_accum[puuid][role]['maps_played'] += 1
            agent_player_accum[puuid][agent]['maps_played'] += 1
            vlr_r = p.get('stats', {}).get('vlrRating2')
            rp = p.get('stats', {}).get('roundsPlayed', 0)
            if vlr_r is not None and rp > 0:
                player_accum[puuid]['vlr_rating_sum'] += vlr_r * rp
                player_accum[puuid]['vlr_rating_rounds'] += rp
                role_accum[puuid][role]['vlr_rating_sum'] += vlr_r * rp
                role_accum[puuid][role]['vlr_rating_rounds'] += rp
                agent_player_accum[puuid][agent]['vlr_rating_sum'] += vlr_r * rp
                agent_player_accum[puuid][agent]['vlr_rating_rounds'] += rp
            # Ability casts (match-level totals)
            if agent in ABILITY_NAMES:
                ac = p.get('stats', {}).get('abilityCasts', {})
                if ac:
                    aa = ability_accum[(puuid, agent)]
                    aa['casts_grenade'] += ac.get('grenadeCasts', 0) or 0
                    aa['casts_ability1'] += ac.get('ability1Casts', 0) or 0
                    aa['casts_ability2'] += ac.get('ability2Casts', 0) or 0
                    aa['casts_ultimate'] += ac.get('ultimateCasts', 0) or 0

        match_rows.append({
            'match_id': md.match_id,
            'map': md.map,
            'team1': team_name,
            'team1_tag': team_tag,
            'team2': md.opp,
            'team1_agents': comp,
            'team2_agents': opp_comp,
            'team1_score': md.team_score,
            'team2_score': md.opp_score,
            'team1_half': team_first_half,
            'team2_half': opp_first_half,
            'team1_atk_pistol': atk_pistol_wins,
            'team1_def_pistol': def_pistol_wins,
            'team2_atk_pistol': opp_atk_pistol_wins,
            'team2_def_pistol': opp_def_pistol_wins,
            'team1_atk_wins': atk_wins,
            'team1_atk_losses': atk_losses,
            'team1_def_wins': def_wins,
            'team1_def_losses': def_losses,
            'date': md.date,
            'winner': team_name if md.team_won else md.opp,
        })

    # Build economy rows
    round_econ_rows = []
    for (map_name, econ_type, side), data in econ_accum.items():
        total = data['w'] + data['l']
        round_econ_rows.append({
            'team': team_name, 'map': map_name, 'type': econ_type, 'side': side,
            'wins': data['w'], 'losses': data['l'],
            'pct': data['w'] / total if total > 0 else 0,
        })

    # Build XvY rows
    xvy_rows = []
    for (fc, oc), data in xvy_accum.items():
        xvy_rows.append({
            'team': team_name, 'situation': f'{fc}v{oc}',
            'team_alive': fc, 'opp_alive': oc,
            'wins': data['wins'], 'losses': data['total'] - data['wins'],
            'pct': data['wins'] / data['total'] if data['total'] > 0 else 0,
        })

    # Build post-plant rows
    post_plant_rows = []
    for (map_name, site, role), data in pp_accum.items():
        post_plant_rows.append({
            'team': team_name, 'map': map_name, 'site': site, 'role': role,
            'plants': data['plants'], 'wins': data['wins'], 'losses': data['losses'],
            'pct': data['wins'] / data['plants'] if data['plants'] > 0 else 0,
        })

    def _build_row(puuid, pa, role_label=None):
        fk, fd = pa['first_kills'], pa['first_deaths']
        row = {
            'puuid': puuid,
            'team': team_name,
            'team_tag': team_tag,
            'name': pa['name'],
            'rounds': pa['rounds'],
            'kills': pa['kills'],
            'deaths': pa['deaths'],
            'assists': pa['assists'],
            'acs': round(pa['score'] / pa['rounds']) if pa['rounds'] > 0 else 0,
            'adr': round(pa['total_damage'] / pa['rounds'], 1) if pa['rounds'] > 0 else 0,
            'fk': fk,
            'fd': fd,
            'kd': round(pa['kills'] / max(pa['deaths'], 1), 3),
            'kad': round((pa['kills'] + pa['assists']) / max(pa['deaths'], 1), 3),
            'fk_fd_ratio': round(fk / max(fd, 1), 3),
            'fk_per_round': round(fk / pa['rounds'], 4),
            'fd_per_round': round(fd / pa['rounds'], 4),
            'first_pct': round(fk / (fk + fd), 3) if (fk + fd) > 0 else 0,
            'clutch_wins': pa['clutch_wins'],
            'clutch_attempts': pa['clutch_attempts'],
            'clutch_pct': round(pa['clutch_wins'] / pa['clutch_attempts'], 3) if pa['clutch_attempts'] > 0 else 0,
            'kast': round(pa['kast_rounds'] / pa['rounds'], 3) if pa['rounds'] > 0 else 0,
            'op_kills': pa['operator_kills'],
            'op_pct': round(pa['operator_kills'] / pa['total_kills_for_awp'], 3) if pa['total_kills_for_awp'] > 0 else 0,
            'vlr_rating': round(pa['vlr_rating_sum'] / pa['vlr_rating_rounds'], 3) if pa['vlr_rating_rounds'] > 0 else 0,
            'maps': pa['maps_played'],
            'agents': dict(pa['agents']),
            'weapons': dict(pa['weapons']),
        }
        if role_label:
            row['role'] = role_label
        return row

    # Build player rows (overall)
    player_rows = []
    for puuid, pa in player_accum.items():
        if pa['rounds'] == 0:
            continue
        player_rows.append(_build_row(puuid, pa))

    # Build per-role player rows
    player_role_rows = []
    for puuid, roles in role_accum.items():
        for role_name, ra in roles.items():
            if ra['rounds'] == 0:
                continue
            player_role_rows.append(_build_row(puuid, ra, role_label=role_name))

    # Build per-agent player rows
    player_agent_rows = []
    for puuid, agents in agent_player_accum.items():
        for agent_name, apa in agents.items():
            if apa['rounds'] == 0:
                continue
            row = _build_row(puuid, apa)
            row['agent'] = agent_name
            player_agent_rows.append(row)

    # Build ability stat rows
    ability_rows = []
    for (puuid, agent), aa in ability_accum.items():
        if aa['rounds'] == 0:
            continue
        pa = player_accum[puuid]
        ability_rows.append({
            'puuid': puuid,
            'name': pa['name'],
            'team': team_name,
            'team_tag': team_tag,
            'agent': agent,
            'rounds': aa['rounds'],
            'casts_grenade': aa['casts_grenade'],
            'casts_ability1': aa['casts_ability1'],
            'casts_ability2': aa['casts_ability2'],
            'casts_ultimate': aa['casts_ultimate'],
            'kills_grenade': aa['kills_grenade'],
            'kills_ability1': aa['kills_ability1'],
            'kills_ability2': aa['kills_ability2'],
            'kills_ultimate': aa['kills_ultimate'],
        })

    print(f"  {team_name} ({team_tag}): {len(matches)} valid maps, {len(player_rows)} players")

    # Build avg plant time per map (convert ms to seconds)
    plant_time_rows = {}
    for map_name, times in plant_time_accum.items():
        if times:
            avg_ms = sum(times) / len(times)
            plant_time_rows[map_name] = round(avg_ms / 1000, 1)

    # Build avg plant time per map per site
    plant_time_site_rows = {}  # map_name -> { site -> avg_seconds }
    for (map_name, site), times in plant_time_by_site.items():
        if times and site != '?':
            if map_name not in plant_time_site_rows:
                plant_time_site_rows[map_name] = {}
            avg_ms = sum(times) / len(times)
            plant_time_site_rows[map_name][site] = round(avg_ms / 1000, 1)

    return {
        'match_rows': match_rows,
        'round_econ_rows': round_econ_rows,
        'xvy_rows': xvy_rows,
        'post_plant_rows': post_plant_rows,
        'player_rows': player_rows,
        'player_role_rows': player_role_rows,
        'player_agent_rows': player_agent_rows,
        'ability_rows': ability_rows,
        'plant_time_rows': plant_time_rows,
        'plant_time_site_rows': plant_time_site_rows,
    }
