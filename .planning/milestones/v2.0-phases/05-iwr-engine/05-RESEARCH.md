# Phase 05: IWR Engine - Research

**Researched:** 2026-03-25
**Domain:** Pure TypeScript PF2e IWR (Immunity/Weakness/Resistance) rules engine
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Data Model Design**
- IWR data models as plain TypeScript interfaces with factory functions — consistent with Modifier class pattern from Phase 03
- DamageInstance interface: `{ type: DamageType, amount: number, category?: DamageCategory, critical?: boolean, precision?: boolean, materials?: MaterialEffect[] }`
- Exceptions typed as `DamageType[]` — narrowed from damage.ts types, not loose strings
- applyIWR returns detailed breakdown: `{ finalDamage: number, appliedImmunities: [], appliedWeaknesses: [], appliedResistances: [] }` for future UI display

**Algorithm Design**
- Process order: Immunities → Weaknesses → Resistances (official PF2e CRB order)
- applyIWR processes a single damage instance; caller handles multi-instance aggregation
- Precision immunity zeroes out only the precision-tagged portion of damage, not the full amount
- Critical-hit immunity halves the total (un-doubles) — reverts to non-crit damage amount

**Module Organization**
- Single file: `src/lib/pf2e/iwr.ts`
- Barrel export via `src/lib/pf2e/index.ts`
- Tests in `src/lib/pf2e/__tests__/iwr.test.ts`

### Claude's Discretion
- Internal helper function decomposition within iwr.ts
- Exact interface field names and type narrowing details
- Test organization and describe block structure

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| IWR-01 | IWR data models for Immunity, Weakness, Resistance with type, value, exceptions | Interface + factory function patterns from Phase 03 Modifier; exceptions typed as DamageType[] |
| IWR-02 | applyIWR applies immunities then weaknesses then resistances to damage instances | Official PF2e CRB order confirmed; highest-only rule for multiple weaknesses/resistances of same type |
| IWR-03 | Critical-hits immunity undoubles crit damage, precision immunity reduces precision component | Official rules text confirmed from Archives of Nethys; precision: false branch is straightforward |
| IWR-04 | Weakness doubleVs and applyOnce special cases handled correctly | Foundry VTT PF2e data model inspected; doubleVs doubles IWR value when conditions match; applyOnce prevents multi-firing |
</phase_requirements>

## Summary

Phase 05 implements a pure TypeScript IWR rules engine that applies a creature's immunities, weaknesses, and resistances to a single damage instance. The domain is well-understood: official PF2e rules are unambiguous about processing order (immunities first, weaknesses second, resistances third) and are available from Archives of Nethys at a HIGH confidence level. The data model closely mirrors the Foundry VTT PF2e system's own `iwr.ts` module, adapted to this project's conventions.

The two special-case IWR interactions (critical-hit immunity and precision immunity) are clearly defined by official rules. Critical-hit immunity halves the incoming `amount` when `critical: true` — it reverts to non-crit damage by dividing by 2. Precision immunity zeroes only the precision-tagged portion of the `amount`; because `applyIWR` processes a single damage instance, the precision amount must be tracked separately on the `DamageInstance` interface (`precision?: boolean` flags the entire instance as precision-typed, meaning the full `amount` is zeroed).

The `doubleVs` and `applyOnce` fields on the Weakness interface are inspired by the Foundry VTT PF2e Rule Element data model. `doubleVs` is an array of conditions — if the damage instance matches any condition in the array (e.g., `'critical'`), the weakness value is doubled before adding. `applyOnce` prevents a weakness from being counted more than once when a caller iterates over multiple damage instances in a single damage roll (enforcement responsibility sits with the caller per the locked design decision that applyIWR handles one instance at a time).

**Primary recommendation:** Implement a single `iwr.ts` file with interfaces, factory functions, and `applyIWR`. Follow the official PF2e order-of-operations exactly. Use `Math.max(0, ...)` for resistance capping. Apply highest-value-only rules for both weaknesses and resistances when multiple entries match.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript (built-in) | 5.6.3 | Interface definitions, type safety | Already project-standard; `as const` array + derived union pattern established in Phase 02 |
| Vitest | 2.1.8 | Unit tests | Already project-standard; all prior phase tests use it |

