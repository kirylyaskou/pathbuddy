# Phase 40 — Dice Rolls Extended: Spells Table + Item→Spell Link
## PLAN.md

**Branch:** v0.9.7
**Phase:** 40
**Status:** Ready to execute

---

## Plan Overview

| # | Plan | Files | Complexity |
|---|------|-------|------------|
| 1 | DB Migration + Data Layer | 3 files | Low |
| 2 | Spell Entity Helpers + SpellInlineCard | 3 files | Medium |
| 3 | SpellReferenceDrawer + ItemReferenceDrawer Update | 2 files | Medium |
| 4 | spells-catalog Feature | 5 files | High |
| 5 | SpellsPage Rewrite | 1 file | Medium |

---

## Plan 1 — DB Migration + Data Layer

### Goal
Add `linked_spell_id` to the items table, update all interfaces, extend `searchSpells` with `isFocus` param and `fetchDistinctSpellTraits`, and wire `linked_spell_id` extraction into sync.

### Steps

**Step 1.1 — Create migration `0019_item_spell_link.sql`**

File: `src/shared/db/migrations/0019_item_spell_link.sql`

```sql
ALTER TABLE items ADD COLUMN linked_spell_id TEXT;
```

**Step 1.2 — Update `ItemRow` interface**

File: `src/shared/api/items.ts`

Add to `ItemRow` interface after `usage`:
```ts
linked_spell_id: string | null
```

**Step 1.3 — Update `searchSpells` in `src/shared/api/spells.ts`**

Changes:
- Add `isFocus?: boolean` parameter (after existing `trait?`)
- When `isFocus === true`: append `AND s.traditions IS NULL AND s.traits LIKE '%"focus"%'`
- When `isFocus === false` (explicit, not undefined): append `AND (s.traditions IS NOT NULL OR s.traits NOT LIKE '%"focus"%')`
- Raise LIMIT from `100` to `500` in both query branches
- Add `fetchDistinctSpellTraits()` function at end of file:

```ts
export async function fetchDistinctSpellTraits(): Promise<string[]> {
  const db = await getDb()
  const rows = await db.select<{ value: string }[]>(
    `SELECT DISTINCT value FROM spells, json_each(spells.traits)
     WHERE traits IS NOT NULL
     ORDER BY value`,
    []
  )
  return rows.map((r) => r.value)
}
```

**Step 1.4 — Update `RawItem` interface in `sync.ts`**

File: `src/shared/api/sync.ts`

Add to `RawItem` interface after `usage`:
```ts
linked_spell_id: string | null
```

**Step 1.5 — Update `extractAndInsertItems` in `sync.ts`**

In the `items.push({...})` call, add extraction and new field:
```ts
// After the `usage` field extraction:
const embeddedSpell = sys.spell as Record<string, unknown> | undefined
const spellStats = embeddedSpell?._stats as Record<string, unknown> | undefined
const linkedSpellId = spellStats?.compendiumSource
  ? parseCompendiumId(spellStats.compendiumSource as string)
  : null
```

Add `linked_spell_id: linkedSpellId` to the push call.

In the batch INSERT:
- Change placeholders from `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` (23) to add one more `?` (24 total)
- Add `it.linked_spell_id` to the `values` flatMap
- Update the INSERT column list to include `linked_spell_id` at end

### Verification
- TypeScript compiles without errors on these files
- `ItemRow` has `linked_spell_id: string | null`
- `searchSpells` signature has `isFocus?: boolean` param
- `fetchDistinctSpellTraits` exported from `src/shared/api/spells.ts`

---

## Plan 2 — Spell Entity Helpers + SpellInlineCard

### Goal
Extract shared helpers from SpellsPage into the entities/spell layer, build SpellInlineCard, and update the barrel.

### Steps

**Step 2.1 — Create `src/entities/spell/lib/helpers.ts`**

