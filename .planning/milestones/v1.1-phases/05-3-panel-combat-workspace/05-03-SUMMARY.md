---
phase: 05-3-panel-combat-workspace
plan: 03
subsystem: combat-workspace
tags: [combat, layout, grid, vue, integration]
dependency_graph:
  requires: [05-01, 05-02]
  provides: [combat-view-shell, 3-panel-grid]
  affects: [src/views/CombatView.vue]
tech_stack:
  added: []
  patterns: [css-grid-3-panel, h-full-overflow-hidden, conditional-add-bar]
key_files:
  created:
    - src/views/__tests__/CombatView.test.ts
  modified:
    - src/views/CombatView.vue
decisions:
  - "05-03: h-full overflow-hidden on grid (not h-screen) — matches CompendiumView pattern, works inside AppLayout flex-1 main"
  - "05-03: CreatureBrowser flex-1 min-h-0 — VList must shrink when CombatAddBar appears at bottom"
  - "05-03: CombatAddBar v-if selectedEntity — conditionally rendered at bottom of left column after browser select"
metrics:
  duration: ~4min
  completed: 2026-03-21T00:15:03Z
  tasks_completed: 2
  files_changed: 2
requirements:
  - WORK-01
  - WORK-02
  - WORK-03
  - WORK-04
  - WORK-05
requirements_completed: [WORK-01, WORK-02, WORK-03, WORK-04, WORK-05]
---

# Phase 05 Plan 03: CombatView 3-Panel Grid Shell Summary

**One-liner:** CombatView rewritten as CSS grid-cols-3 shell composing CreatureBrowser+CombatAddBar (left), CombatTracker (center), and detail placeholder (right) with combat-mode selection wiring.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Rewrite CombatView as 3-panel grid shell | 527b71e | src/views/CombatView.vue |
| 2 | Create CombatView tests | 437a45c | src/views/__tests__/CombatView.test.ts |

## What Was Built

CombatView.vue replaced from a 1-line wrapper (`<CombatTracker />`) into a full 3-panel CSS grid integrating all Phase 05 building blocks:

- **Left panel:** CreatureBrowser in `mode="combat"` (suppresses slide-over, emits `select`) with CombatAddBar conditionally rendered at the bottom once a creature is selected
- **Center panel:** CombatTracker (unchanged, Phase 07 removes AddCreatureForm)
- **Right panel:** Placeholder text "Select a creature to view details" (Phase 06 populates)

Selection flow: browser `@select` → `handleBrowserSelect` sets `selectedEntity` ref → CombatAddBar appears → user clicks Add → `handleAddCreatures` calls `combatStore.addFromBrowser(entity, qty, tier)`.

## Verification Results

- `vue-tsc --noEmit`: no CombatView-specific errors (2 pre-existing unrelated errors in HPController/combat.ts store)
- `vitest run CombatView.test.ts`: 7/7 tests pass
- `vitest run` (full suite): 306/306 tests pass, 25 test files, no regressions

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/views/CombatView.vue: FOUND
- src/views/__tests__/CombatView.test.ts: FOUND
- Commit 527b71e (Task 1): FOUND
- Commit 437a45c (Task 2): FOUND
