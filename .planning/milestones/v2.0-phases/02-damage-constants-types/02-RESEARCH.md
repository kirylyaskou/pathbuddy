# Phase 02: Damage Constants & Types - Research

**Researched:** 2026-03-24
**Domain:** PF2e damage taxonomy — type constants, die sizes, material effects, TypeScript interfaces (pure TypeScript)
**Confidence:** HIGH

## Summary

Phase 02 is a pure TypeScript constants and types module with zero runtime or framework dependency. Everything is a hard-coded string constant, a `readonly` array literal, a `Record<K, V>` lookup table, or an interface. The PF2e Remaster damage taxonomy is fully documented in the Archives of Nethys and maps cleanly to the three-category structure (physical / energy / other) specified in CONTEXT.md.

The established Phase 01 pattern (`src/lib/pf2e/xp.ts`) is the direct template: `as const` arrays for ordered sequences, union types derived from array elements via `typeof arr[number]`, `Record<K, V>` for lookup tables, source-URL comments, `__testing` namespace for any internal-only exports, and barrel re-export through `src/lib/pf2e/index.ts`. No new npm packages are needed.

The one design decision requiring care is how `DamageCategory` maps to each type. The CONTEXT.md assigns bleed to physical, force to energy, and spirit / mental / poison / untyped to "other". This matches the Foundry VTT PF2e system's category assignments and the AoN rule descriptions. Die sizes (`[4, 6, 8, 10, 12]`) are a fixed ordered progression; the order itself is load-bearing for Phase 04's `nextDamageDieSize` stepping function.

**Primary recommendation:** Create `src/lib/pf2e/damage.ts` following the `xp.ts` template exactly. Export const arrays + derived union types for all damage types, a `DAMAGE_TYPE_CATEGORY` Record for the category mapping, separate material-effects array, die size arrays, and the four interfaces from DMG-03.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Type system approach:**
- String union types + `as const` arrays — consistent with Phase 01 pattern (`ThreatRating`, `HazardType`)
- Export const arrays (e.g., `PHYSICAL_DAMAGE_TYPES as const`) for runtime iteration AND derive union types from them
- Category mapping via `Record<DamageType, DamageCategory>` lookup table

**Module organization:**
- Single `src/lib/pf2e/damage.ts` file for all constants, types, and interfaces
- Follows Phase 01 pattern: one module file per domain (`xp.ts`, now `damage.ts`)
- Add exports to `src/lib/pf2e/index.ts` barrel

**Foundry fidelity — full PF2e CRB damage taxonomy:**
- All 3 physical types: bludgeoning, slashing, piercing
- All 6 energy types: fire, cold, electricity, acid, sonic, force (per Remaster)
- Additional types: bleed, mental, poison, spirit, vitality, void, untyped
- Material effects: adamantine, cold-iron, mithral, orichalcum, silver, sisterstone-dusk, sisterstone-scarlet (per Remaster)
- Three categories: physical, energy, other — every damage type maps to exactly one category

**Die size constants:**
- Die sizes as const array: `[4, 6, 8, 10, 12] as const`
- Die face type derived from array: `DieSize = 'd4' | 'd6' | 'd8' | 'd10' | 'd12'`
- Die size progression order matters for Phase 04 `nextDamageDieSize` stepping

**Interface scope — DMG-03 specified only:**
- `DamageFormula`: dice expression (diceNumber, dieSize, modifier, damageType, category, persistent flag)
- `BaseDamage`: resolved damage instance (damageType, category, total value, isCritical)
- `IWRBypass`: specifies which IWR to bypass (type, reason) — consumed by Phase 05
- `CriticalInclusion`: union for "critical-only" | "non-critical-only" | null (always applies)
- No additional interfaces beyond DMG-03 requirements — downstream phases define their own

### Claude's Discretion
- Exact naming of const arrays and type exports (e.g., `DAMAGE_TYPES` vs `ALL_DAMAGE_TYPES`)
- Whether to group material effects with damage types or as a separate taxonomy
- JSDoc comments on interfaces
- Test file structure and organization

