from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.auth.router import AuthenticatedUser, require_roles
from app.models.all_models import Gate, Terminal, GateAllocation, MaintenanceRecord, Flight

router = APIRouter(prefix="/gates", tags=["Gates"])

class GateCreate(BaseModel):
    gate_id: str
    terminal_id: str
    gate_type: str = "Passenger"  # 'Passenger', 'Cargo', 'Hybrid'
    capacity: int
    status: str = "Available"

class GateUpdate(BaseModel):
    terminal_id: Optional[str] = None
    gate_type: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None

class GateSummary(BaseModel):
    gate_id: str
    terminal_id: str
    terminal_name: Optional[str] = None
    gate_type: str
    capacity: int
    status: str
    current_flight: Optional[str] = None
    current_airline: Optional[str] = None
    latest_maintenance: Optional[str] = None

class GateDetail(GateSummary):
    upcoming_allocations: List[dict] = Field(default_factory=list)
    maintenance_history: List[dict] = Field(default_factory=list)

@router.get("", response_model=List[GateSummary])
def list_gates(
    terminal_id: Optional[str] = None,
    status: Optional[str] = None,
    gate_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Gate).join(Terminal, Gate.Terminal_ID == Terminal.Terminal_ID)

    if terminal_id:
        query = query.filter(Gate.Terminal_ID == terminal_id)
    if status:
        query = query.filter(Gate.Status == status)
    if gate_type:
        query = query.filter(Gate.Gate_Type == gate_type)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Gate.Gate_ID.ilike(s),
                Gate.Gate_Type.ilike(s),
                Terminal.Terminal_Name.ilike(s)
            )
        )

    gates = query.order_by(Gate.Gate_ID).all()
    now = datetime.utcnow()
    result = []

    for g in gates:
        # Check active allocation
        active_alloc = db.query(GateAllocation).join(Flight).filter(
            GateAllocation.Gate_ID == g.Gate_ID,
            GateAllocation.Allocation_Status.in_(["Active", "Scheduled"]),
            GateAllocation.Assigned_Time <= now,
            GateAllocation.Released_Time >= now
        ).first()

        # Check latest maintenance record
        latest_maint = db.query(MaintenanceRecord).filter(
            MaintenanceRecord.Gate_ID == g.Gate_ID
        ).order_by(MaintenanceRecord.Record_Number.desc()).first()

        result.append(GateSummary(
            gate_id=str(g.Gate_ID),
            terminal_id=str(g.Terminal_ID),
            terminal_name=g.terminal.Terminal_Name if g.terminal else None,
            gate_type=g.Gate_Type,
            capacity=g.Capacity,
            status=g.Status,
            current_flight=active_alloc.flight.Flight_ID if active_alloc and active_alloc.flight else None,
            current_airline=active_alloc.flight.airline.Airline_Name if active_alloc and active_alloc.flight and active_alloc.flight.airline else None,
            latest_maintenance=latest_maint.Description if latest_maint else None
        ))
    return result

@router.get("/available", response_model=List[GateSummary])
def get_available_gates(
    start_time: str = Query(..., description="ISO 8601 start of flight window (e.g. 2026-10-21T14:00:00)"),
    end_time: str = Query(..., description="ISO 8601 end of flight window (e.g. 2026-10-21T16:00:00)"),
    terminal_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        clean_start = start_time.replace("Z", "").strip()
        clean_end = end_time.replace("Z", "").strip()
        st = datetime.fromisoformat(clean_start)
        et = datetime.fromisoformat(clean_end)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="start_time and end_time must be valid ISO 8601 timestamps (e.g. '2026-10-21T14:00:00')."
        )

    if et <= st:
        raise HTTPException(status_code=400, detail="end_time must be strictly after start_time.")

    # Invariant: Maintenance and closed gates must not be allocated
    query = db.query(Gate).join(Terminal).filter(
        Gate.Status.notin_(["Maintenance", "Closed"])
    )

    if terminal_id:
        query = query.filter(Gate.Terminal_ID == terminal_id)

    candidates = query.all()
    available = []

    for g in candidates:
        # Check overlapping allocations: existing_start < new_end AND existing_end > new_start
        has_alloc = db.query(GateAllocation).filter(
            GateAllocation.Gate_ID == g.Gate_ID,
            GateAllocation.Allocation_Status.in_(["Scheduled", "Active"]),
            GateAllocation.Assigned_Time < end_time,
            GateAllocation.Released_Time > start_time
        ).first()
        if has_alloc:
            continue

        available.append(GateSummary(
            gate_id=str(g.Gate_ID),
            terminal_id=str(g.Terminal_ID),
            terminal_name=g.terminal.Terminal_Name if g.terminal else None,
            gate_type=g.Gate_Type,
            capacity=g.Capacity,
            status=g.Status
        ))

    available.sort(key=lambda x: x.capacity, reverse=True)
    return available

