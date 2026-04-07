# Phase 06: Combat Detail Panel - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 06 delivers three parallel streams merged into one:

1. **Compendium layout & filter fixes** — replace single-column layout with 2-column inline split, fix filter sync bug, always-visible filters with labels, party level/size controls, XP in the list
2. **StatBlock.vue redesign** — new shared component with polished layout: trait pills, labeled stats header, always-expanded sections, no floating numbers
3. **Combat Detail Panel** — right column populated on tracker row click with a read-only live-state overlay above the shared stat block

Requirements: WORK-06 (primary). Compendium fixes address regressions in COMP-01 through COMP-08.

</domain>

<decisions>
## Implementation Decisions

### Compendium Layout

- **2-column split:** 30% left (filters + entity list) / 70% right (stat block inline)
- **Filters always visible** — remove collapse-toggle entirely; filter controls sit permanently at the top of the left column above the entity list
- **Placeholder when nothing selected:** text-only dark panel — "Select an entity to view its stat block" — no illustration
- **Slide-over (CreatureDetailPanel) removed completely** — no longer mounted in AppLayout; inline panels replace it everywhere. The `useCreatureDetailStore` and `CreatureDetailPanel.vue` are deleted.
- **Filter bug fix:** `defaultEntityType` prop on `CreatureBrowser` must initialize `EntityFilterBar`'s `entityType` ref on mount; currently EntityFilterBar ignores it and emits `entityType: undefined` on first interaction, overriding the default

### Filter Controls

- All filter inputs need visible labels above them (e.g. "Type", "Rarity", "Level", "Name", "Traits")
- Party level + party size controls are **always visible** at the top of the filter area — not gated behind the Auto toggle. These drive XP calculation per row.
- Remove the "Auto" toggle — level range is set manually; party level is a standalone required control for XP

### Entity List (rows)

- **Level:** prominent badge on the right side of each row — colored by level range (e.g. green for low, grey for mid, yellow/red for high relative to party level)
- **XP:** calculated per row relative to current `partyLevel` control value, shown in the row (e.g. "40 XP")
- **Entity type icon:** small icon/glyph indicating creature / spell / hazard / feat etc.
- **Caster indicator:** wand or wizard hat icon if the entity has spellcasting entries in rawData — detect at render time from raw data
- **Loading strategy:** pages of 200 rows; auto-load next page when the user scrolls to the bottom of the list (infinite scroll via VList sentinel). With any filter active, show all matching results directly (filters narrow results enough).
- Row layout (left to right): [type icon] [caster icon?] [name flex-1] [XP] [level badge]

### StatBlock.vue — Shared Component

- **New shared component** `src/components/StatBlock.vue` — accepts `rawData` prop (parsed JSON object), pure reference data only, no live combat values
- Used by both the Compendium right column and the Combat Detail Panel (below the live overlay)
- **Header block:**
  - Row 1: entity name (font-display, text-gold, large)
  - Row 2: trait pills — [Alignment] [Size] [Type] [Subtype...] — rarity pill colored (common=stone, uncommon=amber, rare=blue-400, unique=purple-400)
  - Row 3: `HP {max} | AC {val} | Perc {mod} | Speed {val}ft`
  - Row 4: `Fort {mod} | Ref {mod} | Will {mod}`
  - All values are **labeled** — no floating numbers anywhere
- **Body sections — always expanded, no click-to-reveal:**
  - Languages (if present)
  - Skills (if present)
  - Ability modifiers: Str / Dex / Con / Int / Wis / Cha (labeled grid)
  - Melee Strikes — each with attack bonus MAPs `[+X/+Y/+Z]`, traits, damage dice + type
  - Ranged Strikes — same format
  - Spellcasting entries
  - Actions & Abilities (full description visible inline, no collapse)
  - Equipment (if present)
- Section headings as labeled dividers (uppercase, gold-tinted, stone background bar)
- Canonical cross-reference links (↗) remain for non-unique items — navigates within the same panel (replaces current panel content)
- Back navigation within panel when navigating to a canonical item

