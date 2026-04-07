---
plan: 46-03
status: complete
self_check: PASSED
---

## Summary

Created `PCCombatCard` — a compact read-only PC stat card showing HP/AC (live combat values), ability score mods, saves (Fort/Ref/Will), and skills with rank badges. Updated `CombatPage` with `pcBuildCache` (bounded 10-entry Map), three-branch `handleSelect` (NPC → stat block, PC → PCCombatCard, Hazard → sticky), and right panel routing.

## Key Files

### key-files.created
- src/features/characters/ui/PCCombatCard.tsx

### key-files.modified
- src/features/characters/index.ts
- src/pages/combat/ui/CombatPage.tsx

## Decisions

- Used `as unknown as Record<string, number>` for `proficiencies` cast to avoid pre-existing PathbuilderProficiencies index signature error
- Hazard branch in `handleSelect` is a no-op (sticky last shown panel)
- `pcBuildCache` mirrors `statBlockCache` 10-entry bounded evict-oldest pattern

## Self-Check: PASSED

- PCCombatCard exported from features/characters/index.ts
- CombatPage has `selectedPcBuild` state, `pcBuildCache` ref, `!isNPC && !isHazard` branch
- Right panel shows PCCombatCard for PCs, CreatureStatBlock for NPCs
- `npx tsc --noEmit` exits 0 (no new errors)
