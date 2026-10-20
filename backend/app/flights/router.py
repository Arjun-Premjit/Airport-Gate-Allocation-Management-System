from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.core.database import get_db
from backend.app.auth.router import AuthenticatedUser, require_roles
from backend.app.models.all_models import (
    Flight, Airline, Aircraft, Passenger, Cargo, GateAllocation,
    EmployeeFlightAssignedTo, Employee, EmployeePhoneNumber
)

router = APIRouter(prefix="/flights", tags=["Flights"])

class StaffAssignmentRequest(BaseModel):
    employee_id: str

class FlightCreate(BaseModel):
    flight_id: str
    airline_id: str
    aircraft_id: str
    scheduled_departure: datetime
    scheduled_arrival: datetime
    status: str = "Scheduled"

class FlightUpdate(BaseModel):
    airline_id: Optional[str] = None
    aircraft_id: Optional[str] = None
    scheduled_departure: Optional[datetime] = None
    scheduled_arrival: Optional[datetime] = None
    status: Optional[str] = None

class FlightSummary(BaseModel):
    flight_id: str
    airline_name: str
    airline_code: str
    aircraft_model: str
    aircraft_subtype: str  # 'Passenger' or 'Cargo'
    scheduled_departure: datetime
    scheduled_arrival: datetime
    duration_minutes: int
    status: str
    gate_id: Optional[str] = None
    terminal_name: Optional[str] = None

class FlightDetail(FlightSummary):
    passenger_seats: Optional[dict] = None
    cargo_details: Optional[dict] = None
    assigned_staff: List[dict] = []
    allocation_details: Optional[dict] = None

def get_aircraft_subtype(ac: Aircraft) -> str:
    if ac.passenger_details is not None:
        return "Passenger"
    if ac.cargo_details is not None:
        return "Cargo"
    return "Passenger"

@router.get("", response_model=List[FlightSummary])
def list_flights(
    airline_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Flight).join(Airline).join(Aircraft)
    if airline_id:
        query = query.filter(Flight.Airline_ID == airline_id)
    if status:
        query = query.filter(Flight.Status == status)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Flight.Flight_ID.ilike(s),
                Airline.Airline_Name.ilike(s),
                Airline.Airline_Code.ilike(s),
                Aircraft.Model.ilike(s)
            )
        )

    flights = query.order_by(Flight.Scheduled_Departure.asc()).all()
    result = []
    for f in flights:
        active_alloc = db.query(GateAllocation).filter(
            GateAllocation.Flight_ID == f.Flight_ID,
            GateAllocation.Allocation_Status.in_(["Scheduled", "Active"])
        ).first()

        result.append(FlightSummary(
            flight_id=str(f.Flight_ID),
            airline_name=f.airline.Airline_Name,
            airline_code=f.airline.Airline_Code,
            aircraft_model=f.aircraft.Model,
            aircraft_subtype=get_aircraft_subtype(f.aircraft),
            scheduled_departure=f.Scheduled_Departure,
            scheduled_arrival=f.Scheduled_Arrival,
            duration_minutes=f.duration_minutes,
            status=f.Status,
            gate_id=active_alloc.Gate_ID if active_alloc else None,
            terminal_name=active_alloc.gate.terminal.Terminal_Name if active_alloc and active_alloc.gate.terminal else None
        ))
    return result