```ts
export const TRADITION_COLORS: Record<string, string> = {
  arcane:  'bg-blue-500/20 text-blue-300 border-blue-500/40',
  divine:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  occult:  'bg-purple-500/20 text-purple-300 border-purple-500/40',
  primal:  'bg-green-500/20 text-green-300 border-green-500/40',
}

export function actionCostLabel(cost: string | null): string {
  if (!cost) return ''
  if (cost === 'free') return '◇'
  if (cost === 'reaction') return '↺'
  const n = parseInt(cost)
  if (n === 1) return '◆'
  if (n === 2) return '◆◆'
  if (n === 3) return '◆◆◆'
  return cost
}

export function rankLabel(rank: number): string {
  return rank === 0 ? 'Cantrips' : `Rank ${rank}`
}

export function parseDamageDisplay(damageJson: string | null): string {
  if (!damageJson) return '—'
  try {
    const dmg = JSON.parse(damageJson) as Record<string, { formula?: string; damage?: string; damageType?: string; type?: string }>
    const first = Object.values(dmg)[0]
    if (!first) return '—'
    return `${first.formula ?? first.damage ?? '?'} ${first.damageType ?? first.type ?? ''}`.trim()
  } catch {
    return '—'
  }
}

export function parseAreaDisplay(areaJson: string | null): string | null {
  if (!areaJson) return null
  try {
    const a = JSON.parse(areaJson) as { type?: string; value?: number }
    return a.value ? `${a.value}-foot ${a.type}` : null
  } catch {
    return null
  }
}
```

**Step 2.2 — Create `src/entities/spell/ui/SpellInlineCard.tsx`**

Props: `{ spellId: string }`

Behavior:
- Fetches spell via `getSpellById(spellId)` on mount (useEffect)
- Uses shadcn `Collapsible` — collapsed by default
- Section label above: `text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1` — "LINKED SPELL"

Collapsed trigger row:
```
flex items-center gap-2 px-3 py-2
rounded-md border border-border/40 bg-secondary/30
hover:border-border/60 hover:bg-secondary/50 transition-colors cursor-pointer
```
Left: `ChevronRight w-3.5 h-3.5 text-muted-foreground` (rotates 90deg when open, `transition-transform duration-150`)
Center: spell name `text-[13px] font-medium flex-1`
Right: action cost `font-mono text-primary text-[12px]`, rank `text-[11px] text-muted-foreground`, save `capitalize text-[11px] text-muted-foreground`, damage `font-mono text-pf-blood text-[11px]`

Expanded content (CollapsibleContent):
```
px-3 pb-3 pt-2 space-y-2 border-t border-border/20
```
- Meta line (range/area/duration/source): `text-xs text-muted-foreground flex flex-wrap gap-x-4`
- Traditions badges: colored (TRADITION_COLORS)
- Traits badges: gold `bg-primary/10 text-primary border-primary/20`
- Description: `text-xs text-foreground/75 leading-relaxed`

Loading state: show `<p className="text-xs text-muted-foreground">Loading…</p>`
Error/null state: show `<p className="text-xs text-muted-foreground">Spell not found</p>`

**Step 2.3 — Update `src/entities/spell/index.ts` barrel**

Add exports:
```ts
export { SpellInlineCard } from './ui/SpellInlineCard'
export { TRADITION_COLORS, actionCostLabel, rankLabel, parseDamageDisplay, parseAreaDisplay } from './lib/helpers'
```
Keep existing type exports.

### Verification
- `SpellInlineCard` compiles, no TS errors
- Exports accessible from `@/entities/spell`

---

## Plan 3 — SpellReferenceDrawer + ItemReferenceDrawer Update

### Goal
Build the right-side spell detail drawer and add Linked Spell section to ItemReferenceDrawer.

### Steps

**Step 3.1 — Create `src/entities/spell/ui/SpellReferenceDrawer.tsx`**

Props: `{ spellId: string | null; onClose: () => void }`

