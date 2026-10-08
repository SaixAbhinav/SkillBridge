import pytest

from app.models import Student
from app.store import Store


@pytest.fixture
def store():
    return Store()


@pytest.fixture
def make_student():
    def _make(**overrides):
        data = dict(
            id="X1", name="Test Student", college="Test College", year=3, bio="",
            skills={"react": 5, "css": 4}, rating=5.0, completed_projects=5, hours_per_week=20,
        )
        data.update(overrides)
        return Student(**data)

    return _make


@pytest.fixture(autouse=True)
def no_llm(monkeypatch):
    # Tests must never hit the real LLM or Redis, even if .env has keys.
    for name in ("LLM_API_KEY", "KV_REST_API_URL", "KV_REST_API_TOKEN",
                 "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"):
        monkeypatch.delenv(name, raising=False)
