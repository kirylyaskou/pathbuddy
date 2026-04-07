# Phase 3: Conditions & Statuses - Research

**Researched:** 2026-03-31
**Domain:** PF2e condition engine — condition groups, override mechanics, condition effects, death/dying progression, IWR type expansion
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Condition effect system**
- D-01: Data-driven lookup — a static map of condition slug to effects (modifiers, granted conditions, immunities). Not a full Foundry Rule Element processor.
- D-02: Valued conditions use simple multipliers: `valuePerLevel * conditionValue`. Frightened 3 = -3 to all checks, Clumsy 2 = -2 to Dex-based.
- D-03: Selectors follow Foundry convention as strings or arrays: `"all"`, `"dex-based"`, `["str-based", "str-damage"]`, `["cha-based", "int-based", "wis-based"]`, `"con-based"`.
- D-04: Drained HP reduction as a special effect (requires creature level for formula), not a simple multiplier.
- D-05: GrantItem chains implemented as `grants: ConditionSlug[]` in the effect map — Grabbed grants Off-Guard + Immobilized, Dying grants Unconscious, Paralyzed grants Off-Guard.

**Condition groups and overrides**
- D-06: Add 3 missing groups: `senses` (blinded, concealed, dazzled, deafened, invisible), `abilities` (clumsy, cursebound, drained, enfeebled, stupefied), `death` (doomed, dying, unconscious, wounded).
- D-07: Override mechanic from `system.overrides` in refs/ JSON: Blinded overrides Dazzled, Stunned overrides Slowed, attitude conditions override each other.
- D-08: `abilities` group is NOT mutually exclusive — clumsy/drained/enfeebled/stupefied coexist (they affect different ability scores). Group membership is informational metadata only.
- D-09: `senses` group is NOT fully mutually exclusive — override behavior is driven by the `overrides` field, not group membership.
- D-10: `detection` and `attitudes` groups remain mutually exclusive (existing behavior correct).

**Death & dying progression**
- D-11: Full death progression for NPC/monsters only — PCs are not processed by the engine (players handle their own).
- D-12: `deathDoor: boolean` flag on creature (default `false`): When `true`: engine runs automatic recovery checks, dying progression, stabilization. When `false`: monster dies at HP ≤ 0 (standard behavior for rank-and-file).
- D-13: Death threshold: dying >= (4 - doomed) = dead.
- D-14: Recovery check: flat check DC = 10 + dying value. Crit success: dying -2, success: dying -1, failure: dying +1, crit failure: dying +2.
- D-15: Stabilized monsters remain unconscious (do not regain consciousness on stabilization).
- D-16: Dying/wounded/doomed values are manually editable (engine provides setters, not just auto-progression).

**Creature type interface**
- D-17: Minimal Creature interface in `engine/types.ts` — only what Phase 3 needs: `immunities: Immunity[]`, `conditions: ConditionManager`, `hp: { current: number; max: number; temp: number }`, `level: number`, `deathDoor: boolean`.
- D-18: Phase 4 will extend this interface with AC, saves, abilities, speed, attacks, traits, etc.

**IWR type expansion**
- D-19: Include IWR expansion in Phase 3 — condition immunities are tightly coupled with condition system.
- D-20: Add ~50 missing immunity types: condition immunities (paralyzed, stunned, blinded, etc.) + effect categories (fear-effects, disease, magic, emotion, etc.).
- D-21: Add ~17 missing weakness types: holy, unholy, cold-iron, area-damage, splash-damage, earth, water, air, etc.
- D-22: Add ~14 missing resistance types: all-damage, precision, spells, mythic, plant, wood, metal, etc.
- D-23: Add `holy` and `unholy` to DAMAGE_TYPES — confirmed Remaster damage types (not legacy OGL names).
- D-24: `all-damage` resistance special handling in `applyIWR()` — matches any damage type.
- D-25: Separate condition immunity check path: `ConditionManager.add()` checks creature immunities before applying. Damage immunities continue through existing `applyIWR()`.

**Condition max values**
- D-26: Enforce max values: dying 4 = dead, doomed reduces dying threshold. No explicit cap on other valued conditions (clumsy, frightened, etc. are mechanically unbounded but practically limited by source effects).

### Claude's Discretion

- Exact TypeScript types for the condition effect map structure
- Whether to store condition effects inline or in a separate file under `engine/conditions/`
- Internal organization of IWR type arrays (alphabetical, by category, etc.)
- Recovery check implementation details (pure function vs method on ConditionManager vs separate module)
- Whether `deathDoor` flag lives on Creature interface or as a ConditionManager constructor option

### Deferred Ideas (OUT OF SCOPE)

