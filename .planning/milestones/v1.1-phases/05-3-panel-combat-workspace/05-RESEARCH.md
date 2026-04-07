# Phase 05: 3-Panel Combat Workspace - Research

**Researched:** 2026-03-21
**Domain:** Vue 3 layout composition, component mode extension, combat store augmentation, auto-numbering logic
**Confidence:** HIGH (all findings derived from direct codebase inspection)

## Summary

Phase 05 converts `CombatView.vue` from a one-line wrapper into a 3-column CSS grid that hosts three independent panels. Nearly every building block already exists in the codebase: `CreatureBrowser.vue` handles search and virtualised listing, `WeakEliteSelector.vue` computes HP deltas, `getHpAdjustment()` implements the PF2e 12-bracket table, `combatStore.addCreature()` accepts fully-formed creatures, and the `Creature` type already carries `sourceId`. The implementation risk is concentrated in three narrow areas: (1) suppressing `CreatureBrowser`'s default slide-over behaviour when used in combat context, (2) correctly implementing the cross-session auto-numbering rule, and (3) keeping viewport height distribution stable across the three panels without clipping the VList.

The panel grid must live inside the `<main class="flex-1 overflow-y-auto">` element rendered by `AppLayout.vue`. That outer element currently provides `overflow-y-auto` and `flex-1`, which means child panels must consume the available height via `h-full` on the grid and `overflow-y-auto` on each column, not via `height: 100vh` (which would overflow past the sidebar).

**Primary recommendation:** Implement in three plans — (A) CombatView grid shell + AddBar composable/component, (B) `Creature` type extension + `addFromBrowser()` store action, (C) `CreatureBrowser` mode prop + row selection state. Each plan is independently testable.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Add-to-Combat Flow**
- Click a creature row in the left-panel browser to select it — selection highlights the row and shows add controls
- Persistent "add bar" at the bottom of the left panel (below the VList): displays selected creature name, quantity input, WeakEliteSelector, and "Add to Combat" button
- Add bar only appears after a creature is selected from the browser — hidden when nothing is selected
- Clicking "Add" immediately inserts creatures into the center combat tracker; controls reset to qty=1, tier=normal
- No confirmation dialog — instant add, same speed as the old form but with richer data

**Panel Layout and Detail Placeholder**
- CombatView.vue becomes a CSS grid with 3 equal columns (`grid-cols-3`) filling viewport height
- Left panel: CreatureBrowser with `defaultEntityType="creature"` + add bar at bottom
- Center panel: existing CombatTracker (toolbar + creature list) — toolbar stays within the center panel
- Right panel: empty placeholder with "Select a creature to view details" text — Phase 06 populates this
- Fixed proportions, desktop-only — WORK-08 (drag-to-resize) deferred to v2 per REQUIREMENTS.md
- Each panel manages its own vertical scroll independently (overflow-y-auto per panel)

**Creature Naming and Numbering (WORK-03)**
- Base name comes from the PF2e entity (e.g. "Goblin Warrior")
- When quantity > 1: auto-numbered sequentially — "Goblin Warrior 1", "Goblin Warrior 2", "Goblin Warrior 3"
- When quantity = 1 and no same-name creature exists: no number suffix — just "Goblin Warrior"
- When quantity = 1 but same-name creature already exists: number suffix continues the sequence
- Numbering continues across add sessions — if "Goblin Warrior 1" and "Goblin Warrior 2" exist, adding 1 more creates "Goblin Warrior 3"

**Tier Labels in Tracker (WORK-04, WORK-05)**
- Tier prefix in display name: "Elite: Goblin Warrior 1", "Weak: Goblin Warrior 2"
- HP adjusted via `getHpAdjustment(tier, level)` delta added to base maxHP from raw_data
- currentHP starts at adjustedMaxHP (full health on entry)
- Only HP adjustment is in scope — AC and other stat adjustments are not part of WORK-04

**Combat Store Integration**
- Extract maxHP, AC, level from entity raw_data JSON when adding from browser
- Store `sourceId` on Creature for detail panel lookup (Phase 06) — Creature type already has this field
- Initiative defaults to 0 — DM enters initiative manually after adding
- Extend Creature type if needed to carry `tier` label for display purposes
- `addCreature` store function receives fully computed creature data (adjusted HP, tier label in name)

