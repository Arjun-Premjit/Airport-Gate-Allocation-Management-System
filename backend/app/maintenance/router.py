from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.auth.router import AuthenticatedUser, require_roles
from backend.app.models.all_models import MaintenanceRecord, Gate

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

class MaintenanceCreate(BaseModel):
    gate_id: str
    maintenance_date: Optional[datetime] = None
    description: str
    cost: float = 0.0

class MaintenanceResponse(BaseModel):
    gate_id: str
    record_number: int
    terminal_name: str
    maintenance_date: datetime
    description: str
    cost: float
    gate_status: str

@router.get("", response_model=List[MaintenanceResponse])
def list_maintenance(
    gate_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MaintenanceRecord).join(Gate)
    if gate_id:
        query = query.filter(MaintenanceRecord.Gate_ID == gate_id)

    records = query.order_by(MaintenanceRecord.Maintenance_Date.desc(), MaintenanceRecord.Record_Number.desc()).all()
    return [
        MaintenanceResponse(
            gate_id=str(r.Gate_ID),
            record_number=r.Record_Number,
            terminal_name=r.gate.terminal.Terminal_Name if r.gate and r.gate.terminal else "",
            maintenance_date=r.Maintenance_Date,
            description=r.Description,
            cost=float(r.Cost),
            gate_status=r.gate.Status
        )
        for r in records
    ]

@router.post("", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def schedule_maintenance(
    payload: MaintenanceCreate,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Gate Manager"])),
    db: Session = Depends(get_db)
):
    gate = db.query(Gate).filter(Gate.Gate_ID == payload.gate_id).first()
    if not gate:
        raise HTTPException(status_code=404, detail="Gate not found.")

    max_num = db.query(func.max(MaintenanceRecord.Record_Number)).filter(
        MaintenanceRecord.Gate_ID == payload.gate_id
    ).scalar()
    record_num = (max_num or 0) + 1

    maint_date = payload.maintenance_date or datetime.utcnow()

    new_record = MaintenanceRecord(
        Gate_ID=payload.gate_id,
        Record_Number=record_num,
        Maintenance_Date=maint_date,
        Description=payload.description,
        Cost=payload.cost
    )
    db.add(new_record)

    # Per AGENTS.md Section 9: Maintenance action changes Gate.Status to Maintenance
    gate.Status = "Maintenance"
    db.commit()
    db.refresh(new_record)

    return MaintenanceResponse(
        gate_id=new_record.Gate_ID,
        record_number=new_record.Record_Number,
        terminal_name=gate.terminal.Terminal_Name if gate.terminal else "",
        maintenance_date=new_record.Maintenance_Date,
        description=new_record.Description,
        cost=float(new_record.Cost),
        gate_status=gate.Status
    )

@router.post("/{gate_id}/end", response_model=MaintenanceResponse)
def end_gate_maintenance(
    gate_id: str,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Gate Manager"])),
    db: Session = Depends(get_db)
):
    gate = db.query(Gate).filter(Gate.Gate_ID == gate_id).first()
    if not gate:
        raise HTTPException(status_code=404, detail="Gate not found.")

    latest_record = db.query(MaintenanceRecord).filter(
        MaintenanceRecord.Gate_ID == gate_id
    ).order_by(MaintenanceRecord.Record_Number.desc()).first()

    # Per AGENTS.md Section 9: Ending maintenance restores an appropriate status after validation
    gate.Status = "Available"
    db.commit()

    return MaintenanceResponse(
        gate_id=gate.Gate_ID,
        record_number=latest_record.Record_Number if latest_record else 1,
        terminal_name=gate.terminal.Terminal_Name if gate.terminal else "",
        maintenance_date=latest_record.Maintenance_Date if latest_record else datetime.utcnow(),
        description=latest_record.Description if latest_record else "Maintenance completed",
        cost=float(latest_record.Cost) if latest_record else 0.0,
        gate_status=gate.Status
    )
