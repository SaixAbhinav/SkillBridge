import json
import secrets
from datetime import date
from pathlib import Path

from .models import Business, Certificate, Match, Message, Project, Student
from .skills import normalize_skill

DATA_DIR = Path(__file__).parent / "data"


class Store:
    """In-memory state seeded from JSON. dump()/restore() let it be persisted between serverless calls."""

    def __init__(self, data_dir: Path = DATA_DIR):
        self.data_dir = data_dir
        self.reset()

    def reset(self) -> None:
        students = json.loads((self.data_dir / "students.json").read_text(encoding="utf-8"))
        businesses = json.loads((self.data_dir / "businesses.json").read_text(encoding="utf-8"))
        self.students: dict[str, Student] = {s["id"]: Student(**s) for s in students}
        self.businesses: dict[str, Business] = {b["id"]: Business(**b) for b in businesses}
        self.projects: dict[str, Project] = {}
        self.certificates: dict[str, Certificate] = {}
        self.matches: dict[str, tuple[list[Match], bool]] = {}
        self.messages: dict[str, list[Message]] = {}  # project id -> chat thread

    def dump(self) -> dict:
        """Everything that can change at runtime (businesses are static seed data)."""
        return {
            "students": {k: v.model_dump() for k, v in self.students.items()},
            "projects": {k: v.model_dump() for k, v in self.projects.items()},
            "certificates": {k: v.model_dump() for k, v in self.certificates.items()},
            "matches": {
                k: {"matches": [m.model_dump() for m in ranked], "ai_used": ai_used}
                for k, (ranked, ai_used) in self.matches.items()
            },
            "messages": {k: [m.model_dump() for m in thread] for k, thread in self.messages.items()},
        }

    def restore(self, state: dict) -> None:
        self.students = {k: Student(**v) for k, v in state["students"].items()}
        self.projects = {k: Project(**v) for k, v in state["projects"].items()}
        self.certificates = {k: Certificate(**v) for k, v in state["certificates"].items()}
        self.matches = {
            k: ([Match(**m) for m in v["matches"]], v["ai_used"]) for k, v in state["matches"].items()
        }
        # .get: state saved before chat existed has no "messages" key.
        self.messages = {k: [Message(**m) for m in v] for k, v in state.get("messages", {}).items()}

    def vocabulary(self) -> list[str]:
        return sorted({normalize_skill(k) for s in self.students.values() for k in s.skills})

    def new_project_id(self) -> str:
        return f"P{len(self.projects) + 1:03d}"

    def new_cert_id(self) -> str:
        return f"SB-{date.today().year}-{secrets.token_hex(3).upper()}"
