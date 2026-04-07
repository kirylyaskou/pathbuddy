# Phase 41: Encounters Redesign + Dual Combat View — Research

**Researched:** 2026-04-05
**Domain:** dnd-kit drag-and-drop, SQLite schema migration, split-mode combat panel state
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**A. Encounters Page Layout — 3-panel: Encounters | Search | Details**
- Replace current 2-panel with 3-panel ResizablePanelGroup
- Left panel: `SavedEncounterList` (unchanged), 20% default / 15% min / 30% max
- Middle panel: `CreatureSearchSidebar` (Creatures/Hazards tabs, tier selector, full CreatureCard) — add `useDraggable` to each card
- Right panel: `EncounterEditor` (drop target) — `useDroppable`, remove `EncounterCreatureSearchPanel`
- `DndContext` wraps the whole 3-panel area (scoped to EncountersPage only)
- Click-to-add still works as fallback (W/+/E buttons on creatures, click on hazards)

**B. Hazards in Saved Encounters — stored in encounter_combatants**
- 2 new columns via ALTER TABLE:
  ```sql
  ALTER TABLE encounter_combatants ADD COLUMN is_hazard INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE encounter_combatants ADD COLUMN hazard_ref TEXT;
  ```
- `is_hazard = 1` + `hazard_ref = hazard.id`; `creature_ref` stays NULL for hazard rows
- `is_npc = 1` for hazards; `weak_elite_tier = 'normal'`
- In-memory `EncounterCombatant` type gains `isHazard?: boolean` and `hazardRef?: string`
- XP calculation: hazards use same `calculateCreatureXP(level, partyLevel)` logic
- Visual: amber left border, AlertTriangle icon (existing pattern from Phase 30)

**C. Drag-and-Drop: Search → Encounter**
- `DragOverlay` + `useDraggable` on each creature/hazard card
- Drop target: entire right panel (`useDroppable`), no row-level reorder drag
- Drop with no encounter selected: no-op, show "Select an encounter first" tooltip 1.5s
- Drag cancel: ghost returns to origin

**D. Dual Combat View — Split Center Panel**
- Toggle button in `EncounterTabBar` right side, visible when `openTabs.length >= 2`
- `Columns2` icon (lucide), 28px button (w-7 h-7), ghost style off / `bg-primary/20 text-primary` on
- Split mode: center panel = 2 equal fixed columns (50/50, no resizable handle), `border-r border-border/50` divider
- tab[0] in left column, tab[1] in right column — each has own `selectedId`, own `CombatControls`, own `TurnControls`
- Stat block (right panel): shared, shows last selected NPC from either column
- Split mode state: `splitMode: boolean` + `toggleSplitMode()` on `useEncounterTabsStore`
- Toggle off: returns to single column view; activeTabId stays

### Claude's Discretion
- None specified — all implementation details are locked above.

### Deferred Ideas (OUT OF SCOPE)
- Encounter notes / description field
- Hazard hardness as a combat stat
- Filter by level/source in encounter search
- Drag to reorder creatures within encounter list
</user_constraints>

---

## Summary

Phase 41 has two independent feature tracks operating on different routes: (1) the `/encounters` route receives a 3-panel ResizablePanelGroup with dnd-kit drag-from-search-to-editor, plus a SQLite schema migration to persist hazards in `encounter_combatants`; (2) the `/combat` route gains a split-center mode that renders two independent initiative columns side-by-side.

The drag-and-drop work reuses dnd-kit primitives already in the project (`@dnd-kit/core` 6.3.1) — specifically `useDraggable`, `useDroppable`, and `DragOverlay`. No new package installs are required. The `DndContext` for the encounters page is completely separate from the combat page's `DndContext` (different router routes, never mounted simultaneously), so there is no event-collision risk.

