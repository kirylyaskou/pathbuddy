---
phase: 01-bug-fix-and-ui-improvements
plan: 04
subsystem: components/tests
tags: [dark-theme, testing, CreatureDetailPanel, ConditionBadge, AppLayout, AppSidebar, SyncView, combat-store]
dependency_graph:
  requires: [01-03]
  provides: [full-test-suite-green, CreatureDetailPanel-dark-theme]
  affects: []
tech_stack:
  added: []
  patterns: [vitest-component-testing, vue-test-utils-prop-trigger]
key_files:
  created:
    - src/components/__tests__/ConditionBadge.test.ts
    - src/components/__tests__/AppLayout.test.ts
    - src/components/__tests__/AppSidebar.test.ts
    - src/views/__tests__/SyncView.test.ts
  modified:
    - src/components/CreatureDetailPanel.vue
    - src/components/__tests__/CreatureCard.test.ts
    - src/components/__tests__/HPController.test.ts
    - src/components/__tests__/CombatTracker.test.ts
    - src/components/__tests__/AddCreatureForm.test.ts
    - src/components/__tests__/CreatureDetailPanel.test.ts
    - src/stores/__tests__/combat.test.ts
decisions:
  - "Use wrapper.setProps() + flushPromises to trigger lazy watchers in AddCreatureForm tests — isOpen is driven by a non-immediate watch on modelValue"
  - "Find damage button by title='Damage' attribute rather than buttons[0] index — ConditionBadge adds-button precedes HPController buttons in DOM order"
  - "CreatureDetailPanel border assertions updated from border-blue-500/border-amber-500 to border-stone-600/border-gold/* to match new dark theme"
metrics:
  duration: 8min
  completed: 2026-03-20
  tasks: 2
  files: 11
---

# Phase 1 Plan 4: CreatureDetailPanel Restyle and Test Suite Green Summary

CreatureDetailPanel restyled to dark fantasy theme with charcoal backgrounds and gold accents; all tests updated for new component structure, 4 new test files created, combat store coverage added for setConditionValue/getConditionValue — full suite passes at 178/178.

## What Was Built

### Task 1: CreatureDetailPanel Dark Theme Restyle
Replaced all light-theme CSS classes in `CreatureDetailPanel.vue` with dark fantasy equivalents:
- Panel background: `bg-white` → `bg-charcoal-600`
- Header: `bg-white border-gray-200` → `bg-charcoal-600 border-charcoal-500`
- Back button: `text-blue-600 hover:text-blue-700` → `text-gold hover:text-gold-light`
- Heading: `text-gray-900` → `font-display font-bold text-stone-100`
- Close button: `text-gray-400 hover:text-gray-600` → `text-stone-500 hover:text-stone-200`
- Stats row: `bg-gray-50 border-gray-100` → `bg-charcoal-900 border-charcoal-500`
- Stats labels: `text-sm font-bold text-gray-500` → `text-xs text-stone-400` with `text-stone-100` values
- Loading skeleton: `bg-gray-200` → `bg-charcoal-500`
- Error text: `text-red-600` → `text-crimson-light`
- Section headers: full dark pill → `text-stone-400 bg-charcoal-900 border-charcoal-500`
- Unique item rows: `border-amber-500 bg-amber-50` → `border-gold/60 bg-charcoal-600 hover:bg-charcoal-500`
- Canonical item rows: `border-blue-500 bg-blue-50` → `border-stone-600 bg-charcoal-600 hover:bg-charcoal-500`
- Link icon: `text-blue-500 hover:text-blue-700` → `text-gold/70 hover:text-gold`
- Expanded descriptions: `bg-amber-50`/`bg-blue-50` → `bg-charcoal-900 text-stone-300`
- ALL script logic, watchers, computed properties, and scoped transitions preserved unchanged

### Task 2: Test Updates and New Tests
**Updated tests (4 files):**
- `CreatureCard.test.ts`: Changed `border-blue-500` → `border-gold`, initiative assertion uses `.rounded-full` badge, AC assertion uses `'AC 13'` without colon, HP button found by `title="Damage"` (not index 0), added `regenerationDisabled: false` prop to all fixtures, replaced condition toggle test with ConditionBadge render check
- `HPController.test.ts`: Removed `'7 / 10'` HP fraction test, updated `.font-mono` test to check input element, added 2 new tests for custom amount input (setValue(5) + damage, setValue(8) + heal)
- `CombatTracker.test.ts`: Updated empty state text from `'No creatures in combat yet'` → `'No Creatures in Combat'`, added dark theme assertion test
- `AddCreatureForm.test.ts`: Added Discard button text test and dark theme styling test; used `setProps() + flushPromises` pattern to trigger lazy watchers