### Claude's Discretion
- Exact add bar styling and animation (slide-up, always visible, etc.)
- Selected creature row highlight style
- Quantity input design (number input, stepper buttons, etc.)
- Right panel placeholder illustration or icon
- Whether the "+" Add Creature button in the toolbar remains (Phase 07 removes it, but Phase 05 may keep both entry points or hide it)
- Exact grid gap and panel border styling

### Deferred Ideas (OUT OF SCOPE)
- **Drag-to-resize panels (WORK-08)** — Deferred to v2 per REQUIREMENTS.md
- **AC/stat adjustments for weak/elite** — PF2e rules include AC, attack, damage, and save adjustments; only HP is in scope for WORK-04
- **Persistent filter state (FILT-01)** — Deferred to v2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WORK-01 | Combat tracker page uses a 3-panel layout — creature browser (left ~1/3) \| combat tracker (center ~1/3) \| creature detail (right ~1/3) | CombatView.vue grid shell; AppLayout height containment pattern from CompendiumView |
| WORK-02 | User can search and filter creatures in the creature browser panel (all filters built) | CreatureBrowser.vue + EntityFilterBar.vue fully implemented; only mode behaviour changes needed |
| WORK-03 | User can add one or more creatures to combat from the browser (quantity selector, auto-numbered) | combatStore.addCreature() accepts Omit<Creature, 'id'>; auto-numbering function is new logic in store or composable |
| WORK-04 | User can apply weak/normal/elite adjustment when adding (HP auto-adjusted per 12-bracket table) | getHpAdjustment(tier, level) in weak-elite.ts; WeakEliteSelector.vue is ready-made |
| WORK-05 | Added weak/elite creatures are labeled in the combat tracker | CreatureCard.vue renders creature.name verbatim; tier prefix baked into name string at add time |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — no new dependencies)

| Library | Version | Purpose | Note |
|---------|---------|---------|------|
| Vue 3 | ^3.5.13 | Composition API, template directives | Existing |
| Pinia | ^2.3.0 | Combat store state | Existing |
| Tailwind CSS | ^3.4.17 | Grid layout, tokens | Existing |
| virtua | ^0.48.8 | VList in CreatureBrowser | Existing — keep as-is |
| uuid (v4) | ^13.0.0 | Creature ID generation | Existing |

No new npm packages are required for this phase.

### Design Tokens (tailwind.config.js)

| Token | Value | Use |
|-------|-------|-----|
| `bg-charcoal-800` | `#1a1a1a` | Panel backgrounds |
| `bg-charcoal-700` | `#222222` | Panel dividers / hover states |
| `border-charcoal-600` | `#2a2a2a` | Inter-panel border lines |
| `text-gold` | `#c9a84c` | Headings, selected state |
| `font-display` | Cinzel | Panel section headers |

---

## Architecture Patterns

### Recommended File Changes

```
src/
├── views/
│   └── CombatView.vue          ← Rewrite: 3-panel grid shell
├── components/
│   ├── CreatureBrowser.vue     ← Add `mode` prop; conditional row-click behaviour
│   ├── CombatTracker.vue       ← No structural change; keep AddCreatureForm for now
│   ├── CreatureCard.vue        ← No change needed (renders creature.name verbatim)
│   └── CombatAddBar.vue        ← NEW: add bar below VList in left panel
├── stores/
│   └── combat.ts               ← Add addFromBrowser() action + nextNumberFor() helper
└── types/
    └── combat.ts               ← Add optional `tier` field to Creature interface
```

### Pattern 1: 3-Panel CSS Grid Shell (CombatView.vue)

**What:** Replace the single `<CombatTracker />` with a full-height CSS grid.

**Height containment:** `AppLayout.vue` renders `<main class="flex-1 overflow-y-auto">` which is flex-1 inside an `h-screen` flex row. To fill this height without overflow, CombatView must use `h-full overflow-hidden` — NOT `h-screen` (which ignores the sidebar).

`CompendiumView.vue` sets the precedent: `class="flex flex-col h-full overflow-hidden"`.

