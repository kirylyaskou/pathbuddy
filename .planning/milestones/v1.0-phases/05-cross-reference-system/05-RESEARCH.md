# Phase 5: Cross-Reference System - Research

**Researched:** 2026-03-20
**Domain:** Slug-based entity resolution + Vue 3 slide-over panel UI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Creature detail view layout**
- Pathbuilder 2e encounter page as primary UI reference (https://pathbuilder2e.com/beta/encounters.html)
- Grouped stat block: Stats at top (HP, AC, saves, perception), then sections for Melee/Ranged Strikes, Spells, Special Abilities, Equipment — mirrors official PF2e stat block format
- Inline expandable items: Click an ability/spell name to expand its full description inline, no navigation away
- Compact card layout: Self-contained panel with all info visible at a glance, minimal whitespace
- Slide-over panel (not full page route) — opens from combat tracker, keeps combat context visible
- Detail panel only for Phase 5 — no creature list/browser (future phase), no search (Phase 8: FTS5)

**Canonical vs unique display**
- Both link indicator AND color coding:
  - Canonical items: colored left border/badge (e.g., blue) + link icon indicating a compendium entry exists
  - NPC-unique abilities: different colored border (e.g., amber/gold), no link icon
- Full canonical description shown inline on expand — complete entry rendered in-place, not summarized
- NPC-unique abilities expand from embedded data directly

**Entity navigation**
- Clicking the link icon on a canonical item replaces the panel content with the full canonical entity stat block
- Back button returns to the creature view
- Single-panel pattern — no multi-panel (that's v2 multi-window UI)

**Slug ambiguity handling**
- Type-aware matching: match embedded item's `type` field against canonical `entity_type` column in addition to `slug`
  - e.g., embedded `{ type: 'spell', system: { slug: 'shield' } }` resolves to spells pack, not equipment
- No fallback — if type+slug doesn't match a canonical, mark as NPC-unique (`isUnique: true`) and render from embedded data
- Single batch query with `inArray` on slug + filter by entity_type (adapted from plan.txt reference)

### Claude's Discretion
- Exact color values for canonical vs NPC-unique borders
- Slide-over panel width and animation
- Stat block section ordering within groups
- How to handle entities with very long descriptions (truncation, scroll)
- Expand/collapse animation details
- Back navigation implementation (panel history stack vs simple state)

### Deferred Ideas (OUT OF SCOPE)
- Creature list/browser page — future phase (needs search from Phase 8)
- Multi-panel/multi-window creature viewing — v2 multi-window UI
- Combat persistence (saving creature state to DB) — separate phase noted in Phase 3 context
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| XREF-01 | System resolves embedded creature items to canonical entities via slug | `resolveCreatureItems()` in `src/lib/creature-resolver.ts` — batch `inArray(slug) + eq(entityType)` query against `pf2eEntities`; lookup map keyed on `slug+type` pair |
| XREF-02 | Creature detail view shows linked canonical spells/items | `CreatureDetailPanel.vue` — slide-over with grouped stat block, expandable rows, canonical items show blue border + link icon |
| XREF-03 | NPC-unique abilities render from embedded data | Same panel — `isUnique: true` items show amber border, expand from `embedded` field directly |
</phase_requirements>

---

## Summary

Phase 5 adds two distinct units of work that compose cleanly: a **backend resolver** (`creature-resolver.ts`) that maps embedded creature items to their canonical database entries via slug+type matching, and a **frontend panel** (`CreatureDetailPanel.vue`) that presents the resolved creature in a slide-over while keeping the combat tracker visible.

The resolver logic is fully specified in `plans/plan.txt Phase 3` (lines 474-519). The only adaptation required is upgrading the single `inArray(slug)` query to also filter by `entityType` — this prevents slug collisions across entity types (e.g., `shield` appearing in both spells and equipment packs). The database and Drizzle infrastructure to do this exists and is tested: `inArray` and `and` operators are both confirmed present in Drizzle 0.38.4 (the installed version).

The frontend pattern follows established project conventions exactly: a Pinia setup store manages panel open/closed state and selected creature, a `<script setup>` Vue 3 component renders the panel, and Tailwind CSS handles all styling. The `SplashScreen.vue` component provides a working example of a fixed-position overlay with `<Transition>` animations, which is the model for the slide-over.

**Primary recommendation:** Build `creature-resolver.ts` first as a pure function module (easy to unit-test in isolation), then build `CreatureDetailPanel.vue` and wire it into `CombatTracker.vue` with a Pinia store for panel state.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.38.4 (installed) | `inArray`, `and`, `eq` query operators for batch resolution | Already in use for all DB access; `inArray` confirmed present |
| vue | 3.5.30 (installed) | `<script setup>`, `ref`, `computed`, `watch` for panel state and reactivity | Project standard |
| pinia | 2.3.1 (installed) | Setup store for panel open/close state and selected creature | All existing stores use Composition API setup stores |
| tailwindcss | 3.4.19 (installed) | Slide-over panel layout, color-coded borders, expand/collapse UI | All styling in project uses Tailwind |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tauri-apps/plugin-sql | 2.x (installed) | SQLite access via `db` instance | Indirect via Drizzle/`database.ts` |
| @vue/test-utils | 2.4.6 (installed) | Mount components in Vitest tests | All component tests use this pattern |
| vitest | 2.1.8 (installed) | Test runner; `vi.mock` for mocking `database.ts` | Unit tests for resolver and component tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pinia store for panel state | `ref`/`provide` inside CombatTracker.vue | Pinia preferred — keeps CombatTracker.vue clean, allows future access from other components |
| Tailwind CSS transitions | CSS-in-JS or headlessui | No headlessui installed; Tailwind `transition`/`transform` classes sufficient for slide-over |
| Inline expand in panel | Vue Router navigation | CONTEXT.md locked: slide-over only, no route change |

**Installation:** No new packages required. All needed libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── creature-resolver.ts      # NEW: resolveCreatureItems() + ResolvedCreatureItem interface
├── components/
│   └── CreatureDetailPanel.vue   # NEW: slide-over panel component
├── stores/
│   └── creatureDetail.ts         # NEW: Pinia store for panel state
└── components/
    ├── CombatTracker.vue          # MODIFIED: add click handler, import panel + store
    └── CreatureCard.vue           # MODIFIED: emit open-detail event on creature name click
```

### Pattern 1: Type-Aware Batch Resolution (XREF-01)

**What:** Single SQL query fetching all canonical matches for a creature's embedded items, keyed on `slug + entityType` composite key to prevent cross-type collisions.

**When to use:** Any time a creature's raw data is loaded for display.

**Adaptation from plan.txt:** plan.txt uses `inArray(pf2eEntities.slug, slugs)` only. Phase 5 CONTEXT.md requires type-aware matching. The adaptation is: build a composite lookup key `${slug}:${entityType}` on both the query results and the embedded items.

```typescript
// src/lib/creature-resolver.ts
import { db } from './database';
import { pf2eEntities } from './schema';
import { inArray, and } from 'drizzle-orm';

export interface ResolvedCreatureItem {
  embedded: any;           // item from creature.items[]
  canonical: any | null;   // full entity from pf2e_entities, or null
  isUnique: boolean;       // true = NPC-unique ability
}

export async function resolveCreatureItems(
  creatureRawData: any
): Promise<ResolvedCreatureItem[]> {
  const items: any[] = creatureRawData.items || [];

  // Collect slugs from embedded items that have system.slug
  const slugs = [...new Set(
    items
      .map((item: any) => item.system?.slug)
      .filter((s: any): s is string => typeof s === 'string' && s.length > 0)
  )];

  // Single batch query — fetch all potential canonical matches by slug
  // Then filter by entityType in-memory using composite key
  const canonicals = slugs.length > 0
    ? await db.select()
        .from(pf2eEntities)
        .where(inArray(pf2eEntities.slug, slugs))
    : [];

  // Build lookup map: "slug:entityType" → parsed rawData
  // This handles cases like slug "shield" existing as both spell and equipment
  const canonicalMap = new Map(
    canonicals.map(c => [`${c.slug}:${c.entityType}`, JSON.parse(c.rawData)])
  );

  // Resolve each embedded item
  return items.map((item: any) => {
    const slug = item.system?.slug;
    const type = item.type;
    const canonical = (slug && type)
      ? (canonicalMap.get(`${slug}:${type}`) ?? null)
      : null;
    return {
      embedded: item,
      canonical,
      isUnique: !canonical,
    };
  });
}
```

**Note on query strategy:** The query fetches all rows matching ANY of the slugs, then the composite-key map in JS handles type disambiguation. An alternative would be `inArray(slug) AND inArray(entityType)` but that would return cross-product matches. The JS-side composite map is the correct approach.

### Pattern 2: Pinia Setup Store for Panel State

**What:** A minimal Pinia setup store managing which creature is open in the detail panel.

**When to use:** Panel state needs to be accessible from CombatTracker and CreatureCard without prop drilling.

```typescript
// src/stores/creatureDetail.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCreatureDetailStore = defineStore('creatureDetail', () => {
  const isOpen = ref(false)
  const selectedCreatureRawData = ref<any | null>(null)
  const selectedCreatureName = ref<string | null>(null)

  // Navigation history for "back" button (slug+pack pairs)
  const navigationHistory = ref<Array<{ rawData: any; name: string }>>([])

  function openCreature(rawData: any, name: string) {
    navigationHistory.value = []
    selectedCreatureRawData.value = rawData
    selectedCreatureName.value = name
    isOpen.value = true
  }

  function navigateToCanonical(rawData: any, name: string) {
    // Push current view to history stack before navigating
    if (selectedCreatureRawData.value) {
      navigationHistory.value.push({
        rawData: selectedCreatureRawData.value,
        name: selectedCreatureName.value ?? ''
      })
    }
    selectedCreatureRawData.value = rawData
    selectedCreatureName.value = name
  }

  function navigateBack() {
    const prev = navigationHistory.value.pop()
    if (prev) {
      selectedCreatureRawData.value = prev.rawData
      selectedCreatureName.value = prev.name
    }
  }

  function close() {
    isOpen.value = false
    selectedCreatureRawData.value = null
    selectedCreatureName.value = null
    navigationHistory.value = []
  }

  return {
    isOpen, selectedCreatureRawData, selectedCreatureName,
    navigationHistory, openCreature, navigateToCanonical, navigateBack, close
  }
})
```

### Pattern 3: Slide-Over Panel Component

**What:** Fixed-position panel anchored to the right side of the screen, overlaid on top of the combat tracker. Uses Tailwind transition classes for slide animation.

**When to use:** Replicate this pattern from `SplashScreen.vue` — the project already uses `<Transition>` with Tailwind-managed CSS transitions.

```vue
<!-- src/components/CreatureDetailPanel.vue (structure sketch) -->
<template>
  <!-- Backdrop -->
  <Transition name="panel-backdrop">
    <div
      v-if="store.isOpen"
      class="fixed inset-0 z-40 bg-black/30"
      @click="store.close()"
    />
  </Transition>

  <!-- Panel -->
  <Transition name="panel-slide">
    <div
      v-if="store.isOpen"
      class="fixed right-0 top-0 h-full w-96 z-50 bg-white shadow-xl overflow-y-auto"
    >
      <!-- header, back button, stat block sections -->
    </div>
  </Transition>
