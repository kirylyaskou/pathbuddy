# Phase 15: Combat Tracker Layout Redesign - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 15-combat-tracker-layout-redesign
**Areas discussed:** Center panel split, PC/empty right panel state, Bestiary add flow, Stat block load timing

---

## Center Panel Split

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical ResizablePanel | Nested ResizablePanelGroup inside center — DM drags divider | ✓ |
| List with max-height | Fixed ~40% height for list, scrolls internally, detail fills rest | |
| Fixed 40/60 ratio | Always 40% list / 60% detail, no resize, no scroll | |

**User's choice:** Vertical ResizablePanel (nested)
**Notes:** Gives DM control over how much space goes to the list vs. detail.

---

## PC / Empty State for Right Panel

| Option | Description | Selected |
|--------|-------------|----------|
| PC summary card | Show mini-card with name, HP, initiative, conditions when PC selected | |
| Placeholder (no stat block) | Neutral message "PC — no stat block" | |
| Last NPC (sticky) | Right panel keeps last shown NPC stat block when PC is selected | ✓ |

**User's choice:** Sticky — last NPC stat block stays visible when PC is selected or nothing is selected.
**Notes:** Lets DM keep NPC reference visible without explicitly re-selecting.

---

## Bestiary Add Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Button-only Add | Existing `+ Add` button on each CreatureCard, no drag | ✓ |
| Drag + button | Drag handle on cards to drop into initiative list, plus button | |

**User's choice:** Button-only — current behavior is sufficient, satisfies success criteria.
**Notes:** No drag-and-drop from bestiary. Avoids cross-panel drag complexity.

---

## Stat Block Load Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Lazy — on click | Fetch CreatureStatBlockData from SQLite when NPC is selected | ✓ |
| On add to combat | Fetch and store full stat block data in Combatant on add | |

**User's choice:** Lazy fetch on select.
**Notes:** Cache strategy (last N in memory) left to Claude's discretion.

---

## Claude's Discretion

- Default panel width ratios (suggested: 22% / 38% / 40%)
- Nested vertical ResizablePanelGroup default sizes (suggested: 35% list / 65% detail)
- In-memory stat block cache size and eviction
- Empty state for right panel on first load (no NPC ever selected)
- Exact placement of CombatControls and AddPCDialog in center panel header

## Deferred Ideas

None.
