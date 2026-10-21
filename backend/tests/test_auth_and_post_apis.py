import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.seed_data import init_db_seed
from app.main import app

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_successful_login_airport_head():
    res = client.post("/api/auth/login", json={
        "email": "head@agams.airport",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "Airport Head"
    assert data["email"] == "head@agams.airport"

def test_successful_login_gate_manager():
    res = client.post("/api/auth/login", json={
        "email": "gate.mgr@agams.airport",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "Gate Manager"

def test_successful_login_flight_manager():
    res = client.post("/api/auth/login", json={
        "email": "flight.mgr@agams.airport",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "Flight Manager"

def test_invalid_login_wrong_password():
    res = client.post("/api/auth/login", json={
        "email": "head@agams.airport",
        "password": "wrong_password_999"
    })
    assert res.status_code == 401
    assert "Incorrect email or password" in res.json()["detail"]

def test_invalid_login_unknown_email():
    res = client.post("/api/auth/login", json={
        "email": "nonexistent@agams.airport",
        "password": "password123"
    })
    assert res.status_code == 401
    assert "Incorrect email or password" in res.json()["detail"]

def test_missing_auth_token_returns_401():
    res = client.post("/api/allocations", json={
        "gate_id": "G01",
        "flight_id": "DL404",
        "assigned_time": "2026-10-21T12:00:00",
        "released_time": "2026-10-21T13:30:00"
    })
    assert res.status_code == 401

def test_invalid_auth_token_returns_401():
    res = client.post(
        "/api/allocations",
        json={
            "gate_id": "G01",
            "flight_id": "DL404",
            "assigned_time": "2026-10-21T12:00:00",
            "released_time": "2026-10-21T13:30:00"
        },
        headers={"Authorization": "Bearer invalid.jwt.token.string"}
    )
    assert res.status_code == 401

def test_unauthorized_role_forbidden():
    login_res = client.post("/api/auth/login", json={
        "email": "flight.mgr@agams.airport",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    res = client.post(
        "/api/allocations",
        json={
            "gate_id": "G01",
            "flight_id": "DL404",
            "assigned_time": "2026-10-21T12:00:00",
            "released_time": "2026-10-21T13:30:00"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403
    assert "Operation not permitted for role: Flight Manager" in res.json()["detail"]

def test_authorized_airport_head_creates_allocation():
    login_res = client.post("/api/auth/login", json={
        "email": "head@agams.airport",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    res = client.post(
        "/api/allocations",
        json={
            "gate_id": "G08",
            "flight_id": "DL404",
            "assigned_time": "2026-10-21T11:00:00",
            "released_time": "2026-10-21T12:30:00"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    data = res.json()
    assert data["gate_id"] == "G08"
    assert data["flight_id"] == "DL404"
    assert data["status"] == "Scheduled"

def test_authorized_gate_manager_creates_allocation():
    login_res = client.post("/api/auth/login", json={
        "email": "gate.mgr@agams.airport",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    res = client.post(
        "/api/allocations",
        json={
            "gate_id": "G09",
            "flight_id": "DL404",
            "assigned_time": "2026-10-21T11:00:00",
            "released_time": "2026-10-21T12:30:00"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    assert res.json()["gate_id"] == "G09"

def test_missing_required_fields_rejected():
    login_res = client.post("/api/auth/login", json={
        "email": "gate.mgr@agams.airport",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    # Missing flight_id
    res = client.post(
        "/api/allocations",
        json={
            "gate_id": "G01",
            "assigned_time": "2026-10-21T12:00:00",
            "released_time": "2026-10-21T13:30:00"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 422

def test_invalid_datetime_range_rejected():
    login_res = client.post("/api/auth/login", json={
        "email": "gate.mgr@agams.airport",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    res = client.post(
        "/api/allocations",
        json={
            "gate_id": "G01",
            "flight_id": "DL404",
            "assigned_time": "2026-10-21T14:00:00",
            "released_time": "2026-10-21T13:00:00"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    assert "Released time must be strictly after assigned time" in res.json()["detail"]

def test_gates_available_validation():
    # Valid query
    res = client.get("/api/gates/available", params={
        "start_time": "2026-10-21T10:00:00",
        "end_time": "2026-10-21T12:00:00"
    })
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # Inverted time range
    res_bad = client.get("/api/gates/available", params={
        "start_time": "2026-10-21T12:00:00",
        "end_time": "2026-10-21T10:00:00"
    })
    assert res_bad.status_code == 400
    assert "end_time must be strictly after start_time" in res_bad.json()["detail"]

    # Malformed timestamp
    res_malformed = client.get("/api/gates/available", params={
        "start_time": "invalid_date_format",
        "end_time": "2026-10-21T12:00:00"
    })
    assert res_malformed.status_code == 400
    assert "must be valid ISO 8601 timestamps" in res_malformed.json()["detail"]

def test_successful_creation_followed_by_get_persistence():
    login_res = client.post("/api/auth/login", json={
        "email": "head@agams.airport",
        "password": "password123"
    })
    token = login_res.json()["access_token"]

    # 1. Create Allocation
    create_res = client.post(
        "/api/allocations",
        json={
            "gate_id": "G13",
            "flight_id": "DL404",
            "assigned_time": "2026-10-21T06:00:00",
            "released_time": "2026-10-21T08:00:00"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert create_res.status_code == 201
    created_composite_key = create_res.json()["composite_key"]

    # 2. GET confirming persistence
    get_res = client.get("/api/allocations", params={"gate_id": "G13"})
    assert get_res.status_code == 200
    allocations = get_res.json()
    matching = [a for a in allocations if a["composite_key"] == created_composite_key]
    assert len(matching) == 1
    assert matching[0]["flight_id"] == "DL404"
    assert matching[0]["gate_id"] == "G13"

def test_maintenance_lifecycle():
    login_res = client.post("/api/auth/login", json={
        "email": "head@agams.airport",
        "password": "password123"
    })
    token = login_res.json()["access_token"]

    # 1. Schedule Maintenance on G17
    maint_res = client.post(
        "/api/maintenance",
        json={
            "gate_id": "G17",
            "description": "Boarding bridge safety inspection",
            "cost": 8500.0
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert maint_res.status_code == 201
    assert maint_res.json()["gate_status"] == "Maintenance"

    # Verify G17 is excluded from available gates
    avail_res = client.get("/api/gates/available", params={
        "start_time": "2026-10-21T06:00:00",
        "end_time": "2026-10-21T08:00:00"
    })
    avail_gate_ids = [g["gate_id"] for g in avail_res.json()]
    assert "G17" not in avail_gate_ids

    # 2. End Maintenance on G17
    end_res = client.post(
        "/api/maintenance/G17/end",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert end_res.status_code == 200
    assert end_res.json()["gate_status"] == "Available"
