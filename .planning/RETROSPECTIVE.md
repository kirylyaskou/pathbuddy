# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 -- MVP

**Shipped:** 2026-03-20
**Phases:** 8 | **Plans:** 21 | **Timeline:** 4 days

### What Was Built
- Combat tracker with initiative, HP, conditions, drag-and-drop, auto-round processing
- Tauri 2 desktop app with SQLite + Drizzle ORM + vue-router
- PF2e data sync pipeline (28K+ entities from Foundry VTT GitHub releases)
- Cross-reference resolver linking embedded creature items to canonical entities
- Foundry @-syntax description sanitizer (7-pass regex chain)
- Sync UI with progress stages and version display
- FTS5 full-text search and batch SQL imports

### What Worked
- TDD approach for pure functions (sanitizeDescription, resolveCreatureItems, buildBatchInsertSql) caught edge cases early
- Phase-based planning with clear requirements-to-phase mapping ensured full coverage
- Gap closure plans (Phase 2 plans 05-07) effectively addressed missed requirements after initial execution
- Standalone component pattern (SyncButton owns tile styling) reduced integration friction

### What Was Inefficient
- Phase 2 needed 7 plans (3 gap closures) -- initial planning underestimated complexity of round advancement logic
- COMBAT-01-04 checkboxes in REQUIREMENTS.md were never checked despite being complete -- stale state
- ROADMAP.md traceability table showed Phases 4-8 as "Pending" even after completion -- not updated during execution

### Patterns Established
- vi.mock factory must be self-contained (no top-level captures) -- vitest hoisting constraint
- Splash-before-router pattern for async DB initialization
- getSqlite() raw SQL for performance-critical paths (batch insert, FTS5 search)
- Composite key (slug:entityType) for cross-type entity resolution

### Key Lessons
1. Gap closure plans are a valid recovery mechanism -- plan for them rather than trying to get initial planning perfect
2. STORED generated columns in SQLite require full table recreation -- plan migration complexity accordingly
3. Content-hash pre-fetch with narrow projection avoids loading raw_data for 28K+ rows during sync

---

## Milestone: v1.1 -- Compendium & Combat Workspace

**Shipped:** 2026-03-24
**Phases:** 8 | **Plans:** 21 | **Timeline:** 5 days

### What Was Built
- Dark fantasy RPG design system (charcoal/gold/crimson, Cinzel font, persistent sidebar)
- Full Compendium page: browse, filter (type/level/rarity/family/tags/FTS), and inspect 28K+ entities
- 3-panel Combat Workspace with creature browser, tracker, and live detail panel
- Weak/elite creature support with HP auto-adjustment per PF2e 12-bracket table
- Combat detail panel with live HP, conditions, initiative alongside stat block
- AddCreatureForm removed; browser is sole add-to-combat entry point

### What Worked
- Bottom-up architecture (Phase 02 types/queries -> Phase 03 components -> Phase 04-06 pages) eliminated integration surprises
- Local ref() state (no Pinia) for filter bars prevented cross-context contamination between Compendium and Combat
- Milestone audit + gap closure phase (Phase 08) caught documentation gaps and dead code before shipping
- Shared component pattern (CreatureBrowser with mode prop, StatBlock.vue) enabled reuse across Compendium and Combat with zero duplication
- virtua VList handled 28K entities without UI freezing

### What Was Inefficient
- Phase 06 scope grew significantly (4 plans) -- absorbed CompendiumView rewrite, EntityFilterBar overhaul, and infinite scroll in addition to the core detail panel
- Phase 02 verification remained "human_needed" throughout -- runtime confirmation never done despite being effectively validated by 6 subsequent phases
- Some SUMMARY files lacked requirements_completed frontmatter -- had to be fixed retroactively in Phase 08
- Cosmetic tech debt (orphaned row-click emit, partySize stub) accepted as non-blocking but still shipped

### Patterns Established
- json_each() with AND/OR HAVING for tag filtering on JSON arrays in SQLite
- Inline 2-column layout pattern replacing modal slide-overs for entity inspection
- IntersectionObserver-based infinite scroll with allLoaded sentinel (rows < PAGE_SIZE)
- __testing namespace export pattern for internal-only functions that need test access
- Three-state ref<boolean | null> for async data loading (null=skeleton, false=empty, true=loaded)

### Key Lessons
1. Bottom-up phase ordering (data -> components -> pages) is worth the planning effort -- zero integration rework across 8 phases
2. Milestone audits should run mid-milestone (not just at the end) to catch documentation drift early
3. Shared components with mode props scale better than forking -- CreatureBrowser and EntityFilterBar served both features
4. Phase scope should be guarded more strictly -- Phase 06 absorbed too much adjacent work

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 4 days | 8 | Initial project -- established phase/plan workflow |
| v1.1 | 5 days | 8 | Bottom-up architecture, milestone audit + gap closure phase |

### Cumulative Quality

| Milestone | Plans | Gap Closures | Tests | LOC |
|-----------|-------|--------------|-------|-----|
| v1.0 | 21 | 3 | 178 | 5,189 |
| v1.1 | 21 | 1 (Phase 08) | 331 | 8,514 |

### Top Lessons (Verified Across Milestones)

1. Gap closure plans/phases are a valid recovery mechanism -- used in both v1.0 (3 plans) and v1.1 (Phase 08)
2. Bottom-up phase ordering (data layer -> components -> pages) prevents integration rework
3. Shared components with mode props (CreatureBrowser, EntityFilterBar) scale better than feature forks
