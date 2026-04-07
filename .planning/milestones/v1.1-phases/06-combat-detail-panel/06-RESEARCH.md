# Phase 06: Combat Detail Panel - Research

**Researched:** 2026-03-24
**Domain:** Vue 3 component architecture — inline panel, shared stat block, filter overhaul, infinite scroll
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Compendium Layout**
- 2-column split: 30% left (filters + entity list) / 70% right (stat block inline)
- Filters always visible — remove collapse-toggle entirely; filter controls sit permanently at the top of the left column above the entity list
- Placeholder when nothing selected: text-only dark panel — "Select an entity to view its stat block" — no illustration
- Slide-over (CreatureDetailPanel) removed completely — no longer mounted in AppLayout; inline panels replace it everywhere. The `useCreatureDetailStore` and `CreatureDetailPanel.vue` are deleted.
- Filter bug fix: `defaultEntityType` prop on `CreatureBrowser` must initialize `EntityFilterBar`'s `entityType` ref on mount; currently EntityFilterBar ignores it and emits `entityType: undefined` on first interaction, overriding the default

**Filter Controls**
- All filter inputs need visible labels above them (e.g. "Type", "Rarity", "Level", "Name", "Traits")
- Party level + party size controls are always visible at the top of the filter area — not gated behind the Auto toggle. These drive XP calculation per row.
- Remove the "Auto" toggle — level range is set manually; party level is a standalone required control for XP

**Entity List (rows)**
- Level: prominent badge on the right side of each row — colored by level range
- XP: calculated per row relative to current `partyLevel` control value, shown in the row (e.g. "40 XP")
- Entity type icon: small icon/glyph indicating creature / spell / hazard / feat etc.
- Caster indicator: wand or wizard hat icon if the entity has spellcasting entries in rawData — detect at render time from raw data
- Loading strategy: pages of 200 rows; auto-load next page when the user scrolls to the bottom of the list (infinite scroll via VList sentinel). With any filter active, show all matching results directly.
- Row layout (left to right): [type icon] [caster icon?] [name flex-1] [XP] [level badge]

**StatBlock.vue — Shared Component**
- New shared component `src/components/StatBlock.vue` — accepts `rawData` prop (parsed JSON object), pure reference data only, no live combat values
- Used by both the Compendium right column and the Combat Detail Panel (below the live overlay)
- Header block with name (font-display, text-gold), trait pills, stats rows, saves, languages, skills, ability scores grid
- Body sections always expanded — no click-to-reveal
- Canonical cross-reference links (↗) remain for non-unique items
- Back navigation within panel when navigating to a canonical item

**Combat Detail Panel**
- Right column in `CombatView` — `CombatDetailPanel.vue` replaces the placeholder div
- Row selection: clicking a tracker row selects it and populates the right panel — does NOT open a slide-over
- Selected row highlight: gold `border-l-4 border-gold` + slightly lighter background on the selected row in CombatTracker
- Routing change: `CombatTracker.handleOpenDetail` is rerouted — instead of `detailStore.openCreature()`, it emits a `'select'` event with `creatureId`; `CombatView` owns `selectedCombatantId` as local `ref`
- Empty state: placeholder text "Select a creature to view details" when no row is selected
- LiveCombatOverlay block (above StatBlock, read-only): HP, conditions, initiative, tier badge, ongoing damage, regen status, fast healing
- Stat block below overlay: `<StatBlock :raw-data="resolvedRawData" />` — rawData fetched from DB by `creature.sourceId`
- Creatures added via `AddCreatureForm` (manual, no sourceId) show empty stat block area with a note "No compendium data available"

### Claude's Discretion

- Exact color coding for level badge (which thresholds = green/grey/amber/red)
- Icon choices for entity type and caster indicator
- Exact spacing, divider styling, and section padding in StatBlock
- Whether skills are shown as a compact comma list or individual rows
- Scroll behavior when switching selected creatures (scroll stat block to top)
- Loading spinner/skeleton design for stat block while rawData is being fetched

### Deferred Ideas (OUT OF SCOPE)

