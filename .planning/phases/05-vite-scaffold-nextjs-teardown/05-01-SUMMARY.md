---
phase: 05-vite-scaffold-nextjs-teardown
plan: 01
subsystem: infra
tags: [vite, tauri2, react19, tailwind4, oklch, design-tokens, scaffold]

# Dependency graph
requires: []
provides:
  - Buildable Tauri 2 + Vite 6 + React 19 project scaffold
  - Full PF2e OKLCH design token system with 13 game-specific tokens
  - Tailwind 4 @theme inline mapping generating all utility classes
  - @engine and @/* path aliases resolved in both TypeScript and Vite
  - cn() utility for shadcn component className merging
  - ThemeProvider with dark mode default
affects: [05-02, 05-03, 06-fsd-zustand, 07-sqlite-data-pipeline]

# Tech tracking
tech-stack:
  added: [react@19.2.4, react-dom@19.2.4, vite@6.4.1, "@vitejs/plugin-react@5.2.0", tailwindcss@4, "@tailwindcss/vite@4", vite-tsconfig-paths, next-themes, clsx, tailwind-merge, "@tauri-apps/api@2", "@tauri-apps/cli@2", 25 radix-ui packages, react-router-dom@7, zustand-related-deps, shadcn-ui-deps]
  patterns: [vite-tsconfig-paths for alias resolution, "@tailwindcss/vite plugin (no postcss)", "OKLCH color space tokens", "@custom-variant dark for dark mode", "@theme inline for Tailwind 4 token registration"]

key-files:
  created: [package.json, tsconfig.json, vite.config.ts, index.html, src/main.tsx, src/vite-env.d.ts, src/app/providers.tsx, src/app/styles/globals.css, src/shared/lib/cn.ts, src/shared/lib/utils.ts, src-tauri/Cargo.toml, src-tauri/tauri.conf.json, src-tauri/src/lib.rs, src-tauri/src/main.rs, src-tauri/build.rs, src-tauri/capabilities/default.json]
  modified: [.gitignore]

key-decisions:
  - "@vitejs/plugin-react downgraded from ^6.0.1 to ^5.2.0 — v6 requires Vite 8, project uses Vite 6"
  - "eslint downgraded from ^10.1.0 to ^9.22.0 — eslint-plugin-import only supports up to eslint 9"
  - "npm install ran without --legacy-peer-deps — no Radix peer dep conflicts with React 19"
  - "src-tauri/target/ and src-tauri/gen/ added to .gitignore as build artifacts"
  - "Cargo.lock committed for reproducible Rust builds"
  - "providers.tsx ships with ThemeProvider only — Toaster deferred to Plan 02 when shadcn components are copied"

patterns-established:
  - "Vite config: react() + tailwindcss() + tsconfigPaths() plugin chain"
  - "Path aliases: @/* -> src/*, @engine -> engine/index.ts, @engine/* -> engine/*"
  - "CSS architecture: globals.css with @import tailwindcss, @custom-variant dark, :root/:dark vars, @theme inline"
  - "cn() utility pattern: clsx + tailwind-merge at shared/lib/cn.ts, re-exported from utils.ts"
  - "Tauri 2 integration: beforeDevCommand -> npm run dev:vite, devUrl -> localhost:5173"

requirements-completed: [FND-01, FND-03]

# Metrics
duration: 6min
completed: 2026-03-31
---

# Phase 5 Plan 1: Vite Scaffold Summary

**Tauri 2 + Vite 6 + React 19 project with full PF2e OKLCH design token system and 13 game-specific color tokens**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-31T17:37:55Z
- **Completed:** 2026-03-31T17:43:28Z
- **Tasks:** 2/2
- **Files modified:** 17

## Accomplishments
- Complete Tauri 2 + Vite 6 + React 19 project scaffold that builds and typechecks with zero errors
- Full PF2e OKLCH design token system ported verbatim from prototype — 13 game tokens (gold, blood, 5 threat levels, 4 rarity levels), all shadcn semantic tokens, sidebar/chart tokens, and 6 custom utilities
- @engine alias preserved and resolving correctly in both TypeScript and Vite via vite-tsconfig-paths
- Tauri 2 backend configured with dev server integration pointing to Vite on localhost:5173

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Tauri 2 + Vite 6 project and install all dependencies** - `f9e01cf` (feat)
2. **Task 2: Create the complete PF2e OKLCH design token system** - `b2244a0` (feat)

## Files Created/Modified
- `package.json` - Full frontend manifest: React 19, 25 Radix packages, Tailwind 4, Vite 6, Tauri CLI
- `tsconfig.json` - TypeScript config with DOM libs, JSX, @/* and @engine aliases, src+engine include
- `vite.config.ts` - Vite with react + tailwindcss + tsconfigPaths plugins, Tauri-compatible settings
- `index.html` - SPA entry point with #root div and module script to src/main.tsx
- `src/main.tsx` - React 19 createRoot entry with ThemeProvider and placeholder text
- `src/vite-env.d.ts` - Vite client type reference
- `src/app/providers.tsx` - AppProviders with ThemeProvider (dark default)
- `src/app/styles/globals.css` - Complete OKLCH design system: :root, .dark, @theme inline, @layer base, @layer utilities
- `src/shared/lib/cn.ts` - clsx + tailwind-merge className utility
- `src/shared/lib/utils.ts` - Re-export of cn() for shadcn compatibility
- `src-tauri/Cargo.toml` - Rust package manifest with tauri 2 and opener plugin
- `src-tauri/tauri.conf.json` - Tauri 2 config with Vite dev server integration
- `src-tauri/src/lib.rs` - Tauri builder with opener plugin
- `src-tauri/src/main.rs` - Windows subsystem entry point
- `src-tauri/build.rs` - Tauri build script
- `src-tauri/capabilities/default.json` - Default capabilities for main window
- `.gitignore` - Added src-tauri/target/ and src-tauri/gen/

## Decisions Made
- **@vitejs/plugin-react ^5.2.0 instead of ^6.0.1**: Plan specified v6 which requires Vite 8. Downgraded to v5 which supports Vite 6. Functionally identical for React 19.
- **eslint ^9.22.0 instead of ^10.1.0**: eslint-plugin-import does not support eslint 10 yet. Downgraded to latest v9.
- **No --legacy-peer-deps needed**: All Radix packages installed cleanly with React 19.2.4, no peer conflicts.
- **Providers without Toaster**: Deferred Toaster import to Plan 02 when shadcn components are available.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed @vitejs/plugin-react version incompatibility**
- **Found during:** Task 1 (npm install)
- **Issue:** Plan specified `@vitejs/plugin-react@^6.0.1` which requires `vite@^8.0.0`, but project uses Vite 6
- **Fix:** Downgraded to `@vitejs/plugin-react@^5.2.0` which supports `vite@^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0`
- **Files modified:** package.json
- **Verification:** npm install succeeds, Vite starts, typecheck passes
- **Committed in:** f9e01cf (Task 1 commit)

**2. [Rule 1 - Bug] Fixed eslint version incompatibility**
- **Found during:** Task 1 (npm install)
- **Issue:** Plan specified `eslint@^10.1.0` but `eslint-plugin-import@^2.31.0` only supports eslint up to v9
- **Fix:** Downgraded to `eslint@^9.22.0`
- **Files modified:** package.json
- **Verification:** npm install succeeds without peer dep conflicts
- **Committed in:** f9e01cf (Task 1 commit)

**3. [Rule 2 - Missing Critical] Added src-tauri build artifacts to .gitignore**
- **Found during:** Task 1 (post-install review)
- **Issue:** src-tauri/target/ and src-tauri/gen/ are Rust build artifacts that should not be tracked
- **Fix:** Added both directories to .gitignore
- **Files modified:** .gitignore
- **Verification:** git status no longer shows them as untracked
- **Committed in:** f9e01cf (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correct dependency resolution. No scope creep.

## Issues Encountered
None beyond the version incompatibilities documented as deviations.

## Known Stubs
- `src/main.tsx` renders placeholder `<h1>PathBuddy</h1>` text — intentional, replaced by router in Plan 02
- `src/app/providers.tsx` has ThemeProvider only, no Toaster — added in Plan 02 when shadcn components are available

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Project builds and typechecks with zero errors
- Vite dev server starts on port 5173
- Full design token system ready for shadcn component styling in Plan 02
- @engine alias resolves, engine barrel export untouched
- Tauri 2 backend configured, ready for `npm run tauri dev`

## Self-Check: PASSED

All 16 created files verified present. Both task commits (f9e01cf, b2244a0) verified in git log.

---
*Phase: 05-vite-scaffold-nextjs-teardown*
*Completed: 2026-03-31*
