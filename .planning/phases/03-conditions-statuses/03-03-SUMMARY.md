---
phase: 03-conditions-statuses
plan: 03
subsystem: engine
tags: [pf2e, conditions, death-progression, recovery-check, barrel-export, typescript]

# Dependency graph
requires:
  - phase: 03-conditions-statuses plan 01
    provides: CONDITION_EFFECTS in condition-effects.ts, Creature interface in types.ts, CONDITION_IMMUNITY_TYPES/EFFECT_IMMUNITY_TYPES in iwr.ts
provides:
  - engine/conditions/death-progression.ts (performRecoveryCheck pure function, RecoveryCheckOutcome type, RecoveryCheckResult interface)
  - engine/index.ts updated barrel: all Phase 3 symbols exported via @engine (Creature, CONDITION_EFFECTS, CONDITION_OVERRIDES, CONDITION_GROUPS_EXTENDED, EXCLUSIVE_GROUPS, all effect types, performRecoveryCheck, RecoveryCheckOutcome, RecoveryCheckResult, CONDITION_IMMUNITY_TYPES, EFFECT_IMMUNITY_TYPES, ConditionImmunityType, EffectImmunityType)
affects: [all future phases consuming @engine — full Phase 3 API now accessible]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure function recovery check: performRecoveryCheck(dyingValue, doomedValue, rollOverride?) — no side effects, deterministic via rollOverride"
    - "Death threshold via doomed: deathThreshold = 4 - doomedValue; newDyingValue = -1 signals dead to caller"
    - "Natural 20/1 degree-of-success upgrade/downgrade: handled as special cases before numeric range checks"
    - "Barrel export growth pattern: merge new exports into existing sections (Types/Conditions/Damage) rather than append at end"

key-files:
  created:
    - engine/conditions/death-progression.ts
  modified:
    - engine/index.ts

key-decisions:
  - "rollOverride parameter enables deterministic recovery checks without random state — critical for unit testing and deterministic replay"
  - "Dead signal is newDyingValue = -1 (not a boolean field) — single return field conveys both 'what dying value' and 'is dead' state"
  - "Stabilized = dying drops to 0 AND not dead; stabilized creature remains unconscious (caller responsibility per D-15)"
  - "Natural 20/1 handling on flat checks: 20 upgrades one step, 1 downgrades one step — pure PF2e mechanic, independent of Phase 4 degree-of-success system"

patterns-established:
  - "Barrel-export-last pattern: implement module first, wire into barrel as final task of plan"

requirements-completed: [ENG-01]

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 03 Plan 03: Death Progression & Barrel Export Summary

**PF2e recovery check pure function (performRecoveryCheck) with natural 20/1 flat-check rules, death threshold via doomed, and complete Phase 3 barrel export via @engine**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T07:20:36Z
- **Completed:** 2026-03-31T07:22:40Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created engine/conditions/death-progression.ts with `performRecoveryCheck` implementing PF2e flat check: DC = 10 + dying, 4 degree-of-success outcomes, natural 20 upgrades/nat 1 downgrades, death threshold = 4 - doomed, stabilization detection
- Updated engine/index.ts barrel export to expose all Phase 3 symbols: Creature type, all condition-effects constants and types, performRecoveryCheck and its types, CONDITION_IMMUNITY_TYPES/EFFECT_IMMUNITY_TYPES and their types

## Task Commits

Each task was committed atomically:

1. **Task 1: Create death-progression.ts with performRecoveryCheck pure function** - `c9dba69` (feat)
2. **Task 2: Update engine/index.ts barrel export with all Phase 3 additions** - `d757478` (feat)

## Files Created/Modified
- `engine/conditions/death-progression.ts` — New file: `performRecoveryCheck` pure function, `RecoveryCheckResult` interface, `RecoveryCheckOutcome` type; implements PF2e flat check with all four degree-of-success outcomes, natural 20/1 rules, death threshold via doomed value
- `engine/index.ts` — Added Creature to Types section; added full condition-effects exports (CONDITION_EFFECTS, CONDITION_OVERRIDES, CONDITION_GROUPS_EXTENDED, EXCLUSIVE_GROUPS, 5 effect types); added death-progression exports (performRecoveryCheck, 2 types); added CONDITION_IMMUNITY_TYPES, EFFECT_IMMUNITY_TYPES, ConditionImmunityType, EffectImmunityType to Damage section

## Decisions Made

- `rollOverride` parameter makes `performRecoveryCheck` deterministic for testing and replay — callers omit it for real random rolls
- `newDyingValue: -1` signals death to the caller rather than a separate `dead: boolean` field — avoids redundant state
- Stabilized creature detection: `stabilized = newDying === 0 && !dead` — caller responsibility to NOT remove unconscious on stabilization (D-15)
- Natural 20/1 handled as explicit `roll === 20` / `roll === 1` branches before the numeric range checks — ensures correct flat check semantics

## Deviations from Plan

None - plan executed exactly as written. Worktree branch was rebased onto master HEAD before execution to pick up engine/ directory and Phase 3 Plan 01 commits.

## Known Stubs

None. This plan creates only pure functions and barrel export wiring — no UI rendering, no data flows, no placeholder values.

## Issues Encountered
None

## Next Phase Readiness
- Full Phase 3 engine API now accessible via `import { ... } from '@engine'`
- `performRecoveryCheck` ready for consumption by combat tracker (Phase 4+)
- All Phase 3 condition data contracts (CONDITION_EFFECTS, overrides, groups, IWR types) exported and available

## Self-Check: PASSED

- FOUND: engine/conditions/death-progression.ts
- FOUND: engine/index.ts (updated)
- FOUND: 03-03-SUMMARY.md
- FOUND: commit c9dba69 (Task 1)
- FOUND: commit d757478 (Task 2)
- TypeScript: zero errors

---
*Phase: 03-conditions-statuses*
*Completed: 2026-03-31*
