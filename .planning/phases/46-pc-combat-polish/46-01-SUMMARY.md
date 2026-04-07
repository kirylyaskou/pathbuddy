---
plan: 46-01
status: complete
self_check: PASSED
---

## Summary

Extended the `Combatant` interface with `isHazard?: boolean` and `initiativeBonus?: number` optional fields. Rewrote `InitiativeRow` with inline initiative editing (click → input → Enter/Escape), hazard `Dices` roll button (amber), and `AlertTriangle` icon for hazard combatants.

## Key Files

### key-files.created
- src/widgets/initiative-list/ui/InitiativeRow.tsx (rewritten)

### key-files.modified
- src/entities/combatant/model/types.ts

## Decisions

- `rollDice` was already exported from `engine/index.ts` — no change needed
- Used `useCombatantStore.getState()` inside handlers (not hook) to avoid stale closure
- `w-12` wrapper keeps initiative display width stable during edit/display toggle

## Self-Check: PASSED

- `isHazard?: boolean` and `initiativeBonus?: number` present in types.ts
- `isEditing` / `editValue` state in InitiativeRow
- `handleHazardRoll`, `reorderAfterChange`, `AlertTriangle`, `Dices` all present
- `npx tsc --noEmit` exits 0 (no new errors)