@router.get("/{flight_id}", response_model=FlightDetail)
def get_flight_detail(flight_id: str, db: Session = Depends(get_db)):
    f = db.query(Flight).filter(Flight.Flight_ID == flight_id).first()
    if not f:
        raise HTTPException(status_code=404, detail=f"Flight '{flight_id}' not found.")

    # Aircraft Subclass specialization (disjoint: Passenger or Cargo)
    passenger_info = None
    cargo_info = None
    if f.aircraft.passenger_details:
        p = f.aircraft.passenger_details
        passenger_info = {
            "economic_seats": p.Economic_Seats,
            "business_seats": p.Business_Seats,
            "total_capacity": f.aircraft.Capacity
        }
    elif f.aircraft.cargo_details:
        c = f.aircraft.cargo_details
        cargo_info = {
            "capacity": float(c.Capacity),
            "hazardous_goods_certified": c.Hazardous_Goods_Certified
        }

    # Assigned staff via canonical Employee_Flight_Assigned_To (Employee_ID, Flight_ID)
    staff = []
    for ef in f.assigned_staff:
        phone = db.query(EmployeePhoneNumber).filter(EmployeePhoneNumber.Employee_ID == ef.Employee_ID).first()
        staff.append({
            "employee_id": ef.Employee_ID,
            "name": ef.employee.full_name,
            "phone_number": phone.Phone_Number if phone else None,
            "experience_years": ef.employee.experience_years
        })

    # Active or upcoming allocation
    active_alloc = db.query(GateAllocation).filter(
        GateAllocation.Flight_ID == f.Flight_ID,
        GateAllocation.Allocation_Status.in_(["Scheduled", "Active"])
    ).first()

    alloc_dict = None
    if active_alloc:
        alloc_dict = {
            "gate_id": active_alloc.Gate_ID,
            "allocation_number": active_alloc.Allocation_Number,
            "composite_key": f"{active_alloc.Gate_ID}_{active_alloc.Flight_ID}_{active_alloc.Allocation_Number}",
            "terminal_name": active_alloc.gate.terminal.Terminal_Name if active_alloc.gate.terminal else None,
            "assigned_time": active_alloc.Assigned_Time.isoformat(),
            "released_time": active_alloc.Released_Time.isoformat(),
            "status": active_alloc.Allocation_Status
        }

    return FlightDetail(
        flight_id=f.Flight_ID,
        airline_name=f.airline.Airline_Name,
        airline_code=f.airline.Airline_Code,
        aircraft_model=f.aircraft.Model,
        aircraft_subtype=get_aircraft_subtype(f.aircraft),
        scheduled_departure=f.Scheduled_Departure,
        scheduled_arrival=f.Scheduled_Arrival,
        duration_minutes=f.duration_minutes,
        status=f.Status,
        gate_id=active_alloc.Gate_ID if active_alloc else None,
        terminal_name=active_alloc.gate.terminal.Terminal_Name if active_alloc and active_alloc.gate.terminal else None,
        passenger_seats=passenger_info,
        cargo_details=cargo_info,
        assigned_staff=staff,
        allocation_details=alloc_dict
    )

