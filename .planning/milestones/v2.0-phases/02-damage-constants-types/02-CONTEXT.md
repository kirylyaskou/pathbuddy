# Phase 02: Damage Constants & Types - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Single authoritative TypeScript module at `src/lib/pf2e/damage.ts` exporting all PF2e damage type constants, die size constants, material damage effects, and TypeScript interfaces for damage formulas. All downstream modules (modifiers, IWR, conditions) import damage types from this module. No UI, no database -- pure type definitions and constant tables.

</domain>

<decisions>
## Implementation Decisions

### Type system approach
- String union types + `as const` arrays -- consistent with Phase 01 pattern (`ThreatRating`, `HazardType`)
- Export const arrays (e.g., `PHYSICAL_DAMAGE_TYPES as const`) for runtime iteration AND derive union types from them
- Category mapping via `Record<DamageType, DamageCategory>` lookup table

### Module organization
- Single `src/lib/pf2e/damage.ts` file for all constants, types, and interfaces
- Follows Phase 01 pattern: one module file per domain (`xp.ts`, now `damage.ts`)
- Add exports to `src/lib/pf2e/index.ts` barrel

### Foundry fidelity -- full PF2e CRB damage taxonomy
- All 3 physical types: bludgeoning, slashing, piercing
- All 6 energy types: fire, cold, electricity, acid, sonic, force (per Remaster)
- Additional types: bleed, mental, poison, spirit, vitality, void, untyped
- Material effects: adamantine, cold-iron, mithral, orichalcum, silver, sisterstone-dusk, sisterstone-scarlet (per Remaster)
- Three categories: physical, energy, other -- every damage type maps to exactly one category

### Die size constants
- Die sizes as const array: `[4, 6, 8, 10, 12] as const`
- Die face type derived from array: `DieSize = 'd4' | 'd6' | 'd8' | 'd10' | 'd12'`
- Die size progression order matters for Phase 04 `nextDamageDieSize` stepping

### Interface scope -- DMG-03 specified only
- `DamageFormula`: dice expression (diceNumber, dieSize, modifier, damageType, category, persistent flag)
- `BaseDamage`: resolved damage instance (damageType, category, total value, isCritical)
- `IWRBypass`: specifies which IWR to bypass (type, reason) -- consumed by Phase 05
- `CriticalInclusion`: enum/union for "critical-only" | "non-critical-only" | null (always applies)
- No additional interfaces beyond DMG-03 requirements -- downstream phases define their own

### Claude's Discretion
- Exact naming of const arrays and type exports (e.g., `DAMAGE_TYPES` vs `ALL_DAMAGE_TYPES`)
- Whether to group material effects with damage types or as a separate taxonomy
- JSDoc comments on interfaces
- Test file structure and organization

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PF2e Rules (reference source)
- PF2e Player Core / GM Core: Damage types taxonomy (physical, energy, other categories)
- PF2e Remaster: Updated material damage effects (sisterstone replaces some legacy materials)
- PF2e GM Core: Die size table and damage formula conventions

### Project requirements
- `.planning/REQUIREMENTS.md` -- DMG-01, DMG-02, DMG-03 define all required exports
- `.planning/ROADMAP.md` -- Phase 02 success criteria (4 items)

### Existing code (integration points)
- `src/lib/pf2e/xp.ts` -- Established pattern: const record lookups, union types, source comments
- `src/lib/pf2e/index.ts` -- Barrel exports to extend with damage module
- `src/lib/description-sanitizer.ts` -- Has `DAMAGE_TYPE_COLORS` with partial damage type list (fire, cold, electricity, bleed, poison, mental, sonic) -- future refactor could import from damage module

### Downstream consumers
- Phase 03 (Modifier System) -- imports damage types for `DamageDicePF2e`
- Phase 04 (Damage Helpers) -- imports damage types for `DamageCategorization`, die sizes for `nextDamageDieSize`
- Phase 05 (IWR Engine) -- imports damage types, `BaseDamage`, `IWRBypass` interfaces
- Phase 06 (Conditions Module) -- imports naming patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/pf2e/xp.ts`: Pattern template -- const record tables, union types, source URL comments, pure functions
- `src/lib/description-sanitizer.ts` `DAMAGE_TYPE_COLORS`: Partial damage type enum (7 types) -- the new module becomes the canonical source

### Established Patterns
- Union types for string enumerations (`ThreatRating = 'trivial' | 'low' | ...`)
- `Record<K, V>` for lookup tables
- Source comments with AoN URLs for PF2e rules
- `__testing` namespace for internal-only exports
- Barrel re-export through `src/lib/pf2e/index.ts`

### Integration Points
- `src/lib/pf2e/index.ts` -- add damage type and interface exports
- Future: `DAMAGE_TYPE_COLORS` in description-sanitizer.ts could import from damage module (not this phase)

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches. This is a pure constants/types foundation phase with clear requirements from DMG-01, DMG-02, DMG-03.

</specifics>

<deferred>
## Deferred Ideas

- Refactor `DAMAGE_TYPE_COLORS` in description-sanitizer.ts to import from the new damage module -- tech debt, not this phase
- Weapon damage calculator (WDMG-01, WDMG-02) -- deferred from v2.0 entirely
- Damage calculator UI (UI-02) -- next milestone

</deferred>

---

*Phase: 02-damage-constants-types*
*Context gathered: 2026-03-24*
