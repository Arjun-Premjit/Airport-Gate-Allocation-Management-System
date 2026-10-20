from datetime import datetime
from typing import Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.models.all_models import Gate, Flight, GateAllocation, Terminal

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
def get_dashboard_summary(db: Session = Depends(get_db)):
    # 1. Gate counts by status
    gate_counts = {
        "Total": db.query(Gate).count(),
        "Available": db.query(Gate).filter(Gate.Status == "Available").count(),
        "Occupied": db.query(Gate).filter(Gate.Status == "Occupied").count(),
        "Reserved": db.query(Gate).filter(Gate.Status == "Reserved").count(),
        "Maintenance": db.query(Gate).filter(Gate.Status == "Maintenance").count(),
        "Closed": db.query(Gate).filter(Gate.Status == "Closed").count(),
    }

    # 2. Flight metrics
    total_flights = db.query(Flight).count()

    # 3. Allocation metrics
    now = datetime.utcnow()
    upcoming_allocations = db.query(GateAllocation).filter(
        GateAllocation.Allocation_Status.in_(["Scheduled", "Active"]),
        GateAllocation.Released_Time >= now
    ).count()

    # 4. Recent / Upcoming allocations table
    recent_allocs = db.query(GateAllocation).join(Gate).join(Flight).filter(
        GateAllocation.Allocation_Status.in_(["Scheduled", "Active"])
    ).order_by(GateAllocation.Assigned_Time.asc()).limit(8).all()

    allocations_data = [
        {
            "gate_id": a.Gate_ID,
            "flight_id": a.Flight_ID,
            "allocation_number": a.Allocation_Number,
            "composite_key": f"{a.Gate_ID}_{a.Flight_ID}_{a.Allocation_Number}",
            "airline": a.flight.airline.Airline_Name if a.flight and a.flight.airline else "",
            "terminal_name": a.gate.terminal.Terminal_Name if a.gate and a.gate.terminal else "",
            "time_window": f"{a.Assigned_Time.strftime('%H:%M')} – {a.Released_Time.strftime('%H:%M')}",
            "status": a.Allocation_Status
        }
        for a in recent_allocs
    ]

    return {
        "gate_counts": gate_counts,
        "total_flights": total_flights,
        "upcoming_allocations_count": upcoming_allocations,
        "upcoming_allocations": allocations_data
    }

@router.get("/utilization")
def get_gate_utilization(db: Session = Depends(get_db)):
    gates = db.query(Gate).join(Terminal).all()
    results = []

    for g in gates:
        allocs = db.query(GateAllocation).filter(
            GateAllocation.Gate_ID == g.Gate_ID,
            GateAllocation.Allocation_Status != "Cancelled"
        ).all()

        total_minutes = sum(
            max(0, int((a.Released_Time - a.Assigned_Time).total_seconds() / 60))
            for a in allocs
        )

        # 24hr operating window (1440 min)
        utilization_pct = min(100.0, round((total_minutes / 1440.0) * 100, 1))

        results.append({
            "gate_id": g.Gate_ID,
            "terminal_id": g.Terminal_ID,
            "terminal_name": g.terminal.Terminal_Name if g.terminal else "",
            "gate_type": g.Gate_Type,
            "capacity": g.Capacity,
            "total_allocations": len(allocs),
            "occupied_minutes": total_minutes,
            "utilization_percentage": utilization_pct
        })

    results.sort(key=lambda x: x["utilization_percentage"], reverse=True)
    return results