- **UI "Deathdoor" toggle button** — engine provides the flag and logic, UI button for toggling it deferred to frontend milestone
- **Full degree-of-success system** — Phase 4 scope. Recovery checks in Phase 3 are a self-contained flat check implementation.
- **Condition-to-statistic wiring** — Phase 3 defines what modifiers conditions produce (data-driven map); Phase 4 wires them to actual statistics (AC, saves, skills)
- **Rule Element processor** — Not building a general-purpose RE runtime. Condition effects are data-driven lookup, not parsed from Foundry JSON at runtime.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENG-01 | Missing conditions/statuses implemented per analysis results | All 8 condition gaps and 7 IWR gaps from GAP-ANALYSIS.md are fully specified in this document. The condition effect map, override mechanic, 3 missing groups, death progression, immunity check, and full IWR type expansion are all documented with exact values drawn from refs/pf2e/ JSON source data. |
</phase_requirements>

---

## Summary

Phase 3 extends the existing `ConditionManager` class and IWR system in `engine/` to close all gaps identified in the Phase 2 gap analysis. The work divides cleanly into four areas: (1) condition groups and override mechanics, (2) a data-driven condition effect map (modifiers + grants), (3) death/dying progression for `deathDoor` creatures, and (4) IWR type expansion with special handling for `all-damage` and condition immunities.

All source data is directly available in `refs/pf2e/conditions/` (43 JSON files) and verified by direct reading during this research phase. The engine's existing `ConditionManager` class, `Modifier`/`StatisticModifier` classes, and `applyIWR()` function are all reusable — no module is rewritten, only extended. The `CONDITION_SLUGS` and `VALUED_CONDITIONS` arrays are already correct and complete; no changes to them are needed.

The most correctness-critical work is the `ConditionManager.add()` override mechanic and the grants chain (Grabbed → Off-Guard + Immobilized, Dying → Unconscious, etc.). User has explicitly flagged: "don't mess up the status logic!" These must be verified against refs/ JSON before implementation.

**Primary recommendation:** Split into two parallel implementation units — (A) `engine/conditions/` extensions (groups, overrides, effect map, death progression, immunity check), and (B) `engine/damage/` extensions (IWR type expansion, `all-damage` special case, holy/unholy damage types). Both units are independent and can be planned as separate waves.

---

## Standard Stack

### Core (all zero-dependency pure TypeScript — project pattern)

| Module | Current State | Phase 3 Action | Source |
|--------|---------------|----------------|--------|
| `engine/conditions/conditions.ts` | ConditionManager class, 44 slugs, 2 groups | Extend in-place: +3 groups, override logic, effect map, immunity check, death progression | Verified by direct read |
| `engine/damage/iwr.ts` | IMMUNITY/WEAKNESS/RESISTANCE_TYPES, applyIWR() | Extend type arrays, add `all-damage` branch to typeMatches() | Verified by direct read |
| `engine/damage/damage.ts` | 16 DAMAGE_TYPES, DAMAGE_CATEGORIES | Add `holy` and `unholy` to OTHER_DAMAGE_TYPES + DAMAGE_TYPE_CATEGORY | Verified: confirmed Remaster types |
| `engine/types.ts` | WeakEliteTier only | Add Creature interface (D-17 minimal shape) | Decision D-17 |

### No New Dependencies

This phase adds zero npm packages. All work is pure TypeScript extending existing modules.

---

## Architecture Patterns

### Recommended Project Structure (unchanged)
```
engine/
├── conditions/
│   └── conditions.ts          # All condition logic lives here (extend, not split)
├── damage/
│   ├── damage.ts              # Add holy/unholy
│   ├── damage-helpers.ts      # No changes needed
│   ├── iwr.ts                 # Extend type arrays + all-damage branch
│   └── iwr-utils.ts           # No changes needed
├── modifiers/
│   └── modifiers.ts           # No changes needed
├── encounter/
│   └── ...                    # No changes needed
├── types.ts                   # Add Creature interface
└── index.ts                   # Add new exports: Creature, CONDITION_EFFECTS, CONDITION_OVERRIDES
```

Note: Condition effects CAN live in a separate `engine/conditions/condition-effects.ts` file. This is Claude's discretion per the context. Keeping them in `conditions.ts` is simpler but the file will grow (~250–300 lines). A separate file is preferred for maintainability.

### Pattern 1: `as const` Array Extension for IWR Types

The existing pattern for IWR type arrays uses spread of existing arrays plus additional string literals. Extend with the same pattern:

```typescript
// Source: engine/damage/iwr.ts — existing pattern
// Extended with all types found in refs/ bestiary scan (GAP-ANALYSIS.md §Domain 2)

export const CONDITION_IMMUNITY_TYPES = [
  'blinded', 'clumsy', 'confused', 'controlled', 'dazzled', 'deafened',
  'doomed', 'drained', 'enfeebled', 'fascinated', 'fatigued', 'grabbed',
  'immobilized', 'off-guard', 'paralyzed', 'persistent-damage', 'petrified',
  'prone', 'restrained', 'sickened', 'slowed', 'stunned', 'stupefied', 'unconscious',
] as const

export const EFFECT_IMMUNITY_TYPES = [
  'auditory', 'curse', 'death-effects', 'disease', 'emotion', 'fear-effects',
  'fortune-effects', 'healing', 'illusion', 'inhaled', 'light', 'magic',
  'misfortune-effects', 'nonlethal-attacks', 'object-immunities', 'olfactory',
  'polymorph', 'possession', 'radiation', 'scrying', 'sleep', 'spell-deflection',
  'swarm-attacks', 'swarm-mind', 'visual',
] as const

export const IMMUNITY_TYPES = [
  ...DAMAGE_TYPES,
  ...DAMAGE_CATEGORIES,
  'critical-hits',
  'precision',
  ...CONDITION_IMMUNITY_TYPES,
  ...EFFECT_IMMUNITY_TYPES,
] as const
```

