# Phase 8: Combat Tracker + Engine Integration - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Full 3-panel combat workspace — the DM runs encounters with initiative order, HP/tempHP tracking, condition management wired to the engine's ConditionManager (auto-decrement, grant chains, group exclusivity), creature-add from bestiary with auto-rolled initiative, PC quick-add, and SQLite persistence across app restarts.

Requirements: CMB-01, CMB-02, CMB-03, CMB-04, CMB-05, BEST-03

</domain>

<decisions>
## Implementation Decisions

### Panel layout
- **D-01:** 3-column split — Left: initiative list, Center: selected combatant detail (stats, conditions, HP controls), Right: bestiary search panel
- **D-02:** Bestiary panel (right) is always visible — no toggle needed
- **D-03:** Initiative list rows are compact — name, initiative number, HP bar, tiny condition badges. Click a row to see full detail in center panel
- **D-04:** Drag-and-drop reordering of initiative list supported — DM can override rolled initiative or handle delays

### Creature-add flow
- **D-05:** Initiative is auto-rolled from creature's perception modifier + random d20. DM can override after adding
- **D-06:** One-by-one add — DM clicks "Add" for each creature. Auto-numbered names (Goblin 1, Goblin 2) for duplicates
- **D-07:** PCs also addable via quick-add form (name + initiative + max HP). PCs show alongside NPCs in initiative order
- **D-08:** Right panel searches bestiary via FTS5 (28K+ creatures from Phase 7 SQLite data)

### Condition management
- **D-09:** Searchable combobox for applying conditions — type to filter 44 conditions, grouped sections when not filtering. If valued condition selected, number stepper appears
- **D-10:** Grant chains auto-apply with toast notification — e.g., "Grabbed applied → also granted Off-Guard, Immobilized"
- **D-11:** Lock toggle on each condition badge — locked conditions skip auto-decrement at turn end (for spell-sourced or DM-managed conditions)
- **D-12:** Condition badges are colored pills with condition name + value (e.g., "Frightened 2"). Click badge to edit value or remove. Granted conditions show a chain icon

### Turn advancement
- **D-13:** Toast summary on turn advance — brief notification at bottom summarizes changes (e.g., "Orc Brute: Frightened 2 → 1"). Active combatant highlighted with subtle transition
- **D-14:** Previous Turn button goes back one step in initiative order, reversing condition decrements. No full undo stack
- **D-15:** Combat state persists to SQLite — DM can close app mid-combat and resume later
- **D-16:** Auto-save on every change (HP, condition, turn advance) — no manual save needed, no data loss on crash

### Carried forward (locked from prior decisions)
- **D-17:** ConditionManager: module-level Map pattern, NOT in React/Zustand state (Phase 6 D-17)
- **D-18:** Entity state = serializable, SQLite-derived; feature state = session runtime (Phase 6 D-15)
- **D-19:** All IPC through shared/api/ boundary (Phase 6 D-14)
- **D-20:** Phase 7 creature data has typed columns + raw JSON blob — Phase 8 parses JSON blob for IWR/strikes as needed (Phase 7 D-13)
- **D-21:** PF2e dark fantasy OKLCH design system, dark theme default (Phase 5)
- **D-22:** Zustand 5 + immer middleware; useShallow mandatory for object selectors (Phase 6 D-16)

### Claude's Discretion
- Exact column width ratios for the 3-panel layout
- Condition badge color scheme (by category, severity, or single accent)
- Drag-and-drop library choice (dnd-kit, react-beautiful-dnd, or native HTML5)
- SQLite combat persistence schema design (tables, columns, save/load queries)
- Toast notification library and styling
- Auto-roll d20 implementation (Math.random vs crypto)
- Previous Turn state reversal implementation approach
- Exact grouped sections for condition combobox

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — CMB-01 through CMB-05, BEST-03 requirements and success criteria
- `.planning/ROADMAP.md` §Phase 8 — Phase goal, success criteria, dependency on Phase 7

### Prior phase decisions
- `.planning/phases/06-fsd-structure-zustand-stores/06-CONTEXT.md` — Entity/feature slice structure, Zustand patterns, ConditionManager decision
- `.planning/phases/07-sqlite-foundry-vtt-data-pipeline/07-CONTEXT.md` — SQLite schema, creature data model, FTS5 search, shared/api/ stubs

