# Phase 02: Types, Utilities, and Query Layer - Research

**Researched:** 2026-03-20
**Domain:** TypeScript types, SQLite query layer, Drizzle ORM schema, vue-router, vitest unit testing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Boundary**
Establish all code contracts, data shapes, and query functions that phases 03–07 depend on. Zero UI delivered — this phase is entirely types, utilities, migrations, and one route stub. The `/compendium` route is registered but the view is a placeholder. All synced data is read as-is from the database; no normalization or transformation of imported data.

**Data Philosophy**
- All compendium data is synced data — the query layer reads and returns it as-is
- No normalization, transformation, or re-parsing of `raw_data` in the query layer
- `raw_data` (full JSON) is included in `EntityResult` so downstream components can render stat blocks without a second DB call
- Filtering operates exclusively on stored/generated columns (`level`, `rarity`, `entity_type`, `family`) and the FTS5 index — never re-parses `raw_data` per query

**filterEntities API Contract**
- New file: `src/lib/entity-query.ts` — dedicated module, not folded into `search-service.ts`
- Function signature: `filterEntities(filters: EntityFilter, limit?: number): Promise<EntityResult[]>`
- `EntityFilter` shape (exact — locked):
  ```ts
  export interface EntityFilter {
    name?: string          // FTS5 prefix match — optional; absent = list-all mode
    entityType?: string    // exact match on entity_type column
    levelMin?: number      // inclusive lower bound on level
    levelMax?: number      // inclusive upper bound on level
    rarity?: string        // exact match on rarity column
    family?: string        // exact match on family STORED column (added in migration v3)
    tags?: string[]        // trait/tag match via json_each on raw_data (Phase 03+; design the type now, implement later)
  }
  ```
- `EntityResult` shape (exact — locked):
  ```ts
  export interface EntityResult {
    id: number
    name: string
    entityType: string
    pack: string
    slug: string
    level: number | null
    rarity: string | null
    family: string | null
    rawData: string        // full JSON as stored — no processing
  }
  ```
- List-all mode: when `name` is absent, skip FTS5 join and query `pf2e_entities` directly with column filters only
- FTS5 + column filters: use CTE pattern (per PITFALLS.md) — FTS5 MATCH in inner query, column filters in outer WHERE clause
- Default limit: 100 rows; callers can override

**weak-elite Utility**
- New file: `src/lib/weak-elite.ts`
- Exports two functions:
  - `getHpAdjustment(tier: WeakEliteTier, level: number): number`
  - `getAdjustedLevel(tier: WeakEliteTier, level: number): number`
- Source: PITFALLS.md 12-bracket table ONLY — no other source acceptable
- HP delta is symmetric per PITFALLS.md table (elite +N, weak −N same magnitude per bracket)
- Edge cases: level <= 0 → clamp to level 1 bracket minimum; weak on level <= 0 → treat as "not applicable" (return 0)
- Full unit test coverage: one test per bracket boundary + all four level edge cases
- `WeakEliteTier` type: `'normal' | 'weak' | 'elite'` — normal returns 0 for both functions

**Types Location**
- `WeakEliteTier` and creature entity types → `src/types/entity.ts` (new file, separate from `src/types/combat.ts`)
- `EntityFilter` and `EntityResult` → exported from `src/lib/entity-query.ts` directly (co-located with the function)

**Migration v3 — family column**
- Spot-check SQL before writing migration: `SELECT json_extract(raw_data, '$.system.details.family') as family FROM pf2e_entities WHERE entity_type = 'creature' LIMIT 20`
- If path confirmed: add STORED column `family TEXT GENERATED ALWAYS AS (json_extract(raw_data, '$.system.details.family')) STORED` via table-recreation pattern (same as migration v2)
- If path empty/null for all creatures: investigate alternative paths in raw_data
- STORED column index: `CREATE INDEX IF NOT EXISTS idx_family ON pf2e_entities(family)`
- Drizzle schema (`src/lib/schema.ts`): add `family` column matching DDL

