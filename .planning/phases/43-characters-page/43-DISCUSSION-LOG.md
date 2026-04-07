# Phase 43: Characters Page - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 43-characters-page
**Areas discussed:** PC Card Layout, Import Dialog, Add to Combat, Delete Flow

---

## PC Card Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Compact grid | 3-4 columns, name + class/level + ancestry, hover buttons | ✓ |
| Wide row list | Horizontal rows with columns: Name, Class, Level, Ancestry, Actions | |
| Rich card | Larger cards with HP, AC, more details visible immediately | |

**User's choice:** Compact grid (3-4 columns)
**Notes:** Similar to ConditionsPage pattern. Buttons [+Combat] and [x] appear on hover only.

### Empty state

| Option | Description | Selected |
|--------|-------------|----------|
| Text + Import button | "No characters imported yet" + subtitle + prominent Import button | ✓ |
| Just empty list | Empty area under header with Import button in header only | |

**User's choice:** Text + Import button (centered)

---

## Import Dialog

### Dialog structure

| Option | Description | Selected |
|--------|-------------|----------|
| One dialog, two tabs | File and Paste tabs in single Dialog | ✓ |
| One dialog, stacked | File picker above, textarea below (no tabs) | |

**User's choice:** One dialog, two tabs (File / Paste)

### Error handling

| Option | Description | Selected |
|--------|-------------|----------|
| Error in dialog | Inline red error text, dialog stays open | ✓ |
| Toast error | Dialog closes, error shown in sonner toast | |

**User's choice:** Inline error in dialog — DM can correct without reopening.

### After successful import

| Option | Description | Selected |
|--------|-------------|----------|
| Dialog closes, list refreshes | Silent success + optional toast | ✓ |
| Dialog stays open | Allows importing multiple PCs without reopening | |

**User's choice:** Dialog closes + list refreshes + sonner toast "{Name} imported"

---

## Add to Combat

### Behavior on click

| Option | Description | Selected |
|--------|-------------|----------|
| Add + toast with link | useCombatantStore.addCombatant() + toast with "Go to Combat" action | ✓ |
| Add + auto-navigate | Adds then navigates to /combat automatically | |
| Add silently | No feedback — DM discovers in combat page | |

**User's choice:** Add + sonner toast with "Go to Combat" action button

### Combatant data from PC

| Option | Description | Selected |
|--------|-------------|----------|
| HP + name + isNPC=false | calculatePCMaxHP, initiative=0, creatureRef=id, no AC | ✓ |
| HP + AC + name + isNPC=false | Also read build.acTotal, extend Combatant type | |

**User's choice:** HP + name only — AC extension is Phase 45 scope.

### When combat not running

| Option | Description | Selected |
|--------|-------------|----------|
| Add anyway | Always adds, no warning | ✓ |
| Show warning toast | "No active combat — go to /combat first" | |

**User's choice:** Add in any case — predictable and simple.

---

## Delete Flow

### Button placement

| Option | Description | Selected |
|--------|-------------|----------|
| Hover button + AlertDialog | [x] appears on hover, AlertDialog for confirmation | ✓ |
| Always visible button | [x] always shown, less clean card | |

**User's choice:** Hover button. Pattern reused from EncounterEditor's AlertDialog.

### Delete when PC is in combat

| Option | Description | Selected |
|--------|-------------|----------|
| Delete from SQLite only | Runtime combatant stays until session end | ✓ |
| Warn: PC is in combat | Add warning to confirmation dialog | |

**User's choice:** Delete from SQLite, do not touch active combatants.

---

## Claude's Discretion

- Card sizing and typography (follow Golden Parchment theme)
- Default sort order for grid (alphabetical by name)
- Drag-and-drop zone copy text
- Loading/spinner state during import
- FSD file structure for the feature

## Deferred Ideas

- Click on card → PC Sheet (Phase 44)
- HP/AC on card (Phase 44)
- Search/filter by name or class (not in CHAR requirements)
- "PC in combat" indicator badge on card