### Engine exports (consumed via @engine)
- `engine/index.ts` — Barrel export with ConditionManager, CONDITION_EFFECTS, CONDITION_OVERRIDES, CONDITION_GROUPS_EXTENDED, EXCLUSIVE_GROUPS, performRecoveryCheck, VALUED_CONDITIONS
- `engine/conditions/condition-effects.ts` — CONDITION_EFFECTS map (auto-decrement targets), CONDITION_OVERRIDES, grant chain definitions
- `engine/conditions/conditions.ts` — ConditionManager class, CONDITION_SLUGS (44 slugs), VALUED_CONDITIONS, CONDITION_GROUPS

### Existing stores (Phase 6 output)
- `src/entities/combatant/model/types.ts` — Combatant interface (id, creatureRef, displayName, initiative, hp, maxHp, tempHp, conditions, isNPC)
- `src/entities/combatant/model/store.ts` — useCombatantStore with add/remove/updateHp/updateTempHp/addCondition/removeCondition/reorderInitiative
- `src/entities/condition/model/types.ts` — ActiveCondition interface (combatantId, slug, value)
- `src/entities/condition/model/store.ts` — useConditionStore with set/remove/decrement/clearCombatantConditions
- `src/features/combat-tracker/model/store.ts` — useCombatTrackerStore (activeCombatantId, round, turn, isRunning)

### Shared API stubs
- `src/shared/api/combat.ts` — saveCombatState(), loadCombatState() stubs — to be implemented with SQLite persistence
- `src/shared/api/creatures.ts` — fetchCreatures(), searchCreatures() — FTS5 search for bestiary panel

### Prototype reference
- `D:/parse_data/app/combat/page.tsx` — Next.js prototype combat tracker (67KB monolith) — reference for UI patterns, NOT for direct copy. Uses local useState, mock data, drag-and-drop, add-creature dialog, auto-decrement, regeneration tracking

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useCombatantStore` — already has HP/tempHP/condition/initiative operations, needs extension for SQLite persistence
- `useConditionStore` — has set/remove/decrement per combatant, needs lock toggle and grant chain logic
- `useCombatTrackerStore` — has round/turn/isRunning, needs previous-turn and auto-save
- 60+ shadcn/ui components in `src/shared/ui/` — Card, Badge, Dialog, DropdownMenu, ScrollArea, Tabs, Tooltip, Progress, Input, Button all available
- PF2e atom components: `LevelBadge`, `TraitPill`, `StatBadge`, `ActionIcon` in `src/shared/ui/`
- `CreatureCard` in `src/entities/creature/ui/` — can be used in bestiary search results

### Established Patterns
- Zustand + immer for all entity/feature stores
- shared/api/ centralizes all invoke() calls
- FSD layer import direction enforced by eslint-plugin-boundaries
- @engine alias resolves across all layers

### Integration Points
- `src/pages/combat/ui/CombatPage.tsx` — currently a placeholder, will become the 3-panel workspace
- `src/shared/api/combat.ts` → SQLite persistence for combat state
- `src/shared/api/creatures.ts` → FTS5 search for bestiary panel
- `src/entities/creature/model/store.ts` → creature data from SQLite for bestiary display
- Engine ConditionManager → module-level instance for condition rule enforcement

</code_context>

<specifics>
## Specific Ideas

- Previous Turn should reverse condition auto-decrements that happened on the forward step — not a full action history, just one step back
- Toast notifications for both condition grant chains and turn-advance summaries — consistent notification pattern
- Prototype combat page (D:/parse_data/app/combat/page.tsx) has regeneration/fast-healing tracking — this is Phase 10 scope (P2 Differentiators), NOT Phase 8

</specifics>

<deferred>
## Deferred Ideas

- Regeneration and fast-healing tracking — Phase 10 (P2 Differentiators)
- Full undo stack (Ctrl+Z for all actions) — future enhancement
- Quantity selector for adding multiple creatures at once — future enhancement
- Combat log panel (persistent scrollable history) — future enhancement

</deferred>

---

*Phase: 08-combat-tracker-engine-integration*
*Context gathered: 2026-04-01*