The split-mode implementation is a pure React state + conditional rendering problem. The key architectural insight is that in split mode the two columns each need their own `selectedId` state and their own instances of `CombatControls`/`TurnControls` — but they still read from the same global `useCombatantStore`/`useCombatTrackerStore` (tab snapshot approach already in place). Each column reads from its tab's snapshot data by restoring it into the global stores temporarily, which is how the existing tab switching already works. For simultaneous split display, each column must instead read directly from the tab's `snapshot.combatants` array rather than from the global store — this is the critical divergence from the current single-tab rendering.

**Primary recommendation:** For the split mode, render each column with its own local `selectedId` state and pass the tab's `snapshot.combatants` directly to column-scoped variants of `InitiativeList` and `CombatantDetail` — do not try to swap global stores between columns.

---

## Standard Stack

### Core (all already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@dnd-kit/core` | ^6.3.1 | DragOverlay, useDraggable, useDroppable, DndContext | Already in project, used in CombatPage |
| `@dnd-kit/sortable` | ^10.0.0 | SortableContext (used in InitiativeList) | Already in project |
| `react-resizable-panels` | ^2.1.7 | ResizablePanelGroup / ResizablePanel / ResizableHandle | Already in project |
| `zustand` | ^5.0.12 + immer | State store for splitMode flag | Already in project |
| `lucide-react` | ^0.564.0 | `Columns2` icon for split toggle | Already in project; `Columns2` confirmed present |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

No new files/directories needed beyond modifications to existing files. Changes are:

```
src/
├── shared/
│   ├── db/migrations/
│   │   └── 0020_encounter_hazard_columns.sql   # NEW: ALTER TABLE migration
│   └── api/encounters.ts                        # MODIFY: add isHazard/hazardRef to row types + save/load
├── entities/encounter/
│   └── model/types.ts                           # MODIFY: add isHazard?, hazardRef? to EncounterCombatant
├── features/encounter-builder/
│   └── ui/
│       ├── EncounterEditor.tsx                  # MODIFY: add useDroppable, remove EncounterCreatureSearchPanel
│       └── CreatureSearchSidebar.tsx            # MODIFY: add useDraggable to each card row
├── features/combat-tracker/
│   └── model/encounter-tabs-store.ts            # MODIFY: add splitMode + toggleSplitMode
├── pages/
│   ├── encounters/ui/EncountersPage.tsx         # MODIFY: 3-panel + DndContext
│   └── combat/ui/
│       ├── CombatPage.tsx                       # MODIFY: split-center conditional render
│       └── EncounterTabBar.tsx                  # MODIFY: add Columns2 split toggle button
```

### Pattern 1: dnd-kit Drag from Card to Panel Drop Target

**What:** One `DndContext` wrapping the page. `useDraggable` on each result card in the middle panel. `useDroppable` on the entire right panel div. `DragOverlay` renders the ghost card.

**When to use:** When items originate in a scrollable list and the drop target is a broad panel area (not a sortable list).

**Example (simplified from existing BestiarySearchPanel + EncounterTabBar patterns):**
```typescript
// Source: @dnd-kit/core (verified present in project)

// In CreatureSearchSidebar — each card gets useDraggable:
function DraggableCreatureCard({ row, tier }: { row: CreatureRow; tier: WeakEliteTier }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `creature-${row.id}`,
    data: { type: 'creature', row, tier },
  })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      style={{ opacity: isDragging ? 0 : 1 }}>
      <CreatureCard ... />
    </div>
  )
}

// In EncounterEditor — the drop target panel:
function EncounterEditorDropTarget({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'encounter-drop-zone' })
  return (
    <div ref={setNodeRef}
      className={cn('flex flex-col h-full', isOver && 'border-dashed border border-primary/40 bg-primary/5')}>
      {children}
    </div>
  )
}

// In EncountersPage — DndContext + DragOverlay:
<DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
  <ResizablePanelGroup ...>
    {/* panels */}
  </ResizablePanelGroup>
  <DragOverlay>
    {activeItem && <DragGhost item={activeItem} />}
  </DragOverlay>
</DndContext>
```

