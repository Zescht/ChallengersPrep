#!/usr/bin/env python3
"""Build stats.json and stats_playoffs.json from raw JSONL match data."""

import datetime
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.constants import TEAMS
from lib.match_parser import load_team_matches
from lib.stats_engine import compute_team_stats
from lib.json_builder import build_stats_json

CL3_START = datetime.date(2026, 6, 21)

OUTPUTS = [
    {'label': 'Full',  'from_date': None,       'path': 'vcl-frontend/public/data/stats.json'},
    {'label': 'CL3',   'from_date': CL3_START,  'path': 'vcl-frontend/public/data/stats_playoffs.json'},
]


def build(from_date, output_path):
    all_team_data = {}
    for team_cfg in TEAMS:
        data_file = team_cfg['data_file']
        if not os.path.exists(data_file):
            print(f"  WARNING: {data_file} not found, skipping {team_cfg['name']}")
            continue
        matches = load_team_matches(
            team_cfg['tag'], team_cfg['name'], data_file, from_date=from_date
        )
        stats = compute_team_stats(matches, team_cfg['tag'], team_cfg['name'],
                                   roster=team_cfg.get('roster'))
        all_team_data[team_cfg['tag']] = {
            'name': team_cfg['name'],
            'tag': team_cfg['tag'],
            **stats,
        }

    result = build_stats_json(all_team_data)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)

    size_kb = os.path.getsize(output_path) / 1024
    print(f"  Wrote {output_path} ({size_kb:.0f} KB) — "
          f"{len(result['teams'])} teams, {len(result['players'])} players, "
          f"{len(result['matches'])} matches")


def main():
    print(f"Building stats ({len(TEAMS)} teams)...\n")
    for cfg in OUTPUTS:
        label = cfg['label']
        from_date = cfg['from_date']
        date_str = f"from {from_date}" if from_date else "all dates"
        print(f"[{label}] {date_str}")
        build(from_date, cfg['path'])
    print("\nDone.")


if __name__ == '__main__':
    main()
