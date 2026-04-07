# Phase 4: Actions & Modifier Math - Research

**Researched:** 2026-03-31
**Domain:** PF2e action data system, statistic model, condition-to-modifier wiring, degree-of-success, MAP
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Action system**
- D-01: All 545 action entries from `refs/pf2e/actions/` included as typed data entries. Each entry has: actionType (action/reaction/free/passive), cost (1/2/3/null), category (offensive/defensive/interaction/null), traits array.
- D-02: Data + outcome descriptors model. Actions are declarative data, not executable logic. The engine does not roll dice or execute action resolution — it stores what each action does per degree-of-success.
- D-03: Outcome descriptors cover combat-relevant actions only (~40): basic actions (30) + combat skill actions (~10: Demoralize, Feint, Grapple, Shove, Trip, Disarm, Tumble Through, Steal, Dirty Trick). Remaining ~500 actions are data-only entries with no outcome maps.
- D-04: Outcome descriptors are declarative maps keyed by degree-of-success (critical_success, success, failure, critical_failure), describing what conditions/effects apply at each degree.

**Multiple Attack Penalty (MAP)**
- D-05: MAP is hardcoded per-attack with modifier influence. Each attack (melee/ranged) on a creature pre-computes 3 `StatisticModifier` sets: Attack 1 (MAP 0), Attack 2 (MAP -5 or -4 agile), Attack 3 (MAP -10 or -8 agile).
- D-06: MAP penalty is an untyped modifier baked into the StatisticModifier alongside condition/situational modifiers. Consumer selects which attack number (1/2/3) they're using.
- D-07: Agile trait on weapon/attack determines MAP values (-4/-8 vs -5/-10).

**Statistic system**
- D-08: Base value + modifier overlay model. Each statistic has a base value (from Foundry JSON creature data) and collects active modifiers from conditions and situational effects. Effective value = base + totalModifier.
- D-09: Full statistic coverage from Foundry schema: AC, Fortitude, Reflex, Will, Perception, all skills present on a creature, speed (land + other types), initiative.
- D-10: Condition-to-statistic wiring is auto-inject on condition change. When ConditionManager adds/removes a condition, it automatically pushes/pulls modifiers to affected statistics. Frightened 2 auto-adds -2 status to all checks. DM sees updated values immediately.
- D-11: Selector resolution from CONDITION_EFFECTS wires to actual statistics: `"all"` = all statistics, `"dex-based"` = Reflex + Dex skills + AC, `"perception"` = Perception, `"ac"` = AC, `"con-based"` = Fortitude + Con checks, etc.

**Creature interface expansion**
- D-12: Full NPC stat block. Creature interface extended with: abilities (6 mods), AC, saves (Fort/Ref/Will), perception, skills, speed (land + otherSpeeds), senses, traits, size, rarity, languages, initiative.
- D-13: Melee/ranged attacks embedded in Creature as `attacks[]` array. Each entry: name, bonus (base value), damage formula, traits (agile, reach, finesse, etc.), attack type (melee/ranged). Sourced from Foundry `items[]` where `type: "melee"`.
- D-14: Each attack entry holds 3 pre-computed StatisticModifier sets for MAP positions (D-05).
- D-15: Creature abilities (Reactive Strike, Grab, Constrict, Frightful Presence, etc.) are SKIPPED in Phase 4.
- D-16: Creature spellcasting entries are NOT modeled in Phase 4.

**Degree-of-success system**
- D-17: Calculation + adjustment pipeline. Given a total check result and DC, return the degree (critical_success / success / failure / critical_failure). Handles the +10/-10 rule for crit thresholds.
- D-18: Adjustment pipeline supports degree upgrades/downgrades from traits and effects.
- D-19: Phase 4 implements core adjustments only: nat 20/nat 1 upgrade/downgrade, Incapacitation trait (downgrades crit success/success for higher-level targets), basic save (halve/double damage by degree).
- D-20: Future adjustments (Keen, Juggernaut, Evasion, Resolve, hero points) not implemented but pipeline should accommodate them.

### Claude's Discretion
- Exact TypeScript interfaces for Action, ActionOutcome, Statistic, and expanded Creature
- How to organize the 545 action entries (single file, per-category files, or lazy-loaded)
- Internal architecture of the condition-to-statistic auto-injection (observer pattern, event emitter, direct method calls, etc.)
- How selector strings like `"dex-based"` resolve to specific statistic keys
- Whether degree-of-success is a standalone module or part of the action system
- File organization within engine/ for new modules (actions/, statistics/, degree-of-success/)

