# Plan 06-02 Summary

**Status:** Complete
**Duration:** ~5 min

## What was built
- Created 4 full entity slices (creature, combatant, condition, encounter) with Zustand v5 + immer stores
- Moved CreatureCard, CreatureStatBlock from shared/ui/ to entities/creature/ui/
- Moved XPBudgetBar from shared/ui/ to entities/encounter/ui/, wired to engine generateEncounterBudgets
- Deleted 3 legacy files from shared/ui/
- Added steiger insignificant-slice exception for entities/

## Key files
- `src/entities/creature/model/store.ts` — useCreatureStore (creatures[], selectedId)
- `src/entities/combatant/model/store.ts` — useCombatantStore (combat slots)
- `src/entities/condition/model/store.ts` — useConditionStore (ActiveCondition[])
- `src/entities/encounter/model/store.ts` — useEncounterStore (saved encounters)
- `src/entities/creature/ui/CreatureCard.tsx` — moved from shared/ui, entity Creature type
- `src/entities/creature/ui/CreatureStatBlock.tsx` — moved from shared/ui, entity types
- `src/entities/encounter/ui/XPBudgetBar.tsx` — moved from shared/ui, engine generateEncounterBudgets

## Verification
- `npm run lint` — passed
- `npx tsc --noEmit` — passed
- `grep -r "invoke(" src | grep -v shared/api/` — clean

## Deviations
- Entity Creature is own serializable type (not engine Creature) — engine Creature has non-serializable ConditionManager and nested hp/saves structure incompatible with UI components
- Added DisplaySize and DisplayActionCost types in entity layer — engine CreatureSize uses short codes ('sm','med'), UI needs display names ('Small','Medium'); engine ActionCost is 1|2|3|null, UI needs 0|1|2|3|'reaction'|'free'
- generateEncounterBudgets takes only partySize (not partyLevel as plan assumed)

## Self-Check: PASSED
