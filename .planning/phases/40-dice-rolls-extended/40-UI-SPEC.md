---
phase: 40
slug: dice-rolls-extended
status: approved
shadcn_initialized: true
preset: none
created: 2026-04-04
---

# Phase 40 — UI Design Contract

> Visual and interaction contract for Phase 40: Dice Rolls Extended + Spells Table Overhaul + Item→Spell Link.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui |
| Preset | none (custom Golden Parchment theme) |
| Component library | Radix UI (via shadcn) |
| Icon library | lucide-react |
| Font | Inter (sans), JetBrains Mono (mono) |

---

## Spacing Scale

Declared values (multiples of 4, Tailwind 4 utilities):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge padding (`px-1 py-0.5`) |
| sm | 8px | Compact element spacing (`gap-2`, `px-2`) |
| md | 16px | Default element spacing (`px-3`, `gap-4`) |
| lg | 24px | Section padding (`p-4` = 16px, section gaps) |
| xl | 32px | Layout gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

Exceptions: Table rows use `h-9` (36px) to match ItemsTable row height.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 13px (`text-[13px]`) | 400 | 1.5 |
| Label | 10px (`text-[10px]`) | 600 | 1 (badge uppercase) |
| Table header | 12px (`text-xs`) | 500 | — |
| Section header | 13px (`text-[13px]`) | 600 | — |
| Heading | 14px (`text-sm font-semibold`) | 600 | 1.4 |
| Mono values | 12px–14px (`font-mono`) | 400–600 | — |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `bg-background` — dark espresso `oklch(0.14 0.025 50)` | Page background |
| Secondary (30%) | `bg-card` / `bg-secondary/30` — slightly lighter espresso | Table header, hover states, cards |
| Accent (10%) | `text-primary` / `bg-primary/10` — rich gold `oklch(0.72 0.18 75)` | Clickable names, trait badges, action cost mono |
| Destructive | `text-destructive` | Not used in this phase |

Accent reserved for: clickable names (hover:text-primary), trait badge background (bg-primary/10), action cost glyphs (text-primary font-mono), SpellRankSection chevron/count.

### Tradition badge colors (existing, carry forward)
```
arcane:  bg-blue-500/20 text-blue-300 border-blue-500/40
divine:  bg-yellow-500/20 text-yellow-300 border-yellow-500/40
occult:  bg-purple-500/20 text-purple-300 border-purple-500/40
primal:  bg-green-500/20 text-green-300 border-green-500/40
```

### pf-blood color
Damage formulas in table: `text-pf-blood` — `oklch(0.55 0.22 25)` (dark mode)

---

## Component Specs

### SpellsTable — column widths

Sticky header + scroll body, no virtualization (rows grouped by rank section, counts small per rank):

```
Header: flex items-center gap-2 px-3 h-9 bg-card border-b border-border/40 shrink-0 text-xs text-muted-foreground font-medium
Row:    flex items-center gap-2 px-3 h-9 border-b border-border/20 hover:bg-secondary/30 transition-colors cursor-pointer
```

| Column | Flex | Notes |
|--------|------|-------|
| Name | flex-[22] | `font-medium text-[13px] truncate hover:text-primary hover:underline` |
| Actions | flex-[5] shrink-0 | `font-mono text-primary text-[13px]` — ◆/◆◆/◆◆◆/↺/◇ |
| Save | flex-[8] | `text-[12px] capitalize text-muted-foreground` — fortitude/reflex/will or `—` |
| Damage | flex-[10] | `font-mono text-[12px] text-pf-blood` — "6d6 fire" or `—` |
| Traditions | flex-[14] | colored badges, max 2 shown, `+N` overflow |
| Traits | flex-[16] | gold badges `bg-primary/10 text-primary border-primary/20`, max 3 shown, `+N` overflow |

Focus Spells tab: replace Traditions column with Source (`flex-[14] text-[12px] text-muted-foreground truncate`).

### SpellRankSection

Collapsible section wrapping one rank's SpellsTable:

```
Header row: flex items-center justify-between px-3 py-2 cursor-pointer
            hover:bg-secondary/40 border-b border-border/30
            bg-secondary/20  (slightly distinct from table rows)

Left:  "Rank N" or "Cantrips" — text-sm font-semibold
       + count badge: text-xs text-muted-foreground ml-2
Right: ChevronDown/ChevronRight w-4 h-4 text-muted-foreground
       (rotates 180deg when open — transition-transform duration-150)
```

Uses shadcn `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent`.

### SpellFilterPanel toolbar

```
Toolbar container: p-3 border-b border-border/50 space-y-2 shrink-0
```

Row 1 — Search input (full width, pl-8 with Search icon, h-8 text-sm)

