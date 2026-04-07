# Phase 6: FSD Structure + Zustand Stores - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Organize the codebase under FSD layers with typed entity and feature slices, stub all Zustand stores with correct ownership (entity = serializable/SQLite-derived, feature = session/in-memory runtime), wire the shared/api/ IPC boundary, and confirm @engine alias resolves across all layers. Phase ends with steiger + eslint-plugin-boundaries passing with zero violations on the reorganized codebase.

</domain>

<decisions>
## Implementation Decisions

### Entity slices
- **D-01:** 7 entity slices: `entities/creature/`, `entities/combatant/`, `entities/condition/`, `entities/encounter/`, `entities/spell/`, `entities/item/`, `entities/hazard/`
- **D-02:** Internal structure per entity: `model/` (types + Zustand store), `ui/` (presentational components), `lib/` (helpers). No `api/` segment — all IPC through `shared/api/`.
- **D-03:** `entities/spell/` and `entities/item/` get minimal skeletons only (directory + `index.ts` barrel + base type stub in `model/`). Full store shape, ui, and lib deferred to after Phase 7 data import reveals actual Foundry VTT entity structure.
- **D-04:** `entities/hazard/` gets the same minimal skeleton treatment as spell/item — fleshed out when needed in Phase 10.

### Feature slices
- **D-05:** 3 feature slices: `features/combat-tracker/`, `features/bestiary-browser/`, `features/encounter-builder/`
- **D-06:** Minimal skeletons for all feature slices (directory + `index.ts` barrel + empty store stub). Content filled in Phase 8-10.

### PF2e component placement
- **D-07:** `creature-card.tsx` + `creature-stat-block.tsx` move from `shared/ui/` to `entities/creature/ui/`
- **D-08:** `xp-budget-bar.tsx` moves from `shared/ui/` to `entities/encounter/ui/`
- **D-09:** Generic PF2e atoms stay in `shared/ui/`: `level-badge`, `trait-pill`, `stat-badge`, `action-icon`
- **D-10:** Moved components become clean presentational components with typed props from `@engine` — no mock data, no local type stubs

### Type sourcing
- **D-11:** All PF2e types (`Creature`, `ActionCost`, etc.) imported directly from `@engine` barrel export — no type duplication in entity slices

### Carried forward (locked from prior decisions)
- **D-12:** FSD layers: `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/` (Phase 5)
- **D-13:** `@engine` alias via `vite-tsconfig-paths` — single source of truth (Phase 5)
- **D-14:** `shared/api/` is sole Tauri IPC boundary — all `invoke()` calls centralized there (ARCH-05)
- **D-15:** Entity state = serializable, SQLite-derived; feature state = session, in-memory runtime (ARCH-04)
- **D-16:** Zustand 5 + immer middleware; `useShallow` mandatory for object selectors
- **D-17:** ConditionManager: module-level Map pattern, NOT in React/Zustand state
- **D-18:** `createHashRouter` for Tauri (no HTML5 history)

### Claude's Discretion
- Internal structure of feature slices (model+ui+lib or subset — decide during planning)
- Store stubbing depth for the 5 full entity slices (creature, combatant, condition, encounter, hazard)
- shared/api/ design (wrapper pattern, function signatures, stub approach)
- Exact file organization within each slice during implementation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### FSD architecture
- `.planning/REQUIREMENTS.md` — ARCH-03, ARCH-04, ARCH-05, ARCH-06 requirements and success criteria
- `.planning/ROADMAP.md` §Phase 6 — Phase goal, success criteria, dependency on Phase 5

### Phase 5 decisions (predecessor)
- `.planning/phases/05-vite-scaffold-nextjs-teardown/05-CONTEXT.md` — FSD linting setup, shell porting, @engine alias decisions

### Engine barrel export
- `engine/index.ts` — All PF2e types and functions available via `@engine` alias. Entity slices import types from here.

### Existing codebase (Phase 5 output)
- `src/shared/ui/creature-card.tsx` — Needs relocation to `entities/creature/ui/`
- `src/shared/ui/creature-stat-block.tsx` — Needs relocation to `entities/creature/ui/`
- `src/shared/ui/xp-budget-bar.tsx` — Needs relocation to `entities/encounter/ui/`
- `src/app/router.tsx` — Current route definitions, integration point for FSD pages
- `src/app/providers.tsx` — App-level providers, may need Zustand provider additions

### Prototype reference
- `D:/parse_data/` — Next.js prototype with original component patterns (for reference only, not direct copy)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 60+ shadcn/ui components in `src/shared/ui/` — stay in shared, already FSD-compliant
- `src/shared/lib/cn.ts` + `src/shared/lib/utils.ts` — utility layer, stays in shared
- `src/shared/hooks/use-mobile.tsx`, `src/shared/hooks/use-toast.ts` — shared hooks
- `src/shared/routes/paths.ts` — route path constants, stays in shared
- `src/widgets/app-shell/` — AppShell, AppSidebar, AppHeader, CommandPalette — already FSD-compliant in widgets layer

### Established Patterns
- FSD barrel exports: each page has `index.ts` re-exporting from `ui/` (e.g., `src/pages/bestiary/index.ts`)
- steiger + eslint-plugin-boundaries already configured from Phase 5
- @engine alias already resolving in tsconfig and Vite config

### Integration Points
- `src/app/router.tsx` — route tree, pages import here
- `src/app/providers.tsx` — app-level context providers
- `src/widgets/app-shell/` — navigation references page routes via `shared/routes/paths.ts`
- `engine/index.ts` — barrel export consumed by entity slices via `@engine`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for all implementation details.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-fsd-structure-zustand-stores*
*Context gathered: 2026-04-01*
