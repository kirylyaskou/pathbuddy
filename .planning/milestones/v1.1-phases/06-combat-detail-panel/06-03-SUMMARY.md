---
phase: 06-combat-detail-panel
plan: "03"
subsystem: combat-ui
tags: [combat, detail-panel, vue, pinia, emit-select, stat-block]
dependency_graph:
  requires: [06-01]
  provides: [CombatDetailPanel, CombatTracker-select-emit, CombatView-selection-wiring]
  affects: [src/views/CombatView.vue, src/components/CombatTracker.vue, src/components/CombatDetailPanel.vue]
tech_stack:
  added: []
  patterns:
    - currentRequestId race condition guard for async watch
    - emit('select') pattern from CombatTracker to CombatView
    - selectedCombatantId ref owned by CombatView (not child components)
    - IntersectionObserver mock in CombatView tests (jsdom compat)
key_files:
  created:
    - src/components/CombatDetailPanel.vue
    - src/components/__tests__/CombatDetailPanel.test.ts
  modified:
    - src/components/CombatTracker.vue
    - src/components/__tests__/CombatTracker.test.ts
    - src/views/CombatView.vue
    - src/views/__tests__/CombatView.test.ts
decisions:
  - "06-03: CombatTracker.handleOpenDetail is sync, not async — emits 'select' only, no DB lookup"
  - "06-03: selectedCombatantId owned by CombatView — child components receive it as prop, not store"
  - "06-03: IntersectionObserver mock added to CombatView test — CreatureBrowser infinite scroll requires it in jsdom"
  - "06-03: border-gold test uses .classes() on .cursor-pointer elements — avoids false match on button border-gold/50"
metrics:
  duration: "~4 min"
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_modified: 6
---

# Phase 06 Plan 03: Wire Combat Detail Panel Summary

CombatTracker emits 'select' on row click (no DB lookup, no slide-over). CombatView owns selectedCombatantId ref and passes it to both CombatTracker (selectedId prop + highlight) and new CombatDetailPanel (creatureId prop). CombatDetailPanel renders LiveCombatOverlay (HP bar, initiative, tier badge, conditions, ongoing damage, regen status, fast healing) plus StatBlock fetched from DB by creature.sourceId, with race condition guard and no-sourceId graceful fallback.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Reroute CombatTracker row click to emit 'select' | f4f6fa4 | CombatTracker.vue, CombatTracker.test.ts |
| 2 | Create CombatDetailPanel + wire CombatView selection | 73154fa | CombatDetailPanel.vue (new), CombatDetailPanel.test.ts (new), CombatView.vue, CombatView.test.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed border-gold test assertion to avoid false match on button border-gold/50**
- **Found during:** Task 1 test execution
- **Issue:** The "no row has border-gold" assertion used `html.includes('border-gold')` which matched `border-gold/50` on the Heal button inside CreatureCard
- **Fix:** Changed assertion to check `.classes()` on `.cursor-pointer` row wrapper elements specifically
- **Files modified:** src/components/__tests__/CombatTracker.test.ts
- **Commit:** f4f6fa4

**2. [Rule 3 - Blocking] Added IntersectionObserver mock to CombatView test**
- **Found during:** Task 2 CombatView test execution
- **Issue:** CreatureBrowser.vue uses `new IntersectionObserver()` in `onMounted` for infinite scroll (added in Phase 06 Plan 02). jsdom does not provide `IntersectionObserver`, causing all CombatView tests to throw `ReferenceError: IntersectionObserver is not defined`
- **Fix:** Added `vi.stubGlobal('IntersectionObserver', mockIntersectionObserver)` at top of CombatView.test.ts
- **Files modified:** src/views/__tests__/CombatView.test.ts
- **Commit:** 73154fa

**3. [Coincidental] AppLayout.vue CreatureDetailPanel removal + store/component deletions included in Task 2 commit**
- These changes (removing `<CreatureDetailPanel />` from AppLayout, deleting CreatureDetailPanel.vue, creatureDetail.ts, and their tests) were already present as uncommitted working tree changes from a prior Phase 06 execution. They were picked up by `git add` and included in the Task 2 commit. All changes are correct per the Phase 06 UI-SPEC.

## Test Results

- CombatTracker: 9/9 pass
- CombatDetailPanel: 9/9 pass
- CombatView: 8/8 pass
- **Total: 26/26 pass**

## Self-Check

Files exist:
- src/components/CombatDetailPanel.vue: FOUND (175 lines)
- src/components/__tests__/CombatDetailPanel.test.ts: FOUND
- src/views/CombatView.vue: FOUND (contains selectedCombatantId, CombatDetailPanel)
- src/components/CombatTracker.vue: FOUND (contains emit('select'), selectedId prop, no detailStore)

Commits exist:
- f4f6fa4: FOUND
- 73154fa: FOUND

## Self-Check: PASSED