No additional dependencies are needed. This is a pure computation module with zero external dependencies.

**Installation:** No new packages required.

## Architecture Patterns

### Recommended File Structure
```
src/lib/pf2e/
├── iwr.ts              # New: IWR interfaces, factory functions, applyIWR
├── damage.ts           # Existing: DamageType, DamageCategory, MaterialEffect
├── damage-helpers.ts   # Existing: DamageCategorization.getCategory()
└── index.ts            # Existing: barrel — add iwr.ts exports
src/lib/pf2e/__tests__/
└── iwr.test.ts         # New: unit tests, one describe per requirement ID
```

### Pattern 1: Interface + Factory Function (established in Phase 03)
**What:** Export a readonly interface alongside a factory function that enforces defaults and validates inputs. No classes needed for plain data models.

**When to use:** For data models that are created once, passed around, and never mutated.

```typescript
// Source: established pattern from src/lib/pf2e/modifiers.ts Phase 03
export interface Immunity {
  readonly type: ImmunityType
  readonly exceptions: ImmunityType[]
}

export function createImmunity(type: ImmunityType, exceptions: ImmunityType[] = []): Immunity {
  return { type, exceptions }
}
```

### Pattern 2: as const Array + Derived Union Type (established in Phase 02)
**What:** Define valid type strings as a readonly const array, derive the union type from it.

**When to use:** Whenever a set of valid string values needs compile-time exhaustiveness checking.

```typescript
// Source: established pattern from src/lib/pf2e/damage.ts Phase 02
export const IMMUNITY_TYPES = [
  'fire', 'cold', /* ... */ 'critical-hits', 'precision',
] as const
export type ImmunityType = (typeof IMMUNITY_TYPES)[number]
```

### Pattern 3: applyIWR Return Value with Breakdown
**What:** Return both the final numeric result AND the list of applied entries for UI/diagnostic use.

**When to use:** Per locked decision — all four requirements depend on this shape.

```typescript
// Design intent from CONTEXT.md
export interface IWRApplicationResult {
  finalDamage: number
  appliedImmunities: Immunity[]
  appliedWeaknesses: Weakness[]
  appliedResistances: Resistance[]
}
```

### Pattern 4: Highest-Applicable-Value Selection
**What:** When multiple weaknesses or resistances of the same scope match a damage instance, PF2e rules require only the highest value to apply.

**When to use:** Both weakness and resistance processing loops.

```typescript
// Source: AON Rules ID 2317 (Weakness), 2318 (Resistance)
// "If more than one weakness/resistance would apply to the same instance of damage,
//  use only the highest applicable weakness/resistance value."
const applicableWeaknesses = weaknesses.filter(w => matchesInstance(w, instance))
const highest = applicableWeaknesses.reduce(
  (best, w) => w.value > best.value ? w : best,
  applicableWeaknesses[0]
)
```

### Pattern 5: Exception Checking
**What:** An IWR entry does NOT apply when the damage instance's type (or material) is listed in the entry's `exceptions` array.

**When to use:** Every immunity, weakness, and resistance check.

```typescript
function isExcepted(iwr: { exceptions: DamageType[] }, instance: DamageInstance): boolean {
  return iwr.exceptions.includes(instance.type)
}
```

### Anti-Patterns to Avoid
- **Applying multiple weaknesses separately when they all match:** The official rule says use only the highest value. Summing them is incorrect.
- **Applying resistance before weakness:** The PF2e order is immunities → weaknesses → resistances. Reversing this changes results.
- **Applying crit immunity as "immune to all effects":** It only halves damage; it does not prevent other critical success consequences.
- **Returning negative finalDamage:** Both resistance reduction and precision immunity must clamp to `Math.max(0, ...)`.
- **Precision immunity zeroing the whole instance:** Precision immunity only zeroes the precision-tagged portion. If `instance.precision === true`, the entire `amount` is precision, so zero it. But this is distinct from an immunity to the damage type itself.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Damage type category lookup | Custom map or switch | `DamageCategorization.getCategory()` from damage-helpers.ts | Already built in Phase 04; category-level IWR matching (e.g., "physical" resistance) uses this |
| DamageType validation | Custom string checks | TypeScript union types from `damage.ts` | Compile-time safety already established; no runtime validation needed |

