"""Load and parse JSONL match data, resolve teams, filter tech issues."""

import json
import datetime
from .constants import AGENT_MAP


class MatchData:
    """Parsed match with team context resolved."""
    __slots__ = [
        'match_id', 'map', 'date', 'dt', 'team_id', 'opp_team_id',
        'team_score', 'opp_score', 'opp', 'team_won', 'team_players',
        'opp_players', 'round_results', 'raw', 'is_tech', 'team_tag',
        'team_name',
    ]


def load_team_matches(team_tag, team_name, data_file):
    """Load JSONL, parse each match, resolve Red/Blue to team, filter tech issues.

    Returns list of MatchData for valid (non-tech-issue) matches.
    """
    raw_matches = []
    with open(data_file, 'r') as f:
        for line in f:
            m = json.loads(line)
            if 'matchInfo' in m:
                raw_matches.append(m)

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

    return matches
