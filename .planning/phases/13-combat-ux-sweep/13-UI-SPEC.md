---
phase: 13
slug: combat-ux-sweep
status: approved
shadcn_initialized: true
preset: golden-parchment
created: 2026-04-02
---

# Phase 13 — UI Design Contract

> Visual and interaction contract for Combat UX Sweep. Covers condition picker redesign (CMB-07, CMB-08), HP controls redesign (CMB-09), Kill button verification (CMB-06), and persistent damage verification (CMB-10).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset | golden-parchment (OKLCH tokens) |
| Component library | radix |
| Icon library | lucide-react |
| Font | Inter (body), JetBrains Mono (numeric) |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing, button gaps |
| md | 16px | Default element spacing, popover padding |
| lg | 24px | Section padding |
| xl | 32px | Layout gaps |

Exceptions: none — all phase 13 components fit within existing scale

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.5 |
| Label | 10px | 500 | 1.2 |
| Tab text | 12px | 500 | 1.0 |
| Condition pill | 12px | 400 | 1.0 |
| Numeric value | 14px | 700 | 1.0 |
| Button text | 12px | 500 | 1.0 |

All labels use `uppercase tracking-wider text-muted-foreground` (existing pattern from HpControls).
Numeric values use `font-mono font-bold` (existing pattern).

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `var(--background)` | Popover/dialog surfaces |
| Secondary (30%) | `var(--secondary)` / `bg-secondary/30` | Condition pill backgrounds, input containers |
| Accent (10%) | `var(--primary)` gold | Active tab indicator, selected condition highlight |
| Destructive | `var(--destructive)` | Damage button, Kill button |
| Heal | `emerald-900/50` → `emerald-900/70` | Heal button (existing HpControls pattern) |
| TempHP | `blue-900/50` → `blue-900/70` | TempHP button (existing HpControls pattern) |

Accent reserved for: active tab underline, focused condition pill border

---

## Component Specifications

### 1. Condition Picker Redesign (CMB-07, CMB-08)

**Container:** `PopoverContent` with `w-80 p-0` (was `w-56`)

**Layout (list mode — no condition selected):**

```
┌──────────────────────────────────────┐
│ 🔍 Search conditions...             │
├──────────────────────────────────────┤
│ Persistent │ Death │ Abil │ Sens │…  │
├──────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐          │
│ │ fire │ │ cold │ │ acid │          │
│ ├──────┤ ├──────┤ ├──────┤          │
│ │ bleed│ │elect.│ │poison│          │
│ └──────┘ └──────┘ └──────┘          │
└──────────────────────────────────────┘
```

**Tab bar:**
- Component: shadcn `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent`
- 5 tabs: "Persistent", "Death", "Abilities", "Senses", "Other"
- Tab labels truncated from full group names (e.g. "Persistent Damage" → "Persistent")
- `TabsList` full width, `h-8`, `text-xs`
- Active tab uses default shadcn `data-[state=active]` styling

**Condition grid:**
- CSS Grid: `grid-cols-3 gap-1.5` inside each `TabsContent`
- Grid container: `p-2`
- Max height: `max-h-48 overflow-y-auto scrollbar-thin`

**Condition pill:**
- `px-2 py-1.5 rounded text-xs capitalize cursor-pointer`
- Default: `bg-secondary/30 hover:bg-secondary/50 border border-border/30`
- Already applied: `opacity-50 cursor-not-allowed` + check icon
- Text: condition slug with hyphens replaced by spaces

**Search mode:**
- Search input: `CommandInput` with `h-8 text-xs` (same as current)
- When search has text: tabs hidden, flat filtered grid replaces tab content
- Grid switches to full width showing all matching conditions across all groups
- Empty state: "No condition found." centered text

**Excluded groups (CMB-07):**
- Remove `Detection` group (`CONDITION_GROUPS.detection`: Observed, Hidden, Undetected, Unnoticed)
- Remove `Attitudes` group (`CONDITION_GROUPS.attitudes`: Hostile, Unfriendly, Friendly, Helpful, Indifferent)
- `groups` array reduced from 7 entries to 5

**Valued condition sub-view (no change):**
- Same layout as current: back button, condition name, +/- stepper, Apply button
- Renders inside the same `w-80` popover (more room than before)

**Persistent damage sub-view (no change):**
- Same layout: back button, dice formula input, Apply button

### 2. HP Controls Redesign (CMB-09)

**Current:** 3-column grid, each column has label + input + icon button

**New layout:**

