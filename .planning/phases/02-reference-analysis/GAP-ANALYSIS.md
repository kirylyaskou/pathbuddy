# PF2e Engine Gap Analysis

**Produced:** 2026-03-31
**Phase:** 02-reference-analysis
**Analyst:** Execute agent, validated against direct refs/pf2e/ JSON inspection and engine/ source reading

---

## Executive Summary

<!-- Task 2 -->

---

## Prioritized Missing Mechanics

<!-- Task 2 -->

---

## Domain 1: Conditions & Statuses [HIGH PRIORITY]

### What refs/pf2e/ has

**Location:** `refs/pf2e/conditions/` — 43 JSON files (one per condition)

**File count:** 43 conditions (blinded, broken, clumsy, concealed, confused, controlled, cursebound, dazzled, deafened, doomed, drained, dying, encumbered, enfeebled, fascinated, fatigued, fleeing, friendly, frightened, grabbed, helpful, hidden, hostile, immobilized, indifferent, invisible, observed, off-guard, paralyzed, persistent-damage, petrified, prone, quickened, restrained, sickened, slowed, stunned, stupefied, unconscious, undetected, unfriendly, unnoticed, wounded)

**JSON Schema (from direct file reading):**
```json
{
  "_id": "XgEqL1kFApUbl5Z2",
  "name": "Blinded",
  "type": "condition",
  "system": {
    "description": { "value": "<p>..." },
    "duration": { "expiry": null, "unit": "unlimited", "value": 0 },
    "group": "senses",
    "overrides": ["dazzled"],
    "references": {
      "children": [], "immunityFrom": [], "overriddenBy": [], "overrides": []
    },
    "rules": [
      { "key": "FlatModifier", "selector": "perception", "slug": "blinded", "type": "status", "value": -4 },
      { "key": "Immunity", "type": "visual" }
    ],
    "traits": { "value": [] },
    "value": { "isValued": false, "value": null }
  }
}
```

**Key fields validated:**
- `system.group`: One of `senses | abilities | death | detection | attitudes | null`
- `system.overrides`: Array of condition slugs this condition removes on application
- `system.value.isValued`: Boolean — `true` for valued conditions (clumsy 1-4, dying 1-4, etc.)
- `system.rules`: Array of Rule Elements encoding mechanical effects

**The 5 condition groups (from direct reading):**
- `senses`: blinded, concealed, dazzled, deafened, invisible
- `abilities`: clumsy, cursebound, drained, enfeebled, stupefied
- `death`: doomed, dying, unconscious, wounded
- `detection`: observed, hidden, undetected, unnoticed
- `attitudes`: hostile, unfriendly, indifferent, friendly, helpful

**Override relationships (from direct JSON reading):**
- `blinded.overrides = ["dazzled"]` — Blinded removes Dazzled
- `stunned.overrides = ["slowed"]` — Stunned removes Slowed
- Attitude conditions: each attitude has `overrides` containing all other attitudes
- `grabbed`: No `overrides` field, but grants Off-Guard + Immobilized via GrantItem rules

**Rule Elements on conditions (from Research analysis of all 43 files):**
- `FlatModifier`: 15 uses — e.g., Blinded → -4 status to perception; Clumsy X → -X status to Dex-based; Frightened X → -X status to all checks
- `GrantItem`: 12 uses — e.g., Grabbed → grants Off-Guard + Immobilized; Dying → grants Unconscious; Paralyzed → grants Off-Guard
- `ItemAlteration`: 11 uses — modifies item descriptions when condition is active
- `ActiveEffectLike`: 3 uses
- `RollOption`: 2 uses
- `Note`: 2 uses
- `Immunity`: 2 uses — e.g., Blinded → immunity to visual effects
- `AdjustDegreeOfSuccess`: 1 use
- `LoseHitPoints`: 1 use

**Validated valued conditions (from JSON reading, `system.value.isValued = true`):**
clumsy, doomed, drained, dying, enfeebled, frightened, sickened, slowed, stunned, stupefied, wounded

### What engine currently has

From `engine/conditions/conditions.ts`:
- `CONDITION_SLUGS`: 44 slugs (includes `malevolence` — adventure-specific, not in refs/)
- `VALUED_CONDITIONS`: 11 valued conditions (matches refs/ exactly)
- `CONDITION_GROUPS`: Only 2 groups: `detection` and `attitudes` — missing `senses`, `abilities`, `death`
- `ConditionManager` class: `add()`, `remove()`, `has()`, `get()`, `endTurn()`, `setDuration()`, `setProtected()`, `isProtected()`, `getAll()`
- `add()` enforces group exclusivity for detection and attitudes (correct)
- Dying/wounded cascade: implemented correctly — dying gains wounded value; losing dying grants wounded 1
- `endTurn()` auto-decrements: frightened, sickened, stunned, slowed

### Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing 3 condition groups | Engine has 2 groups (detection, attitudes); refs/ has 5. Missing: senses (blinded, concealed, dazzled, deafened, invisible), abilities (clumsy, cursebound, drained, enfeebled, stupefied), death (doomed, dying, unconscious, wounded) | HIGH |
| Missing override mechanic | Engine has no `overrides` field or logic. refs/ defines: Blinded overrides Dazzled; Stunned overrides Slowed; attitude conditions override each other | HIGH |
| Rule Elements not applied | Conditions don't apply their mechanical effects. Blinded should apply -4 status to perception, Grabbed should grant Off-Guard + Immobilized, Dying should grant Unconscious, etc. | HIGH |
| No condition max values | No doomed-4-dies, no dying-4-dies maximum tracking. Engine has no upper-bound enforcement | HIGH |
| No condition immunity check | Creatures immune to a condition (e.g., "paralyzed" immunity) are not checked before ConditionManager.add() | HIGH |
| Death group logic absent | Unconscious is in the `death` group alongside dying/wounded/doomed — engine doesn't model this group membership | HIGH |
| GrantItem chains | Grabbed → Off-Guard + Immobilized; Dying → Unconscious; Paralyzed → Off-Guard implicit grants not tracked | HIGH |
| abilities group semantics | Engine's group exclusivity removes all group members; but abilities group (clumsy, drained, enfeebled, stupefied) CAN coexist — they affect different ability scores | HIGH |
| `malevolence` not in refs/ | Engine has malevolence slug but it's adventure-specific (Malevolence AP), not a core PF2e condition. Document as intentional | LOW |

### Key Schema Insights

- The `senses` group is NOT fully mutually exclusive: blinded and concealed can coexist (concealed means "all normal terrain is difficult terrain or there's a 20% concealment miss chance," not the same as blinded). The `overrides` field (not `group`) determines replacement behavior.
- The `abilities` group is purely informational metadata — clumsy, drained, enfeebled, stupefied affect different ability scores and all coexist simultaneously.
- The `death` group clusters conditions related to dying progression: doomed reduces dying threshold; dying tracks unconscious state; wounded adds to dying when re-downed.
- `system.references.overriddenBy` is populated in refs/ to show the inverse override relationship.

---

## Domain 2: Damage & IWR [HIGH PRIORITY]

### What refs/pf2e/ has

**Location:** Creature stat blocks in `refs/pf2e/pathfinder-monster-core/`, `pathfinder-monster-core-2/`, etc.

