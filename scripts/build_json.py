#!/usr/bin/env python3
"""Build stats.json from raw JSONL match data for VCL EMEA 2026 dashboard."""

import argparse
import json
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.constants import TEAMS
from lib.match_parser import load_team_matches
from lib.stats_engine import compute_team_stats
from lib.json_builder import build_stats_json


def main():
    parser = argparse.ArgumentParser(description='Build stats.json from JSONL match data')
    parser.add_argument('--output', default='public/data/stats.json',
                        help='Output path for stats.json')
    args = parser.parse_args()

    print("Building stats.json from raw match data...")
    print(f"Processing {len(TEAMS)} teams\n")

    all_team_data = {}
    for team_cfg in TEAMS:
        data_file = team_cfg['data_file']
        if not os.path.exists(data_file):
            print(f"  WARNING: {data_file} not found, skipping {team_cfg['name']}")
            continue

        matches = load_team_matches(team_cfg['tag'], team_cfg['name'], data_file)
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


if __name__ == '__main__':
    main()
