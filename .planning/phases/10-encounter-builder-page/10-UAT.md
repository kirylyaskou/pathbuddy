---
status: complete
phase: 10-p2-differentiators
source: [10-01-PLAN.md, 10-02-PLAN.md, 10-03-PLAN.md, 10-04-PLAN.md]
started: 2026-04-01T12:00:00Z
updated: 2026-04-01T12:01:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Weak/Elite Tier Toggle
expected: When adding a creature from the bestiary to combat, a Weak/Elite tier selector is visible. Selecting "Weak" or "Elite" shows adjusted HP and level preview (via engine getHpAdjustment) before the creature enters the tracker. The creature appears in the tracker with the adjusted HP.
result: issue
reported: "да, но оно не влияет на AC"
severity: major

### 2. MAP Attack Display in Stat Block
expected: Opening a creature's stat block in the bestiary shows MAP attack modifier sets for each strike — three columns showing MAP 0 / MAP -5 / MAP -10 (or agile MAP -4 / MAP -8) computed by engine buildAttackModifierSets.
result: pass

### 3. IWR Damage Preview
expected: In the combatant detail panel, the damage input area has a damage type combobox (fire, cold, slashing, etc.). When a type is selected and damage entered, a breakdown row appears showing raw damage, immunities/resistances/weaknesses applied, and final damage via engine applyIWR — before the DM confirms the damage.
result: pass

### 4. Dying/Wounded Cascade Dialog
expected: When a combatant reaches 0 HP, a Dying/Wounded cascade dialog appears automatically. The DM can trigger a recovery check and see the engine performRecoveryCheck result (success/failure/critical) with the resulting condition change (Dying value increment/decrement).
result: pass

### 5. Persistent Damage Flat-Check
expected: Combatants with a persistent damage condition show a flat-check prompt at turn end (DC 15). The DM can auto-roll or enter a manual d20 value. Passing removes the persistent damage condition; failing deals the persistent damage amount.
result: issue
reported: "появляется всплывашка, лучше сделать её модальным окном как для ролла смерти. Урон при не прохождении броска не наносится"
severity: major

### 6. Hazard XP in Encounter Builder
expected: The encounter builder has a way to add hazards (with level and simple/complex type). Adding a hazard updates the XP budget bar — the hazard XP is calculated via engine getHazardXp and included in the total encounter rating.
result: issue
reported: "No creatures found for 'hazard' — нет способа добавить hazard, ищет как существо"
severity: major

## Summary

total: 6
passed: 3
issues: 3
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Weak/Elite tier adjusts HP and AC before creature enters tracker"
  status: failed
  reason: "User reported: да, но оно не влияет на AC"
  severity: major
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Failed persistent damage flat-check deals persistent damage and uses modal dialog instead of toast"

  status: failed
  reason: "User reported: появляется всплывашка, лучше сделать её модальным окном как для ролла смерти. Урон при не прохождении броска не наносится"
  severity: major
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Encounter builder has a dedicated hazard add form with level and simple/complex type, contributing XP via engine getHazardXp"
  status: failed
  reason: "User reported: No creatures found for 'hazard' — нет способа добавить hazard, ищет как существо"
  severity: major
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
