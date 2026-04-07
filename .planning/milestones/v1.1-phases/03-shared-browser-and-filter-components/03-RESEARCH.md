# Phase 03: Shared Browser and Filter Components - Research

**Researched:** 2026-03-21
**Domain:** Vue 3 component architecture — virtualised list, filter state, SQLite json_each query, dark fantasy design tokens
**Confidence:** HIGH (codebase-derived); MEDIUM (virtualisation library selection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Filter Bar Layout**
- Collapsible filter panel above the entity list — toggle button to expand/collapse
- When collapsed, active filters show as a summary chip row below the toggle (e.g. "Level: 5–10 ×" "Rarity: Rare ×") — each chip has × to clear that individual filter
- When expanded, panel contains all filter controls in a structured layout
- Panel remembers open/closed state during the session (local component state, not persisted)

**Level Range Filter**
- Two number inputs for min and max level (changeable range)
- "Auto" button that calculates appropriate creature level range based on PF2e encounter rules for a party of N adventurers at level M
- Auto button needs a small inline party config (party size + party level inputs) — these inputs appear when "Auto" is clicked
- PF2e encounter rules reference: creatures from party level -4 to party level +4 are standard encounter range (trivial to extreme)

**Rarity and Entity Type Filters**
- Standard dropdown selects for both
- Rarity: common / uncommon / rare / unique
- Entity type: creature / spell / hazard / item / feat / etc. (populated from distinct values in database)

**Family Filter (COMP-06)**
- Dropdown select for family, populated from distinct non-null `family` values in the database
- Only shown when entity type is "creature" (family is creature-specific)
- Verify `$.system.details.family` JSON path against actual synced data during research (MEDIUM confidence from Phase 02)

**Tags/Traits Filter (COMP-07)**
- Searchable multi-select dropdown — type to search available traits, click to add
- Selected traits appear as removable pill chips
- Available traits list populated from distinct values in the database (json_each on raw_data traits path)
- User-toggleable AND/OR logic: small toggle switch lets user choose between "match ALL selected tags" (AND) and "match ANY selected tag" (OR)
- Traits JSON path: needs investigation during research (likely `$.system.traits.value` but must verify against actual raw_data)
- Wire the `tags` field in `filterEntities()` SQL — Phase 02 typed it but skipped the `json_each` implementation

**Creature List Display**
- Compact single-line rows: Name | Level badge | Rarity dot | Family tag
- Dark charcoal rows with subtle separators
- Clicking a row opens the existing CreatureDetailPanel slide-over (reuse existing component)
- Virtualised scrolling for 28K entities — fixed row height for simple virtualisation

**WeakEliteSelector**
- Segmented control with three buttons: [Weak | Normal | Elite]
- Gold highlight on the selected segment
- Shows adjusted HP delta in real time (e.g. "Elite: +20 HP") using `getHpAdjustment()` from Phase 02
- This is a standalone component — consumed by Combat Workspace (Phase 05) when adding creatures

**Component Architecture**
- All filter state is local to EntityFilterBar (no Pinia store) — per Phase 02 SC-4
- EntityFilterBar emits `EntityFilter` objects on change — consumers call `filterEntities()` themselves
- CreatureBrowser composes EntityFilterBar + virtualised list + passes click events up
- WeakEliteSelector is a separate standalone component (not part of CreatureBrowser)

### Claude's Discretion
- Virtualisation library choice (vue-virtual-scroller, custom, etc.)
- Result count display and empty state design
- Exact collapsible panel animation/transition
- Dropdown component implementation (native select vs custom)
- Auto level range calculation formula details

### Deferred Ideas (OUT OF SCOPE)
- **Arbitrary creature level adjustment** — User wants ability to adjust creatures to any level (e.g. making a level 20 creature into level 6). PF2e official rules only support +1/-1 via weak/elite; arbitrary adjustment requires GM Core creature building rules which is a substantial new capability. Defer to a future phase.
- **Condition list rework** — Current `combat.ts` has only 11 conditions with errors: uses legacy `flat-footed` (should be `off-guard`), uses `grappled` (should be `grabbed`), has `incapacitated` (not a standard PF2e condition), missing 31 conditions from the PF2e Remaster Player Core (42 total). Numeric condition values (stunned 2, frightened 3) cannot be changed in the UI. This is a combat tracker fix, not a Phase 03 item — should be its own phase or inserted as a bug fix.
- **Persistent filter state across sessions** — FILT-01, deferred to v2 per REQUIREMENTS.md
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-06 | User can filter creatures by family type (e.g. Dragon, Undead, Goblin) — requires JSON path verification (`$.system.details.family`) before implementing | `family` STORED column exists from migration v3; dropdown values from `SELECT DISTINCT family FROM pf2e_entities WHERE family IS NOT NULL`; only visible when entityType = 'creature' |
| COMP-07 | User can filter entities by tags/traits — requires `json_each()` query pattern on raw_data traits array | Tags path likely `$.system.traits.value`; `filterEntities()` already typed for `tags?: string[]` but skips implementation; json_each must be appended AFTER STORED column filters (PITFALLS.md Pitfall 4) |
</phase_requirements>

---

## Summary

Phase 03 builds three reusable components — `EntityFilterBar`, `CreatureBrowser`, and `WeakEliteSelector` — plus completes the `filterEntities()` SQL with `json_each` for tags. The codebase foundation is solid: `entity-query.ts`, `weak-elite.ts`, the design token system, and existing test infrastructure are all in place from Phase 02.

The primary technical risks are: (1) verifying the `$.system.details.family` JSON path used in the migration v3 STORED column is correct against live data; (2) implementing `json_each` for traits so that it runs after STORED-column pre-filters, not before; and (3) virtualising the creature list correctly without adding a heavy dependency. All three are addressable with the patterns already documented in PITFALLS.md.

The component architecture is fully locked: local `ref`/`reactive` state inside `EntityFilterBar`, emitting `EntityFilter` objects upward, with `CreatureBrowser` as the composing parent. No Pinia store for filter state. `WeakEliteSelector` is standalone and delegates math to `getHpAdjustment()` / `getAdjustedLevel()` already in `weak-elite.ts`.

**Primary recommendation:** Build in four logical tasks — (1) wire tags SQL in `filterEntities()` + verify family path, (2) `EntityFilterBar` component, (3) `CreatureBrowser` with virtualised list, (4) `WeakEliteSelector`. Test each at the unit level before composing.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 (composition API) | ^3.5.13 (in package.json) | Component model | Already in project |
| Tailwind CSS | ^3.4.17 | Styling via design tokens | Already in project; custom charcoal/gold/crimson tokens in tailwind.config.js |
| Pinia | ^2.3.0 | Stores (creatureDetailStore only) | Already in project; NOT used for filter state in this phase |
| `@vue/test-utils` | ^2.4.6 | Component testing | Already in project |
| Vitest | ^2.1.8 | Test runner | Already in project; run with `npm test` |

### Virtualisation (Claude's Discretion)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| virtua | 0.48.8 (latest verified) | Virtual scroll — Vue 3 first-class, no SSR overhead | **Recommended** — smallest, fully Vue 3, no beta tag, actively maintained |
| vue-virtual-scroller | 2.0.0-beta.8 | Virtual scroll — established API but still beta for Vue 3 | Alternative if virtua has issues; beta status is a risk |
| @tanstack/vue-virtual | 3.13.23 | Headless virtual scroll — max control | Overkill for fixed-row-height use case |

**Recommendation: use `virtua` (`VList` component).** It is the only non-beta option with native Vue 3 support, fixed-row-height mode, and minimal bundle footprint. vue-virtual-scroller `@next` is still beta (`2.0.0-beta.8`) and has been in beta for years. If the team prefers a simpler no-library approach: cap results at 50 rows per PITFALLS.md Pitfall 10 — eliminates the virtualisation problem entirely for v1.1.

**Decision point for planner:** The plan should offer Wave 0 with 50-row cap (no new library), Wave 1 with virtua if cap is unacceptable. Given that the user explicitly asked for virtualised scrolling for 28K entities, virtua is the path.

**Installation (if virtua chosen):**
```bash
npm install virtua
```

### No New Libraries Required Otherwise
All other needs (dropdowns, chips, transitions) are satisfied with native HTML elements + Tailwind. Native `<select>` is the locked default; custom dropdown only if UX demands it.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── EntityFilterBar.vue      # Filter controls + active chip summary
│   ├── CreatureBrowser.vue      # Composes EntityFilterBar + virtualised list
│   └── WeakEliteSelector.vue   # Standalone segmented control
├── lib/
│   └── entity-query.ts          # MODIFY: wire tags json_each, expose getDistinctFamilies(), getDistinctTraits()
└── components/__tests__/
    ├── EntityFilterBar.test.ts
    ├── CreatureBrowser.test.ts
    └── WeakEliteSelector.test.ts
```

### Pattern 1: EntityFilterBar — Local Reactive State + Emit

**What:** All filter fields are `ref()` inside `EntityFilterBar.vue`. On any change, compute an `EntityFilter` object and emit `'filter-change'`. Parent (CreatureBrowser) receives it and calls `filterEntities()`.

**When to use:** Any time multiple filter controls must be coordinated without sharing state via a store.

```typescript
// EntityFilterBar.vue <script setup>
const emit = defineEmits<{
  'filter-change': [filter: EntityFilter]
}>()

const entityType = ref<string | undefined>()
const levelMin   = ref<number | undefined>()
const levelMax   = ref<number | undefined>()
const rarity     = ref<string | undefined>()
const family     = ref<string | undefined>()
const tags       = ref<string[]>([])
const expanded   = ref(false)

// Derived active chips (for collapsed summary row)
const activeChips = computed(() => {
  const chips: Array<{ label: string; key: string }> = []
  if (levelMin.value !== undefined || levelMax.value !== undefined) {
    chips.push({ label: `Level: ${levelMin.value ?? '–'}–${levelMax.value ?? '–'}`, key: 'level' })
  }
  if (rarity.value)     chips.push({ label: `Rarity: ${rarity.value}`, key: 'rarity' })
  if (family.value)     chips.push({ label: `Family: ${family.value}`, key: 'family' })
  tags.value.forEach(t => chips.push({ label: t, key: `tag:${t}` }))
  return chips
})

function clearChip(key: string) {
  if (key === 'level') { levelMin.value = undefined; levelMax.value = undefined }
  else if (key === 'rarity') { rarity.value = undefined }
  else if (key === 'family') { family.value = undefined }
  else if (key.startsWith('tag:')) { tags.value = tags.value.filter(t => t !== key.slice(4)) }
  emitFilter()
}

function emitFilter() {
  emit('filter-change', {
    entityType: entityType.value,
    levelMin: levelMin.value,
    levelMax: levelMax.value,
    rarity: rarity.value,
    family: entityType.value === 'creature' ? family.value : undefined,
    tags: tags.value.length ? tags.value : undefined,
  })
}

watch([entityType, levelMin, levelMax, rarity, family, tags], emitFilter, { deep: true })
```

### Pattern 2: CreatureBrowser — Compose + Debounce

**What:** CreatureBrowser owns the result list and loading state. It receives filter changes from EntityFilterBar, debounces the IPC call (200ms per PITFALLS.md), calls `filterEntities()`, and renders results in a virtualised list.

```typescript
// CreatureBrowser.vue <script setup>
import { useCreatureDetailStore } from '@/stores/creatureDetail'

const props = defineProps<{ defaultEntityType?: string }>()
const emit  = defineEmits<{ 'row-click': [result: EntityResult] }>()

const results    = ref<EntityResult[]>([])
const loading    = ref(false)
const lastFilter = ref<EntityFilter>({})

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onFilterChange(filter: EntityFilter) {
  lastFilter.value = filter
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => runQuery(filter), 200)
}

