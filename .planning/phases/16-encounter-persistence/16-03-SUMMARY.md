---
phase: 16-encounter-persistence
plan: "03"
subsystem: ui
tags: [react, zustand, tauri, sqlite]

requires:
  - phase: 16-01
    provides: saveEncounterCombatState, loadEncounterState, resetEncounterCombat from shared/api
  - phase: 16-02
    provides: EncounterEditor component to extend with Load/Reset

provides:
  - useCombatTrackerStore.isEncounterBacked + startEncounterCombat
  - encounter-persistence.ts with setupEncounterAutoSave, teardownEncounterAutoSave, loadEncounterIntoCombat
  - EncounterEditor extended with Load into Combat + Reset buttons + AlertDialog confirms
  - CombatPage routes to encounter vs ad-hoc auto-save based on isEncounterBacked
affects:
  - Future spells/combat phases: isEncounterBacked flag distinguishes encounter-backed from ad-hoc combat

tech-stack:
  added: []
  patterns:
    - isEncounterBacked flag in combat tracker store — gates which auto-save path runs
    - !isRunning guard before loadActiveCombat — prevents overwrite when encounter was just loaded

key-files:
  created:
    - src/features/combat-tracker/lib/encounter-persistence.ts
  modified:
    - src/features/combat-tracker/model/store.ts
    - src/features/encounter-builder/ui/EncounterEditor.tsx
    - src/pages/combat/ui/CombatPage.tsx

key-decisions:
  - "Guard !isRunning before loadActiveCombat — critical: prevents ad-hoc DB state from overwriting freshly loaded encounter"
  - "endCombat resets isEncounterBacked=false — ensures clean state for next combat regardless of type"
  - "handleReset uses dynamic import for loadEncounterCombatants — avoids circular dependency"

patterns-established:
  - "Dual auto-save routing: isEncounterBacked → encounter-persistence.ts, else → combat-persistence.ts"
  - "Teardown both paths before loading new encounter (teardownAutoSave + teardownEncounterAutoSave)"

requirements-completed: [ENCP-02, ENCP-03, ENCP-04]

duration: 25min
completed: 2026-04-02
---

# Plan 16-03: Load into Combat + Write-back + Reset Summary

**Encounter-backed combat with isEncounterBacked routing, 300ms auto-save write-back, Load/Reset dialogs in EncounterEditor**

## Performance

- **Duration:** 25 min
- **Completed:** 2026-04-02
- **Tasks:** 4
- **Files modified:** 4 (1 new, 3 updated)

## Accomplishments
- `isEncounterBacked` + `startEncounterCombat` added to useCombatTrackerStore
- `encounter-persistence.ts`: mirrors combat-persistence.ts pattern, 300ms debounce, builds payload only when isEncounterBacked=true
- EncounterEditor: Load into Combat (with Discard confirm if combat running), Reset (with confirm), both with AlertDialog
- CombatPage: `if (!isRunning)` guard before loadActiveCombat, dual auto-save routing

## Files Created/Modified
- `src/features/combat-tracker/lib/encounter-persistence.ts` — setupEncounterAutoSave, teardownEncounterAutoSave, loadEncounterIntoCombat
- `src/features/combat-tracker/model/store.ts` — added isEncounterBacked, startEncounterCombat, endCombat reset
- `src/features/encounter-builder/ui/EncounterEditor.tsx` — Load/Reset buttons + two AlertDialogs
- `src/pages/combat/ui/CombatPage.tsx` — isEncounterBacked routing + !isRunning guard

## Decisions Made
- `buildEncounterSavePayload` returns null when `!tracker.isEncounterBacked` — ensures encounter-backed path never fires for ad-hoc combat
- Reset calls `loadEncounterCombatants` via dynamic import to avoid circular dependency between EncounterEditor and shared/api

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
Full encounter persistence loop is complete. Combat tracker now has two distinct modes (ad-hoc vs encounter-backed) which future spell/combat phases can build on.

---
*Phase: 16-encounter-persistence*
*Completed: 2026-04-02*
