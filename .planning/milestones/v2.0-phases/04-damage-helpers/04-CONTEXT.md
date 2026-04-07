# Phase 04: Damage Helpers - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure utility functions for damage type categorization (mapping damage types to physical/energy/other categories and reverse) and die size stepping (d4↔d6↔d8↔d10↔d12 progression with boundary capping). Consumed by Phase 05 IWR Engine and higher-level damage logic.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Follow established patterns from `src/lib/pf2e/damage.ts` (as const arrays, derived union types, section headers, source URLs) and `src/lib/pf2e/modifiers.ts` (pure functions, barrel exports via index.ts).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/pf2e/damage.ts` — DAMAGE_TYPES, PHYSICAL_DAMAGE_TYPES, ENERGY_DAMAGE_TYPES, DamageCategory, DieFace constants already defined
- `src/lib/pf2e/index.ts` — barrel export pattern for all pf2e modules
- `src/lib/pf2e/__tests__/damage.test.ts` — test pattern for damage-related assertions

### Established Patterns
- `as const` arrays with derived union types (DamageType, DieFace, etc.)
- Pure functions with no side effects
- Vitest unit tests in `__tests__/` subdirectory
- Foundry VTT PF2e as reference implementation (not dependency)

### Integration Points
- Imports from `./damage` for type constants
- Barrel re-export via `index.ts`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
