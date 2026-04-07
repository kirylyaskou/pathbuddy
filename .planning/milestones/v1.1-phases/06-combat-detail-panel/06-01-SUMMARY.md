---
phase: 06-combat-detail-panel
plan: 01
subsystem: ui
tags: [vue3, tailwind, sqlite, drizzle-orm, vitest, pf2e, xp-calculation, stat-block]

# Dependency graph
requires:
  - phase: 05-combat-workspace
    provides: creature-resolver, description-sanitizer, entity-query, database/schema modules
  - phase: 03-compendium-browser
    provides: filterEntities foundation, PITFALLS.md patterns, FTS5 query infrastructure
provides:
  - getXpForCreature() pure function (XP_DELTA_MAP lookup, all 9 PF2e deltas)
  - filterEntities with offset parameter (infinite scroll pagination)
  - StatBlock.vue pure prop-driven shared stat block component
affects:
  - 06-02 (CreatureBrowser enhancements — uses filterEntities offset + XP badge)
  - 06-03 (CombatDetailPanel — consumes StatBlock.vue)
  - 06-04 (CompendiumView 2-column — consumes StatBlock.vue)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "XP_DELTA_MAP lookup table pattern — const Record<number,number> with negative index syntax [-4]: 10"
    - "Race-condition-safe item resolver — currentRequestId counter discards stale async results"
    - "OFFSET $N in all 4 SQL branches — consistent pagination across FTS5+tags, FTS5, list-all+tags, list-all"
    - "Pure display component pattern — no Pinia, only props + local refs + computed"

key-files:
  created:
    - src/lib/xp-calculator.ts
    - src/lib/__tests__/xp-calculator.test.ts
    - src/components/StatBlock.vue
    - src/components/__tests__/StatBlock.test.ts
  modified:
    - src/lib/entity-query.ts
    - src/lib/__tests__/entity-query.test.ts

key-decisions:
  - "XP_DELTA_MAP constant name used (plan mandated) — previous file had XP_TABLE, renamed for plan acceptance criteria"
  - "Default limit changed 100→200 in filterEntities — infinite scroll page size per locked decision"
  - "OFFSET clause added after LIMIT in all 4 SQL branches — consistent pagination regardless of query path"
  - "StatBlock uses local navigationHistory ref instead of Pinia store — pure display component, no cross-context state"
  - "Race condition guard via currentRequestId counter — discards stale resolveCreatureItems results on fast rawData changes"
  - "entity-query.test.ts updated for new 200 default and offset param position — params layout [cols..., limit, offset]"

patterns-established:
  - "currentRequestId counter pattern: let n=0; const id=++n; after async, if (id !== n) return — prevents stale state"
  - "OFFSET clause position in 4-branch SQL: after LIMIT $N, add OFFSET $N+1 with same param appended after limit"

requirements-completed: [WORK-06]

# Metrics
duration: 4min
completed: 2026-03-23
---

# Phase 06 Plan 01: Foundational Utilities and StatBlock Component Summary

**XP delta lookup (getXpForCreature), filterEntities OFFSET pagination, and StatBlock.vue pure prop-driven stat block renderer with always-expanded sections**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-23T22:28:15Z
- **Completed:** 2026-03-23T22:33:14Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created `getXpForCreature()` with `XP_DELTA_MAP` covering all 9 PF2e deltas (−4=10 XP to +4=160 XP), null outside range
- Added `offset` parameter to `filterEntities` with `OFFSET` clause in all 4 SQL branches; default limit changed from 100 to 200
- Created `StatBlock.vue` — 420-line pure prop-driven component with no Pinia dependency, rendering entity name (gold), rarity/trait pills, HP|AC|Perc|Speed row, Fort|Ref|Will row, languages, skills, 6-column ability scores grid, always-expanded body sections
- 29 new tests passing across xp-calculator (13) and StatBlock (16) test suites

## Task Commits

Each task was committed atomically:

1. **Task 1: XP calculator utility and filterEntities offset** - `1b3595c` (feat)
2. **Task 2: StatBlock.vue shared component with tests** - `dff98fc` (feat)

**Plan metadata:** see final commit

## Files Created/Modified
- `src/lib/xp-calculator.ts` — XP_DELTA_MAP + getXpForCreature() pure function
- `src/lib/__tests__/xp-calculator.test.ts` — 13 tests covering all 9 deltas and null edge cases
- `src/lib/entity-query.ts` — filterEntities offset parameter + OFFSET in all 4 SQL branches; default limit 200
- `src/lib/__tests__/entity-query.test.ts` — updated for new 200 default and offset param (37 tests)
- `src/components/StatBlock.vue` — pure prop-driven stat block component (420 lines)
- `src/components/__tests__/StatBlock.test.ts` — 16 tests covering render states, sections, and always-expanded behavior

## Decisions Made
- `XP_DELTA_MAP` constant name used to match plan acceptance criteria (pre-existing file had `XP_TABLE`)
- `filterEntities` default limit changed 100→200 per locked infinite-scroll page size decision
- `OFFSET` appended after `limit` in params array — position is `params[params.length - 1]`, limit at `params[params.length - 2]`
- `StatBlock.vue` uses local `navigationHistory` ref instead of Pinia — ensures it can be used in both Combat and Compendium contexts without state contamination
- Race-condition guard via `currentRequestId` counter — matches RESEARCH.md Pitfall 4

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed XP_TABLE to XP_DELTA_MAP in xp-calculator.ts**
- **Found during:** Task 1 (XP calculator creation)
- **Issue:** File pre-existed with `XP_TABLE` constant name; plan acceptance criteria required `XP_DELTA_MAP`
- **Fix:** Updated constant name and doc comment to use `XP_DELTA_MAP` as specified
- **Files modified:** src/lib/xp-calculator.ts
- **Verification:** Acceptance criteria grep passes; all 13 tests pass
- **Committed in:** 1b3595c (Task 1 commit)

**2. [Rule 2 - Missing Critical] Updated entity-query tests for new default limit**
- **Found during:** Task 1 (filterEntities offset changes)
- **Issue:** Existing test `'uses default limit of 100'` would fail when default changed to 200; params index for limit also shifted due to new offset param
- **Fix:** Updated test description to 200, fixed params index assertions for both limit and offset positions
- **Files modified:** src/lib/__tests__/entity-query.test.ts
- **Verification:** All 37 entity-query tests pass
- **Committed in:** 1b3595c (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug — constant rename, 1 missing critical — test update)
**Impact on plan:** Both fixes needed for correctness. No scope creep.

## Issues Encountered
None — execution went smoothly.

## Next Phase Readiness
- `getXpForCreature()` ready for Plan 02 (CreatureBrowser XP badge)
- `filterEntities` offset ready for Plan 02 (infinite scroll pagination)
- `StatBlock.vue` ready for Plan 03 (CombatDetailPanel) and Plan 04 (CompendiumView 2-column)
- No blockers

---
*Phase: 06-combat-detail-panel*
*Completed: 2026-03-23*