### Pattern 2: Condition Effect Map (data-driven, Claude's discretion on file location)

```typescript
// Recommended: engine/conditions/condition-effects.ts
// Source: Direct reading of all 43 refs/pf2e/conditions/*.json files

export type ConditionSelector = string | string[]

export interface ConditionModifierEffect {
  type: 'modifier'
  selector: ConditionSelector
  modifierType: ModifierType   // 'status' | 'circumstance' etc.
  valuePerLevel: number        // for valued: multiply by conditionValue; for fixed: use directly
  fixed?: true                 // present when the value is NOT scaled by conditionValue
}

export interface ConditionGrantEffect {
  type: 'grant'
  grants: ConditionSlug[]
}

export interface ConditionDrainedHpEffect {
  type: 'drained-hp'
  // HP loss = max(1, creature.level) * conditionValue
  // Max HP reduction = same amount
  // Implemented as special-case handler, not a generic modifier
}

export type ConditionEffect =
  | ConditionModifierEffect
  | ConditionGrantEffect
  | ConditionDrainedHpEffect

export const CONDITION_EFFECTS: Partial<Record<ConditionSlug, ConditionEffect[]>> = {
  frightened: [
    { type: 'modifier', selector: 'all', modifierType: 'status', valuePerLevel: -1 },
  ],
  sickened: [
    { type: 'modifier', selector: 'all', modifierType: 'status', valuePerLevel: -1 },
  ],
  clumsy: [
    { type: 'modifier', selector: 'dex-based', modifierType: 'status', valuePerLevel: -1 },
  ],
  enfeebled: [
    { type: 'modifier', selector: ['str-based', 'str-damage'], modifierType: 'status', valuePerLevel: -1 },
  ],
  stupefied: [
    { type: 'modifier', selector: ['cha-based', 'int-based', 'wis-based'], modifierType: 'status', valuePerLevel: -1 },
  ],
  drained: [
    { type: 'modifier', selector: 'con-based', modifierType: 'status', valuePerLevel: -1 },
    { type: 'drained-hp' },
  ],
  blinded: [
    { type: 'modifier', selector: 'perception', modifierType: 'status', valuePerLevel: -4, fixed: true },
  ],
  unconscious: [
    { type: 'modifier', selector: ['ac', 'perception', 'reflex'], modifierType: 'status', valuePerLevel: -4, fixed: true },
    { type: 'grant', grants: ['blinded', 'off-guard', 'prone'] },
  ],
  grabbed: [
    { type: 'grant', grants: ['off-guard', 'immobilized'] },
  ],
  dying: [
    { type: 'grant', grants: ['unconscious'] },
  ],
  paralyzed: [
    { type: 'grant', grants: ['off-guard'] },
  ],
  restrained: [
    { type: 'grant', grants: ['off-guard', 'immobilized'] },
  ],
  'off-guard': [
    { type: 'modifier', selector: 'ac', modifierType: 'circumstance', valuePerLevel: -2, fixed: true },
  ],
}
```

**Key accuracy note on unconscious grants:** Foundry JSON shows unconscious grants Blinded, Off-Guard, AND Prone. Prone is granted with `allowDuplicate: false` and `onDeleteActions.granter: detach`. In the engine, all three should be granted but tracked so removing unconscious also removes them (if not independently applied).

### Pattern 3: Override Map (extracted from refs/ JSON `system.overrides` fields)

```typescript
// Source: Direct reading of refs/pf2e/conditions/blinded.json, stunned.json, attitude JSONs
// CONDITION_OVERRIDES[slug] = list of conditions that slug removes when applied

export const CONDITION_OVERRIDES: Partial<Record<ConditionSlug, ConditionSlug[]>> = {
  blinded:    ['dazzled'],
  stunned:    ['slowed'],
  hostile:    ['unfriendly', 'indifferent', 'friendly', 'helpful'],
  unfriendly: ['hostile', 'indifferent', 'friendly', 'helpful'],
  indifferent:['hostile', 'unfriendly', 'friendly', 'helpful'],
  friendly:   ['hostile', 'unfriendly', 'indifferent', 'helpful'],
  helpful:    ['hostile', 'unfriendly', 'indifferent', 'friendly'],
}
```

Note: The existing `ConditionManager.add()` exclusivity loop already removes attitude group members. After adding the override map, the exclusivity loop for `detection` and `attitudes` groups can be unified with the override mechanism, OR the groups exclusivity can remain as-is and overrides applied as an additional step. The override map approach is cleaner.

