# Phase 40 Research — Dice Rolls Extended (Spells + Item→Spell)

**Date:** 2026-04-04
**Researcher:** inline (no subagents)

---

## Critical Corrections vs Design Doc

| Issue | Design Doc Said | Actual | Impact |
|-------|----------------|--------|--------|
| Migration number | `0020_item_spell_link.sql` | Last is `0018` → use `0019_item_spell_link.sql` | Plan must use 0019 |
| `usage` column | Part of original 0011 items schema | Added in `0017_item_favorites_usage.sql` via ALTER | sync INSERT already includes it (23rd col) |
| `searchSpells` LIMIT | 100 | 100 — too small for rank-grouped display (no pagination) | Raise to 500 or remove limit |
| `trait` param | Needs adding | Already exists in `searchSpells` signature | Only `isFocus` needs adding |

---

## Files to Modify

### 1. `src/shared/db/migrations/0019_item_spell_link.sql` (NEW)
```sql
ALTER TABLE items ADD COLUMN linked_spell_id TEXT;
```

### 2. `src/shared/api/items.ts`
- Add `linked_spell_id: string | null` to `ItemRow` interface

### 3. `src/shared/api/spells.ts`
- Add `isFocus?: boolean` param to `searchSpells()`
- When `isFocus=true`: add `AND s.traditions IS NULL AND s.traits LIKE '%"focus"%'`
- When `isFocus=false` (default): add `AND (s.traditions IS NOT NULL OR s.traits NOT LIKE '%"focus"%')`
- Raise LIMIT from 100 to 500 (or unlimited for grouped display)
- Add `fetchDistinctSpellTraits(): Promise<string[]>` function (needed by SpellFilterPanel)

### 4. `src/shared/api/sync.ts` — `extractAndInsertItems()`
Current: 23-column INSERT (`id` through `usage`)
Change: 24-column INSERT — add `linked_spell_id` as 24th column

Extraction logic in the items loop:
```ts
const embeddedSpell = sys.spell as Record<string, unknown> | undefined
const spellStats = embeddedSpell?._stats as Record<string, unknown> | undefined
const linkedSpellId = spellStats?.compendiumSource
  ? parseCompendiumId(spellStats.compendiumSource as string)
  : null
```
Also add `linked_spell_id` to `RawItem` interface (if it exists) or inline.

### 5. `src/entities/spell/index.ts` (barrel update)
Add exports for new UI components:
```ts
export { SpellReferenceDrawer } from './ui/SpellReferenceDrawer'
export { SpellInlineCard } from './ui/SpellInlineCard'
```
Also re-export `TRADITION_COLORS`, `actionCostLabel`, `rankLabel` helpers (moved from SpellsPage).

### 6. `src/entities/spell/ui/SpellReferenceDrawer.tsx` (NEW)
Right-side Sheet matching ItemReferenceDrawer pattern.

### 7. `src/entities/spell/ui/SpellInlineCard.tsx` (NEW)
Collapsible inline card for ItemReferenceDrawer.

### 8. `src/entities/item/ui/ItemReferenceDrawer.tsx`
Add "LINKED SPELL" section after description, before source.
Condition: `item.linked_spell_id != null`.

### 9. `src/features/spells-catalog/` (NEW FEATURE)
Files:
- `model/useSpellsCatalogStore.ts`
- `ui/SpellFilterPanel.tsx`
- `ui/SpellsTable.tsx`
- `ui/SpellRankSection.tsx`
- `index.ts`

### 10. `src/pages/spells/ui/SpellsPage.tsx` (FULL REWRITE)
Tabs (Spells | Focus Spells) + SpellFilterPanel + rank sections.

---

## Patterns Confirmed

### Table row (from ItemsTable/ItemTableRow)
```
flex items-center gap-2 px-3 h-9 border-b border-border/20 hover:bg-secondary/30 transition-colors cursor-pointer
```

### Header row
```
flex items-center gap-2 px-3 h-9 bg-card border-b border-border/40 shrink-0 text-xs text-muted-foreground font-medium
```

### Traits badge
```
px-1 py-0.5 text-[10px] rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider
```

