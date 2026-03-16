"""
Display formatter for VLR.gg team stats data.
Renders scraped JSON data into readable tables.
"""

import json
import sys
import os
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


# Agent role mapping
AGENT_ROLES = {
    "astra": "Controller", "brimstone": "Controller", "harbor": "Controller",
    "omen": "Controller", "viper": "Controller", "clove": "Controller",
    "breach": "Initiator", "fade": "Initiator", "gekko": "Initiator",
    "kayo": "Initiator", "skye": "Initiator", "sova": "Initiator",
    "tejo": "Initiator",
    "chamber": "Sentinel", "cypher": "Sentinel", "deadlock": "Sentinel",
    "killjoy": "Sentinel", "sage": "Sentinel", "vyse": "Sentinel",
    "iso": "Duelist", "jett": "Duelist", "neon": "Duelist",
    "phoenix": "Duelist", "raze": "Duelist", "reyna": "Duelist",
    "yoru": "Duelist", "waylay": "Duelist",
    "veto": "Sentinel",
}

ROLE_ORDER = {"Controller": 0, "Initiator": 1, "Sentinel": 2, "Duelist": 3}


def role_tag(agent):
    role = AGENT_ROLES.get(agent, "?")
    short = {"Controller": "C", "Initiator": "I", "Sentinel": "S", "Duelist": "D"}.get(role, "?")
    return short


def display_team_stats(data, maps_filter=None):
    """Print a full formatted report of team stats."""
    team = data["team"]
    print(f"\n{'='*70}")
    print(f"  {team.get('name', team['slug'])} — Agent Compositions & Map Stats")
    print(f"  Source: {data['url']}")
    print(f"  Scraped: {data['scraped_at']}")
    print(f"{'='*70}\n")

    # Summary table
    print("MAP OVERVIEW")
    print(f"{'Map':<10} {'W%':>5} {'W-L':>6} {'Maps':>5}  {'ATK RW%':>8} {'DEF RW%':>8}")
    print("-" * 50)

    active_maps = [m for m in data["maps"] if m.get("stats", {}).get("total_maps", 0) > 0]
    active_maps.sort(key=lambda m: m["stats"]["total_maps"], reverse=True)

    total_w = total_l = 0
    for m in active_maps:
        s = m["stats"]
        total_w += s["wins"]
        total_l += s["losses"]
        print(f"{s['map']:<10} {s['win_pct']:>5} {s['wins']}-{s['losses']:>3} {s['total_maps']:>5}  "
              f"{s['atk_round_win_pct']:>8} {s['def_round_win_pct']:>8}")

    total = total_w + total_l
    total_pct = f"{total_w/total*100:.0f}%" if total else "—"
    print("-" * 50)
    print(f"{'TOTAL':<10} {total_pct:>5} {total_w}-{total_l:>3} {total:>5}")

    # Per-map detail
    for m in active_maps:
        if maps_filter and m["map"] not in maps_filter:
            continue
        print(f"\n{'─'*70}")
        s = m["stats"]
        print(f"  {m['map'].upper()} — {s['win_pct']} Win Rate ({s['wins']}W-{s['losses']}L across {s['total_maps']} maps)")
        print(f"  ATK Round WR: {s['atk_round_win_pct']} ({s['atk_rounds_won']}-{s['atk_rounds_lost']})  |  "
              f"DEF Round WR: {s['def_round_win_pct']} ({s['def_rounds_won']}-{s['def_rounds_lost']})")

        # Compositions
        if m["compositions"]:
            print(f"\n  Agent Compositions:")
            for comp in m["compositions"]:
                agents_display = "  ".join(
                    f"{a.capitalize()}[{role_tag(a)}]" for a in comp["agents"]
                )
                wr = ""
                total_comp = comp["wins"] + comp["losses"]
                if total_comp > 0:
                    pct = comp["wins"] / total_comp * 100
                    wr = f" ({pct:.0f}% WR)"
                print(f"    x{comp['times_played']}  {comp['wins']}W-{comp['losses']}L{wr}")
                print(f"         {agents_display}")

        # Match history
        if m["matches"]:
            print(f"\n  Match History:")
            for match in m["matches"]:
                result_icon = "W" if match["result"] == "win" else "L"
                halves_str = ""
                for h in match.get("halves", []):
                    if h["side"] and h["rounds"]:
                        halves_str += f" {h['side'].upper()} {h['rounds']}"
                event = match.get("event_stage", "")
                if match.get("event_round"):
                    event = f"{match['event_round']} — {event}" if event else match["event_round"]
                print(f"    [{result_icon}] {match['date']}  {match['score']:>6}  vs {match['opponent']:<25}{halves_str}")
                if event:
                    print(f"        {event}")

    print(f"\n{'='*70}\n")


def display_composition_summary(data):
    """Print a focused composition analysis across all maps."""
    print(f"\n{'='*70}")
    print(f"  COMPOSITION ANALYSIS — {data['team'].get('name', data['team']['slug'])}")
    print(f"{'='*70}\n")

    # Collect all agents used and their frequency
    agent_freq = {}
    for m in data["maps"]:
        for comp in m.get("compositions", []):
            for agent in comp["agents"]:
                agent_freq.setdefault(agent, {"picks": 0, "wins": 0, "losses": 0})
                agent_freq[agent]["picks"] += comp["times_played"]
                agent_freq[agent]["wins"] += comp["wins"]
                agent_freq[agent]["losses"] += comp["losses"]

    total_maps = sum(m.get("stats", {}).get("total_maps", 0) for m in data["maps"])

    print(f"AGENT PICK RATES (across {total_maps} maps played)")
    print(f"{'Agent':<12} {'Role':<12} {'Picks':>6} {'Rate':>6} {'W':>4} {'L':>4} {'WR':>6}")
    print("-" * 55)
    for agent, freq in sorted(agent_freq.items(), key=lambda x: x[1]["picks"], reverse=True):
        role = AGENT_ROLES.get(agent, "?")
        rate = f"{freq['picks']/total_maps*100:.0f}%" if total_maps else "—"
        total = freq["wins"] + freq["losses"]
        wr = f"{freq['wins']/total*100:.0f}%" if total else "—"
        print(f"{agent.capitalize():<12} {role:<12} {freq['picks']:>6} {rate:>6} "
              f"{freq['wins']:>4} {freq['losses']:>4} {wr:>6}")

    # Role distribution
    print(f"\nROLE DISTRIBUTION")
    role_counts = {}
    for agent, freq in agent_freq.items():
        role = AGENT_ROLES.get(agent, "Unknown")
        role_counts.setdefault(role, 0)
        role_counts[role] += freq["picks"]

    for role in ["Controller", "Initiator", "Sentinel", "Duelist"]:
        count = role_counts.get(role, 0)
        bar = "█" * (count // 2)
        print(f"  {role:<12} {count:>3} picks  {bar}")

    print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Find latest JSON in data/
        data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        files = sorted(
            [f for f in os.listdir(data_dir) if f.endswith(".json")],
            reverse=True,
        )
        if not files:
            print("No data files found. Run vlr_scraper.py first.")
            sys.exit(1)
        filepath = os.path.join(data_dir, files[0])
    else:
        filepath = sys.argv[1]

    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)

    display_team_stats(data)
    display_composition_summary(data)
