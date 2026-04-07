# Phase 02: Reference Analysis - Research

**Researched:** 2026-03-31
**Domain:** Foundry VTT PF2e JSON data schema vs. existing `/engine` TypeScript modules
**Confidence:** HIGH — all findings derived from direct inspection of `refs/pf2e/` and `engine/` source files

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full rules engine scope — analyze all mechanical systems (conditions, actions, modifiers, skills, spells, equipment properties, hazards, and any other system with rules logic)
- **D-02:** Include data schemas AND full content inventory — document what fields entities have, and catalog what specific data exists (list of all spells, all feats, etc.)
- **D-03:** Not limited to DM-facing mechanics — cover the complete PF2e rules as represented in the Foundry VTT source
- **D-04:** Organized by domain area — each section covers one engine domain (conditions, actions, damage, modifiers, spells, equipment, etc.) with: what exists in refs/, what engine currently has, what's missing
- **D-05:** Claude decides whether to produce one document or multiple domain-focused documents, and what level of detail per entry
- **D-06:** Two-tier priority system: High = combat-related (conditions, combat actions, creatures, items, spells, hazards, related mechanics); Lower = downtime mechanics (work, rest, crafting, earning income)
- **D-07:** Within each tier, no further ranking — all items are equally important. Implementation order decided in later phases.
- **D-08:** `refs/pf2e/` is the primary source of content packs to analyze
- **D-09:** Other directories (`refs/lib/`, `refs/fonts/`, `refs/icons/`, `refs/lang/`, `refs/uuid-redirects/`) are secondary
- **D-10:** Claude decides whether to analyze TypeScript code in refs/lib/ for implementation patterns or focus on JSON data

### Claude's Discretion
- Single vs multiple analysis documents (one comprehensive doc or domain-focused splits)
- Level of detail per gap entry (summary-level vs implementation-ready)
- Whether to analyze refs/lib/ TypeScript utilities for implementation patterns
- Order of analysis across the 90+ directories in refs/pf2e/

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANAL-01 | Foundry VTT PF2e repo (`ref/`) analyzed — gap-analysis document describes what exists vs what's needed | Direct inspection of all 90+ `refs/pf2e/` content pack directories; complete schema documentation below |
| ANAL-02 | List of missing mechanics (conditions, actions, statuses) documented with priorities | Per-domain gap tables in sections below, annotated with High/Low combat-tier priority |
</phase_requirements>

---

## Summary

Phase 2 is a documentation/analysis task, not an implementation task. The planner does not need to write engine code. It needs to instruct an agent to read the `refs/pf2e/` JSON data and produce a gap-analysis document (ANAL-01) and a prioritized missing-mechanics list (ANAL-02).

The `refs/` directory is fully present and contains the complete Foundry VTT PF2e system export: 90+ content pack directories, ~28,000+ JSON files, covering conditions, actions, spells, feats, equipment, creatures, hazards, and more. The existing `/engine` covers five domains (conditions, damage/IWR, modifiers, encounter XP, weak/elite HP). It is a small subset of what the PF2e rules system defines.

**Primary recommendation:** The planner should produce one plan with two tasks: (1) produce the gap-analysis document (ANAL-01), and (2) extract the prioritized missing-mechanics list (ANAL-02). Both are pure documentation tasks delivered as Markdown files under `.planning/`. No code changes occur in Phase 2.

---

## Standard Stack

This phase is documentation-only. No new packages are needed. The existing toolchain is sufficient.

| Tool | Version | Purpose | Note |
|------|---------|---------|------|
| Node.js | Already present | Read and process JSON refs data inline during analysis | Used to verify counts above |
| TypeScript 5.6 | Already in `devDependencies` | Type-checking engine code for comparison | No new installation |

**No package installation required for this phase.**

---

## Architecture Patterns

### Output Document Structure (Claude's Discretion — Recommendation: One Doc, Domain Sections)

Based on the scope (D-04), a single `GAP-ANALYSIS.md` organized by domain is the right call. There are ~12 meaningful mechanical domains. Multiple documents would fragment navigation and create cross-reference overhead for downstream planners (Phases 3 and 4). One doc with anchor-linked sections is faster to scan and easier to cite.

**Recommended output file:** `.planning/phases/02-reference-analysis/GAP-ANALYSIS.md`

**Recommended section structure:**
```
# PF2e Engine Gap Analysis

## 1. Conditions & Statuses       [HIGH PRIORITY]
## 2. Damage & IWR                [HIGH PRIORITY]
## 3. Actions (Combat & General)  [HIGH PRIORITY]
## 4. Modifier Math               [HIGH PRIORITY]
## 5. Creatures & Stat Blocks     [HIGH PRIORITY]
## 6. Spells                      [HIGH PRIORITY]
## 7. Equipment & Weapons         [HIGH PRIORITY]
## 8. Hazards                     [HIGH PRIORITY]
## 9. Feats                       [HIGH PRIORITY]
## 10. Classes & Class Features   [HIGH PRIORITY]
## 11. Ancestries & Heritages     [LOWER PRIORITY]
## 12. Downtime Actions           [LOWER PRIORITY]
```

**Recommended entry format per domain:**
```
| Item | In refs/ | In engine | Gap | Priority |
```

### Detail Level (Claude's Discretion — Recommendation: Summary-Level)

