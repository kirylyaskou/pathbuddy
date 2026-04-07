---
status: resolved
trigger: "combat-browser-filters-broken: Combat tracker creature browser has multiple filter/search failures after Phase 06 overhaul of EntityFilterBar and CreatureBrowser."
created: 2026-03-24T00:00:00Z
updated: 2026-03-24T04:00:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED AND FIXED — BUG 7: CombatDetailPanel queried by pf2eEntities.sourceId (Foundry UUID) but creature.sourceId holds the slug. Changed lookup to eq(pf2eEntities.slug, c.sourceId).
test: 349 tests pass (26 test files). Added regression test in CombatDetailPanel.test.ts verifying eq is called with pf2eEntities.slug not pf2eEntities.sourceId.
expecting: User confirms Elite Glabrezu (and any browser-added creature) now shows stat block in CombatDetailPanel.
next_action: User verification in running app

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: |
  - Name search in combat tracker browser filters creature list in real time
  - Every creature row shows a colored level badge (level number, color based on delta from partyLevel)
  - Selecting "Creature" type in EntityFilterBar keeps showing creatures filtered correctly
  - Only creatures and hazards/traps are addable to combat (not spells, items, potions, feats)

actual: |
  - Name search in combat tracker browser does not work (no filtering occurs)
  - No levels displayed on any creature rows — level badge shows nothing or "–"
  - Selecting entity type filter breaks search completely (results disappear or all results show regardless)
  - Other filter parameters (rarity, level range) also break search
  - Staffs, spells, and potions appear in combat browser and can be added to combat

errors: None reported — silent failures

reproduction: |
  1. Open Combat Tracker page
  2. Type a creature name in the search — list doesn't filter
  3. Open Compendium — filtering seems to work (screenshot shows it working)
  4. Back in Combat Tracker: select "Creature" from Type dropdown — results break
  5. Creature rows in both views show no level badge values

started: After Phase 06 execution (EntityFilterBar + CreatureBrowser overhauled in 06-02)

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: entity-query.ts OFFSET parameterization causes wrong SQL param indices
  evidence: Read all four query paths in entity-query.ts. Param indices are correct — FTS+no-tags uses $1-$8 (matchExpr, 5 filters, limit, offset), FTS+tags uses $1..$6+len(tags)+2, list+no-tags uses $1-$7, list+tags uses $1..$5+len(tags)+2. All parameter arrays match their placeholders.
  timestamp: 2026-03-24T00:02:00Z

- hypothesis: level column missing from SELECT or aliased incorrectly
  evidence: All four SELECT paths in entity-query.ts include `level` (or `e.level`) without aliasing, matching EntityResult.level: number|null. Column mapping is correct.
  timestamp: 2026-03-24T00:02:10Z

- hypothesis: EntityFilterBar watch not firing on filter changes
  evidence: watch([name, entityType, ...], emitFilter, { deep: true }) at line 102 is standard reactive watch. It correctly fires on any ref change. The debounce is in CreatureBrowser (200ms), not EntityFilterBar. The watch chain is intact.
  timestamp: 2026-03-24T00:02:20Z

- hypothesis: CreatureBrowser onMounted doesn't apply defaultEntityType
  evidence: Lines 134-146 explicitly build initialFilter with entityType from props.defaultEntityType and call runQuery(initialFilter). Initial load IS correctly filtered.
  timestamp: 2026-03-24T00:02:30Z

- hypothesis: First-pass fixes resolved all issues (empty-string entityType/rarity + allowedEntityTypes prop)
  evidence: User reports name="GLABREZU" with type="creature" still returns 0 results. entity_type in DB is 'npc' not 'creature' — confirmed by sync-service.ts line 273 storing data.type verbatim and PF2e spec. The || undefined fix was correct for the empty-string case but the 'creature' value itself never existed in the DB.
  timestamp: 2026-03-24T02:00:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-03-24T00:01:00Z
  checked: EntityFilterBar.vue line 149 — <option value="">All types</option>
  found: entityType ref receives empty string "" when "All types" is selected, NOT undefined
  implication: emitFilter() at line 90-99 passes entityType: "" to filterEntities. filterEntities uses filters.entityType ?? null — ?? only coerces undefined/null, NOT "". So "" passes through and SQL executes WHERE entity_type = '' returning zero rows.