Pattern mirrors `ItemReferenceDrawer`:
```tsx
<Sheet open={!!spellId} onOpenChange={(open) => { if (!open) onClose() }}>
  <SheetContent side="right" className="w-[420px] sm:w-[480px] overflow-y-auto flex flex-col gap-0 p-0">
```

Fetches spell via `getSpellById(spellId)` on spellId change.

Header (`p-4 pb-3 border-b border-border/30`):
- Name: `text-base font-semibold`
- Rank badge: `text-xs text-muted-foreground` — "Cantrip" or "Rank N"
- Tradition badges (colored, TRADITION_COLORS)

Body (`p-4 space-y-4 flex-1`):
- Stats row: action cost mono text-primary, save capitalize, damage `font-mono text-pf-blood`, range, area, duration — `flex flex-wrap gap-x-4 gap-y-2 text-xs`
  Each stat: `<span className="text-muted-foreground">Label: <span className="text-foreground">value</span></span>`
- Traits badges: gold
- Description: `text-[13px] text-foreground/80 leading-relaxed` (stripHtml)
- Source: `text-xs text-muted-foreground`

Footer (`p-4 border-t border-border/30`):
```tsx
<SheetClose asChild>
  <Button variant="ghost" size="sm">Close panel</Button>
</SheetClose>
```

Export from `src/entities/spell/index.ts` (add in Step 2.3 or separately here).

**Step 3.2 — Update `src/entities/item/ui/ItemReferenceDrawer.tsx`**

Add import:
```ts
import { SpellInlineCard } from '@/entities/spell'
```

After the description block and before Source, add (inside the `item.linked_spell_id` condition):
```tsx
{item.linked_spell_id && (
  <div className="space-y-1">
    <SpellInlineCard spellId={item.linked_spell_id} />
  </div>
)}
```

Also add `SpellReferenceDrawer` export to barrel in this step.

### Verification
- ItemReferenceDrawer renders SpellInlineCard when linked_spell_id present
- SpellReferenceDrawer opens as right-side Sheet
- No TS type errors

---

## Plan 4 — spells-catalog Feature

### Goal
Build the full `src/features/spells-catalog/` feature with Zustand store, table, rank sections, and filter panel.

### Steps

**Step 4.1 — Create `src/features/spells-catalog/model/useSpellsCatalogStore.ts`**

State shape (mirrors useItemsCatalogStore):
```ts
interface SpellsCatalogState {
  // Filters
  query: string
  selectedTradition: string | null
  selectedTrait: string | null
  selectedRank: number | null
  selectedActionCost: string | null
  activeTab: 'spells' | 'focus'
  // Actions
  setQuery: (q: string) => void
  setSelectedTradition: (t: string | null) => void
  setSelectedTrait: (t: string | null) => void
  setSelectedRank: (r: number | null) => void
  setSelectedActionCost: (a: string | null) => void
  setActiveTab: (tab: 'spells' | 'focus') => void
  clearFilters: () => void
  hasActiveFilters: () => boolean
}
```

`clearFilters` resets query/tradition/trait/rank/actionCost (NOT activeTab).
`hasActiveFilters` returns true if any filter is active.

Use `create<State>()(immer(...))` pattern.

**Step 4.2 — Create `src/features/spells-catalog/ui/SpellsTable.tsx`**

Props:
```ts
interface SpellsTableProps {
  spells: SpellRow[]
  isFocusTab: boolean
  onSpellClick: (spellId: string) => void
}
```

Renders sticky header + spell rows.

Header (`flex items-center gap-2 px-3 h-9 bg-card border-b border-border/40 shrink-0 text-xs text-muted-foreground font-medium`):
- Name: `flex-[22]`
- Actions: `flex-[5] shrink-0`
- Save: `flex-[8]`
- Damage: `flex-[10]`
- Traditions or Source (isFocusTab): `flex-[14]`
- Traits: `flex-[16]`

