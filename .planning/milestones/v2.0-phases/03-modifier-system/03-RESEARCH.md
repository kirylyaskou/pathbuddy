# Phase 03: Modifier System - Research

**Researched:** 2026-03-25
**Domain:** PF2e Modifier Stacking Rules (pure TypeScript game logic)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Module boundary:** Standalone TypeScript module at `src/lib/pf2e/modifiers.ts`. No UI, no database — pure game logic engine.

**Modifier type taxonomy:**
- 7 PF2e modifier types: ability, circumstance, item, potency, proficiency, status, untyped
- Export as `MODIFIER_TYPES = ['ability', 'circumstance', 'item', 'potency', 'proficiency', 'status', 'untyped'] as const`
- Derive `ModifierType` union type from the const array (consistent with Phase 02 DamageType pattern)
- Potency is the rune bonus type (weapon potency, armor potency) — distinct from item bonuses

**Modifier class design:**
- Class with constructor config object: `new Modifier({ slug, label, modifier, type, enabled? })`
- Properties are mutable (`enabled` toggled by stacking rules, UI interaction)
- `slug`: kebab-case identifier (e.g., 'status-bonus-bless')
- `label`: human-readable display name (e.g., 'Bless')
- `modifier`: numeric value (positive = bonus, negative = penalty)
- `type`: one of 7 ModifierType values
- `enabled`: boolean, defaults to true — stacking rules set to false for non-stacking duplicates
- No methods beyond constructor — Modifier is a data carrier, not a behavior host

