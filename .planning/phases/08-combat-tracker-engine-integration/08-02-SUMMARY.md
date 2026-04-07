---
phase: 08-combat-tracker-engine-integration
plan: 02
status: complete
started: 2026-04-01
completed: 2026-04-01
tasks_completed: 5
tasks_total: 5
---

## Summary

3-panel combat workspace with initiative list (DnD sortable), bestiary search panel (FTS5), creature/PC add flows, and combat start/end controls.

## Key Files

### Created
- `src/features/combat-tracker/lib/initiative.ts` — rollInitiative, autoName, createCombatantFromCreature, createPCCombatant
- `src/widgets/initiative-list/ui/InitiativeRow.tsx` — Sortable row with HP bar, condition badges
- `src/widgets/initiative-list/ui/InitiativeList.tsx` — DndContext + SortableContext wrapper
- `src/widgets/initiative-list/index.ts` — Barrel export
- `src/widgets/bestiary-search/ui/BestiarySearchPanel.tsx` — FTS5 search + add-to-combat
- `src/widgets/bestiary-search/index.ts` — Barrel export
- `src/features/combat-tracker/ui/AddPCDialog.tsx` — PC quick-add form dialog
- `src/features/combat-tracker/ui/CombatControls.tsx` — Start/End combat + round badge

### Modified
- `src/pages/combat/ui/CombatPage.tsx` — ResizablePanelGroup 3-panel layout
- `src/features/combat-tracker/index.ts` — Added UI and initiative exports

## Commit
`272fe6f feat(08-02): add 3-panel combat layout, initiative list, bestiary search, PC add`

## Self-Check: PASSED
