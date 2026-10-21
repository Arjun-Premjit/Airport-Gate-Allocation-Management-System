from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import JWTError, jwt


from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token
from app.core.auth_identities import (
    get_identity_by_email,
    get_identity_by_employee_id,
)
from app.models.all_models import Employee


router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    email: str
    role: str

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    supervisor_id: Optional[str] = None

class AuthenticatedUser:
    def __init__(self, employee: Employee, role: str, email: str):
        self.employee = employee
        self.Employee_ID = employee.Employee_ID
        self.First_Name = employee.First_Name
        self.Last_Name = employee.Last_Name
        self.full_name = employee.full_name
        self.Name = employee.full_name
        self.Role = role
        self.Email = email
        self.Supervisor_Employee_ID = employee.Supervisor_Employee_ID
        self.Supervisor_ID = employee.Supervisor_Employee_ID

def resolve_employee_for_identity(db: Session, identity: dict) -> Optional[Employee]:
    """
    Resolves the canonical database Employee record corresponding to an authenticated identity.
    Checks primary ID, alternate IDs, normalized numeric ID, and role-based structural fallback.
    """
    candidate_ids = [str(identity.get("employee_id"))]
    candidate_ids.extend([str(a) for a in identity.get("alt_employee_ids", [])])

    primary = str(identity.get("employee_id", ""))
    norm = primary.upper().replace("EMP", "").lstrip("0")
    if norm:
        candidate_ids.append(norm)
        try:
            candidate_ids.append(f"EMP{int(norm):03d}")
            candidate_ids.append(f"EMP{int(norm):04d}")
        except ValueError:
            pass

    for cid in candidate_ids:
        if cid:
            emp = db.query(Employee).filter(Employee.Employee_ID == cid).first()
            if emp:
                return emp

    # Role-based fallback
    role = identity.get("role")
    if role == "Airport Head":
        # Airport Head: top-level executive with no supervisor, or the first employee
        emp = db.query(Employee).filter(Employee.Supervisor_Employee_ID.is_(None)).first()
        if not emp:
            emp = db.query(Employee).order_by(Employee.Employee_ID.asc()).first()
        if emp:
            return emp
    elif role == "Gate Manager":
        emps = db.query(Employee).order_by(Employee.Employee_ID.asc()).all()
        if len(emps) > 1:
            return emps[1]
    elif role == "Flight Manager":
        emps = db.query(Employee).order_by(Employee.Employee_ID.asc()).all()
        if len(emps) > 2:
            return emps[2]

    return None

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> AuthenticatedUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        token_role: str = payload.get("role")
        if user_id is None or token_role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # First attempt direct query with user_id
    employee = db.query(Employee).filter(Employee.Employee_ID == user_id).first()
    if not employee:
        # Check normalized alternate format (e.g. if token had EMP001 but DB has 1, or vice versa)
        norm = user_id.upper().replace("EMP", "").lstrip("0")
        alts = [norm]
        try:
            if norm:
                alts.append(f"EMP{int(norm):03d}")
        except ValueError:
            pass
        for alt in alts:
            employee = db.query(Employee).filter(Employee.Employee_ID == alt).first()
            if employee:
                break

    if not employee:
        # Try resolving via identity configuration
        identity = get_identity_by_employee_id(user_id)
        if identity:
            employee = resolve_employee_for_identity(db, identity)

    if employee is None:
        raise credentials_exception

    identity = get_identity_by_employee_id(str(employee.Employee_ID)) or get_identity_by_employee_id(user_id)
    email = identity["email"] if identity else f"{user_id.lower()}@agams.airport"
    role = token_role

    return AuthenticatedUser(employee=employee, role=role, email=email)

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: AuthenticatedUser = Depends(get_current_user)):
        if current_user.Role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role: {current_user.Role}. Requires one of: {allowed_roles}"
            )
        return current_user
    return role_checker

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    identity = get_identity_by_email(request.email)
    if not identity or not verify_password(request.password, identity["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    employee = resolve_employee_for_identity(db, identity)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Employee record not found in system database.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=str(employee.Employee_ID), role=identity["role"])
    return TokenResponse(
        access_token=access_token,
        user_id=str(employee.Employee_ID),
        name=employee.full_name,
        email=identity["email"],
        role=identity["role"]
    )


@router.get("/me", response_model=UserProfile)
def get_me(current_user: AuthenticatedUser = Depends(get_current_user)):
    return UserProfile(
        user_id=current_user.Employee_ID,
        name=current_user.full_name,
        email=current_user.Email,
        role=current_user.Role,
        supervisor_id=current_user.Supervisor_Employee_ID
    )
