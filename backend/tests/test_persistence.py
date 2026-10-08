import pytest
from fastapi.testclient import TestClient

from app import persistence
from app.main import create_app

RESTAURANT = (
    "I run a small restaurant in Hyderabad called Spice Route Kitchen. We need a website "
    "with our menu, photos and WhatsApp ordering. Budget ₹8,000, needs to be done in 2 weeks."
)


@pytest.fixture
def fake_redis(monkeypatch):
    """Replaces Upstash with a dict, so two app instances can share state like Vercel instances do."""
    db = {}
    monkeypatch.setattr(persistence, "is_enabled", lambda: True)
    monkeypatch.setattr(persistence, "load", lambda: db.get("state"))
    monkeypatch.setattr(persistence, "save", lambda state: db.__setitem__("state", state))
    return db


def post_project(client):
    req = client.post("/api/projects/extract", json={"description": RESTAURANT}).json()["requirements"]
    return client.post("/api/projects", json={**req, "business_id": "B01", "description": RESTAURANT}).json()


def test_store_dump_restore_roundtrip(store):
    client = TestClient(create_app(store))
    project = post_project(client)
    client.get(f"/api/projects/{project['id']}/matches")
    client.post(f"/api/projects/{project['id']}/offer", json={"student_id": "S01"})
    client.post(f"/api/projects/{project['id']}/accept", json={"student_id": "S01"})
    client.post(f"/api/projects/{project['id']}/messages", json={"sender": "business", "text": "Welcome!"})

    copy = type(store)()
    copy.restore(store.dump())
    assert copy.dump() == store.dump()


def test_state_is_shared_across_instances(fake_redis):
    first, second = TestClient(create_app()), TestClient(create_app())
    project = post_project(first)
    first.post(f"/api/projects/{project['id']}/offer", json={"student_id": "S01"})

    detail = second.get(f"/api/projects/{project['id']}")
    assert detail.status_code == 200
    assert detail.json()["project"]["status"] == "offered"
    assert [o["project"]["id"] for o in second.get("/api/students/S01/projects").json()["offers"]] == [project["id"]]


def test_reads_do_not_write(fake_redis):
    client = TestClient(create_app())
    post_project(client)
    saved = fake_redis["state"]
    client.get("/api/students")
    assert fake_redis["state"] is saved


def test_reset_restores_seed_data(fake_redis):
    first, second = TestClient(create_app()), TestClient(create_app())
    post_project(first)
    assert first.post("/api/reset").status_code == 200
    assert second.get("/api/stats").json()["projects_posted"] == 0