**CompendiumView Stub**
- New file: `src/views/CompendiumView.vue` — minimal placeholder, one heading only
- Route: `{ path: '/compendium', name: 'compendium', component: CompendiumView }` added to `src/router/index.ts`
- No sidebar link in this phase
- Test: navigation to `/compendium` resolves without error

### Claude's Discretion
- Exact SQL for family column verification (researcher/planner decides)
- CTE vs subquery flavor for list-all queries (no FTS5 — straight SELECT with WHERE)
- Error handling in `filterEntities` (follow existing `search-service.ts` pattern)
- Test file location and naming (follow `src/lib/__tests__/` pattern from existing tests)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope

</user_constraints>

---

## Summary

Phase 02 is a pure foundation phase: zero UI, zero Pinia stores, no Vue components beyond a single placeholder view. It establishes the four artifacts that every downstream phase imports: `src/types/entity.ts` (type definitions), `src/lib/weak-elite.ts` (HP utility), `src/lib/entity-query.ts` (the query function), and migration v3 (STORED `family` column). A `CompendiumView.vue` stub and its router registration are the only UI surface — they exist only so Phase 03 can import a real view into the already-registered route.

All technical decisions are fully locked in CONTEXT.md. There are no exploratory choices left: file names, function signatures, type shapes, migration pattern, and test scope are all specified. Research focus is therefore on (1) confirming the exact DDL and Drizzle schema syntax needed for the `family` STORED column, (2) verifying the SQL query patterns for `filterEntities` against the established FTS5 + SQLite codebase, (3) documenting the mock pattern for `getSqlite()` (used by `filterEntities`), and (4) mapping vitest test structure for the two new lib files.

The single highest-risk item remains the `$.system.details.family` JSON path: it is MEDIUM confidence from prior research and must be verified with a spot-check SQL query against the production database before migration v3 DDL is written. This is a mandatory pre-DDL step, not optional.

**Primary recommendation:** Execute as four focused deliverables in order — types → utility + unit tests → migration v3 (after path verification) → query function + unit tests → route stub. Each deliverable is independently testable and has no cross-dependencies within the phase.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | (project baseline) | Type definitions for `EntityFilter`, `EntityResult`, `WeakEliteTier` | Project-wide; all existing `.ts` files use TS |
| Vitest | ^2.1.8 | Unit test runner for `weak-elite.ts` and `entity-query.ts` | Already installed and configured (`vitest.config.ts`) |
| `@tauri-apps/plugin-sql` | (project baseline) | `getSqlite()` raw SQL access for `filterEntities` | Established pattern — `search-service.ts` and `sync-service.ts` both use it |
| drizzle-orm | (project baseline) | Schema definition for `family` column in `schema.ts` | Project ORM; `schema.ts` already uses `generatedAlwaysAs()` |
| vue-router 4 | ^4.5.0 | Route registration for `/compendium` | Already installed; `src/router/index.ts` uses `createRouter` / `createWebHistory` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vue/test-utils` | (project baseline) | Router navigation test for `CompendiumView` | Only for the router smoke test; all other tests are pure TS unit tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `getSqlite()` raw SQL in `filterEntities` | Drizzle query builder | Raw SQL required — query is dynamically built with conditional clauses; Drizzle query builder does not support conditional CTE construction cleanly |
| Dedicated `src/lib/entity-query.ts` | Extend `search-service.ts` | Locked decision — separate file keeps FTS-only search from mixed-filter query; cleaner separation |

---

## Architecture Patterns

### Recommended Project Structure (additions in this phase)
```
src/
├── types/
│   ├── combat.ts        # existing — model for entity.ts
│   └── entity.ts        # NEW: WeakEliteTier, creature-related entity types
├── lib/
│   ├── weak-elite.ts    # NEW: getHpAdjustment(), getAdjustedLevel()
│   ├── entity-query.ts  # NEW: EntityFilter, EntityResult, filterEntities()
│   ├── migrations.ts    # MODIFIED: append migration v3 to MIGRATIONS array
│   ├── schema.ts        # MODIFIED: add family generated column
│   ├── search-service.ts # READ-ONLY: reuse sanitizeSearchQuery()
│   └── __tests__/
│       ├── weak-elite.test.ts    # NEW
│       └── entity-query.test.ts  # NEW
├── views/
│   ├── CompendiumView.vue  # NEW: placeholder only
│   └── __tests__/
│       └── CompendiumView.test.ts  # NEW: route smoke test
└── router/
    └── index.ts        # MODIFIED: add /compendium route
