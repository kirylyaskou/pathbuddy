# Phase 7: Sync UI - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning
**Source:** Auto-discussed (recommended defaults selected)

<domain>
## Phase Boundary

Vue sync button component with progress stages, progress bar, and version display. Replaces the disabled "Sync Data" placeholder tile on the dashboard with a live, interactive sync component. No new routes, no data model changes -- wires into the existing `syncPacks()` pipeline from Phase 4 and reads `syncState` from the database.

</domain>

<decisions>
## Implementation Decisions

### Sync component placement & layout
- Replace the disabled "Sync Data" tile on DashboardView with a live `SyncButton.vue` component
- SyncButton.vue is a standalone component in `src/components/` -- reusable outside the dashboard
- Tile expands inline to show progress during sync (no modal, no separate page)
- Combat Tracker tile remains alongside in the existing grid layout
- DashboardView imports and renders SyncButton in place of the static tile

### Progress visualization
- Stage indicator shows current stage name as text label (e.g., "Downloading...", "Importing: 1200 / 28000")
- Horizontal progress bar below the stage text
- Progress bar is determinate during `importing` stage (uses `current`/`total` from SyncProgress), indeterminate (animated) for all other stages (checking, downloading, extracting, cleanup)
- Completed stages show checkmarks in a simple vertical list (pipeline visualization)
- Minimal transitions -- text swaps, no complex animations

### Version & status display
- Current PF2e version shown within the sync tile: release tag, last synced date, entity count
- All three values read from `syncState` table on mount
- "Never synced" state shows a prompt text encouraging first sync (e.g., "No PF2e data yet -- sync to get started")
- After successful sync: show brief result summary (added/updated/deleted counts) then settle to updated version display

### Error handling UX
- Sync errors display inline within the tile (no modal or error page)
- Error message shows by default; full error details collapsed/expandable for debugging
- Retry button appears on error, allowing user to retry without navigating
- Sync button is disabled during active sync to prevent double-triggers

### Claude's Discretion
- Exact Tailwind styling and color palette for progress states
- Stage checkmark icon choice (unicode vs SVG)
- How long to show result summary before settling to version display
- Error categorization (network vs data errors) -- implementation detail
- Whether to use a Pinia store for sync state or keep it local to the component

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Implementation reference
- `plans/plan.txt` -- Contains original sync UI implementation (React-based); adapt patterns to Vue 3

### Phase requirements
- `.planning/ROADMAP.md` -- Phase 7 requirements (SYNCUI-01 through SYNCUI-03), key decisions, success criteria
- `.planning/REQUIREMENTS.md` -- Full requirement specifications for SYNCUI-01, SYNCUI-02, SYNCUI-03

### Existing sync pipeline
- `src/lib/sync-service.ts` -- `syncPacks(onProgress)` function with `SyncProgress` and `SyncResult` types; this is the backend being wired to UI
- `src/lib/schema.ts` -- `syncState` table (lastRelease, lastSyncAt, totalEntities) and `pf2eEntities` table

### Current dashboard
- `src/views/DashboardView.vue` -- Placeholder dashboard with disabled "Sync Data" tile (lines 22-30) that gets replaced
- `src/App.vue` -- SplashScreen → RouterView pattern, DB initialization flow

### Prior phase context
- `.planning/phases/03-tauri-sqlite-foundation/03-CONTEXT.md` -- Phase 3 decisions: dashboard is placeholder, "Phase 7 will flesh it out"
- `.planning/phases/04-pf2e-data-sync/04-CONTEXT.md` -- Phase 4 decisions: sync pipeline architecture, sync-service.ts as TS orchestration layer

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `syncPacks(onProgress)` (src/lib/sync-service.ts) -- Complete sync pipeline; accepts `SyncProgress` callback. SyncButton just needs to call it and render the progress.
- `SyncProgress` type -- `{ stage, message, current?, total? }` with 6 stages: checking, downloading, extracting, importing, cleanup, done
- `SyncResult` type -- `{ added, updated, deleted, release }` returned after sync completes
- `syncState` schema (src/lib/schema.ts) -- DB table with lastRelease, lastSyncAt, totalEntities for version display
- `db` (src/lib/database.ts) -- Drizzle sqlite-proxy instance for querying syncState

### Established Patterns
- Vue 3 Composition API with `<script setup>` -- all components use this
- Pinia stores with setup function pattern -- combat, creatureDetail stores
- Tailwind CSS for all styling -- utility classes, no custom CSS files
- `v-if` / `v-else` for conditional rendering (splash screen pattern in App.vue)
- Grid layout with `grid-cols-1 sm:grid-cols-2` on dashboard

### Integration Points
- `src/views/DashboardView.vue` -- Replace static "Sync Data" div with `<SyncButton />` component
- `src/components/` -- New SyncButton.vue component
- `src/lib/sync-service.ts` -- Import and call `syncPacks()` from SyncButton

</code_context>

<specifics>
## Specific Ideas

- The sync tile should feel like a status card -- shows current state at a glance, actionable button, progress when active
- Phase 3 explicitly deferred dashboard design to this phase -- the dashboard can be enhanced but stays a simple tile grid
- syncPacks() already emits granular progress; the UI just needs to visualize what's already there
- The "importing" stage is the longest (28K+ entities) -- that's where the determinate progress bar matters most

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 07-sync-ui*
*Context gathered: 2026-03-20 via auto-discussion*
