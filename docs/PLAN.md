# SkillBridge AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working demo of an AI-powered student micro-internship platform, plus a 12-slide pitch deck, for a college course presentation in 2 days (solo).

**Architecture:** FastAPI backend with an in-memory store loaded from seed JSON (resets on restart, which keeps every demo run clean). Matching runs in two stages. Stage 1 is a deterministic weighted skill score that shortlists the top 8 students. Stage 2 has an LLM re-rank them and write a reason and skill gaps for each. Final match % = 50% rule score + 50% LLM fit score. Every LLM call has a non-LLM fallback, so the demo still works if the API fails on stage. The React + Vite frontend is served by FastAPI in production, so the whole thing deploys as one service.

**Tech Stack:** Python 3.12, uv, FastAPI, Pydantic v2, httpx, python-dotenv, pytest | React 18 + Vite, react-router-dom, plain CSS | LLM via any OpenAI-compatible endpoint (default Groq `llama-3.3-70b-versatile`, Gemini works too) | Docker + Render for hosting.

## Global Constraints

- Project root: `C:\Users\marsh\OneDrive\Desktop\code\projects\skillbridge-ai\` (all paths below are relative to it).
- Python deps are managed with **uv only** (`uv add`, `uv run`, `uv sync`), never pip. `uv.lock` pins exact versions and must be committed.
- New dependencies allowed by this plan: backend `fastapi`, `uvicorn[standard]`, `httpx`, `python-dotenv`, and dev `pytest`. Frontend: Vite React template defaults plus `react-router-dom`. **Anything else must be flagged to the user first.**
- Git: `main` holds only the initial empty commit. All work goes on the `feat/mvp` branch. **No `Co-Authored-By` trailers or any Claude/AI attribution in commits or PRs.** Commit messages use imperative mood.
- `.gitignore` must include `.env`, `CLAUDE.md`, `.claude/`, `node_modules/`, `dist/`, `.venv/`, `__pycache__/`.
- Secrets: the LLM key lives only in `.env` (project root) as `LLM_API_KEY`. Never hardcode it, and never commit it.
- Out of scope (goes on the "Future scope" slide): login/auth, real payments, chat, notifications, a real database.
- Currency is INR (₹). Locale formatting uses `en-IN`.
- Backend tests must pass (`uv run pytest`) before each commit that touches the backend.
- Domain language follows `CONTEXT.md` (Project, Business, Student, Offer, Match Score, Payout…). UI copy and code names must use those terms.
- "Verified" applies **only** to Certificate-backed Portfolio entries. Never call students or skills "verified".
- Platform Fee is a flat 10% of the Budget, taken at Completion. Use the same number everywhere (UI, deck, Q&A).

## Grilling Decisions (2026-10-07)

| # | Question | Decision |
|---|---|---|
| 1 | Who decides a Student gets a Project? | Business sends an **Offer** to one Student, and the Student **Accepts or Declines**. Lifecycle: `open → offered → assigned → completed`. Declining reopens the Project, and that Student can't be re-offered it. |
| 2 | Where does the Student act, with no login? | A "Pending offers" card on the Student's profile page. In the demo you click "Open Ananya's view", then Accept. Narration: "in production each side logs in." |
| 3 | Core noun? | **Project**. "Micro-internship" is the marketing label only. |
| 4 | What does "verified" mean? | Only Certificate-backed Portfolio entries. Seeded past work shows unbadged. The home stat says "Students", not "Verified students". Skill tests are future scope. |
| 5 | Newcomers score 0 on rating and experience, so they can never win, which contradicts the pitch. | **Unrated** students use a neutral 3.0/5 rating in the Skill Score. Experience still counts (it's real signal). |
| 6 | Revenue model shown or only claimed? | Shown: Completion displays Payout (90%) and Platform Fee (10%), and home stats show money paid to students. Payments are simulated. Escrow is future scope. |
| 7 | Certificates die on restart (in-memory store). | Accepted as a prototype limitation. Say "production uses a database" if asked. Not worth persistence work in 2 days. |
| 8 | LLM non-determinism between rehearsal and live. | Accepted: temperature 0.2, Matches cached per Project, and the Skill Score is half the Match Score, so the top spot stays stable. The fallback drill in Task 9 covers outages. |
| 9 | Present from Render or local? | **Local laptop.** Render (Task 10) is only a bonus link, because a cold start plus LLM latency on stage is an avoidable risk. |
| 10 | Difficulty is extracted but unused in scoring. | Keep it informational (shown to Students, passed to the LLM re-rank). Don't add it to the formula. |

## Time Budget

| Block | Tasks | Est. |
|---|---|---|
| Day 1 morning | 1 Backend core + seed data, 2 Matching engine | 2.5 h |
| Day 1 afternoon | 3 AI layer, 4 API (incl. Offer flow) | 3.5 h |
| Day 1 evening | 5 Frontend shell, 6 Post-project page | 2.5 h |
| Day 2 morning | 7 Matches page, 8 Certificate + profile, 9 E2E polish + README | 3.5 h |
| Day 2 midday | 10 Deploy (optional; skip if behind schedule, since a local demo is fine) | 1 h |
| Day 2 afternoon | 11 Pitch deck, 12 Demo script + Q&A prep + rehearsal | 3 h |

**Risk order:** Task 3's live LLM smoke test is the riskiest unknown (key, model name, JSON mode). If you're unsure about the key, run Task 3 Step 1 first, even before Task 1 is done.

## File Structure

```
skillbridge-ai/
├── CONTEXT.md                # domain glossary (already written)
├── .env                      # LLM_API_KEY etc. (gitignored, user creates)
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
├── docs/
│   ├── PLAN.md               # this file
│   ├── DECK_OUTLINE.md       # Task 11
│   └── DEMO_SCRIPT.md        # Task 12
├── backend/
│   ├── pyproject.toml / uv.lock
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py         # Pydantic models (Student, Project, Match, Certificate…)
│   │   ├── skills.py         # skill-name normalization (synonyms)
│   │   ├── store.py          # in-memory store loaded from seed JSON
│   │   ├── matching.py       # Stage 1: deterministic scoring + shortlist
│   │   ├── llm.py            # thin OpenAI-compatible chat client (JSON mode)
│   │   ├── ai.py             # requirement extraction + Stage 2 re-rank, with fallbacks
│   │   ├── main.py           # FastAPI app + routes + SPA serving
│   │   └── data/
│   │       ├── students.json
│   │       └── businesses.json
│   └── tests/
│       ├── conftest.py
│       ├── test_store.py
│       ├── test_matching.py
│       ├── test_ai.py
│       └── test_api.py
└── frontend/
    ├── vite.config.js
    └── src/
        ├── main.jsx          # router
        ├── App.jsx           # layout + nav
        ├── api.js            # fetch wrapper
        ├── index.css
        ├── components/
        │   ├── SkillChips.jsx
        │   └── MatchCard.jsx
        └── pages/
            ├── Home.jsx
            ├── Students.jsx
            ├── PostProject.jsx
            ├── ProjectMatches.jsx
            ├── Certificate.jsx
            └── StudentProfile.jsx
```

## API Contract (shared by backend + frontend tasks)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/health` | – | `{ok: true, llm_enabled: bool}` |
| GET | `/api/stats` | – | `{students, businesses, projects_posted, certificates_issued, paid_to_students_inr, platform_fees_inr}` |
| GET | `/api/students` | – | `Student[]` |
| GET | `/api/students/{id}` | – | `Student` |
| GET | `/api/students/{id}/offers` | – | `{project: Project, business: Business}[]` (pending Offers for this Student) |
| GET | `/api/businesses` | – | `Business[]` |
| POST | `/api/projects/extract` | `{description}` | `{requirements: Requirements, ai_used: bool}` |
| POST | `/api/projects` | `ProjectCreate` | `Project` (201) |
| GET | `/api/projects/{id}` | – | `{project: Project, business: Business, offered_student: Student \| null, assigned_student: Student \| null}` |
| GET | `/api/projects/{id}/matches` | – | `{matches: Match[], ai_used: bool}` (computed once, cached) |
| POST | `/api/projects/{id}/offer` | `{student_id}` | `Project` (409 if not open, or the Student already declined) |
| POST | `/api/projects/{id}/accept` | `{student_id}` | `Project` (409 unless this Student holds the pending Offer) |
| POST | `/api/projects/{id}/decline` | `{student_id}` | `Project`, back to `open` (409 unless this Student holds the pending Offer) |
| POST | `/api/projects/{id}/complete` | `{rating: 1-5}` | `Certificate`; sets Payout + Platform Fee on the Project (409 if not assigned) |
| GET | `/api/certificates/{id}` | – | `Certificate` |

---

### Task 1: Backend core: scaffold, models, seed data, store

**Files:**
- Create: `.gitignore`, `.env.example`, `backend/pyproject.toml` (via uv), `backend/app/__init__.py`, `backend/app/models.py`, `backend/app/skills.py`, `backend/app/store.py`, `backend/app/data/students.json`, `backend/app/data/businesses.json`
- Test: `backend/tests/conftest.py`, `backend/tests/test_store.py`

**Interfaces:**
- Produces: models `PortfolioItem`, `Student`, `Business`, `Requirements`, `ProjectCreate`, `Project`, `Match`, `Certificate`; `normalize_skill(s: str) -> str`; `Store` with attributes `students: dict[str, Student]`, `businesses: dict[str, Business]`, `projects: dict[str, Project]`, `certificates: dict[str, Certificate]`, `matches: dict[str, tuple[list[Match], bool]]` and methods `vocabulary() -> list[str]`, `new_project_id() -> str`, `new_cert_id() -> str`. Pytest fixtures `store`, `make_student`, autouse `no_llm`.

- [ ] **Step 1: Init git repo and scaffold backend**

```bash
cd C:/Users/marsh/OneDrive/Desktop/code/projects/skillbridge-ai
git init -b main
git commit --allow-empty -m "Initial commit"
git checkout -b feat/mvp
uv init backend --app --no-readme --python 3.12
cd backend
rm -f main.py hello.py
uv add fastapi "uvicorn[standard]" httpx python-dotenv
uv add --dev pytest
mkdir -p app/data tests
touch app/__init__.py
```

