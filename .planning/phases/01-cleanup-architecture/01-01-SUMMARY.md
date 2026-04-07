---
phase: 01-cleanup-architecture
plan: 01
subsystem: engine
tags: [typescript, pf2e, engine, cleanup, xp, vite]

# Dependency graph
requires: []
provides:
  - Engine-only TypeScript codebase under src/lib/pf2e/ and src/lib/
  - Clean package.json with only typescript + vite devDependencies
  - PWOL-free XP module (calculateCreatureXP, getHazardXp, calculateXP)
  - Inline WeakEliteTier type in weak-elite.ts (decoupled from deleted types/entity)
affects: [02-engine-reorganization, 03-engine-completion, 04-engine-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Engine isolation: all UI/Tauri/Pinia/Vue/Drizzle code deleted, only src/lib/pf2e/ and src/lib/ engine files remain"
    - "Inline type declaration: WeakEliteTier defined in weak-elite.ts as export type, will be consolidated into engine/types.ts in Plan 02"

key-files:
  created: []
  modified:
    - src/lib/pf2e/xp.ts
    - src/lib/weak-elite.ts
    - package.json
    - .gitignore

key-decisions:
  - "WeakEliteTier type declared inline in weak-elite.ts until Plan 02 consolidates engine types"
  - "package.json renamed pathbuddy-engine, bumped to 0.2.2-pre-alpha, stripped to typescript+vite devDeps only"
  - "PWOL removed from all three XP functions (calculateCreatureXP, getHazardXp, calculateXP) — standard PF2e tables only"

patterns-established:
  - "Engine purity: src/lib/pf2e/ modules have zero UI/framework dependencies"

requirements-completed: [CLN-01, CLN-02]

# Metrics
duration: 5min
completed: 2026-03-30
---

# Phase 01 Plan 01: Cleanup Architecture — Delete UI & Strip PWOL Summary

**Deleted all 51 UI/Tauri/non-engine files and stripped PWOL variant rule from the XP module, leaving a pure TypeScript engine codebase with 9 engine files and zero framework dependencies.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-30T23:10:00Z
- **Completed:** 2026-03-30T23:12:28Z
- **Tasks:** 2
- **Files modified:** 4 (package.json, .gitignore, src/lib/pf2e/xp.ts, src/lib/weak-elite.ts)

## Accomplishments

- Deleted 51 files: 14 Vue components, 4 views, 2 stores, 3 composables, router, assets, App.vue, main.ts, 2 type files, 8 non-engine lib files, entire src-tauri/ Rust backend, index.html, tailwind.config.js, postcss.config.js
- Replaced package.json with engine-only content (name: pathbuddy-engine, version: 0.2.2-pre-alpha, devDeps: typescript + vite + @types/node only)
- Removed PWOL_CREATURE_XP table and all PWOL option parameters from calculateCreatureXP, getHazardXp, and calculateXP
- Fixed breaking import in weak-elite.ts: replaced `import type { WeakEliteTier } from '@/types/entity'` with inline `export type WeakEliteTier = 'normal' | 'weak' | 'elite'`

## Task Commits

1. **Task 1: Delete all UI code, Tauri backend, and non-engine files (CLN-01)** - `6cba13d` (feat)
2. **Task 2: Strip PWOL from XP module (CLN-02)** - `83a9619` (feat)

## Files Created/Modified

- `src/lib/pf2e/xp.ts` - PWOL logic removed; all three XP functions simplified to standard tables only
- `src/lib/weak-elite.ts` - Replaced @/types/entity import with inline WeakEliteTier type export
- `package.json` - Stripped to engine-only (pathbuddy-engine, 0.2.2-pre-alpha, typescript+vite devDeps)
- `.gitignore` - Removed src-tauri/* entries

## Decisions Made

- Inline WeakEliteTier in weak-elite.ts rather than creating a temporary shared types file — Plan 02 will consolidate into engine/types.ts
- No tsconfig.json changes needed yet — Plan 02 handles path alias removal when restructuring to /engine

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Engine source is clean: 9 files (src/lib/pf2e/{conditions,damage,damage-helpers,iwr,modifiers,xp,index}.ts + src/lib/weak-elite.ts + src/lib/iwr-utils.ts)
- Plan 02 can now reorganize engine files into /engine directory and update tsconfig/vite config
- No blockers for Plan 02 execution

---
*Phase: 01-cleanup-architecture*
*Completed: 2026-03-30*

## Self-Check: PASSED

- src/lib/pf2e/xp.ts: FOUND
- src/lib/weak-elite.ts: FOUND
- package.json: FOUND
- .gitignore: FOUND
- src/components deleted: CONFIRMED
- src-tauri deleted: CONFIRMED
- Commit 6cba13d: FOUND
- Commit 83a9619: FOUND
