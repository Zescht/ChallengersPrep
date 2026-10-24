#!/usr/bin/env python3
"""Collect match data for VCL EMEA 2026 teams via Valolytics API using curl."""

import json
import subprocess
import sys
import time
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib.api_key import load_api_key

API_BASE = 'https://api.valolytics.gg'
API_KEY = load_api_key()

# Teams to collect (tag, full name, key player gameName)
# Already have: FKS, SGE, EP
TEAMS_TO_COLLECT = [
    ('jl',   'JL',   'JL chiwa'),
    ('mdr',  'MDR',  'MDR TakaS'),
    ('tl',   'TL',   'TL Kicks'),
    ('pxl',  'PXL',  'PXL elllement'),
    ('m1r',  'M1R',  'M1R Redgar'),
    ('bar',  'BAR',  'BAR Stonezy'),
    ('ucam', 'UCAM', 'UCAM Jesse'),
    ('misa', 'MISA', 'MISA Brave'),
    ('s2g',  'S2G',  'S2G reazy'),
    ('sts',  'STS',  'STS Avvix'),
    ('gng',  'GNG',  'GNG LOOP'),
]


def curl_get(url):
    """Make GET request via curl. Returns parsed JSON or None on error."""
    result = subprocess.run(
        ['curl', '-s', '-H', f'x-api-key: {API_KEY}', url],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        print(f"    curl error: {result.stderr}")
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"    JSON decode error: {result.stdout[:200]}")
        return None


def resolve_puuid(game_name):
    """Resolve a player's Riot ID to PUUID. All esports players use tagLine 'epval'."""
    # gameName format: "TAG PlayerName" -> need just the name part after the tag space
    # But the API endpoint uses gameName/tagLine separately
    # Actually the full gameName includes the tag, e.g. "JL chiwa"
    # The API wants: /by-riot-id/esports/{gameName}/{tagLine}
    # gameName = "JL chiwa", tagLine = "epval"
    encoded_name = game_name.replace(' ', '%20')
    url = f'{API_BASE}/api/riot/account/v1/accounts/by-riot-id/esports/{encoded_name}/epval'
    print(f"  Resolving PUUID for {game_name}...")
    data = curl_get(url)
    if data and 'puuid' in data:
        print(f"    -> {data['puuid'][:16]}...")
        return data['puuid']
    print(f"    -> FAILED: {data}")
    return None


def get_match_history(puuid):
    """Get match history for a PUUID."""
    url = f'{API_BASE}/api/riot/match/v1/matchlists/by-puuid/esports/{puuid}'
    print(f"  Getting match history...")
    data = curl_get(url)
    if data and 'history' in data:
        print(f"    -> {len(data['history'])} total matches")
        return data['history']
    print(f"    -> FAILED: {data}")
    return None


def filter_2026_matches(history):
    """Filter match history to 2026 only."""
    filtered = []
    for m in history:
        start_ms = m.get('gameStartTimeMillis', 0)
        # 2026-01-01 00:00:00 UTC = 1767225600000
        # 2027-01-01 00:00:00 UTC = 1798761600000
        if 1767225600000 <= start_ms < 1798761600000:
            filtered.append(m)
    print(f"    -> {len(filtered)} matches in 2026")
    return filtered


def fetch_match_detail(match_id):
    """Fetch full match details."""
    url = f'{API_BASE}/api/matches/esports/{match_id}'
    return curl_get(url)


def collect_team(file_tag, team_tag, key_player):
    """Full collection pipeline for one team."""
    output_file = f'data/raw/{file_tag}_2026_raw_responses.jsonl'

    if os.path.exists(output_file):
        print(f"\n[SKIP] {team_tag} — {output_file} already exists")
        return True

    print(f"\n{'='*50}")
    print(f"Collecting {team_tag} (key player: {key_player})")
    print(f"{'='*50}")

    # Step 1: Resolve PUUID
    puuid = resolve_puuid(key_player)
    if not puuid:
        print(f"  FAILED to resolve PUUID for {key_player}")
        return False

    # Step 2: Get match history
    history = get_match_history(puuid)
    if not history:
        print(f"  FAILED to get match history")
        return False

    # Step 3: Filter to 2026
    matches_2026 = filter_2026_matches(history)
    if not matches_2026:
        print(f"  No 2026 matches found!")
        return False

    # Step 4: Fetch each match detail
    print(f"  Fetching {len(matches_2026)} match details...")
    collected = 0
    with open(output_file, 'w') as f:
        for i, m in enumerate(matches_2026):
            match_id = m['matchId']
            detail = fetch_match_detail(match_id)
            if detail:
                f.write(json.dumps(detail) + '\n')
                collected += 1
            else:
                print(f"    FAILED match {match_id}")

            if (i + 1) % 10 == 0:
                print(f"    {i+1}/{len(matches_2026)} fetched...")

            # Small delay to be nice to the API
            time.sleep(0.2)

    print(f"  -> Saved {collected}/{len(matches_2026)} matches to {output_file}")
    return True


def main():
    # Allow filtering to a single team via command line
    filter_tag = sys.argv[1].upper() if len(sys.argv) > 1 else None

    success = []
    failed = []

    for file_tag, team_tag, key_player in TEAMS_TO_COLLECT:
        if filter_tag and team_tag != filter_tag:
            continue
        ok = collect_team(file_tag, team_tag, key_player)
        if ok:
            success.append(team_tag)
        else:
            failed.append(team_tag)

    print(f"\n{'='*50}")
    print(f"DONE: {len(success)} succeeded, {len(failed)} failed")
    if failed:
        print(f"Failed: {', '.join(failed)}")
    print(f"{'='*50}")


if __name__ == '__main__':
    main()
