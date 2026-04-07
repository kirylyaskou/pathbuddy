---
phase: 07-type-foundation-and-condition-engine
plan: 02
subsystem: combat-store
tags: [pinia, condition-manager, store-migration, tests]
dependency_graph:
  requires: [07-01]
  provides: [COND-01-store-layer]
  affects: [src/stores/combat.ts, src/stores/__tests__/combat.test.ts]
tech_stack:
  added: []
  patterns: [mutateCondition-helper, markRaw-class-cast, CM-as-single-source-of-truth]
key_files:
  created: []
  modified:
    - src/stores/combat.ts
    - src/stores/__tests__/combat.test.ts
decisions:
  - mutateCondition uses `any` parameter type to work around Vue reactive proxy stripping private fields from markRaw'd ConditionManager; cm is cast back to ConditionManager inside the function
  - addCreature signature extended to also omit isCurrentTurn and isDowned (both are always overridden internally)
metrics:
  duration: ~10 minutes
  completed: 2026-03-25
  tasks_completed: 2
  files_modified: 2
  tests: 53
---

# Phase 07 Plan 02: Combat Store Condition Management Rewrite Summary

Combat store's condition state migrated from parallel legacy data structures (conditions array + conditionValues map + conditionDurations map + two store-level refs) to per-creature ConditionManager instances, routing all mutations through a `mutateCondition` helper that guarantees `conditionVersion` increment on every change.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Rewrite combat store condition management to use ConditionManager | fec4735 | src/stores/combat.ts |
| 2 | Rewrite combat store tests for ConditionManager-based API | 1110dd4 | src/stores/__tests__/combat.test.ts |

## What Was Built

**Task 1 — Combat store rewrite (`src/stores/combat.ts`):**
- Removed `creatureConditionDurations` and `protectedConditions` store-level refs
- Added `mutateCondition(creature, fn)` helper: calls `fn(creature.conditionManager)` then increments `conditionVersion`
- `addCreature` now initializes `conditionManager: markRaw(new ConditionManager()) as ConditionManager` and `conditionVersion: 0`
- `toggleCondition` rewired to use `cm.has()/cm.add()/cm.remove()`
- `toggleConditionWithOptions` uses `cm.setDuration()/cm.setProtected()` for duration and protected tracking
- Deleted `decrementDurationsForCreature` function; replaced with `endCreatureTurn` (calls `cm.endTurn()`)
- All 4 call sites updated: `advanceRound`, `nextCreature` (×2), `setCurrentTurn`
- `setConditionValue`/`getConditionValue` rewritten against CM API
- `addFromBrowser` no longer passes `conditions: []`
- Return object updated: removed 3 legacy exports, added `endCreatureTurn`

**Task 2 — Tests rewrite (`src/stores/__tests__/combat.test.ts`):**
- Added `makeCreature()` helper replacing all inline `{ ..., conditions: [] }` literals
- All `creature.conditions` array assertions replaced with `conditionManager.has()/get()/getAll()`
- `decrementDurationsForCreature` suite renamed to `endCreatureTurn` with CM-based assertions
- `setCurrentTurn` test updated: checks `conditionManager.get('frightened')` decrements after turn
- New `conditionVersion` describe block: 3 tests verifying increment after toggle/setValue/endTurn
- `addFromBrowser` test added: `conditionManager.getAll()` has length 0 on new creatures
- 53 tests, all passing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Vue reactive proxy strips private fields from markRaw'd ConditionManager**
- **Found during:** Task 1 (TypeScript compile check)
- **Issue:** `mutateCondition(creature: Creature, ...)` — TypeScript saw `creature.conditionManager` as a structural object type (missing `conditions`, `durations`, `protected_` private properties) because Vue's `ref<Creature[]>` reactive wrapping loses the class identity even after `markRaw()`
- **Fix:** `mutateCondition` uses `creature: any` parameter with `creature.conditionManager as ConditionManager` cast inside. This is consistent with the project's established `markRaw()` + version counter pattern.
- **Files modified:** src/stores/combat.ts
- **Commit:** fec4735

**2. [Rule 2 - Missing critical functionality] addCreature signature too restrictive**
- **Found during:** Task 1 (TypeScript compile check on `addFromBrowser`)
- **Issue:** `addFromBrowser` passes an object without `isCurrentTurn`/`isDowned` to `addCreature`, but both fields were in the Omit exclusion list only for `id`/`conditionManager`/`conditionVersion`. Since `addCreature` always overrides these fields internally, requiring callers to supply them is incorrect.
- **Fix:** Extended `addCreature` parameter type to `Omit<Creature, 'id' | 'conditionManager' | 'conditionVersion' | 'isCurrentTurn' | 'isDowned'>`
- **Files modified:** src/stores/combat.ts
- **Commit:** fec4735

## Verification

- `npx vitest run src/stores/__tests__/combat.test.ts` — 53 tests pass
- `npx vitest run src/lib/pf2e/__tests__/conditions.test.ts` — 36 tests pass (unchanged)
- No references to `creatureConditionDurations` or `protectedConditions` in store
- All condition mutations route through `mutateCondition()` or manually increment `conditionVersion` (toggleConditionWithOptions)
- `addCreature` creates `conditionManager: markRaw(new ConditionManager()) as ConditionManager` and `conditionVersion: 0`

## Self-Check: PASSED

- `src/stores/combat.ts` — exists and modified
- `src/stores/__tests__/combat.test.ts` — exists and modified
- Commit fec4735 — verified present
- Commit 1110dd4 — verified present
