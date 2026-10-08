import json
import re

from pydantic import ValidationError

from .llm import LLMError, chat_json
from .models import Match, Requirements, Student
from .skills import normalize_skill

# Plain-English words a business owner uses -> skills a student lists.
KEYWORD_HINTS = {
    "website": ["html", "css", "javascript", "responsive design"],
    "web app": ["react", "node.js"],
    "online store": ["wordpress", "responsive design"],
    "whatsapp": ["whatsapp api"],
    "mobile app": ["flutter", "firebase"],
    "android": ["flutter"],
    "logo": ["logo design"],
    "branding": ["logo design", "canva"],
    "poster": ["canva"],
    "instagram": ["social media marketing", "content writing"],
    "reels": ["video editing"],
    "blog": ["content writing"],
    "dashboard": ["power bi", "excel"],
    "sales data": ["excel", "sql"],
}

CATEGORY_RULES = [
    ("Mobile App", ("mobile app", "android", "ios")),
    ("Web Development", ("website", "web app", "online store")),
    ("Design", ("logo", "branding", "poster")),
    ("Marketing", ("instagram", "marketing", "seo", "reels")),
    ("Data", ("dashboard", "excel", "report", "data")),
]

CATEGORY_TITLES = {
    "Mobile App": "Mobile app development",
    "Web Development": "Website development",
    "Design": "Branding & design",
    "Marketing": "Social media & marketing",
    "Data": "Data dashboard & analysis",
    "General": "Freelance project",
}

EXTRACT_SYSTEM = """You turn a small business's plain-English project request into structured \
requirements used to match college students. Respond with JSON only, with exactly these keys:
title (short, max 8 words), summary (one sentence),
required_skills (3-6 lowercase skill names; prefer names from the known skills list),
category (one of: Web Development, Mobile App, Design, Marketing, Data, General),
difficulty (beginner | intermediate | advanced), duration_weeks (integer 1-12),
budget_inr (integer, 0 if not stated), hours_per_week (integer 1-40, your estimate)."""

RERANK_SYSTEM = """You are the matching engine of a student micro-internship platform. Given a \
project and candidate students (already pre-filtered by skills), judge how well each student can \
deliver THIS project. Weigh skill depth, relevant past projects and bio, not just keyword overlap. \
Respond with JSON only:
{"rankings": [{"student_id": "...", "fit_score": 0-100,
"reason": "one sentence, max 25 words, cite concrete evidence from the profile",
"gaps": ["required skill the student lacks", ...]}]}
Include every candidate exactly once. Never invent students or skills."""


def _dedupe(items):
    seen, out = set(), []
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


def keyword_extract(description: str, vocabulary: list[str]) -> Requirements:
    """Non-LLM fallback: vocabulary scan + keyword hints + regexes for budget and duration."""
    text = description.lower()
    skills = [v for v in vocabulary if re.search(rf"(?<!\w){re.escape(v)}(?!\w)", text)]
    for keyword, hinted in KEYWORD_HINTS.items():
        if keyword in text:
            skills.extend(hinted)
    skills = _dedupe(normalize_skill(s) for s in skills)
    category = next((c for c, kws in CATEGORY_RULES if any(k in text for k in kws)), "General")
    budget = re.search(r"(?:₹|rs\.?|inr)\s*([\d,]+)", text)
    weeks = re.search(r"(\d+)\s*weeks?", text)
    return Requirements(
        title=CATEGORY_TITLES[category],
        summary=description.strip()[:160],
        required_skills=skills,
        category=category,
        difficulty="beginner" if len(skills) <= 2 else "intermediate",
        duration_weeks=min(max(int(weeks.group(1)), 1), 12) if weeks else 2,
        budget_inr=int(budget.group(1).replace(",", "")) if budget else 5000,
        hours_per_week=10,
    )


def extract_requirements(description: str, vocabulary: list[str]) -> tuple[Requirements, bool]:
    user = f"Known skills: {', '.join(vocabulary)}\n\nRequest:\n{description}"
    try:
        req = Requirements.model_validate(chat_json(EXTRACT_SYSTEM, user))
    except (LLMError, ValidationError):
        return keyword_extract(description, vocabulary), False
    req.required_skills = _dedupe(normalize_skill(s) for s in req.required_skills)
    if not req.required_skills:
        req.required_skills = keyword_extract(description, vocabulary).required_skills
    return req, True


def rerank(req: Requirements, candidates: list[Match], students: dict[str, Student]) -> tuple[list[Match], bool]:
    """Stage 2: LLM judges fit; final % = 50% rule score + 50% LLM fit. Falls back to Stage 1 order."""
    if not candidates:
        return candidates, False
    profiles = [
        {
            "student_id": c.student_id,
            "name": c.student_name,
            "skills": students[c.student_id].skills,
            "rating": students[c.student_id].rating,
            "completed_projects": students[c.student_id].completed_projects,
            "bio": students[c.student_id].bio,
            "past_projects": [p.project_title for p in students[c.student_id].portfolio],
        }
        for c in candidates
    ]
    project = req.model_dump(include=set(Requirements.model_fields))
    user = json.dumps({"project": project, "candidates": profiles}, ensure_ascii=False)
    try:
        rankings = chat_json(RERANK_SYSTEM, user)["rankings"]
        remaining = {c.student_id: c for c in candidates}
        merged = []
        for r in rankings:
            c = remaining.pop(str(r.get("student_id")), None)
            if c is None:
                continue
            fit = max(0, min(100, int(r["fit_score"])))
            merged.append(c.model_copy(update={
                "match_percent": round(0.5 * c.rule_score + 0.5 * fit),
                "reason": str(r.get("reason") or c.reason),
                "gaps": [normalize_skill(g) for g in r.get("gaps", [])][:3],
                "ai_ranked": True,
            }))
    except (LLMError, KeyError, TypeError, ValueError, AttributeError):
        return candidates, False
    merged.extend(remaining.values())
    merged.sort(key=lambda m: m.match_percent, reverse=True)
    return merged, True