Row (`flex items-center gap-2 px-3 h-9 border-b border-border/20 hover:bg-secondary/30 transition-colors cursor-pointer`):
- Name: `flex-[22] font-medium text-[13px] truncate`
- Actions: `flex-[5] shrink-0 font-mono text-primary text-[13px]` — actionCostLabel()
- Save: `flex-[8] text-[12px] capitalize text-muted-foreground` — spell.save_stat ?? '—'
- Damage: `flex-[10] font-mono text-[12px] text-pf-blood` — parseDamageDisplay(spell.damage)
- Traditions (if !isFocusTab): `flex-[14]` — colored badges, max 2, +N overflow
  Source (if isFocusTab): `flex-[14] text-[12px] text-muted-foreground truncate`
- Traits: `flex-[16]` — gold badges, max 3, +N overflow `text-muted-foreground`

onClick on row calls `onSpellClick(spell.id)`.

**Step 4.3 — Create `src/features/spells-catalog/ui/SpellRankSection.tsx`**

Props:
```ts
interface SpellRankSectionProps {
  rank: number
  spells: SpellRow[]
  defaultOpen?: boolean
  isFocusTab: boolean
  onSpellClick: (spellId: string) => void
}
```

Uses shadcn `Collapsible` with controlled `open` state, initialized to `defaultOpen`.

Header row (`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-secondary/40 border-b border-border/30 bg-secondary/20`):
- Left: rank label (`text-sm font-semibold`) + count badge (`text-xs text-muted-foreground ml-2` — "N spells" / "1 spell")
- Right: `ChevronDown w-4 h-4 text-muted-foreground` — rotates 180deg when open (`transition-transform duration-150 data-[state=open]:rotate-180`)

CollapsibleContent renders `<SpellsTable spells={spells} isFocusTab={isFocusTab} onSpellClick={onSpellClick} />`.

If `spells.length === 0`: section is not rendered (caller handles this).

**Step 4.4 — Create `src/features/spells-catalog/ui/SpellFilterPanel.tsx`**

Props: `{ isFocusTab: boolean }`

Reads from `useSpellsCatalogStore`.

Structure (Container: `p-3 border-b border-border/50 space-y-2 shrink-0`):

Row 1 — Search:
```tsx
<div className="relative">
  <Search ... />
  <Input placeholder="Search spells…" ... className="pl-8 h-8 text-sm" />
</div>
```

Row 2 — Tradition buttons (hidden when `isFocusTab`):
```tsx
{!isFocusTab && (
  <div className="flex flex-wrap gap-1.5">
    {['arcane','divine','occult','primal'].map(t => (
      <button
        className={cn(
          "px-2 py-0.5 text-[11px] rounded border uppercase tracking-wider font-semibold transition-opacity",
          TRADITION_COLORS[t],
          selectedTradition && selectedTradition !== t && "opacity-30"
        )}
        onClick={() => setSelectedTradition(selectedTradition === t ? null : t)}
      >{t}</button>
    ))}
  </div>
)}
```

Row 3 — Traits combobox (same Popover+Command pattern as ItemFilterPanel):
- Loads traits via `fetchDistinctSpellTraits()` on mount
- Single-select (unlike items multi-select) — toggling the same trait deselects
- Shows selected trait as chip with X button

Row 4 — Rank buttons + divider + Action cost buttons (same row):
```tsx
<div className="flex flex-wrap items-center gap-1">
  {/* Rank buttons */}
  {[0,1,2,3,4,5,6,7,8,9,10].map(r => (
    <button
      key={r}
      className={cn(
        "w-7 h-6 text-xs rounded border font-mono",
        selectedRank === r
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-secondary/50 text-muted-foreground border-border/40 hover:border-border"
      )}
      onClick={() => setSelectedRank(selectedRank === r ? null : r)}
    >{r === 0 ? 'C' : r}</button>
  ))}

  {/* Divider */}
  <div className="w-px h-4 bg-border/50 mx-1" />

  {/* Action cost buttons */}
  {['free','reaction','1','2','3'].map((cost, i) => {
    const label = ['◇','↺','◆','◆◆','◆◆◆'][i]
    return (
      <button
        key={cost}
        className={cn(
          "h-6 px-2 text-[13px] rounded border font-mono",
          selectedActionCost === cost
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-secondary/50 text-muted-foreground border-border/40 hover:border-border"
        )}
        onClick={() => setSelectedActionCost(selectedActionCost === cost ? null : cost)}
      >{label}</button>
    )
  })}
</div>
```

