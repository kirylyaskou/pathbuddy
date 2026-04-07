---
phase: 16
slug: encounter-persistence
status: approved
shadcn_initialized: true
preset: none
created: 2026-04-02
---

# Phase 16 — UI Design Contract

> Visual and interaction contract for Encounter Persistence.
> Encounters page becomes a persistent encounter manager — split layout, creature list editor, Load into Combat flow.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (already initialized) |
| Preset | none |
| Component library | Radix UI (via shadcn) |
| Icon library | lucide-react |
| Font | Inter (sans), JetBrains Mono (mono) |

---

## Spacing Scale

Inherits existing Tailwind 4 4px-base scale. No new tokens introduced.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px (p-1) | Icon gaps, tier badge padding |
| sm | 8px (p-2) | List row padding, tight panels |
| md | 16px (p-4) | Panel content padding |
| lg | 24px (p-6) | Major section gaps |
| xl | 32px (p-8) | Page-level (not used here) |
| 2xl | 48px | Not used in this phase |
| 3xl | 64px | Not used in this phase |

Exceptions: Encounter list rows use `px-3 py-2` (12px/8px) — matches existing `EncounterCreatureList` row density. Creature rows in editor use `px-2 py-1.5` — matches existing `bg-secondary/30` row pattern.

---

## Typography

Inherits existing app type scale (Inter / JetBrains Mono).

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px (text-sm) | 400 | 1.5 |
| Label / metadata | 12px (text-xs) | 500 | 1.4 |
| Section header | 10px (text-[10px] uppercase tracking-wider) | 500 | 1.4 |
| Encounter name (list row) | 14px (text-sm) | 500 | 1.4 |
| Encounter name (editor header) | 16px (text-base) | 600 | 1.4 |
| Inline create input | 13px (text-sm) | 400 | 1.4 |
| XP / level values | 12px (text-xs font-mono) | 400 | 1.4 |
| Tier button labels | 10px (text-[10px]) | 500 | 1 |

---

## Color

Inherits Golden Parchment OKLCH theme (light + dark modes from `globals.css`). No new color values defined.

| Role | Token | Usage |
|------|-------|-------|
| Dominant (60%) | `bg-background` | Page background |
| Secondary (30%) | `bg-secondary`, `bg-secondary/30`, `bg-secondary/50` | List hover, creature rows, selected row |
| Accent (10%) | `text-primary`, `bg-primary`, `border-primary` | Selected encounter indicator, Load CTA, Normal [+] button |
| Destructive | `text-destructive`, `bg-destructive` | Reset button label, confirm dialog destructive action |

Accent (`--primary`) reserved for:
- Left border on selected encounter row (`border-l-2 border-primary`)
- `[+]` Normal add button (`bg-primary text-primary-foreground`)
- "Load into Combat" primary CTA button
- LIVE pulse dot on running encounter

**Tier button colors** (matches existing badge pattern in `EncounterCreatureList`):
- `[W]` Weak: `bg-muted text-muted-foreground`
- `[+]` Normal: `bg-primary text-primary-foreground`
- `[E]` Elite: `bg-primary/20 text-primary`

**LIVE indicator** (`is_running = 1`): inline dot `w-2 h-2 rounded-full bg-green-500 animate-pulse` right-aligned in list row.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | "Load into Combat" |
| Reset button | "Reset" |
| Reset confirm title | "Reset Encounter?" |
| Reset confirm body | "All creatures return to full HP. Conditions and round state are cleared." |
| Reset confirm action | "Reset" (destructive) |
| Load-while-combat title | "Discard Current Combat?" |
| Load-while-combat body | "An active combat is in progress. Loading this encounter will end it." |
| Load-while-combat cancel | "Keep Current" |
| Load-while-combat confirm | "Discard & Load" |
| New encounter placeholder | "Encounter name..." |
| Empty state (no encounters) | "No saved encounters" |
| Empty state body | "Press + to create your first encounter." |
| Empty state (no selection) | "Select an encounter to edit its creature list." |
| Creature search placeholder | "Search creatures..." |
| Add creature toggle | "+ Add Creature" |
| Panel loading | "Loading..." |

