---
phase: 06-conditions-module
plan: 01
subsystem: game-logic
tags: [pf2e, conditions, typescript, vitest, tdd]

# Dependency graph
requires:
  - phase: 05-iwr-engine
    provides: as-const array + derived union type pattern, Map-backed class pattern
provides:
  - CONDITION_SLUGS constant (44 PF2e Remaster condition slugs as const array)
  - VALUED_CONDITIONS constant (11 numeric-severity conditions as const array)
  - CONDITION_GROUPS constant (detection/attitudes group mappings)
  - ConditionManager class with add/remove/has/get and PF2e rule enforcement
  - ConditionSlug and ValuedCondition union types
affects: [combat-tracking-ui, condition-display, encounter-processing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "as const array + derived union type for closed string sets"
    - "Map<ConditionSlug, number> for O(1) stateful condition tracking"
    - "Group exclusivity enforcement via Object.entries(CONDITION_GROUPS) scan on every add()"
    - "No-op guard on remove() prevents spurious rule triggers (dying/wounded)"

key-files:
  created:
    - src/lib/pf2e/conditions.ts
    - src/lib/pf2e/__tests__/conditions.test.ts
  modified:
    - src/lib/pf2e/index.ts

key-decisions:
  - "VALUED_CONDITIONS includes dying and wounded (required by dying/wounded rule tests that use get() returning numbers)"
  - "Group exclusivity: clear all members except new slug, then set — covers idempotent re-add of same member correctly"
  - "dying/wounded rule gates on this.conditions.has(slug) before delete — remove() on absent dying does NOT increment wounded"

patterns-established:
  - "ConditionManager: stateful Map-backed class enforcing PF2e rules on every mutation"
  - "Group exclusivity: Object.entries(CONDITION_GROUPS) scan + break after first match"

requirements-completed: [COND-01, COND-02, COND-03]

# Metrics
duration: 2min
completed: 2026-03-25
---

# Phase 06 Plan 01: Conditions Module Summary

**PF2e conditions module: 44-slug CONDITION_SLUGS, 11 VALUED_CONDITIONS, detection/attitudes CONDITION_GROUPS, and ConditionManager enforcing dying/wounded and group exclusivity rules**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-25T07:03:09Z
- **Completed:** 2026-03-25T07:04:44Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 3

## Accomplishments
- CONDITION_SLUGS exports exactly 44 PF2e Remaster condition slugs (alphabetical, no flat-footed, includes off-guard/cursebound/malevolence)
- VALUED_CONDITIONS exports exactly 11 conditions with numeric severity
- CONDITION_GROUPS exports detection (4 members) and attitudes (5 members) for mutual exclusivity
- ConditionManager.remove('dying') auto-increments wounded by 1 (no-op guard prevents spurious trigger)
- ConditionManager.add() enforces group exclusivity: adding a group member removes all other members of that group
- All 21 conditions tests pass; full suite green at 530 tests with 0 regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests for conditions constants and ConditionManager** - `2746d67` (test)
2. **Task 2: Implement conditions module to pass all tests** - `4664c60` (feat)

_Note: TDD tasks have two commits (test → feat)_

## Files Created/Modified
- `src/lib/pf2e/conditions.ts` - CONDITION_SLUGS, VALUED_CONDITIONS, CONDITION_GROUPS constants and ConditionManager class
- `src/lib/pf2e/__tests__/conditions.test.ts` - 21 unit tests covering COND-01, COND-02, COND-03
- `src/lib/pf2e/index.ts` - Barrel re-exports for all conditions exports

## Decisions Made
- VALUED_CONDITIONS includes dying and wounded: required because the dying/wounded rule test uses `get('wounded')` returning a number; storing as value 1 is the only valid approach given the Map<ConditionSlug, number> backing
- Group exclusivity clears all members except the new slug, then sets — this correctly handles idempotent re-add of an already-present member (delete self + re-add = net no change in presence)
- dying/wounded rule is gated on `this.conditions.has(slug)` before delete: ensures `remove('dying')` on a fresh manager is a true no-op and does not create wounded

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 06 complete — all COND-01/02/03 requirements satisfied
- Conditions module is ready for future combat tracking UI integration (conditions display, condition application/removal via UI)
- Future enhancement noted (out of scope): add('dying') while wounded should increase dying value by wounded value per PF2e rules — not implemented in this phase

---
*Phase: 06-conditions-module*
*Completed: 2026-03-25*

## Self-Check: PASSED
- src/lib/pf2e/conditions.ts: FOUND
- src/lib/pf2e/__tests__/conditions.test.ts: FOUND
- src/lib/pf2e/index.ts: FOUND
- .planning/phases/06-conditions-module/06-01-SUMMARY.md: FOUND
- Commit 2746d67 (test): FOUND
- Commit 4664c60 (feat): FOUND
