"""
AGAMS Authentication Identity Store.

Per Section 7 of AGENTS.md:
Authentication credentials, password hashes, and user roles are maintained in a secure
configuration-backed identity store that references canonical Employee IDs (EMP001, etc.),
without modifying the locked 16-table relational schema.
"""
from typing import Dict, Optional

# Canonical identity mapping: references Employee_ID in Employee table
# Roles supported: "Airport Head", "Gate Manager", "Flight Manager", "Ground Crew"
IDENTITIES: Dict[str, dict] = {
    "head@agams.airport": {
        "employee_id": "EMP001",
        "email": "head@agams.airport",
        "role": "Airport Head",
        "password_hash": "password123"  # In development/demo, verified via verify_password
    },
    "gate.mgr@agams.airport": {
        "employee_id": "EMP002",
        "email": "gate.mgr@agams.airport",
        "role": "Gate Manager",
        "password_hash": "password123"
    },
    "flight.mgr@agams.airport": {
        "employee_id": "EMP003",
        "email": "flight.mgr@agams.airport",
        "role": "Flight Manager",
        "password_hash": "password123"
    },
    "ravi.s@agams.airport": {
        "employee_id": "EMP004",
        "email": "ravi.s@agams.airport",
        "role": "Ground Crew",
        "password_hash": "password123"
    },
    "priya.p@agams.airport": {
        "employee_id": "EMP005",
        "email": "priya.p@agams.airport",
        "role": "Ground Crew",
        "password_hash": "password123"
    }
}

def get_identity_by_email(email: str) -> Optional[dict]:
    """Retrieve identity profile by email."""
    return IDENTITIES.get(email.strip().lower())

def get_identity_by_employee_id(emp_id: str) -> Optional[dict]:
    """Retrieve identity profile by Employee_ID."""
    for ident in IDENTITIES.values():
        if ident["employee_id"] == emp_id:
            return ident
    return None