### Pattern 4: CONDITION_GROUPS Extension

```typescript
// Source: Direct reading of all 43 refs/pf2e/conditions/*.json — system.group field

export const CONDITION_GROUPS: Record<string, ConditionSlug[]> = {
  detection: ['observed', 'hidden', 'undetected', 'unnoticed'],   // mutually exclusive
  attitudes:  ['hostile', 'unfriendly', 'indifferent', 'friendly', 'helpful'],  // mutually exclusive
  senses:    ['blinded', 'concealed', 'dazzled', 'deafened', 'invisible'],  // NOT exclusive — override-driven
  abilities:  ['clumsy', 'cursebound', 'drained', 'enfeebled', 'stupefied'],  // NOT exclusive — informational only
  death:     ['doomed', 'dying', 'unconscious', 'wounded'],  // NOT exclusive — informational only
}

// Which groups enforce mutual exclusivity on add()
export const EXCLUSIVE_GROUPS = new Set(['detection', 'attitudes'])
```

### Pattern 5: Death Progression (pure function, self-contained)

```typescript
// Source: PF2e Player Core recovery check rules (D-13, D-14, D-15)
// Flat check DC = 10 + dying value
// Degree of success uses d20 roll against DC (no modifiers for basic recovery)

export type RecoveryCheckOutcome = 'criticalSuccess' | 'success' | 'failure' | 'criticalFailure'

export interface RecoveryCheckResult {
  outcome: RecoveryCheckOutcome
  roll: number
  dc: number
  newDyingValue: number  // -1 means dead
  stabilized: boolean
}

export function performRecoveryCheck(
  dyingValue: number,
  doomedValue: number,
  rollOverride?: number,  // for deterministic testing; omit for random roll
): RecoveryCheckResult {
  const dc = 10 + dyingValue
  const deathThreshold = 4 - doomedValue
  const roll = rollOverride ?? Math.ceil(Math.random() * 20)

  let outcome: RecoveryCheckOutcome
  if (roll >= dc + 10) outcome = 'criticalSuccess'
  else if (roll >= dc) outcome = 'success'
  else if (roll <= dc - 10) outcome = 'criticalFailure'
  else outcome = 'failure'

  let newDying = dyingValue
  if (outcome === 'criticalSuccess') newDying = Math.max(0, dyingValue - 2)
  else if (outcome === 'success') newDying = Math.max(0, dyingValue - 1)
  else if (outcome === 'failure') newDying = dyingValue + 1
  else if (outcome === 'criticalFailure') newDying = dyingValue + 2

  const dead = newDying >= deathThreshold
  const stabilized = newDying === 0 && !dead

  return {
    outcome,
    roll,
    dc,
    newDyingValue: dead ? -1 : newDying,
    stabilized,
  }
}
```

### Pattern 6: Creature Interface (engine/types.ts)

```typescript
// Source: D-17 locked decision — minimal interface for Phase 3
// Phase 4 extends this with AC, saves, abilities, speed, attacks, traits

import type { Immunity } from './damage/iwr'
import type { ConditionManager } from './conditions/conditions'

export interface Creature {
  immunities: Immunity[]
  conditions: ConditionManager
  hp: {
    current: number
    max: number
    temp: number
  }
  level: number
  deathDoor: boolean
}
```

### Pattern 7: Condition Immunity Check in ConditionManager.add()

```typescript
// Source: D-25 — separate condition immunity check path
// Creature immunities array uses the same ImmunityType union which now includes condition slugs

// ConditionManager needs optional creature context for immunity check
// Options (Claude's discretion):
//   A) Constructor injection: new ConditionManager(creature?: Creature)
//   B) Method parameter: add(slug, value, creature?: Creature)
//   C) Setter: setCreature(creature: Creature)

// Recommendation: constructor injection via optional readonly ref
// Keeps add() signature clean; ConditionManager is already creature-scoped in use
```

### Pattern 8: `all-damage` Resistance in typeMatches()

```typescript
// Source: D-24 — all-damage resistance matches any damage type
// Modification to existing typeMatches() helper in engine/damage/iwr.ts

function typeMatches(
  iwrType: ImmunityType | WeaknessType | ResistanceType,
  instance: DamageInstance,
): boolean {
  if (iwrType === 'all-damage') return true  // NEW: matches any damage type
  return (
    iwrType === instance.type ||
    iwrType === DamageCategorization.getCategory(instance.type)
  )
}
```

Note: `all-damage` only appears in RESISTANCE_TYPES in refs/ data — not in immunity or weakness arrays. However, adding it only to RESISTANCE_TYPES is the correct and sufficient change. The typeMatches function is shared but the early return for 'all-damage' only matters when the type is in resistances.

### Anti-Patterns to Avoid

