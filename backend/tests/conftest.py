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
    # Tests must never hit the real LLM, even if .env has a key.
    monkeypatch.delenv("LLM_API_KEY", raising=False)
