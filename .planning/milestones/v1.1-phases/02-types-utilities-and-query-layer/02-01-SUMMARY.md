---
phase: 02-types-utilities-and-query-layer
plan: 01
subsystem: testing
tags: [vitest, typescript, pf2e, tdd, pure-functions]

# Dependency graph
requires: []
provides:
  - WeakEliteTier type exported from src/types/entity.ts
  - getHpAdjustment(tier, level) — full 12-bracket HP delta lookup, correct for all PF2e Monster Core levels
  - getAdjustedLevel(tier, level) — level display adjustment with all four edge cases handled
affects: [05-combat-workspace, 04-weak-elite-selector, any component computing HP or level for weak/elite creatures]

# Tech tracking
tech-stack:
  added: []
  patterns: [TDD RED-GREEN for pure utility functions, HP_TABLE lookup array with find() instead of if-chains]

key-files:
  created:
    - src/types/entity.ts
    - src/lib/weak-elite.ts
    - src/lib/__tests__/weak-elite.test.ts
  modified: []

key-decisions:
  - "HP_TABLE uses find() on maxLevel — avoids the simplified 3-bracket anti-pattern; source cited as Archives of Nethys IDs 3264/3265"
  - "weak on level <= 0 returns 0 — ruled not-applicable per PF2e Monster Core locked decision"
  - "elite on level -1 or 0 adds +2 (not +1) — matches rule: minimum displayed level is 1"
  - "weak on level 1 subtracts 2 (not 1) — produces -1, matching rule for minimum displayed level"

patterns-established:
  - "Pure utility functions in src/lib/ with co-located tests in src/lib/__tests__/ — no mocks needed for pure functions"
  - "HP_TABLE lookup: HP_TABLE.find(b => lookupLevel <= b.maxLevel) ?? last bracket — handles out-of-range levels cleanly"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 02 Plan 01: Weak/Elite HP Adjustment Utility Summary

**WeakEliteTier type + full 12-bracket getHpAdjustment/getAdjustedLevel pure functions with 27 TDD tests covering all bracket boundaries and edge cases**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T20:36:20Z
- **Completed:** 2026-03-20T20:38:10Z
- **Tasks:** 2 (RED + GREEN)
- **Files modified:** 3 created

## Accomplishments
- Full 12-bracket HP adjustment table from Archives of Nethys (PF2e Monster Core IDs 3264/3265) — not the simplified 3-bracket version
- getHpAdjustment covers all bracket boundaries, out-of-range clamping, and weak-on-level-0 not-applicable rule
- getAdjustedLevel handles all four documented edge cases (elite -1, elite 0, weak 1, weak <=0)
- 27 tests written TDD-style: all failed on RED commit, all passed on GREEN commit; 207 total tests pass with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — Write failing tests for weak-elite utility** - `42deda6` (test)
2. **Task 2: GREEN — Implement weak-elite utility to pass all tests** - `90612c6` (feat)

_TDD plan: 2 commits (test -> feat). No refactor needed for this size._

## Files Created/Modified
- `src/types/entity.ts` — WeakEliteTier type: `'normal' | 'weak' | 'elite'`
- `src/lib/weak-elite.ts` — getHpAdjustment() and getAdjustedLevel() pure functions; 12-bracket HP_TABLE
- `src/lib/__tests__/weak-elite.test.ts` — 27 tests: 19 for getHpAdjustment (all brackets + edge cases), 8 for getAdjustedLevel

## Decisions Made
- HP_TABLE uses `find(b => lookupLevel <= b.maxLevel) ?? HP_TABLE[HP_TABLE.length - 1]` — clean bracket lookup that naturally handles out-of-range via the fallback
- `weak on level <= 0` returns 0 — locked decision from CONTEXT.md; applying weak to a non-positive level is undefined in the rules
- Source comment links directly to Archives of Nethys IDs 3264/3265 in the implementation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- WeakEliteTier, getHpAdjustment, and getAdjustedLevel are ready for import by Phase 05 (Combat Workspace) and any WeakEliteSelector component
- No blockers for Plan 02 (entity-query layer)

---
*Phase: 02-types-utilities-and-query-layer*
*Completed: 2026-03-20*