**Step 4.5 — Create `src/features/spells-catalog/index.ts`**

```ts
export { useSpellsCatalogStore } from './model/useSpellsCatalogStore'
export { SpellFilterPanel } from './ui/SpellFilterPanel'
export { SpellsTable } from './ui/SpellsTable'
export { SpellRankSection } from './ui/SpellRankSection'
```

### Verification
- All 5 files compile without TS errors
- Store exports `useSpellsCatalogStore`
- SpellRankSection uses `Collapsible` from `@/shared/ui/collapsible`

---

## Plan 5 — SpellsPage Rewrite

### Goal
Full rewrite of `src/pages/spells/ui/SpellsPage.tsx` with tabs, filter panel, and rank sections.

### Steps

**Step 5.1 — Rewrite SpellsPage.tsx**

Remove: SpellCard component, all existing state/effects
Keep: file location, export name `SpellsPage`

Structure:
```tsx
import { useState, useEffect, useMemo } from 'react'
import { BookOpen } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { searchSpells } from '@/shared/api'
import type { SpellRow } from '@/shared/api'
import { SpellReferenceDrawer } from '@/entities/spell'
import { rankLabel } from '@/entities/spell'
import { useSpellsCatalogStore, SpellFilterPanel, SpellRankSection } from '@/features/spells-catalog'

const ALL_RANKS = [0,1,2,3,4,5,6,7,8,9,10]

export function SpellsPage() {
  const [allSpells, setAllSpells] = useState<SpellRow[]>([])
  const [focusSpells, setFocusSpells] = useState<SpellRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSpellId, setSelectedSpellId] = useState<string | null>(null)

  const { query, selectedTradition, selectedTrait, selectedRank, selectedActionCost, activeTab, setActiveTab } = useSpellsCatalogStore(...)

  // Load spells on filter change
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [regular, focus] = await Promise.all([
          searchSpells(query, selectedRank ?? undefined, selectedTradition ?? undefined, selectedTrait ?? undefined, false),
          searchSpells(query, selectedRank ?? undefined, undefined, selectedTrait ?? undefined, true),
        ])
        setAllSpells(regular)
        setFocusSpells(focus)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query, selectedTradition, selectedTrait, selectedRank, selectedActionCost])

  // Client-side action cost filter (not in DB query)
  const filteredSpells = useMemo(() => {
    const list = activeTab === 'focus' ? focusSpells : allSpells
    if (!selectedActionCost) return list
    return list.filter(s => s.action_cost === selectedActionCost)
  }, [allSpells, focusSpells, activeTab, selectedActionCost])

  // Group by rank
  const spellsByRank = useMemo(() => {
    const map = new Map<number, SpellRow[]>()
    for (const spell of filteredSpells) {
      const arr = map.get(spell.rank) ?? []
      arr.push(spell)
      map.set(spell.rank, arr)
    }
    return map
  }, [filteredSpells])

  const isFocusTab = activeTab === 'focus'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'spells' | 'focus')} className="flex flex-col h-full overflow-hidden">
        <TabsList className="shrink-0 mx-3 mt-3 mb-0 w-auto self-start">
          <TabsTrigger value="spells">Spells</TabsTrigger>
          <TabsTrigger value="focus">Focus Spells</TabsTrigger>
        </TabsList>

        {/* Filter panel — shared across both tabs */}
        <SpellFilterPanel isFocusTab={isFocusTab} />

        {/* Count + clear row */}
        <div className="px-3 py-1.5 shrink-0 border-b border-border/30 flex items-center gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            {loading ? 'Searching…' : `${filteredSpells.length} spell${filteredSpells.length !== 1 ? 's' : ''}`}
          </p>
          {hasActiveFilters() && (
            <button onClick={clearFilters} className="text-xs text-primary hover:underline">
              clear filters
            </button>
          )}
        </div>

        <TabsContent value="spells" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden">
          <SpellList spellsByRank={spellsByRank} isFocusTab={false} loading={loading} onSpellClick={setSelectedSpellId} selectedRank={selectedRank} />
        </TabsContent>
        <TabsContent value="focus" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden">
          <SpellList spellsByRank={spellsByRank} isFocusTab={true} loading={loading} onSpellClick={setSelectedSpellId} selectedRank={selectedRank} />
        </TabsContent>
      </Tabs>

      <SpellReferenceDrawer spellId={selectedSpellId} onClose={() => setSelectedSpellId(null)} />
    </div>
  )
}
```

