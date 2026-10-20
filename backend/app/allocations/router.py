from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.auth.router import AuthenticatedUser, require_roles
from backend.app.models.all_models import (
    GateAllocation, Gate, Flight
)

router = APIRouter(prefix="/allocations", tags=["Gate Allocation"])

class AllocationCreate(BaseModel):
    gate_id: str
    flight_id: str
    allocation_number: Optional[int] = None
    assigned_time: datetime
    released_time: datetime

class AllocationUpdate(BaseModel):
    new_gate_id: Optional[str] = None
    assigned_time: Optional[datetime] = None
    released_time: Optional[datetime] = None
    status: Optional[str] = None  # 'Scheduled', 'Active', 'Completed', 'Cancelled'

class AllocationResponse(BaseModel):
    gate_id: str
    flight_id: str
    allocation_number: int
    composite_key: str
    terminal_name: str
    airline_name: str
    assigned_time: datetime
    released_time: datetime
    status: str

class TimelineGate(BaseModel):
    gate_id: str
    terminal_id: str
    terminal_name: str
    status: str
    allocations: List[dict]

def format_allocation_response(r: GateAllocation) -> AllocationResponse:
    return AllocationResponse(
        gate_id=str(r.Gate_ID),
        flight_id=str(r.Flight_ID),
        allocation_number=r.Allocation_Number,
        composite_key=f"{r.Gate_ID}_{r.Flight_ID}_{r.Allocation_Number}",
        terminal_name=r.gate.terminal.Terminal_Name if r.gate and r.gate.terminal else "Terminal",
        airline_name=r.flight.airline.Airline_Name if r.flight and r.flight.airline else "Airline",
        assigned_time=r.Assigned_Time,
        released_time=r.Released_Time,
        status=r.Allocation_Status
    )

def parse_composite_key(key: str):
    parts = key.split("_")
    if len(parts) >= 3:
        gate_id = parts[0]
        flight_id = parts[1]
        alloc_num = int(parts[2])
        return gate_id, flight_id, alloc_num
    raise HTTPException(
        status_code=400,
        detail=f"Invalid composite key format '{key}'. Expected format: 'GATE_FLIGHT_NUMBER' (e.g. 'G14_DL404_1')"
    )

@router.get("", response_model=List[AllocationResponse])
def list_allocations(
    status_filter: Optional[str] = Query(None, alias="status"),
    gate_id: Optional[str] = None,
    flight_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(GateAllocation).join(Gate).join(Flight)
    if status_filter:
        query = query.filter(GateAllocation.Allocation_Status == status_filter)
    if gate_id:
        query = query.filter(GateAllocation.Gate_ID == gate_id)
    if flight_id:
        query = query.filter(GateAllocation.Flight_ID == flight_id)

    records = query.order_by(GateAllocation.Assigned_Time.desc()).all()
    return [format_allocation_response(r) for r in records]

@router.get("/timeline", response_model=List[TimelineGate])
def get_timeline(
    date: Optional[str] = None,
    terminal_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    gates_query = db.query(Gate)
    if terminal_id:
        gates_query = gates_query.filter(Gate.Terminal_ID == terminal_id)
    gates = gates_query.order_by(Gate.Terminal_ID, Gate.Gate_ID).all()

    timeline = []
    for g in gates:
        alloc_query = db.query(GateAllocation).filter(
            GateAllocation.Gate_ID == g.Gate_ID,
            GateAllocation.Allocation_Status != "Cancelled"
        )
        if date:
            start_day = datetime.fromisoformat(f"{date}T00:00:00")
            end_day = datetime.fromisoformat(f"{date}T23:59:59")
            alloc_query = alloc_query.filter(
                GateAllocation.Assigned_Time <= end_day,
                GateAllocation.Released_Time >= start_day
            )

        allocs = alloc_query.all()
        timeline.append(TimelineGate(
            gate_id=g.Gate_ID,
            terminal_id=g.Terminal_ID,
            terminal_name=g.terminal.Terminal_Name if g.terminal else "Terminal",
            status=g.Status,
            allocations=[
                {
                    "gate_id": a.Gate_ID,
                    "flight_id": a.Flight_ID,
                    "allocation_number": a.Allocation_Number,
                    "composite_key": f"{a.Gate_ID}_{a.Flight_ID}_{a.Allocation_Number}",
                    "airline": a.flight.airline.Airline_Name if a.flight and a.flight.airline else "",
                    "assigned_time": a.Assigned_Time.isoformat(),
                    "released_time": a.Released_Time.isoformat(),
                    "status": a.Allocation_Status
                }
                for a in allocs
            ]
        ))
    return timeline

@router.post("", response_model=AllocationResponse, status_code=status.HTTP_201_CREATED)
def create_allocation(
    payload: AllocationCreate,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Gate Manager"])),
    db: Session = Depends(get_db)
):
    # 1. Validate Time Window
    if payload.released_time <= payload.assigned_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Released time must be strictly after assigned time."
        )

    # 2. Validate Gate Existence
    gate = db.query(Gate).filter(Gate.Gate_ID == payload.gate_id).first()
    if not gate:
        raise HTTPException(status_code=404, detail=f"Gate '{payload.gate_id}' not found.")

    # 3. Validate Flight Existence
    flight = db.query(Flight).filter(Flight.Flight_ID == payload.flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail=f"Flight '{payload.flight_id}' not found.")

    # 4. Check Gate Base Status: Maintenance and closed gates must not be allocated
    if gate.Status in ["Maintenance", "Closed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gate {gate.Gate_ID} cannot be allocated because it is currently '{gate.Status}'."
        )

    # 5. Check Overlapping Allocations on the target gate (Conflict detection invariant)
    overlap = db.query(GateAllocation).filter(
        GateAllocation.Gate_ID == payload.gate_id,
        GateAllocation.Allocation_Status.in_(["Scheduled", "Active"]),
        GateAllocation.Assigned_Time < payload.released_time,
        GateAllocation.Released_Time > payload.assigned_time
    ).first()

    if overlap:
        assigned_str = overlap.Assigned_Time.strftime("%H:%M")
        released_str = overlap.Released_Time.strftime("%H:%M")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Gate {payload.gate_id} is already allocated to Flight {overlap.Flight_ID} from {assigned_str} to {released_str}."
        )

    # 6. Determine Allocation Number (partial key in composite PK)
    if payload.allocation_number is not None:
        alloc_num = payload.allocation_number
    else:
        max_num = db.query(func.max(GateAllocation.Allocation_Number)).filter(
            GateAllocation.Gate_ID == payload.gate_id,
            GateAllocation.Flight_ID == payload.flight_id
        ).scalar()
        alloc_num = (max_num or 0) + 1

    # 7. Create New Allocation Transactionally
    new_allocation = GateAllocation(
        Gate_ID=payload.gate_id,
        Flight_ID=payload.flight_id,
        Allocation_Number=alloc_num,
        Assigned_Time=payload.assigned_time,
        Released_Time=payload.released_time,
        Allocation_Status="Scheduled"
    )
    db.add(new_allocation)

    # Update Gate status to Reserved if it was Available
    if gate.Status == "Available":
        gate.Status = "Reserved"

    db.commit()
    db.refresh(new_allocation)

    return format_allocation_response(new_allocation)