```

### Pattern 1: Table-Recreation Migration (for STORED columns)

**What:** SQLite cannot add STORED generated columns via `ALTER TABLE`. Table must be recreated with new schema, data copied, old table dropped, new table renamed, all indexes recreated.

**When to use:** Every time a STORED generated column is added — migration v3 follows migration v2 exactly.

**Existing migration v2 pattern (HIGH confidence — `src/lib/migrations.ts`):**
```typescript
// Migration v2 structure — migration v3 mirrors this exactly:
// Step 1: CREATE TABLE pf2e_entities_new (..., family TEXT GENERATED ALWAYS AS (...) STORED)
// Step 2: INSERT INTO pf2e_entities_new SELECT ... FROM pf2e_entities  (omit generated cols)
// Step 3: DROP TABLE pf2e_entities
// Step 4: ALTER TABLE pf2e_entities_new RENAME TO pf2e_entities
// Step 5: Recreate ALL original indexes (lost when old table is dropped)
// Step 6: CREATE INDEX IF NOT EXISTS idx_family ON pf2e_entities(family)
```

**Critical:** The INSERT (step 2) must NOT include the generated column names — SQLite computes them automatically from `raw_data`. The existing `idx_pack_slug`, `idx_entity_type`, `idx_name`, `idx_source_id`, `idx_level`, `idx_rarity`, `idx_entity_type_level` indexes must all be recreated in step 5. FTS5 triggers survive the table rename (they reference `pf2e_entities` by name, which the new table will have after rename).

**New STORED column DDL (add to `CREATE TABLE pf2e_entities_new`):**
```sql
family TEXT GENERATED ALWAYS AS (
  json_extract(raw_data, '$.system.details.family')
) STORED
```

**Drizzle schema addition (`src/lib/schema.ts`):**
```typescript
// Source: existing schema.ts pattern (lines 16-23)
family: text('family').generatedAlwaysAs(
  sql`json_extract(raw_data, '$.system.details.family')`,
  { mode: 'stored' }
),
```
And add to the index definitions:
```typescript
idxFamily: index('idx_family').on(table.family),
```

### Pattern 2: filterEntities — Two-Path Query Strategy

**What:** `filterEntities` uses one of two SQL paths depending on whether `name` filter is present.

**Path A — List-all (no `name` filter):** Plain SELECT on `pf2e_entities` with WHERE clauses on STORED columns only. No FTS5 join. Parameters passed as `IS NULL OR column = $N` to handle optional filters.

**Path B — FTS5 + column filters:** CTE pattern (mandatory per PITFALLS.md). FTS MATCH in inner CTE, column filters in outer WHERE. Never aliases the FTS virtual table in the MATCH expression.

**List-all SQL pattern:**
```sql
SELECT id, name, entity_type as entityType, pack, slug, level, rarity, family, raw_data as rawData
FROM pf2e_entities
WHERE ($1 IS NULL OR entity_type = $1)
  AND ($2 IS NULL OR level >= $2)
  AND ($3 IS NULL OR level <= $3)
  AND ($4 IS NULL OR rarity = $4)
  AND ($5 IS NULL OR family = $5)
LIMIT $6
```

**FTS5 + filter SQL pattern (from PITFALLS.md — HIGH confidence):**
```sql
WITH fts_results AS (
  SELECT e.id, e.name, e.entity_type, e.pack, e.slug, e.level, e.rarity, e.family, e.raw_data
  FROM pf2e_fts f
  JOIN pf2e_entities e ON e.id = f.rowid
  WHERE pf2e_fts MATCH $1
  ORDER BY f.rank
  LIMIT 500
)
SELECT id, name, entity_type as entityType, pack, slug, level, rarity, family, raw_data as rawData
FROM fts_results
WHERE ($2 IS NULL OR entity_type = $2)
  AND ($3 IS NULL OR level >= $3)
  AND ($4 IS NULL OR level <= $4)
  AND ($5 IS NULL OR rarity = $5)
  AND ($6 IS NULL OR family = $6)
