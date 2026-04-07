# UI-SPEC: Phase 15 — Combat Tracker Layout Redesign

**Phase:** 15 — Combat Tracker Layout Redesign
**Requirements:** CMBL-01, CMBL-02, CMBL-03, CMBL-04
**Date:** 2026-04-02
**Status:** Ready for implementation

---

## 1. Overview

The combat tracker page transitions from a 3-panel layout of [Initiative | Detail | Bestiary] to a new layout of [Bestiary | Initiative+Detail | Stat Card]. This gives the DM simultaneous access to creature search (left), full combat controls (center), and the selected creature's stat block (right) — no panel switching required.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [Bestiary Search]    │  [Initiative + Detail]       │  [Stat Card]        │
│       22%             │           38%                │       40%           │
│                       │                              │                     │
│  [ Search box ]       │  [Swords] Combat  [+PC][Sta] │  ┌─────────────┐   │
│  Tier: Weak Norm Elite│  ─────────────────────────── │  │ Creature    │   │
│  ─────────────────────│  ┌──────────────────────────┐│  │ StatBlock   │   │
│  Creature Card [+Add] │  │ InitiativeList           ││  │             │   │
│  Creature Card [+Add] │  │  ● Zombie Brute   HP 40  ││  │ HP  AC  Fort│   │
│  Creature Card [+Add] │  │  ● Skeleton Guard HP 15  ││  │ Strikes     │   │
│  ...                  │  │  ○ Lyra (PC) init 18     ││  │ Abilities   │   │
│                       │  ├──────────────────────────┤│  │ ...         │   │
│                       │  │ CombatantDetail          ││  └─────────────┘   │
│                       │  │  [Skull] Zombie Brute    ││                     │
│                       │  │  HP: [━━━━━━] 40/40      ││  (empty state on   │
│                       │  │  Damage/Heal/TempHP      ││   first load)      │
│                       │  │  Conditions: [+Add]      ││                     │
│                       │  ├──────────────────────────┤│                     │
│                       │  │ [◀ Previous] [Next Turn▶]││                     │
│                       │  └──────────────────────────┘│                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Panel Layout

### Outer horizontal ResizablePanelGroup

| Panel | Default | Min | Max |
|-------|---------|-----|-----|
| Left — Bestiary | 22% | 16% | 32% |
| Center — Initiative+Detail | 38% | 28% | — |
| Right — Stat Card | 40% | 28% | — |

All three panels are always visible — no collapse, no tabs.

### Center panel: nested vertical ResizablePanelGroup (`id="combat-center-vertical"`)

| Sub-panel | Default | Min |
|-----------|---------|-----|
| Top — InitiativeList | 35% | 20% |
| Bottom — CombatantDetail + TurnControls | 65% | 30% |

---

## 3. Left Panel — Bestiary Search

**Component:** `BestiarySearchPanel` (unchanged internally)

```
┌──────────────────────────────────────┐
│ 🔍 [Search bestiary...         ]     │
│ Tier: [Weak] [Normal] [Elite]        │
│ ────────────────────────────────     │
│ ┌────────────────────────────────┐   │
│ │ Creature Card (compact)  [+]   │   │
│ │ Lv 5 · Zombie Brute            │   │
│ │ HP → 120 (+20) | AC → 22 (+2)  │   │
│ ├────────────────────────────────┤   │
│ │ Creature Card (compact)  [+]   │   │
│ │ Lv 3 · Skeleton Guard          │   │
│ └────────────────────────────────┘   │
│  (scroll continues...)               │
└──────────────────────────────────────┘
```

- Exact same UI as current right panel — no visual changes
- The `+ Add` button adds the creature to the initiative list immediately (no modal)
- `BestiarySearchPanel` fills the full panel height with `flex flex-col h-full`

---

## 4. Center Panel — Initiative + Detail

### 4a. Center Header Bar

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ⚔  Combat             [Start ▶]                            [+ Add PC]   │
│ ─────────────────────── border-b border-border/50 ─────────────────────  │
```

**When combat running:**
```
│ ⚔  [R2 T3]                         [■ End]             [+ Add PC]      │
```

- `CombatControls` rendered first (contains Swords icon, badge/label, Start/End button with its own internal flex layout)
- `AddPCDialog` rendered at the right of the same row
- The header is compact: `shrink-0`, no scrolling
- **Implementation note:** `CombatControls` renders its own `border-b border-border/50`. The AddPCDialog trigger button should be placed inside the same flex row. The outer wrapper carries no additional border (CombatControls's own border-b serves as the row separator).

Outer wrapper for the header row:
```tsx
<div className="flex items-center shrink-0">
  <div className="flex-1"><CombatControls /></div>
  <div className="px-2 py-1.5 border-b border-border/50"><AddPCDialog /></div>
