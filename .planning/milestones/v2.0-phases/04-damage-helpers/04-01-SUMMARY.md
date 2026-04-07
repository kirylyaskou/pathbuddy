---
phase: 04-damage-helpers
plan: 01
subsystem: pf2e-lib
tags: [damage, categorization, die-size, tdd, pure-ts]
dependency_graph:
  requires: [02-01]
  provides: [DamageCategorization, nextDamageDieSize]
  affects: [05-iwr-engine]
tech_stack:
  added: []
  patterns: [object-literal-utility, index-arithmetic-clamping]
key_files:
  created:
    - src/lib/pf2e/damage-helpers.ts
    - src/lib/pf2e/__tests__/damage-helpers.test.ts
  modified:
    - src/lib/pf2e/index.ts
decisions:
  - id: DMG-04-impl
    summary: DamageCategorization is an object literal (not a class) wrapping existing DAMAGE_TYPE_CATEGORY and category arrays — no new data structures introduced
  - id: DMG-05-impl
    summary: nextDamageDieSize uses DIE_FACES.indexOf + Math.max/Math.min clamping — direction typed as 1|-1, not number, for type safety
metrics:
  duration: 89s
  completed_date: "2026-03-25"
  tasks_completed: 2
  files_changed: 3
requirements: [DMG-04, DMG-05]
---

# Phase 04 Plan 01: DamageCategorization and nextDamageDieSize Summary

**One-liner:** Pure TypeScript damage utilities wrapping existing `damage.ts` constants — DamageCategorization for type-to-category mapping and nextDamageDieSize for clamped die progression via index arithmetic.

## What Was Built

- `src/lib/pf2e/damage-helpers.ts` — two exports: `DamageCategorization` (object literal with `getCategory` and `getTypes`) and `nextDamageDieSize` (pure function with direction typed as `1 | -1`)
- `src/lib/pf2e/__tests__/damage-helpers.test.ts` — 10 tests covering all 16 damage type mappings and all die stepping transitions including boundary caps
- `src/lib/pf2e/index.ts` — barrel extended with both new exports

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| DMG-04-impl | DamageCategorization as object literal | Consistent with plan spec; no class overhead needed for stateless lookups |
| DMG-05-impl | nextDamageDieSize with `1 \| -1` direction type | Prevents invalid direction values at compile time; Math.max/min clamping handles boundaries cleanly |

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 6aa69a0 | test | Add failing tests for DamageCategorization and nextDamageDieSize (RED) |
| ecdf94a | feat | Implement DamageCategorization and nextDamageDieSize (GREEN) |

## Test Results

- Damage-helpers suite: 10/10 pass
- Full suite: 485/485 pass, 26 test files, zero regressions
