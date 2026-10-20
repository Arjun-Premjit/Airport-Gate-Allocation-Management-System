---
name: verification-matrix
description: Risk-tiered testing matrix for AGAMS. Use before declaring any code change complete.
---

# AGAMS Risk-Tiered Verification Matrix

| Risk Tier | Scope | Required Verification Actions |
| :--- | :--- | :--- |
| **Tier 1: Docs / Styling** | Markdown, comments, CSS | Git diff inspection. Syntax / layout verification. |
| **Tier 2: Single Service** | Non-allocation CRUD (Airline, Employee, Terminal) | Targeted unit tests for the specific router/service. |
| **Tier 3: Allocation / Conflict Engine** | Gate allocation service, conflict checker, maintenance exclusion | 1. Unit & integration tests for overlapping time windows.<br>2. Maintenance gate exclusion test.<br>3. Status transition test.<br>4. Rejection of invalid time windows. |
| **Tier 4: Database Schema / Core Auth** | DDL updates, RBAC, DB connection | 1. DDL syntax & FK integrity check.<br>2. Full test suite run (`pytest backend/tests`).<br>3. Role permission checks (Airport Head, Gate Manager, Flight Manager). |
