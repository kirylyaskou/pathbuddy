---
phase: 05-cross-reference-system
plan: 01
subsystem: database
tags: [drizzle-orm, pinia, vitest, tdd, sqlite, vue3]

# Dependency graph
requires:
  - phase: 04-pf2e-data-sync
    provides: pf2eEntities table with slug+entityType columns and db instance
provides:
  - resolveCreatureItems() function mapping embedded creature items to canonical DB entities via slug+entityType composite key
  - ResolvedCreatureItem interface (embedded, canonical, isUnique fields)
  - sourceId field on Creature type for linking combat tracker creatures to pf2e_entities
  - useCreatureDetailStore Pinia store managing panel open/close/navigate/back state
affects: [05-cross-reference-system]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - vi.mock hoisting pattern with self-contained factories (no top-level variable refs)
    - toStrictEqual for Pinia reactive ref object comparisons (not toBe)
    - Composite map key (slug:entityType) for type-disambiguated entity lookups
    - Batch DB query with Set deduplication before inArray to prevent SQL syntax errors

key-files:
  created:
    - src/lib/creature-resolver.ts
    - src/lib/__tests__/creature-resolver.test.ts
    - src/stores/creatureDetail.ts
    - src/stores/__tests__/creatureDetail.test.ts
  modified:
    - src/types/combat.ts

key-decisions:
  - "Composite key slug:entityType for canonical map — same slug in different entity types (shield spell vs shield equipment) resolves to correct canonical"
  - "slugs.length > 0 guard before inArray — empty array would generate invalid SQL"
  - "toStrictEqual (not toBe) for Pinia reactive ref object assertions — Pinia wraps stored objects in reactive proxies breaking Object.is identity"
  - "vi.mock factory must be self-contained with no top-level variable references — vitest hoists vi.mock calls before variable initialization"

patterns-established:
  - "vi.mock hoisting: factories use vi.fn() inline, access mocks via vi.mocked() in beforeEach"
  - "Pinia store test assertions: use toStrictEqual for object values, toBe only for primitives"

requirements-completed: [XREF-01]

# Metrics
duration: 4min
completed: 2026-03-20
---

# Phase 05 Plan 01: Creature Resolver + Detail Store Summary

**Slug+entityType composite key resolver with batch DB query, and Pinia panel state store with navigation history — 15 TDD tests, full suite 91 passing**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-19T23:04:53Z
- **Completed:** 2026-03-19T23:08:42Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `resolveCreatureItems()` batch-queries pf2eEntities by slug, builds composite `slug:entityType` map, resolves embedded NPC items to canonical DB entities; unmatched items marked `isUnique: true`
- `useCreatureDetailStore` Pinia store manages panel open/close state, creature selection, and forward/back navigation history stack
- Creature type extended with optional `sourceId` field linking combat tracker entries to pf2e_entities records
- 8 creature-resolver tests and 7 store tests added; full suite grew from 84 to 91 passing with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Creature type extension + resolver with TDD** - `742b105` (feat)
2. **Task 2: Pinia creatureDetail store with TDD** - `6330b6a` (feat)

**Plan metadata:** (docs commit — see below)

_Note: TDD tasks have single combined commit per task (RED write inline → GREEN implement → all pass)_

## Files Created/Modified
- `src/lib/creature-resolver.ts` — resolveCreatureItems() function and ResolvedCreatureItem interface
- `src/lib/__tests__/creature-resolver.test.ts` — 8 TDD tests covering all edge cases
- `src/stores/creatureDetail.ts` — Pinia setup store with open/navigate/back/close actions
- `src/stores/__tests__/creatureDetail.test.ts` — 7 TDD tests for panel state management
- `src/types/combat.ts` — Added optional sourceId field to Creature interface

## Decisions Made
- Composite key `${slug}:${entityType}` in the canonical map ensures "shield" resolves to the right entity type (spell vs equipment) without ambiguity
- `slugs.length > 0` guard before `inArray()` prevents a SQL syntax error (`WHERE slug IN ()`) on empty arrays
- Used `toStrictEqual` instead of `toBe` for Pinia ref object assertions — Pinia wraps values in reactive proxies that break Object.is identity comparisons
- `vi.mock` factories must be self-contained (no top-level variable captures) because vitest hoists these calls before variable initialization

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vi.mock factory using hoisted variables**
- **Found during:** Task 1 (RED phase — first test run)
- **Issue:** Test file used `mockWhere`, `mockFrom`, `mockSelect` top-level variables inside `vi.mock` factory. Vitest hoists `vi.mock` calls before variable initialization, causing `ReferenceError: Cannot access 'mockSelect' before initialization`
- **Fix:** Moved to self-contained factories (`vi.fn()` inline), reassigned mocks via `vi.mocked(db).select = mockSelect` inside `beforeEach`
- **Files modified:** src/lib/__tests__/creature-resolver.test.ts
- **Verification:** All 8 tests pass
- **Committed in:** 742b105 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed toBe -> toStrictEqual for Pinia reactive object assertions**
- **Found during:** Task 2 (GREEN phase — 4 tests failed)
- **Issue:** `expect(store.selectedCreatureRawData).toBe(creatureA)` fails because Pinia wraps stored objects in Vue reactive proxies — `Object.is` identity check fails even though values are structurally equal
- **Fix:** Changed object comparisons to `toStrictEqual`; primitive string comparisons kept as `toBe`
- **Files modified:** src/stores/__tests__/creatureDetail.test.ts
- **Verification:** All 7 tests pass
- **Committed in:** 6330b6a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes were test infrastructure issues, not implementation bugs. Store and resolver implementations match plan spec exactly.

## Issues Encountered
None — both issues were in test infrastructure and resolved in a single fix iteration each.

## Next Phase Readiness
- `resolveCreatureItems()` is ready for use in the creature detail panel UI (05-02)
- `useCreatureDetailStore` is ready for integration into panel open/close/navigate triggers
- `sourceId` on Creature interface allows linking a selected combat tracker creature to its pf2e_entities source for raw data lookup

---
*Phase: 05-cross-reference-system*
*Completed: 2026-03-20*

## Self-Check: PASSED

- src/lib/creature-resolver.ts — FOUND
- src/lib/__tests__/creature-resolver.test.ts — FOUND
- src/stores/creatureDetail.ts — FOUND
- src/stores/__tests__/creatureDetail.test.ts — FOUND
- .planning/phases/05-cross-reference-system/05-01-SUMMARY.md — FOUND
- Commit 742b105 — FOUND
- Commit 6330b6a — FOUND
