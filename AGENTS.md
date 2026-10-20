# AGAMS — FINAL IMPLEMENTATION AND REPAIR SPECIFICATION

## 1. Mission

Complete the existing Airport Gate Allocation Management System (AGAMS) repository. Preserve working functionality, correct the schema mismatches listed below, implement the missing operations, connect the application to the intended Aiven MySQL database, test the system, and prepare it for demonstration.

This is the final implementation phase. Do not respond with another roadmap or audit alone. Inspect the repository, make the required code changes, run tests, fix defects, and document the actual result.

However, **database safety comes before implementation**. Do not perform destructive DDL, overwrite data, reset the database, or run unapproved schema migrations.

Read the existing repository, Git status, `AGENTS.md`, `current-task.md`, `docs/gap_analysis_report.md`, the approved schema specification supplied with this instruction, SQL DDL and seed files, ORM models, backend routers, authentication, database configuration, frontend components, API clients, and available tests.

Continue the existing application rather than rewriting it from scratch.

## 2. Project definition

AGAMS is a focused **Gate Allocation Management System**, not a general Airport Management System.

Its primary workflow is:

1. Select a flight.
2. Obtain the required time interval from the flight schedule.
3. Find suitable gates.
4. Check gate status and relevant restrictions.
5. Check for overlapping allocations on the selected gate.
6. Create the allocation.
7. Track, edit, cancel, and complete allocations.
8. Update the relevant gate details, allocation tables, dashboard, and timeline.

The main objective is conflict-free gate allocation. All supporting entities exist to provide information needed for this workflow.

Do not add passenger booking, ticketing, baggage handling, aircraft mechanical maintenance, runway management, air traffic control, airport security, full HR management, complex AI scheduling, or unrelated enterprise functionality.

## 3. ABSOLUTE SCHEMA AUTHORITY

The approved 16-table schema in this instruction is the final reference for the application.

The latest implementation audit reported substantial differences between that schema and the existing repository. Those differences must be fixed in the application implementation.

**The correct action is to align the code with the approved schema, not to alter the approved schema to accommodate the current code.**

The repository's current `schema.sql` or ORM models may not match the approved design. Do not automatically treat them as correct merely because the application currently runs.

First inspect the approved schema, the checked-in DDL, the ORM models, and the actual database metadata.

If the application code is wrong, correct the code.

If the repository's schema documentation is wrong, update the repository documentation and DDL source files to reflect the approved design, while preserving existing database data.

If the actual Aiven database differs from the approved design, do not run destructive SQL to force it into shape. Produce a data-preserving migration plan, verify the existing records and key relationships, and request authorization before applying any destructive or potentially data-losing database change. Continue with other safe code work in the meantime.

### The following rules are mandatory

- Exactly 16 approved tables.
- No added, removed, or renamed tables.
- No unapproved columns.
- No `AircraftType` or `SubclassType` discriminator.
- Passenger/Cargo specialization remains total and disjoint.
- Preserve all approved primary keys, foreign keys, unique constraints, checks, and composite keys.
- Do not add a standalone `Allocation_ID`.
- Do not add a standalone `Record_ID`.
- Do not add an employee email, password, or role column to `Employee`.
- Do not add assignment-role or assignment-timestamp columns to `Employee_Flight_Assigned_To`.
- Do not add First Class Seats to Passenger.
- Do not rename Cargo.Capacity to a payload-weight field.
- Do not add Flight origin, destination, or flight-type columns.
- Keep the Airport–Control Tower foreign-key direction as specified below.
- Never execute `DROP TABLE`, reset the database, automatically recreate tables, or overwrite existing data as part of application startup.

## 4. Canonical 16-table schema

Use these definitions when auditing and correcting the code. Inspect the approved DDL for exact datatypes, lengths, defaults, nullability, and database-specific constraints.

### 1. `Control_Tower`

- `Tower_ID` — PK
- `Tower_Name`
- `Frequency`
- `Height`

### 2. `Airport`