</div>
```

### 4b. Top Sub-panel — Initiative List

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ● ⠿  Zombie Brute      [HP 40 ████░░░] [Frightened 2]  [✕]            │  ← active (highlighted)
│ ○ ⠿  Skeleton Guard    [HP 15 ██░░░░░]                   [✕]            │
│ ○ ⠿  Lyra (PC)         init 18                            [✕]            │
│ ○ ⠿  Gareth (PC)       init 14                            [✕]            │
│                                                                           │
│  (Add creatures from bestiary or add PCs to begin — when empty)         │
└──────────────────────────────────────────────────────────────────────────┘
```

- `InitiativeList` unchanged — receives `selectedId` + `onSelect` from CombatPage
- Selected row has a distinct highlight style (already implemented in `InitiativeRow`)
- Active turn row has a distinct pulse/indicator (already implemented)
- Drag handles (⠿) allow reordering via @dnd-kit (already implemented)
- Scrollable via `ScrollArea`

### 4c. Vertical ResizableHandle

- `<ResizableHandle withHandle />` — draggable divider between initiative list and detail

### 4d. Bottom Sub-panel — Combatant Detail + Turn Controls

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [💀] Zombie Brute                                                       │
│        Initiative: 22 — NPC                                              │
│  ─────────────────────────────────────────────────────────               │
│  HP:  [━━━━━━━━━━━━━━━━━━━━━━━━] 40/40 +0 temp                         │
│       [    Amount: [   ] ]  [Damage] [Heal] [TempHP]                    │
│  ─────────────────────────────────────────────────────────               │
│  Conditions:                                                             │
│  [Frightened 2 ✕] [+ Add Condition]                                     │
│                                                                           │
│  (No combatant selected — "Select a combatant to view details")         │
│                                                                           │
│ ─────────────────────────────────────────────────────────────────────── │
│  [◀ Previous Turn]                           [Next Turn ▶]              │  ← TurnControls (only when running)
└──────────────────────────────────────────────────────────────────────────┘
```

- `CombatantDetail` fills the flex-1 area with `overflow-y-auto`
- `TurnControls` is pinned to the bottom of the sub-panel (`shrink-0`, renders null when combat not running)
- When nothing is selected: centered placeholder `"Select a combatant to view details"` in `text-muted-foreground`

Bottom sub-panel structure:
```tsx
<div className="flex flex-col h-full">
  {selectedId ? (
    <div className="flex-1 min-h-0">
      <CombatantDetail combatantId={selectedId} />
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <p className="text-sm">Select a combatant to view details</p>
    </div>
  )}
  <TurnControls />   {/* border-t border-border/50, renders null when !isRunning */}
</div>
```

---

## 5. Right Panel — Creature Stat Card

### 5a. Empty State (first load, no NPC ever selected)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│                         🛡                                               │
│                  (Shield icon, opacity-30)                                │
│                                                                           │
│              Select a creature to view its stat block                    │
│                    (text-sm text-muted-foreground)                       │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

- `Shield` icon from lucide-react, `w-8 h-8 opacity-30`
- One line of text below, `text-sm text-muted-foreground`
- Centered vertically and horizontally

### 5b. Loading State

```
│              Loading...                                                   │
│              (text-sm text-muted-foreground)                             │
```

Shown while fetching stat block data from SQLite (typically < 50ms). No spinner needed.

### 5c. Loaded State — Creature Stat Block

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────┐  │
│ │ [Lv 8]  Zombie Brute                                                │  │
│ │          LARGE UNDEAD                                               │  │
│ │          [Undead] [Mindless] [Zombie]                               │  │
│ ├─────────────────────────────────────────────────────────────────────┤  │
│ │  HP    AC    Fort   Ref    Will   Perception                        │  │
│ │  175   21    +17    +11    +13    +11                               │  │
│ │  ─────────────────────────────────────────────────────             │  │
│ │  IWR: immune [poison] [death] | weak [positive 10]                 │  │
│ │  ─────────────────────────────────────────────────────             │  │
│ │  Strikes                                                            │  │
│ │  ▸ Fist +17 | 2d6+9 bludgeoning                                   │  │
│ │  ▸ Jaws +17 | 2d8+9 piercing                                      │  │
│ │  ─────────────────────────────────────────────────────             │  │
│ │  Abilities                                                          │  │
│ │  ▸ Slow [1 action] ...                                             │  │
│ │  ▸ Feast on the Fallen [reaction] ...                              │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│  (scrollable — overflow-y-auto on right panel wrapper)                    │
└──────────────────────────────────────────────────────────────────────────┘
```

