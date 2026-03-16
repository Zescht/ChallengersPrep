"""
VLR.gg Team Stats Scraper
Scrapes agent compositions, map stats, and match data from VLR.gg team stats pages.
"""

import requests
import json
import re
import os
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urlencode

BASE_URL = "https://www.vlr.gg"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

MAP_POOL = [
    "Bind", "Haven", "Split", "Ascent", "Icebox", "Breeze",
    "Fracture", "Pearl", "Lotus", "Sunset", "Abyss", "Corrode",
]


def build_team_stats_url(team_id, team_slug, event_id="all", core_id="all",
                         date_start=None, date_end=None):
    base = f"{BASE_URL}/team/stats/{team_id}/{team_slug}/"
    params = {"event_id": event_id, "core_id": core_id}
    if date_start:
        params["date_start"] = date_start
    if date_end is not None:
        params["date_end"] = date_end
    return f"{base}?{urlencode(params)}"


def fetch_page(url):
    print(f"  Fetching: {url}")
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "lxml")


def parse_team_header(soup):
    info = {}
    header = soup.select_one("div.team-header")
    if header:
        name_el = header.select_one("h1.wf-title")
        if name_el:
            info["name"] = name_el.get_text(strip=True)
        tag_el = header.select_one("h2.wf-title")
        if tag_el:
            info["tag"] = tag_el.get_text(strip=True)
    return info


def parse_overview_row(cells):
    """Parse a single overview table row (14 columns)."""
    texts = [c.get_text(strip=True) for c in cells]
    # Expected: Map (#), Expand, WIN%, W, L, ATK1st, DEF1st, ATKRWin%, RW, RL, DEFRWin%, RW, RL, Compositions
    if len(texts) < 13:
        return None

    map_match = re.match(r"(.+?)\s*\((\d+)\)", texts[0])
    if not map_match:
        return None

    return {
        "map": map_match.group(1),
        "total_maps": int(map_match.group(2)),
        "win_pct": texts[2],
        "wins": int(texts[3]) if texts[3].isdigit() else 0,
        "losses": int(texts[4]) if texts[4].isdigit() else 0,
        "atk_first": texts[5],
        "def_first": texts[6],
        "atk_round_win_pct": texts[7],
        "atk_rounds_won": int(texts[8]) if texts[8].isdigit() else 0,
        "atk_rounds_lost": int(texts[9]) if texts[9].isdigit() else 0,
        "def_round_win_pct": texts[10],
        "def_rounds_won": int(texts[11]) if texts[11].isdigit() else 0,
        "def_rounds_lost": int(texts[12]) if texts[12].isdigit() else 0,
    }


def parse_compositions(soup):
    """Parse all agent-comp-agg divs into a dict keyed by map name."""
    comps_by_map = {}
    for comp_el in soup.select(".agent-comp-agg"):
        map_name = comp_el.get("data-map", "Unknown")
        agents = [
            img["src"].split("/")[-1].replace(".png", "")
            for img in comp_el.select("img")
        ]
        count_span = comp_el.select_one('span[style*="width: 30px"]')
        count_text = count_span.get_text(strip=True) if count_span else "(0)"
        count = int(re.search(r"\d+", count_text).group()) if re.search(r"\d+", count_text) else 0
        comp_hash = comp_el.get("data-agent-comp-hash", "")

        comps_by_map.setdefault(map_name, []).append({
            "agents": agents,
            "times_played": count,
            "hash": comp_hash,
        })
    return comps_by_map


def parse_match_row(row):
    """Parse a single match row (tr.mod-toggle)."""
    link = row.select_one("a.game")
    if not link:
        return None

    match = {
        "url": link.get("href", ""),
        "result": "win" if "mod-win" in (row.select_one("td[class*=mod-]") or {}).get("class", []) else "loss",
    }

    # Date
    date_div = link.select_one("div")
    if date_div:
        match["date"] = date_div.get_text(strip=True)

    # Opponent
    vs_div = link.select_one("div.game-vs")
    if vs_div:
        name_div = vs_div.select_one("div.text-of")
        match["opponent"] = name_div.get_text(strip=True) if name_div else ""

    # Score
    score_div = link.select_one("div.game-score")
    if score_div:
        match["score"] = score_div.get_text(strip=True)

    # Halves (ATK/DEF/OT)
    halves = []
    for half in link.select("div.game-half"):
        label_el = half.select_one("div.game-half-label")
        score_el = half.find_all("div")
        if len(score_el) >= 2:
            label = label_el.get_text(strip=True) if label_el else ""
            rounds = score_el[-1].get_text(strip=True) if score_el else ""
            if label or rounds:
                halves.append({"side": label, "rounds": rounds})
    match["halves"] = halves

    # Event info
    event_div = link.select_one("div.game-event-name")
    if event_div:
        event_parts = event_div.select("div.text-of")
        match["event_round"] = event_parts[0].get_text(strip=True) if len(event_parts) > 0 else ""
        match["event_stage"] = event_parts[1].get_text(strip=True) if len(event_parts) > 1 else ""

    # Win/loss from td class
    result_td = row.select_one("td[class*='mod-win'], td[class*='mod-loss']")
    if result_td:
        td_classes = result_td.get("class", [])
        match["result"] = "win" if "mod-win" in td_classes else "loss"

    # Agent composition for this match
    comp_td = row.select("td")[-1] if row.select("td") else None
    if comp_td:
        agents = [
            img["src"].split("/")[-1].replace(".png", "")
            for img in comp_td.select("img")
        ]
        match["agents"] = agents

    return match


