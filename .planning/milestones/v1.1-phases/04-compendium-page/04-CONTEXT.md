# Phase 04: Compendium Page - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can open the Compendium from the sidebar and browse, filter, and inspect all 28K synced PF2e entities — the complete Compendium feature end-to-end. This phase composes the existing CreatureBrowser, EntityFilterBar, and CreatureDetailPanel into a full-page view. The sidebar link and route already exist from Phase 02.

</domain>

<decisions>
## Implementation Decisions

### Page Layout
- Minimal page header with "Compendium" title (font-display, text-gold) — provides orientation without wasting vertical space
- CreatureBrowser fills the remaining height below the header (flex-1)
- No metadata bar above the browser — CreatureBrowser already shows result count inline
- Full dark charcoal background consistent with existing pages

### Entity Type Grouping (COMP-01)
- "Grouped by entity type" is satisfied by the entity type dropdown filter in EntityFilterBar (already built in Phase 03)
- No tabs or sidebar sections — the filter bar IS the grouping mechanism
- Default view shows all entity types mixed; user narrows with the type dropdown

### Initial State
- Compendium auto-loads all entities on mount (no filters applied) — CreatureBrowser already does this via onMounted
- No defaultEntityType prop on this page (unlike Combat Workspace which will default to 'creature')
- If no synced entities exist (fresh install), show a friendly empty state with a prompt to navigate to Sync Data page

### Slide-over Integration (COMP-08)
- Row click in CreatureBrowser already triggers useCreatureDetailStore().openCreature() — the existing CreatureDetailPanel slide-over renders the full stat block
- No additional work needed for COMP-08 beyond composing CreatureBrowser on the page

### Sidebar Navigation
- AppSidebar already has the Compendium link with book icon and active-class styling (added in Phase 01)
- Router already has /compendium route (added in Phase 02)
- No sidebar changes needed in this phase

### Claude's Discretion
- Exact header height and spacing
- Whether to add a subtle divider between header and browser
- Empty-state illustration or icon choice for "no synced data" state
- Test strategy for the composition (shallow mount vs integration)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Components to compose
- `src/components/CreatureBrowser.vue` — Full browser with filter bar, VList, debounce, row-click; accepts `defaultEntityType` prop
- `src/components/EntityFilterBar.vue` — All filter controls, collapsible panel, active chips
- `src/components/CreatureDetailPanel.vue` — Slide-over panel triggered by useCreatureDetailStore

### Page stub to replace
- `src/views/CompendiumView.vue` — Current stub (heading only); replace with full composition

### Routing and navigation (already wired)
- `src/router/index.ts` — `/compendium` route already registered
- `src/components/AppSidebar.vue` — Compendium nav link already present

### Design system
- `tailwind.config.ts` — charcoal/gold/crimson tokens, fontFamily.display (Cinzel)

### Query layer
- `src/lib/entity-query.ts` — filterEntities, EntityFilter, EntityResult
- `src/stores/creatureDetail.ts` — useCreatureDetailStore().openCreature() for slide-over

### Project requirements
- `.planning/REQUIREMENTS.md` — COMP-01 through COMP-05, COMP-08

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CreatureBrowser.vue` (131 lines): Complete browser component — drop in with no props for all-entity browsing
- `EntityFilterBar.vue` (337 lines): All filter controls built; entity type dropdown satisfies COMP-01 grouping
- `CreatureDetailPanel.vue`: Slide-over panel with stat block rendering — already integrated via store

### Established Patterns
- Dark fantasy Tailwind tokens: bg-charcoal-800, text-gold, font-display for headings
- Page views in src/views/: CombatView.vue and SyncView.vue as reference for page structure
- CreatureBrowser accepts defaultEntityType prop — Compendium leaves it undefined (all types)

### Integration Points
- `src/views/CompendiumView.vue` — Replace stub with CreatureBrowser composition
- No new routes, nav links, or stores needed — everything is already wired

</code_context>

<specifics>
## Specific Ideas

- This is primarily a composition phase — the heavy lifting was done in Phase 03
- The "no synced data" empty state should guide users to the Sync Data page (RouterLink or text prompt)
- Page should feel like opening an encyclopedia — all entities available, filters to narrow down

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-compendium-page*
*Context gathered: 2026-03-21*
