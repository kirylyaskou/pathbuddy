# Phase 04: Damage Helpers - Research

**Researched:** 2026-03-25
**Domain:** Pure TypeScript utility functions — PF2e damage categorization and die-size stepping
**Confidence:** HIGH

## Summary

Phase 04 is a narrow, self-contained pure-TypeScript phase. It adds two utilities that live in `src/lib/pf2e/` and depend entirely on constants already defined in `src/lib/pf2e/damage.ts`. No new dependencies are required and no external research is needed — everything is deterministic from the existing codebase.

`DamageCategorization` wraps `DAMAGE_TYPE_CATEGORY` and the category-keyed arrays into a clean API: type-to-category lookup and category-to-members reverse lookup. `nextDamageDieSize` uses index arithmetic on the `DIE_FACES` array (whose order is explicitly documented as load-bearing in `damage.ts` line 38) to step a `DieFace` up or down with boundary capping.

All implementation choices follow the patterns already established across `damage.ts` and `modifiers.ts`. The planner can directly translate requirements into tasks using the concrete code patterns below.

**Primary recommendation:** Implement both utilities in `src/lib/pf2e/damage-helpers.ts`, export via `src/lib/pf2e/index.ts`, test in `src/lib/pf2e/__tests__/damage-helpers.test.ts`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None locked — all implementation choices are at Claude's discretion.

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Follow established patterns from `src/lib/pf2e/damage.ts` (as const arrays, derived union types, section headers, source URLs) and `src/lib/pf2e/modifiers.ts` (pure functions, barrel exports via index.ts).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DMG-04 | DamageCategorization utility maps damage types to/from categories | `DAMAGE_TYPE_CATEGORY` and category arrays in `damage.ts` provide the complete data source; utility is a thin wrapper with type safety |
| DMG-05 | nextDamageDieSize steps die size up/down (d4-d6-d8-d10-d12) with capping | `DIE_FACES` array in `damage.ts` has load-bearing index order; index arithmetic with `Math.max`/`Math.min` cap provides the algorithm |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | (project-pinned) | Type-safe pure functions | Already in use across all pf2e modules |
| Vitest | (project-pinned) | Unit tests | Configured in `vitest.config.ts`; all pf2e tests use it |

No new dependencies are needed for this phase. All required constants (`DAMAGE_TYPE_CATEGORY`, `PHYSICAL_DAMAGE_TYPES`, `ENERGY_DAMAGE_TYPES`, `OTHER_DAMAGE_TYPES`, `DIE_FACES`, `DamageType`, `DamageCategory`, `DieFace`) are already exported from `./damage`.

### Installation
None required.

## Architecture Patterns

### Recommended Project Structure
```
src/lib/pf2e/
├── damage.ts                          # existing — constants consumed here
├── damage-helpers.ts                  # NEW — DamageCategorization, nextDamageDieSize
├── modifiers.ts                       # existing
├── xp.ts                              # existing
├── index.ts                           # existing — add barrel re-exports
└── __tests__/
    ├── damage.test.ts                 # existing
    ├── damage-helpers.test.ts         # NEW — DMG-04 and DMG-05 tests
    └── modifiers.test.ts              # existing
```

### Pattern 1: Section-header comment blocks (established in damage.ts and modifiers.ts)
**What:** Each logical block opens with a `// ─── Section Name ──...──` comment and a `// Source:` URL line where applicable.
**When to use:** Always, for every exported constant or function group.
**Example:**
```typescript
// Source: src/lib/pf2e/damage.ts (established pattern)
// ─── DamageCategorization (DMG-04) ───────────────────────────────────────────
```

### Pattern 2: DamageCategorization — object literal wrapping existing maps
**What:** An exported object (not a class) that exposes `getCategory(type)` and `getTypes(category)` using the already-built `DAMAGE_TYPE_CATEGORY` Record and the three typed-category arrays.
**When to use:** DMG-04 requires type-to-category AND category-to-types reverse lookup. Both directions are O(1) using existing data.

