# Milestones

## v1.0.0 PC Import (Pathbuilder 2e) (Shipped: 2026-04-07)

**Phases completed:** 41 phases, 79 plans, 58 tasks

**Key accomplishments:**

- Deleted all 51 UI/Tauri/non-engine files and stripped PWOL variant rule from the XP module, leaving a pure TypeScript engine codebase with 9 engine files and zero framework dependencies.
- Relocated 9 PF2e engine modules from src/lib/ to /engine domain subdirectories, created a single barrel export at engine/index.ts, and reconfigured tsconfig.json and vite.config.ts for engine-only TypeScript with zero typecheck errors.
- One-liner:
- Contracts-first foundation: Creature interface, CONDITION_EFFECTS data map (13 conditions), expanded IWR type arrays (69+ immunity types, 15 weakness extensions, 13 resistance extensions + all-damage), and holy/unholy damage types established for plans 02/03 to code against
- ConditionManager extended with immunity check, override removal, exclusive group enforcement, transitive grant chains (dying->unconscious->blinded+off-guard+prone), grant cascade removal, valued-condition Math.max semantics, and dying death-threshold capping
- PF2e recovery check pure function (performRecoveryCheck) with natural 20/1 flat-check rules, death threshold via doomed, and complete Phase 3 barrel export via @engine
- Full NPC stat block Creature interface, Action type system with declarative outcome maps, and centralized degree-of-success calculator with adjustment pipeline
- 545 PF2e action entries auto-generated from refs/ JSON with 22 hand-coded combat outcome descriptors merged via ACTIONS ReadonlyMap
- Statistic class with base-value-plus-modifier overlay, selector resolver for 11 PF2e condition selectors, CreatureStatistics adapter with auto-inject/eject, and MAP 3-attack modifier sets
- All Phase 4 modules (actions, degree-of-success, statistics, expanded creature types) wired into engine/index.ts barrel export
- Tauri 2 + Vite 6 + React 19 project with full PF2e OKLCH design token system and 13 game-specific color tokens
- 64 shadcn/ui components copied with FSD paths, hash router with 8 pages, and full AppShell navigation chrome (sidebar, header, Ctrl+K command palette)
- eslint-plugin-boundaries v6 + eslint-plugin-import-x + steiger enforce FSD architecture with zero violations; boundaries/dependencies rule uses v6 object-based selectors
- Status:

---

## v2.0 PF2e Game Logic Engine (Shipped: 2026-03-25)

**Phases completed:** 6 phases, 7 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---

## v1.1 Compendium & Combat Workspace (Shipped: 2026-03-24)

**Phases completed:** 8 phases, 21 plans
**Timeline:** 5 days (2026-03-20 -> 2026-03-24)
**LOC:** 8,514 TypeScript/Vue (up from 5,189 at v1.0, +3,325 net)
**Git range:** v1.0..HEAD (132 commits, 62 files changed)
**Requirements:** 15/15 satisfied (COMP-01--08, WORK-01--07)

**Key accomplishments:**

1. Dark fantasy RPG design system -- charcoal/gold/crimson palette, Cinzel headings, persistent sidebar navigation
2. Full Compendium page -- browse, filter, and search 28K+ PF2e entities with inline stat blocks (type, level, rarity, family, tags, FTS)
3. 3-panel Combat Workspace -- creature browser (left) | combat tracker (center) | detail panel (right)
4. Weak/elite creature support -- HP auto-adjusted per PF2e 12-bracket table, tier labels in tracker rows
5. Combat detail panel -- live HP, conditions, initiative alongside stat block on row click
6. AddCreatureForm removed -- creature browser is sole add-to-combat entry point
7. Tech debt cleanup -- dead code deleted, SplashScreen themed, audit gaps closed

**Delivered:** Browsable Compendium for all synced PF2e data and a redesigned 3-panel Combat Workspace with browser-driven creature addition, weak/elite HP presets, and a live detail panel.

---

## v1.0 MVP (Shipped: 2026-03-20)

**Phases completed:** 8 phases, 21 plans
**Timeline:** 4 days (2026-03-17 -> 2026-03-20)
**LOC:** 5,107 TypeScript/Vue + 82 Rust = 5,189 total
**Git range:** feat(01-01) -> feat(08-02) (128 commits, 43 feat)

**Key accomplishments:**

1. Combat tracker with initiative order, HP tracking, conditions, and drag-and-drop reorder
2. Auto-round processing with condition duration decrement, healing/regen, and ongoing damage at turn start
3. Tauri 2 desktop app with SQLite + Drizzle ORM sqlite-proxy, versioned migrations, vue-router, splash screen
4. PF2e data sync pipeline importing 28K+ entities from Foundry VTT GitHub releases via ZIP download
5. Cross-reference system resolving embedded creature items to canonical entities with slide-over detail panel
6. Foundry @-syntax description sanitizer (7-pass regex chain for @UUID, @Damage, @Check, @Template)
7. Sync UI with progress stages, version display, and error handling
8. FTS5 full-text search, batch SQL imports (500/batch), and STORED generated columns for fast filtering

**Delivered:** Foundational PF2e DM assistant with combat automation and Foundry VTT data integration.

---