@router.put("/{key:path}", response_model=AllocationResponse)
def edit_allocation(
    key: str,
    payload: AllocationUpdate,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Gate Manager"])),
    db: Session = Depends(get_db)
):
    # Support composite key as "G14/DL404/1" or "G14_DL404_1"
    key_clean = key.strip("/").replace("/", "_")
    gate_id, flight_id, alloc_num = parse_composite_key(key_clean)

    alloc = db.query(GateAllocation).filter(
        GateAllocation.Gate_ID == gate_id,
        GateAllocation.Flight_ID == flight_id,
        GateAllocation.Allocation_Number == alloc_num
    ).first()

    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found.")

    target_gate_id = payload.new_gate_id or alloc.Gate_ID
    target_assigned = payload.assigned_time or alloc.Assigned_Time
    target_released = payload.released_time or alloc.Released_Time

    if target_released <= target_assigned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Released time must be strictly after assigned time."
        )

    target_gate = db.query(Gate).filter(Gate.Gate_ID == target_gate_id).first()
    if not target_gate:
        raise HTTPException(status_code=404, detail=f"Target gate '{target_gate_id}' not found.")

    if target_gate.Status in ["Maintenance", "Closed"] and target_gate_id != alloc.Gate_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gate {target_gate_id} cannot be allocated because it is currently '{target_gate.Status}'."
        )

    # Exclude the allocation being edited from its own overlap check
    overlap_query = db.query(GateAllocation).filter(
        GateAllocation.Gate_ID == target_gate_id,
        GateAllocation.Allocation_Status.in_(["Scheduled", "Active"]),
        GateAllocation.Assigned_Time < target_released,
        GateAllocation.Released_Time > target_assigned
    )
    # Exclude current record
    overlap_query = overlap_query.filter(
        ~((GateAllocation.Gate_ID == gate_id) &
          (GateAllocation.Flight_ID == flight_id) &
          (GateAllocation.Allocation_Number == alloc_num))
    )
    overlap = overlap_query.first()
    if overlap:
        assigned_str = overlap.Assigned_Time.strftime("%H:%M")
        released_str = overlap.Released_Time.strftime("%H:%M")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Gate {target_gate_id} is already allocated to Flight {overlap.Flight_ID} from {assigned_str} to {released_str}."
        )

    # Apply changes
    alloc.Gate_ID = target_gate_id
    alloc.Assigned_Time = target_assigned
    alloc.Released_Time = target_released
    if payload.status:
        alloc.Allocation_Status = payload.status

    db.commit()
    db.refresh(alloc)
    return format_allocation_response(alloc)

@router.delete("/{key:path}", status_code=status.HTTP_200_OK)
def cancel_allocation(
    key: str,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Gate Manager"])),
    db: Session = Depends(get_db)
):
    key_clean = key.strip("/").replace("/", "_")
    gate_id, flight_id, alloc_num = parse_composite_key(key_clean)

    alloc = db.query(GateAllocation).filter(
        GateAllocation.Gate_ID == gate_id,
        GateAllocation.Flight_ID == flight_id,
        GateAllocation.Allocation_Number == alloc_num
    ).first()

    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found.")

    alloc.Allocation_Status = "Cancelled"

    # Revert gate status to Available only if no other active turns exist and not Maintenance/Closed
    other_alloc = db.query(GateAllocation).filter(
        GateAllocation.Gate_ID == alloc.Gate_ID,
        GateAllocation.Allocation_Status.in_(["Scheduled", "Active"]),
        ~((GateAllocation.Gate_ID == gate_id) &
          (GateAllocation.Flight_ID == flight_id) &
          (GateAllocation.Allocation_Number == alloc_num))
    ).first()

    if not other_alloc and alloc.gate.Status in ["Reserved", "Occupied"]:
        alloc.gate.Status = "Available"

    db.commit()
    return {"message": f"Allocation {key_clean} cancelled successfully."}