```typescript
// Source: derived from src/lib/pf2e/damage.ts constants
import {
  DAMAGE_TYPE_CATEGORY,
  PHYSICAL_DAMAGE_TYPES,
  ENERGY_DAMAGE_TYPES,
  OTHER_DAMAGE_TYPES,
} from './damage'
import type { DamageType, DamageCategory, PhysicalDamageType, EnergyDamageType, OtherDamageType } from './damage'

const CATEGORY_TO_TYPES: Record<DamageCategory, readonly DamageType[]> = {
  physical: PHYSICAL_DAMAGE_TYPES,
  energy:   ENERGY_DAMAGE_TYPES,
  other:    OTHER_DAMAGE_TYPES,
}

export const DamageCategorization = {
  /** Maps a damage type string to its PF2e category (physical/energy/other). */
  getCategory(type: DamageType): DamageCategory {
    return DAMAGE_TYPE_CATEGORY[type]
  },
  /** Returns all damage types that belong to the given category. */
  getTypes(category: DamageCategory): readonly DamageType[] {
    return CATEGORY_TO_TYPES[category]
  },
} as const
```

### Pattern 3: nextDamageDieSize — index arithmetic on DIE_FACES
**What:** Pure function that finds the current die's index in `DIE_FACES`, steps ±1, clamps with `Math.max`/`Math.min`, returns `DIE_FACES[clampedIndex]`.
**When to use:** DMG-05. The `DIE_FACES` array order `['d4','d6','d8','d10','d12']` is explicitly documented as load-bearing in `damage.ts` line 38, so index arithmetic is the intended algorithm.

```typescript
// Source: derived from src/lib/pf2e/damage.ts (DIE_FACES order is load-bearing)
import { DIE_FACES } from './damage'
import type { DieFace } from './damage'

/**
 * Steps a die size up (+1) or down (-1) through the d4→d6→d8→d10→d12 progression.
 * Caps at boundaries: stepping down from d4 returns d4; stepping up from d12 returns d12.
 */
export function nextDamageDieSize(current: DieFace, direction: 1 | -1): DieFace {
  const index = DIE_FACES.indexOf(current)
  const next  = Math.max(0, Math.min(DIE_FACES.length - 1, index + direction))
  return DIE_FACES[next]
}
```

### Pattern 4: Barrel re-export in index.ts
**What:** Add named exports and type exports to `src/lib/pf2e/index.ts`.
**When to use:** Every new pf2e module follows this pattern (see xp, damage, modifiers entries in current index.ts).

```typescript
// Add to src/lib/pf2e/index.ts
export { DamageCategorization, nextDamageDieSize } from './damage-helpers'
```

### Pattern 5: Test file structure (established in damage.test.ts, modifiers.test.ts)
**What:** `describe` block per requirement ID, one `it` per distinct behavior, imports from `@/lib/pf2e` (not relative), section-header comments matching the req ID.
**When to use:** Always for pf2e module tests.

```typescript
// Source: src/lib/pf2e/__tests__/damage.test.ts (established pattern)
import { describe, it, expect } from 'vitest'
import { DamageCategorization, nextDamageDieSize } from '@/lib/pf2e'

describe('DMG-04: DamageCategorization', () => { ... })
describe('DMG-05: nextDamageDieSize', () => { ... })
```

### Anti-Patterns to Avoid
- **Rebuilding the category map from scratch:** `DAMAGE_TYPE_CATEGORY` already exists in `damage.ts`. Do not create a new `Record<DamageType, DamageCategory>`.
- **Using a class for DamageCategorization:** Prior modules use plain object literals (`as const`) for stateless utilities. A class adds constructor overhead with no benefit.
- **Hardcoding die face strings in the function body:** All die face progression logic must derive from the `DIE_FACES` array to stay in sync if the array ever changes.
- **Allowing unknown strings through:** Function signatures must use `DieFace` and `DamageType` union types, not `string`, to preserve compile-time safety.
- **Relative imports in test files:** All pf2e test files import via `@/lib/pf2e` (the barrel), not via relative paths.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Category lookup map | Custom `Record<DamageType, DamageCategory>` | `DAMAGE_TYPE_CATEGORY` from `damage.ts` | Already exhaustively defined with all 16 types |
| Die progression list | Hardcoded `['d4','d6','d8','d10','d12']` in helpers file | `DIE_FACES` from `damage.ts` | Single source of truth; duplication creates drift risk |
| Category-to-types reverse map | A separate Record built from scratch | Slice of existing typed arrays (`PHYSICAL_DAMAGE_TYPES`, etc.) | Arrays are already typed and exported |

