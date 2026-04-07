# Phase 7: SQLite + Foundry VTT Data Pipeline - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

The app reads real Foundry VTT entity data from SQLite — migrations run before React mounts, the sync pipeline imports 28K+ entities from GitHub Release ZIP, FTS5 full-text search works across all entity types, and zero mock data remains in the codebase.

Requirements: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05

</domain>

<decisions>
## Implementation Decisions

### Data source & sync flow
- **D-01:** Sync downloads ZIP from GitHub Releases of the `foundryvtt/pf2e` repository — not local `refs/` parsing
- **D-02:** DM triggers sync manually (e.g., button in Settings page) — not automatic on launch
- **D-03:** Sync is version-aware — tracks which release version is currently imported, enables update detection

### Entity coverage
- **D-04:** Import ALL entities from all 94 content packs (28K+ items) — not just creatures
- **D-05:** Entities classified by `type` field from Foundry JSON (npc, spell, equipment, action, hazard, condition, feat, etc.)
- **D-06:** FTS5 search covers all imported entity types from day one

### Splash screen experience
- **D-07:** Branded splash in PF2e dark fantasy aesthetic (consistent with rest of UI — OKLCH tokens, dark theme)
- **D-08:** App name displayed prominently
- **D-09:** Progress bar at bottom with current stage text ("Running migrations...", "Importing creatures (1,247 / 28,076)...")
- **D-10:** Splash is the first visual impression of the app — should feel polished

### Creature data schema
- **D-11:** Typed SQLite columns for the 12 fields in current Creature interface (name, level, hp, ac, fort, ref, will, perception, traits, rarity, size, type)
- **D-12:** Raw JSON blob column stores the complete Foundry VTT JSON for each entity
- **D-13:** Later phases (8, 9, 10) parse the JSON blob for additional data (IWR, strikes, spells, abilities) as needed

### Claude's Discretion
- DB table schema design (single table vs per-type tables, index strategy)
- FTS5 tokenizer and column configuration
- ZIP download/extraction implementation details
- Drizzle migration file structure
- Content-hash upsert strategy for deduplication
- Exact IPC command strings for tauri-plugin-sql

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches. Key constraint: the sync pipeline must handle the full 28K+ entity volume without UI freezing.

</specifics>

<canonical_refs>
## Canonical References

### Foundry VTT data format
- `refs/pf2e/pathfinder-bestiary/*.json` — Creature entity JSON structure (system.attributes, system.saves, system.traits, system.perception, items[])
- `refs/pf2e/` — 94 content packs, 28,076 JSON files total; entity `type` field classifies content

### Existing stubs (Phase 6 output)
- `src/shared/api/db.ts` — `initDatabase()` and `runMigrations()` stubs to be implemented
- `src/shared/api/creatures.ts` — `fetchCreatures()`, `fetchCreatureById()`, `searchCreatures()` stubs
- `src/shared/api/index.ts` — Barrel export for shared/api/ IPC boundary

### Entity types
- `src/entities/creature/model/types.ts` — Serializable `Creature` interface (12 fields) — the typed columns target
- `src/entities/creature/model/store.ts` — `useCreatureStore` with `setCreatures`, `upsertCreature`, `clearAll`

### Tauri backend
- `src-tauri/Cargo.toml` — Currently only `tauri-plugin-opener`; needs `tauri-plugin-sql` added
- `src-tauri/src/lib.rs` — Minimal Tauri builder; needs SQL plugin registration
- `src-tauri/capabilities/default.json` — Permissions; needs SQL permissions added

### Prior decisions (STATE.md)
- `getSqlite()` raw SQL for performance-critical paths (batch insert, FTS5)
- `import.meta.glob` for Drizzle migrations (Node.js fs crashes in WebView)
- Splash-before-router pattern for async DB initialization
- `shared/api/` is sole Tauri IPC boundary

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `shared/api/` stubs: function signatures already match expected API surface — implement with real SQL
- Entity stores (creature, combatant, condition, encounter): ready to receive data from API layer
- `app/router.tsx`: `createHashRouter` — splash screen wraps or gates this
- PF2e OKLCH design tokens in `app/styles/globals.css` — splash uses same theme

### Established Patterns
- Zustand + immer stores for all entity state
- `shared/api/` centralizes all `invoke()` calls — no SQL outside this layer
- FSD layer import direction enforced by eslint-plugin-boundaries

### Integration Points
- `shared/api/db.ts` → `tauri-plugin-sql` IPC commands
- `shared/api/creatures.ts` → SQL SELECT queries against SQLite
- `app/providers.tsx` or new splash component → gates router mount on DB readiness
- `entities/creature/model/store.ts` → populated from `shared/api/creatures.ts` results

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-sqlite-foundry-vtt-data-pipeline*
*Context gathered: 2026-04-01*