- `Airport_ID` — PK
- `Airport_Name`
- `Street`
- `City`
- `State`
- `Country`
- `Tower_ID` — FK to `Control_Tower.Tower_ID`, UNIQUE and NOT NULL

The Airport–Control Tower relationship is 1:1. Maintain the approved FK direction.

### 3. `Airport_Contact_Number`

- `Airport_ID` — PK, FK to Airport
- `Contact_Number` — composite PK

Composite PK: `(Airport_ID, Contact_Number)`.

### 4. `Terminal`

- `Terminal_ID` — PK
- `Terminal_Name`
- `Number_Of_Floors`
- `Airport_ID` — FK to Airport

### 5. `Gate`

- `Gate_ID` — PK
- `Gate_Type`
- `Capacity`
- `Status`
- `Terminal_ID` — FK to Terminal

### 6. `Maintenance_Record`

- `Gate_ID` — PK, FK to Gate
- `Record_Number` — composite PK and partial key
- `Maintenance_Date`
- `Description`
- `Cost`

Composite PK: `(Gate_ID, Record_Number)`.

This approved relation has no `Record_ID`, no maintenance start/end interval, and no maintenance-status column. Do not invent these fields.

### 7. `Airline`

- `Airline_ID` — PK
- `Airline_Name`
- `Airline_Code`
- `Headquarters`

### 8. `Airline_Contact_Number`

- `Airline_ID` — PK, FK to Airline
- `Contact_Number` — composite PK

Composite PK: `(Airline_ID, Contact_Number)`.

### 9. `Aircraft`

- `Aircraft_ID` — PK
- `Model`
- `Manufacturer`
- `Manufacturing_Date`
- `Capacity`
- `Airline_ID` — FK to Airline

Aircraft Age is derived and is not stored.

### 10. `Passenger`

- `Aircraft_ID` — PK, FK to Aircraft
- `Economic_Seats`
- `Business_Seats`

No First Class Seats column.

### 11. `Cargo`

- `Aircraft_ID` — PK, FK to Aircraft
- `Capacity`
- `Hazardous_Goods_Certified`

Keep the attribute named `Capacity`.

Passenger and Cargo are disjoint, total specializations of Aircraft. Every aircraft must belong to exactly one subtype.

### 12. `Flight`

- `Flight_ID` — PK
- `Scheduled_Departure`
- `Scheduled_Arrival`
- `Status`
- `Airline_ID` — FK to Airline
- `Aircraft_ID` — FK to Aircraft

No additional Origin Airport, Destination Airport, or Flight Type fields.

Flight Duration is derived and not stored.

### 13. `Employee`

- `Employee_ID` — PK
- `First_Name`
- `Middle_Name` — nullable
- `Last_Name`
- `Join_Date`
- `Supervisor_Employee_ID` — nullable self-referencing FK to Employee

Employee Experience is derived and not stored.

The Employee table contains no Email, Password Hash, or Role columns.

### 14. `Employee_Phone_Number`

- `Employee_ID` — PK, FK to Employee
- `Phone_Number` — composite PK

Composite PK: `(Employee_ID, Phone_Number)`.

### 15. `Employee_Flight_Assigned_To`

- `Employee_ID` — PK, FK to Employee
- `Flight_ID` — composite PK, FK to Flight

Composite PK: `(Employee_ID, Flight_ID)`.

No Assignment Role or Assigned At columns.

### 16. `Gate_Allocation`

- `Gate_ID` — PK, FK to Gate
- `Flight_ID` — composite PK, FK to Flight
- `Allocation_Number` — composite PK and partial key
- `Assigned_Time`
- `Released_Time`
- `Allocation_Status`

Composite PK: `(Gate_ID, Flight_ID, Allocation_Number)`.

There is no standalone Allocation ID. All queries and operations must use the real composite identity.

### Approved relationships

Preserve the finalized relationships:

