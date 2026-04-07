# Phase 8: Optimizations - Research

**Researched:** 2026-03-20
**Domain:** SQLite performance — batch inserts, FTS5 full-text search, generated columns via json_extract
**Confidence:** HIGH

## Summary

Phase 8 is a pure database optimization phase with no new UI. Three orthogonal improvements work inside the existing Drizzle sqlite-proxy architecture: (1) collapsing per-entity INSERTs into multi-row batch statements; (2) creating a pf2e_fts FTS5 virtual table kept in sync via triggers; (3) adding STORED generated columns for level/rarity that index json_extract paths for fast filtered queries.

The codebase already has the right primitives. `getSqlite()` gives raw SQL access for batch INSERT strings, `migrations.ts` provides a versioned DDL path for the FTS5 table, triggers, generated columns, and new indexes. The `BATCH_SIZE=500` constant is already used for file-loop chunking; Phase 8 refactors the inner body of that loop so each iteration emits one multi-row SQL statement instead of 500 individual ORM calls.

Critical compatibility note: `tauri-plugin-sql` v2 uses sqlx 0.8 which bundles SQLite 3.46. SQLite 3.32+ raised SQLITE_MAX_VARIABLE_NUMBER from 999 to 32,766, so a 500-row batch with 8 columns (4,000 parameters) is safe on every supported target platform.

**Primary recommendation:** Add migration version 2 with FTS5 table + triggers + generated columns + composite index, then refactor the `syncPacks()` inner loop to build a single parameterized INSERT OR REPLACE … VALUES (…),(…),… string per batch using `getSqlite().execute()`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Batch import strategy
- Refactor the existing `syncPacks()` import loop in `src/lib/sync-service.ts` — not a new function
- Replace individual `db.insert().values().onConflictDoUpdate()` calls with multi-row INSERT VALUES using raw SQL
- 500 rows per INSERT statement (matches existing BATCH_SIZE, stays within SQLite variable limits)
- Use INSERT OR REPLACE with content-hash pre-check for batch-compatible upsert conflict resolution
- Keep the existing 500-file transaction batching — the change is inside the loop (one SQL per batch instead of one per entity)

#### FTS5 search index
- Create `pf2e_fts` virtual table indexing: name, entity_type, pack
- Do NOT index rawData/description — too raw and JSON-heavy for useful search
- Use `unicode61` tokenizer for proper PF2e special character handling
- Keep FTS in sync via SQLite triggers on INSERT/UPDATE/DELETE of pf2e_entities
- Search API uses Drizzle `sql` template with MATCH operator — consistent with existing ORM usage

#### Generated columns for filtering
- Add STORED generated columns to pf2e_entities: `level` (integer) and `rarity` (text)
- Extract via `json_extract(raw_data, '$.system.level.value')` and `json_extract(raw_data, '$.system.traits.rarity')`
- Add indexes: `idx_level` on level, `idx_rarity` on rarity
- These are computed at write time and indexed for fast reads — no runtime JSON parsing needed