**IWR JSON Schema (from aapoph-serpentfolk.json):**
```json
"attributes": {
  "ac": { "details": "", "value": 18 },
  "allSaves": { "value": "+2 status to will saves vs. mental" },
  "hp": { "details": "", "max": 60, "temp": 0, "value": 60 },
  "resistances": [
    { "type": "poison", "value": 5 }
  ],
  "speed": { "otherSpeeds": [], "value": 25 }
}
```

**Full IWR type strings present across ALL bestiaries (from Research direct scan):**

Immunity types in refs/:
`acid, auditory, bleed, blinded, bludgeoning, clumsy, cold, confused, controlled, critical-hits, curse, dazzled, deafened, death-effects, disease, doomed, drained, electricity, emotion, enfeebled, fascinated, fatigued, fear-effects, fire, fortune-effects, grabbed, healing, illusion, immobilized, inhaled, light, magic, mental, misfortune-effects, nonlethal-attacks, object-immunities, off-guard, olfactory, paralyzed, persistent-damage, petrified, piercing, poison, polymorph, possession, precision, prone, radiation, restrained, scrying, sickened, slashing, sleep, slowed, sonic, spell-deflection, spirit, stunned, stupefied, swarm-attacks, swarm-mind, unconscious, visual, vitality, void`

Weakness types in refs/:
`acid, air, alchemical, area-damage, axe-vulnerability, bleed, bludgeoning, cold, cold-iron, critical-hits, earth, electricity, emotion, fire, force, holy, mental, orichalcum, peachwood, piercing, salt, salt-water, silver, slashing, sonic, spirit, splash-damage, unholy, vitality, void, vorpal, vulnerable-to-sunlight, water`

Resistance types in refs/:
`acid, air, all-damage, bludgeoning, cold, critical-hits, earth, electricity, fire, force, mental, metal, mythic, physical, piercing, plant, poison, precision, protean-anatomy, silver, slashing, sonic, spells, spirit, unholy, void, water, wood`

### What engine currently has

From `engine/damage/iwr.ts` and `engine/damage/damage.ts`:
- `IMMUNITY_TYPES`: `[...DAMAGE_TYPES, ...DAMAGE_CATEGORIES, 'critical-hits', 'precision']` — covers 16 damage types + 3 categories + 2 specials = 21 types
- `WEAKNESS_TYPES`: `[...DAMAGE_TYPES, ...DAMAGE_CATEGORIES]` — 19 types total
- `RESISTANCE_TYPES`: `[...DAMAGE_TYPES, ...DAMAGE_CATEGORIES]` — 19 types total
- `DAMAGE_TYPES`: bludgeoning, piercing, slashing, bleed, fire, cold, electricity, acid, sonic, force, vitality, void, spirit, mental, poison, untyped (16 total)
- `DAMAGE_CATEGORIES`: physical, energy, other (3 total)
- `MATERIAL_EFFECTS`: adamantine, cold-iron, mithral, orichalcum, silver, sisterstone-dusk, sisterstone-scarlet
- `applyIWR()`: correct processing order (immunities → weaknesses → resistances), highest-value selection, doubleVs (critical), precision immunity, critical-hits halving
- `createImmunity()`, `createWeakness()`, `createResistance()`: factory functions
- `parseIwrData()`, `formatIwrType()`: Foundry JSON parsing utilities

### Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| Immunity types missing — condition immunities | blinded, clumsy, confused, controlled, dazzled, deafened, doomed, drained, enfeebled, fascinated, fatigued, grabbed, immobilized, off-guard, paralyzed, persistent-damage, petrified, prone, restrained, sickened, slowed, stunned, stupefied, unconscious | HIGH |
| Immunity types missing — effect categories | auditory, curse, death-effects, disease, emotion, fear-effects, fortune-effects, healing, illusion, inhaled, light, magic, misfortune-effects, nonlethal-attacks, object-immunities, olfactory, polymorph, possession, radiation, scrying, sleep, spell-deflection, swarm-attacks, swarm-mind, visual | HIGH |
| Weakness types missing | alchemical, area-damage, axe-vulnerability, cold-iron, earth, holy, orichalcum (already material), peachwood, salt, salt-water, silver (already material), splash-damage, unholy, vorpal, vulnerable-to-sunlight, water, air | HIGH |
| Resistance types missing | air, all-damage, critical-hits, earth, metal, mythic, plant, precision, protean-anatomy, silver, spells, unholy, water, wood | HIGH |
| `all-damage` resistance requires special handling | Resistance to `all-damage` must match any damage type — needs a special case in `applyIWR()` `typeMatches()` function | HIGH |
| `holy`/`unholy` as damage types | Weakness and resistance data uses `holy` and `unholy` — per Research analysis these are Remaster types that coexist with vitality/void (NOT legacy OGL names); need to add to DAMAGE_TYPES taxonomy | HIGH |
| Condition immunity vs damage immunity | IWR immunity types include condition names (paralyzed, stunned, etc.) but current `applyIWR()` only processes damage instances; a separate condition-immunity check pathway is needed before `ConditionManager.add()` | HIGH |
| Material effects coverage — edge cases | peachwood, salt, salt-water, vorpal appear as weakness types in some creatures; not in `MATERIAL_EFFECTS` | LOWER |

### Key Schema Insights

- IWR entries in refs/ creature JSON: `{ "type": string, "value"?: number, "exceptions"?: string[], "doubleVs"?: string[] }`
- The `exceptions` field contains damage types or material slugs that bypass the IWR entry
- `all-damage` resistance is a special type meaning "subtract this value from any damage regardless of type" — it is not a damage category
- Condition immunities use the same JSON array as damage immunities — a creature can have `{ "type": "paralyzed" }` in its `immunities` array alongside `{ "type": "fire" }`
- `holy` and `unholy` appear in both weakness and resistance arrays in Remaster-tagged content (`"remaster": true`) — confirming these are current Remaster types

---

## Domain 3: Actions [HIGH PRIORITY]

### What refs/pf2e/ has

**Location:** `refs/pf2e/actions/` — 545 entries total across 17 subdirectories (plus `action-macros/` reference-only)

**Action subdirectory breakdown:**

| Category | Count | Priority |
|----------|-------|----------|
| basic | 30 | HIGH — Strike, Escape, Aid, Delay, Ready, Raise a Shield, Stride, Step, etc. |
| skill | 54 | HIGH (combat subset: Demoralize, Feint, Grapple, Shove, Trip, Disarm, Tumble Through) |
| ancestry | 30 | HIGH — ancestry combat actions |
| archetype | 76 | HIGH — archetype combat actions |
| class | 23 | HIGH — class-specific combat actions |
| exploration | 13 | MEDIUM — Avoid Notice, Scout, Search, Detect Magic |
| equipment | 7 | HIGH — item-activated combat actions |
| spells | 11 | HIGH — Cast a Spell, Sustain a Spell, etc. |
| stamina | 4 | MEDIUM — stamina variant rules |
| heritage | 5 | MEDIUM |
| familiar | 1 | MEDIUM |
| aftermath | 5 | LOWER |
| background | 26 | LOWER |
| campaign | 7 | LOWER |
| downtime | 4 | LOWER — Long-Term Rest, Retraining, Learn Name, Grow |
| mythic | 1 | LOWER |
| subsystems | 6 | LOWER — Duels, Hexploration, etc. |
| vehicles | 5 | LOWER |