- Airport–Control Tower: 1:1
- Airport–Terminal: 1:N
- Terminal–Gate: 1:N
- Gate–Maintenance Record: identifying 1:N
- Gate–Gate Allocation: identifying 1:N
- Flight–Gate Allocation: identifying 1:N
- Airline–Flight: 1:N
- Airline–Aircraft: 1:N
- Aircraft–Flight: 1:N
- Employee–Flight: M:N through `Employee_Flight_Assigned_To`
- Employee–Employee: recursive 1:N supervision
- Aircraft–Passenger/Cargo: total, disjoint specialization

The application must meaningfully use all 16 tables, but they do not need 16 separate top-level pages.

## 5. IMMEDIATE PRIORITY — Repair schema drift

Do this before adding further features.

The latest audit reports these problems in the current implementation:

| Area | Incorrect implementation | Required correction |
|---|---|---|
| Gate Allocation | Single `Allocation_ID` primary key | Use `(Gate_ID, Flight_ID, Allocation_Number)` |
| Maintenance Record | `Record_ID`, start/end dates, status | Use `(Gate_ID, Record_Number)` and the five approved columns |
| Employee | Email, Password Hash, Role stored in the relation | Keep Employee limited to the approved schema |
| Employee–Flight bridge | Assignment Role and Assigned At | Use only the two approved key columns |
| Passenger | First Class Seats | Keep Economic Seats and Business Seats |
| Cargo | Max Cargo Weight Tons | Keep Capacity and Hazardous Goods Certified |
| Flight | Origin, Destination, Flight Type | Remove from the application model and payloads |
| Airport/Tower | FK on Control Tower | Put the FK on Airport as specified |

### Repair rules

1. Inspect every affected SQLAlchemy model, Pydantic schema, router, service, frontend type, form, table, seed record, and test.
2. Correct the application code to use the canonical column names and keys.
3. Remove unapproved properties from request/response payloads, data-access logic, and UI components.
4. Update seed scripts only where needed to represent the approved schema. Do not blindly reseed or delete user data.
5. Correct backend joins and ORM relationships to match the approved foreign keys.
6. Ensure composite-key operations correctly address all required key components.
7. Update repository documentation and DDL source files to reflect the canonical schema.
8. Ensure no code path silently relies on the removed columns.
9. Re-run affected tests and build the frontend before starting the next feature phase.
10. Provide a concise list of the discrepancies fixed and any remaining blockers.

Do not merely create a report listing the mismatches. Repair the code.

## 6. Aiven MySQL configuration

The intended runtime database is the existing **Aiven-hosted MySQL database**.

The audit reports that the backend can silently use local SQLite if `DATABASE_URL` is missing. Fix this behavior.

- Inspect the current connection architecture.
- Configure the existing SQLAlchemy integration for MySQL through environment variables.
- Use the project's existing MySQL driver if appropriate.
- Configure SSL/TLS according to the actual Aiven connection settings.
- Update `.env.example` with safe placeholders and setup instructions.
- Never place database credentials in frontend files, source control, logs, or error responses.
- Never silently fall back to SQLite when the intended Aiven configuration is missing.
- Do not run schema recreation, destructive migration, or automatic table creation against Aiven.
- Do not expose the connection URL or credentials in reports.

Verify the actual database connection and inspect the live schema when the necessary credentials are available.

If credentials are not accessible, finish the safe configuration work and explain exactly what remains necessary for the live-connection test. Do not claim an unverified connection succeeded.

If the deployed database schema does not match the approved schema, preserve data and produce a reviewed migration plan rather than forcing changes automatically.

## 7. Authentication without changing the schema

The application requires three roles:

### Airport Head

Broad operational oversight, dashboard, airport/tower, terminals, gates, flights, airlines, aircraft, employees, maintenance, allocations, and analytics.

### Gate Manager

Primary gate-allocation role. Can inspect gates, see availability, create/edit/cancel allocations, inspect allocation history, and manage gate maintenance where authorized.

### Flight Manager