Implementation-ready detail (exact TypeScript interfaces, algorithm pseudocode) belongs in Phase 3/4 planning, not the gap analysis. The gap doc should be summary-level: enough to know WHAT is missing and WHY it matters, not HOW to implement it. This keeps ANAL-01 focused and readable.

### refs/lib/ Analysis (Claude's Discretion — Recommendation: JSON data only, lib/ as on-demand reference)

The `refs/lib/` directory contains five TypeScript files for the Foundry VTT extractor tool (not the game engine itself). The game mechanics are fully represented in the JSON data under `refs/pf2e/`. There is no need to analyze `refs/lib/` to understand PF2e mechanics. It may be referenced if Rule Element schema needs clarification, but it should not be a primary analysis target.

---

## What Exists in refs/pf2e/ — Complete Inventory

Verified by direct filesystem inspection.

### Content Pack Counts (refs/pf2e/ — all JSON files, excluding `_folders.json`)

| Pack | Entry Count | Engine-Relevant? |
|------|------------|------------------|
| feats | 5,861 | HIGH — feat Rule Elements drive modifier math |
| equipment | 5,616 | HIGH — weapons, armor, property runes |
| spells | 1,796 | HIGH — spell damage, conditions, REs |
| class-features | 841 | HIGH — class ability mechanics |
| feat-effects | 798 | Medium — runtime effects for feats |
| equipment-effects | 685 | Medium — runtime effects for equipment |
| bestiary-effects | 629 | Medium — runtime creature effects |
| actions | 545 | HIGH — all action types |
| spell-effects | 518 | Medium — runtime spell effects |
| pathfinder-monster-core | 492 | HIGH — primary creature data |
| backgrounds | 490 | Lower — non-combat |
| deities | 478 | Lower — non-combat |
| bestiary-family-ability-glossary | 456 | HIGH — reusable creature abilities |
| pathfinder-monster-core-2 | 446 | HIGH — extended creatures |
| lost-omens-bestiary | 371 | HIGH — creatures |
| heritages | 321 | High — heritage feats |
| pathfinder-npc-core | 271 | HIGH — NPC stat blocks |
| kingmaker-bestiary | 262 | HIGH — creatures |
| (35 adventure bestiaries) | ~2,200 | HIGH — creature data |
| conditions | 43 | HIGH — already 43/44 in engine |
| hazards | 53 | HIGH — encounter-level mechanics |
| classes | 27 | HIGH — class definitions |
| ancestries | 50 | Lower — character creation |
| vehicles | 91 | Lower — non-core combat |
| bestiary-ability-glossary-srd | 55 | HIGH — standard creature abilities |
| rollable-tables | 69 | Lower |

**Total JSON entries: ~28,000+**

---

## Domain-Level Gap Analysis

### Domain 1: Conditions & Statuses

**What refs/ has:**
- 43 condition JSON files in `refs/pf2e/conditions/` (one per condition)
- Schema: `{ _id, name, system: { description, duration, group, overrides, references, rules, traits, value } }`
- `group` field: senses, abilities, death, detection, attitudes (5 groups)
- `overrides` field: list of condition slugs this condition replaces when applied
- `value.isValued` boolean to distinguish valued (clumsy 1, dying 2) vs boolean conditions
- Rule Elements on conditions: FlatModifier (15 uses), GrantItem (12), ItemAlteration (11), ActiveEffectLike (3), RollOption (2), Note (2), Immunity (2), AdjustDegreeOfSuccess (1), LoseHitPoints (1)

**What engine currently has:**
- `CONDITION_SLUGS`: 44 slugs (includes `malevolence` which is NOT in refs/ — project-specific addition from Malevolence adventure)
- `VALUED_CONDITIONS`: 11 valued conditions (clumsy, doomed, drained, dying, enfeebled, frightened, sickened, slowed, stunned, stupefied, wounded)
- `CONDITION_GROUPS`: only 2 groups (detection, attitudes) — missing senses, abilities, death
- `ConditionManager`: add, remove, has, get, endTurn, setDuration, setProtected, getAll
- Dying+wounded cascade: implemented (dying adds wounded value; losing dying grants wounded 1)
- Group exclusivity: implemented for detection and attitudes

