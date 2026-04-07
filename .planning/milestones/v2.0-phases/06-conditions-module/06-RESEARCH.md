# Phase 06: Conditions Module - Research

**Researched:** 2026-03-25
**Domain:** PF2e Conditions — TypeScript constants, union types, stateful ConditionManager class
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- CONDITION_SLUGS as `as const` string array with derived `ConditionSlug` union type — consistent with DAMAGE_TYPES, IMMUNITY_TYPES
- VALUED_CONDITIONS as separate `as const` subset array listing conditions that carry numeric values (clumsy, doomed, drained, etc.)
- CONDITION_GROUPS as `Record<string, ConditionSlug[]>` mapping group name (detection, attitudes) to member slugs
- Source: AON PRD (aonprd.com/Conditions.aspx) — authoritative PF2e Remaster rules for the 44 conditions
- Class with mutable state using `Map<ConditionSlug, number>` — boolean conditions stored as value 1, valued conditions use their numeric value
- Auto-enforce PF2e rules on every add/remove call — dying removal auto-increments wounded, group add auto-removes others
- No change events — pure state container, caller checks return values — engine-only milestone scope
- Dying removal increments wounded on any removal of dying — PF2e: "When you lose the dying condition, you increase wounded by 1"
- Valued condition re-add overwrites with new value (PF2e rules allow increase or decrease)
- Group exclusivity: Detection group (observed, hidden, undetected, unnoticed) + Attitudes group (hostile, unfriendly, indifferent, friendly, helpful)
- Adding an already-present condition is idempotent: no-op for boolean, update value for valued

### Claude's Discretion
- Internal helper function decomposition within conditions.ts
- Exact condition slug ordering in the array
- Test organization and describe block structure
- Whether to add convenience methods beyond add/remove/has/get

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COND-01 | CONDITION_SLUGS (44 conditions), VALUED_CONDITIONS subset, CONDITION_GROUPS (detection/attitudes) | Foundry VTT PF2e values.ts confirms exact 44 slugs; AON confirms valued conditions and group membership |
| COND-02 | ConditionManager add/remove/has/get conditions with numeric value tracking | Map<ConditionSlug, number> pattern; existing Modifier/IWR class patterns provide implementation template |
| COND-03 | Dying removal auto-increments wounded; mutually exclusive group enforcement | AON dying/wounded rules confirmed verbatim; Foundry group config validates detection+attitude groups |
</phase_requirements>

---

## Summary

Phase 06 is a pure TypeScript module with no external dependencies and no UI layer. The primary deliverable is `src/lib/pf2e/conditions.ts` exporting three constants and one class. All data is sourced from the PF2e Remaster rules (AON), and the Foundry VTT PF2e system provides authoritative slug spellings. The module is fully standalone — it imports nothing from other pf2e modules.

The 44 conditions are exactly those from the Foundry VTT PF2e system's `values.ts` (verified 2026-03-25), using kebab-case slugs. Valued conditions are those with numeric severity (8 total). Condition groups are the detection and attitude groups only — these are the two groups where only one member may be active at a time. All PF2e rule interactions (dying/wounded, group exclusivity) are enforced inside the class on every mutation.

The implementation follows the same `as const` array + derived union type pattern already established in `damage.ts` and `iwr.ts`, and the class follows the Modifier/StatisticModifier pattern from `modifiers.ts`.

**Primary recommendation:** Implement `src/lib/pf2e/conditions.ts` as a single file with the three constants followed by the ConditionManager class, then barrel-export via `src/lib/pf2e/index.ts`, and test in `src/lib/pf2e/__tests__/conditions.test.ts`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.6.3 | All implementation code | Already in project, zero new deps needed |
| Vitest | ^2.1.8 | Unit test framework | Already configured, all previous phases use it |

**No new dependencies required.** This phase is pure TypeScript logic.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | No supporting libraries needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Map<ConditionSlug, number>` | Plain object | Map gives O(1) has/get/set/delete; Object requires `in` checks and has prototype concerns — Map is locked |
| Single array for all conditions | Separate VALUED_CONDITIONS subset | Separate subset enables fast `isValued()` check at O(1) without iterating full array — locked |

---

## Architecture Patterns

### Recommended Project Structure
```
src/lib/pf2e/
├── conditions.ts        # New file: CONDITION_SLUGS, VALUED_CONDITIONS, CONDITION_GROUPS, ConditionManager
└── index.ts             # Add conditions.ts barrel exports (CONDITION_SLUGS, VALUED_CONDITIONS, CONDITION_GROUPS, ConditionManager, ConditionSlug type)

