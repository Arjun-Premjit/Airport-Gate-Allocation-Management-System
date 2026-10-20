from datetime import datetime, date
from sqlalchemy import (
    Column, String, Integer, Numeric, DateTime, Date, Boolean,
    ForeignKey, Text, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

# ============================================================================
# AGAMS — CANONICAL 16-TABLE RELATIONAL MODELS (LOCKED SCHEMA)
# ============================================================================

# 1. Control_Tower Table
class ControlTower(Base):
    __tablename__ = "Control_Tower"

    Tower_ID = Column(String(10), primary_key=True)
    Tower_Name = Column(String(60), nullable=False)
    Frequency = Column(Numeric(6, 3), nullable=False)
    Height = Column(Numeric(5, 2), nullable=False)

    airport = relationship("Airport", back_populates="control_tower", uselist=False)


# 2. Airport Table (1:1 with Control Tower; FK is on Airport per specification)
class Airport(Base):
    __tablename__ = "Airport"

    Airport_ID = Column(String(10), primary_key=True)
    Airport_Name = Column(String(100), nullable=False)
    Street = Column(String(100), nullable=False)
    City = Column(String(60), nullable=False)
    State = Column(String(60), nullable=False)
    Country = Column(String(60), nullable=False)
    Tower_ID = Column(
        String(10),
        ForeignKey("Control_Tower.Tower_ID", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
        unique=True
    )

    control_tower = relationship("ControlTower", back_populates="airport")
    contacts = relationship("AirportContactNumber", back_populates="airport", cascade="all, delete-orphan")
    terminals = relationship("Terminal", back_populates="airport", cascade="all, delete-orphan")


# 3. Airport_Contact_Number Table (Composite PK)
class AirportContactNumber(Base):
    __tablename__ = "Airport_Contact_Number"

    Airport_ID = Column(
        String(10),
        ForeignKey("Airport.Airport_ID", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True
    )
    Contact_Number = Column(String(20), primary_key=True)

    airport = relationship("Airport", back_populates="contacts")


# 4. Terminal Table
class Terminal(Base):
    __tablename__ = "Terminal"

    Terminal_ID = Column(String(10), primary_key=True)
    Terminal_Name = Column(String(60), nullable=False)
    Number_Of_Floors = Column(Integer, nullable=False, default=1)
    Airport_ID = Column(
        String(10),
        ForeignKey("Airport.Airport_ID", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )

    airport = relationship("Airport", back_populates="terminals")
    gates = relationship("Gate", back_populates="terminal")


# 5. Gate Table (The core allocatable resource)
class Gate(Base):
    __tablename__ = "Gate"

    Gate_ID = Column(String(10), primary_key=True)
    Gate_Type = Column(String(20), nullable=False, default="Passenger")  # 'Passenger', 'Cargo', 'Hybrid'
    Capacity = Column(Integer, nullable=False)
    Status = Column(String(20), nullable=False, default="Available")     # 'Available', 'Reserved', 'Occupied', 'Maintenance', 'Closed'
    Terminal_ID = Column(
        String(10),
        ForeignKey("Terminal.Terminal_ID", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False
    )

    terminal = relationship("Terminal", back_populates="gates")
    allocations = relationship("GateAllocation", back_populates="gate")
    maintenance_records = relationship("MaintenanceRecord", back_populates="gate")


# 6. Maintenance_Record Table (Composite PK: Gate_ID, Record_Number)
class MaintenanceRecord(Base):
    __tablename__ = "Maintenance_Record"

    Gate_ID = Column(
        String(10),
        ForeignKey("Gate.Gate_ID", ondelete="RESTRICT", onupdate="CASCADE"),
        primary_key=True
    )
    Record_Number = Column(Integer, primary_key=True)
    Maintenance_Date = Column(DateTime, nullable=False)
    Description = Column(Text, nullable=False)
    Cost = Column(Numeric(10, 2), nullable=False, default=0.00)

    gate = relationship("Gate", back_populates="maintenance_records")


# 7. Airline Table
class Airline(Base):
    __tablename__ = "Airline"

    Airline_ID = Column(String(10), primary_key=True)
    Airline_Name = Column(String(100), nullable=False)
    Airline_Code = Column(String(10), nullable=False, unique=True)
    Headquarters = Column(String(100), nullable=False)

    contacts = relationship("AirlineContactNumber", back_populates="airline", cascade="all, delete-orphan")
    aircraft = relationship("Aircraft", back_populates="airline")
    flights = relationship("Flight", back_populates="airline")


# 8. Airline_Contact_Number Table (Composite PK: Airline_ID, Contact_Number)
class AirlineContactNumber(Base):
    __tablename__ = "Airline_Contact_Number"

    Airline_ID = Column(
        String(10),
        ForeignKey("Airline.Airline_ID", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True
    )
    Contact_Number = Column(String(20), primary_key=True)

    airline = relationship("Airline", back_populates="contacts")


# 9. Aircraft Table (Superclass; specialization is Passenger or Cargo)
class Aircraft(Base):
    __tablename__ = "Aircraft"

    Aircraft_ID = Column(String(15), primary_key=True)
    Model = Column(String(60), nullable=False)
    Manufacturer = Column(String(60), nullable=False)
    Manufacturing_Date = Column(Date, nullable=False)
    Capacity = Column(Integer, nullable=False)
    Airline_ID = Column(
        String(10),
        ForeignKey("Airline.Airline_ID", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False
    )

    airline = relationship("Airline", back_populates="aircraft")
    passenger_details = relationship("Passenger", back_populates="aircraft", uselist=False, cascade="all, delete-orphan")
    cargo_details = relationship("Cargo", back_populates="aircraft", uselist=False, cascade="all, delete-orphan")
    flights = relationship("Flight", back_populates="aircraft")

    @property
    def age_years(self) -> int:
        """Derived Age (not stored in table per schema specification)."""
        today = date.today()
        if self.Manufacturing_Date:
            return today.year - self.Manufacturing_Date.year - (
                (today.month, today.day) < (self.Manufacturing_Date.month, self.Manufacturing_Date.day)
            )
        return 0


# 10. Passenger Specialization Table (PK, FK to Aircraft)
class Passenger(Base):
    __tablename__ = "Passenger"

    Aircraft_ID = Column(
        String(15),
        ForeignKey("Aircraft.Aircraft_ID", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True
    )
    Economic_Seats = Column(Integer, nullable=False, default=0)
    Business_Seats = Column(Integer, nullable=False, default=0)

    aircraft = relationship("Aircraft", back_populates="passenger_details")


# 11. Cargo Specialization Table (PK, FK to Aircraft)
class Cargo(Base):
    __tablename__ = "Cargo"

    Aircraft_ID = Column(
        String(15),
        ForeignKey("Aircraft.Aircraft_ID", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True
    )
    Capacity = Column(Numeric(10, 2), nullable=False)
    Hazardous_Goods_Certified = Column(Boolean, nullable=False, default=False)

    aircraft = relationship("Aircraft", back_populates="cargo_details")


# 12. Flight Table (Core object requiring Gate Allocation)
class Flight(Base):
    __tablename__ = "Flight"

    Flight_ID = Column(String(15), primary_key=True)
    Scheduled_Departure = Column(DateTime, nullable=False)
    Scheduled_Arrival = Column(DateTime, nullable=False)
    Status = Column(String(20), nullable=False, default="Scheduled")  # 'Scheduled', 'Boarding', 'Departed', 'Landed', 'Delayed', 'Cancelled'
    Airline_ID = Column(
        String(10),
        ForeignKey("Airline.Airline_ID", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False
    )
    Aircraft_ID = Column(
        String(15),
        ForeignKey("Aircraft.Aircraft_ID", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False
    )

    airline = relationship("Airline", back_populates="flights")
    aircraft = relationship("Aircraft", back_populates="flights")
    allocations = relationship("GateAllocation", back_populates="flight")
    assigned_staff = relationship("EmployeeFlightAssignedTo", back_populates="flight", cascade="all, delete-orphan")

    @property
    def duration_minutes(self) -> int:
        """Derived Duration (not stored in table per schema specification)."""
        if self.Scheduled_Arrival and self.Scheduled_Departure:
            return max(0, int((self.Scheduled_Arrival - self.Scheduled_Departure).total_seconds() / 60))
        return 0


# 13. Employee Table (Canonical: no email, password_hash, or role in relation)
class Employee(Base):
    __tablename__ = "Employee"

    Employee_ID = Column(String(10), primary_key=True)
    First_Name = Column(String(50), nullable=False)
    Middle_Name = Column(String(50), nullable=True)
    Last_Name = Column(String(50), nullable=False)
    Join_Date = Column(Date, nullable=False)
    Supervisor_Employee_ID = Column(
        String(10),
        ForeignKey("Employee.Employee_ID", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True
    )

    supervisor = relationship("Employee", remote_side=[Employee_ID], backref="subordinates")
    phone_numbers = relationship("EmployeePhoneNumber", back_populates="employee", cascade="all, delete-orphan")
    flight_assignments = relationship("EmployeeFlightAssignedTo", back_populates="employee", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        if self.Middle_Name:
            return f"{self.First_Name} {self.Middle_Name} {self.Last_Name}"
        return f"{self.First_Name} {self.Last_Name}"

    @property
    def experience_years(self) -> int:
        """Derived Experience (not stored in table per schema specification)."""
        today = date.today()
        if self.Join_Date:
            return today.year - self.Join_Date.year - (
                (today.month, today.day) < (self.Join_Date.month, self.Join_Date.day)
            )
        return 0


# 14. Employee_Phone_Number Table (Composite PK: Employee_ID, Phone_Number)
class EmployeePhoneNumber(Base):
    __tablename__ = "Employee_Phone_Number"

    Employee_ID = Column(
        String(10),
        ForeignKey("Employee.Employee_ID", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True
    )
    Phone_Number = Column(String(20), primary_key=True)

    employee = relationship("Employee", back_populates="phone_numbers")


# 15. Employee_Flight_Assigned_To Table (Composite PK: Employee_ID, Flight_ID)
class EmployeeFlightAssignedTo(Base):
    __tablename__ = "Employee_Flight_Assigned_To"

    Employee_ID = Column(
        String(10),
        ForeignKey("Employee.Employee_ID", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True
    )
    Flight_ID = Column(
        String(15),
        ForeignKey("Flight.Flight_ID", ondelete="CASCADE", onupdate="CASCADE"),
        primary_key=True
    )

    employee = relationship("Employee", back_populates="flight_assignments")
    flight = relationship("Flight", back_populates="assigned_staff")


# 16. Gate_Allocation Table (THE CORE TRANSACTION; Composite PK: Gate_ID, Flight_ID, Allocation_Number)
class GateAllocation(Base):
    __tablename__ = "Gate_Allocation"

    Gate_ID = Column(
        String(10),
        ForeignKey("Gate.Gate_ID", ondelete="RESTRICT", onupdate="CASCADE"),
        primary_key=True
    )
    Flight_ID = Column(
        String(15),
        ForeignKey("Flight.Flight_ID", ondelete="RESTRICT", onupdate="CASCADE"),
        primary_key=True
    )
    Allocation_Number = Column(Integer, primary_key=True, default=1)
    Assigned_Time = Column(DateTime, nullable=False)
    Released_Time = Column(DateTime, nullable=False)
    Allocation_Status = Column(String(20), nullable=False, default="Scheduled")  # 'Scheduled', 'Active', 'Completed', 'Cancelled'

    gate = relationship("Gate", back_populates="allocations")
    flight = relationship("Flight", back_populates="allocations")