### Tradition badge colors (from SpellsPage.tsx)
```ts
const TRADITION_COLORS = {
  arcane:  'bg-blue-500/20 text-blue-300 border-blue-500/40',
  divine:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  occult:  'bg-purple-500/20 text-purple-300 border-purple-500/40',
  primal:  'bg-green-500/20 text-green-300 border-green-500/40',
}
```

### Zustand store (from useItemsCatalogStore)
- `create<State>()(immer(...))` pattern
- Primitive selectors individually to avoid useShallow
- `hasActiveFilters()` computed getter

### Collapsible
- Already installed: `src/shared/ui/collapsible.tsx`
- Import: `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/shared/ui/collapsible'`

### Sheet (ItemReferenceDrawer pattern)
```tsx
<Sheet open={!!id} onOpenChange={(open) => { if (!open) onClose() }}>
  <SheetContent side="right" className="w-[420px] sm:w-[480px] overflow-y-auto flex flex-col gap-0 p-0">
```

### Tabs (already in use)
- Import from `@/shared/ui/tabs`

### Traits combobox (from ItemFilterPanel)
- Popover + Command + CommandInput + CommandList + CommandItem pattern

---

## Sync `RawItem` Interface

Check if `RawItem` is defined in sync.ts or inline. Must add `linked_spell_id` field.

From reading sync.ts lines 457-483: items are pushed as object literals directly into `items[]` array — no `RawItem` type visible in the read section. Need to verify if `RawItem` is a defined interface or just inferred. Either way, add the field to the push call.

---

## Damage Formula Display (per Claude's discretion)

From SpellsPage.tsx SpellCard (existing):
```ts
const dmg = JSON.parse(spell.damage) as Record<string, { formula?: string; damage?: string; damageType?: string; type?: string }>
const parts = Object.values(dmg)
  .map((d) => `${d.formula ?? d.damage ?? '?'} ${d.damageType ?? d.type ?? ''}`.trim())
  .filter(Boolean)
```
Use first entry only for table display: `parts[0] ?? '—'`

---

## Focus Spell Detection Query

```sql
AND s.traditions IS NULL AND s.traits LIKE '%"focus"%'
```
Non-focus (default):
```sql
AND (s.traditions IS NOT NULL OR s.traits NOT LIKE '%"focus"%')
```

---

## SpellsTable LIMIT Issue

Current `searchSpells` has `LIMIT 100`. With rank-grouped display showing ALL ranks, 100 is far too small. Should be 500 (matching items table pattern) or removed entirely since spells are ~800 total. Decision: **500 per search, no virtualization needed**.

---

## Shared Helpers to Move

These exist in `SpellsPage.tsx` and need to be in a shared location:
- `TRADITION_COLORS` → move to `src/entities/spell/lib/helpers.ts` (new file), re-export from barrel
- `actionCostLabel()` → same file
- `rankLabel()` → same file

SpellsPage and all new components will import from `@/entities/spell`.

---

## Implementation Order (confirmed)

1. `0019_item_spell_link.sql` migration
2. Update `ItemRow` interface (add `linked_spell_id`)
3. Update `searchSpells` (add `isFocus`, raise limit, add `fetchDistinctSpellTraits`)
4. Update `sync.ts` `extractAndInsertItems` (add linked_spell_id extraction + 24th INSERT col)
5. Create `src/entities/spell/lib/helpers.ts` (TRADITION_COLORS, actionCostLabel, rankLabel)
6. Build `SpellInlineCard` component
7. Update `ItemReferenceDrawer` (add Linked Spell section)
8. Build `SpellReferenceDrawer` component
9. Build `spells-catalog` feature (store → SpellsTable → SpellRankSection → SpellFilterPanel → index)
10. Rewrite `SpellsPage`
11. Update `entities/spell/index.ts` barrel

---

## No Issues / No Blockers

- Collapsible: installed
- Sheet: installed
- Tabs: installed
- Popover/Command: installed (verified in ItemFilterPanel imports)
- No new Rust/Tauri commands needed
- No FTS changes needed for spells (FTS5 already on spells table)