### Deferred Ideas (OUT OF SCOPE)
- Creature abilities (Reactive Strike, Grab, Constrict, Frightful Presence, ~55 types) — skipped in Phase 4
- Spell system — no spellcasting entries, spell slots, focus points in Phase 4
- Advanced degree adjustments (Keen, Juggernaut, Evasion, Resolve, hero points) — not implemented
- Full action execution engine — actions don't execute rolls or resolve outcomes, only declarative data + outcome descriptors
- PC-style stat building (proficiency rank + ability mod + item bonus computation) — NPC pre-calculated base values only
- Exploration/downtime action outcomes — only combat-relevant actions get outcome descriptors
- Weapon/armor/shield types — equipment system deferred
- Feat system and Rule Element processor — not Phase 4 scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENG-02 | Missing actions implemented per analysis results | Actions domain: 545 entries in refs/pf2e/actions/ across 18 subdirectories (nested); Action interface maps directly to Foundry JSON schema. Outcome descriptor pattern established from reading Demoralize/Grapple/Trip/Feint JSON. |
| ENG-03 | Modifier math reworked — correct calculation of final values with bonuses, penalties, and stacking | applyStackingRules() already correct (typed highest/lowest, untyped additive). Phase 4 adds: Statistic class wrapping base+overlay, condition-to-statistic wiring via selector resolver, MAP as untyped Modifier, degree-of-success module. |
</phase_requirements>

---

## Summary

Phase 4 builds on three fully-implemented Phase 3 primitives: `Modifier`/`StatisticModifier`/`applyStackingRules()` (correct PF2e stacking already in place), `CONDITION_EFFECTS` (13 conditions with selector-tagged modifier effects), and `ConditionManager` (add/remove hooks where auto-injection triggers). The work divides into four parallel tracks: (1) action data ingestion — 545 entries as typed records; (2) statistic system — wrapping existing StatisticModifier with base-value + overlay model and a selector resolver; (3) condition-to-statistic auto-injection — wiring ConditionManager hooks to the new statistic system; (4) degree-of-success — a standalone pure function extending the pattern already used in `performRecoveryCheck()`.

The key insight from reading the refs is that actions in Foundry are **pure data with empty `rules[]` arrays** — the behavioral logic lives in the CRB, not the JSON. This confirms D-02 (data-only model): the engine stores what each action does per degree-of-success as a declarative descriptor map, not as executable functions. The 545-entry count is confirmed: 168 files at top level plus 377 files nested inside per-class/archetype/ancestry subdirectories.

The statistic system is intentionally shallow: NPC stat blocks store pre-calculated base values (AC 18, Fort +10, etc.) rather than the component chain. The engine overlays condition modifiers onto these bases. This means `Statistic` is essentially a named `StatisticModifier` with a `baseValue` property — a thin wrapper over existing code.

**Primary recommendation:** Implement in four coordinated modules: `engine/actions/` (data + outcome descriptors), `engine/statistics/` (Statistic class + selector resolver + creature statistic registry), `engine/degree-of-success/` (pure calculation function + adjustment pipeline), and extensions to `engine/types.ts` (expanded Creature interface with attacks + statistics).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript (existing) | project default | All engine modules | Zero external dependencies is a hard project constraint |
| `as const` arrays + derived union types | TypeScript built-in | Action/outcome/statistic type unions | Established pattern in every existing engine module |

### Supporting
No new libraries. Phase 4 is purely TypeScript extending existing engine modules.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `StatisticModifier` extension | Separate Statistic class | Statistic class makes base+overlay explicit; worth the separation |
| Single flat `actions/index.ts` file | Per-category action files | Per-category matches refs/ subdirectory structure but lazy-load is overkill for a DM tool; single barrel file with 545 entries is acceptable if organized with `// ── basic ──` comment sections |
| Direct method calls for condition injection | Observer/event emitter | Direct calls are simpler and testable; event emitter adds indirection without benefit given pure TypeScript module |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure
```
engine/
├── actions/
│   ├── action-data.ts       # All 545 action entries as typed records
│   ├── action-outcomes.ts   # Outcome descriptor maps for ~40 combat actions
│   └── types.ts             # Action, ActionOutcome, ActionCost interfaces
├── statistics/
│   ├── statistic.ts         # Statistic class (base + modifier overlay)
│   ├── selector-resolver.ts # Maps selector strings to statistic keys
│   └── creature-statistics.ts  # Factory: build CreatureStatistics from Creature data
├── degree-of-success/
│   └── degree-of-success.ts # calculateDegreeOfSuccess(), adjustDegree(), DegreeAdjustment
├── types.ts                 # Expanded Creature interface (add abilities, AC, saves, attacks, etc.)
└── index.ts                 # Barrel: export all new modules alongside existing exports
```