```
┌─────────────────────────────────────────┐
│ ❤ 45 / 60              🛡 +12          │
│ ████████████████████░░░░░░░░            │
├─────────────────────────────────────────┤
│ ┌────────────┐  ┌─────────────────────┐ │
│ │            │  │ ⚔ Damage  ▼        │ │
│ │    [  0  ] │  ├─────────────────────┤ │
│ │            │  │ ✚ Heal              │ │
│ │            │  ├─────────────────────┤ │
│ │            │  │ 🛡 Temp HP          │ │
│ └────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────┘
```

**Layout container:**
- `flex gap-2 items-stretch` (replaces `grid grid-cols-3`)

**Input:**
- Single `Input` component, `type="number"`, `min={0}`
- `h-full w-20 text-center text-sm font-mono`
- Placeholder: `"0"`
- `onKeyDown`: Enter → apply damage (most common action)

**Action buttons stack:**
- `flex flex-col gap-1 flex-1`
- Each button: `h-7 text-xs justify-start gap-1.5 w-full`

**Damage button (split-button):**
- `flex` container with two parts:
  - Left (apply): `variant="destructive"`, icon `Swords` or `Minus`, label "Damage"
  - Right (type dropdown): `variant="destructive"`, icon `ChevronDown`, `w-7`
  - Visual separator: `border-l border-destructive-foreground/20` between parts
- Left side: `flex-1 rounded-r-none`
- Right side: `rounded-l-none w-7 px-0`
- Dropdown opens existing `Popover` + `Command` damage type picker (reuse `DAMAGE_TYPE_GROUPS`)
- Selected type shown as suffix text: "Damage (fire)" or just "Damage" if untyped

**Heal button:**
- `variant="secondary"`, classes `bg-emerald-900/50 hover:bg-emerald-900/70 text-emerald-300`
- Icon: `Plus`, label: "Heal"

**TempHP button:**
- `variant="secondary"`, classes `bg-blue-900/50 hover:bg-blue-900/70 text-blue-300`
- Icon: `Shield`, label: "Temp HP"

**IWR preview:**
- Same component as current, renders below the buttons stack when `damageType` is set and IWR data exists
- No visual changes needed

**State consolidation:**
- Replace `damageInput`, `healInput`, `tempHpInput` with single `hpInput` state
- Replace 3 handlers with single `handleAction(action: 'damage' | 'heal' | 'tempHp')` function
- `damageType` state stays as-is

### 3. Kill Button Verification (CMB-06)

**No visual changes.** Kill button already exists at `DyingCascadeDialog.tsx:211-222`:
- `variant="destructive"`, `size="sm"`, full-width
- Text: "Kill (no check)"
- Action: sets dying to death threshold, triggers dead state

**Verification only:** Confirm the button works end-to-end (clicking Kill → combatant shows as dead).

### 4. Persistent Damage Modal Verification (CMB-10)

**No visual changes.** `PersistentDamageDialog.tsx` already implements:
- Condition list with formula display
- Auto/manual flat-check mode toggle
- Damage application on failure
- Condition removal on success (d20 >= 15)
- Per-condition results display

**Verification only:** Confirm the dialog opens at turn end, rolls correctly, and updates combatant state.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Condition picker trigger | "+ Condition" (unchanged) |
| Condition search placeholder | "Search conditions..." (unchanged) |
| Tab labels | "Persistent" / "Death" / "Abilities" / "Senses" / "Other" |
| Empty search | "No condition found." |
| Damage button | "Damage" or "Damage (fire)" when type selected |
| Heal button | "Heal" |
| TempHP button | "Temp HP" |
| HP input placeholder | "0" |
| Kill button | "Kill (no check)" (unchanged) |
| Persistent damage title | "Persistent Damage — {name}" (unchanged) |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Tabs, TabsList, TabsTrigger, TabsContent, Popover, PopoverTrigger, PopoverContent, Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty, Button, Input, Dialog | not required |

No third-party registry blocks. All components already installed in the project.

---

## Interaction Contracts

### Condition Picker

| Action | Result |
|--------|--------|
| Click "+ Condition" button | Popover opens showing tabs + grid |
| Type in search | Tabs hidden, flat filtered grid shown |
| Clear search | Tabs restored |
| Click tab | Tab content switches, grid shows that group's conditions |
| Click non-valued condition pill | Condition applied immediately, popover closes |
| Click valued condition pill | Switches to value stepper sub-view |
| Click persistent damage pill | Switches to dice formula sub-view |
| Click already-applied pill | Nothing (disabled) |

### HP Controls

| Action | Result |
|--------|--------|
| Type number + press Enter | Applies damage (default action) |
| Type number + click Damage | Applies damage with IWR if type selected |
| Type number + click Heal | Heals combatant |
| Type number + click Temp HP | Sets temp HP (takes max of current and new) |
| Click dropdown arrow on Damage | Opens damage type picker |
| Select damage type | Dropdown closes, button label updates to "Damage (type)" |
| Input cleared after any action | Yes, always |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-02
