---
phase: 08-combat-tracker-engine-integration
plan: 01
status: complete
started: 2026-04-01
completed: 2026-04-01
tasks_completed: 7
tasks_total: 7
---

## Summary

Combat infrastructure foundation — SQLite persistence schema, @dnd-kit packages, store type/API extensions, and ConditionManager bridge.

## Key Files

### Created
- `src/shared/db/migrations/0004_combat.sql` — 3 tables (combats, combat_combatants, combat_conditions) with FK cascades
- `src/features/combat-tracker/lib/condition-bridge.ts` — Per-combatant ConditionManager instances synced to Zustand
- `src/shared/api/combat.ts` — Full CRUD for combat persistence via raw SQL

### Modified
- `src/entities/combatant/model/types.ts` — Removed conditions[] field
- `src/entities/condition/model/types.ts` — Added isLocked, grantedBy fields
- `src/entities/combatant/model/store.ts` — Added setCombatants, clearAll; removed condition methods
- `src/entities/condition/model/store.ts` — Added setAllForCombatant, clearAll
- `src/features/combat-tracker/model/store.ts` — Added combatId, previousTurn, setRound, setTurn
- `src/features/combat-tracker/index.ts` — Added condition-bridge exports
- `package.json` — @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

## Commit
`afcffb0 feat(08-01): add combat infrastructure — DB schema, dnd-kit, store refactors, condition bridge`

## Self-Check: PASSED