Append to `backend/pyproject.toml`:

```toml
[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
```

- [ ] **Step 2: Create `.gitignore` and `.env.example` at the project root**

`.gitignore`:
```
.env
CLAUDE.md
.claude/
node_modules/
dist/
.venv/
__pycache__/
*.pyc
.pytest_cache/
```

`.env.example`:
```
# Any OpenAI-compatible endpoint. Groq (default):
LLM_API_KEY=
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
# Gemini alternative:
# LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
# LLM_MODEL=gemini-2.0-flash   (check AI Studio for the current flash model name)
```

User step: copy it to `.env` and paste the key into it yourself. Don't paste the key into chat.

- [ ] **Step 3: Write `backend/app/models.py`**

```python
from typing import Literal

from pydantic import BaseModel, Field


class PortfolioItem(BaseModel):
    project_title: str
    business_name: str
    completed_on: str
    skills_used: list[str]
    cert_id: str | None = None


class Student(BaseModel):
    id: str
    name: str
    college: str
    year: int
    bio: str
    skills: dict[str, int]  # skill name -> level 1..5
    rating: float  # ignored while completed_projects == 0 (Unrated)
    completed_projects: int
    hours_per_week: int
    portfolio: list[PortfolioItem] = []


class Business(BaseModel):
    id: str
    name: str
    type: str
    city: str


class Requirements(BaseModel):
    title: str
    summary: str
    required_skills: list[str]
    category: str
    difficulty: Literal["beginner", "intermediate", "advanced"]
    duration_weeks: int = Field(ge=1, le=12)
    budget_inr: int = Field(ge=0)
    hours_per_week: int = Field(ge=1, le=40)


class ProjectCreate(Requirements):
    business_id: str
    description: str


class Project(ProjectCreate):
    id: str
    status: Literal["open", "offered", "assigned", "completed"] = "open"
    offered_student_id: str | None = None
    declined_student_ids: list[str] = []
    assigned_student_id: str | None = None
    certificate_id: str | None = None
    student_payout_inr: int | None = None
    platform_fee_inr: int | None = None
    created_at: str


class Match(BaseModel):
    student_id: str
    student_name: str
    college: str
    rule_score: int  # 0-100, Stage 1
    match_percent: int  # 0-100, final (blended if AI-ranked)
    matched_skills: list[str]
    gaps: list[str]
    reason: str
    ai_ranked: bool = False


class Certificate(BaseModel):
    id: str
    student_id: str
    student_name: str
    project_id: str
    project_title: str
    business_name: str
    skills_verified: list[str]
    rating: int
    issued_on: str
```

- [ ] **Step 4: Write `backend/app/skills.py`**

```python
SYNONYMS = {
    "reactjs": "react",
    "react.js": "react",
    "js": "javascript",
    "node": "node.js",
    "nodejs": "node.js",
    "ui/ux": "ui design",
    "ux": "ui design",
    "ux design": "ui design",
    "py": "python",
    "ml": "machine learning",
    "social media": "social media marketing",
    "instagram marketing": "social media marketing",
    "whatsapp": "whatsapp api",
    "whatsapp business api": "whatsapp api",
    "powerbi": "power bi",
    "ms excel": "excel",
    "copywriting": "content writing",
    "graphic design": "logo design",
}


def normalize_skill(skill: str) -> str:
    key = skill.strip().lower()
    return SYNONYMS.get(key, key)
```

- [ ] **Step 5: Write seed data `backend/app/data/businesses.json`**

```json
[
  {"id": "B01", "name": "Spice Route Kitchen", "type": "Restaurant", "city": "Hyderabad"},
  {"id": "B02", "name": "Bloom Boutique", "type": "Clothing store", "city": "Secunderabad"},
  {"id": "B03", "name": "FitZone Gym", "type": "Fitness studio", "city": "Gachibowli"},
  {"id": "B04", "name": "GreenLeaf Organics", "type": "D2C startup", "city": "Hyderabad"},
  {"id": "B05", "name": "TechNest Solutions", "type": "SaaS startup", "city": "Hitech City"}
]
```

- [ ] **Step 6: Write seed data `backend/app/data/students.json`**

S01 is the planned winner for the restaurant demo. S15 is a first-timer with no ratings yet, which backs the "first opportunity" pitch line.

```json
[
  {"id": "S01", "name": "Ananya Reddy", "college": "CBIT", "year": 3, "bio": "Built online ordering sites for two cafés in Gachibowli; loves clean, fast, mobile-first UIs.", "skills": {"react": 5, "javascript": 5, "html": 5, "css": 4, "responsive design": 4, "whatsapp api": 3}, "rating": 4.8, "completed_projects": 4, "hours_per_week": 15, "portfolio": [
    {"project_title": "Online menu & ordering site", "business_name": "Chai Point Café", "completed_on": "2026-06-14", "skills_used": ["react", "responsive design", "whatsapp api"]},
    {"project_title": "Bakery landing page", "business_name": "Crumbs & Co", "completed_on": "2026-08-02", "skills_used": ["html", "css", "javascript"]}]},
  {"id": "S02", "name": "Rahul Verma", "college": "VNR VJIET", "year": 4, "bio": "Full-stack developer who enjoys building dashboards and admin panels for small teams.", "skills": {"react": 4, "node.js": 4, "javascript": 4, "html": 4, "css": 3, "firebase": 3}, "rating": 4.5, "completed_projects": 3, "hours_per_week": 20, "portfolio": [
    {"project_title": "Inventory tracker web app", "business_name": "Sri Sai Hardware", "completed_on": "2026-05-20", "skills_used": ["react", "node.js", "firebase"]}]},
  {"id": "S03", "name": "Sneha Iyer", "college": "Osmania University", "year": 2, "bio": "WordPress and SEO enthusiast; helps local shops get found on Google.", "skills": {"html": 4, "css": 4, "wordpress": 4, "responsive design": 3, "seo": 3}, "rating": 4.6, "completed_projects": 2, "hours_per_week": 12, "portfolio": [
    {"project_title": "Clinic website on WordPress", "business_name": "CarePlus Dental", "completed_on": "2026-07-10", "skills_used": ["wordpress", "seo"]}]},
  {"id": "S04", "name": "Mohammed Faizan", "college": "MJCET", "year": 3, "bio": "Flutter developer; shipped two Android apps to the Play Store.", "skills": {"flutter": 5, "firebase": 4, "ui design": 3}, "rating": 4.7, "completed_projects": 3, "hours_per_week": 18, "portfolio": [
    {"project_title": "Laundry pickup booking app", "business_name": "WashWise", "completed_on": "2026-04-28", "skills_used": ["flutter", "firebase"]}]},
  {"id": "S05", "name": "Priya Sharma", "college": "JNTU Hyderabad", "year": 3, "bio": "Product designer obsessed with brand identity and clean interfaces.", "skills": {"figma": 5, "ui design": 5, "logo design": 4, "canva": 4}, "rating": 4.9, "completed_projects": 5, "hours_per_week": 10, "portfolio": [
    {"project_title": "Brand identity kit", "business_name": "Urban Brew", "completed_on": "2026-03-15", "skills_used": ["logo design", "figma"]}]},
  {"id": "S06", "name": "Karthik Nair", "college": "IIIT Hyderabad", "year": 4, "bio": "ML and analytics student; turns messy spreadsheets into insights.", "skills": {"python": 5, "machine learning": 4, "sql": 4, "power bi": 3}, "rating": 4.4, "completed_projects": 2, "hours_per_week": 15, "portfolio": []},
  {"id": "S07", "name": "Divya Kulkarni", "college": "St. Francis College", "year": 2, "bio": "Runs a 20k-follower lifestyle page; plans content calendars and reels for brands.", "skills": {"social media marketing": 5, "content writing": 4, "canva": 4, "video editing": 3}, "rating": 4.8, "completed_projects": 4, "hours_per_week": 12, "portfolio": [
    {"project_title": "Festive Instagram campaign", "business_name": "Kala Sarees", "completed_on": "2026-08-25", "skills_used": ["social media marketing", "canva"]}]},
  {"id": "S08", "name": "Arjun Patel", "college": "Mahindra University", "year": 3, "bio": "Learning frontend development; built several personal projects in React.", "skills": {"react": 3, "javascript": 3, "html": 3, "css": 3}, "rating": 4.0, "completed_projects": 1, "hours_per_week": 25, "portfolio": []},
  {"id": "S09", "name": "Lakshmi Prasanna", "college": "GRIET", "year": 4, "bio": "Excel and Power BI specialist; built sales reports for a family business.", "skills": {"excel": 5, "power bi": 4, "sql": 4}, "rating": 4.6, "completed_projects": 3, "hours_per_week": 10, "portfolio": [
    {"project_title": "Monthly sales dashboard", "business_name": "Annapurna Traders", "completed_on": "2026-07-30", "skills_used": ["power bi", "excel"]}]},
  {"id": "S10", "name": "Vikram Singh", "college": "CVR College of Engineering", "year": 3, "bio": "Videographer and editor; shoots product reels on a phone budget.", "skills": {"video editing": 5, "photography": 4, "social media marketing": 3}, "rating": 4.5, "completed_projects": 2, "hours_per_week": 15, "portfolio": []},
  {"id": "S11", "name": "Fatima Begum", "college": "Nizam College", "year": 2, "bio": "Writer focused on SEO blogs and website copy for small businesses.", "skills": {"content writing": 5, "seo": 4, "wordpress": 3}, "rating": 4.7, "completed_projects": 3, "hours_per_week": 10, "portfolio": []},
  {"id": "S12", "name": "Sai Teja", "college": "Vasavi College of Engineering", "year": 4, "bio": "Backend developer; integrated WhatsApp ordering bots for two local stores.", "skills": {"node.js": 5, "javascript": 4, "whatsapp api": 4, "python": 3, "sql": 3}, "rating": 4.6, "completed_projects": 4, "hours_per_week": 12, "portfolio": [
    {"project_title": "WhatsApp order bot", "business_name": "FreshMart Kirana", "completed_on": "2026-06-30", "skills_used": ["whatsapp api", "node.js"]}]},
  {"id": "S13", "name": "Nikhil Rao", "college": "BVRIT", "year": 3, "bio": "Django developer who likes building booking and form-heavy sites.", "skills": {"django": 4, "python": 4, "html": 3, "css": 3, "sql": 3}, "rating": 4.3, "completed_projects": 2, "hours_per_week": 15, "portfolio": []},
  {"id": "S14", "name": "Meghana Joshi", "college": "Woxsen University", "year": 3, "bio": "Graphic designer; logos, posters and full branding kits for startups.", "skills": {"logo design": 5, "canva": 5, "figma": 3}, "rating": 4.8, "completed_projects": 3, "hours_per_week": 8, "portfolio": [
    {"project_title": "Gym logo & poster set", "business_name": "IronCore Fitness", "completed_on": "2026-05-05", "skills_used": ["logo design", "canva"]}]},
  {"id": "S15", "name": "Harsha Vardhan", "college": "KMIT", "year": 2, "bio": "Self-taught web developer looking for a first real-world project.", "skills": {"html": 3, "css": 3, "javascript": 2, "responsive design": 2}, "rating": 0.0, "completed_projects": 0, "hours_per_week": 30, "portfolio": []},
  {"id": "S16", "name": "Ishita Agarwal", "college": "ICFAI Foundation", "year": 3, "bio": "Designer-developer hybrid; prototypes in Figma, ships in Flutter or React.", "skills": {"flutter": 3, "figma": 4, "ui design": 4, "react": 3}, "rating": 4.5, "completed_projects": 2, "hours_per_week": 14, "portfolio": []}
]
```