</template>

<style scoped>
.panel-slide-enter-active, .panel-slide-leave-active {
  transition: transform 250ms ease;
}
.panel-slide-enter-from, .panel-slide-leave-to {
  transform: translateX(100%);
}
.panel-backdrop-enter-active, .panel-backdrop-leave-active {
  transition: opacity 200ms ease;
}
.panel-backdrop-enter-from, .panel-backdrop-leave-to {
  opacity: 0;
}
</style>
```

### Pattern 4: Grouped Stat Block Sections

**What:** Items in the resolved creature are grouped by `item.type` for display. PF2e embedded item types are known and map to display groups.

**When to use:** Rendering the stat block sections in `CreatureDetailPanel.vue`.

```typescript
// Grouping logic (inside CreatureDetailPanel.vue setup)
const SECTION_ORDER = ['melee', 'ranged', 'spell', 'spellcastingEntry', 'feat', 'action', 'equipment', 'weapon', 'armor', 'lore']

const groupedItems = computed(() => {
  if (!resolvedItems.value) return {}
  return resolvedItems.value.reduce((acc, item) => {
    const type = item.embedded.type ?? 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(item)
    return acc
  }, {} as Record<string, ResolvedCreatureItem[]>)
})
```

### Pattern 5: Expandable Item Row

**What:** Each item in a group renders as a clickable row. Click toggles `expanded` state (stored in a `Set<string>` keyed on item `_id`). Canonical items also show a link icon that triggers `navigateToCanonical`.

**Color coding (Claude's discretion — recommended values):**
- Canonical items: `border-l-4 border-blue-500 bg-blue-50` + link icon
- NPC-unique items: `border-l-4 border-amber-500 bg-amber-50` (no link icon)

### Anti-Patterns to Avoid

- **N+1 queries:** Never call `db.select().where(eq(pf2eEntities.slug, slug))` in a loop. Always batch with `inArray`.
- **Slug-only matching:** A slug like `shield` exists in both spells and equipment packs. Always use the composite `slug:entityType` map for disambiguation.
- **Navigating away from combat tracker:** The panel is a slide-over — do not use `router.push()` to show creature details.
- **Storing full rawData in Pinia:** For the resolver, `resolvedItems` should be a `ref` local to the component or derived async state — not deep-cloned into the store. The store only holds the `rawData` string/object needed to re-run the resolver.
- **Re-running resolver on every render:** Cache resolved items with `watchEffect` or `watch` on `selectedCreatureRawData`, not inside a `computed` (async computed is not a Vue pattern).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Batch DB query | Loop of individual `eq()` queries | `inArray(pf2eEntities.slug, slugs)` from drizzle-orm | N+1 kills performance at 100+ items |
| Type disambiguation | Custom SQL OR conditions per pair | JS-side composite key map after single batch query | Simpler and correct |
| Panel animation | Custom JS animation logic | CSS `<Transition>` with `transform: translateX` | Already used in SplashScreen.vue; Tailwind classes handle the rest |
| Async state management | Raw Promises in template | `ref` + `watch` in setup, derived async pattern | Vue 3 does not support async computed; use watch + ref |

**Key insight:** The resolver is a pure transformation function — raw creature JSON in, array of `ResolvedCreatureItem` out. Keep it side-effect free (except the DB read) to make it trivially testable via `vi.mock('./database')`.

---

## Common Pitfalls

### Pitfall 1: Slug Collisions Across Entity Types
**What goes wrong:** `inArray(pf2eEntities.slug, slugs)` returns rows from multiple packs. Without type filtering, a creature with a `shield` spell gets the `shield` equipment instead.
**Why it happens:** plan.txt Phase 3 resolver uses slug-only matching. CONTEXT.md explicitly requires type-aware matching.
**How to avoid:** Build the lookup map with composite key `${slug}:${entityType}`. Match embedded items using `item.type` (the Foundry entity type field, e.g., `'spell'`, `'feat'`, `'weapon'`).
**Warning signs:** Resolved items show wrong descriptions — "Tower Shield" appearing as "Shield" spell.

### Pitfall 2: Async Resolver Inside `computed`
**What goes wrong:** Vue 3 computed properties cannot be async. Wrapping `resolveCreatureItems()` in a computed will silently return a Promise object instead of the resolved array.
**Why it happens:** Developers familiar with React hooks try async computed patterns.
**How to avoid:** Use `ref<ResolvedCreatureItem[]>([])` + `watch(selectedCreatureRawData, async (rawData) => { resolvedItems.value = await resolveCreatureItems(rawData) })`.
**Warning signs:** Template renders `[object Promise]` or items array is always empty.

### Pitfall 3: Empty `inArray` Call
**What goes wrong:** `inArray(column, [])` generates invalid SQL in Drizzle (SQL `IN ()` is a syntax error).
**Why it happens:** Creature has no items with `system.slug`, so the slugs array is empty.
**How to avoid:** Guard with `slugs.length > 0 ? db.select()... : []` — exactly as shown in plan.txt and the code examples above.
**Warning signs:** SQLite error thrown when resolving creatures with no slug-bearing items (e.g., hazards, vehicles).

### Pitfall 4: rawData JSON Parsing Cost
**What goes wrong:** Calling `JSON.parse(c.rawData)` for every canonical entity on every resolve call is expensive for creatures with many items.
**Why it happens:** rawData is stored as a JSON string in SQLite; it must be parsed to be useful.
**How to avoid:** Parse once during map construction: `new Map(canonicals.map(c => [key, JSON.parse(c.rawData)]))`. Do not parse inside the per-item resolution loop.
**Warning signs:** Noticeable lag when opening creatures with many spells (e.g., 30+ items).

### Pitfall 5: Panel Scroll State Not Reset on Navigation
**What goes wrong:** User opens a creature, scrolls down, clicks a canonical link — the panel shows the new entity but the scroll position is retained from the previous view.
**Why it happens:** The panel `div` maintains scroll state across content changes.
**How to avoid:** In `navigateToCanonical()`, after updating `selectedCreatureRawData`, scroll the panel container to top. Use a `ref` on the panel div and call `panelEl.value?.scrollTo(0, 0)`.
**Warning signs:** User sees the bottom of a spell description when they expected to see the top of the ability block.

### Pitfall 6: Transition `v-if` + `z-index` Stacking
**What goes wrong:** Panel backdrop clips combat tracker buttons; backdrop `z-index` must be below the panel but above combat tracker interactive elements.
**Why it happens:** Tailwind `z-40`/`z-50` classes need to be applied consistently.
**How to avoid:** Backdrop at `z-40`, panel at `z-50`. Ensure the slide-over is mounted at the `<App>` level (not inside CombatTracker) so the stacking context is correct.
**Warning signs:** Clicking combat tracker buttons while panel is open triggers backdrop close instead.

---

## Code Examples

Verified patterns from the installed codebase:

### Drizzle inArray with type-aware disambiguation
```typescript
// Source: Drizzle 0.38.4 (confirmed via node -e "require('./node_modules/drizzle-orm').inArray")
// Pattern: batch fetch by slug, disambiguate by type in JS
import { inArray } from 'drizzle-orm';