Manages flight-side information, airlines, aircraft, Passenger/Cargo details, and employee–flight assignments. Can view related gate information without gaining unauthorized allocation permissions.

The backend is the security boundary. Frontend navigation and buttons must reflect role permissions, but server-side authorization is mandatory regardless of what the UI displays.

### Authentication schema rule

Do not add authentication columns or a new table to the approved 16-table database.

Inspect the existing authentication code and reuse it where possible. Store login identities, password hashes, and roles in a secure configuration-backed identity mapping that refers to existing Employee IDs. Use environment variables or a safe, ignored local configuration file; keep secrets out of the repository. `.env.example` should include placeholders only.

Use proper password hashing, signed JWT tokens, expiration, and backend role checks.

Keep the existing demo-login workflow if it is secure enough for the intended development/demo environment. Do not introduce a production authentication platform or additional permission tables.

The role name should be **Airport Head**, not Station Head, unless an existing mapping is explicitly documented.

If a safe authentication implementation is impossible under the current setup, explain the precise blocker instead of modifying the schema without permission.

## 8. Finish the core allocation workflow

Preserve the working allocation creation and conflict-detection logic where possible, but adapt it to the approved schema and test it.

### Creating an allocation

- Select a flight.
- Populate the proposed interval using that flight's scheduled departure and arrival.
- Retrieve eligible gates.
- Exclude gates that are Closed or marked Maintenance.
- Validate the requested interval.
- Check for conflicts on the same gate.
- Apply gate-type compatibility only using the conventions supported by existing data.
- Apply capacity validation only when the capacity fields have compatible and documented meanings.
- Create the allocation transactionally.
- Refresh the gate, allocation, dashboard, and timeline views.

The frontend may help the user choose an available gate, but the backend must repeat all important validations.

### Conflict rule

Two allocations on the same gate conflict when:

`existing_start < new_end AND existing_end > new_start`

Therefore, 14:00–16:00 conflicts with 15:00–17:00 on the same gate. Adjacent allocations such as 14:00–16:00 and 16:00–18:00 do not overlap.

Cancelled allocations must not block new allocations. Completed allocations must remain available for history.

Validate:

- Gate and flight existence.
- Valid timestamps.
- `Released_Time > Assigned_Time`.
- Gate availability.
- Conflicting allocations.
- Any applicable type or capacity restriction.

Return a structured HTTP 409 conflict response for overlapping assignments, with a user-readable message identifying the conflicting gate, flight, and interval.

### Transaction safety

Allocation creation and editing must use proper transactions. Protect against concurrent requests that could otherwise both pass the same availability check.

A failed allocation or edit must leave the database unchanged. Use parameterized queries or the ORM.

### Editing and cancellation

Implement the missing edit workflow:

- Change the selected gate and/or allocation interval.
- Re-run all relevant validations.
- Exclude the allocation being edited from its own overlap check.
- Identify the allocation using the composite key.
- Preserve the original allocation if the edit fails.
- Refresh affected interface views when the edit succeeds.

Cancellation should update the allocation status rather than erase history.

Ensure the gate status is not incorrectly reset to Available if another commitment or a Closed/Maintenance state still applies.

### Gate status

Support the intended statuses: Available, Reserved, Occupied, Maintenance, and Closed, subject to the exact allowed values in the existing database.

Choose a coherent status-management strategy and document it. A future allocation generally implies Reserved; a current allocation generally implies Occupied. Maintenance and Closed must take precedence over routine allocation updates.

Do not allow cancellation or completion to overwrite a legitimate Maintenance or Closed status.

The schema does not contain maintenance intervals or a maintenance-status column. Use the Gate status for the current operational condition and Maintenance_Record for the historical date, description, and cost. Do not invent unsupported maintenance intervals or treat every historical record as indefinitely active.

## 9. Supporting record-management operations

The current audit reports that several supporting records are read-only in the UI. Finish the practical create/edit functions necessary for the project without expanding the schema.

### Gates