@router.get("/{gate_id}", response_model=GateDetail)
def get_gate_detail(gate_id: str, db: Session = Depends(get_db)):
    g = db.query(Gate).filter(Gate.Gate_ID == gate_id).first()
    if not g:
        raise HTTPException(status_code=404, detail=f"Gate {gate_id} not found")

    now = datetime.utcnow()
    # Upcoming allocations
    upcoming = db.query(GateAllocation).filter(
        GateAllocation.Gate_ID == gate_id,
        GateAllocation.Released_Time >= now,
        GateAllocation.Allocation_Status.in_(["Scheduled", "Active"])
    ).order_by(GateAllocation.Assigned_Time.asc()).all()

    # Maintenance history
    maint = db.query(MaintenanceRecord).filter(
        MaintenanceRecord.Gate_ID == gate_id
    ).order_by(MaintenanceRecord.Record_Number.desc()).all()

    return GateDetail(
        gate_id=str(g.Gate_ID),
        terminal_id=str(g.Terminal_ID),
        terminal_name=g.terminal.Terminal_Name if g.terminal else None,
        gate_type=g.Gate_Type,
        capacity=g.Capacity,
        status=g.Status,
        upcoming_allocations=[
            {
                "gate_id": str(a.Gate_ID),
                "flight_id": str(a.Flight_ID),
                "allocation_number": a.Allocation_Number,
                "composite_key": f"{a.Gate_ID}_{a.Flight_ID}_{a.Allocation_Number}",
                "airline": a.flight.airline.Airline_Name if a.flight and a.flight.airline else None,
                "assigned_time": a.Assigned_Time.isoformat(),
                "released_time": a.Released_Time.isoformat(),
                "status": a.Allocation_Status
            }
            for a in upcoming
        ],
        maintenance_history=[
            {
                "gate_id": str(m.Gate_ID),
                "record_number": m.Record_Number,
                "maintenance_date": m.Maintenance_Date.isoformat(),
                "description": m.Description,
                "cost": float(m.Cost)
            }
            for m in maint
        ]
    )

@router.post("", response_model=GateSummary, status_code=status.HTTP_201_CREATED)
def create_gate(
    payload: GateCreate,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Gate Manager"])),
    db: Session = Depends(get_db)
):
    # Validate referenced terminal
    terminal = db.query(Terminal).filter(Terminal.Terminal_ID == payload.terminal_id).first()
    if not terminal:
        raise HTTPException(status_code=400, detail=f"Referenced Terminal '{payload.terminal_id}' does not exist.")

    # Check duplicate Gate_ID
    existing = db.query(Gate).filter(Gate.Gate_ID == payload.gate_id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Gate '{payload.gate_id}' already exists.")

    new_gate = Gate(
        Gate_ID=str(payload.gate_id),
        Terminal_ID=str(payload.terminal_id),
        Gate_Type=payload.gate_type,
        Capacity=payload.capacity,
        Status=payload.status
    )
    db.add(new_gate)
    db.commit()
    db.refresh(new_gate)

    return GateSummary(
        gate_id=str(new_gate.Gate_ID),
        terminal_id=str(new_gate.Terminal_ID),
        terminal_name=terminal.Terminal_Name,
        gate_type=new_gate.Gate_Type,
        capacity=new_gate.Capacity,
        status=new_gate.Status
    )

@router.put("/{gate_id}", response_model=GateSummary)
def update_gate(
    gate_id: str,
    payload: GateUpdate,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Gate Manager"])),
    db: Session = Depends(get_db)
):
    gate = db.query(Gate).filter(Gate.Gate_ID == gate_id).first()
    if not gate:
        raise HTTPException(status_code=404, detail=f"Gate '{gate_id}' not found.")

    if payload.terminal_id:
        terminal = db.query(Terminal).filter(Terminal.Terminal_ID == payload.terminal_id).first()
        if not terminal:
            raise HTTPException(status_code=400, detail=f"Referenced Terminal '{payload.terminal_id}' does not exist.")
        gate.Terminal_ID = payload.terminal_id

    if payload.gate_type:
        gate.Gate_Type = payload.gate_type
    if payload.capacity is not None:
        gate.Capacity = payload.capacity
    if payload.status:
        gate.Status = payload.status

    db.commit()
    db.refresh(gate)

    return GateSummary(
        gate_id=str(gate.Gate_ID),
        terminal_id=str(gate.Terminal_ID),
        terminal_name=gate.terminal.Terminal_Name if gate.terminal else None,
        gate_type=gate.Gate_Type,
        capacity=gate.Capacity,
        status=gate.Status
    )

@router.delete("/{gate_id}", status_code=status.HTTP_200_OK)
def delete_gate(
    gate_id: str,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head"])),
    db: Session = Depends(get_db)
):
    gate = db.query(Gate).filter(Gate.Gate_ID == gate_id).first()
    if not gate:
        raise HTTPException(status_code=404, detail=f"Gate '{gate_id}' not found.")

    # Prevent unsafe deletion of gates with dependent allocations or maintenance records
    alloc_count = db.query(GateAllocation).filter(GateAllocation.Gate_ID == gate_id).count()
    if alloc_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete Gate '{gate_id}' because it has {alloc_count} dependent allocation records."
        )

    maint_count = db.query(MaintenanceRecord).filter(MaintenanceRecord.Gate_ID == gate_id).count()
    if maint_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete Gate '{gate_id}' because it has {maint_count} dependent maintenance records."
        )

    db.delete(gate)
    db.commit()
    return {"message": f"Gate '{gate_id}' deleted successfully."}
