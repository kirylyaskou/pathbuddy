---
phase: 16-encounter-persistence
plan: "02"
subsystem: ui
tags: [react, zustand, tailwind, shadcn]

requires:
  - phase: 16-01
    provides: useEncounterStore async actions, shared/api/encounters CRUD, EncounterCombatant type
provides:
  - SavedEncounterList — left panel with inline create + LIVE indicator
  - EncounterCreatureSearchPanel — [W][+][E] creature search with HP adjustment
  - EncounterEditor — creature list + Add Creature collapsible, XP per row
  - EncountersPage redesigned — 22/78 split layout, lazy combatant loading
affects:
  - 16-03: EncounterEditor is extended in plan 16-03 with Load/Reset actions

tech-stack:
  added: []
  patterns:
    - Lazy combatant loading in EncountersPage useEffect (skip if combatants.length > 0)
    - [W][+][E] button group pattern for weak/normal/elite creature variants

key-files:
  created:
    - src/features/encounter-builder/ui/SavedEncounterList.tsx
    - src/features/encounter-builder/ui/EncounterCreatureSearchPanel.tsx
    - src/features/encounter-builder/ui/EncounterEditor.tsx
  modified:
    - src/pages/encounters/ui/EncountersPage.tsx
    - src/features/encounter-builder/index.ts

key-decisions:
  - "XP budget computed from selected encounter's combatants (not draft store) — partyLevel/partySize still from useEncounterBuilderStore"
  - "Combatants loaded lazily on encounter select — avoids N+1 load on startup"

patterns-established:
  - "W/+/E button group: bg-muted (W), bg-primary (normal +), bg-primary/20 (E)"
  - "LIVE indicator: w-2 h-2 bg-green-500 animate-pulse on isRunning encounters"

requirements-completed: [ENCP-01]

duration: 20min
completed: 2026-04-02
---

# Plan 16-02: Encounters Page Redesign Summary

**Persistent encounter manager with 22/78 split, [W][+][E] creature search, LIVE indicator, and lazy combatant loading**

## Performance

- **Duration:** 20 min
- **Completed:** 2026-04-02
- **Tasks:** 5
- **Files modified:** 5 (3 new, 2 updated)

## Accomplishments
- SavedEncounterList: inline create (Enter/Escape), LIVE green pulse dot, selected border-l-2
- EncounterCreatureSearchPanel: 200ms debounce, [W][+][E] buttons with getHpAdjustment, saves to DB immediately
- EncounterEditor: creature list with LevelBadge + tier badge, XP per row, [+ Add Creature] collapsible
- EncountersPage: replaced old draft-based page, lazy combatant loading on encounter select

## Files Created/Modified
- `src/features/encounter-builder/ui/SavedEncounterList.tsx` — left panel list with inline create
- `src/features/encounter-builder/ui/EncounterCreatureSearchPanel.tsx` — search with W/+/E buttons
- `src/features/encounter-builder/ui/EncounterEditor.tsx` — creature list, remove, add toggle
- `src/pages/encounters/ui/EncountersPage.tsx` — full rewrite with 22/78 split
- `src/features/encounter-builder/index.ts` — added 3 new component exports

## Decisions Made
- XP calculated from `selectedEncounter.partyLevel/partySize` (not global encounter builder store values) so each encounter has independent party config for XP display

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
EncounterEditor exists as a stub without Load/Reset. Plan 16-03 extends it.

---
*Phase: 16-encounter-persistence*
*Completed: 2026-04-02*