**Pre-existing test updated:**
- `CreatureDetailPanel.test.ts`: Updated `border-blue-500` → `border-stone-600` and `border-amber-500` → `border-gold/*` assertions to match restyled component

**New tests (4 files):**
- `ConditionBadge.test.ts`: Active condition rendering, numeric value display, add button existence, toggleCondition emit for binary conditions, empty conditions render
- `SyncView.test.ts`: Page heading, Sync Now button, dark theme classes (mocked DB/sync-service/schema)
- `AppLayout.test.ts`: `.flex.h-screen` container, `bg-charcoal-800` dark background
- `AppSidebar.test.ts`: Pathbuddy brand, Combat Tracker nav, Sync Data nav, href targets `/combat` and `/sync`, dark theme `bg-charcoal-600 w-[180px]`

**Combat store tests (added to existing file):**
- `setConditionValue` with value > 0: adds condition to array AND sets conditionValues[condition]
- `setConditionValue` with value ≤ 0: removes condition from array AND clears conditionValues
- `getConditionValue`: returns stored value, defaults to 1 for unset conditions
- `setConditionValue` ensures condition is in conditions array even when not present

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Lazy watcher prevented AddCreatureForm tests from showing form**
- **Found during:** Task 2
- **Issue:** `AddCreatureForm`'s `isOpen` is driven by `watch(() => props.modelValue)` without `{ immediate: true }`. Mounting with `modelValue: true` doesn't trigger the watcher synchronously.
- **Fix:** Used `wrapper.setProps({ modelValue: true })` + `flushPromises()` pattern to trigger the watcher and flush pending DOM updates.
- **Files modified:** `src/components/__tests__/AddCreatureForm.test.ts`
- **Commit:** 2e0eb90

**2. [Rule 1 - Bug] ConditionBadge "+" button precedes HPController buttons in DOM**
- **Found during:** Task 2
- **Issue:** In CreatureCard, the ConditionBadge (Column 2) renders an "Add condition" `+` button BEFORE HPController's `-`/`+` buttons (Column 3). Using `buttons[0]` to click damage button triggered the wrong button.
- **Fix:** Changed to `wrapper.find('button[title="Damage"]')` for precise selection.
- **Files modified:** `src/components/__tests__/CreatureCard.test.ts`
- **Commit:** 2e0eb90

**3. [Rule 1 - Bug] nextTick imported from wrong module**
- **Found during:** Task 2 (AddCreatureForm test iteration)
- **Issue:** `nextTick` was imported from `vitest` instead of `vue`, causing runtime error.
- **Fix:** Swapped to `flushPromises` from `@vue/test-utils` which is more reliable for watcher propagation.
- **Files modified:** `src/components/__tests__/AddCreatureForm.test.ts`
- **Commit:** 2e0eb90

**4. [Rule 1 - Bug] Pre-existing CreatureDetailPanel tests asserted removed CSS classes**
- **Found during:** Task 2 (test run after Task 1)
- **Issue:** `CreatureDetailPanel.test.ts` had tests asserting `border-blue-500` (canonical items) and `border-amber-500` (unique items) which were replaced in Task 1's restyle.
- **Fix:** Updated assertions to `border-stone-600` and `border-gold/*` respectively.
- **Files modified:** `src/components/__tests__/CreatureDetailPanel.test.ts`
- **Commit:** 2e0eb90

## Self-Check: PASSED

All files found:
- src/components/CreatureDetailPanel.vue — FOUND
- src/components/__tests__/ConditionBadge.test.ts — FOUND
- src/views/__tests__/SyncView.test.ts — FOUND
- src/components/__tests__/AppLayout.test.ts — FOUND
- src/components/__tests__/AppSidebar.test.ts — FOUND
- .planning/phases/01-bug-fix-and-ui-improvements/01-04-SUMMARY.md — FOUND

All commits verified:
- a8cb561 (feat: CreatureDetailPanel restyle) — FOUND
- 2e0eb90 (test: updated/new tests) — FOUND
