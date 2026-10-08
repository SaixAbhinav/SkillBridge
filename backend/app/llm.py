import json
import os

import httpx


class LLMError(Exception):
    pass


def is_enabled() -> bool:
    return bool(os.getenv("LLM_API_KEY"))


def chat_json(system: str, user: str, timeout: float = 20.0) -> dict:
    """One chat completion in JSON mode against any OpenAI-compatible endpoint."""
    key = os.getenv("LLM_API_KEY")
    if not key:
        raise LLMError("LLM_API_KEY is not set")
    base = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
    model = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
    try:
        response = httpx.post(
            f"{base}/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={
                "model": model,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
            timeout=timeout,
        )
        response.raise_for_status()
        return json.loads(response.json()["choices"][0]["message"]["content"])
    except (httpx.HTTPError, KeyError, IndexError, json.JSONDecodeError) as exc:
        raise LLMError(str(exc)) from exc