async function runQuery(filter: EntityFilter) {
  loading.value = true
  try {
    results.value = await filterEntities(filter, 100)
  } finally {
    loading.value = false
  }
}
```

### Pattern 3: tags json_each SQL — STORED columns filter first

**What:** Tags filter in `filterEntities()` uses `json_each` on `raw_data`. MUST run after entity_type, level, rarity, family STORED column filters to avoid scanning 28K JSON blobs.

```sql
-- Path A extension (list-all, with tags AND logic)
SELECT DISTINCT e.id, e.name, e.entity_type as entityType, e.pack, e.slug,
                e.level, e.rarity, e.family, e.raw_data as rawData
FROM pf2e_entities e
JOIN json_each(e.raw_data, '$.system.traits.value') AS t
WHERE ($1 IS NULL OR e.entity_type = $1)
  AND ($2 IS NULL OR e.level >= $2)
  AND ($3 IS NULL OR e.level <= $3)
  AND ($4 IS NULL OR e.rarity = $4)
  AND ($5 IS NULL OR e.family = $5)
  AND t.value IN (/* bound list */)
GROUP BY e.id
HAVING COUNT(DISTINCT t.value) = /* tag count for AND; 1 for OR */
LIMIT $N
```

**Key:** The `WHERE` on STORED columns narrows the rowset BEFORE `json_each` fires on `raw_data`. DISTINCT + GROUP BY + HAVING COUNT handles AND logic. For OR logic, drop the HAVING clause (any match suffices).

**CRITICAL: tags SQL cannot use the standard `$N IS NULL OR ...` shorthand for arrays.** Tags filter must be applied with a conditional code path in TypeScript: if `tags` is empty/undefined, omit the json_each join entirely. See implementation pattern in Code Examples below.

### Pattern 4: WeakEliteSelector — Pure Presentational

**What:** Segmented control that emits the selected tier. Does no HP math itself — calls `getHpAdjustment()` and `getAdjustedLevel()` from `weak-elite.ts` only to compute the display label.

```typescript
// WeakEliteSelector.vue <script setup>
import { getHpAdjustment, getAdjustedLevel } from '@/lib/weak-elite'
import type { WeakEliteTier } from '@/types/entity'

