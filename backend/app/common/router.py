from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.auth.router import AuthenticatedUser, require_roles
from backend.app.models.all_models import (
    Airport, AirportContactNumber, ControlTower, Terminal,
    Airline, AirlineContactNumber, Aircraft, Passenger, Cargo,
    Employee, EmployeePhoneNumber
)

router = APIRouter(tags=["Supporting Entities"])

# ----------------- AIRPORT & TOWER -----------------
@router.get("/airport")
def get_airport_info(db: Session = Depends(get_db)):
    ap = db.query(Airport).first()
    if not ap:
        return {}

    contacts = [c.Contact_Number for c in ap.contacts]
    tower_data = None
    if ap.control_tower:
        tower_data = {
            "tower_id": ap.control_tower.Tower_ID,
            "tower_name": ap.control_tower.Tower_Name,
            "frequency_mhz": float(ap.control_tower.Frequency),
            "height_m": float(ap.control_tower.Height)
        }

    return {
        "airport_id": ap.Airport_ID,
        "name": ap.Airport_Name,
        "street": ap.Street,
        "city": ap.City,
        "state": ap.State,
        "country": ap.Country,
        "tower_id": ap.Tower_ID,
        "contacts": contacts,
        "control_tower": tower_data
    }

# ----------------- TERMINALS -----------------
class TerminalCreate(BaseModel):
    terminal_id: str
    terminal_name: str
    number_of_floors: int = 1
    airport_id: str

@router.get("/terminals")
def list_terminals(db: Session = Depends(get_db)):
    terms = db.query(Terminal).all()
    return [
        {
            "terminal_id": t.Terminal_ID,
            "name": t.Terminal_Name,
            "floors": t.Number_Of_Floors,
            "airport_id": t.Airport_ID,
            "total_gates": len(t.gates)
        }
        for t in terms
    ]

