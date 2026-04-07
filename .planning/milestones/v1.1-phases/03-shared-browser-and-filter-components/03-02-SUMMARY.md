---
phase: 03-shared-browser-and-filter-components
plan: 02
subsystem: ui
tags: [vue3, virtua, entity-filter, creature-browser, virtualised-list, component]
dependency_graph:
  requires:
    - src/lib/entity-query.ts (Phase 03 Plan 01 — filterEntities, getDistinctFamilies, getDistinctTraits)
    - src/types/entity.ts (Phase 03 Plan 01 — TagLogic type)
    - src/stores/creatureDetail.ts (Phase 01 — openCreature method)
  provides:
    - EntityFilterBar.vue — collapsible filter panel emitting EntityFilter objects, no Pinia store
    - CreatureBrowser.vue — virtualised list composing EntityFilterBar + VList + debounce + row click
  affects:
    - Phase 04 (CompendiumView will compose CreatureBrowser)
    - Phase 05 (Combat Workspace left panel will compose CreatureBrowser)
tech_stack:
  added:
    - virtua ^0.48.8 (VList component for virtualised scrolling)
  patterns:
    - Local ref() state in EntityFilterBar — no Pinia store; emits EntityFilter objects upward
    - Debounce pattern at 200ms in CreatureBrowser for IPC call rate limiting
    - VList with :item-size="40" for fixed-height row virtualisation
    - Active chip summary row when filter panel is collapsed
    - Conditional family dropdown — only visible when entityType === 'creature'
key_files:
  created:
    - src/components/EntityFilterBar.vue
    - src/components/__tests__/EntityFilterBar.test.ts
    - src/components/CreatureBrowser.vue
    - src/components/__tests__/CreatureBrowser.test.ts
  modified:
    - package.json (added virtua dependency)
key_decisions:
  - "EntityFilterBar uses local ref() state only — no Pinia store prevents cross-context contamination between Compendium and Combat Workspace filter states"
  - "family property cleared and not emitted when entityType !== 'creature' — guard in emitFilter() and watch(entityType)"
  - "virtua VList with :item-size='40' for virtualised scrolling — chosen over vue-virtual-scroller (still in beta) and @tanstack/vue-virtual (overkill for fixed-row-height)"
  - "debounceTimer is a module-level let variable in CreatureBrowser — simplest correct debounce for single call site"
  - "filterEntities called with limit=101 to detect >100 results without an extra COUNT query"
  - "Loading state test uses deferred promise + vi.runAllTicks() + nextTick — required because Vue component lifecycle in jsdom resolves onMounted async"
requirements-completed: [COMP-06, COMP-07]
duration: ~7min
completed: "2026-03-21"
---

# Phase 03 Plan 02: EntityFilterBar and CreatureBrowser Summary

**EntityFilterBar collapsible filter panel with family/tags/AND-OR emitting EntityFilter objects, composed inside CreatureBrowser with virtua VList virtualised scrolling and 200ms debounce.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-03-21T01:17:00Z
- **Completed:** 2026-03-21T01:19:39Z
- **Tasks:** 2
- **Files modified:** 4 created + 1 modified (package.json)

## Accomplishments

- Installed virtua ^0.48.8 and built EntityFilterBar with 14 passing unit tests covering all acceptance criteria
- Built CreatureBrowser composing EntityFilterBar + VList with loading/empty/error states and 200ms debounce — 11 passing unit tests
- Full test suite: 275 passing (250 pre-existing + 25 new)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install virtua + EntityFilterBar component with tests** - `bbe87fb` (feat)
2. **Task 2: CreatureBrowser component with virtualised list and tests** - `2cf8ce9` (feat)

## Files Created/Modified

- `src/components/EntityFilterBar.vue` — Collapsible filter panel: entity type, rarity, level range, Auto button, family (creature-only), name search, tags/traits with AND/OR toggle; emits EntityFilter on any change; active chips when collapsed
- `src/components/__tests__/EntityFilterBar.test.ts` — 14 unit tests: panel expand/collapse, filter emit, family visibility, chip dismiss, AND/OR toggle, Auto level range, rarity options
- `src/components/CreatureBrowser.vue` — Composes EntityFilterBar + VList with 200ms debounce; loading skeleton, empty state, error state, result count; row click emits + opens CreatureDetailPanel slide-over
- `src/components/__tests__/CreatureBrowser.test.ts` — 11 unit tests: mount query, loading state, results render, empty/error states, >100 cap, debounce timing, row-click emit, detailStore.openCreature
- `package.json` — Added virtua ^0.48.8 dependency

## Decisions Made

1. **Local ref() state in EntityFilterBar** — All filter fields are local `ref()` — no Pinia store. Prevents cross-contamination between Compendium and Combat Workspace filter states. `emitFilter()` is called by a `watch()` on all filter fields.

2. **Family guard in emitFilter()** — Family value is only included in the emitted EntityFilter when `entityType === 'creature'`. The `watch(entityType)` also clears family when switching away from 'creature'. Both guards ensure downstream consistency.

3. **virtua VList for virtualisation** — Only non-beta Vue 3 native option. vue-virtual-scroller `@next` is still `2.0.0-beta.8`. VList with `:item-size="40"` matches the fixed 40px row height from UI-SPEC.

4. **limit=101 in filterEntities call** — Detecting whether there are more than 100 results without a separate COUNT query. If 101 rows come back, we know there are more; display "Showing 100 of {total}".

5. **Deferred promise + vi.runAllTicks() for loading test** — The loading state test needed to capture the in-flight query state. Standard `mockReturnValue(new Promise(() => {}))` wasn't sufficient because the component's initial state shows empty until onMounted triggers. Using a manually controlled deferred promise with `vi.runAllTicks()` + `$nextTick()` captured the loading=true state correctly.

## Deviations from Plan

None — plan executed exactly as written. The only minor deviation was in the loading skeleton test approach: the plan suggested `mockReturnValue(new Promise(() => {}))` with synchronous check, but in the jsdom test environment Vue's reactivity requires an async tick before `loading = true` is reflected in the DOM. Fixed inline using a deferred promise + `vi.runAllTicks()` (Rule 1 — auto-fixed bug in test strategy, no user permission needed).

## Issues Encountered

- **Loading state test timing:** The initial test approach (`expect(wrapper.html()).toContain('animate-pulse')` immediately after mount) failed because Vue's `onMounted` async execution in jsdom doesn't render the loading state synchronously. Resolved by using `vi.runAllTicks()` + `$nextTick()` to advance to the correct frame. This is a jsdom/Vue test utils limitation, not a component issue.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- EntityFilterBar and CreatureBrowser are complete and fully tested
- CompendiumView (Phase 04) can now compose `<CreatureBrowser defaultEntityType="creature" />` directly
- Combat Workspace (Phase 05) can compose `<CreatureBrowser />` for the left panel entity browser
- No blockers for Phase 04

---
*Phase: 03-shared-browser-and-filter-components*
*Completed: 2026-03-21*

## Self-Check: PASSED

- FOUND: src/components/EntityFilterBar.vue
- FOUND: src/components/__tests__/EntityFilterBar.test.ts
- FOUND: src/components/CreatureBrowser.vue
- FOUND: src/components/__tests__/CreatureBrowser.test.ts
- FOUND: .planning/phases/03-shared-browser-and-filter-components/03-02-SUMMARY.md
- FOUND commit: bbe87fb (Task 1)
- FOUND commit: 2cf8ce9 (Task 2)