- List, inspect, create, and edit gates.
- Show terminal, gate type, capacity, status, relevant allocations, and maintenance history.
- Support terminal/status/type filters and free-text search.
- Validate referenced terminals.
- Prevent unsafe deletion of gates with dependent allocations or maintenance records.

### Flights

- List, inspect, create, and edit flights.
- Show airline, aircraft, scheduled departure/arrival, status, current allocation, and assigned employees.
- Support free-text search and useful airline/status filters.
- Validate airline and aircraft references and scheduled times.
- Do not introduce origin/destination or flight-type fields.

### Terminals

Show terminal information and grouped gates. Support practical creation/editing with a valid airport reference.

### Airlines

Show airline details, contact numbers, associated flights, and owned aircraft. Support appropriate create/edit operations and contact management within the airline view.

### Aircraft

Show common aircraft information, owning airline, and exactly the applicable Passenger or Cargo subtype. Support creation and editing using the approved columns only.

Enforce disjoint, total specialization through application validation and transactional handling, while preserving the existing database constraints. Do not add a discriminator column.

### Employees

Show employee name, Join Date, derived Experience, phone numbers, supervisor, and flight assignments. Support practical employee/contact editing and employee–flight assignment management.

Use `Employee_Flight_Assigned_To` exactly as defined. Do not add staffing roles or assignment timestamps to it.

### Airport and Control Tower

Provide compact information views that display airport address, airport contact numbers, and its associated tower details. These are contextual views rather than large independent dashboards.

### Maintenance

Show Gate ID, Record Number, Maintenance Date, Description, and Cost. Provide the maintenance operations needed by the workflow using the approved columns only.

A maintenance action may change Gate.Status to Maintenance. Ending maintenance may restore an appropriate status after validation. The maintenance record itself cannot store a completion status under the approved schema.

### CRUD safety

Preserve referential integrity. Do not silently cascade-delete historical allocation or employee-flight records. When deletion is unsafe, reject it and explain the reason.

Do not build a separate oversized CRUD dashboard for each of the 16 tables. Multi-valued contact records and Passenger/Cargo details belong within their parent entity workflows.

## 10. Dashboard and timeline

### Dashboard

Use actual database data, not hardcoded counts.

Display useful operational information such as:

- Total gates.
- Available, Reserved, Occupied, Maintenance, and Closed gates.
- Upcoming flights or allocations.
- Allocation information by flight, gate, terminal, time, and status.
- Relevant allocation and maintenance summaries.

Ensure KPI calculations follow the chosen gate-status strategy. Do not report a gate as Available when it is Closed or under Maintenance.

### Timeline

Retain the existing gate allocation timeline and verify its correctness. It should show gates against actual allocation intervals over the established 06:00–22:00 operating window, with date and terminal filtering.

Edits, cancellations, and new allocations must be reflected accurately. Do not redesign the timeline without a demonstrated need.

### Analytics

Keep analytics limited to a few useful metrics, such as gate utilization, allocation counts, most-used gates, and maintenance workload.

Prefer compact tables and operational summaries. Avoid adding unnecessary charts or new dashboard modules.

## 11. Search, filters, and role-aware navigation

The current audit says the following are missing or incomplete:

1. Role-filtered sidebar navigation.
2. Allocation editing.
3. Flight and Gate creation/editing.
4. Free-text search.
5. Basic table sorting.
6. Addressable detail routes.

Complete these in order of importance while preserving existing working components.

Add text search to Gates, Flights, and Allocations. Search should work alongside existing terminal, status, and airline filters. Add basic sorting where appropriate.

Provide sensible loading, empty, error, validation, success, and confirmation states. Explain conflicts in normal user-readable language instead of showing raw SQL errors.

Filter the sidebar by role, while retaining necessary read-only access to contextual information. The backend must still enforce every protected operation.

Implement directly addressable detail routes for important records—especially gates, flights, and allocations—where they fit the existing routing system. Existing drawers may remain where they offer a good user workflow. Ensure refresh and deep-link behavior work properly for routes that are added.