@router.post("/terminals", status_code=status.HTTP_201_CREATED)
def create_terminal(
    payload: TerminalCreate,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head"])),
    db: Session = Depends(get_db)
):
    ap = db.query(Airport).filter(Airport.Airport_ID == payload.airport_id).first()
    if not ap:
        raise HTTPException(status_code=400, detail="Referenced Airport does not exist.")

    existing = db.query(Terminal).filter(Terminal.Terminal_ID == payload.terminal_id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Terminal '{payload.terminal_id}' already exists.")

    new_term = Terminal(
        Terminal_ID=payload.terminal_id,
        Terminal_Name=payload.terminal_name,
        Number_Of_Floors=payload.number_of_floors,
        Airport_ID=payload.airport_id
    )
    db.add(new_term)
    db.commit()
    return {"message": f"Terminal '{payload.terminal_id}' created successfully."}

# ----------------- AIRLINES -----------------
class AirlineCreate(BaseModel):
    airline_id: str
    airline_name: str
    airline_code: str
    headquarters: str
    contact_numbers: List[str] = []

@router.get("/airlines")
def list_airlines(db: Session = Depends(get_db)):
    airlines = db.query(Airline).all()
    return [
        {
            "airline_id": a.Airline_ID,
            "name": a.Airline_Name,
            "iata_code": a.Airline_Code,
            "headquarters": a.Headquarters,
            "contacts": [c.Contact_Number for c in a.contacts],
            "fleet_size": len(a.aircraft)
        }
        for a in airlines
    ]

@router.post("/airlines", status_code=status.HTTP_201_CREATED)
def create_airline(
    payload: AirlineCreate,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Flight Manager"])),
    db: Session = Depends(get_db)
):
    existing = db.query(Airline).filter(Airline.Airline_ID == payload.airline_id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Airline '{payload.airline_id}' already exists.")

    new_al = Airline(
        Airline_ID=payload.airline_id,
        Airline_Name=payload.airline_name,
        Airline_Code=payload.airline_code,
        Headquarters=payload.headquarters
    )
    db.add(new_al)
    for num in payload.contact_numbers:
        db.add(AirlineContactNumber(Airline_ID=payload.airline_id, Contact_Number=num))
    db.commit()
    return {"message": f"Airline '{payload.airline_id}' created successfully."}

# ----------------- AIRCRAFT & SPECIALIZATION -----------------
class AircraftCreate(BaseModel):
    aircraft_id: str
    airline_id: str
    model: str
    manufacturer: str
    manufacturing_date: date
    capacity: int
    subtype: str  # 'Passenger' or 'Cargo'
    # If Passenger:
    economic_seats: Optional[int] = None
    business_seats: Optional[int] = None
    # If Cargo:
    cargo_capacity: Optional[float] = None
    hazardous_goods_certified: Optional[bool] = False

@router.get("/aircraft")
def list_aircraft(db: Session = Depends(get_db)):
    fleet = db.query(Aircraft).all()
    result = []
    for ac in fleet:
        details = {}
        subtype = "Passenger"
        if ac.passenger_details:
            subtype = "Passenger"
            details = {
                "economic_seats": ac.passenger_details.Economic_Seats,
                "business_seats": ac.passenger_details.Business_Seats
            }
        elif ac.cargo_details:
            subtype = "Cargo"
            details = {
                "capacity": float(ac.cargo_details.Capacity),
                "hazardous_goods_certified": ac.cargo_details.Hazardous_Goods_Certified
            }

        result.append({
            "aircraft_id": ac.Aircraft_ID,
            "airline_id": ac.Airline_ID,
            "airline_name": ac.airline.Airline_Name if ac.airline else "",
            "model": ac.Model,
            "manufacturer": ac.Manufacturer,
            "manufacturing_date": ac.Manufacturing_Date.isoformat(),
            "age_years": ac.age_years,
            "capacity": ac.Capacity,
            "subtype": subtype,
            "specialization": details
        })
    return result

@router.post("/aircraft", status_code=status.HTTP_201_CREATED)
def create_aircraft(
    payload: AircraftCreate,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head", "Flight Manager"])),
    db: Session = Depends(get_db)
):
    al = db.query(Airline).filter(Airline.Airline_ID == payload.airline_id).first()
    if not al:
        raise HTTPException(status_code=400, detail="Referenced Airline does not exist.")

    existing = db.query(Aircraft).filter(Aircraft.Aircraft_ID == payload.aircraft_id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Aircraft '{payload.aircraft_id}' already exists.")

    new_ac = Aircraft(
        Aircraft_ID=payload.aircraft_id,
        Airline_ID=payload.airline_id,
        Model=payload.model,
        Manufacturer=payload.manufacturer,
        Manufacturing_Date=payload.manufacturing_date,
        Capacity=payload.capacity
    )
    db.add(new_ac)

    # Disjoint total specialization: exactly one subtype must be created
    if payload.subtype == "Passenger":
        p = Passenger(
            Aircraft_ID=payload.aircraft_id,
            Economic_Seats=payload.economic_seats or payload.capacity,
            Business_Seats=payload.business_seats or 0
        )
        db.add(p)
    elif payload.subtype == "Cargo":
        c = Cargo(
            Aircraft_ID=payload.aircraft_id,
            Capacity=payload.cargo_capacity or payload.capacity,
            Hazardous_Goods_Certified=payload.hazardous_goods_certified or False
        )
        db.add(c)
    else:
        raise HTTPException(status_code=400, detail="Subtype must be 'Passenger' or 'Cargo'.")

    db.commit()
    return {"message": f"Aircraft '{payload.aircraft_id}' created successfully as {payload.subtype}."}

# ----------------- EMPLOYEES -----------------
class EmployeeCreate(BaseModel):
    employee_id: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    join_date: date
    supervisor_employee_id: Optional[str] = None
    phone_numbers: List[str] = []

@router.get("/employees")
def list_employees(db: Session = Depends(get_db)):
    emps = db.query(Employee).all()
    return [
        {
            "employee_id": e.Employee_ID,
            "first_name": e.First_Name,
            "middle_name": e.Middle_Name,
            "last_name": e.Last_Name,
            "full_name": e.full_name,
            "join_date": e.Join_Date.isoformat(),
            "experience_years": e.experience_years,
            "supervisor_id": e.Supervisor_Employee_ID,
            "supervisor_name": e.supervisor.full_name if e.supervisor else "None (Head)",
            "phone_numbers": [p.Phone_Number for p in e.phone_numbers]
        }
        for e in emps
    ]

@router.post("/employees", status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    current_user: AuthenticatedUser = Depends(require_roles(["Airport Head"])),
    db: Session = Depends(get_db)
):
    existing = db.query(Employee).filter(Employee.Employee_ID == payload.employee_id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Employee '{payload.employee_id}' already exists.")

    if payload.supervisor_employee_id:
        sup = db.query(Employee).filter(Employee.Employee_ID == payload.supervisor_employee_id).first()
        if not sup:
            raise HTTPException(status_code=400, detail="Referenced supervisor employee does not exist.")

    new_emp = Employee(
        Employee_ID=payload.employee_id,
        First_Name=payload.first_name,
        Middle_Name=payload.middle_name,
        Last_Name=payload.last_name,
        Join_Date=payload.join_date,
        Supervisor_Employee_ID=payload.supervisor_employee_id
    )
    db.add(new_emp)
    for phone in payload.phone_numbers:
        db.add(EmployeePhoneNumber(Employee_ID=payload.employee_id, Phone_Number=phone))
    db.commit()
    return {"message": f"Employee '{payload.employee_id}' created successfully."}