---

## Layout Contract

### Top Bar (unchanged from current)

```
+----------------------------------------------------------+
| [PartyConfigBar — full width]                            |
+----------------------------------------------------------+
| [XPBudgetBar — px-4 py-2 border-b border-border/50]      |
+----------------------------------------------------------+
```

XP Budget Bar re-calculates from **selected encounter's** creature list. When no encounter is selected, shows 0 XP / empty state.

### Main Area — ResizablePanelGroup (horizontal)

```
+----------------------+-------------------------------------+
|  LEFT PANEL          |  RIGHT PANEL                        |
|  defaultSize: 22     |  defaultSize: 78                    |
|  minSize: 15         |  minSize: 50                        |
|  maxSize: 35         |                                     |
+----------------------+-------------------------------------+
```

### Left Panel: Saved Encounters List

```
+----------------------+
| Encounters       [+] |  ← text-xs uppercase tracking-wider muted + ghost icon button
+──────────────────────+
| [inline input]       |  ← appears on [+] click, auto-focused, h-7 text-sm
+──────────────────────+  ← border-b border-border/50
|                      |
| My Dungeon       ● --|  ← ● = w-2 h-2 bg-green-500 animate-pulse (is_running=1)
| ▶ Goblin Ambush      |  ← selected: bg-secondary/70 border-l-2 border-primary font-medium
| Tavern Brawl         |  ← unselected: hover:bg-secondary/40
| Boss Fight           |
|                      |
+----------------------+
```

- List in `ScrollArea` (flex-1)
- Each row: `flex items-center px-3 py-2 rounded-md cursor-pointer text-sm`
- Name: `flex-1 truncate`
- Long names: `truncate` with title attribute for full name
- Selected row: `bg-secondary/70 border-l-2 border-primary font-medium`

### Right Panel: Encounter Editor

**When no encounter selected:**
```
+----------------------------------------------+
|                                              |
|     Select an encounter to edit its          |
|          creature list.                      |
|    text-sm text-muted-foreground centered    |
|                                              |
+----------------------------------------------+
```

**When encounter selected:**
```
+----------------------------------------------+
| Goblin Ambush                           [⋮]  |  ← text-base font-semibold + optional menu
|                                              |
| [Load into Combat]   [Reset]                 |  ← h-8 buttons, gap-2
+──────────────────────────────────────────────+  ← border-b border-border/50
|  3 creatures                                 |  ← text-xs text-muted-foreground
+──────────────────────────────────────────────+
|  [Goblin]  Lv1        normal   40 XP    [×]  |  ← creature row
|  [Troll]   Lv5  [E]   elite   120 XP   [×]  |  ← tier badge if not normal
|  [Ghoul]   Lv3  [W]   weak     30 XP   [×]  |
+──────────────────────────────────────────────+
| [+ Add Creature  ▾]                          |  ← ghost sm button, toggles search panel
+──────────────────────────────────────────────+
| [Collapsible search panel — see below]       |
+----------------------------------------------+
```

**Creature row style:** `flex items-center gap-2 px-2 py-1.5 rounded-md bg-secondary/30 hover:bg-secondary/50 group`
- LevelBadge (existing component, size="sm")
- Tier badge: `text-[10px] px-1 rounded` — E: `bg-primary/20 text-primary`, W: `bg-muted text-muted-foreground`
- Name: `flex-1 text-sm font-medium truncate`
- XP: `text-xs font-mono text-muted-foreground`
- Remove [×]: `w-5 h-5 opacity-0 group-hover:opacity-100` (ghost icon button, existing pattern)

