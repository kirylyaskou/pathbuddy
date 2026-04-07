---
phase: 13-combat-ux-sweep
plan: 02
subsystem: combatant-detail
tags: [ui, hp-controls, split-button]
requires: [entities/combatant, engine/applyIWR]
provides: [single-input-hp, split-button-damage]
affects: [HpControls]
tech_stack:
  added: []
  patterns: [split-button-dropdown, unified-action-handler]
key_files:
  created: []
  modified:
    - src/widgets/combatant-detail/ui/HpControls.tsx
key_decisions:
  - "Enter key defaults to damage action (most common combat operation)"
  - "Damage type resets to null after each damage action to prevent accidental typed damage"
requirements_completed: [CMB-09]
duration: "3 min"
completed: "2026-04-02"
---

# Phase 13 Plan 02: HP Controls Single Input Summary

Redesigned HP controls from 3-input grid to single input with 3 stacked action buttons and split-button damage type selector.

## Tasks Completed

| # | Task | Files | Commit |
|---|------|-------|--------|
| 1 | Rewrite HpControls with single input and split-button damage | HpControls.tsx | f4ee495c |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Self-Check: PASSED
