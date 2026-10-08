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
    inbox = client.get("/api/students/S01/projects").json()["offers"]
    assert [o["project"]["id"] for o in inbox] == [project["id"]]
    assert inbox[0]["business"]["name"] == "Spice Route Kitchen"

    accepted = client.post(f"/api/projects/{project['id']}/accept", json={"student_id": "S01"})
    assert accepted.json()["status"] == "assigned"
    assert accepted.json()["assigned_student_id"] == "S01"
    assert client.get("/api/students/S01/projects").json()["offers"] == []

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


def test_business_projects_lists_only_that_business(client):
    project = post_restaurant_project(client)
    assert [p["id"] for p in client.get("/api/businesses/B01/projects").json()] == [project["id"]]
    assert client.get("/api/businesses/B02/projects").json() == []
    assert client.get("/api/businesses/B99/projects").status_code == 404


def test_student_projects_grouped_by_stage(client):
    pid = post_restaurant_project(client)["id"]
    client.post(f"/api/projects/{pid}/offer", json={"student_id": "S01"})
    stages = client.get("/api/students/S01/projects").json()
    assert [o["project"]["id"] for o in stages["offers"]] == [pid]
    assert stages["offers"][0]["business"]["name"] == "Spice Route Kitchen"
    assert stages["active"] == [] and stages["completed"] == []

    client.post(f"/api/projects/{pid}/accept", json={"student_id": "S01"})
    stages = client.get("/api/students/S01/projects").json()
    assert stages["offers"] == [] and [a["project"]["id"] for a in stages["active"]] == [pid]

    client.post(f"/api/projects/{pid}/complete", json={"rating": 5})
    stages = client.get("/api/students/S01/projects").json()
    assert stages["active"] == [] and [c["project"]["id"] for c in stages["completed"]] == [pid]
    assert client.get("/api/students/S99/projects").status_code == 404


def test_chat_opens_once_student_accepts(client):
    pid = post_restaurant_project(client)["id"]
    hello = {"sender": "business", "text": "Hi Ananya, welcome aboard!"}
    assert client.post(f"/api/projects/{pid}/messages", json=hello).status_code == 409

    client.post(f"/api/projects/{pid}/offer", json={"student_id": "S01"})
    assert client.post(f"/api/projects/{pid}/messages", json=hello).status_code == 409

    client.post(f"/api/projects/{pid}/accept", json={"student_id": "S01"})
    assert client.post(f"/api/projects/{pid}/messages", json=hello).status_code == 201
    reply = client.post(f"/api/projects/{pid}/messages", json={"sender": "student", "text": "  Thanks! Starting today.  "})
    assert reply.json()["text"] == "Thanks! Starting today."

    thread = client.get(f"/api/projects/{pid}/messages").json()
    assert [(m["sender"], m["text"]) for m in thread] == [
        ("business", "Hi Ananya, welcome aboard!"),
        ("student", "Thanks! Starting today."),
    ]


def test_chat_rejects_blank_and_closes_after_completion(client):
    pid = post_restaurant_project(client)["id"]
    client.post(f"/api/projects/{pid}/offer", json={"student_id": "S01"})
    client.post(f"/api/projects/{pid}/accept", json={"student_id": "S01"})
    assert client.post(f"/api/projects/{pid}/messages", json={"sender": "student", "text": "   "}).status_code == 422
    assert client.post(f"/api/projects/{pid}/messages", json={"sender": "admin", "text": "hi"}).status_code == 422

    client.post(f"/api/projects/{pid}/messages", json={"sender": "student", "text": "Done, site is live."})
    client.post(f"/api/projects/{pid}/complete", json={"rating": 5})
    assert client.post(f"/api/projects/{pid}/messages", json={"sender": "business", "text": "Thanks"}).status_code == 409
    assert len(client.get(f"/api/projects/{pid}/messages").json()) == 1