**Key insight:** All type infrastructure was built in Phases 02 and 04. Phase 05 only needs to import and use it.

## Common Pitfalls

### Pitfall 1: Multiple Weaknesses/Resistances — Sum Instead of Highest
**What goes wrong:** Applying all matching weaknesses or resistances to the same damage instance, summing their values.
**Why it happens:** Intuitive but incorrect — you might think multiple resistances stack.
**How to avoid:** Filter all matching entries, take the single highest value. Per AON Rules 2317 and 2318: "use only the highest applicable weakness/resistance value."
**Warning signs:** A test with two fire weaknesses (5 and 10) returning 15 extra damage instead of 10.

### Pitfall 2: Precision Immunity — Zeroing Wrong Portion
**What goes wrong:** When a damage instance has `precision: true`, applying precision immunity zeroes the `amount` field correctly. But if the instance is ALSO a crit, the `amount` already includes the doubling. Precision immunity should zero the full (post-doubling) precision amount.
**Why it happens:** Foundry VTT itself had bug #19318 where only half of doubled precision damage was deducted.
**How to avoid:** Zero the full `amount` when the instance is flagged `precision: true`, regardless of whether it's critical. The doubling happened upstream before applyIWR is called.
**Warning signs:** A crit with precision damage leaving 50% of the precision component after precision immunity is applied.

### Pitfall 3: Critical-Hit Immunity — Halving Precision Versus Base
**What goes wrong:** When applying critical-hit immunity, the halving should reduce the total `amount` to what it would have been without the crit (i.e., `Math.floor(amount / 2)`). Applying precision immunity and critical-hit immunity to the same instance requires correct ordering: immunities are all processed in the same pass, not sequentially across passes.
**Why it happens:** Special immunities may feel like they should be applied in sub-passes.
**How to avoid:** Apply both crit immunity and precision immunity during the single immunities pass. Resolve both adjustments, then continue to weakness/resistance.
**Warning signs:** Combined precision + crit instance producing unexpected amounts.

### Pitfall 4: exceptions Array Type Mismatch
**What goes wrong:** Storing exceptions as loose strings instead of typed `DamageType[]`, causing matching against `instance.type` to fail silently.
**Why it happens:** Easy to type `exceptions: string[]` during initial scaffolding.
**How to avoid:** Per locked decision — exceptions are `DamageType[]`, narrowed from damage.ts types. TypeScript will enforce this at the call site.
**Warning signs:** A silver-damage attack that should bypass physical resistance still being reduced.

### Pitfall 5: doubleVs Condition Matching — Vague Predicate
**What goes wrong:** The `doubleVs` array contains condition strings (e.g., `'critical'`). If condition matching is not clearly defined, partial string matches or type mismatches can cause incorrect doubling.
**Why it happens:** `doubleVs` is a project-specific design (inspired by Foundry VTT Rule Elements) without an external spec for this standalone engine.
**How to avoid:** Define `doubleVs` conditions as a closed set using an `as const` array + derived union type. The only initially supported condition should be `'critical'`. Check `instance.critical === true` when `'critical'` is in `doubleVs`.
**Warning signs:** Weakness not doubling on crits, or doubling when `critical: false`.

## Code Examples

Verified patterns from official sources and established project conventions:

### applyIWR Signature
```typescript
// Design intent from CONTEXT.md locked decisions
export function applyIWR(
  instance: DamageInstance,
  immunities: Immunity[],
  weaknesses: Weakness[],
  resistances: Resistance[],
): IWRApplicationResult
```

