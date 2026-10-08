# SkillBridge AI

AI-powered micro-internship platform connecting college students with startups and local businesses for short, paid, real-world projects.

**Demo flow:** a business describes a project in plain English → AI extracts the required skills → students are ranked with a Match Score, a reason and skill gaps → the business sends an offer → the student accepts → completion releases the payout (minus a 10% platform fee) → the student receives a verifiable certificate on their portfolio.

## How matching works

1. **Requirement extraction:** an LLM turns the plain-English request into structured requirements (skills, budget, duration). Fallback: keyword and regex extraction.
2. **Stage 1, Skill Score:** `0.60·skill + 0.15·rating + 0.15·experience + 0.10·availability`, where skill overlap is weighted by proficiency level (1–5). Unrated students get a neutral 3/5 rating. This shortlists the top 8.
3. **Stage 2, LLM re-rank:** the LLM reads the full profiles (bio, past projects) and returns a fit score, a reason and gaps. Final Match Score = 50% Skill Score + 50% LLM fit.
4. Every LLM step validates its JSON output and falls back to the deterministic result on any failure, so the app works even with no API key.

Domain terms are defined in [CONTEXT.md](CONTEXT.md).

## Run locally

Requirements: [uv](https://docs.astral.sh/uv/), Node 20+.

```bash
cp .env.example .env        # add your LLM_API_KEY (Groq or Gemini)
cd backend && uv sync && uv run uvicorn app.main:app --reload --port 8000
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Tests: `cd backend && uv run pytest`

State is in-memory and resets on every backend restart, so each demo starts clean.

## Stack

FastAPI · Pydantic · React + Vite · Groq (Llama 3.3 70B) via an OpenAI-compatible API
