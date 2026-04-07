---
phase: 05-3-panel-combat-workspace
plan: "02"
subsystem: frontend-components
tags: [combat, creature-browser, combat-add-bar, vue3, vitest]
dependency_graph:
  requires: []
  provides: [CreatureBrowser.mode-prop, CombatAddBar]
  affects: [src/components/CreatureBrowser.vue, src/components/CombatAddBar.vue]
tech_stack:
  added: []
  patterns: [mode-prop-conditional-behavior, emit-reset-after-action]
key_files:
  created:
    - src/components/CombatAddBar.vue
    - src/components/__tests__/CombatAddBar.test.ts
  modified:
    - src/components/CreatureBrowser.vue
    - src/components/__tests__/CreatureBrowser.test.ts
decisions:
  - "05-02: Combat mode emits 'select' and suppresses slide-over; compendium mode (default) behavior unchanged"
  - "05-02: Selected row highlight uses :class array binding — item.id === selectedId drives ring-gold/bg-charcoal-600"
  - "05-02: CombatAddBar button targeted by text in tests — wrapper.findAll('button').find(b => b.text().includes('Add to Combat')) avoids WeakEliteSelector button collision"
metrics:
  duration: ~6min
  completed: "2026-03-21T00:10:54Z"
  tasks_completed: 2
  files_changed: 4
requirements: [WORK-02]
requirements_completed: [WORK-02]
---

# Phase 05 Plan 02: Combat Mode for CreatureBrowser + CombatAddBar Summary

CreatureBrowser gains a combat mode prop that emits 'select' instead of opening the slide-over; CombatAddBar is a new component with entity name, WeakEliteSelector, qty input, and an Add button that resets after emit.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add mode prop and selectedId to CreatureBrowser | 46503cf | CreatureBrowser.vue, CreatureBrowser.test.ts |
| 2 | Create CombatAddBar component with tests | dc2446c | CombatAddBar.vue, CombatAddBar.test.ts |

## What Was Built

**CreatureBrowser (updated):**
- Added `mode?: 'compendium' | 'combat'` prop
- Added `selectedId?: number | null` prop
- Added `'select': [result: EntityResult]` emit
- `handleRowClick` branches: combat mode emits select, compendium mode opens slide-over
- Row class binding: `item.id === selectedId` applies `bg-charcoal-600 ring-1 ring-gold`

**CombatAddBar (new):**
- Displays entity name in gold text
- WeakEliteSelector child for tier (weak/normal/elite)
- Number input (min=1, max=20) for quantity, defaults to 1
- "Add to Combat" button emits `add` with `{entity, qty, tier}`
- Resets qty=1 and tier=normal after each emit

## Test Results

- CreatureBrowser: 14/14 tests pass (11 existing + 3 new combat mode tests)
- CombatAddBar: 6/6 tests pass
- Total: 20/20

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] WeakEliteSelector button collision in CombatAddBar tests**
- **Found during:** Task 2 test execution
- **Issue:** `wrapper.find('button')` found a WeakEliteSelector tier button instead of "Add to Combat", so the `add` event was never emitted in tests
- **Fix:** Changed button selector to `wrapper.findAll('button').find(b => b.text().includes('Add to Combat'))` in both emit tests
- **Files modified:** src/components/__tests__/CombatAddBar.test.ts
- **Commit:** dc2446c (included in same task commit)

## Out-of-Scope Findings (Deferred)

Pre-existing type errors in files not touched by this plan:
- `src/components/HPController.vue(4,7)`: unused `props` declaration
- `src/stores/combat.ts(394,19)`: `Creature` type missing `isCurrentTurn` and `isDowned` fields

These existed before plan execution and are not caused by this plan's changes.

## Self-Check: PASSED