### Pattern 1: Action Typed Record

**What:** Each action is a plain TypeScript object conforming to the `Action` interface. All 545 are stored in a `ACTIONS` lookup map keyed by slug.

**When to use:** Any consumer needing action metadata (name, cost, category, traits) or outcome descriptors.

**Example:**
```typescript
// Source: Verified from refs/pf2e/actions/basic/strike.json, demoralize.json, grapple.json
export type ActionType = 'action' | 'reaction' | 'free' | 'passive'
export type ActionCategory = 'offensive' | 'defensive' | 'interaction' | null
export type ActionCost = 1 | 2 | 3 | null

export interface Action {
  slug: string
  name: string
  actionType: ActionType
  cost: ActionCost
  category: ActionCategory
  traits: string[]
  // Present only for the ~40 combat-relevant actions (D-03)
  outcomes?: ActionOutcomeMap
}

export type DegreeKey = 'critical_success' | 'success' | 'failure' | 'critical_failure'

export interface ActionOutcome {
  // Conditions applied to the TARGET at this degree
  conditions?: Array<{ slug: ConditionSlug; value?: number }>
  // Damage formula applied at this degree (declarative string, not rolled)
  damage?: string
  // Free-text effect description for outcomes not expressible as conditions/damage
  effect?: string
}

export type ActionOutcomeMap = Partial<Record<DegreeKey, ActionOutcome>>
```

**Foundry JSON fields that map to this interface (verified):**
- `system.actionType.value` → `actionType`
- `system.actions.value` → `cost` (null for reactions/free/passive)
- `system.category` → `category`
- `system.traits.value` → `traits`
- `system.rules[]` → empty for all basic/skill actions (outcomes are hand-coded from rule text)

### Pattern 2: Statistic Class (Base + Modifier Overlay)

**What:** Thin wrapper around `StatisticModifier` that carries a `baseValue`. Effective value = `baseValue + totalModifier`.

**When to use:** Representing AC, saves, perception, skills, initiative — any numeric statistic on a creature.

**Example:**
```typescript
// Source: D-08, D-09 — base value from Foundry JSON, modifiers from conditions/situational effects
import { StatisticModifier, Modifier, applyStackingRules } from '../modifiers/modifiers'

export class Statistic {
  readonly slug: string
  readonly baseValue: number
  private readonly modifiers: Modifier[] = []

  constructor(slug: string, baseValue: number) {
    this.slug = slug
    this.baseValue = baseValue
  }

  addModifier(mod: Modifier): void {
    this.modifiers.push(mod)
  }

  removeModifiersBy(source: string): void {
    // source = condition slug (e.g., 'frightened') — remove all mods from this source
    const toRemove = this.modifiers.filter(m => m.slug.startsWith(source + ':'))
    toRemove.forEach(m => this.modifiers.splice(this.modifiers.indexOf(m), 1))
  }

  get totalModifier(): number {
    const stat = new StatisticModifier(this.slug, this.modifiers)
    return stat.totalModifier
  }

  get value(): number {
    return this.baseValue + this.totalModifier
  }
}
```

### Pattern 3: Selector Resolver

**What:** Pure function that maps a `ConditionSelector` string (from CONDITION_EFFECTS) to an array of statistic slugs on a specific creature's statistics map.

**When to use:** Inside condition auto-injection — when Frightened adds modifier with selector `"all"`, resolver returns every statistic slug on the creature.

