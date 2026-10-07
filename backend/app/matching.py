from .models import Match, Requirements, Student
from .skills import normalize_skill

WEIGHTS = {"skills": 0.60, "rating": 0.15, "experience": 0.15, "availability": 0.10}
UNRATED_RATING = 3.0  # neutral prior so newcomers aren't scored as if rated 0/5


def _dedupe(items):
    seen, out = set(), []
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


def skill_overlap(required: list[str], student_skills: dict[str, int]) -> tuple[float, list[str], list[str]]:
    req = _dedupe(normalize_skill(s) for s in required)
    if not req:
        return 0.0, [], []
    have = {normalize_skill(k): v for k, v in student_skills.items()}
    matched = [s for s in req if s in have]
    gaps = [s for s in req if s not in have]
    score = sum(min(have[s], 5) / 5 for s in matched) / len(req)
    return score, matched, gaps


def rule_score(req: Requirements, student: Student) -> tuple[int, list[str], list[str]]:
    skill, matched, gaps = skill_overlap(req.required_skills, student.skills)
    rating = student.rating if student.completed_projects > 0 else UNRATED_RATING
    total = (
        WEIGHTS["skills"] * skill
        + WEIGHTS["rating"] * (rating / 5)
        + WEIGHTS["experience"] * (min(student.completed_projects, 5) / 5)
        + WEIGHTS["availability"] * min(student.hours_per_week / req.hours_per_week, 1.0)
    )
    return round(total * 100), matched, gaps


def rank_candidates(req: Requirements, students: list[Student], top_k: int = 8) -> list[Match]:
    scored = []
    for student in students:
        score, matched, gaps = rule_score(req, student)
        if matched:
            scored.append((score, student, matched, gaps))
    scored.sort(key=lambda t: (t[0], t[1].rating), reverse=True)
    n = len(_dedupe(normalize_skill(s) for s in req.required_skills))
    return [
        Match(
            student_id=s.id,
            student_name=s.name,
            college=s.college,
            rule_score=score,
            match_percent=score,
            matched_skills=matched,
            gaps=gaps,
            reason=f"Matches {len(matched)} of {n} required skills ({', '.join(matched)}).",
        )
        for score, s, matched, gaps in scored[:top_k]
    ]
