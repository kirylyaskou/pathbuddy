# Phase 45: Combat Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 45-combat-integration
**Areas discussed:** AC persistence, AC display, AddPCDialog, PC right panel

---

## AC persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Да, добавить миграцию | ALTER TABLE encounter_combatants ADD COLUMN ac INTEGER; update save/load SQL — AC persists on encounter reload | ✓ |
| Нет, runtime-only | AC in Zustand only, lost on encounter reload, simpler but inconsistent | |

**User's choice:** Добавить миграцию 0022
**Notes:** Consistent behaviour — PC AC should survive encounter save/load same as HP.

---

## AC display

| Option | Description | Selected |
|--------|-------------|----------|
| CombatantDetail header | AC shown below name in CombatantDetail center panel, next to initiative info | ✓ |
| InitiativeRow badge | Small "AC 17" badge in initiative list row next to HP | |

**User's choice:** CombatantDetail header
**Notes:** NPC AC is in stat block (right panel), PC AC in CombatantDetail (center) — symmetric pattern.

---

## AddPCDialog

| Option | Description | Selected |
|--------|-------------|----------|
| Удалить | Delete AddPCDialog component and button from CombatPage entirely | ✓ |
| Заменить на character picker | Replace manual form with imported characters list | |
| Оставить как fallback | Keep manual form alongside Characters page | |

**User's choice:** Удалить
**Notes:** Characters page is the correct workflow. Manual form doesn't populate AC/class. Removing reduces confusion.

---

## PC right panel

| Option | Description | Selected |
|--------|-------------|----------|
| Пустую (sticky NPC) | Right panel stays on last NPC stat block when PC is selected — already implemented | ✓ |
| PC info card | Switch right panel to show class/level/saves/skills from Pathbuilder JSON | |

**User's choice:** Sticky NPC (no changes needed)
**Notes:** Phase 15 sticky NPC behaviour is sufficient. PC details available via /characters page.

---

## Claude's Discretion

- Exact visual format of AC in CombatantDetail (same line as initiative or separate line)
- SQL column ordering in INSERT statement
- encounter-persistence.ts restoration of ac field

## Deferred Ideas

- PC info card in right panel — decided against for Phase 45
- Class info badge in InitiativeRow — Phase 999.2 backlog
- Manual AddPCDialog fallback for non-Pathbuilder PCs — out of scope
