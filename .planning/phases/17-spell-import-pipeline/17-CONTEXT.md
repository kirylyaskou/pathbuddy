# Phase 17: Spell Import Pipeline - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Create typed `spells`, `creature_spellcasting_entries`, and `creature_prepared_spells` SQLite tables. Populate `spells` by parsing `type='spell'` rows from the existing `entities` table (raw_json). Populate spellcasting tables by scanning NPC creature raw_json for `spellcastingEntry` and `spell` items. All indexing runs in TypeScript after every `syncFoundryData()` call. No new Rust code.

Requirements: SPLI-01, SPLI-02, SPLI-03

</domain>

<decisions>
## Implementation Decisions

### Spell data source
- **D-01:** Extract spells from the existing `entities` table — `SELECT * FROM entities WHERE type = 'spell'` returns all spell entities (regular, focus, and rituals) already imported from the GitHub ZIP. Parse their `raw_json` to populate the typed `spells` table. No re-sync from local refs/ and no new Rust command.

### Sync trigger
- **D-02:** Spell indexing runs automatically at the end of every `syncFoundryData()` call in `shared/api/sync.ts` — after `batchInsertEntities()` completes, call `buildSpellsIndex()` and `buildCreatureSpellcasting()`. No separate sync button or manual trigger needed.

### Spell type scope
- **D-03:** Include all three spell types: regular spells (~1,139), focus spells (~507), and rituals (~150) — total ~1,796 rows. All have `type='spell'` in the entities table; differentiate by `source_pack` column (e.g., `spells-srd` = regular, focus-related packs = focus, `rituals` = ritual). Store `spell_type` column in the `spells` table.

### Creature spellcasting parse
- **D-04:** Full scan at sync time — after spell indexing, iterate all `type='npc'` entities from the `entities` table, parse `raw_json`, find `items[]` where `type == 'spellcastingEntry'` and `type == 'spell'`, insert into `creature_spellcasting_entries` and `creature_prepared_spells`. DELETE + re-INSERT on every sync (same pattern as `batchInsertEntities`).

### Implementation location
- **D-05:** All parsing in TypeScript frontend. Functions: `buildSpellsIndex()` and `buildCreatureSpellcasting()` in `src/shared/api/spells.ts` (new file). Called from `syncFoundryData()` in `sync.ts`. Uses `getDb()` for all SQL.

### Claude's Discretion
- Exact `spells` table schema column types and indexes (FTS5 on spells is a good idea for Phase 18 search)
- Whether to store `raw_json` blob in `spells` table (recommended for future extensibility, same pattern as entities)
- Batch size for spell indexing (BATCH_SIZE=500 from existing pattern)
- How to differentiate spell_type from source_pack (inspect actual pack names in entities after sync)
- Whether to link `creature_prepared_spells.spell_foundry_id` FK to `spells.id` (use `_stats.compendiumSource` last segment for the FK, fall back to spell name if source missing)
- Progress reporting during indexing (reuse `onProgress` callback pattern)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — SPLI-01, SPLI-02, SPLI-03 acceptance criteria (exact field list for `spells` table, spellcasting entry fields, prepared spell link fields)
- `.planning/ROADMAP.md` §Phase 17 — Success criteria including Death Tower Necromancer verification query

### Existing sync pipeline (primary integration point)
- `src/shared/api/sync.ts` — `syncFoundryData()` and `batchInsertEntities()` — new functions attach at end of this flow; `importLocalPacks` pattern also shows local Rust command usage
- `src/shared/api/db.ts` — `getDb()`, `setSyncMetadata()` — same patterns for spell indexing

### Existing DB schema (migration baseline)
- `src/shared/db/migrations/0001_entities.sql` — `entities` table schema; `raw_json` column is the spell data source
- `src/shared/db/migrations/0008_encounter_persistence.sql` — Most recent migration; new spell migration is `0009_spells.sql`
- `src/shared/db/migrate.ts` — Migration runner pattern (`import.meta.glob` for migration files)

### Foundry VTT spell JSON format (data reference)
- `refs/pf2e/spells/spells/rank-1/acidic-burst.json` — Sample spell with `damage`, `defense.save`, `traits.traditions`, `area`, `time` (action_cost), `level.value` (rank), `publication.title` (source_book)
- `refs/pf2e/spells/spells/rank-1/500-toads.json` — Sample spell with empty `damage {}`, null `defense` — representative of non-damage spells

### Foundry VTT creature spellcasting format (data reference)
- `refs/pf2e/abomination-vaults-bestiary/abomination-vaults-hardcover-compilation/beluthus.json` — Creature with `type:'spellcastingEntry'` item (tradition, cast_type via `prepared.value`, spelldc, entry `_id`) and `type:'spell'` items with `system.location.value` linking to entry + `_stats.compendiumSource` linking to global spell foundry_id

### IPC boundary
- `src/shared/api/index.ts` — Barrel export; new `spells.ts` module must be exported here

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `batchInsertEntities()` in `sync.ts` — DELETE + batch INSERT pattern with `BATCH_SIZE=500`; replicate for `buildSpellsIndex()` (DELETE spells, batch INSERT from entities WHERE type='spell') and `buildCreatureSpellcasting()` (DELETE creature_spellcasting_entries + creature_prepared_spells, re-scan all NPC raw_json)
- `onProgress` callback pattern in `syncFoundryData()` — reuse for reporting "Indexing spells (N/M)..." progress to the Settings sync UI
- `getDb()` + `db.execute()` + `db.select()` — all SQL goes through these, same for spell functions

### Established Patterns
- `shared/api/` is the sole IPC boundary — all `getDb()` calls in `spells.ts`
- New migration file: `0009_spells.sql` — follows existing numbering; loaded automatically by `migrate.ts` via `import.meta.glob`
- `DELETE + re-INSERT` (not UPSERT) for sync-time table rebuilds — matches existing combat/encounter persistence pattern

### Integration Points
- `syncFoundryData()` in `sync.ts` — call `buildSpellsIndex(onProgress)` and `buildCreatureSpellcasting(onProgress)` after `batchInsertEntities()` returns
- `setSyncMetadata('spell_count', String(count))` — store spell count in sync_metadata for the Settings page display
- `src/shared/api/index.ts` — export new `spells.ts` functions

</code_context>

<deferred>
## Deferred Ideas

- FTS5 index on `spells` table — highly recommended but Phase 18 search will define the exact columns; can be added in Phase 18 migration
- Spontaneous spell slot count inference from spellcasting entry `slots` field — required for Phase 19 slot tracking, not Phase 17
- Class-based slot progression tables (deferred per REQUIREMENTS.md future requirements)
- Ritual spell special handling (no slots, different cast requirements) — Phase 19 concern

</deferred>

---

*Phase: 17-spell-import-pipeline*
*Context gathered: 2026-04-02*