**Example:**
```vue
<!-- CombatView.vue -->
<template>
  <div class="grid grid-cols-3 h-full overflow-hidden divide-x divide-charcoal-600">
    <!-- Left: creature browser + add bar -->
    <div class="flex flex-col overflow-hidden">
      <CreatureBrowser
        default-entity-type="creature"
        mode="combat"
        :selected-id="selectedEntity?.id ?? null"
        @select="handleBrowserSelect"
        class="flex-1 min-h-0"
      />
      <CombatAddBar
        v-if="selectedEntity"
        :entity="selectedEntity"
        @add="handleAddCreatures"
      />
    </div>

    <!-- Center: combat tracker -->
    <div class="overflow-y-auto">
      <CombatTracker />
    </div>

    <!-- Right: detail placeholder -->
    <div class="flex items-center justify-center text-stone-500 text-sm">
      Select a creature to view details
    </div>
  </div>
</template>
```

### Pattern 2: CreatureBrowser Mode Prop

**What:** When `mode="combat"`, row click selects the row (emits `@select`) and suppresses the slide-over `detailStore.openCreature()` call.

**Current behaviour to preserve:** When `mode` is absent or `"compendium"`, `handleRowClick` calls `detailStore.openCreature()` as it does today — no regression.

**Implementation:**
```typescript
// CreatureBrowser.vue
const props = defineProps<{
  defaultEntityType?: string
  mode?: 'compendium' | 'combat'
  selectedId?: number | null
}>()

const emit = defineEmits<{
  'row-click': [result: EntityResult]   // keep for backward compat
  'select': [result: EntityResult]       // combat mode selection
}>()

function handleRowClick(result: EntityResult) {
  emit('row-click', result)
  if (props.mode === 'combat') {
    emit('select', result)               // parent manages selection state
  } else {
    const rawData = JSON.parse(result.rawData)
    detailStore.openCreature(rawData, result.name)
  }
}
```

**Row highlight:** In the VList template, apply `bg-charcoal-600 ring-1 ring-gold` when `item.id === props.selectedId`.

### Pattern 3: Auto-Numbering Logic

**What:** Compute the next available suffix number for a given base name by scanning `combatStore.creatures`.

**Rules (from CONTEXT.md):**
- qty=1, name not in tracker: no suffix — "Goblin Warrior"
- qty=1, name exists: suffix continues the current max — "Goblin Warrior 3" if 1 and 2 exist
- qty>1: always number all entries starting from next available

**Algorithm:**

```typescript
// In combat.ts store or a composable
function nextNumberFor(baseName: string): number {
  // Collect all numbers used for this base name (without tier prefix)
  const pattern = new RegExp(`^(?:Elite: |Weak: )?${escapeRegex(baseName)}(?: (\\d+))?$`)
  let max = 0
  for (const c of creatures.value) {
    const m = c.name.match(pattern)
    if (m) {
      max = Math.max(max, m[1] ? parseInt(m[1], 10) : 1)
    }
  }
  return max + 1
}

function buildNames(
  baseName: string,
  qty: number,
  tier: WeakEliteTier
): string[] {
  const prefix = tier === 'normal' ? '' : tier === 'elite' ? 'Elite: ' : 'Weak: '
  const existingCount = creatures.value.filter(c => {
    const pattern = new RegExp(`^(?:Elite: |Weak: )?${escapeRegex(baseName)}(?: \\d+)?$`)
    return pattern.test(c.name)
  }).length
  const needsNumbers = qty > 1 || existingCount > 0

  if (!needsNumbers) {
    return [`${prefix}${baseName}`]
  }

  const startNum = nextNumberFor(baseName)
  return Array.from({ length: qty }, (_, i) => `${prefix}${baseName} ${startNum + i}`)
}
```

**Key edge case:** The numbering scans the base name regardless of tier prefix. Adding 2 normal "Goblin Warrior" (giving "Goblin Warrior 1", "Goblin Warrior 2") then 1 elite correctly produces "Elite: Goblin Warrior 3".

### Pattern 4: addFromBrowser() Store Action

