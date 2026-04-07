# Research Summary — v0.4.0 Combat Depth + Dice Rolling

**Researched:** 2026-04-01
**Confidence:** HIGH — all features build on existing engine exports and established UI patterns

## Stack Additions
- No new libraries needed. All features build on existing engine + React + shadcn/ui + Zustand.
- Dice rolling: Math.random (already used in PersistentDamageDialog, DyingCascadeDialog)
- Degree of success: engine `calculateDegreeOfSuccess(roll, dc)` already exported

## Key Engine Integration Points

### Attack Rolling
- `buildAttackModifierSets(attack, conditionModifiers?)` returns `[MAP0, MAP5, MAP10]` tuple
- `CreatureStatistics` class wraps creature stats + auto-injects condition modifiers via `onConditionAdded/Removed/ValueChanged`
- `calculateDegreeOfSuccess(roll, dc)` determines crit success/success/failure/crit failure
- `Statistic.value` = baseValue + totalModifier (after stacking rules)
- Attack roll flow: d20 + `StatisticModifier.totalModifier` (includes MAP + condition mods) vs target AC

### Condition-Modifier Binding
- `CONDITION_EFFECTS` map defines which selectors each condition targets
- `resolveSelector(selector, statisticKeys)` maps selectors like 'all', 'ac', 'saving-throw' to concrete stat slugs
- `CreatureStatistics.onConditionAdded/Removed/ValueChanged` handles inject/eject cycle
- Pattern: frightened -N status penalty to 'all' (attacks, AC, saves, DCs, skills)
- Pattern: off-guard -2 circumstance to 'ac' only
- Already handles stacking rules (typed: highest bonus/lowest penalty; untyped: additive)

### Stat Block in Combat
- `CreatureStatBlock.tsx` already exists in entities/creature/ui — reuse in combatant detail panel
- `CombatantDetail.tsx` currently shows HP controls + conditions, needs stat block integration
- Creature raw_data available from SQLite lookup by creature ID

### XP Budget
- `generateEncounterBudgets(partySize)` returns threshold map per threat tier
- `calculateEncounterRating(xpTotal, budgets)` returns ThreatRating
- Character Adjustment table (10/20/20/30/40 per threat tier) from GM Core pg. 75 — may need engine constant or UI-side table

### Bestiary Bugs
- BestiarySearchPanel scroll/search issues — need investigation during phase execution

## Architecture Recommendations
1. **CreatureStatistics per combatant** — instantiate when creature enters combat, store in module-level Map (same pattern as ConditionManager), NOT in Zustand
2. **Attack roll UI** — clickable strikes in stat block, result popover/toast with d20 + modifier breakdown + degree of success
3. **Condition bridge extension** — existing `condition-bridge.ts` syncs ConditionManager; extend to also sync CreatureStatistics on add/remove/value-change
4. **Stat block reuse** — embed existing CreatureStatBlock inside CombatantDetail, pass combatant's creature data

## Pitfalls
1. **CreatureStatistics holds mutable Statistic instances** — must NOT go into Zustand (same pattern as ConditionManager module-level Map)
2. **Condition modifier sync timing** — must happen BEFORE attack roll calculation (race condition risk if async)
3. **MAP resets per turn** — don't persist MAP position across turns, let DM choose which attack # to roll
4. **Off-guard affects AC (defender stat), not attacker** — UI needs to distinguish attacker modifiers vs defender modifiers when showing roll breakdown
5. **Attack modifier includes condition penalties** — frightened -2 applies to attack rolls; must pass condition modifiers to `buildAttackModifierSets` for accurate MAP sets
6. **XP Budget Character Adjustment** — different party sizes need per-creature XP adjusted, not just budget threshold change

---
*Research completed: 2026-04-01*