**Action buttons:**
- "Load into Combat": `Button variant="default" size="sm" className="h-8 text-sm"` — gold primary fill
- "Reset": `Button variant="outline" size="sm" className="h-8 text-sm text-destructive hover:text-destructive"`

### Collapsible Add Creature Panel

Triggered by `[+ Add Creature ▾]` ghost button. State: open/closed (local `useState`).

```
+----------------------------------------------+
| [+ Add Creature  ▴]                          |  ← chevron flips on open
+──────────────────────────────────────────────+
| [search icon] Search creatures...            |  ← h-8 Input with Search icon (pl-8)
+──────────────────────────────────────────────+
| ScrollArea — h-48 overflow-y-auto            |
| Goblin              Lv1  [W][+][E]           |  ← result row
| Goblin Warrior      Lv2  [W][+][E]           |
| Goblin Dog          Lv1  [W][+][E]           |
| HP preview on hover: HP 15→12 (−3) AC 15→13 |  ← text-[10px] text-muted-foreground
+----------------------------------------------+
```

**Search result row:** `flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/30`
- Name: `flex-1 text-sm truncate`
- Level: `text-xs text-muted-foreground font-mono`
- `[W][+][E]` button group: `flex gap-0.5`
  - Each button: `h-6 px-2 text-[10px] font-medium rounded`
  - W: `bg-muted text-muted-foreground hover:bg-muted/80`
  - +: `bg-primary text-primary-foreground hover:bg-primary/90`
  - E: `bg-primary/20 text-primary hover:bg-primary/30`

HP/AC preview line (same pattern as existing `CreatureSearchSidebar`):
- `text-[10px] text-muted-foreground px-2 -mt-0.5 mb-1`
- Only shown when tier ≠ normal

Panel stays open after each add (D-03). Dismiss via second click on `[+ Add Creature]` or `Escape` key.

---

## Dialogs

### Load into Combat — Confirm (when `isRunning = true`)

Uses existing `AlertDialog` from `src/shared/ui/alert-dialog.tsx`:
```
AlertDialogTitle:       "Discard Current Combat?"
AlertDialogDescription: "An active combat is in progress. Loading this encounter will end it."
AlertDialogCancel:      "Keep Current"
AlertDialogAction:      "Discard & Load"  (destructive variant)
```

### Reset Encounter — Confirm

```
AlertDialogTitle:       "Reset Encounter?"
AlertDialogDescription: "All creatures return to full HP. Conditions and round state are cleared."
AlertDialogCancel:      "Cancel"
AlertDialogAction:      "Reset"  (destructive variant)
```

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | ResizablePanelGroup, ResizablePanel, ResizableHandle | not required |
| shadcn official | Button, Input, ScrollArea | not required |
| shadcn official | AlertDialog (alert-dialog.tsx — existing) | not required |
| shadcn official | Badge (optional, for LIVE indicator if preferred) | not required |

No third-party registries. All components from existing shadcn installation.
LevelBadge is a project-local component (`src/shared/ui/level-badge`).

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS — all interactive elements have explicit copy; confirm dialogs specify title, body, and both action labels
- [x] Dimension 2 Visuals: PASS — layout mockups for all 3 states (no encounters, no selection, encounter selected); [W][+][E] button group specified; LIVE indicator specified; collapsible panel behavior specified
- [x] Dimension 3 Color: PASS — no new color values; all tokens reference existing design system; accent usage list is explicit and finite
- [x] Dimension 4 Typography: PASS — all roles mapped to concrete size/weight; no subjective descriptions
- [x] Dimension 5 Spacing: PASS — all spacing uses existing 4px-base Tailwind scale; exceptions documented (px-3 py-2 rows, h-6 tier buttons)
- [x] Dimension 6 Registry Safety: PASS — shadcn official only; AlertDialog confirmed at src/shared/ui/alert-dialog.tsx; no third-party blocks

**Approval:** approved 2026-04-02