### Claude's Discretion
- Exact migration SQL structure and ordering
- Whether to add a composite index on (entity_type, level) for combined filtering
- FTS5 content-sync trigger implementation details
- How to handle entities where level/rarity JSON paths don't exist (NULL vs default)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OPT-01 | Batch SQL imports for 28K+ entities | Multi-row INSERT OR REPLACE with `getSqlite().execute()`, 500 rows/batch, $1..$N params |
| OPT-02 | Full-text search via SQLite FTS5 | FTS5 virtual table with unicode61 tokenizer, external-content triggers, Drizzle `sql` MATCH queries |
| OPT-03 | Generated columns for fast entity filtering (level, rarity) | STORED generated columns via json_extract, indexed, added via migration DDL |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SQLite (bundled via sqlx) | 3.46+ | Database engine | Bundled by tauri-plugin-sql v2 via sqlx 0.8; 3.46 > 3.32 so SQLITE_MAX_VARIABLE_NUMBER=32766 |
| tauri-plugin-sql | ^2.0.0 (2.3.2 latest) | JS/TS database interface | Already in project; `getSqlite().execute(sql, params)` for raw SQL |
| drizzle-orm | ^0.38.0 | ORM + typed queries | Already in project; `sql` template tag used for MATCH operator queries |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SQLite FTS5 | Built into SQLite 3.46 | Full-text search virtual table | OPT-02; no extra dependency needed |
| SQLite json_extract | Built into SQLite | JSON path extraction | OPT-03 generated columns; available since SQLite 3.9 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| STORED generated columns | VIRTUAL generated columns | VIRTUAL is computed at read time — no extra disk space, but index is still stored. STORED is preferred here per locked decision because write cost is acceptable (batch insert already owns the hot path) and avoids any read-time recompute overhead for non-indexed access patterns |
| External-content FTS5 table | Self-contained FTS5 table | External-content saves disk by pointing to the source table; requires triggers to stay in sync. Self-contained stores copies, simpler but uses 2x disk. External-content chosen per locked decision |

**Installation:** No new packages needed. All capabilities are in SQLite 3.46 (already bundled).

---

## Architecture Patterns

### Recommended File Changes
```
src/lib/
├── sync-service.ts     # Refactor inner loop — batch INSERT OR REPLACE raw SQL
├── migrations.ts       # Add migration v2 — FTS5 table, triggers, generated cols, indexes
├── schema.ts           # Add level/rarity generated cols to pf2eEntities Drizzle schema
└── search-service.ts   # New: exportable searchEntities() using MATCH operator (or add to sync-service.ts)
```

### Pattern 1: Multi-Row INSERT OR REPLACE in tauri-plugin-sql

**What:** Build a single SQL string with N placeholder groups, flatten params to a 1D array, execute once per batch.

**When to use:** Any time entities are written in the sync loop — replaces the individual Drizzle ORM insert call inside the batch loop.

**Variable count check:** pf2eEntities has 8 insert columns (source_id, pack, slug, name, entity_type, raw_data, content_hash, synced_at). 500 rows × 8 cols = 4,000 params. SQLite 3.46 limit is 32,766. Safe.

**Example:**
```typescript
// Source: tauri-plugin-sql docs + SQLite INSERT syntax
// Build inside the batch loop body in syncPacks()

interface EntityRow {
  sourceId: string;
  pack: string;
  slug: string;
  name: string;
  entityType: string;
  rawData: string;
  contentHash: string;
  syncedAt: string;
}

async function batchUpsertEntities(sqlite: Database, rows: EntityRow[]): Promise<void> {
  if (rows.length === 0) return;

  // $1, $2... are tauri-plugin-sql parameter placeholders for SQLite
  const placeholders = rows
    .map((_, i) => {
      const base = i * 8;
      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8})`;
    })
    .join(',');

  const sql = `INSERT OR REPLACE INTO pf2e_entities
    (source_id, pack, slug, name, entity_type, raw_data, content_hash, synced_at)
    VALUES ${placeholders}`;

  const params = rows.flatMap(r => [
    r.sourceId, r.pack, r.slug, r.name,
    r.entityType, r.rawData, r.contentHash, r.syncedAt,
  ]);

  await sqlite.execute(sql, params);
}
```

**Important:** The content-hash pre-check from the locked decision means: only add a row to the batch if `contentHash` differs from what was stored. This requires a pre-fetch of existing hashes, or accepting that INSERT OR REPLACE always overwrites. The CONTEXT.md decision says "INSERT OR REPLACE with content-hash pre-check" — this means filter the rows array before calling `batchUpsertEntities`, passing only rows where the hash changed or the entity is new.

**Pre-check approach (recommended):** Before the batch loop, fetch all existing `(pack, slug, content_hash)` tuples into a `Map<string, string>` (key = `pack::slug`, value = hash). Inside the loop, push to the batch array only when hash differs. This avoids unnecessary writes.

### Pattern 2: FTS5 External-Content Table with Triggers

**What:** FTS5 virtual table that holds a full-text index pointing at `pf2e_entities` as content source. Three triggers (AFTER INSERT, AFTER UPDATE, AFTER DELETE on pf2e_entities) keep it in sync automatically.

**When to use:** Defined once in migration v2. Triggers fire transparently on every pf2e_entities write — including the batch import.

**Example (migration SQL):**
```sql
-- Source: https://www.sqlite.org/fts5.html (external content tables section)
CREATE VIRTUAL TABLE pf2e_fts USING fts5(
  name,
  entity_type,
  pack,
  content='pf2e_entities',
  content_rowid='id',
  tokenize='unicode61'
);