- Editing HP/conditions from the right panel — read-only overlay for now; editing remains in the center tracker row
- Drag-to-resize panels (WORK-08) — already deferred to v2 in REQUIREMENTS.md
- XP budget encounter builder (ENC-01/ENC-02) — showing XP per row is in scope; the full encounter planning/budget calculator with totals is v2
- AC/save adjustments for Elite/Weak — only HP adjustment is in scope per Phase 05 locked decision
- Persistent filter state (FILT-01) — deferred to v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WORK-06 | Clicking a combat tracker row populates the right detail panel with the creature's full stat block plus live combat state (current HP, conditions, initiative) | CombatTracker.handleOpenDetail already does the DB lookup; Phase 06 reroutes it to emit 'select' + CombatView owns selectedCombatantId ref; CombatDetailPanel.vue is a new component wiring live store fields + StatBlock |
</phase_requirements>

---

## Summary

Phase 06 is a refactor-and-build phase with three parallel work streams that converge in a single delivery. The work is entirely frontend (Vue 3 SFCs + Tailwind) with no new Tauri commands, no new DB tables, and no schema changes.

**Stream 1 (Combat Detail Panel):** CombatTracker's row-click path currently calls `detailStore.openCreature()` — that triggers the slide-over overlay. The reroute is simple: change `handleOpenDetail` to `emit('select', creatureId)`. CombatView adds a `selectedCombatantId` ref and a new `CombatDetailPanel.vue` component receives it. CombatDetailPanel reads live state from `useCombatStore()`, fetches rawData from `pf2eEntities` by `creature.sourceId`, and renders a `LiveCombatOverlay` block above a shared `<StatBlock>` component.

**Stream 2 (StatBlock.vue — new shared component):** The logic for rendering stat blocks already exists verbatim in `CreatureDetailPanel.vue` — `stats` computed, `orderedSections` computed, `resolveCreatureItems()`, `sanitizeDescription()`, scroll-to-top on navigation change. `StatBlock.vue` is a pure extraction of that display logic into a prop-driven component (accepts `rawData: object`, no store dependency). The slide-over `CreatureDetailPanel.vue` is then deleted, along with the `useCreatureDetailStore`.

**Stream 3 (Compendium layout and filter fixes):** `CompendiumView.vue` switches from single-column to 2-column flex layout. `EntityFilterBar.vue` loses its collapse-toggle, gains always-visible labels and partyLevel/partySize controls at the top, and emits `partyLevel`/`partySize` in the filter object. `CreatureBrowser.vue` gains infinite scroll (IntersectionObserver sentinel pattern), richer row layout (type icon, caster icon, XP badge, level badge), and receives `partyLevel` to compute XP per row.

**Primary recommendation:** Build in plan order: (1) StatBlock.vue extraction first (unlocks both Compendium inline and Combat panel), (2) Combat Detail Panel wiring, (3) EntityFilterBar overhaul + CreatureBrowser row/scroll enhancements, (4) CompendiumView 2-column layout. Delete CreatureDetailPanel.vue and creatureDetail.ts in the same plan as the AppLayout cleanup.

---

## Standard Stack

### Core (all already in project — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 (SFCs, Composition API) | ^3.5.13 | Component framework | Project standard |
| Pinia | ^2.3.0 | State management (combat store) | Project standard |
| Tailwind CSS | ^3.4.17 | Utility-class styling | Project standard |
| virtua/vue (VList) | ^0.48.8 | Virtualised entity list | Already in CreatureBrowser; infinite scroll extension |
| Drizzle ORM + tauri-plugin-sql | drizzle ^0.38.0 | DB queries for rawData lookup | Project standard IPC pattern |

### New Runtime APIs (no install — browser/platform)

| API | Purpose | When to Use |
|-----|---------|-------------|
| IntersectionObserver | Infinite scroll sentinel in VList | Trigger page load when last row enters viewport |
| nextTick (Vue) | Scroll-to-top after creature selection change | Existing pattern from CreatureDetailPanel |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| IntersectionObserver sentinel | VList `@scroll` event | scroll event fires continuously; observer is fire-once-per-threshold, simpler |
| Inline stat block (prop-driven) | Keep creatureDetail Pinia store | Store adds indirection; prop-driven component is simpler and removes the global slide-over state |