src/lib/pf2e/__tests__/
└── conditions.test.ts   # New test file: COND-01, COND-02, COND-03 describe blocks
```

### Pattern 1: as const Array + Derived Union Type
**What:** Define a readonly string array with `as const`, then derive a union type from it using indexed access.
**When to use:** Whenever a closed set of string constants must be both iterable and type-safe.

```typescript
// Source: existing damage.ts and iwr.ts pattern
export const CONDITION_SLUGS = [
  'blinded', 'broken', 'clumsy', /* ... 44 total */
] as const
export type ConditionSlug = (typeof CONDITION_SLUGS)[number]
```

### Pattern 2: Subset Array
**What:** A second `as const` array that is a strict subset of CONDITION_SLUGS, used for feature-flag checks.
**When to use:** Any time you need to distinguish a subset of the main set at runtime.

```typescript
// Source: decisions locked in CONTEXT.md
export const VALUED_CONDITIONS = [
  'clumsy', 'doomed', 'drained', 'frightened',
  'sickened', 'slowed', 'stunned', 'stupefied',
] as const
export type ValuedCondition = (typeof VALUED_CONDITIONS)[number]
```

### Pattern 3: Record Group Map
**What:** A `Record<string, ConditionSlug[]>` that maps group names to their member slugs.
**When to use:** Group exclusivity enforcement — look up the group, clear its members.

```typescript
// Source: decisions locked in CONTEXT.md; group membership from AON/Foundry
export const CONDITION_GROUPS: Record<string, ConditionSlug[]> = {
  detection: ['observed', 'hidden', 'undetected', 'unnoticed'],
  attitudes:  ['hostile', 'unfriendly', 'indifferent', 'friendly', 'helpful'],
}
```

### Pattern 4: Stateful Map-Backed Class
**What:** Class wrapping `Map<ConditionSlug, number>` with domain-rule enforcement in every mutating method.
**When to use:** Any time state mutations must auto-enforce game rules.

```typescript
// Source: Modifier class pattern from modifiers.ts; Map usage for O(1) operations
export class ConditionManager {
  private readonly conditions = new Map<ConditionSlug, number>()

  add(slug: ConditionSlug, value = 1): void {
    // 1. Group exclusivity: remove other members of slug's group
    // 2. Set the slug (overwrite for valued, set 1 for boolean)
  }

  remove(slug: ConditionSlug): void {
    // 1. Delete from map
    // 2. Dying special rule: if slug === 'dying', increment wounded by 1
  }

  has(slug: ConditionSlug): boolean { return this.conditions.has(slug) }

