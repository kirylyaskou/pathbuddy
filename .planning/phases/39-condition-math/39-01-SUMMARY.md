---
phase: 39-condition-math
plan: 01
status: complete
commit: ea46796c
---

# Plan 39-01 Summary

## What was built

**engine/statistics/compute-stat-modifiers.ts** (new)
- `computeStatModifier(conditions, statSlug, allStatSlugs)` — Layer 1 resolver
- Iterates `CONDITION_EFFECTS` for each active condition
- Calls `resolveSelector` to check if effect targets the given stat slug
- Computes modifier value (fixed vs. valuePerLevel × conditionValue)
- Passes raw modifiers through `StatisticModifier` for stacking rules
- Returns `{ netModifier, modifiers[] }` — only enabled modifiers after stacking
- Exports `ConditionInput` and `StatModifierResult` interfaces

**engine/index.ts** (modified)
- Added exports for `computeStatModifier`, `ConditionInput`, `StatModifierResult`

**src/shared/model/use-modified-stats.ts** (new)
- `useModifiedStats(combatantId, statSlugs)` — subscribes to `useConditionStore`,
  returns `Map<statSlug, StatModifierResult>` memoized on condition changes
- `resolveSpellModifiers(conditions, tradition)` — manually checks tradition
  selectors (arcane→int, divine→wis, etc.) for spell attack/DC modification
- `useSpellModifiers(combatantId, tradition)` — React hook wrapping resolveSpellModifiers

## Verification
- `npx tsc --noEmit`: 0 new errors (2 pre-existing unrelated errors unchanged)
