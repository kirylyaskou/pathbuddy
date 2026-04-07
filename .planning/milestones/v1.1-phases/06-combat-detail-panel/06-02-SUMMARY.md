---
phase: 06-combat-detail-panel
plan: 02
subsystem: entity-browser
tags: [vue, components, filter-bar, creature-browser, infinite-scroll, xp-calculator]
dependency_graph:
  requires:
    - 06-01 (xp-calculator.ts, filterEntities offset param — already provided by Plan 01 commit)
  provides:
    - EntityFilterBar always-expanded with labels and party controls
    - CreatureBrowser rich rows with type icon, XP badge, level badge, infinite scroll
  affects:
    - src/views/CompendiumView.vue (uses EntityFilterBar — no collapse toggle expected)
    - src/components/CombatAddBar.vue (parent of CreatureBrowser in combat mode)
tech_stack:
  added:
    - IntersectionObserver API (browser-native infinite scroll)
    - withDefaults() Vue 3 pattern for boolean prop defaults
  patterns:
    - Infinite scroll via sentinel ref + IntersectionObserver (200-row pages)
    - party-change secondary emit for partyLevel/partySize relay
    - computed partyLevel = prop ?? localPartyLevel (prop wins over bar-driven value)
key_files:
  created: []
  modified:
    - src/components/EntityFilterBar.vue
    - src/components/__tests__/EntityFilterBar.test.ts
    - src/components/CreatureBrowser.vue
    - src/components/__tests__/CreatureBrowser.test.ts
decisions:
  - "06-02: withDefaults() required for showPartyControls boolean prop — Vue 3 boolean casting treats undefined optional boolean props as false"
  - "06-02: localPartyLevel ref in CreatureBrowser handles party-change from EntityFilterBar; prop wins via computed()"
  - "06-02: Both modes (compendium + combat) emit 'select' on row click — parent decides what to do with it"
  - "06-02: allLoaded is true when rows.length < PAGE_SIZE (200), false otherwise — drives sentinel and '+' suffix in count"
metrics:
  duration: 6m
  completed: 2026-03-23
  tasks_completed: 2
  files_modified: 4
  tests_added: 19
  tests_total: 37
---

# Phase 06 Plan 02: EntityFilterBar + CreatureBrowser Overhaul Summary

EntityFilterBar always-expanded with visible labels and standalone party controls; CreatureBrowser enhanced with type icon, XP badge, colored level badge, caster icon, and 200-row infinite scroll via IntersectionObserver sentinel.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Overhaul EntityFilterBar | d629032 | EntityFilterBar.vue, EntityFilterBar.test.ts |
| 2 | Enhance CreatureBrowser | 1b87248 | CreatureBrowser.vue, CreatureBrowser.test.ts |

## Decisions Made

- **withDefaults() for boolean prop:** Vue 3 treats `showPartyControls?: boolean` without a default as `false` when the prop is not passed. Required `withDefaults(defineProps<...>(), { showPartyControls: true })` to make the default `true`.
- **Both modes emit 'select':** Previously only combat mode emitted `select` and compendium mode called `detailStore.openCreature()`. Now both emit `select`, and the parent decides what to render. This removes the creatureDetail store dependency from CreatureBrowser.
- **localPartyLevel + computed:** CreatureBrowser keeps a `localPartyLevel` ref updated via `@party-change` from EntityFilterBar, and a computed `partyLevel` that prefers the prop. This allows both prop-driven (CompendiumView session header) and bar-driven (combat mode) party level.
- **allLoaded flag:** Set to `true` when `rows.length < PAGE_SIZE` (200). This is the standard sentinel pattern — if the server returned fewer than the page size, we're at the last page.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vue 3 boolean prop casting requires withDefaults()**
- **Found during:** Task 1 test run
- **Issue:** `showPartyControls?: boolean` without `withDefaults` was cast to `false` when not passed, hiding party controls when mounted without props
- **Fix:** Added `withDefaults(defineProps<...>(), { showPartyControls: true })`
- **Files modified:** src/components/EntityFilterBar.vue
- **Commit:** d629032 (inline fix before commit)

**Note on blocking dependencies:** `xp-calculator.ts` and `filterEntities` offset support were already present in the repo (committed by Plan 01, commit `1b3595c`). No additional action needed.

## Verification

```
npx vitest run src/components/__tests__/EntityFilterBar.test.ts src/components/__tests__/CreatureBrowser.test.ts
Test Files: 2 passed
Tests:      37 passed
```

## Self-Check: PASSED

- FOUND: src/components/EntityFilterBar.vue
- FOUND: src/components/CreatureBrowser.vue
- FOUND: src/components/__tests__/EntityFilterBar.test.ts
- FOUND: src/components/__tests__/CreatureBrowser.test.ts
- FOUND: .planning/phases/06-combat-detail-panel/06-02-SUMMARY.md
- FOUND commit: d629032 (Task 1 — EntityFilterBar)
- FOUND commit: 1b87248 (Task 2 — CreatureBrowser)