**Example:**
```typescript
// Source: D-11 + CONDITION_EFFECTS selectors from condition-effects.ts
// Selector strings found in CONDITION_EFFECTS: "all", "dex-based", "str-based", "str-damage",
// "cha-based", "int-based", "wis-based", "con-based", "perception", "ac", "reflex"

export function resolveSelector(
  selector: string,
  statisticKeys: string[]   // all statistic slugs present on this creature
): string[] {
  switch (selector) {
    case 'all':
      return statisticKeys
    case 'perception':
      return statisticKeys.filter(k => k === 'perception')
    case 'ac':
      return statisticKeys.filter(k => k === 'ac')
    case 'reflex':
      return statisticKeys.filter(k => k === 'reflex')
    case 'dex-based':
      // Reflex + Dex-based skills (acrobatics, stealth, thievery) + AC
      return statisticKeys.filter(k => ['ac', 'reflex', 'acrobatics', 'stealth', 'thievery'].includes(k))
    case 'str-based':
      return statisticKeys.filter(k => ['fortitude', 'athletics'].includes(k))
    case 'str-damage':
      // Handled separately — damage modifier, not a statistic key
      return []
    case 'con-based':
      return statisticKeys.filter(k => k === 'fortitude')
    case 'cha-based':
      return statisticKeys.filter(k => ['diplomacy', 'deception', 'intimidation', 'performance'].includes(k))
    case 'int-based':
      return statisticKeys.filter(k => ['arcana', 'crafting', 'occultism', 'society'].includes(k))
    case 'wis-based':
      return statisticKeys.filter(k => ['medicine', 'nature', 'religion', 'survival'].includes(k))
    default:
      // Unknown selector — return exact match if present, else empty
      return statisticKeys.filter(k => k === selector)
  }
}
```

**Note on `"dex-based"` vs. `"str-based"` coverage:** The exact set of "Dex-based" skills is a PF2e rule (acrobatics, stealth, thievery are Dex skills). The resolver must be hardcoded to PF2e ability-skill assignments, not derived dynamically — NPC stat blocks only store the skills actually present on that creature.

### Pattern 4: Degree-of-Success Module

**What:** Pure function extending the already-working pattern in `death-progression.ts`. Calculates degree from roll + DC, then passes through an adjustment pipeline.

**When to use:** Any check resolution — attack rolls vs. AC, skill checks vs. DCs, saving throws.

**Example:**
```typescript
// Source: D-17, D-18, D-19 + death-progression.ts existing pattern
// PF2e Player Core — Degree of Success rules (verified in performRecoveryCheck already)

export type DegreeOfSuccess = 'criticalSuccess' | 'success' | 'failure' | 'criticalFailure'

export interface DegreeAdjustment {
  type: 'upgrade' | 'downgrade'
  steps: 1 | 2
  condition?: string  // e.g., 'incapacitation', 'basic-save'
}

export function calculateDegreeOfSuccess(
  roll: number,   // d20 result (1-20) + total modifiers applied before calling this
  dc: number,
  adjustments: DegreeAdjustment[] = []
): DegreeOfSuccess {
  // Base calculation — reuses logic already proven in performRecoveryCheck()
  let degree: DegreeOfSuccess

  if (roll === 20) {
    degree = roll >= dc ? 'criticalSuccess' : 'success'  // nat 20: always upgrade 1
  } else if (roll === 1) {
    degree = roll >= dc ? 'failure' : 'criticalFailure'  // nat 1: always downgrade 1
  } else if (roll >= dc + 10) {
    degree = 'criticalSuccess'
  } else if (roll >= dc) {
    degree = 'success'
  } else if (roll <= dc - 10) {
    degree = 'criticalFailure'
  } else {
    degree = 'failure'
  }

  // Apply adjustment pipeline (D-18)
  for (const adj of adjustments) {
    degree = adj.type === 'upgrade'
      ? upgradeDegree(degree, adj.steps)
      : downgradeDegree(degree, adj.steps)
  }

  return degree
}
```

**Core adjustments to implement (D-19):**

| Adjustment | Rule | Implementation |
|------------|------|----------------|
| Nat 20 | Always at least success (upgrade 1 step) | Inline in base calculation |
| Nat 1 | Always at most failure (downgrade 1 step) | Inline in base calculation |
| Incapacitation | Crit success → success; success → failure for targets higher level than caster | `DegreeAdjustment { type: 'downgrade', steps: 1, condition: 'incapacitation' }` |
| Basic save | On crit success: no damage; success: half damage; failure: full; crit failure: double | Caller interprets degree for damage multiplier — not an adjustment, a semantic |

**Note:** "Basic save" is not a degree adjustment — it is a damage multiplier protocol the caller applies after getting the degree. The degree-of-success function returns the degree; the caller multiplies damage accordingly.

### Pattern 5: MAP as Untyped Modifier (Pre-computed Sets)

**What:** Each attack entry pre-computes three `StatisticModifier` instances representing the three attack positions. MAP penalty is an untyped `Modifier` with `modifier: 0 | -4 | -5 | -8 | -10`.

**When to use:** When populating `Creature.attacks[]`.

