#!/usr/bin/env python3
"""Collect Stage 3 match data (from 2026-05-17) for 4 teams via Valolytics API."""

import json
import subprocess
import sys
import time
import os
import datetime

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib.constants import TEAMS

API_BASE = 'https://api.valolytics.gg'
API_KEY = '<VALOLYTICS_API_KEY>'

# 2026-05-17 00:00:00 UTC in milliseconds
CUTOFF_MS = int(datetime.datetime(2026, 5, 17, tzinfo=datetime.timezone.utc).timestamp() * 1000)


def curl_get(url, retries=3):
    for attempt in range(retries):
        result = subprocess.run(
            ['curl', '-s',
             '-H', f'x-api-key: {API_KEY}',
             '-H', 'Accept: application/json',
             '-H', 'User-Agent: curl/8.0.0',
             url],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            print(f"    curl error: {result.stderr}")
            return None
        try:
            data = json.loads(result.stdout)
        except json.JSONDecodeError:
            print(f"    JSON decode error: {result.stdout[:200]}")
            return None
        if isinstance(data, dict) and data.get('statusCode') == 429:
            wait = 65
            print(f"    Rate limited — waiting {wait}s (attempt {attempt+1}/{retries})...")
            time.sleep(wait)
            continue
        return data
    print(f"    Failed after {retries} retries (rate limit)")
    return None


def resolve_puuid(game_name):
    encoded = game_name.replace(' ', '%20')
    url = f'{API_BASE}/api/riot/account/v1/accounts/by-riot-id/esports/{encoded}/epval'
    print(f"  Resolving PUUID for {game_name}...")
    data = curl_get(url)
    if data and 'puuid' in data:
        print(f"    -> {data['puuid'][:20]}...")
        return data['puuid']
    print(f"    -> FAILED: {data}")
    return None


def get_match_history(puuid):
    url = f'{API_BASE}/api/riot/match/v1/matchlists/by-puuid/esports/{puuid}'
    print(f"  Fetching match history...")
    data = curl_get(url)
    if data and 'history' in data:
        print(f"    -> {len(data['history'])} total matches")
        return data['history']
    print(f"    -> FAILED: {data}")
    return []


def filter_from_cutoff(history):
    filtered = [m for m in history if m.get('gameStartTimeMillis', 0) >= CUTOFF_MS]
    print(f"    -> {len(filtered)} matches from 2026-05-17 onwards")
    return filtered


def fetch_match_detail(match_id):
    url = f'{API_BASE}/api/matches/esports/{match_id}'
    return curl_get(url)


def collect_team(team):
    tag = team['tag']
    name = team['name']
    key_players = team['key_players']
    output_file = team['data_file']

    print(f"\n{'='*55}")
    print(f"  {name} ({tag})")
    print(f"{'='*55}")

    # Union match IDs across all key players
    seen_ids = {}  # match_id -> gameStartTimeMillis
    for player in key_players:
        puuid = resolve_puuid(player)
        if not puuid:
            print(f"  WARNING: could not resolve PUUID for {player}, skipping")
            continue
        history = get_match_history(puuid)
        for m in filter_from_cutoff(history):
            mid = m['matchId']
            if mid not in seen_ids:
                seen_ids[mid] = m.get('gameStartTimeMillis', 0)

    if not seen_ids:
        print(f"  FAILED: no matches found")
        return False

    # Sort by date ascending
    match_ids = sorted(seen_ids.keys(), key=lambda mid: seen_ids[mid])
    print(f"  {len(match_ids)} unique matches across {len(key_players)} players")
    print(f"  Fetching match details...")

    collected = 0
    os.makedirs('data/raw', exist_ok=True)
    with open(output_file, 'w') as f:
        for i, match_id in enumerate(match_ids):
            detail = fetch_match_detail(match_id)
            if detail and 'matchInfo' in detail:
                f.write(json.dumps(detail) + '\n')
                collected += 1
                ts = detail['matchInfo'].get('gameStartMillis', 0)
                dt = datetime.datetime.fromtimestamp(ts / 1000).strftime('%Y-%m-%d')
                map_name = detail['matchInfo'].get('map', '?')
                print(f"    [{i+1}/{len(match_ids)}] {dt} {map_name}")
            else:
                print(f"    [{i+1}/{len(match_ids)}] FAILED {match_id}")
            time.sleep(0.2)

    print(f"\n  Saved {collected}/{len(match_ids)} matches -> {output_file}")
    return True


def verify(team):
    import collections
    output_file = team['data_file']
    matches = []
    with open(output_file) as f:
        for line in f:
            d = json.loads(line)
            ts = d.get('matchInfo', {}).get('gameStartMillis', 0)
            map_name = d.get('matchInfo', {}).get('map', '?')
            dt = datetime.datetime.fromtimestamp(int(ts) / 1000).strftime('%Y-%m-%d')
            matches.append((dt, map_name))
    matches.sort()
    print(f"\n  Verification — {team['name']}:")
    print(f"    Total: {len(matches)} maps")
    for map_name, cnt in sorted(collections.Counter(m for _, m in matches).items()):
        print(f"    {map_name}: {cnt}")
    if matches:
        print(f"    Range: {matches[0][0]} – {matches[-1][0]}")


def main():
    print(f"Stage 3 data collection — cutoff: 2026-05-17 ({CUTOFF_MS} ms)")
    print(f"Teams: {', '.join(t['name'] for t in TEAMS)}\n")

    results = {}
    for i, team in enumerate(TEAMS):
        ok = collect_team(team)
        results[team['name']] = ok
        if i < len(TEAMS) - 1:
            time.sleep(5)  # brief pause between teams

    print(f"\n{'='*55}")
    print("SUMMARY")
    print(f"{'='*55}")
    for team in TEAMS:
        status = "OK" if results[team['name']] else "FAILED"
        print(f"  {team['name']:25s} {status}")

    print(f"\n{'='*55}")
    print("VERIFICATION")
    for team in TEAMS:
        if results[team['name']]:
            verify(team)


if __name__ == '__main__':
    main()
