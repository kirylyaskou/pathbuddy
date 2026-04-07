# Phase 40: Dice Rolls Extended - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Three areas of work combined:

1. **Dice rolls extended** — clickable rolls for skills, DC saves, spell attacks/damage, and item damage in the stat block; roll history enriched with source context (who/what/which combat); roll result drawer repositioned to right side.

2. **Spells table overhaul** — replace expandable card layout with a proper table grouped by rank in collapsible sections. Tabs for regular vs focus spells. Full filter toolbar.

3. **Item → Spell link** — extract linked spell ID during sync; render inline collapsible spell card in ItemReferenceDrawer.

</domain>

<decisions>
## Implementation Decisions

### Spells table layout
- Replace current SpellCard+expand layout with a proper table (rows and columns) — not cards
- Table columns: **Name | Actions | Save | Damage | Traditions | Traits**
- Grouped into collapsible sections per rank: Rank 0 (Cantrips), Rank 1–10
- Rank 0 and Rank 1 sections open by default; Rank 2–10 closed by default
- Clicking a row opens SpellReferenceDrawer (right-side sheet, same pattern as ItemReferenceDrawer)

### Rank sections behavior
- Each section header shows: `▼ Rank N  (N spells)`
- Click to collapse/expand (shadcn Collapsible)
- When rank filter is active: show only the selected rank section, hide all others entirely
- Section hidden when it contains 0 spells after filtering

### Spells page tabs
- Two tabs at top: **Spells** | **Focus Spells**
- Focus spells detected at query time: `traditions IS NULL AND traits LIKE '%"focus"%'`
- No new DB columns needed — filter applied in `searchSpells()` via `isFocus` param
- Focus tab: Traditions column replaced with Source (`source_book`); tradition filter hidden

### Spell filters
- Full filter toolbar: text search, tradition buttons (arcane/divine/occult/primal), trait multi-select combobox, rank buttons (C, 1–10), action cost buttons (◇ ↺ ◆ ◆◆ ◆◆◆)
- Tradition filter hidden on Focus Spells tab
- Conditions column: **dropped** — too fragile to extract from HTML, not worth it

### SpellReferenceDrawer
- New component: `src/entities/spell/ui/SpellReferenceDrawer.tsx`
- Matches ItemReferenceDrawer pattern (Sheet, right side)
- Shows: name, rank badge, traditions badges, stats row (actions/save/damage/range/area/duration), traits badges, description, source

### Item → Spell link: data
- New DB migration `0020_item_spell_link.sql`: `ALTER TABLE items ADD COLUMN linked_spell_id TEXT`
- Extracted during sync from Foundry: `system.spell._stats.compendiumSource` → parseCompendiumId()
- Covers consumable/equipment items (scrolls, wands, oils, etc.) that carry embedded spells
- `ItemRow` interface gains `linked_spell_id: string | null`

### Item → Spell link: UI
- New component `SpellInlineCard` in `src/entities/spell/ui/SpellInlineCard.tsx`
- Rendered inside ItemReferenceDrawer under "Linked Spell" section label (small uppercase muted header)
- **Collapsed (default):** single row — `name  ◆◆◆  Rank N  Save  damage formula`
- **Expanded (click to toggle):** + range, duration, area, traditions badges, traits badges, description text
- Implemented with shadcn Collapsible
- Does NOT open a second drawer — spell shown inline

### FSD structure for spells feature
- New feature: `src/features/spells-catalog/` (store + SpellsTable + SpellRankSection + SpellFilterPanel)
- Entity components: `SpellReferenceDrawer`, `SpellInlineCard` under `src/entities/spell/ui/`
- SpellsPage fully rewritten; existing SpellCard component retired

### Claude's Discretion
- Exact damage formula display from JSON (first entry, format: `Xd6 fire`)
- Traits truncation in table (show first N with overflow indicator)
- Exact sort order within rank tables (name ASC)
- SpellInlineCard loading/error states

</decisions>

<specifics>
## Specific Ideas

- "Полноценную таблицу" — proper aligned table columns, not cards
- Tabbed layout matches ItemsPage (All Items | Favorites) pattern
- Inline spell card in item drawer so user doesn't need to open a second panel
- Focus spells completely separate from general spells list

</specifics>

<canonical_refs>
## Canonical References

### Spells table + item→spell link design
- `docs/superpowers/specs/2026-04-04-spells-table-item-spell-link-design.md` — Full design spec: table columns, rank sections, focus tab, SpellInlineCard behavior, sync extraction logic, FSD file structure, implementation order

### Existing patterns to follow
- `src/pages/items/ui/ItemsPage.tsx` — Tab structure, table + filter panel pattern
- `src/entities/item/ui/ItemReferenceDrawer.tsx` — Drawer pattern to replicate for SpellReferenceDrawer
- `src/features/items-catalog/` — Feature structure to mirror for spells-catalog
- `src/shared/api/spells.ts` — searchSpells() to extend with isFocus + trait params
- `src/shared/api/sync.ts` — extractAndInsertSpells() and extractAndInsertItems() to modify
- `src/shared/db/migrations/` — Migration numbering (next: 0020)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TRADITION_COLORS` in SpellsPage.tsx — already defined, move to entities/spell
- `actionCostLabel()` in SpellsPage.tsx — already defined, move to entities/spell
- `rankLabel()` in SpellsPage.tsx — already defined, move to entities/spell
- `parseCompendiumId()` in sync.ts — reuse for linked_spell_id extraction
- shadcn `Collapsible` — available, use for rank sections and SpellInlineCard
- shadcn `Sheet` — used in ItemReferenceDrawer, same pattern for SpellReferenceDrawer
- `ClickableFormula` component — already used in ItemReferenceDrawer, reuse in spell views if needed

### Established Patterns
- `searchSpells()` already supports `rank`, `tradition`, `query` params — extend with `isFocus` and `trait`
- FTS5 search pattern identical to items; no new indexes needed
- ItemFilterPanel pattern → SpellFilterPanel follows same structure
- Zustand store pattern from `useItemsCatalogStore` → mirror for `useSpellsCatalogStore`
- FSD layers: entities/spell exports types+UI, features/spells-catalog owns page logic

### Integration Points
- `SpellsPage.tsx` — full rewrite, existing file retired
- `ItemReferenceDrawer.tsx` — add Linked Spell section at bottom
- `shared/api/spells.ts` — extend searchSpells signature
- `shared/api/sync.ts` — add linked_spell_id to items extraction + insert
- `shared/api/index.ts` — ensure new exports are re-exported

</code_context>

<deferred>
## Deferred Ideas

- Conditions imposed by spells (from degree_of_success HTML) — dropped: too fragile, HTML parsing unreliable
- `is_focus` boolean column in DB — not needed, query-time filter sufficient at ~800 spells
- Spell-to-spell links (e.g., heightened versions) — not discussed, out of scope
- Virtualization for long spell lists — not needed at current data size

</deferred>

---

*Phase: 40-dice-rolls-extended*
*Context gathered: 2026-04-04*