const props  = defineProps<{ level: number; modelValue?: WeakEliteTier }>()
const emit   = defineEmits<{ 'update:modelValue': [tier: WeakEliteTier] }>()

const tier   = computed(() => props.modelValue ?? 'normal')

const hpLabel = computed(() => {
  const delta = getHpAdjustment(tier.value, props.level)
  if (delta === 0) return 'Normal'
  return `${tier.value === 'elite' ? 'Elite' : 'Weak'}: ${delta > 0 ? '+' : ''}${delta} HP`
})

const TIERS: WeakEliteTier[] = ['weak', 'normal', 'elite']
```

### Anti-Patterns to Avoid

- **Pinia store for filter state:** Cross-contaminates Compendium and Combat Workspace filters (PITFALLS.md Pitfall 9). Use local `ref()` only.
- **json_each as leading WHERE clause:** Scans all 28K raw_data blobs before narrowing (PITFALLS.md Pitfall 4). Always apply STORED column filters first.
- **`$N IS NULL OR col IN (array)`:** SQLite IPC binding does not support array parameters. Tags must be conditionally added to the query string in TypeScript.
- **Inline HP math in WeakEliteSelector template:** Untestable without rendering; keep all math in `weak-elite.ts`.
- **`reactive()` wrapping the results array:** Double reactivity overhead. Use `ref<EntityResult[]>([])` and replace the array reference on each query.
- **FTS5 for tags:** Tags are not in the FTS5 index; json_each on raw_data is the correct approach.
- **`useCreatureDetailStore().openCreature()` from browser row click:** Sets `isOpen = true`, triggers slide-over. Use `openCreature()` only from Compendium context where slide-over is correct behavior. (Phase 03 reuses the slide-over for Compendium — this is correct. Phase 05 will need `setContent()` but that is out of scope here.)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Virtualised scrolling | Custom windowing math with IntersectionObserver | `virtua` (`VList`) OR 50-row cap | Edge cases: dynamic heights, scroll restoration, keyboard nav, iOS bounce |
| Debounce utility | Custom `setTimeout` wrapper in component | Inline `setTimeout` pattern is fine at this scale — no utility needed | Only one call site; library overkill |
| Tags multi-select dropdown | Custom `<input>` + floating list from scratch | Native `<datalist>` for autocomplete + pill chips via Tailwind — sufficient for v1.1 | Full custom dropdown is 200+ LOC with focus/keyboard/ARIA edge cases |

**Key insight:** The project has no UI component library. Native HTML elements + Tailwind tokens cover all Phase 03 UI needs at acceptable quality for a DM desktop tool. Resist adding a full component library.

---

## Common Pitfalls

### Pitfall 1: Family JSON Path Unverified (MEDIUM confidence from Phase 02)
**What goes wrong:** `$.system.details.family` was inferred, not confirmed. If the path is wrong, the `family` STORED column (added in migration v3) is all NULL — family filter always empty.
**Why it happens:** JSON path inferred from Foundry VTT PF2e pack structure conventions; not spot-checked against a live creature in the database.
**How to avoid:** Task 1 of Phase 03 must run a diagnostic query before building the UI: `SELECT json_extract(raw_data, '$.system.details.family') FROM pf2e_entities WHERE entity_type = 'creature' LIMIT 10` against the production database. If NULL, investigate alternate paths (`$.system.family`, `$.system.details.creatureType`).
**Warning signs:** `SELECT DISTINCT family FROM pf2e_entities WHERE entity_type = 'creature'` returns 0 rows — all NULL.

### Pitfall 2: Tags JSON Path Unverified
**What goes wrong:** `$.system.traits.value` is the assumed traits array path. If wrong, `json_each` returns no rows and the tags filter silently shows no matches.
**Why it happens:** PF2e pack JSON structure varies by entity type; traits path for creatures may differ from spells or feats.
**How to avoid:** Run diagnostic per entity type: `SELECT json_extract(raw_data, '$.system.traits.value') FROM pf2e_entities WHERE entity_type = 'creature' LIMIT 5`. Verify it returns a JSON array. Confirm for at least creature, spell, and feat entity types.
**Warning signs:** `SELECT DISTINCT t.value FROM pf2e_entities e, json_each(e.raw_data, '$.system.traits.value') t` returns 0 rows.

### Pitfall 3: Tags SQL Array Binding in SQLite IPC
**What goes wrong:** Attempting to bind `['goblin', 'undead']` as a single `$N` parameter in the SQLite query. The Tauri plugin-sql IPC does not expand arrays — the parameter is interpreted as a string.
**Why it happens:** Standard SQL parameterisation pattern doesn't handle IN lists natively.
**How to avoid:** Build the SQL string dynamically in TypeScript when tags are present:
```typescript
// In filterEntities(), when tags is non-empty:
const tagPlaceholders = tags.map((_, i) => `$${baseParamCount + i}`).join(', ')
// Append: AND t.value IN (${tagPlaceholders})
```
See Code Examples below for the full pattern.

### Pitfall 4: json_each Running on Un-Narrowed Result Set
**What goes wrong:** Tags filter response time 300–800ms when level range is broad (e.g., level 1–10 matches ~3,000 creatures, each requiring raw_data JSON extraction).
**Why it happens:** `json_each` in SQLite is a table-valued function — it runs per row that passes the WHERE. If STORED column filters come after json_each in evaluation order, all 28K blobs are scanned.
**How to avoid:** Ensure STORED column filters are in the WHERE clause before any reference to `raw_data`. SQLite evaluates `WHERE` conditions left-to-right for column filters (with indexes) before table-valued functions. Test response time against the 28K production database, not a dev subset.

### Pitfall 5: Debounce Missing on Filter Change
**What goes wrong:** Each filter interaction (typing in level min, selecting rarity) fires an IPC call per event. On Windows Tauri/WebView2, IPC latency is 5–200ms. With 6 filter fields, a rapid "select type + level + rarity" sequence fires 3 IPC calls in 100ms, with responses arriving out of order.
**Why it happens:** `watch()` with immediate: true fires synchronously on every reactive change.
**How to avoid:** Debounce `onFilterChange` at 200ms in CreatureBrowser. Use a single `setTimeout` id tracked in a local variable. Also debounce the name search input separately (it's typed character-by-character).

---

## Code Examples

### Verified: filterEntities() with tags — dynamic SQL construction

```typescript
// src/lib/entity-query.ts — extension of existing filterEntities()
// Tags handling: conditionally join json_each only when tags is non-empty
export async function filterEntities(
  filters: EntityFilter,
  limit: number = 100
): Promise<EntityResult[]> {
  const sqlite   = await getSqlite()
  const matchExpr = filters.name ? sanitizeSearchQuery(filters.name) : ''
  const useFts    = matchExpr !== ''
  const hasTags   = filters.tags && filters.tags.length > 0
  const tagAnd    = filters.tagLogic !== 'OR'  // default AND

  // Shared WHERE clause fragments (STORED columns — always fast)
  // Parameters: $1=entityType, $2=levelMin, $3=levelMax, $4=rarity, $5=family
  const storedWhere = `
    ($1 IS NULL OR e.entity_type = $1)
    AND ($2 IS NULL OR e.level >= $2)
    AND ($3 IS NULL OR e.level <= $3)
    AND ($4 IS NULL OR e.rarity = $4)
    AND ($5 IS NULL OR e.family = $5)
  `
  const baseParams = [
    filters.entityType ?? null,
    filters.levelMin   ?? null,
    filters.levelMax   ?? null,
    filters.rarity     ?? null,
    filters.family     ?? null,
  ]

  // Build tag SQL addition if needed
  let tagJoin    = ''
  let tagHaving  = ''
  let tagParams: string[] = []
  if (hasTags) {
    const tags = filters.tags!
    const base = baseParams.length + 1  // next param index after base 5 (+1 for useFts path has matchExpr)
    // Note: adjust base index depending on path (FTS adds $1 for matchExpr)
    tagParams = tags
    tagJoin   = `JOIN json_each(e.raw_data, '$.system.traits.value') AS t`
    const placeholders = tags.map((_, i) => `$${base + i}`).join(', ')
    tagHaving = `AND t.value IN (${placeholders})`
    if (tagAnd) {
      // HAVING ensures all selected tags match (AND logic)
    }
  }

  // ... (full implementation continues; see Task 1 plan for complete SQL)
}
```

### Verified: WeakEliteSelector template pattern

```vue
<!-- WeakEliteSelector.vue -->
<template>
  <div class="flex items-center gap-1">
    <button
      v-for="t in TIERS"
      :key="t"
      @click="emit('update:modelValue', t)"
      :class="[
        'px-3 py-1 text-sm rounded transition-colors',
        tier === t
          ? 'bg-gold text-charcoal-900 font-semibold'
          : 'bg-charcoal-700 text-stone-300 hover:bg-charcoal-600'
      ]"
    >
      {{ t.charAt(0).toUpperCase() + t.slice(1) }}
    </button>
    <span class="ml-2 text-xs text-stone-400">{{ hpLabel }}</span>
  </div>
