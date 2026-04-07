---
phase: 02-types-utilities-and-query-layer
plan: "03"
subsystem: query-layer
tags: [entity-query, fts5, sqlite, tdd, types]
dependency_graph:
  requires: ["02-02"]
  provides: ["EntityFilter", "EntityResult", "filterEntities"]
  affects: ["03-creature-browser", "04-compendium-page", "05-combat-workspace"]
tech_stack:
  added: []
  patterns: ["FTS5 CTE pattern", "null-IS-NULL column filter pattern", "two-path query strategy"]
key_files:
  created:
    - src/lib/entity-query.ts
    - src/lib/__tests__/entity-query.test.ts
  modified: []
decisions:
  - "Two-path query strategy: list-all (no FTS5) when name absent, FTS5 CTE pattern when name present"
  - "Bare pf2e_fts table name in MATCH (no alias) per PITFALLS.md Pitfall 3"
  - "tags field typed in EntityFilter but silently ignored — json_each deferred to Phase 03"
  - "CTE inner limit 500 prevents full FTS scan; outer LIMIT applies final cap"
metrics:
  duration: "2 minutes"
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
  tests_added: 20
  tests_total: 227
---

# Phase 02 Plan 03: Entity Filter Query Function Summary

**One-liner:** Two-path filterEntities query function with FTS5 CTE pattern and typed EntityFilter/EntityResult interfaces, delivered via TDD (20 tests, 227 total passing).

## What Was Built

`src/lib/entity-query.ts` provides the single query entry point consumed by the CreatureBrowser (Phase 03), Compendium page (Phase 04), and Combat Workspace (Phase 05). It implements a two-path query strategy:

- **Path A (list-all):** When `name` is absent or whitespace-only, queries `pf2e_entities` directly with column filters only. No FTS5 join, no virtual table overhead.
- **Path B (FTS5 CTE):** When `name` is present and non-empty after sanitization, uses the CTE pattern mandated by PITFALLS.md — FTS5 MATCH in the inner CTE (limited to 500 rows), column filters in the outer WHERE clause.

Both paths use the `$N IS NULL OR column = $N` pattern for optional filters, so absent filter fields are no-ops with no dynamic SQL construction.

## Interfaces Exported

```typescript
export interface EntityFilter {
  name?: string       // FTS5 prefix match — absent = list-all mode
  entityType?: string // exact match on entity_type column
  levelMin?: number   // inclusive lower bound on level
  levelMax?: number   // inclusive upper bound on level
  rarity?: string     // exact match on rarity column
  family?: string     // exact match on family STORED column (migration v3)
  tags?: string[]     // typed now, implemented Phase 03+ (json_each)
}

export interface EntityResult {
  id: number
  name: string
  entityType: string
  pack: string
  slug: string
  level: number | null
  rarity: string | null
  family: string | null
  rawData: string  // full JSON as stored — no processing
}
```

## TDD Execution

**RED:** 20 tests written across 4 describe blocks covering both query paths, all filter axes, tags-ignored behavior, and EntityResult type contract. Tests failed (module not found).

**GREEN:** Implementation written to spec. All 20 tests pass. Full suite (227 tests / 20 files) passes with no regressions.

## Key Decisions

1. **Bare table name in MATCH:** `WHERE pf2e_fts MATCH $1` — never alias `pf2e_fts` in FTS5 queries. Aliasing causes "no such table" errors at runtime (PITFALLS.md Pitfall 3).
2. **CTE inner limit 500:** Prevents a full FTS scan from pulling 28K rows into memory before column filters narrow the result. The outer LIMIT then applies the caller's cap (default 100).
3. **tags silently ignored:** `filters.tags` is accepted but not used in SQL. No `json_each` in this file. Phase 03 will add the full trait-filter implementation.
4. **Not extending EntitySearchResult:** `EntityResult` adds `family` and `rawData` fields. Creating a new type rather than extending keeps the interface clean and avoids coupling to the predecessor shape.

## Commits

| Hash | Message |
|------|---------|
| 6bb065a | test(02-03): add failing tests for filterEntities query function |
| 8382a44 | feat(02-03): implement filterEntities query function |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `src/lib/entity-query.ts` exists with exports EntityFilter, EntityResult, filterEntities
- [x] `src/lib/__tests__/entity-query.test.ts` exists with 20 tests
- [x] Commit 6bb065a exists (RED phase)
- [x] Commit 8382a44 exists (GREEN phase)
- [x] Full suite: 227 tests pass, 0 failures