### Combat Detail Panel

- **Right column in `CombatView`** — `CombatDetailPanel.vue` replaces the placeholder div
- **Row selection:** clicking a tracker row selects it and populates the right panel — does NOT open a slide-over
- **Selected row highlight:** gold `border-l-4 border-gold` + slightly lighter background on the selected row in CombatTracker
- **Routing change:** `CombatTracker.handleOpenDetail` is rerouted — instead of `detailStore.openCreature()`, it emits a `'select'` event with `creatureId`; `CombatView` owns `selectedCombatantId` as local `ref`
- **Empty state:** placeholder text "Select a creature to view details" when no row is selected

- **LiveCombatOverlay block** (above StatBlock, read-only):
  - Current HP / Max HP (e.g. "45 / 100")
  - Active conditions with values (e.g. "[Stunned 2] [Frightened 1]") — from `creature.conditions` + `creature.conditionValues`
  - Initiative value
  - Tier badge (Elite / Weak / Normal — shown only if not Normal)
  - Ongoing damage value (if `creature.ongoingDamage > 0`)
  - Regeneration status: on / off indicator (from `regenerationDisabled[creatureId]`)
  - Fast healing value (if `creature.regenAmount > 0`)
  - All read-only — no editing from this panel; edits remain in the center tracker row

- **Stat block below overlay:** `<StatBlock :raw-data="resolvedRawData" />` — rawData fetched from DB by `creature.sourceId` (slug lookup on `pf2eEntities.sourceId`)
- Creatures added via `AddCreatureForm` (manual, no sourceId) show empty stat block area with a note "No compendium data available"

### Claude's Discretion

- Exact color coding for level badge (which thresholds = green/grey/amber/red)
- Icon choices for entity type and caster indicator
- Exact spacing, divider styling, and section padding in StatBlock
- Whether skills are shown as a compact comma list or individual rows
- Scroll behavior when switching selected creatures (scroll stat block to top)
- Loading spinner/skeleton design for stat block while rawData is being fetched

</decisions>

<specifics>
## Specific Ideas

- Reference screenshot 1 (Pathbuilder-style tool): compact list left (name + XP + level), wide stat block center with traits as pills, organized sections — target quality bar for this phase
- Reference screenshot 2 (Foundry VTT): stat block with HP bar, saves grouped, actions with color-coded ability type backgrounds — structural inspiration
- "Всё должно быть обозначено и выделено для простоты понимания" — every number needs a label, every section needs a heading, nothing floating
- XP rules reference: https://2e.aonprd.com/Rules.aspx?ID=2717 — researcher must read this page to implement correct XP-per-creature calculation relative to party level
- Party level + size controls should feel like a "session config" header above the filters, not a hidden Auto-mode toggle

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Components to modify or replace
- `src/views/CompendiumView.vue` — Replace single-column with 2-column layout; left=filters+list, right=StatBlock or placeholder
- `src/components/CreatureBrowser.vue` — Fix defaultEntityType→EntityFilterBar sync; add infinite scroll (page 200); update row layout with XP, level badge, type icon, caster icon
- `src/components/EntityFilterBar.vue` — Remove collapse-toggle; make all controls always visible; add labels; expose partyLevel+partySize as always-on controls; remove Auto toggle
- `src/components/CreatureDetailPanel.vue` — DELETE (replaced by StatBlock.vue + inline panels)
- `src/stores/creatureDetail.ts` — DELETE (no longer needed after slide-over removal)
- `src/components/AppLayout.vue` — Remove CreatureDetailPanel import/usage
- `src/views/CombatView.vue` — Add selectedCombatantId ref, handle 'select' from CombatTracker, wire CombatDetailPanel
- `src/components/CombatTracker.vue` — Reroute handleOpenDetail to emit 'select' instead of detailStore.openCreature(); add selected row highlight

### New components to create
- `src/components/StatBlock.vue` — Shared stat block renderer (rawData prop, reference only)
- `src/components/CombatDetailPanel.vue` — Right column: LiveCombatOverlay + StatBlock