Inner `SpellList` component (co-located in same file):
```tsx
function SpellList({ spellsByRank, isFocusTab, loading, onSpellClick, selectedRank }) {
  if (loading) return <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Searching…</div>

  const visibleRanks = ALL_RANKS.filter(r =>
    selectedRank !== null ? r === selectedRank : true
  ).filter(r => (spellsByRank.get(r)?.length ?? 0) > 0)

  if (visibleRanks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <BookOpen className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">No spells match the filters</p>
      </div>
    )
  }

  return (
    <div>
      {visibleRanks.map(r => (
        <SpellRankSection
          key={r}
          rank={r}
          spells={spellsByRank.get(r) ?? []}
          defaultOpen={r === 0 || r === 1}
          isFocusTab={isFocusTab}
          onSpellClick={onSpellClick}
        />
      ))}
    </div>
  )
}
```

Empty state when NO data at all (no filters active, zero spells):
```tsx
<p className="text-sm">Run sync to import spells</p>
```
vs when filters active and zero results:
```tsx
<p className="text-sm">No spells match the filters</p>
```

### Verification
- SpellsPage renders two tabs
- Clicking a spell row opens SpellReferenceDrawer on right
- Rank sections collapse/expand
- Tradition/rank/action-cost filters work
- Focus Spells tab hides tradition filter, shows source column

---

## Execution Order

Plans execute sequentially (no parallelism):
1. Plan 1 — Data layer (migration + API)
2. Plan 2 — Spell entity helpers + SpellInlineCard
3. Plan 3 — SpellReferenceDrawer + ItemReferenceDrawer update
4. Plan 4 — spells-catalog feature
5. Plan 5 — SpellsPage rewrite

---

## UAT Criteria

- [ ] Spells page shows two tabs: Spells and Focus Spells
- [ ] Spells grouped into collapsible rank sections (Cantrips open, Rank 1 open, rest closed)
- [ ] Table columns: Name | Actions | Save | Damage | Traditions | Traits
- [ ] Focus Spells tab replaces Traditions column with Source
- [ ] Clicking a spell row opens right-side drawer with full details
- [ ] Tradition filter hidden on Focus Spells tab
- [ ] Rank filter shows only selected rank section (hides others)
- [ ] Action cost filter works client-side
- [ ] Trait combobox filters results
- [ ] Empty sections hidden (not collapsed)
- [ ] "clear filters" button appears when any filter active
- [ ] Items with linked_spell_id show LINKED SPELL section in ItemReferenceDrawer
- [ ] SpellInlineCard collapsed by default, expands on click
- [ ] No second drawer opened by SpellInlineCard
- [ ] After sync, linked_spell_id populated for scrolls/wands/oils
- [ ] TypeScript compiles without errors