- [ ] **Step 7: Write the failing tests `backend/tests/conftest.py` and `backend/tests/test_store.py`**

`conftest.py`:
```python
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
```

`test_store.py`:
```python
import re


def test_seed_data_loads(store):
    assert len(store.students) == 16
    assert len(store.businesses) == 5
    assert store.students["S01"].name == "Ananya Reddy"
    assert store.projects == {}


def test_vocabulary_is_normalized_and_sorted(store):
    vocab = store.vocabulary()
    assert "whatsapp api" in vocab
    assert vocab == sorted(set(vocab))


def test_id_generators(store):
    assert store.new_project_id() == "P001"
    assert re.fullmatch(r"SB-\d{4}-[0-9A-F]{6}", store.new_cert_id())
```

- [ ] **Step 8: Run tests and confirm they fail**

Run (from `backend/`): `uv run pytest -v`
Expected: collection error `ModuleNotFoundError: No module named 'app.store'`.

- [ ] **Step 9: Write `backend/app/store.py`**

```python
import json
import secrets
from datetime import date
from pathlib import Path

from .models import Business, Certificate, Match, Project, Student
from .skills import normalize_skill

DATA_DIR = Path(__file__).parent / "data"


class Store:
    """In-memory state. Reloaded from seed JSON on every start, so demos always begin clean."""

    def __init__(self, data_dir: Path = DATA_DIR):
        students = json.loads((data_dir / "students.json").read_text(encoding="utf-8"))
        businesses = json.loads((data_dir / "businesses.json").read_text(encoding="utf-8"))
        self.students: dict[str, Student] = {s["id"]: Student(**s) for s in students}
        self.businesses: dict[str, Business] = {b["id"]: Business(**b) for b in businesses}
        self.projects: dict[str, Project] = {}
        self.certificates: dict[str, Certificate] = {}
        self.matches: dict[str, tuple[list[Match], bool]] = {}

    def vocabulary(self) -> list[str]:
        return sorted({normalize_skill(k) for s in self.students.values() for k in s.skills})

    def new_project_id(self) -> str:
        return f"P{len(self.projects) + 1:03d}"

    def new_cert_id(self) -> str:
        return f"SB-{date.today().year}-{secrets.token_hex(3).upper()}"
```

- [ ] **Step 10: Run tests and confirm they pass**

Run: `uv run pytest -v`
Expected: 3 passed.

- [ ] **Step 11: Commit**

```bash
cd ..
git add .gitignore .env.example CONTEXT.md docs/PLAN.md backend
git status   # confirm .env is NOT listed
git commit -m "Add backend scaffold, models, seed data and in-memory store"
```

---

### Task 2: Matching engine (Stage 1, deterministic)

**Files:**
- Create: `backend/app/matching.py`
- Test: `backend/tests/test_matching.py`

**Interfaces:**
- Consumes: `Requirements`, `Student`, `Match`, `normalize_skill`, fixtures `store`, `make_student`.
- Produces: `WEIGHTS: dict[str, float]`, `UNRATED_RATING: float = 3.0`, `skill_overlap(required: list[str], student_skills: dict[str, int]) -> tuple[float, list[str], list[str]]`, `rule_score(req: Requirements, student: Student) -> tuple[int, list[str], list[str]]`, `rank_candidates(req: Requirements, students: list[Student], top_k: int = 8) -> list[Match]`.

**Scoring formula** (put it on the architecture slide):
`score = 0.60·skill + 0.15·(rating/5) + 0.15·min(completed,5)/5 + 0.10·min(student_hours/needed_hours, 1)`, where `skill = Σ(level/5 for each matched required skill) / number of required skills`. Unrated students (0 completions) use `rating = 3.0`.

- [ ] **Step 1: Write the failing test `backend/tests/test_matching.py`**

```python
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
```

- [ ] **Step 2: Run and confirm failure**

Run: `uv run pytest tests/test_matching.py -v`
Expected: `ModuleNotFoundError: No module named 'app.matching'`.

- [ ] **Step 3: Write `backend/app/matching.py`**

```python
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
```

- [ ] **Step 4: Run and confirm pass**

Run: `uv run pytest -v`
Expected: 11 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/app/matching.py backend/tests/test_matching.py
git commit -m "Add deterministic skill-based matching engine"
```

---

### Task 3: AI layer: LLM client, requirement extraction, re-ranking

**Files:**
- Create: `backend/app/llm.py`, `backend/app/ai.py`
- Test: `backend/tests/test_ai.py`

**Interfaces:**
- Consumes: `Requirements`, `Match`, `Student`, `normalize_skill`, `rank_candidates`, fixture `store`.
- Produces: `llm.LLMError`, `llm.is_enabled() -> bool`, `llm.chat_json(system: str, user: str, timeout: float = 20.0) -> dict`; `ai.keyword_extract(description: str, vocabulary: list[str]) -> Requirements`, `ai.extract_requirements(description: str, vocabulary: list[str]) -> tuple[Requirements, bool]`, `ai.rerank(req: Requirements, candidates: list[Match], students: dict[str, Student]) -> tuple[list[Match], bool]` (the bool means "AI was used").

- [ ] **Step 1: Write `backend/app/llm.py`, then run a live smoke test (riskiest step)**

```python
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
    model = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
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
```

Live smoke test (from `backend/`, needs `.env` with a real key):
```bash
uv run python -c "from dotenv import load_dotenv; load_dotenv('../.env'); from app.llm import chat_json; print(chat_json('Reply in JSON only.', 'Return {\"ok\": true}'))"
```
Expected: `{'ok': True}`. If you get a 401, the key is wrong. If you get a 404 or "model not found", fix `LLM_MODEL` by checking the provider console for the current model id. **Don't continue until this works**, or consciously accept fallback-only mode.

- [ ] **Step 2: Write the failing test `backend/tests/test_ai.py`**

```python
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
```

- [ ] **Step 3: Run and confirm failure**

Run: `uv run pytest tests/test_ai.py -v`
Expected: `ImportError: cannot import name 'ai' from 'app'`.

- [ ] **Step 4: Write `backend/app/ai.py`**

```python
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
```

- [ ] **Step 5: Run and confirm pass**

Run: `uv run pytest -v`
Expected: 18 passed.

- [ ] **Step 6: Commit**

```bash
git add backend/app/llm.py backend/app/ai.py backend/tests/test_ai.py
git commit -m "Add LLM requirement extraction and re-ranking with fallbacks"
```

---

### Task 4: REST API

**Files:**
- Create: `backend/app/main.py`
- Test: `backend/tests/test_api.py`

**Interfaces:**
- Consumes: everything above.
- Produces: `create_app(store: Store | None = None) -> FastAPI` and module-level `app` (used by uvicorn as `app.main:app`). Endpoints exactly as in the API Contract table.

- [ ] **Step 1: Write the failing test `backend/tests/test_api.py`**

```python
import pytest
from fastapi.testclient import TestClient

from app.main import create_app

RESTAURANT = (
    "I run a small restaurant in Hyderabad called Spice Route Kitchen. We need a website "
    "with our menu, photos and WhatsApp ordering. Budget ₹8,000, needs to be done in 2 weeks."
)


@pytest.fixture
def client():
    return TestClient(create_app())


def post_restaurant_project(client):
    extracted = client.post("/api/projects/extract", json={"description": RESTAURANT}).json()
    payload = {**extracted["requirements"], "business_id": "B01", "description": RESTAURANT}
    response = client.post("/api/projects", json=payload)
    assert response.status_code == 201
    return response.json()


def test_health_reports_llm_disabled_in_tests(client):
    assert client.get("/api/health").json() == {"ok": True, "llm_enabled": False}


def test_extract_falls_back_without_key(client):
    body = client.post("/api/projects/extract", json={"description": RESTAURANT}).json()
    assert body["ai_used"] is False
    assert "whatsapp api" in body["requirements"]["required_skills"]