**Stacking rules behavior:**
- Typed modifiers (ability, circumstance, item, potency, proficiency, status): only the highest bonus and lowest (most negative) penalty per type applies
- Untyped modifiers: ALL stack — both bonuses and penalties
- Disabled modifiers (`enabled: false`) are excluded from stacking consideration entirely
- applyStackingRules mutates the modifier array: sets `enabled = false` on non-stacking typed modifiers rather than removing them
- Zero-value modifiers are included in stacking evaluation (they participate but don't change totals)
- applyStackingRules is a standalone pure function, not a method on any class

**StatisticModifier:**
- Constructor: `new StatisticModifier(slug, modifiers[])`
- Calls applyStackingRules internally during construction
- `totalModifier`: computed sum of all enabled modifiers after stacking rules applied
- Label is the slug by default, optionally overridden via constructor parameter
- Exposes the modifier array for inspection

**DamageDicePF2e data holder:**
- Class with properties: slug, label, diceNumber, dieSize (DieFace), damageType (DamageType), category (DamageCategory), critical (CriticalInclusion)
- Imports types from `./damage` — Phase 02 dependency
- `enabled` flag for consistency with Modifier pattern
- No dice rolling logic — data holder only

### Claude's Discretion
- Exact constructor parameter object shape and optional fields
- Internal helper functions for stacking (e.g., groupByType)
- Test structure and organization (colocated in `__tests__/modifiers.test.ts`)
- Whether to add a `clone()` or `toJSON()` utility method
- JSDoc comments

### Deferred Ideas (OUT OF SCOPE)
- Weapon damage calculator using modifiers (WDMG-01, WDMG-02) — deferred from v2.0 entirely
- UI for displaying modifier breakdowns — next milestone (UI integration)
- Predicate-based modifier activation (RuleElement system) — out of scope per REQUIREMENTS.md
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOD-01 | Modifier class with slug, label, value, type (7 PF2e types), enabled state | Foundry PF2e ModifierPF2e class is reference; project uses simpler data-only design with mutable enabled |
| MOD-02 | applyStackingRules applies PF2e stacking (highest bonus/lowest penalty per type, untyped all stack) | PF2e official rules + Foundry reference implementation verified; algorithm fully mapped |
| MOD-03 | StatisticModifier aggregates modifier list into totalModifier via stacking rules | Foundry StatisticModifier pattern confirmed; simpler than Foundry (no predicates/rollOptions needed) |
| MOD-04 | DamageDicePF2e holds dice modifier with diceNumber, dieSize, damageType, category, critical | All imported types exist in damage.ts; data-holder pattern only |
</phase_requirements>

---

## Summary

Phase 03 implements a pure TypeScript game logic module for PF2e modifier stacking. The domain is well-defined: PF2e has exactly 7 modifier types and deterministic stacking rules stated explicitly in official rules documentation. The Foundry VTT PF2e system provides a validated reference implementation that confirms the algorithmic approach, though the project's implementation will be significantly simpler (no predicates, no i18n, no Foundry framework coupling).

The stacking algorithm splits modifiers by type into bonus buckets (positive values) and penalty buckets (negative values). For typed categories, only the single highest bonus and single lowest penalty per type are left enabled; all others have `enabled` set to false. Untyped modifiers bypass this selection and all remain enabled. A same-type bonus + penalty of the same type both apply simultaneously — they do not cancel. The `StatisticModifier` class is a thin aggregator that calls `applyStackingRules` and sums enabled modifiers into `totalModifier`.

The project pattern from Phase 02 (`damage.ts`) establishes the exact code style to follow: `as const` arrays, derived union types, section-header comments, source URL comments, and colocated `__tests__/` test files. No new dependencies are required.

**Primary recommendation:** Mirror the Phase 02 damage.ts structure exactly. MODIFIER_TYPES as const array, ModifierType derived union, Modifier as a plain class (data carrier), applyStackingRules as a standalone function with groupByType + bonus/penalty bucket logic, StatisticModifier as an aggregator class.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.6.3 | Language | Already in project; all pf2e modules are pure TS |
| Vitest | ^2.1.8 | Test framework | Already in project; all existing pf2e tests use it |

No new dependencies. This phase is zero-dependency pure TypeScript.

**No installation required.** All tooling already present.

---

## Architecture Patterns

### File Location
```
src/lib/pf2e/
├── damage.ts         # Phase 02 — DamageType, DieFace, DamageCategory, CriticalInclusion
├── modifiers.ts      # Phase 03 — NEW FILE
├── xp.ts             # Phase 01 — pattern template
├── index.ts          # barrel exports — extend with modifiers
└── __tests__/
    ├── damage.test.ts
    ├── xp.test.ts
    └── modifiers.test.ts  # Phase 03 — NEW FILE
```

### Pattern 1: MODIFIER_TYPES as const (mirrors DamageType pattern)
**What:** Derive the union type from the const array, not independently.
**When to use:** Every named type taxonomy in this codebase.
**Example:**
```typescript
// Source: src/lib/pf2e/damage.ts — established project pattern
export const MODIFIER_TYPES = [
  'ability', 'circumstance', 'item', 'potency',
  'proficiency', 'status', 'untyped',
] as const
export type ModifierType = (typeof MODIFIER_TYPES)[number]
```

### Pattern 2: Modifier constructor config object
**What:** Single config object parameter with required + optional fields.
**When to use:** The class carries data, not behavior.
**Example:**
```typescript
// Source: CONTEXT.md locked decision; mirrors Foundry ModifierPF2e pattern
interface ModifierParams {
  slug: string
  label: string
  modifier: number
  type: ModifierType
  enabled?: boolean  // defaults to true
}

export class Modifier {
  slug: string
  label: string
  modifier: number
  type: ModifierType
  enabled: boolean

  constructor({ slug, label, modifier, type, enabled = true }: ModifierParams) {
    this.slug = slug
    this.label = label
    this.modifier = modifier
    this.type = type
    this.enabled = enabled
  }
}
```

### Pattern 3: applyStackingRules algorithm
**What:** Mutates `enabled` on modifier array; returns nothing (or returns totalModifier sum).
**When to use:** Called by StatisticModifier constructor. Can also be used standalone.

The algorithm:

```
1. Separate pre-disabled modifiers (enabled: false already) — skip entirely
2. Group active (enabled: true) modifiers by type into typed vs untyped
3. For typed groups:
   a. Split each group into bonuses (modifier > 0 or == 0) and penalties (modifier < 0)
   b. Bonuses: keep only the one with the highest value enabled; disable others
   c. Penalties: keep only the one with the lowest value enabled; disable others
4. Untyped modifiers: leave all enabled (both bonuses and penalties)
5. Return (nothing — side effect only; caller sums enabled modifiers)
```

Key edge cases from official PF2e rules:
- A typed bonus and typed penalty of the SAME type both apply simultaneously (they do NOT cancel each other; they are in separate penalty/bonus buckets)
- Zero-value modifiers participate in bucket selection (can be the "highest bonus" if all typed mods of that type are 0 or negative)
- Pre-disabled modifiers are skipped entirely — they do not compete for the "highest bonus" slot

```typescript
// Source: Foundry PF2e modifiers.ts reference + PF2e rules (https://2e.aonprd.com/Rules.aspx?ID=22)
export function applyStackingRules(modifiers: Modifier[]): void {
  // Group enabled typed modifiers by type
  const bonusByType = new Map<ModifierType, Modifier>()
  const penaltyByType = new Map<ModifierType, Modifier>()

  for (const modifier of modifiers) {
    if (!modifier.enabled) continue
    if (modifier.type === 'untyped') continue  // untyped always stack

    if (modifier.modifier >= 0) {
      // Bonus bucket: keep highest
      const existing = bonusByType.get(modifier.type)
      if (!existing || modifier.modifier > existing.modifier) {
        if (existing) existing.enabled = false
        bonusByType.set(modifier.type, modifier)
      } else {
        modifier.enabled = false
      }
    } else {
      // Penalty bucket: keep lowest (most negative)
      const existing = penaltyByType.get(modifier.type)
      if (!existing || modifier.modifier < existing.modifier) {
        if (existing) existing.enabled = false
        penaltyByType.set(modifier.type, modifier)
      } else {
        modifier.enabled = false
      }
    }
  }
}
```

### Pattern 4: StatisticModifier aggregator
**What:** Thin wrapper that calls applyStackingRules and computes totalModifier.
**When to use:** Whenever you need a final numeric modifier from a list.
**Example:**
```typescript
// Source: CONTEXT.md locked design; mirrors Foundry StatisticModifier
export class StatisticModifier {
  slug: string
  label: string
  modifiers: Modifier[]
  totalModifier: number

  constructor(slug: string, modifiers: Modifier[], label?: string) {
    this.slug = slug
    this.label = label ?? slug
    this.modifiers = [...modifiers]
    applyStackingRules(this.modifiers)
    this.totalModifier = this.modifiers
      .filter(m => m.enabled)
      .reduce((sum, m) => sum + m.modifier, 0)
  }
}
```

### Pattern 5: DamageDicePF2e data holder
**What:** Class that carries dice descriptor data, imports types from damage.ts.
**When to use:** Represents a damage dice contribution (e.g., a striking rune adds dice).
**Example:**
```typescript
// Source: CONTEXT.md locked design; imports Phase 02 types
import type { DieFace, DamageType, DamageCategory, CriticalInclusion } from './damage'

interface DamageDiceParams {
  slug: string
  label: string
  diceNumber: number
  dieSize: DieFace
  damageType: DamageType
  category: DamageCategory
  critical: CriticalInclusion
  enabled?: boolean
}

export class DamageDicePF2e {
  slug: string
  label: string
  diceNumber: number
  dieSize: DieFace
  damageType: DamageType
  category: DamageCategory
  critical: CriticalInclusion
  enabled: boolean

  constructor(params: DamageDiceParams) { /* assign all fields */ }
}
```

### Anti-Patterns to Avoid

- **Removing modifiers from the array:** The design mutates `enabled`, not the array. Non-stacking modifiers stay in the list for UI/debug inspection.
- **Treating bonus + penalty of same type as cancelling:** They go into separate buckets. A status +2 and status -1 both apply. The net is +1.
- **Calling applyStackingRules more than once on the same array:** Subsequent calls are idempotent only if no pre-disabled modifiers exist; safest to call once at construction.
- **Applying stacking rules to pre-disabled modifiers:** Skip any modifier with `enabled: false` before entering the algorithm. They are invisible to stacking.
- **Importing Foundry types:** This codebase is zero-Foundry. All types are project-defined.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stacking algorithm | Custom ad-hoc comparisons per call site | `applyStackingRules` pure function | One canonical implementation; testable in isolation |
| Modifier aggregation | Manual filter/reduce at call sites | `StatisticModifier` class | Guarantees stacking always runs before summing |
| Type validation | Runtime type guards | TypeScript union + `as const` array | Compile-time safety; consistent with Phase 02 pattern |

**Key insight:** The stacking algorithm has multiple edge cases (same-type bonus+penalty both apply, zero-value modifier as "winner", pre-disabled modifiers skip entirely). Centralizing in one function prevents edge case misses at call sites.

---

## Common Pitfalls

### Pitfall 1: Conflating "untyped modifier" with "untyped penalty"
**What goes wrong:** In PF2e rules text, "untyped penalties" (like MAP, range increment) are explicitly the ones that always stack. But the 7 modifier types include `'untyped'` as a type, which applies to both bonuses and penalties. The decision locks this: `'untyped'` type means all stack (bonuses and penalties).
**Why it happens:** PF2e rules often discuss "untyped penalties" specially, which can make `untyped` seem penalty-only.
**How to avoid:** Implement: `if (modifier.type === 'untyped') continue` — skip untyped modifiers from the typed bucket logic entirely. They always stack.

### Pitfall 2: Same-type bonus and penalty treated as cancelling
**What goes wrong:** A `status +2` and `status -1` produce net `+1`, not just `+2` or just `-1`.
**Why it happens:** It's intuitive to assume "only the highest type modifier applies" means you take the net of one type.
**How to avoid:** Maintain two separate Maps: `bonusByType` (modifier >= 0) and `penaltyByType` (modifier < 0). An entry can appear in both at the same time.
**Warning signs:** Test `status +2` + `status -2` equals `0` (both apply); if result is `+2`, the penalty bucket is broken.

### Pitfall 3: Pre-disabled modifiers competing in stacking
**What goes wrong:** A modifier passed into StatisticModifier with `enabled: false` is counted as the "highest bonus" for its type, blocking an enabled modifier of the same type from applying.
**Why it happens:** The algorithm loop iterates all modifiers including pre-disabled ones.
**How to avoid:** Guard at the top of the stacking loop: `if (!modifier.enabled) continue`.
**Warning signs:** Passing `{ modifier: 5, type: 'status', enabled: false }` + `{ modifier: 3, type: 'status', enabled: true }` yields `totalModifier === 0` when it should be `3`.

### Pitfall 4: index.ts barrel export not updated
**What goes wrong:** Code outside `src/lib/pf2e/` imports from `@/lib/pf2e` and gets nothing from modifiers.ts.
**Why it happens:** `index.ts` requires manual updating for each new module.
**How to avoid:** The plan must explicitly add Modifier, StatisticModifier, DamageDicePF2e, applyStackingRules, MODIFIER_TYPES, and ModifierType to `index.ts`.

### Pitfall 5: Zero-value modifiers in stacking evaluation
**What goes wrong:** A `status +0` modifier should be able to "win" the status bonus bucket if all other status modifiers are penalties. If zero is excluded from evaluation, the bucket is empty and a +0 modifier that should win is left disabled.
**Why it happens:** Filtering `modifier !== 0` before stacking.
**How to avoid:** Treat zero as a non-negative value for bucket assignment. `modifier >= 0` goes to the bonus bucket, `modifier < 0` goes to the penalty bucket. Zero participates in bonus bucket selection.

---

## Code Examples

### Full applyStackingRules with edge case coverage
```typescript
// Source: Foundry PF2e actor/modifiers.ts reference algorithm, simplified for this project
// PF2e rules: https://2e.aonprd.com/Rules.aspx?ID=22
export function applyStackingRules(modifiers: Modifier[]): void {
  const highestBonusByType = new Map<ModifierType, Modifier>()
  const lowestPenaltyByType = new Map<ModifierType, Modifier>()

  for (const modifier of modifiers) {
    if (!modifier.enabled) continue          // skip pre-disabled
    if (modifier.type === 'untyped') continue  // untyped always stack

    if (modifier.modifier >= 0) {
      // bonus bucket: keep highest per type
      const current = highestBonusByType.get(modifier.type)
      if (current === undefined || modifier.modifier > current.modifier) {
        if (current) current.enabled = false
        highestBonusByType.set(modifier.type, modifier)
      } else {
        modifier.enabled = false
      }
    } else {
      // penalty bucket: keep lowest (most negative) per type
      const current = lowestPenaltyByType.get(modifier.type)
      if (current === undefined || modifier.modifier < current.modifier) {
        if (current) current.enabled = false
        lowestPenaltyByType.set(modifier.type, modifier)
      } else {
        modifier.enabled = false
      }
    }
  }
}
```

### Key test cases the plan must cover
```typescript
// Source: CONTEXT.md success criteria + PF2e stacking rules
// MOD-02 stacking tests
it('two status bonuses: only the higher applies', () => {
  const mods = [
    new Modifier({ slug: 'bless', label: 'Bless', modifier: 1, type: 'status' }),
    new Modifier({ slug: 'heroism', label: 'Heroism', modifier: 2, type: 'status' }),
  ]
  const stat = new StatisticModifier('attack', mods)
  expect(stat.totalModifier).toBe(2)
  expect(mods.find(m => m.slug === 'bless')!.enabled).toBe(false)
  expect(mods.find(m => m.slug === 'heroism')!.enabled).toBe(true)
})

it('status bonus + circumstance bonus: both apply', () => {
  const mods = [
    new Modifier({ slug: 'heroism', label: 'Heroism', modifier: 2, type: 'status' }),
    new Modifier({ slug: 'flanking', label: 'Flanking', modifier: 2, type: 'circumstance' }),
  ]
  const stat = new StatisticModifier('attack', mods)
  expect(stat.totalModifier).toBe(4)
})

it('same-type bonus and penalty both apply', () => {
  const mods = [
    new Modifier({ slug: 'heroism', label: 'Heroism', modifier: 2, type: 'status' }),
    new Modifier({ slug: 'sickened', label: 'Sickened', modifier: -1, type: 'status' }),
  ]
  const stat = new StatisticModifier('attack', mods)
  expect(stat.totalModifier).toBe(1)  // +2 + (-1) = +1
})

it('untyped bonuses all stack', () => {
  const mods = [
    new Modifier({ slug: 'map', label: 'MAP', modifier: -5, type: 'untyped' }),
    new Modifier({ slug: 'range', label: 'Range', modifier: -2, type: 'untyped' }),
  ]
  const stat = new StatisticModifier('attack', mods)
  expect(stat.totalModifier).toBe(-7)
})
```

### index.ts barrel export additions
```typescript
// Add to src/lib/pf2e/index.ts
export { MODIFIER_TYPES, Modifier, applyStackingRules, StatisticModifier, DamageDicePF2e } from './modifiers'
export type { ModifierType } from './modifiers'
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PF2e used `positive`/`negative` energy types | Remaster: `vitality`/`void` | PF2e Remaster 2023 | Already addressed in Phase 02 damage.ts |
| Foundry ModifierPF2e has predicates, rollOptions, i18n | This project: data-only, no predicates | This project decision | Significantly simpler implementation |
| Foundry `new Set([...] as const)` for MODIFIER_TYPES | Project: `[...] as const` array (consistent with DamageType) | Project convention established Phase 02 | Union derivation via `[number]` indexing |

---

## Open Questions

1. **Whether `applyStackingRules` should return `number` (totalModifier) or `void`**
   - What we know: The Foundry implementation returns the numeric total. StatisticModifier can compute total independently.
   - What's unclear: Whether returning the total is useful for standalone calls outside StatisticModifier.
   - Recommendation: Return `void` — StatisticModifier computes its own sum. Makes the function's side-effect nature explicit. Claude's discretion applies here.

2. **Whether to add a `push(modifier)` method to StatisticModifier**
   - What we know: Foundry StatisticModifier has `push()`. Current project scope only needs construction.
   - What's unclear: Phase 05 IWR Engine may want to add modifiers after construction.
   - Recommendation: Omit for now (out of scope per CONTEXT.md). Phase 05 can re-construct with a new array if needed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^2.1.8 |
| Config file | `vitest.config.ts` (root, `test.include: src/**/*.{test,spec}`) |
| Quick run command | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOD-01 | Modifier class accepts slug/label/modifier/type; enabled defaults true | unit | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` | Wave 0 |
| MOD-02 | Two status bonuses: only higher applies | unit | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` | Wave 0 |
| MOD-02 | Status + circumstance both apply | unit | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` | Wave 0 |
| MOD-02 | Same-type bonus + penalty both apply | unit | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` | Wave 0 |
| MOD-02 | Untyped bonuses/penalties all stack | unit | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` | Wave 0 |
| MOD-02 | Pre-disabled modifiers skip stacking | unit | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` | Wave 0 |
| MOD-03 | StatisticModifier totalModifier is sum of enabled after stacking | unit | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` | Wave 0 |
| MOD-04 | DamageDicePF2e accepts all required properties | unit | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/pf2e/__tests__/modifiers.test.ts` — covers MOD-01, MOD-02, MOD-03, MOD-04

*(No framework install needed — vitest already configured. No new fixtures needed — pure TS, no mocks required.)*

---

## Sources

### Primary (HIGH confidence)
- `https://github.com/foundryvtt/pf2e/blob/master/src/module/actor/modifiers.ts` — MODIFIER_TYPES const, ModifierPF2e class shape, applyStackingRules algorithm, StatisticModifier class
- `https://2e.aonprd.com/Rules.aspx?ID=22` — Official PF2e Bonuses and Penalties rules (typed stacking: highest bonus / lowest penalty per type; untyped: all stack; same-type bonus+penalty: both apply)
- `src/lib/pf2e/damage.ts` — Established project code pattern (as const, derived union, section headers, source URLs)
- `src/lib/pf2e/xp.ts` — Established pure function + type pattern

### Secondary (MEDIUM confidence)
- `https://2e.aonprd.com/Rules.aspx?ID=315` — Step 1 modifier identification rules, confirms typed categories
- WebSearch cross-verification of PF2e modifier types list (ability, circumstance, item, potency, proficiency, status, untyped) — matches Foundry source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, existing toolchain
- Architecture: HIGH — locked decisions + Foundry reference implementation verified + existing project patterns clear
- Stacking algorithm: HIGH — official PF2e rules + Foundry source implementation both consulted; edge cases documented
- Pitfalls: HIGH — derived from algorithm analysis + rule edge cases from official docs
- DamageDicePF2e: HIGH — all dependency types exist in damage.ts, data-holder pattern is trivial

**Research date:** 2026-03-25
**Valid until:** 2026-06-25 (stable rules; PF2e remaster taxonomy already incorporated in Phase 02)