@router.post("", response_model=FlightSummary, status_code=status.HTTP_201_CREATED)
def create_flight(
    payload: FlightCreate,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Flight Manager"])),
    db: Session = Depends(get_db)
):
    if payload.scheduled_arrival <= payload.scheduled_departure:
        raise HTTPException(status_code=400, detail="Scheduled arrival must be strictly after scheduled departure.")

    airline = db.query(Airline).filter(Airline.Airline_ID == payload.airline_id).first()
    if not airline:
        raise HTTPException(status_code=400, detail=f"Referenced Airline '{payload.airline_id}' does not exist.")

    aircraft = db.query(Aircraft).filter(Aircraft.Aircraft_ID == payload.aircraft_id).first()
    if not aircraft:
        raise HTTPException(status_code=400, detail=f"Referenced Aircraft '{payload.aircraft_id}' does not exist.")

    existing = db.query(Flight).filter(Flight.Flight_ID == payload.flight_id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Flight '{payload.flight_id}' already exists.")

    new_flight = Flight(
        Flight_ID=payload.flight_id,
        Airline_ID=payload.airline_id,
        Aircraft_ID=payload.aircraft_id,
        Scheduled_Departure=payload.scheduled_departure,
        Scheduled_Arrival=payload.scheduled_arrival,
        Status=payload.status
    )
    db.add(new_flight)
    db.commit()
    db.refresh(new_flight)

    return FlightSummary(
        flight_id=new_flight.Flight_ID,
        airline_name=airline.Airline_Name,
        airline_code=airline.Airline_Code,
        aircraft_model=aircraft.Model,
        aircraft_subtype=get_aircraft_subtype(aircraft),
        scheduled_departure=new_flight.Scheduled_Departure,
        scheduled_arrival=new_flight.Scheduled_Arrival,
        duration_minutes=new_flight.duration_minutes,
        status=new_flight.Status
    )

@router.put("/{flight_id}", response_model=FlightSummary)
def update_flight(
    flight_id: str,
    payload: FlightUpdate,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Flight Manager"])),
    db: Session = Depends(get_db)
):
    flight = db.query(Flight).filter(Flight.Flight_ID == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail=f"Flight '{flight_id}' not found.")

    if payload.airline_id:
        airline = db.query(Airline).filter(Airline.Airline_ID == payload.airline_id).first()
        if not airline:
            raise HTTPException(status_code=400, detail=f"Referenced Airline '{payload.airline_id}' does not exist.")
        flight.Airline_ID = payload.airline_id

    if payload.aircraft_id:
        aircraft = db.query(Aircraft).filter(Aircraft.Aircraft_ID == payload.aircraft_id).first()
        if not aircraft:
            raise HTTPException(status_code=400, detail=f"Referenced Aircraft '{payload.aircraft_id}' does not exist.")
        flight.Aircraft_ID = payload.aircraft_id

    dep = payload.scheduled_departure or flight.Scheduled_Departure
    arr = payload.scheduled_arrival or flight.Scheduled_Arrival
    if arr <= dep:
        raise HTTPException(status_code=400, detail="Scheduled arrival must be strictly after scheduled departure.")

    flight.Scheduled_Departure = dep
    flight.Scheduled_Arrival = arr

    if payload.status:
        flight.Status = payload.status

    db.commit()
    db.refresh(flight)

    return FlightSummary(
        flight_id=flight.Flight_ID,
        airline_name=flight.airline.Airline_Name,
        airline_code=flight.airline.Airline_Code,
        aircraft_model=flight.aircraft.Model,
        aircraft_subtype=get_aircraft_subtype(flight.aircraft),
        scheduled_departure=flight.Scheduled_Departure,
        scheduled_arrival=flight.Scheduled_Arrival,
        duration_minutes=flight.duration_minutes,
        status=flight.Status
    )

@router.delete("/{flight_id}", status_code=status.HTTP_200_OK)
def delete_flight(
    flight_id: str,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head"])),
    db: Session = Depends(get_db)
):
    flight = db.query(Flight).filter(Flight.Flight_ID == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail=f"Flight '{flight_id}' not found.")

    # Check dependent allocations
    alloc_count = db.query(GateAllocation).filter(GateAllocation.Flight_ID == flight_id).count()
    if alloc_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete Flight '{flight_id}' because it has {alloc_count} historical allocation records."
        )

    db.delete(flight)
    db.commit()
    return {"message": f"Flight '{flight_id}' deleted successfully."}

@router.post("/{flight_id}/assign-staff", status_code=status.HTTP_201_CREATED)
def assign_staff_to_flight(
    flight_id: str,
    payload: StaffAssignmentRequest,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Flight Manager"])),
    db: Session = Depends(get_db)
):
    flight = db.query(Flight).filter(Flight.Flight_ID == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found.")

    emp = db.query(Employee).filter(Employee.Employee_ID == payload.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    existing = db.query(EmployeeFlightAssignedTo).filter(
        EmployeeFlightAssignedTo.Flight_ID == flight_id,
        EmployeeFlightAssignedTo.Employee_ID == payload.employee_id
    ).first()

    if not existing:
        assignment = EmployeeFlightAssignedTo(
            Employee_ID=payload.employee_id,
            Flight_ID=flight_id
        )
        db.add(assignment)
        db.commit()

    return {"message": f"Assigned {emp.full_name} to Flight {flight_id}."}

@router.delete("/{flight_id}/unassign-staff/{employee_id}", status_code=status.HTTP_200_OK)
def unassign_staff_from_flight(
    flight_id: str,
    employee_id: str,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Flight Manager"])),
    db: Session = Depends(get_db)
):
    assignment = db.query(EmployeeFlightAssignedTo).filter(
        EmployeeFlightAssignedTo.Flight_ID == flight_id,
        EmployeeFlightAssignedTo.Employee_ID == employee_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Staff assignment not found.")

    db.delete(assignment)
    db.commit()
    return {"message": f"Unassigned employee {employee_id} from Flight {flight_id}."}
