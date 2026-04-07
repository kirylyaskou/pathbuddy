---
phase: 05-iwr-engine
plan: 01
subsystem: game-logic
tags: [pf2e, iwr, immunity, weakness, resistance, typescript, vitest, tdd]

# Dependency graph
requires:
  - phase: 02-damage-constants-types
    provides: DamageType, DamageCategory, MaterialEffect, DAMAGE_TYPES, DAMAGE_CATEGORIES
  - phase: 04-damage-helpers
    provides: DamageCategorization.getCategory() for category-level IWR matching

provides:
  - IWR interfaces: Immunity, Weakness, Resistance, DamageInstance, IWRApplicationResult
  - Factory functions: createImmunity, createWeakness, createResistance
  - applyIWR engine: processes immunities -> weaknesses -> resistances in PF2e CRB order
  - Type constants: IMMUNITY_TYPES, WEAKNESS_TYPES, RESISTANCE_TYPES, DOUBLE_VS_CONDITIONS
  - Barrel exports from src/lib/pf2e/index.ts

affects: [06-combat-tracker, future-damage-roll-phase, ui-combat-workspace]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "as const array + derived union type for ImmunityType/WeaknessType/ResistanceType (extends Phase 02 pattern)"
    - "Interface + factory function for IWR data models (extends Phase 03 Modifier pattern)"
    - "applyIWR single-instance processing — caller handles multi-instance aggregation"

key-files:
  created:
    - src/lib/pf2e/iwr.ts
    - src/lib/pf2e/__tests__/iwr.test.ts
  modified:
    - src/lib/pf2e/index.ts

key-decisions:
  - "IWR type constants combine DAMAGE_TYPES + DAMAGE_CATEGORIES + special strings ('critical-hits', 'precision') for ImmunityType"
  - "Exceptions typed as DamageType[] per locked decision; material-effect bypass checked via instance.materials array"
  - "doubleVs is DoubleVsCondition[] using closed as-const set; only 'critical' condition supported initially"
  - "applyOnce is caller-enforced — applyIWR processes one instance at a time and does not track state"
  - "Highest-only rule for multiple matching weaknesses/resistances per AON Rules 2317 and 2318"

patterns-established:
  - "typeMatches helper centralizes type/category matching for all three IWR passes"
  - "isExcepted helper checks both instance.type and instance.materials against exceptions array"
  - "effectiveWeaknessValue helper isolates doubleVs logic from main loop"

requirements-completed: [IWR-01, IWR-02, IWR-03, IWR-04]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 05 Plan 01: IWR Engine Summary

**Pure TypeScript PF2e IWR engine with applyIWR applying immunities then weaknesses then resistances in CRB order, supporting critical-hit halving, precision zeroing, doubleVs, and highest-only multi-entry rule.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-25T06:28:43Z
- **Completed:** 2026-03-25T06:31:08Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 3

## Accomplishments

- Implemented full PF2e IWR rules engine as pure TypeScript with zero external dependencies
- 24 unit tests covering all 4 requirement IDs (IWR-01 through IWR-04) written TDD-style
- Full test suite passes: 509/509 tests, zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — Write failing tests for IWR data models and applyIWR engine** - `552daae` (test)
2. **Task 2: GREEN — Implement IWR engine and barrel exports to pass all tests** - `9431126` (feat)

_Note: TDD tasks have two commits — test (RED) then implementation (GREEN)._

## Files Created/Modified

- `src/lib/pf2e/iwr.ts` - IWR type constants, interfaces, factory functions, and applyIWR engine (17 exports)
- `src/lib/pf2e/__tests__/iwr.test.ts` - 24 unit tests across 4 describe blocks (IWR-01 through IWR-04)
- `src/lib/pf2e/index.ts` - Barrel updated with IWR value exports and type exports

## Decisions Made

- ImmunityType combines all DAMAGE_TYPES + all DAMAGE_CATEGORIES + 'critical-hits' + 'precision' as a single flat const array — consistent with Phase 02 as-const pattern
- WeaknessType and ResistanceType omit the special strings since those only apply to immunities
- effectiveWeaknessValue helper isolates doubleVs computation — makes it easy to extend with new conditions
- typeMatches and isExcepted are module-private helpers (not exported) — matches the Phase 03 convention for internal helpers

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- IWR engine complete and barrel-exported; ready for integration into combat tracker or damage roll phase
- applyIWR processes single instances; multi-instance aggregation (e.g., full damage roll) is caller responsibility
- applyOnce enforcement is caller responsibility — documented in JSDoc on the Weakness interface

## Self-Check: PASSED

All created files exist on disk. All task commits verified in git log.

---
*Phase: 05-iwr-engine*
*Completed: 2026-03-25*