def test_full_demo_flow(client):
    project = post_restaurant_project(client)
    assert project["id"] == "P001" and project["status"] == "open"

    matches = client.get(f"/api/projects/{project['id']}/matches").json()
    assert matches["matches"][0]["student_id"] == "S01"

    offered = client.post(f"/api/projects/{project['id']}/offer", json={"student_id": "S01"})
    assert offered.json()["status"] == "offered"
    inbox = client.get("/api/students/S01/offers").json()
    assert [o["project"]["id"] for o in inbox] == [project["id"]]
    assert inbox[0]["business"]["name"] == "Spice Route Kitchen"

    accepted = client.post(f"/api/projects/{project['id']}/accept", json={"student_id": "S01"})
    assert accepted.json()["status"] == "assigned"
    assert accepted.json()["assigned_student_id"] == "S01"
    assert client.get("/api/students/S01/offers").json() == []

    cert = client.post(f"/api/projects/{project['id']}/complete", json={"rating": 5}).json()
    assert cert["id"].startswith("SB-")
    assert cert["student_name"] == "Ananya Reddy"
    assert cert["business_name"] == "Spice Route Kitchen"

    assert client.get(f"/api/certificates/{cert['id']}").status_code == 200
    student = client.get("/api/students/S01").json()
    assert student["completed_projects"] == 5
    assert student["portfolio"][-1]["cert_id"] == cert["id"]

    detail = client.get(f"/api/projects/{project['id']}").json()
    assert detail["project"]["certificate_id"] == cert["id"]
    assert detail["project"]["student_payout_inr"] == 7200
    assert detail["project"]["platform_fee_inr"] == 800

    stats = client.get("/api/stats").json()
    assert stats["certificates_issued"] == 1
    assert stats["paid_to_students_inr"] == 7200
    assert stats["platform_fees_inr"] == 800


def test_only_one_pending_offer_per_project(client):
    project = post_restaurant_project(client)
    client.post(f"/api/projects/{project['id']}/offer", json={"student_id": "S01"})
    again = client.post(f"/api/projects/{project['id']}/offer", json={"student_id": "S02"})
    assert again.status_code == 409


def test_accept_by_other_student_conflicts(client):
    project = post_restaurant_project(client)
    client.post(f"/api/projects/{project['id']}/offer", json={"student_id": "S01"})
    response = client.post(f"/api/projects/{project['id']}/accept", json={"student_id": "S02"})
    assert response.status_code == 409


def test_decline_reopens_and_blocks_reoffer(client):
    project = post_restaurant_project(client)
    pid = project["id"]
    client.post(f"/api/projects/{pid}/offer", json={"student_id": "S01"})
    declined = client.post(f"/api/projects/{pid}/decline", json={"student_id": "S01"}).json()
    assert declined["status"] == "open"
    assert declined["declined_student_ids"] == ["S01"]
    assert client.post(f"/api/projects/{pid}/offer", json={"student_id": "S01"}).status_code == 409
    assert client.post(f"/api/projects/{pid}/offer", json={"student_id": "S12"}).status_code == 200


def test_complete_requires_assignment(client):
    project = post_restaurant_project(client)
    response = client.post(f"/api/projects/{project['id']}/complete", json={"rating": 5})
    assert response.status_code == 409


def test_unknown_ids_return_404(client):
    assert client.get("/api/projects/P999").status_code == 404
    assert client.get("/api/students/S999").status_code == 404
    assert client.get("/api/certificates/SB-0000-000000").status_code == 404
```

- [ ] **Step 2: Run and confirm failure**

Run: `uv run pytest tests/test_api.py -v`
Expected: `ModuleNotFoundError: No module named 'app.main'`.

- [ ] **Step 3: Write `backend/app/main.py`**

```python
from datetime import date, datetime
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import ai, llm
from .matching import rank_candidates
from .models import Certificate, PortfolioItem, Project, ProjectCreate
from .store import Store

load_dotenv()
DIST_DIR = Path(__file__).resolve().parents[2] / "frontend" / "dist"
PLATFORM_FEE_RATE = 0.10


class ExtractRequest(BaseModel):
    description: str = Field(min_length=10, max_length=2000)


class StudentRef(BaseModel):
    student_id: str


class CompleteRequest(BaseModel):
    rating: int = Field(ge=1, le=5)


def create_app(store: Store | None = None) -> FastAPI:
    store = store or Store()
    app = FastAPI(title="SkillBridge AI")

    def get_or_404(collection: dict, key: str, label: str):
        if key not in collection:
            raise HTTPException(404, f"{label} not found")
        return collection[key]

    @app.get("/api/health")
    def health():
        return {"ok": True, "llm_enabled": llm.is_enabled()}

    @app.get("/api/stats")
    def stats():
        completed = [p for p in store.projects.values() if p.status == "completed"]
        return {
            "students": len(store.students),
            "businesses": len(store.businesses),
            "projects_posted": len(store.projects),
            "certificates_issued": len(store.certificates),
            "paid_to_students_inr": sum(p.student_payout_inr or 0 for p in completed),
            "platform_fees_inr": sum(p.platform_fee_inr or 0 for p in completed),
        }

    @app.get("/api/students")
    def list_students():
        return list(store.students.values())

    @app.get("/api/students/{student_id}")
    def get_student(student_id: str):
        return get_or_404(store.students, student_id, "Student")

    @app.get("/api/students/{student_id}/offers")
    def student_offers(student_id: str):
        get_or_404(store.students, student_id, "Student")
        return [
            {"project": p, "business": store.businesses[p.business_id]}
            for p in store.projects.values()
            if p.status == "offered" and p.offered_student_id == student_id
        ]

    @app.get("/api/businesses")
    def list_businesses():
        return list(store.businesses.values())

    @app.post("/api/projects/extract")
    def extract(body: ExtractRequest):
        requirements, ai_used = ai.extract_requirements(body.description, store.vocabulary())
        return {"requirements": requirements, "ai_used": ai_used}

    @app.post("/api/projects", status_code=201)
    def create_project(body: ProjectCreate) -> Project:
        get_or_404(store.businesses, body.business_id, "Business")
        project = Project(
            **body.model_dump(),
            id=store.new_project_id(),
            created_at=datetime.now().isoformat(timespec="seconds"),
        )
        store.projects[project.id] = project
        return project

    @app.get("/api/projects/{project_id}")
    def get_project(project_id: str):
        project = get_or_404(store.projects, project_id, "Project")
        return {
            "project": project,
            "business": store.businesses[project.business_id],
            "offered_student": store.students.get(project.offered_student_id or ""),
            "assigned_student": store.students.get(project.assigned_student_id or ""),
        }

    @app.get("/api/projects/{project_id}/matches")
    def get_matches(project_id: str):
        project = get_or_404(store.projects, project_id, "Project")
        if project_id not in store.matches:
            candidates = rank_candidates(project, list(store.students.values()))
            store.matches[project_id] = ai.rerank(project, candidates, store.students)
        ranked, ai_used = store.matches[project_id]
        return {"matches": ranked, "ai_used": ai_used}

    @app.post("/api/projects/{project_id}/offer")
    def offer(project_id: str, body: StudentRef) -> Project:
        project = get_or_404(store.projects, project_id, "Project")
        get_or_404(store.students, body.student_id, "Student")
        if project.status != "open":
            raise HTTPException(409, "Project is not open for offers")
        if body.student_id in project.declined_student_ids:
            raise HTTPException(409, "Student already declined this project")
        project.status = "offered"
        project.offered_student_id = body.student_id
        return project

    def pending_offer_for(project_id: str, student_id: str) -> Project:
        project = get_or_404(store.projects, project_id, "Project")
        if project.status != "offered" or project.offered_student_id != student_id:
            raise HTTPException(409, "No pending offer for this student")
        return project

    @app.post("/api/projects/{project_id}/accept")
    def accept(project_id: str, body: StudentRef) -> Project:
        project = pending_offer_for(project_id, body.student_id)
        project.status = "assigned"
        project.assigned_student_id = body.student_id
        project.offered_student_id = None
        return project

    @app.post("/api/projects/{project_id}/decline")
    def decline(project_id: str, body: StudentRef) -> Project:
        project = pending_offer_for(project_id, body.student_id)
        project.status = "open"
        project.declined_student_ids.append(body.student_id)
        project.offered_student_id = None
        return project

    @app.post("/api/projects/{project_id}/complete")
    def complete(project_id: str, body: CompleteRequest) -> Certificate:
        project = get_or_404(store.projects, project_id, "Project")
        if project.status != "assigned":
            raise HTTPException(409, "Project must be assigned before completion")
        student = store.students[project.assigned_student_id]
        business = store.businesses[project.business_id]
        cert = Certificate(
            id=store.new_cert_id(),
            student_id=student.id,
            student_name=student.name,
            project_id=project.id,
            project_title=project.title,
            business_name=business.name,
            skills_verified=project.required_skills,
            rating=body.rating,
            issued_on=date.today().isoformat(),
        )
        store.certificates[cert.id] = cert
        student.rating = round(
            (student.rating * student.completed_projects + body.rating) / (student.completed_projects + 1), 1
        )
        student.completed_projects += 1
        student.portfolio.append(PortfolioItem(
            project_title=project.title,
            business_name=business.name,
            completed_on=cert.issued_on,
            skills_used=project.required_skills,
            cert_id=cert.id,
        ))
        project.platform_fee_inr = round(project.budget_inr * PLATFORM_FEE_RATE)
        project.student_payout_inr = project.budget_inr - project.platform_fee_inr
        project.status = "completed"
        project.certificate_id = cert.id
        return cert

    @app.get("/api/certificates/{cert_id}")
    def get_certificate(cert_id: str):
        return get_or_404(store.certificates, cert_id, "Certificate")

    # Production: serve the built React app; unknown paths fall back to index.html (client-side routing).
    if DIST_DIR.exists():
        app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        def spa(full_path: str):
            file = (DIST_DIR / full_path).resolve()
            if full_path and file.is_file() and file.is_relative_to(DIST_DIR):
                return FileResponse(file)
            return FileResponse(DIST_DIR / "index.html")

    return app


app = create_app()
```

- [ ] **Step 4: Run and confirm pass**

Run: `uv run pytest -v`
Expected: 26 passed.

- [ ] **Step 5: Manual live check with the real LLM**

```bash
uv run uvicorn app.main:app --reload --port 8000
```
Open `http://localhost:8000/docs`. Check that `GET /api/health` shows `llm_enabled: true`, then run `POST /api/projects/extract` with the restaurant text and confirm `ai_used: true`. Next, POST the project and GET its matches. Expected: S01 or S12 near the top, `ai_used: true`, and reasons that cite real profile details.

If the reasons look generic, tighten `RERANK_SYSTEM`, but change only the prompt string.

- [ ] **Step 6: Commit**

```bash
git add backend/app/main.py backend/tests/test_api.py
git commit -m "Add REST API for projects, matching, offers and certificates"
```

---

### Task 5: Frontend shell: scaffold, router, layout, styles, Home + Students

