# Phase 02: Types, Utilities, and Query Layer - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish all code contracts, data shapes, and query functions that phases 03–07 depend on. Zero UI delivered — this phase is entirely types, utilities, migrations, and one route stub. The `/compendium` route is registered but the view is a placeholder. All synced data is read as-is from the database; no normalization or transformation of imported data.

</domain>

<decisions>
## Implementation Decisions

### Data Philosophy
- All compendium data is synced data — the query layer reads and returns it as-is
- No normalization, transformation, or re-parsing of `raw_data` in the query layer
- `raw_data` (full JSON) is included in `EntityResult` so downstream components can render stat blocks without a second DB call
- Filtering operates exclusively on stored/generated columns (`level`, `rarity`, `entity_type`, `family`) and the FTS5 index — never re-parses `raw_data` per query

### filterEntities API Contract
- New file: `src/lib/entity-query.ts` — dedicated module, not folded into `search-service.ts`
- Function signature: `filterEntities(filters: EntityFilter, limit?: number): Promise<EntityResult[]>`
- `EntityFilter` shape:
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
- `EntityResult` shape — returns raw_data as-is:
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
- List-all mode: when `name` is absent, skip the FTS5 join and query `pf2e_entities` directly with column filters only
- FTS5 + column filters: use CTE pattern (per PITFALLS.md) — FTS5 MATCH in inner query, column filters in outer WHERE clause
- Default limit: 100 rows; callers can override

### weak-elite Utility
- New file: `src/lib/weak-elite.ts`
- Exports two functions:
  - `getHpAdjustment(tier: WeakEliteTier, level: number): number` — HP delta (positive for elite, negative for weak)
  - `getAdjustedLevel(tier: WeakEliteTier, level: number): number` — display level (handles edge cases: elite on level −1/0, weak on level 1)
- Source: PITFALLS.md 12-bracket table only — no other source acceptable
- HP delta is symmetric per PITFALLS.md table (elite +N, weak −N same magnitude per bracket)
- Edge cases: level ≤ 0 → clamp to level 1 bracket minimum; weak on level ≤ 0 → treat as "not applicable" (return 0)
- Full unit test coverage: one test per bracket boundary + all four level edge cases (elite −1, elite 0, weak 1, weak ≤ 0)
- `WeakEliteTier` type: `'normal' | 'weak' | 'elite'` — normal returns 0 for both functions

### Types location
- `WeakEliteTier` and creature entity types → `src/types/entity.ts` (new file, separate from `src/types/combat.ts`)
- `EntityFilter` and `EntityResult` → exported from `src/lib/entity-query.ts` directly (co-located with the function)

### Migration v3 — family column
- Spot-check SQL before writing migration (best practice: verify JSON path before irreversible DDL)
- Verification query: `SELECT json_extract(raw_data, '$.system.details.family') as family FROM pf2e_entities WHERE entity_type = 'creature' LIMIT 20`
- If path confirmed: add STORED column `family TEXT GENERATED ALWAYS AS (json_extract(raw_data, '$.system.details.family')) STORED` via table-recreation pattern (same as migration v2)
- If path empty/null for all creatures: investigate alternative paths in raw_data, update migration SQL accordingly
- STORED column index: `CREATE INDEX IF NOT EXISTS idx_family ON pf2e_entities(family)`
- Drizzle schema (`src/lib/schema.ts`): add `family` column matching DDL

### CompendiumView stub
- New file: `src/views/CompendiumView.vue` — minimal placeholder, one heading only
- Route: `{ path: '/compendium', name: 'compendium', component: CompendiumView }` added to `src/router/index.ts`
- No sidebar link in this phase (sidebar nav updated in Phase 04 when the page is real)
- Test: navigation to `/compendium` resolves without error

### Claude's Discretion
- Exact SQL for family column verification (researcher/planner decides)
- CTE vs subquery flavor for list-all queries (no FTS5 — straight SELECT with WHERE)
- Error handling in `filterEntities` (follow existing `search-service.ts` pattern)
- Test file location and naming (follow `src/lib/__tests__/` pattern from existing tests)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### HP adjustment table (authoritative)
- `.planning/research/PITFALLS.md` — Section: "Pitfall 1: Wrong HP Adjustment Table" and "Pitfall 2: Weak/Elite Level-Adjustment Edge Cases" — the ONLY acceptable source for the 12-bracket table and level edge cases

### FTS5 multi-filter query pattern
- `.planning/research/PITFALLS.md` — Section: "Pitfall 3: FTS5 + Multi-Filter Combined Query" — CTE pattern mandatory for combined FTS5 + column filter queries

### Existing migration pattern
- `src/lib/migrations.ts` — Versions 1 and 2 show the table-recreation pattern required for STORED columns; migration v3 must follow same structure
- `src/lib/schema.ts` — Drizzle schema; must stay in sync with DDL after v3

### Existing query pattern
- `src/lib/search-service.ts` — `searchEntities()` and `sanitizeSearchQuery()` — `filterEntities` can reuse `sanitizeSearchQuery`; `EntitySearchResult` type is the predecessor shape

### Router
- `src/router/index.ts` — Current routes; `/compendium` route added here

### Project requirements
- `.planning/REQUIREMENTS.md` — COMP-06 (family filter), COMP-07 (tags/traits) — their data access patterns are defined in Phase 02 even though they're delivered in Phase 03+

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/search-service.ts` → `sanitizeSearchQuery()`: reuse for FTS5 input sanitization in `filterEntities`
- `src/lib/database.ts` → `getSqlite()`: use for raw SQL queries in `filterEntities` (same pattern as `searchEntities`)
- `src/lib/migrations.ts` → table-recreation pattern: copy migration v2 structure for v3

### Established Patterns
- Raw SQL via `getSqlite()` for performance-critical paths (batch insert, FTS5) — not Drizzle ORM query builder
- MIGRATIONS array in `migrations.ts` — append-only versioned DDL
- `src/lib/__tests__/` directory for unit tests (vitest)
- `src/types/` for standalone type files — `combat.ts` as the model

### Integration Points
- `src/lib/migrations.ts` — add migration v3 object to MIGRATIONS array
- `src/lib/schema.ts` — add `family` generated column definition
- `src/router/index.ts` — add `/compendium` route
- Nothing in Phase 02 connects to Pinia stores or Vue components (intentional — zero UI)

</code_context>

<specifics>
## Specific Ideas

- "All compendium data is synced data — we don't filter imported data and take it as it is" — raw_data goes straight through; result shape wraps it, doesn't process it
- Use best practice for all technical decisions in this phase
- The `tags` filter field in `EntityFilter` is typed now but implemented in Phase 03 (json_each query pattern) — forward-compatible design

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-types-utilities-and-query-layer*
*Context gathered: 2026-03-20*
