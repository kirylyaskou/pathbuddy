# Phase 05: IWR Engine - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure TypeScript IWR (Immunity/Weakness/Resistance) engine that applies a creature's IWR entries to a damage instance and returns the adjusted damage value with a detailed breakdown. Processes immunities first (zeroing), then weaknesses (adding), then resistances (reducing) per official PF2e rules. Handles special cases: critical-hit immunity (un-doubling), precision immunity, weakness doubleVs, and applyOnce.

</domain>

<decisions>
## Implementation Decisions

### Data Model Design
- IWR data models as plain TypeScript interfaces with factory functions — consistent with Modifier class pattern from Phase 03
- DamageInstance interface: `{ type: DamageType, amount: number, category?: DamageCategory, critical?: boolean, precision?: boolean, materials?: MaterialEffect[] }`
- Exceptions typed as `DamageType[]` — narrowed from damage.ts types, not loose strings
- applyIWR returns detailed breakdown: `{ finalDamage: number, appliedImmunities: [], appliedWeaknesses: [], appliedResistances: [] }` for future UI display

### Algorithm Design
- Process order: Immunities → Weaknesses → Resistances (official PF2e CRB order)
- applyIWR processes a single damage instance; caller handles multi-instance aggregation
- Precision immunity zeroes out only the precision-tagged portion of damage, not the full amount
- Critical-hit immunity halves the total (un-doubles) — reverts to non-crit damage amount

### Module Organization
- Single file: `src/lib/pf2e/iwr.ts`
- Barrel export via `src/lib/pf2e/index.ts`
- Tests in `src/lib/pf2e/__tests__/iwr.test.ts`

### Claude's Discretion
- Internal helper function decomposition within iwr.ts
- Exact interface field names and type narrowing details
- Test organization and describe block structure

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/pf2e/damage.ts` — DamageType, DamageCategory, MaterialEffect, CriticalInclusion types
- `src/lib/pf2e/damage-helpers.ts` — DamageCategorization.getCategory() for category-level IWR matching
- `src/lib/pf2e/index.ts` — barrel export pattern

### Established Patterns
- `as const` arrays with derived union types
- Pure functions with no side effects
- Interface + factory function pattern (Phase 03 Modifier)
- Section headers with source URLs
- Vitest unit tests in `__tests__/` subdirectory

### Integration Points
- Imports from `./damage` for type constants and interfaces
- Imports from `./damage-helpers` for DamageCategorization (category-level IWR matching)
- Barrel re-export via `index.ts`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard PF2e IWR rules from Core Rulebook

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
