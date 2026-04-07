---
phase: 05-vite-scaffold-nextjs-teardown
plan: 02
subsystem: ui
tags: [shadcn, react-router, hash-router, fsd, navigation, command-palette, vite]

# Dependency graph
requires:
  - phase: 05-01
    provides: Vite 6 + React 19 scaffold with Tailwind 4 OKLCH tokens, cn() utility, ThemeProvider
provides:
  - 64 shadcn/ui + PF2e atom components importable from @/shared/ui/
  - components.json configured for Vite + FSD paths (rsc:false)
  - Hash router with 8 placeholder pages (createHashRouter)
  - AppShell navigation chrome (sidebar, header, command palette)
  - Route path constants at shared/routes/paths.ts
  - Toaster (sonner) wired into AppProviders
affects: [05-03, 06-fsd-zustand, 08-combat-tracker, 09-bestiary-encounter]

# Tech tracking
tech-stack:
  added: []
  patterns: [createHashRouter for Tauri SPA, AppShell layout route with Outlet, FSD page structure (pages/*/index.tsx), Link to= prop (not href=), useLocation for active route, useNavigate for programmatic navigation, Ctrl+K command palette pattern]

key-files:
  created: [components.json, src/app/router.tsx, src/shared/routes/paths.ts, src/widgets/app-shell/ui/AppShell.tsx, src/widgets/app-shell/ui/AppSidebar.tsx, src/widgets/app-shell/ui/AppHeader.tsx, src/widgets/app-shell/ui/CommandPalette.tsx, src/widgets/app-shell/index.ts, src/pages/dashboard/index.tsx, src/pages/combat/index.tsx, src/pages/bestiary/index.tsx, src/pages/encounters/index.tsx, src/pages/conditions/index.tsx, src/pages/spells/index.tsx, src/pages/items/index.tsx, src/pages/settings/index.tsx, src/shared/hooks/use-mobile.tsx, src/shared/hooks/use-toast.ts]
  modified: [src/main.tsx, src/app/providers.tsx, src/shared/ui/creature-card.tsx, src/shared/ui/creature-stat-block.tsx, src/shared/ui/xp-budget-bar.tsx]

key-decisions:
  - "Hooks (use-mobile, use-toast) moved from shared/ui/ to shared/hooks/ for FSD convention"
  - "PF2e mock data imports replaced with local type stubs (Creature, ActionCost, XP thresholds) — to be wired to real engine in Phase 7+"
  - "AppHeader simplified to theme toggle only — campaign selector and sync status removed for Phase 5"
  - "CommandPalette simplified to Pages group only — entity search deferred to Phase 9+"
  - "Sidebar app name changed from GRIMOIRE to PathBuddy, subtitle removed"
  - "Sidebar keyboard shortcut display changed from Cmd+K to Ctrl+K (Windows/Tauri desktop target)"

patterns-established:
  - "FSD page structure: src/pages/{name}/index.tsx with named export {Name}Page"
  - "FSD widget structure: src/widgets/{name}/ui/*.tsx with barrel at index.ts"
  - "Route constants centralized at src/shared/routes/paths.ts"
  - "Hash router with AppShell as layout route, pages as children via Outlet"
  - "React Router Link uses to= prop (never href=)"
  - "Active route detection via useLocation().pathname comparison"
  - "Command palette: Ctrl+K toggle with useNavigate for page navigation"
  - "Sidebar: collapsible with TooltipProvider for collapsed icon hints"

requirements-completed: [FND-02, FND-04]

# Metrics
duration: 6min
completed: 2026-03-31
---

# Phase 5 Plan 2: shadcn/ui + Router + Navigation Shell Summary

**64 shadcn/ui components copied with FSD paths, hash router with 8 pages, and full AppShell navigation chrome (sidebar, header, Ctrl+K command palette)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-31T17:46:49Z
- **Completed:** 2026-03-31T17:52:46Z
- **Tasks:** 2/2
- **Files modified:** 85

## Accomplishments
- All 64 components (57 shadcn/ui + 7 PF2e atoms) copied from prototype with import paths fixed for FSD layout, "use client" removed, and components.json configured for Vite
- Complete hash router with 8 placeholder pages, AppShell layout route with Outlet, and all routes navigable via sidebar and command palette
- AppSidebar ported from Next.js with all navigation replaced: Link to= (not href=), useLocation (not usePathname), active route highlighting
- CommandPalette ported with useNavigate (not useRouter), Ctrl+K keyboard shortcut, Pages-only group
- Zero Next.js navigation imports remaining in src/ (next-themes stays, it's framework-agnostic)

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize shadcn/ui and copy all components from prototype** - `4e2ac63` (feat)
2. **Task 2: Create hash router, placeholder pages, and port navigation shell** - `a0fb934` (feat)

## Files Created/Modified
- `components.json` - shadcn CLI config for Vite + FSD paths (rsc:false, aliases to @/shared/ui)
- `src/shared/ui/*.tsx` (62 files) - All shadcn/ui components + PF2e atoms with fixed import paths
- `src/shared/hooks/use-mobile.tsx` - Mobile breakpoint detection hook (moved from ui/)
- `src/shared/hooks/use-toast.ts` - Toast state management hook (moved from ui/)
- `src/app/providers.tsx` - Updated with Toaster from sonner
- `src/app/router.tsx` - Hash router with all 8 page routes as AppShell children
- `src/main.tsx` - Updated to render AppRouter inside AppProviders
- `src/shared/routes/paths.ts` - Route path constants (HOME, COMBAT, BESTIARY, etc.)
- `src/pages/*/index.tsx` (8 files) - Placeholder pages with heading and body text
- `src/widgets/app-shell/ui/AppShell.tsx` - Layout shell with Outlet, sidebar, header, command palette
- `src/widgets/app-shell/ui/AppSidebar.tsx` - Collapsible sidebar with React Router navigation
- `src/widgets/app-shell/ui/AppHeader.tsx` - Header with dark/light theme toggle
- `src/widgets/app-shell/ui/CommandPalette.tsx` - Ctrl+K command palette with page navigation
- `src/widgets/app-shell/index.ts` - Widget barrel export

## Decisions Made
- **Hooks moved to shared/hooks/**: `use-mobile.tsx` and `use-toast.ts` are hooks, not UI components, so moved to `src/shared/hooks/` for FSD convention. The sidebar and toaster already imported from `@/hooks/` which was remapped to `@/shared/hooks/`.
- **PF2e mock data replaced with local type stubs**: `creature-card.tsx`, `creature-stat-block.tsx`, and `xp-budget-bar.tsx` imported from `@/lib/pf2e-data`. Replaced with inline type interfaces (Creature, ActionCost, Rarity, Size) and stub XP threshold functions. Real data wired in Phase 7+.
- **Ctrl+K instead of Cmd+K**: Sidebar search hint shows "Ctrl+K" since PathBuddy is a Windows/Tauri desktop app, not macOS.
- **AppHeader simplified**: Removed campaign selector dropdown and sync status indicator from prototype. Phase 5 header shows only the theme toggle.
- **CommandPalette simplified**: Removed creature/spell/item/condition search groups that depended on mock data. Pages-only group for Phase 5.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed single-quote 'use client' directives not removed by initial sed pass**
- **Found during:** Task 1 (bulk edit step)
- **Issue:** Initial sed removed `"use client"` (double quotes) but 40+ files used `'use client'` (single quotes)
- **Fix:** Ran second pass targeting single-quote variant
- **Files modified:** 40 files in src/shared/ui/
- **Verification:** grep confirms zero 'use client' directives remaining
- **Committed in:** 4e2ac63 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Moved hook files to src/shared/hooks/ for FSD compliance**
- **Found during:** Task 1 (import path review)
- **Issue:** `use-mobile.tsx` and `use-toast.ts` were copied to `src/shared/ui/` but sidebar.tsx and toaster.tsx import from `@/shared/hooks/`, creating broken imports
- **Fix:** Created `src/shared/hooks/` directory and moved both hook files there
- **Files modified:** src/shared/hooks/use-mobile.tsx, src/shared/hooks/use-toast.ts (moved)
- **Verification:** TypeScript compiles cleanly, imports resolve
- **Committed in:** 4e2ac63 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed PF2e component type mismatches (Rarity, Size, ActionCost)**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** Local Creature stub used `string` for rarity/size and `number` for actionCost, but TraitList/ActionIcon expect union literal types (`Rarity`, `Size`, `ActionCost`)
- **Fix:** Updated Creature stub interfaces to use matching literal union types
- **Files modified:** src/shared/ui/creature-card.tsx, src/shared/ui/creature-stat-block.tsx
- **Verification:** TypeScript compiles with zero errors
- **Committed in:** 4e2ac63 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correct compilation. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## Known Stubs
- `src/shared/ui/creature-card.tsx` (line 9-20): Local `Creature` interface stub replacing `@/lib/pf2e-data` import. Will be replaced with real engine type in Phase 7+.
- `src/shared/ui/creature-stat-block.tsx` (line 14-37): Local `Creature` interface stub with full stat block fields. Will be replaced with real engine type in Phase 7+.
- `src/shared/ui/xp-budget-bar.tsx` (line 6-24): Local `getXPThresholds()` and `getThreatLevel()` stub functions. Will be replaced with real engine encounter module imports in Phase 7+.
- `src/pages/*/index.tsx` (8 files): Placeholder pages showing heading and body text only. Content added in Phases 8-10.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 64 shadcn/ui components importable for future phases
- Hash router functional with 8 navigable pages
- AppShell chrome ready for feature page content
- FSD structure established: pages/, widgets/, shared/ layers in use
- TypeScript compiles with zero errors
- Ready for Plan 03 (remaining Phase 5 cleanup/teardown tasks)

## Self-Check: PASSED

All 20 key files verified present. Both task commits (4e2ac63, a0fb934) verified in git log. SUMMARY.md created.

---
*Phase: 05-vite-scaffold-nextjs-teardown*
*Completed: 2026-03-31*
