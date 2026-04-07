# Phase 41 Context: Encounters Page Redesign + Dual Combat View

## Phase Goal
Redesign the Encounters page with a 3-panel layout and full search (creatures + hazards), drag-and-drop from search to encounter, hazards persisted in encounter_combatants; combat tracker gets a split-center mode to show 2 encounter initiative lists side-by-side.

## Canonical Refs
- `src/pages/encounters/ui/EncountersPage.tsx` — current 2-panel layout (replace)
- `src/features/encounter-builder/ui/EncounterEditor.tsx` — right panel, keep logic, adapt for drop target
- `src/features/encounter-builder/ui/EncounterCreatureSearchPanel.tsx` — replace with full search
- `src/features/encounter-builder/ui/CreatureSearchSidebar.tsx` — reuse as new middle panel (Creatures/Hazards tabs already exist)
- `src/widgets/bestiary-search/ui/BestiarySearchPanel.tsx` — reference for draggable creature cards
- `src/pages/combat/ui/CombatPage.tsx` — split-center modification target
- `src/pages/combat/ui/EncounterTabBar.tsx` — add split toggle button
- `src/features/combat-tracker/model/encounter-tabs-store.ts` — may need split mode state
- `src/shared/api/` — schema migration for encounter_combatants (hazard columns)

---

## Decisions

### A. Encounters Page Layout — 3-panel: Encounters | Search | Details

**Decision:** Replace the current 2-panel layout with a 3-panel ResizablePanelGroup:
- **Left panel** — `SavedEncounterList` (existing, no changes)
- **Middle panel** — `CreatureSearchSidebar` (Creatures/Hazards tabs, tier selector, full CreatureCard) — made draggable via dnd-kit
- **Right panel** — `EncounterEditor` (creature list of selected encounter, XP budget bar, Load/Reset actions) — made a drop target

Layout wiring: `DndContext` wraps the whole page. Drag items originate in the middle search panel; drop zone is the right creature list.

**What stays from EncounterEditor:** creature list rows, XP calculation, Load into Combat button, Reset button, name header, Save logic.

**What changes:** `EncounterCreatureSearchPanel` (bottom collapsed panel) is removed — search moves to its own middle panel and is always visible.

---

### B. Hazards in Saved Encounters — as combatants in encounter_combatants

**Decision:** Hazards are stored in the existing `encounter_combatants` SQLite table alongside creatures. They have their own initiative.

**Schema migration — add 2 columns to encounter_combatants:**
```sql
ALTER TABLE encounter_combatants ADD COLUMN is_hazard INTEGER NOT NULL DEFAULT 0;
ALTER TABLE encounter_combatants ADD COLUMN hazard_ref TEXT;
```

- `is_hazard = 1` + `hazard_ref = hazard.id` identifies a hazard row
- `creature_ref` stays NULL for hazard rows
- `display_name`, `level` (as `creature_level`), `initiative`, `hp`, `max_hp` all apply to hazards (hardness is display-only, not a combat stat here)
- `weak_elite_tier` not applicable to hazards — stored as `'normal'`
- `is_npc = 1` for hazards (they are not PCs)

**In-memory EncounterCombatant type:** add `isHazard?: boolean` and `hazardRef?: string` fields.

**XP calculation:** hazards contribute XP — use same `calculateCreatureXP(level, partyLevel)` logic as creatures.

**Hazard rows in encounter creature list:** visually distinct — amber left border, `AlertTriangle` icon (matching the existing pattern in `EncounterCreatureList` from Phase 30).

---

### C. Drag-and-Drop: Search → Encounter

**Decision:** dnd-kit `DragOverlay` + `useDraggable` on each creature/hazard card in the middle search panel. The right encounter creature list is the `useDroppable` target.

**Behavior:**
- Dragging a creature from search and dropping on the right panel adds it to the selected encounter (same logic as clicking "+" — calls `handleAdd` with `tier = selectedTier`)
- Dragging a hazard from search and dropping on the right panel adds it as a hazard combatant
- Drop target: the entire right panel area (not individual rows — no reorder drag on this page)
- If no encounter is selected, drop is a no-op (right panel shows "Select an encounter" empty state)
- Click-to-add still works as a fallback (W/+/E buttons on creatures, click on hazards)

**DndContext scope:** wraps the 3-panel layout. Does not conflict with combat tracker's DndContext (different pages, different router routes).

---

### D. Dual Combat View — Split Center Panel

**Decision:** A toggle button in `EncounterTabBar` (or next to it) enables split mode. In split mode, the center panel is divided into 2 equal vertical columns, each showing a separate encounter's initiative list + combatant detail. Left bestiary search panel and right stat block panel remain single/shared.

**Details:**
- Split mode is only available when 2+ tabs are open
- In split mode: left half = tab[0] initiative list + combatant detail, right half = tab[1] initiative list + combatant detail
- Each half has its own selected combatant state
- Stat block (right panel) shows the last selected combatant from either half (whichever was most recently clicked)
- TurnControls: one set of turn controls per half (each encounter tracks its own round/turn independently)
- CombatControls (start/stop/next turn): one per half
- Split mode state stored in `useEncounterTabsStore` as `splitMode: boolean`
- Toggling split off returns to single-tab view (active tab stays active)
- Split toggle button: icon-based (e.g., `Columns2` from lucide), appears in tab bar right side when 2+ tabs open

**What does NOT change in split mode:**
- BestiarySearchPanel (left) — shared, drag goes to whichever half is "focused" (last clicked)
- StatBlock (right) — shared, shows last selected NPC from either half

---

## Deferred Ideas

- Encounter notes / description field
- Hazard hardness as a combat stat (damage reduction) — engine doesn't model this yet
- Filter by level/source in encounter search (scope creep — separate phase)
- Drag to reorder creatures within an encounter list

---

## Scope Summary

**Encounters page (`/encounters` route):**
1. Replace 2-panel with 3-panel ResizablePanelGroup
2. Middle panel = `CreatureSearchSidebar` adapted with dnd-kit draggable items
3. Right panel = `EncounterEditor` adapted as drop target, removes `EncounterCreatureSearchPanel`
4. SQLite migration: 2 new columns on `encounter_combatants`
5. Hazard rows in encounter creator (same add logic as in CreatureSearchSidebar.addHazardToDraft but now persisted)
6. Hazard row visual treatment in creature list (amber, AlertTriangle)

**Combat tracker (`/combat` route):**
7. `useEncounterTabsStore` gains `splitMode: boolean` + toggle action
8. `EncounterTabBar` gains split toggle button (visible when 2+ tabs open)
9. `CombatPage` center panel: conditional split rendering (2 columns when `splitMode && openTabs.length >= 2`)
10. Each column is self-contained: initiative list + combatant detail + combat controls + turn controls