**Key detail:** The `isDragging` CSS `opacity: 0` hides the source card during drag. The `DragOverlay` renders the floating ghost. This is the standard dnd-kit approach — the source element stays in DOM but is hidden; the overlay is rendered in a portal.

### Pattern 2: Split Mode — Column-scoped State, NOT Global Store Swap

**What:** Each split column renders a tab's data from its `snapshot.combatants` array directly. The global combatant store stays pointed at the `activeTabId` tab as usual. Each column has its own React `selectedId` state.

**When to use:** When you need two concurrent views of independent data that share a common store architecture.

**The problem with store-swap approach:** The existing `setActiveTab` swaps the global stores. In split mode, calling this on each column interaction would cause the other column to go stale. The correct pattern is to pass snapshot data as props to column-scoped wrappers.

**Example:**
```typescript
// In CombatPage, split mode:
{splitMode && openTabs.length >= 2 ? (
  <div className="flex flex-1 overflow-hidden">
    <CombatColumn
      tab={openTabs[0]}
      onStatBlockSelect={handleStatBlockSelect}
      className="flex-1 border-r border-border/50"
    />
    <CombatColumn
      tab={openTabs[1]}
      onStatBlockSelect={handleStatBlockSelect}
      className="flex-1"
    />
  </div>
) : (
  /* existing single-column center panel */
)}
```

**`CombatColumn` receives `tab.snapshot.combatants` and renders its own:**
- Initiative list (reads from `tab.snapshot.combatants`, not global store)
- CombatantDetail (reads from `tab.snapshot.combatants` by selectedId)
- CombatControls (reads from `tab.snapshot.isRunning`, `tab.snapshot.round`, `tab.snapshot.turn`)
- TurnControls (same)

**Critical implication:** `InitiativeList` and `CombatantDetail` currently read from global Zustand stores (`useCombatantStore`, `useCombatTrackerStore`). For split mode, either (a) create prop-driven variants that accept `combatants: Combatant[]` and `activeCombatantId: string | null` directly, or (b) wrap each column in a column-local context. Option (a) — prop drilling — is simpler and has no FSD violation risk.

### Pattern 3: SQLite ALTER TABLE Migration

**What:** Add 2 nullable/defaulted columns to `encounter_combatants` via a new migration file.

**When to use:** Adding optional columns to an existing table without rebuilding it.

**Example:**
```sql
-- 0020_encounter_hazard_columns.sql
ALTER TABLE encounter_combatants ADD COLUMN is_hazard INTEGER NOT NULL DEFAULT 0;
ALTER TABLE encounter_combatants ADD COLUMN hazard_ref TEXT;
```

SQLite allows `ALTER TABLE ADD COLUMN` for columns with defaults or nullable columns. Both columns qualify. `NOT NULL DEFAULT 0` is allowed. `TEXT` nullable (no DEFAULT required) is allowed.

### Anti-Patterns to Avoid

- **Nesting DndContexts:** Do NOT nest a DndContext inside another DndContext. The Encounters page DndContext and the CombatPage DndContext are on different routes so there is no nesting risk. Confirm this holds if CombatPage is ever rendered inside Encounters.
- **Using DragOverlay with SortableContext:** The encounters page does NOT use SortableContext for drag-to-add (no reorder within search results). Only `useDraggable` + `useDroppable` + `DragOverlay`. Do not introduce SortableContext here.
- **Swapping global stores in split mode:** Do not call `setActiveTab` on every combatant click in split mode — this loses the other column's state.
- **Forgetting to hide the drag source:** Without `opacity: 0` when `isDragging`, the source card and ghost both appear, doubling the visual.
- **Skipping migration for existing rows:** Existing rows will have `is_hazard = 0` and `hazard_ref = NULL` by default from the ALTER TABLE. The TypeScript `loadEncounterCombatants` must read these two new columns and map them.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag ghost positioned to cursor | Custom mouse-position tracking | `DragOverlay` from @dnd-kit/core | DragOverlay handles portal rendering, position, and pointer capture automatically |
| Detect if drag is over a zone | Manual mouse event listeners | `useDroppable` `isOver` boolean | dnd-kit manages pointer/sensor collision detection |
| Drag cancel animation | requestAnimationFrame tweening | dnd-kit default cancelDrop behavior | Automatic ghost-return on ESC or miss |

