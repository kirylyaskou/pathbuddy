# Phase 03: Tauri + SQLite Foundation - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Create Tauri 2 desktop app with embedded SQLite via tauri-plugin-sql and Drizzle ORM in sqlite-proxy mode. Upgrade existing Tauri v1 project to v2 in-place. Existing Vue 3 combat tracker continues working unchanged. Database schema supports PF2e entity storage and sync state tracking.

</domain>

<decisions>
## Implementation Decisions

### Tauri v1 → v2 migration
- In-place upgrade: update Cargo.toml, main.rs, JS imports to Tauri 2
- Regenerate tauri.conf.json from scratch using Tauri 2 conventions, then re-apply window settings (900x700, resizable, title)
- Install all three plugins now: tauri-plugin-sql (sqlite), tauri-plugin-http, tauri-plugin-fs
- Adapt plan.txt code samples freely from React to Vue 3 + Composition API patterns
- Rust deps: add reqwest and zip alongside Tauri 2 plugin deps

### Database location & lifecycle
- Single SQLite file in standard app data directory (AppData/Roaming on Windows, ~/Library on macOS)
- DB name: pf2e.db (via `sqlite:pf2e.db` in tauri-plugin-sql)
- On corruption or failed migration: delete and recreate pf2e.db (all PF2e data is re-syncable from GitHub)
- Selective recovery: only drop PF2e-synced tables (pf2e_entities, sync_state), preserve user data tables (campaigns)
- Keep `pf2e_` prefix for synced tables as in the original plan

### Migration strategy
- Migration table with version tracking (`_migrations` table tracks applied migrations)
- Each migration has a version number; on startup, run only unapplied migrations
- Raw SQL strings for migrations (Drizzle migrate() doesn't work in WebView)

### Database schema
- Tables from plan.txt: pf2e_entities, sync_state, campaigns
- pf2e_entities: id, source_id, pack, slug, name, entity_type, raw_data, content_hash, synced_at
- Indexes: unique(pack, slug), entity_type, name, source_id
- sync_state: id, last_release, last_sync_at, total_entities
- campaigns: id, name, description, created_at, updated_at

### Combat tracker coexistence
- Combat tracker stays as Pinia in-memory state during runtime (no changes to Phase 1-2 code)
- Combat persistence (Pinia → filesystem JSON files) is a deferred feature for a later phase
- When implemented: creatures saved in full mode (entire creature data embedded, not DB references) so combats survive entity removal after resync

### Startup & initialization flow
- Brief splash/loading screen while DB initializes and migrations run
- After init, land on a minimal dashboard/home screen (not directly on combat tracker)
- Dashboard is a placeholder shell with navigation links to "Combat Tracker" and placeholder for "Sync Data"
- Phase 7 (Sync UI) will flesh out the dashboard

### Routing
- Add vue-router for navigation between dashboard and combat tracker
- Standard URL-based routing supports future views (sync, entity browser, etc.)

### Claude's Discretion
- Exact splash screen design and loading indicator
- Dashboard placeholder layout
- vue-router configuration details
- Drizzle sqlite-proxy implementation details
- Migration table schema design
- Error logging approach for failed migrations

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Implementation reference
- `plans/plan.txt` — Detailed PF2e Data Sync implementation plan with code samples for Drizzle + Tauri integration, schema definitions, and migration SQL. Originally written for React — adapt to Vue 3.

### Phase requirements
- `.planning/ROADMAP.md` — Phase 3 requirements (TAURI-01 through TAURI-04), key decisions, success criteria
- `.planning/REQUIREMENTS.md` — Full requirement specifications for TAURI-01 through TAURI-04

### Existing code
- `src-tauri/Cargo.toml` — Current Tauri v1 Rust dependencies (needs upgrade to v2)
- `src-tauri/tauri.conf.json` — Current Tauri config (regenerate for v2)
- `src-tauri/src/main.rs` — Current minimal Rust backend (needs v2 plugin setup)
- `src/main.ts` — Vue 3 entry point (needs router setup and DB init)
- `package.json` — Current JS deps including @tauri-apps/api v1 (needs v2 upgrade)

### Prior phase context
- `.planning/phases/02-auto-round-processing/02-CONTEXT.md` — Phase 2 decisions (Pinia patterns, Vue 3 composition API)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CombatTracker.vue` — Main combat view component, will become a route target
- `useCombatStore` (src/stores/combat.ts) — Pinia store pattern to follow for any new stores
- Tailwind CSS setup — existing styling system

### Established Patterns
- Pinia stores with composition API (setup stores)
- Vue 3 Composition API with composables
- Vitest for unit testing
- TypeScript throughout

### Integration Points
- `src/main.ts` — Add vue-router and DB initialization before app mount
- `src/App.vue` — Replace direct CombatTracker render with router-view
- `src-tauri/Cargo.toml` — Upgrade to Tauri 2, add plugin deps
- `src-tauri/src/main.rs` — Register Tauri 2 plugins
- `src-tauri/tauri.conf.json` — Regenerate for Tauri 2 with plugin capabilities
- `package.json` — Upgrade @tauri-apps/api to v2, add drizzle-orm, vue-router

</code_context>

<specifics>
## Specific Ideas

- Combat persistence (deferred): Pinia state serialized to filesystem JSON files via tauri-plugin-fs. Creatures saved in full mode so combats survive PF2e data resyncs — if a creature is removed from upstream, the combat still works with its embedded copy.
- Dashboard is intentionally minimal — just navigation scaffolding for now. Real dashboard comes with Sync UI phase.

</specifics>

<deferred>
## Deferred Ideas

- Combat state persistence to filesystem JSON files — separate phase (uses tauri-plugin-fs, Pinia serialization, full creature embedding)
- Dashboard design and layout — Phase 7 (Sync UI) will flesh out the dashboard with sync button, version display, etc.
- Proper home screen with status cards — later when more features exist

</deferred>

---

*Phase: 03-tauri-sqlite-foundation*
*Context gathered: 2026-03-19*
