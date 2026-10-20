import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base, get_db
from backend.app.core.seed_data import init_db_seed
from backend.app.main import app

# Test database using SQLite
TEST_DATABASE_URL = "sqlite:///./test_agams.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    init_db_seed(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def get_auth_token(email: str = "gate.mgr@agams.airport"):
    res = client.post("/api/auth/login", json={"email": email, "password": "password123"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["application"] == "AGAMS"

def test_available_gates_lookup():
    # Looking for available gates between 14:00 and 16:00 on 2026-10-21
    res = client.get(
        "/api/gates/available",
        params={
            "start_time": "2026-10-21T14:00:00",
            "end_time": "2026-10-21T16:00:00"
        }
    )
    assert res.status_code == 200
    gates = res.json()
    gate_ids = [g["gate_id"] for g in gates]

    # Gate G14 should be available
    assert "G14" in gate_ids
    # Gate G03 (maintenance) must NOT be in available gates
    assert "G03" not in gate_ids
    # Gate G07 (closed) must NOT be in available gates
    assert "G07" not in gate_ids

def test_valid_allocation_succeeds():
    token = get_auth_token("gate.mgr@agams.airport")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "gate_id": "G14",
        "flight_id": "DL404",
        "assigned_time": "2026-10-21T14:00:00",
        "released_time": "2026-10-21T16:00:00"
    }
    res = client.post("/api/allocations", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["gate_id"] == "G14"
    assert data["flight_id"] == "DL404"
    assert data["allocation_number"] == 1
    assert data["composite_key"] == "G14_DL404_1"
    assert data["status"] == "Scheduled"

def test_conflicting_allocation_rejected():
    token = get_auth_token("gate.mgr@agams.airport")
    headers = {"Authorization": f"Bearer {token}"}

    # Try allocating flight AI202 to G14 from 15:00 to 17:00 (overlaps with DL404 14:00-16:00)
    conflict_payload = {
        "gate_id": "G14",
        "flight_id": "AI202",
        "assigned_time": "2026-10-21T15:00:00",
        "released_time": "2026-10-21T17:00:00"
    }
    res = client.post("/api/allocations", json=conflict_payload, headers=headers)
    assert res.status_code == 409
    assert "already allocated to Flight DL404" in res.json()["detail"]

def test_adjacent_allocations_accepted():
    token = get_auth_token("gate.mgr@agams.airport")
    headers = {"Authorization": f"Bearer {token}"}

    # Adjacent allocation: 16:00 to 18:00 immediately following 14:00-16:00
    adjacent_payload = {
        "gate_id": "G14",
        "flight_id": "EK901",
        "assigned_time": "2026-10-21T16:00:00",
        "released_time": "2026-10-21T18:00:00"
    }
    res = client.post("/api/allocations", json=adjacent_payload, headers=headers)
    assert res.status_code == 201

def test_different_gate_overlapping_interval_accepted():
    token = get_auth_token("gate.mgr@agams.airport")
    headers = {"Authorization": f"Bearer {token}"}

    # G12 at same time window (14:00 to 16:00)
    diff_gate_payload = {
        "gate_id": "G12",
        "flight_id": "AI202",
        "assigned_time": "2026-10-21T14:00:00",
        "released_time": "2026-10-21T16:00:00"
    }
    res = client.post("/api/allocations", json=diff_gate_payload, headers=headers)
    assert res.status_code == 201

def test_allocation_on_maintenance_gate_rejected():
    token = get_auth_token("gate.mgr@agams.airport")
    headers = {"Authorization": f"Bearer {token}"}

    # G03 is in Maintenance
    maint_payload = {
        "gate_id": "G03",
        "flight_id": "AI202",
        "assigned_time": "2026-10-21T16:00:00",
        "released_time": "2026-10-21T18:00:00"
    }
    res = client.post("/api/allocations", json=maint_payload, headers=headers)
    assert res.status_code == 400
    assert "Maintenance" in res.json()["detail"]

def test_allocation_on_closed_gate_rejected():
    token = get_auth_token("gate.mgr@agams.airport")
    headers = {"Authorization": f"Bearer {token}"}

    # G07 is Closed
    closed_payload = {
        "gate_id": "G07",
        "flight_id": "AI202",
        "assigned_time": "2026-10-21T16:00:00",
        "released_time": "2026-10-21T18:00:00"
    }
    res = client.post("/api/allocations", json=closed_payload, headers=headers)
    assert res.status_code == 400
    assert "Closed" in res.json()["detail"]

def test_invalid_time_window_rejected():
    token = get_auth_token("gate.mgr@agams.airport")
    headers = {"Authorization": f"Bearer {token}"}

    # Released time before assigned time
    invalid_payload = {
        "gate_id": "G08",
        "flight_id": "AI202",
        "assigned_time": "2026-10-21T16:00:00",
        "released_time": "2026-10-21T14:00:00"
    }
    res = client.post("/api/allocations", json=invalid_payload, headers=headers)
    assert res.status_code == 400

def test_edit_allocation_does_not_conflict_with_itself():
    token = get_auth_token("gate.mgr@agams.airport")
    headers = {"Authorization": f"Bearer {token}"}

    # Edit G14_DL404_1 to extend by 30 mins: 14:00 to 15:30
    edit_payload = {
        "assigned_time": "2026-10-21T14:00:00",
        "released_time": "2026-10-21T15:30:00"
    }
    res = client.put("/api/allocations/G14_DL404_1", json=edit_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "15:30" in data["released_time"]

def test_cancelled_allocation_unblocks_gate():
    token = get_auth_token("gate.mgr@agams.airport")
    headers = {"Authorization": f"Bearer {token}"}

    # Cancel G14_EK901_1 (16:00 to 18:00)
    del_res = client.delete("/api/allocations/G14_EK901_1", headers=headers)
    assert del_res.status_code == 200

    # Now allocating another flight over 16:00 to 18:00 on G14 should succeed
    new_res = client.post("/api/allocations", json={
        "gate_id": "G14",
        "flight_id": "AI202",
        "assigned_time": "2026-10-21T16:00:00",
        "released_time": "2026-10-21T18:00:00"
    }, headers=headers)
    assert new_res.status_code == 201

def test_rbac_flight_manager_cannot_allocate_gates():
    flight_token = get_auth_token("flight.mgr@agams.airport")
    headers = {"Authorization": f"Bearer {flight_token}"}

    res = client.post("/api/allocations", json={
        "gate_id": "G01",
        "flight_id": "DL404",
        "assigned_time": "2026-10-21T19:00:00",
        "released_time": "2026-10-21T20:00:00"
    }, headers=headers)
    assert res.status_code == 403