**Installation:** No new packages required. All dependencies already present.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── StatBlock.vue              # NEW — pure rawData renderer
│   ├── CombatDetailPanel.vue      # NEW — LiveCombatOverlay + StatBlock
│   ├── CombatTracker.vue          # MODIFIED — emit 'select', add selectedId prop
│   ├── CreatureBrowser.vue        # MODIFIED — infinite scroll, richer rows
│   ├── EntityFilterBar.vue        # MODIFIED — always-expanded, labels, partyLevel always-on
│   ├── AppLayout.vue              # MODIFIED — remove CreatureDetailPanel
│   └── CreatureDetailPanel.vue    # DELETE
├── stores/
│   └── creatureDetail.ts          # DELETE
└── views/
    ├── CombatView.vue             # MODIFIED — selectedCombatantId ref, CombatDetailPanel
    └── CompendiumView.vue         # MODIFIED — 2-column layout, StatBlock in right column
```

### Pattern 1: Prop-Driven Shared Stat Block

**What:** `StatBlock.vue` accepts `rawData: object` (parsed JSON from `pf2eEntities.rawData`). All display logic is local — no store reads. The component calls `resolveCreatureItems(rawData)` on mount/watch and renders sections always-expanded.

**When to use:** Anywhere a stat block needs to render — Compendium right column, Combat Detail Panel.

**Key implementation points (from existing CreatureDetailPanel.vue):**
```typescript
// Reuse verbatim from CreatureDetailPanel.vue
const stats = computed(() => {
  const raw = props.rawData
  if (!raw?.system?.attributes) return null
  const attrs = raw.system.attributes
  const saves = raw.system?.saves
  return {
    hp: attrs.hp?.max ?? attrs.hp?.value ?? null,
    ac: attrs.ac?.value ?? null,
    perception: raw.system?.perception?.mod ?? null,
    fortitude: saves?.fortitude?.value ?? null,
    reflex: saves?.reflex?.value ?? null,
    will: saves?.will?.value ?? null,
  }
})
```

Navigation state (back/forward within StatBlock) is local to the component instance — `navigationHistory` ref, not a store. This means Compendium and Combat panels each have independent nav stacks.

### Pattern 2: Event-Up / Ref-Down for Combat Row Selection

**What:** CombatTracker does not own selection state. It emits `'select'` with `creatureId` on row click. CombatView owns `selectedCombatantId = ref<string | null>(null)` and passes it back to CombatTracker as `:selected-id` prop for highlight rendering.

**Why:** Matches the Phase 05 pattern already used for CreatureBrowser (`mode="combat"` emits `'select'`, parent owns `selectedEntity`). Consistent across both panels.

```typescript
// CombatTracker.vue — reroute handleOpenDetail
const handleOpenDetail = (creatureId: string) => {
  emit('select', creatureId)  // was: detailStore.openCreature(rawData, name)
}
```

```vue
<!-- CombatView.vue — wire selection -->
<CombatTracker
  :selected-id="selectedCombatantId"
  @select="selectedCombatantId = $event"
