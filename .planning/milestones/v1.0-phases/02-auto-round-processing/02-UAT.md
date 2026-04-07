---
status: diagnosed
phase: 02-auto-round-processing
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md]
started: 2026-03-19T14:10:00Z
updated: 2026-03-19T14:22:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Round Counter Display
expected: A blue badge in the CombatTracker header shows "Round" with the current round number (starting at 1).
result: issue
reported: "round counter not working, every creature just passing turns on next creature button"
severity: major

### 2. Next Creature Advancement
expected: Clicking "Next Creature" moves the active turn highlight to the next creature in initiative order. When reaching the last creature, it wraps around to the first.
result: pass

### 3. New Round Button Gating
expected: The "New Round" button is disabled while any creature still has their turn (hasn't acted yet). After advancing through all creatures with "Next Creature", the "New Round" button becomes enabled.
result: issue
reported: "initiative is stuck in loop without new round button enabling"
severity: major

### 4. New Round Advances Round Counter
expected: Clicking "New Round" (when enabled) increments the round counter from 1 to 2 and resets all creature turns so you can cycle through them again.
result: issue
reported: "partly passed. Without bug with looped initiative button is incrementing round, but after clicking next creature or advance turn - its disabled permanently. Also confusion: what is the diff between next creature and advance turn?"
severity: major

### 5. Regeneration Toggle Per Creature
expected: Each creature card has a "Regen: ON" button (gray). Clicking it toggles to "Regen: OFF" (red). Clicking again toggles back to ON.
result: pass

### 6. Drag-and-Drop Restrictions
expected: Creature cards can be dragged to reorder when alive and not the current turn. A creature that is the current turn or has 0 HP cannot be dragged.
result: issue
reported: "drag and drop is not even a thing in this build"
severity: major

## Summary

total: 6
passed: 2
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "A blue badge in the CombatTracker header shows Round with the current round number (starting at 1)."
  status: failed
  reason: "User reported: round counter not working, every creature just passing turns on next creature button"
  severity: major
  test: 1
  root_cause: "Two competing turn-advance buttons exist: 'Next Creature' (Phase 2, uses store.nextCreature on unsorted array) and 'Advance Turn' (Phase 1 leftover, uses sortedCreatures). The duplicate buttons create confusion and inconsistent behavior. nextCreature() operates on raw creatures array, not initiative-sorted order."
  artifacts:
    - path: "src/components/CombatTracker.vue"
      issue: "Lines 89-94: Old 'Advance Turn' button not removed; lines 75-81: New 'Next Creature' button added alongside"
    - path: "src/stores/combat.ts"
      issue: "nextCreature() uses creatures.value (unsorted) instead of sortedCreatures"
  missing:
    - "Remove old 'Advance Turn' button and advanceTurn() function from CombatTracker"
    - "Fix nextCreature() to use sortedCreatures for initiative order"

- truth: "New Round button becomes enabled after all creatures have acted via Next Creature."
  status: failed
  reason: "User reported: initiative is stuck in loop without new round button enabling"
  severity: major
  test: 3
  root_cause: "hasAllActed computed checks creatures.every(c => !c.isCurrentTurn), but nextCreature() always wraps around and immediately sets the next creature as current. There is never a state where ALL creatures have !isCurrentTurn, so hasAllActed is permanently false."
  artifacts:
    - path: "src/components/CombatTracker.vue"
      issue: "Line 11-14: hasAllActed logic assumes a state with no current turn creature, which never occurs"
    - path: "src/stores/combat.ts"
      issue: "Line 204-224: nextCreature() wraps from last to first without pause, no acted tracking"
  missing:
    - "Track acted creatures separately (e.g., actedCreatureIds set) instead of relying on isCurrentTurn absence"
    - "Or: stop nextCreature() from wrapping — when last creature finishes, leave no creature as current"

- truth: "Clicking New Round increments round counter and resets creature turns for a new cycle."
  status: failed
  reason: "User reported: partly passed - round increments but New Round permanently disabled after clicking next creature or advance turn. Also duplicate/confusing buttons: Next Creature vs Advance Turn"
  severity: major
  test: 4
  root_cause: "Same root cause as test 3 (hasAllActed never true). Additionally, advanceRound() resets all isCurrentTurn to false but doesn't set the first creature as current for the new round. After New Round, no creature is current, but clicking Next Creature sets one, making hasAllActed false again permanently."
  artifacts:
    - path: "src/stores/combat.ts"
      issue: "advanceRound() at line 191-202 resets turns but doesn't initialize first creature for new round"
    - path: "src/components/CombatTracker.vue"
      issue: "Duplicate buttons: Advance Turn (line 89-94) and Next Creature (line 75-81)"
  missing:
    - "Fix hasAllActed tracking mechanism"
    - "Remove duplicate Advance Turn button"
    - "advanceRound() should set first sorted creature as current for new round"

- truth: "Creature cards can be dragged to reorder when alive and not the current turn."
  status: failed
  reason: "User reported: drag and drop is not even a thing in this build"
  severity: major
  test: 6
  root_cause: "CreatureCard has :draggable='canDrag' and @dragstart handler, but CombatTracker has NO @dragover, @drop handlers and no reorder logic. Drag source exists but no drop target — only half of drag-and-drop is implemented."
  artifacts:
    - path: "src/components/CreatureCard.vue"
      issue: "Lines 47-48: draggable + dragstart exist (drag source)"
    - path: "src/components/CombatTracker.vue"
      issue: "No @dragover or @drop handlers anywhere in template"
  missing:
    - "Add @dragover.prevent and @drop handlers to creature list container"
    - "Add reorder logic in store or component to swap creature positions on drop"
    - "Visual feedback during drag (drag-over highlight on target)"
