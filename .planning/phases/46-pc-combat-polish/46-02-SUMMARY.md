---
plan: 46-02
status: complete
self_check: PASSED
---

## Summary

Refactored left combat panel into a 3-tab layout: **Bestiary** (existing + new creature type Select filter with 20 types), **Hazards** (new `HazardSearchPanel` with draggable rows), **Characters** (new `CharactersTab` listing PCs with encounter picker for >1 tabs). Updated `CombatPage.handleDragEnd` to handle `hazard-add` drag type creating `isHazard: true` combatants.

## Key Files

### key-files.created
- src/widgets/bestiary-search/ui/HazardSearchPanel.tsx
- src/widgets/bestiary-search/ui/CharactersTab.tsx

### key-files.modified
- src/widgets/bestiary-search/ui/BestiarySearchPanel.tsx
- src/pages/combat/ui/CombatPage.tsx

## Decisions

- Switched BestiarySearchPanel from `searchCreatures`/`fetchCreatures` to `searchCreaturesFiltered` for consistent filtering
- `CharactersTab` uses `useEncounterTabsStore` via hook (not getState) for reactive tab list in DropdownMenu
- `CombatPage` drag data type extended with `hazardRow?: HazardRow`

## Self-Check: PASSED

- HazardSearchPanel and CharactersTab created and exported
- BestiarySearchPanel imports HazardSearchPanel, CharactersTab, CREATURE_TYPES array (20 entries)
- CombatPage contains `hazard-add` route with `isHazard: true`
- `npx tsc --noEmit` exits 0 (no new errors)
