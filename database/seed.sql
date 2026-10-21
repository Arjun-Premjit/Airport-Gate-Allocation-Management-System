-- ============================================================================
-- AGAMS — Canonical Seed Data (Locked 16-Table Relational Schema)
-- ============================================================================

-- 1. Control Towers
INSERT INTO Control_Tower (Tower_ID, Tower_Name, Frequency, Height) VALUES
('TWR-DXB', 'Dubai Air Traffic Control Tower', 118.750, 87.00),
('TWR-BOM', 'Mumbai Air Traffic Control Tower', 119.100, 85.00),
('TWR-LHR', 'Heathrow Air Traffic Control Tower', 118.700, 87.00);

-- 2. Airports (Tower_ID FK to Control_Tower)
INSERT INTO Airport (Airport_ID, Airport_Name, Street, City, State, Country, Tower_ID) VALUES
('DXB', 'Dubai International Airport', 'Airport Road', 'Dubai', 'Dubai', 'United Arab Emirates', 'TWR-DXB'),
('BOM', 'Chhatrapati Shivaji Maharaj International Airport', 'Sahar Road', 'Mumbai', 'Maharashtra', 'India', 'TWR-BOM'),
('LHR', 'Heathrow Airport', 'Longford', 'London', 'Greater London', 'United Kingdom', 'TWR-LHR');

-- 3. Airport Contacts
INSERT INTO Airport_Contact_Number (Airport_ID, Contact_Number) VALUES
('DXB', '+971-4-224-5555'),
('DXB', '+971-4-216-2525'),
('BOM', '+91-22-66851010'),
('LHR', '+44-844-335-1801');

-- 4. Terminals
INSERT INTO Terminal (Terminal_ID, Terminal_Name, Number_Of_Floors, Airport_ID) VALUES
('T1', 'Terminal 1 - Domestic & Regional', 3, 'DXB'),
('T2', 'Terminal 2 - International Concourse', 4, 'DXB');

-- 5. Gates (G01 to G18)
INSERT INTO Gate (Gate_ID, Gate_Type, Capacity, Status, Terminal_ID) VALUES
('G01', 'Passenger', 220, 'Available',   'T1'),
('G02', 'Passenger', 250, 'Occupied',    'T1'),
('G03', 'Passenger', 240, 'Maintenance', 'T1'),
('G04', 'Passenger', 220, 'Available',   'T1'),
('G05', 'Passenger', 280, 'Reserved',    'T1'),
('G06', 'Cargo',     100, 'Available',   'T1'),
('G07', 'Hybrid',    300, 'Closed',      'T1'),
('G08', 'Passenger', 250, 'Available',   'T1'),
('G09', 'Passenger', 260, 'Available',   'T1'),
('G10', 'Passenger', 320, 'Available',   'T2'),
('G11', 'Passenger', 350, 'Occupied',    'T2'),
('G12', 'Passenger', 300, 'Available',   'T2'),
('G13', 'Passenger', 340, 'Available',   'T2'),
('G14', 'Passenger', 320, 'Available',   'T2'),
('G15', 'Passenger', 380, 'Reserved',    'T2'),
('G16', 'Cargo',     150, 'Available',   'T2'),
('G17', 'Passenger', 420, 'Available',   'T2'),
('G18', 'Hybrid',    400, 'Available',   'T2');

-- 6. Maintenance Records
INSERT INTO Maintenance_Record (Gate_ID, Record_Number, Maintenance_Date, Description, Cost) VALUES
('G03', 1, '2026-10-10 08:00:00', 'Jet bridge hydraulic overhaul', 14500.00),
('G07', 1, '2026-10-01 06:00:00', 'Gate software and floor resurfacing', 32000.00);

-- 7. Airlines
INSERT INTO Airline (Airline_ID, Airline_Name, Airline_Code, Headquarters) VALUES
('DAL', 'Delta Air Lines', 'DL', 'Atlanta, Georgia'),
('AIC', 'Air India', 'AI', 'New Delhi, India'),
('UAE', 'Emirates', 'EK', 'Dubai, United Arab Emirates');

-- 8. Airline Contacts
INSERT INTO Airline_Contact_Number (Airline_ID, Contact_Number) VALUES
('DAL', '+1-800-221-1212'),
('AIC', '+91-124-264-1407'),
('UAE', '+971-600-555555');

-- 9. Aircraft
INSERT INTO Aircraft (Aircraft_ID, Model, Manufacturer, Manufacturing_Date, Capacity, Airline_ID) VALUES
('AC-DAL-101', 'A320-200', 'Airbus', '2018-05-20', 170, 'DAL'),
('AC-AIC-301', 'A350-900', 'Airbus', '2020-02-14', 304, 'AIC'),
('AC-UAE-401', 'B777-200F', 'Boeing', '2019-08-10', 102, 'UAE');

-- 10. Passenger & Cargo Subtypes
INSERT INTO Passenger (Aircraft_ID, Economic_Seats, Business_Seats) VALUES
('AC-DAL-101', 150, 20),
('AC-AIC-301', 264, 40);

INSERT INTO Cargo (Aircraft_ID, Capacity, Hazardous_Goods_Certified) VALUES
('AC-UAE-401', 102.80, TRUE);

-- 11. Flights
INSERT INTO Flight (Flight_ID, Scheduled_Departure, Scheduled_Arrival, Status, Airline_ID, Aircraft_ID) VALUES
('DL404', '2026-10-21 14:00:00', '2026-10-21 16:00:00', 'Scheduled', 'DAL', 'AC-DAL-101'),
('AI202', '2026-10-21 15:00:00', '2026-10-21 17:00:00', 'Scheduled', 'AIC', 'AC-AIC-301'),
('EK901', '2026-10-21 18:00:00', '2026-10-21 21:00:00', 'Scheduled', 'UAE', 'AC-UAE-401');

-- 12. Employees
INSERT INTO Employee (Employee_ID, First_Name, Middle_Name, Last_Name, Join_Date, Supervisor_Employee_ID) VALUES
('EMP001', 'Jonathan', 'Edward', 'Vance', '2019-01-15', NULL),
('EMP002', 'Marcus', 'Alexander', 'Reed', '2021-03-20', 'EMP001'),
('EMP003', 'Sarah', NULL, 'Jenkins', '2021-07-10', 'EMP001'),
('EMP004', 'Ravi', NULL, 'Sharma', '2022-11-01', 'EMP002'),
('EMP005', 'Priya', NULL, 'Patel', '2023-04-15', 'EMP002');

-- 13. Employee Phone Numbers
INSERT INTO Employee_Phone_Number (Employee_ID, Phone_Number) VALUES
('EMP001', '+1-212-555-0101'),
('EMP002', '+1-212-555-0102'),
('EMP003', '+1-212-555-0103'),
('EMP004', '+1-212-555-0104'),
('EMP005', '+1-212-555-0105');

-- 14. Employee Flight Assignments
INSERT INTO Employee_Flight_Assigned_To (Employee_ID, Flight_ID) VALUES
('EMP004', 'DL404'),
('EMP005', 'DL404');

-- 15. Initial Gate Allocations
INSERT INTO Gate_Allocation (Gate_ID, Flight_ID, Allocation_Number, Assigned_Time, Released_Time, Allocation_Status) VALUES
('G02', 'DL404', 1, '2026-10-21 08:30:00', '2026-10-21 11:45:00', 'Completed'),
('G05', 'EK901', 1, '2026-10-21 17:30:00', '2026-10-21 21:30:00', 'Scheduled');

