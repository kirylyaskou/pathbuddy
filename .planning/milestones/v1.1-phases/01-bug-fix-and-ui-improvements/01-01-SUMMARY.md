---
phase: 01-bug-fix-and-ui-improvements
plan: 01
subsystem: ui
tags: [tauri, tailwind, vue-router, dark-theme, sidebar]

requires: []

provides:
  - "Tauri HTTP scope fix: https://** allowlist unblocks frontend fetch to api.github.com"
  - "Dark fantasy Tailwind design tokens: charcoal, gold, crimson color scales, Cinzel font family, gold-glow and card box shadows"
  - "Cinzel Google Fonts CDN loaded via preconnect + stylesheet links in index.html"
  - "AppLayout component: flex h-screen sidebar + RouterView shell replacing bare RouterView"
  - "AppSidebar component: persistent 180px left nav with Pathbuddy brand, Combat Tracker and Sync Data links, gold active state"
  - "App.vue updated to render AppLayout after splash instead of bare RouterView"
  - "Router updated: '/' redirects to '/combat', '/sync' route added, DashboardView removed"
  - "SyncView full-page dark fantasy sync experience at /sync with all SyncButton logic ported"

affects: [01-02, 01-03, 01-04]

tech-stack:
  added: []
  patterns:
    - "Tauri 2 HTTP scope: object form { identifier, allow: [{ url }] } not bare string"
    - "Tailwind v3 theme.extend with custom charcoal/gold/crimson color scales"
    - "AppLayout wrapper pattern: AppSidebar + <main class=flex-1 overflow-y-auto> with RouterView"
    - "RouterLink active-class prop for gold sidebar active state"
    - "SyncView ported from SyncButton — same script logic, new dark-themed template"

key-files:
  created:
    - src/components/AppLayout.vue
    - src/components/AppSidebar.vue
    - src/views/SyncView.vue
  modified:
    - src-tauri/capabilities/default.json
    - tailwind.config.js
    - index.html
    - src/App.vue
    - src/router/index.ts

key-decisions:
  - "http:default permission replaced with object form { identifier, allow: [{ url: 'https://**' }] } — bare string enables commands but provides no URL scope enforcement"
  - "AppLayout introduced as a separate component (not inlined in App.vue) to keep App.vue minimal and allow future layout variants"
  - "RouterLink active-class used per-link rather than global router config — each nav item needs the full set of active classes (border + text + bg)"
  - "'/' route now redirects to '/combat' — DashboardView removed as sidebar nav replaces it"
  - "SyncView keeps identical script logic to SyncButton; only the template and visual classes differ — no behavioral regressions"

patterns-established:
  - "Splash-before-layout: App.vue renders SplashScreen v-if showSplash, AppLayout v-else — pattern preserved from v1.0"
  - "Sidebar layout: w-[180px] flex-shrink-0 aside + flex-1 overflow-y-auto main — all route content scrolls within main"

requirements-completed: []

duration: 3min
completed: 2026-03-20
---

# Phase 01 Plan 01: HTTP Scope Fix + App Shell + Dark Theme Foundation Summary

**Tauri HTTP scope unblocked, dark fantasy Tailwind tokens established, persistent sidebar shell with AppLayout/AppSidebar, router restructured with /sync route, SyncView full-page dark theme experience**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T14:51:06Z
- **Completed:** 2026-03-20T14:54:00Z
- **Tasks:** 2
- **Files modified:** 8 (3 created, 5 modified)

## Accomplishments

- Fixed Tauri HTTP scope bug that blocked data sync: replaced bare `"http:default"` string with object form including `allow: [{ url: "https://**" }]`
- Established complete dark fantasy Tailwind design system: charcoal (950–500), gold (DEFAULT/light/dark/muted/glow), crimson (DEFAULT/light/dark/muted), Cinzel display font, gold-glow and card box shadows
- Built persistent app shell: AppLayout + AppSidebar replaces bare RouterView, sidebar always visible after splash with Combat Tracker and Sync Data nav items
- Restructured router: '/' redirects to '/combat', '/sync' route added, DashboardView removed
- Created SyncView full-page dark fantasy sync experience, porting all reactive state, computed, and async logic from SyncButton

## Task Commits

Each task was committed atomically:

1. **Task 1: HTTP scope fix + design system foundation + Google Font** - `ff25814` (feat)
2. **Task 2: App shell — AppLayout, AppSidebar, routing, SyncView** - `6b76565` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `src-tauri/capabilities/default.json` - http:default permission now object form with https://** scope
- `tailwind.config.js` - dark fantasy design tokens: charcoal, gold, crimson, Cinzel font, shadows
- `index.html` - Cinzel Google Fonts CDN preconnect and stylesheet links added to head
- `src/components/AppLayout.vue` (created) - flex h-screen wrapper: AppSidebar + main with RouterView
- `src/components/AppSidebar.vue` (created) - 180px persistent left nav with brand, nav items, version footer
- `src/App.vue` - AppLayout import added, RouterView v-else replaced with AppLayout v-else
- `src/router/index.ts` - DashboardView removed, '/' redirect, '/sync' route with SyncView added
- `src/views/SyncView.vue` (created) - full-page sync view at /sync with dark fantasy theme

## Decisions Made

- Used object form for `http:default` permission (not a separate scope entry) — required format per Tauri 2 docs
- RouterLink `active-class` prop applied per-link (not global router config) — full set of classes (border + text + bg) needed per link
- AppLayout as a separate component (not inlined in App.vue) — keeps App.vue focused on splash logic only
- '/' route redirects to '/combat' rather than showing an empty dashboard — sidebar nav replaces dashboard purpose

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — test suite remained fully green (156/156) throughout execution.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- App shell is fully operational: sidebar nav works, /combat and /sync routes render
- Dark fantasy design tokens are active in Tailwind — all subsequent plans can use charcoal/gold/crimson classes
- HTTP fetch to api.github.com is unblocked — Sync Data button should function once tested in Tauri dev build
- Ready for Plan 02: Combat Tracker redesign (uses AppLayout shell + dark theme tokens established here)

## Self-Check: PASSED

All 8 files confirmed on disk. Both task commits (ff25814, 6b76565) confirmed in git log.

---
*Phase: 01-bug-fix-and-ui-improvements*
*Completed: 2026-03-20*
