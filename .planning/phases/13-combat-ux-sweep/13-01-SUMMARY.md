---
phase: 13-combat-ux-sweep
plan: 01
subsystem: combat-tracker
tags: [ui, condition-picker, tabs, grid]
requires: [engine/CONDITION_GROUPS, shared/ui/tabs]
provides: [tabbed-condition-picker, pill-grid-layout]
affects: [ConditionCombobox]
tech_stack:
  added: []
  patterns: [tabs-grid-layout, search-filter-flat-grid]
key_files:
  created: []
  modified:
    - src/features/combat-tracker/ui/ConditionCombobox.tsx
key_decisions:
  - "Used .split('-').join(' ') instead of .replaceAll() due to TS target < ES2021"
requirements_completed: [CMB-07, CMB-08]
duration: "3 min"
completed: "2026-04-02"
---

# Phase 13 Plan 01: Condition Picker Tabbed Grid Summary

Rewrote condition picker from narrow Command list to wide 5-tab grid with pill layout, removing Detection and Attitude groups.

## Tasks Completed

| # | Task | Files | Commit |
|---|------|-------|--------|
| 1 | Rewrite ConditionCombobox with tabbed grid layout | ConditionCombobox.tsx | 1c6a50c7 |

## Deviations from Plan

**[Rule 1 - Bug] replaceAll not available** — Found during: Task 1 | TS target < ES2021 doesn't support `.replaceAll()` | Used `.split('-').join(' ')` pattern instead | Files: ConditionCombobox.tsx | Verified: tsc --noEmit passes

**Total deviations:** 1 auto-fixed (1 bug). **Impact:** None — identical runtime behavior.

## Issues Encountered

None.

## Self-Check: PASSED
