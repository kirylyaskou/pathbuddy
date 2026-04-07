---
phase: 03-tauri-sqlite-foundation
plan: 01
subsystem: infra
tags: [tauri, tauri2, rust, sqlite, vue3, drizzle-orm, vue-router]

# Dependency graph
requires:
  - phase: 02-auto-round-processing
    provides: "Combat tracker Vue 3 + Pinia codebase that continues working after upgrade"
provides:
  - "Tauri 2 Rust backend with tauri-plugin-sql (sqlite), tauri-plugin-http, tauri-plugin-fs registered"
  - "src-tauri/src/lib.rs entry point with all three plugin registrations"
  - "src-tauri/capabilities/default.json with sql, http, fs permissions"
  - "JS frontend with @tauri-apps/api v2, plugin-sql, plugin-http, plugin-fs, drizzle-orm, vue-router"
  - "reqwest and zip Rust crates available for future sync commands"
affects:
  - 03-02 (database schema and migrations)
  - all future Phase 3 plans

# Tech tracking
tech-stack:
  added:
    - tauri 2 (Rust crate, upgraded from v1)
    - tauri-plugin-sql 2 with sqlite feature
    - tauri-plugin-http 2
    - tauri-plugin-fs 2
    - tauri-build 2
    - reqwest 0.12 with json feature
    - zip 2
    - "@tauri-apps/api ^2.0.0"
    - "@tauri-apps/plugin-sql ^2.0.0"
    - "@tauri-apps/plugin-http ^2.0.0"
    - "@tauri-apps/plugin-fs ^2.0.0"
    - "@tauri-apps/cli ^2.0.0"
    - "drizzle-orm ^0.38.0"
    - "vue-router ^4.5.0"
  patterns:
    - "Tauri 2 lib.rs entry point pattern: pub fn run() calls Builder::default().plugin(...).run()"
    - "main.rs delegates to lib.rs: pathbuddy_lib::run()"
    - "Capabilities JSON grants permissions per plugin"

key-files:
  created:
    - src-tauri/src/lib.rs (Tauri 2 entry point with plugin registration)
    - src-tauri/build.rs (Tauri 2 build script)
    - src-tauri/capabilities/default.json (plugin permissions)
  modified:
    - src-tauri/Cargo.toml (upgraded to Tauri 2, added all plugin deps)
    - src-tauri/src/main.rs (rewritten to call pathbuddy_lib::run())
    - src-tauri/tauri.conf.json (window title updated to "Pathbuddy - PF2e DM Assistant")
    - package.json (upgraded @tauri-apps/api to v2, added all plugin packages)
    - src/stores/combat.ts (pre-existing TS strict errors fixed)
    - src/components/CreatureCard.vue (pre-existing TS strict error fixed)

key-decisions:
  - "Used Tauri 2 lib.rs/main.rs split pattern — lib.rs owns plugin registration, main.rs delegates"
  - "All three plugins registered upfront (sql, http, fs) to unblock all Phase 3 work"
  - "reqwest and zip added to Cargo.toml now per plan spec for future sync commands"

patterns-established:
  - "Tauri 2 plugin registration: .plugin(tauri_plugin_sql::Builder::default().build())"
  - "Capabilities file at src-tauri/capabilities/default.json grants per-plugin permissions"

requirements-completed: [TAURI-01]

# Metrics
duration: 11min
completed: 2026-03-19
---

# Phase 03 Plan 01: Tauri 2 Upgrade Summary

**Tauri v1 to v2 in-place migration with sql/http/fs plugins, reqwest+zip Rust deps, and full JS frontend package upgrade including drizzle-orm and vue-router**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-19T21:45:52Z
- **Completed:** 2026-03-19T21:57:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Upgraded src-tauri from Tauri v1 to v2 with three plugins registered (sql, http, fs)
- Created lib.rs/build.rs/capabilities required by Tauri 2 build system
- Upgraded all JS packages to @tauri-apps v2, added drizzle-orm and vue-router
- Frontend build (`npm run build`) passes cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade Rust backend to Tauri 2 with plugins** - `c9a047b` (feat)
2. **Task 2: Upgrade JS frontend packages for Tauri 2** - `b448c80` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src-tauri/Cargo.toml` - Tauri 2 deps: tauri@2, tauri-plugin-sql@2 (sqlite), tauri-plugin-http@2, tauri-plugin-fs@2, reqwest@0.12, zip@2
- `src-tauri/src/lib.rs` - New: Tauri 2 entry point with all plugin registrations
- `src-tauri/src/main.rs` - Rewritten: delegates to pathbuddy_lib::run()
- `src-tauri/build.rs` - New: Tauri 2 build script calling tauri_build::build()
- `src-tauri/capabilities/default.json` - New: sql, http, fs permissions for Tauri 2 capability system
- `src-tauri/tauri.conf.json` - Window title updated to "Pathbuddy - PF2e DM Assistant"
- `package.json` - @tauri-apps/api@^2, plugin-sql, plugin-http, plugin-fs, cli, drizzle-orm, vue-router
- `src/stores/combat.ts` - Pre-existing TS strict errors fixed (type assertions for Record<Condition, number>)
- `src/components/CreatureCard.vue` - Pre-existing TS strict error fixed (optional chaining on dataTransfer)

## Decisions Made
- Used Tauri 2 lib.rs/main.rs split pattern — matches Tauri 2 conventions and mobile entry point support
- All three plugins registered upfront to unblock all downstream Phase 3 work
- reqwest/zip added now per plan spec — needed for sync pipeline in Phase 4+

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing TypeScript strict errors in combat.ts and CreatureCard.vue**
- **Found during:** Task 2 (npm run build verification)
- **Issue:** Pre-existing TS strict-mode errors that prevented `npm run build` from exiting 0 — acceptance criterion for this task. Errors: `{}` assigned to `Record<Condition, number>`, `conditionDurations` possibly undefined, `dataTransfer` possibly null
- **Fix:** Added type assertions (`{} as Record<Condition, number>`), optional chaining (`dataTransfer?.setData`), and `as Condition` casts where string was indexed into `Record<Condition, number>`
- **Files modified:** src/stores/combat.ts, src/components/CreatureCard.vue
- **Verification:** `npm run build` exits 0 with no TypeScript errors
- **Committed in:** b448c80 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - pre-existing bugs blocking build)
**Impact on plan:** Required to meet Task 2 acceptance criterion. No scope creep — only touched files to make existing code compile correctly.

## Issues Encountered

- **Rust/cargo not in PATH**: `cargo check` verification could not run automatically. All Rust files are correctly written per the Tauri 2 spec. The user should run `cargo check` in `src-tauri/` after Rust is confirmed installed to validate Tauri 2 compilation.

## User Setup Required

**Cargo check verification needed** — Rust/cargo was not found in the bash PATH during execution.

To verify the Rust side compiles:
```
cd src-tauri
cargo check
```

Expected: exit 0, with tauri-plugin-sql, tauri-plugin-http, tauri-plugin-fs compiled.

## Next Phase Readiness
- Tauri 2 project structure ready for Plan 02 (database schema + Drizzle setup)
- All required packages (drizzle-orm, vue-router, @tauri-apps/plugin-sql) installed
- Plugin registration complete — Plan 02 can immediately use `sqlite:pf2e.db` connection string
- No blockers for Plan 02 other than confirming Rust compilation on user machine

---
*Phase: 03-tauri-sqlite-foundation*
*Completed: 2026-03-19*
