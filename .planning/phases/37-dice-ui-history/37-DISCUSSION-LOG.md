# Phase 37: Dice UI + History - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 37-dice-ui-history
**Areas discussed:** Roll trigger, Toast subscription pattern, Cube result face behavior

---

## Roll trigger in Phase 37

| Option | Description | Selected |
|--------|-------------|----------|
| 'Roll d20' button in AppHeader | Small 🎲 button next to history. Stays as permanent quick-roll in Phase 38 | ✓ |
| Dev-only test button | Temporary fixture, removed when Phase 38 wires real rolls | |
| No trigger — defer to Phase 38 | Components only, verification via browser console | |

**User's choice:** "Roll d20" button in AppHeader, stays as permanent manual quick-roll.

**Notes:** User also described their Phase 38 vision — clicking stat numbers (attack + MAP, skill/DC, damage values) triggers rolls. Spell damage button ("Damage 🔥") for spells that deal multiple damage types simultaneously. These are deferred to Phase 38+.

---

## Roll History placement (emerged from trigger discussion)

| Option | Description | Selected |
|--------|-------------|----------|
| AppHeader — global | Icon button in header, accessible from any page | ✓ |
| CombatPage bottom panel | UI-SPEC placement: collapsible below TurnControls | |

**User's choice:** AppHeader (global) — overrides UI-SPEC placement.

**Notes:** User said "История бросков — возле кнопки смены темы приложения" (Roll history — near the app theme button). Theme toggle is in AppHeader right section. This decision supersedes the UI-SPEC placement.

---

## Toast subscription pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Listener in AppHeader | `<RollToastListener />` component, useEffect on rolls[0], decoupled | ✓ |
| Directly in addRoll() | Store action imports toast() and fires it — simple but couples store to UI | |

**User's choice:** Listener component in AppHeader. User confirmed the code preview showing `<RollToastListener />` mounted in the header alongside `<RollDie20Button />` and `<RollHistoryButton />`.

---

## Cube result face behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Shows roll result | All faces show die type during spin; JS updates front face to rolled value after animation | ✓ |
| Pure spin — always shows d20 | Cube is purely visual flourish; value only in toast | |

**User's choice:** Front face updates to show rolled value (gold) after animation completes.

**Notes:** Implementation approach — 360° CSS spin returns to same orientation, then `animationend` handler updates front face div content to the rolled number.

---

## Claude's Discretion

- RollHistoryPanel container type (Popover vs Sheet vs dropdown)
- Exact panel width/positioning
- Whether RollToastListener uses subscribe() or useEffect

## Deferred Ideas

- **Spell damage button** ("Damage 🔥") — Phase 38+
- **Multi-type conditional damage** (e.g., Chilling Darkness: 5d6 cold + 5d6 spirit) — Phase 38+