**Key insight:** dnd-kit handles all pointer/touch sensor management, accessibility, and portal rendering. The only code needed is `useDraggable`, `useDroppable`, `DragOverlay`, and an `onDragEnd` handler.

---

## Common Pitfalls

### Pitfall 1: EncounterCombatantRow `creature_ref` mapped as empty string for hazards

**What goes wrong:** Existing `loadEncounterCombatants` maps `creature_ref` with `?? ''` fallback. Hazard rows have `creature_ref = NULL`. Code that checks `if (c.creatureRef)` would pass for `''` (falsy in TS string coercion but `'' !== null`). Actually `''` is falsy — so `if (c.creatureRef)` would be false for hazard rows. This is correct behavior. But it must be intentional.

**How to avoid:** When reading combatants, check `c.isHazard` to branch hazard vs creature logic — do not use `c.creatureRef` as the hazard discriminator.

### Pitfall 2: XP calculation for hazards uses `calculateCreatureXP`, not `calculateXP`

**What goes wrong:** `calculateXP` (the encounter-level function) takes `levels[]` and `hazards[]` separately. For individual combatant XP row display, the code uses `calculateCreatureXP(adjustedLevel, partyLevel)`. Hazards have no weak/elite tier — always use base `creatureLevel` with no adjustment.

**How to avoid:** For hazard rows, `adjustedLevel = c.creatureLevel` (no tier adjustment). Pass to `calculateCreatureXP(c.creatureLevel, partyLevel)` same as creatures.

### Pitfall 3: DragOverlay `activeItem` state not cleared on drag cancel

**What goes wrong:** If `onDragStart` sets `activeItem` state but `onDragEnd` only runs on successful drops, `activeItem` stays set and the ghost re-appears.

**How to avoid:** `onDragEnd` fires for ALL drag terminations (drop, cancel, ESC). Always clear `activeItem` in `onDragEnd` regardless of whether `over` is set.

### Pitfall 4: Split mode — `CombatControls` / `TurnControls` write to global stores

**What goes wrong:** `CombatControls` calls `useCombatTrackerStore.getState().startCombat()` which writes to the global tracker store. In split mode, starting combat in the left column would affect the right column's CombatControls display.

**How to avoid:** In split mode, the two columns are read-only views of their tab snapshots. Mutating actions (Start, End, Next Turn) are NOT wired up in split mode — or they always operate on the currently "focused" column's tab. The context decision (CONTEXT.md §D) does not mention disabling controls in split mode, so the expected behavior is: each column's controls operate on that column's tab. This requires `setActiveTab` to be called before the mutation — or the column must operate on a locally-scoped copy of tracker state derived from the tab snapshot.