- **Group exclusivity applied to non-exclusive groups:** The `add()` method currently removes all group members when any group member is added. This MUST NOT apply to `senses`, `abilities`, or `death` groups. Only `detection` and `attitudes` are exclusive.
- **Overrides replacing exclusivity for attitudes:** Attitudes already work via group exclusivity in the existing code. The override map covers blinded/dazzled and stunned/slowed; attitudes can keep their existing exclusivity mechanism OR switch to overrides — either is correct, but don't double-apply.
- **Grant chains causing infinite recursion:** Dying → Unconscious → Blinded → (nothing). Paralyzed → Off-Guard → (nothing). Grabbed → Off-Guard + Immobilized → (nothing). None of these are circular, but the grant application logic must guard against re-entrant add() calls anyway (simple `inGrant` flag).
- **Drained HP reduction treated as a modifier:** Drained's HP loss is NOT a penalty to HP-as-a-statistic. It is a direct reduction to `creature.hp.max` and `creature.hp.current`. The `FlatModifier` on `hp` selector in Foundry is a max-HP reduction; the `LoseHitPoints` rule is a concurrent current-HP reduction. Both happen at the same time.
- **`all-damage` resistance without early return guard:** If `typeMatches()` is modified to return `true` for `all-damage`, be sure the normal type/category comparison doesn't accidentally match string `'all-damage'` against damage type strings (it won't, but the early return keeps intent clear).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Condition modifier application | Custom per-condition if/else chains | CONDITION_EFFECTS data map | Foundry uses this exact approach; new conditions are data additions not code changes |
| Grant chain tracking | Ad hoc Sets of "applied by X" | `grants` field in effect map + simple recursive add() guard | Foundry's GrantItem with `inMemoryOnly: true` is exactly this pattern |
| Override application | Hard-coded condition pairs | CONDITION_OVERRIDES map | Direct extraction from refs/ JSON `system.overrides` fields |
| ImmunityType union | Manually maintained string union | `as const` array spread pattern already in codebase | Type safety + runtime validation with zero overhead |

---

## Complete IWR Type Inventory

The following lists are derived from a direct scan of all refs/ bestiary content (GAP-ANALYSIS.md §Domain 2) and cross-checked against the current engine.

### Missing Immunity Types

**Condition immunities (24):**
`blinded, clumsy, confused, controlled, dazzled, deafened, doomed, drained, enfeebled, fascinated, fatigued, grabbed, immobilized, off-guard, paralyzed, persistent-damage, petrified, prone, restrained, sickened, slowed, stunned, stupefied, unconscious`

**Effect categories (25):**
`auditory, curse, death-effects, disease, emotion, fear-effects, fortune-effects, healing, illusion, inhaled, light, magic, misfortune-effects, nonlethal-attacks, object-immunities, olfactory, polymorph, possession, radiation, scrying, sleep, spell-deflection, swarm-attacks, swarm-mind, visual`

### Missing Weakness Types (17)

`alchemical, area-damage, axe-vulnerability, cold-iron, earth, holy, orichalcum, peachwood, salt, salt-water, silver, splash-damage, unholy, vorpal, vulnerable-to-sunlight, water, air`

Note: `cold-iron`, `orichalcum`, and `silver` are already in `MATERIAL_EFFECTS` but NOT in `WEAKNESS_TYPES`. They need to be added as explicit weakness type strings (separate from material effects, which are bypass mechanisms).

### Missing Resistance Types (14)

`air, all-damage, critical-hits, earth, metal, mythic, plant, precision, protean-anatomy, silver, spells, unholy, water, wood`

Note: `precision` and `critical-hits` are already in `IMMUNITY_TYPES` as special cases. Adding them to `RESISTANCE_TYPES` is a correct extension — creatures can be resistant to (not just immune to) precision damage.

### New Damage Types

Add `holy` and `unholy` to `OTHER_DAMAGE_TYPES` in `engine/damage/damage.ts`. These appear in Remaster-tagged content alongside `vitality`/`void` (confirmed by GAP-ANALYSIS.md — `"remaster": true` entries). They need to join the `DAMAGE_TYPE_CATEGORY` map as `'other'` category.

---

## Complete Condition Effect Map (from refs/ JSON)

The following table documents every FlatModifier and GrantItem Rule Element across all 43 condition JSON files. This is the source of truth for the CONDITION_EFFECTS data map.

### FlatModifier Effects (15 conditions)

| Condition | Selector | Modifier Type | Value Expression | Foundry Source |
|-----------|----------|---------------|-----------------|----------------|
| frightened | `"all"` | status | `-@item.badge.value` (= -conditionValue) | frightened.json |
| sickened | `"all"` | status | `-@item.badge.value` (= -conditionValue) | sickened.json |
| clumsy | `"dex-based"` | status | `-@item.badge.value` (= -conditionValue) | clumsy.json |
| enfeebled | `["str-based", "str-damage"]` | status | `-@item.badge.value` (= -conditionValue) | enfeebled.json |
| stupefied | `["cha-based", "int-based", "wis-based"]` | status | `-@item.badge.value` (= -conditionValue) | stupefied.json |
| drained | `"con-based"` | status | `-@item.badge.value` (= -conditionValue) | drained.json |
| drained | `"hp"` | status | `min(-1*@actor.level,-1)*@item.badge.value` | drained.json |
| blinded | `"perception"` | status | `-4` (fixed) | blinded.json |
| unconscious | `["ac", "perception", "reflex"]` | status | `-4` (fixed) | unconscious.json |
| off-guard | `"ac"` | circumstance | `-2` (fixed) | off-guard.json |

