---
status: human_needed
phase: 08-combat-tracker-engine-integration
requirements: CMB-01, CMB-02, CMB-03, CMB-04, CMB-05, BEST-03
verified: 2026-04-01
---

# Phase 08 Verification: Combat Tracker + Engine Integration

## Goal
The DM can run a full combat encounter — adding creatures from the bestiary, tracking initiative order, adjusting HP/tempHP, and managing conditions — with the engine ConditionManager handling all PF2e condition rules including auto-decrement at turn end.

## Must-Have Verification

### CMB-01: Combat with initiative order, active-turn highlight, round/turn counter
**Status: PASS (code review)**
- `CombatControls.tsx`: Start/End combat, `R{round} T{turn+1}` badge
- `InitiativeRow.tsx`: `isActive && 'bg-primary/15 border-primary/30'` highlighting
- `turn-manager.ts`: `advanceTurn()` increments turn, wraps round at end of initiative order
- `initiative.ts`: `rollInitiative(perception)` = perception + d20

### CMB-02: HP and tempHP tracking with increment/decrement controls
**Status: PASS (code review)**
- `HpControls.tsx`: Damage/Heal/TempHP controls with tempHP-first absorption (lines 18-31)
- Color-coded HP bar (green > amber > red), tempHP shield display

### CMB-03: Apply/remove conditions wired to engine ConditionManager
**Status: PASS (code review)**
- `condition-bridge.ts`: Per-combatant ConditionManager instances (module-level Map)
- `applyCondition()` calls `cm.add()`, returns granted chain conditions
- `removeCondition()` calls `cm.remove()`, returns cascade-removed conditions
- `syncToStore()` syncs engine state to Zustand after every mutation

### CMB-04: Auto-decrement at turn end via engine CONDITION_EFFECTS
**Status: PASS (code review)**
- `turn-manager.ts:advanceTurn()` calls `endTurnConditions(endingCombatantId)`
- `condition-bridge.ts:endTurnConditions()` calls `cm.endTurn()` (engine ConditionManager)
- Returns change array `{ slug, from, to }`, toasts summary to DM

### CMB-05: Condition badges show valued numerics and chain indicators
**Status: PASS (code review)**
- `ConditionBadge.tsx`: Category colors via CONDITION_GROUPS, numeric `{value}` for valued conditions
- Chain icon (`Link`) for `grantedBy` conditions
- Lock/Unlock toggle for protected conditions

### BEST-03: Add creature from bestiary to combat
**Status: PASS (code review)**
- `BestiarySearchPanel.tsx`: FTS5 search → `createCombatantFromCreature()` → `addCombatant()`
- `AddPCDialog.tsx`: Manual PC creation with name/initiative/HP

## Success Criteria Cross-Check

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| 1 | Search bestiary, add creature with initiative | BestiarySearchPanel + rollInitiative | PASS |
| 2 | HP increment/decrement, tempHP absorbs first | HpControls.handleDamage | PASS |
| 3 | Condition dropdown with badge + numeric value | ConditionCombobox + ConditionBadge | PASS |
| 4 | End Turn auto-decrements Frightened/Sickened | advanceTurn → endTurnConditions → cm.endTurn() | PASS |
| 5 | Active turn highlighted, round/turn counters | InitiativeRow isActive + CombatControls badge | PASS |

## Human Verification Items

All 5 success criteria involve interactive UI behavior. Code review confirms correct wiring, but the following need manual runtime testing:

1. **Bestiary search + add to combat**: Search a creature, click Add, verify initiative row appears
2. **HP controls**: Apply damage > tempHP, verify tempHP drains first then HP
3. **Condition application**: Add Frightened 2, verify badge shows "frightened 2" with purple color
4. **Auto-decrement**: Advance turn on combatant with Frightened 2, verify toast shows "frightened 2 → 1"
5. **Turn flow**: Advance through full initiative order, verify round increments on wrap

## Score

6/6 requirements verified at code level. 5 items need human runtime testing.