### Immunity Check (with exception)
```typescript
// Source: AON Rules.aspx?ID=2312 — "you ignore all damage of that type"
// Exception: does not apply if damage type is in the exceptions list
function matchesImmunity(immunity: Immunity, instance: DamageInstance): boolean {
  if (immunity.exceptions.includes(instance.type)) return false
  return immunity.type === instance.type
    || immunity.type === DamageCategorization.getCategory(instance.type)
}
```

### Critical-Hit Immunity Application
```typescript
// Source: AON Rules.aspx?ID=2314
// "takes normal damage instead of double damage" — revert crit doubling via Math.floor(amount/2)
if (instance.critical && hasCritImmunity) {
  adjustedAmount = Math.floor(adjustedAmount / 2)
}
```

### Resistance Capping at Zero
```typescript
// Source: AON Rules.aspx?ID=2318
// "reduce the amount of damage you take by the listed number (to a minimum of 0 damage)"
const remainingAfterResistance = Math.max(0, adjustedAmount - highestResistanceValue)
```

### doubleVs on Weakness
```typescript
// Inspired by Foundry VTT PF2e IWR data model
// doubleVs: array of conditions — if instance matches, double the weakness value
function effectiveWeaknessValue(weakness: Weakness, instance: DamageInstance): number {
  const shouldDouble = weakness.doubleVs?.some(condition =>
    condition === 'critical' && instance.critical === true
  ) ?? false
  return shouldDouble ? weakness.value * 2 : weakness.value
}
```