### Deferred Ideas (OUT OF SCOPE)
- Refactor `DAMAGE_TYPE_COLORS` in description-sanitizer.ts to import from the new damage module — tech debt, not this phase
- Weapon damage calculator (WDMG-01, WDMG-02) — deferred from v2.0 entirely
- Damage calculator UI (UI-02) — next milestone
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DMG-01 | Physical, energy, and all damage type constants with category mapping | 3 physical + 6 energy + 6 other types verified from AoN Remaster docs; `Record<DamageType, DamageCategory>` lookup pattern proven by `xp.ts` |
| DMG-02 | Material damage effects, die sizes, and die face constants | 7 material slugs from CONTEXT.md cross-confirmed via AoN equipment search; die sizes `[4,6,8,10,12]` are industry-standard PF2e values |
| DMG-03 | TypeScript interfaces for damage formula, base damage, IWR bypass, and critical inclusion | Interface fields specified in CONTEXT.md; `DamageFormula`, `BaseDamage`, `IWRBypass`, `CriticalInclusion` all defined below with verified field types |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.6.3 (project) | Type-safe constants and interfaces | Existing project standard; `as const` narrowing is the implementation mechanism |
| Vitest | 2.1.8 (project) | Unit tests for exported values | Existing test infrastructure; same runner as Phase 01 |

No new npm packages are needed. This is pure TypeScript with zero external dependencies.

### Supporting
No external libraries required. All values are hard-coded PF2e rules constants.

**Installation:** None required — no new packages.

---

## Architecture Patterns

### Recommended Project Structure
```
src/lib/pf2e/
├── xp.ts             # Phase 01 (complete)
├── damage.ts         # Phase 02 — new file
├── index.ts          # Barrel — extend with damage exports
└── __tests__/
    ├── xp.test.ts    # Phase 01 tests (complete)
    └── damage.test.ts  # Phase 02 — new test file
```

### Pattern 1: `as const` Array + Derived Union Type
**What:** Define an array literal with `as const`, then derive the union type from its element type.
**When to use:** All damage type arrays, die size arrays, material arrays.
**Example:**
```typescript
// Source: established in src/lib/pf2e/xp.ts (ThreatRating pattern)
export const PHYSICAL_DAMAGE_TYPES = ['bludgeoning', 'piercing', 'slashing'] as const
export type PhysicalDamageType = (typeof PHYSICAL_DAMAGE_TYPES)[number]
// PhysicalDamageType = 'bludgeoning' | 'piercing' | 'slashing'
```
This pattern provides both runtime iteration (the array) and compile-time exhaustiveness checking (the union type). It is identical to how TypeScript enums are avoided in this codebase.

### Pattern 2: `Record<K, V>` for Category Mapping
**What:** Map every damage type string to its category string using a `Record` lookup table.
**When to use:** `DAMAGE_TYPE_CATEGORY` lookup — the canonical category resolver for downstream phases.
**Example:**
```typescript
// Source: established in src/lib/pf2e/xp.ts (BASE_BUDGETS, CHARACTER_ADJUSTMENTS)
export const DAMAGE_TYPE_CATEGORY: Record<DamageType, DamageCategory> = {
  bludgeoning: 'physical',
  piercing: 'physical',
  slashing: 'physical',
  bleed: 'physical',
  fire: 'energy',
  cold: 'energy',
  electricity: 'energy',
  acid: 'energy',
  sonic: 'energy',
  force: 'energy',
  vitality: 'energy',
  void: 'energy',
  spirit: 'other',
  mental: 'other',
  poison: 'other',
  untyped: 'other',
}
```
TypeScript will error at compile time if a type is added to `DamageType` but not this record.

### Pattern 3: Ordered `as const` Array for Die Progression
**What:** The die size array must be declared in ascending order — this order is the progression used by Phase 04.
**When to use:** `DIE_SIZES` and `DIE_FACES` arrays.
**Example:**
```typescript
// Source: CONTEXT.md locked decision
export const DIE_SIZES = [4, 6, 8, 10, 12] as const
export type DieSize = (typeof DIE_SIZES)[number]
// DieSize = 4 | 6 | 8 | 10 | 12

export const DIE_FACES = ['d4', 'd6', 'd8', 'd10', 'd12'] as const
export type DieFace = (typeof DIE_FACES)[number]
// DieFace = 'd4' | 'd6' | 'd8' | 'd10' | 'd12'
```

