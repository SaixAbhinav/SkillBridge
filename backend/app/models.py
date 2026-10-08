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
    rule_score: int  # 0-100, Stage 1 Skill Score
    match_percent: int  # 0-100, final Match Score (blended if AI-ranked)
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
