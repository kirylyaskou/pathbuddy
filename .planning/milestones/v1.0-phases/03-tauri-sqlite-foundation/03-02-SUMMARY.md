---
phase: 03-tauri-sqlite-foundation
plan: 02
subsystem: database
tags: [drizzle-orm, sqlite, tauri-plugin-sql, vue-router, pinia, vue3]

# Dependency graph
requires:
  - phase: 03-tauri-sqlite-foundation/01
    provides: Tauri v2 with sql/http/fs plugins registered in Rust backend

provides:
  - Drizzle ORM schema for pf2e_entities, sync_state, campaigns tables
  - sqlite-proxy bridge connecting Drizzle to tauri-plugin-sql IPC
  - Versioned migration system with _migrations tracking table
  - useDatabase composable with reactive status for splash screen
  - Vue Router with / (dashboard) and /combat routes
  - SplashScreen component with spinner, status text, and error retry
  - DashboardView with Combat Tracker and Sync Data nav tiles
  - CombatView thin wrapper preserving existing CombatTracker.vue

affects: [04-pf2e-data-sync, 05-cross-reference, 06-description-sanitizer, 07-sync-ui]

# Tech tracking
tech-stack:
  added:
    - drizzle-orm/sqlite-proxy (sqlite-proxy adapter, not bundled migrate)
    - vue-router 4 (createRouter + createWebHistory)
  patterns:
    - sqlite-proxy pattern: Drizzle generates SQL on frontend, executes via tauri IPC
    - Versioned migration table: _migrations with version/name/applied_at tracks applied DDL
    - Module-level singleton: sqliteInstance cached across calls with lazy load
    - Module-level reactive state: useDatabase composable shares status refs across components
    - Splash-before-router pattern: v-if splash on showSplash, RouterView only after DB ready

key-files:
  created:
    - src/lib/schema.ts
    - src/lib/database.ts
    - src/lib/migrations.ts
    - src/composables/useDatabase.ts
    - src/router/index.ts
    - src/components/SplashScreen.vue
    - src/views/DashboardView.vue
    - src/views/CombatView.vue
  modified:
    - src/main.ts
    - src/App.vue

key-decisions:
  - "sqlite-proxy rows typed as Record<string, unknown>[] to satisfy vue-tsc strict mode (plan had any[] which caused TS18046)"
  - "SplashScreen uses Transition wrapper for opacity transitions rather than inline style manipulation"
  - "RouterLink wraps a block div for the Combat Tracker tile to preserve card hover styling"

patterns-established:
  - "sqlite-proxy pattern: all DB calls go through Drizzle proxy -> getSqlite() -> tauri IPC"
  - "Migration versioning: _migrations table as source of truth; run only unapplied migrations by version"
  - "DB initialization composable: module-level refs shared singleton state across all component instances"

requirements-completed: [TAURI-01, TAURI-02, TAURI-03, TAURI-04]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 03 Plan 02: Database Foundation + App Shell Summary

**Drizzle sqlite-proxy bridge to tauri-plugin-sql, versioned migration system with _migrations table, and splash-gated vue-router app with dashboard nav tiles**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T19:01:04Z
- **Completed:** 2026-03-19T19:03:45Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- SQLite database layer fully defined: Drizzle schema, sqlite-proxy IPC bridge, and versioned migration runner
- Migration system creates _migrations tracking table on first launch, runs only unapplied migrations by version number
- App startup flow: splash screen while DB initializes -> migrations run -> "Ready." 300ms hold -> navigate to dashboard
- Existing combat tracker unchanged, now accessible via /combat route through CombatView wrapper

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Drizzle schema, database module, and versioned migration system** - `62da079` (feat)
2. **Task 2: Add vue-router, SplashScreen, DashboardView, CombatView, and wire DB init on startup** - `606e1fe` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `src/lib/schema.ts` - Drizzle sqlite-core tables: pf2e_entities (with 4 indexes), sync_state, campaigns
- `src/lib/database.ts` - getSqlite() singleton + drizzle sqlite-proxy executing via tauri IPC
- `src/lib/migrations.ts` - runMigrations() with _migrations tracking table; version 1 creates all 3 tables
- `src/composables/useDatabase.ts` - Reactive DB init composable exposing status/statusMessage/error/initialize/retry
- `src/router/index.ts` - Vue Router: / -> DashboardView, /combat -> CombatView
- `src/components/SplashScreen.vue` - Full-screen bg-gray-900 overlay with CSS spinner, status text, error card + retry
- `src/views/DashboardView.vue` - Dashboard with responsive 2-tile grid: Combat Tracker (RouterLink) + Sync Data (div, opacity-60)
- `src/views/CombatView.vue` - 7-line thin wrapper rendering CombatTracker.vue unchanged
- `src/main.ts` - Added app.use(router) registration
- `src/App.vue` - Rewritten: splash v-if showSplash, RouterView v-else; initialize() called in setup

## Decisions Made

- Typed `sqlite.select()` return as `Record<string, unknown>[]` instead of `any[]` to satisfy vue-tsc strict mode (TS18046 error on `rows` being `unknown`). The plan's interface sample used `any` but strict compilation required explicit typing.
- Used `<Transition>` wrapper on SplashScreen's outer div for the CSS fade transitions (200ms ease-in mount, 300ms ease-out dismiss) rather than inline style manipulation.
- RouterLink wraps a block `div` for the Combat Tracker tile so the card styling and hover effects stay on the inner div, not the anchor element.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error on sqlite.select() return value**
- **Found during:** Task 1 (Create database module)
- **Issue:** `sqlite.select()` from @tauri-apps/plugin-sql is typed as returning `unknown`, not `any[]`. The plan's code sample used `any[]` but vue-tsc raised TS18046 ("'rows' is of type 'unknown'")
- **Fix:** Changed `sqlite.select(sql, params as any[])` to `sqlite.select<Record<string, unknown>[]>(sql, params as any[])` providing the generic type parameter
- **Files modified:** src/lib/database.ts
- **Verification:** `npx vue-tsc --noEmit` exits 0 after fix
- **Committed in:** `62da079` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type error bug)
**Impact on plan:** Necessary for TypeScript correctness under strict mode. No scope creep.

## Issues Encountered

None beyond the type error documented above.

## Next Phase Readiness

- `db` and schema exports from `src/lib/database.ts` and `src/lib/schema.ts` are ready for Phase 4 (PF2e Data Sync) to import and use for entity storage
- `getSqlite()` available for raw SQL if needed by sync mechanism
- All TAURI-01 through TAURI-04 requirements fulfilled
- Frontend build clean, TypeScript strict mode passes

---
*Phase: 03-tauri-sqlite-foundation*
*Completed: 2026-03-19*
