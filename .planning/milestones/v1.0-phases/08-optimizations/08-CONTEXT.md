# Phase 8: Optimizations - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Performance optimizations for the PF2e data sync pipeline and entity querying: batch SQL imports to replace per-entity INSERTs for 28K+ entities, FTS5 full-text search on entity fields, and generated columns extracted from rawData JSON for fast level/rarity filtering.

</domain>

<decisions>
## Implementation Decisions

### Batch import strategy
- Refactor the existing `syncPacks()` import loop in `src/lib/sync-service.ts` — not a new function
- Replace individual `db.insert().values().onConflictDoUpdate()` calls with multi-row INSERT VALUES using raw SQL
- 500 rows per INSERT statement (matches existing BATCH_SIZE, stays within SQLite variable limits)
- Use INSERT OR REPLACE with content-hash pre-check for batch-compatible upsert conflict resolution
- Keep the existing 500-file transaction batching — the change is inside the loop (one SQL per batch instead of one per entity)

### FTS5 search index
- Create `pf2e_fts` virtual table indexing: name, entity_type, pack
- Do NOT index rawData/description — too raw and JSON-heavy for useful search
- Use `unicode61` tokenizer for proper PF2e special character handling
- Keep FTS in sync via SQLite triggers on INSERT/UPDATE/DELETE of pf2e_entities
- Search API uses Drizzle `sql` template with MATCH operator — consistent with existing ORM usage

### Generated columns for filtering
- Add STORED generated columns to pf2e_entities: `level` (integer) and `rarity` (text)
- Extract via `json_extract(raw_data, '$.system.level.value')` and `json_extract(raw_data, '$.system.traits.rarity')`
- Add indexes: `idx_level` on level, `idx_rarity` on rarity
- These are computed at write time and indexed for fast reads — no runtime JSON parsing needed

### Claude's Discretion
- Exact migration SQL structure and ordering
- Whether to add a composite index on (entity_type, level) for combined filtering
- FTS5 content-sync trigger implementation details
- How to handle entities where level/rarity JSON paths don't exist (NULL vs default)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements are fully captured in decisions above and REQUIREMENTS.md.

### Project requirements
- `.planning/REQUIREMENTS.md` — OPT-01, OPT-02, OPT-03 requirement definitions

### Existing implementation (must read before modifying)
- `src/lib/sync-service.ts` — Current sync pipeline with per-entity INSERT loop (lines 150-240)
- `src/lib/schema.ts` — Drizzle schema for pf2e_entities and syncState tables
- `src/lib/database.ts` — Drizzle sqlite-proxy bridge and getSqlite() accessor
- `src/lib/migrations.ts` — Migration system for schema changes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sync-service.ts` BATCH_SIZE=500 constant and batch loop structure — refactor target for OPT-01
- `database.ts` getSqlite() for raw SQL execution via `sqlite.execute(sql, params)`
- `schema.ts` pf2eEntities table definition — extend with generated columns for OPT-03
- `migrations.ts` — use for DDL changes (FTS5 table, generated columns, triggers)

### Established Patterns
- Drizzle sqlite-proxy: `db` for ORM queries, `getSqlite()` for raw SQL — batch inserts likely need raw SQL path
- Manual BEGIN/COMMIT transaction management in sync-service.ts (lines 155-228)
- Content-hash based change detection for upserts (contentHash column + setWhere clause)
- Index naming: `idx_` prefix (idx_entity_type, idx_name, idx_source_id)

### Integration Points
- `syncPacks()` is the sole import entry point — called by SyncButton.vue
- `pf2eEntities` table is queried by creature-resolver.ts for cross-reference lookups
- Schema changes require new migration in migrations.ts
- FTS5 search will need a new query function exported from a service file (or sync-service.ts)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The key constraint is that all optimizations must work within the existing Drizzle sqlite-proxy architecture and Tauri IPC boundary.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-optimizations*
*Context gathered: 2026-03-20*