**Example:**
```typescript
// Source: D-05, D-06, D-07
// Agile MAP: -0/-4/-8. Non-agile MAP: -0/-5/-10.

function buildAttackModifierSets(
  slug: string,
  baseBonus: number,
  isAgile: boolean,
  conditionModifiers: Modifier[]  // from creature's active conditions
): [StatisticModifier, StatisticModifier, StatisticModifier] {
  const mapPenalties = isAgile ? [0, -4, -8] : [0, -5, -10]

  return mapPenalties.map((penalty, idx) => {
    const mods: Modifier[] = [
      ...conditionModifiers,
      ...(penalty !== 0 ? [new Modifier({
        slug: `map-${idx + 1}`,
        label: `MAP (attack ${idx + 1})`,
        modifier: penalty,
        type: 'untyped',
      })] : [])
    ]
    return new StatisticModifier(`${slug}-attack-${idx + 1}`, mods)
  }) as [StatisticModifier, StatisticModifier, StatisticModifier]
}
```

**Displayed result:** "Attack +11 / +6 / +1" (non-agile, base +11) or "Attack +11 / +7 / +3" (agile, base +11).

### Anti-Patterns to Avoid

- **Reimplementing stacking rules:** `applyStackingRules()` is correct and complete. Never duplicate this logic in Statistic or attack computation — always pass modifiers through `StatisticModifier`.
- **Making conditions execute logic:** Conditions are data. `CONDITION_EFFECTS` maps slugs to effect descriptors. The `Statistic` injection system interprets those descriptors — conditions themselves contain no code.
- **Computing NPC stats from components:** NPCs store pre-calculated values. Do not attempt to compute AC from armor + dex cap + proficiency. Take `system.attributes.ac.value` directly as `baseValue`.
- **Mutable statistic snapshots:** Don't cache `statistic.value` — recompute from modifiers on each read. Modifier arrays can change when conditions are added/removed.
- **Single `Statistic` for "all checks":** `"all"` selector means "add this modifier to every statistic on this creature." The resolver must iterate and inject — there is no single "all-checks" statistic object.
- **Flattening `as const` source arrays:** The patterns `as const` → derived union type is established in every engine file. New modules must follow it for type safety.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stacking rules (highest bonus, lowest penalty, untyped additive) | Custom stacking logic in Statistic | `applyStackingRules()` + `StatisticModifier` in `engine/modifiers/modifiers.ts` | Already verified correct per PF2e; reimplementing creates divergence risk |
| Degree-of-success nat-20/nat-1 adjustment | Inline special cases per action | Unified `calculateDegreeOfSuccess()` with the pipeline from death-progression.ts pattern | performRecoveryCheck() already has the correct nat-20/nat-1 logic; centralize it |
| Condition modifier injection | Manual case-by-case wiring per condition | Selector resolver driving loops over CONDITION_EFFECTS | CONDITION_EFFECTS already maps all 13 conditions; resolver generalizes to all future conditions |
| Action outcome descriptors | Parsed from Foundry HTML description | Hand-coded declarative outcome maps | Foundry action JSON has empty `rules[]`; behavioral outcomes are in rule text, not machine-parseable JSON |

**Key insight:** The action JSON in refs/ is content data (name, traits, description HTML), not behavioral logic. Outcome descriptors must be hand-coded for the ~40 combat-relevant actions because Foundry stores this knowledge as prose, not structured data.

---

## Runtime State Inventory

Step 2.5: SKIPPED — Phase 4 is greenfield module addition, not a rename/refactor/migration phase. No runtime state is being renamed or migrated.

---

## Environment Availability Audit

Step 2.6: SKIPPED — Phase 4 is purely TypeScript engine code additions. No external tools, services, CLIs, databases, or runtimes beyond the existing Node.js + TypeScript project setup are required. The `refs/pf2e/` data directory has been verified present and readable.

---

## Common Pitfalls

### Pitfall 1: Selector Resolution Completeness

**What goes wrong:** `"dex-based"` selector is injected into every statistic on the creature instead of only Dex-governed statistics. Or a new selector string from a future condition is silently dropped.

**Why it happens:** The resolver's `switch` falls through to a default case that returns `[]` for unknown selectors.

**How to avoid:** The `default` case should return `statisticKeys.filter(k => k === selector)` (exact match) and also emit a developer warning for unrecognized selectors. Maintaining a tested mapping of all selector strings from `CONDITION_EFFECTS` guards coverage.

**Warning signs:** Clumsy condition applies its penalty to saves and perception (not just Dex skills/AC/Reflex), or Blinded's -4 doesn't reach Perception.

