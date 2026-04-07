---
phase: 03-conditions-statuses
plan: 02
subsystem: engine
tags: [conditions, pf2e, typescript, condition-manager, grant-chains, immunity]

# Dependency graph
requires:
  - phase: 03-01
    provides: CONDITION_EFFECTS, CONDITION_OVERRIDES, CONDITION_GROUPS_EXTENDED, EXCLUSIVE_GROUPS from condition-effects.ts; Creature interface in types.ts

provides:
  - Extended ConditionManager with full PF2e condition behavior chain
  - Immunity check via setCreature() and creature_.immunities
  - Override-driven condition removal (blinded->dazzled, stunned->slowed, attitude overrides)
  - Exclusive group enforcement for detection/attitudes only (senses/abilities/death non-exclusive)
  - Grant chain tracking with grantedBy Map and cascading removal via removeGranteesOf()
  - Valued condition Math.max semantics (no additive stacking)
  - Dying death-threshold capping: min(value + wounded, 4 - doomed)
  - Grant provenance query via getGranter()
  - CONDITION_GROUPS re-exported from CONDITION_GROUPS_EXTENDED (5 groups)

affects: [04-modifiers-actions, future combat tracker, future creature state management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "grantDepth counter for safe recursive grant chain application without infinite recursion"
    - "grantedBy Map<ConditionSlug, ConditionSlug> for grant provenance and cascading removal"
    - "removeInternal() vs remove() — internal removal skips dying->wounded cascade for override/exclusivity cleanup"
    - "setCreature() injection pattern for optional immunity context without changing add() signature"

key-files:
  created: []
  modified:
    - engine/conditions/conditions.ts

key-decisions:
  - "setCreature() setter chosen over constructor injection — keeps ConditionManager constructable without a creature reference while still supporting immunity checking"
  - "grantDepth counter (limit 5) allows transitive grant chains (dying->unconscious->blinded+off-guard+prone) without infinite recursion risk"
  - "removeInternal() deliberately skips dying->wounded cascade — override/exclusivity removal should not trigger wound accumulation"
  - "Valued condition Math.max applied only when condition already exists — first application always uses provided value"
  - "Dying cap uses Math.min(rawValue, deathThreshold) — cap enforced but death detection is caller responsibility (no engine-side 'dead' signal)"

patterns-established:
  - "Grant tracking pattern: grantedBy.set(grantedSlug, granterSlug) on grant; removeGranteesOf() on remove"
  - "Depth-guarded recursion: grantDepth counter incremented in try/finally block"

requirements-completed: [ENG-01]

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 03 Plan 02: Condition Behavior Engine Summary

**ConditionManager extended with immunity check, override removal, exclusive group enforcement, transitive grant chains (dying->unconscious->blinded+off-guard+prone), grant cascade removal, valued-condition Math.max semantics, and dying death-threshold capping**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-31T07:20:13Z
- **Completed:** 2026-03-31T07:21:53Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Rewrote `ConditionManager.add()` to implement the complete PF2e condition behavior chain: immunity check (D-25) -> override removal (D-07) -> exclusive group enforcement (D-08/D-09/D-10) -> dying wounded+doomed logic with death-threshold cap (D-13, D-26) -> valued condition Math.max semantics -> grant chain application (D-05)
- Rewrote `ConditionManager.remove()` to cascade grant removal via `removeGranteesOf()` — removing grabbed also removes its granted off-guard and immobilized
- Added `grantedBy: Map<ConditionSlug, ConditionSlug>` tracking so grants are only removed when not independently applied
- `CONDITION_GROUPS` now has all 5 groups (detection, attitudes, senses, abilities, death); only detection and attitudes enforce exclusivity
- TypeScript compiles with zero errors

## Task Commits

1. **Task 1: Replace CONDITION_GROUPS and refactor add() with override-driven exclusivity, grant chains, immunity check, and value semantics** - `bb79d7c` (feat)

## Files Created/Modified
- `engine/conditions/conditions.ts` - Complete behavioral rewrite of ConditionManager with all D-01 through D-10, D-25, D-26 mechanics

## Decisions Made
- Used `setCreature()` setter instead of constructor injection — ConditionManager remains constructable without a creature reference, easier to initialize and later wire to a creature context
- Used `grantDepth` counter with limit of 5 instead of a simple boolean guard — allows transitive chains (dying grants unconscious which grants blinded+off-guard+prone) without causing stack overflow on unexpected cycles
- `removeInternal()` deliberately does NOT trigger dying->wounded cascade — this method is for override/exclusivity cleanup, and removing an attitude condition via override should not wound the creature
- Dying cap: `Math.min(rawValue, deathThreshold)` — the engine caps but does not emit a death signal; caller (future combat tracker) detects death by checking if dying value equals the threshold

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The worktree branch (`worktree-agent-a95c72ca`) started at the initial commit `7568487` and did not yet include Plan 01 commits from master. Rebased onto master before beginning implementation — this was expected parallel agent setup behavior, not a code issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ConditionManager is now the authoritative behavioral engine for all PF2e condition interactions
- Plan 03-03 (death progression, recovery checks) can consume the now-extended ConditionManager directly
- `getGranter()` method available for UI grant-provenance display in future frontend milestone

---
*Phase: 03-conditions-statuses*
*Completed: 2026-03-31*
