# Phase 4: Actions & Modifier Math - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement all missing PF2e actions as typed data entries with declarative outcome descriptors for combat-relevant actions, extend the Creature interface to a full NPC stat block, build a statistic system with base-value-plus-modifier-overlay, wire condition modifiers to statistics automatically, implement degree-of-success calculation with adjustment pipeline, and provide per-attack MAP modifier sets. The engine fully models PF2e action data, modifier math, and check resolution matching Foundry VTT PF2e source behavior.

</domain>

<decisions>
## Implementation Decisions

### Action system
- **D-01:** All 545 action entries from Foundry `refs/pf2e/actions/` included as typed data entries. Each entry has: actionType (action/reaction/free/passive), cost (1/2/3/null), category (offensive/defensive/interaction/null), traits array.
- **D-02:** Data + outcome descriptors model. Actions are declarative data, not executable logic. The engine does not roll dice or execute action resolution — it stores what each action does per degree-of-success.
- **D-03:** Outcome descriptors cover combat-relevant actions only (~40): basic actions (30) + combat skill actions (~10: Demoralize, Feint, Grapple, Shove, Trip, Disarm, Tumble Through, Steal, Dirty Trick). Remaining ~500 actions are data-only entries with no outcome maps.
- **D-04:** Outcome descriptors are declarative maps keyed by degree-of-success (critical_success, success, failure, critical_failure), describing what conditions/effects apply at each degree.

### Multiple Attack Penalty (MAP)
- **D-05:** MAP is hardcoded per-attack with modifier influence. Each attack (melee/ranged) on a creature pre-computes 3 `StatisticModifier` sets:
  - Attack 1: base attack bonus + all modifiers + MAP 0
  - Attack 2: base attack bonus + all modifiers + MAP -5 (or -4 agile)
  - Attack 3: base attack bonus + all modifiers + MAP -10 (or -8 agile)
- **D-06:** MAP penalty is an untyped modifier baked into the StatisticModifier alongside condition/situational modifiers. Consumer selects which attack number (1/2/3) they're using.
- **D-07:** Agile trait on weapon/attack determines MAP values (-4/-8 vs -5/-10).

### Statistic system
- **D-08:** Base value + modifier overlay model. Each statistic has a base value (from Foundry JSON creature data) and collects active modifiers from conditions and situational effects. Effective value = base + totalModifier.
- **D-09:** Full statistic coverage from Foundry schema: AC, Fortitude, Reflex, Will, Perception, all skills present on a creature, speed (land + other types), initiative.
- **D-10:** Condition-to-statistic wiring is auto-inject on condition change. When ConditionManager adds/removes a condition, it automatically pushes/pulls modifiers to affected statistics. Frightened 2 auto-adds -2 status to all checks. DM sees updated values immediately.
- **D-11:** Selector resolution from CONDITION_EFFECTS (Phase 3) wires to actual statistics: `"all"` = all statistics, `"dex-based"` = Reflex + Dex skills + AC, `"perception"` = Perception, `"ac"` = AC, `"con-based"` = Fortitude + Con checks, etc.

### Creature interface expansion
- **D-12:** Full NPC stat block. Creature interface extended with everything in Foundry creature JSON: abilities (6 mods: str/dex/con/int/wis/cha), AC, saves (Fort/Ref/Will), perception, skills, speed (land + otherSpeeds), senses, traits, size, rarity, languages, initiative.
- **D-13:** Melee/ranged attacks embedded in Creature as `attacks[]` array. Each entry: name, bonus (base value), damage formula, traits (agile, reach, finesse, etc.), attack type (melee/ranged). Sourced from Foundry `items[]` where `type: "melee"`.
- **D-14:** Each attack entry holds 3 pre-computed StatisticModifier sets for MAP positions (D-05).
- **D-15:** Creature abilities (Reactive Strike, Grab, Constrict, Frightful Presence, etc.) are SKIPPED in Phase 4. ~55 ability types deferred to a future phase.
- **D-16:** Creature spellcasting entries are NOT modeled in Phase 4. Spell system is a separate future domain.

### Degree-of-success system
- **D-17:** Calculation + adjustment pipeline. Given a total check result and DC, return the degree (critical_success / success / failure / critical_failure). Handles the +10/-10 rule for crit thresholds.
- **D-18:** Adjustment pipeline supports degree upgrades/downgrades from traits and effects.
- **D-19:** Phase 4 implements core adjustments only: nat 20/nat 1 upgrade/downgrade, Incapacitation trait (downgrades crit success/success for higher-level targets), basic save (halve/double damage by degree).
- **D-20:** Future adjustments (Keen, Juggernaut, Evasion, Resolve, hero points) are not implemented in Phase 4 but the pipeline should accommodate them.