def parse_matches(soup):
    """Parse all match rows grouped by map."""
    matches_by_map = {}
    for row in soup.select("tr.mod-toggle"):
        classes = row.get("class", [])
        map_name = None
        for cls in classes:
            if cls.startswith("mod-") and cls[4:] in MAP_POOL:
                map_name = cls[4:]
                break
        if not map_name:
            continue

        match = parse_match_row(row)
        if match:
            matches_by_map.setdefault(map_name, []).append(match)
    return matches_by_map


def scrape_team_stats(team_id, team_slug, **kwargs):
    """Main entry point: scrape and return structured team stats."""
    url = build_team_stats_url(team_id, team_slug, **kwargs)
    print(f"Scraping team stats for {team_slug} (ID: {team_id})")
    soup = fetch_page(url)

    # Save raw HTML for debugging
    raw_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    os.makedirs(raw_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    with open(os.path.join(raw_dir, f"{team_slug}_{timestamp}.html"), "w", encoding="utf-8") as f:
        f.write(str(soup))

    # Parse overview table
    overview_table = soup.select_one("table.wf-table.mod-team-maps")
    overview_rows = overview_table.select("tr") if overview_table else []

    # Header row is first, then alternating: overview row, then match rows
    overview_by_map = {}
    for row in overview_rows:
        if row.select_one("th"):
            continue  # skip header
        if "mod-toggle" in row.get("class", []):
            continue  # skip match rows
        cells = row.select("td")
        parsed = parse_overview_row(cells)
        if parsed:
            overview_by_map[parsed["map"]] = parsed

    comps_by_map = parse_compositions(soup)
    matches_by_map = parse_matches(soup)

    # Build final structure
    maps_data = []
    for map_name in MAP_POOL:
        overview = overview_by_map.get(map_name)
        comps = comps_by_map.get(map_name, [])
        matches = matches_by_map.get(map_name, [])
        if overview or comps or matches:
            entry = {"map": map_name}
            if overview:
                entry["stats"] = overview
            entry["compositions"] = comps

            # Enrich compositions with W-L from matches
            for comp in entry["compositions"]:
                comp_matches = [m for m in matches if m.get("agents") == comp["agents"]]
                comp["wins"] = sum(1 for m in comp_matches if m["result"] == "win")
                comp["losses"] = sum(1 for m in comp_matches if m["result"] == "loss")

            entry["matches"] = matches
            maps_data.append(entry)

    data = {
        "team": {
            **parse_team_header(soup),
            "id": team_id,
            "slug": team_slug,
        },
        "url": url,
        "filters": kwargs,
        "maps": maps_data,
        "scraped_at": datetime.now(tz=__import__('datetime').timezone.utc).isoformat(),
    }
    return data


def save_json(data, filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Saved: {filepath}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Scrape VLR.gg team stats")
    parser.add_argument("--team-id", type=int, default=5214, help="VLR team ID")
    parser.add_argument("--team-slug", default="cgn-esports", help="VLR team slug")
    parser.add_argument("--event-id", default="all")
    parser.add_argument("--core-id", default="all")
    parser.add_argument("--date-start", default=None)
    parser.add_argument("--date-end", default=None)
    parser.add_argument("--output", default=None, help="Output JSON path")
    args = parser.parse_args()

    data = scrape_team_stats(
        team_id=args.team_id,
        team_slug=args.team_slug,
        event_id=args.event_id,
        core_id=args.core_id,
        date_start=args.date_start,
        date_end=args.date_end,
    )

    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = args.output or os.path.join(out_dir, f"{args.team_slug}_{timestamp}.json")
    save_json(data, out_path)

    print(f"\nDone — {len(data['maps'])} maps with data:")
    for m in data["maps"]:
        stats = m.get("stats", {})
        print(f"  {m['map']}: {stats.get('win_pct', '—')} WR, "
              f"{len(m['compositions'])} comps, {len(m['matches'])} matches")