**JSON Schema (from strike.json, escape.json direct reading):**
```json
{
  "_id": "VjxZFuUXrCU94MWR",
  "name": "Strike",
  "type": "action",
  "system": {
    "actionType": { "value": "action" },
    "actions": { "value": 1 },
    "category": "offensive",
    "description": { "value": "<p>..." },
    "rules": [],
    "traits": { "rarity": "common", "value": ["attack"] }
  }
}
```

**`system.actionType.value` values:** `"action"`, `"reaction"`, `"free"`, `"passive"`
**`system.actions.value` values:** `1`, `2`, `3`, `null` (for reactions/free/passive)
**`system.category` values:** `"offensive"`, `"defensive"`, `"interaction"`, `null`

**Key observation:** Basic action entries (Strike, Escape, Stride) have **empty `rules[]` arrays** — their mechanics are encoded in PF2e CRB rules text, not as Rule Elements. Class/archetype actions contain Rule Elements for their special effects.

**30 basic actions (complete list from direct reading):**
Affix a Fulu, Affix a Talisman, Aid, Arrest a Fall, Avert Gaze, Burrow, Cast a Spell, Crawl, Delay, Dismiss, Drop Prone, Escape, Fly, Grab an Edge, Interact, Invest an Item, Leap, Mount, Point Out, Raise a Shield, Ready, Release, Seek, Stand, Step, Stride, Strike, Sustain, Take Cover, Tumble Through (in basic subdirectory)

### What engine currently has

No engine coverage for actions. Zero action definitions, schemas, or execution logic.

Partial coverage by proxy:
- `ConditionManager` tracks conditions that actions apply (e.g., Frightened from Demoralize) but the action itself is not modeled
- `calculateXP()` and `getHazardXp()` track encounter XP, not action definitions

### Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| No Action type or schema | No TypeScript interface for actions (actionType, cost, category, traits, rules) | HIGH |
| No basic actions (30) | Strike, Escape, Stride, Step, Raise a Shield, Ready, Delay, Aid, Seek, Point Out, Crawl, Drop Prone, Stand, Interact, Leap, Fly, Burrow, Mount, etc. — none defined in engine | HIGH |
| No combat skill actions | Demoralize, Feint, Grapple, Shove, Trip, Disarm, Tumble Through, Steal, Dirty Trick — actions with specific DCs and outcome tiers | HIGH |
| No class actions (23) | Class-specific combat abilities not represented | HIGH |
| No archetype actions (76) | Archetype combat actions not represented | HIGH |
| No action execution logic | No degree-of-success handling, no condition application from action outcomes, no MAP application after attacks | HIGH |
| No Multiple Attack Penalty | MAP (-5/-10 agile, -10/-10 non-agile) accumulates across Strike actions in a turn — not tracked anywhere | HIGH |
| No action trait system | Traits like attack, manipulate, move, stance, open affect how actions function — not modeled | HIGH |
| No exploration actions (13) | Avoid Notice, Scout, Search, Detect Magic, etc. | MEDIUM |
| No downtime actions (4) | Long-Term Rest, Retraining, Learn Name, Grow | LOWER |

### Key Schema Insights

- Action entries are **content data**, not executable algorithms. Strike.json contains description text and the "attack" trait — the attack roll formula is a PF2e CRB mechanic, not encoded in the JSON.
- Rule Elements appear on class/archetype actions to grant conditional bonuses or modify traits, but the core action algorithm must be implemented separately.
- `system.traits.value` array identifies mechanic-affecting traits: `attack` (gains MAP), `manipulate` (provokes Reactive Strike), `move` (affected by difficult terrain), etc.

---

## Domain 4: Modifier Math [HIGH PRIORITY]

### What refs/pf2e/ has

**Location:** Creature stat blocks — `system.abilities`, `system.saves`, `system.perception`, `system.skills`

**Schema (from aapoph-serpentfolk.json direct reading):**
```json
"system": {
  "abilities": {
    "cha": { "mod": -1 }, "con": { "mod": 3 }, "dex": { "mod": 2 },
    "int": { "mod": -1 }, "str": { "mod": 4 }, "wis": { "mod": 1 }
  },
  "saves": {
    "fortitude": { "saveDetail": "", "value": 10 },
    "reflex": { "saveDetail": "", "value": 7 },
    "will": { "saveDetail": "", "value": 6 }
  },
  "perception": { "details": "", "mod": 8, "senses": [...] },
  "skills": {
    "acrobatics": { "base": 7 }, "athletics": { "base": 11 }, "intimidation": { "base": 6 }
  },
  "attributes": { "ac": { "details": "", "value": 18 } }
}
```

**Modifier types used on conditions/feats in refs/:**
- `status` type: FlatModifier rules on conditions (e.g., Blinded → -4 status to perception)
- `circumstance` type: Off-Guard → -2 circumstance to AC; Prone (melee) → -2 circumstance to attack
- Both types are already present in engine's `MODIFIER_TYPES`

**Proficiency data in class JSON:**
```json
"attacks": { "advanced": 0, "martial": 1, "simple": 1, "unarmed": 1 },
"defenses": { "heavy": 0, "light": 1, "medium": 1, "unarmored": 1 }
```
Proficiency rank values: 0 = untrained, 1 = trained, 2 = expert, 3 = master, 4 = legendary

### What engine currently has

From `engine/modifiers/modifiers.ts`:
- `Modifier` class: slug, label, modifier, type, enabled
- `MODIFIER_TYPES`: `['ability', 'circumstance', 'item', 'potency', 'proficiency', 'status', 'untyped']`
- `applyStackingRules()`: typed highest-bonus/lowest-penalty, untyped additive — correct per PF2e
- `StatisticModifier`: computes `totalModifier` from a Modifier list
- `DamageDicePF2e`: models additional damage dice (for weapon runes, class features)

### Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| No Statistic definitions | No model of what statistics exist (AC, saves, skills, perception, attack rolls, spell DCs). Modifier math works in isolation with no statistics to modify | HIGH |
| No condition-to-modifier link | When a condition is applied, its FlatModifier rules should contribute modifiers to affected statistics. No link between ConditionManager and StatisticModifier | HIGH |
| No proficiency system | Proficiency ranks (untrained/trained/expert/master/legendary) and proficiency bonus calculation (level + rank-bonus) are absent | HIGH |
| No ability modifier calculation | Ability scores are stored as `mod` in creature JSON (pre-calculated). Engine has no function to compute modifier from score (score/2 - 5) or to use ability mod as typed bonus | HIGH |
| No Multiple Attack Penalty | MAP: -5/-10 (agile), -10/-10 (non-agile). Applies as untyped penalty on attack rolls after first attack in a turn | HIGH |
| No degree-of-success system | Critical success (+10 over DC), success, failure, critical failure (-10 under DC) — ±10 rule — not modeled anywhere | HIGH |
| No ability score generation | Creatures store precalculated `mod` values; a character-building system needs ability score → mod function. Not needed for DM tool yet. | LOWER |
| Enhancement/deflection types | Some sources use enhancement and deflection bonus types (older OGL content). Not in engine's MODIFIER_TYPES | LOWER |

### Key Schema Insights

