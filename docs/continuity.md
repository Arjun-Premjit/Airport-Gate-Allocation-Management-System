# AGAMS Continuity & Milestone Log

## 1. Project Overview & Locked Domain Model
- **Product**: Airport Gate Allocation Management System (AGAMS)
- **Primary Core**: Conflict-free allocation of airport gates to flights for specific time windows.
- **Technology Stack**:
  - Frontend: React + TypeScript (Vite, Tailwind CSS, Lucide icons)
  - Backend: Python + FastAPI + SQLAlchemy
  - Database: MySQL (Aiven MySQL / MySQL 8.0 InnoDB, utf8mb4)
- **Roles**:
  - `Airport Head`: Broad operational oversight, analytics, and management.
  - `Gate Manager`: Primary operational role (gates, maintenance, allocations, conflict resolution).
  - `Flight Manager`: Flight operations, airline/aircraft details, employee staffing.

## 2. Locked 16 Tables
1. `Airport`
2. `Airport_Contact_Number`
3. `Control_Tower`
4. `Terminal`
5. `Gate`
6. `Maintenance_Record`
7. `Airline`
8. `Airline_Contact_Number`
9. `Aircraft`
10. `Passenger`
11. `Cargo`
12. `Flight`
13. `Employee`
14. `Employee_Phone_Number`
15. `Employee_Flight_Assigned_To`
16. `Gate_Allocation`

## 3. Milestones Roadmap
- [ ] **M0: Foundation & Schema**: DDL, seed data, core backend models, frontend shell.
- [ ] **M1: Auth & RBAC**: JWT login and role dependencies.
- [ ] **M2: Supporting CRUD**: Gate, Terminal, Flight, Airline, Aircraft, Employee, Maintenance APIs.
- [ ] **M3: Core Gate Allocation**: Available gate lookup, conflict detection engine, allocation transactions.
- [ ] **M4: Operational Dashboard**: Gate status metrics, KPIs, upcoming allocations.
- [ ] **M5: Visual Gate Timeline**: Interactive gate vs time slot allocation chart.
- [ ] **M6: Operational Analytics**: Gate utilization %, allocation volume.
- [ ] **M7: Demo Scenario**: Delta DL404 $\rightarrow$ G14 allocation and AI202 conflict rejection test.