### Pitfall 2: MAP Modifier Type Must Be Untyped

**What goes wrong:** MAP penalty typed as `'circumstance'` or `'status'` — then if a creature also has a status penalty on attack (e.g., Enfeebled), only the lowest status penalty applies instead of both stacking.

**Why it happens:** MAP reads as a "situational" penalty, mistaken for a typed penalty.

**How to avoid:** D-06 explicitly states MAP is untyped. Untyped modifiers always stack. Code review should verify `type: 'untyped'` on every MAP modifier construction.

**Warning signs:** A creature with Enfeebled 1 (status -1 to Str-based) shows Attack +10/+5/+0 instead of +10/+5/+0 with the MAP and the Enfeebled penalty both applied.

### Pitfall 3: Condition-to-Statistic Wiring on Remove

**What goes wrong:** Adding a condition injects modifiers but removing a condition leaves stale modifiers in the statistic's modifier array. Frightened 2 is removed, AC still shows -2.

**Why it happens:** `ConditionManager.remove()` hook is not wired to call `statistic.removeModifiersBy()`.

**How to avoid:** Injection must be symmetric: `add()` calls inject, `remove()` calls eject. Grant chains complicate this — when `dying` is removed, `unconscious` is also removed (grant chain cleanup). The statistic wiring must follow the same chain, or use source tagging (modifier slug prefixed with the originating condition slug) to batch-remove all modifiers from a condition slug.

**Warning signs:** Effective AC value doesn't return to baseline after condition removal; unit test asserting `statistic.value === baseValue` after condition cycle fails.

### Pitfall 4: `performRecoveryCheck()` and `calculateDegreeOfSuccess()` Must Not Diverge

**What goes wrong:** Two separate degree-of-success implementations with subtle differences — one uses `roll >= dc + 10` for crit success, the other `roll > dc + 9`. Nat-1/nat-20 handling diverges.

**Why it happens:** `performRecoveryCheck()` was built before the general degree-of-success module.

**How to avoid:** After `calculateDegreeOfSuccess()` is implemented in Phase 4, refactor `performRecoveryCheck()` to call it (passing the flat check roll as `roll + 0` against DC, since flat checks have no modifier). If refactoring is out of scope, add a comment cross-reference so future changes stay synchronized.

**Warning signs:** Recovery check test cases produce different degree labels than the general system for the same roll/DC combination.

### Pitfall 5: Full NPC Stat Block Interface vs. Partial Population

**What goes wrong:** `Creature` interface extended with all optional fields, and a creature built from Foundry JSON omits `skills` (because the creature has none) — then the selector resolver crashes on `undefined` statistics map.

**Why it happens:** NPC creatures in Foundry only store skills that creature actually has. A level -1 animated-broom has no skills. The skills map in `system.skills` is sparse.

**How to avoid:** `Creature.skills` should be `Record<string, number>` (empty object `{}` for skill-less creatures, not undefined). The creature factory must always initialize all required sub-objects, even if empty. Skills absent from the Foundry JSON simply don't appear in the skills map.

**Warning signs:** `Object.keys(creature.statistics.skills)` throws on a creature with no skills.

### Pitfall 6: Action Entry Count — Nested Subdirectories

**What goes wrong:** Counting only top-level JSON files in each action category yields 168 entries, missing the 377 entries nested inside per-class/archetype/ancestry subdirectories.

**Why it happens:** `refs/pf2e/actions/archetype/` and `refs/pf2e/actions/class/` contain subdirectory per class/archetype with action files inside.

**How to avoid:** Action data ingestion (or the script that generates the `ACTIONS` map) must recurse into subdirectories. Total verified count is 545 across all nested paths.

**Warning signs:** D-01 says "all 545 entries" but only 168 are loaded.

---

## Code Examples

Verified patterns from direct refs/ reading and existing engine source:

