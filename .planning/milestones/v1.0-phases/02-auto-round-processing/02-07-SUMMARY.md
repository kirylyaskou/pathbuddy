---
phase: 02-auto-round-processing
plan: 07
subsystem: combat
tags: [pinia, vitest, tdd, combat-store, regen, ongoing-damage]

# Dependency graph
requires:
  - phase: 02-auto-round-processing
    provides: applyTurnEffects stub wired to turn start, regenerationDisabled toggle, modifyHP function
provides:
  - Working applyTurnEffects that reads regenAmount and ongoingDamage from Creature and calls modifyHP
  - Creature interface extended with regenAmount? and ongoingDamage? optional fields
  - 7 non-vacuous applyTurnEffects tests asserting exact HP values
affects: [02-auto-round-processing, ui-regen-display]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Regen applied before ongoing damage (turn effect ordering)
    - Headroom clamping for healing (Math.min(regenAmount, maxHP - currentHP))
    - Delegate HP mutation to modifyHP to preserve isDowned invariant

key-files:
  created: []
  modified:
    - src/types/combat.ts
    - src/stores/combat.ts
    - src/stores/__tests__/combat.test.ts

key-decisions:
  - "Regen applied first, then ongoing damage (net effect order per CONTEXT.md)"
  - "Healing clamped at maxHP via headroom calculation, not post-hoc clamp"
  - "Both regen and ongoing damage route through modifyHP to maintain isDowned invariant"

patterns-established:
  - "TDD RED/GREEN with vacuous test replacement: old toBeGreaterThanOrEqual replaced with exact toBe assertions"

requirements-completed: [COMBAT-07]

# Metrics
duration: 8min
completed: 2026-03-19
---

# Phase 02 Plan 07: Regen and Ongoing Damage Turn Effects Summary

**applyTurnEffects implemented with per-creature regenAmount and ongoingDamage fields, healing capped at maxHP and damage clamped at 0 via existing modifyHP**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-19T20:13:00Z
- **Completed:** 2026-03-19T20:14:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Replaced 3 vacuous applyTurnEffects tests (toBeGreaterThanOrEqual/LessThanOrEqual) with 7 precise behavioral tests asserting exact HP values
- Added `regenAmount?: number` and `ongoingDamage?: number` optional fields to the Creature interface
- Implemented applyTurnEffects body: regen heals up to maxHP, ongoing damage reduces HP (clamped at 0 by modifyHP), regenerationDisabled still skips all effects
- All 56 tests pass across 6 test files with no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add regen/ongoingDamage fields to Creature type and write failing tests** - `fe34ecc` (test)
2. **Task 2: Implement applyTurnEffects body (GREEN phase)** - `57c14f9` (feat)

**Plan metadata:** TBD (docs: complete plan)

_Note: TDD tasks have two commits (test RED phase → feat GREEN phase)_

## Files Created/Modified
- `src/types/combat.ts` - Added regenAmount? and ongoingDamage? optional fields to Creature interface
- `src/stores/combat.ts` - Replaced TODO stub with working applyTurnEffects implementation
- `src/stores/__tests__/combat.test.ts` - Replaced 3 vacuous tests with 7 precise behavioral tests

## Decisions Made
- Regen applied first, then ongoing damage — matches CONTEXT.md turn effect timing (healing/regen before damage)
- Healing clamped at maxHP via headroom calculation (Math.min(regenAmount, maxHP - currentHP)) rather than post-hoc clamp, avoiding unnecessary modifyHP calls when already at full HP
- Both effects route through modifyHP (not direct assignment) to maintain the isDowned flag invariant

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- COMBAT-07 verification gap closed: applyTurnEffects now modifies creature HP based on regenAmount and ongoingDamage
- All 56 tests pass with non-vacuous assertions
- Ready for any UI work to expose regenAmount/ongoingDamage fields on creature add/edit forms

---
*Phase: 02-auto-round-processing*
*Completed: 2026-03-19*
