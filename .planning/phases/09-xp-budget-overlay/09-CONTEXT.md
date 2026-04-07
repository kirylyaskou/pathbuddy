# Phase 09: XP Budget Overlay - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds a live XP budget overlay to the Combat Workspace header showing encounter XP total, threat rating, and a budget bar that updates reactively as creatures are added/removed. Party configuration (level, size, PWOL) is stored persistently in SQLite. A new useEncounterStore Pinia store is created for shared state between this phase and Phase 10's Encounter Builder.

</domain>

<decisions>
## Implementation Decisions

### Party Configuration UI
- Party level and size controls are inline in the CombatTracker header — minimal friction, always visible
- Party level uses a number stepper (1-20) with +/- buttons matching PF2e level range
- Party size defaults to 4 (PF2e standard party), editable 1-8
- PWOL toggle is a checkbox next to party controls — always accessible

### XP Display & Threat Rating
- XP shown as a badge displaying "120 XP" with threat-colored background — compact, scannable
- Threat label is a pill badge with semantic color per tier: Trivial=grey, Low=green, Moderate=gold, Severe=crimson, Extreme=purple
- Horizontal thin bar below header showing fill vs threshold — visual at-a-glance XP budget bar
- Empty state (no creatures): show "0 XP" with "—" threat label — always visible, no layout shift

### Persistence & Data Architecture
- New `party_config` SQLite table (party_level, party_size, pwol) with single-row pattern — survives app restart per ENC-01
- New `useEncounterStore` Pinia store — shared between Phase 09 header and Phase 10 builder page
- Add `level: number` field to Creature interface, store from raw_data during addFromBrowser — enables XP calc
- Computed property on store — `encounterResult` recalculates when creatures or party config changes

### Claude's Discretion
- Exact Tailwind color tokens for each threat tier (grey/green/gold/crimson/purple mapping)
- Budget bar height and animation (thin horizontal bar design confirmed)
- Number stepper component styling details
- Migration version number for party_config table

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/pf2e/xp.ts` — Full XP engine: calculateXP(), calculateCreatureXP(), generateEncounterBudgets(), calculateEncounterRating(). All functions tested (117 tests).
- `src/stores/combat.ts` — useCombatStore with creatures ref, sortedCreatures computed, addCreature/addFromBrowser actions
- `src/components/CombatTracker.vue` — Sticky header toolbar with title, round badge, action buttons
- `src/components/EntityFilterBar.vue` — Party level/size input pattern (number inputs with watch)

### Established Patterns
- Single Pinia store (useCombatStore) — Phase 09 adds second store (useEncounterStore)
- Local ref() filter state for cross-context isolation
- markRaw() + version counter for non-reactive complex objects (ConditionManager pattern)
- getSqlite() for raw SQL in performance-critical paths
- Drizzle ORM for schema definitions and migrations

### Integration Points
- CombatTracker.vue header (line ~81-106) — where XP overlay inserts
- Creature interface (src/types/combat.ts) — needs level field
- addFromBrowser in combat store — needs to extract and store creature level
- Creature level path: `raw_data.system.details.level.value` from Foundry JSON

</code_context>

<specifics>
## Specific Ideas

- XP engine calculateXP() takes creature levels array, not creature objects — extract levels from store creatures
- generateEncounterBudgets() returns Record<ThreatRating, number> for all 5 tiers — use for budget bar thresholds
- Single-row SQLite pattern for party_config (similar to sync_state table)
- useEncounterStore exposes: partyLevel, partySize, pwol, encounterResult (computed), loadConfig(), saveConfig()

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
