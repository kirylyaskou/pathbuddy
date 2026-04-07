---
phase: 03-shared-browser-and-filter-components
plan: 01
subsystem: query-layer + components
tags: [entity-query, tags-filter, json_each, weak-elite, component, tdd]
dependency_graph:
  requires:
    - src/lib/entity-query.ts (Phase 02 — extended in place)
    - src/lib/weak-elite.ts (Phase 02 — getHpAdjustment used)
    - src/types/entity.ts (Phase 02 — WeakEliteTier, new TagLogic added)
  provides:
    - filterEntities() with full tags json_each support (AND/OR logic)
    - getDistinctFamilies() — dropdown data for EntityFilterBar
    - getDistinctTraits(entityType?) — autocomplete data for EntityFilterBar
    - WeakEliteSelector.vue — standalone tier control with HP delta label
  affects:
    - Phase 03 Plan 02 (EntityFilterBar will call getDistinctFamilies/Traits)
    - Phase 05 (Combat Workspace consumes WeakEliteSelector)
tech_stack:
  added: []
  patterns:
    - json_each conditional SQL construction (dynamic tagPlaceholders, HAVING for AND)
    - TDD red-green per task (test file first, implementation second)
key_files:
  created:
    - src/components/WeakEliteSelector.vue
    - src/components/__tests__/WeakEliteSelector.test.ts
  modified:
    - src/types/entity.ts (added TagLogic type)
    - src/lib/entity-query.ts (tags json_each, getDistinctFamilies, getDistinctTraits)
    - src/lib/__tests__/entity-query.test.ts (15 new tests — tags filter + helper queries)
decisions:
  - "json_each join added conditionally in TypeScript — empty/undefined tags fall through to existing code path (backward compatible)"
  - "AND logic: HAVING COUNT(DISTINCT t.value) = tagCount; OR logic: no HAVING clause (any single match suffices)"
  - "Tag placeholders built dynamically with $N indices — SQLite IPC does not expand array parameters"
  - "getDistinctFamilies hardcodes entity_type = 'creature' — family is creature-specific per CONTEXT.md decision"
  - "WeakEliteSelector uses font-bold (700) for selected state per UI-SPEC 2-weight constraint"
metrics:
  duration: ~8min
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_changed: 5
---

# Phase 03 Plan 01: Query Layer Tags Extension and WeakEliteSelector Summary

**One-liner:** Extended filterEntities() with conditional json_each SQL for tags AND/OR filtering, added getDistinctFamilies/getDistinctTraits helper queries, and built the standalone WeakEliteSelector segmented control with live HP delta label.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend entity-query with tags json_each + helper queries (TDD) | f0d9d42 | src/types/entity.ts, src/lib/entity-query.ts, src/lib/__tests__/entity-query.test.ts |
| 2 | WeakEliteSelector component with tests (TDD) | 615a384 | src/components/WeakEliteSelector.vue, src/components/__tests__/WeakEliteSelector.test.ts |

## Decisions Made

1. **Conditional json_each construction** — Tags SQL is built dynamically in TypeScript only when tags is non-empty. Empty or undefined tags fall through to the original no-json_each code path, preserving exact backward compatibility with existing Phase 02 tests.

2. **AND/OR logic via HAVING** — AND logic appends `HAVING COUNT(DISTINCT t.value) = N` to enforce all tags must match. OR logic omits the HAVING clause — GROUP BY + DISTINCT handles deduplication and any single matching tag suffices.

3. **Dynamic $N placeholder generation** — Tag values are bound as individual parameters `$6, $7, ...` (list-all path) or `$7, $8, ...` (FTS5 path) to avoid SQLite IPC array expansion limitations.

4. **getDistinctFamilies hardcodes creature filter** — Family is creature-specific per CONTEXT.md locked decision. No entityType parameter needed.

5. **WeakEliteSelector uses font-bold (700)** — UI-SPEC enforces max 2 weights (400 body, 700 bold). Changed from font-semibold (600) in RESEARCH.md example to comply.

## Test Results

- Pre-existing tests: 227 passing
- New tests added: 23 (15 entity-query + 8 WeakEliteSelector)
- Final suite: **250 passing, 0 failing**

## Deviations from Plan

None — plan executed exactly as written. Both tasks followed the TDD red-green sequence specified. The only minor adjustment was using `font-bold` instead of `font-semibold` in WeakEliteSelector to comply with the UI-SPEC 2-weight constraint (this was already the correct value per UI-SPEC; RESEARCH.md had a slightly different value which the UI-SPEC overrides).

## Self-Check: PASSED