const canonicals = await db.select()
  .from(pf2eEntities)
  .where(inArray(pf2eEntities.slug, uniqueSlugs));

// Composite key map: "slug:entityType" → rawData
const canonicalMap = new Map(
  canonicals.map(c => [`${c.slug}:${c.entityType}`, JSON.parse(c.rawData)])
);

// Resolve per embedded item
const canonical = canonicalMap.get(`${item.system?.slug}:${item.type}`) ?? null;
```

### Vue 3 async watch pattern (correct alternative to async computed)
```typescript
// Source: Vue 3 docs pattern — async computed is not supported
import { ref, watch } from 'vue'
import type { ResolvedCreatureItem } from '@/lib/creature-resolver'
import { resolveCreatureItems } from '@/lib/creature-resolver'

const resolvedItems = ref<ResolvedCreatureItem[]>([])
const isResolving = ref(false)

watch(
  () => store.selectedCreatureRawData,
  async (rawData) => {
    if (!rawData) { resolvedItems.value = []; return }
    isResolving.value = true
    try {
      resolvedItems.value = await resolveCreatureItems(rawData)
    } finally {
      isResolving.value = false
    }
  },
  { immediate: true }
)
```

### Vitest mock for database (matching existing test patterns)
```typescript
// Source: Pattern from src/lib/__tests__/sync-service.test.ts — pure function isolation
// For creature-resolver.ts tests: mock the db module to avoid Tauri IPC
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/database', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([])
      })
    })
  }
}))
```

### CombatTracker click handler wiring
```typescript
// Source: existing CombatTracker.vue pattern — event emission chain
// In CombatTracker.vue setup:
const detailStore = useCreatureDetailStore()