### Test Pattern (matching project conventions)
```typescript
// Source: established test style from src/lib/pf2e/__tests__/modifiers.test.ts
import { describe, it, expect } from 'vitest'
import { applyIWR, createImmunity, createWeakness, createResistance } from '@/lib/pf2e'

describe('IWR-02: applyIWR — process order', () => {
  it('creature with fire immunity takes 0 fire damage', () => {
    const result = applyIWR(
      { type: 'fire', amount: 20 },
      [createImmunity('fire')],
      [],
      [],
    )
    expect(result.finalDamage).toBe(0)
    expect(result.appliedImmunities).toHaveLength(1)
  })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| positive/negative energy damage types | vitality/void (Remaster) | 2023 PF2e Remaster | Already handled in Phase 02 damage.ts; no new work needed |
| Alignment-based weaknesses (good/evil/lawful/chaotic) | holy/unholy (Remaster) | 2023 PF2e Remaster | Not applicable to this phase (no holy/unholy damage types in current damage.ts) |

**Deprecated/outdated:**
- Using `positive` or `negative` as damage types: Phase 02 already uses `vitality`/`void` per the Remaster. Any external example code using these old types should be adapted.

## Open Questions

1. **Category-level IWR matching scope**
   - What we know: `DamageCategorization.getCategory()` exists; resistances to "physical" should reduce bludgeoning/piercing/slashing
   - What's unclear: Should `applyIWR` support category-level immunity/weakness/resistance types (e.g., `type: 'physical'`) or only specific damage types?
   - Recommendation: Support category-level entries in ImmunityType/WeaknessType/ResistanceType. This is a standard PF2e pattern (e.g., "resistance 5 to physical"). Matching should check both `instance.type === iwr.type` AND `DamageCategorization.getCategory(instance.type) === iwr.type`.

2. **MaterialEffect matching in exceptions**
   - What we know: `IWRBypass` in Phase 02 uses `DamageType | MaterialEffect`. The CONTEXT.md defines exceptions as `DamageType[]`.
   - What's unclear: Should exceptions also support `MaterialEffect` values (e.g., "resistance to physical except silver")?
   - Recommendation: Keep exceptions as `DamageType[]` per locked decision. Material-effect bypass is an upstream concern in how `DamageInstance.materials` is used; a creature with resistance except silver is modeled as the exception checking `instance.materials?.includes('silver')`. This is a planner discretion area.

3. **applyOnce enforcement location**
   - What we know: `applyOnce` on Weakness means it fires only once regardless of damage instances.
   - What's unclear: Since `applyIWR` processes one instance at a time, enforcing `applyOnce` requires the caller to track which weaknesses have fired. This is a caller-side concern.
   - Recommendation: The `applyOnce` flag should be documented as caller-enforced. Include it in the `Weakness` interface for completeness but note in JSDoc that the IWR engine itself does not enforce it — callers iterating multiple instances must skip already-applied `applyOnce` weaknesses.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IWR-01 | Immunity/Weakness/Resistance interfaces have type, value (where applicable), exceptions | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |
| IWR-01 | Factory functions createImmunity / createWeakness / createResistance produce correct shapes | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |
| IWR-02 | Immunity applied first — fire immune creature takes 0 fire | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |
| IWR-02 | Weakness applied second — fire weak creature takes extra fire damage | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |
| IWR-02 | Resistance applied third — physical resistant creature reduces physical | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |
| IWR-02 | Multiple weaknesses: only highest applies | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |
| IWR-02 | Multiple resistances: only highest applies | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |
| IWR-02 | Exception prevents IWR entry from applying | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |
| IWR-02 | Resistance clamps to 0 minimum | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |
| IWR-03 | Critical-hit immunity: crit damage halved (un-doubled) | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |
| IWR-03 | Precision immunity: precision-tagged instance → 0 damage | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |
| IWR-04 | doubleVs: weakness value doubles when critical=true matches 'critical' condition | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |
| IWR-04 | applyOnce flag present on Weakness interface (caller-enforced) | unit | `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/pf2e/__tests__/iwr.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/pf2e/__tests__/iwr.test.ts` — covers IWR-01 through IWR-04 (entire file is new)
- [ ] `src/lib/pf2e/iwr.ts` — implementation file (entire file is new)

*(No framework or config gaps — existing Vitest infrastructure covers all needs)*

## Sources

### Primary (HIGH confidence)
- Archives of Nethys Rules.aspx?ID=2309 — Step 3: Apply Immunities, Weaknesses, and Resistances (order of operations)
- Archives of Nethys Rules.aspx?ID=2312 — Immunity, Weakness, and Resistance (overview + highest-only rule)
- Archives of Nethys Rules.aspx?ID=2314 — Immunity to Critical Hits (official rule text)
- Archives of Nethys Rules.aspx?ID=2317 — Weakness (flat value, highest-only for multiples)
- Archives of Nethys Rules.aspx?ID=2318 — Resistance (minimum 0, highest-only, exceptions)
- `src/lib/pf2e/damage.ts` — DamageType, DamageCategory, MaterialEffect types (read directly)
- `src/lib/pf2e/damage-helpers.ts` — DamageCategorization.getCategory() (read directly)
- `src/lib/pf2e/modifiers.ts` — Interface + factory function pattern reference (read directly)

### Secondary (MEDIUM confidence)
- GitHub github.com/foundryvtt/pf2e `src/module/actor/data/iwr.ts` — Foundry PF2e IWR TypeScript data model structure (inspected via WebFetch); confirms `doubleVs` exists on Resistance; confirms base class structure
- GitHub foundryvtt/pf2e Issue #19318 — Precision immunity + critical damage bug; confirms precision immunity zeroes full (post-doubling) amount
- GitHub foundryvtt/pf2e Issue #18133 — Multiple weaknesses should use highest-only rule

### Tertiary (LOW confidence)
- WebSearch community discussion on Paizo forums re: weakness doubling on crits — no official Paizo developer ruling found; the engine will implement `doubleVs` as a data model field (Foundry-inspired) rather than a CRB rule

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing Vitest + TypeScript
- Architecture: HIGH — locked decisions from CONTEXT.md are unambiguous; patterns directly follow Phase 02/03/04 conventions
- Pitfalls: HIGH for processing order and precision immunity (verified against official rules + Foundry bug tracker); MEDIUM for `doubleVs` behavior (Foundry-inspired, not a core CRB rule)

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable PF2e rules; Remaster changes do not affect IWR core mechanics)
