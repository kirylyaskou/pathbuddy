---
phase: 01-bug-fix-and-ui-improvements
plan: 02
subsystem: ui
tags: [vue3, pinia, tailwind, conditions, combat, pf2e]

# Dependency graph
requires:
  - phase: 01-bug-fix-and-ui-improvements
    provides: "Plan 01 AppLayout, sidebar nav, routing fixes"
provides:
  - conditionValues field on Creature interface for numeric severity (stunned 2, slowed 1)
  - CONDITIONS_WITH_VALUES Set and conditionHasValue() in useConditions composable
  - CONDITION_BADGE_CLASSES static Tailwind class map for all 11 PF2e conditions
  - setConditionValue and getConditionValue actions in combat store
  - HPController redesigned with amount ref and number input for variable damage/heal
  - ConditionBadge component with pill badges, picker popover, and click-outside handler
affects:
  - 01-03 (CreatureCard composes HPController and ConditionBadge)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Static Tailwind class map (CONDITION_BADGE_CLASSES) to avoid JIT dynamic class scanning failures
    - Condition removal paths (toggle, withOptions, duration expiry, value <= 0) all clear conditionValues
    - ConditionBadge receives data via props and communicates via emits; no direct store access

key-files:
  created:
    - src/components/ConditionBadge.vue
  modified:
    - src/types/combat.ts
    - src/composables/useConditions.ts
    - src/stores/combat.ts
    - src/components/HPController.vue

key-decisions:
  - "CONDITION_BADGE_CLASSES uses bg-crimson and bg-crimson-dark (not opacity modifiers like bg-crimson/80) — Tailwind v3 does not support opacity modifiers on custom hex colors"
  - "ConditionBadge is props-in/emits-out — no store imports; CreatureCard (Plan 03) wires store calls"
  - "Badge click on value-bearing condition decrements value (not toggles) — reaching 0 removes condition via setConditionValue"

patterns-established:
  - "Static badge class map: use Record<Condition, string> with full Tailwind class strings, never template literals"
  - "Condition value cleanup: all removal paths (toggleCondition, toggleConditionWithOptions, decrementDurationsForCreature, setConditionValue) delete conditionValues entry"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 1 Plan 2: Condition Values and Component Redesign Summary

**Creature conditionValues field, static badge class map for all 11 PF2e conditions, HPController variable-amount input, and ConditionBadge pill badge component with picker popover**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-20T14:58:03Z
- **Completed:** 2026-03-20T15:00:29Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Extended Creature interface with `conditionValues?: Partial<Record<Condition, number>>` for PF2e numeric severity tracking
- Added `CONDITIONS_WITH_VALUES`, `conditionHasValue()`, and `CONDITION_BADGE_CLASSES` to useConditions composable; all 4 condition removal paths in combat store now clear stale conditionValues
- Redesigned HPController with `amount = ref(1)` and `<input type="number">` so damage/heal emit variable deltas instead of hardcoded ±1
- Created ConditionBadge component: active conditions as colored pill badges, picker popover listing all 11 conditions, click-outside close handler

## Task Commits

Each task was committed atomically:

1. **Task 1: Condition value types, composable extensions, and store actions** - `44ca94c` (feat)
2. **Task 2: HPController redesign with amount input + ConditionBadge component** - `01e5179` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `src/types/combat.ts` - Added `conditionValues?: Partial<Record<Condition, number>>` to Creature interface
- `src/composables/useConditions.ts` - Added CONDITIONS_WITH_VALUES Set, conditionHasValue(), CONDITION_BADGE_CLASSES Record
- `src/stores/combat.ts` - Added setConditionValue/getConditionValue actions; patched all 4 removal paths to clear conditionValues
- `src/components/HPController.vue` - Redesigned with amount ref, number input, variable delta emits, dark theme classes
- `src/components/ConditionBadge.vue` - New component: pill badges, picker popover, click-outside, value display for stunned/slowed

## Decisions Made

- CONDITION_BADGE_CLASSES uses `bg-crimson` / `bg-crimson-dark` instead of `bg-crimson/80` opacity modifiers — Tailwind v3 does not support opacity modifiers on custom hex colors, which causes silent JIT scanning failures
- ConditionBadge is purely props-in/emits-out with no store imports — CreatureCard (Plan 03) will wire the store calls
- Badge click on value-bearing conditions (stunned, slowed) decrements the value rather than toggling; reaching 0 triggers setConditionValue which removes the condition from the conditions array

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Creature type, useConditions composable, and combat store provide stable contracts for Plan 03 (CreatureCard redesign)
- HPController and ConditionBadge are ready to be composed inside CreatureCard
- ConditionToggle.vue still exists (not deleted) — Plan 03 will replace its usages

---
*Phase: 01-bug-fix-and-ui-improvements*
*Completed: 2026-03-20*
