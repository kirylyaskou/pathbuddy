---
phase: 04-actions-modifier-math
plan: 03
subsystem: engine
tags: [statistic, modifier-math, conditions, MAP, pf2e, selector-resolver]

# Dependency graph
requires:
  - phase: 04-01
    provides: "Creature interface with abilities, AC, saves, perception, skills, attacks, CreatureAttack with mapSets"
  - phase: 03-01
    provides: "CONDITION_EFFECTS map, ConditionManager, condition-effects types"
provides:
  - "Statistic class (base value + modifier overlay using existing StatisticModifier)"
  - "resolveSelector function mapping selector strings to statistic slugs"
  - "CreatureStatistics adapter wiring conditions to statistics"
  - "buildAttackModifierSets function for MAP pre-computation"
affects: [04-04, combat-tracker, stat-block-display]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Adapter pattern: CreatureStatistics wraps ConditionManager without modifying it"
    - "Source-tagged modifier slugs: conditionSlug:targetSlug for batch removal"
    - "Recompute-on-read: Statistic.totalModifier recomputes via StatisticModifier each access"

key-files:
  created:
    - engine/statistics/statistic.ts
    - engine/statistics/selector-resolver.ts
    - engine/statistics/creature-statistics.ts
  modified:
    - engine/index.ts

key-decisions:
  - "Adapter pattern: CreatureStatistics wraps ConditionManager without modifying it (Option B from Research)"
  - "Recompute-on-read for totalModifier to avoid stale cache (anti-pattern from research)"
  - "Source-tagged slug format conditionSlug:targetSlug enables batch modifier removal"
  - "CON_SKILLS removed as unused constant -- con-based maps directly to fortitude"

patterns-established:
  - "Statistic class: base value + modifier overlay using existing applyStackingRules"
  - "Selector resolver: maps PF2e condition selectors to creature statistic slugs"
  - "CreatureStatistics adapter: auto-inject/eject condition modifiers without coupling ConditionManager to statistics"

requirements-completed: [ENG-03]

# Metrics
duration: 4min
completed: 2026-03-31
---

# Phase 04 Plan 03: Statistic System Summary

**Statistic class with base-value-plus-modifier overlay, selector resolver for 11 PF2e condition selectors, CreatureStatistics adapter with auto-inject/eject, and MAP 3-attack modifier sets**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T11:14:27Z
- **Completed:** 2026-03-31T11:18:37Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Statistic class wraps baseValue + modifier overlay using existing StatisticModifier/applyStackingRules
- Selector resolver handles all 11 CONDITION_EFFECTS selector strings with correct PF2e ability-skill assignments (dex-based includes AC per D-11)
- CreatureStatistics adapter auto-injects/ejects condition modifiers when conditions change, populates attack.mapSets per D-14
- buildAttackModifierSets produces 3 MAP positions per attack with untyped penalties (agile: -4/-8, non-agile: -5/-10)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Statistic class and selector resolver** - `ee40e70` (feat)
2. **Task 2: Create CreatureStatistics adapter with MAP and barrel exports** - `eec174a` (feat)

## Files Created/Modified
- `engine/statistics/statistic.ts` - Statistic class with base value + modifier overlay model
- `engine/statistics/selector-resolver.ts` - resolveSelector mapping condition selectors to statistic slugs
- `engine/statistics/creature-statistics.ts` - CreatureStatistics adapter + buildAttackModifierSets for MAP
- `engine/index.ts` - Updated barrel export with statistics module

## Decisions Made
- **Adapter pattern (Option B):** CreatureStatistics wraps ConditionManager without modifying it. Caller is responsible for calling onConditionAdded/Removed after manipulating ConditionManager. This preserves ConditionManager as a pure condition tracker.
- **Recompute-on-read:** Statistic.totalModifier recomputes via fresh StatisticModifier on each access to avoid stale cache (anti-pattern identified in research).
- **Source-tagged slugs:** Modifier slugs use format "conditionSlug:targetSlug" (e.g., "frightened:ac") enabling removeModifiersBySource to batch-remove all modifiers from a condition.
- **Removed CON_SKILLS:** Unused constant removed to satisfy noUnusedLocals. Con-based maps directly to 'fortitude' in the switch case.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused CON_SKILLS constant**
- **Found during:** Task 1 (Selector resolver creation)
- **Issue:** CON_SKILLS empty array declared but never used, causing TypeScript noUnusedLocals error
- **Fix:** Replaced with a comment explaining why no CON_SKILLS array exists
- **Files modified:** engine/statistics/selector-resolver.ts
- **Verification:** npx tsc --noEmit passes with zero errors
- **Committed in:** ee40e70 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor TypeScript compliance fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Statistics system complete, ready for Plan 04 (integration/wiring)
- CreatureStatistics can be instantiated with any Creature to get modifier-adjusted values
- buildAttackModifierSets is exported for direct use in combat UI

## Self-Check: PASSED

All 4 created/modified files verified on disk. Both task commits (ee40e70, eec174a) verified in git log. No stubs found.

---
*Phase: 04-actions-modifier-math*
*Completed: 2026-03-31*
