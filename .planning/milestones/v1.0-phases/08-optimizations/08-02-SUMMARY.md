---
phase: 08-optimizations
plan: 02
subsystem: database
tags: [sqlite, fts5, batch-insert, drizzle-orm, tauri-plugin-sql, vitest, tdd]

# Dependency graph
requires:
  - phase: 08-01
    provides: "FTS5 schema (pf2e_fts virtual table + triggers), STORED generated columns (level, rarity), migration v2"

provides:
  - "buildBatchInsertSql() pure helper — parameterized multi-row INSERT OR REPLACE SQL builder (8 cols, $1..$N placeholders)"
  - "EntityRow interface — typed input for batch insert helper"
  - "syncPacks() refactored — batch INSERT OR REPLACE with content-hash pre-check, one SQL per 500-entity batch"
  - "searchEntities() FTS5 search function — MATCH query against pf2e_fts joined to pf2e_entities, BM25-ranked"
  - "sanitizeSearchQuery() pure helper — FTS5 input sanitization with phrase quoting and prefix wildcard"
  - "EntitySearchResult interface — typed result for FTS5 search queries"

affects: [future UI phases using entity search, sync performance profiling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Batch raw SQL over per-entity ORM: getSqlite().execute() for INSERT OR REPLACE with parameterized multi-row VALUES"
    - "Content-hash pre-check: fetch all (pack, slug, content_hash) into Map before batch loop, skip unchanged entities"
    - "FTS5 search via getSqlite().select() with $1 MATCH placeholder — consistent with batch INSERT pattern"
    - "Pure function TDD: extract pure SQL-building helpers, write unit tests against them; skip DB-touching code in unit tests"

key-files:
  created:
    - src/lib/search-service.ts
    - src/lib/__tests__/search-service.test.ts
  modified:
    - src/lib/sync-service.ts
    - src/lib/__tests__/sync-service.test.ts

key-decisions:
  - "buildBatchInsertSql() excludes level/rarity from column list — STORED generated columns are computed by SQLite, not supplied by INSERT"
  - "Content-hash pre-fetch before batch loop (SELECT pack, slug, content_hash FROM pf2e_entities) — narrow projection is fast even at 28K+ rows"
  - "hashMap updated after each batch so subsequent batches see fresh hashes without re-querying DB"
  - "getSqlite() raw SQL path chosen for searchEntities() over db.all() — consistent with batch INSERT pattern, avoids Drizzle sqlite-proxy compatibility uncertainty"
  - "sql import from drizzle-orm removed from sync-service.ts — no longer needed after removing onConflictDoUpdate expressions"

patterns-established:
  - "Batch SQL: build $1..$N×COLS_PER_ROW placeholder string + flat params array, execute once per batch"
  - "FTS5 MATCH sanitization: trim → escape double quotes by doubling → wrap in quotes → append * for prefix"

requirements-completed: [OPT-01, OPT-02]

# Metrics
duration: 4min
completed: 2026-03-20
---

# Phase 08 Plan 02: Batch INSERT and FTS5 Search Summary

**syncPacks() refactored from 28K+ per-entity ORM inserts to ~56 batch INSERT OR REPLACE statements with content-hash pre-check; FTS5 searchEntities() exposed via getSqlite() MATCH queries with sanitized input**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T10:42:12Z
- **Completed:** 2026-03-20T10:45:41Z
- **Tasks:** 3
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- Replaced 28K+ individual `db.insert().values().onConflictDoUpdate()` calls with one `INSERT OR REPLACE INTO pf2e_entities ... VALUES ($1,...),($9,...)` statement per 500-entity batch
- Content-hash pre-check Map (fetched before the loop) skips unchanged entities, preventing unnecessary FTS trigger churn (each INSERT OR REPLACE fires AFTER DELETE + AFTER INSERT triggers)
- New `search-service.ts` exposes `searchEntities()` using FTS5 MATCH query against `pf2e_fts` joined to `pf2e_entities`, BM25-ranked, with `sanitizeSearchQuery()` for safe user input handling
- 8 new unit tests for `buildBatchInsertSql` (empty, 1-row, 2-row, 500-row scale, column exclusion, param ordering) and 8 for `sanitizeSearchQuery` — all 156 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract buildBatchInsertSql() pure helper with unit tests** - `c58683d` (feat — TDD GREEN)
2. **Task 2: Refactor syncPacks() inner loop to batch INSERT OR REPLACE** - `991b019` (feat)
3. **Task 3: Create searchEntities() FTS5 search function** - `c48b37d` (feat — TDD GREEN)

**Plan metadata:** (docs commit — see state updates)

_Note: TDD tasks (1 and 3) used single commits covering both test + implementation (RED verified, then GREEN committed together for atomicity)_

## Files Created/Modified

- `src/lib/sync-service.ts` — Added `EntityRow` interface, `buildBatchInsertSql()` pure helper; refactored `syncPacks()` inner loop with content-hash pre-check and batch INSERT OR REPLACE
- `src/lib/__tests__/sync-service.test.ts` — Added 8-test `describe('buildBatchInsertSql')` block with `makeRow()` helper
- `src/lib/search-service.ts` — New file: `EntitySearchResult` interface, `sanitizeSearchQuery()`, `searchEntities()` via FTS5 MATCH
- `src/lib/__tests__/search-service.test.ts` — New file: 8 unit tests for `sanitizeSearchQuery()`

## Decisions Made

- **buildBatchInsertSql excludes level/rarity**: These are STORED generated columns in SQLite — inserting values for them would cause an error. The INSERT column list contains only the 8 writable columns.
- **Content-hash pre-fetch uses narrow projection**: `SELECT pack, slug, content_hash FROM pf2e_entities` avoids loading raw_data (potentially large JSON) for 28K+ rows.
- **hashMap updated per-batch**: After each 500-entity batch commit, the Map is updated with newly inserted/updated rows so subsequent batches don't incorrectly skip rows that were just inserted in the current sync.
- **getSqlite() path for searchEntities()**: The Drizzle sqlite-proxy db object does not expose `db.all()` in the project's current usage pattern. Raw `sqlite.select()` is consistent with the batch INSERT approach and avoids any API uncertainty.
- **sql import removed from sync-service.ts**: The `sql` tagged template literal from drizzle-orm was only used in the `onConflictDoUpdate` expressions that were removed. Keeping unused imports would cause lint warnings.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- OPT-01 (batch imports) and OPT-02 (FTS5 search) are complete
- `searchEntities()` is ready for integration into a search UI component
- Integration testing of search against the running app is required (unit tests cover only the pure sanitizer; Tauri runtime required for actual FTS5 queries)
- OPT-03 (generated columns for filtering) was handled in Plan 01 (schema + migration DDL)

## Self-Check: PASSED

- src/lib/sync-service.ts: FOUND
- src/lib/search-service.ts: FOUND
- src/lib/__tests__/sync-service.test.ts: FOUND
- src/lib/__tests__/search-service.test.ts: FOUND
- .planning/phases/08-optimizations/08-02-SUMMARY.md: FOUND
- Commit c58683d: FOUND
- Commit 991b019: FOUND
- Commit c48b37d: FOUND

---
*Phase: 08-optimizations*
*Completed: 2026-03-20*
