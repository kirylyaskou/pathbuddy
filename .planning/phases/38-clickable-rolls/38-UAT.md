---
status: complete
phase: 38-clickable-rolls
source: [git:dcfa6ac2, git:176c709a — implemented outside GSD planning]
started: 2026-04-04T13:00:00Z
updated: 2026-04-04T13:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Strike Modifier Click
expected: Click the attack modifier (+N) on any strike in the stat block. RollResultDrawer slides up from the bottom showing the 1d20+modifier breakdown — cube animation, die value box, modifier, and large gold total. "Critical!" label if d20=20, "Fumble" if d20=1.
result: pass

### 2. Strike Damage Formula Click
expected: Click a damage formula (e.g. "2d6+4") on any strike. RollResultDrawer shows the damage roll — individual die values for each die, modifier if non-zero, and total.
result: pass

### 3. Additional Damage Click
expected: On a creature that has additional damage entries (e.g. "plus 1d6 fire" or a special ability damage), click the formula. RollResultDrawer shows the roll breakdown for that formula.
result: pass

### 4. Ability Text Dice
expected: Find a creature whose special ability description contains a dice formula in the text (e.g. "deals 3d6 fire damage"). That formula text should appear underlined/styled and be clickable. Clicking it triggers a roll and shows the drawer.
result: pass

### 5. RollResultDrawer Dismiss
expected: After any roll triggers the drawer, click the X button in the top-right of the drawer. The drawer closes (slides down) and disappears.
result: pass

### 6. MAP Row Display
expected: Under each strike, a "MAP:" row shows three values — the base modifier, MAP -5 (or -4 for agile), and MAP -10 (or -8 for agile). Non-agile example: "+16 / +11 / +6". Agile example: "+12 / +8 / +4".
result: pass

### 7. Roll History After Rolling
expected: After rolling anything, click the d20 button in the AppHeader. A popover/panel opens showing the roll(s) just made with formula, die breakdown, and total. Rolls appear newest-first.
result: pass

### 8. Save-Based Damage Variants (Crit/Full/Half)
expected: Find a spell or ability that deals save-based damage. Three options — "Critical Hit (2x)", "Full Damage", "Half Damage" — appear when clicking.
result: skipped
reason: Not in scope for Phase 38 — deferred to Phase 40

### 9. MAP Counter on Attack Click
expected: Clicking an attack auto-increments MAP counter per combatant per round.
result: skipped
reason: Store infrastructure exists (attackCountByCombatant) but UI wiring deferred to Phase 40

### 10. Spell Damage Formula Clickable
expected: Expand a spell — damage formula is clickable.
result: skipped
reason: Not implemented in Phase 38 — deferred to Phase 40

## Summary

total: 10
passed: 7
issues: 0
pending: 0
skipped: 3
blocked: 0

## Gaps

[none]
