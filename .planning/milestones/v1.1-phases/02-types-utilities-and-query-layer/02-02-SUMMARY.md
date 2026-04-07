---
phase: 02-types-utilities-and-query-layer
plan: "02"
subsystem: database-schema
tags: [migration, drizzle, sqlite, vue-router, compendium]
dependency_graph:
  requires: []
  provides: [migration-v3, family-column, compendium-route]
  affects: [src/lib/migrations.ts, src/lib/schema.ts, src/router/index.ts]
tech_stack:
  added: []
  patterns: [stored-generated-column-with-table-recreation, drizzle-index-registration]
key_files:
  created:
    - src/views/CompendiumView.vue
    - src/views/__tests__/CompendiumView.test.ts
  modified:
    - src/lib/migrations.ts
    - src/lib/schema.ts
    - src/router/index.ts
decisions:
  - "Used $.system.details.family JSON path at MEDIUM confidence per CONTEXT.md — spot-check against live DB should occur before Phase 03 filtering work"
  - "No sidebar link added for /compendium in this plan — locked decision per UI-SPEC to defer to Phase 04"
metrics:
  duration: "2m 2s"
  completed_date: "2026-03-20"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 5
---

# Phase 02 Plan 02: Migration v3 Family Column + CompendiumView Stub Summary

Migration v3 adds a STORED `family` generated column via table recreation pattern, recreating all 8 indexes, with matching Drizzle schema update and a minimal CompendiumView placeholder registered at `/compendium`.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Migration v3 family STORED column + Drizzle schema | 053724a | src/lib/migrations.ts, src/lib/schema.ts |
| 2 | CompendiumView stub + route registration + smoke test | af601a7 | src/views/CompendiumView.vue, src/router/index.ts, src/views/__tests__/CompendiumView.test.ts |

## What Was Built

**Migration v3 (`family_generated_column`):** Appended to the MIGRATIONS array in `src/lib/migrations.ts`. Uses the same table-recreation pattern as v2: create `pf2e_entities_new` with all prior columns plus the new `family TEXT GENERATED ALWAYS AS (json_extract(raw_data, '$.system.details.family')) STORED` column, copy data, drop old table, rename. All 7 prior indexes (4 from v1, 3 from v2) are recreated along with the new `idx_family` — 8 index statements total, 12 SQL statements in the migration array.

**Drizzle schema (`src/lib/schema.ts`):** `family` generated column and `idxFamily` index added to `pf2eEntities` table definition, mirroring the DDL in migration v3.

**CompendiumView (`src/views/CompendiumView.vue`):** Minimal template-only component with a single `<h1 class="text-2xl font-bold">Compendium</h1>`. No `<script>` block, no imports, no reactivity.

**Router (`src/router/index.ts`):** `CompendiumView` imported and registered as `{ path: '/compendium', name: 'compendium', component: CompendiumView }`.

**Smoke test (`src/views/__tests__/CompendiumView.test.ts`):** Two tests — heading text contains "Compendium" and `<h1>` element exists with correct text. No mocks needed (component has no script). Passes in 19ms.

## Verification

- `grep -c "version: 3" src/lib/migrations.ts` → 1
- `grep "idx_family" src/lib/schema.ts` → found `idxFamily: index('idx_family').on(table.family)`
- `grep "/compendium" src/router/index.ts` → found route registration
- `npx vitest run` → 19 test files, 207 tests, all passed, no regressions

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. **JSON path confidence level:** Used `$.system.details.family` at MEDIUM confidence per CONTEXT.md locked decision. A spot-check against live synced `raw_data` should be performed before Phase 03 implements family filtering (COMP-06). If the path is wrong, migration v3 will populate NULL for all rows, which is non-destructive — a v4 migration could correct it.

2. **No sidebar link in this plan:** Per locked UI-SPEC decision, the Compendium nav link is deferred to Phase 04. The route exists and is navigable but not surfaced in the sidebar yet.

## Self-Check: PASSED

All files exist on disk. Both task commits (053724a, af601a7) confirmed in git log.