const handleOpenDetail = async (creatureId: string) => {
  const creature = combatStore.creatures.find(c => c.id === creatureId)
  if (!creature) return
  // rawData would come from pf2eEntities lookup if creature has a sourceId
  // Phase 5 scope: creatures manually added to combat tracker may not have rawData
  // Simplest approach: open panel with whatever data is available
  detailStore.openCreature(creature.rawData, creature.name)
}
```

**Note on combat tracker creatures:** The `Creature` type in `src/types/combat.ts` does not currently have a `rawData` field — creatures are added manually via the form. Phase 5 needs to decide how the detail panel is triggered. Two approaches:
1. The panel is triggered from a creature that was added with a DB lookup (out of scope for Phase 5 per CONTEXT.md — no creature browser)
2. The panel is only available for creatures that have a `sourceId` linking them to `pf2eEntities`

**Recommendation (Claude's discretion):** For Phase 5, the trigger should be a "View Stat Block" button on `CreatureCard.vue` that is only shown when `creature.sourceId` is set. The resolver then fetches the creature's own raw data from `pf2eEntities` by sourceId, then calls `resolveCreatureItems()`. This is the natural flow: sync populates DB, DM adds creature to combat (future encounter builder), stat block button appears.

However, since the encounter builder is out of scope, Phase 5 can wire the panel to work against a hardcoded test creature or allow `CreatureCard` to trigger the panel with a placeholder creature slug. The planner should decide the trigger scope based on what's buildable without the encounter builder.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Slug-only resolution (plan.txt) | Slug + entityType composite key | Phase 5 CONTEXT.md decision | Prevents cross-type collisions (shield spell vs shield equipment) |
| N+1 per-item queries | Single `inArray` batch query | plan.txt original design | 100x+ performance improvement for creatures with many items |
| Async computed (React pattern) | `watch` + `ref` (Vue 3 pattern) | Vue 3 Composition API | Avoids silent Promise-in-template bugs |

**Deprecated/outdated:**
- plan.txt `resolveCreatureItems()` implementation: slug-only, no entity_type filter. Correct the lookup map key to `slug:entityType`.

---

## Open Questions

1. **Trigger for detail panel when no encounter builder exists**
   - What we know: `CreatureCard.vue` creatures are manually entered (name, HP, AC, initiative only) with no `rawData` or `sourceId`
   - What's unclear: Should the detail panel only appear for creatures synced from DB? Or should Phase 5 add a temporary "lookup by name" trigger?
   - Recommendation: The planner should add a `sourceId?: string` field to the `Creature` type. The "View Stat Block" button in `CreatureCard` is conditionally rendered only when `sourceId` is set. Lookup flows: `pf2eEntities.sourceId === creature.sourceId`. This is a clean non-breaking addition. The encounter builder (future) populates `sourceId`; manual creatures have no button.

2. **Stat block data mapping from rawData**
   - What we know: PF2e NPC rawData contains `system.attributes.hp.value`, `system.attributes.ac.value`, `system.saves.*`, `system.attributes.perception.value`, and `items[]`
   - What's unclear: The exact field paths for all stat block sections (saves, speeds, resistances, immunities) — these need to be verified against an actual NPC JSON sample
   - Recommendation: The planner should include a task to inspect a sample NPC JSON from the DB after sync to map all field paths before writing the display template.

3. **Performance with large item counts**
   - What we know: Some PF2e creatures (e.g., high-level spellcasters) can have 30-50 embedded items; `inArray` with 50 unique slugs is a single SQL query
   - What's unclear: Whether the sqlite-proxy IPC round-trip adds perceptible latency for the single batch query
   - Recommendation: Not a blocker. The batch query approach from plan.txt is the correct solution. If lag is observed, the resolver result can be cached in the Pinia store keyed on creature sourceId.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

Current baseline: **76 tests passing** across 7 test files (confirmed 2026-03-20).

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| XREF-01 | `resolveCreatureItems()` maps slugs to canonicals via slug+type composite key | unit | `npx vitest run src/lib/__tests__/creature-resolver.test.ts` | Wave 0 |
| XREF-01 | `resolveCreatureItems()` handles empty slugs array (no `inArray([])` error) | unit | `npx vitest run src/lib/__tests__/creature-resolver.test.ts` | Wave 0 |
| XREF-01 | `resolveCreatureItems()` marks items with no canonical match as `isUnique: true` | unit | `npx vitest run src/lib/__tests__/creature-resolver.test.ts` | Wave 0 |
| XREF-01 | `resolveCreatureItems()` does not confuse same-slug different-type items | unit | `npx vitest run src/lib/__tests__/creature-resolver.test.ts` | Wave 0 |
| XREF-02 | `CreatureDetailPanel` renders when `isOpen = true` | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | Wave 0 |
| XREF-02 | Canonical items show blue border class | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | Wave 0 |
| XREF-02 | Canonical items show link icon element | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | Wave 0 |
| XREF-02 | Clicking link icon triggers `navigateToCanonical` in store | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | Wave 0 |
| XREF-02 | Back button calls `navigateBack` and is hidden when history empty | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | Wave 0 |
| XREF-02 | Clicking item name expands description inline | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | Wave 0 |
| XREF-03 | NPC-unique items show amber border class | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | Wave 0 |
| XREF-03 | NPC-unique items do NOT show link icon | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | Wave 0 |
| XREF-03 | NPC-unique items expand from `embedded.system.description.value` | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green (76+ tests) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/creature-resolver.test.ts` — covers XREF-01 (pure function unit tests with `vi.mock('@/lib/database')`)
- [ ] `src/components/__tests__/CreatureDetailPanel.test.ts` — covers XREF-02 + XREF-03 (component tests with `@vue/test-utils`)
- [ ] `src/stores/__tests__/creatureDetail.test.ts` — covers panel state management (open/close/navigate/back)