### Claude's Discretion
- Exact TypeScript interfaces for Action, ActionOutcome, Statistic, and expanded Creature
- How to organize the 545 action entries (single file, per-category files, or lazy-loaded)
- Internal architecture of the condition-to-statistic auto-injection (observer pattern, event emitter, direct method calls, etc.)
- How selector strings like `"dex-based"` resolve to specific statistic keys
- Whether degree-of-success is a standalone module or part of the action system
- File organization within engine/ for new modules (actions/, statistics/, degree-of-success/)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Gap analysis (primary scope source)
- `.planning/phases/02-reference-analysis/GAP-ANALYSIS.md` — Action gaps (#16-#23), Modifier Math gaps (#24-#29), Creature gaps (#30-#33, #58). Definitive list of what Phase 4 must implement.

### Phase 3 context (prior decisions carrying forward)
- `.planning/phases/03-conditions-statuses/03-CONTEXT.md` — D-03 (selectors), D-17/D-18 (Creature interface scope), deferred items (condition-to-statistic wiring, degree-of-success)

### Current engine modules (what exists)
- `engine/modifiers/modifiers.ts` — `Modifier` class, `MODIFIER_TYPES` (7 types), `applyStackingRules()` (correct PF2e stacking), `StatisticModifier`, `DamageDicePF2e`
- `engine/conditions/condition-effects.ts` — `CONDITION_EFFECTS` map with selectors and modifier definitions, `CONDITION_OVERRIDES`, `CONDITION_GROUPS_EXTENDED`, `EXCLUSIVE_GROUPS`
- `engine/conditions/conditions.ts` — `ConditionManager` class (add/remove/has/get/endTurn, group exclusivity, dying/wounded cascade)
- `engine/types.ts` — Current minimal `Creature` interface (immunities, conditions, hp, level, deathDoor)
- `engine/index.ts` — Barrel export, public API surface
- `engine/damage/iwr.ts` — IWR types and `applyIWR()` function
- `engine/conditions/death-progression.ts` — `performRecoveryCheck()` with degree-of-success (self-contained flat check)

### Foundry VTT PF2e reference data
- `refs/pf2e/actions/` — 545 action entries across 17 subdirectories. Key files: `basic/strike.json`, `basic/escape.json`, `skill/demoralize.json`, `skill/grapple.json`
- `refs/pf2e/actions/basic/` — 30 basic action entries
- `refs/pf2e/actions/skill/` — 54 skill action entries (combat subset: Demoralize, Feint, Grapple, Shove, Trip, Disarm, Tumble Through)
- Creature stat block schema: see GAP-ANALYSIS.md Domain 5 for complete `system.*` JSON schema with abilities, saves, skills, perception, AC, speed, attacks

### Requirements
- `.planning/REQUIREMENTS.md` — ENG-02 (missing actions per analysis), ENG-03 (modifier math rework)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Modifier` class + `applyStackingRules()` — correct PF2e typed stacking. The new statistic system should use these directly, not reimplement stacking.
- `StatisticModifier` — computes totalModifier from Modifier list. Extend or wrap for the base-value-plus-overlay model.
- `CONDITION_EFFECTS` map — already defines what modifiers each condition produces with selectors. Phase 4 wires these to actual statistics.
- `ConditionManager` — has add/remove hooks where auto-injection can be triggered.
- `performRecoveryCheck()` in `death-progression.ts` — already implements a self-contained degree-of-success check (flat check DC = 10 + dying). Can inform the general degree-of-success system design.

### Established Patterns
- Engine modules are pure TypeScript, zero external dependencies
- `as const` arrays with derived union types (`typeof ARRAY[number]`)
- Domain subdirectories under `/engine` (conditions/, damage/, modifiers/, encounter/)
- Single barrel export at `engine/index.ts`
- Data-driven lookup maps (CONDITION_EFFECTS pattern) — same pattern for action outcome descriptors

### Integration Points
- `ConditionManager.add()`/`remove()` — trigger point for auto-injecting modifiers to statistics
- `StatisticModifier` — wrap with base value + modifier overlay for the Statistic concept
- `CONDITION_EFFECTS` selectors (`"all"`, `"dex-based"`, `"perception"`, etc.) — need resolver to map to actual statistic keys
- `engine/types.ts` Creature interface — extend with full stat block fields
- `engine/index.ts` barrel — export all new modules (actions, statistics, degree-of-success)

</code_context>

<specifics>
## Specific Ideas

- MAP is per-attack with 3 pre-computed StatisticModifier sets. Each attack position (1st/2nd/3rd) has its own modifier total so the DM sees "Attack +11 / +6 / +1" or "Attack +11 / +7 / +3" (agile).
- Condition auto-injection means the DM sees updated effective values immediately when conditions change — "AC 18 (-2 off-guard) = 16" without manual recalculation.
- Action outcome descriptors are declarative: `{ critical_success: { conditions: [{ slug: 'frightened', value: 2 }] }, success: { conditions: [{ slug: 'frightened', value: 1 }] } }` — not executable functions.
- NPC stat blocks use pre-calculated base values. The engine doesn't compute AC from armor + dex cap + proficiency — it takes the flat AC value and overlays modifiers.

</specifics>

<deferred>
## Deferred Ideas

- **Creature abilities** (Reactive Strike, Grab, Constrict, Frightful Presence, ~55 types) — skipped in Phase 4, deferred to future phase
- **Spell system** — no spellcasting entries, spell slots, focus points in Phase 4
- **Advanced degree adjustments** — Keen rune, Juggernaut/Evasion/Resolve class features, hero point rerolls. Pipeline supports them but not implemented.
- **Full action execution engine** — actions don't execute rolls or resolve outcomes. Only declarative data + outcome descriptors.
- **PC-style stat building** — proficiency rank + ability mod + item bonus computation. Engine uses NPC pre-calculated base values.
- **Exploration/downtime action outcomes** — only combat-relevant actions get outcome descriptors
- **Weapon/armor/shield types** — equipment system deferred to future phase
- **Feat system and Rule Element processor** — not Phase 4 scope

</deferred>

---

*Phase: 04-actions-modifier-math*
*Context gathered: 2026-03-31*