**What:** A new action that wraps `addCreature()` and handles raw_data extraction, HP adjustment, and name computation.

```typescript
// combat.ts
function addFromBrowser(
  entity: EntityResult,
  qty: number,
  tier: WeakEliteTier
): void {
  const raw = JSON.parse(entity.rawData)
  const baseMaxHP: number = raw?.system?.attributes?.hp?.max ?? 0
  const ac: number = raw?.system?.attributes?.ac?.value ?? 10
  const level: number = entity.level ?? 0
  const dexMod: number = raw?.system?.abilities?.dex?.mod ?? 0

  const hpDelta = getHpAdjustment(tier, level)
  const adjustedMaxHP = Math.max(1, baseMaxHP + hpDelta)

  const names = buildNames(entity.name, qty, tier)

  for (const name of names) {
    addCreature({
      name,
      maxHP: adjustedMaxHP,
      currentHP: adjustedMaxHP,
      ac,
      initiative: 0,
      dexMod,
      conditions: [],
      sourceId: entity.slug,   // sourceId for Phase 06 detail lookup
    })
  }
}
```

**sourceId field:** `Creature.sourceId` is already defined as `string | undefined` in `src/types/combat.ts` — no type change needed for this field. The `entity.slug` is the correct value (CombatTracker's `handleOpenDetail` queries `pf2eEntities` by `sourceId` using Drizzle's `eq(pf2eEntities.sourceId, creature.sourceId)` — `slug` is the stored `sourceId` column value).

### Pattern 5: Creature Type Extension for tier

**What:** The `Creature` interface needs an optional `tier` field so Phase 06 can display the tier badge in the detail panel without re-parsing the name string.

```typescript
// types/combat.ts — add one optional field
export interface Creature {
  // ... existing fields ...
  sourceId?: string
  tier?: WeakEliteTier    // 'normal' | 'weak' | 'elite' — optional, backward compatible
}
```

CONTEXT.md notes this is needed. The `tier` field is optional so existing `addCreature()` call-sites in tests and AddCreatureForm do not break.

### Pattern 6: CombatAddBar Component

**What:** A standalone component rendered below the VList in the left panel. Parent passes `entity: EntityResult`; component holds local `qty` (number) and `tier` (WeakEliteTier) state; emits `@add` with `{ entity, qty, tier }`.

```vue
<!-- CombatAddBar.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import WeakEliteSelector from './WeakEliteSelector.vue'
import type { EntityResult } from '@/lib/entity-query'
import type { WeakEliteTier } from '@/types/entity'

const props = defineProps<{ entity: EntityResult }>()
const emit = defineEmits<{ add: [{ entity: EntityResult; qty: number; tier: WeakEliteTier }] }>()

const qty = ref(1)
const tier = ref<WeakEliteTier>('normal')

function handleAdd() {
  emit('add', { entity: props.entity, qty: qty.value, tier: tier.value })
  qty.value = 1
  tier.value = 'normal'
}
</script>
```

**WeakEliteSelector integration:** Already accepts `v-model` for tier and `:level` — pass `props.entity.level ?? 0` as level.

### Anti-Patterns to Avoid

- **Using `h-screen` on CombatView:** `h-screen` ignores the AppLayout sidebar — use `h-full` instead. `CompendiumView.vue` confirms this with `flex flex-col h-full overflow-hidden`.
- **Calling `detailStore.openCreature()` on row click in combat mode:** The slide-over must NOT open when the user selects a creature for adding. Control this with the `mode` prop.
- **Mutating `entity.rawData` JSON directly:** Always `JSON.parse()` into a local variable; never assign back to the entity or cache the parsed object in the store.
- **Encoding tier in `sourceId`:** `sourceId` is used by `handleOpenDetail` to query by slug — keep it clean. Store tier in the `tier` field, not encoded in `sourceId`.
- **Floating add bar on top of VList:** The add bar must be in the column's flex flow (`flex flex-col`), not `position: fixed/absolute`, so VList shrinks appropriately when it appears.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HP delta calculation | Custom tier brackets | `getHpAdjustment(tier, level)` in `src/lib/weak-elite.ts` | 12-bracket table already verified against Archives of Nethys |
| Tier UI selector | Custom radio buttons | `WeakEliteSelector.vue` | Already styled, already shows HP delta label |
| Entity search + filter | New query component | `CreatureBrowser.vue` + `EntityFilterBar.vue` | 469 lines of proven virtualised search |
| UUID generation | `Math.random()` slugs | `uuid` (v4) via existing `uuidv4()` in combat store | Already in use; collision-free |
| Viewport-height layout | `calc(100vh - Npx)` | `h-full` inside AppLayout's `flex-1 overflow-y-auto` | Matches CompendiumView pattern |