*(No new framework install needed — Vitest + @vue/test-utils already installed and configured)*

---

## Sources

### Primary (HIGH confidence)
- `plans/plan.txt §Phase 3` (lines 456-519) — Complete `resolveCreatureItems()` reference implementation
- `src/lib/schema.ts` — Confirmed schema: `slug`, `entityType`, `rawData` columns on `pf2eEntities`
- `src/lib/database.ts` — Confirmed `db` instance (Drizzle sqlite-proxy)
- `src/lib/sync-service.ts` — Confirmed `inArray`, `and`, `eq` import patterns
- `node_modules/drizzle-orm` (v0.38.4) — `inArray`, `and` confirmed as functions via `node -e`
- `src/components/SplashScreen.vue` — Overlay/transition pattern to replicate
- `src/stores/combat.ts` — Pinia setup store pattern to follow
- `package.json` — All dependency versions confirmed

### Secondary (MEDIUM confidence)
- `05-CONTEXT.md` — All locked decisions documented; slug+type matching approach explicitly specified
- `vitest.config.ts` + test files — Test patterns confirmed; `vi.mock` available in Vitest 2.x

### Tertiary (LOW confidence)
- PF2e NPC rawData field paths (system.attributes.hp, system.saves, etc.) — known from common knowledge but not verified against an actual synced sample in this project's DB

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed from installed node_modules; no new dependencies
- Architecture: HIGH — resolver logic from plan.txt verified; Drizzle operators confirmed; Vue patterns confirmed from existing code
- Pitfalls: HIGH for slug collision, async computed, empty inArray (all code-verifiable); MEDIUM for scroll reset and z-index (UI behavior)
- Test architecture: HIGH — existing test patterns directly applicable; Wave 0 gaps clearly identified

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable stack; Drizzle API, Vue 3 patterns, and PF2e data format are stable)
