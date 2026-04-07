# Phase 16: Encounter Persistence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 16-encounter-persistence
**Areas discussed:** EncountersPage overhaul, Encounter ↔ Combat linkage, When does it save?, Write-back scope

---

## EncountersPage Overhaul

| Option | Description | Selected |
|--------|-------------|----------|
| Split: List + Editor | Left panel = saved encounters list, right panel = editor + Load into Combat button. XP bar stays at top. | ✓ |
| Keep builder + Save button | Keep current XP builder, add Save as Encounter button + collapsible saved list. | |
| Three panels | Saved list (left), creature editor (center), search sidebar (right). | |

**User's choice:** Split layout — saved encounters list on left, encounter editor on right. XP Budget Bar reflects selected encounter.

---

## Adding Creatures — Search UX

| Option | Description | Selected |
|--------|-------------|----------|
| Search panel slides in | "+ Add Creature" opens inline search panel within the right editor. | ✓ |
| Modal dialog search | "+ Add Creature" opens a full dialog. | |
| Reuse BestiarySearchPanel | Toggle between creature list and add views in the right panel. | |

**User's choice:** Inline search panel slides in.

---

## Tier Button UX (user-initiated addition)

| Option | Description | Selected |
|--------|-------------|----------|
| Три кнопки рядом | [W] [+] [E] compact buttons on every search result row. | ✓ |
| Split button | One main "+" button + dropdown arrow for Weak/Elite. | |
| Inline toggle before кнопки | Small ToggleGroup [W/N/E] before the + button. | |

**User's choice:** Three compact buttons per row — [W] [+] [E] — no separate tier switcher needed.

---

## XP Budget Bar

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both, reflect saved encounter | XP bar + Party Config reflect selected encounter. | ✓ |
| Keep both as global settings | XP bar stays independent of selected encounter. | |
| Remove from this page | Remove XP bar and party config from Encounters page entirely. | |

**User's choice:** Keep both, reflect the selected encounter's creatures and party config.

---

## Encounter ↔ Combat Linkage

| Option | Description | Selected |
|--------|-------------|----------|
| Merge: encounter IS the combat | encounter_combatants + encounter_conditions tables. combatId = encounter ID. combats table kept for ad-hoc only. | ✓ |
| Link: encounter template + combat session | encounters stores initial list; combats stores live state; source_encounter_id FK links them. Write-back syncs combats → encounters. | |

**User's choice:** Merge — encounter record is the single source of truth. New encounter_combatants and encounter_conditions tables. combats table kept only for ad-hoc combat.

---

## Ad-hoc Combat

| Option | Description | Selected |
|--------|-------------|----------|
| Keep ad-hoc, keep combats table | Ad-hoc combat still works as today via combats table. | ✓ |
| Auto-create encounter for ad-hoc | Starting ad-hoc combat auto-creates a temporary encounter. | |
| Drop ad-hoc combat entirely | Require an encounter to be loaded before starting combat. | |

**User's choice:** Keep ad-hoc combat and combats table. Both paths coexist.

---

## Load into Combat — Conflict Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm dialog, then replace | Dialog: "Active combat in progress. Discard and load new encounter?" | ✓ |
| Silently replace | Load immediately, discard active combat without confirmation. | |
| Block: end current combat first | Disable button if combat is running. | |

**User's choice:** Confirm dialog.

---

## Save Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-save on every change | 300ms debounced Zustand subscription (same as combat-persistence.ts). | ✓ |
| Explicit Save button | Dirty draft held until DM clicks Save. | |
| Auto-save on navigate away | Saves only when leaving the page. | |

**User's choice:** Auto-save on every change.

---

## New Encounter Creation

| Option | Description | Selected |
|--------|-------------|----------|
| Inline name input | "+ New" shows inline text input in encounter list. Enter creates it. | ✓ |
| Modal dialog | "+ New" opens a dialog for name (+ optional party config). | |
| Auto-named, rename later | Auto-creates "Encounter 1", name editable inline. | |

**User's choice:** Inline name input.

---

## Write-back Scope

| Option | Description | Selected |
|--------|-------------|----------|
| HP changes (required) | hp/maxHp/tempHp written back. | ✓ |
| Condition changes (required) | encounter_conditions updated on add/remove/modify. | ✓ |
| Round/turn/active combatant | Encounter stores round, turn, active_combatant_id. | ✓ |
| Initiative order | sort_order in encounter_combatants updated on reorder. | ✓ |

**User's choice:** All four — full state write-back.

---

## Reset Encounter — Initial HP Definition

| Option | Description | Selected |
|--------|-------------|----------|
| max_hp from encounter_combatants | Reset restores hp = max_hp. Simple, self-contained. | ✓ |
| Re-fetch from creatures table | Reset re-queries creatures table for base HP + tier adjustment. | |
| Store initial_hp separately | Add initial_hp column, copy to hp on reset. | |

**User's choice:** hp = max_hp on reset.

---

## Claude's Discretion

- Exact panel width defaults for the split layout
- Visual design of the [W] [+] [E] button group
- Empty state for the right panel when no encounter is selected
- Visual indicator on encounter list for is_running = 1
- Whether to create encounter-persistence.ts or extend combat-persistence.ts
- Exact confirm dialog copy for "Load into Combat while combat is running"

## Deferred Ideas

None.
