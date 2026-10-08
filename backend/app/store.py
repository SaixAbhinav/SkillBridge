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
