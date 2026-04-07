---
phase: 01-xp-encounter-budget
plan: 02
subsystem: game-logic
tags: [pf2e, xp, encounter-budget, threat-rating, typescript]

# Dependency graph
requires:
  - phase: 01-xp-encounter-budget/01-01
    provides: "calculateCreatureXP, getHazardXp, XP lookup tables"
provides:
  - "generateEncounterBudgets: party-size-scaled XP thresholds"
  - "calculateEncounterRating: total XP to threat rating mapping"
  - "calculateXP: full encounter XP orchestrator with per-entity breakdown"
  - "Clean migration from old xp-calculator module"
affects: [encounter-builder-ui, combat-workspace]

# Tech tracking
tech-stack:
  added: []
  patterns: [budget-threshold-scaling, orchestrator-with-breakdown, structured-warnings]

key-files:
  created: []
  modified:
    - src/lib/pf2e/xp.ts
    - src/lib/pf2e/index.ts
    - src/lib/pf2e/__tests__/xp.test.ts
    - src/components/CreatureBrowser.vue
    - src/components/__tests__/CreatureBrowser.test.ts

key-decisions:
  - "Encounter rating uses threshold comparison (totalXp > budget) not range comparison"
  - "calculateXP propagates pwol option to all sub-functions via options passthrough"

patterns-established:
  - "Budget scaling: per-threat-level character adjustments (10/20/20/30/40) not flat rate"
  - "Orchestrator returns structured breakdown with per-entity XP and typed warnings"

requirements-completed: [XP-04, XP-05, XP-06]

# Metrics
duration: 3min
completed: 2026-03-24
---

# Phase 01 Plan 02: Encounter Budgets, Rating & Orchestrator Summary

**Party-scaled encounter budget thresholds, XP-to-threat-rating mapping, and full calculateXP orchestrator with per-entity breakdown and outOfRange warnings**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T14:34:36Z
- **Completed:** 2026-03-24T14:37:50Z
- **Tasks:** 2
- **Files modified:** 5 modified, 2 deleted

## Accomplishments
- Implemented generateEncounterBudgets with per-threat character adjustment scaling (10/20/20/30/40)
- Implemented calculateEncounterRating mapping total XP to threat rating via budget thresholds
- Implemented calculateXP orchestrator with per-entity breakdown, PWOL propagation, and structured outOfRange warnings
- Migrated CreatureBrowser.vue from old getXpForCreature to new calculateCreatureXP API
- Deleted old src/lib/xp-calculator.ts and its tests (clean break, zero remaining references)
- All 435 tests pass across 23 test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests for encounter budgets, rating, and orchestrator** - `93c71af` (test)
2. **Task 2: Implement encounter budgets, rating, orchestrator, and migrate imports** - `b92b5b3` (feat)

**Plan metadata:** `b7ed9fa` (docs: complete plan)

_Note: TDD tasks have RED (test) and GREEN (feat) commits._

## Files Created/Modified
- `src/lib/pf2e/xp.ts` - Added generateEncounterBudgets, calculateEncounterRating, calculateXP with types
- `src/lib/pf2e/index.ts` - Updated barrel with all 5 function exports and all type exports
- `src/lib/pf2e/__tests__/xp.test.ts` - Added 27 tests for XP-04, XP-05, XP-06
- `src/components/CreatureBrowser.vue` - Migrated import to @/lib/pf2e, updated template to use .xp property
- `src/components/__tests__/CreatureBrowser.test.ts` - Updated mock from xp-calculator to @/lib/pf2e
- `src/lib/xp-calculator.ts` - DELETED
- `src/lib/__tests__/xp-calculator.test.ts` - DELETED

## Decisions Made
- Encounter rating uses "exceeds threshold" comparison (totalXp > budget.severe -> extreme) matching PF2e rules where budget values are the ceiling for each tier
- calculateXP propagates pwol option to all sub-functions via options passthrough (single point of control)

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete XP engine with all 5 public functions exported from src/lib/pf2e
- Phase 01 fully complete: XP-01 through XP-06 all satisfied
- Ready for encounter builder UI integration (future phase)

## Self-Check: PASSED

All created files verified present. All deleted files confirmed removed. All commit hashes found in git log.

---
*Phase: 01-xp-encounter-budget*
*Completed: 2026-03-24*