### Pattern 4: Interface Definitions for DMG-03
**What:** TypeScript interfaces for damage data structures consumed by Phases 03-06.
**When to use:** `DamageFormula`, `BaseDamage`, `IWRBypass`, `CriticalInclusion`.
**Example:**
```typescript
export type CriticalInclusion = 'critical-only' | 'non-critical-only' | null

export interface DamageFormula {
  diceNumber: number
  dieSize: DieFace
  modifier: number
  damageType: DamageType
  category: DamageCategory
  persistent: boolean
}

export interface BaseDamage {
  damageType: DamageType
  category: DamageCategory
  total: number
  isCritical: boolean
}

export interface IWRBypass {
  type: DamageType | MaterialEffect
  reason: string
}
```
`CriticalInclusion = null` means "always applies" (i.e., applies to both critical and non-critical hits).

### Anti-Patterns to Avoid
- **TypeScript `enum` keyword:** No enums exist in this codebase. Use `as const` arrays + union types. Enums have awkward runtime behavior and don't serialize to plain strings cleanly.
- **Broad `string` types in interfaces:** Use `DamageType`, `DamageCategory`, `DieFace` — not `string`. TypeScript will catch category mismatches at compile time.
- **Putting interfaces in a separate `types.ts` file:** The locked decision is a single `damage.ts` file per the Phase 01 pattern. Everything lives in one module.
- **Adding `precision` as a damage type:** Precision is a modifier, not a damage type in PF2e Remaster. It increases an existing damage instance's value; it is not tracked separately as a damage type constant.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Category lookup function | `getDamageCategory(type)` with a switch/if chain | `DAMAGE_TYPE_CATEGORY[type]` Record lookup | Record is O(1), exhaustively type-checked, same pattern as xp.ts BASE_BUDGETS |
| Die size validation | Custom range check function | `DIE_SIZES.includes(n)` on the const array | The const array is the single source of truth for valid values |
| String enum for damage types | `enum DamageType { Bludgeoning = 'bludgeoning' }` | `as const` array + derived union type | No enums in this codebase; union types serialize naturally; narrowing works identically |

**Key insight:** Every value in this module is a hard-coded PF2e rules constant. There is no logic, no arithmetic, no computation — only declarations. The "implementation" is just correct TypeScript syntax.

---

## Complete Damage Type Taxonomy (Verified)