**Key insight:** Both utilities are thin wrappers over constants that already exist. The data layer is 100% done; Phase 04 only adds a query layer on top of it.

## Common Pitfalls

### Pitfall 1: indexOf returning -1 for invalid input
**What goes wrong:** If a non-DieFace string somehow reaches `nextDamageDieSize`, `indexOf` returns `-1`. `Math.max(0, -1 + direction)` with direction=1 gives index 0 (d4) instead of an error, silently masking a bug.
**Why it happens:** TypeScript unions prevent this at compile time but runtime callers (e.g., JSON-sourced data) can bypass types.
**How to avoid:** The TypeScript signature `DieFace` is sufficient protection for this phase. Phase 05 IWR will call with typed values. No runtime guard is needed within scope.
**Warning signs:** Tests against invalid input are out of scope for this phase; the type system is the contract.

### Pitfall 2: Forgetting the `as const` assertion on CATEGORY_TO_TYPES
**What goes wrong:** Without `as const` or explicit type annotation, TypeScript widens the value types to `DamageType[][]` and loses the `readonly` narrowing needed by `getTypes` return type.
**How to avoid:** Annotate as `Record<DamageCategory, readonly DamageType[]>`.

### Pitfall 3: Missing barrel re-exports causing test import failures
**What goes wrong:** Test file imports from `@/lib/pf2e` (the barrel). If `index.ts` is not updated, imports throw at test runtime.
**How to avoid:** Update `index.ts` in the same plan before writing the test file.

### Pitfall 4: direction parameter typed as `number` instead of `1 | -1`
**What goes wrong:** `number` allows `0` or `±2`, which gives wrong results.
**How to avoid:** Use the literal union `1 | -1` for the direction parameter.

## Code Examples

### DMG-04: Full test coverage pattern
```typescript
// Source: established pattern from src/lib/pf2e/__tests__/damage.test.ts

describe('DMG-04: DamageCategorization', () => {
  it('getCategory maps each physical type to "physical"', () => {
    for (const t of PHYSICAL_DAMAGE_TYPES) {
      expect(DamageCategorization.getCategory(t)).toBe('physical')
    }
  })

  it('getCategory maps each energy type to "energy"', () => {
    for (const t of ENERGY_DAMAGE_TYPES) {
      expect(DamageCategorization.getCategory(t)).toBe('energy')
    }
  })

  it('getCategory maps each other type to "other"', () => {
    for (const t of OTHER_DAMAGE_TYPES) {
      expect(DamageCategorization.getCategory(t)).toBe('other')
    }
  })

  it('getTypes("physical") returns all physical types', () => {
    expect(DamageCategorization.getTypes('physical')).toEqual(PHYSICAL_DAMAGE_TYPES)
  })

  it('getTypes("energy") returns all energy types', () => {
    expect(DamageCategorization.getTypes('energy')).toEqual(ENERGY_DAMAGE_TYPES)
  })

  it('getTypes("other") returns all other types', () => {
    expect(DamageCategorization.getTypes('other')).toEqual(OTHER_DAMAGE_TYPES)
  })
})
```

