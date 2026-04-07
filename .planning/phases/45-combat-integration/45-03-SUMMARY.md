---
plan: 45-03
title: Cleanup + UI — Remove AddPCDialog, Add AC Display
status: complete
completed: 2026-04-07
commit: f0da1ce2
---

## What Was Built

1. **Deleted `AddPCDialog.tsx`** — manual PC form superseded by Pathbuilder import flow on /characters.
2. **Removed `createPCCombatant`** from `initiative.ts` (was AddPCDialog's only consumer).
3. **Cleaned `index.ts`** — removed `AddPCDialog` export and `createPCCombatant` from initiative re-export.
4. **Cleaned `CombatPage.tsx`** — removed `AddPCDialog` import and both JSX usages (split mode CombatColumn + single column mode), updated comment.
5. **`CombatantDetail.tsx`** — added `· AC {N}` inline after `— PC` when `combatant.ac !== undefined`; NPC combatants unaffected via `!combatant.isNPC` guard.

## Self-Check: PASSED

- [x] `AddPCDialog.tsx` deleted
- [x] `createPCCombatant` removed from `initiative.ts`
- [x] `index.ts` exports no `AddPCDialog` or `createPCCombatant`
- [x] `CombatPage.tsx` has zero references to `AddPCDialog`
- [x] `CombatControls` and `createCombatantFromCreature` still present
- [x] `combatant.ac !== undefined` guard present in CombatantDetail
- [x] `· AC` text and `font-mono` span for `{combatant.ac}` present
- [x] No new TypeScript errors introduced

## key-files

### deleted
- src/features/combat-tracker/ui/AddPCDialog.tsx

### modified
- src/features/combat-tracker/lib/initiative.ts
- src/features/combat-tracker/index.ts
- src/pages/combat/ui/CombatPage.tsx
- src/widgets/combatant-detail/ui/CombatantDetail.tsx