- Creatures in refs/ store pre-calculated statistics (AC value, save total, perception total) rather than the component modifiers. This is because NPCs/monsters are built as final stat blocks, not built from level + proficiency + ability.
- Player Characters build statistics additively (proficiency rank + ability mod + item bonus + status bonus + circumstance bonus). The modifier system is designed for PCs, not NPCs.
- The degree-of-success system (+10 for crit success, -10 for crit failure) applies to all checks — attack rolls, saving throws, skill checks — and is the foundation for how Blinded makes you auto-crit-fail Perception checks.

---

## Domain 5: Creatures & Stat Blocks [HIGH PRIORITY]

### What refs/pf2e/ has

**Location:** Multiple bestiary packs — `pathfinder-monster-core/` (492), `pathfinder-monster-core-2/` (446), `pathfinder-npc-core/` (271), `lost-omens-bestiary/` (371), plus 30+ adventure-specific bestiaries totaling ~3,000+ creatures

**Complete system schema (from animated-broom.json level -1 and aapoph-serpentfolk.json level 3):**
```json
"system": {
  "abilities": {
    "cha": { "mod": N }, "con": { "mod": N }, "dex": { "mod": N },
    "int": { "mod": N }, "str": { "mod": N }, "wis": { "mod": N }
  },
  "attributes": {
    "ac": { "details": string, "value": number },
    "allSaves": { "value": string },
    "hp": { "details": string, "max": number, "temp": number, "value": number },
    "immunities": [{ "type": string }],
    "weaknesses": [{ "type": string, "value": number }],
    "resistances": [{ "type": string, "value": number }],
    "speed": { "value": number, "otherSpeeds": [{ "type": string, "value": number }] }
  },
  "details": {
    "blurb": string,
    "languages": { "details": string, "value": string[] },
    "level": { "value": number },
    "privateNotes": string,
    "publicNotes": string
  },
  "initiative": { "statistic": "perception" },
  "perception": {
    "details": string, "mod": number,
    "senses": [{ "type": string, "acuity"?: string, "range"?: number }]
  },
  "resources": {},
  "saves": {
    "fortitude": { "saveDetail": string, "value": number },
    "reflex": { "saveDetail": string, "value": number },
    "will": { "saveDetail": string, "value": number }
  },
  "skills": {
    "[skillName]": { "base": number }
  },
  "traits": {
    "rarity": "common" | "uncommon" | "rare" | "unique",
    "size": { "value": "tiny" | "sm" | "med" | "lg" | "huge" | "grg" },
    "value": string[]
  }
}
```

**Embedded items array (`items[]`)** — each creature embeds:
- `type: "weapon"` — carried weapons with `system.damage`, `system.runes`, `system.traits`
- `type: "melee"` — melee attack stat blocks with `system.bonus.value` (attack bonus), `system.damageRolls` (damage expressions), `system.traits`
- `type: "action"` — creature abilities (passive, reaction, 1-2-3 action abilities) with `system.actionType`, `system.rules[]`
- `type: "spellcastingEntry"` — spellcasting ability entries
- `type: "spell"` — embedded spell instances

### What engine currently has

From `engine/types.ts`:
- `WeakEliteTier = 'normal' | 'weak' | 'elite'` — only this type exists
- `getHpAdjustment()` in `engine/encounter/weak-elite.ts` for weak/elite HP delta
- `parseIwrData()` in `engine/damage/iwr-utils.ts` for parsing IWR from raw Foundry JSON
- No Creature type, no stat block interface, no HP tracking state

### Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| No Creature type in engine | `engine/types.ts` only has `WeakEliteTier`. No Creature interface with HP, AC, saves, abilities, IWR, speed, size, traits | HIGH |
| No creature stat calculation | Given a creature's raw attributes, engine cannot compute effective AC (flat-footed, flanked), saves, or attack modifiers | HIGH |
| No melee attack model | `type: "melee"` items in creature JSON define attack bonus and damage rolls — not modeled in engine | HIGH |
| No creature ability model | Reactive Strike, Grab, Constrict, Frightful Presence (~55 in bestiary-ability-glossary-srd) — no engine representation | HIGH |
| No HP tracking state | HP tracking was in Vue store; engine has `getHpAdjustment()` for weak/elite delta but no HP state model | MEDIUM |
| No sense model | Senses (darkvision, scent, tremorsense, etc.) are in `system.perception.senses[]` — not modeled | MEDIUM |
| No speed model | Speed types (land, fly, swim, burrow, climb) in `system.attributes.speed` — not modeled | MEDIUM |

### Key Schema Insights

- Creatures store attack bonuses as flat numbers in `melee.system.bonus.value` (not computed from ability + proficiency). This is the NPC pattern.
- Damage rolls use formula strings (e.g., `"1d6+6"`) in `damageRolls[id].damage` — these are pre-calculated NPC stats.
- The `allSaves` field contains a text description of save bonuses (e.g., `"+2 status to will saves vs. mental"`) rather than a structured modifier array.
- `otherSpeeds` lists non-land movement types with `{ type: "fly" | "swim" | "burrow" | "climb", value: number }`.

---

## Domain 6: Spells [HIGH PRIORITY]

### What refs/pf2e/ has

**Location:** `refs/pf2e/spells/` — 1,796 entries total in subdirectories:
- `spells/cantrip/` — cantrip spells
- `spells/rank-1/` through `spells/rank-10/` — leveled spells
- `focus/` — 150 focus spells
- `rituals/` — 11 rituals (in subdirectories)

**JSON Schema (from acid-splash.json cantrip and agonizing-despair.json rank-3 direct reading):**
```json
{
  "type": "spell",
  "system": {
    "area": null | { "details": string, "type": "emanation" | "burst" | "cone" | "line", "value": number },
    "cost": { "value": string },
    "counteraction": false,
    "damage": {
      "[id]": {
        "applyMod": boolean,
        "category": null | "splash" | "persistent",
        "formula": "1d6",
        "kinds": ["damage"],
        "materials": [],
        "type": string
      }
    },
    "defense": null | { "save": { "basic": boolean, "statistic": "fortitude" | "reflex" | "will" } },
    "description": { "value": "<p>...</p>" },
    "duration": { "sustained": boolean, "value": string },
    "heightening": {
      "type": "fixed" | "interval",
      "levels"?: { "[rank]": { "damage": {...} } },
      "interval"?: number,
      "damage"?: { "[id]": "2d6" }
    },
    "level": { "value": 1 },
    "range": { "value": "30 feet" },
    "requirements": string,
    "rules": [],
    "target": { "value": string },
    "time": { "value": "1" | "2" | "3" | "reaction" | "free" | "1 minute" },
    "traits": {
      "rarity": "common",
      "traditions": ["arcane", "divine", "occult", "primal"],
      "value": string[]
    }
  }
}
```

**Focus spell schema (from aberrant-whispers.json direct reading):**
Same schema as regular spells. Focus spells have `focus: true` in traits and use `system.overlays` for variant casting modes.

**Key spell fields:**
- `system.time.value`: Action cost as string ("1", "2", "3", "reaction", "free", or duration like "1 minute")
- `system.traditions`: Which magical traditions can cast this spell (arcane, divine, occult, primal)
- `system.damage`: Map of damage components — each has `formula`, `type`, and optional `category` (splash, persistent)
- `system.defense.save`: Which save the spell uses, and whether it's a basic save (half damage on save)
- `system.heightening`: How damage scales — either at fixed ranks (`"fixed"`) or per interval (`"interval"`)