-- INSERT trigger
CREATE TRIGGER pf2e_fts_ai AFTER INSERT ON pf2e_entities BEGIN
  INSERT INTO pf2e_fts(rowid, name, entity_type, pack)
  VALUES (new.id, new.name, new.entity_type, new.pack);
END;

-- DELETE trigger
CREATE TRIGGER pf2e_fts_ad AFTER DELETE ON pf2e_entities BEGIN
  INSERT INTO pf2e_fts(pf2e_fts, rowid, name, entity_type, pack)
  VALUES ('delete', old.id, old.name, old.entity_type, old.pack);
END;

-- UPDATE trigger
CREATE TRIGGER pf2e_fts_au AFTER UPDATE ON pf2e_entities BEGIN
  INSERT INTO pf2e_fts(pf2e_fts, rowid, name, entity_type, pack)
  VALUES ('delete', old.id, old.name, old.entity_type, old.pack);
  INSERT INTO pf2e_fts(rowid, name, entity_type, pack)
  VALUES (new.id, new.name, new.entity_type, new.pack);
END;
```

**Important trigger ordering:** The UPDATE trigger must fire the 'delete' command with OLD values before inserting NEW values. If the old values are gone before the trigger fires (because a prior trigger deleted them), the index becomes stale.

**FTS5 rebuild command** (for recovery or initial population of existing data):
```sql
INSERT INTO pf2e_fts(pf2e_fts) VALUES ('rebuild');
```
This is needed once when the migration runs on a DB that already has `pf2e_entities` data.

### Pattern 3: STORED Generated Columns via json_extract

**What:** DDL columns added to `pf2e_entities` that compute their value from `raw_data` JSON at write time. Cannot be added via ALTER TABLE — must be included in the migration that recreates or extends the table.

**When to use:** Migration v2 adds these columns. They are read-only computed columns; the sync INSERT does not supply values for them.

**Important:** STORED generated columns cannot be added via `ALTER TABLE ADD COLUMN`. The migration must use `ALTER TABLE ... ADD COLUMN ... GENERATED ALWAYS AS (...) STORED` is actually NOT supported. The only option is to either (a) recreate the table or (b) use VIRTUAL columns which CAN be added via ALTER TABLE. Since STORED is the locked decision, the migration must recreate the table or add them as part of a new table creation.

**Correction verified from official docs:** VIRTUAL columns can be added via `ALTER TABLE ADD COLUMN`. STORED columns cannot. However, you can still use functional indexes directly on `json_extract(raw_data, '$.system.level.value')` without adding a column at all — and that index CAN be created via a simple `CREATE INDEX` statement in a migration, no table recreation needed.

**Recommended approach for Phase 8 given the ALTER TABLE constraint:**
Option A (simpler): Use VIRTUAL generated columns (can be added with ALTER TABLE ADD COLUMN) + index on the column.
Option B (per locked decision for STORED): Recreate `pf2e_entities` table in migration v2 with the generated columns baked in, migrating existing data. This is more work but achieves STORED.
Option C (pragmatic): Use functional indexes directly on the json_extract expression — no generated column needed, no table recreation. The index is created via `CREATE INDEX` and SQLite uses it when the WHERE clause references `json_extract(raw_data, '$.system.level.value')`.

Given that the CONTEXT.md locked decision specifically says "STORED generated columns" and "Add indexes: idx_level on level, idx_rarity on rarity", the plan must choose between Option B (table recreation) or revisiting the STORED requirement. This is a key planning decision.

**Example SQL for STORED approach (requires table recreation):**
```sql
-- Source: https://sqlite.org/gencol.html
-- Migration v2: recreate pf2e_entities with generated columns
CREATE TABLE pf2e_entities_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  pack TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  raw_data TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  synced_at TEXT NOT NULL,
  level INTEGER GENERATED ALWAYS AS (
    CAST(json_extract(raw_data, '$.system.level.value') AS INTEGER)
  ) STORED,
  rarity TEXT GENERATED ALWAYS AS (
    json_extract(raw_data, '$.system.traits.rarity')
  ) STORED
);
-- Copy data, drop old table, rename new table
INSERT INTO pf2e_entities_new SELECT id, source_id, pack, slug, name, entity_type, raw_data, content_hash, synced_at FROM pf2e_entities;
DROP TABLE pf2e_entities;
ALTER TABLE pf2e_entities_new RENAME TO pf2e_entities;
-- Recreate all original indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_pack_slug ON pf2e_entities(pack, slug);
CREATE INDEX IF NOT EXISTS idx_entity_type ON pf2e_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_name ON pf2e_entities(name);
CREATE INDEX IF NOT EXISTS idx_source_id ON pf2e_entities(source_id);
-- New indexes for generated columns
CREATE INDEX IF NOT EXISTS idx_level ON pf2e_entities(level);
CREATE INDEX IF NOT EXISTS idx_rarity ON pf2e_entities(rarity);
CREATE INDEX IF NOT EXISTS idx_entity_type_level ON pf2e_entities(entity_type, level);
```

**Example SQL for VIRTUAL approach (simpler, ALTER TABLE compatible):**
```sql
-- Alternative: VIRTUAL columns via ALTER TABLE — no table recreation needed
ALTER TABLE pf2e_entities ADD COLUMN level INTEGER
  GENERATED ALWAYS AS (
    CAST(json_extract(raw_data, '$.system.level.value') AS INTEGER)
  ) VIRTUAL;