---

## Common Pitfalls

### Pitfall 1: VList Height Collapse When Add Bar Appears

**What goes wrong:** The left panel is a flex column. When `CombatAddBar` appears (v-if), it takes space at the bottom. If the VList (`flex-1`) is inside `CreatureBrowser` which itself is `flex-1 min-h-0`, the VList may not shrink — it will overflow or clip.

**Why it happens:** Flexbox children don't shrink below `min-content` by default. Nested flex containers need explicit `min-h-0` at each level to allow shrinking.

**How to avoid:** Ensure the left-panel column is `flex flex-col overflow-hidden`, that `<CreatureBrowser>` receives `class="flex-1 min-h-0"`, and that `CreatureBrowser` itself is already `flex flex-col h-full` (it is — line 80: `<div class="flex flex-col h-full bg-charcoal-800">`).

**Warning signs:** Add bar appears but the VList list clips or disappears; scrollbar appears on the outer panel instead of inside VList.

### Pitfall 2: Auto-Numbering Regex Matches Wrong Base Name

**What goes wrong:** Regex `new RegExp(baseName)` with a name like "Dragon (Adult)" contains special regex characters. The pattern matches unintended creatures.

**Why it happens:** No escaping of user-facing entity names before embedding in RegExp.

**How to avoid:** Always pass entity names through an `escapeRegex` helper before building the pattern:
```typescript
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
```

### Pitfall 3: sourceId Mismatch Between Entity and Creature Lookup

**What goes wrong:** Phase 06 `handleOpenDetail` queries `WHERE sourceId = creature.sourceId`. If `addFromBrowser` stores `entity.id` (a number) instead of `entity.slug` (a string), the lookup fails silently.

**Why it happens:** `EntityResult.id` is the SQLite row ID; `EntityResult.slug` is the Foundry entity slug stored in `pf2eEntities.sourceId`. They look similar but are different.

**How to avoid:** Always use `entity.slug` when setting `sourceId` on the new Creature. Verify by cross-checking with `handleOpenDetail` in `CombatTracker.vue` which does `eq(pf2eEntities.sourceId, creature.sourceId)` — that column maps to the slug.

### Pitfall 4: raw_data JSON Path Mismatches

**What goes wrong:** Accessing `raw.system.attributes.hp.max` throws if the entity's rawData doesn't have that structure (e.g. non-creature entity types, or older pack format).

**Why it happens:** rawData is untyped JSON; not all entity types have the same schema.

**How to avoid:** Use optional chaining with nullish fallback for every raw_data access:
```typescript
const baseMaxHP = raw?.system?.attributes?.hp?.max ?? 0
const ac = raw?.system?.attributes?.ac?.value ?? 10
const dexMod = raw?.system?.abilities?.dex?.mod ?? 0
```
A maxHP of 0 will result in `Math.max(1, 0 + delta)` — at least 1 HP, never negative. This prevents broken creature cards.

### Pitfall 5: CombatTracker Test Breaks on "Add Creature" Button

**What goes wrong:** `CombatTracker.test.ts` line 55 finds the `+ Add Creature` button and expects it to open the form. If Phase 05 removes that button from the toolbar, the test fails.

**Why it happens:** The CONTEXT.md says "Whether the '+ Add Creature' button in the toolbar remains" is at Claude's discretion. The test is tightly coupled to the button.

**How to avoid:** Keep the `+ Add Creature` toolbar button in `CombatTracker.vue` for Phase 05 (Phase 07 removes it). This requires zero test changes and preserves backward compatibility. Update the test only in Phase 07 when the button is intentionally removed.

