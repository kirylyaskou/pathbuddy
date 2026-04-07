---
phase: 07-type-foundation-and-condition-engine
plan: 01
subsystem: conditions
tags: [pf2e, conditions, typescript, vitest, tdd]

requires:
  - phase: v2.0-phases
    provides: ConditionManager class with add/remove/has/get + group exclusivity + dying-on-removal wounded cascade

provides:
  - ConditionManager.endTurn() — auto-decrements frightened/sickened/stunned/slowed per PF2e CRB, removes at 0
  - ConditionManager.setDuration(slug, rounds) — tracks round-based durations, removed by endTurn
  - ConditionManager.setProtected(slug, bool) / isProtected(slug) — skip decrement for protected conditions
  - ConditionManager.getAll() — returns Array<{slug, value}> for all active conditions
  - Dying/wounded cascade in add('dying', value): stored value = requested + current wounded
  - Creature interface migrated to conditionManager: ConditionManager + conditionVersion: number
  - Condition type union and ConditionDef interface removed from combat.ts

affects:
  - 07-02 (combat store migration wires new Creature fields + CM mutations)
  - 07-03 (ConditionBadge reads from CM via conditionVersion)

tech-stack:
  added: []
  patterns:
    - "ConditionManager private durations Map + protected_ Set for extended condition state"
    - "endTurn() encapsulates all PF2e end-of-turn condition decrement rules"
    - "Creature interface uses markRaw-intended conditionManager + conditionVersion counter"

key-files:
  created: []
  modified:
    - src/lib/pf2e/conditions.ts
    - src/lib/pf2e/__tests__/conditions.test.ts
    - src/types/combat.ts

key-decisions:
  - "slowed included in endTurn() auto-decrement alongside frightened/sickened/stunned — PF2e CRB rule applies to all four"
  - "add('dying') cascade always replaces (value + wounded), never stacks — re-applying dying to same creature yields same result"
  - "Downstream TypeScript errors in combat store and components are expected and will be resolved in Plans 02/03"

patterns-established:
  - "TDD RED-GREEN: write failing tests before implementation, verify RED before implementing GREEN"
  - "endTurn() is the single entry point for all end-of-turn condition decrement — no parallel duration tracking"

requirements-completed: [TYPE-01, COND-02, COND-05]

duration: 2min
completed: 2026-03-25
---

# Phase 07 Plan 01: Type Foundation and Condition Engine Summary

**ConditionManager extended with endTurn/setDuration/setProtected/getAll and dying+wounded cascade; Creature interface migrated from 11-slug Condition union to ConditionManager + conditionVersion fields**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-25T11:19:05Z
- **Completed:** 2026-03-25T11:21:29Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Extended ConditionManager with 5 new methods (endTurn, setDuration, setProtected, isProtected, getAll) and dying/wounded cascade in add()
- Added 14 new tests covering all new behavior (36 total passing, 0 failing)
- Migrated Creature interface: removed Condition type union, ConditionDef, conditions[], conditionDurations, conditionValues; added conditionManager + conditionVersion

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend ConditionManager (TDD)** - `661a176` (feat)
2. **Task 2: Migrate Creature interface** - `5534287` (feat)

_Note: Task 1 used TDD — tests written first (RED: 14 failing), then implementation (GREEN: 36 passing)._

## Files Created/Modified

- `src/lib/pf2e/conditions.ts` - Added endTurn(), setDuration(), setProtected(), isProtected(), getAll(); modified add() for dying cascade; added durations Map and protected_ Set
- `src/lib/pf2e/__tests__/conditions.test.ts` - Added 14 new tests: dying cascade, endTurn decrement, duration tracking, protected conditions, getAll
- `src/types/combat.ts` - Removed Condition type, ConditionDef, legacy condition fields; added ConditionManager import, conditionManager and conditionVersion fields

## Decisions Made

- **slowed in endTurn():** Included slowed alongside frightened/sickened/stunned per PF2e CRB rules. CONTEXT.md listed 3 conditions but the rule applies to 4 — this falls under Claude's discretion per RESEARCH.md.
- **Cascade always replaces:** add('dying', value) always stores `value + wounded` regardless of whether dying already exists. Prevents double-counting on re-apply (Pitfall 2 from RESEARCH.md).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — the downstream TypeScript errors shown by vue-tsc are expected per the plan's `<done>` specification for Task 2. All errors are in combat store, components, and composables that will be updated in Plans 02 and 03.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ConditionManager is the authoritative condition engine with full PF2e rules
- Creature interface type contract is established for Plans 02 and 03
- Plan 02 (combat store migration) can now wire up conditionManager/conditionVersion on creatures and route all mutations through CM
- Plan 03 (ConditionBadge rewrite) can use CM.getAll() + conditionVersion for reactive display

---
*Phase: 07-type-foundation-and-condition-engine*
*Completed: 2026-03-25*

## Self-Check: PASSED

- FOUND: src/lib/pf2e/conditions.ts
- FOUND: src/lib/pf2e/__tests__/conditions.test.ts
- FOUND: src/types/combat.ts
- FOUND: .planning/phases/07-type-foundation-and-condition-engine/07-01-SUMMARY.md
- FOUND commit: 661a176 (Task 1)
- FOUND commit: 5534287 (Task 2)