ALTER TABLE pf2e_entities ADD COLUMN rarity TEXT
  GENERATED ALWAYS AS (
    json_extract(raw_data, '$.system.traits.rarity')
  ) VIRTUAL;

CREATE INDEX IF NOT EXISTS idx_level ON pf2e_entities(level);
CREATE INDEX IF NOT EXISTS idx_rarity ON pf2e_entities(rarity);
CREATE INDEX IF NOT EXISTS idx_entity_type_level ON pf2e_entities(entity_type, level);
```

### Pattern 4: FTS5 MATCH Query via Drizzle sql Template

**What:** Search function using the Drizzle `sql` template tag to compose a MATCH query against pf2e_fts, joining back to pf2e_entities for full row data.

**When to use:** New `searchEntities()` function exported from a service file.

**Example:**
```typescript
// Source: Drizzle sql template + SQLite FTS5 MATCH operator
import { sql } from 'drizzle-orm';
import { db } from './database';

export interface EntitySearchResult {
  id: number;
  name: string;
  entityType: string;
  pack: string;
  slug: string;
}

export async function searchEntities(query: string): Promise<EntitySearchResult[]> {
  // FTS5 MATCH query — join fts virtual table back to real table for full row data
  const results = await db.all<EntitySearchResult>(
    sql`SELECT e.id, e.name, e.entity_type, e.pack, e.slug
        FROM pf2e_fts f
        JOIN pf2e_entities e ON e.id = f.rowid
        WHERE pf2e_fts MATCH ${query}
        ORDER BY rank
        LIMIT 50`
  );
  return results;
}
```

**MATCH query escaping:** User input passed directly into MATCH can break if it contains FTS5 special characters (`"`, `*`, `^`, `-`, `AND`, `OR`, `NOT`, `NEAR`). Sanitize user input or wrap in double quotes for literal phrase search: `"${query}"`.