LIMIT $7
```

**Note on `tags`:** `EntityFilter.tags` is defined in the type now but not implemented in `filterEntities`. The function ignores it silently (or with a comment) — Phase 03 adds the `json_each` implementation. This forward-compatible approach means Phase 03 only needs to add one branch to an existing function.

### Pattern 3: weak-elite Utility Structure

**What:** Two exported pure functions with a lookup table. No side effects, no DB access, no Vue dependencies.

**HP lookup table (authoritative — PITFALLS.md, HIGH confidence):**
```typescript
// Source: .planning/research/PITFALLS.md — "Pitfall 1" (verified at AoN ID 3264/3265)
const HP_TABLE: Array<{ maxLevel: number; delta: number }> = [
  { maxLevel: 2,  delta: 10  },
  { maxLevel: 4,  delta: 15  },
  { maxLevel: 6,  delta: 20  },
  { maxLevel: 8,  delta: 30  },
  { maxLevel: 10, delta: 40  },
  { maxLevel: 12, delta: 55  },
  { maxLevel: 14, delta: 70  },
  { maxLevel: 16, delta: 90  },
  { maxLevel: 18, delta: 110 },
  { maxLevel: 20, delta: 135 },
  { maxLevel: 22, delta: 160 },
  { maxLevel: 24, delta: 185 }, // highest bracket — use for level > 24 too
];
```

**`getHpAdjustment` logic:**
- `tier === 'normal'` → return 0
- Clamp `level` to minimum 1 for lookup (handles level <= 0 per locked decision)
- Find first bracket where `maxLevel >= level`; if none (level > 24), use last bracket
- `tier === 'elite'` → return +delta; `tier === 'weak'` → return -delta
- `tier === 'weak'` AND `level <= 0` → return 0 (not applicable per locked decision)

**`getAdjustedLevel` logic (PITFALLS.md Pitfall 2):**
- `tier === 'normal'` → return level unchanged
- `tier === 'elite'` AND `level === -1` → return +1 (not 0)
- `tier === 'elite'` AND `level === 0` → return +2 (not 1)
- `tier === 'elite'` otherwise → return level + 1
- `tier === 'weak'` AND `level === 1` → return -1 (not 0)
- `tier === 'weak'` AND `level <= 0` → return level (or -1 minimum; not defined — treat as no change)
- `tier === 'weak'` otherwise → return level - 1

### Pattern 4: getSqlite() Mock Pattern for filterEntities Tests

**What:** `filterEntities` uses `getSqlite()` from `database.ts` for raw SQL. Tests must mock `getSqlite()` because Tauri IPC is unavailable in jsdom.

**Established mock pattern (from `src/lib/__tests__/creature-resolver.test.ts`, HIGH confidence):**
```typescript
// vi.mock hoisted — factory must be self-contained (no top-level captures)
vi.mock('@/lib/database', () => ({
  getSqlite: vi.fn().mockResolvedValue({
    select: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue(undefined),
  }),
}))
```

**Note:** Unlike `creature-resolver.test.ts` which mocks the Drizzle `db` object, `entity-query.ts` uses `getSqlite()` directly (same as `search-service.ts`). The mock must return a fake sqlite instance with `select` and `execute` methods.

**Returning typed results from mock:**
```typescript
const mockSqlite = {
  select: vi.fn<any[], Promise<any[]>>().mockResolvedValue([
    { id: 1, name: 'Goblin', entityType: 'creature', pack: 'pathfinder-monster-core',
      slug: 'goblin', level: 1, rarity: 'common', family: 'Goblin', rawData: '{}' }
  ]),
  execute: vi.fn().mockResolvedValue(undefined),
}
vi.mocked(getSqlite).mockResolvedValue(mockSqlite as any)
```

### Pattern 5: Vue Router Test Pattern for CompendiumView Stub

**What:** Minimal test that confirms the `/compendium` route resolves without error. No component internals tested in Phase 02 (the view is a placeholder).

**Pattern (based on existing `src/views/__tests__/SyncView.test.ts` structure):**
```typescript
import { describe, it, expect } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { mount } from '@vue/test-utils'
import CompendiumView from '@/views/CompendiumView.vue'