  get(slug: ConditionSlug): number | undefined { return this.conditions.get(slug) }
}
```

### Anti-Patterns to Avoid
- **Searching CONDITION_GROUPS on every operation with a nested loop:** Cache the reverse lookup or accept linear scan of 2 small groups — total slug count per group is 4–5, so a simple `Object.entries()` scan is fine. Do not introduce a `Map<ConditionSlug, string>` reverse lookup unless benchmarking shows a need.
- **Checking valued status by re-scanning VALUED_CONDITIONS array in a hot loop:** Use `VALUED_CONDITIONS.includes(slug)` for clarity — array is 8 elements. `Set` is unnecessary at this scale.
- **Firing remove() for dying and not checking that dying was actually present:** Always check `this.conditions.has('dying')` before deciding to increment wounded — the rule only triggers on actual removal, not on remove() called for a condition not present.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type-safe condition slug | Manual string literals everywhere | `as const` + derived union type | TypeScript catches misspellings at compile time |
| Group membership check | Custom data structure | `CONDITION_GROUPS` Record + `Object.entries()` scan | Simple, readable, zero deps |
| Valued/boolean determination | instanceof / class hierarchy | `VALUED_CONDITIONS.includes(slug)` | Direct array membership check is sufficient |

**Key insight:** The conditions module is intentionally simple. The two "complex" rules (dying/wounded, group exclusivity) each require < 5 lines of code. There is nothing to reach for a library for.

---

## Common Pitfalls

### Pitfall 1: Dying Rule Triggers Only on Actual Removal
**What goes wrong:** Calling `remove('dying')` when dying is not currently active, then incrementing wounded anyway.
**Why it happens:** The rule "when you lose dying" means the condition must transition from active to absent. If it was never active, no transition occurs.
**How to avoid:** Gate the wounded increment: `if (this.conditions.has('dying')) { this.conditions.delete('dying'); this._incrementWounded() }`.
**Warning signs:** Tests that call `remove('dying')` on a fresh manager and check wounded stays at 0 would catch this.

### Pitfall 2: Group Exclusivity on Re-Add of Already-Present Member
**What goes wrong:** Adding `'friendly'` when `'friendly'` is already the active attitude — removing it then re-adding it is a no-op but may create an off-by-one in test expectations.
**Why it happens:** Naive implementation clears the group first, then sets the new value, which means the old value is deleted even if it's the same slug.
**How to avoid:** Clear group members excluding the new slug (or clear all, then set). Either approach is correct since the end state is identical. The locked decision states "adding an already-present condition is idempotent (no-op for boolean, update value for valued)" — group add is not a boolean condition re-add, so clearing-all-then-setting is correct.
**Warning signs:** Test: add `'friendly'`, add `'friendly'` again, assert only `'friendly'` present with value 1.

### Pitfall 3: Dying/Wounded Interaction Order in add()
**What goes wrong:** If `add('dying')` is implemented, there is a PF2e rule that "if you gain dying while wounded, increase dying value by your wounded value" (gaining dying is more severe when already wounded). This is a distinct rule from `remove('dying')` incrementing wounded.
**Why it happens:** The two rules run in opposite directions on two different methods.
**How to avoid:** The CONTEXT.md locks the remove side. The `add()` side (gain-dying-while-wounded) is not in COND-03 requirements. The planner should note this as out of scope for this phase but flag it as a future interaction point.
**Warning signs:** Tests only require remove() wounded increment — the add() side is not required by COND-03.

### Pitfall 4: Slug Count Drift
**What goes wrong:** Implementing 42 or 46 slugs instead of exactly 44.
**Why it happens:** AON Conditions.aspx page may list conditions from supplemental books or not all remaster conditions. The authoritative count for this module is 44, matching Foundry VTT PF2e's `CONDITION_SLUGS` array.
**How to avoid:** Use the verified list from Foundry VTT PF2e `values.ts` (fetched 2026-03-25). See Code Examples section for the complete list.
**Warning signs:** Test `CONDITION_SLUGS.length` equals exactly 44.

---

## Code Examples

Verified patterns from official sources:

### Complete CONDITION_SLUGS Array (44 slugs, verified from Foundry VTT PF2e values.ts)
```typescript
// Source: Foundry VTT PF2e src/module/item/condition/values.ts (verified 2026-03-25)
// Source: AON https://2e.aonprd.com/Conditions.aspx (authoritative rule text)
export const CONDITION_SLUGS = [
  'blinded',
  'broken',
  'clumsy',
  'concealed',
  'confused',
  'controlled',
  'cursebound',
  'dazzled',
  'deafened',
  'doomed',
  'drained',
  'dying',
  'encumbered',
  'enfeebled',
  'fascinated',
  'fatigued',
  'fleeing',
  'friendly',
  'frightened',
  'grabbed',
  'helpful',
  'hidden',
  'hostile',
  'immobilized',
  'indifferent',
  'invisible',
  'malevolence',
  'observed',
  'off-guard',
  'paralyzed',
  'persistent-damage',
  'petrified',
  'prone',
  'quickened',
  'restrained',
  'sickened',
  'slowed',
  'stunned',
  'stupefied',
  'unconscious',
  'undetected',
  'unfriendly',
  'unnoticed',
  'wounded',
] as const
export type ConditionSlug = (typeof CONDITION_SLUGS)[number]
```

**Notes on individual slugs:**
- `cursebound` — Oracle class condition (PF2e Remaster Player Core 2)
- `malevolence` — Animist class condition (PF2e Remaster Player Core 2)
- `off-guard` — replaces "flat-footed" in PF2e Remaster; use kebab-case slug
- `persistent-damage` — tracks ongoing damage condition; valued (uses damage amount as value)

### VALUED_CONDITIONS (8 conditions with numeric severity)
```typescript
// Source: AON Rules.aspx?ID=775 — Condition Values
// Source: AON individual condition pages confirming numeric modifiers
export const VALUED_CONDITIONS = [
  'clumsy',
  'doomed',
  'drained',
  'dying',
  'enfeebled',
  'frightened',
  'sickened',
  'slowed',
  'stunned',
  'stupefied',
  'wounded',
] as const
export type ValuedCondition = (typeof VALUED_CONDITIONS)[number]
```

**Note on valued conditions:** AON lists clumsy, doomed, drained, dying, enfeebled, frightened, sickened, slowed, stunned, stupefied, and wounded as valued. The CONTEXT.md mentions "clumsy, doomed, drained, etc." as a non-exhaustive example. The canonical list is all conditions that have a numeric value per AON. `persistent-damage` also carries a numeric value (damage per round) but is handled differently in Foundry — include it or not based on planner decision. The above list (11 items) represents the full set from AON with certainty. **Confidence: HIGH** for the 8 core ones (clumsy, doomed, drained, frightened, sickened, slowed, stunned, stupefied). **MEDIUM** for dying/wounded/enfeebled inclusion (they have values but are binary-ish in some contexts).

### CONDITION_GROUPS
```typescript
// Source: AON Conditions.aspx — Detection and Attitudes groupings
// Source: Foundry VTT PF2e DetectionConditionType type (observed, hidden, undetected, unnoticed)
export const CONDITION_GROUPS: Record<string, ConditionSlug[]> = {
  detection: ['observed', 'hidden', 'undetected', 'unnoticed'],
  attitudes:  ['hostile', 'unfriendly', 'indifferent', 'friendly', 'helpful'],
}
```

### ConditionManager — add with group exclusivity
```typescript
// Source: CONTEXT.md locked architecture + established Modifier class pattern
add(slug: ConditionSlug, value = 1): void {
  // Enforce group exclusivity: remove all other members in slug's group
  for (const [, members] of Object.entries(CONDITION_GROUPS)) {
    if (members.includes(slug)) {
      for (const member of members) {
        if (member !== slug) this.conditions.delete(member)
      }
      break
    }
  }
  // Set condition value (valued conditions use provided value; boolean use 1)
  this.conditions.set(slug, value)
}
```

### ConditionManager — remove with dying/wounded rule
```typescript
// Source: AON dying condition page — "Any time you lose the dying condition,
//         you gain wounded 1, or increase wounded by 1 if already present."
remove(slug: ConditionSlug): void {
  if (!this.conditions.has(slug)) return
  this.conditions.delete(slug)
  if (slug === 'dying') {
    const current = this.conditions.get('wounded') ?? 0
    this.conditions.set('wounded', current + 1)
  }
}
```

### Test file structure (matching project conventions)
```typescript
// Source: pattern from iwr.test.ts and modifiers.test.ts
import { describe, it, expect } from 'vitest'
import { CONDITION_SLUGS, VALUED_CONDITIONS, CONDITION_GROUPS, ConditionManager } from '@/lib/pf2e'