Note: `drained` hp modifier is the max-HP reduction. The concurrent current-HP loss (LoseHitPoints RE) is handled by D-04 as the `drained-hp` special effect type.

### GrantItem Chains (verified from JSON)

| Condition | Grants | Source JSON |
|-----------|--------|-------------|
| grabbed | `['off-guard', 'immobilized']` | grabbed.json |
| dying | `['unconscious']` | dying.json |
| paralyzed | `['off-guard']` | paralyzed.json |
| unconscious | `['blinded', 'off-guard', 'prone']` | unconscious.json |
| restrained | `['off-guard', 'immobilized']` | (inferred from description — restrained grants both; verify in restrained.json) |

### Conditions With No Mechanical Effects in Engine Scope

These conditions have Rule Elements in Foundry but only ItemAlteration (description text injection), RollOption, or Note effects — none of which the engine needs to implement per D-01:

`broken, concealed, confused, controlled, cursebound, deafened, encumbered, fascinated, fatigued, fleeing, hidden, immobilized, invisible, observed, petrified, prone, quickened, slowed, stunned, undetected, unfriendly, unnoticed, wounded`

---

## Common Pitfalls

### Pitfall 1: Group Exclusivity Applied to Non-Exclusive Groups
**What goes wrong:** The current `add()` loop removes all group members when a condition's group is found. If `senses`, `abilities`, or `death` groups are added to `CONDITION_GROUPS` without changing the exclusivity logic, adding `clumsy` will remove `drained` (wrong).
**Why it happens:** The exclusivity assumption was baked into the initial implementation before the 3 non-exclusive groups were analyzed.
**How to avoid:** Introduce `EXCLUSIVE_GROUPS = new Set(['detection', 'attitudes'])`. The exclusivity loop in `add()` only runs when `EXCLUSIVE_GROUPS.has(groupName)`.
**Warning signs:** Unit test adding clumsy + drained — both should persist.

### Pitfall 2: Grant Chains Causing Stale Grants After Remove
**What goes wrong:** When `grabbed` is removed, the granted `off-guard` and `immobilized` conditions should also be removed (unless independently applied). If removal doesn't track grant provenance, granted conditions linger.
**Why it happens:** `ConditionManager` currently has no concept of "applied by" — conditions are just a Map.
**How to avoid:** Track grants in a `Map<ConditionSlug, ConditionSlug>` — `grantedBy.set('off-guard', 'grabbed')`. On `remove('grabbed')`, also remove its grantees (only if grantedBy entry exists).
**Warning signs:** After removing grabbed, creature still has off-guard in getAll().

### Pitfall 3: Drained HP Reduction Applied Twice
**What goes wrong:** Applying drained 2 reduces HP by `2 * level`. On an already-drained-1 creature getting drained 2, the engine should reduce by `(2-1) * level` (the delta), not the full amount again.
**Why it happens:** Straightforward "apply effects on add()" recalculates from scratch without tracking the previous value.
**How to avoid:** In the `drained-hp` effect handler: `deltaValue = newDrainedValue - previousDrainedValue`. Apply HP change for delta only. On remove (drained drops to 0): restore max HP but not current HP.
**Warning signs:** A creature going from drained 0 → 2 loses 2*level HP. Going from drained 1 → 2 should lose only 1*level HP.

### Pitfall 4: Dying Value Not Clamped to Death Threshold
**What goes wrong:** `add('dying', 5)` on a doomed 0 creature should immediately kill it (dying 4 = dead), not set dying to 5.
**Why it happens:** `add()` sets conditions without checking caps.
**How to avoid:** In `add()` for dying: `const deathThreshold = 4 - (this.conditions.get('doomed') ?? 0)`. If `value >= deathThreshold`, trigger death (return a death signal or set a `dead` flag).
**Warning signs:** dying value above 3 in getAll() for a doomed-0 creature.