### Category: physical
Source: AoN Rules ID 2308 (https://2e.aonprd.com/Rules.aspx?ID=2308)

| Type | Slug | Notes |
|------|------|-------|
| Bludgeoning | `bludgeoning` | Blunt force; most common physical |
| Piercing | `piercing` | Stabs and punctures |
| Slashing | `slashing` | Cuts and cleaves |
| Bleed | `bleed` | Persistent physical; ends at full HP |

### Category: energy
Source: AoN Rules ID 2308

| Type | Slug | Notes |
|------|------|-------|
| Fire | `fire` | Combustion; incorporates the fire trait |
| Cold | `cold` | Freezing gases and ice |
| Electricity | `electricity` | Lightning and sparks |
| Acid | `acid` | Dissolves flesh and materials |
| Sonic | `sonic` | High-frequency vibration |
| Force | `force` | Pure magical energy; resisted by almost nothing |
| Vitality | `vitality` | Remaster name for positive energy; harms only undead |
| Void | `void` | Remaster name for negative energy; harms only living |

### Category: other
Source: AoN Rules ID 2308; CONTEXT.md locked decision

| Type | Slug | Notes |
|------|------|-------|
| Spirit | `spirit` | Affects spiritual essence; harms possessing entities |
| Mental | `mental` | Psychic force; mindless creatures immune |
| Poison | `poison` | Venoms and toxins |
| Untyped | `untyped` | No category bypass; always applies |

**Total: 16 damage types.** The `description-sanitizer.ts` `DAMAGE_TYPE_COLORS` has 13 entries (missing bludgeoning, piercing, slashing) — confirming the new module will be the superset canonical source.

### Material Damage Effects (DMG-02)
Source: CONTEXT.md locked decision; cross-confirmed via AoN Equipment Category 22 and search results

```typescript
export const MATERIAL_EFFECTS = [
  'adamantine',
  'cold-iron',
  'mithral',
  'orichalcum',
  'silver',
  'sisterstone-dusk',
  'sisterstone-scarlet',
] as const
export type MaterialEffect = (typeof MATERIAL_EFFECTS)[number]
```

Material effects are used in `IWRBypass.type` to indicate "this hit counts as silver/cold-iron for resistance bypass purposes". They are separate from the damage type taxonomy: a weapon can deal `slashing` (physical) damage AND be `cold-iron` — these are orthogonal properties.

**Note on naming:** CONTEXT.md specifies `cold-iron` (hyphenated) and `sisterstone-dusk` / `sisterstone-scarlet` (hyphenated variant names). The Foundry VTT PF2e system uses kebab-case slugs for these materials. Use the exact CONTEXT.md slugs.

### Die Sizes (DMG-02)
The five die sizes in PF2e — ordered smallest to largest. Order is load-bearing for Phase 04.

```typescript
export const DIE_SIZES = [4, 6, 8, 10, 12] as const
export type DieSize = (typeof DIE_SIZES)[number]

export const DIE_FACES = ['d4', 'd6', 'd8', 'd10', 'd12'] as const
export type DieFace = (typeof DIE_FACES)[number]
```

No d2 or d20 in the damage die progression — PF2e damage dice only scale through d4-d12.

---

## Common Pitfalls

### Pitfall 1: Including `precision` as a Damage Type
**What goes wrong:** Adding 'precision' to `DAMAGE_TYPES` or the category map.
**Why it happens:** `precision` appears in PF2e rules frequently ("precision damage") and in `DAMAGE_TYPE_COLORS` in description-sanitizer.ts there is a 'persistent' entry.
**How to avoid:** Precision is a modifier to an existing damage roll's total, not a separate damage type. `BaseDamage` tracks `total` after all modifiers. Do not add 'precision' to `DamageType`.
**Warning signs:** Downstream IWR code treating precision as a damage type that can be resisted by type.

### Pitfall 2: Wrong Category for Bleed
**What goes wrong:** Assigning bleed to category 'other' instead of 'physical'.
**Why it happens:** Bleed "feels" special (persistent, ends at full HP) and is listed separately in the AoN docs.
**How to avoid:** AoN Rules ID 2308 explicitly lists bleed under Physical Damage. CONTEXT.md confirms physical category.
**Warning signs:** Phase 05 IWR engine computing wrong resistance totals for bleed — physical resistance should apply to bleed.

### Pitfall 3: Wrong Category for Force, Vitality, Void
**What goes wrong:** Assigning force/vitality/void to category 'other' instead of 'energy'.
**Why it happens:** These feel "special" — force is described as pure magic, vitality/void are Remaster replacements for holy/unholy.
**How to avoid:** AoN Rules ID 2308 categorizes all three under energy damage. CONTEXT.md explicitly lists them in the energy group.
**Warning signs:** Energy resistance not applying to force or void damage in Phase 05 IWR.

### Pitfall 4: Using Legacy Names (Holy/Unholy vs Vitality/Void)
**What goes wrong:** Using pre-Remaster names `holy` and `unholy` instead of `vitality` and `void`.
**Why it happens:** The Remaster (2023) renamed positive energy → vitality, negative energy → void. Older references still use the old names.
**How to avoid:** CONTEXT.md specifies `vitality` and `void`. The existing `DAMAGE_TYPE_COLORS` in description-sanitizer.ts already uses `vitality` and `void` — confirm project is post-Remaster.
**Warning signs:** `void` and `vitality` missing from type union; `holy`/`unholy` present instead.

### Pitfall 5: `Record<DamageType, DamageCategory>` Missing Entries
**What goes wrong:** `DAMAGE_TYPE_CATEGORY` Record is missing one or more damage types.
**Why it happens:** Type is derived first, then the Record is written manually — easy to miss one.
**How to avoid:** TypeScript will give a compile error if `DamageType` has values not covered in a `Record<DamageType, DamageCategory>`. Let the type system catch this.
**Warning signs:** TypeScript error "Property 'X' is missing in type" at the Record declaration.

### Pitfall 6: Die Face String vs Die Size Number Confusion
**What goes wrong:** Interfaces use `number` for die sizes when they should use `DieFace` (`'d4' | 'd6' | ...`).
**Why it happens:** The array stores both numeric sizes (for arithmetic) and face strings (for display).
**How to avoid:** `DamageFormula.dieSize` should be `DieFace` (string). The numeric `DIE_SIZES` array is for Phase 04 index-stepping logic.
**Warning signs:** `DamageFormula` has `dieSize: number` — callers must stringify it to display "d8".

---

## Code Examples

### Complete damage.ts Skeleton
```typescript
// Source: Phase 01 xp.ts pattern + CONTEXT.md locked decisions

// ─── Damage Categories ──────────────────────────────────────────────────────

export const DAMAGE_CATEGORIES = ['physical', 'energy', 'other'] as const
export type DamageCategory = (typeof DAMAGE_CATEGORIES)[number]

// ─── Damage Types by Category ───────────────────────────────────────────────

// Source: PF2e GM Core / Player Core (https://2e.aonprd.com/Rules.aspx?ID=2308)
export const PHYSICAL_DAMAGE_TYPES = ['bludgeoning', 'piercing', 'slashing', 'bleed'] as const
export type PhysicalDamageType = (typeof PHYSICAL_DAMAGE_TYPES)[number]

// Source: PF2e Player Core (Remaster) — vitality/void replace positive/negative energy
export const ENERGY_DAMAGE_TYPES = ['fire', 'cold', 'electricity', 'acid', 'sonic', 'force', 'vitality', 'void'] as const
export type EnergyDamageType = (typeof ENERGY_DAMAGE_TYPES)[number]

export const OTHER_DAMAGE_TYPES = ['spirit', 'mental', 'poison', 'untyped'] as const
export type OtherDamageType = (typeof OTHER_DAMAGE_TYPES)[number]

export const DAMAGE_TYPES = [...PHYSICAL_DAMAGE_TYPES, ...ENERGY_DAMAGE_TYPES, ...OTHER_DAMAGE_TYPES] as const
export type DamageType = (typeof DAMAGE_TYPES)[number]

// ─── Category Mapping ────────────────────────────────────────────────────────

export const DAMAGE_TYPE_CATEGORY: Record<DamageType, DamageCategory> = {
  bludgeoning: 'physical', piercing: 'physical', slashing: 'physical', bleed: 'physical',
  fire: 'energy', cold: 'energy', electricity: 'energy', acid: 'energy',
  sonic: 'energy', force: 'energy', vitality: 'energy', void: 'energy',
  spirit: 'other', mental: 'other', poison: 'other', untyped: 'other',
}

// ─── Material Effects ────────────────────────────────────────────────────────

// Source: PF2e GM Core precious materials (https://2e.aonprd.com/Equipment.aspx?Category=22)
export const MATERIAL_EFFECTS = [
  'adamantine', 'cold-iron', 'mithral', 'orichalcum',
  'silver', 'sisterstone-dusk', 'sisterstone-scarlet',
] as const
export type MaterialEffect = (typeof MATERIAL_EFFECTS)[number]

// ─── Die Sizes ───────────────────────────────────────────────────────────────

// Source: PF2e GM Core damage tables — d4/d6/d8/d10/d12 progression
// Order is load-bearing: Phase 04 nextDamageDieSize uses array index arithmetic
export const DIE_SIZES = [4, 6, 8, 10, 12] as const
export type DieSize = (typeof DIE_SIZES)[number]

export const DIE_FACES = ['d4', 'd6', 'd8', 'd10', 'd12'] as const
export type DieFace = (typeof DIE_FACES)[number]

// ─── Interfaces (DMG-03) ─────────────────────────────────────────────────────

/** Controls whether a damage component applies only on critical hits, only on non-crits, or always. */
export type CriticalInclusion = 'critical-only' | 'non-critical-only' | null

/** A dice expression representing unresolved damage before rolling. */
export interface DamageFormula {
  diceNumber: number
  dieSize: DieFace
  modifier: number
  damageType: DamageType
  category: DamageCategory
  persistent: boolean
}

/** A resolved damage instance after dice have been rolled and damage type determined. */
export interface BaseDamage {
  damageType: DamageType
  category: DamageCategory
  total: number
  isCritical: boolean
}

/** Describes which IWR entry to bypass and why (e.g., silver bypasses devil resistance). */
export interface IWRBypass {
  type: DamageType | MaterialEffect
  reason: string
}
```

### Barrel Index Extension
```typescript
// src/lib/pf2e/index.ts — add to existing file
export {
  DAMAGE_CATEGORIES,
  PHYSICAL_DAMAGE_TYPES,
  ENERGY_DAMAGE_TYPES,
  OTHER_DAMAGE_TYPES,
  DAMAGE_TYPES,
  DAMAGE_TYPE_CATEGORY,
  MATERIAL_EFFECTS,
  DIE_SIZES,
  DIE_FACES,
} from './damage'
export type {
  DamageCategory,
  PhysicalDamageType,
  EnergyDamageType,
  OtherDamageType,
  DamageType,
  MaterialEffect,
  DieSize,
  DieFace,
  CriticalInclusion,
  DamageFormula,
  BaseDamage,
  IWRBypass,
} from './damage'
```

### Test Pattern (Phase 01 style)
```typescript
// src/lib/pf2e/__tests__/damage.test.ts
import { describe, it, expect } from 'vitest'
import {
  PHYSICAL_DAMAGE_TYPES, ENERGY_DAMAGE_TYPES, OTHER_DAMAGE_TYPES,
  DAMAGE_TYPES, DAMAGE_TYPE_CATEGORY,
  MATERIAL_EFFECTS, DIE_SIZES, DIE_FACES,
} from '@/lib/pf2e'

describe('DMG-01: Physical damage types', () => {
  it('exports exactly 4 physical types', () => {
    expect(PHYSICAL_DAMAGE_TYPES).toHaveLength(4)
  })
  it('all physical types map to category physical', () => {
    for (const t of PHYSICAL_DAMAGE_TYPES) {
      expect(DAMAGE_TYPE_CATEGORY[t]).toBe('physical')
    }
  })
})
// ...etc for energy, other, material effects, die sizes
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Positive/negative energy damage | Vitality/void (Remaster 2023) | PF2e Remaster (Nov 2023) | `vitality` and `void` are the canonical slugs |
| Holy/unholy damage | Removed in Remaster | PF2e Remaster (Nov 2023) | Do not include holy/unholy in DAMAGE_TYPES |
| `DAMAGE_TYPE_COLORS` in description-sanitizer.ts | Partial list (13 entries) | Pre-existing tech debt | New damage.ts becomes canonical; sanitizer is NOT updated this phase |

**Deprecated/outdated:**
- `holy` / `unholy`: Remaster replaced these with `vitality` / `void`
- `positive` / `negative`: Older PF2e names, not used in Remaster

---

## Open Questions

1. **Does `DAMAGE_TYPES` need to be a spread of category sub-arrays, or declared independently?**
   - What we know: Spreading `[...PHYSICAL, ...ENERGY, ...OTHER] as const` works in TypeScript but the resulting inferred type may lose the sub-category structure.
   - What's unclear: Whether Phase 04/05 ever needs to distinguish the sub-arrays at compile time vs. the combined union.
   - Recommendation: Declare separate category arrays AND a combined `DAMAGE_TYPES` array via spread. TypeScript handles this cleanly.

2. **Should `IWRBypass.type` be `DamageType | MaterialEffect` or a separate `IWRType` union?**
   - What we know: CONTEXT.md says IWR bypass is consumed by Phase 05. Phase 05 needs to match bypass type against creature IWR entries.
   - What's unclear: Whether Phase 05 will need a wider type (e.g., 'all' for universal resistance bypass).
   - Recommendation: Use `DamageType | MaterialEffect` for now — exactly what CONTEXT.md specifies. Phase 05 can extend if needed.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 |
| Config file | `vite.config.ts` (project root, `test` key) |
| Quick run command | `npx vitest run src/lib/pf2e/__tests__/damage.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DMG-01 | PHYSICAL_DAMAGE_TYPES has 4 entries; ENERGY_DAMAGE_TYPES has 8 entries; OTHER_DAMAGE_TYPES has 4 entries; every type in DAMAGE_TYPES has a category entry; all 3 physical types map to 'physical'; all 8 energy types map to 'energy'; all 4 other types map to 'other' | unit | `npx vitest run src/lib/pf2e/__tests__/damage.test.ts` | ❌ Wave 0 |
| DMG-02 | MATERIAL_EFFECTS has 7 entries with correct slugs; DIE_SIZES is [4,6,8,10,12] in order; DIE_FACES is ['d4','d6','d8','d10','d12'] in order | unit | `npx vitest run src/lib/pf2e/__tests__/damage.test.ts` | ❌ Wave 0 |
| DMG-03 | DamageFormula, BaseDamage, IWRBypass, CriticalInclusion compile without errors; objects matching each interface are assignable; invalid types are rejected | unit (type-level via `tsd` or `vitest` assignment tests) | `npx vitest run src/lib/pf2e/__tests__/damage.test.ts` | ❌ Wave 0 |

**Note on DMG-03 testing:** TypeScript interfaces have no runtime representation. Test them by constructing valid literal objects that satisfy the interface and asserting their properties. `vue-tsc` (the project's type checker) provides the actual compile-time gate.

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/pf2e/__tests__/damage.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/pf2e/__tests__/damage.test.ts` — covers DMG-01, DMG-02, DMG-03
- [ ] `src/lib/pf2e/damage.ts` — the implementation file itself

*(The `src/lib/pf2e/` directory already exists from Phase 01 — no directory creation needed.)*

---

## Sources

### Primary (HIGH confidence)
- https://2e.aonprd.com/Rules.aspx?ID=2308 — "Step 2: Damage Type" (PF2e Remaster) — all 16 damage types with category descriptions
- https://2e.aonprd.com/Equipment.aspx?Category=22 — PF2e Materials equipment category — confirms material slugs
- `src/lib/pf2e/xp.ts` — Establishes `as const`, union type, `Record<K,V>`, `__testing`, and barrel patterns
- CONTEXT.md (02-CONTEXT.md) — All locked decisions on damage type list, material effects list, interface field shapes

### Secondary (MEDIUM confidence)
- https://app.demiplane.com/nexus/pathfinder2e/rules/damage-types-rm — Pathfinder 2e Nexus (licensed Paizo content) — cross-confirms Remaster damage type list
- WebSearch aggregate for Remaster damage types — consistent with AoN primary source across multiple results

### Tertiary (LOW confidence)
- WebSearch results for Foundry VTT pf2e damage constants — no direct source file found; Foundry not needed since CONTEXT.md has all required values locked

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; vitest and TypeScript already installed and configured
- Damage type taxonomy: HIGH — verified from AoN Rules ID 2308 (official Paizo reference); consistent with existing DAMAGE_TYPE_COLORS in codebase
- Material effects: HIGH — CONTEXT.md locked decision; AoN Equipment Category 22 cross-confirms these are valid PF2e material slugs
- Die size constants: HIGH — industry-standard PF2e values; no ambiguity
- Interface shapes: HIGH — field names and types specified in CONTEXT.md; all types derived from arrays already documented
- Architecture patterns: HIGH — all patterns proven in Phase 01 xp.ts which is complete and passing 117 tests

**Research date:** 2026-03-24
**Valid until:** 2026-09-24 (PF2e Remaster rules are stable; damage taxonomy changes are rare and would appear in AoN errata)
