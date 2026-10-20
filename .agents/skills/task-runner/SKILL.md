---
name: task-runner
description: Standardized execution procedure for AGAMS tasks. Use when executing multi-step repository work.
---

# AGAMS Task Execution Protocol

Follow this structured workflow for development tasks:

## Phase 1: Orient & Discover
1. Inspect Git status: `git status -s`.
2. Inspect active task: Read `docs/current-task.md`.
3. Locate relevant code using `find_by_name` and `grep_search`.

## Phase 2: Hypothesis & Plan
1. Ensure the change respects the 18 locked AGAMS rules.
2. Ensure gate allocation business validation is preserved:
   - Check time window validity (`assigned_time < released_time`).
   - Prevent overlapping gate allocations.
   - Prevent allocations to gates with `Status = 'Maintenance'` or `Status = 'Closed'`.
3. Update `docs/current-task.md`.

## Phase 3: Implement
1. Read target files with `view_file` (bounded line ranges).
2. Modify using `replace_file_content`.

## Phase 4: Verify
1. Run local tests: `pytest` or `npm test`.
2. Verify database constraints and response codes.

## Phase 5: Handoff
1. Review git diff: `git diff --stat`.
2. Update `docs/current-task.md` with verified outcomes and next actions.