</template>
```

### Verified: Active filter chip pattern (collapsed panel)

```vue
<!-- Inside EntityFilterBar.vue collapsed state -->
<div v-if="!expanded && activeChips.length" class="flex flex-wrap gap-1 px-2 py-1">
  <span
    v-for="chip in activeChips"
    :key="chip.key"
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-charcoal-700 text-stone-300 border border-charcoal-500"
  >
    {{ chip.label }}
    <button
      @click.stop="clearChip(chip.key)"
      class="text-stone-400 hover:text-gold"
      aria-label="Clear filter"
    >×</button>
  </span>
</div>
```

### Verified: virtua VList usage (fixed row height)

```vue
<script setup lang="ts">
import { VList } from 'virtua/vue'
</script>

<template>
  <VList
    :data="results"
    :item-size="40"
    class="flex-1 overflow-y-auto"
  >
    <template #default="{ item }">
      <div
        class="h-10 flex items-center gap-3 px-3 border-b border-charcoal-700
               bg-charcoal-800 hover:bg-charcoal-700 cursor-pointer transition-colors"
        @click="emit('row-click', item)"
      >
        <span class="flex-1 text-sm text-stone-100 truncate">{{ item.name }}</span>
        <span class="text-xs px-1.5 py-0.5 rounded bg-charcoal-600 text-stone-300">
          Lvl {{ item.level ?? '–' }}
        </span>
        <span class="text-xs text-stone-400">{{ item.rarity ?? '' }}</span>
      </div>
    </template>
  </VList>
