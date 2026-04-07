---
phase: 04-actions-modifier-math
plan: 01
subsystem: engine
tags: [typescript, pf2e, types, degree-of-success, creature, actions, modifiers]

# Dependency graph
requires:
  - phase: 03-conditions-statuses
    provides: Creature interface, ConditionManager, death-progression, ConditionSlug
provides:
  - Extended Creature interface with full NPC stat block fields (abilities, AC, saves, perception, skills, speed, attacks)
  - Action type system (Action, ActionType, ActionCost, ActionCategory, DegreeKey, ActionOutcomeMap)
  - DegreeOfSuccess calculation module with adjustment pipeline
  - INCAPACITATION_ADJUSTMENT pre-built adjustment
  - basicSaveDamageMultiplier utility
  - CreatureAttack with mapSets for pre-computed MAP modifier sets
affects: [04-02-PLAN, 04-03-PLAN, 04-04-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [degree-adjustment-pipeline, flat-check-delegation, declarative-action-outcomes]

key-files:
  created:
    - engine/actions/types.ts
    - engine/degree-of-success/degree-of-success.ts
  modified:
    - engine/types.ts
    - engine/conditions/death-progression.ts

key-decisions:
  - "RecoveryCheckOutcome aliased to DegreeOfSuccess for single source of truth (Pitfall 4)"
  - "DegreeKey uses underscores (critical_success) for JSON key compatibility; DegreeOfSuccess uses camelCase (criticalSuccess) for runtime"
  - "skills is Record<string, number> (empty {} for skill-less creatures) to prevent null crashes"
  - "mapSets on CreatureAttack is optional — populated by CreatureStatistics in Plan 03, not from raw data"

patterns-established:
  - "Degree adjustment pipeline: calculateDegreeOfSuccess accepts DegreeAdjustment[] for extensible post-roll modifications"
  - "Flat check delegation: all flat checks use calculateDegreeOfSuccess(roll, 0, dc) with totalModifier=0"
  - "Declarative action outcomes: ActionOutcomeMap maps DegreeKey to effects without dice rolling"

requirements-completed: [ENG-02, ENG-03]

# Metrics
duration: 3min
completed: 2026-03-31
---

# Phase 04 Plan 01: Type Foundations & Degree-of-Success Summary

**Full NPC stat block Creature interface, Action type system with declarative outcome maps, and centralized degree-of-success calculator with adjustment pipeline**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-31T09:50:30Z
- **Completed:** 2026-03-31T09:54:09Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Expanded Creature interface from 5 Phase 3 fields to full NPC stat block (abilities, AC, saves, perception, skills, speed, senses, traits, size, rarity, languages, initiative, attacks)
- Created Action type system with ActionType, ActionCost, ActionCategory, DegreeKey, ActionOutcome, ActionOutcomeMap, and Action interfaces
- Built degree-of-success module with calculateDegreeOfSuccess pure function, upgrade/downgrade helpers, DegreeAdjustment pipeline, INCAPACITATION_ADJUSTMENT, and basicSaveDamageMultiplier
- Refactored performRecoveryCheck to delegate degree calculation to centralized module, eliminating Pitfall 4 divergence risk

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand Creature interface and create Action type definitions** - `4a70a69` (feat)
2. **Task 2: Create degree-of-success module and refactor performRecoveryCheck** - `96cef76` (feat)

## Files Created/Modified
- `engine/types.ts` - Extended Creature with full NPC stat block; added AbilityKey, CreatureSize, Rarity, CreatureSense, CreatureSpeed, DamageRoll, CreatureAttack types
- `engine/actions/types.ts` - Action type system with ActionType, ActionCost, ActionCategory, DegreeKey, ActionOutcome, ActionOutcomeMap, Action
- `engine/degree-of-success/degree-of-success.ts` - DegreeOfSuccess type, calculateDegreeOfSuccess, upgrade/downgrade helpers, INCAPACITATION_ADJUSTMENT, basicSaveDamageMultiplier
- `engine/conditions/death-progression.ts` - Refactored to import and delegate to calculateDegreeOfSuccess; RecoveryCheckOutcome aliased to DegreeOfSuccess

## Decisions Made
- RecoveryCheckOutcome aliased to DegreeOfSuccess to maintain backward compatibility while using single source of truth
- DegreeKey (underscored, for JSON keys in ActionOutcomeMap) kept separate from DegreeOfSuccess (camelCase, for runtime values) per plan specification
- skills typed as Record<string, number> with empty {} for creatures without skills, preventing null reference crashes
- mapSets field on CreatureAttack made optional since it is computed by CreatureStatistics (Plan 03), not present in raw Foundry data

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All type foundations in place for Plans 02-04 to build against
- Plans 02-04 can import Creature, Action types, and calculateDegreeOfSuccess
- CreatureAttack.mapSets ready for Plan 03 (CreatureStatistics) to populate
- DegreeAdjustment pipeline ready for incapacitation and future adjustment types

## Self-Check: PASSED

All 4 created/modified files verified present on disk. Both task commits (4a70a69, 96cef76) verified in git log.

---
*Phase: 04-actions-modifier-math*
*Completed: 2026-03-31*
