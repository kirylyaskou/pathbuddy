# Phase 34: Items Catalog Overhaul - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the existing card-based Items page with a compact sortable table (AoN-style), add extended filters (traits, source, context-sensitive subcategory), add a persistent Favorites tab grouping starred items by category, and implement a reusable item reference popup — also triggered from the creature stat block Equipment section.

</domain>

<decisions>
## Implementation Decisions

### Table Layout & Columns
- **D-01:** Column order: ★ (star), Name, Category, Traits, Level, Price, Bulk, Usage, Source — 9 columns total.
- **D-02:** `usage` column does not exist in the items table → new migration required to add it (populate from Foundry VTT item data `system.usage.value`).
- **D-03:** Default sort: Level ASC, then Name ASC (same as current behavior).
- **D-04:** Single-column sort — click column header toggles ASC → DESC → default. One active sort at a time.
- **D-05:** Traits column shows first 2–3 trait badges (styled like current cards), truncated with "+N more" label. Full traits visible in the popup.

### Extended Filters
- **D-06:** Traits filter: plain text input. Filters items where the `traits` JSON array contains the typed string (case-insensitive substring match).
- **D-07:** Sources filter: dropdown/select populated with distinct `source_book` values from the DB. Single-select.
- **D-08:** Subcategory filter: context-sensitive — only appears when a main type is selected. Shows `weapon_category` values (simple/martial/advanced/unarmed) when Weapon is selected, `consumable_category` values (potion/scroll/talisman/etc.) when Consumable is selected. Hidden for types without subcategory data.

### Item Reference Popup
- **D-09:** shadcn `Dialog` (centered modal). Dismiss with Esc or click outside.
- **D-10:** Full content: name, level, rarity, price, bulk, usage, category, subcategory, ALL traits (no truncation), full unstripped description text, and all type-specific stats (weapon: damage/category/group; armor: AC bonus/dex cap/penalties/str req; consumable: category/uses).
- **D-11:** Fallback for creature stat block: if `foundry_item_id` does not match any catalog item, show minimal popup with the `creature_items` row data (name, type, any stats present). Do not silently fail.
- **D-12:** No prev/next item navigation in the popup. Close and click another row.

### Favorites
- **D-13:** New SQLite table `item_favorites (item_id TEXT PRIMARY KEY)`. New migration `0017_item_favorites.sql`. Persists across sessions.
- **D-14:** Favorites tab groups items by `item_type` — each category is a labeled collapsible section (Accordion or similar). Items within each group sorted by Name ASC.
- **D-15:** Star icon in the **rightmost column** of the table row — always visible, click to toggle starred state.
- **D-16:** Clicking any item in the Favorites tab opens the same reference Dialog popup as the main table.

### Claude's Discretion
- Exact column widths and responsive behavior
- Whether to use a `<table>` element or a virtualized list for the table (given potentially large result sets)
- Toolbar/filter bar layout — how to arrange the new traits/source/subcategory filters alongside existing type/level/rarity filters
- Whether `ItemsPage` gets split into FSD widget/feature files or stays as a single page component
- The `usage` field display format (some items have "worn", "held in 1 hand", etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — ITMCAT-01 through ITMCAT-06 acceptance criteria
- `.planning/ROADMAP.md` §Phase 34 — Goal, success criteria (exact column names and behaviors expected)

### Existing Items Implementation (baseline to overhaul)
- `src/pages/items/ui/ItemsPage.tsx` — Current card-based implementation; replace with table layout
- `src/shared/api/items.ts` — `searchItems()`, `getItemById()`, `getCreatureItems()` — extend with traits/source filters and favorites API
- `src/entities/item/model/types.ts` — `ItemRow` type definition (add `usage` field when migration added)
- `src/entities/item/index.ts` — Entity barrel export

### Database Schema
- `src/shared/db/migrations/0011_items.sql` — Current `items` table schema (baseline; needs `usage` column)
- `src/shared/db/migrations/0016_encounter_slot_overrides.sql` — Most recent migration (numbering reference: next is `0017_item_favorites.sql`)
- `src/shared/db/migrate.ts` — Migration runner (import.meta.glob pattern)

### Creature Equipment Integration
- `src/entities/creature/ui/CreatureStatBlock.tsx` — `EquipmentBlock` component (lines ~1218–1360); links items via `foundry_item_id`; popup should be triggered from item name clicks here

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/shared/api/items.ts` `getItemById(id)` — Fetches full item by ID; popup uses this for catalog items
- `src/entities/item/model/` — `ITEM_TYPE_LABELS`, `ITEM_TYPE_COLORS`, `RARITY_COLORS` constants — reuse in table and popup
- shadcn `Dialog` — already installed and used elsewhere in the project
- shadcn `Accordion` — available for Favorites grouped sections
- shadcn `Select`/`Combobox` — available for Sources dropdown filter
- `formatPrice()` and `stripHtml()` — already in `ItemsPage.tsx`; extract to shared utils or keep in page

### Established Patterns
- FTS5 search with 200ms debounce — keep for text search, supplement with SQL `WHERE traits LIKE '%?%'` for trait filter
- `shared/api/` is the sole IPC boundary — new `getFavorites()`, `toggleFavorite()`, `getDistinctSources()` functions go in `items.ts`
- New migration: `import.meta.glob` auto-discovers SQL files — just add `0017_item_favorites.sql`
- Dark theme with Tailwind utility classes, shadcn components, Radix primitives

### Integration Points
- `CreatureStatBlock.tsx` `EquipmentBlock` — add `onClick` to item rows that opens the popup. Pass `foundry_item_id` (or item_name as fallback) to a shared `ItemPopup` component
- `ItemsPage.tsx` — the `onToggle` / `expandedId` state that currently expands cards is replaced by `selectedItemId` state that opens the Dialog

</code_context>

<specifics>
## Specific Ideas

- "Like Archives of Nethys" — the PF2e reference site (https://2e.aonprd.com/Equipment.aspx) shows items in a compact sortable table with name, type, level, price, bulk, traits columns. Compact rows, no expansion in-place — click opens a full detail page. The popup replaces the "full detail page" concept for our DM tool.
- Star icon in rightmost column (not leftmost) — user's choice; keeps the name/stats columns leading.
- Sources filter is a dropdown (not free text) because source book names are long and inconsistent.
- The subcategory filter should disappear entirely (not just disable) when the selected type has no subcategory.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 34-items-catalog-overhaul*
*Context gathered: 2026-04-03*
