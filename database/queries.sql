-- ============================================================================
-- AGAMS — Critical Database Queries Proving All 16 Relations
-- Aligned with Canonical 16-Table Schema
-- ============================================================================

-- Database selection: Default local database is `agams_db`.
-- For managed cloud databases like Aiven MySQL, replace with your active service database name (e.g. `defaultdb`).
CREATE DATABASE IF NOT EXISTS agams_db;
USE agams_db;

-- 1. Find Available Gates for a specific flight time window
-- Logic & Operational Strategy:
-- Gate availability is determined by two conditions:
--   a) Base Gate operational condition: Gate.Status must not be 'Maintenance' or 'Closed'.
--      (Note: Historical maintenance records in Maintenance_Record record historical repairs,
--       dates, and costs, while Gate.Status represents the live operational gate state).
--   b) Temporal conflict: Gate must not have an overlapping 'Scheduled' or 'Active' allocation.
-- Scenario: Find available gates in Terminal T2 for 14:00 to 16:00 on upcoming operational date 2026-10-21
SELECT 
    g.Gate_ID,
    g.Terminal_ID,
    t.Terminal_Name,
    g.Gate_Type,
    g.Capacity,
    g.Status AS Base_Status
FROM Gate g
JOIN Terminal t ON g.Terminal_ID = t.Terminal_ID
WHERE g.Status NOT IN ('Maintenance', 'Closed')
  -- Exclude gates with conflicting allocations in the requested window:
  -- existing_start < requested_end AND existing_end > requested_start
  AND g.Gate_ID NOT IN (
      SELECT ga.Gate_ID 
      FROM Gate_Allocation ga
      WHERE ga.Allocation_Status IN ('Scheduled', 'Active')
        AND ga.Assigned_Time < '2026-10-21 16:00:00'
        AND ga.Released_Time > '2026-10-21 14:00:00'
  )
ORDER BY g.Capacity DESC;

-- 2. Detect Overlapping Allocation Conflict for a specific gate and time
-- Conflict definition: existing_start < new_end AND existing_end > new_start
-- Scenario: Check if Gate G14 is already booked between 15:00 and 17:00 on 2026-10-21
SELECT 
    ga.Gate_ID,
    ga.Flight_ID,
    ga.Allocation_Number,
    f.Scheduled_Departure,
    f.Scheduled_Arrival,
    a.Airline_Name,
    ga.Assigned_Time,
    ga.Released_Time,
    ga.Allocation_Status
FROM Gate_Allocation ga
JOIN Flight f ON ga.Flight_ID = f.Flight_ID
JOIN Airline a ON f.Airline_ID = a.Airline_ID
WHERE ga.Gate_ID = 'G14'
  AND ga.Allocation_Status IN ('Scheduled', 'Active')
  AND ga.Assigned_Time < '2026-10-21 17:00:00'
  AND ga.Released_Time > '2026-10-21 15:00:00';

-- 3. Comprehensive Flight Profile (Joins Flight, Airline, Aircraft, Passenger/Cargo, Gate Allocation, Gate, Terminal)
-- Demonstrates total, disjoint specialization (Passenger vs Cargo) and core allocation linkage
SELECT 
    f.Flight_ID,
    al.Airline_Name,
    al.Airline_Code,
    ac.Model AS Aircraft_Model,
    p.Economic_Seats,
    p.Business_Seats,
    c.Capacity AS Cargo_Capacity,
    c.Hazardous_Goods_Certified,
    f.Scheduled_Departure,
    f.Scheduled_Arrival,
    f.Status AS Flight_Status,
    ga.Gate_ID,
    t.Terminal_Name,
    ga.Assigned_Time,
    ga.Released_Time,
    ga.Allocation_Status
FROM Flight f
JOIN Airline al ON f.Airline_ID = al.Airline_ID
JOIN Aircraft ac ON f.Aircraft_ID = ac.Aircraft_ID
LEFT JOIN Passenger p ON ac.Aircraft_ID = p.Aircraft_ID
LEFT JOIN Cargo c ON ac.Aircraft_ID = c.Aircraft_ID
LEFT JOIN Gate_Allocation ga ON f.Flight_ID = ga.Flight_ID AND ga.Allocation_Status IN ('Scheduled', 'Active')
LEFT JOIN Gate g ON ga.Gate_ID = g.Gate_ID
LEFT JOIN Terminal t ON g.Terminal_ID = t.Terminal_ID
WHERE f.Flight_ID = 'DL404';

-- 4. Employee Staffing per Flight (Joins Employee, Supervisor, Phone Number, Employee_Flight_Assigned_To)
-- Demonstrates recursive supervision and multi-valued phone contacts without unapproved role/timestamp columns
SELECT 
    efat.Flight_ID,
    e.Employee_ID,
    CONCAT(e.First_Name, ' ', e.Last_Name) AS Employee_Name,
    CONCAT(sup.First_Name, ' ', sup.Last_Name) AS Supervisor_Name,
    epn.Phone_Number
FROM Employee_Flight_Assigned_To efat
JOIN Employee e ON efat.Employee_ID = e.Employee_ID
LEFT JOIN Employee sup ON e.Supervisor_Employee_ID = sup.Employee_ID
LEFT JOIN Employee_Phone_Number epn ON e.Employee_ID = epn.Employee_ID
WHERE efat.Flight_ID = 'DL404';

-- 5. Gate Status Dashboard Metrics
-- Grouped operational count directly driving dashboard KPIs
SELECT 
    Status,
    COUNT(*) AS Gate_Count
FROM Gate
GROUP BY Status;

-- 6. Gate Utilization Analytical Metric
-- Computes total committed minutes across all active/scheduled/completed allocations (excluding Cancelled),
-- and calculates utilization percentage over a standard 24-hour daily operating baseline (1440 minutes).
SELECT 
    g.Gate_ID,
    t.Terminal_Name,
    COUNT(ga.Allocation_Number) AS Total_Allocations,
    COALESCE(SUM(TIMESTAMPDIFF(MINUTE, ga.Assigned_Time, ga.Released_Time)), 0) AS Total_Allocated_Minutes,
    ROUND(
        (COALESCE(SUM(TIMESTAMPDIFF(MINUTE, ga.Assigned_Time, ga.Released_Time)), 0) / 1440.0) * 100, 
        2
    ) AS Utilization_Percentage_24Hr
FROM Gate g
JOIN Terminal t ON g.Terminal_ID = t.Terminal_ID
LEFT JOIN Gate_Allocation ga ON g.Gate_ID = ga.Gate_ID AND ga.Allocation_Status != 'Cancelled'
GROUP BY g.Gate_ID, t.Terminal_Name
ORDER BY Total_Allocated_Minutes DESC;

