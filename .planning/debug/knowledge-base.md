# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## zip-eocd-sync-failure — reqwest missing User-Agent causes GitHub to return HTML instead of ZIP
- **Date:** 2026-03-20
- **Error patterns:** EOCD, invalid Zip archive, Could not find EOCD, download_file, extract_zip, sync, GitHub, zipball
- **Root cause:** download_file in src-tauri/src/commands.rs used reqwest::get() with no User-Agent header. GitHub API requires User-Agent on all requests and returns a 403 HTML error page without it. That HTML was written to disk as the ZIP file, so extract_zip failed with "Could not find EOCD" because the file was HTML, not a ZIP archive.
- **Fix:** Replace reqwest::get(&url) with a custom reqwest::Client built with .user_agent("pathbuddy"), so the header is present on the initial request and all redirects that reqwest follows automatically.
- **Files changed:** src-tauri/src/commands.rs
---

## combat-browser-filters-broken — seven filter/level/stat-block bugs in combat tracker browser after EntityFilterBar overhaul
- **Date:** 2026-03-24
- **Error patterns:** EntityFilterBar, CreatureBrowser, CombatDetailPanel, creature, filter, level badge, empty string, npc, sourceId, slug, json_extract, allowedEntityTypes, entity_type
- **Root cause:** Seven distinct bugs: (1) EntityFilterBar emitted empty string "" for entityType/rarity (not undefined), causing WHERE entity_type = '' in SQL. (2) Same for rarity. (3) No allowedEntityTypes prop to restrict combat browser to creature/hazard only. (4) entity_type stored as 'npc' in DB but UI filtered for 'creature' — values never matched. (5) level STORED generated column used $.system.level.value JSON path (PC path) instead of $.system.details.level.value (NPC path), making level NULL for all creatures. (6) getDistinctFamilies() WHERE entity_type = 'creature' — same mismatch. (7) CombatDetailPanel queried pf2eEntities by sourceId (Foundry UUID) but addFromBrowser stored entity.slug in creature.sourceId — field name collision caused stat block lookup to always return 0 rows.
- **Fix:** (1,2) Replace empty-string emits with || undefined in EntityFilterBar.emitFilter(). (3) Add allowedEntityTypes prop to EntityFilterBar and filter <select> options in CombatView. (4) Change UI option values and all guards from 'creature' to 'npc'. (5) Add migration v4 that recreates pf2e_entities with COALESCE($.system.details.level.value, $.system.level.value). (6) Fix getDistinctFamilies WHERE to 'npc'. (7) In CombatDetailPanel, change eq(pf2eEntities.sourceId, c.sourceId) to eq(pf2eEntities.slug, c.sourceId).
- **Files changed:** src/components/EntityFilterBar.vue, src/components/CreatureBrowser.vue, src/views/CombatView.vue, src/lib/entity-query.ts, src/lib/schema.ts, src/lib/migrations.ts, src/components/CombatDetailPanel.vue, src/components/__tests__/CombatDetailPanel.test.ts, src/components/__tests__/CreatureBrowser.test.ts, src/components/__tests__/EntityFilterBar.test.ts, src/lib/__tests__/entity-query.test.ts, src/views/__tests__/CombatView.test.ts
---
