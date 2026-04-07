---
phase: 06-combat-detail-panel
plan: 04
subsystem: ui
tags: [vue3, tailwind, compendium, stat-block, slide-over-removal, dead-code-cleanup]

# Dependency graph
requires:
  - phase: 06-01
    provides: StatBlock.vue shared component with rawData prop
  - phase: 06-02
    provides: CreatureBrowser with selectedId/partyLevel props and 'select' emit

provides:
  - CompendiumView 2-column layout (30% filters+list / 70% StatBlock) with session config header
  - Inline StatBlock in Compendium right column — replaces slide-over
  - Session config header with Party Level and Party Size inputs above entity list
  - Clean AppLayout without CreatureDetailPanel
  - Dead code removed: CreatureDetailPanel.vue, creatureDetail.ts store deleted

affects: [07-polish-and-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "handleEntitySelect: parse rawData JSON at selection time, pass parsed object to StatBlock"
    - "statBlockPanel ref + scrollTo(0,0) on entity change — scroll reset on selection"
    - "Three-state hasSyncedData (null/false/true) from Phase 04 — preserved in rewrite"

key-files:
  created: []
  modified:
    - src/views/CompendiumView.vue
    - src/views/__tests__/CompendiumView.test.ts
    - src/components/AppLayout.vue
    - src/components/__tests__/AppLayout.test.ts
  deleted:
    - src/components/CreatureDetailPanel.vue
    - src/stores/creatureDetail.ts
    - src/components/__tests__/CreatureDetailPanel.test.ts
    - src/stores/__tests__/creatureDetail.test.ts

key-decisions:
  - "CompendiumView parses rawData JSON at selection time (handleEntitySelect) — avoids repeated parse on re-render"
  - "showPartyControls not passed to CreatureBrowser — mode is undefined in CompendiumView so mode === 'combat' evaluates false, EntityFilterBar hides party controls automatically"
  - "Slim 'Compendium' heading retained above 2-column flex — sidebar nav alone not sufficient per CONTEXT.md ambiguity"

patterns-established:
  - "2-column compendium layout: w-[30%] left column with session config header, flex-1 right column for StatBlock"
  - "Entity select handler: parse rawData JSON + reset scroll in same function"

requirements-completed: [WORK-06]

# Metrics
duration: 10min
completed: 2026-03-24
---

# Phase 06 Plan 04: CompendiumView 2-Column Layout + Dead Code Cleanup Summary

**CompendiumView rewritten as 30/70 split with inline StatBlock and session config header; CreatureDetailPanel.vue and creatureDetail store deleted entirely**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-23T22:39:00Z
- **Completed:** 2026-03-23T22:41:47Z
- **Tasks:** 2
- **Files modified:** 4 modified, 4 deleted

## Accomplishments

- CompendiumView has 2-column layout: 30% left (Party Level/Size controls + CreatureBrowser) and 70% right (StatBlock or placeholder)
- Clicking an entity parses its rawData and renders StatBlock inline; scrolls right column to top
- Session config header with Party Level and Party Size number inputs sits above the entity list
- CreatureDetailPanel.vue, creatureDetail.ts Pinia store, and all their tests deleted — slide-over fully removed
- AppLayout is clean: only AppSidebar + RouterView, no overlay panel
- 343 tests pass across 26 test files, 0 failures

## Task Commits

Each task was committed atomically:

1. **Task 1: CompendiumView 2-column layout with inline StatBlock + session config header** - `4549fa1` (feat)
2. **Task 2: Delete CreatureDetailPanel + creatureDetail store + clean AppLayout** - committed in `73154fa` (feat, part of 06-03 execution that preceded this plan)

## Files Created/Modified

- `src/views/CompendiumView.vue` - Rewritten: 2-column flex layout, session config header, StatBlock in right column, handleEntitySelect with JSON parsing + scroll reset
- `src/views/__tests__/CompendiumView.test.ts` - Updated: added 2-column layout, session config header, StatBlock on select, loading skeleton, empty state assertions; added StatBlock stub
- `src/components/AppLayout.vue` - Cleaned: removed CreatureDetailPanel import and usage; only AppSidebar + RouterView remain
- `src/components/__tests__/AppLayout.test.ts` - Updated: added assertion that CreatureDetailPanel is absent from rendered output

**Deleted:**
- `src/components/CreatureDetailPanel.vue` - Old slide-over panel (replaced by inline StatBlock)
- `src/stores/creatureDetail.ts` - Pinia store for slide-over state (no longer needed)
- `src/components/__tests__/CreatureDetailPanel.test.ts` - Tests for deleted component
- `src/stores/__tests__/creatureDetail.test.ts` - Tests for deleted store

## Decisions Made

- `showPartyControls` not explicitly passed to `CreatureBrowser` — since `mode` prop is absent in CompendiumView, `mode === 'combat'` evaluates to false and `EntityFilterBar` hides party controls automatically; session config header in CompendiumView serves as the party controls instead
- Slim `Compendium` heading (`text-lg`) retained above the 2-column flex — maximizes content area while maintaining page identity; `px-4 py-2` gives minimal height compared to the original `px-6 py-4` heading

## Deviations from Plan

None - plan executed exactly as written. Task 2's file deletions and AppLayout cleanup had already been performed as part of 06-03 execution (commit `73154fa`); verified by running full test suite which confirmed 343/343 passing.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CompendiumView inline stat block is complete — COMP-01 through COMP-06 regressions addressed
- Phase 06 is now complete: StatBlock (06-01), CreatureBrowser enhancements (06-02), CombatDetailPanel (06-03), CompendiumView 2-column (06-04)
- Phase 07 (polish and testing) can begin

---
*Phase: 06-combat-detail-panel*
*Completed: 2026-03-24*
