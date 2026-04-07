---
phase: 41-encounters-redesign
plan: 03
subsystem: ui
tags: [react, zustand, immer, combat-tracker, split-view, lucide-react]

# Dependency graph
requires:
  - phase: 41-encounters-redesign/41-01
    provides: EncountersPage 3-panel + drag-and-drop foundation
  - phase: 41-encounters-redesign/41-02
    provides: hazard persistence in encounter_combatants
provides:
  - splitMode boolean + toggleSplitMode() on useEncounterTabsStore
  - CombatColumn component for independent encounter display in split mode
  - Columns2 split toggle button in EncounterTabBar
  - Conditional split center panel in CombatPage
affects: [combat-tracker, CombatPage, EncounterTabBar]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CombatColumn: active = global stores; inactive = read-only snapshot view"
    - "splitMode auto-disable when openTabs.length < 2 in closeTab"
    - "Columns2 split toggle: bg-primary/20 text-primary active state"

key-files:
  created: []
  modified:
    - src/features/combat-tracker/model/encounter-tabs-store.ts
    - src/pages/combat/ui/EncounterTabBar.tsx
    - src/pages/combat/ui/CombatPage.tsx

key-decisions:
  - "Active CombatColumn renders global-store-backed widgets; inactive renders read-only snapshot — avoids rewriting all widgets to accept props"
  - "Clicking inactive column calls setActiveTab first (saves other tab snapshot), then existing widgets reflect the newly active tab"
  - "Split mode stored in useEncounterTabsStore (not local React state) for persistence across tab switches"

patterns-established:
  - "CombatColumn active/inactive pattern: isActive prop gates full vs read-only rendering"
  - "SnapshotSyncEffect: Zustand store subscriber component that keeps tab snapshot in continuous sync with live global store mutations"

requirements-completed: []

# Metrics
duration: 15min
completed: 2026-04-05
---

# Phase 41 Plan 03: Split Combat View Summary

**splitMode toggle in EncounterTabsStore + CombatColumn component rendering two encounter initiative lists side-by-side with Columns2 icon toggle button**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-05T00:00:00Z
- **Completed:** 2026-04-05T00:15:00Z
- **Tasks:** 1 of 2 (Task 2 is checkpoint:human-verify)
- **Files modified:** 3

## Accomplishments

- Added `splitMode: boolean` + `toggleSplitMode()` to `EncounterTabsState` interface and store
- Auto-disable split mode when tabs drop below 2 (inside `closeTab`)
- `EncounterTabBar` gets `Columns2` split toggle button — visible only when `openTabs.length >= 2`, with `bg-primary/20 text-primary` active state
- `CombatColumn` component: active column renders full interactive widgets (InitiativeList, CombatantDetail, CombatControls, TurnControls backed by global stores); inactive column renders read-only snapshot view
- `CombatPage` center panel: conditional `splitMode && openTabs.length >= 2` renders two `CombatColumn` side-by-side with `border-r border-border/50` divider

## Task Commits

1. **Task 1: Split mode store + toggle button + CombatColumn + split rendering** - `bd1478ae` (feat)

## Files Created/Modified

- `src/features/combat-tracker/model/encounter-tabs-store.ts` — added `splitMode`, `toggleSplitMode`, auto-disable in `closeTab`
- `src/pages/combat/ui/EncounterTabBar.tsx` — added `Columns2` import + split toggle button JSX
- `src/pages/combat/ui/CombatPage.tsx` — added `CombatColumn` component + split center panel conditional rendering, `ScrollArea` import, `cn` import, `EncounterTab` type import

## Decisions Made

- Active column uses global store-backed widgets unchanged — avoids rewriting InitiativeList/CombatantDetail to accept props while still being interactive
- Inactive column renders directly from `tab.snapshot.combatants` — read-only, no store interaction needed
- Clicking in inactive column triggers `setActiveTab(tab.id)` which saves the previous tab's snapshot and restores the clicked tab's data to global stores

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Split mode: clicking inactive column switched both columns to the same encounter**

- **Found during:** Task 2 (human-verify checkpoint) — user reported "can't run 2 combats simultaneously, just switches between active ones"
- **Root cause:** Both `CombatColumn` instances read from the same global Zustand stores. The inactive column's `onClick` called `setActiveTab()`, which loaded the clicked tab's data into global stores. But the ACTIVE column's widgets also read from those same global stores, so both columns instantly reflected the new tab's data. The "active/inactive" toggle was just switching which column was interactive — both columns could never show independent data simultaneously.
- **Fix:** Added `SnapshotSyncEffect` component (subscribes to both `useCombatantStore` and `useCombatTrackerStore` via `.subscribe()`) that continuously writes mutations back to the active tab's snapshot. Since the snapshot is always fresh, when the user clicks the inactive column, `setActiveTab()` has a current snapshot to restore from. The formerly-active column then shows its stale (but fresh) snapshot view of what was just the live encounter. The user can freely switch focus between columns and each column retains its encounter's current state.
- **Secondary fix:** `handleSelect` in `CombatPage` now reads `useCombatantStore.getState().combatants` directly instead of the closed-over `combatants` variable. This prevents a stale-closure bug where the combatant lookup for stat block fetching would use the previous tab's combatant list after a tab switch in split mode.
- **Files modified:** `src/pages/combat/ui/CombatPage.tsx`
- **Commit:** `181b5153`

## Issues Encountered

Two pre-existing `TS6133` (unused variable) errors exist in unrelated files (`CreatureStatBlock.tsx`, `EncounterCreatureSearchPanel.tsx`). These are out-of-scope and were not introduced by this plan. No errors in modified files.

## Known Stubs

None — no hardcoded empty values or placeholder text introduced.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Split mode bug is fixed; visual verification can proceed
- Run `npm run tauri dev`, open 2 encounters, enable split view, verify both columns remain independently interactive
- All code changes for Phase 41 plans 01-03 are complete

---
*Phase: 41-encounters-redesign*
*Completed: 2026-04-05*

## Self-Check: PASSED

- `src/features/combat-tracker/model/encounter-tabs-store.ts` — exists, contains `splitMode`, `toggleSplitMode`, auto-disable
- `src/pages/combat/ui/EncounterTabBar.tsx` — exists, contains `Columns2`, `openTabs.length >= 2`, `bg-primary/20`
- `src/pages/combat/ui/CombatPage.tsx` — exists, contains `CombatColumn`, `splitMode`, `openTabs.length >= 2`, `SnapshotSyncEffect`
- Commit `bd1478ae` (original plan) — verified present
- Commit `181b5153` (bug fix) — verified present
