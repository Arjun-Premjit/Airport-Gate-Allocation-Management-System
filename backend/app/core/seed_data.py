from datetime import datetime, date
from sqlalchemy.orm import Session
from app.models.all_models import (
    Airport, AirportContactNumber, ControlTower, Terminal, Gate,
    MaintenanceRecord, Airline, AirlineContactNumber, Aircraft,
    Passenger, Cargo, Flight, Employee, EmployeePhoneNumber,
    EmployeeFlightAssignedTo, GateAllocation
)

def init_db_seed(db: Session):
    if db.query(Airport).count() > 0:
        return  # Already seeded

    # 1. Control Towers (Must be inserted before Airport due to Airport.Tower_ID FK)
    twr_dxb = ControlTower(Tower_ID="TWR-DXB", Tower_Name="Dubai Air Traffic Control Tower", Frequency=118.750, Height=87.00)
    twr_bom = ControlTower(Tower_ID="TWR-BOM", Tower_Name="Mumbai Air Traffic Control Tower", Frequency=119.100, Height=85.00)
    twr_lhr = ControlTower(Tower_ID="TWR-LHR", Tower_Name="Heathrow Air Traffic Control Tower", Frequency=118.700, Height=87.00)
    db.add_all([twr_dxb, twr_bom, twr_lhr])
    db.flush()

    # 2. Airports (Tower_ID points to Control_Tower)
    dxb = Airport(Airport_ID="DXB", Airport_Name="Dubai International Airport", Street="Airport Road", City="Dubai", State="Dubai", Country="United Arab Emirates", Tower_ID="TWR-DXB")
    bom = Airport(Airport_ID="BOM", Airport_Name="Chhatrapati Shivaji Maharaj International Airport", Street="Sahar Road", City="Mumbai", State="Maharashtra", Country="India", Tower_ID="TWR-BOM")
    lhr = Airport(Airport_ID="LHR", Airport_Name="Heathrow Airport", Street="Longford", City="London", State="Greater London", Country="United Kingdom", Tower_ID="TWR-LHR")
    db.add_all([dxb, bom, lhr])
    db.flush()

    # 3. Airport Contacts
    db.add_all([
        AirportContactNumber(Airport_ID="DXB", Contact_Number="+971-4-224-5555"),
        AirportContactNumber(Airport_ID="DXB", Contact_Number="+971-4-216-2525"),
        AirportContactNumber(Airport_ID="BOM", Contact_Number="+91-22-66851010"),
        AirportContactNumber(Airport_ID="LHR", Contact_Number="+44-844-335-1801")
    ])

    # 4. Terminals
    t1 = Terminal(Terminal_ID="T1", Terminal_Name="Terminal 1 - Domestic & Regional", Number_Of_Floors=3, Airport_ID="DXB")
    t2 = Terminal(Terminal_ID="T2", Terminal_Name="Terminal 2 - International Concourse", Number_Of_Floors=4, Airport_ID="DXB")
    db.add_all([t1, t2])
    db.flush()

    # 5. Gates (G01 to G18)
    gates = [
        Gate(Gate_ID="G01", Gate_Type="Passenger", Capacity=220, Status="Available",   Terminal_ID="T1"),
        Gate(Gate_ID="G02", Gate_Type="Passenger", Capacity=250, Status="Occupied",    Terminal_ID="T1"),
        Gate(Gate_ID="G03", Gate_Type="Passenger", Capacity=240, Status="Maintenance", Terminal_ID="T1"),
        Gate(Gate_ID="G04", Gate_Type="Passenger", Capacity=220, Status="Available",   Terminal_ID="T1"),
        Gate(Gate_ID="G05", Gate_Type="Passenger", Capacity=280, Status="Reserved",    Terminal_ID="T1"),
        Gate(Gate_ID="G06", Gate_Type="Cargo",     Capacity=100, Status="Available",   Terminal_ID="T1"),
        Gate(Gate_ID="G07", Gate_Type="Hybrid",    Capacity=300, Status="Closed",      Terminal_ID="T1"),
        Gate(Gate_ID="G08", Gate_Type="Passenger", Capacity=250, Status="Available",   Terminal_ID="T1"),
        Gate(Gate_ID="G09", Gate_Type="Passenger", Capacity=260, Status="Available",   Terminal_ID="T1"),
        Gate(Gate_ID="G10", Gate_Type="Passenger", Capacity=320, Status="Available",   Terminal_ID="T2"),
        Gate(Gate_ID="G11", Gate_Type="Passenger", Capacity=350, Status="Occupied",    Terminal_ID="T2"),
        Gate(Gate_ID="G12", Gate_Type="Passenger", Capacity=300, Status="Available",   Terminal_ID="T2"),
        Gate(Gate_ID="G13", Gate_Type="Passenger", Capacity=340, Status="Available",   Terminal_ID="T2"),
        Gate(Gate_ID="G14", Gate_Type="Passenger", Capacity=320, Status="Available",   Terminal_ID="T2"),
        Gate(Gate_ID="G15", Gate_Type="Passenger", Capacity=380, Status="Reserved",    Terminal_ID="T2"),
        Gate(Gate_ID="G16", Gate_Type="Cargo",     Capacity=150, Status="Available",   Terminal_ID="T2"),
        Gate(Gate_ID="G17", Gate_Type="Passenger", Capacity=420, Status="Available",   Terminal_ID="T2"),
        Gate(Gate_ID="G18", Gate_Type="Hybrid",    Capacity=400, Status="Available",   Terminal_ID="T2"),
    ]
    db.add_all(gates)

    # 6. Maintenance Records (Composite PK: Gate_ID, Record_Number)
    db.add_all([
        MaintenanceRecord(Gate_ID="G03", Record_Number=1, Maintenance_Date=datetime(2026, 10, 10, 8, 0), Description="Jet bridge hydraulic overhaul", Cost=14500.0),
        MaintenanceRecord(Gate_ID="G07", Record_Number=1, Maintenance_Date=datetime(2026, 10, 1, 6, 0),  Description="Gate software and floor resurfacing", Cost=32000.0)
    ])

    # 7. Airlines
    dal = Airline(Airline_ID="DAL", Airline_Name="Delta Air Lines", Airline_Code="DL", Headquarters="Atlanta, Georgia")
    aic = Airline(Airline_ID="AIC", Airline_Name="Air India", Airline_Code="AI", Headquarters="New Delhi, India")
    uae = Airline(Airline_ID="UAE", Airline_Name="Emirates", Airline_Code="EK", Headquarters="Dubai, United Arab Emirates")
    db.add_all([dal, aic, uae])
    db.flush()

    # 8. Airline Contacts
    db.add_all([
        AirlineContactNumber(Airline_ID="DAL", Contact_Number="+1-800-221-1212"),
        AirlineContactNumber(Airline_ID="AIC", Contact_Number="+91-124-264-1407"),
        AirlineContactNumber(Airline_ID="UAE", Contact_Number="+971-600-555555")
    ])

    # 9. Aircraft
    ac_dl = Aircraft(Aircraft_ID="AC-DAL-101", Airline_ID="DAL", Model="A320-200", Manufacturer="Airbus", Manufacturing_Date=date(2018, 5, 20), Capacity=170)
    ac_ai = Aircraft(Aircraft_ID="AC-AIC-301", Airline_ID="AIC", Model="A350-900", Manufacturer="Airbus", Manufacturing_Date=date(2020, 2, 14), Capacity=304)
    ac_ek = Aircraft(Aircraft_ID="AC-UAE-401", Airline_ID="UAE", Model="B777-200F", Manufacturer="Boeing", Manufacturing_Date=date(2019, 8, 10), Capacity=102)
    db.add_all([ac_dl, ac_ai, ac_ek])
    db.flush()

    # 10. Passenger & Cargo Subclasses
    db.add_all([
        Passenger(Aircraft_ID="AC-DAL-101", Economic_Seats=150, Business_Seats=20),
        Passenger(Aircraft_ID="AC-AIC-301", Economic_Seats=264, Business_Seats=40),
        Cargo(Aircraft_ID="AC-UAE-401", Capacity=102.80, Hazardous_Goods_Certified=True)
    ])

    # 11. Flights
    f_dl = Flight(Flight_ID="DL404", Airline_ID="DAL", Aircraft_ID="AC-DAL-101", Scheduled_Departure=datetime(2026, 10, 21, 14, 0), Scheduled_Arrival=datetime(2026, 10, 21, 16, 0), Status="Scheduled")
    f_ai = Flight(Flight_ID="AI202", Airline_ID="AIC", Aircraft_ID="AC-AIC-301", Scheduled_Departure=datetime(2026, 10, 21, 15, 0), Scheduled_Arrival=datetime(2026, 10, 21, 17, 0), Status="Scheduled")
    f_ek = Flight(Flight_ID="EK901", Airline_ID="UAE", Aircraft_ID="AC-UAE-401", Scheduled_Departure=datetime(2026, 10, 21, 18, 0), Scheduled_Arrival=datetime(2026, 10, 21, 21, 0), Status="Scheduled")
    db.add_all([f_dl, f_ai, f_ek])

    # 12. Employees
    emp1 = Employee(Employee_ID="EMP001", First_Name="Jonathan", Middle_Name="Edward", Last_Name="Vance", Join_Date=date(2019, 1, 15), Supervisor_Employee_ID=None)
    db.add(emp1)
    db.flush()

    emp2 = Employee(Employee_ID="EMP002", First_Name="Marcus", Middle_Name="Alexander", Last_Name="Reed", Join_Date=date(2021, 3, 20), Supervisor_Employee_ID="EMP001")
    emp3 = Employee(Employee_ID="EMP003", First_Name="Sarah", Middle_Name=None, Last_Name="Jenkins", Join_Date=date(2021, 7, 10), Supervisor_Employee_ID="EMP001")
    emp4 = Employee(Employee_ID="EMP004", First_Name="Ravi", Middle_Name=None, Last_Name="Sharma", Join_Date=date(2022, 11, 1), Supervisor_Employee_ID="EMP002")
    emp5 = Employee(Employee_ID="EMP005", First_Name="Priya", Middle_Name=None, Last_Name="Patel", Join_Date=date(2023, 4, 15), Supervisor_Employee_ID="EMP002")
    db.add_all([emp2, emp3, emp4, emp5])
    db.flush()

    # 13. Employee Phone Numbers
    db.add_all([
        EmployeePhoneNumber(Employee_ID="EMP001", Phone_Number="+1-212-555-0101"),
        EmployeePhoneNumber(Employee_ID="EMP002", Phone_Number="+1-212-555-0102"),
        EmployeePhoneNumber(Employee_ID="EMP003", Phone_Number="+1-212-555-0103"),
        EmployeePhoneNumber(Employee_ID="EMP004", Phone_Number="+1-212-555-0104"),
        EmployeePhoneNumber(Employee_ID="EMP005", Phone_Number="+1-212-555-0105")
    ])

    # 14. Staff Assignments (Employee_Flight_Assigned_To: Employee_ID, Flight_ID)
    db.add_all([
        EmployeeFlightAssignedTo(Employee_ID="EMP004", Flight_ID="DL404"),
        EmployeeFlightAssignedTo(Employee_ID="EMP005", Flight_ID="DL404")
    ])

    # 15. Initial Gate Allocations (Composite PK: Gate_ID, Flight_ID, Allocation_Number)
    db.add_all([
        GateAllocation(Gate_ID="G02", Flight_ID="DL404", Allocation_Number=1, Assigned_Time=datetime(2026, 10, 21, 8, 30), Released_Time=datetime(2026, 10, 21, 11, 45), Allocation_Status="Completed"),
        GateAllocation(Gate_ID="G05", Flight_ID="EK901", Allocation_Number=1, Assigned_Time=datetime(2026, 10, 21, 17, 30), Released_Time=datetime(2026, 10, 21, 21, 30), Allocation_Status="Scheduled")
    ])

    db.commit()
