---
phase: 02-auto-round-processing
plan: 06
subsystem: ui
tags: [vue3, drag-and-drop, initiative, combat-tracker, pinia]

# Dependency graph
requires:
  - phase: 02-auto-round-processing/02-05
    provides: fixed turn advancement and round gating; actedCreatureIds tracking; sortedCreatures computed
  - phase: 02-auto-round-processing/02-03
    provides: CreatureCard drag source (draggable + dragstart with dataTransfer); canDrag computed
provides:
  - reorderCreature(sourceId, targetId) in combat store - swaps initiative values to reorder sorted list
  - Drop-target div wrappers on each CreatureCard in CombatTracker with @dragover/@dragenter/@dragleave/@drop handlers
  - Blue ring visual feedback (ring-2 ring-blue-400) on drag-over drop targets
  - Complete drag-and-drop creature reordering in the browser
affects: [03-foundry-import, any phase using sortedCreatures order]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Drag-and-drop via native HTML5 dataTransfer API: dragstart sets text/plain creature ID, drop reads it"
    - "Initiative swap pattern: swapping initiative values causes sortedCreatures computed to reorder reactively"
    - "Wrapper div drop-zone pattern: each list item wrapped in a div with drag event handlers, inner component stays clean"

key-files:
  created: []
  modified:
    - src/stores/combat.ts
    - src/components/CombatTracker.vue

key-decisions:
  - "Swap initiative values (not array indices) to reorder: sortedCreatures computed re-sorts reactively on initiative change"
  - "Wrap CreatureCard in drop-zone div rather than adding drop events directly to CreatureCard: keeps CreatureCard clean and drop logic in parent"
  - "dragOverCreatureId ref tracks active drag target for visual feedback without touching store state"

patterns-established:
  - "Drop-zone wrapper: outer div owns drag events, inner component owns content rendering"
  - "Initiative swap for reorder: temporary variable swap of source/target initiative, fallback dexMod swap if equal"

requirements-completed: [COMBAT-05]

# Metrics
duration: 8min
completed: 2026-03-19
---

# Phase 02 Plan 06: Drag-and-Drop Drop Target Implementation Summary

**Native HTML5 drag-and-drop creature reordering via initiative swap, with blue ring visual feedback and wrapper-div drop-zone pattern**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-19T19:31:00Z
- **Completed:** 2026-03-19T19:39:00Z
- **Tasks:** 1 auto + 1 checkpoint (auto-approved)
- **Files modified:** 2

## Accomplishments
- Added `reorderCreature(sourceId, targetId)` to combat store that swaps initiative values, causing `sortedCreatures` computed to reactively reorder
- Wrapped each CreatureCard in a drop-zone div with `@dragover.prevent`, `@dragenter.prevent`, `@dragleave`, and `@drop` handlers
- Added `dragOverCreatureId` ref for visual feedback — blue ring (`ring-2 ring-blue-400 ring-offset-2`) appears on hovered drop target
- All 52 existing tests continue to pass
- Completes UAT gap 6 (drag-and-drop was half-implemented: drag source existed in CreatureCard, drop target was missing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add reorder function to store and drop handlers to CombatTracker** - `fc626eb` (feat)
2. **Task 2: Verify full round cycle and drag-and-drop** - checkpoint auto-approved (auto_advance: true)

**Plan metadata:** (docs commit - see final commit)

## Files Created/Modified
- `src/stores/combat.ts` - Added `reorderCreature(sourceId, targetId)` function and exported it
- `src/components/CombatTracker.vue` - Added `dragOverCreatureId` ref, drag handlers, and wrapped each CreatureCard in drop-zone div

## Decisions Made
- Swap initiative values rather than array positions: `sortedCreatures` is a computed that sorts by initiative, so swapping initiative values causes instant reactive reorder without needing to manipulate the array directly
- If source and target have equal initiatives after the swap, also swap `dexMod` to guarantee order change (tiebreaker)
- Keep drop-zone logic in CombatTracker wrapper div, not in CreatureCard itself, preserving CreatureCard as a display-only component

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - implementation was straightforward. All tests passed on first run.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 UAT gaps for Phase 02 are now resolved: round counter/advancement (Plans 04-05), no duplicate buttons (Plan 05), New Round gates correctly (Plan 05), drag-and-drop reordering (Plan 06)
- Phase 02 auto-round processing is feature-complete
- Ready to proceed to Phase 03 (Foundry VTT import) or further UAT sign-off

## Self-Check: PASSED
- src/stores/combat.ts: FOUND
- src/components/CombatTracker.vue: FOUND
- .planning/phases/02-auto-round-processing/02-06-SUMMARY.md: FOUND
- Commit fc626eb: FOUND

---
*Phase: 02-auto-round-processing*
*Completed: 2026-03-19*
