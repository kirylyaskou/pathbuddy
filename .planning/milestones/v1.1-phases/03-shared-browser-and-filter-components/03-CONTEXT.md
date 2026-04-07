# Phase 03: Shared Browser and Filter Components - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the reusable component layer — EntityFilterBar, WeakEliteSelector, and CreatureBrowser — that both the Compendium page (Phase 04) and the Combat Workspace left panel (Phase 05) will compose. This phase delivers COMP-06 (family filter) and COMP-07 (tags filter) as observable behaviors, plus wires the `tags` field in `filterEntities()` SQL that was deferred from Phase 02.

</domain>

<decisions>
## Implementation Decisions

### Filter Bar Layout
- Collapsible filter panel above the entity list — toggle button to expand/collapse
- When collapsed, active filters show as a summary chip row below the toggle (e.g. "Level: 5–10 ×" "Rarity: Rare ×") — each chip has × to clear that individual filter
- When expanded, panel contains all filter controls in a structured layout
- Panel remembers open/closed state during the session (local component state, not persisted)

### Level Range Filter
- Two number inputs for min and max level (changeable range)
- "Auto" button that calculates appropriate creature level range based on PF2e encounter rules for a party of N adventurers at level M
- Auto button needs a small inline party config (party size + party level inputs) — these inputs appear when "Auto" is clicked
- PF2e encounter rules reference: creatures from party level -4 to party level +4 are standard encounter range (trivial to extreme)

### Rarity and Entity Type Filters
- Standard dropdown selects for both
- Rarity: common / uncommon / rare / unique
- Entity type: creature / spell / hazard / item / feat / etc. (populated from distinct values in database)

### Family Filter (COMP-06)
- Dropdown select for family, populated from distinct non-null `family` values in the database
- Only shown when entity type is "creature" (family is creature-specific)
- Verify `$.system.details.family` JSON path against actual synced data during research (MEDIUM confidence from Phase 02)

### Tags/Traits Filter (COMP-07)
- Searchable multi-select dropdown — type to search available traits, click to add
- Selected traits appear as removable pill chips
- Available traits list populated from distinct values in the database (json_each on raw_data traits path)
- User-toggleable AND/OR logic: small toggle switch lets user choose between "match ALL selected tags" (AND) and "match ANY selected tag" (OR)
- Traits JSON path: needs investigation during research (likely `$.system.traits.value` but must verify against actual raw_data)
- Wire the `tags` field in `filterEntities()` SQL — Phase 02 typed it but skipped the `json_each` implementation

### Creature List Display
- Compact single-line rows: Name | Level badge | Rarity dot | Family tag
- Dark charcoal rows with subtle separators
- Clicking a row opens the existing CreatureDetailPanel slide-over (reuse existing component)
- Virtualised scrolling for 28K entities — fixed row height for simple virtualisation

### WeakEliteSelector
- Segmented control with three buttons: [Weak | Normal | Elite]
- Gold highlight on the selected segment
- Shows adjusted HP delta in real time (e.g. "Elite: +20 HP") using `getHpAdjustment()` from Phase 02
- This is a standalone component — consumed by Combat Workspace (Phase 05) when adding creatures

### Component Architecture
- All filter state is local to EntityFilterBar (no Pinia store) — per Phase 02 SC-4
- EntityFilterBar emits `EntityFilter` objects on change — consumers call `filterEntities()` themselves
- CreatureBrowser composes EntityFilterBar + virtualised list + passes click events up
- WeakEliteSelector is a separate standalone component (not part of CreatureBrowser)

### Claude's Discretion
- Virtualisation library choice (vue-virtual-scroller, custom, etc.)
- Result count display and empty state design
- Exact collapsible panel animation/transition
- Dropdown component implementation (native select vs custom)
- Auto level range calculation formula details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Query layer (Phase 02 output)
- `src/lib/entity-query.ts` — `filterEntities()`, `EntityFilter`, `EntityResult` interfaces — the data contract these components consume
- `src/lib/weak-elite.ts` — `getHpAdjustment()`, `getAdjustedLevel()` — used by WeakEliteSelector
- `src/types/entity.ts` — `WeakEliteTier` type

### Existing UI patterns
- `src/components/AppSidebar.vue` — Dark fantasy nav pattern, gold accent active states
- `src/components/CreatureDetailPanel.vue` — Slide-over panel reused when clicking a browser row
- `src/components/CreatureCard.vue` — Existing creature display pattern for style reference

### Design system
- `tailwind.config.ts` — Custom colors (charcoal, gold, crimson), fontFamily.display (Cinzel)

### PF2e rules references
- `.planning/research/PITFALLS.md` — FTS5 query patterns, HP adjustment table
- PF2e encounter building: creatures from party level -4 to +4 are standard encounter range (for Auto level range button)
- PF2e weak/elite adjustments: +1/-1 level only per official rules (https://2e.aonprd.com/Rules.aspx?ID=3262)

### Project requirements
- `.planning/REQUIREMENTS.md` — COMP-06 (family filter), COMP-07 (tags/traits filter)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/entity-query.ts` → `filterEntities()`: the query function these components call — tags SQL needs wiring
- `src/lib/weak-elite.ts` → `getHpAdjustment()`, `getAdjustedLevel()`: ready for WeakEliteSelector
- `src/lib/search-service.ts` → `sanitizeSearchQuery()`: already used by filterEntities for FTS5 input
- `src/components/CreatureDetailPanel.vue`: slide-over panel, reuse for row click action
- `src/stores/creatureDetail.ts` → `useCreatureDetailStore()`: existing store for driving the slide-over

### Established Patterns
- Raw SQL via `getSqlite()` for performance-critical paths (filterEntities already uses this)
- Dark fantasy Tailwind tokens: `bg-charcoal-600`, `text-gold`, `border-gold`, `font-display`
- RouterLink with `active-class` pattern for navigation
- Vitest unit tests in `__tests__/` directories

### Integration Points
- `src/views/CompendiumView.vue` — Currently a stub; Phase 04 will compose CreatureBrowser here
- `src/views/CombatView.vue` — Phase 05 will add CreatureBrowser to the left panel
- `src/lib/entity-query.ts` — Wire `json_each` for tags filter in the existing `filterEntities` function

</code_context>

<specifics>
## Specific Ideas

- Auto level range button: when clicked, shows inline party config (size + level inputs), then calculates min/max creature level per PF2e encounter building rules (party level -4 to +4 for standard range)
- Tag filter AND/OR toggle: small inline toggle switch, default to AND
- Family dropdown only visible when entity type = creature
- Active filter chips show below collapsed panel with × to clear individual filters

</specifics>

<deferred>
## Deferred Ideas

- **Arbitrary creature level adjustment** — User wants ability to adjust creatures to any level (e.g. making a level 20 creature into level 6). PF2e official rules only support +1/-1 via weak/elite; arbitrary adjustment requires GM Core creature building rules which is a substantial new capability. Defer to a future phase.
- **Condition list rework** — Current `combat.ts` has only 11 conditions with errors: uses legacy `flat-footed` (should be `off-guard`), uses `grappled` (should be `grabbed`), has `incapacitated` (not a standard PF2e condition), missing 31 conditions from the PF2e Remaster Player Core (42 total). Numeric condition values (stunned 2, frightened 3) cannot be changed in the UI. This is a combat tracker fix, not a Phase 03 item — should be its own phase or inserted as a bug fix.
- **Persistent filter state across sessions** — FILT-01, deferred to v2 per REQUIREMENTS.md

</deferred>

---

*Phase: 03-shared-browser-and-filter-components*
*Context gathered: 2026-03-21*
