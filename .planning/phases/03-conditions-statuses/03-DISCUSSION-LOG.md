# Phase 3: Conditions & Statuses - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 03-conditions-statuses
**Areas discussed:** Condition effect system, IWR type expansion scope, Creature type interface, Death & dying depth

---

## Condition Effect System

| Option | Description | Selected |
|--------|-------------|----------|
| Data-driven lookup (Recommended) | Static map of slug to effects with simple multipliers. valuePerLevel * conditionValue. Drained HP as special effect. | |
| Full Rule Element processor | Parse Foundry RE JSON (FlatModifier, GrantItem keys). Most faithful but complex. | |
| Hardcoded per-condition | Explicit if/else logic per condition. Simple but hard to maintain. | |

**Preliminary selection:** Data-driven lookup

**Follow-up: Valued condition scaling**
User clarified that valued conditions (Frightened 1-5, Clumsy 1-5) scale penalties with their value. Agent researched refs/pf2e/conditions/ and found `@item.badge.value` token pattern in FlatModifier rules.

| Option | Description | Selected |
|--------|-------------|----------|
| Simple multipliers (Recommended) | valuePerLevel * conditionValue. No formula parsing. Drained HP as separate special effect. | X |
| Foundry formula parser | Parse "-@item.badge.value" and complex expressions with min()/max()/@actor.level | |
| You decide | Claude picks at planning time | |

**User's choice:** Simple multipliers
**Notes:** User emphasized: "don't mess up the status logic! I believe in you"

---

## IWR Type Expansion Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Include in Phase 3 (Recommended) | Bundle ~80 IWR types, holy/unholy, all-damage handling, condition immunity path — all in Phase 3 | X |
| IWR separate phase | Phase 3 = conditions only, IWR expansion in Phase 3.1 or Phase 5 | |
| Only condition immunities | Add condition immunity types in Phase 3, rest of IWR expansion later | |

**User's choice:** Include in Phase 3
**Notes:** None

---

## Creature Type Interface

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal Creature type (Recommended) | Only Phase 3 fields: immunities, conditions, hp, level. Phase 4 extends. | X |
| Pass immunities as parameter | No Creature type — pass immunity list to ConditionManager constructor | |
| Full Creature interface | All fields from gap analysis (HP, AC, saves, abilities, IWR, speed, size, traits, attacks) | |

**User's choice:** Minimal Creature type
**Notes:** None

---

## Death & Dying Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full death progression (Recommended) | Max values, doomed threshold, dying->unconscious, recovery checks | |
| Only max values + auto-grant | dying >= (4-doomed) = dead, dying->unconscious. No recovery checks. | |
| You decide | Claude determines depth at planning time | |

**User's choice:** Full death progression with clarifications:
- NPC/monsters only — PCs handle their own death progression
- `deathDoor` boolean flag (default false) — for important monsters that should go through full death's door process
- When deathDoor is true: automatic recovery checks, dying progression, stabilization
- When deathDoor is false: monster dies at HP <= 0
- Stabilized monsters remain unconscious
- Dying/wounded/doomed values must be manually editable

**Notes:** User described deathDoor as a feature for "important monsters" — bosses and named NPCs. Default off for rank-and-file.

---

## Claude's Discretion

- Exact TypeScript types for condition effect map
- Internal file organization for condition effects
- IWR array ordering
- Recovery check implementation structure
- deathDoor flag placement (Creature vs ConditionManager)

## Deferred Ideas

- UI "Deathdoor" toggle button — frontend milestone
- Full degree-of-success system — Phase 4
- Condition-to-statistic wiring — Phase 4
- General Rule Element processor — not needed, data-driven lookup sufficient