### What engine currently has

No engine coverage for spells. Zero spell types, schemas, tradition system, or slot tracking.

### Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| Entire spell system absent | 1,796 spells with no engine representation | HIGH |
| No spell type/schema | No TypeScript interface for Spell (area, damage, defense, duration, level, range, target, time, traits) | HIGH |
| No spell damage model | Spells deal typed damage with optional categories (splash, persistent) and heightened scaling | HIGH |
| No spell save/defense system | Spells require saves — links to degree-of-success; basic saves halve damage on success | HIGH |
| No spell tradition system | arcane, divine, occult, primal — affects casting availability and interacts with class spellcasting | HIGH |
| No heightening system | Fixed-level heightening and per-rank interval heightening change damage formulas | HIGH |
| No spell slot/focus point tracking | Prepared and spontaneous casting use spell slots; focus spells use focus points (max 3) | HIGH |
| Focus spell subsystem | 150 focus spells with refocus mechanic (regain focus point by spending 10 minutes) | HIGH |
| Ritual system | 11 rituals with special multi-caster and multi-check resolution | LOWER |
| Counteract system | Counterspell and counteract checks use separate opposed-check mechanic | MEDIUM |

### Key Schema Insights

- Spell damage uses formula strings (e.g., `"1d6"`, `"4d6"`) not pre-calculated values — the dice are rolled at cast time.
- The `applyMod` boolean on damage components indicates whether the caster's spellcasting ability modifier adds to damage.
- `basic: false` on saves means the full four-outcome system applies; `basic: true` means success = half damage, failure = full, critical failure = double.
- Cantrip spells have `system.level.value: 1` but are scaled to half the caster's level when cast.

---

## Domain 7: Equipment & Weapons [HIGH PRIORITY]

### What refs/pf2e/ has

**Location:** `refs/pf2e/equipment/` — 5,616 entries of multiple item types (ammo, armor, backpack, consumable, equipment, kit, shield, treasure, weapon)

**Weapon Schema (from longsword.json direct reading):**
```json
{
  "type": "weapon",
  "system": {
    "baseItem": "longsword",
    "category": "martial",
    "damage": { "damageType": "slashing", "dice": 1, "die": "d8" },
    "group": "sword",
    "runes": { "potency": 0, "property": [], "striking": 0 },
    "traits": { "rarity": "common", "value": ["versatile-p"] },
    "level": { "value": 0 },
    "bulk": { "value": 1 },
    "range": null,
    "reload": { "value": "-" },
    "material": { "grade": null, "type": null }
  }
}
```

**Armor Schema (from breastplate.json direct reading):**
```json
{
  "type": "armor",
  "system": {
    "baseItem": "breastplate",
    "category": "medium",
    "acBonus": 4,
    "checkPenalty": -2,
    "dexCap": 1,
    "group": "plate",
    "runes": { "potency": 0, "property": [], "resilient": 0 },
    "speedPenalty": -5,
    "strength": 3,
    "traits": { "rarity": "common", "value": [] }
  }
}
```

**Shield Schema (from steel-shield.json direct reading):**
```json
{
  "type": "armor",
  "system": {
    "acBonus": 2,
    "hardness": 5,
    "hp": { "max": 20, "value": 20 },
    "runes": { "reinforcing": 0 },
    "speedPenalty": 0,
    "traits": { "rarity": "common", "value": [] }
  }
}
```

**Key weapon fields:**
- `system.damage`: `{ damageType, dice: number, die: "d4"|"d6"|"d8"|"d10"|"d12" }` — base damage definition
- `system.group`: sword, axe, bow, club, knife, spear, etc. — affects critical specialization effects
- `system.runes.potency`: 0–4 — attack bonus from potency rune
- `system.runes.striking`: 0–3 — additional damage dice (0=none, 1=striking, 2=greater, 3=major)
- `system.runes.property`: array of property rune slugs (flaming, corrosive, etc.)
- `system.traits.value`: weapon traits array (agile, finesse, reach, versatile, deadly, fatal, etc.)

### What engine currently has

From `engine/damage/damage.ts` and `engine/modifiers/modifiers.ts`:
- `DamageFormula` type: resolved damage expression with diceNumber, dieSize, modifier, damageType, category, persistent
- `BaseDamage` type: rolled damage with damageType, category, total, isCritical
- `DamageDicePF2e` class: models additional damage dice
- `MATERIAL_EFFECTS`: weapon material bypass
- No Weapon type, no Armor type, no Shield type, no rune system

### Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| No Weapon type | No TypeScript interface for weapons (baseItem, category, damage die, damageType, group, runes, traits, range, bulk) | HIGH |
| No rune system | Potency (attack bonus) and striking (extra damage dice) are fundamental to PF2e gear progression — not modeled | HIGH |
| No Armor type | No interface for armor (acBonus, category, dexCap, checkPenalty, speedPenalty, strength requirement, group, runes) | HIGH |
| No Shield type | No interface for shields (acBonus, hardness, HP, runes.reinforcing) | HIGH |
| No weapon group effects | Weapon groups determine critical specialization effects (e.g., sword group: bleeding on crits) — not modeled | HIGH |
| No equipment traits system | Finesse, agile, deadly, fatal, reach, versatile, thrown — affect attack calculations, MAP, and critical effects | HIGH |
| No property rune effects | 685 equipment-effects entries model runtime effects from property runes — not processed | MEDIUM |
| No consumables/general equipment | Alchemical bombs, elixirs, potions, wands, scrolls — all in equipment pack, no engine coverage | MEDIUM |

### Key Schema Insights

- NPC/creature weapons use `type: "melee"` (attack stat block) rather than `type: "weapon"` (equipment card). The melee item stores `bonus.value` (pre-calculated attack bonus) and `damageRolls` (formula strings).
- Player-facing weapons use `type: "weapon"` and derive attack bonus from proficiency + ability + potency rune.
- `runes.striking` value maps to additional dice: 0 = base damage, 1 = +1 damage die, 2 = +2 damage dice, 3 = +3 damage dice.
- Armor's `strength` field is the Strength score required to avoid the check penalty.

---

## Domain 8: Hazards [HIGH PRIORITY]

### What refs/pf2e/ has

**Location:** `refs/pf2e/hazards/` — 53 hazard entries

**JSON Schema (from armageddon-orb.json and eternal-flame.json direct reading):**
```json
{
  "type": "hazard",
  "items": [
    {
      "type": "action",
      "system": {
        "actionType": { "value": "reaction" },
        "actions": { "value": null },
        "description": { "value": "..." },
        "traits": { "value": ["fire", "death"] }
      }
    }
  ],
  "system": {
    "attributes": {
      "ac": { "value": 10 },
      "emitsSound": "encounter",
      "hardness": 0,
      "hasHealth": false,
      "hp": { "details": "", "max": 0, "temp": 0, "tempmax": 0, "value": 0 }
      "stealth": { "details": string, "value": number }
    },
    "details": {
      "description": string,
      "disable": string,
      "isComplex": false,
      "level": { "value": 23 },
      "reset": string,
      "routine": string
    },
    "saves": {
      "fortitude": { "saveDetail": "", "value": 0 },
      "reflex": { "saveDetail": "", "value": 0 },
      "will": { "saveDetail": "", "value": 0 }
    },
    "traits": {
      "rarity": "rare",
      "size": { "value": "med" },
      "value": ["magical"]
    }
  }
}
```

