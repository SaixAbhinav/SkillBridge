"""Optional state persistence in Upstash Redis (REST API), for serverless hosts like Vercel.

Enabled only when the Upstash env vars are set; otherwise the app keeps state in memory.
"""
import json
import os

import httpx

KEY = "skillbridge:state"


def _config() -> tuple[str, str] | None:
    # Names injected by the Vercel Upstash integration, with Upstash's own names as a fallback.
    url = os.getenv("KV_REST_API_URL") or os.getenv("UPSTASH_REDIS_REST_URL")
    token = os.getenv("KV_REST_API_TOKEN") or os.getenv("UPSTASH_REDIS_REST_TOKEN")
    return (url, token) if url and token else None


def is_enabled() -> bool:
    return _config() is not None


def _command(*args: str):
    url, token = _config()
    response = httpx.post(url, headers={"Authorization": f"Bearer {token}"}, json=list(args), timeout=10)
    response.raise_for_status()
    return response.json()["result"]


def load() -> dict | None:
    raw = _command("GET", KEY)
    return json.loads(raw) if raw else None


def save(state: dict) -> None:
    _command("SET", KEY, json.dumps(state))