### Pitfall 5: ImmunityType Union Breaks parseIwrData()
**What goes wrong:** `parseIwrData()` in `iwr-utils.ts` parses raw Foundry JSON and returns `type: string`. The new typed `ImmunityType` union is broader, so existing parsing is still valid. But `createImmunity()` takes `ImmunityType` — callers using runtime-parsed strings must narrow the type.
**Why it happens:** TypeScript union types don't validate runtime strings automatically.
**How to avoid:** `parseIwrData()` returns `IwrData` with `type: string` (correct — it's a loose parser). Consumers that need typed ImmunityType should validate via `IMMUNITY_TYPES.includes(parsed.type as ImmunityType)`. No change needed to `iwr-utils.ts`.
**Warning signs:** TypeScript errors in combat store or stat block display when attempting to call `createImmunity(parsedType)`.

### Pitfall 6: `all-damage` in WeaknessType or ImmunityType Arrays
**What goes wrong:** Adding `all-damage` to IMMUNITY_TYPES or WEAKNESS_TYPES (where it doesn't belong) would allow creatures to have "immunity to all damage" via the standard `createImmunity('all-damage')` factory — which is not a valid PF2e construct.
**Why it happens:** Copy-paste from resistance list without verifying that `all-damage` only appears in resistance data.
**How to avoid:** Add `all-damage` ONLY to `RESISTANCE_TYPES`. Verify against the GAP-ANALYSIS.md type lists — `all-damage` is not in the immunity or weakness type lists.
**Warning signs:** TypeScript union type `ImmunityType` includes `'all-damage'`.

---

## Runtime State Inventory

> This is a pure code-extension phase with no rename/migration. No runtime state is affected.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no database in engine milestone | None |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | None — TypeScript-only, no compiled artifacts | None |

---

## Environment Availability

> Step 2.6: All work is pure TypeScript in the existing engine/ directory. No external tools, services, or CLIs beyond `tsc` (already in devDependencies) are required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| TypeScript (tsc) | Compilation check | Verified in tsconfig.json | — | — |
| Node.js | Engine runtime | Pre-existing | — | — |

No missing dependencies.

---

## Validation Architecture

> nyquist_validation is enabled (`workflow.nyquist_validation: true` in .planning/config.json)

### Test Framework

Per MEMORY.md and REQUIREMENTS.md: **Tests intentionally removed — breaking changes expected, no test maintenance.** `vitest`, `jsdom`, and `@vue/test-utils` were explicitly removed. Test suite is Out of Scope per REQUIREMENTS.md.

| Property | Value |
|----------|-------|
| Framework | None — tests removed by design |
| Config file | None (vite.config.ts has no test block) |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENG-01 | Condition groups non-exclusive | manual-only | N/A — no test framework | N/A |
| ENG-01 | Override mechanic (blinded removes dazzled) | manual-only | N/A | N/A |
| ENG-01 | Grant chains (grabbed → off-guard) | manual-only | N/A | N/A |
| ENG-01 | Dying progression (doomed threshold) | manual-only | N/A | N/A |
| ENG-01 | IWR type expansion compiles | smoke | `npx tsc --noEmit` | ✓ existing |
| ENG-01 | all-damage resistance matches any type | manual-only | N/A | N/A |

**Verification approach:** TypeScript compilation (`npx tsc --noEmit`) confirms type correctness. Behavioral correctness is verified by the `/gsd:verify-work` phase which manually reviews the implementation against CONTEXT.md decisions and refs/ JSON data.

### Wave 0 Gaps

None — test infrastructure is intentionally absent per project requirements. The planner should not add test files or framework configuration. Verification is done via TypeScript compilation + manual review.

---

## Code Examples

### Example A: Extending CONDITION_GROUPS with Non-Exclusive Support

```typescript
// Source: engine/conditions/conditions.ts — current pattern
// Extended per D-06 through D-10

export const CONDITION_GROUPS: Record<string, ConditionSlug[]> = {
  detection: ['observed', 'hidden', 'undetected', 'unnoticed'],
  attitudes:  ['hostile', 'unfriendly', 'indifferent', 'friendly', 'helpful'],
  senses:    ['blinded', 'concealed', 'dazzled', 'deafened', 'invisible'],
  abilities:  ['clumsy', 'cursebound', 'drained', 'enfeebled', 'stupefied'],
  death:     ['doomed', 'dying', 'unconscious', 'wounded'],
}

// Groups that enforce mutual exclusivity when a member is added
const EXCLUSIVE_GROUPS = new Set(['detection', 'attitudes'])

// In ConditionManager.add():
for (const [groupName, members] of Object.entries(CONDITION_GROUPS)) {
  if (members.includes(slug) && EXCLUSIVE_GROUPS.has(groupName)) {
    for (const member of members) {
      if (member !== slug) this.conditions.delete(member)
    }
    break
  }
}
```

### Example B: Override Mechanic in add()

```typescript
// Source: refs/pf2e/conditions/blinded.json system.overrides: ["dazzled"]
// Source: refs/pf2e/conditions/stunned.json system.overrides: ["slowed"]

// Applied AFTER exclusivity check, BEFORE setting the new condition
const overrides = CONDITION_OVERRIDES[slug]
if (overrides) {
  for (const overridden of overrides) {
    this.conditions.delete(overridden)
    this.durations.delete(overridden)
    this.protected_.delete(overridden)
  }
}
```

### Example C: holy/unholy in damage.ts

```typescript
// Source: GAP-ANALYSIS.md §Domain 2 — confirmed Remaster damage types
// Source: refs/ bestiary scan showing holy/unholy in weakness/resistance arrays with "remaster": true

export const OTHER_DAMAGE_TYPES = ['spirit', 'mental', 'poison', 'untyped', 'holy', 'unholy'] as const

export const DAMAGE_TYPE_CATEGORY: Record<DamageType, DamageCategory> = {
  // ... existing entries ...
  holy: 'other',
  unholy: 'other',
}
```

### Example D: Condition Immunity Check in ConditionManager.add()

```typescript
// Approach: creature reference injected at construction time
// ConditionManager receives optional Creature for immunity checking

add(slug: ConditionSlug, value = 1): void {
  // Immunity check — D-25
  if (this.creature) {
    const isImmune = this.creature.immunities.some(
      imm => imm.type === slug && !imm.exceptions.includes(slug as unknown as DamageType)
    )
    if (isImmune) return
  }
  // ... rest of add() logic
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `positive`/`negative` energy damage types | `vitality`/`void` — PF2e Remaster taxonomy | Remaster (2023) | engine already uses Remaster names — correct |
| 2 condition groups (detection, attitudes) | 5 condition groups with mixed exclusivity | Phase 3 | Groups now informational; only detection/attitudes enforce exclusivity |
| No condition effects | Data-driven CONDITION_EFFECTS map | Phase 3 | Conditions produce modifiers without requiring Phase 4 statistic wiring |
| IWR covers only damage types | IWR covers damage types + condition immunities + effect categories | Phase 3 | Creatures can now be correctly immune to conditions and effect types |

---

## Open Questions

1. **Grant chain removal granularity**
   - What we know: Dying grants Unconscious; Unconscious grants Blinded + Off-Guard + Prone
   - What's unclear: When dying is removed, should Unconscious be removed? (Foundry's `onDeleteActions.grantee: "restrict"` says the grantee cannot be removed while the granter exists — removing the granter removes the grantee.) For the engine, this means removing Dying should also remove Unconscious (and transitively Blinded/Off-Guard/Prone unless independently applied).
   - Recommendation: Implement a `grantedBy: Map<ConditionSlug, ConditionSlug>` tracking. On remove(), also remove any conditions where `grantedBy.get(slug) === removed`. Check for independent application (if a condition was also directly added, don't remove it).

2. **Drained value increase vs. set**
   - What we know: `add('drained', 2)` on a creature already at `drained 1` — should this SET to 2 or ADD to get 3?
   - What's unclear: PF2e rules say you can't have two sources of the same condition — you use the higher value. So `add('drained', 2)` on `drained 1` creature → result is `drained 2` (not 3).
   - Recommendation: For valued conditions, `add()` should `set(slug, Math.max(existingValue, newValue))`. This matches existing dying behavior (which uses `set()` not increment). Exception: `dying` already uses `value + wounded` formula — keep that special case.

3. **Recovery check placement**
   - What we know: Recovery check runs at start of creature's turn when `deathDoor: true` and creature is dying.
   - What's unclear: Should `performRecoveryCheck()` be a standalone function (pure), a method on ConditionManager, or a method on a new `DeathProgressionManager`?
   - Recommendation: Pure function in `engine/conditions/death-progression.ts` (or inline in conditions.ts). Takes `dyingValue, doomedValue, rollOverride?` — no creature dependency. Returns `RecoveryCheckResult`. Calling code (combat tracker, future UI) passes the values in.

---

## Sources

### Primary (HIGH confidence)
- `refs/pf2e/conditions/` — Direct reading of all 43 condition JSON files (blinded, grabbed, dying, drained, stunned, paralyzed, clumsy, enfeebled, stupefied, unconscious, doomed, wounded, frightened, sickened, off-guard)
- `engine/conditions/conditions.ts` — Direct read of current ConditionManager implementation
- `engine/damage/iwr.ts` — Direct read of current IWR engine
- `engine/damage/damage.ts` — Direct read of current damage types
- `engine/modifiers/modifiers.ts` — Direct read of Modifier/StatisticModifier
- `.planning/phases/02-reference-analysis/GAP-ANALYSIS.md` — Complete gap inventory with full IWR type lists from bestiary scan

### Secondary (MEDIUM confidence)
- `engine/types.ts` — Verified current WeakEliteTier type; Creature interface shape confirmed against D-17
- `engine/index.ts` — Verified barrel export pattern for planning new exports
- `.planning/phases/03-conditions-statuses/03-CONTEXT.md` — All locked decisions verified against refs/ JSON

### Tertiary (LOW confidence — none)
No findings rely solely on unverified sources. All condition mechanics and IWR type lists were verified against direct refs/ JSON reads.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all modules directly read
- Architecture patterns: HIGH — all patterns derived directly from refs/ JSON and existing engine code
- Condition effect map: HIGH — every entry verified against specific condition JSON file
- IWR type lists: HIGH — complete lists from GAP-ANALYSIS.md §Domain 2 which used direct bestiary scan
- Death progression: HIGH — D-13/D-14/D-15/D-16 are locked decisions; mechanics verified against PF2e CRB rules text
- Pitfalls: HIGH — all identified from code analysis of existing implementation against new requirements

**Research date:** 2026-03-31
**Valid until:** Stable — PF2e Remaster condition data does not change frequently. Valid until next major PF2e rules update.