</template>
```

### Verified: Auto level range calculation (PF2e encounter building)

```typescript
// Party level M, party size N — standard encounter range is [M-4, M+4]
// Displayed range should clamp to [-1, 25] (PF2e creature level bounds)
function calcAutoLevelRange(partyLevel: number): { min: number; max: number } {
  return {
    min: Math.max(-1, partyLevel - 4),
    max: Math.min(25, partyLevel + 4),
  }
}
// Party size does not affect creature level range per core encounter building rules.
// Party size affects XP budget (WORK-01 territory), not the level window.
```

### Verified: Collapsible panel transition (Tailwind v3 compatible)

```vue
<!-- Tailwind v3 does NOT support custom transition-height or max-h animations
     without defining them in tailwind.config. Use max-h trick instead. -->
<div
  :class="[
    'overflow-hidden transition-all duration-200 ease-in-out',
    expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
  ]"
>
  <!-- filter controls -->
</div>
```

Note: `max-h-96` is 24rem. If the expanded panel grows taller, increase the max-h class (max-h-screen as fallback). This avoids the need for a JavaScript height calculation.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| vue-virtual-scroller v1 (Vue 2) | `virtua` 0.48.8 (Vue 3, no beta) | ~2023 | virtua is Vue 3 native; vue-virtual-scroller@next still beta |
| Pinia filter store | Local `ref()` in component | Architecture decision locked in Phase 02 | Eliminates cross-context state contamination |
| tags silently ignored in filterEntities() | json_each wired in Phase 03 | This phase | Completes COMP-07 |

**Deprecated/outdated:**
- `vue-virtual-scroller` v1 (Vue 2 only) — do not use; the `@next` tag gets the Vue 3 beta
- Drizzle ORM for tags queries — tags are in raw_data JSON, not a STORED column; Drizzle cannot express json_each; use raw SQL via `getSqlite()` (same pattern as `filterEntities()`)

---

## Open Questions

1. **Family JSON path verification**
   - What we know: Migration v3 used `$.system.details.family`; this was MEDIUM confidence (inferred from Foundry VTT PF2e pack conventions)
   - What's unclear: Whether actual synced data has `family` at that path or at `$.system.details.creatureType` or elsewhere
   - Recommendation: Task 1 must run `SELECT json_extract(raw_data, '$.system.details.family') FROM pf2e_entities WHERE entity_type = 'creature' LIMIT 10` against the production database before building the family dropdown

2. **Tags JSON path — per entity type consistency**
   - What we know: PF2e Foundry packs use `system.traits.value` for most entities; this is the standard convention
   - What's unclear: Whether feats, hazards, and items use the same path or a variant (e.g., `$.system.traits` as an object vs array)
   - Recommendation: Verify for at least 3 entity types in Task 1 diagnostics

3. **virtua API stability**
   - What we know: virtua 0.48.8 is the latest stable release; actively maintained; Vue 3 support is first-class via `virtua/vue`
   - What's unclear: Whether `VList` with `:item-size` prop accepts fixed pixel height (it does based on README, MEDIUM confidence)
   - Recommendation: Install and verify the `VList` props before building CreatureBrowser; fallback to 50-row cap if API surface is wrong

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 + @vue/test-utils 2.4.6 |
| Config file | `vitest.config.ts` (merged into vite config) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-06 | Family dropdown populated from DB distinct values | unit (mock DB) | `npm test -- EntityFilterBar` | No — Wave 0 |
| COMP-06 | Family filter only visible when entityType = 'creature' | unit | `npm test -- EntityFilterBar` | No — Wave 0 |
| COMP-06 | Filter change with family emits correct EntityFilter | unit | `npm test -- EntityFilterBar` | No — Wave 0 |
| COMP-07 | Tags filter wired in filterEntities() SQL | unit (mock getSqlite) | `npm test -- entity-query` | Partial — entity-query.test.ts exists but tags not tested |
| COMP-07 | AND logic: all selected tags must match | unit (mock getSqlite) | `npm test -- entity-query` | No — Wave 0 |
| COMP-07 | OR logic: any selected tag matches | unit (mock getSqlite) | `npm test -- entity-query` | No — Wave 0 |
| COMP-07 | Tag chips render and are removable | unit | `npm test -- EntityFilterBar` | No — Wave 0 |
| General | WeakEliteSelector renders all 3 tiers | unit | `npm test -- WeakEliteSelector` | No — Wave 0 |
| General | WeakEliteSelector HP label correct for elite level 8 (+30) | unit | `npm test -- WeakEliteSelector` | No — Wave 0 |
| General | CreatureBrowser debounces filter changes | unit (fake timers) | `npm test -- CreatureBrowser` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/__tests__/EntityFilterBar.test.ts` — covers COMP-06, COMP-07 UI behaviors
- [ ] `src/components/__tests__/CreatureBrowser.test.ts` — covers debounce, result rendering, row-click emit
- [ ] `src/components/__tests__/WeakEliteSelector.test.ts` — covers HP label, tier selection, v-model
- [ ] Tags test cases in existing `src/lib/__tests__/entity-query.test.ts` — extend, do not replace

