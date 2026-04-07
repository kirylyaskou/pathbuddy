---
phase: 01-xp-encounter-budget
plan: 01
subsystem: game-logic
tags: [pf2e, xp, tdd, encounter-budget, pwol]

# Dependency graph
requires: []
provides:
  - "calculateCreatureXP: creature-vs-party XP lookup with standard and PWOL tables"
  - "getHazardXp: simple/complex hazard XP with PWOL support"
  - "XP lookup tables: CREATURE_XP, PWOL_CREATURE_XP, SIMPLE_HAZARD_XP"
  - "Type exports: XpResult, HazardType, ThreatRating"
  - "Barrel index at src/lib/pf2e/index.ts"
affects: [01-xp-encounter-budget-plan-02, encounter-builder-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [record-lookup-table, xp-result-union-type, pwol-option-propagation]

key-files:
  created:
    - src/lib/pf2e/xp.ts
    - src/lib/pf2e/index.ts
    - src/lib/pf2e/__tests__/xp.test.ts
  modified: []

key-decisions:
  - "PWOL hazard XP uses PWOL creature table as basis (consistent rule application)"
  - "Simple PWOL hazard XP uses Math.floor(pwolCreatureXp / 5) for non-integer division"
  - "Fixed plan error: creature -3 with PWOL at party 5 is delta -5 (in range), not delta -8"

patterns-established:
  - "Record<number, number> keyed by level delta for XP lookup tables"
  - "XpResult union type: { xp: number } | { xp: null, outOfRange: true }"
  - "Options object pattern: { pwol?: boolean } as trailing parameter"
  - "__testing export for internal table access in unit tests"

requirements-completed: [XP-01, XP-02, XP-03]

# Metrics
duration: 3min
completed: 2026-03-24
---

# Phase 01 Plan 01: XP Tables & Calculation Functions Summary

**PF2e XP lookup tables (standard + PWOL) with calculateCreatureXP and getHazardXp using TDD, 90 tests passing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T14:28:31Z
- **Completed:** 2026-03-24T14:31:43Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Four XP lookup tables implemented: standard creature (9 entries), PWOL creature (15 entries), simple hazard (9 entries), complex hazard (alias for creature)
- calculateCreatureXP handles standard deltas (-4 to +4) and PWOL deltas (-7 to +7) with correct out-of-range behavior (0 below min, null+flag above max)
- getHazardXp handles simple (1/5 complex) and complex (= creature XP) for both standard and PWOL modes
- 90 comprehensive unit tests covering XP-01, XP-02, and XP-03 requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests for XP tables and calculateCreatureXP (RED)** - `9c18c7b` (test)
2. **Task 2: Implement XP tables, calculateCreatureXP, and getHazardXp (GREEN)** - `3127cc2` (feat)

## Files Created/Modified
- `src/lib/pf2e/xp.ts` - XP lookup tables, calculateCreatureXP, getHazardXp, type exports
- `src/lib/pf2e/index.ts` - Barrel re-export of public API (functions + types)
- `src/lib/pf2e/__tests__/xp.test.ts` - 90 unit tests covering all table values, function behavior, edge cases

## Decisions Made
- PWOL hazard XP uses PWOL creature table as basis (consistent with "complex hazard = creature XP at same delta" rule)
- Simple PWOL hazard XP computed as Math.floor(PWOL creature XP / 5) since PWOL values are not always divisible by 5
- Fixed plan error in PWOL test case: creature -3 at party 5 with clamping gives delta -5 (valid PWOL range), not delta -8 as stated in plan

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect PWOL edge case test values from plan**
- **Found during:** Task 1 (writing tests)
- **Issue:** Plan specified `calculateCreatureXP(-2, 5, { pwol: true })` as delta -7 with xp 14, and `calculateCreatureXP(-1, 5, { pwol: true })` as delta -6 with xp 12. Both are wrong because negative levels clamp to 0, making delta = 0 - 5 = -5 for both.
- **Fix:** Used correct creature/party combos: (0, 7) for delta -7, (1, 7) for delta -6, (2, 7) for delta -5. Also fixed "below PWOL min" test to use (0, 8) for delta -8.
- **Files modified:** src/lib/pf2e/__tests__/xp.test.ts
- **Verification:** All 90 tests pass with corrected values
- **Committed in:** 9c18c7b (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug in plan test values)
**Impact on plan:** Corrected arithmetic error in plan's test case specifications. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- XP calculation foundation complete for Plan 02 (encounter budget orchestrator)
- Plan 02 can call calculateCreatureXP and getHazardXp to build the full calculateXP pipeline
- Barrel index at src/lib/pf2e/index.ts ready for additional exports (generateEncounterBudgets, calculateEncounterRating, calculateXP)

---
*Phase: 01-xp-encounter-budget*
*Completed: 2026-03-24*