### Pitfall 6: CreatureBrowser Test Breaks When Mode Prop Added

**What goes wrong:** Existing `CreatureBrowser.test.ts` tests click rows and assert that `detailStore.openCreature` is called (line 180). Adding `mode="combat"` suppresses this call, breaking that test.

**Why it happens:** The mode prop changes behaviour; tests don't pass `mode` so they use the default (compendium) path.

**How to avoid:** Default `mode` to `'compendium'` (or simply `undefined` treated as compendium). All existing tests mount `CreatureBrowser` without a `mode` prop, so they exercise the existing path unchanged. New combat-mode tests should pass `mode="combat"` explicitly.

---

## Code Examples

### Extracting HP/AC/dexMod from rawData

```typescript
// Source: CombatTracker.vue handleOpenDetail pattern — same JSON parse approach
const raw = JSON.parse(entity.rawData)
const baseMaxHP: number = raw?.system?.attributes?.hp?.max ?? 0
const ac: number = raw?.system?.attributes?.ac?.value ?? 10
const dexMod: number = raw?.system?.abilities?.dex?.mod ?? 0
```

### Calling combatStore.addCreature (existing interface)

```typescript
// Source: src/stores/combat.ts addCreature() signature
combatStore.addCreature({
  name: 'Elite: Goblin Warrior 1',
  maxHP: 25,          // baseMaxHP + hpDelta
  currentHP: 25,      // same as maxHP on entry
  ac: 13,
  initiative: 0,      // DM fills in manually
  dexMod: 2,
  conditions: [],
  sourceId: 'goblin-warrior',   // entity.slug
  tier: 'elite',                // new optional field
})
```

### WeakEliteSelector usage (existing component)

```vue
<!-- Source: src/components/WeakEliteSelector.vue props -->
<WeakEliteSelector
  :level="selectedEntity.level ?? 0"
  v-model="tier"
/>
<!-- tier is ref<WeakEliteTier>('normal'), WeakEliteSelector handles all three states -->
```

### grid-cols-3 height-fill pattern