### Anti-Patterns to Avoid

- **Calling `db.insert()` inside the batch loop:** The existing ORM insert path issues one prepared statement per entity — this is the bottleneck being fixed. The refactor replaces this with a single raw SQL call per 500-entity batch.
- **Using `ALTER TABLE ADD COLUMN ... STORED`:** Not supported in SQLite. Will cause migration failure. Use VIRTUAL or recreate the table.
- **FTS5 UPDATE trigger using new values before delete:** Must delete old entry first (with old values), then insert new entry. Reversed order corrupts the index.
- **FTS5 external content with no rebuild after migration:** When migration v2 runs on an existing database (one that already has pf2e_entities rows), the triggers are not retroactive. Must call `INSERT INTO pf2e_fts(pf2e_fts) VALUES ('rebuild')` at the end of migration v2 to populate the index from existing data.
- **Querying by generated column expression instead of column name:** In SQLite (unlike MySQL), the index on a generated column is only used when the WHERE clause references the column name (`WHERE level = 5`), not the underlying expression (`WHERE json_extract(raw_data, '$.system.level.value') = 5`). The Drizzle schema must expose `level` and `rarity` as named columns.
- **Ignoring NULL for missing json_extract paths:** `json_extract()` returns NULL when the path does not exist. Creatures without a level (e.g., hazards, vehicles) will have `level = NULL`. This is correct and expected; the index still covers non-NULL rows. Do not coalesce to 0 unless there is a product requirement for it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text tokenization | Custom search parser | SQLite FTS5 with unicode61 | Handles Unicode, diacritics, prefix search, BM25 ranking; handles PF2e special chars (é, ñ, etc.) |
| JSON field indexing | Periodic background jobs to denormalize JSON | STORED/VIRTUAL generated columns + index | Computed at write time, indexed transparently, zero query-time overhead |
| Batch parameter building | Custom ORM wrapper | Raw SQL string + `params.flat()` | tauri-plugin-sql accepts a flat array; building `($1,$2,...),($9,$10,...)`  strings is straightforward and explicit |
| FTS sync | Application-level mirror writes | SQLite triggers | Triggers fire on any write path including direct SQL, cannot be bypassed |

**Key insight:** SQLite has all three capabilities built in (FTS5, generated columns, multi-row VALUES). No new Rust commands or JS dependencies are needed.

---

## Common Pitfalls

### Pitfall 1: STORED Generated Column Added via ALTER TABLE
**What goes wrong:** Migration SQL uses `ALTER TABLE pf2e_entities ADD COLUMN level INTEGER GENERATED ALWAYS AS (...) STORED` — SQLite rejects it with "error in generated column".
**Why it happens:** SQLite allows only VIRTUAL generated columns to be added via ALTER TABLE. STORED columns must exist at CREATE TABLE time.
**How to avoid:** Either (a) use VIRTUAL instead of STORED (index is still persisted; only compute changes), or (b) recreate the table with a CREATE+INSERT+DROP+RENAME sequence in migration v2.
**Warning signs:** Migration fails on first run with a schema error; existing data is intact but migration is not marked as applied.

### Pitfall 2: FTS5 Index Not Populated for Existing Data
**What goes wrong:** Migration v2 creates the FTS5 virtual table and triggers, but all pf2e_entities rows that existed before migration v2 are not indexed. MATCH queries return no results until a fresh sync is run.
**Why it happens:** External-content FTS5 triggers only fire on new INSERT/UPDATE/DELETE operations. They are not retroactive.
**How to avoid:** Add `INSERT INTO pf2e_fts(pf2e_fts) VALUES ('rebuild')` as the last SQL statement in migration v2.
**Warning signs:** FTS5 table returns 0 rows after migration; entities are visible via regular SELECT but not via MATCH.

