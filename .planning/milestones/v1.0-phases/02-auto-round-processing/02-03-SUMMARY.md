---
phase: 02-auto-round-processing
plan: 03
subsystem: combat-ui
tags:
  - ui
  - drag-drop
  - regeneration
dependency-graph:
  requires:
    - 02-02
  provides:
    - regeneration-toggle-ui
    - drag-drop-restrictions
  affects:
    - CreatureCard.vue
    - CombatTracker.vue
tech-stack:
  added:
    - Vue3 computed properties for drag logic
    - Pinia store regenerationDisabled state
    - HTML5 drag-and-drop with restrictions
  patterns:
    - prop/event wiring for parent-child communication
    - computed properties for reactive restrictions
key-files:
  created: []
  modified:
    - src/components/CombatTracker.vue
    - src/components/CreatureCard.vue
decisions:
  - "Regeneration disabled state stored as Record<string, boolean> map per creature"
  - "Drag-and-drop restriction: canDrag = currentHP > 0 && !isCurrentTurn"
  - "Regen toggle UI shows ON (gray) when enabled, OFF (red) when disabled"
metrics:
  duration: 180s
  completed: 2026-03-19
---

# Phase 02 Plan 03: UI Updates for Round Counter and Regeneration Toggle Summary

**One-liner:** Added regeneration toggle button with store wiring and drag-and-drop restrictions (HP > 0 && !isCurrentTurn)

## What Was Built

### Regeneration Toggle UI
- Added "Regen: ON" (gray button) / "Regen: OFF" (red button) toggle to each CreatureCard
- State stored in `combatStore.regenerationDisabled` as a Record<string, boolean> map
- Toggle wired through parent-child communication:
  - `@toggle-regeneration-disabled` event from CreatureCard to CombatTracker
  - `:regeneration-disabled` prop passes store state back to CreatureCard
- State cleared on New Round per CONTEXT.md locked decision

### Drag-and-Drop Restrictions
- Added `canDrag` computed property: `currentHP > 0 && !isCurrentTurn`
- Creature cards only draggable when:
  - Creature has positive HP (alive)
  - Creature is not the current turn (hasn't acted yet)
- Locked (cannot drag) when:
  - `isCurrentTurn` is true
  - `currentHP <= 0` (dead/downed)
- `:draggable` bound to `canDrag` with guarded `@dragstart` handler

### Key Wiring Pattern
```
CombatTracker (parent)
  - getRegenerationDisabled(creatureId) -> computed getter
  - handleToggleRegeneration(creatureId) -> calls store.toggleRegenerationDisabled
  - :regeneration-disabled prop -> CreatureCard
  - @toggle-regeneration-disabled event -> CreatureCard emits

CreatureCard (child)
  - regenerationDisabled prop -> controls button state
  - handleToggleRegeneration() -> emits toggleRegenerationDisabled
  - canDrag computed -> currentHP > 0 && !isCurrentTurn
  - :draggable -> canDrag
```

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Verification

- [x] CombatTracker.vue: CreatureCard receives `:regeneration-disabled` and `@toggle-regeneration-disabled` wired
- [x] CreatureCard.vue: has `canDrag` computed (`currentHP > 0 && !isCurrentTurn`)
- [x] CreatureCard.vue: `:draggable` bound to canDrag
- [x] CreatureCard.vue: Regen toggle button shows "Regen: ON" (gray) or "Regen: OFF" (red)
- [x] UI passes manual verification test (checkpoint approved)

## Files Modified

| File | Changes |
|------|---------|
| src/components/CombatTracker.vue | Added handleToggleRegeneration, getRegenerationDisabled, wired prop/event to CreatureCard |
| src/components/CreatureCard.vue | Added toggleRegenerationDisabled emit, handleToggleRegeneration, regen button, canDrag computed, draggable binding |

## Commits

- `d2ba02e`: feat(02-03): wire regeneration toggle and drag restrictions
