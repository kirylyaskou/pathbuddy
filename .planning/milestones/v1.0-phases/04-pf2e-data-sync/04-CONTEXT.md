# Phase 4: PF2e Data Sync - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement data sync from foundryvtt/pf2e GitHub releases into SQLite. Download release ZIP via HTTP (no git dependency), extract packs/pf2e/**/*.json, upsert 28K+ entities with content-hash change detection, and remove entities deleted from upstream. This is backend/data pipeline only -- Sync UI is Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Entity validation
- Skip malformed entities silently -- Foundry's repo is well-maintained, broken files are rare
- If JSON parse fails or required fields missing, skip the file and continue importing the rest
- Required fields for a valid entity: `_id`, `name`, `type` (the standard Foundry document triple)
- No need to require `system` object -- it varies by entity type and some valid entities may lack it

### File filtering
- Filename prefix filter: skip files starting with `_` (e.g., `_folders.json`)
- This is separate from entity field validation -- filter first by filename, then validate required fields on parsed JSON

### Content hashing
- Hash raw file bytes (not normalized JSON)
- Simpler and faster; any upstream change triggers re-import
- Foundry doesn't do formatting-only changes in practice, so raw bytes are sufficient

### Claude's Discretion
- Sync pipeline architecture (Rust commands vs TS orchestration boundary)
- Batch processing size and strategy
- Sync failure/rollback behavior
- Error handling patterns
- SHA-256 implementation approach (Rust-side vs Web Crypto)
- Temp directory management and cleanup
- Pack name extraction logic

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Implementation reference
- `plans/plan.txt` -- Detailed PF2e Data Sync implementation plan (Phase 2 section) with complete sync algorithm, Rust commands, TypeScript sync service, and batch processing. Originally for React -- adapt to Vue 3.

### Phase requirements
- `.planning/ROADMAP.md` -- Phase 4 requirements (SYNC-01 through SYNC-04), key decisions, success criteria
- `.planning/REQUIREMENTS.md` -- Full requirement specifications for SYNC-01 through SYNC-04

### Schema and database
- `src/lib/schema.ts` -- Drizzle schema with pf2eEntities, syncState tables already defined
- `src/lib/database.ts` -- Drizzle sqlite-proxy bridge already wired
- `src/lib/migrations.ts` -- Migration system already running on startup

### Rust backend
- `src-tauri/src/lib.rs` -- Tauri 2 plugin registration (sql, http, fs already registered)
- `src-tauri/Cargo.toml` -- reqwest and zip crates already in dependencies

### Prior phase context
- `.planning/phases/03-tauri-sqlite-foundation/03-CONTEXT.md` -- Phase 3 decisions (Drizzle sqlite-proxy, migration strategy, plugin setup)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `db` (src/lib/database.ts) -- Drizzle sqlite-proxy instance, ready for insert/select/delete queries
- `pf2eEntities` schema (src/lib/schema.ts) -- Table with sourceId, pack, slug, name, entityType, rawData, contentHash, syncedAt + unique(pack, slug) index
- `syncState` schema (src/lib/schema.ts) -- Table with lastRelease, lastSyncAt, totalEntities
- `getSqlite()` (src/lib/database.ts) -- Raw SQLite instance for direct execute/select when needed

### Established Patterns
- Drizzle ORM generates SQL on frontend, executes via Tauri IPC to Rust backend
- Migrations run as raw SQL strings on app startup (no Drizzle migrate())
- Tauri plugins registered in lib.rs (sql, http, fs)

### Integration Points
- `src-tauri/src/lib.rs` -- Add new Rust commands (download_file, extract_zip, glob_json_files, read_text_file) and register with `.invoke_handler()`
- `src/lib/` -- New sync-service.ts module for sync orchestration
- `@tauri-apps/plugin-http` -- fetch() for GitHub API calls
- `@tauri-apps/api/core` -- invoke() for Rust commands

</code_context>

<specifics>
## Specific Ideas

- plan.txt Phase 2 has a complete sync algorithm with code samples -- use as primary reference and adapt from React to Vue 3/Composition API
- Rust commands are minimal file I/O helpers (download, extract, glob, read) -- sync orchestration stays in TypeScript
- GitHub API: `https://api.github.com/repos/foundryvtt/pf2e/releases/latest` for version check
- ZIP download via `zipball_url` from release response (~50-80 MB)
- Walk `packs/pf2e/**/*.json` inside extracted archive
- UPSERT: `ON CONFLICT(pack, slug) DO UPDATE SET ... WHERE content_hash != excluded.content_hash`
- Deletion: entities in DB but not in imported set get deleted

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 04-pf2e-data-sync*
*Context gathered: 2026-03-19*