Note: `vitest.config.ts` includes `src/**/*.{test,spec}.?(c|m)[jt]s?(x)` — new test files in `src/components/__tests__/` are automatically picked up without config changes. Pattern already works (see existing `src/components/__tests__/CombatTracker.test.ts` etc.).

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection:
  - `src/lib/entity-query.ts` — exact interface contracts, current tags gap
  - `src/lib/weak-elite.ts` — HP table, getHpAdjustment/getAdjustedLevel signatures
  - `src/types/entity.ts` — WeakEliteTier type
  - `tailwind.config.js` — charcoal/gold/crimson token values
  - `src/components/AppSidebar.vue` — RouterLink active-class pattern
  - `package.json` — exact library versions in project
  - `vitest.config.ts` — test runner config and include glob
  - `.planning/research/PITFALLS.md` — json_each pitfall (Pitfall 4), virtual scroll (Pitfall 10), filter state (Pitfall 9), debounce (Integration Gotchas)
- `.planning/phases/03-shared-browser-and-filter-components/03-CONTEXT.md` — all locked decisions
- `.planning/REQUIREMENTS.md` — COMP-06, COMP-07 definitions

### Secondary (MEDIUM confidence)
- `npm view virtua version` → 0.48.8 (verified current via npm registry, 2026-03-21)
- `npm view vue-virtual-scroller@next version` → 2.0.0-beta.8 (verified beta status)
- `npm view @tanstack/vue-virtual version` → 3.13.23
- PF2e encounter building rules: party level ±4 for standard encounter range — from CONTEXT.md canonical reference (https://2e.aonprd.com/Rules.aspx?ID=3262)
- PF2e weak/elite: `$.system.traits.value` JSON path — community convention for Foundry VTT PF2e packs; MEDIUM confidence, requires verification against live data

### Tertiary (LOW confidence)
- virtua `VList` `:item-size` prop API — based on library README pattern; verify on install

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all core libraries already in project; only virtualisation library is new
- Architecture: HIGH — all patterns derived directly from existing codebase + locked CONTEXT.md decisions
- Tags SQL pattern: MEDIUM — json_each approach correct per PITFALLS.md; exact placeholder binding pattern needs IPC testing
- JSON paths (family, traits): MEDIUM — conventional paths from Foundry VTT PF2e; require diagnostic verification in Task 1
- Virtualisation library (virtua): MEDIUM — version verified from npm; API surface not tested in project yet

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable domain; virtua API is the only fast-moving piece)
