# Phase 07: Type Foundation and Condition Engine - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the v2.0 ConditionManager into the combat tracker as the single source of truth for condition state, replacing the loose `Condition` type and manual array-based condition tracking. Implement dying/wounded cascade, group exclusivity, valued condition counters in badges, and PF2e-correct endTurn() decrement rules. Expand condition picker from 11 to 44 PF2e conditions.

</domain>

<decisions>
## Implementation Decisions

### ConditionManager Per-Creature Ownership
- One ConditionManager per creature, stored as `conditionManager` field on Creature with `markRaw()`
- Replaces `conditions: Condition[]` and `conditionValues` fields
- Vue reactivity via version counter ref (`conditionVersion`) — increment after every CM mutation
- Extend ConditionManager with duration + protected tracking (setDuration, setProtected) — all condition state in one place

### Condition Picker & Badge Expansion
- Categorized groups in picker popover (Detection, Attitudes, Movement, Mental, Physical, Combat, Other) — collapsible sections
- Semantic color families for badge classes: crimson=debilitating, amber=movement, indigo=senses, stone=physical, emerald=attitudes
- All 44 conditions from CONDITION_SLUGS available in picker
- `flat-footed` maps to `off-guard` (PF2e Remaster), `incapacitated` dropped (not a PF2e condition slug)

### Type Migration Mechanics
- Delete `Condition` type from `combat.ts`, import `ConditionSlug` from engine
- Replace `CONDITION_DEFS` and `CONDITIONS_WITH_VALUES` with engine-derived data from CONDITION_SLUGS/VALUED_CONDITIONS
- Update all component imports from `Condition` to `ConditionSlug` in one atomic commit
- `ConditionDef` rebuilt to reference `ConditionSlug` with badge class + category metadata

### endTurn() Decrement Rules
- PF2e auto-decrement: frightened, sickened, stunned (reduce by 1 at end of turn per CRB)
- endTurn() fully replaces decrementDurationsForCreature() — old duration system retired
- Dying/wounded cascade in ConditionManager.add('dying'): dying value = requestedValue + wounded value
- Auto-remove conditions that decrement to value 0

### Claude's Discretion
- Internal ConditionManager method signatures and implementation details
- Condition category grouping assignments (which conditions go in which picker group)
- Badge color palette specifics within the semantic family guidelines

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/pf2e/conditions.ts` — ConditionManager, CONDITION_SLUGS (44), VALUED_CONDITIONS (11), CONDITION_GROUPS
- `src/composables/useConditions.ts` — CONDITION_DEFS, CONDITION_BADGE_CLASSES, formatCondition, conditionHasValue
- `src/components/ConditionBadge.vue` — badge display + picker popover UI
- `src/stores/combat.ts` — useCombatStore with toggleCondition, setConditionValue, decrementDurationsForCreature

### Established Patterns
- markRaw() for non-reactive class instances in Pinia (per STATE.md decision)
- Version counter ref pattern for triggering reactivity on non-reactive objects
- Static badge class maps for Tailwind JIT (no dynamic class construction)
- Composables for shared logic (useConditions pattern)

### Integration Points
- `src/types/combat.ts` — Creature interface needs `conditionManager` field, drop `conditions`/`conditionValues`/`conditionDurations`
- `src/stores/combat.ts` — All condition mutations route through ConditionManager instead of array operations
- `src/components/ConditionBadge.vue` — Reads from ConditionManager via version-counter reactivity
- All components importing `Condition` type — bulk import replacement to `ConditionSlug`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard PF2e condition rules from CRB/Remaster apply.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
