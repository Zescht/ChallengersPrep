# Valolytics API Reference

## Authentication

All requests require the `x-api-key` header:

```
x-api-key: <VALOLYTICS_API_KEY>
```

The key is stored in the gitignored `.env` at the repo root (see `.env.example`) and loaded by `lib/api_key.py`.

No other auth mechanism (Bearer token, cookies, etc.) — just this header.

## Base URL

```
https://api.valolytics.gg
```

## Endpoints

### 1. Resolve Riot ID → PUUID

Get a player's PUUID from their Riot ID (name + tagline).

```
GET /api/riot/account/v1/accounts/by-riot-id/esports/{gameName}/{tagLine}
```

**Example:**

```
GET /api/riot/account/v1/accounts/by-riot-id/esports/CGN%20DaviH/epval
```

**Response:** Contains the `puuid` field needed for step 2.

---

### 2. Get Match History (by PUUID)

Retrieve the list of match IDs for a player.

```
GET /api/riot/match/v1/matchlists/by-puuid/esports/{puuid}
```

**Example:**

```
GET /api/riot/match/v1/matchlists/by-puuid/esports/2acI0GvD635HvjIPypOp1JMoI21NEWJiKcgNCqyQmP05-OjSQ3XK9ckIlGSYm6vOrYfc2xf_rXDDxA
```

**Response:**

```json
{
    "puuid": "...",
    "history": [
        {
            "matchId": "f8dd4980-8525-4726-84b2-db886a5dc006",
            "gameStartTimeMillis": 1773167552654,
            "gameStartTime": "2026-03-10T18:32:32.654Z",
            "queueId": ""
        },
        ...
    ]
}
```

---

### 3. Get Match Details

Fetch full match data (players, rounds, stats) by match ID.

```
GET /api/matches/esports/{matchId}
```

**Example:**

```
GET /api/matches/esports/f8dd4980-8525-4726-84b2-db886a5dc006
```

**Response:** Full match object with matchInfo, players, round results, etc. (see `data/raw/sample_match.json` for structure).

## Workflow Summary

```
Riot ID (name/tag)  →  PUUID  →  Match History (matchIds)  →  Match Details
       [Step 1]        [Step 2]                                  [Step 3]
```
