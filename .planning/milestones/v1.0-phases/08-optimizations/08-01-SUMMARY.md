---
phase: 08-optimizations
plan: 01
subsystem: database
tags: [sqlite, fts5, drizzle-orm, migrations, generated-columns, triggers, json-extract]

# Dependency graph
requires:
  - phase: 03-tauri-sqlite-foundation
    provides: migrations.ts versioned migration runner, schema.ts Drizzle pf2eEntities definition, pf2e.db SQLite database
  - phase: 04-pf2e-data-sync
    provides: pf2e_entities table populated with raw_data JSON blobs
provides:
  - Migration v2 DDL: pf2e_entities recreated with STORED generated columns (level, rarity)
  - FTS5 virtual table pf2e_fts with unicode61 tokenizer in external-content mode
  - 3 FTS5 sync triggers (INSERT/DELETE/UPDATE) keeping pf2e_fts synchronized with pf2e_entities
  - 7 indexes: original 4 recreated + idx_level, idx_rarity, idx_entity_type_level
  - Drizzle schema pf2eEntities updated with typed level/rarity columns and 3 new index definitions
affects:
  - 08-02 (batch import): INSERT OR REPLACE will now fire FTS triggers automatically
  - 08-03 (search service): pf2e_fts MATCH queries and level/rarity Drizzle column references are ready
  - Future plans using pf2eEntities.level or pf2eEntities.rarity for filtered queries

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SQLite table recreation pattern (CREATE new + INSERT SELECT + DROP + RENAME) for adding STORED generated columns
    - FTS5 external-content mode with 3-trigger pattern (ai/ad/au) for automatic index sync
    - FTS5 rebuild command in migration for retroactive indexing of pre-existing data
    - Drizzle generatedAlwaysAs with mode 'stored' for typed generated column definitions

key-files:
  created: []
  modified:
    - src/lib/migrations.ts
    - src/lib/schema.ts

key-decisions:
  - "STORED generated columns require table recreation (CREATE+INSERT+DROP+RENAME) in SQLite — ALTER TABLE ADD COLUMN STORED is not supported"
  - "FTS5 UPDATE trigger must delete old values before inserting new ones to avoid stale token corruption"
  - "FTS5 rebuild command added as last migration SQL statement to retroactively index pre-existing pf2e_entities rows"
  - "generatedAlwaysAs confirmed available in drizzle-orm 0.38.x — used with mode: stored for type-safe column mapping"

patterns-established:
  - "Migration v2 table recreation pattern: CREATE TABLE new + INSERT SELECT + DROP TABLE old + RENAME"
  - "FTS5 trigger naming: pf2e_fts_ai (after insert), pf2e_fts_ad (after delete), pf2e_fts_au (after update)"

requirements-completed: [OPT-02, OPT-03]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 08 Plan 01: FTS5 Schema Foundation Summary

**SQLite FTS5 virtual table + 3 sync triggers + STORED generated columns (level, rarity) via migration v2, with Drizzle schema updated for typed ORM access**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-20T10:38:14Z
- **Completed:** 2026-03-20T10:40:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added migration v2 with 14+ SQL statements: table recreation with STORED generated columns, data copy/swap, 7 indexes (4 original + 3 new), FTS5 virtual table, 3 sync triggers, FTS rebuild command
- Updated Drizzle schema with typed `level` (integer) and `rarity` (text) generated columns using `generatedAlwaysAs({ mode: 'stored' })` — confirmed API is available in drizzle-orm 0.38.x
- All TypeScript compilation passes with zero errors (`vue-tsc --noEmit` exit 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add migration v2 — FTS5 table, sync triggers, generated columns, indexes** - `6d9a5b8` (feat)
2. **Task 2: Update Drizzle schema.ts with level and rarity generated columns** - `639024a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/lib/migrations.ts` - Added migration v2 with FTS5 table, 3 triggers, STORED generated columns (level/rarity), and 7 indexes
- `src/lib/schema.ts` - Added level/rarity generatedAlwaysAs columns and 3 new index definitions (idxLevel, idxRarity, idxEntityTypeLevel)

## Decisions Made
- Used STORED (not VIRTUAL) generated columns per locked decision — required full table recreation via CREATE+INSERT+DROP+RENAME sequence since ALTER TABLE ADD COLUMN STORED is unsupported in SQLite
- `generatedAlwaysAs` is available in drizzle-orm 0.38.x (confirmed in node_modules/drizzle-orm/sqlite-core/columns/common.d.ts) — used it directly rather than the plain column fallback
- FTS5 UPDATE trigger issues 'delete' for old values before inserting new values — prevents stale token corruption per research pitfall documentation
- Added `INSERT INTO pf2e_fts(pf2e_fts) VALUES ('rebuild')` as final migration SQL — without this, any pre-existing pf2e_entities rows would be invisible to MATCH queries until the next sync run

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all API surfaces confirmed available, TypeScript compilation clean on first attempt.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Migration v2 DDL and Drizzle schema are ready; Plan 08-02 (batch import) and 08-03 (search service) can proceed
- FTS5 triggers will fire automatically on INSERT OR REPLACE in the batch import refactor
- `pf2eEntities.level` and `pf2eEntities.rarity` typed columns are available for Drizzle ORM filtered queries

## Self-Check: PASSED

All files present. All commits verified.

---
*Phase: 08-optimizations*
*Completed: 2026-03-20*
