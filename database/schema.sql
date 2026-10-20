-- ============================================================================
-- AGAMS — Airport Gate Allocation Management System
-- Canonical 16-Table Relational Schema (Locked Reference)
--
-- IMPORTANT SAFETY & DESIGN NOTES:
-- 1. Table Creation vs Schema Drift:
--    `CREATE TABLE IF NOT EXISTS` creates missing tables but does NOT alter
--    or repair tables that already exist with wrong columns or obsolete keys.
--    DO NOT execute this script against an existing database expecting it to
--    automatically fix schema drift. Verify actual metadata first and perform
--    a data-preserving migration if required.
-- 2. Tower–Airport Relationship:
--    `Airport.Tower_ID NOT NULL UNIQUE` guarantees each Airport references a
--    unique Control_Tower. Total participation (ensuring every Tower is assigned
--    to an Airport) is enforced by application-level transactional validation.
-- 3. Disjoint & Total Aircraft Specialization:
--    Every Aircraft must belong to exactly one specialization subtype (either
--    Passenger or Cargo, never both, never neither). Foreign key constraints
--    validate existence; mutual exclusivity and totality are enforced by
--    application-level transactional logic without inventing discriminator columns.
-- ============================================================================

-- 1. Control_Tower Table
CREATE TABLE IF NOT EXISTS Control_Tower (
    Tower_ID VARCHAR(10) NOT NULL,
    Tower_Name VARCHAR(60) NOT NULL,
    Frequency DECIMAL(6, 3) NOT NULL,
    Height DECIMAL(5, 2) NOT NULL,
    PRIMARY KEY (Tower_ID),
    CONSTRAINT chk_tower_freq CHECK (Frequency > 0),
    CONSTRAINT chk_tower_height CHECK (Height > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Airport Table (1:1 with Control Tower; FK is on Airport)
CREATE TABLE IF NOT EXISTS Airport (
    Airport_ID VARCHAR(10) NOT NULL,
    Airport_Name VARCHAR(100) NOT NULL,
    Street VARCHAR(100) NOT NULL,
    City VARCHAR(60) NOT NULL,
    State VARCHAR(60) NOT NULL,
    Country VARCHAR(60) NOT NULL,
    Tower_ID VARCHAR(10) NOT NULL UNIQUE,
    PRIMARY KEY (Airport_ID),
    CONSTRAINT fk_airport_tower FOREIGN KEY (Tower_ID)
        REFERENCES Control_Tower(Tower_ID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Airport_Contact_Number Table (Composite PK: Airport_ID, Contact_Number)
CREATE TABLE IF NOT EXISTS Airport_Contact_Number (
    Airport_ID VARCHAR(10) NOT NULL,
    Contact_Number VARCHAR(20) NOT NULL,
    PRIMARY KEY (Airport_ID, Contact_Number),
    CONSTRAINT fk_acn_airport FOREIGN KEY (Airport_ID)
        REFERENCES Airport(Airport_ID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Terminal Table
CREATE TABLE IF NOT EXISTS Terminal (
    Terminal_ID VARCHAR(10) NOT NULL,
    Terminal_Name VARCHAR(60) NOT NULL,
    Number_Of_Floors INT NOT NULL DEFAULT 1,
    Airport_ID VARCHAR(10) NOT NULL,
    PRIMARY KEY (Terminal_ID),
    CONSTRAINT fk_terminal_airport FOREIGN KEY (Airport_ID)
        REFERENCES Airport(Airport_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_terminal_floors CHECK (Number_Of_Floors > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Gate Table (The core allocatable resource)
CREATE TABLE IF NOT EXISTS Gate (
    Gate_ID VARCHAR(10) NOT NULL,
    Gate_Type VARCHAR(20) NOT NULL DEFAULT 'Passenger',
    Capacity INT NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Available',
    Terminal_ID VARCHAR(10) NOT NULL,
    PRIMARY KEY (Gate_ID),
    CONSTRAINT fk_gate_terminal FOREIGN KEY (Terminal_ID)
        REFERENCES Terminal(Terminal_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_gate_capacity CHECK (Capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Maintenance_Record Table (Composite PK: Gate_ID, Record_Number)
CREATE TABLE IF NOT EXISTS Maintenance_Record (
    Gate_ID VARCHAR(10) NOT NULL,
    Record_Number INT NOT NULL,
    Maintenance_Date DATETIME NOT NULL,
    Description TEXT NOT NULL,
    Cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (Gate_ID, Record_Number),
    CONSTRAINT fk_maint_gate FOREIGN KEY (Gate_ID)
        REFERENCES Gate(Gate_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_maint_cost CHECK (Cost >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Airline Table
CREATE TABLE IF NOT EXISTS Airline (
    Airline_ID VARCHAR(10) NOT NULL,
    Airline_Name VARCHAR(100) NOT NULL,
    Airline_Code VARCHAR(10) NOT NULL UNIQUE,
    Headquarters VARCHAR(100) NOT NULL,
    PRIMARY KEY (Airline_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Airline_Contact_Number Table (Composite PK: Airline_ID, Contact_Number)
CREATE TABLE IF NOT EXISTS Airline_Contact_Number (
    Airline_ID VARCHAR(10) NOT NULL,
    Contact_Number VARCHAR(20) NOT NULL,
    PRIMARY KEY (Airline_ID, Contact_Number),
    CONSTRAINT fk_aircon_airline FOREIGN KEY (Airline_ID)
        REFERENCES Airline(Airline_ID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Aircraft Table (Superclass)
CREATE TABLE IF NOT EXISTS Aircraft (
    Aircraft_ID VARCHAR(15) NOT NULL,
    Model VARCHAR(60) NOT NULL,
    Manufacturer VARCHAR(60) NOT NULL,
    Manufacturing_Date DATE NOT NULL,
    Capacity INT NOT NULL,
    Airline_ID VARCHAR(10) NOT NULL,
    PRIMARY KEY (Aircraft_ID),
    CONSTRAINT fk_aircraft_airline FOREIGN KEY (Airline_ID)
        REFERENCES Airline(Airline_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_aircraft_cap CHECK (Capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Passenger Specialization Table (PK, FK to Aircraft)
CREATE TABLE IF NOT EXISTS Passenger (
    Aircraft_ID VARCHAR(15) NOT NULL,
    Economic_Seats INT NOT NULL DEFAULT 0,
    Business_Seats INT NOT NULL DEFAULT 0,
    PRIMARY KEY (Aircraft_ID),
    CONSTRAINT fk_passenger_aircraft FOREIGN KEY (Aircraft_ID)
        REFERENCES Aircraft(Aircraft_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_seats_non_neg CHECK (Economic_Seats >= 0 AND Business_Seats >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Cargo Specialization Table (PK, FK to Aircraft)
CREATE TABLE IF NOT EXISTS Cargo (
    Aircraft_ID VARCHAR(15) NOT NULL,
    Capacity DECIMAL(10, 2) NOT NULL,
    Hazardous_Goods_Certified BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (Aircraft_ID),
    CONSTRAINT fk_cargo_aircraft FOREIGN KEY (Aircraft_ID)
        REFERENCES Aircraft(Aircraft_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_cargo_capacity CHECK (Capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Flight Table (Core object requiring Gate Allocation)
CREATE TABLE IF NOT EXISTS Flight (
    Flight_ID VARCHAR(15) NOT NULL,
    Scheduled_Departure DATETIME NOT NULL,
    Scheduled_Arrival DATETIME NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    Airline_ID VARCHAR(10) NOT NULL,
    Aircraft_ID VARCHAR(15) NOT NULL,
    PRIMARY KEY (Flight_ID),
    CONSTRAINT fk_flight_airline FOREIGN KEY (Airline_ID)
        REFERENCES Airline(Airline_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_flight_aircraft FOREIGN KEY (Aircraft_ID)
        REFERENCES Aircraft(Aircraft_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_flight_timing CHECK (Scheduled_Arrival > Scheduled_Departure)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Employee Table (Canonical: no email, password_hash, or role columns)
CREATE TABLE IF NOT EXISTS Employee (
    Employee_ID VARCHAR(10) NOT NULL,
    First_Name VARCHAR(50) NOT NULL,
    Middle_Name VARCHAR(50) NULL,
    Last_Name VARCHAR(50) NOT NULL,
    Join_Date DATE NOT NULL,
    Supervisor_Employee_ID VARCHAR(10) NULL,
    PRIMARY KEY (Employee_ID),
    CONSTRAINT fk_emp_supervisor FOREIGN KEY (Supervisor_Employee_ID)
        REFERENCES Employee(Employee_ID) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Employee_Phone_Number Table (Composite PK: Employee_ID, Phone_Number)
CREATE TABLE IF NOT EXISTS Employee_Phone_Number (
    Employee_ID VARCHAR(10) NOT NULL,
    Phone_Number VARCHAR(20) NOT NULL,
    PRIMARY KEY (Employee_ID, Phone_Number),
    CONSTRAINT fk_epn_employee FOREIGN KEY (Employee_ID)
        REFERENCES Employee(Employee_ID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Employee_Flight_Assigned_To Table (Composite PK: Employee_ID, Flight_ID)
CREATE TABLE IF NOT EXISTS Employee_Flight_Assigned_To (
    Employee_ID VARCHAR(10) NOT NULL,
    Flight_ID VARCHAR(15) NOT NULL,
    PRIMARY KEY (Employee_ID, Flight_ID),
    CONSTRAINT fk_efat_employee FOREIGN KEY (Employee_ID)
        REFERENCES Employee(Employee_ID) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_efat_flight FOREIGN KEY (Flight_ID)
        REFERENCES Flight(Flight_ID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Gate_Allocation Table (THE CORE TRANSACTION; Composite PK: Gate_ID, Flight_ID, Allocation_Number)
CREATE TABLE IF NOT EXISTS Gate_Allocation (
    Gate_ID VARCHAR(10) NOT NULL,
    Flight_ID VARCHAR(15) NOT NULL,
    Allocation_Number INT NOT NULL DEFAULT 1,
    Assigned_Time DATETIME NOT NULL,
    Released_Time DATETIME NOT NULL,
    Allocation_Status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    PRIMARY KEY (Gate_ID, Flight_ID, Allocation_Number),
    CONSTRAINT fk_ga_gate FOREIGN KEY (Gate_ID)
        REFERENCES Gate(Gate_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ga_flight FOREIGN KEY (Flight_ID)
        REFERENCES Flight(Flight_ID) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_ga_times CHECK (Released_Time > Assigned_Time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Performance Indexes (Standard MySQL 8.0 DDL syntax)
-- Note: MySQL does not support 'CREATE INDEX IF NOT EXISTS'.
-- Execute these statements when setting up a new database or if the index
-- does not already exist.
-- ============================================================================
CREATE INDEX idx_gate_terminal_status
    ON Gate (Terminal_ID, Status);

CREATE INDEX idx_allocation_window
    ON Gate_Allocation (Gate_ID, Assigned_Time, Released_Time, Allocation_Status);

CREATE INDEX idx_flight_schedule
    ON Flight (Scheduled_Departure, Scheduled_Arrival, Status);