**Files:**
- Create: `frontend/` (Vite template), `frontend/vite.config.js`, `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/api.js`, `frontend/src/index.css`, `frontend/src/components/SkillChips.jsx`, `frontend/src/pages/Home.jsx`, `frontend/src/pages/Students.jsx`
- Delete: `frontend/src/App.css`, `frontend/src/assets/react.svg`, `frontend/public/vite.svg`

**Interfaces:**
- Consumes: the API Contract.
- Produces: `api` object (`stats, students, student, studentOffers, businesses, extract, createProject, project, matches, offer, accept, decline, complete, certificate`), `<SkillChips skills variant editable onChange />`, routes `/`, `/post`, `/projects/:id`, `/students`, `/students/:id`, `/certificate/:id`. CSS classes used by later tasks: `card, btn, primary, link, badge, ai, chip, chips, good, gap, narrow, row, row-between, grid, grid-3, form, muted, small, meta, eyebrow, error, highlight, bar, no-print`.

- [ ] **Step 1: Scaffold**

```bash
cd C:/Users/marsh/OneDrive/Desktop/code/projects/skillbridge-ai
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install react-router-dom
rm -f src/App.css src/assets/react.svg public/vite.svg
```
In `frontend/index.html`, set `<title>SkillBridge AI</title>` and delete the `vite.svg` favicon `<link>` line.

- [ ] **Step 2: Write `frontend/vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
```

- [ ] **Step 3: Write `frontend/src/api.js`**

```js
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const detail = typeof body.detail === 'string' ? body.detail : `Request failed (${res.status})`
    throw new Error(detail)
  }
  return res.json()
}

const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) })

export const api = {
  stats: () => request('/stats'),
  students: () => request('/students'),
  student: (id) => request(`/students/${id}`),
  businesses: () => request('/businesses'),
  extract: (description) => post('/projects/extract', { description }),
  createProject: (payload) => post('/projects', payload),
  project: (id) => request(`/projects/${id}`),
  matches: (id) => request(`/projects/${id}/matches`),
  studentOffers: (id) => request(`/students/${id}/offers`),
  offer: (id, studentId) => post(`/projects/${id}/offer`, { student_id: studentId }),
  accept: (id, studentId) => post(`/projects/${id}/accept`, { student_id: studentId }),
  decline: (id, studentId) => post(`/projects/${id}/decline`, { student_id: studentId }),
  complete: (id, rating) => post(`/projects/${id}/complete`, { rating }),
  certificate: (id) => request(`/certificates/${id}`),
}
```