```vue
<!-- Matches CompendiumView's h-full overflow-hidden precedent -->
<div class="grid grid-cols-3 h-full overflow-hidden divide-x divide-charcoal-600">
  <div class="flex flex-col overflow-hidden"><!-- left --></div>
  <div class="overflow-y-auto"><!-- center --></div>
  <div class="overflow-y-auto"><!-- right --></div>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | Impact for Phase 05 |
|--------------|------------------|---------------------|
| CombatView is a 1-line wrapper | CombatView becomes the grid shell | CombatView.vue is a near-full rewrite |
| CreatureBrowser always opens slide-over | Mode prop selects-for-add in combat context | One prop, one conditional in handleRowClick |
| AddCreatureForm modal for adding | AddBar panel below browser for adding | AddCreatureForm kept; AddBar is additive |
| Creature type has no tier field | Creature type gains optional `tier` field | Backward compatible — optional field |

**No deprecated patterns apply.** All patterns introduced in Phases 01–04 remain valid.

---

## Open Questions

1. **raw_data JSON path for HP/AC on different entity sub-types**
   - What we know: PF2e creature raw_data uses `$.system.attributes.hp.max` and `$.system.attributes.ac.value` — confirmed by `handleOpenDetail` in CombatTracker which passes rawData to the detail panel (which renders it).
   - What's unclear: Some exotic creature types (e.g. hazards added to combat) may differ. Not in scope (browser is forced to `defaultEntityType="creature"`), but worth a defensive fallback.
   - Recommendation: Use optional chaining + `?? 0` fallback as shown above. Cover with a test case using minimal rawData `{}`.

2. **qty input upper bound**
   - What we know: CONTEXT.md shows example qty=3.
   - What's unclear: Should there be a max (e.g. 10)? No decision recorded.
   - Recommendation: Claude's discretion — use `min="1" max="20"` on the number input. Reasonable for PF2e encounter sizes.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 + @vue/test-utils 2.4.6 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WORK-01 | CombatView renders 3-column grid with correct CSS classes | unit | `npm test -- src/views/__tests__/CombatView.test.ts` | ❌ Wave 0 |
| WORK-01 | Each panel has independent overflow-y-auto scroll | unit | same file | ❌ Wave 0 |
| WORK-02 | CreatureBrowser in combat mode emits `select` instead of opening slide-over | unit | `npm test -- src/components/__tests__/CreatureBrowser.test.ts` | ✅ extend |
| WORK-02 | Selected row receives highlight class when `selectedId` matches | unit | same file | ✅ extend |
| WORK-03 | addFromBrowser with qty=1, no existing name → no suffix | unit | `npm test -- src/stores/__tests__/combat.test.ts` | ✅ extend |
| WORK-03 | addFromBrowser with qty=1, name exists → continues numbering | unit | same file | ✅ extend |
| WORK-03 | addFromBrowser with qty=3 → three numbered entries | unit | same file | ✅ extend |
| WORK-03 | Numbering ignores tier prefix (elite goblin 3 after 2 normal goblins) | unit | same file | ✅ extend |
| WORK-04 | addFromBrowser elite adjusts maxHP via getHpAdjustment | unit | same file | ✅ extend |
| WORK-04 | addFromBrowser weak adjusts maxHP via getHpAdjustment | unit | same file | ✅ extend |
| WORK-04 | currentHP equals adjustedMaxHP on entry | unit | same file | ✅ extend |
| WORK-05 | Elite creature name has "Elite: " prefix in tracker | unit | same file | ✅ extend |
| WORK-05 | Weak creature name has "Weak: " prefix in tracker | unit | same file | ✅ extend |
| WORK-05 | CombatAddBar resets qty=1, tier=normal after add | unit | `npm test -- src/components/__tests__/CombatAddBar.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- src/stores/__tests__/combat.test.ts src/views/__tests__/CombatView.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/views/__tests__/CombatView.test.ts` — covers WORK-01 (3-panel grid layout assertions)
- [ ] `src/components/__tests__/CombatAddBar.test.ts` — covers WORK-05 reset after add

*(All other test files exist; new test cases are additions to existing files)*

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `src/views/CombatView.vue` — current structure, confirmed 2-line wrapper
- `src/components/CombatTracker.vue` — toolbar, AddCreatureForm usage, handleOpenDetail pattern
- `src/components/CreatureBrowser.vue` — row-click handler, detailStore coupling, VList structure
- `src/components/WeakEliteSelector.vue` — props interface, v-model pattern
- `src/components/CreatureCard.vue` — name rendering (verbatim), sourceId conditional button
- `src/components/AppLayout.vue` — `h-screen flex`, `flex-1 overflow-y-auto` on `<main>`
- `src/stores/combat.ts` — addCreature() signature, creatures array structure
- `src/types/combat.ts` — Creature interface, confirmed sourceId?: string exists
- `src/lib/weak-elite.ts` — getHpAdjustment() signature and 12-bracket table
- `src/lib/entity-query.ts` — EntityResult interface, rawData field type
- `src/views/CompendiumView.vue` — h-full overflow-hidden pattern precedent
- `tailwind.config.js` — confirmed token names and values
- `package.json` — confirmed all dependency versions
- `vitest.config.ts` — test framework config, include pattern
- `src/__tests__/global-setup.ts` — Transition stub pattern

### Secondary (MEDIUM confidence — test files)

- `src/components/__tests__/CreatureBrowser.test.ts` — confirms detailStore.openCreature is called on row click; confirmed mode-prop strategy won't break existing tests
- `src/stores/__tests__/combat.test.ts` — confirms addCreature() accepts Omit<Creature, 'id'>
- `src/components/__tests__/CombatTracker.test.ts` — confirms "+ Add Creature" button test will break if button removed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed from package.json; no new deps needed
- Architecture: HIGH — patterns derived from reading actual source; grid pattern confirmed from CompendiumView
- Auto-numbering algorithm: HIGH — rules are fully specified in CONTEXT.md; edge cases enumerated
- raw_data JSON paths: MEDIUM — paths inferred from handleOpenDetail usage; not directly tested in unit tests
- Pitfalls: HIGH — all derived from direct code reading (existing tests, existing components)

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable codebase; no fast-moving external dependencies)
