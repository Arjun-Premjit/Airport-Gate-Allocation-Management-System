# AGAMS Database Specifications & Mapping

This document details the locked 16-table relational schema for AGAMS on MySQL 8.0 / Aiven MySQL.

## Relation Breakdown (16 Tables)

1. **`Airport`**: `(Airport_ID [PK], Name, City, Country, IATA_Code)`
2. **`Airport_Contact_Number`**: `(Airport_ID [PK, FK], Phone_Number [PK])`
3. **`Control_Tower`**: `(Tower_ID [PK], Airport_ID [FK, UNIQUE], Frequency_MHz, Height_m)`
4. **`Terminal`**: `(Terminal_ID [PK], Airport_ID [FK], Name, Number_Of_Floors)`
5. **`Gate`**: `(Gate_ID [PK], Terminal_ID [FK], Gate_Number, Gate_Type, Capacity, Status)`
   - Status values: `'Available'`, `'Occupied'`, `'Reserved'`, `'Maintenance'`, `'Closed'`
6. **`Maintenance_Record`**: `(Record_ID [PK], Gate_ID [FK], Start_Date, End_Date, Description, Cost, Status)`
7. **`Airline`**: `(Airline_ID [PK], Name, IATA_Code, Country, Headquarter_City)`
8. **`Airline_Contact_Number`**: `(Airline_ID [PK, FK], Phone_Number [PK])`
9. **`Aircraft`**: `(Aircraft_ID [PK], Airline_ID [FK], Model, Manufacturer, Total_Capacity, Aircraft_Type)`
   - `Aircraft_Type` in `('Passenger', 'Cargo')`
10. **`Passenger`**: `(Aircraft_ID [PK, FK], Economy_Seats, Business_Seats, First_Class_Seats)`
11. **`Cargo`**: `(Aircraft_ID [PK, FK], Max_Cargo_Weight_Tons, Hazardous_Goods_Certified)`
12. **`Flight`**: `(Flight_ID [PK], Airline_ID [FK], Aircraft_ID [FK], Origin_Airport_ID [FK], Destination_Airport_ID [FK], Scheduled_Departure, Scheduled_Arrival, Flight_Type, Status)`
    - Constraint: `Scheduled_Arrival > Scheduled_Departure`
13. **`Employee`**: `(Employee_ID [PK], Name, Role, Hire_Date, Supervisor_ID [FK to Employee])`
14. **`Employee_Phone_Number`**: `(Employee_ID [PK, FK], Phone_Number [PK])`
15. **`Employee_Flight_Assigned_To`**: `(Employee_ID [PK, FK], Flight_ID [PK, FK], Assignment_Role, Assigned_At)`
16. **`Gate_Allocation`**: `(Allocation_ID [PK], Gate_ID [FK], Flight_ID [FK], Allocation_Number, Assigned_Time, Released_Time, Status)`
    - Constraint: `Released_Time > Assigned_Time`
    - Status values: `'Scheduled'`, `'Active'`, `'Completed'`, `'Cancelled'`
