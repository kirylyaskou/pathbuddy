# Phase 5: Cross-Reference System - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Slug-based resolution of embedded creature items to canonical entities in the database, plus a creature detail slide-over panel showing linked canonical spells/items and NPC-unique abilities. Backend resolver + frontend display only — no creature browser, no search, no creature list page.

</domain>

<decisions>
## Implementation Decisions

### Creature detail view layout
- Pathbuilder 2e encounter page as primary UI reference (https://pathbuilder2e.com/beta/encounters.html)
- **Grouped stat block**: Stats at top (HP, AC, saves, perception), then sections for Melee/Ranged Strikes, Spells, Special Abilities, Equipment — mirrors official PF2e stat block format
- **Inline expandable items**: Click an ability/spell name to expand its full description inline, no navigation away
- **Compact card layout**: Self-contained panel with all info visible at a glance, minimal whitespace
- Slide-over panel (not full page route) — opens from combat tracker, keeps combat context visible
- Detail panel only for Phase 5 — no creature list/browser (future phase), no search (Phase 8: FTS5)

### Canonical vs unique display
- **Both** link indicator AND color coding:
  - Canonical items: colored left border/badge (e.g., blue) + link icon (🔗) indicating a compendium entry exists
  - NPC-unique abilities: different colored border (e.g., amber/gold), no link icon
- Full canonical description shown inline on expand — complete entry rendered in-place, not summarized
- NPC-unique abilities expand from embedded data directly

### Entity navigation
- Clicking the link icon on a canonical item replaces the panel content with the full canonical entity stat block
- Back button returns to the creature view
- Single-panel pattern — no multi-panel (that's v2 multi-window UI)

### Slug ambiguity handling
- **Type-aware matching**: match embedded item's `type` field against canonical `entity_type` column in addition to `slug`
  - e.g., embedded `{ type: 'spell', system: { slug: 'shield' } }` resolves to spells pack, not equipment
- No fallback — if type+slug doesn't match a canonical, mark as NPC-unique (`isUnique: true`) and render from embedded data
- Single batch query with `inArray` on slug + filter by entity_type (adapted from plan.txt reference)

### Claude's Discretion
- Exact color values for canonical vs NPC-unique borders
- Slide-over panel width and animation
- Stat block section ordering within groups
- How to handle entities with very long descriptions (truncation, scroll)
- Expand/collapse animation details
- Back navigation implementation (panel history stack vs simple state)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Implementation reference
- `plans/plan.txt` §Phase 3 (line ~456) — Complete `resolveCreatureItems()` implementation with batch `inArray` query, `ResolvedCreatureItem` interface, and canonical lookup map. **Adapt**: add `entity_type` matching to the query (plan.txt does slug-only).

### UI reference
- https://pathbuilder2e.com/beta/encounters.html — Primary UI composition reference for creature stat blocks. Patterns to replicate: grouped stat block format, inline expandable items, compact card layout.

### Phase requirements
- `.planning/ROADMAP.md` — Phase 5 requirements (XREF-01, XREF-02, XREF-03), key decisions, success criteria
- `.planning/REQUIREMENTS.md` — Full requirement specifications for XREF-01 through XREF-03

### Schema and database
- `src/lib/schema.ts` — Drizzle schema with `pf2eEntities` table: slug, pack, entityType, rawData columns. Unique index on (pack, slug), index on entity_type.
- `src/lib/database.ts` — Drizzle sqlite-proxy bridge (`db` instance, `getSqlite()`)

### Existing frontend
- `src/components/CombatTracker.vue` — Main combat view; slide-over panel will be triggered from here
- `src/components/CreatureCard.vue` — Existing creature card in combat tracker; click handler will open detail panel
- `src/stores/combat.ts` — Pinia combat store with creature data

### Prior phase context
- `.planning/phases/04-pf2e-data-sync/04-CONTEXT.md` — Phase 4 decisions (entity validation, file filtering, content hashing, sync pipeline)
- `.planning/phases/03-tauri-sqlite-foundation/03-CONTEXT.md` — Phase 3 decisions (Drizzle sqlite-proxy, migration strategy, vue-router setup)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `db` (src/lib/database.ts) — Drizzle sqlite-proxy instance for select/insert queries
- `pf2eEntities` schema (src/lib/schema.ts) — Table with slug, pack, entityType, rawData + indexes
- `CreatureCard.vue` — Existing creature display component in combat tracker, click target for opening detail panel
- `SplashScreen.vue` — Example of overlay/modal component pattern in the codebase
- Vue Router already configured (Phase 3) — supports future route-based navigation if needed

### Established Patterns
- Pinia stores with Composition API (setup stores) — use for panel state management
- Vue 3 Composition API with `<script setup>` — all components use this pattern
- Drizzle ORM generates SQL on frontend, executes via Tauri IPC
- Tailwind CSS for all styling

### Integration Points
- `src/components/CombatTracker.vue` — Add click handler on creature to open slide-over panel
- `src/components/CreatureCard.vue` — Wire click event to trigger detail panel
- `src/lib/` — New `creature-resolver.ts` module for slug-based resolution
- New `src/components/CreatureDetailPanel.vue` — Slide-over panel component

</code_context>

<specifics>
## Specific Ideas

- "Pathbuilder 2e encounter page is the best example of elements composition" — replicate its grouped stat block, inline expand, and compact card patterns
- Slide-over panel chosen specifically to keep combat tracker visible while browsing creature details — DM workflow optimization
- Both color coding AND link icons for canonical/unique distinction — clear visual separation on two axes
- Full canonical description inline on expand — no summary step, consistent with Pathbuilder's expand-in-place pattern

</specifics>

<deferred>
## Deferred Ideas

- Creature list/browser page — future phase (needs search from Phase 8)
- Multi-panel/multi-window creature viewing — v2 multi-window UI
- Combat persistence (saving creature state to DB) — separate phase noted in Phase 3 context

</deferred>

---

*Phase: 05-cross-reference-system*
*Context gathered: 2026-03-20*
