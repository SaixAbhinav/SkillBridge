import pytest

from app import ai
from app.llm import LLMError
from app.matching import rank_candidates

RESTAURANT = (
    "I run a small restaurant in Hyderabad called Spice Route Kitchen. We need a website "
    "with our menu, photos and WhatsApp ordering. Budget ₹8,000, needs to be done in 2 weeks."
)


def raise_llm(*args, **kwargs):
    raise LLMError("offline")


def test_keyword_extract_restaurant(store):
    req = ai.keyword_extract(RESTAURANT, store.vocabulary())
    assert req.category == "Web Development"
    assert req.budget_inr == 8000
    assert req.duration_weeks == 2
    assert {"html", "css", "javascript", "responsive design", "whatsapp api"} <= set(req.required_skills)


def test_extract_uses_llm_and_normalizes_skills(monkeypatch, store):
    monkeypatch.setattr(ai, "chat_json", lambda system, user: {
        "title": "Restaurant website", "summary": "Menu site with WhatsApp ordering.",
        "required_skills": ["ReactJS", "WhatsApp"], "category": "Web Development",
        "difficulty": "intermediate", "duration_weeks": 2, "budget_inr": 8000, "hours_per_week": 10,
    })
    req, used = ai.extract_requirements(RESTAURANT, store.vocabulary())
    assert used is True
    assert req.required_skills == ["react", "whatsapp api"]


def test_extract_falls_back_when_llm_fails(monkeypatch, store):
    monkeypatch.setattr(ai, "chat_json", raise_llm)
    req, used = ai.extract_requirements(RESTAURANT, store.vocabulary())
    assert used is False
    assert "whatsapp api" in req.required_skills


def test_extract_falls_back_on_invalid_llm_output(monkeypatch, store):
    monkeypatch.setattr(ai, "chat_json", lambda system, user: {"title": "only a title"})
    _, used = ai.extract_requirements(RESTAURANT, store.vocabulary())
    assert used is False


@pytest.fixture
def restaurant(store):
    req = ai.keyword_extract(RESTAURANT, store.vocabulary())
    return req, rank_candidates(req, list(store.students.values()))


def test_rerank_blends_llm_and_rule_scores(monkeypatch, store, restaurant):
    req, candidates = restaurant
    second = candidates[1]
    monkeypatch.setattr(ai, "chat_json", lambda system, user: {"rankings": [
        {"student_id": second.student_id, "fit_score": 100, "reason": "Great fit", "gaps": []},
    ]})
    ranked, used = ai.rerank(req, candidates, store.students)
    assert used is True
    boosted = next(m for m in ranked if m.student_id == second.student_id)
    assert boosted.match_percent == round(0.5 * second.rule_score + 50)
    assert boosted.reason == "Great fit"
    assert boosted.ai_ranked is True
    assert len(ranked) == len(candidates)
    assert all(a.match_percent >= b.match_percent for a, b in zip(ranked, ranked[1:]))


def test_rerank_ignores_unknown_ids(monkeypatch, store, restaurant):
    req, candidates = restaurant
    monkeypatch.setattr(ai, "chat_json", lambda system, user: {"rankings": [
        {"student_id": "NOPE", "fit_score": 99, "reason": "x", "gaps": []},
    ]})
    ranked, _ = ai.rerank(req, candidates, store.students)
    assert {m.student_id for m in ranked} == {c.student_id for c in candidates}
    assert not any(m.ai_ranked for m in ranked)


def test_rerank_falls_back_on_llm_error(monkeypatch, store, restaurant):
    req, candidates = restaurant
    monkeypatch.setattr(ai, "chat_json", raise_llm)
    ranked, used = ai.rerank(req, candidates, store.students)
    assert used is False
    assert ranked == candidates