it('CompendiumView renders without error', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/compendium', component: CompendiumView }],
  })
  const wrapper = mount(CompendiumView, { global: { plugins: [router] } })
  expect(wrapper.exists()).toBe(true)
})
```

### Anti-Patterns to Avoid

- **Using alias in FTS5 MATCH:** `JOIN pf2e_fts AS f WHERE f MATCH ...` causes SQLite parse error — always use bare table name `pf2e_fts MATCH`
- **Running FTS5 for filter-only queries (no name):** When `name` is absent in `EntityFilter`, take the list-all path directly; never run a MATCH with an empty or wildcard expression
- **Inlining HP bracket math:** Do not compute HP delta in any Vue component or store — only `getHpAdjustment()` is acceptable
- **Simplified 3-bracket HP table:** The 3-row community summary table (±10/±20/±30) is wrong for levels above 4. Use PITFALLS.md 12-bracket table only
- **Modifying `search-service.ts`:** `filterEntities` lives in `entity-query.ts`. `search-service.ts` is read-only in this phase — only `sanitizeSearchQuery` is imported from it
- **Extending `EntitySearchResult` instead of defining `EntityResult`:** The new type includes `family` and `rawData` — it is not a superset of `EntitySearchResult`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FTS5 input sanitization | Custom escaping logic | `sanitizeSearchQuery()` from `search-service.ts` | Already written, tested (8 tests), handles FTS5 special chars |
| Raw SQL IPC access | New Database.load() call | `getSqlite()` from `database.ts` | Singleton pattern — one connection per app lifetime |
| Migration versioning | Custom version tracking | Append to `MIGRATIONS` array in `migrations.ts` | `runMigrations()` is already append-only with `_migrations` tracking table |
| Level-bracket lookup | if/else chains | Lookup table array with `find()` | 12 brackets with future extension is unreadable as nested ifs |
| Drizzle schema for generated columns | Raw DDL only | `generatedAlwaysAs(sql\`...\`, { mode: 'stored' })` | Schema must stay in sync with DDL — both must be updated together |

**Key insight:** Every utility needed already exists in the project. This phase adds new files that reuse existing patterns — it does not introduce new infrastructure.

---

## Common Pitfalls

### Pitfall 1: Wrong HP Adjustment Table (CRITICAL)
**What goes wrong:** Using the simplified 3-bracket community table (level 1-4: ±10, 5-19: ±20, 20+: ±30) instead of the official 12-bracket Monster Core table. Results in dramatically wrong HP values above level 4 (e.g., level 15 dragon is ±20 instead of ±90).
**Why it happens:** Simplified table circulates in community summaries; AI training data conflates versions.
**How to avoid:** Use ONLY the 12-bracket table from PITFALLS.md (verified at Archives of Nethys IDs 3264/3265). Do not source from any other reference. Write unit tests at every bracket boundary.
**Warning signs:** `if level < 5 return 10; if level < 20 return 20; return 30` anywhere in code.

### Pitfall 2: Level Edge Cases in getAdjustedLevel
**What goes wrong:** Elite on level -1 returns 0 (should be +1); elite on level 0 returns 1 (should be +2); weak on level 1 returns 0 (should be -1). The incorrect naive formula is `level + 1` (elite) or `level - 1` (weak) without special-casing.
**Why it happens:** Edge cases only surface for low-level creatures (kobolds, level -1 creatures from certain packs).
**How to avoid:** Implement special-case branches explicitly. Unit test all four edge cases: `getAdjustedLevel('elite', -1)`, `getAdjustedLevel('elite', 0)`, `getAdjustedLevel('weak', 1)`, `getAdjustedLevel('weak', 0)`.
**Warning signs:** No unit tests for level 0/1 adjustment; `getAdjustedLevel` is one line.

### Pitfall 3: FTS5 MATCH Alias in Combined Query
**What goes wrong:** `JOIN pf2e_fts AS f ON ... WHERE f MATCH $1` causes a SQLite parse error — MATCH expression must use the original table name, not an alias.
**Why it happens:** Following the same join alias pattern used elsewhere in SQL.
**How to avoid:** Always write `WHERE pf2e_fts MATCH $1` — never alias the FTS virtual table in the MATCH expression.
**Warning signs:** `pf2e_fts AS fts` or `pf2e_fts AS f` in the FROM or JOIN clause followed by `WHERE fts MATCH` or `WHERE f MATCH`.

### Pitfall 4: Missing Family Column Index Recreation in Migration v3
**What goes wrong:** Migration v3 drops and recreates `pf2e_entities`. All existing indexes are lost. If the index recreation step is incomplete, queries on `entity_type`, `level`, `rarity`, or `family` revert to full table scans on 28K rows.
**Why it happens:** Easy to add the new `idx_family` index but forget to also recreate all v2 indexes that were lost.
**How to avoid:** Migration v3 step 5 must recreate: `idx_pack_slug`, `idx_entity_type`, `idx_name`, `idx_source_id`, `idx_level`, `idx_rarity`, `idx_entity_type_level`. Then step 6 adds `idx_family`. Verify by inspecting sqlite_master after migration runs.

### Pitfall 5: JSON Path Confidence for family Column
**What goes wrong:** `$.system.details.family` is MEDIUM confidence (inferred, not confirmed against actual synced raw_data). If the path is wrong, the STORED column is generated but always NULL, and family filtering silently returns no results.
**Why it happens:** JSON path was estimated from PF2e Foundry VTT data structure knowledge, not verified.
**How to avoid:** The spot-check SQL is mandatory before writing migration v3 DDL. If the path returns NULL for all creatures, investigate alternatives (`$.system.details.familyType`, `$.system.traits.value` array membership, etc.) and update the migration accordingly. This is explicitly a pre-DDL research step, not an assumption.

### Pitfall 6: getSqlite() Called Before Database is Initialized in Tests
**What goes wrong:** `getSqlite()` calls `Database.load('sqlite:pf2e.db')` which requires the Tauri runtime. In vitest/jsdom, this throws. Tests that import `entity-query.ts` without mocking `@/lib/database` will fail with `TypeError: Database.load is not a function`.
**Why it happens:** The Tauri plugin-sql module is not available in jsdom — it only runs in the Tauri WebView context.
**How to avoid:** Every test file that imports from `entity-query.ts` must include `vi.mock('@/lib/database', ...)` as its first mock. The mock factory must be self-contained (vitest hoisting — no top-level captured variables).

---

## Code Examples

Verified patterns from direct source inspection (HIGH confidence):

### sanitizeSearchQuery reuse in filterEntities
```typescript
// Source: src/lib/search-service.ts (lines 25-30)
// Re-export or direct import — the function is already exported
import { sanitizeSearchQuery } from './search-service'
// Usage in entity-query.ts when filters.name is present:
const matchExpr = sanitizeSearchQuery(filters.name)
if (matchExpr === '') {
  // name was whitespace-only — fall through to list-all path
}
```

### Migration v3 DDL skeleton (STORED column + table recreation)
```typescript
// Source: migrations.ts v2 pattern (lines 48-116) — mirror exactly
{
  version: 3,
  name: 'family_generated_column',
  sql: [
    // VERIFY FIRST: SELECT json_extract(raw_data, '$.system.details.family') ...
    `CREATE TABLE pf2e_entities_new (
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
      ) STORED,
      family TEXT GENERATED ALWAYS AS (
        json_extract(raw_data, '$.system.details.family')
      ) STORED
    )`,
    `INSERT INTO pf2e_entities_new(id, source_id, pack, slug, name, entity_type, raw_data, content_hash, synced_at)
      SELECT id, source_id, pack, slug, name, entity_type, raw_data, content_hash, synced_at FROM pf2e_entities`,
    `DROP TABLE pf2e_entities`,
    `ALTER TABLE pf2e_entities_new RENAME TO pf2e_entities`,
    // Recreate ALL v1+v2 indexes:
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_pack_slug ON pf2e_entities(pack, slug)`,
    `CREATE INDEX IF NOT EXISTS idx_entity_type ON pf2e_entities(entity_type)`,
    `CREATE INDEX IF NOT EXISTS idx_name ON pf2e_entities(name)`,
    `CREATE INDEX IF NOT EXISTS idx_source_id ON pf2e_entities(source_id)`,
    `CREATE INDEX IF NOT EXISTS idx_level ON pf2e_entities(level)`,
    `CREATE INDEX IF NOT EXISTS idx_rarity ON pf2e_entities(rarity)`,
    `CREATE INDEX IF NOT EXISTS idx_entity_type_level ON pf2e_entities(entity_type, level)`,
    // New index:
    `CREATE INDEX IF NOT EXISTS idx_family ON pf2e_entities(family)`,
    // FTS5 triggers survive rename — do NOT recreate them
  ],
}
```

### Router route addition
```typescript
// Source: src/router/index.ts (lines 1-14) — add third route
import CompendiumView from '@/views/CompendiumView.vue'
// In routes array:
{ path: '/compendium', name: 'compendium', component: CompendiumView }
```

### CompendiumView.vue minimal stub
```vue
<!-- Source: locked decision from CONTEXT.md — one heading only -->
<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold">Compendium</h1>
  </div>