### Action Interface — Direct from refs/ JSON Schema
```typescript
// Fields verified from strike.json, demoralize.json, grapple.json, trip.json
// system.actionType.value: "action" | "reaction" | "free" | "passive"
// system.actions.value: 1 | 2 | 3 | null
// system.category: "offensive" | "defensive" | "interaction" | null
// system.traits.value: string[]
// system.rules: [] — always empty for basic and skill actions

const STRIKE: Action = {
  slug: 'strike',
  name: 'Strike',
  actionType: 'action',
  cost: 1,
  category: 'offensive',
  traits: ['attack'],
  outcomes: {
    critical_success: {
      damage: 'double',
      effect: 'Deal double damage.'
    },
    success: {
      effect: 'Deal normal damage.'
    }
  }
}

const DEMORALIZE: Action = {
  slug: 'demoralize',
  name: 'Demoralize',
  actionType: 'action',
  cost: 1,
  category: 'offensive',
  traits: ['auditory', 'concentrate', 'emotion', 'fear', 'mental'],
  outcomes: {
    critical_success: { conditions: [{ slug: 'frightened', value: 2 }] },
    success: { conditions: [{ slug: 'frightened', value: 1 }] }
  }
}
```

### Creature Attack from Foundry JSON
```typescript
// Verified from aapoph-serpentfolk.json items[] where type === "melee"
// system.bonus.value: number (base attack bonus, pre-calculated)
// system.damageRolls[id].damage: string (formula like "1d6+6")
// system.damageRolls[id].damageType: string
// system.range: null (melee) or { increment: number, max: number | null } (ranged)
// system.traits.value: string[] — includes 'agile' for agile weapons

// Serpentfolk example:
// Scimitar: bonus 11, damage "1d6+6" slashing, traits ["forceful", "sweep"]
// Fangs:    bonus 11, damage "1d8+6" piercing, traits [] (no agile — MAP -5/-10)
// Tail:     bonus 11, damage "1d4+4" bludgeoning, traits ["agile"] (MAP -4/-8)
```