**Key hazard fields:**
- `system.details.isComplex`: Boolean — complex hazards have initiative and routine actions
- `system.attributes.hasHealth`: Boolean — some hazards can be destroyed
- `system.attributes.hardness`: Physical hardness (damage reduction from mundane attacks)
- `system.details.disable`: Text description of disable check(s) (e.g., "Thievery DC 30 (master)")
- `system.details.routine`: Text description of complex hazard's turn actions
- `items[]`: Embedded actions (typically reactions and free actions for traps, routine actions for complex)

### What engine currently has

From `engine/encounter/xp.ts`:
- `HazardType = 'simple' | 'complex'`
- `getHazardXp()`: Returns XP value for simple or complex hazard relative to party level
- `calculateXP()`: Includes hazards in encounter XP calculation

No hazard stat block type, no hazard disable modeling, no routine action execution.

### Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| Complex hazard initiative | Complex hazards join combat with their own initiative and routine actions — no engine modeling | HIGH |
| No Hazard stat type | Engine can calculate hazard XP but has no Hazard interface for stat blocks (HP, hardness, AC, saves, disable DCs) | MEDIUM |
| Hazard disable mechanics | Skill checks to disable (Thievery DC, Arcana DC, etc.) not modeled | MEDIUM |
| Hazard reactions | Hazard reactions (trigger + effect) are embedded actions — no execution model | MEDIUM |
| Hazard reset conditions | Time-based or condition-based reset not modeled | LOWER |

### Key Schema Insights