</template>
```

### entity.ts type file skeleton
```typescript
// Source: locked decision from CONTEXT.md + src/types/combat.ts pattern
// combat.ts uses plain type/interface exports — entity.ts follows same style

export type WeakEliteTier = 'normal' | 'weak' | 'elite'

// Creature-specific entity types can be added here as Phase 03+ needs them
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `EntitySearchResult` (FTS-only, no rawData) | `EntityResult` (all filters + rawData included) | Phase 02 (new type) | Downstream components get full stat block without second DB call |
| Direct `AND` clauses on FTS query | CTE subquery pattern | Phase 02 (established) | Correct query planner behavior; FTS narrows first, column filters apply to small result set |
| No `family` column | STORED generated column from `$.system.details.family` | Phase 02 migration v3 | Family filter operates on indexed column, not runtime JSON extraction |

**Not yet in scope (defer to Phase 03+):**
- `tags` filter implementation (type defined, query not built)
- `json_each` for trait matching (Pitfall 4 in PITFALLS.md — apply STORED column pre-filters first)

---

## Open Questions

1. **`$.system.details.family` JSON path correctness**
   - What we know: Path was inferred from PF2e Foundry VTT data structure knowledge; rated MEDIUM confidence in STATE.md
   - What's unclear: Whether all creature packs in the synced DB actually populate this path, or if some packs use a different key
   - Recommendation: Run the mandatory spot-check query on the production DB before writing migration v3 DDL. If empty: check `$.system.traits.value` (family may be encoded as a trait), `$.system.details.familyType`, or similar. Document which path is used with evidence in migration v3 comments.

