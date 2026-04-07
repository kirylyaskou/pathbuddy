# Phase 02 Plan 01 Summary

## One-liner
Extended combat store with round tracking, condition duration management, and protected conditions support

## Phase/Plan
- **Phase:** 02-auto-round-processing
- **Plan:** 01
- **Completed:** 2026-03-19

## Subsystem
Combat Store (Pinia)

## Tags
- combat
- store
- state-management
- condition-tracking

## Dependency Graph
- **Requires:** Phase 01 Plan 01 (basic combat tracker scaffold)
- **Provides:** Foundation for Phase 02 Plan 02 (UI updates for round/turn progression)
- **Affects:** src/components/CreatureCard, src/components/CombatTracker (future UI hooks)

## Tech Stack
- **Added:** Pinia state extensions (ref types)
- **Patterns:** Centralized duration tracking, per-instance protected flags

## Key Files

### Created
- None

### Modified
- `src/types/combat.ts` - Added `conditionDurations?: Record<Condition, number>` to Creature interface
- `src/stores/combat.ts` - Added state and actions for duration/round management

## Changes

### src/types/combat.ts
Added optional `conditionDurations` field to Creature interface at line 31:
```typescript
conditionDurations?: Record<Condition, number>
```

### src/stores/combat.ts
1. Added four new reactive refs (lines 10-13):
   ```typescript
   const roundNumber = ref(1)
   const creatureConditionDurations = ref<Record<string, Record<Condition, number>>>({})
   const regenerationDisabled = ref<Record<string, boolean>>({})
   const protectedConditions = ref<Record<string, Condition[]>>({})
   ```

2. Added `ConditionWithOptions` type and `toggleConditionWithOptions` action (lines 47-123):
   - Handles condition toggle with optional duration and protected flag
   - Sets `conditionDurations` on Creature when duration is provided
   - Tracks protected conditions in `protectedConditions` map
   - Cleans up all tracking when condition is removed

3. Updated return statement to export new state and actions (lines 139-153):
   ```typescript
   return {
     creatures,
     isActive,
     roundNumber,
     creatureConditionDurations,
     regenerationDisabled,
     protectedConditions,
     sortedCreatures,
     currentTurnCreature,
     addCreature,
     modifyHP,
     toggleCondition,
     toggleConditionWithOptions,
     setCurrentTurn,
   }
   ```

## Key Decisions
1. **Per-creature conditionDurations on Creature type:** Allows direct access to durations without looking up by creature ID
2. **Global duration map (creatureConditionDurations):** Separate tracking in store for centralized duration management
3. **Protected conditions per-instance:** Tracked in store (not Creature type) to allow per-toggle protected flag without type changes

## Test Results
- All 36 tests pass (no regressions)
- Combat store tests: 13 tests
- Component tests: 23 tests

## Deviations from Plan
None - plan executed exactly as written.

## Auth Gates
None.

## Deferred Issues
None.

## Self-Check: PASSED
