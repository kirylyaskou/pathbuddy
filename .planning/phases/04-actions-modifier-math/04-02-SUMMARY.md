---
phase: 04-actions-modifier-math
plan: 02
subsystem: engine
tags: [typescript, pf2e, actions, data-layer, outcomes, combat]

# Dependency graph
requires:
  - phase: 04-actions-modifier-math
    provides: Action type system (types.ts) with ActionType, ActionCost, ActionCategory, DegreeKey, ActionOutcomeMap
provides:
  - ACTIONS ReadonlyMap with all 545 PF2e action entries keyed by slug
  - ACTION_OUTCOMES map with ~22 combat-relevant outcome descriptors
  - Complete action data layer for engine consumption
affects: [04-03-PLAN, 04-04-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [auto-generated-data-file, outcome-descriptor-merge]

key-files:
  created:
    - engine/actions/action-data.ts
    - engine/actions/action-outcomes.ts
  modified: []

key-decisions:
  - "22 combat-relevant actions get outcome descriptors (not 40 — dirty-trick absent from refs/, remaining basic actions have no meaningful degree-of-success outcomes)"
  - "RAW_ACTIONS sorted alphabetically by slug for deterministic output and easy lookup"
  - "ACTION_OUTCOMES merged into ACTIONS map at build time via spread operator — entries without outcomes remain data-only"

patterns-established:
  - "Auto-generated data files from refs/ JSON: script reads all files, extracts typed fields, writes sorted TypeScript array"
  - "Outcome descriptor pattern: hand-coded Record<string, ActionOutcomeMap> merged into auto-generated data at map construction"

requirements-completed: [ENG-02]

# Metrics
duration: 4min
completed: 2026-03-31
---

# Phase 04 Plan 02: Action Data & Outcomes Summary

**545 PF2e action entries auto-generated from refs/ JSON with 22 hand-coded combat outcome descriptors merged via ACTIONS ReadonlyMap**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T09:59:41Z
- **Completed:** 2026-03-31T10:03:32Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Auto-generated action-data.ts with all 545 PF2e action entries from refs/pf2e/actions/ (17 subdirectories, recursive scan)
- Hand-coded action-outcomes.ts with 22 combat-relevant outcome descriptors covering basic combat actions (strike, escape, aid, grapple, trip, etc.) and skill actions (demoralize, feint, shove, disarm, tumble-through, steal, reposition)
- ACTIONS ReadonlyMap merges outcomes from ACTION_OUTCOMES onto matching entries at construction time
- TypeScript compiles with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate action data from refs/ and create action-outcomes.ts** - `fe50421` (feat)

## Files Created/Modified
- `engine/actions/action-data.ts` - 545 action entries auto-generated from refs/pf2e/actions/ JSON, ACTIONS ReadonlyMap with outcome merge
- `engine/actions/action-outcomes.ts` - Hand-coded ACTION_OUTCOMES map with 22 combat-relevant outcome descriptors (strike, escape, aid, raise-a-shield, drop-prone, stand, take-cover, ready, delay, crawl, seek, sense-motive, grab-an-edge, grapple, trip, demoralize, feint, shove, disarm, tumble-through, steal, reposition)

## Decisions Made
- 22 combat-relevant actions receive outcome descriptors (not the estimated ~40): dirty-trick is absent from refs/, and many basic actions listed in the plan as "no meaningful degree-of-success outcomes" were correctly excluded
- Actions sorted alphabetically by slug for deterministic, easily searchable output
- reposition included (found in refs/pf2e/actions/skill/reposition.json), dirty-trick excluded (not present in refs/)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ACTIONS map available for Plan 03 (CreatureStatistics) and Plan 04 (barrel export/integration)
- ACTION_OUTCOMES can be extended as more combat actions are identified
- All action data keyed by slug for O(1) lookup

---
*Phase: 04-actions-modifier-math*
*Completed: 2026-03-31*