### Pitfall 3: FTS5 UPDATE Trigger Order Corruption
**What goes wrong:** UPDATE trigger inserts new entry before issuing the 'delete' command for old entry, leaving stale tokens in the index.
**Why it happens:** When FTS5 processes an UPDATE on an external-content table, if the source row has already changed before the 'delete' command fires, the tokenizer looks up the wrong content to remove.
**How to avoid:** Always issue the 'delete' INSERT first (using old.* values), then insert new.* values. See Pattern 2 trigger example.
**Warning signs:** Search returns ghost results for renamed entities; duplicate results after update.

### Pitfall 4: Drizzle Schema Not Updated for Generated Columns
**What goes wrong:** The migration adds `level` and `rarity` columns to the DB, but `schema.ts` still has the old pf2eEntities definition. Drizzle ORM queries cannot reference `level`/`rarity` as typed columns.
**Why it happens:** Drizzle sqlite-proxy uses its schema for TypeScript types and column mapping; the schema must mirror the actual DB.
**How to avoid:** Update `pf2eEntities` in schema.ts to add `level` and `rarity` with the appropriate Drizzle generated column definition.
**Warning signs:** `vue-tsc` type errors when trying to filter by `level`; queries work at runtime but are untyped.

### Pitfall 5: INSERT OR REPLACE Fires FTS Triggers Twice
**What goes wrong:** INSERT OR REPLACE is implemented as DELETE + INSERT at the SQLite level. This fires the AFTER DELETE trigger (pf2e_fts_ad) and AFTER INSERT trigger (pf2e_fts_ai) on each replaced row. This is correct behavior but means every upserted entity touches the FTS index twice — acceptable for correctness but worth knowing for performance profiling.
**Why it happens:** SQLite's REPLACE conflict resolution deletes the conflicting row before inserting the new one; both the delete trigger and insert trigger fire.
**How to avoid:** This is expected behavior. No action needed; just document in code comments.
**Warning signs:** n/a — behavior is correct, just may seem like double writes in trace logs.

### Pitfall 6: Content-Hash Pre-Check Requires a Map Fetch Before the Loop
**What goes wrong:** The locked decision is "INSERT OR REPLACE with content-hash pre-check." If no pre-check is implemented, every sync run rewrites all 28K+ rows regardless of changes (correct but slow and causes FTS trigger churn).
**Why it happens:** INSERT OR REPLACE always replaces; it cannot conditionally skip identical rows.
**How to avoid:** Before the batch loop in syncPacks(), execute `SELECT pack, slug, content_hash FROM pf2e_entities` and build a `Map<string, string>` (key=`pack::slug`, value=hash). Inside the loop, only add entities to the batch where the hash differs or the key is missing.
**Warning signs:** Sync always reports updated=28000+; sync takes as long as first-time sync on every run.

---

## Code Examples

Verified patterns from official sources:

### FTS5 MATCH with Prefix Search (for type-ahead)
```typescript
// Source: https://www.sqlite.org/fts5.html (query syntax)
// Prefix wildcard: "fire*" matches fireball, firestorm, etc.
const term = userInput.trim().replace(/"/g, '""'); // escape double quotes
const matchExpr = `"${term}"*`; // phrase prefix search
const rows = await db.all(
  sql`SELECT e.id, e.name, e.entity_type FROM pf2e_fts f
      JOIN pf2e_entities e ON e.id = f.rowid
      WHERE pf2e_fts MATCH ${matchExpr}
      ORDER BY rank LIMIT 20`
);
```

### Query Entities by Generated Column (level + entity_type)
```typescript
// Source: project pattern — uses column name, not json_extract expression
// (SQLite only uses the generated column index when filtering by column name)
import { eq, and } from 'drizzle-orm';
import { db } from './database';
import { pf2eEntities } from './schema';

const creatures = await db
  .select()
  .from(pf2eEntities)
  .where(and(
    eq(pf2eEntities.entityType, 'npc'),
    eq(pf2eEntities.level, 5)  // uses idx_entity_type_level composite index
  ));
```