Row 2 — Tradition buttons (hidden on Focus tab):
```
arcane / divine / occult / primal
px-2 py-0.5 text-[11px] rounded border uppercase tracking-wider font-semibold
inactive at full opacity, others at opacity-30 when one selected
```

Row 3 — Traits combobox (multi-select, same styling as ItemFilterPanel trait select)

Row 4 — Rank buttons + Action cost buttons (same row, separated by divider):
```
Rank: w-7 h-6 text-xs rounded border font-mono
      C=0, 1–10 as numbers
      selected: bg-primary text-primary-foreground border-primary
      default:  bg-secondary/50 text-muted-foreground border-border/40

Action cost: h-6 px-2 text-[13px] rounded border font-mono
             ◇ ↺ ◆ ◆◆ ◆◆◆
             same selected/default states as rank buttons
```

### SpellReferenceDrawer

Right-side Sheet, `w-[420px] sm:w-[480px]`, same structure as ItemReferenceDrawer:

```
Header (p-4 pb-3 border-b): spell name (text-base font-semibold) + rank badge + traditions badges
Body (p-4 space-y-4):
  - Stats row: actions mono, save capitalize, damage pf-blood mono, range, area, duration
  - Trait badges (bg-primary/10 text-primary)
  - Description text (text-[13px] text-foreground/80 leading-relaxed, stripHtml)
  - Source (text-xs text-muted-foreground)
Footer (p-4 border-t): Close button (ghost sm)
```

### SpellInlineCard (inside ItemReferenceDrawer)

Section label: `text-[10px] text-muted-foreground uppercase tracking-wider font-semibold` — "LINKED SPELL"

Collapsed row (Collapsible trigger):
```
flex items-center gap-2 px-3 py-2
rounded-md border border-border/40 bg-secondary/30
hover:border-border/60 hover:bg-secondary/50 transition-colors cursor-pointer

Left:  ChevronRight w-3.5 h-3.5 text-muted-foreground (rotates on open)
       spell name text-[13px] font-medium flex-1
Right: action cost font-mono text-primary text-[12px]
       rank label text-[11px] text-muted-foreground
       save capitalize text-[11px] text-muted-foreground
       damage font-mono text-pf-blood text-[11px]
```

Expanded content (CollapsibleContent):
```
px-3 pb-3 pt-2 space-y-2 border-t border-border/20

Meta line: text-xs text-muted-foreground flex flex-wrap gap-x-4
  Range / Area / Duration / Source — label muted, value foreground

Traditions: same colored badges as table
Traits: same gold badges as table
Description: text-xs text-foreground/75 leading-relaxed (stripHtml)
```

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Spells tab | "Spells" |
| Focus tab | "Focus Spells" |
| Search placeholder | "Search spells…" |
| Empty state (no results) | "No spells match the filters" |
| Empty state (no data) | "Run sync to import spells" |
| Rank 0 section label | "Cantrips" |
| Rank N section label | "Rank N" |
| Count label | "N spells" (singular: "1 spell") |
| Clear filters button | "clear filters" (lowercase, text-primary) |
| Linked spell section label | "LINKED SPELL" (uppercase label) |
| Close drawer button | "Close panel" |

---

## Registry Safety

| Registry | Components Used | Safety Gate |
|----------|----------------|-------------|
| shadcn official | Collapsible, CollapsibleTrigger, CollapsibleContent | not required |
| shadcn official | Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetFooter | not required (already in use) |
| shadcn official | Tabs, TabsList, TabsTrigger, TabsContent | not required (already in use) |
| shadcn official | Input, Button | not required (already in use) |

No third-party registries. All components from shadcn official.

Check Collapsible availability:
```bash
ls src/shared/ui/collapsible.tsx 2>/dev/null || echo "needs: npx shadcn add collapsible"
```

---

## Interaction Patterns

### Rank filter → section visibility
When a rank button is selected:
- Show ONLY the section for that rank (others `hidden` not just collapsed)
- Deselect rank → show all sections (restore default open/closed states)
- Tradition/trait/action filters narrow rows within visible sections

### SpellRankSection default states
- Rank 0 (Cantrips): open by default
- Rank 1: open by default
- Rank 2–10: closed by default
- Empty sections (0 rows after filters): hidden entirely

### SpellInlineCard
- Collapsed by default
- Single click on row → toggle expand
- No separate drawer opened — all content inline

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS — specific copy for all states
- [x] Dimension 2 Visuals: PASS — matches existing table/card patterns
- [x] Dimension 3 Color: PASS — follows Golden Parchment tokens
- [x] Dimension 4 Typography: PASS — consistent with ItemsTable/SpellCard patterns
- [x] Dimension 5 Spacing: PASS — h-9 rows, px-3 padding, multiples of 4
- [x] Dimension 6 Registry Safety: PASS — shadcn official only

**Approval:** approved 2026-04-04
