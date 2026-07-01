"""Load and parse JSONL match data, resolve teams, filter tech issues."""

import json
import datetime
from collections import Counter
from .constants import AGENT_MAP


class MatchData:
    """Parsed match with team context resolved."""
    __slots__ = [
        'match_id', 'map', 'date', 'dt', 'team_id', 'opp_team_id',
        'team_score', 'opp_score', 'opp', 'team_won', 'team_players',
        'opp_players', 'round_results', 'raw', 'is_tech', 'team_tag',
        'team_name',
    ]


def load_team_matches(team_tag, team_name, data_file, match_ids=None, from_date=None):
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

        # First pass: identify team_id by finding any player whose name tag matches
        team_id = None
        opp_tag = None

        for p in m['players']:
            if p.get('isObserver'):
                continue
            name = p.get('gameName', '')
            tag = name.split(' ')[0] if ' ' in name else name
            if tag == team_tag:
                team_id = p['teamId']
                break

        if team_id is None:
            continue

        # Second pass: assign players by teamId (not name prefix)
        team_players = []
        opp_players = []
        opp_tag_counts = Counter()
        for p in m['players']:
            if p.get('isObserver'):
                continue
            if p['teamId'] == team_id:
                team_players.append(p)
            else:
                name = p.get('gameName', '')
                tag = name.split(' ')[0] if ' ' in name else name
                if tag:
                    opp_tag_counts[tag] += 1
                opp_players.append(p)
        # Use the majority tag, not just whichever player happens to be listed
        # first — a single substitute/alt-tagged player can otherwise mislabel
        # the whole match (e.g. a "BONK sizo" sub on an NVJ roster).
        opp_tag = opp_tag_counts.most_common(1)[0][0] if opp_tag_counts else None

        opp_team_id = 'Blue' if team_id == 'Red' else 'Red'
        team_score = opp_score = 0
        for t in m['teams']:
            if t['teamId'] == team_id:
                team_score = t['roundsWon']
            else:
                opp_score = t['roundsWon']

        # Filter out tech issues (incomplete scores) and non-standard maps (skirmishes, etc.)
        BAD_MAPS = {'Piazza', 'Skirmish', 'Skirmish B', 'Skirmish C', ''}
        is_tech = max(team_score, opp_score) < 13 or map_name in BAD_MAPS

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
            if match_ids is not None and md.match_id not in match_ids:
                continue
            if from_date is not None and md.dt.date() < from_date:
                continue
            matches.append(md)

    return matches