- `CreatureStatBlock` component (Phase 14 polished version) dropped in as-is
- `className="rounded-none border-x-0 border-t-0"` to make it flush with the panel (no card border visual conflict)
- Right panel wrapper: `h-full overflow-y-auto` so the stat block scrolls within the panel
- Gold left border accent (`border-l-pf-gold border-l-[3px]`) from `CreatureStatBlock`'s own className is preserved

### 5d. Sticky Behavior

- Clicking an NPC row → right panel loads that NPC's stat block
- Clicking a PC row → right panel **keeps showing the last NPC stat block** (no clear, no placeholder)
- Clicking another NPC → right panel updates to the new NPC's stat block
- Cache: up to 10 stat blocks in memory (Map keyed by creatureRef), prevents redundant SQLite round-trips

---

## 6. Color & Token Reference

| Element | Token |
|---------|-------|
| Panel backgrounds | `bg-background` (implicit) |
| Panel separator handles | `ResizableHandle withHandle` (existing shadcn component) |
| Header row border | `border-b border-border/50` (from `CombatControls` internal) |
| Empty state icon | `text-muted-foreground opacity-30` |
| Empty state text | `text-sm text-muted-foreground` |
| Stat block gold accent | `border-l-pf-gold` (existing `CreatureStatBlock` class) |
| Stat block background | `card-grimdark` (existing `CreatureStatBlock` class) |
| NPC icon | `text-destructive` / `bg-destructive/15` (Skull) |
| PC icon | `text-primary` / `bg-primary/15` (User) |

---

## 7. Interaction States

### Selecting a combatant
1. DM clicks an `InitiativeRow` in the top center sub-panel
2. `onSelect(id)` fires → `setSelectedId(id)` + stat block fetch starts
3. Bottom center sub-panel immediately renders `CombatantDetail` for the selected combatant
4. Right panel shows "Loading..." if NPC and cache miss, then transitions to stat block
5. If PC selected: bottom shows PC's `CombatantDetail`; right panel unchanged (sticky)

### Adding creature from bestiary
1. DM types in left panel search box → creatures filter immediately (200ms debounce)
2. DM clicks `[+ Add]` on a creature card
3. Creature appears as a new row at the bottom of the initiative list in the top center sub-panel
4. No modal, no dialog — direct add (existing behavior, unchanged)

### Turn advancement
1. DM clicks `[Next Turn ▶]` in bottom center sub-panel footer
2. Active combatant indicator moves to next row in the initiative list
3. Condition auto-decrement fires (engine ConditionManager)
4. `PersistentDamageDialog` triggers if the ending combatant has persistent damage

### Combat start / end
1. `[Start ▶]` button in center header bar → sorts initiative, combat begins
2. `TurnControls` becomes visible (renders null when not running)
3. `[■ End]` button ends combat, clears combatants

---

## 8. Edge Cases

| Scenario | Behavior |
|----------|----------|
| No combatants in tracker | Center initiative list shows "Add creatures from bestiary or add PCs to begin." |
| No combatant selected | Bottom center shows "Select a combatant to view details"; right panel shows empty state (on first load) or last NPC stat block (if one was selected before) |
| PC selected (no creatureRef) | Bottom center shows PC's HP/conditions; right panel keeps last NPC stat block |
| Combatant removed while selected | `CombatantDetail` shows "Combatant not found"; `selectedId` stays set until next selection |
| Stat block fetch error | Right panel stays on last loaded stat block (or empty state); no crash |
| Very long creature stat block | Right panel scrolls vertically within the panel (`overflow-y-auto`) |
| Narrow window | Panel minSize constraints prevent collapse below 16%/28%/28% |

---

## 9. What Does NOT Change

- `BestiarySearchPanel` internal UI — search box, tier selector, creature cards, `+ Add` button
- `InitiativeList` internal UI — rows, drag handles, condition badges, active highlight
- `CombatantDetail` internal UI — HP bar, damage/heal controls, condition section
- `TurnControls` — Previous / Next Turn buttons
- `CombatControls` — Start/End buttons, round/turn badge
- `AddPCDialog` — modal content, PC name input
- `CreatureStatBlock` — the entire polished stat block component from Phase 14
- `PersistentDamageDialog` — remains at the top of CombatPage, unchanged

---

*UI-SPEC: Phase 15 — Combat Tracker Layout Redesign*
*Created: 2026-04-02*
