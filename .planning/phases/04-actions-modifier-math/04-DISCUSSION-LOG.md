# Phase 4: Actions & Modifier Math - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 04-actions-modifier-math
**Areas discussed:** Action scope & depth, Statistic system, Creature interface expansion, Degree-of-success

---

## Action scope & depth

### Q1: What level of action implementation?

| Option | Description | Selected |
|--------|-------------|----------|
| Data catalog only (Recommended) | Action interface + entries for basic (30) and combat skill (~10). No execution logic. | |
| Data + outcome descriptors | Data catalog plus declarative outcome maps per degree-of-success. Engine can look up what an action does but doesn't execute rolls. | * |
| Full execution engine | Actions can be executed with roll resolution, condition application, MAP. | |

**User's choice:** Data + outcome descriptors
**Notes:** None

### Q2: Which action categories to include?

| Option | Description | Selected |
|--------|-------------|----------|
| Basic + combat skill (Recommended) | 30 basic + ~10 combat skill = ~40. DM-relevant combat actions. | |
| Basic + skill + class + archetype | All combat-relevant: ~183. | |
| All 545 entries | Every action in Foundry data. | * |

**User's choice:** All 545 entries
**Notes:** User wants complete data catalog

### Q3: Outcome descriptors scope?

| Option | Description | Selected |
|--------|-------------|----------|
| Combat-relevant only (Recommended) | Outcome maps for basic + combat skill (~40). Rest are data-only. | * |
| All actions with outcomes where Foundry defines them | Parse outcome data from every action's rules[]. | |

**User's choice:** Combat-relevant only
**Notes:** None

### Q4: Multiple Attack Penalty?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, as turn state (Recommended) | Track attack count per creature per turn. | |
| Data only | Document MAP rules but don't track state. | |
| Other (user provided) | MAP hardcoded per-attack with modifier influence. | * |

**User's choice:** Custom — MAP hardcoded per-attack with 3 StatisticModifier sets per attack. Each attack position (1st/2nd/3rd) has its own modifier total: base attack bonus + all modifiers + MAP penalty for that position.
**Notes:** User specified: "имея атаку мы будем иметь на каждую атаку свои 3 модификатора которы под капотом будут иметь формулу базовые цифры чистой атаки + штрафы + бонусы + состояние MAP для этой конкретной атаки (1/2/3)"

---

## Statistic system

### Q1: How should the statistic system work?

| Option | Description | Selected |
|--------|-------------|----------|
| Base value + modifier overlay (Recommended) | Base from Foundry JSON + active modifiers. Effective = base + totalModifier. | * |
| Full component breakdown | Decomposed into ability mod + proficiency + item + status + circumstance. | |
| You decide | Claude picks. | |

**User's choice:** Base value + modifier overlay
**Notes:** None

### Q2: Which statistics to model?

| Option | Description | Selected |
|--------|-------------|----------|
| Combat core (Recommended) | AC, saves, perception, attack, skills. | |
| Combat + spellcasting | Plus spell DC and spell attack. | |
| Everything from Foundry schema | AC, saves, perception, skills, speed, initiative. Full stat block. | * |

**User's choice:** Everything from Foundry schema
**Notes:** None

### Q3: Condition-to-statistic wiring?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-inject on condition change (Recommended) | Condition add/remove auto-pushes/pulls modifiers to statistics. | * |
| Query-time resolution | Statistics pull modifiers fresh on each query. | |
| You decide | Claude picks. | |

**User's choice:** Auto-inject on condition change
**Notes:** None

---

## Creature interface expansion

### Q1: How much of the creature stat block?

| Option | Description | Selected |
|--------|-------------|----------|
| Full NPC stat block (Recommended) | Everything in Foundry JSON: abilities, AC, saves, perception, skills, speed, senses, traits, size, rarity, languages, initiative. | * |
| Combat stats only | AC, saves, perception, abilities, speed. | |
| Combat + attacks | Combat stats plus embedded attack entries. | |

**User's choice:** Full NPC stat block
**Notes:** None

### Q2: Melee/ranged attacks embedded?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, embedded attacks (Recommended) | attacks[] array on Creature. Name, bonus, damage formula, traits, attack type. | * |
| Separate attack model | Attacks linked by ID. | |

**User's choice:** Yes, embedded attacks
**Notes:** None

### Q3: Creature abilities modeled?

| Option | Description | Selected |
|--------|-------------|----------|
| Data entries only (Recommended) | abilities[] with name, actionType, description, traits. | |
| Skip for now | Defer to future phase. | * |
| Include with outcome descriptors | Data + declarative outcomes. | |

**User's choice:** Skip for now
**Notes:** ~55 ability types deferred

---

## Degree-of-success

### Q1: What scope?

| Option | Description | Selected |
|--------|-------------|----------|
| Pure calculation utility (Recommended) | Given check result + DC, return degree. +10/-10 rule, nat 20/1. | |
| Calculation + adjustment pipeline | Same plus degree upgrades/downgrades from traits/effects. | * |
| You decide | Claude picks. | |

**User's choice:** Calculation + adjustment pipeline
**Notes:** None

### Q2: Which degree adjustments?

| Option | Description | Selected |
|--------|-------------|----------|
| Core rules only (Recommended) | Nat 20/1, Incapacitation trait, basic save. | * |
| Core + common item/feat | Plus Keen, Juggernaut, Evasion, Resolve, hero points. | |
| Extensible plugin system | General-purpose callback pipeline. | |

**User's choice:** Core rules only
**Notes:** Pipeline should accommodate future adjustments

---

## Claude's Discretion

- Exact TypeScript interfaces for Action, ActionOutcome, Statistic, expanded Creature
- Organization of 545 action entries
- Condition-to-statistic auto-injection architecture
- Selector resolution internals
- File organization for new modules
- Degree-of-success module placement

## Deferred Ideas

- Creature abilities (Reactive Strike, Grab, etc.)
- Spell system
- Advanced degree adjustments (Keen, Juggernaut, Evasion, Resolve)
- Full action execution engine
- PC-style stat building
- Equipment/weapon/armor types
- Feat system and Rule Element processor
