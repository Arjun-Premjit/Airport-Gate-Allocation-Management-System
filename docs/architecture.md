# AGAMS System Architecture

## 1. Domain Architecture

```
                    AIRPORT (1)
                   /     |     \
   (1:M) CONTACT_NUM  (1:1)TOWER (1:M) TERMINAL
                                        │ (1:M)
                                       GATE
                                      /    \
                 (1:M) MAINTENANCE_REC      GATE_ALLOCATION (1:M)
                                                   │ (M:1)
                                                 FLIGHT
                                                /      \
                                     (M:1) AIRLINE    (M:1) AIRCRAFT
                                            │                │ (1:1)
                                      CONTACT_NUM      PASSENGER / CARGO
                                            │
                                    EMPLOYEE_ASSIGNMENT (M:N)
                                            │
                                        EMPLOYEE
                                       /        \
                            PHONE_NUM            SUPERVISOR (1:M Recursive)
```

## 2. Component Stack

- **Client Layer (`frontend/`)**:
  - React 18 / TypeScript / Vite
  - Tailwind CSS for technical, dark-first UI palette (emerald brand, slate foundation, teal/blue accents)
  - TanStack Query / Axios for REST API interaction
  - Lucide React for crisp operational icons
- **Server Layer (`backend/`)**:
  - FastAPI (Python 3.10+)
  - SQLAlchemy 2.0 ORM with PyMySQL / asyncmy
  - Pydantic v2 data transfer schemas
  - JWT Authentication + Role-Based Access Control
- **Database Layer (`database/`)**:
  - Aiven MySQL / MySQL 8.0
  - Engine: InnoDB with strict foreign keys and check constraints
  - Collation: `utf8mb4_unicode_ci`

## 3. Allocation Conflict Rule Engine
When an allocation for `Gate_ID`, `Assigned_Time`, and `Released_Time` is requested:
1. Verify `Assigned_Time < Released_Time`.
2. Verify gate is NOT in `Maintenance` or `Closed` status.
3. Check for any existing active/scheduled allocation on the same gate where:
   `existing.Assigned_Time < new.Released_Time AND existing.Released_Time > new.Assigned_Time`
4. If an overlap is detected, raise HTTP 409 with details of the conflicting flight and time span.
