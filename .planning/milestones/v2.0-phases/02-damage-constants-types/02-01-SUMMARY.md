---
phase: 02-damage-constants-types
plan: 01
subsystem: pf2e-game-logic
tags: [typescript, pf2e, damage-types, constants, interfaces, tdd]

# Dependency graph
requires: []
provides:
  - PHYSICAL_DAMAGE_TYPES (4 types), ENERGY_DAMAGE_TYPES (8 types), OTHER_DAMAGE_TYPES (4 types) as const arrays
  - DAMAGE_TYPES (16 total), DAMAGE_CATEGORIES, DAMAGE_TYPE_CATEGORY Record
  - MATERIAL_EFFECTS (7 precious material slugs) as const array
  - DIE_SIZES [4,6,8,10,12] and DIE_FACES arrays (order-sensitive for Phase 04 die progression)
  - DamageFormula, BaseDamage, IWRBypass interfaces and CriticalInclusion type
  - All exports re-exported from @/lib/pf2e barrel index
affects: [03-modifiers, 04-damage-roll, 05-iwr-system, 06-conditions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - as-const-array pattern for PF2e taxonomy constants with derived union types
    - DAMAGE_TYPE_CATEGORY Record for O(1) category lookup keyed by DamageType
    - IWRBypass.type union (DamageType | MaterialEffect) for flexible bypass specification
    - CriticalInclusion type union ('critical-only' | 'non-critical-only' | null) for inclusion control

key-files:
  created:
    - src/lib/pf2e/damage.ts
    - src/lib/pf2e/__tests__/damage.test.ts
  modified:
    - src/lib/pf2e/index.ts

key-decisions:
  - "vitality/void used instead of positive/negative energy — PF2e Remaster taxonomy"
  - "bleed is a physical damage type (not energy/other) per PF2e GM Core"
  - "spirit is an other damage type (not energy) per PF2e Remaster"
  - "DIE_FACES array order is load-bearing — Phase 04 nextDamageDieSize will use index arithmetic"
  - "IWRBypass.type is DamageType | MaterialEffect union (not string) for type safety"

patterns-established:
  - "as-const-array with derived union type: export const FOO = [...] as const; export type Foo = (typeof FOO)[number]"
  - "Category Record: Record<DamageType, DamageCategory> for fast runtime lookup without switch/if chains"

requirements-completed: [DMG-01, DMG-02, DMG-03]

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 02 Plan 01: Damage Constants and Types Summary

**16-type PF2e Remaster damage taxonomy with category mapping, 7 material effects, die size progression, and 4 TypeScript interfaces — all exported from @/lib/pf2e barrel**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T15:04:09Z
- **Completed:** 2026-03-24T15:06:30Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 3

## Accomplishments
- 16 damage types in 3 categories (4 physical, 8 energy, 4 other) using PF2e Remaster taxonomy (vitality/void not positive/negative)
- DAMAGE_TYPE_CATEGORY Record mapping every DamageType to its category for O(1) runtime lookup
- 7 material effects with exact slugs (including sisterstone variants) and ordered die size arrays
- 4 TypeScript interfaces (DamageFormula, BaseDamage, IWRBypass, CriticalInclusion) for downstream phases
- 25 new tests all green; full 460-test suite passes with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: RED -- Write failing tests for damage constants and interfaces** - `4884db8` (test)
2. **Task 2: GREEN -- Implement damage constants and interfaces to pass all tests** - `24bdb71` (feat)

_Note: TDD tasks have separate test and implementation commits (RED then GREEN)_

## Files Created/Modified
- `src/lib/pf2e/damage.ts` - All PF2e damage constants, type unions, interfaces — 72 lines
- `src/lib/pf2e/__tests__/damage.test.ts` - 25 unit tests across DMG-01, DMG-02, DMG-03 — 161 lines
- `src/lib/pf2e/index.ts` - Barrel re-exports for 9 constants and 11 types from damage module

## Decisions Made
- Used vitality/void (not positive/negative) per PF2e Remaster: affects all downstream energy damage handling
- bleed classified as physical (not energy or other) matching PF2e GM Core taxonomy
- spirit classified as other (not energy) matching PF2e Remaster
- DIE_FACES array order is intentionally load-bearing — Phase 04 will use `DIE_FACES.indexOf(face)` for die progression
- IWRBypass.type typed as `DamageType | MaterialEffect` union (not string) for compile-time safety

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing vue-tsc errors in `HPController.vue` and `combat.ts` (unrelated to this plan, out of scope). Logged as deferred.

## Next Phase Readiness
- All downstream phases (03-modifiers, 04-damage-roll, 05-iwr-system, 06-conditions) can import from `@/lib/pf2e`
- DamageType, DamageCategory, MaterialEffect, DieFace, DieSize types available for Phase 03 modifier interfaces
- DAMAGE_TYPE_CATEGORY ready for O(1) category lookup in Phase 04 damage roll calculations

---
*Phase: 02-damage-constants-types*
*Completed: 2026-03-24*
