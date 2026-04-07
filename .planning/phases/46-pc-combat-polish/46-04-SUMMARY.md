---
plan: 46-04
status: complete
self_check: PASSED
---

## Summary

Added creature type Select filter (20 types) to `EncounterCreatureSearchPanel`, switching from `searchCreatures`/`fetchCreatures` to `searchCreaturesFiltered`. Added encounter picker Dialog to `CharactersPage`: when >1 encounter tabs are open, "Add to Combat" shows a picker listing tab names instead of adding directly.

## Key Files

### key-files.created
(none)

### key-files.modified
- src/features/encounter-builder/ui/EncounterCreatureSearchPanel.tsx
- src/pages/characters/ui/CharactersPage.tsx

## Decisions

- `pickerTabs` state snapshots the open tabs at picker-open time to avoid stale renders
- `useEncounterTabsStore.getState()` used inside `handleAddToCombat` handler (not as hook) to avoid extra renders

## Self-Check: PASSED

- EncounterCreatureSearchPanel imports `searchCreaturesFiltered`, has `creatureType` state and CREATURE_TYPES array
- CharactersPage has `pickerOpen`, `pendingCombatant`, `pickerTabs` state
- `openTabs.length > 1` branch and `addCombatantToTab` call present
- `npx tsc --noEmit` exits 0 (no new errors)
