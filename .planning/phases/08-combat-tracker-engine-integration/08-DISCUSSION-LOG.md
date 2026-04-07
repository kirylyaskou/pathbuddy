# Phase 8: Combat Tracker + Engine Integration — Discussion Log

**Date:** 2026-04-01
**Participants:** User + Claude
**Areas discussed:** Panel layout, Creature-add flow, Condition apply UX, Turn feedback

---

## Area 1: Panel Layout

**Q1: How should the combat workspace be divided?**
- Options: 3-column split | 2-column + collapsible | Single column stacked
- **Selected: 3-column split** — Left: initiative list, Center: combatant detail, Right: bestiary search

**Q2: Should the bestiary panel (right) be always visible or toggleable?**
- Options: Always visible | Toggleable | You decide
- **Selected: Always visible**

**Q3: What should the initiative list show per combatant row?**
- Options: Compact | Rich | Minimal
- **Selected: Compact** — Name, initiative number, HP bar, tiny condition badges

**Q4: Should initiative order support drag-and-drop reordering?**
- Options: Yes | No
- **Selected: Yes**

---

## Area 2: Creature-add Flow

**Q1: How should initiative be assigned when adding a creature to combat?**
- Options: DM types initiative | Auto-roll from perception | Default 0 + reorder
- **Selected: Auto-roll from perception** — Initiative = perception modifier + random d20, DM can override

**Q2: When adding multiples of the same creature, how should it work?**
- Options: One-by-one | Quantity selector | You decide
- **Selected: One-by-one** — Each creature added individually with auto-numbered names

**Q3: Should PCs also be addable?**
- Options: PCs too | NPCs only | PCs with typed initiative
- **Selected: PCs too** — Quick-add form with name + initiative + max HP

---

## Area 3: Condition Apply UX

**Q1: How should the DM pick a condition to apply?**
- Options: Searchable combobox | Grouped dropdown | Flat list
- **Selected: Searchable combobox** — Type to filter, grouped sections when not filtering

**Q2: When a condition grants other conditions, how should that appear?**
- Options: Auto-apply with toast | Auto-apply silently | Prompt before applying
- **Selected: Auto-apply with toast** — Granted conditions appear automatically, brief notification

**Q3: Should the DM be able to lock conditions to prevent auto-decrement?**
- Options: Yes, lock toggle | No locking
- **Selected: Yes, lock toggle** — Small lock icon on each condition badge

**Q4: How should condition badges display?**
- Options: Colored pills with value | Icon-only badges | You decide
- **Selected: Colored pills with value** — Name + value, click to edit/remove, chain icon for granted conditions

---

## Area 4: Turn Feedback

**Q1: What should happen visually when the DM advances a turn?**
- Options: Toast summary | Inline log panel | Silent + highlight
- **Selected: Toast summary** — Brief notification summarizing changes

**Q2: Should there be Previous Turn / Undo support?**
- Options: Previous turn only | Full undo stack | No undo
- **Selected: Previous turn only** — One step back, reverses condition decrements

**Q3: Should combat state persist across app restarts?**
- Options: Session-only | SQLite persistence
- **Selected: SQLite persistence** — Combat saved to SQLite, resumable after app close

**Q4: When should combat state auto-save?**
- Options: On every change | On turn advance only | Manual save button
- **Selected: On every change** — Immediate save on every HP/condition/turn change

---

*Log generated: 2026-04-01*
