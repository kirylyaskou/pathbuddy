---
phase: 07
plan: 04
status: complete
started: 2026-04-01
completed: 2026-04-01
---

## Summary

Built the frontend sync pipeline (invoke Rust → batch insert → FTS5 rebuild) and real SQL creature queries with FTS5 full-text search. Created size mapping utility and CreatureRow→Creature mapper in entity layer.

## Key Files

### Created
- `src/shared/api/sync.ts` — syncFoundryData, importLocalPacks with batch insert + FTS5 rebuild
- `src/shared/lib/size-map.ts` — Foundry size code mapping (sm→Small, med→Medium, etc.)
- `src/entities/creature/model/mappers.ts` — toCreature(row) maps CreatureRow → Creature

### Modified
- `src/shared/api/creatures.ts` — Real SQL queries: fetchCreatures, fetchCreatureById, searchCreatures (FTS5)
- `src/shared/api/index.ts` — Added sync module to barrel export
- `src/entities/creature/model/types.ts` — DisplaySize imported from shared/lib/size-map
- `src/entities/creature/index.ts` — Added toCreature to barrel export

## Deviations
- **CreatureRow DTO pattern**: shared/api returns `CreatureRow` (raw DB types) instead of `Creature` entity type. The plan specified `Creature` return types, but steiger forbids shared→entities imports (FSD layer boundary). `toCreature()` mapper added in entities/creature/model/mappers.ts for consumers to convert.
- **DisplaySize moved to shared/lib**: Was in entities/creature/model/types.ts, moved to shared/lib/size-map.ts so mapSize can use it without cross-layer import. Entity re-exports it.

## Decisions
- FSD boundary enforced: shared/api returns DTOs, entity layer maps to domain types. This pattern applies to all future entity types (spells, items, hazards).