### Data and state
- `src/stores/combat.ts` — Creature type fields used in live overlay: currentHP, maxHP, conditions, conditionValues, initiative, tier, ongoingDamage, regenAmount; `regenerationDisabled` map
- `src/types/combat.ts` — Creature interface — verify all live overlay fields are present
- `src/lib/entity-query.ts` — filterEntities (add offset/limit params for pagination); EntityResult (rawData field)
- `src/lib/creature-resolver.ts` — resolveCreatureItems() — reused by StatBlock for canonical item resolution
- `src/lib/description-sanitizer.ts` — sanitizeDescription() — reused by StatBlock
- `src/lib/schema.ts` — pf2eEntities table (sourceId column for rawData lookup)

### Design system
- `tailwind.config.ts` — charcoal/gold/crimson tokens, fontFamily.display (Cinzel)

### PF2e XP rules
- https://2e.aonprd.com/Rules.aspx?ID=2717 — XP budget per creature relative to party level (researcher must read and extract the XP table)

### Project requirements
- `.planning/REQUIREMENTS.md` — WORK-06, COMP-01 through COMP-08

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/creature-resolver.ts` — `resolveCreatureItems()`: already handles canonical resolution + embedded fallback; StatBlock.vue reuses directly
- `src/lib/description-sanitizer.ts` — `sanitizeDescription()`: HTML sanitization for ability descriptions
- `src/components/WeakEliteSelector.vue` — NOT reused in this phase (combat-add context only)
- `src/stores/combat.ts` — All live state fields already present: `currentHP`, `maxHP`, `conditions`, `conditionValues`, `initiative`, `tier`, `ongoingDamage`, `regenAmount`, `regenerationDisabled`
- `src/lib/entity-query.ts` — `filterEntities(filter, limit)`: needs `offset` param added for pagination

### Established Patterns
- Dark fantasy tokens: `bg-charcoal-800`, `text-gold`, `border-charcoal-600`, `font-display`
- VList (`virtua/vue`) with `:item-size=40` — already in CreatureBrowser; extend for infinite scroll
- DB lookup by sourceId: `db.select().from(pf2eEntities).where(eq(pf2eEntities.sourceId, creature.sourceId))` — already in CombatTracker.handleOpenDetail
- Phase 05 pattern: CreatureBrowser `mode="combat"` suppresses slide-over, emits `'select'` — same pattern applies to CombatTracker row click

### Integration Points
- `AppLayout.vue` — Remove `<CreatureDetailPanel />` and its import
- `CompendiumView.vue` — Add 2-column flex/grid wrapper; pass `StatBlock` into right column
- `CombatView.vue` — `selectedCombatantId` ref + `@select` handler from CombatTracker; `<CombatDetailPanel :creature-id="selectedCombatantId" />`
- `filterEntities` in `entity-query.ts` — Add `offset` parameter for pagination support

### Known Bugs Being Fixed
- `EntityFilterBar` emits `entityType: undefined` on first interaction, overriding `defaultEntityType` set in `CreatureBrowser.onMounted` — fix: pass `defaultEntityType` as initial prop into EntityFilterBar and initialize `entityType` ref from it
- Hard limit of 100 results — replaced with paginated infinite scroll (200/page)
- No labels on filter controls — all controls get visible text labels

</code_context>

<deferred>
## Deferred Ideas

- **Editing HP/conditions from the right panel** — read-only overlay for now; editing remains in the center tracker row. Full right-panel editing could be Phase 8+.
- **Drag-to-resize panels (WORK-08)** — already deferred to v2 in REQUIREMENTS.md
- **XP budget encounter builder (ENC-01/ENC-02)** — showing XP per row is in scope; the full encounter planning/budget calculator with totals is v2
- **AC/save adjustments for Elite/Weak** — only HP adjustment is in scope per Phase 05 locked decision
- **Persistent filter state (FILT-01)** — deferred to v2

</deferred>

---

*Phase: 06-combat-detail-panel*
*Context gathered: 2026-03-24*
