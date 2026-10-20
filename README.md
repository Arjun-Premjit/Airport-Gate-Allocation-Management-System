# AGAMS — Airport Gate Allocation Management System

AGAMS is a dedicated Gate Allocation Management System built on the canonical 16-table relational schema (MySQL 8.0 InnoDB), a Python FastAPI REST backend, and a React + TypeScript frontend.

The central mission of AGAMS is **conflict-free allocation of airport gates to flights for specific time windows**, accounting for gate maintenance, operational status, and terminal concourse structure.

---

## 1. Quick Start

### Backend Setup (FastAPI)
```bash
# Navigate to repository root
cd "c:\ARJUN\VIT\SEM 3\DBMS\AGAMS PROJECT"

# Install backend dependencies
pip install -r backend/requirements.txt

# Start backend server
python -m uvicorn backend.app.main:app --reload --port 8000
```
- Swagger API Documentation: `http://localhost:8000/docs`  
- Health Check: `http://localhost:8000/api/health`

### Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Frontend Operations Console: `http://localhost:5173`

---

## 2. Demo User Accounts (Configuration-Backed Identity Store)

Per AGENTS.md Section 7, authentication identities and roles are managed via secure configuration referencing canonical `Employee_ID` records without adding unapproved columns to the `Employee` table.

All demo accounts have password: `password123` (or 1-click button on login screen)

| Role | Email | Employee Ref | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **Airport Head** | `head@agams.airport` | `EMP001` | Broad operational oversight, all modules, KPI dashboards, analytics. |
| **Gate Manager** | `gate.mgr@agams.airport` | `EMP002` | Main operational role: allocate gates, in-place edits, resolve conflicts, maintenance. |
| **Flight Manager** | `flight.mgr@agams.airport` | `EMP003` | Flight schedules, aircraft specialization, ground crew staffing. |

---

## 3. The Canonical Demo Scenario

The master demo scenario proves conflict detection and transactional integrity:

1. **Login as Gate Manager**:
   - Go to `http://localhost:5173/login`, click **Gate Manager** quick login.
2. **Review Available Gates**:
   - Open **Operations $\rightarrow$ Gate Allocation**.
   - Click **New Allocation**.
   - Select **Flight DL404** (Delta Air Lines, scheduled 14:00 to 16:00).
   - System automatically queries `/api/gates/available` and returns **Gate G14** in Terminal 2 (excludes G03 because it is under maintenance, and G07 because it is closed).
3. **Allocate Gate G14**:
   - Select Gate G14 and click **Confirm Allocation**.
   - Allocation `G14_DL404_1 (14:00 - 16:00)` is created. Gate status transitions to `Reserved`.
4. **Demonstrate Conflict Detection**:
   - Click **New Allocation** again.
   - Select **Flight AI202** (Air India).
   - Attempt to allocate **Gate G14** between **15:00 and 17:00** (overlapping with DL404 14:00–16:00).
   - **System Immediately Rejects with HTTP 409 Conflict**:
     > `Gate G14 is already allocated to Flight DL404 from 14:00 to 16:00.`
5. **Inspect Visual Gate Timeline**:
   - Navigate to **Operations $\rightarrow$ Gate Timeline** to see the colored allocation blocks across the time grid (06:00 to 22:00).
6. **In-Place Allocation Editing**:
   - In **Gate Allocations**, click the Edit icon on an allocation to adjust its window or stand without conflicting with itself.

---

## 4. Canonical 16 Database Relations (Locked Schema)

Every table has a distinct operational purpose and matches the canonical schema:

1. **`Control_Tower`**: Air traffic control tower VHF frequency and height (`Tower_ID`, `Tower_Name`, `Frequency`, `Height`).
2. **`Airport`**: Airport geographic context and 1:1 link to tower (`Airport_ID`, `Airport_Name`, `Street`, `City`, `State`, `Country`, `Tower_ID` FK).
3. **`Airport_Contact_Number`**: Multi-valued telephone lines for airport operations (`Airport_ID`, `Contact_Number`).
4. **`Terminal`**: Organizes gates into concourses (`Terminal_ID`, `Terminal_Name`, `Number_Of_Floors`, `Airport_ID`).
5. **`Gate`**: Core allocatable resource with type, capacity, and status (`Gate_ID`, `Gate_Type`, `Capacity`, `Status`, `Terminal_ID`).
6. **`Maintenance_Record`**: Explains gate servicing events (`Gate_ID`, `Record_Number`, `Maintenance_Date`, `Description`, `Cost`).
7. **`Airline`**: Carriers operating flights (`Airline_ID`, `Airline_Name`, `Airline_Code`, `Headquarters`).
8. **`Airline_Contact_Number`**: Multi-valued carrier contact information (`Airline_ID`, `Contact_Number`).
9. **`Aircraft`**: Fleet superclass with model, manufacturer, manufacturing date, and capacity (`Aircraft_ID`, `Model`, `Manufacturer`, `Manufacturing_Date`, `Capacity`, `Airline_ID`). Derived Age.
10. **`Passenger`**: Disjoint specialization subtype for passenger seat configuration (`Aircraft_ID`, `Economic_Seats`, `Business_Seats`).
11. **`Cargo`**: Disjoint specialization subtype for freight capacity and Hazmat certification (`Aircraft_ID`, `Capacity`, `Hazardous_Goods_Certified`).
12. **`Flight`**: Core object needing a gate; links airline, aircraft, and schedule (`Flight_ID`, `Scheduled_Departure`, `Scheduled_Arrival`, `Status`, `Airline_ID`, `Aircraft_ID`). Derived Duration.
13. **`Employee`**: Airport personnel with recursive supervisor hierarchy (`Employee_ID`, `First_Name`, `Middle_Name`, `Last_Name`, `Join_Date`, `Supervisor_Employee_ID`). Derived Experience.
14. **`Employee_Phone_Number`**: Multi-valued contact numbers for staff (`Employee_ID`, `Phone_Number`).
15. **`Employee_Flight_Assigned_To`**: M:N bridge assigning staff members to flights (`Employee_ID`, `Flight_ID`).
16. **`Gate_Allocation`**: Core transaction connecting Gate to Flight with composite key (`Gate_ID`, `Flight_ID`, `Allocation_Number`, `Assigned_Time`, `Released_Time`, `Allocation_Status`).

---

## 5. Connecting Live Aiven MySQL

To connect your live Aiven MySQL instance:
1. Create a `.env` file (see `.env.example`):
```env
DATABASE_URL=mysql+pymysql://avnadmin:YOUR_PASSWORD@YOUR_AIVEN_HOST:YOUR_PORT/defaultdb?ssl_ca=ca.pem
```
2. The backend connects securely using PyMySQL with SSL/TLS.
3. Automatic schema drops and destructive migrations are permanently disabled to protect database safety.
4. Run tests with `python -m pytest backend/tests/test_allocations.py -v`.