2. **FTS5 triggers survive table rename in migration v3**
   - What we know: FTS5 triggers (`pf2e_fts_ai`, `pf2e_fts_ad`, `pf2e_fts_au`) reference `pf2e_entities` by name; after `ALTER TABLE pf2e_entities_new RENAME TO pf2e_entities`, the target table name matches again
   - What's unclear: Whether SQLite invalidates trigger definitions when the original table is dropped (step 3) before the rename (step 4)
   - Recommendation: In the migration v3 implementation plan, explicitly include a verification step: after migration runs, insert a test row and verify `pf2e_fts` contains it. If triggers are broken (SQLite implementation detail), add trigger recreation to migration v3 step list. This is a low-probability risk but worth noting.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^2.1.8 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run src/lib/__tests__/weak-elite.test.ts src/lib/__tests__/entity-query.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

Phase 02 has no direct user-observable requirement IDs (it is a foundational layer). The success criteria from the phase definition map to specific tests:

| Success Criterion | Behavior | Test Type | Automated Command | File Exists? |
|-------------------|----------|-----------|-------------------|-------------|
| SC-1: `getHpAdjustment` correct for all 12 brackets | Returns correct delta at each bracket boundary | unit | `npx vitest run src/lib/__tests__/weak-elite.test.ts` | Wave 0 |
| SC-1: level edge cases | `getHpAdjustment('weak', 0)` returns 0; `getHpAdjustment('elite', -1)` returns 10 | unit | `npx vitest run src/lib/__tests__/weak-elite.test.ts` | Wave 0 |
| SC-1: `getAdjustedLevel` edge cases | elite(-1)→+1, elite(0)→+2, weak(1)→-1 | unit | `npx vitest run src/lib/__tests__/weak-elite.test.ts` | Wave 0 |
| SC-2: `filterEntities` filter axes | Returns correct results per filter axis (type, level range, rarity, name FTS, family) | unit (mocked DB) | `npx vitest run src/lib/__tests__/entity-query.test.ts` | Wave 0 |
| SC-2: list-all mode | No FTS5 join when name absent; WHERE on stored columns only | unit (mocked DB) | `npx vitest run src/lib/__tests__/entity-query.test.ts` | Wave 0 |
| SC-3: migration v3 runs cleanly | STORED family column exists after migration, `idx_family` index present | manual (DB inspection) | Spot-check SQL post-migration | n/a |
| SC-4: `/compendium` route navigates without error | Route registered, view renders | unit | `npx vitest run src/views/__tests__/CompendiumView.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/__tests__/weak-elite.test.ts src/lib/__tests__/entity-query.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/weak-elite.test.ts` — covers SC-1 (all 12 bracket boundaries + 4 edge cases)
- [ ] `src/lib/__tests__/entity-query.test.ts` — covers SC-2 (all filter axes, list-all mode, FTS mode)
- [ ] `src/views/__tests__/CompendiumView.test.ts` — covers SC-4 (route smoke test)