### Drizzle Schema for Generated Columns (sqlite-core)
```typescript
// Source: drizzle-orm sqlite-core API
// Add to pf2eEntities table definition in schema.ts
import { sqliteTable, text, integer, uniqueIndex, index, sql as sqlExpr } from 'drizzle-orm/sqlite-core';

// Inside the table definition:
level: integer('level').generatedAlwaysAs(
  sqlExpr`CAST(json_extract(raw_data, '$.system.level.value') AS INTEGER)`,
  { mode: 'stored' }  // or 'virtual'
),
rarity: text('rarity').generatedAlwaysAs(
  sqlExpr`json_extract(raw_data, '$.system.traits.rarity')`,
  { mode: 'stored' }
),
```

**Note:** Drizzle sqlite-core's `generatedAlwaysAs` support must be verified against drizzle-orm 0.38.x. If not available, use a regular column definition in schema.ts for type safety (the column exists in the DB), and set the generated column DDL only in the migration SQL.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SQLite variable limit 999 | Limit raised to 32,766 | SQLite 3.32.0 (May 2020) | 500-row batch with 8 cols (4,000 params) is safe |
| FTS3/FTS4 | FTS5 (better BM25, external content, unicode61 default) | SQLite 3.9.0 (2015) | FTS5 is the correct choice; FTS3/FTS4 are legacy |
| Functional indexes on json expressions | json_extract with generated columns | SQLite 3.31.0 (Jan 2020) | Both still work; generated columns are more readable and allow ORM type mapping |

**Deprecated/outdated:**
- FTS3/FTS4: Do not use. FTS5 is the current standard.
- SQLite < 3.31: Generated columns not available. Not a concern here since sqlx 0.8 bundles SQLite 3.46.

---

## Open Questions

1. **STORED vs VIRTUAL for generated columns**
   - What we know: STORED cannot be added via ALTER TABLE; requires table recreation. VIRTUAL can be added with ALTER TABLE.
   - What's unclear: Whether the locked decision for STORED is a hard requirement or a preference. If the table recreation approach is too risky (data loss if migration fails mid-way), VIRTUAL achieves the same index-based query performance.
   - Recommendation: Plan should implement VIRTUAL columns (simpler, safer migration) unless the locked decision is confirmed as non-negotiable. Annotate the choice in the plan. If STORED is required, use the CREATE-INSERT-DROP-RENAME sequence with a transaction wrapping the entire migration step.

2. **Drizzle generatedAlwaysAs API availability in v0.38**
   - What we know: Drizzle-orm 0.38.x is installed. The `generatedAlwaysAs` API exists in recent Drizzle versions for sqlite-core.
   - What's unclear: Exact API shape and whether `{ mode: 'stored' }` is the correct option name for drizzle-orm 0.38.
   - Recommendation: Plan should include a step to verify with `import { ... } from 'drizzle-orm/sqlite-core'` compilation check. If the API is not available, define the column as a regular `integer('level')` in schema.ts and manage DDL entirely in migration SQL.

3. **Content-hash pre-check fetch performance at 28K+ entities**
   - What we know: Fetching `SELECT pack, slug, content_hash FROM pf2e_entities` for 28K rows is a simple indexed scan with no JSON parsing.
   - What's unclear: Whether this pre-fetch is fast enough to be unnoticeable in the sync flow, or if it needs progress reporting.
   - Recommendation: Add it without a separate progress stage. The read is fast (no JSON column, narrow projection). If profiling shows it's slow, it can be integrated into the existing 'checking' stage.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `pnpm test -- --reporter=verbose src/lib/__tests__/sync-service.test.ts` |
