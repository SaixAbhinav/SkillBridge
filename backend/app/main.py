import json
from datetime import date, datetime
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from . import ai, llm, persistence
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

    @app.middleware("http")
    async def sync_state(request: Request, call_next):
        # Serverless instances don't share memory: load the shared state before each API call
        # and save it afterwards, but only if the call changed something.
        if not persistence.is_enabled() or not request.url.path.startswith("/api/"):
            return await call_next(request)
        saved = await run_in_threadpool(persistence.load)
        if saved:
            store.restore(saved)
        else:
            store.reset()
        before = json.dumps(store.dump(), sort_keys=True)
        response = await call_next(request)
        after = store.dump()
        if json.dumps(after, sort_keys=True) != before or saved is None:
            await run_in_threadpool(persistence.save, after)
        return response

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

    @app.get("/api/students/{student_id}/projects")
    def student_projects(student_id: str):
        get_or_404(store.students, student_id, "Student")

        def with_business(p: Project) -> dict:
            return {"project": p, "business": store.businesses[p.business_id]}

        newest = sorted(store.projects.values(), key=lambda p: p.created_at, reverse=True)
        return {
            "offers": [with_business(p) for p in newest if p.status == "offered" and p.offered_student_id == student_id],
            "active": [with_business(p) for p in newest if p.status == "assigned" and p.assigned_student_id == student_id],
            "completed": [with_business(p) for p in newest if p.status == "completed" and p.assigned_student_id == student_id],
        }

    @app.get("/api/businesses")
    def list_businesses():
        return list(store.businesses.values())

    @app.get("/api/businesses/{business_id}/projects")
    def business_projects(business_id: str):
        get_or_404(store.businesses, business_id, "Business")
        mine = [p for p in store.projects.values() if p.business_id == business_id]
        return sorted(mine, key=lambda p: p.created_at, reverse=True)

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

    @app.post("/api/reset")
    def reset():
        store.reset()
        return {"ok": True}

    # Production: serve the built React app; navigation misses fall back to index.html (client-side routing).
    if DIST_DIR.exists():
        app.frontend("/", directory=DIST_DIR, fallback="index.html")

    return app


app = create_app()