*(No framework gaps — vitest, @vue/test-utils, and all mocking infrastructure are already installed and configured.)*

---

## Sources

### Primary (HIGH confidence)
- `src/lib/migrations.ts` (direct inspection) — migration pattern, table recreation, index recreation, FTS5 trigger setup
- `src/lib/schema.ts` (direct inspection) — Drizzle `generatedAlwaysAs()` syntax, existing column definitions
- `src/lib/search-service.ts` (direct inspection) — `sanitizeSearchQuery()`, `getSqlite()` usage pattern, `EntitySearchResult` predecessor shape
- `src/router/index.ts` (direct inspection) — current route structure, import pattern
- `src/types/combat.ts` (direct inspection) — type file convention (plain export, no default)
- `src/lib/__tests__/creature-resolver.test.ts` (direct inspection) — `vi.mock('@/lib/database', ...)` self-contained factory pattern
- `.planning/research/PITFALLS.md` (direct inspection) — authoritative 12-bracket HP table (verified at AoN 3264/3265), FTS5 CTE query pattern, level edge case formulas
- `.planning/phases/02-types-utilities-and-query-layer/02-CONTEXT.md` (direct inspection) — all locked decisions, exact type signatures

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — COMP-06 family path confidence rating (MEDIUM — inferred, not DB-confirmed)

### Tertiary (LOW confidence)
- `$.system.details.family` JSON path — inferred from PF2e Foundry VTT data structure; requires spot-check SQL verification before use

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use; versions from package.json
- Architecture patterns: HIGH — all patterns derived from direct source inspection of existing codebase
- HP bracket table: HIGH — verified at Archives of Nethys, transcribed in PITFALLS.md
- Pitfalls: HIGH (structural/SQL) / MEDIUM (family JSON path) — documented from PITFALLS.md + direct code inspection
- Migration DDL: HIGH for pattern (from migrations.ts), MEDIUM for family JSON path (unverified)

**Research date:** 2026-03-20
**Valid until:** 2026-04-19 (stable stack; only changes if PF2e Monster Core rules are revised — unlikely)