### DMG-05: Full test coverage pattern
```typescript
// Source: established pattern from src/lib/pf2e/__tests__/damage.test.ts

describe('DMG-05: nextDamageDieSize', () => {
  it('steps up: d4→d6, d6→d8, d8→d10, d10→d12', () => {
    expect(nextDamageDieSize('d4', 1)).toBe('d6')
    expect(nextDamageDieSize('d6', 1)).toBe('d8')
    expect(nextDamageDieSize('d8', 1)).toBe('d10')
    expect(nextDamageDieSize('d10', 1)).toBe('d12')
  })

  it('steps down: d12→d10, d10→d8, d8→d6, d6→d4', () => {
    expect(nextDamageDieSize('d12', -1)).toBe('d10')
    expect(nextDamageDieSize('d10', -1)).toBe('d8')
    expect(nextDamageDieSize('d8',  -1)).toBe('d6')
    expect(nextDamageDieSize('d6',  -1)).toBe('d4')
  })

  it('caps at lower boundary: d4 down stays d4', () => {
    expect(nextDamageDieSize('d4', -1)).toBe('d4')
  })

  it('caps at upper boundary: d12 up stays d12', () => {
    expect(nextDamageDieSize('d12', 1)).toBe('d12')
  })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| positive/negative energy types | vitality/void | PF2e Remaster (2023) | Already reflected in `damage.ts`; no action needed |
| Separate category lookup table | `DAMAGE_TYPE_CATEGORY` Record | Phase 02 (complete) | Data already exists; Phase 04 only adds query API |

## Open Questions

None. All required data exists in the codebase. All design decisions are fully deterministic from existing patterns.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project-configured) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/pf2e/__tests__/damage-helpers.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DMG-04 | `getCategory` maps all 16 types correctly | unit | `npx vitest run src/lib/pf2e/__tests__/damage-helpers.test.ts` | Wave 0 |
| DMG-04 | `getTypes` returns correct member arrays for all 3 categories | unit | `npx vitest run src/lib/pf2e/__tests__/damage-helpers.test.ts` | Wave 0 |
| DMG-05 | Steps up through all 4 valid transitions | unit | `npx vitest run src/lib/pf2e/__tests__/damage-helpers.test.ts` | Wave 0 |
| DMG-05 | Steps down through all 4 valid transitions | unit | `npx vitest run src/lib/pf2e/__tests__/damage-helpers.test.ts` | Wave 0 |
| DMG-05 | Caps at d4 boundary (down from d4 = d4) | unit | `npx vitest run src/lib/pf2e/__tests__/damage-helpers.test.ts` | Wave 0 |
| DMG-05 | Caps at d12 boundary (up from d12 = d12) | unit | `npx vitest run src/lib/pf2e/__tests__/damage-helpers.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/pf2e/__tests__/damage-helpers.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/pf2e/__tests__/damage-helpers.test.ts` — covers DMG-04 and DMG-05

*(Framework and fixtures already in place — vitest.config.ts, src/__tests__/setup.ts, and src/__tests__/global-setup.ts are all present.)*

## Sources

### Primary (HIGH confidence)
- `src/lib/pf2e/damage.ts` — all constants directly inspected; `DIE_FACES` load-bearing order confirmed at line 38
- `src/lib/pf2e/modifiers.ts` — pure function and barrel export patterns directly inspected
- `src/lib/pf2e/index.ts` — barrel export structure directly inspected
- `src/lib/pf2e/__tests__/damage.test.ts` — test structure pattern directly inspected
- `src/lib/pf2e/__tests__/modifiers.test.ts` — test structure pattern directly inspected
- `vitest.config.ts` — test environment, glob patterns, and alias directly confirmed
- `.planning/STATE.md` — decision [02-01] confirming DIE_FACES order is load-bearing
- `.planning/REQUIREMENTS.md` — DMG-04 and DMG-05 definitions

### Secondary (MEDIUM confidence)
None required — all information sourced directly from codebase.

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all constants and patterns read directly from source files
- Architecture: HIGH — file location, naming, and export patterns derived from identical prior modules
- Pitfalls: HIGH — derived from type constraints and explicit code comments in the codebase

**Research date:** 2026-03-25
**Valid until:** Stable — only changes if `damage.ts` constants are restructured (no indication of that)
