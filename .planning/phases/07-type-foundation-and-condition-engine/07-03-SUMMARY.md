---
phase: 07-type-foundation-and-condition-engine
plan: 03
subsystem: ui
tags: [vue3, composable, condition-manager, tailwind, vitest, vue-tsc]

requires:
  - phase: 07-01
    provides: ConditionManager class, ConditionSlug type, CONDITION_SLUGS, VALUED_CONDITIONS from @/lib/pf2e
  - phase: 07-02
    provides: combat store wired to ConditionManager, conditionVersion reactivity pattern

provides:
  - useConditions composable with 44-entry CONDITION_BADGE_CLASSES and PICKER_CATEGORIES (7 categories)
  - ConditionBadge reading from creature.conditionManager via conditionVersion computed
  - Categorized 44-condition picker with 7 collapsible sections
  - Valued condition counters on badges (e.g. 'Stunned 2', 'Frightened 3')
  - Badge click decrement for valued conditions; toggle for non-valued
  - CreatureCard passing creature directly to ConditionBadge
  - CombatTracker using ConditionSlug (no as any cast)
  - Zero TypeScript errors across entire codebase (vue-tsc clean)

affects: [src/components/ConditionBadge.vue, src/components/CreatureCard.vue, src/components/CombatTracker.vue, src/components/CombatDetailPanel.vue, src/composables/useConditions.ts]

tech-stack:
  added: []
  patterns: [version-counter-reactivity-in-computed, static-tailwind-badge-classes, categorized-picker-with-collapse]

key-files:
  created: []
  modified:
    - src/composables/useConditions.ts
    - src/components/ConditionBadge.vue
    - src/components/CreatureCard.vue
    - src/components/CombatTracker.vue
    - src/components/CombatDetailPanel.vue
    - src/components/HPController.vue
    - src/components/__tests__/ConditionBadge.test.ts
    - src/components/__tests__/CreatureCard.test.ts
    - src/components/__tests__/CombatDetailPanel.test.ts

key-decisions:
  - "conditionHasValue uses VALUED_CONDITIONS (11-entry const) from @/lib/pf2e; prior Set-based check removed"
  - "PICKER_CATEGORIES organizes 44 conditions into 7 semantic groups: Detection, Attitudes, Movement, Mental, Physical, Combat, Other"
  - "CombatTracker uses (creature as Creature) cast for :creature prop binding to resolve vue reactive proxy structural type mismatch (same pattern as mutateCondition: any in combat store)"
  - "CombatDetailPanel conditionsWithValues migrated from creature.conditions array to conditionManager.getAll() with conditionVersion dependency"
  - "HPController defineProps no longer assigned to const props (TS6133 fix — props accessed directly in template in script setup)"

requirements-completed: [COND-03]

duration: ~15min
completed: 2026-03-25
---

# Phase 07 Plan 03: Condition UI Layer Migration Summary

**44-condition categorized picker + valued condition counters delivered via full rewrite of useConditions, ConditionBadge, CreatureCard, CombatTracker, and CombatDetailPanel to the ConditionManager API.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-25T11:28:52Z
- **Completed:** 2026-03-25T11:38:14Z
- **Tasks:** 2 auto + 1 auto-approved checkpoint
- **Files modified:** 9

## Accomplishments

- useConditions composable fully rewritten: 44-entry CONDITION_BADGE_CLASSES (keyed by ConditionSlug), PICKER_CATEGORIES (7 sections), conditionHasValue() using VALUED_CONDITIONS from engine
- ConditionBadge redesigned: reads conditions from `creature.conditionManager.getAll()` via conditionVersion computed; shows valued counters on badges; categorized collapsible picker with 7 sections
- CreatureCard now passes `:creature="creature"` directly (removed old conditions/conditionValues/creatureId triple-prop pattern)
- CombatTracker uses ConditionSlug with no `as any` cast on toggleCondition
- All tests updated and passing: 551 total, 0 failures
- TypeScript compiles clean across entire codebase (vue-tsc --noEmit exits 0)

## Task Commits

1. **Task 1: Rewrite useConditions composable** - `8ac9027` (feat)
2. **Task 2: Rewrite ConditionBadge, update CreatureCard/CombatTracker, fix tests** - `2d9c404` (feat)
3. **Task 3: Checkpoint** - auto-approved (auto_advance: true)

## Files Created/Modified

