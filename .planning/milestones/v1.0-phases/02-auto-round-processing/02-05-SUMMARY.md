---
phase: 02-auto-round-processing
plan: 05
subsystem: combat-store
tags: [bug-fix, turn-advancement, round-gating, gap-closure]
dependency_graph:
  requires: []
  provides: [correct-turn-advancement, round-gating, actedCreatureIds-tracking]
  affects: [src/stores/combat.ts, src/components/CombatTracker.vue]
tech_stack:
  added: []
  patterns: [actedCreatureIds-set-tracking, store-computed-proxy]
key_files:
  created: []
  modified:
    - src/stores/combat.ts
    - src/components/CombatTracker.vue
    - src/stores/__tests__/combat.test.ts
    - src/components/__tests__/CombatTracker.test.ts
decisions:
  - actedCreatureIds uses Set<string> to track who acted this round; reset on advanceRound
  - nextCreature stops at last creature rather than wrapping; enables New Round button
  - advanceRound sets first sortedCreature as current turn for the new round
  - hasAllActed moved to store as computed using actedCreatureIds (replaces broken isCurrentTurn check)
metrics:
  duration: 4m
  completed: 2026-03-19
  tasks_completed: 2
  files_modified: 4
---

# Phase 02 Plan 05: Fix Broken Turn Advancement and Round Gating Summary

**One-liner:** Fixed nextCreature() to walk sortedCreatures in initiative order with actedCreatureIds tracking, removed duplicate Advance Turn button, rewrote advanceRound() to start new round at first sorted creature.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix store turn advancement and round gating logic | d7606eb | src/stores/combat.ts, src/stores/__tests__/combat.test.ts |
| 2 | Remove duplicate button and wire hasAllActed from store | dbd96fb | src/components/CombatTracker.vue, src/components/__tests__/CombatTracker.test.ts |

## What Was Built

### Task 1: Store Fixes

**`actedCreatureIds` ref (new):**
- `ref<Set<string>>(new Set())` — tracks which creatures have had their turn this round

**`hasAllActed` computed (new in store):**
- Returns `true` when all creatures in `creatures.value` are in `actedCreatureIds`
- Replaces the broken `every(c => !c.isCurrentTurn)` check (which could never be true during combat)

**`nextCreature()` rewritten:**
- Now iterates `sortedCreatures.value` (highest initiative first)
- When advancing from current creature: marks it in `actedCreatureIds`, clears `isCurrentTurn`
- If it was the last sorted creature: leaves no creature as current (enables New Round)
- If not last: sets next sorted creature as current, calls `decrementDurationsForCreature()` + `applyTurnEffects()`

**`advanceRound()` rewritten:**
- Clears `actedCreatureIds` (fresh round)
- Sets `sortedCreatures.value[0].isCurrentTurn = true` (first creature starts new round)
- Calls `decrementDurationsForCreature()` + `applyTurnEffects()` on that creature

### Task 2: Component Cleanup

**Removed:**
- `advanceTurn()` function (Phase 1 leftover using deprecated `getNextCreatureIndex`)
- `import { getNextCreatureIndex }` from `@/composables/useInitiative`
- "Advance Turn" `<button>` from template

**Changed:**
- `hasAllActed` computed now reads `combatStore.hasAllActed` instead of local broken logic

**Result:** Header buttons are exactly: Round badge | New Round | Next Creature | + Add Creature

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated tests that expected old broken behavior**
- **Found during:** Task 1 verification
- **Issue:** `combat.test.ts` had `advanceRound` test expecting `isCurrentTurn = false` and `nextCreature` test expecting wrap-around — both tested the broken behavior we were fixing
- **Fix:** Updated `advanceRound` test to verify first sorted creature becomes current; updated `nextCreature` test to verify stop-at-last and `hasAllActed = true`
- **Files modified:** `src/stores/__tests__/combat.test.ts`
- **Commit:** d7606eb

**2. [Rule 1 - Bug] Updated CombatTracker test for new button layout**
- **Found during:** Task 2 verification
- **Issue:** `CombatTracker.test.ts` expected `buttons[0]` to be "Add Creature" (old layout had Add Creature first); also expected "Advance Turn" at buttons[1]
- **Fix:** Updated "Add Creature button opens form" test to find button by text rather than index; replaced "Advance Turn" test with "has exactly one Next Creature button and no Advance Turn button"
- **Files modified:** `src/components/__tests__/CombatTracker.test.ts`
- **Commit:** dbd96fb

## Verification Results

- All 52 tests pass (6 test files)
- `nextCreature()` references `sortedCreatures.value` for iteration
- `actedCreatureIds` ref exists and is exported from store
- `hasAllActed` computed uses `actedCreatureIds` and is exported
- `advanceRound()` sets `sortedCreatures.value[0].isCurrentTurn = true` after reset
- No "Advance Turn" text anywhere in CombatTracker.vue
- Header: Round badge, New Round (purple), Next Creature (green), + Add Creature (blue)

## Self-Check: PASSED

Files exist:
- src/stores/combat.ts - FOUND
- src/components/CombatTracker.vue - FOUND
- src/stores/__tests__/combat.test.ts - FOUND
- src/components/__tests__/CombatTracker.test.ts - FOUND

Commits exist:
- d7606eb - FOUND (feat(02-05): fix store turn advancement and round gating logic)
- dbd96fb - FOUND (feat(02-05): remove duplicate Advance Turn button and wire hasAllActed from store)
