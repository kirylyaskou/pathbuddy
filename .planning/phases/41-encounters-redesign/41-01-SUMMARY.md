---
phase: 41-encounters-redesign
plan: 01
subsystem: database, ui
tags: [sqlite, drizzle, migration, encounter, hazard, react, zustand]

# Dependency graph
requires:
  - phase: 41-encounters-redesign
    provides: CONTEXT.md decisions B and C — hazard persistence schema and EncounterEditor refactor plan
provides:
  - SQLite migration 0020 adding is_hazard/hazard_ref columns to encounter_combatants
  - Updated EncounterCombatantRow and EncounterCombatant types with isHazard/hazardRef fields
  - Updated saveEncounterCombatants/loadEncounterCombatants API round-tripping hazard fields
  - EncounterEditor with handleAddCreature/handleAddHazard methods and hazard amber visual treatment
  - No collapsed search panel in EncounterEditor (removed; replaced by Plan 02 middle panel)
affects: [41-02, 41-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isHazard discriminator: check c.isHazard (boolean) not c.creatureRef to detect hazard rows"
    - "Hazard rows in encounter lists: amber left border + AlertTriangle icon (established Phase 30 pattern)"
    - "handleAddCreature/handleAddHazard owned by EncounterEditor; Plan 02 lifts as props to EncountersPage"

key-files:
  created:
    - src/shared/db/migrations/0020_encounter_hazard_columns.sql
  modified:
    - src/shared/api/encounters.ts
    - src/entities/encounter/model/types.ts
    - src/pages/encounters/ui/EncountersPage.tsx
    - src/features/encounter-builder/ui/EncounterEditor.tsx
    - src/features/encounter-builder/ui/EncounterCreatureSearchPanel.tsx

key-decisions:
  - "isHazard added as required (non-optional) on EncounterCombatantRow; optional on EncounterCombatant entity"
  - "handleAddCreature/handleAddHazard stay internal to EncounterEditor for now; Plan 02 will lift to page level"
  - "EncounterCreatureSearchPanel file kept but its usage removed from EncounterEditor; Plan 02 will clean up"

patterns-established:
  - "Hazard rows use c.isHazard === true check, not c.creatureRef, as discriminator"
  - "All EncounterCombatantRow constructions must supply isHazard and hazardRef (no defaults in interface)"

requirements-completed: []

# Metrics
duration: 15min
completed: 2026-04-05
---

# Phase 41 Plan 01: Hazard Persistence Data Layer + EncounterEditor Refactor Summary

**SQLite migration adding is_hazard/hazard_ref to encounter_combatants, full API round-trip for hazard rows, and EncounterEditor refactored to own handleAddCreature/handleAddHazard with amber hazard row rendering**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-05T00:00:00Z
- **Completed:** 2026-04-05T22:10:34Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Migration 0020 adds `is_hazard INTEGER NOT NULL DEFAULT 0` and `hazard_ref TEXT` to `encounter_combatants`
- `EncounterCombatantRow` interface updated with required `isHazard: boolean` and `hazardRef: string | null`
- `saveEncounterCombatants` INSERT extended to 14 columns including `is_hazard` and `hazard_ref`
- `loadEncounterCombatants` SELECT type annotation and row mapping updated to return `isHazard`/`hazardRef`
- `EncounterCombatant` entity type gains optional `isHazard?` and `hazardRef?` fields
- `EncounterEditor` refactored: removed collapsed search panel toggle, added `handleAddCreature`/`handleAddHazard`, hazard rows render with amber left border and AlertTriangle icon

## Task Commits

1. **Task 1: SQLite migration + type updates + API layer** - `00b24be2` (feat)
2. **Task 2: EncounterEditor refactor — add logic, hazard rows, remove search panel** - `d65c95a6` (feat)

## Files Created/Modified

- `src/shared/db/migrations/0020_encounter_hazard_columns.sql` - ALTER TABLE adding is_hazard and hazard_ref
- `src/shared/api/encounters.ts` - EncounterCombatantRow type + saveEncounterCombatants + loadEncounterCombatants updated
- `src/entities/encounter/model/types.ts` - EncounterCombatant gains isHazard? and hazardRef?
- `src/pages/encounters/ui/EncountersPage.tsx` - combatant mapping includes isHazard/hazardRef
- `src/features/encounter-builder/ui/EncounterEditor.tsx` - full refactor: add handleAddCreature/handleAddHazard, hazard visual treatment, remove search panel
- `src/features/encounter-builder/ui/EncounterCreatureSearchPanel.tsx` - updated to supply isHazard/hazardRef on constructed rows

## Decisions Made

- `EncounterCombatantRow.isHazard` is required (not optional) to prevent missing fields at call sites — all constructors must explicitly set it.
- `EncounterCombatant.isHazard` is optional (`isHazard?`) consistent with RESEARCH.md spec, as the entity type is loaded from DB where default is 0.
- `handleAddCreature` and `handleAddHazard` are internal functions in `EncounterEditor` for now; Plan 02 will lift them to `EncountersPage` level via props for DndContext wiring.
- `EncounterCreatureSearchPanel` file kept (its export is still in `index.ts`); Plan 02 will complete the cleanup.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed EncounterCreatureSearchPanel to supply isHazard/hazardRef on EncounterCombatantRow**
- **Found during:** Task 1 (type updates)
- **Issue:** After making `isHazard`/`hazardRef` required on `EncounterCombatantRow`, `EncounterCreatureSearchPanel.handleAdd` was missing both fields — would be a TypeScript compile error
- **Fix:** Added `isHazard: false, hazardRef: null` to new combatant construction and `isHazard: c.isHazard ?? false, hazardRef: c.hazardRef ?? null` to existing combatant mapping
- **Files modified:** `src/features/encounter-builder/ui/EncounterCreatureSearchPanel.tsx`
- **Verification:** `npx tsc --noEmit` — no isHazard/hazardRef errors
- **Committed in:** `00b24be2` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed handleReset in EncounterEditor to include isHazard/hazardRef in row mapping**
- **Found during:** Task 1 (tracing all EncounterCombatantRow construction sites)
- **Issue:** `handleReset` in `EncounterEditor` built mapped rows without `isHazard`/`hazardRef` — TS error after type update
- **Fix:** Added both fields to the reset mapping
- **Files modified:** `src/features/encounter-builder/ui/EncounterEditor.tsx`
- **Verification:** Compile clean
- **Committed in:** `00b24be2` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes required for TypeScript correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## Known Stubs

None — all hazard fields are fully wired. `handleAddHazard` is complete but not yet callable from UI (Plan 02 will wire it via DndContext/search panel callback props).

## Next Phase Readiness

- Plan 02 can now wire `DndContext` on `EncountersPage`, lift `handleAddCreature`/`handleAddHazard` to page level, and pass as callbacks to `CreatureSearchSidebar` middle panel
- `EncounterCreatureSearchPanel` can be fully removed from `index.ts` once `CreatureSearchSidebar` is wired as the middle panel
- SQLite migration 0020 will run automatically on next app launch (splash migration pattern)

---
*Phase: 41-encounters-redesign*
*Completed: 2026-04-05*