Do not rewrite the design system or the existing landing-page animation just to make changes look new.

## 12. Design requirements

Preserve the current professional aviation-operations aesthetic:

- Dark-first interface with a light theme available.
- Restrained emerald primary color.
- Teal and blue analytical accents.
- Neutral foundation and readable contrast.
- Six-point spacing rhythm.
- Subtle borders and shadows.
- Moderate corner radii.
- Consistent typography, spacing, and tables.
- No excessive pills, decorative badges, or unrelated visualizations.

The interface should feel like practical operations software, not a generic flashy SaaS template.

Inspect whether the current repository uses React with JavaScript or TypeScript. Continue with the established working stack. Do not conduct an unrequested wholesale conversion.

## 13. Backend architecture and error handling

Retain the existing FastAPI router/service/data-access structure where practical.

Provide coherent APIs for:

- Authentication and current user.
- Airport and tower.
- Terminals and gates.
- Available-gate lookup.
- Maintenance.
- Airlines and contact numbers.
- Aircraft and Passenger/Cargo details.
- Flights.
- Employees and employee–flight assignments.
- Allocations and allocation timeline.
- Dashboard and analytics.

Complete missing endpoints for allocation modification and relevant supporting record management.

Use the existing ORM and Pydantic conventions. Keep validation centralized where practical, but never rely solely on frontend checks.

Use appropriate HTTP responses for validation failures, authentication/authorization failures, missing records, and allocation conflicts. Avoid unsafe query construction. Return structured errors that can be rendered clearly by the frontend.

## 14. Critical regression tests

Do not mark a feature complete merely because the code compiles.

### Database and schema

- Verify the Aiven connection when credentials are available.
- Verify the 16 approved tables.
- Confirm primary keys, foreign keys, composite keys, unique constraints, and important checks.
- Confirm models and queries no longer refer to unapproved columns.
- Confirm no 17th table or schema changes were introduced.
- Confirm existing data is preserved.
- Confirm derived Age, Duration, and Experience are not stored as new columns.

### Allocation

- Valid allocation succeeds.
- Overlapping allocation on the same gate is rejected.
- Adjacent time intervals are accepted.
- Different gates can be allocated over overlapping intervals.
- Closed gates are rejected.
- Maintenance gates are rejected.
- Invalid timestamps are rejected.
- Cancelled allocations no longer block future requests.
- Completed/history data is preserved.
- Editing an allocation does not conflict with itself.
- Editing into another allocation's time window is rejected.
- A failed edit leaves the original data intact.
- Concurrent requests cannot reserve the same gate for overlapping time windows.

### Security

- Invalid login is rejected.
- Protected API calls reject unauthenticated requests.
- Gate Manager permissions work as designed.
- Flight Manager cannot bypass restricted operations by calling APIs directly.
- Airport Head has the intended broader permissions.
- UI links/actions match backend permissions.

### Supporting entities

Test airport/tower relationships, terminal/gate grouping, airline and aircraft references, Passenger/Cargo display, employee supervision, multiple contact numbers, employee–flight assignment, and maintenance history.

### Frontend and integration

- Every main page loads.
- All important operations display correct errors and success feedback.
- Search and filters work together.
- Dashboard and timeline reflect changed records.
- Deep-link routes added by this phase survive refresh.
- No critical frontend console errors remain.
- Backend tests and frontend build pass.

Use the existing test framework. Run real tests and record their results. Clearly mark any test blocked by unavailable external credentials or services.

## 15. Canonical demo scenario

Use the established project demonstration:

- Airline: Delta.
- Flight: DL404.
- Aircraft: Passenger subtype.
- Gate: G14.
- Allocation: 14:00–16:00.
- Conflicting flight: AI202, 15:00–17:00.

Demonstrate:

1. Login as Gate Manager.
2. Open DL404 and show airline, aircraft, and flight times.
3. Start a new allocation.
4. Show suitable available gates.
5. Allocate DL404 to G14.
6. Show the allocation in the list, Gate details, dashboard, and timeline.
7. Attempt to allocate AI202 to G14 for 15:00–17:00.
8. Show the rejection with an understandable conflict message.
9. Confirm the original allocation remains intact.

