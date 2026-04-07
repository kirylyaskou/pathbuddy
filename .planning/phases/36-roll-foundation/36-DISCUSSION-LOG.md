# Phase 36: Roll Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 36-roll-foundation
**Areas discussed:** rollDice() location, Roll record structure, MAP phase, Spell heightening

---

## Gray Area Selection

| Option | Selected |
|--------|----------|
| rollDice() location | ✓ |
| Roll record structure | ✓ |
| MAP in this phase? | ✓ |
| Spell scaling (user-added) | ✓ |

**User added:** Spell heightening/scaling (`https://2e.aonprd.com/Rules.aspx?ID=2225`) — wants formula layer to handle PF2e heightened spell damage scaling.

---

## rollDice() Location

| Option | Description | Selected |
|--------|-------------|----------|
| engine/dice/ | Pure TS, no framework deps, usable by engine logic in Phase 39 | ✓ |
| src/shared/lib/dice/ | UI-layer only, cleaner separation if rolls are always UI-triggered | |

**User's choice:** `engine/dice/`
**Notes:** Consistent with existing engine pattern; allows Phase 39 condition math to use rollDice without importing from src/

---

## Roll Record Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Verbose with per-die breakdown | `{ dice: [{sides, value}], modifier, total, ... }` — shows each die individually | ✓ |
| Simple summary | `{ formula, total, label, timestamp }` — compact but no die breakdown | |

**User's choice:** Verbose
**Notes:** Required for Phase 37's die-by-die display (e.g. `[4]+[2]+5 = 11`)

---

## MAP in Phase 36

| Option | Description | Selected |
|--------|-------------|----------|
| Include MAP in Phase 36 | RollStore gets `attackCountByCombatant` + `resetAllMAP()` | ✓ |
| Defer MAP to Phase 38 | Phase 36 stays minimal, MAP added alongside clickable UI | |

**User's choice:** Include in Phase 36
**Notes:** Phase 38 just reads/increments; cleaner than retrofitting

---

## Spell Heightening Support

| Option | Description | Selected |
|--------|-------------|----------|
| heightenFormula() helper in Phase 36 | `heightenFormula(base, {perRanks, add}, castRank, baseRank): string` | ✓ |
| HeightenedRoll type only | Data type, no resolution logic | |
| Defer entirely to Phase 38 | Phase 36 handles flat formulas only | |

**User's choice:** heightenFormula() helper in Phase 36
**Notes:** Clean separation — resolver in foundation, clickable UI in Phase 38. AoN rules: https://2e.aonprd.com/Rules.aspx?ID=2225

---

## Claude's Discretion

- Random number generation approach (Math.random() — no seeding)
- Engine barrel export additions
- Attack roll invocation pattern (`rollDice("1d20+N")` vs dedicated wrapper)
