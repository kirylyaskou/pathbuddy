# Phase 06: Conditions Module - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure TypeScript conditions module that exports all 44 PF2e condition slugs as typed constants, identifies valued conditions and mutually exclusive condition groups, and provides a stateful ConditionManager class that tracks active conditions with numeric values and auto-enforces PF2e rules (dying/wounded interaction, group exclusivity) on every mutation.

</domain>

<decisions>
## Implementation Decisions

### Condition Constants & Types
- CONDITION_SLUGS as `as const` string array with derived `ConditionSlug` union type — consistent with DAMAGE_TYPES, IMMUNITY_TYPES
- VALUED_CONDITIONS as separate `as const` subset array listing conditions that carry numeric values (clumsy, doomed, drained, etc.)
- CONDITION_GROUPS as `Record<string, ConditionSlug[]>` mapping group name (detection, attitudes) to member slugs
- Source: AON PRD (aonprd.com/Conditions.aspx) — authoritative PF2e Remaster rules for the 44 conditions

### ConditionManager Architecture
- Class with mutable state using `Map<ConditionSlug, number>` — boolean conditions stored as value 1, valued conditions use their numeric value
- Auto-enforce PF2e rules on every add/remove call — dying removal auto-increments wounded, group add auto-removes others
- No change events — pure state container, caller checks return values — engine-only milestone scope

### PF2e Rule Interactions
- Dying removal increments wounded on any removal of dying — PF2e: "When you lose the dying condition, you increase wounded by 1"
- Valued condition re-add overwrites with new value (PF2e rules allow increase or decrease)
- Group exclusivity: Detection group (observed, hidden, undetected, unnoticed) + Attitudes group (hostile, unfriendly, indifferent, friendly, helpful)
- Adding an already-present condition is idempotent: no-op for boolean, update value for valued

### Claude's Discretion
- Internal helper function decomposition within conditions.ts
- Exact condition slug ordering in the array
- Test organization and describe block structure
- Whether to add convenience methods beyond add/remove/has/get

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/pf2e/damage.ts` — `as const` array + derived union type pattern, section headers with source URLs
- `src/lib/pf2e/modifiers.ts` — Modifier class pattern (constructor, readonly properties), StatisticModifier (aggregating class)
- `src/lib/pf2e/iwr.ts` — Interface + factory function pattern, readonly interfaces
- `src/lib/pf2e/index.ts` — barrel export pattern for all pf2e modules

### Established Patterns
- `as const` arrays with derived union types
- Section headers with `// ─── Name ───...` separator comments
- Source URLs as comments (AON links)
- Vitest unit tests in `__tests__/` subdirectory
- readonly properties on data interfaces
- Pure TypeScript with no Foundry VTT runtime dependency

### Integration Points
- Barrel re-export via `src/lib/pf2e/index.ts`
- Tests in `src/lib/pf2e/__tests__/conditions.test.ts`
- No imports from other pf2e modules needed (standalone constants + class)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard PF2e condition rules from Core Rulebook / AON PRD

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
