---
phase: 01-cleanup-architecture
plan: 02
subsystem: engine
tags: [typescript, pf2e, engine, cleanup, barrel-export, tsconfig, vite]

# Dependency graph
requires:
  - phase: 01-cleanup-architecture plan 01
    provides: Engine-only TypeScript codebase under src/lib/pf2e/ and src/lib/ with PWOL removed
provides:
  - PF2e engine modules in /engine with domain subdirectories (conditions, damage, modifiers, encounter)
  - engine/index.ts single barrel export for all engine logic
  - engine/types.ts shared engine types (WeakEliteTier)
  - tsconfig.json configured for engine-only with @engine path alias
  - vite.config.ts with @engine alias, no Vue plugin
  - Zero-error TypeScript typecheck on engine codebase
affects: [03-engine-completion, 04-engine-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Engine barrel export: single engine/index.ts re-exports all public API with explicit named exports (not export *)"
    - "Type separation: export type { ... } separated from value exports in barrel"
    - "No per-subdirectory index.ts files (D-02): only top-level engine/index.ts barrel"
    - "@engine path alias: tsconfig.json paths + vite.config.ts alias for consumer imports"

key-files:
  created:
    - engine/types.ts
    - engine/conditions/conditions.ts
    - engine/damage/damage.ts
    - engine/damage/damage-helpers.ts
    - engine/damage/iwr.ts
    - engine/damage/iwr-utils.ts
    - engine/modifiers/modifiers.ts
    - engine/encounter/xp.ts
    - engine/encounter/weak-elite.ts
    - engine/index.ts
  modified:
    - tsconfig.json
    - vite.config.ts

key-decisions:
  - "Single barrel export at engine/index.ts only — no per-subdirectory index.ts (D-02)"
  - "engine/types.ts created as shared type home; WeakEliteTier moved from inline weak-elite.ts"
  - "tsconfig.json uses @engine path alias (two entries: @engine -> index.ts, @engine/* -> engine/*)"
  - "tsconfig.node.json deleted — no longer needed without vue-tsc composite builds"

patterns-established:
  - "Domain grouping: engine/conditions, engine/damage, engine/modifiers, engine/encounter"
  - "Barrel export pattern: explicit named exports per module, type exports separated"

requirements-completed: [ARCH-01, ARCH-02]

# Metrics
duration: 8min
completed: 2026-03-30
---

# Phase 01 Plan 02: Cleanup Architecture — Engine Relocation Summary

**Relocated 9 PF2e engine modules from src/lib/ to /engine domain subdirectories, created a single barrel export at engine/index.ts, and reconfigured tsconfig.json and vite.config.ts for engine-only TypeScript with zero typecheck errors.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-30T23:13:00Z
- **Completed:** 2026-03-30T23:21:31Z
- **Tasks:** 2
- **Files modified:** 12 (10 created in engine/, tsconfig.json, vite.config.ts)

## Accomplishments

- Relocated all 9 engine modules into /engine with domain subdirectories (conditions, damage, modifiers, encounter)
- Created engine/types.ts with shared WeakEliteTier type (consolidated from inline declaration in weak-elite.ts)
- Created engine/index.ts barrel export re-exporting all public API — explicit named exports, types separated
- Updated cross-module imports: modifiers.ts `./damage` → `../damage/damage`, weak-elite.ts inline type → `import type from '../types'`
- Deleted src/ directory entirely
- Rewrote tsconfig.json for engine-only: removed DOM lib, jsx, vue-tsc references, added @engine path alias
- Rewrote vite.config.ts: removed Vue plugin, @engine alias only
- Deleted tsconfig.node.json
- TypeScript typecheck passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create /engine directory structure and move all modules with updated imports (ARCH-01)** - `9508438` (feat)
2. **Task 2: Create barrel export and configure project for engine-only TypeScript (ARCH-02)** - `51d6101` (feat)

## Files Created/Modified

- `engine/types.ts` - Shared engine types: WeakEliteTier
- `engine/conditions/conditions.ts` - ConditionManager, CONDITION_SLUGS, VALUED_CONDITIONS, CONDITION_GROUPS (moved from src/lib/pf2e/)
- `engine/damage/damage.ts` - Damage type taxonomy, categories, die sizes (moved from src/lib/pf2e/)
- `engine/damage/damage-helpers.ts` - DamageCategorization, nextDamageDieSize (moved from src/lib/pf2e/, imports unchanged)
- `engine/damage/iwr.ts` - IWR engine (moved from src/lib/pf2e/, imports unchanged — same directory)
- `engine/damage/iwr-utils.ts` - parseIwrData, formatIwrType (moved from src/lib/, no imports)
- `engine/modifiers/modifiers.ts` - Modifier class, stacking rules, StatisticModifier (updated import path to ../damage/damage)
- `engine/encounter/xp.ts` - XP calculation, encounter budgets (moved from src/lib/pf2e/, no imports)
- `engine/encounter/weak-elite.ts` - getHpAdjustment (moved from src/lib/, replaced inline type with import from ../types)
- `engine/index.ts` - Barrel export for all 9 modules, 87 lines, 15 export statements
- `tsconfig.json` - Engine-only: ES2020 lib, @engine path alias, engine/**/*.ts include
- `vite.config.ts` - @engine alias only, no Vue plugin

## Decisions Made

- Single barrel export only (D-02): no per-subdirectory index.ts files — engine/index.ts is the sole public API entry point
- engine/types.ts holds shared types — WeakEliteTier moved here from weak-elite.ts as first shared type
- tsconfig.json uses two @engine alias entries: `"@engine"` points to `engine/index.ts` and `"@engine/*"` points to `engine/*`
- tsconfig.node.json deleted — was only for vue-tsc composite builds, no longer needed

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all 9 engine files compiled cleanly on first typecheck run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Engine has clean structure: 10 .ts files in /engine (9 modules + 1 barrel)
- TypeScript typecheck passes with zero errors
- All internal imports use correct relative paths within /engine
- @engine path alias configured for consumer imports
- Phase 03 (engine completion) can now import from '@engine' or use relative engine/ paths
- No blockers

---
*Phase: 01-cleanup-architecture*
*Completed: 2026-03-30*

## Self-Check: PASSED

- engine/types.ts: FOUND
- engine/conditions/conditions.ts: FOUND
- engine/damage/damage.ts: FOUND
- engine/damage/damage-helpers.ts: FOUND
- engine/damage/iwr.ts: FOUND
- engine/damage/iwr-utils.ts: FOUND
- engine/modifiers/modifiers.ts: FOUND
- engine/encounter/xp.ts: FOUND
- engine/encounter/weak-elite.ts: FOUND
- engine/index.ts: FOUND
- tsconfig.json: FOUND
- vite.config.ts: FOUND
- tsconfig.node.json: DELETED (confirmed)
- src/: DELETED (confirmed)
- Commit 9508438: FOUND
- Commit 51d6101: FOUND