/>
<CombatDetailPanel :creature-id="selectedCombatantId" />
```

### Pattern 3: CombatDetailPanel DB Lookup

**What:** `CombatDetailPanel.vue` receives `creatureId: string | null`. When non-null, it:
1. Finds `creature` in `useCombatStore().creatures` by id
2. Uses `creature.sourceId` to query `pf2eEntities` via `db.select().from(pf2eEntities).where(eq(pf2eEntities.sourceId, creature.sourceId))`
3. Parses `results[0].rawData` and passes to `<StatBlock :raw-data="parsedRawData" />`

This DB lookup pattern already exists in `CombatTracker.handleOpenDetail` — move it to CombatDetailPanel and make it reactive on `creatureId` prop change via `watch`.

**Null sourceId handling:** If `creature.sourceId` is absent (manually-added creature), render `LiveCombatOverlay` normally and show the "No compendium entry found" copy in place of StatBlock.

### Pattern 4: EntityFilterBar `defaultEntityType` Fix

**What:** Currently `EntityFilterBar` has its own `entityType` ref initialized as `undefined`. When `CreatureBrowser` receives `defaultEntityType="creature"`, it calls `runQuery({ entityType: 'creature' })` on mount — but `EntityFilterBar`'s ref is still `undefined`, so any user interaction causes the bar to emit `entityType: undefined`, overriding the default.

**Fix:** Add a `defaultEntityType?: string` prop to `EntityFilterBar`. Initialize `entityType` ref from it:
```typescript
const props = defineProps<{ defaultEntityType?: string }>()
const entityType = ref<string | undefined>(props.defaultEntityType)
```

`CreatureBrowser` passes it down:
```vue
<EntityFilterBar :default-entity-type="defaultEntityType" @filter-change="onFilterChange" />
```

### Pattern 5: Infinite Scroll with IntersectionObserver Sentinel

**What:** Add a sentinel `div` as the last rendered item after the VList content. When it enters the viewport, load the next page.

**How (from existing patterns):**
```typescript
// In CreatureBrowser.vue
const sentinel = ref<HTMLDivElement | null>(null)
const allLoaded = ref(false)

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !loading.value && !allLoaded.value) {
      loadNextPage()
    }
  }, { threshold: 0.1 })
  if (sentinel.value) observer.observe(sentinel.value)
  return () => observer.disconnect()
})
```

**Page size:** 200 rows. `filterEntities` needs an `offset` parameter added:
```typescript
export async function filterEntities(
  filters: EntityFilter,
  limit: number = 200,
  offset: number = 0
): Promise<EntityResult[]>
```

SQL change: add `OFFSET $N` to all four query branches in `filterEntities`.

**Filter-active behavior:** When any filter is active, reset to page 1 (offset = 0) and show all matching results (filters narrow enough that pagination is less critical, but still apply it for consistency).

### Pattern 6: XP Calculation Per Row

**What:** A pure function mapping `(creatureLevel, partyLevel) => xpValue | null`. The XP table is fully defined in the UI-SPEC.

```typescript
// Pure function — no side effects
export function getXpForDelta(delta: number): number | null {
  const XP_TABLE: Record<number, number> = {
    '-4': 10, '-3': 15, '-2': 20, '-1': 30,
    '0': 40, '1': 60, '2': 80, '3': 120, '4': 160
  }
  return XP_TABLE[delta] ?? null
}