- timestamp: 2026-03-24T00:01:10Z
  checked: entity-query.ts lines 200-208 (Path A simple), param array
  found: filters.entityType ?? null — empty string "" is truthy to ??, stays as "". SQL gets $1 = "" and WHERE ($1 IS NULL OR entity_type = $1) becomes WHERE entity_type = '' — zero rows.
  implication: Root cause of "selecting type filter breaks search" and "all filters break search after type interaction"

- timestamp: 2026-03-24T00:01:20Z
  checked: EntityFilterBar.vue line 22: const entityType = ref<string | undefined>(props.defaultEntityType) and line 102: watch([name, entityType, ...], emitFilter)
  found: watch is lazy (no { immediate: true }). On mount, EntityFilterBar does NOT emit filter-change. CreatureBrowser.onMounted at lines 134-146 compensates by building its own initialFilter from props.defaultEntityType. So initial load is correct.
  implication: NOT a bug — initial load works. The broken behavior only appears when user interacts with the filter bar.

- timestamp: 2026-03-24T00:01:30Z
  checked: entity-query.ts — all four query paths, SELECT clauses
  found: Every SELECT path includes level without aliasing (just "level"). EntityResult interface has level: number | null. The column mapping is correct.
  implication: Level badge showing "–" is likely because creature entities do have level=null in the DB for some content types, OR the initial load returns non-creature entities (spells, items) that don't have levels. Since onMounted correctly filters to "creature" type, "–" on all rows would suggest either (a) DB creatures have null level or (b) initial query runs without entityType filter somehow.

- timestamp: 2026-03-24T00:01:40Z
  checked: CreatureBrowser.vue lines 134-146 onMounted, and EntityFilterBar.vue lines 102 watch
  found: onMounted in CreatureBrowser calls runQuery({ entityType: "creature" }). Then EntityFilterBar's watch fires immediately when refs initialize IF immediate:true — but it does NOT have immediate:true, so no double-call. The first query IS filtered to creature. Creature entities in PF2e data all have level values (level -1 through 25). If level shows "–" for all, the data itself has null level or there's a column type mismatch.
  implication: Level bug may be a data issue OR a pre-existing column issue. Need to verify if it's related to the Phase 06 changes.

- timestamp: 2026-03-24T00:01:50Z
  checked: CombatView.vue lines 28-34, EntityFilterBar type options lines 150-156
  found: CombatView passes default-entity-type="creature" but EntityFilterBar shows all 7 type options (creature, spell, hazard, item, feat, action, equipment) with no restriction prop. User can freely change type to spell/item/feat/potion and browse those. CombatAddBar has NO entityType guard — handleAdd fires regardless of entity type.
  implication: Root cause of "staffs, spells, potions appear in combat browser". Fix: either (a) hide type selector in combat mode, or (b) restrict to creature+hazard options only, or (c) guard in CombatAddBar.

- timestamp: 2026-03-24T00:01:55Z
  checked: EntityFilterBar.vue lines 104-108 — watch(entityType, ...) reloads traits when entityType changes
  found: When entityType changes to "" (All types), the watch calls getDistinctTraits(undefined) which runs a global traits query. The family ref is also cleared only if newType !== 'creature'. When entityType is "", family is NOT cleared.
  implication: Minor — family filter persists when switching away from creature via "All types" option. But this is secondary to the main empty-string bug.

- timestamp: 2026-03-24T02:00:00Z
  checked: sync-service.ts line 273 — entityType: data.type
  found: entity_type column is stored verbatim from the PF2e JSON `type` field. PF2e system uses type='npc' for creatures (confirmed by Foundry VTT PF2e template.json spec and web search). The EntityFilterBar dropdown has 'creature' hardcoded as option values — this NEVER matches any DB row.
  implication: ROOT CAUSE A — Filtering by entityType='creature' returns 0 rows always. First-pass fixes did not touch this at all. This is why "GLABREZU" with type=creature returns 0 results.

