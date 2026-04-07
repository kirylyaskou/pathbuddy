# Phase 03: Modifier System - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Standalone TypeScript module at `src/lib/pf2e/modifiers.ts` delivering PF2e modifier stacking rules. Includes Modifier class (typed bonus/penalty carriers), applyStackingRules (highest bonus/lowest penalty per typed category, untyped all stack), StatisticModifier (aggregates a modifier list into totalModifier), and DamageDicePF2e (damage dice data holder). No UI, no database -- pure game logic engine.

</domain>

<decisions>
## Implementation Decisions

### Modifier type taxonomy
- 7 PF2e modifier types: ability, circumstance, item, potency, proficiency, status, untyped
- Export as `MODIFIER_TYPES = ['ability', 'circumstance', 'item', 'potency', 'proficiency', 'status', 'untyped'] as const`
- Derive `ModifierType` union type from the const array (consistent with Phase 02 DamageType pattern)
- Potency is the rune bonus type (weapon potency, armor potency) -- distinct from item bonuses

### Modifier class design
- Class with constructor config object: `new Modifier({ slug, label, modifier, type, enabled? })`
- Properties are mutable (`enabled` toggled by stacking rules, UI interaction)
- `slug`: kebab-case identifier (e.g., 'status-bonus-bless')
- `label`: human-readable display name (e.g., 'Bless')
- `modifier`: numeric value (positive = bonus, negative = penalty)
- `type`: one of 7 ModifierType values
- `enabled`: boolean, defaults to true -- stacking rules set to false for non-stacking duplicates
- No methods beyond constructor -- Modifier is a data carrier, not a behavior host

### Stacking rules behavior
- Typed modifiers (ability, circumstance, item, potency, proficiency, status): only the highest bonus and lowest (most negative) penalty per type applies
- Untyped modifiers: ALL stack -- both bonuses and penalties
- Disabled modifiers (`enabled: false`) are excluded from stacking consideration entirely
- applyStackingRules mutates the modifier array: sets `enabled = false` on non-stacking typed modifiers rather than removing them -- preserves the full list for UI display and debugging
- Zero-value modifiers are included in stacking evaluation (they participate but don't change totals)
- applyStackingRules is a standalone pure function, not a method on any class

### StatisticModifier aggregation
- Constructor: `new StatisticModifier(slug, modifiers[])`
- Calls applyStackingRules internally during construction
- `totalModifier`: computed sum of all enabled modifiers after stacking rules applied
- Label is the slug by default, optionally overridden via constructor parameter
- Exposes the modifier array for inspection (which are enabled/disabled after stacking)

### DamageDicePF2e data holder
- Class with properties: slug, label, diceNumber, dieSize (DieFace from damage.ts), damageType (DamageType from damage.ts), category (DamageCategory from damage.ts), critical (CriticalInclusion from damage.ts)
- Imports types from `./damage` -- Phase 02 dependency satisfied
- enabled flag for consistency with Modifier pattern
- No dice rolling logic -- this is a data holder only, rolling is out of scope for v2.0

### Claude's Discretion
- Exact constructor parameter object shape and optional fields
- Internal helper functions for stacking (e.g., groupByType)
- Test structure and organization (colocated in `__tests__/modifiers.test.ts`)
- Whether to add a `clone()` or `toJSON()` utility method
- JSDoc comments

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PF2e Rules (reference source)
- PF2e Player Core: Modifier types and stacking rules (https://2e.aonprd.com/Rules.aspx?ID=318) -- typed modifiers don't stack, untyped always stack
- PF2e Player Core: Modifier types definitions -- ability, circumstance, item, potency, proficiency, status

### Project requirements
- `.planning/REQUIREMENTS.md` -- MOD-01, MOD-02, MOD-03, MOD-04 define all required exports
- `.planning/ROADMAP.md` -- Phase 03 success criteria (5 items)

### Existing code (integration points)
- `src/lib/pf2e/damage.ts` -- DamageType, DieFace, DamageCategory, CriticalInclusion types imported by DamageDicePF2e
- `src/lib/pf2e/index.ts` -- Barrel exports to extend with modifier module
- `src/lib/pf2e/xp.ts` -- Established pattern: const arrays, union types, pure functions

### Downstream consumers
- Phase 05 (IWR Engine) -- may interact with modifier-adjusted damage values
- Future UI milestone -- modifier display will use the enabled/disabled state from stacking rules

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/pf2e/damage.ts`: DamageType, DieFace, DamageCategory, CriticalInclusion -- imported directly by DamageDicePF2e
- `src/lib/pf2e/xp.ts`: Pattern template for const arrays, union types, `Record<K, V>` lookups
- `src/lib/pf2e/index.ts`: Barrel export pattern to extend

### Established Patterns
- `as const` arrays with derived union types (DamageType pattern from Phase 02)
- Pure TypeScript functions, no framework dependency
- Colocated `__tests__/` directory for test files
- Vitest + describe/it/expect test structure
- Source URL comments for PF2e rules references

### Integration Points
- `src/lib/pf2e/index.ts` -- add Modifier, StatisticModifier, DamageDicePF2e, applyStackingRules exports
- `src/lib/pf2e/damage.ts` -- import DamageType, DieFace, DamageCategory, CriticalInclusion

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches. This is a pure game logic engine module with clear requirements from MOD-01 through MOD-04. The Foundry VTT PF2e system's modifier stacking logic is the reference implementation.

</specifics>

<deferred>
## Deferred Ideas

- Weapon damage calculator using modifiers (WDMG-01, WDMG-02) -- deferred from v2.0 entirely
- UI for displaying modifier breakdowns -- next milestone (UI integration)
- Predicate-based modifier activation (RuleElement system) -- out of scope per REQUIREMENTS.md

</deferred>

---

*Phase: 03-modifier-system*
*Context gathered: 2026-03-24*
