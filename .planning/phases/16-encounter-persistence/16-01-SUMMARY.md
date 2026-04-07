---
phase: 16-encounter-persistence
plan: "01"
subsystem: database
tags: [sqlite, zustand, tauri, typescript]

requires: []
provides:
  - 3 SQLite tables: encounters, encounter_combatants, encounter_conditions
  - Full CRUD API at shared/api/encounters.ts (16 exported functions)
  - Encounter entity type with combat-state fields (round, turn, isRunning, combatants)
  - useEncounterStore with async load/create/delete actions
affects:
  - 16-02: Encounters page needs all these exports to build the persistent UI
  - 16-03: Combat persistence layer imports from shared/api/encounters.ts

tech-stack:
  added: []
  patterns:
    - DELETE+re-INSERT pattern for combatants (same as combat.ts)
    - Lightweight write-back function (saveEncounterCombatState) separate from full saveEncounterState
    - Lazy combatant loading — store holds empty combatants[] until encounter is selected

key-files:
  created:
    - src/shared/db/migrations/0008_encounter_persistence.sql
    - src/shared/api/encounters.ts
  modified:
    - src/shared/api/index.ts
    - src/entities/encounter/model/types.ts
    - src/entities/encounter/model/store.ts
    - src/entities/encounter/index.ts

key-decisions:
  - "Encounter entity no longer has creatureIds[] — replaced with EncounterCombatant[] carrying full combat state"
  - "encounter_conditions has formula column (combat_conditions does not) — needed for persistent damage"
  - "Lazy loading strategy: combatants[] starts empty in store, loaded per-encounter on first select"

patterns-established:
  - "EncounterCombatantRow (API) vs EncounterCombatant (entity) — mapping at boundaries"

requirements-completed: [ENCP-01, ENCP-02, ENCP-03, ENCP-04]

duration: 15min
completed: 2026-04-02
---

# Plan 16-01: DB Layer + API Summary

**SQLite encounter persistence schema + full CRUD API + expanded Encounter entity types with combat-state fields**

## Performance

- **Duration:** 15 min
- **Completed:** 2026-04-02
- **Tasks:** 6
- **Files modified:** 6 (2 new, 4 updated)

## Accomplishments
- Created `0008_encounter_persistence.sql` with 3 tables (encounters, encounter_combatants, encounter_conditions)
- Created `shared/api/encounters.ts` with 16 exported functions including lightweight `saveEncounterCombatState`
- Replaced old `Encounter` type (had `creatureIds[]`) with full combat-state entity
- Added `loadEncounters`, `createNewEncounter`, `deleteEncounterById`, `setEncounterCombatants` to useEncounterStore

## Files Created/Modified
- `src/shared/db/migrations/0008_encounter_persistence.sql` — 3-table schema with CASCADE deletes
- `src/shared/api/encounters.ts` — all encounter CRUD + snapshot + reset functions
- `src/shared/api/index.ts` — added `export * from './encounters'`
- `src/entities/encounter/model/types.ts` — replaced creatureIds with EncounterCombatant array + combat state fields
- `src/entities/encounter/model/store.ts` — full async CRUD store with immer
- `src/entities/encounter/index.ts` — added EncounterCombatant to barrel

## Decisions Made
- `encounter_conditions` includes `formula` column (unlike `combat_conditions`) to support persistent damage formulas in saved encounters
- `weak_elite_tier` and `creature_level` columns stored in encounter_combatants — needed for XP calculation and stat adjustment on load

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
All API functions and entity types are in place. Plan 16-02 can build the Encounters page UI.

---
*Phase: 16-encounter-persistence*
*Completed: 2026-04-02*
