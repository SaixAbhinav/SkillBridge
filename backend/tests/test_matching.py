from app.matching import rank_candidates, rule_score, skill_overlap
from app.models import Requirements


def make_req(**overrides):
    data = dict(
        title="t", summary="s", required_skills=["React", "CSS", "WhatsApp API"],
        category="Web Development", difficulty="intermediate",
        duration_weeks=2, budget_inr=8000, hours_per_week=10,
    )
    data.update(overrides)
    return Requirements(**data)


def test_skill_overlap_weights_by_level():
    score, matched, gaps = skill_overlap(["react", "css", "whatsapp api"], {"react": 5, "css": 4})
    assert round(score, 2) == 0.6  # (5/5 + 4/5) / 3
    assert matched == ["react", "css"]
    assert gaps == ["whatsapp api"]


def test_skill_overlap_normalizes_synonyms():
    score, matched, _ = skill_overlap(["ReactJS"], {"React": 5})
    assert score == 1.0
    assert matched == ["react"]


def test_skill_overlap_empty_requirements():
    assert skill_overlap([], {"react": 5}) == (0.0, [], [])


def test_rule_score_combines_weights(make_student):
    score, _, _ = rule_score(make_req(), make_student())
    assert score == 76  # 0.6*0.6 + 0.15 + 0.15 + 0.10


def test_rule_score_penalizes_low_availability(make_student):
    full, _, _ = rule_score(make_req(), make_student())
    half, _, _ = rule_score(make_req(), make_student(hours_per_week=5))
    assert full - half == 5


def test_unrated_student_gets_neutral_rating(make_student):
    score, _, _ = rule_score(make_req(), make_student(rating=0.0, completed_projects=0))
    assert score == 55  # 0.36 skills + 0.15*(3/5) + 0 experience + 0.10 availability


def test_rank_candidates_excludes_students_without_overlap(make_student):
    students = [make_student(id="A"), make_student(id="B", skills={"excel": 5})]
    assert [m.student_id for m in rank_candidates(make_req(), students)] == ["A"]


def test_rank_candidates_restaurant_project_ranks_ananya_first(store):
    req = make_req(required_skills=["html", "css", "javascript", "responsive design", "whatsapp api"])
    matches = rank_candidates(req, list(store.students.values()))
    assert matches[0].student_id == "S01"
    assert matches[0].match_percent == 87
    assert len(matches) <= 8
    assert all(a.match_percent >= b.match_percent for a, b in zip(matches, matches[1:]))