**Recommended approach:** When user clicks Start/End/Next in a split column, call `setActiveTab(tab.id)` first (which saves the other tab's snapshot), then dispatch the action. This is the minimal-change approach.

### Pitfall 5: `saveEncounterCombatants` SQL INSERT missing new columns

**What goes wrong:** `saveEncounterCombatants` in `shared/api/encounters.ts` has a hard-coded INSERT with a column list that does not include `is_hazard` / `hazard_ref`. Hazard rows would be saved without these columns (SQLite uses defaults — `is_hazard=0`, `hazard_ref=NULL`), losing the hazard identity on re-load.

**How to avoid:** Update the INSERT in `saveEncounterCombatants` to include `is_hazard` and `hazard_ref` columns. Update `EncounterCombatantRow` interface to add these fields (optional / with defaults). Update all call sites that construct `EncounterCombatantRow[]`.

### Pitfall 6: Middle panel's `CreatureSearchSidebar` currently calls `addCreatureToDraft` / `addHazardToDraft` on the `useEncounterBuilderStore` (draft store, not encounters store)

**What goes wrong:** `CreatureSearchSidebar` in its current form adds to the encounter BUILDER draft (the pre-save working buffer), not to a saved encounter in SQLite. For the 3-panel redesign, the add-to-encounter logic must instead call `saveEncounterCombatants` (the same `handleAdd` function from `EncounterCreatureSearchPanel`).

**How to avoid:** When adapting `CreatureSearchSidebar` for the middle panel, pass `handleAdd` and `handleAddHazard` callbacks as props from `EncounterEditor` (which knows the selected `encounterId`). The sidebar should NOT call `useEncounterBuilderStore` in this context.

---

## Code Examples

### New Migration File

```sql
-- Source: pattern from 0008_encounter_persistence.sql + 0014_hazards.sql
-- File: src/shared/db/migrations/0020_encounter_hazard_columns.sql
ALTER TABLE encounter_combatants ADD COLUMN is_hazard INTEGER NOT NULL DEFAULT 0;
ALTER TABLE encounter_combatants ADD COLUMN hazard_ref TEXT;
```

### Updated EncounterCombatantRow type (shared/api/encounters.ts)

```typescript
export interface EncounterCombatantRow {
  id: string
  encounterId: string
  creatureRef: string      // empty string for hazards (NULL in DB)
  displayName: string
  initiative: number
  hp: number
  maxHp: number
  tempHp: number
  isNPC: boolean
  weakEliteTier: 'normal' | 'weak' | 'elite'
  creatureLevel: number
  sortOrder: number
  isHazard: boolean        // NEW
  hazardRef: string | null // NEW
}
```

### Updated EncounterCombatant entity type

```typescript
// src/entities/encounter/model/types.ts
export interface EncounterCombatant {
  id: string
  encounterId: string
  creatureRef: string
  displayName: string
  initiative: number
  hp: number
  maxHp: number
  tempHp: number
  isNPC: boolean
  weakEliteTier: 'normal' | 'weak' | 'elite'
  creatureLevel: number
  sortOrder: number
  isHazard?: boolean       // NEW
  hazardRef?: string | null // NEW
}
```

### DndContext + DragOverlay in EncountersPage

```typescript
// Source: @dnd-kit/core API (verified in project: useDraggable, useDroppable, DragOverlay confirmed)
import { DndContext, DragOverlay, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'

// State:
const [activeDragData, setActiveDragData] = useState<DragData | null>(null)

// Handlers:
function handleDragStart(event: DragStartEvent) {
  setActiveDragData(event.active.data.current as DragData)
}
function handleDragEnd(event: DragEndEvent) {
  setActiveDragData(null)
  if (!event.over || event.over.id !== 'encounter-drop-zone') return
  if (!selectedId) {
    // show "Select an encounter first" tooltip
    return
  }
  const data = event.active.data.current as DragData
  if (data.type === 'creature') handleAdd(data.row, data.tier)
  if (data.type === 'hazard') handleAddHazard(data.hazard)
}
```

### Split Toggle Button in EncounterTabBar

```typescript
// Source: pattern from existing EncounterTabBar + Columns2 lucide icon (verified present)
import { Columns2 } from 'lucide-react'
const splitMode = useEncounterTabsStore((s) => s.splitMode)
const toggleSplitMode = useEncounterTabsStore((s) => s.toggleSplitMode)

// In JSX (flush right, after the "+" button):
{openTabs.length >= 2 && (
  <div className="ml-auto border-l border-border/30 flex items-center px-1">
    <button
      onClick={toggleSplitMode}
      title={splitMode ? 'Exit split view' : 'Split view'}
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded transition-colors',
        splitMode
          ? 'bg-primary/20 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      <Columns2 className="w-4 h-4" />
    </button>
  </div>
)}
```

### Split Mode State in encounter-tabs-store.ts

```typescript
// Add to EncounterTabsState interface:
splitMode: boolean
toggleSplitMode: () => void

// Add to store implementation:
splitMode: false,
toggleSplitMode: () => {
  set((state) => {
    state.splitMode = !state.splitMode
  })
},

// Auto-disable split when tabs drop below 2:
closeTab: (tabId) => {
  // ... existing close logic ...
  if (get().openTabs.length < 2) {
    set((state) => { state.splitMode = false })
  }
},
```

---

## Runtime State Inventory

> Not a rename/refactor phase. This section is omitted.

---

## Environment Availability

> Step 2.6: SKIPPED (no new external dependencies — all required libraries already installed in project).

---

## Validation Architecture

> `nyquist_validation: false` in `.planning/config.json` — section omitted per spec.

---

## Open Questions

1. **Split mode: how do CombatControls/TurnControls mutate state for a non-active tab?**
   - What we know: `CombatControls.handleStart` calls `useCombatTrackerStore.getState().startCombat()` which mutates global store. Global store is synced to `activeTabId`.
   - What's unclear: Should clicking Start in the right column auto-switch `activeTabId` to tab[1]? The CONTEXT.md says "each half has its own... combat controls" and "each encounter tracks its own round/turn independently" — implying yes, each column's controls mutate that tab's state.
   - Recommendation: The simplest correct approach is: any action in a split column first calls `setActiveTab(tab.id)` to make it active (saves the other tab snapshot), then the action fires against global store. Visual focus indicator (subtle border highlight on active column) may help orient the DM.

2. **`CreatureSearchSidebar` prop interface for the middle panel**
   - What we know: Current `CreatureSearchSidebar` is self-contained, calls `useEncounterBuilderStore` for adding to draft. It has no props.
   - What's unclear: Should it be refactored in place (add optional callback props, fall back to store calls), or forked into a new `EncounterSearchPanel` component?
   - Recommendation: Add optional `onAddCreature` / `onAddHazard` callback props to `CreatureSearchSidebar`. If provided, call them instead of the builder store. This avoids code duplication and keeps the component in the right FSD layer.

3. **`handleAdd` extract to shared utility for EncounterEditor**
   - What we know: The `handleAdd` logic in `EncounterCreatureSearchPanel` (compute HP delta, create EncounterCombatantRow, saveEncounterCombatants, setEncounterCombatants) will need to move to `EncounterEditor` since `EncounterCreatureSearchPanel` is being removed.
   - Recommendation: Move `handleAdd` / `handleAddHazard` up to `EncounterEditor` level, pass as callbacks to `CreatureSearchSidebar` via props. `EncounterEditor` is the natural owner since it knows `encounterId` and `currentCombatants`.

---

## Sources

### Primary (HIGH confidence)

- `@dnd-kit/core` source — `useDraggable`, `useDroppable`, `DragOverlay`, `DndContext` confirmed present via `node -e "import('@dnd-kit/core')"` (verified live in project, version 6.3.1)
- `lucide-react` — `Columns2` confirmed present via `node -e "require('lucide-react')"` against installed version 0.564.0
- SQLite `ALTER TABLE ADD COLUMN` semantics — verified against SQLite documentation: adding columns with `NOT NULL DEFAULT` and nullable TEXT columns are both supported without table rebuild
- All referenced source files read directly from codebase

### Secondary (MEDIUM confidence)

- dnd-kit `DragOverlay` portal behavior (ghost renders outside scroll containers) — inferred from dnd-kit architecture; consistent with combat page DndContext usage in this codebase
- Split mode "activate tab before action" pattern — derived from existing `setActiveTab` behavior in `encounter-tabs-store.ts` (saves snapshot on switch)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified installed in package.json and importable
- Architecture patterns: HIGH — all source files read; patterns derived directly from existing code
- Pitfalls: HIGH for SQLite migration and store patterns; MEDIUM for split-mode combat control interaction (no prior split mode in codebase)
- dnd-kit usage: HIGH — APIs verified, existing usage in CombatPage (`DndContext`, `useDroppable`) reviewed

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable tech stack)