- `src/composables/useConditions.ts` - Fully rewritten: imports CONDITION_SLUGS/VALUED_CONDITIONS from @/lib/pf2e; exports PICKER_CATEGORIES, CONDITION_BADGE_CLASSES (44 entries), conditionHasValue(), formatCondition()
- `src/components/ConditionBadge.vue` - Rewritten: creature prop, conditionManager reactivity, 44-condition categorized picker with collapsible sections, valued counters
- `src/components/CreatureCard.vue` - Updated: ConditionSlug types, :creature passthrough to ConditionBadge
- `src/components/CombatTracker.vue` - Updated: ConditionSlug (no as any), Creature cast for reactive proxy
- `src/components/CombatDetailPanel.vue` - Updated: conditionsWithValues reads from conditionManager.getAll()
- `src/components/HPController.vue` - Minor: remove unused const props binding (TS6133)
- `src/components/__tests__/ConditionBadge.test.ts` - Rewritten: makeTestCreature helper using ConditionManager
- `src/components/__tests__/CreatureCard.test.ts` - Rewritten: makeCreature helper using ConditionManager
- `src/components/__tests__/CombatDetailPanel.test.ts` - Updated: condition test uses store.toggleCondition()

## Decisions Made

- `conditionHasValue` now uses `(VALUED_CONDITIONS as readonly string[]).includes(slug)` — avoids Set construction, uses engine source of truth
- `PICKER_CATEGORIES` organizes all 44 conditions into 7 named categories; each category is an ordered ConditionSlug array
- `CombatTracker.vue` binds `:creature="(creature as Creature)"` to resolve Vue reactive proxy structural type incompatibility (private fields stripped from markRaw'd ConditionManager are invisible to TypeScript)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CombatDetailPanel used creature.conditions (old API)**
- **Found during:** Task 2 verification (vue-tsc check)
- **Issue:** `CombatDetailPanel.vue` `conditionsWithValues` computed referenced `creature.conditions` and `creature.conditionValues` — properties removed in Plan 01
- **Fix:** Migrated to `conditionManager.getAll()` with `void creature.conditionVersion` dependency
- **Files modified:** src/components/CombatDetailPanel.vue
- **Verification:** vue-tsc exits 0; CombatDetailPanel tests pass
- **Committed in:** 2d9c404 (Task 2 commit)

**2. [Rule 1 - Bug] CombatTracker ConditionManager structural type mismatch**
- **Found during:** Task 2 verification (vue-tsc check)
- **Issue:** `:creature="creature"` binding in CombatTracker failed type check because Vue reactive proxy wraps Creature and TypeScript sees conditionManager as structural type (missing private fields), incompatible with CreatureCard's Creature prop
- **Fix:** Added `import type { Creature }` and cast `(creature as Creature)` at binding site — consistent with project pattern (`mutateCondition: any` in combat store)
- **Files modified:** src/components/CombatTracker.vue
- **Verification:** vue-tsc exits 0
- **Committed in:** 2d9c404 (Task 2 commit)

**3. [Rule 1 - Bug] HPController unused props caused TS6133 error**
- **Found during:** Task 2 verification (vue-tsc check)
- **Issue:** `const props = defineProps<...>()` — TypeScript TS6133 flagged `props` as declared but never read (in script setup, template accesses props directly without needing the binding)
- **Fix:** Changed to `defineProps<...>()` without assignment
- **Files modified:** src/components/HPController.vue
- **Verification:** vue-tsc exits 0
- **Committed in:** 2d9c404 (Task 2 commit)

**4. [Rule 1 - Bug] CreatureCard.test.ts and CombatDetailPanel.test.ts used old conditions array API**
- **Found during:** Task 2 (vitest run after component rewrites)
- **Issue:** CreatureCard tests passed `conditions: []` in creature fixture (no conditionManager); CombatDetailPanel test passed `conditions: ['stunned'] as any` which was ignored by new addCreature signature — creature had empty conditionManager so the test assertion for condition display failed
- **Fix:** Rewrote CreatureCard.test.ts with makeCreature() helper using ConditionManager; fixed CombatDetailPanel condition test to call `store.toggleCondition()` after addCreature
- **Files modified:** src/components/__tests__/CreatureCard.test.ts, src/components/__tests__/CombatDetailPanel.test.ts
- **Verification:** 551 tests pass (npx vitest run)
- **Committed in:** 2d9c404 (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (2 blocking, 2 bugs)
**Impact on plan:** All auto-fixes required for TypeScript clean compile and correct test execution. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 07 complete: TYPE-01 (Creature interface), COND-01 (ConditionManager), COND-02 (store), COND-03 (UI layer), COND-05 (endTurn decrement) all satisfied
- Phase 08 (IWR and Damage Display) can proceed: Creature interface is stable, ConditionManager API is established
- No references to old `Condition` type remain in src/ — clean slate for next phase

## Self-Check: PASSED

- `src/composables/useConditions.ts` — FOUND
- `src/components/ConditionBadge.vue` — FOUND
- `.planning/phases/07-type-foundation-and-condition-engine/07-03-SUMMARY.md` — FOUND
- Commit 8ac9027 — FOUND (Task 1: useConditions rewrite)
- Commit 2d9c404 — FOUND (Task 2: component rewrites + tests)

---
*Phase: 07-type-foundation-and-condition-engine*
*Completed: 2026-03-25*