// ─── COND-01: Constants ───────────────────────────────────────────────────────
describe('COND-01: Constants', () => {
  it('CONDITION_SLUGS has exactly 44 conditions', () => { ... })
  it('VALUED_CONDITIONS is a subset of CONDITION_SLUGS', () => { ... })
  it('CONDITION_GROUPS detection has observed/hidden/undetected/unnoticed', () => { ... })
  it('CONDITION_GROUPS attitudes has hostile/unfriendly/indifferent/friendly/helpful', () => { ... })
})

// ─── COND-02: ConditionManager operations ────────────────────────────────────
describe('COND-02: ConditionManager add/remove/has/get', () => { ... })

// ─── COND-03: PF2e rule interactions ─────────────────────────────────────────
describe('COND-03: Rule interactions', () => {
  it('removing dying increments wounded from 0 to 1', () => { ... })
  it('removing dying increments existing wounded 2 to 3', () => { ... })
  it('adding attitude removes previous attitude from group', () => { ... })
  it('adding detection condition removes previous detection condition', () => { ... })
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| "flat-footed" slug | "off-guard" slug | PF2e Remaster 2023 | Use `off-guard` not `flat-footed` |
| positive/negative energy | vitality/void | PF2e Remaster 2023 | Already handled in damage.ts; no conditions impact |
| Cursebound did not exist | cursebound added | Player Core 2 2024 | Included in the 44-slug array |
| Malevolence did not exist | malevolence added | Player Core 2 2024 | Included in the 44-slug array |

**Deprecated/outdated:**
- `flat-footed`: replaced by `off-guard` in PF2e Remaster — do not include as a slug
- `positive`/`negative` energy damage: already correctly handled in damage.ts, no condition slugs affected

---

## Open Questions

1. **Is `persistent-damage` a valued condition?**
   - What we know: It carries a numeric value (damage per round), and is in Foundry's conditions list. It is listed as a condition with a value per AON.
   - What's unclear: The CONTEXT.md example for VALUED_CONDITIONS lists "clumsy, doomed, drained, etc." — `persistent-damage` is a borderline case (it tracks damage amount, not severity level).
   - Recommendation: Include `persistent-damage` in VALUED_CONDITIONS since the locked decision says "conditions that carry a numeric value." The value would represent the damage amount. If the planner disagrees, it defaults to value 1 (boolean storage).

2. **Are dying and wounded valued conditions?**
   - What we know: Both have numeric values per AON (dying 1-4, wounded 1+). Both appear in Foundry's condition handling as valued.
   - What's unclear: The CONTEXT.md example explicitly names "clumsy, doomed, drained" but omits dying/wounded in the example list.
   - Recommendation: Include dying and wounded in VALUED_CONDITIONS — the dying/wounded interaction test requires `get('wounded')` to return a number, which means wounded must be stored with a value (impossible if treated as boolean). **This is not optional.**

3. **Does add() also apply the gain-dying-while-wounded rule (dying value += wounded value)?**
   - What we know: COND-03 only specifies remove-dying increments wounded. The inverse (add-dying while wounded increases dying) is a real PF2e rule.
   - What's unclear: Whether it should be implemented given COND-03 scope.
   - Recommendation: Out of scope for COND-03. Planner should note this as a future enhancement point. Do not implement in this phase.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 |
| Config file | `vitest.config.ts` (root — uses `test.include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)']`) |
| Quick run command | `pnpm test --reporter=verbose -- src/lib/pf2e/__tests__/conditions.test.ts` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COND-01 | CONDITION_SLUGS has 44 slugs | unit | `pnpm test -- src/lib/pf2e/__tests__/conditions.test.ts` | Wave 0 |
| COND-01 | VALUED_CONDITIONS is subset of CONDITION_SLUGS | unit | `pnpm test -- src/lib/pf2e/__tests__/conditions.test.ts` | Wave 0 |
| COND-01 | CONDITION_GROUPS has detection and attitudes keys | unit | `pnpm test -- src/lib/pf2e/__tests__/conditions.test.ts` | Wave 0 |
| COND-02 | add/remove/has/get all work correctly | unit | `pnpm test -- src/lib/pf2e/__tests__/conditions.test.ts` | Wave 0 |
| COND-02 | Valued condition re-add overwrites value | unit | `pnpm test -- src/lib/pf2e/__tests__/conditions.test.ts` | Wave 0 |
| COND-02 | Boolean condition add is idempotent | unit | `pnpm test -- src/lib/pf2e/__tests__/conditions.test.ts` | Wave 0 |
| COND-03 | remove dying → wounded increments by 1 | unit | `pnpm test -- src/lib/pf2e/__tests__/conditions.test.ts` | Wave 0 |
| COND-03 | add attitude condition → removes old attitude | unit | `pnpm test -- src/lib/pf2e/__tests__/conditions.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test -- src/lib/pf2e/__tests__/conditions.test.ts`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/pf2e/__tests__/conditions.test.ts` — covers COND-01, COND-02, COND-03
- [ ] `src/lib/pf2e/conditions.ts` — the implementation file itself

*(No framework gaps — Vitest already configured and working for prior phases)*

---

## Sources

### Primary (HIGH confidence)
- Foundry VTT PF2e `src/module/item/condition/values.ts` (GitHub, fetched 2026-03-25) — 44 exact slug strings
- AON https://2e.aonprd.com/Conditions.aspx?ID=11 — dying condition rule text (verbatim)
- AON https://2e.aonprd.com/Conditions.aspx?ID=42 — wounded condition rule text (verbatim)
- Existing `src/lib/pf2e/damage.ts`, `iwr.ts`, `modifiers.ts` — established project patterns (read directly)
- `.planning/phases/06-conditions-module/06-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)
- AON https://2e.aonprd.com/Conditions.aspx — conditions list (fetched, HTML parse confirms groups)
- AON https://2e.aonprd.com/Rules.aspx?ID=2455 — Conditions Appendix (group classifications)
- Foundry VTT PF2e `src/module/item/condition/data.ts` — `group: string | null` field confirms group schema

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; pure TypeScript + existing Vitest
- Condition slugs (44): HIGH — verified from Foundry VTT PF2e values.ts directly
- Valued conditions list: MEDIUM — core 8 are certain; dying/wounded/enfeebled inclusion is HIGH based on how the tests require them to behave; persistent-damage is MEDIUM
- Architecture: HIGH — mirrors existing project patterns verbatim
- PF2e rules (dying/wounded): HIGH — verified verbatim from AON condition pages
- Group membership: HIGH — detection and attitudes groups verified from AON and Foundry type definitions
- Pitfalls: HIGH — derived from reading existing test patterns and PF2e rule edge cases

**Research date:** 2026-03-25
**Valid until:** 2026-06-25 (PF2e rules stable; Foundry slugs only change with major system updates)