| Full suite command | `pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPT-01 | `buildBatchInsertSql(rows)` returns correct SQL + params for N rows | unit | `pnpm test -- src/lib/__tests__/sync-service.test.ts` | ❌ Wave 0 |
| OPT-01 | Batch of 500 rows produces 4,000 params (8 cols × 500) | unit | `pnpm test -- src/lib/__tests__/sync-service.test.ts` | ❌ Wave 0 |
| OPT-01 | Empty batch input returns no SQL / skips execute | unit | `pnpm test -- src/lib/__tests__/sync-service.test.ts` | ❌ Wave 0 |
| OPT-02 | FTS5 migration SQL string is valid (CREATE VIRTUAL TABLE + 3 triggers) | manual | n/a — migration executed against real DB | ❌ Wave 0 |
| OPT-02 | `searchEntities(query)` returns array (integration — needs real SQLite) | manual-only | n/a — tauri-plugin-sql requires Tauri runtime | N/A |
| OPT-03 | `buildBatchInsertSql` does NOT include level/rarity in INSERT columns | unit | `pnpm test -- src/lib/__tests__/sync-service.test.ts` | ❌ Wave 0 |
| OPT-03 | Drizzle schema compiles with level/rarity columns (vue-tsc check) | compilation | `pnpm build` | N/A |

**Note on integration coverage:** `tauri-plugin-sql` requires the Tauri runtime (Rust backend). Tests cannot use the real database in a jsdom environment. All DB-touching behavior (FTS5 triggers, generated columns, MATCH queries) is tested manually against the running app. Unit tests cover the pure-function SQL string builders only — consistent with the existing `sync-service.test.ts` pattern which only tests `computeHash`, `extractPackName`, `isValidEntity`, `shouldSkipFile`.

### Sampling Rate
- **Per task commit:** `pnpm test -- src/lib/__tests__/sync-service.test.ts`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/sync-service.test.ts` — add tests for `buildBatchInsertSql` helper (new exported function); existing file covers other sync-service pure functions

*(No new test files needed — the batch SQL builder should be a pure exported function that slots into the existing test file)*

---

## Sources

### Primary (HIGH confidence)
- https://www.sqlite.org/fts5.html — FTS5 virtual table syntax, external-content tables, trigger patterns, unicode61 tokenizer, MATCH operator, rebuild command
- https://www.sqlite.org/gencol.html — Generated columns STORED vs VIRTUAL, ALTER TABLE limitations
- https://www.sqlite.org/limits.html — SQLITE_MAX_VARIABLE_NUMBER history (999 pre-3.32.0, 32766 post)
- https://v2.tauri.app/reference/javascript/sql/ — Database.execute() signature, $1/$2 parameter format
- Existing project source files — sync-service.ts (batch loop), database.ts (getSqlite), schema.ts (pf2eEntities), migrations.ts (migration pattern)

### Secondary (MEDIUM confidence)
- https://docs.rs/crate/tauri-plugin-sql/latest — sqlx 0.8 dependency confirmed; SQLite 3.46 bundled via libsqlite3-sys 0.30.1 (from sqlx changelog)
- https://www.sqlite.org/lang_upsert.html — INSERT ON CONFLICT DO UPDATE vs INSERT OR REPLACE behavioral differences (DELETE+INSERT vs in-place UPDATE)
- https://simonh.uk/2021/05/11/sqlite-fts5-triggers/ — FTS5 trigger pattern cross-reference (matches official docs)

### Tertiary (LOW confidence)
- Community article on STORED vs VIRTUAL performance tradeoffs (multiple sources agree; not a single authoritative citation)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via Cargo.toml, package.json, tauri-plugin-sql docs
- Architecture: HIGH — based on official SQLite docs and existing codebase patterns
- Batch INSERT: HIGH — tauri-plugin-sql execute() confirmed, variable math verified
- FTS5 triggers: HIGH — direct from official SQLite FTS5 docs
- Generated columns: HIGH for behavior; MEDIUM for Drizzle API shape (generatedAlwaysAs in 0.38)
- Pitfalls: HIGH — most are directly verifiable from official docs (STORED ALTER TABLE limitation, FTS rebuild requirement)

**Research date:** 2026-03-20
**Valid until:** 2026-06-20 (stable SQLite APIs; 90-day window appropriate)
