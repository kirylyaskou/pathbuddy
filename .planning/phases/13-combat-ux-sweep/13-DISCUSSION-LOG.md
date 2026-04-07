# Phase 13: Combat UX Sweep - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 13-combat-ux-sweep
**Areas discussed:** HP controls redesign, Condition picker layout, Persistent damage status

---

## HP Controls Redesign

### Q1: Damage type picker integration

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible below input | Damage type selector sits under the number input permanently, IWR preview appears when relevant | |
| Appears only after clicking Damage | Click Damage button, type picker is a small dropdown next to the Damage button | |
| Inline with Damage button | Split-button design — left side = apply, right side = dropdown for damage type | ✓ |

**User's choice:** Split-button design
**Notes:** None

### Q2: Enter key behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Apply damage | Most common action during combat | ✓ |
| Apply whichever button was last clicked | Remembers last action | |
| You decide | Claude's discretion | |

**User's choice:** Apply damage
**Notes:** Damage is the hot path in combat

### Q3: Button arrangement

| Option | Description | Selected |
|--------|-------------|----------|
| Input on top, 3 buttons in a row below | Full-width input, then Damage / Heal / TempHP side by side | |
| Input on left, 3 buttons stacked on right | Compact horizontal layout | ✓ |
| Input + buttons all in one row | Input field then 3 buttons inline | |
| You decide | Claude's discretion | |

**User's choice:** Input on left, 3 buttons stacked on right
**Notes:** Compact layout preferred

---

## Condition Picker Layout

### Q1: Condition layout style

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-column grid of pills/tags | Conditions as clickable pills in a flowing grid, grouped by section headers | |
| 2-column list | Same searchable Command list but split into two columns | |
| Category tabs + grid | Tab bar across the top, each tab shows a grid of conditions | ✓ |

**User's choice:** Category tabs + grid
**Notes:** Clean separation by category

### Q2: Search bar placement

| Option | Description | Selected |
|--------|-------------|----------|
| Search above tabs | Search filters across all categories, tabs disappear while searching | ✓ |
| No search, just tabs | With ~30 conditions across 5 tabs, browsing is fast enough | |
| You decide | Claude's discretion | |

**User's choice:** Search above tabs, tabs disappear while searching
**Notes:** Keeps the fast-filter path from the current design

---

## Persistent Damage Status

### Q1: Current status

| Option | Description | Selected |
|--------|-------------|----------|
| It's broken | Specific issues observed | |
| Not sure | Include as verification item, fix if broken | |
| It works | Just verify and mark done | ✓ |

**User's choice:** It works — just verify and check off CMB-10
**Notes:** None

---

## Claude's Discretion

- Exact width of wider condition picker popover
- Grid column count for condition pills
- Split-button visual design details
- Button sizing in stacked HP layout
- IWR preview integration with split-button

## Deferred Ideas

None