### Foundry Creature Stat Block Keys (verified from aapoph-serpentfolk.json)
```typescript
// system.abilities: { str: { mod }, dex: { mod }, con: { mod }, int: { mod }, wis: { mod }, cha: { mod } }
// system.attributes.ac.value: number
// system.attributes.hp.max: number, .value: number, .temp: number
// system.saves.fortitude.value: number, .reflex.value, .will.value
// system.perception.mod: number
// system.perception.senses: Array<{ type: string, acuity?: string, range?: number }>
// system.skills: Record<skillName, { base: number }> — sparse, only skills the creature has
// system.attributes.speed.value: number (land speed)
// system.attributes.speed.otherSpeeds: Array<{ type: "fly"|"swim"|"burrow"|"climb", value: number }>
// system.traits.rarity: "common"|"uncommon"|"rare"|"unique"
// system.traits.size.value: "tiny"|"sm"|"med"|"lg"|"huge"|"grg"
// system.traits.value: string[] (creature type tags, e.g. ["humanoid", "serpentfolk"])
// system.details.level.value: number
// system.details.languages.value: string[]
// system.initiative.statistic: "perception" (always perception for NPCs)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Conditions tracked but modifiers not applied | Conditions auto-inject modifiers to statistics | Phase 4 | DM sees live AC/save values as conditions change |
| StatisticModifier standalone (no base value) | Statistic class = base + modifier overlay | Phase 4 | Enables "AC 18 (–2 off-guard) = 16" display |
| No action definitions in engine | 545 typed Action entries + ~40 outcome maps | Phase 4 | Engine can describe what each action does |
| MAP not modeled | 3 pre-computed StatisticModifier sets per attack | Phase 4 | "Attack +11 / +6 / +1" computed automatically |
| degree-of-success only in performRecoveryCheck | Standalone calculateDegreeOfSuccess() module | Phase 4 | All check resolution uses single correct algorithm |

**Deprecated/outdated after Phase 4:**
- `performRecoveryCheck()`'s internal degree logic should be refactored to call `calculateDegreeOfSuccess()` — or at minimum cross-referenced with a comment to prevent future drift.

---

## Open Questions

1. **Condition-to-statistic injection: ConditionManager coupling**
   - What we know: ConditionManager has `add()` and `remove()` entry points. CONDITION_EFFECTS provides the selector-tagged modifier descriptors.
   - What's unclear: The ConditionManager currently has no reference to a statistic registry. Two clean options: (A) ConditionManager receives an injection callback at construction time; (B) A new `CreatureStatistics` class wraps both ConditionManager and Statistic instances, implementing the injection in its own `add()` adapter. Option B keeps ConditionManager decoupled from statistics.
   - Recommendation: Option B (CreatureStatistics adapter) — preserves ConditionManager as a pure condition tracker, consistent with its current design. The planner should pick one and specify the interface.

2. **Selector resolver: `"dex-based"` completeness**
   - What we know: PF2e ability-to-skill mapping is: Str=Athletics; Dex=Acrobatics/Stealth/Thievery; Con=none (Fortitude is constitution-based save, but not a "con skill"); Int=Arcana/Crafting/Occultism/Society; Wis=Medicine/Nature/Religion/Survival; Cha=Deception/Diplomacy/Intimidation/Performance.
   - What's unclear: The `"dex-based"` selector per Foundry convention includes AC (which uses Dex for cap on PCs). For NPCs, AC is pre-calculated. Whether `"dex-based"` should include `ac` for NPCs needs a decision — Foundry applies it to PC AC calculations, but NPC AC is already baked in. Given D-08 (base + overlay), applying a Clumsy 2 penalty to `ac` via `"dex-based"` would be wrong for NPCs.
   - Recommendation: `"dex-based"` selector for NPCs should resolve to Reflex + Dex-governed skills only (NOT AC). AC is only modified by explicit `"ac"` selector (Off-Guard). The planner should confirm this as a locked decision.

3. **Action data file organization — 545 entries**
   - What we know: 168 JSON at top level, 377 in subdirectories (per-class, per-archetype, per-ancestry folders). Ingesting all 545 requires recursive directory traversal or a pre-generated TypeScript file.
   - What's unclear: Whether to ingest at runtime (runtime JSON reads) or generate a static TypeScript barrel at development time.
   - Recommendation: Generate a static TypeScript file `engine/actions/action-data.ts` at development time (one-time script to read refs/ and output the 545 records). The engine is pure TypeScript with no runtime file access. Runtime JSON reading would require Node.js fs or a build-time bundler plugin — inconsistent with the engine's zero-dependency pure TypeScript pattern.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — tests intentionally removed per project memory (breaking changes expected) |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

**Note:** Per project memory: "Tests intentionally removed — breaking changes expected, no test maintenance." nyquist_validation is enabled in config.json but the project has no test infrastructure. No test files should be created. The planner should omit test-related tasks entirely.

### Wave 0 Gaps
None — no test infrastructure to scaffold.

---

## Sources

### Primary (HIGH confidence)
- `refs/pf2e/actions/basic/strike.json` — Verified action JSON schema (actionType, actions, category, traits, rules)
- `refs/pf2e/actions/basic/escape.json`, `stride.json`, `step.json` — Confirmed 30 basic action files present
- `refs/pf2e/actions/skill/demoralize.json` — Verified outcome-bearing action schema (frightened 2/1 per degree)
- `refs/pf2e/actions/skill/grapple.json`, `trip.json`, `feint.json`, `shove.json`, `tumble-through.json` — Confirmed combat skill action content
- `refs/pf2e/pathfinder-monster-core/aapoph-serpentfolk.json` — Verified creature JSON schema (system.abilities, .attributes.ac, .saves, .skills, .perception, .speed, melee items with bonus + damageRolls + traits)
- `refs/pf2e/pathfinder-monster-core/aapoph-granitescale.json` — Verified ranged attack schema (range.increment)
- `engine/modifiers/modifiers.ts` — Current Modifier, applyStackingRules(), StatisticModifier implementation (confirmed correct)
- `engine/conditions/condition-effects.ts` — CONDITION_EFFECTS selectors verified (all, dex-based, str-based, con-based, perception, ac, reflex)
- `engine/conditions/conditions.ts` — ConditionManager add/remove hooks confirmed
- `engine/conditions/death-progression.ts` — degree-of-success calculation pattern verified as model for general module
- `.planning/phases/04-actions-modifier-math/04-CONTEXT.md` — Locked decisions D-01 through D-20
- `.planning/phases/02-reference-analysis/GAP-ANALYSIS.md` — Gaps #16-#23 (Actions), #24-#29 (Modifier Math), #30-#33 (Creatures) verified against current engine state

### Secondary (MEDIUM confidence)
- Bash recursive count of `refs/pf2e/actions/` — confirmed 545 total JSON files (168 top-level + 377 in nested subdirectories per class/archetype/ancestry)
- PF2e ability-to-skill assignment (Str=Athletics, Dex=Acrobatics/Stealth/Thievery, etc.) — knowledge from PF2e rules confirmed by selector strings in CONDITION_EFFECTS

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, extends existing engine modules
- Architecture: HIGH — directly derived from existing engine patterns + verified refs/ JSON schema
- Pitfalls: HIGH — identified from code inspection of existing modules and rules text
- Action outcome descriptors: MEDIUM — content is hand-coded from rule text; completeness of the ~40 combat actions depends on author judgment

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable PF2e rules data, refs/ directory unchanged)