// In CreatureBrowser row render:
const xp = computed(() => {
  if (item.entityType !== 'creature' || item.level == null || partyLevel == null) return null
  return getXpForDelta(item.level - partyLevel)
})
```

Display: `"{N} XP"` when value found, `"—"` (em dash) when delta outside ±4 range.

### Anti-Patterns to Avoid

- **Keep creatureDetail store alive:** The whole point of this phase is to delete it. Any new code that imports `useCreatureDetailStore` is wrong.
- **Making StatBlock store-aware:** StatBlock must be a pure display component — no Pinia imports. All data flows through props.
- **Toggling selected row (deselect on re-click):** Selection is set, not toggled. Clicking the already-selected row keeps it selected (confirmed decision in CONTEXT.md).
- **Opening slide-over from CombatTracker row click:** After the reroute, `handleOpenDetail` must never call `detailStore.openCreature()`. The old path must be fully removed.
- **VList with dynamic item-size:** `:item-size=40` is established and fixed. Do not add dynamic height to entity rows.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Virtualised list scrolling | Custom scroll container | virtua VList (already in project) | VList handles layout, overscan, scroll events |
| Infinite scroll trigger | Polling / scroll event listener | IntersectionObserver | Fires once at threshold, not continuously |
| HTML sanitization for ability text | Custom regex | `sanitizeDescription()` in `description-sanitizer.ts` | Already handles PF2e HTML output |
| Canonical item resolution | Re-implement DB lookup | `resolveCreatureItems()` in `creature-resolver.ts` | Handles batch slug lookup with composite key |
| PF2e XP table | Re-derive from rules text | The 9-row table in UI-SPEC (extracted from Archives of Nethys) | Already verified against official source |
| rawData stat extraction | New parsing logic | The `stats` computed pattern from `CreatureDetailPanel.vue` | Already handles null-safety for all stat paths |

**Key insight:** Most of the logic for this phase already exists in `CreatureDetailPanel.vue`. StatBlock.vue is an extraction and cleanup, not a rewrite. The risk of hand-rolling is reimplementing the same null-safety and section ordering logic incorrectly.

---

## Common Pitfalls

### Pitfall 1: EntityFilterBar Emit on Mount

**What goes wrong:** After adding `defaultEntityType` prop, the component emits `filter-change` via the `watch` watcher on mount. This triggers `runQuery` twice — once from `onMounted` and once from the watcher. Results may flash or show wrong count.

**Why it happens:** `watch([name, entityType, ...], emitFilter)` without `{ immediate: false }` fires synchronously when deps change, including on prop-driven initialization.

**How to avoid:** Keep `{ immediate: false }` on the main filter watcher (already the default for `watch` in Vue 3 when not explicitly set). The `onMounted` call in `CreatureBrowser` handles initial load; the watcher handles subsequent changes.

**Warning signs:** Double query on initial render — check Vue devtools for duplicate `filter-change` emissions.

### Pitfall 2: Vitest Hoisting — vi.mock Factory Self-Containment

**What goes wrong:** The existing `CombatView.test.ts` mocks `@/lib/database` with a factory that references outer variables. New tests for `CombatDetailPanel.vue` must not capture top-level refs in mock factories.

**Why it happens:** Vitest hoists `vi.mock()` calls to the top of the file before imports execute. Any variable captured from the outer scope is `undefined` at hoist time.

**How to avoid:** Keep all mock factories self-contained:
```typescript
// CORRECT
vi.mock('@/lib/database', () => ({
  db: { select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }) },
}))
// WRONG — captures outer variable
const mockResult = [...]
vi.mock('@/lib/database', () => ({ db: { select: vi.fn().mockResolvedValue(mockResult) } }))
```

### Pitfall 3: filterEntities OFFSET in All Four Query Branches

**What goes wrong:** `filterEntities` has 4 code paths (FTS + tags, FTS no tags, list-all + tags, list-all no tags). Adding `offset` to only 1–2 branches causes inconsistent pagination behavior.

**Why it happens:** Copy-paste miss when adding `OFFSET $N` to the SQL strings.

**How to avoid:** Add `offset` parameter to all four `SELECT` statements and all four parameter arrays. Verify each branch has the same `OFFSET` clause position.

### Pitfall 4: CombatDetailPanel Watch Timing — Stale Creature Data

**What goes wrong:** `CombatDetailPanel` watches `creatureId` prop and fetches rawData. If the fetch is `async` and the component rerenders mid-fetch (e.g., user clicks another row), the first fetch resolves and overwrites the second.

**Why it happens:** Race condition between sequential DB fetches for different `creatureId` values.

**How to avoid:** Cancel in-flight request when `creatureId` changes. Use a local `requestId` counter:
```typescript
let currentRequestId = 0
watch(() => props.creatureId, async (id) => {
  const reqId = ++currentRequestId
  rawData.value = null
  if (!id) return
  // ... fetch ...
  if (reqId !== currentRequestId) return  // stale — discard
  rawData.value = result
})
```

### Pitfall 5: AppLayout.vue Still Imports CreatureDetailPanel

**What goes wrong:** After deleting `CreatureDetailPanel.vue`, the TypeScript build fails because `AppLayout.vue` still imports it.

**Why it happens:** Deletion of the file without updating the importer.

**How to avoid:** The AppLayout cleanup (remove import + `<CreatureDetailPanel />` usage) must be in the same plan as the file deletion. Verify with `npm run build` (or `vue-tsc`) after the plan.

### Pitfall 6: CombatTracker Test Breakage — handleOpenDetail Reroute

**What goes wrong:** The existing `CombatTracker.test.ts` does not test `handleOpenDetail` directly, but after the reroute the component no longer imports `useCreatureDetailStore`. If any existing test file imports or mocks `useCreatureDetailStore` for `CombatTracker`, it will fail.

**Why it happens:** The existing test mocks `@/lib/database` for `CombatTracker` (the old `handleOpenDetail` used it). After the reroute, `handleOpenDetail` no longer does a DB call — only the emit. The mock can remain but the `detailStore.openCreature` assertion path disappears.

**How to avoid:** Update `CombatTracker.test.ts` to add a `'select'` event emission test and remove any tests that assert on `detailStore.openCreature` being called.

### Pitfall 7: CompendiumView Test — Right-Panel StatBlock Mock

**What goes wrong:** The existing `CompendiumView.test.ts` stubs `CreatureBrowser` completely. After the 2-column layout change, tests assert on layout structure that may now differ (e.g., `flex-1 min-h-0` wrapper is gone; `flex` container is now the outer element).

**Why it happens:** Tests asserting CSS class names on wrapper elements are brittle when layout changes.

**How to avoid:** Update `CompendiumView.test.ts` to assert on the 2-column layout classes and the StatBlock stub/placeholder presence. Stub `StatBlock.vue` with a named stub.

---

## Code Examples

### Stat Extraction (from CreatureDetailPanel.vue — verified source of truth)

```typescript
// Source: src/components/CreatureDetailPanel.vue (existing)
const stats = computed(() => {
  const raw = props.rawData  // was: store.selectedCreatureRawData
  if (!raw?.system?.attributes) return null
  const attrs = raw.system.attributes
  const saves = raw.system?.saves
  return {
    hp: attrs.hp?.max ?? attrs.hp?.value ?? null,
    ac: attrs.ac?.value ?? null,
    perception: raw.system?.perception?.mod ?? null,
    fortitude: saves?.fortitude?.value ?? null,
    reflex: saves?.reflex?.value ?? null,
    will: saves?.will?.value ?? null,
  }
})
```

### Section Config (from CreatureDetailPanel.vue — verified source of truth)

```typescript
// Source: src/components/CreatureDetailPanel.vue (existing)
const SECTION_CONFIG = [
  { key: 'melee',       label: 'Melee Strikes',     types: ['melee'] },
  { key: 'ranged',      label: 'Ranged Strikes',     types: ['ranged'] },
  { key: 'spellcasting',label: 'Spellcasting',       types: ['spell', 'spellcastingEntry'] },
  { key: 'actions',     label: 'Actions & Abilities',types: ['feat', 'action'] },
  { key: 'equipment',   label: 'Equipment',          types: ['equipment', 'weapon', 'armor'] },
]
```

### Caster Detection (render-time, from rawData)

```typescript
// Detect spellcasting entries from rawData items array
function hasCasting(rawDataString: string): boolean {
  try {
    const data = JSON.parse(rawDataString)
    return (data?.items ?? []).some(
      (item: any) => item.type === 'spellcastingEntry' || item.type === 'spell'
    )
  } catch {
    return false
  }
}
```

### XP Table (from UI-SPEC, verified against AoN Table 10-2)

```typescript
const XP_DELTA_MAP: Record<number, number> = {
  [-4]: 10, [-3]: 15, [-2]: 20, [-1]: 30,
  [0]: 40, [1]: 60, [2]: 80, [3]: 120, [4]: 160,
}