- [ ] **Step 4: Write `frontend/src/main.jsx` (references pages built in Tasks 6–8; create them as stubs now)**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Students from './pages/Students.jsx'
import PostProject from './pages/PostProject.jsx'
import ProjectMatches from './pages/ProjectMatches.jsx'
import StudentProfile from './pages/StudentProfile.jsx'
import Certificate from './pages/Certificate.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="post" element={<PostProject />} />
          <Route path="projects/:id" element={<ProjectMatches />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="certificate/:id" element={<Certificate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
```

Temporary stubs so the app compiles (Tasks 6–8 replace them). Create each of `PostProject.jsx`, `ProjectMatches.jsx`, `StudentProfile.jsx`, `Certificate.jsx` in `src/pages/` with:
```jsx
export default function Page() {
  return <p className="muted">Coming soon</p>
}
```

- [ ] **Step 5: Write `frontend/src/App.jsx`**

```jsx
import { Link, NavLink, Outlet } from 'react-router-dom'

export default function App() {
  return (
    <>
      <header className="nav no-print">
        <Link to="/" className="logo">Skill<span>Bridge</span> AI</Link>
        <nav>
          <NavLink to="/post">Post a project</NavLink>
          <NavLink to="/students">Students</NavLink>
        </nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  )
}
```

- [ ] **Step 6: Write `frontend/src/components/SkillChips.jsx`**

```jsx
import { useState } from 'react'

export default function SkillChips({ skills, variant = '', editable = false, onChange }) {
  const [draft, setDraft] = useState('')

  function add(e) {
    e.preventDefault()
    const skill = draft.trim().toLowerCase()
    if (skill && !skills.includes(skill)) onChange([...skills, skill])
    setDraft('')
  }

  return (
    <div className="chips">
      {skills.map((s) => (
        <span key={s} className={`chip ${variant}`}>
          {s}
          {editable && (
            <button type="button" aria-label={`Remove ${s}`} onClick={() => onChange(skills.filter((x) => x !== s))}>×</button>
          )}
        </span>
      ))}
      {editable && (
        <form onSubmit={add} className="chip-add">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="+ add skill" />
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Write `frontend/src/pages/Home.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const STEPS = [
  ['Post in plain English', 'A business describes what it needs. No tech jargon required.'],
  ['AI finds the right students', 'Skills are extracted automatically and students are ranked with clear reasons.'],
  ['Deliver, pay, verify', 'Students get paid and earn a verifiable certificate for their portfolio.'],
]

function Stat({ label, value }) {
  return (
    <div className="card stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

export default function Home() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.stats().then(setStats).catch(() => setStats(null))
  }, [])

  return (
    <div>
      <section className="hero">
        <p className="eyebrow">AI-powered micro-internships</p>
        <h1>Every company wants experienced freshers.<br />We give freshers their first experience.</h1>
        <p className="lead">
          SkillBridge AI connects college students with startups and local businesses for short,
          paid, real-world projects, matched by AI on actual skills.
        </p>
        <div className="row">
          <Link className="btn primary" to="/post">Post a project</Link>
          <Link className="btn" to="/students">Browse students</Link>
        </div>
      </section>

      {stats && (
        <section className="grid stats">
          <Stat label="Students" value={stats.students} />
          <Stat label="Businesses" value={stats.businesses} />
          <Stat label="Projects posted" value={stats.projects_posted} />
          <Stat label="Certificates issued" value={stats.certificates_issued} />
          <Stat label="Paid to students" value={`₹${stats.paid_to_students_inr.toLocaleString('en-IN')}`} />
        </section>
      )}

      <h2>How it works</h2>
      <section className="grid">
        {STEPS.map(([title, text], i) => (
          <div className="card" key={title}>
            <span className="step-num">{i + 1}</span>
            <h3>{title}</h3>
            <p className="muted">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
```

- [ ] **Step 8: Write `frontend/src/pages/Students.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import SkillChips from '../components/SkillChips'

export default function Students() {
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.students().then(setStudents).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <h1>Students</h1>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {students.map((s) => (
          <Link key={s.id} to={`/students/${s.id}`} className="card student-card">
            <strong>{s.name}</strong>
            <span className="small muted">{s.college} · Year {s.year}</span>
            <SkillChips skills={Object.keys(s.skills).slice(0, 4)} />
            <span className="small">
              {s.completed_projects > 0 ? `★ ${s.rating} · ${s.completed_projects} projects` : 'New talent'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Write `frontend/src/index.css`** (replace the template file entirely)

```css
:root {
  --bg: #f6f7fb;
  --surface: #ffffff;
  --text: #1c1f2a;
  --muted: #646a7d;
  --border: #e3e6ef;
  --primary: #4f46e5;
  --primary-soft: #eef0ff;
  --good: #0f9d6b;
  --good-soft: #e6f7f0;
  --gap: #b45309;
  --gap-soft: #fdf3e3;
  --radius: 12px;
  font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: var(--text);
  background: var(--bg);
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); }
a { color: var(--primary); text-decoration: none; }
h1 { font-size: 2rem; margin: 0.4rem 0 0.8rem; line-height: 1.2; }
h2 { font-size: 1.25rem; margin: 1.6rem 0 0.8rem; }
h3 { margin: 0.4rem 0; }

.nav { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10; }
.nav nav { display: flex; gap: 20px; }
.nav nav a { color: var(--muted); font-weight: 500; }
.nav nav a.active { color: var(--primary); }
.logo { font-weight: 800; font-size: 1.2rem; color: var(--text); }
.logo span { color: var(--primary); }

.container { max-width: 1040px; margin: 0 auto; padding: 24px 16px 64px; }
.narrow { max-width: 760px; margin: 0 auto; }

.hero { padding: 40px 0 24px; }
.hero h1 { font-size: 2.4rem; }
.lead { font-size: 1.1rem; color: var(--muted); max-width: 640px; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; font-weight: 700; color: var(--primary); margin: 0; }

.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; }
.card.highlight { border-color: var(--primary); background: var(--primary-soft); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.grid .card { margin-bottom: 0; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.stats { margin: 24px 0; }
.stat strong { display: block; font-size: 1.6rem; }
.stat span { color: var(--muted); font-size: 0.9rem; }
.step-num { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--primary-soft); color: var(--primary); font-weight: 700; }
.student-card { display: flex; flex-direction: column; gap: 8px; color: var(--text); }
.student-card:hover { border-color: var(--primary); }

.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 12px; }
.row-between { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.grow { flex: 1; }
.muted { color: var(--muted); }
.small { font-size: 0.85rem; }
.meta { color: var(--muted); font-size: 0.9rem; margin-top: 12px; }
.error { color: #c0262d; font-weight: 500; }

.btn { display: inline-block; padding: 10px 18px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
.btn.primary { background: var(--primary); border-color: var(--primary); color: #fff; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.link { background: none; border: none; padding: 0; color: var(--primary); font: inherit; cursor: pointer; text-align: left; }

.form { display: flex; flex-direction: column; gap: 14px; }
.form label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; font-size: 0.9rem; }
input, select, textarea { font: inherit; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: #fff; }
textarea { resize: vertical; }

.badge { font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: var(--border); color: var(--muted); white-space: nowrap; }
.badge.ai { background: var(--primary-soft); color: var(--primary); }

.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; align-items: center; }
.chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-size: 0.85rem; font-weight: 500; }
.chip.good { background: var(--good-soft); color: var(--good); }
.chip.gap { background: var(--gap-soft); color: var(--gap); }
.chip button { border: none; background: none; color: inherit; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0 0 0 2px; }
.chip-add input { padding: 4px 10px; border-radius: 999px; font-size: 0.85rem; width: 130px; }

.match-head { display: flex; align-items: center; gap: 14px; }
.rank { font-weight: 800; color: var(--muted); font-size: 1.1rem; }
.name { font-weight: 700; font-size: 1.1rem; color: var(--text); }
.score { text-align: right; }
.score strong { display: block; font-size: 1.6rem; color: var(--primary); }
.bar { height: 8px; background: var(--border); border-radius: 999px; overflow: hidden; margin: 12px 0; }
.bar > div { height: 100%; background: linear-gradient(90deg, var(--primary), #7c74ff); border-radius: 999px; transition: width 0.6s ease; }
.small-bar { height: 6px; margin: 0; flex: 1; }
.skill-row { display: flex; align-items: center; gap: 14px; margin: 10px 0; }
.skill-row span { width: 170px; }
.portfolio-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 12px 0; border-top: 1px solid var(--border); }

.certificate { background: #fff; border: 2px solid var(--primary); border-radius: 16px; padding: 48px 40px; text-align: center; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(79, 70, 229, 0.08); }
.certificate h1 { font-size: 2.4rem; margin: 12px 0; }
.certificate .chips { justify-content: center; }
.stars { color: #f5a524; font-size: 1.4rem; letter-spacing: 2px; }
.cert-foot { display: flex; justify-content: space-between; margin-top: 28px; padding-top: 16px; border-top: 1px dashed var(--border); color: var(--muted); font-size: 0.9rem; }

@media (max-width: 640px) {
  .hero h1 { font-size: 1.8rem; }
  .grid-3 { grid-template-columns: 1fr; }
  .certificate { padding: 32px 18px; }
}

@media print {
  .no-print { display: none !important; }
  body, :root { background: #fff; }
  .certificate { box-shadow: none; }
}
```

- [ ] **Step 10: Verify in the browser**

Terminal 1 (`backend/`): `uv run uvicorn app.main:app --reload --port 8000`
Terminal 2 (`frontend/`): `npm run dev`
Open `http://localhost:5173`. Expected: the hero renders, stats show 16 students and 5 businesses, the Students page lists 16 cards, and the console has no errors.

- [ ] **Step 11: Commit**

```bash
cd ..
git add frontend
git commit -m "Add frontend shell with home and students pages"
```

---

### Task 6: Post-project page (plain English → AI requirements → publish)

**Files:**
- Modify: `frontend/src/pages/PostProject.jsx` (replace stub)

**Interfaces:**
- Consumes: `api.businesses`, `api.extract`, `api.createProject`, `<SkillChips editable />`.
- Produces: navigation to `/projects/:id` after publishing.

- [ ] **Step 1: Write `frontend/src/pages/PostProject.jsx`**

Sample descriptions are one click away, so you never have to type live on stage.

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import SkillChips from '../components/SkillChips'

const SAMPLES = {
  B01: 'I run a small restaurant in Hyderabad called Spice Route Kitchen. We need a website with our menu, photos and WhatsApp ordering. Budget ₹8,000, needs to be done in 2 weeks.',
  B02: 'We are a clothing boutique and want to grow on Instagram. Need someone to plan a month of posts and reels for our Diwali collection. Budget ₹5,000, 3 weeks.',
  B03: 'New gym opening in Gachibowli. Need a modern logo and branding kit for posters and social media. Budget ₹4,000, 1 week.',
  B04: 'We sell organic groceries online and track sales in Excel sheets. Want a simple dashboard showing monthly sales and top products. Budget ₹6,000, 2 weeks.',
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

export default function PostProject() {
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const [businessId, setBusinessId] = useState('B01')
  const [description, setDescription] = useState('')
  const [req, setReq] = useState(null)
  const [aiUsed, setAiUsed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.businesses().then(setBusinesses).catch((e) => setError(e.message))
  }, [])

  function changeDescription(text) {
    setDescription(text)
    setReq(null)
  }

  async function analyze() {
    setBusy(true)
    setError('')
    try {
      const res = await api.extract(description)
      setReq(res.requirements)
      setAiUsed(res.ai_used)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function publish() {
    setBusy(true)
    setError('')
    try {
      const project = await api.createProject({ ...req, business_id: businessId, description })
      navigate(`/projects/${project.id}`)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const update = (field, numeric = false) => (e) =>
    setReq({ ...req, [field]: numeric ? Number(e.target.value) : e.target.value })

  return (
    <div className="narrow">
      <h1>Post a project</h1>
      <div className="card form">
        <label>
          Business
          <select value={businessId} onChange={(e) => { setBusinessId(e.target.value); changeDescription('') }}>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.type})</option>)}
          </select>
        </label>
        <label>
          Describe what you need, in your own words
          <textarea
            rows={5}
            value={description}
            onChange={(e) => changeDescription(e.target.value)}
            placeholder="e.g. I need a website for my restaurant with our menu and online ordering…"
          />
        </label>
        {SAMPLES[businessId] && (
          <button type="button" className="link" onClick={() => changeDescription(SAMPLES[businessId])}>
            Use sample description
          </button>
        )}
        <button className="btn primary" disabled={busy || description.trim().length < 10} onClick={analyze}>
          {busy && !req ? 'Analyzing…' : 'Analyze with AI'}
        </button>
      </div>

      {req && (
        <div className="card form">
          <div className="row-between">
            <h2>Extracted requirements</h2>
            <span className={`badge ${aiUsed ? 'ai' : ''}`}>{aiUsed ? 'AI extracted' : 'Keyword fallback'}</span>
          </div>
          <label>Title<input value={req.title} onChange={update('title')} /></label>
          <label>Summary<input value={req.summary} onChange={update('summary')} /></label>
          <div>
            <strong className="small">Required skills</strong>
            <SkillChips skills={req.required_skills} editable onChange={(skills) => setReq({ ...req, required_skills: skills })} />
          </div>
          <div className="grid-3">
            <label>Budget (₹)<input type="number" min={0} value={req.budget_inr} onChange={update('budget_inr', true)} /></label>
            <label>Duration (weeks)<input type="number" min={1} max={12} value={req.duration_weeks} onChange={update('duration_weeks', true)} /></label>
            <label>Hours / week<input type="number" min={1} max={40} value={req.hours_per_week} onChange={update('hours_per_week', true)} /></label>
          </div>
          <label>
            Difficulty
            <select value={req.difficulty} onChange={update('difficulty')}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <button className="btn primary" disabled={busy || req.required_skills.length === 0} onClick={publish}>
            {busy ? 'Publishing…' : 'Publish & find students'}
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Verify in the browser**

Go to `/post`, select Spice Route Kitchen, click "Use sample description", then "Analyze with AI". Expected: the requirements card appears with an "AI extracted" badge (or "Keyword fallback" with no key). Skills include whatsapp api, the budget is 8000 and the duration is 2. Remove a skill chip, then add one back with Enter. Click Publish. Expected: the URL changes to `/projects/P001` (the stub page is fine for now).

Repeat with B03 (gym logo). Expected: skills include logo design.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/PostProject.jsx
git commit -m "Add post-project page with AI requirement extraction"
```

---

### Task 7: Matches page (ranked students → offer → complete)

**Files:**
- Create: `frontend/src/components/MatchCard.jsx`
- Modify: `frontend/src/pages/ProjectMatches.jsx` (replace stub)

**Interfaces:**
- Consumes: `api.project`, `api.matches`, `api.offer`, `api.complete`, `<SkillChips />`. (The Student accepts on their profile page in Task 8.)
- Produces: navigation to `/certificate/:id` after completion.

- [ ] **Step 1: Write `frontend/src/components/MatchCard.jsx`**

```jsx
import { Link } from 'react-router-dom'
import SkillChips from './SkillChips'

export default function MatchCard({ rank, match, canOffer, declined, disabled, onOffer }) {
  return (
    <div className="card match">
      <div className="match-head">
        <span className="rank">#{rank}</span>
        <div className="grow">
          <Link to={`/students/${match.student_id}`} className="name">{match.student_name}</Link>
          <div className="small muted">{match.college}</div>
        </div>
        <div className="score">
          <strong>{match.match_percent}%</strong>
          <span className="small muted">match</span>
        </div>
      </div>
      <div className="bar"><div style={{ width: `${match.match_percent}%` }} /></div>
      <p>{match.reason}</p>
      <SkillChips skills={match.matched_skills} variant="good" />
      {match.gaps.length > 0 && (
        <>
          <div className="small muted">Skill gaps</div>
          <SkillChips skills={match.gaps} variant="gap" />
        </>
      )}
      {declined && <span className="badge">Declined</span>}
      {canOffer && !declined && (
        <button className="btn primary" disabled={disabled} onClick={onOffer}>Send offer</button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write `frontend/src/pages/ProjectMatches.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import MatchCard from '../components/MatchCard'
import SkillChips from '../components/SkillChips'

export default function ProjectMatches() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [matches, setMatches] = useState(null)
  const [aiUsed, setAiUsed] = useState(false)
  const [rating, setRating] = useState(5)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.project(id).then(setDetail).catch((e) => setError(e.message))
    api.matches(id)
      .then((res) => { setMatches(res.matches); setAiUsed(res.ai_used) })
      .catch((e) => setError(e.message))
  }, [id])

  async function sendOffer(studentId) {
    setBusy(true)
    try {
      await api.offer(id, studentId)
      setDetail(await api.project(id))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function complete() {
    setBusy(true)
    try {
      const cert = await api.complete(id, rating)
      navigate(`/certificate/${cert.id}`)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (error) return <p className="error">{error}</p>
  if (!detail) return <p className="muted">Loading project…</p>

  const { project, business, offered_student: offered, assigned_student: assigned } = detail
  const inr = (n) => `₹${n.toLocaleString('en-IN')}`

  return (
    <div className="narrow">
      <div className="card">
        <p className="eyebrow">{business.name} · {business.city}</p>
        <h1>{project.title}</h1>
        <p className="muted">{project.summary}</p>
        <SkillChips skills={project.required_skills} />
        <p className="meta">
          {inr(project.budget_inr)} · {project.duration_weeks} week(s) · {project.hours_per_week} hrs/week · {project.difficulty}
        </p>
      </div>

      {project.status === 'offered' && offered && (
        <div className="card highlight">
          <h2>Offer sent to {offered.name}</h2>
          <p className="muted">Waiting for {offered.name} to accept or decline.</p>
          <Link className="btn" to={`/students/${offered.id}`}>Open {offered.name}'s view →</Link>
        </div>
      )}

      {project.status === 'assigned' && assigned && (
        <div className="card highlight">
          <h2>Assigned to {assigned.name}</h2>
          <p className="muted">When the work is delivered, rate it to release payment and issue a verified certificate.</p>
          <div className="row">
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{'★'.repeat(r)} ({r})</option>)}
            </select>
            <button className="btn primary" disabled={busy} onClick={complete}>Mark complete & issue certificate</button>
          </div>
        </div>
      )}

      {project.status === 'completed' && (
        <div className="card highlight">
          <h2>Completed ✓</h2>
          <p>
            Payout to student: <strong>{inr(project.student_payout_inr)}</strong> · Platform fee (10%): {inr(project.platform_fee_inr)}
            <span className="small muted"> (simulated)</span>
          </p>
          <Link className="btn" to={`/certificate/${project.certificate_id}`}>View certificate</Link>
        </div>
      )}

      <div className="row-between">
        <h2>Top matches</h2>
        {matches && <span className={`badge ${aiUsed ? 'ai' : ''}`}>{aiUsed ? 'AI-ranked' : 'Rule-based ranking'}</span>}
      </div>
      {!matches && <p className="muted">AI is ranking students for this project…</p>}
      {matches?.length === 0 && <p className="muted">No students match these skills yet.</p>}
      {matches?.map((m, i) => (
        <MatchCard
          key={m.student_id}
          rank={i + 1}
          match={m}
          canOffer={project.status === 'open'}
          declined={project.declined_student_ids.includes(m.student_id)}
          disabled={busy}
          onOffer={() => sendOffer(m.student_id)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify in the browser**

Post the restaurant project (Task 6 flow). Expected on `/projects/P001`: a loading line, then up to 8 match cards sorted by %, each with a reason, green matched skills, amber gaps and an "AI-ranked" badge. Click "Send offer" on the top card. Expected: the highlight card "Offer sent to …" appears with an "Open …'s view" link, and the offer buttons disappear. Accepting is built in Task 8. Until then, accept via `/docs` (`POST /api/projects/P001/accept`) and refresh. Expected: "Assigned to …". Click "Mark complete". Expected: the URL changes to `/certificate/SB-…` (stub for now).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/MatchCard.jsx frontend/src/pages/ProjectMatches.jsx
git commit -m "Add ranked matches page with offer and complete flow"
```

---

### Task 8: Certificate + student portfolio pages

**Files:**
- Modify: `frontend/src/pages/Certificate.jsx`, `frontend/src/pages/StudentProfile.jsx` (replace stubs)

**Interfaces:**
- Consumes: `api.certificate`, `api.student`, `api.studentOffers`, `api.accept`, `api.decline`, `<SkillChips />`.

- [ ] **Step 1: Write `frontend/src/pages/Certificate.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import SkillChips from '../components/SkillChips'

export default function Certificate() {
  const { id } = useParams()
  const [cert, setCert] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.certificate(id).then(setCert).catch((e) => setError(e.message))
  }, [id])

  if (error) return <p className="error">Certificate {id} could not be verified.</p>
  if (!cert) return <p className="muted">Verifying certificate…</p>

  return (
    <div className="narrow">
      <div className="certificate">
        <p className="eyebrow">SkillBridge AI · Verified Experience Certificate</p>
        <p>This certifies that</p>
        <h1>{cert.student_name}</h1>
        <p>successfully delivered <strong>{cert.project_title}</strong> for <strong>{cert.business_name}</strong>.</p>
        <SkillChips skills={cert.skills_verified} variant="good" />
        <p className="stars" aria-label={`Rated ${cert.rating} of 5`}>
          {'★'.repeat(cert.rating)}{'☆'.repeat(5 - cert.rating)}
        </p>
        <div className="cert-foot">
          <span>Issued {cert.issued_on}</span>
          <span>ID: {cert.id}</span>
        </div>
        <p className="small muted">Verify at {window.location.href}</p>
      </div>
      <div className="row no-print">
        <button className="btn" onClick={() => window.print()}>Print / Save PDF</button>
        <Link className="btn" to={`/students/${cert.student_id}`}>View portfolio</Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `frontend/src/pages/StudentProfile.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import SkillChips from '../components/SkillChips'

export default function StudentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [s, setS] = useState(null)
  const [offers, setOffers] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.student(id).then(setS).catch((e) => setError(e.message))
    api.studentOffers(id).then(setOffers).catch((e) => setError(e.message))
  }, [id])

  async function respond(projectId, accept) {
    setBusy(true)
    try {
      if (accept) {
        await api.accept(projectId, id)
        navigate(`/projects/${projectId}`)
      } else {
        await api.decline(projectId, id)
        setOffers(await api.studentOffers(id))
        setBusy(false)
      }
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  if (error) return <p className="error">{error}</p>
  if (!s) return <p className="muted">Loading profile…</p>

  const skills = Object.entries(s.skills).sort((a, b) => b[1] - a[1])

  return (
    <div className="narrow">
      {offers.length > 0 && (
        <div className="card highlight">
          <h2>Pending offers</h2>
          {offers.map(({ project, business }) => (
            <div className="portfolio-item" key={project.id}>
              <div>
                <strong>{project.title}</strong>
                <div className="small muted">
                  {business.name} · ₹{project.budget_inr.toLocaleString('en-IN')} · {project.duration_weeks} week(s)
                </div>
              </div>
              <div className="row">
                <button className="btn primary" disabled={busy} onClick={() => respond(project.id, true)}>Accept</button>
                <button className="btn" disabled={busy} onClick={() => respond(project.id, false)}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h1>{s.name}</h1>
        <p className="muted">{s.college} · Year {s.year}</p>
        <p>{s.bio}</p>
        <p className="meta">
          {s.completed_projects > 0
            ? `★ ${s.rating} · ${s.completed_projects} projects completed`
            : 'New to SkillBridge, looking for a first project'}
          {' · '}{s.hours_per_week} hrs/week available
        </p>
      </div>

      <div className="card">
        <h2>Skills</h2>
        {skills.map(([skill, level]) => (
          <div className="skill-row" key={skill}>
            <span>{skill}</span>
            <div className="bar small-bar"><div style={{ width: `${level * 20}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Verified portfolio</h2>
        {s.portfolio.length === 0 && <p className="muted">No completed projects yet.</p>}
        {s.portfolio.map((p) => (
          <div className="portfolio-item" key={`${p.project_title}-${p.completed_on}`}>
            <div>
              <strong>{p.project_title}</strong>
              <div className="small muted">{p.business_name} · {p.completed_on}</div>
              <SkillChips skills={p.skills_used} />
            </div>
            {p.cert_id && <Link className="badge ai" to={`/certificate/${p.cert_id}`}>Verified ✓</Link>}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify in the browser**

Post a new project and send an offer to the top Match, then click "Open …'s view". Expected: a "Pending offers" card with Accept and Decline. Click Decline. Expected: the card disappears. Back on the project, that Match shows a "Declined" badge and the other Matches can be offered again. Now offer someone else and Accept from their view. Expected: you land on the project with "Assigned to …". Mark it complete. Expected: the completed card shows Payout ₹7,200 and Platform fee ₹800 for an ₹8,000 Budget. Click "View certificate". Expected: it shows the student name, project, business, green skills, 5 stars and an `SB-2026-XXXXXX` ID. Click "Print / Save PDF" and confirm the preview hides the nav and buttons. Click "View portfolio". Expected: the new item sits at the bottom with a "Verified ✓" badge linking back to the certificate, the completed count went up by 1, and seeded past work has no badge. Then open `/students/S15`. Expected: it shows "New to SkillBridge…".

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Certificate.jsx frontend/src/pages/StudentProfile.jsx
git commit -m "Add certificate, student portfolio and offer response pages"
```

---

### Task 9: End-to-end rehearsal, fallback drill, README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Full test suite**

Run (from `backend/`): `uv run pytest -v`
Expected: 26 passed.

- [ ] **Step 2: Live E2E run, all four sample businesses**

Restart the backend so state is clean. For B01 to B04, run sample description → Analyze → Publish → check that the matches make sense:
- B01 restaurant → web devs top (S01/S12/S02)
- B02 boutique → S07/S10
- B03 gym → S14/S05
- B04 organics → S09/S06

If a ranking looks wrong, fix the cause: a synonym in `skills.py`, a hint in `KEYWORD_HINTS`, or the prompt wording. **Never** fix it by editing tests to match. Afterwards, re-run `uv run pytest`.

- [ ] **Step 3: Fallback drill (simulates Wi-Fi dying mid-presentation)**

Temporarily rename `.env` to `.env.off`, restart the backend and repeat the B01 flow. Expected: "Keyword fallback" and "Rule-based ranking" badges, with S01 still #1 and the whole flow still completing. Rename it back afterwards.

- [ ] **Step 4: Write `README.md`**

````markdown
# SkillBridge AI

AI-powered micro-internship platform connecting college students with startups and local businesses for short, paid, real-world projects.

**Demo flow:** a business describes a project in plain English → AI extracts the required skills → students are ranked with a Match Score, a reason and skill gaps → the business sends an offer → the student accepts → completion releases the payout (minus a 10% platform fee) → the student receives a verifiable certificate on their portfolio.

## How matching works

1. **Requirement extraction:** an LLM turns the plain-English request into structured requirements (skills, budget, duration). Fallback: keyword and regex extraction.
2. **Stage 1, rule score:** `0.60·skill + 0.15·rating + 0.15·experience + 0.10·availability`, where skill overlap is weighted by proficiency level (1–5). This shortlists the top 8.
3. **Stage 2, LLM re-rank:** the LLM reads the full profiles (bio, past projects) and returns a fit score, a reason and gaps. Final match = 50% rule + 50% LLM.
4. Every LLM step validates its JSON output and falls back to the deterministic result on any failure.

## Run locally

Requirements: [uv](https://docs.astral.sh/uv/), Node 20+.

```bash
cp .env.example .env        # add your LLM_API_KEY (Groq or Gemini)
cd backend && uv sync && uv run uvicorn app.main:app --reload --port 8000
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Tests: `cd backend && uv run pytest`

## Stack

FastAPI · Pydantic · React + Vite · Groq (Llama 3.3 70B) via an OpenAI-compatible API · Docker / Render
````

- [ ] **Step 5: Screenshots for the deck**

Take screenshots at a 1440px-wide browser window and save them to `docs/screenshots/`: `home.png`, `post-project.png` (requirements visible), `matches.png` (top 3 cards visible), `certificate.png`, `portfolio.png`.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/screenshots
git commit -m "Add README and demo screenshots"
```

---

### Task 10 (optional): Deploy as one service on Render

Skip this if it's Day 2 midday and you're behind. A local demo is fully acceptable. **Creating a GitHub repo and deploying are outward-facing: confirm with the user before pushing.**

**Files:**
- Create: `Dockerfile`, `.dockerignore`

- [ ] **Step 1: Write `Dockerfile`**

```dockerfile
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app/backend
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev
COPY backend/ ./
COPY --from=web /web/dist /app/frontend/dist
ENV PORT=8000
CMD ["sh", "-c", "uv run --no-dev uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
```

`.dockerignore`:
```
**/node_modules
**/.venv
**/__pycache__
frontend/dist
.env
.git
```

- [ ] **Step 2: Build and run locally**

```bash
docker build -t skillbridge-ai .
docker run --rm -p 8000:8000 --env-file .env skillbridge-ai
```
Open `http://localhost:8000`. The whole app, including deep links like `/students/S01` on refresh, works from a single port.

- [ ] **Step 3: Push and deploy (after user confirmation)**

1. Create a GitHub repo `skillbridge-ai` and push the `main` and `feat/mvp` branches. Open a PR `feat/mvp → main` and merge it yourself (solo repo).
2. On Render, create a New Web Service from the repo, choose Runtime: Docker and the free instance type. Add env vars `LLM_API_KEY`, `LLM_BASE_URL` and `LLM_MODEL`.
3. Expected: the public URL serves the app. Note that the free tier sleeps after inactivity. **Open the URL 2 minutes before presenting** to wake it.

---

### Task 11: Pitch deck (12 slides)

**Files:**
- Create: `docs/DECK_OUTLINE.md` (the content below), then build the deck from it (Claude Slides artifact → download .pptx, or PowerPoint/Google Slides by hand)

Rules: one idea per slide, at most 25 words of slide text, and everything else goes in speaker notes. Use the screenshots from Task 9. **Any number marked † needs a source checked before you present.** Illustrative pricing is labelled as "proposed".

| # | Slide | On-slide content | Speaker notes (say this) |
|---|---|---|---|
| 1 | Title | **SkillBridge AI**: first experience, matched by AI. Your name, college, date. | – |
| 2 | Hook | *"Every company wants experienced freshers. But how does a fresher get experience if nobody gives them a first chance?"* | Pause. Ask the room how many have been asked for "1–2 years of experience" for an entry-level role. |
| 3 | Problem (two-sided) | **Students:** degrees without real-world proof. **Small businesses:** can't afford agencies or full-time hires for small jobs. | Students have skills from courses but no verified work. A restaurant needing a ₹8k website has no good option: agencies cost 5–10×, and freelance sites are overwhelming. |
| 4 | Solution | Short, paid micro-projects (1–4 weeks) + AI matching + verified certificates. | Walk through the restaurant example in one sentence. |
| 5 | How it works | 4-step flow: Post in plain English → AI extracts skills → AI ranks students → Deliver, pay, certify. Screenshot strip. | Stress that the business never needs to know tech terms. |
| 6 | **Live demo** | "Let's see it." | Switch to the browser and follow `DEMO_SCRIPT.md` (≈3 min). |
| 7 | The AI behind it | Architecture diagram: Request → LLM extraction → Stage 1 rule score (formula) → Stage 2 LLM re-rank → final % (50/50) → fallback path. | Explain why it's hybrid: the rule score keeps it fair and explainable, the LLM adds judgment (bio, past work), and the fallback means it never fails. |
| 8 | Target customers | Students (college, 2nd–4th year) · Startups · SMEs & local businesses · (later) Colleges. | Primary early adopters are local businesses near campuses plus final-year students. |
| 9 | Market opportunity | ~4.3 crore students in Indian higher education† (AISHE 2021-22) · ~6 crore+ MSMEs† (Ministry of MSME) · growing freelance/gig economy†. | Keep it qualitative if the sources can't be verified in time. |
| 10 | Business model & revenue | Two-sided marketplace. **Platform fee** 10% of each completed Project (shown live in the demo) · **Employer subscription** for priority matching & unlimited posts (proposed ₹999/month) · **Premium student** profile boost & skill badges · **College partnerships**. | The fee aligns incentives: we earn only when a project completes. In the demo you saw ₹8,000 split into ₹7,200 to the student and ₹800 to the platform. |
| 11 | Why we're different | Comparison table: SkillBridge vs Internshala vs Upwork/Fiverr vs LinkedIn on: student-focused, short paid projects, AI skill matching, verified certificates, beginner-friendly. | Internshala lists internships (long, often unpaid) without project-level AI matching. Upwork and Fiverr are global and hard for first-timers to win. |
| 12 | Future scope + close | College partnerships (credit for projects) · Escrow payments · Skill tests to verify profiles · Mentor review · Mobile app. Close: *"We don't just find freshers jobs. We give them their first experience."* Thank you / Q&A. | – |

- [ ] **Step 1:** Write `docs/DECK_OUTLINE.md` with the table above.
- [ ] **Step 2:** Build the deck and insert the screenshots on slides 5 and 7. Draw the slide 7 diagram as simple boxes and arrows.
- [ ] **Step 3:** Verify or remove every † number.
- [ ] **Step 4:** Commit: `git add docs/DECK_OUTLINE.md && git commit -m "Add pitch deck outline"` (the .pptx itself can stay out of git).

---

### Task 12: Demo script, Q&A prep, rehearsal

**Files:**
- Create: `docs/DEMO_SCRIPT.md`

- [ ] **Step 1: Write `docs/DEMO_SCRIPT.md`**

```markdown
# Demo script (~3 minutes)

Before presenting: restart the backend (clean state), open the app, hit /api/health (llm_enabled: true),
close other tabs, zoom the browser to 125%.

1. Home (15s): "This is SkillBridge AI. 16 students and 5 local businesses are on the platform."
2. Post a project (45s): choose Spice Route Kitchen → "Use sample description" → read it aloud.
   "Notice: the owner never says React or HTML. They just describe their problem."
   Click Analyze with AI → point at the extracted skills, budget, duration and the "AI extracted" badge.
3. Matches (60s): Publish → "In two stages: a transparent skill score shortlists students, then the AI
   reads their full profiles and past work." Point at #1: match %, the reason, green skills, amber gaps.
   "Gaps are shown honestly, so the business knows exactly what it's getting."
4. Offer + accept (40s): Send offer to #1 → "Students aren't assigned; they choose." → Open Ananya's view →
   "This is what Ananya sees" → Accept.
5. Complete (25s): "Two weeks later the site is delivered" → 5 stars → Mark complete → point at the split:
   "₹7,200 to Ananya, ₹800 platform fee. That's our business model, live."
6. Certificate (30s): View certificate → "A certificate with a unique ID that anyone can check at this link."
   Click View portfolio → "It shows up as a Verified entry in her portfolio. That's real experience."

If the AI is slow or offline: the badges switch to "Keyword fallback / Rule-based ranking" and the flow still
works. Say: "The system is built to degrade gracefully. This is the deterministic fallback."
```

- [ ] **Step 2: Q&A prep.** Rehearse answers to these likely questions:
  1. **How does the AI matching actually work?** Use the two stages and the formula. Final = 50% rule + 50% LLM.
  2. **What if the AI makes things up?** The output is structured JSON validated against a schema, unknown student IDs are dropped, scores are blended with a deterministic score, and there's a fallback on any failure.
  3. **Why would a business trust a student?** Ratings, Certificate-backed portfolio entries and honestly shown skill gaps. Be upfront that skills are self-declared today, and that skill tests and escrow are future scope.
  3a. **What if the student is busy?** They decline the Offer, the Project reopens, and the business offers the next Match.
  3b. **Can a newcomer with no rating ever win?** Yes. Unrated students get a neutral 3/5 rating, not zero (point at Harsha's profile).
  3c. **What happens to certificates if the server restarts?** This prototype keeps data in memory. Production would use a database.
  4. **How do you make money?** Commission per completed project, plus subscriptions.
  5. **How is this different from Internshala/Fiverr?** Short paid projects, AI matching from plain English, beginner-friendly, verified portfolio.
  6. **Chicken-and-egg: how do you get the first users?** Start with campus clubs and local businesses near colleges, with college partnerships as the long-term channel.
  7. **What would you build next?** Login, escrow payments, skill assessments, a mobile app.
  8. **Tech stack?** FastAPI, React, Llama 3.3 70B via Groq, deployed with Docker.
- [ ] **Step 3: Rehearse the full talk twice with a timer.** Target 8–10 minutes including the demo. Cut speaker notes, not the demo.
- [ ] **Step 4: Commit:** `git add docs/DEMO_SCRIPT.md && git commit -m "Add demo script"`.

---

## Self-Review Notes

- **Spec coverage:** the problem, solution, customers, uniqueness, business model, revenue, market, future scope and hook from the brief all map to deck slides 2–12. AI matching is covered by Tasks 2–3, certificates and the verified portfolio by Tasks 4 and 8, the "students earn" value and the revenue model by Payout/Platform Fee (Tasks 4 and 7), student consent by the Offer flow (Tasks 4, 7 and 8), and the restaurant example is the B01 demo. The brief's "verified student profiles" is intentionally narrowed to Certificate-backed portfolio entries (Decision 4).
- **Deliberately not built:** auth, payments, chat, DB persistence. All are listed on slide 12 as future scope.
- **Type consistency checked:** `rank_candidates`, `rerank`, `extract_requirements`, `keyword_extract`, `Store.matches` tuple shape, and the API response shapes match their frontend consumers in `api.js`.