**Gaps:**
| Gap | Description | Priority |
|-----|-------------|----------|
| Missing groups | Engine has 2 groups (detection, attitudes); refs has 5 (+ senses, abilities, death) | HIGH |
| Missing overrides | Engine has no `overrides` mechanic. refs defines: Blinded overrides Dazzled; Restrained overrides Grabbed; Stunned overrides Slowed; each attitude overrides all others | HIGH |
| Missing `malevolence` in refs | `malevolence` exists in engine but not in refs/pf2e/conditions/ (it's adventure-specific content, not a base condition) | LOW — document as intentional |
| Rule Elements on conditions | Engine doesn't model the mechanical effects of conditions (FlatModifier on Perception for Blinded, etc.) — these are not encoded anywhere | HIGH |
| Condition max values | No doomed-4-kills-you, no dying-4-kills-you maximum tracking | HIGH |
| Death group logic | Unconscious is in refs' `death` group alongside dying/wounded/doomed — engine doesn't model this group | HIGH |
| GrantItem chains | Dying grants Unconscious (via GrantItem rule); Grabbed grants Off-Guard + prevents-actions (via GrantItem); Paralyzed grants Off-Guard. Engine doesn't track these implicit grants | HIGH |

**Confirmed equal (no gap):** All 43 refs condition slugs are present in engine. Dying/wounded cascade logic is correctly implemented.

---

### Domain 2: Damage & IWR

**What refs/ has:**
- Creature stat blocks include `system.attributes.immunities`, `.weaknesses`, `.resistances` arrays
- Schema: `{ type: string, value?: number, exceptions: string[], doubleVs?: string[] }`
- IWR types actually used across all bestiaries — see tables below

**Immunity types in refs (across all bestiaries):**
`acid, auditory, bleed, blinded, bludgeoning, clumsy, cold, confused, controlled, critical-hits, curse, dazzled, deafened, death-effects, disease, doomed, drained, electricity, emotion, enfeebled, fascinated, fatigued, fear-effects, fire, fortune-effects, grabbed, healing, illusion, immobilized, inhaled, light, magic, mental, misfortune-effects, nonlethal-attacks, object-immunities, off-guard, olfactory, paralyzed, persistent-damage, petrified, piercing, poison, polymorph, possession, precision, prone, radiation, restrained, scrying, sickened, slashing, sleep, slowed, sonic, spell-deflection, spirit, stunned, stupefied, swarm-attacks, swarm-mind, unconscious, visual, vitality, void`

**Weakness types in refs:** `acid, air, alchemical, area-damage, axe-vulnerability, bleed, bludgeoning, cold, cold-iron, critical-hits, earth, electricity, emotion, fire, force, holy, mental, orichalcum, peachwood, piercing, salt, salt-water, silver, slashing, sonic, spirit, splash-damage, unholy, vitality, void, vorpal, vulnerable-to-sunlight, water`

**Resistance types in refs:** `acid, air, all-damage, bludgeoning, cold, critical-hits, earth, electricity, fire, force, mental, metal, mythic, physical, piercing, plant, poison, precision, protean-anatomy, silver, slashing, sonic, spells, spirit, unholy, void, water, wood`

**What engine currently has:**
- `IMMUNITY_TYPES`: damage types + damage categories + `critical-hits` + `precision`
- `WEAKNESS_TYPES`: damage types + damage categories
- `RESISTANCE_TYPES`: damage types + damage categories
- `applyIWR`: correct processing order (immunity → weakness → resistance), highest-value selection
- `MATERIAL_EFFECTS`: adamantine, cold-iron, mithral, orichalcum, silver, sisterstone-dusk, sisterstone-scarlet

**Gaps:**
| Gap | Description | Priority |
|-----|-------------|----------|
| Immunity types not in engine | Condition-as-immunity (blinded, confused, doomed, etc.), special tags (curse, death-effects, disease, emotion, fear-effects, polymorph, possession, sleep, visual, auditory, olfactory, light, healing, illusion, magic, fortune-effects, misfortune-effects, swarm-mind, swarm-attacks, nonlethal-attacks, radiation, spell-deflection, scrying, object-immunities, inhaled, persistent-damage) | HIGH |
| Weakness types not in engine | alchemical, area-damage, cold-iron, earth, holy, silver, splash-damage, unholy, water, peachwood, salt, salt-water, vorpal, axe-vulnerability, vulnerable-to-sunlight, orichalcum, air | HIGH |
| Resistance types not in engine | air, all-damage, earth, metal, precision, protean-anatomy, spells, water, wood, plant, mythic, silver, unholy, critical-hits | HIGH |
| holy/unholy as damage type | Engine has vitality/void (remaster) but refs weakness/resistance data uses `holy` and `unholy` — needs investigation for post-remaster state | MEDIUM |
| `all-damage` resistance | Special type meaning "resists everything" — requires separate handling in applyIWR | HIGH |
| Material effects coverage | Engine has cold-iron, silver, orichalcum, adamantine, mithral. Refs uses peachwood, salt, salt-water, vorpal in some weaknesses — edge cases | LOWER |

**Confirmed working:** `applyIWR` algorithm, material bypass, doubleVs (critical), precision immunity, critical-hits immunity.

---

### Domain 3: Actions

**What refs/ has:**
- `refs/pf2e/actions/` — 545 entries organized into 17 category subdirectories
- Action subdirectories and counts:

| Category | Count | Priority |
|----------|-------|----------|
| basic | 30 | HIGH — Strike, Escape, Aid, Delay, Ready, Raise a Shield, etc. |
| skill | 54 | HIGH — Demoralize, Balance, Climb, Grapple, Trip, etc. |
| ancestry | 30 | HIGH — ancestry-specific combat actions |
| archetype | 76 | HIGH — archetype combat actions |
| class | 23 | HIGH — class-specific combat actions |
| exploration | 13 | MEDIUM — Avoid Notice, Scout, Search, etc. |
| equipment | 7 | HIGH — item-activated actions |
| spells (actions) | 11 | HIGH — Cast a Spell, Sustain, etc. |
| stamina | 4 | MEDIUM — stamina variant rules |
| aftermath | 5 | LOWER |
| background | 26 | LOWER |
| campaign | 7 | LOWER |
| downtime | 4 | LOW — Earn Income, Craft, Retraining, Long-Term Rest |
| familiar | 1 | MEDIUM |
| heritage | 5 | MEDIUM |
| mythic | 1 | LOWER |
| subsystems | 6 | LOWER — Duels, Hexploration, Infiltration, etc. |
| vehicles | 5 | LOWER |
| action-macros | 71 | Reference only (automation macros, not engine data) |

- Action schema: `{ type: "action", system: { actionType: {value: "action"|"reaction"|"free"|"passive"}, actions: {value: 1|2|3|null}, category, description, traits, rules, publication } }`
- `rules` array is typically empty for basic actions (pure text descriptions); Rule Elements appear in class/archetype actions

**What engine currently has:**
- **Nothing.** The engine has zero action definitions. Actions were part of the old UI's combat tracker, not extracted to engine modules.
- `encounter/xp.ts` tracks creature levels for XP, not action definitions
- The Demoralize effect (Frightened condition) is tracked by ConditionManager but the action itself is not modeled

**Gaps (engine has nothing for this domain):**

| Category | Missing | Priority |
|----------|---------|----------|
| Basic actions (30) | Strike, Escape, Aid, Delay, Ready, Raise a Shield, Stride, Step, Crawl, Interact, Drop Prone, Stand, Leap, Seek, Point Out, Sustain, Release, Dismiss, Invest, Mount, Fly, Burrow, Cast a Spell, Grab an Edge, Arrest a Fall, Avert Gaze, Take Cover | HIGH |
| Skill actions — combat (subset of 54) | Demoralize, Feint, Grapple, Shove, Trip, Disarm, Tumble Through, Steal, Dirty Trick | HIGH |
| Skill actions — exploration/social | Balance, Climb, Swim, High Jump, Long Jump, Aid, Bon Mot, Coerce, Sense Motive, Recall Knowledge | MEDIUM |
| Skill actions — downtime | Earn Income, Craft, Create Forgery, Research | LOW |
| Class actions (23) | Class-specific combat abilities | HIGH |
| Archetype actions (76) | Archetype-specific actions | HIGH |
| Exploration actions (13) | Avoid Notice, Scout, Search, Detect Magic, etc. | MEDIUM |

**Key schema insight:** Actions in refs/ are content data (description, traits, action cost). The mechanical effects are encoded as Rule Elements on feats/class-features that grant bonuses to those actions, not on the action entries themselves. An "actions engine" would model action execution outcomes (degree of success handling, condition application), not just store the text.

---

### Domain 4: Modifier Math

**What refs/ has:**
- Creature stat blocks: `system.abilities` (six ability scores as `{mod, value}`), `system.saves` (Fort/Ref/Will as `{value, saveDetail}`), `system.perception`, `system.skills`, `system.initiative`
- Modifier types in condition Rule Elements: `status`, `circumstance` (both present in engine)
- Condition FlatModifier examples: Blinded → status -4 to Perception; Clumsy X → status -X to Dex-based AC/saves; Enfeebled X → status -X to Str-based attacks/damage; Frightened X → status -X to all checks and DCs; Sickened X → status -X to all checks and DCs; Off-Guard → circumstance -2 to AC; Prone (melee) → circumstance -2 to attack rolls

**What engine currently has:**
- `Modifier` class: slug, label, modifier, type, enabled
- `MODIFIER_TYPES`: ability, circumstance, item, potency, proficiency, status, untyped
- `applyStackingRules`: typed highest-bonus/lowest-penalty, untyped additive — correct per PF2e rules
- `StatisticModifier`: computes `totalModifier` from a list of Modifier instances
- `DamageDicePF2e`: models additional damage dice (for weapon runes, class features)

**Gaps:**
| Gap | Description | Priority |
|-----|-------------|----------|
| No Statistic definitions | Engine has no model of what statistics exist (AC, saves, skills, perception, attack rolls, spell DCs). Modifier math works in isolation but there's nothing to modify. | HIGH |
| No automatic condition modifiers | When a condition is applied, its FlatModifier rules should automatically contribute modifiers to the relevant statistics. Engine has no link between ConditionManager and Modifier. | HIGH |
| No proficiency system | Proficiency ranks (untrained/trained/expert/master/legendary) plus proficiency bonus calculation are absent. PROFICIENCY modifier type exists but nothing feeds it. | HIGH |
| No ability modifier calculation | Ability scores present in creature stat blocks but engine has no function to convert score→modifier or to use ability modifiers as typed bonuses | HIGH |
| No MAP (Multiple Attack Penalty) | Not in engine. MAP is: -5 agile, -10 non-agile; applies as an untyped penalty after each attack in a turn | HIGH |
| No degree-of-success system | Critical success / success / failure / critical failure (with ±10 rule) is not modeled | HIGH |
| Enhancement/deflection types | Some sources reference enhancement and deflection bonus types (used in older OGL content). Not in engine MODIFIER_TYPES. | LOWER |

---

### Domain 5: Creatures & Stat Blocks

**What refs/ has:**
- 492 entries in `pathfinder-monster-core/`, 446 in `pathfinder-monster-core-2/`, 271 in `pathfinder-npc-core/`, ~2,200 across adventure bestiaries
- Creature schema (top-level `system` fields): `abilities, attributes, details, initiative, perception, resources, saves, skills, traits`
- `system.attributes`: `ac {value, details}`, `allSaves {value}`, `hp {max, value, temp}`, `speed {value, otherSpeeds}`, `immunities[]`, `weaknesses[]`, `resistances[]`
- `system.saves`: `fortitude {value, saveDetail}`, `reflex {value, saveDetail}`, `will {value, saveDetail}`
- `system.abilities`: six ability scores `{mod, value}` for each
- `system.traits`: `rarity`, `size`, `value` (creature type traits like humanoid, undead, construct)
- `items[]`: embedded actions, melee attacks, and equipment with full sub-schemas
- `items[].type`: weapon, melee, action, spell, spellcastingEntry, lore, etc.

**What engine currently has:**
- `WeakEliteTier` type (normal/weak/elite)
- `getHpAdjustment()` for weak/elite HP delta
- `parseIwrData()` for extracting IWR from raw Foundry JSON
- No Creature type definition in engine (the old UI had a Creature interface in Pinia stores)

**Gaps:**
| Gap | Description | Priority |
|-----|-------------|----------|
| No Creature type in engine | `engine/types.ts` only has `WeakEliteTier`. No formal Creature interface with HP, AC, saves, abilities, IWR, speed, etc. | HIGH |
| No creature stat calculation | Given a creature's raw attributes, engine can't compute effective AC (flat-footed, flanked), saves, or attack modifiers | HIGH |
| No creature abilities model | Reactive Strike, Grab, Constrict, Frightful Presence, etc. — 55 entries in bestiary-ability-glossary-srd — are not modeled | HIGH |
| No HP tracking in engine | HP tracking was in Vue store before; engine has `getHpAdjustment()` but no HP state model | MEDIUM |

---

### Domain 6: Spells

**What refs/ has:**
- `refs/pf2e/spells/` — 1,796 spell entries in subdirectories:
  - `spells/spells/` — organized by rank (cantrip, rank-1 through rank-10); 507+ spells
  - `spells/focus/` — 150 focus spells
  - `spells/rituals/` — 11 rituals (+ subdirs)
- Spell schema: `{ system: { area, cost, counteraction, damage, defense, description, duration, level, range, requirements, rules, target, time, traits: {rarity, traditions, value} } }`
- `traits.traditions`: arcane, divine, occult, primal
- `time.value`: "1", "2", "3" (action cost), "reaction", "free", "1 minute", etc.
- `damage`: object mapping damage type and dice (often empty for condition-applying spells)
- `defense`: null or a save check definition

**What engine currently has:**
- **Nothing.** No spell types, no spell schema, no tradition system, no spell slot tracking.

**Gaps:**
| Gap | Description | Priority |
|-----|-------------|----------|
| Entire spell system | 1,796 spells with no engine representation | HIGH |
| Spell damage model | Spells deal typed damage, often with heightened scaling | HIGH |
| Spell save/defense system | Spells often require saves — links to degree-of-success system | HIGH |
| Focus spell subsystem | 150 focus spells with refocus mechanic | HIGH |
| Spell traditions | arcane, divine, occult, primal — affects which classes can use which spells | HIGH |
| Ritual system | 11 rituals with special multi-check resolution | LOWER |
| Counteract system | counterspell/counteract checks use a separate opposed-check mechanic | MEDIUM |

---

### Domain 7: Equipment & Weapons

**What refs/ has:**
- `refs/pf2e/equipment/` — 5,616 entries of multiple item types: ammo, armor, backpack, consumable, equipment, kit, shield, treasure, weapon
- Weapon schema (from creature items): `{ system: { baseItem, damage: {damageType, dice, die}, group, runes: {potency, striking, property[]}, traits } }`
- Armor/shield schema: `{ system: { category, group, acBonus, strength, dexCap, checkPenalty, speedPenalty, runes } }`
- `runes.striking`: 0 (no rune), 1 (striking = +1 damage die), 2 (greater striking = +2), 3 (major striking = +3)
- `runes.potency`: 0–4 (attack bonus from potency rune)
- `runes.property`: property rune slugs (e.g. flaming, corrosive, etc.)

**What engine currently has:**
- `DamageFormula` and `BaseDamage` types (from damage.ts) — represent resolved damage but not weapon stats
- `DamageDicePF2e` (from modifiers.ts) — models additional damage dice
- `MATERIAL_EFFECTS` — weapon material bypass for IWR
- No weapon schema, no rune system, no armor/shield schema

**Gaps:**
| Gap | Description | Priority |
|-----|-------------|----------|
| No Weapon type | No interface for weapons (damage die, damage type, traits, runes) | HIGH |
| No rune system | Potency (attack bonus) and striking (damage dice) runes are fundamental to PF2e weapon progression | HIGH |
| No armor type | No interface for armor (AC bonus, Dex cap, check penalty, rune slots) | HIGH |
| Equipment traits | Finesse, agile, deadly, fatal, reach, versatile, etc. — affect attack calculations | HIGH |
| No equipment effect application | 685 equipment-effects entries — runtime effects from using/investing equipment | MEDIUM |

---

### Domain 8: Hazards

**What refs/ has:**
- `refs/pf2e/hazards/` — 53 hazard entries
- Hazard schema: `{ system: { attributes: {ac, hardness, hasHealth, hp, stealth}, details: {description, disable, isComplex, level, reset, routine}, saves } }`
- Each hazard embeds actions (reactions, free actions) as items
- Simple hazards: trigger + effect, no initiative. Complex hazards: have initiative and routine actions.
- `isComplex` boolean distinguishes types

**What engine currently has:**
- `calculateCreatureXP()` and `getHazardXp()` in encounter/xp.ts — correctly handle simple vs complex hazard XP
- `HazardType` = 'simple' | 'complex'
- No hazard stat block type, no hazard disable/routine modeling

**Gaps:**
| Gap | Description | Priority |
|-----|-------------|----------|
| No hazard stat type | Engine can calculate hazard XP but has no Hazard interface for stat blocks | MEDIUM |
| Hazard disable mechanics | Skill checks to disable (Thievery DC, etc.) not modeled | MEDIUM |
| Complex hazard initiative | Complex hazards join combat with their own initiative and routine actions | HIGH |
| Hazard reset | Reset conditions (time-based, condition-based) not modeled | LOWER |

---

### Domain 9: Feats

**What refs/ has:**
- 5,861 feat entries organized: feats/ancestry/ (52), feats/archetype/ (243), feats/class/ (28), feats/general/ (5 levels), feats/skill/ (10 levels), feats/mythic/ (varies)
- Feat schema: `{ system: { actionType, actions, category, description, level, prerequisites, publication, rules, traits } }`
- `rules[]` contains Rule Elements that implement the feat's mechanical effect
- Rule Elements used in feats include: FlatModifier, GrantItem, RollOption, BattleForm, ChoiceSet, CraftingEntry, FastHealing, etc. — very broad set
- `prerequisites.value` — list of prerequisite strings (e.g., "Trained in Athletics")

**What engine currently has:**
- **Nothing.** No feat type, no feat registry, no feat Rule Element processing.

**Gaps:**
| Gap | Description | Priority |
|-----|-------------|----------|
| Entire feat system | 5,861 feats with no engine representation | HIGH |
| Feat Rule Elements | The mechanical effects of feats (FlatModifier, GrantItem, etc.) are not processed anywhere | HIGH |
| Prerequisite system | Feat prerequisites are not validated | LOWER (DM tool may skip this) |

---

### Domain 10: Classes & Class Features

**What refs/ has:**
- `refs/pf2e/classes/` — 27 class definitions
- Class schema: `{ system: { ancestryFeatLevels, classFeatLevels, classFeatures[], description, hp, keyAbility, perception, publication, rules, saves, skills, spellcasting, trainedSkills, traits } }`
- `refs/pf2e/class-features/` — 841 class feature entries (individual abilities like Rage, Sneak Attack, etc.)
- Class feature schema same as feats schema — each feature has a `rules[]` array of Rule Elements

**What engine currently has:**
- **Nothing.** No class type, no class feature registry.

**Gaps:**
| Gap | Description | Priority |
|-----|-------------|----------|
| No class schema | 27 class definitions with no engine representation | HIGH |
| No class feature system | 841 class features (Sneak Attack, Rage, etc.) have no engine representation | HIGH |
| Key ability and proficiency progression | Classes define which ability score is key and their proficiency progression — not modeled | HIGH |

---

### Domain 11: Ancestries & Heritages (LOWER PRIORITY)

**What refs/ has:**
- `refs/pf2e/ancestries/` — 50 ancestries; `refs/pf2e/heritages/` — 321 heritages; `refs/pf2e/ancestry-features/` — 55 ancestry features
- Schema similar to class features — embed Rule Elements

**What engine currently has:** Nothing.

**Gaps:** Entire ancestry/heritage system absent from engine. Lower priority (character creation, not combat mechanics).

---

### Domain 12: Downtime Actions (LOWER PRIORITY per D-06)

**What refs/ has:**
- `refs/pf2e/actions/downtime/` — 4 actions: Earn Income, Long-Term Rest, Learn Name, Grow
- Crafting subsystem: referenced in skill actions (Craft action, Deconstruct)
- Retraining, Earn Income, Crafting are the main downtime mechanics

**What engine currently has:** Nothing.

**Gaps:** Entire downtime system absent from engine. Explicitly lower priority per D-06.

---

## Condition Override & Group — Detailed Gap (Critical for Phase 3)

The engine's `CONDITION_GROUPS` only captures mutual exclusion (setting one removes others). The refs data reveals two distinct mechanics that the engine conflates:

**Groups (mutual exclusion — one can be active at a time):**
- `senses`: blinded, concealed, dazzled, deafened, invisible (note: these aren't all mutually exclusive — this needs investigation; blinded and dazzled overlap but blinded overrides dazzled)
- `abilities`: clumsy, cursebound, drained, enfeebled, stupefied (valued conditions on ability-based penalties — they CAN stack, being different ability modifiers)
- `death`: doomed, dying, unconscious, wounded (death progression conditions)
- `detection`: observed, hidden, undetected, unnoticed (mutually exclusive)
- `attitudes`: hostile, unfriendly, indifferent, friendly, helpful (mutually exclusive)

**Overrides (A replaces B when A is applied):**
- Blinded overrides Dazzled (blinded supercedes — Dazzled removed when Blinded gained)
- Restrained overrides Grabbed (restrained supercedes grabbed)
- Stunned overrides Slowed (stunned's lost-actions effect supercedes slowed's)
- Attitude conditions each override all other attitudes (same as mutual exclusion)

The engine uses `CONDITION_GROUPS` for mutual exclusion, which correctly handles attitudes and detection. But it does not model overrides for cases like Blinded/Dazzled or Stunned/Slowed. Phase 3 must decide whether to add `overrides` to ConditionManager or handle via groups.

---

## IWR Type Coverage — Complete Gap Table

Types present in refs' creature data that are absent from engine's typed constants:

**Immunity types to add (HIGH priority — appear on real creatures):**
Condition immunities: blinded, clumsy, confused, controlled, dazzled, deafened, doomed, drained, enfeebled, fascinated, fatigued, grabbed, immobilized, off-guard, paralyzed, persistent-damage, petrified, prone, restrained, sickened, slowed, stunned, stupefied, unconscious
Effect immunities: auditory, curse, death-effects, disease, emotion, fear-effects, fortune-effects, healing, illusion, inhaled, light, magic, mental (already in engine as damage type, but also used as immunity type for spell effects), misfortune-effects, nonlethal-attacks, object-immunities, olfactory, polymorph, possession, radiation, scrying, sleep, spell-deflection, swarm-attacks, swarm-mind, visual

**Weakness types to add:**
alchemical, area-damage, axe-vulnerability, cold-iron, earth, holy, orichalcum (already a material), peachwood, salt, salt-water, silver (already a material), splash-damage, unholy, vorpal, vulnerable-to-sunlight, water, air

**Resistance types to add:**
air, all-damage, critical-hits, earth, metal, mythic, plant, precision, protean-anatomy, silver, spells, unholy, water, wood

---

## refs/lib/ Assessment

`refs/lib/` contains 5 TypeScript files for the Foundry extractor build tool:
- `compendium-pack.ts` — pack management
- `extractor.ts` — JSON extraction from Foundry LevelDB
- `foundry-utils.ts` — Foundry utility functions
- `helpers.ts` — path resolution helpers
- `level-database.ts` — LevelDB reader
- `types.ts` — minimal type re-exports (only `PackEntry` and `PackManifest`)

**Conclusion:** `refs/lib/` has no PF2e game-mechanics content. It is purely build tooling. The gap analysis does not need to examine it further.

---

## Common Pitfalls

### Pitfall 1: Assuming refs/ groups = mutual exclusion
**What goes wrong:** The `group` field in condition JSON is used by Foundry for various purposes (UI grouping, some exclusion). Not all members of a group are mutually exclusive. For example, the `abilities` group (clumsy, drained, enfeebled, stupefied) are all different conditions that can coexist simultaneously.
**How to avoid:** Use the `overrides` field (not `group`) to determine mutual replacement. Use `group` only as a metadata label.

### Pitfall 2: Confusing condition immunity with damage immunity
**What goes wrong:** IWR immunity types include both damage types (fire, cold) AND condition names (blinded, paralyzed) AND special effect categories (fear-effects, disease). The engine's current `IMMUNITY_TYPES` only covers damage. A creature immune to "paralyzed" should not receive that condition — this is a different check path from damage IWR.
**How to avoid:** Distinguish between damage immunity processing (applyIWR) and condition immunity processing (block ConditionManager.add for immune conditions).

### Pitfall 3: Missing holy/unholy in remaster context
**What goes wrong:** The PF2e Remaster (Player Core 2024) renamed positive/negative energy to vitality/void. It also introduced holy/unholy as alignment damage types replacing aligned damage. Refs data contains both `holy`/`unholy` in weakness types — these are Remaster types, NOT legacy types.
**How to avoid:** Add holy and unholy to the damage type taxonomy as genuine Remaster types alongside vitality/void. Do not treat them as OGL legacy names.

### Pitfall 4: `malevolence` condition — project-specific, not in refs
**What goes wrong:** The engine has a `malevolence` condition slug but `refs/pf2e/conditions/` has no `malevolence.json`. This is from the Malevolence adventure module, not a base PF2e condition.
**How to avoid:** Document in gap analysis as intentional (engine includes adventure-specific content). Don't flag it as a data error.

### Pitfall 5: Action entries don't contain mechanical logic
**What goes wrong:** Reading `refs/pf2e/actions/basic/strike.json` and expecting to find attack roll calculations, MAP application, or crit doubling logic. The rules are in the game's TypeScript source code (not in refs/), and the mechanical effects of feat/class-feature actions are in their `rules[]` Rule Element arrays.
**How to avoid:** The gap analysis documents that actions need to be modeled mechanically in the engine — but the modeling is informed by PF2e CRB rules text, not by reading action JSON (which contains description text, not algorithms).

---

## Analysis Execution Strategy

The plan agent executing Phase 2 will need to produce GAP-ANALYSIS.md by:

1. Reading all 43 condition JSON files from `refs/pf2e/conditions/` and comparing against `engine/conditions/conditions.ts`
2. Scanning `refs/pf2e/actions/` subdirectories (basic, skill, class — high priority first) and documenting their action types, categories, and traits
3. Reading a representative sample of creature stat blocks from `refs/pf2e/pathfinder-monster-core/` (10–20 creatures) to document the full Creature schema
4. Sampling spells from `refs/pf2e/spells/spells/` by rank to document the spell schema
5. Reading a sample of feat entries with non-empty `rules[]` to document Rule Element types used
6. Comparing all findings against the current engine's public API in `engine/index.ts`

The analysis does NOT require reading all 28,000+ files. Representative sampling per domain is sufficient, with the content counts documented from filesystem enumeration.

---

## Validation Architecture

nyquist_validation is enabled per `.planning/config.json`. However:

**This phase produces zero code changes.** The output is documentation files (GAP-ANALYSIS.md). There is no TypeScript to test, no functions to call, no regressions to prevent.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — tests intentionally removed (package.json has no test script; vitest removed) |
| Config file | None |
| Quick run command | `npm run typecheck` (only available validation) |
| Full suite command | `npm run typecheck` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANAL-01 | GAP-ANALYSIS.md file exists with all domain sections | smoke | `test -f .planning/phases/02-reference-analysis/GAP-ANALYSIS.md && echo OK` | ❌ Wave 0 |
| ANAL-02 | GAP-ANALYSIS.md contains prioritized mechanics list | smoke | `grep -c "HIGH\|LOWER" .planning/phases/02-reference-analysis/GAP-ANALYSIS.md` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `test -f .planning/phases/02-reference-analysis/GAP-ANALYSIS.md`
- **Per wave merge:** `npm run typecheck` (verifies engine code wasn't broken by any edits)
- **Phase gate:** GAP-ANALYSIS.md present and covers all 12 domains before `/gsd:verify-work`

### Wave 0 Gaps
None — no test infrastructure needed. File-existence checks above are sufficient smoke tests and require no setup.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|---------|
| Node.js | Reading refs/ JSON data | ✓ | Present (used in research) | — |
| refs/pf2e/ directory | ANAL-01, ANAL-02 | ✓ | All 90+ packs present | — |
| TypeScript | typecheck during phase gate | ✓ | ^5.6.3 | — |

No missing dependencies. The `refs/` directory is confirmed present and populated (the BLOCKED condition from STATE.md is resolved — user has added the refs).

---

## State of the Art

| Domain | Current Engine State | Refs Coverage | Gap Severity |
|--------|---------------------|---------------|--------------|
| Conditions | 44 slugs, 5 gaps in groups/overrides | 43 JSON files, 5 groups | Medium |
| Damage types | 16 types, 3 categories | Same | None |
| IWR processing | Correct algorithm | ~65 types not in type constants | High |
| Modifier stacking | Correct rules | Full modifier type set present | Low |
| Encounter XP | Complete for creatures/hazards | Same tables | None |
| Weak/Elite HP | Complete | Same tables | None |
| Actions | None | 545 entries | Critical |
| Spells | None | 1,796 entries | Critical |
| Feats | None | 5,861 entries | Critical |
| Equipment | None | 5,616 entries | Critical |
| Classes | None | 27 + 841 features | Critical |
| Creatures (schema) | Minimal (WeakEliteTier only) | 3,000+ stat blocks | Critical |
| Hazards (schema) | XP only | 53 stat blocks | High |

---

## Open Questions

1. **holy/unholy vs vitality/void in Remaster**
   - What we know: Refs weakness/resistance data uses `holy` and `unholy`. Engine uses `vitality`/`void` (Remaster names confirmed in engine comment).
   - What's unclear: Whether holy/unholy are POST-remaster damage types that co-exist with vitality/void (different concepts), or whether they are legacy OGL names that appear in non-remastered content only.
   - Recommendation: Phase 3 should check the PF2e Remaster Player Core 2 for definitive answer. For gap analysis, document both as needing engine support.

2. **malevolence condition source**
   - What we know: `malevolence` is in engine CONDITION_SLUGS (slug 27 of 44) but NOT in `refs/pf2e/conditions/`.
   - What's unclear: Whether it comes from the Malevolence adventure module pack (which is in `refs/pf2e/malevolence-bestiary/`) — the 20-entry malevolence-bestiary pack may embed it as a local condition.
   - Recommendation: Gap analysis should document that `malevolence` is an adventure-specific condition, not a core PF2e condition.

3. **abilities group conditions — do they coexist or are they mutually exclusive?**
   - What we know: Refs groups clumsy, drained, enfeebled, stupefied under `abilities`. Engine CONDITION_GROUPS uses groups for mutual exclusion only.
   - What's unclear: Whether `abilities` group in refs is informational metadata or enforces mutual exclusion.
   - Recommendation: These are clearly meant to coexist (clumsy affects Dexterity checks, enfeebled affects Strength — different ability scores). The gap analysis should note that the `abilities` group does NOT imply mutual exclusion.

---

## Sources

### PRIMARY (HIGH confidence — direct file inspection)
- `D:/pathbuddy/refs/pf2e/conditions/*.json` — all 43 condition files read
- `D:/pathbuddy/refs/pf2e/actions/` — directory structure and representative samples read
- `D:/pathbuddy/refs/pf2e/pathfinder-monster-core/*.json` — creature schema inspected
- `D:/pathbuddy/refs/pf2e/spells/` — schema inspected
- `D:/pathbuddy/engine/**/*.ts` — all 8 engine source files read
- `D:/pathbuddy/package.json`, `D:/pathbuddy/tsconfig.json` — project config read
- Node.js enumeration scripts — filesystem counts verified directly

### SECONDARY (MEDIUM confidence)
- PF2e Archives of Nethys (aonprd.com) — cited in engine source comments for rule validation
- Engine source comments citing "Foundry VTT PF2e src/module/item/condition/values.ts" and "AON Conditions.aspx" — verified against refs data

---

## Metadata

**Confidence breakdown:**
- refs/ inventory: HIGH — all counts derived from direct filesystem inspection
- Schema documentation: HIGH — derived from reading actual JSON files
- Engine gap analysis: HIGH — derived from reading all engine TypeScript files
- IWR type gaps: HIGH — derived from Node.js scan of all bestiary data
- Priority assignments: HIGH — directly follows D-06 (combat = HIGH, downtime = LOWER)

**Research date:** 2026-03-31
**Valid until:** Stable indefinitely — refs/ and engine/ are static until Phase 3 implementation begins