Use existing data wherever possible. Do not overwrite or delete user records to prepare the demo.

If the seeded dates do not match the timeline's chosen date, choose an appropriate date through a safe test fixture or a non-destructive demo setup.

## 16. Documentation and delivery

Update the actual repository documentation to match the delivered implementation.

- README with installation, configuration, run instructions, and demo steps.
- `.env.example` containing safe placeholders.
- Database documentation with the approved 16-table schema and constraints.
- API documentation listing actual endpoints and permissions.
- Architecture documentation.
- Test summary.
- Demo guide.
- Updated gap analysis showing completed, incomplete, blocked, and unverified items.

Do not document functionality that does not exist or claim tests passed when they were not run.

## 17. Work order — follow this sequence

### Priority 0: Protect the project

Inspect Git status, repository changes, database configuration, and data. Do not overwrite uncommitted user work, drop tables, reset the database, or run destructive migrations.

### Priority 1: Fix schema drift

Correct the ORM models, API models, services, routers, seeds, frontend types, and UI to match the approved 16-table schema.

Resolve the eight schema mismatches listed in Section 5. Run tests and build immediately after this repair phase.

### Priority 2: Verify database connectivity

Configure Aiven MySQL without silently falling back to SQLite. Verify the actual connection and schema when credentials are available. Preserve all data.

### Priority 3: Finish allocation operations

Implement allocation editing, correct composite-key handling, safe cancellation/status changes, transaction safety, and regression tests.

### Priority 4: Complete supporting CRUD and access

Implement the practical Gate and Flight create/edit operations, necessary supporting CRUD, role-filtered navigation, and correct backend authorization.

### Priority 5: Complete search and routing

Implement free-text search, basic sorting, and necessary detail routes.

### Priority 6: Verify dashboard, timeline, and polish

Ensure the interface reflects real data consistently and handles loading, empty, error, and confirmation states.

### Priority 7: Run the full test suite and prepare the demo

Execute backend tests, frontend tests available in the repository, and the production build. Run the canonical demo scenario and update documentation with actual results.

## 18. Rules for every change

1. Inspect the existing code before modifying it.
2. Use the approved 16-table schema as the source of truth.
3. Repair code rather than redesigning the database.
4. Preserve existing data and uncommitted work.
5. Never run destructive DDL without explicit approval.
6. Do not silently add columns, tables, identifiers, or attributes.
7. Reuse functioning components.
8. Make minimal, coherent changes.
9. Keep the application within AGAMS scope.
10. Do not silently swallow errors.
11. Do not claim successful verification without execution evidence.
12. If an external credential is missing, complete all safe work and identify the exact blocker.

## 19. Definition of done

The application is finished when:

- The approved 16-table design is preserved.
- The code no longer depends on unapproved schema fields.
- The intended Aiven connection is verified, or a precise external blocker is documented.
- Authentication and three role permissions function correctly.
- Gate allocation creation, editing, cancellation, and conflict checks work.
- Maintenance and Closed gates cannot be allocated.
- Gate, Flight, and relevant supporting records can be managed safely.
- The 16 tables are all meaningfully used.
- Search, filters, role-aware navigation, and essential detail routes work.
- Dashboard, timeline, and analytics use consistent database data.
- Relevant backend tests and frontend builds pass.
- The canonical demo scenario is reproducible.
- Documentation reflects the actual final application.

## Final instruction

Start with Priority 0 and Priority 1. **Fix the implementation to match the approved 16-table schema before proceeding with additional feature work.**

Then continue through the work order and deliver the working application.

At completion, report:
- Files changed.
- Schema mismatches repaired.
- Features completed.
- Tests executed and results.
- Live database verification status.
- Remaining blockers or limitations.

Do not stop after creating another plan. Implement, test, and document the real result.