- Hazard `disable` field is free-text in refs/ (not structured data) — implementation will need to parse or manually structure it.
- `hasHealth: false` hazards cannot be destroyed by damage (Armageddon Orb) — only disabled by the specified check.
- Complex hazards typically have initiative equal to Stealth DC (the hazard "rolls" Stealth for initiative before it's noticed).

---

## Domain 9: Feats [HIGH PRIORITY]

### What refs/pf2e/ has

**Location:** `refs/pf2e/feats/` — 5,861 entries in subdirectories:
- `feats/ancestry/` — ancestry feats (52 subdirs by ancestry)
- `feats/archetype/` — archetype feats (243 files across levels)
- `feats/class/` — class feats (28 class subdirs × levels)
- `feats/general/` — general feats (5 level subdirs)
- `feats/skill/` — skill feats (10 level subdirs)
- `feats/mythic/` — mythic feats

**JSON Schema (from raging-intimidation.json barbarian class feat, direct reading):**
```json
{
  "type": "feat",
  "system": {
    "actionType": { "value": "passive" },
    "actions": { "value": null },
    "category": "class",
    "level": { "value": 1 },
    "prerequisites": { "value": [] },
    "rules": [
      { "key": "GrantItem", "flag": "intimidatingGlare",
        "predicate": [{ "gte": ["skill:intimidation:rank", 1] }],
        "reevaluateOnUpdate": true,
        "uuid": "Compendium.pf2e.feats-srd.Item.Intimidating Glare" },
      { "key": "ItemAlteration", "itemType": "action", "mode": "add",
        "predicate": ["item:slug:demoralize", "self:effect:rage"],
        "property": "traits", "value": "rage" }
    ],
    "traits": { "rarity": "common", "value": ["barbarian"] }
  }
}
```

**Rule Elements used in feats (broad sampling from Research):**
FlatModifier, GrantItem, RollOption, BattleForm, ChoiceSet, CraftingEntry, FastHealing, ItemAlteration, ActiveEffectLike, AdjustDegreeOfSuccess, EphemeralEffect, Immunity, Note, Resistance, Strike, Weakness, etc. — a very broad set covering most of the Rule Element vocabulary.

**Prerequisite examples:**
- Simple array of strings: `["Trained in Athletics"]`, `["Expert in Stealth"]`
- Some feats have no prerequisites (`"value": []`)

### What engine currently has

No engine coverage for feats. Zero feat definitions, schemas, or Rule Element processing.

### Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| Entire feat system absent | 5,861 feats with no engine representation | HIGH |
| No feat type/schema | No TypeScript interface for Feat (level, category, prerequisites, rules, traits) | HIGH |
| No Rule Element system | The mechanical effects of feats (FlatModifier grants, GrantItem chains, etc.) require a Rule Element processing engine — currently absent | HIGH |
| No feat registry | No way to look up feats by slug, category, or class | HIGH |
| No prerequisite validation | Feat prerequisites (skill ranks, other feats, level) are not checked | LOWER |

### Key Schema Insights

- Feat entries encode **what the feat does via Rule Elements**, not just description text. A complete feat system requires a Rule Element processor that can interpret GrantItem, FlatModifier, RollOption, etc.
- GrantItem with `reevaluateOnUpdate: true` means the item is conditionally granted based on a predicate — the system must re-evaluate when the predicate's dependencies change (e.g., skill rank increases).
- The `predicate` array supports complex expressions: objects like `{ "gte": ["skill:intimidation:rank", 1] }` (greater-than-or-equal comparison).

---

## Domain 10: Classes & Class Features [HIGH PRIORITY]

### What refs/pf2e/ has

**Location:**
- `refs/pf2e/classes/` — 27 class definitions
- `refs/pf2e/class-features/` — 826 class feature entries (Rage, Sneak Attack, Wild Shape, etc.)

**Class JSON Schema (from barbarian.json direct reading):**
```json
{
  "type": "class",
  "system": {
    "ancestryFeatLevels": { "value": [1, 5, 9, 13, 17] },
    "classFeatLevels": { "value": [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20] },
    "attacks": { "advanced": 0, "martial": 1, "other": {"name":"","rank":0}, "simple": 1, "unarmed": 1 },
    "defenses": { "heavy": 0, "light": 1, "medium": 1, "unarmored": 1 },
    "generalFeatLevels": { "value": [3, 7, 11, 15, 19] },
    "hp": 12,
    "items": {
      "[id]": { "img": string, "level": number, "name": string, "uuid": string }
    },
    "keyAbility": { "value": ["str", "con"] },
    "perception": 1,
    "rules": [],
    "saves": { "fortitude": 2, "reflex": 0, "will": 1 },
    "skills": { "additional": 3, "value": ["athletics", "intimidation"] },
    "spellcasting": false,
    "trainedSkills": { "value": ["athletics"] },
    "traits": { "rarity": "common", "value": ["barbarian"] }
  }
}
```

**Save proficiency values:** 0 = untrained, 1 = trained, 2 = expert, 3 = master, 4 = legendary (same as weapon/armor proficiency)

**Class feature schema** is identical to feat schema — each feature has a `rules[]` array of Rule Elements.

**27 classes in refs/:** alchemist, animist, barbarian, bard, champion, cleric, commander, druid, exemplar, fighter, gunslinger, inventor, investigator, kineticist, magus, monk, oracle, psychic, ranger, rogue, sorcerer, summoner, swashbuckler, thaumaturge, witch, wizard (and 1 more)

### What engine currently has

No engine coverage for classes or class features.

### Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| No class schema | 27 class definitions with no engine representation | HIGH |
| No class feature system | 826 class features (Rage, Sneak Attack, Wild Shape, etc.) with no engine representation | HIGH |
| No proficiency progression | Classes define initial proficiency ranks and advancement — no engine modeling | HIGH |
| No key ability system | Each class has keyAbility (str, dex, con, int, wis, cha) that drives spellcasting DC and sometimes attack bonus | HIGH |
| No class feature progression | Class `items` object maps features to their unlock levels — no progression tracking | HIGH |

### Key Schema Insights

- Class `hp` field is the class-base HP per level (added to Constitution modifier × level).
- Save values (fortitude: 2, reflex: 0, will: 1) are the **starting proficiency rank** for each save, not the final bonus.
- The `items` map in a class references class features by UUID — the progression system must look them up and grant them at the appropriate level.

---

## Domain 11: Ancestries & Heritages [LOWER PRIORITY]

### What refs/pf2e/ has

**Location:**
- `refs/pf2e/ancestries/` — 50 ancestry definitions
- `refs/pf2e/heritages/` — 321 heritage entries
- `refs/pf2e/ancestry-features/` — 55 ancestry features

**Ancestry schema (from anadi.json partial reading):**
```json
{
  "type": "ancestry",
  "system": {
    "additionalLanguages": { "count": 0, "value": ["draconic", "elven"] },
    "boosts": {
      "0": { "value": ["dex"] },
      "1": { "value": ["wis"] },
      "2": { "value": ["str", "dex", "con", "int", "wis", "cha"] }
    },
    "flaws": { "0": { "value": ["con"] } },
    "hands": 2,
    "hp": 8,
    "languages": { "custom": "", "value": ["anadi", "mwangi"] },
    "reach": 5,
    "rules": [...]
  }
}
```

**Key ancestry fields:** ability boosts/flaws, HP per level (hp: 8 means ancestry grants 8 HP at level 1), starting languages, reach, size (implied by hands/reach), Rule Elements for ancestry-specific mechanics.

### What engine currently has

No engine coverage for ancestries or heritages.

### Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| Entire ancestry system absent | 50 ancestries with ability boosts, flaws, HP grants, languages — no engine representation | LOWER |
| Heritage system absent | 321 heritages with passive abilities and Rule Elements — no engine representation | LOWER |
| Ancestry feature system absent | 55 ancestry features (Fangs, Darkvision, etc.) — no engine representation | LOWER |

### Key Schema Insights

- Ancestries grant HP at character creation (ancestry HP + max CON score + class HP per level formula).
- The `boosts` field has multiple tiers: fixed boosts (indices 0, 1) and a choice boost (index 2 with all ability scores listed as options).
- Heritage entries follow the feat schema pattern — they contain Rule Elements rather than structured mechanical data.

---

## Domain 12: Downtime Actions [LOWER PRIORITY]

### What refs/pf2e/ has

**Location:** `refs/pf2e/actions/downtime/` — 4 action entries

**Files (from direct directory listing):**
- `grow.json` — Grow downtime action (farming/druidic)
- `learn-name.json` — Learn a creature's true name
- `long-term-rest.json` — Extended rest for HP recovery
- `retraining.json` — Retrain class/skill choices

**Long-term Rest schema (from long-term-rest.json direct reading):**
```json
{
  "type": "action",
  "system": {
    "actionType": { "value": "passive" },
    "actions": { "value": null },
    "category": "interaction",
    "description": { "value": "<p>You can spend an entire day and night resting during downtime to recover Hit Points equal to your Constitution modifier (minimum 1) multiplied by twice your level.</p>" },
    "traits": { "rarity": "common", "value": ["downtime"] },
    "rules": []
  }
}
```

**Note:** The Earn Income, Craft, and related core downtime activities exist in `refs/pf2e/actions/skill/` (not `downtime/`). The `downtime/` directory covers only 4 specialized downtime activities.

### What engine currently has

No engine coverage for downtime mechanics.

### Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| Entire downtime system absent | Long-Term Rest HP calculation, Retraining, Learn Name, Grow — no engine representation | LOWER |
| Crafting subsystem absent | Craft action (in skill actions), crafting entries, item cost reduction — no engine representation | LOWER |
| Earn Income absent | Skill check-based income generation at various proficiency levels — no engine representation | LOWER |

### Key Schema Insights

- Downtime actions use `"value": "downtime"` in their traits array — this is the identifying marker.
- Long-Term Rest formula is purely descriptive text in refs/ — the implementation must encode the formula (CON mod × 2 × level).

---

## Open Questions

### 1. holy/unholy vs vitality/void in Remaster Context

**What we know:** Refs/ weakness and resistance data uses `holy` and `unholy` as type strings. These appear on Remaster-tagged content (`"remaster": true`). Engine uses vitality/void for positive/negative energy (correct Remaster names).

**What's unclear:** Whether `holy`/`unholy` are distinct Remaster damage types (different from vitality/void) that coexist as alignment-damage types alongside the energy-damage vitality/void types — OR whether they are legacy OGL names appearing only in non-remastered content.

**Evidence from refs/ scanning (Research):** `holy` and `unholy` appear in weakness arrays in content tagged `"remaster": true` — confirming these are current Remaster types, NOT legacy names. In PF2e Remaster, holy and unholy replaced alignment (good/evil) damage. They are distinct from vitality/void (positive/negative energy).

**Recommendation:** Add `holy` and `unholy` to `DAMAGE_TYPES` (as energy damage types alongside vitality/void). Phase 3 should confirm against the PF2e Player Core 2.

### 2. malevolence Condition Source

**What we know:** `malevolence` is slug 27 of 44 in engine `CONDITION_SLUGS` but has no corresponding JSON in `refs/pf2e/conditions/`.

**Investigation:** The `refs/pf2e/malevolence-bestiary/` pack contains 20 entries. The malevolence condition may originate from this adventure AP's bestiary as a local condition rather than a core PF2e condition.

**Recommendation:** Document `malevolence` as an adventure-specific condition intentionally included in engine. Not a data error.

### 3. abilities Group Condition Coexistence

**What we know:** refs/ groups clumsy, cursebound, drained, enfeebled, stupefied under the `abilities` group. Engine's `CONDITION_GROUPS` uses groups for mutual exclusion only.

**What's confirmed:** These conditions affect different ability scores (clumsy → Dex, drained → Constitution, enfeebled → Str, stupefied → Int/Wis/Cha). A creature can and does have multiple of these simultaneously (e.g., clumsy 2 AND drained 1 from different effects).

**Answer:** The `abilities` group is informational metadata, NOT mutual exclusion. Engine's group-based mutual exclusion should NOT apply to the abilities group. The `senses` group also requires re-examination — blinded and concealed can coexist.

### 4. Condition vs Damage Immunity Processing Path

**New question discovered during analysis:** The IWR `immunities` array in creature JSON mixes damage types (fire, cold) with condition names (paralyzed, stunned) and effect categories (fear-effects, disease). How should these be processed?

**Proposal:** Separate processing paths: (a) `applyIWR()` handles damage-type immunities; (b) `ConditionManager.add()` checks a new creature immunity set before applying conditions. Both use the same type strings but different execution paths.

### 5. senses Group Mutual Exclusivity

**New question:** Blinded overrides Dazzled (via `overrides` field), but both are in the `senses` group. Concealed is also in senses — can a creature be both Blinded and Concealed? (Concealed refers to a different mechanic — obscuring mist, darkness — while Blinded is a condition.)

**Investigation needed:** Whether `group: "senses"` implies any mutual exclusion beyond the explicit `overrides` field, or whether it is purely categorization.

---

## Appendix: Content Pack Inventory

Complete count of all JSON entries in `refs/pf2e/` subdirectories (recursive, excluding `_folders.json`). Verified by direct Node.js filesystem enumeration.

**Total entries: 28,026**

| Pack | Entry Count | Engine-Relevant? |
|------|------------|------------------|
| feats | 5,861 | HIGH — feat Rule Elements drive modifier math |
| equipment | 5,616 | HIGH — weapons, armor, property runes |
| spells | 1,796 | HIGH — spell damage, conditions, Rule Elements |
| class-features | 826 | HIGH — class ability mechanics |
| feat-effects | 798 | MEDIUM — runtime effects for feats |
| equipment-effects | 685 | MEDIUM — runtime effects for equipment |
| bestiary-effects | 629 | MEDIUM — runtime creature effects |
| actions | 545 | HIGH — all action types |
| spell-effects | 518 | MEDIUM — runtime spell effects |
| pathfinder-monster-core | 492 | HIGH — primary creature data |
| backgrounds | 490 | LOWER — non-combat |
| deities | 478 | LOWER — non-combat primarily |
| bestiary-family-ability-glossary | 456 | HIGH — reusable creature family abilities |
| pathfinder-monster-core-2 | 446 | HIGH — extended creature data |
| lost-omens-bestiary | 371 | HIGH — additional creatures |
| pfs-season-6-bestiary | 339 | HIGH — creature data |
| pfs-season-1-bestiary | 331 | HIGH — creature data |
| heritages | 321 | LOWER — character creation |
| pfs-season-3-bestiary | 278 | HIGH — creature data |
| pathfinder-npc-core | 271 | HIGH — NPC stat blocks |
| kingmaker-bestiary | 262 | HIGH — creatures |
| pfs-season-2-bestiary | 254 | HIGH — creature data |
| boons-and-curses | 247 | LOWER |
| pfs-season-5-bestiary | 231 | HIGH — creature data |
| pfs-season-4-bestiary | 220 | HIGH — creature data |
| blood-lords-bestiary | 191 | HIGH — creatures |
| agents-of-edgewatch-bestiary | 185 | HIGH — creatures |
| pathfinder-bestiary-3 | 168 | HIGH — core creatures |
| extinction-curse-bestiary | 167 | HIGH — creatures |
| pathfinder-bestiary | 167 | HIGH — core creatures |
| pathfinder-bestiary-2 | 161 | HIGH — core creatures |
| adventure-specific-actions | 160 | HIGH — combat actions |
| strength-of-thousands-bestiary | 159 | HIGH — creatures |
| pathfinder-society-boons | 157 | LOWER |
| fists-of-the-ruby-phoenix-bestiary | 138 | HIGH — creatures |
| kingmaker-features | 132 | HIGH — class-feature-like items |
| age-of-ashes-bestiary | 130 | HIGH — creatures |
| abomination-vaults-bestiary | 112 | HIGH — creatures |
| familiar-abilities | 111 | MEDIUM — familiar mechanics |
| sky-kings-tomb-bestiary | 107 | HIGH — creatures |
| book-of-the-dead-bestiary | 106 | HIGH — undead creatures |
| criticaldeck | 106 | MEDIUM — critical hit/fumble deck |
| outlaws-of-alkenstar-bestiary | 98 | HIGH — creatures |
| stolen-fate-bestiary | 98 | HIGH — creatures |
| revenge-of-the-runelords-bestiary | 97 | HIGH — creatures |
| season-of-ghosts-bestiary | 96 | HIGH — creatures |
| shades-of-blood-bestiary | 95 | HIGH — creatures |
| triumph-of-the-tusk-bestiary | 89 | HIGH — creatures |
| wardens-of-wildwood-bestiary | 90 | HIGH — creatures |
| gatewalkers-bestiary | 89 | HIGH — creatures |
| quest-for-the-frozen-flame-bestiary | 87 | HIGH — creatures |
| vehicles | 91 | LOWER — non-core combat |
| iconics | 84 | MEDIUM — pregenerated characters |
| myth-speaker-bestiary | 82 | HIGH — creatures |
| pfs-season-7-bestiary | 81 | HIGH — creature data |
| rage-of-elements-bestiary | 81 | HIGH — creatures |
| hellbreakers-bestiary | 78 | HIGH — creatures |
| spore-war-bestiary | 78 | HIGH — creatures |
| howl-of-the-wild-bestiary | 76 | HIGH — creatures |
| campaign-effects | 74 | MEDIUM — ongoing effects |
| curtain-call-bestiary | 74 | HIGH — creatures |
| action-macros | 71 | REFERENCE ONLY — automation macros |
| menace-under-otari-bestiary | 70 | HIGH — creatures |
| rollable-tables | 69 | LOWER |
| seven-dooms-for-sandpoint-bestiary | 69 | HIGH — creatures |
| ancestry-features | 55 | LOWER — character creation |
| bestiary-ability-glossary-srd | 55 | HIGH — standard creature abilities |
| battlecry-bestiary | 55 | HIGH — creatures |
| hazards | 53 | HIGH — encounter mechanics |
| other-effects | 53 | MEDIUM — miscellaneous effects |
| paizo-pregens | 53 | MEDIUM — pregenerated characters |
| ancestries | 50 | LOWER — character creation |
| conditions | 43 | HIGH — core condition data |
| claws-of-the-tyrant-bestiary | 42 | HIGH — creatures |
| crown-of-the-kobold-king-bestiary | 42 | HIGH — creatures |
| prey-for-death-bestiary | 40 | HIGH — creatures |
| one-shot-bestiary | 33 | HIGH — creatures |
| blog-bestiary | 32 | HIGH — creatures |
| pathfinder-dark-archive | 31 | HIGH — creatures/class content |
| classes | 27 | HIGH — class mechanics |
| rusthenge-bestiary | 25 | HIGH — creatures |
| fall-of-plaguestone | 24 | HIGH — creatures |
| malevolence-bestiary | 20 | HIGH — creatures |
| shadows-at-sundown-bestiary | 18 | HIGH — creatures |
| troubles-in-otari-bestiary | 18 | HIGH — creatures |
| night-of-the-gray-death-bestiary | 17 | HIGH — creatures |
| the-enmity-cycle-bestiary | 17 | HIGH — creatures |
| war-of-immortals-bestiary | 16 | HIGH — creatures/class content |
| pfs-introductions-bestiary | 13 | HIGH — creature data |
| the-slithering-bestiary | 13 | HIGH — creatures |
| macros | 10 | REFERENCE ONLY |
| standalone-adventures | 8 | REFERENCE ONLY |
| journals | 7 | REFERENCE ONLY |
| npc-gallery | 6 | HIGH — sample NPCs |

---

*Analysis complete. Task 2 fills in Executive Summary and Prioritized Missing Mechanics sections.*
