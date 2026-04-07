---
phase: 02-auto-round-processing
plan: 04
subsystem: ui
tags: [vue3, pinia, combat-tracker, round-counter, initiative]

# Dependency graph
requires:
  - phase: 02-auto-round-processing
    plan: 01
    provides: roundNumber state, advanceRound action, nextCreature action in combat store
  - phase: 02-auto-round-processing
    plan: 02
    provides: turn advancement logic and duration decrement
  - phase: 02-auto-round-processing
    plan: 03
    provides: regeneration toggle UI and drag restrictions
provides:
  - Round counter display in CombatTracker header showing current round number
  - New Round button (disabled until all creatures have acted) calling combatStore.advanceRound()
  - Next Creature button calling combatStore.nextCreature()
  - hasAllActed computed property checking all creatures !isCurrentTurn
affects: [future-combat-phases, phase-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [computed-derived-state, store-action-delegation, conditional-button-disable]

key-files:
  created: []
  modified:
    - src/components/CombatTracker.vue

key-decisions:
  - "hasAllActed checks all creatures.every(c => !c.isCurrentTurn) — no separate acted flag needed"
  - "New Round disabled when !hasAllActed OR no creatures, Next Creature disabled only when no creatures"

patterns-established:
  - "Round UI pattern: counter display + action buttons in header with computed disable state"
  - "Store delegation: CombatTracker handlers wrap store actions for consistent event handling"

requirements-completed: [COMBAT-05, COMBAT-06, COMBAT-07]

# Metrics
duration: 5min
completed: 2026-03-19
---

# Phase 02 Plan 04: Round Counter and Advancement UI Summary

**Round counter display with New Round / Next Creature buttons in CombatTracker header using hasAllActed computed state to gate round advancement**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-19T13:55:42Z
- **Completed:** 2026-03-19T13:55:42Z
- **Tasks:** 2 (1 code, 1 checkpoint auto-approved)
- **Files modified:** 1

## Accomplishments
- Added `hasAllActed` computed property that checks all creatures have `!isCurrentTurn`
- Added `handleAdvanceRound` and `handleNextCreature` button handlers delegating to combat store
- Added round counter badge (blue) displaying `combatStore.roundNumber` in header
- Added New Round button (purple, disabled until all have acted or no creatures)
- Added Next Creature button (green, disabled only when no creatures)
- Checkpoint auto-approved (auto_advance=true)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add round counter display and advancement buttons** - `067d6a9` (feat)
2. **Task 2: Verify round advancement UI** - auto-approved checkpoint (no commit required)

## Files Created/Modified
- `src/components/CombatTracker.vue` - Added round counter display, New Round button, Next Creature button, hasAllActed computed, and handler functions

## Decisions Made
- `hasAllActed` uses `creatures.every(c => !c.isCurrentTurn)` — no separate tracking needed since `isCurrentTurn` already tracks the active creature
- New Round gates on both `!hasAllActed` AND `creatures.length === 0` to cover empty combat state
- Next Creature only gates on `creatures.length === 0` since it should work at any point in a round

## Deviations from Plan

None - plan executed exactly as written. Task 1 was already committed from prior session; SUMMARY.md was the remaining deliverable.

## Issues Encountered

None - all code was already in place from commit `067d6a9` when this plan executor ran.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 02 fully complete: round tracking, condition duration, turn effects, regen toggle, drag restrictions, and round advancement UI all wired
- Phase 03 can begin Foundry VTT pack import or next planned feature area
- No blockers

---
*Phase: 02-auto-round-processing*
*Completed: 2026-03-19*
