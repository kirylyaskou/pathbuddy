# Phase 05: 3-Panel Combat Workspace - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

The Combat Tracker page becomes a 3-panel workspace — creature browser on the left, tracker in the center, detail panel placeholder on the right — where users can search for creatures, choose quantity and weak/elite tier, add them to combat, and see tier labels in the tracker. Requirements: WORK-01, WORK-02, WORK-03, WORK-04, WORK-05.

</domain>

<decisions>
## Implementation Decisions

### Add-to-Combat Flow
- Click a creature row in the left-panel browser to select it — selection highlights the row and shows add controls
- Persistent "add bar" at the bottom of the left panel (below the VList): displays selected creature name, quantity input, WeakEliteSelector, and "Add to Combat" button
- Add bar only appears after a creature is selected from the browser — hidden when nothing is selected
- Clicking "Add" immediately inserts creatures into the center combat tracker; controls reset to qty=1, tier=normal
- No confirmation dialog — instant add, same speed as the old form but with richer data

### Panel Layout and Detail Placeholder
- CombatView.vue becomes a CSS grid with 3 equal columns (`grid-cols-3`) filling viewport height
- Left panel: CreatureBrowser with `defaultEntityType="creature"` + add bar at bottom
- Center panel: existing CombatTracker (toolbar + creature list) — toolbar stays within the center panel
- Right panel: empty placeholder with "Select a creature to view details" text — Phase 06 populates this
- Fixed proportions, desktop-only — WORK-08 (drag-to-resize) deferred to v2 per REQUIREMENTS.md
- Each panel manages its own vertical scroll independently (overflow-y-auto per panel)

### Creature Naming and Numbering (WORK-03)
- Base name comes from the PF2e entity (e.g. "Goblin Warrior")
- When quantity > 1: auto-numbered sequentially — "Goblin Warrior 1", "Goblin Warrior 2", "Goblin Warrior 3"
- When quantity = 1 and no same-name creature exists: no number suffix — just "Goblin Warrior"
- When quantity = 1 but same-name creature already exists: number suffix continues the sequence
- Numbering continues across add sessions — if "Goblin Warrior 1" and "Goblin Warrior 2" exist, adding 1 more creates "Goblin Warrior 3"

### Tier Labels in Tracker (WORK-04, WORK-05)
- Tier prefix in display name: "Elite: Goblin Warrior 1", "Weak: Goblin Warrior 2"
- HP adjusted via `getHpAdjustment(tier, level)` delta added to base maxHP from raw_data
- currentHP starts at adjustedMaxHP (full health on entry)
- Only HP adjustment is in scope — AC and other stat adjustments are not part of WORK-04

### Combat Store Integration
- Extract maxHP, AC, level from entity raw_data JSON when adding from browser
- Store `sourceId` on Creature for detail panel lookup (Phase 06) — Creature type already has this field
- Initiative defaults to 0 — DM enters initiative manually after adding
- Extend Creature type if needed to carry `tier` label for display purposes
- `addCreature` store function receives fully computed creature data (adjusted HP, tier label in name)

### Claude's Discretion
- Exact add bar styling and animation (slide-up, always visible, etc.)
- Selected creature row highlight style
- Quantity input design (number input, stepper buttons, etc.)
- Right panel placeholder illustration or icon
- Whether the "+" Add Creature button in the toolbar remains (Phase 07 removes it, but Phase 05 may keep both entry points or hide it)
- Exact grid gap and panel border styling

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Layout and components
- `src/views/CombatView.vue` — Current thin wrapper; becomes the 3-panel grid shell
- `src/components/CombatTracker.vue` — Center panel; has toolbar, creature list, AddCreatureForm
- `src/components/CreatureBrowser.vue` — Left panel browser; accepts `defaultEntityType` prop, emits `row-click`
- `src/components/WeakEliteSelector.vue` — Tier selector with HP delta display
- `src/components/AddCreatureForm.vue` — Current manual form (coexists until Phase 07 removes it)
- `src/components/CreatureCard.vue` — Tracker row component; needs tier label rendering
- `src/components/AppLayout.vue` — Global shell with CreatureDetailPanel (Phase 04)

### Data and state
- `src/stores/combat.ts` — `addCreature()`, Creature type, combat state management
- `src/types/combat.ts` — Creature interface definition (check for sourceId, tier fields)
- `src/lib/weak-elite.ts` — `getHpAdjustment()`, `getAdjustedLevel()` for tier HP math
- `src/types/entity.ts` — `WeakEliteTier` type
- `src/lib/entity-query.ts` — `EntityResult` interface (rawData field for HP/AC extraction)

### Design system
- `tailwind.config.ts` — charcoal/gold/crimson tokens, fontFamily.display (Cinzel)

### Project requirements
- `.planning/REQUIREMENTS.md` — WORK-01 through WORK-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CreatureBrowser.vue` (132 lines): Drop in with `defaultEntityType="creature"` for left panel — emits `row-click` with `EntityResult` containing rawData, name, level
- `WeakEliteSelector.vue` (37 lines): Ready-made tier selector, takes `level` and `v-model` tier — shows HP delta label
- `EntityFilterBar.vue` (337 lines): All filter controls built — used internally by CreatureBrowser
- `getHpAdjustment(tier, level)`: Returns HP delta for any tier/level combo — 12-bracket PF2e table

### Established Patterns
- Dark fantasy Tailwind tokens: bg-charcoal-800, text-gold, border-charcoal-600, font-display
- `combatStore.addCreature(Omit<Creature, 'id'>)`: Existing add interface — assigns uuid, sets isDowned
- `handleOpenDetail` in CombatTracker: Fetches rawData by sourceId — pattern for entity-to-creature data flow
- CreatureBrowser already opens slide-over via `detailStore.openCreature()` on row click — Phase 05 may want to override this for "select for add" behavior in the left panel

### Integration Points
- `CombatView.vue` → Replace `<CombatTracker />` with 3-panel grid containing browser + tracker + placeholder
- `CombatTracker.vue` → Remove `AddCreatureForm` import/usage if toolbar button removed (or keep for Phase 07)
- `CreatureBrowser.vue` → Row click in combat context should select-for-add instead of opening slide-over — may need a mode prop or different event handling
- `Creature` type → May need `sourceId` (already exists from v1.0) and `tier` display field

</code_context>

<specifics>
## Specific Ideas

- CreatureBrowser in the left panel needs to behave differently from Compendium: row click should select-for-add, not open the slide-over. Consider a `mode` prop or overriding the `row-click` event.
- The add bar at the bottom of the left panel should feel like a "shopping cart checkout" — see creature name, adjust quantity/tier, confirm add.
- Auto-numbering must handle mixed tiers: adding 2 normal "Goblin Warrior" then 1 elite creates "Goblin Warrior 1", "Goblin Warrior 2", "Elite: Goblin Warrior 3" — the numbering is based on the base name, not the tier.

</specifics>

<deferred>
## Deferred Ideas

- **Drag-to-resize panels (WORK-08)** — Deferred to v2 per REQUIREMENTS.md
- **AC/stat adjustments for weak/elite** — PF2e rules include AC, attack, damage, and save adjustments; only HP is in scope for WORK-04
- **Persistent filter state (FILT-01)** — Deferred to v2

</deferred>

---

*Phase: 05-3-panel-combat-workspace*
*Context gathered: 2026-03-21*
