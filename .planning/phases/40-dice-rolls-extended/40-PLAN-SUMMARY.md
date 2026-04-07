---
phase: "40"
plan: "40-PLAN"
subsystem: spells-ui
tags: [spells, items, sync, ui, feature]
key-files:
  created:
    - src/shared/db/migrations/0019_item_spell_link.sql
    - src/entities/spell/lib/helpers.ts
    - src/entities/spell/ui/SpellInlineCard.tsx
    - src/entities/spell/ui/SpellReferenceDrawer.tsx
    - src/features/spells-catalog/model/useSpellsCatalogStore.ts
    - src/features/spells-catalog/ui/SpellsTable.tsx
    - src/features/spells-catalog/ui/SpellRankSection.tsx
    - src/features/spells-catalog/ui/SpellFilterPanel.tsx
    - src/features/spells-catalog/index.ts
  modified:
    - src/shared/api/items.ts
    - src/shared/api/spells.ts
    - src/shared/api/sync.ts
    - src/entities/spell/index.ts
    - src/entities/item/ui/ItemReferenceDrawer.tsx
    - src/pages/spells/ui/SpellsPage.tsx
key-decisions:
  - Migration number 0019 (design doc said 0020 — corrected from actual last migration 0018)
  - searchSpells LIMIT raised 100→500 (100 insufficient for rank-grouped display)
  - Trait filter single-select (API has single trait param, avoids JOIN complexity)
  - Action cost filter applied client-side after DB query (no DB change needed)
  - SpellInlineCard uses three-state: 'loading' | SpellRow | null
duration: "9 min"
completed: "2026-04-04T20:18:58Z"
---

# Phase 40 Plan Summary

**One-liner:** Spells table overhaul with collapsible rank sections + tabs + full filter toolbar, SpellInlineCard in item drawer, SpellReferenceDrawer, and sync extraction for linked_spell_id from Foundry embedded spell data.

## Duration
- Start: 2026-04-04T20:09:45Z
- End: 2026-04-04T20:18:58Z
- Duration: ~9 min
- Tasks: 5 plans, 11 files

## What Was Built

### Plan 1 — DB Migration + Data Layer
- `0019_item_spell_link.sql`: adds `linked_spell_id TEXT` to items table
- `ItemRow` interface gains `linked_spell_id: string | null`
- `searchSpells` gains `isFocus?: boolean` param, LIMIT raised to 500
- `fetchDistinctSpellTraits()` added for filter panel use
- `extractAndInsertItems`: extracts `linked_spell_id` from `sys.spell._stats.compendiumSource`

### Plan 2 — Spell Entity Helpers + SpellInlineCard
- `helpers.ts`: `TRADITION_COLORS`, `actionCostLabel`, `rankLabel`, `parseDamageDisplay`, `parseAreaDisplay` — moved from SpellsPage to entity layer
- `SpellInlineCard`: collapsible single-row card inside ItemReferenceDrawer; fetches via `getSpellById`, collapsed by default, expands to show full spell detail
- Barrel updated to export all new entity components

### Plan 3 — SpellReferenceDrawer + ItemReferenceDrawer
- `SpellReferenceDrawer`: right-side Sheet with spell stats row, traditions, traits, description, source; matches ItemReferenceDrawer pattern
- `ItemReferenceDrawer`: renders `<SpellInlineCard>` when `item.linked_spell_id` is present

### Plan 4 — spells-catalog Feature
- `useSpellsCatalogStore`: Zustand+immer store; filters: query, tradition, trait, rank, action cost; activeTab; clearFilters/hasActiveFilters
- `SpellsTable`: table with sticky header + rows; Name/Actions/Save/Damage/Traditions|Source/Traits columns; overflow badges (+N)
- `SpellRankSection`: collapsible rank section with count badge; Collapsible from shadcn
- `SpellFilterPanel`: search input, tradition buttons (hidden on focus tab), trait combobox (Popover+Command), rank buttons (C/1-10), action cost buttons (◇↺◆◆◆◆◆◆)

### Plan 5 — SpellsPage Rewrite
- Full rewrite replacing SpellCard expandable cards with table-based grouped layout
- Tabs: Spells / Focus Spells with shared filter panel
- Rank 0 (Cantrips) and Rank 1 open by default, 2-10 closed
- Empty sections hidden; empty state distinguishes no-data vs no-match
- SpellReferenceDrawer opens on row click

## Deviations from Plan

- **[Plan 1 correction]** Migration is `0019` not `0020` — corrected from design doc error (research confirmed last migration was 0018)
- **[Plan 5 cleanup]** Removed unused `rankLabel` import from SpellsPage (used inside SpellRankSection, not SpellsPage directly)

Total deviations: 2 (1 correction, 1 cleanup). Impact: none — both improvements.

## Self-Check
- TypeScript: 0 new errors (2 pre-existing unrelated errors remain)
- All new files exist on disk
- 5 git commits created

## Self-Check: PASSED
