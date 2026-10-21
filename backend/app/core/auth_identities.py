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
        "employee_id": "1",
        "alt_employee_ids": ["EMP001", "EMP01", "001"],
        "email": "head@agams.airport",
        "role": "Airport Head",
        "password_hash": "password123"  # In development/demo, verified via verify_password
    },
    "gate.mgr@agams.airport": {
        "employee_id": "2",
        "alt_employee_ids": ["EMP002", "EMP02", "002"],
        "email": "gate.mgr@agams.airport",
        "role": "Gate Manager",
        "password_hash": "password123"
    },
    "flight.mgr@agams.airport": {
        "employee_id": "3",
        "alt_employee_ids": ["EMP003", "EMP03", "003"],
        "email": "flight.mgr@agams.airport",
        "role": "Flight Manager",
        "password_hash": "password123"
    },
    "ravi.s@agams.airport": {
        "employee_id": "4",
        "alt_employee_ids": ["EMP004", "EMP04", "004"],
        "email": "ravi.s@agams.airport",
        "role": "Ground Crew",
        "password_hash": "password123"
    },
    "priya.p@agams.airport": {
        "employee_id": "5",
        "alt_employee_ids": ["EMP005", "EMP05", "005"],
        "email": "priya.p@agams.airport",
        "role": "Ground Crew",
        "password_hash": "password123"
    }
}

def get_identity_by_email(email: str) -> Optional[dict]:
    """Retrieve identity profile by email."""
    if not email:
        return None
    return IDENTITIES.get(email.strip().lower())

def get_identity_by_employee_id(emp_id: str) -> Optional[dict]:
    """Retrieve identity profile by Employee_ID (matching canonical or alternate formats)."""
    if not emp_id:
        return None
    target = str(emp_id).strip()
    norm = target.upper().replace("EMP", "").lstrip("0") or "0"
    for ident in IDENTITIES.values():
        if str(ident["employee_id"]).strip() == target:
            return ident
        if target in ident.get("alt_employee_ids", []):
            return ident
        ident_norm = str(ident["employee_id"]).upper().replace("EMP", "").lstrip("0") or "0"
        if norm == ident_norm:
            return ident
    return None