- timestamp: 2026-03-24T02:01:00Z
  checked: schema.ts line 17 and migrations.ts lines 61 and 135 — level generated column
  found: Level uses `json_extract(raw_data, '$.system.level.value')`. PF2e NPC JSON stores level at `$.system.details.level.value` (an extra 'details' segment). The path $.system.level.value is used for PC characters ('character' type). For NPCs, the correct path is $.system.details.level.value.
  implication: ROOT CAUSE B — level is NULL for every NPC in the DB. Level badges show "–" for all creatures. This is a data/schema bug unrelated to Phase 06 UI changes.

- timestamp: 2026-03-24T02:02:00Z
  checked: entity-query.ts getDistinctFamilies() — WHERE entity_type = 'creature'
  found: Family dropdown query filters by entity_type = 'creature' which also never matches. Family dropdown would always be empty.
  implication: Tertiary consequence of ROOT CAUSE A. Must change to 'npc'.

- timestamp: 2026-03-24T03:00:00Z
  checked: combat.ts addFromBrowser line 402 — sourceId: entity.slug. CombatDetailPanel.vue line 69 — eq(pf2eEntities.sourceId, c.sourceId). schema.ts — sourceId is text('source_id') = Foundry UUID. EntityResult interface — no sourceId field; only slug is available.
  found: addFromBrowser sets creature.sourceId = entity.slug (e.g. "glabrezu"). CombatDetailPanel looks up by pf2eEntities.sourceId which is the Foundry UUID (e.g. "Compendium.pf2e.bestiary.Actor.xxxx"). slug never equals source_id. The query returns 0 rows → rawData stays null → StatBlock renders no-data state → "No compendium entry found" message.
  implication: ROOT CAUSE C — field name collision: both the creature store and the DB column are called "sourceId" but they hold different values. creature.sourceId = slug (string). pf2eEntities.sourceId = Foundry UUID. Fix: in CombatDetailPanel, query by slug column (eq(pf2eEntities.slug, c.sourceId)) since creature.sourceId IS the slug.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  Seven bugs total — first pass fixed 3 (empty-string entityType/rarity, allowedEntityTypes prop), second pass fixed 2 (entity_type 'npc', level JSON path). New third-pass root cause:

  BUG 1 (FIXED) — EntityFilterBar emitFilter() emitted empty string "" for entityType/rarity. Fixed in first pass with || undefined.
  BUG 2 (FIXED) — Same for rarity. Fixed in first pass.
  BUG 3 (FIXED) — AllowedEntityTypes prop added and wired. Fixed in first pass.
  BUG 4 (FIXED) — entity_type in DB is 'npc' not 'creature'. Fixed option values, guards, defaults.
  BUG 5 (FIXED) — level STORED generated column used wrong JSON path. Fixed via migration v4 COALESCE.
  BUG 6 (FIXED) — getDistinctFamilies() WHERE entity_type = 'creature'. Fixed to 'npc'.

  BUG 7 — NEW ROOT CAUSE (current): CombatDetailPanel queries pf2eEntities by sourceId (which holds the Foundry UUID, e.g. "Compendium.pf2e.bestiary.Actor.xxxx"). But addFromBrowser in combat.ts sets creature.sourceId = entity.slug (e.g. "glabrezu"). EntityResult has no sourceId field — slug is the only stable identifier from filterEntities. The DB lookup always returns 0 rows. rawData stays null. StatBlock shows "No compendium entry found."

fix: |
  FIX 7: In CombatDetailPanel.vue line 69, change:
    eq(pf2eEntities.sourceId, c.sourceId)
  to:
    eq(pf2eEntities.slug, c.sourceId)
  because creature.sourceId IS the slug (set by addFromBrowser as entity.slug). The slug column is unique per pack and correctly identifies the entity.

verification: All 349 tests pass (26 test files). Regression test added to CombatDetailPanel.test.ts. Fix self-verified by code tracing — creature.sourceId = slug, lookup now uses pf2eEntities.slug column. Awaiting user confirmation in running app.
files_changed:
  - src/components/EntityFilterBar.vue
  - src/components/CreatureBrowser.vue
  - src/views/CombatView.vue
  - src/lib/entity-query.ts
  - src/lib/schema.ts
  - src/lib/migrations.ts
  - src/lib/__tests__/entity-query.test.ts
  - src/components/__tests__/EntityFilterBar.test.ts
  - src/components/__tests__/CreatureBrowser.test.ts
  - src/views/__tests__/CombatView.test.ts
  - src/components/CombatDetailPanel.vue
