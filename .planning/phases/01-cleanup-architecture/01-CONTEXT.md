# Phase 1: Cleanup + Architecture - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Delete all UI code, strip PWOL, and relocate PF2e engine modules to `/engine` with clean barrel exports and zero UI dependencies. The codebase becomes an engine-only TypeScript project. Frontend lives separately at `D:\parse_data`.

</domain>

<decisions>
## Implementation Decisions

### Engine directory structure
- **D-01:** Grouped by domain — subdirectories for related modules (`conditions/`, `damage/`, `modifiers/`, `encounter/`)
- **D-02:** Single top-level `/engine/index.ts` barrel export only — no per-subdirectory index.ts files. Consumers import from `@/engine`.

### Engine types
- **D-03:** Single `/engine/types.ts` for shared engine types (Creature, CombatState, WeakEliteTier). Exported via barrel. UI-only types like TagLogic deleted.

### Non-PF2e lib files
- **D-04:** `weak-elite.ts` moves into `/engine` (pure PF2e HP adjustment logic per Monster Core)
- **D-05:** `iwr-utils.ts` moves into `/engine` (IWR parsing from Foundry VTT JSON — engine-adjacent)
- **D-06:** All remaining `src/lib/` files deleted — data layer (database.ts, schema.ts, entity-query.ts, search-service.ts, sync-service.ts, migrations.ts, creature-resolver.ts) and UI code (description-sanitizer.ts) are not engine concerns

### Infrastructure cleanup
- **D-07:** Strip to engine-only — remove Vue, Pinia, vue-router, Tailwind, virtua, Tauri plugins, Drizzle ORM, and all UI-related npm dependencies
- **D-08:** Keep TypeScript + Vite minimal — tsconfig.json for path aliases, Vite for potential bundling, npm scripts reduced to just typecheck
- **D-09:** Delete `src-tauri/`, `src/router/`, `src/assets/`, all Vue components, views, stores, composables
- **D-10:** Remove Drizzle ORM — engine is pure TypeScript with zero external dependencies. Data layer moves to consuming project.

### Claude's Discretion
- Exact subdirectory placement of `weak-elite.ts` and `iwr-utils.ts` within `/engine` domain structure
- Which fields from `src/types/combat.ts` Creature interface are engine-relevant vs UI-only (e.g., `isCurrentTurn`, `isDowned` may be UI state)
- Minimal vite.config.ts content after cleanup
- package.json script names and tsconfig paths configuration

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current engine modules
- `src/lib/pf2e/index.ts` — Current barrel export structure (6 modules)
- `src/lib/pf2e/conditions.ts` — ConditionManager, 44 slugs, cascade logic
- `src/lib/pf2e/damage.ts` — Damage type taxonomy, constants
- `src/lib/pf2e/damage-helpers.ts` — DamageCategorization, die size stepping
- `src/lib/pf2e/iwr.ts` — IWR engine (immunity/weakness/resistance application)
- `src/lib/pf2e/modifiers.ts` — Modifier stacking system
- `src/lib/pf2e/xp.ts` — XP & encounter budget calculation

### Files to migrate into engine
- `src/lib/weak-elite.ts` — PF2e weak/elite HP table (Monster Core)
- `src/lib/iwr-utils.ts` — IWR parsing from Foundry VTT JSON

### Files with PWOL references to strip
- `src/lib/pf2e/xp.ts` — PWOL encounter budget variant
- `src/stores/encounter.ts` — PWOL toggle
- `src/components/XpBudgetBar.vue` — PWOL UI toggle
- `src/views/EncounterView.vue` — PWOL state
- `src/lib/migrations.ts` — PWOL migration
- `refs/lang/en.json` — PWOL translation strings

### Reference
- `refs/` — Foundry VTT PF2e source repository (for Phase 2 analysis)

No external specs or ADRs — requirements fully captured in decisions above and REQUIREMENTS.md (CLN-01, CLN-02, ARCH-01, ARCH-02).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/pf2e/` — All 6 engine modules are already pure TypeScript with zero Vue/Pinia/Tauri imports. Direct move to `/engine` subdirectories.
- `src/lib/pf2e/index.ts` — Barrel export pattern can be adapted for new `/engine/index.ts`
- `src/lib/weak-elite.ts` — Ready to move, only imports `WeakEliteTier` type
- `src/lib/iwr-utils.ts` — Ready to move, standalone parsing logic

### Established Patterns
- Barrel re-exports with explicit named exports (not `export *`)
- Type-only exports separated from value exports (`export type { ... }`)
- Source attribution comments referencing Foundry VTT and AON

### Integration Points
- `/engine/index.ts` becomes the sole public API for all PF2e engine logic
- `D:\parse_data` (new UI project) will consume `/engine` via path alias or import
- `refs/` directory provides reference material for Phase 2 analysis

</code_context>

<specifics>
## Specific Ideas

- New UI project lives at `D:\parse_data` (Next.js) — this repo is engine-only
- `refs/` directory is now populated with Foundry VTT PF2e source — Phase 2 is unblocked
- Engine should have zero external npm dependencies — pure TypeScript

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-cleanup-architecture*
*Context gathered: 2026-03-31*