function getXpForCreature(creatureLevel: number, partyLevel: number): number | null {
  const delta = creatureLevel - partyLevel
  return XP_DELTA_MAP[delta] ?? null
}
```

### HP Bar Color (from CreatureCard.vue — verified source of truth)

```typescript
// Source: src/components/CreatureCard.vue (existing)
const hpBarColor = computed(() => {
  if (hpPercent.value > 50) return 'bg-gold'
  if (hpPercent.value > 25) return 'bg-amber-600'
  return 'bg-crimson-light'
})
```

### Scroll-to-Top on Entity Change (from CreatureDetailPanel.vue — verified pattern)

```typescript
// Source: src/components/CreatureDetailPanel.vue (existing)
await nextTick()
if (panelEl.value && typeof panelEl.value.scrollTo === 'function') {
  panelEl.value.scrollTo(0, 0)
}
```

### filterEntities with Offset (new parameter — follows existing pattern)

```typescript
// Modification to src/lib/entity-query.ts
export async function filterEntities(
  filters: EntityFilter,
  limit: number = 200,
  offset: number = 0
): Promise<EntityResult[]> {
  // ...existing query construction...
  // Add OFFSET to all four SELECT statements:
  // LIMIT $N OFFSET $M
  // Pass offset as last-before-limit or after-limit parameter
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Slide-over panel (creatureDetail Pinia store) | Inline panel (prop-driven) | Phase 06 | Removes global state, simplifies testing |
| Collapse-toggle in EntityFilterBar | Always-visible filters | Phase 06 | Better DX for DM who needs fast filter access |
| 100-row hard limit in CreatureBrowser | 200-row pages + infinite scroll | Phase 06 | Larger compendium browsable without manual filter |
| Single-column Compendium layout | 2-column split (30/70) | Phase 06 | Inline stat block without modal interruption |

**Deprecated/outdated after this phase:**
- `CreatureDetailPanel.vue`: deleted — replaced by `StatBlock.vue` used inline
- `useCreatureDetailStore` (`stores/creatureDetail.ts`): deleted — state flows through local refs
- `CombatTracker.handleOpenDetail` DB lookup: moved to `CombatDetailPanel.vue` as a reactive watcher

---

## Open Questions

1. **Trait pills in StatBlock header — source path in rawData**
   - What we know: Rarity is at `$.system.traits.rarity` (confirmed from schema.ts STORED column). The trait array is at `$.system.traits.value` (confirmed from entity-query.ts json_each usage).
   - What's unclear: Alignment and size fields — not confirmed paths. `$.system.details.alignment.value` and `$.system.traits.size.value` are probable but not verified against live data.
   - Recommendation: In Wave 0 of implementation, add a debug log to dump a sample rawData object and confirm these paths before committing the StatBlock header template. Fall back to omitting alignment/size if paths are absent.

2. **Speed field path in rawData**
   - What we know: `$.system.attributes.speed` exists for creatures but the format may be `{ value: 25 }` or `{ total: 25 }` or an object with multiple movement types.
   - What's unclear: Which sub-key to use for the primary speed displayed in the header.
   - Recommendation: Check `raw.system.attributes.speed?.total ?? raw.system.attributes.speed?.value ?? raw.system.attributes.speed` at render time; display the result if it's a number.

3. **Skills and Languages paths in rawData**
   - What we know: Languages and skills are creature attributes stored in rawData but the specific JSON paths are not used elsewhere in the codebase.
   - What's unclear: Exact paths — `$.system.details.languages` vs `$.system.languages`, `$.system.skills` vs embedded items.
   - Recommendation: Treat as optional sections. If the path yields no data, omit the section. Do not block implementation.

4. **Ability Scores path in rawData**
   - What we know: `$.system.abilities.dex.mod` is used in `combat.ts` `addFromBrowser`, confirming the `system.abilities` path exists.
   - Confirmed fields: `str`, `dex`, `con`, `int`, `wis`, `cha` with `.mod` sub-key.
   - Recommendation: HIGH confidence on `raw.system.abilities.{str|dex|con|int|wis|cha}.mod` — use directly.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^2.1.8 |
| Config file | `vitest.config.ts` (test block embedded in vite.config) |
| Quick run command | `pnpm test` (or `npm test`) — runs `vitest run` |
| Full suite command | `pnpm test` — same; no watch mode in CI |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WORK-06 | Clicking CombatTracker row emits 'select' with creatureId | unit | `pnpm test -- CombatTracker` | ✅ (update existing) |
| WORK-06 | CombatView sets selectedCombatantId on 'select' from CombatTracker | unit | `pnpm test -- CombatView` | ✅ (update existing) |
| WORK-06 | CombatDetailPanel renders LiveCombatOverlay when creatureId is set | unit | `pnpm test -- CombatDetailPanel` | ❌ Wave 0 |
| WORK-06 | CombatDetailPanel renders empty state when creatureId is null | unit | `pnpm test -- CombatDetailPanel` | ❌ Wave 0 |
| WORK-06 | CombatDetailPanel shows HP/conditions/initiative from combat store | unit | `pnpm test -- CombatDetailPanel` | ❌ Wave 0 |
| WORK-06 | StatBlock renders entity name and stat values from rawData | unit | `pnpm test -- StatBlock` | ❌ Wave 0 |
| WORK-06 | StatBlock renders "No compendium entry" when rawData is null | unit | `pnpm test -- StatBlock` | ❌ Wave 0 |
| WORK-06 | Selected row in CombatTracker has border-l-4 border-gold class | unit | `pnpm test -- CombatTracker` | ✅ (update existing) |

### Regression Test Map (COMP-01 through COMP-08)

| Reg ID | Behavior | Test Type | File Exists? |
|--------|----------|-----------|-------------|
| COMP layout | CompendiumView renders 2-column flex layout | unit | ✅ (update CompendiumView.test.ts) |
| COMP filter | EntityFilterBar initializes entityType from defaultEntityType prop | unit | ✅ (update EntityFilterBar.test.ts) |
| COMP filter | EntityFilterBar has no collapse toggle | unit | ✅ (update EntityFilterBar.test.ts) |
| COMP browser | CreatureBrowser row renders level badge and XP badge | unit | ✅ (update CreatureBrowser.test.ts) |
| AppLayout | AppLayout does not render CreatureDetailPanel | unit | ✅ (update AppLayout.test.ts) |

### Sampling Rate

- **Per task commit:** `pnpm test -- {component-under-test}` (targeted run)
- **Per wave merge:** `pnpm test` (full suite — all 27 test files)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/__tests__/StatBlock.test.ts` — covers WORK-06 StatBlock rendering
- [ ] `src/components/__tests__/CombatDetailPanel.test.ts` — covers WORK-06 panel behavior
- [ ] `src/lib/__tests__/xp-calculator.test.ts` — covers XP delta table (if extracted to own file)

---

## Sources

### Primary (HIGH confidence)

- `src/components/CreatureDetailPanel.vue` — complete stat block rendering logic, section config, scroll-to-top pattern, canonical navigation, description click delegation
- `src/components/CombatTracker.vue` — `handleOpenDetail` current implementation (DB lookup + detailStore.openCreature)
- `src/views/CombatView.vue` — current 3-panel layout, selectedEntity ref pattern
- `src/views/CompendiumView.vue` — current single-column layout
- `src/components/CreatureBrowser.vue` — VList usage, mode prop, selectedId highlight, filterEntities call pattern
- `src/components/EntityFilterBar.vue` — collapse-toggle pattern (to be removed), emitFilter structure, autoActive gating
- `src/stores/combat.ts` — all live overlay fields confirmed present: `currentHP`, `maxHP`, `conditions`, `conditionValues`, `initiative`, `tier`, `ongoingDamage`, `regenAmount`, `regenerationDisabled`
- `src/types/combat.ts` — Creature interface confirms `sourceId`, `tier`, `regenAmount`, `ongoingDamage`, `conditionValues` are all optional fields
- `src/lib/entity-query.ts` — `filterEntities` signature, four query branches, offset addition point
- `src/lib/creature-resolver.ts` — `resolveCreatureItems` API
- `src/lib/schema.ts` — `pf2eEntities.sourceId` column confirmed for DB lookup
- `src/components/CreatureCard.vue` — HP bar color thresholds (bg-gold / bg-amber-600 / bg-crimson-light)
- `.planning/phases/06-combat-detail-panel/06-UI-SPEC.md` — XP table, color tokens, spacing, copywriting contract
- `.planning/phases/06-combat-detail-panel/06-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)

- Archives of Nethys Table 10-2 (via UI-SPEC extraction) — XP per creature relative to party level. Extracted values: -4→10, -3→15, -2→20, -1→30, 0→40, +1→60, +2→80, +3→120, +4→160. Not independently re-fetched this session; UI-SPEC author confirms it was read from https://2e.aonprd.com/Rules.aspx?ID=2717.

### Tertiary (LOW confidence)

- Alignment/size/speed rawData paths — not directly confirmed from source code; inferred from PF2e system conventions. Must be verified at implementation time.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use; no new dependencies
- Architecture patterns: HIGH — all patterns either copied from existing code or follow established Phase 05 conventions
- Pitfalls: HIGH — all pitfalls derived from actual code analysis (existing test files, actual component implementations)
- Stat block rawData paths (non-HP): MEDIUM — hp/ac/perception/saves confirmed in CreatureDetailPanel.vue; alignment/size/speed/skills/languages are probable but not confirmed

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable stack; only risk is PF2e rawData schema changes from upstream sync)
