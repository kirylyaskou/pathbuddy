# Phase 6: Description Sanitization - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Parse Foundry-specific HTML syntax (@UUID, @Damage, @Check, @Template) in entity descriptions into clean, readable HTML with internal entity links. Pure HTML transformation — no new UI components, no new routes, no data model changes. Wires into existing CreatureDetailPanel's `v-html` rendering.

</domain>

<decisions>
## Implementation Decisions

### Link click behavior
- @UUID links navigate the existing detail panel (reuse Phase 5 single-panel pattern with back button)
- All links rendered with `data-entity-pack` and `data-entity-id` attributes; entity resolution happens on click (sanitizer stays pure/synchronous)
- If entity not in DB on click: show disabled/muted link style, no navigation
- Only `Compendium.pf2e.*` @UUID links become clickable entity links; non-pf2e compendium references fall through to plain text fallback

### Inline element styling
- **@Damage**: bold inline text with damage-type color coding — orange for fire, red for bleed, blue for electricity, etc. (color map for common PF2e damage types)
- **@Check**: bold text with DC number highlighted/emphasized
- **@Template**: bold inline text (e.g., "**cone 60 ft.**")
- **@UUID entity links**: blue underlined text (standard web link style), muted/gray when entity not found

### Fallback & edge cases
- Unrecognized @-syntax (e.g., @Localize, @Action): strip the `@Type[...]` wrapper, keep `{Label}` text if present; if no label, show bracket content as plain text
- Standard HTML tags in descriptions (p, strong, em, ul, etc.) preserved — they provide formatting already rendered via `v-html`
- Non-pf2e @UUID references: same treatment as unrecognized @-syntax (strip wrapper, keep label as plain text)
- Graceful degradation — malformed @-syntax that doesn't match any regex passes through unchanged

### Integration scope
- `sanitizeDescription()` built as a general-purpose utility in `src/lib/description-sanitizer.ts` — any component rendering entity descriptions can import it
- Sanitizer is pure HTML-in/HTML-out; click handling lives in the consuming component via event delegation on `.pf2e-link` elements
- Applied to ALL `system.description.value` fields that get rendered — creature descriptions, item descriptions, canonical entity descriptions
- CreatureDetailPanel is the first consumer; future entity browsers/tooltips reuse the same utility

### Claude's Discretion
- Exact regex patterns and ordering of replacement passes
- Damage-type color map completeness (which PF2e damage types get which colors)
- CSS class naming conventions for styled elements
- How to extract pack/slug from @UUID path for the data attributes
- Event delegation implementation details in CreatureDetailPanel

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Implementation reference
- `plans/plan.txt` §Phase 4 (line ~532) — Complete `sanitizeDescription()` implementation with regex patterns for all 4 @-syntax types. Use as primary reference — adapt CSS classes for Tailwind.

### Phase requirements
- `.planning/ROADMAP.md` — Phase 6 requirements (DESC-01, DESC-02), key decisions, success criteria
- `.planning/REQUIREMENTS.md` — Full requirement specifications for DESC-01 and DESC-02

### Existing integration points
- `src/components/CreatureDetailPanel.vue` — Lines 76-79: `getDescription()` returns raw `system.description.value`; line 240: renders via `v-html`. This is where sanitization wires in.
- `src/lib/creature-resolver.ts` — Resolves embedded items to canonicals; descriptions come from both `item.canonical` and `item.embedded`

### Prior phase context
- `.planning/phases/05-cross-reference-system/05-CONTEXT.md` — Phase 5 decisions: single-panel navigation with back button, canonical vs NPC-unique display, slide-over panel pattern
- `.planning/phases/04-pf2e-data-sync/04-CONTEXT.md` — Phase 4 decisions: raw data stored as-is (no pre-processing), entity validation rules

### Schema
- `src/lib/schema.ts` — `pf2eEntities` table: pack, slug, entityType, rawData columns used for @UUID link resolution on click

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CreatureDetailPanel.vue:getDescription()` — Returns `system.description.value` from canonical or embedded data; sanitizer call inserts here
- `creature-resolver.ts:resolveCreatureItems()` — Batch slug+type resolution pattern; similar DB lookup needed for @UUID click handling
- `db` (src/lib/database.ts) — Drizzle sqlite-proxy instance for entity lookup on link click
- `pf2eEntities` schema — pack, slug, entityType columns map to @UUID path segments

### Established Patterns
- Vue 3 Composition API with `<script setup>` — all components use this
- `v-html` for rendering HTML descriptions (already in CreatureDetailPanel line 240)
- Pinia stores with setup function pattern — creatureDetail store manages panel navigation
- Tailwind CSS for all styling — inline classes preferred over custom CSS

### Integration Points
- `src/components/CreatureDetailPanel.vue` — Add click event delegation on `.pf2e-link` elements within v-html containers
- `src/lib/` — New `description-sanitizer.ts` module (pure function, no side effects)
- `src/stores/creatureDetail.ts` — `navigateToCanonical()` already exists for panel navigation from link clicks

</code_context>

<specifics>
## Specific Ideas

- Damage-type color coding inspired by PF2e rulebook conventions: fire=orange, cold=blue, electricity=blue, acid=green, bleed/persistent=red, etc.
- plan.txt Phase 4 has a complete working implementation — adapt regex patterns and swap React CSS classes for Tailwind utility classes
- @UUID links use same navigation path as Phase 5's canonical link icon — click a link in a description → panel navigates to that entity → back button returns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-description-sanitization*
*Context gathered: 2026-03-20*
