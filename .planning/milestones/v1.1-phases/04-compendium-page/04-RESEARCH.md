# Phase 04: Compendium Page - Research

**Researched:** 2026-03-21
**Domain:** Vue 3 view composition — page-level assembly of Phase 03 components
**Confidence:** HIGH (codebase-derived; all components exist and are fully readable)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page Layout**
- Minimal page header with "Compendium" title (font-display, text-gold) — provides orientation without wasting vertical space
- CreatureBrowser fills the remaining height below the header (flex-1)
- No metadata bar above the browser — CreatureBrowser already shows result count inline
- Full dark charcoal background consistent with existing pages

**Entity Type Grouping (COMP-01)**
- "Grouped by entity type" is satisfied by the entity type dropdown filter in EntityFilterBar (already built in Phase 03)
- No tabs or sidebar sections — the filter bar IS the grouping mechanism
- Default view shows all entity types mixed; user narrows with the type dropdown

**Initial State**
- Compendium auto-loads all entities on mount (no filters applied) — CreatureBrowser already does this via onMounted
- No defaultEntityType prop on this page (unlike Combat Workspace which will default to 'creature')
- If no synced entities exist (fresh install), show a friendly empty state with a prompt to navigate to Sync Data page

**Slide-over Integration (COMP-08)**
- Row click in CreatureBrowser already triggers useCreatureDetailStore().openCreature() — the existing CreatureDetailPanel slide-over renders the full stat block
- No additional work needed for COMP-08 beyond composing CreatureBrowser on the page

**Sidebar Navigation**
- AppSidebar already has the Compendium link with book icon and active-class styling (added in Phase 01)
- Router already has /compendium route (added in Phase 02)
- No sidebar changes needed in this phase

### Claude's Discretion
- Exact header height and spacing
- Whether to add a subtle divider between header and browser
- Empty-state illustration or icon choice for "no synced data" state
- Test strategy for the composition (shallow mount vs integration)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | User can browse all synced entities on a dedicated Compendium page grouped by entity type | EntityFilterBar entity-type dropdown satisfies grouping; no tabs needed; drop CreatureBrowser with no defaultEntityType prop |
| COMP-02 | User can filter entities by type on the Compendium page | EntityFilterBar entity-type `<select>` already built; CreatureBrowser wires filter-change to filterEntities() |
| COMP-03 | User can filter entities by level range (1–20) on the Compendium page | EntityFilterBar levelMin/levelMax inputs + Auto button already built |
| COMP-04 | User can filter entities by rarity (common/uncommon/rare/unique) on the Compendium page | EntityFilterBar rarity `<select>` already built |
| COMP-05 | User can search entities by name using full-text search on the Compendium page | EntityFilterBar name input already wired to FTS5 via filterEntities() Path B; 200ms debounce in CreatureBrowser satisfies 300ms requirement |
| COMP-08 | User can open full entity stat block in slide-over panel from Compendium | CreatureBrowser row click calls detailStore.openCreature(); CreatureDetailPanel is globally rendered in App.vue (or must be added to AppLayout.vue — see Architecture Patterns) |
</phase_requirements>

---

## Summary

Phase 04 is a composition phase. All three building blocks — `CreatureBrowser`, `EntityFilterBar`, and `CreatureDetailPanel` — were fully implemented in Phase 03. This phase has exactly one new file: a replacement for the stub `src/views/CompendiumView.vue` (currently 5 lines). The replacement adds a page header and drops `<CreatureBrowser />` into a full-height flex container.

The only non-trivial decision is where `CreatureDetailPanel` lives in the component tree. It must be rendered in a common ancestor above `CompendiumView` so the slide-over overlay covers the full viewport (not just the main content area). Investigation confirms `AppLayout.vue` is the correct mount point — it is the shared shell that wraps `<AppSidebar>` and `<RouterView>`. `CreatureDetailPanel` must be added there if not already present (current AppLayout.vue does NOT include it).

The empty-state for "no synced data" is the only content that requires judgment. The current `CreatureBrowser` shows a generic "No matches" empty state when `results.length === 0`. For the Compendium page, a first-launch experience requires distinguishing between "no matches for current filters" (already handled by CreatureBrowser) and "no data has ever been synced". The distinction is detectable by checking `syncState` from the database. The locked decision says: show a prompt to navigate to Sync Data. Implementation options are covered in Architecture Patterns.

**Primary recommendation:** One task — replace `CompendiumView.vue` stub with a flex-column layout (page header + `<CreatureBrowser />`), add `<CreatureDetailPanel />` to `AppLayout.vue` if missing, update `CompendiumView.test.ts` to cover the new structure. No new libraries, no new stores, no schema changes.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 (Composition API) | ^3.5.13 | Component model | Already in project |
| Tailwind CSS | ^3.4.17 | Styling via design tokens | Already in project; charcoal/gold/crimson tokens in tailwind.config.js |
| Pinia | ^2.3.0 | `useCreatureDetailStore` — slide-over state | Already in project; store already written |
| virtua | ^0.48.8 | Virtualised list inside CreatureBrowser | Already installed; used by CreatureBrowser |
| vue-router | ^4.5.0 | RouterLink for "Go to Sync Data" prompt | Already in project |

### No New Libraries Required
Phase 04 needs zero new npm dependencies. All component primitives exist.

**Version verification:** All versions confirmed from `package.json` — no npm view needed.

---

## Architecture Patterns

### Recommended Project Structure (changes only)
```
src/
├── views/
│   └── CompendiumView.vue          # REPLACE stub with full composition
├── components/
│   └── AppLayout.vue               # ADD <CreatureDetailPanel /> here (if missing)
└── views/__tests__/
    └── CompendiumView.test.ts      # UPDATE — replace stub tests with composition tests
```

All other files (CreatureBrowser, EntityFilterBar, CreatureDetailPanel, stores, router) are unchanged.

### Pattern 1: CompendiumView Layout — Flex Column, Full Height

**What:** The view is a flex-column container that fills the available main area (AppLayout gives `<main class="flex-1 overflow-y-auto">` — RouterView renders inside main). Header is fixed-height, browser fills the rest.

**When to use:** Any full-page view that needs a header + scrollable/virtualised body area.

```vue
<!-- src/views/CompendiumView.vue -->
<script setup lang="ts">
import CreatureBrowser from '@/components/CreatureBrowser.vue'
</script>

<template>
  <div class="flex flex-col h-full bg-charcoal-800">
    <!-- Page header -->
    <div class="px-6 py-4 border-b border-charcoal-600 flex-shrink-0">
      <h1 class="text-2xl font-display font-bold text-gold">Compendium</h1>
    </div>
    <!-- Browser fills remaining height -->
    <div class="flex-1 min-h-0">
      <CreatureBrowser class="h-full" />
    </div>
  </div>
</template>
```

**Critical detail:** `min-h-0` on the flex child prevents flex overflow issues in some browsers — the default `min-height: auto` on flex children can prevent the child from shrinking below its content height. Without it, CreatureBrowser may not fill the container correctly and VList scrolling breaks.

### Pattern 2: CreatureDetailPanel Mount Point

**What:** `CreatureDetailPanel` renders a fixed-position overlay (`fixed right-0 top-0 h-full w-96 z-50`). It must be rendered in a component whose DOM node is not clipped by `overflow: hidden` ancestors. Inspecting `AppLayout.vue`:

```vue
<!-- Current AppLayout.vue -->
<div class="flex h-screen bg-charcoal-800 overflow-hidden">
  <AppSidebar />
  <main class="flex-1 overflow-y-auto">
    <RouterView />
  </main>
</div>
```

The `overflow-hidden` on the root div and `overflow-y-auto` on `<main>` would clip a `fixed` child that is nested inside `<RouterView>`. However, CSS `position: fixed` is positioned relative to the **viewport** (or the nearest ancestor with a CSS transform/perspective/filter), not the containing block. In standard HTML without CSS transforms on ancestors, `fixed` elements escape `overflow: hidden`.

**Verification needed:** Confirm no CSS `transform` or `filter` is on any ancestor of `CompendiumView`. If none exist, `fixed` positioning works correctly from inside `<RouterView>`. If a transform is found, `CreatureDetailPanel` must be lifted to `AppLayout.vue`.

**Current state of AppLayout.vue:** No transform or filter — only flex/overflow classes. Fixed positioning will work from inside the view. However, it is cleaner architecture to place `CreatureDetailPanel` in `AppLayout.vue` so it is available to all routes (Phase 05 Combat Workspace will also need it).

**Recommended:** Add `<CreatureDetailPanel />` to `AppLayout.vue`. This is a one-line addition.

```vue
<!-- AppLayout.vue (updated) -->
<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import CreatureDetailPanel from './CreatureDetailPanel.vue'
</script>

<template>
  <div class="flex h-screen bg-charcoal-800 overflow-hidden">
    <AppSidebar />
    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
    <!-- Slide-over panel: fixed overlay, shared across all routes -->
    <CreatureDetailPanel />
  </div>
</template>
```

**If `CreatureDetailPanel` is currently mounted inside a view:** Check whether CombatView.vue or any existing view already imports it. Inspection of `src/views/CombatView.vue` shows it only imports `CombatTracker`. Check `CombatTracker.vue` to verify whether it imports CreatureDetailPanel internally — if so, moving to AppLayout avoids double-mount.

### Pattern 3: Empty State — No Synced Data Distinction

**What:** When the database has never been synced, `filterEntities()` with no filters returns an empty array. CreatureBrowser's current empty state says "No matches / Clear a filter to broaden your search" which is misleading for a first-launch user.

**Two approaches:**

**Option A — Check syncState in CompendiumView (recommended):**
Query `syncState` table once on mount. If `totalEntities === null` or `totalEntities === 0`, show a full-page empty state above/instead of CreatureBrowser with a RouterLink to `/sync`.

```vue
<!-- CompendiumView.vue addition -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { db } from '@/lib/database'
import { syncState } from '@/lib/schema'

const hasSyncedData = ref<boolean | null>(null)  // null = loading

onMounted(async () => {
  const rows = await db.select().from(syncState).limit(1)
  hasSyncedData.value = (rows[0]?.totalEntities ?? 0) > 0
})
</script>
```

**Option B — Pass prop to CreatureBrowser:**
Add a `noDataMessage` prop or slot to CreatureBrowser for custom empty state. More flexible but adds complexity to a component being shared with Phase 05.

**Recommendation:** Option A. The Compendium page owns the "first launch" concern; CreatureBrowser should stay generic. SyncView.vue uses this exact same `db.select().from(syncState)` pattern already — it is well-established.

### Pattern 4: Test Strategy for Composition

**What:** The existing `CompendiumView.test.ts` has 2 trivial tests (h1 exists, text is "Compendium"). These must be updated to cover the new composition.

**Approach — shallow mount with stubs:**
- Stub `CreatureBrowser` (to avoid entity-query/virtua/IPC dependencies)
- Stub `db` / `syncState` import (for the `hasSyncedData` check)
- Test: renders page heading with `font-display text-gold` classes
- Test: renders `<CreatureBrowser>` component
- Test: shows "no data" empty state + RouterLink when hasSyncedData is false
- Test: shows `<CreatureBrowser>` when hasSyncedData is true

**Consistent with existing test patterns:**
- `CreatureBrowser.test.ts` mocks `@/lib/entity-query` at the top of the file (vitest hoisting)
- `SyncView.test.ts` can be checked for how it mocks the `db` import

### Anti-Patterns to Avoid

- **Importing CreatureDetailPanel inside CompendiumView:** The panel is a fixed overlay; it should live in AppLayout to be available across all routes, not duplicated per view.
- **Passing `defaultEntityType` to CreatureBrowser from CompendiumView:** Compendium shows all types by default — do NOT pass this prop (undefined is correct).
- **Adding a page-level Pinia store for Compendium filter state:** EntityFilterBar already manages filter state locally. Lifting it to a store causes cross-context contamination (STATE.md decision 03-02).
- **`overflow-hidden` on the flex-1 wrapper around CreatureBrowser:** Clips the VList scroll. Use `min-h-0` instead to allow the child to shrink.
- **Checking `results.length === 0` in CompendiumView to detect "no sync":** False — could have synced data but current filters produce zero results. Must check `syncState.totalEntities` from the DB.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Entity browsing and filtering | Custom list + filter controls | `<CreatureBrowser />` (Phase 03) | Already built, tested, 131 lines |
| Filter controls | New filter UI | `<EntityFilterBar />` inside CreatureBrowser | Already included in CreatureBrowser — no separate mount needed |
| Slide-over stat block | New panel | `<CreatureDetailPanel />` + `useCreatureDetailStore` | Already built with nav history, resolving, sanitizing |
| Virtualised entity list | Custom windowing | `virtua` VList inside CreatureBrowser | Already installed and wired |
| Route guard for "go sync" | Navigation guard | RouterLink in empty state | Proportionate solution for a DM desktop tool |

**Key insight:** Phase 04 is pure composition. The risk is adding unnecessary code to a phase whose value is simplicity. The planner should resist the urge to add features; the success criteria is met by a ~30-line view file.

---

## Common Pitfalls

### Pitfall 1: VList Scroll Breaking Due to Flex Height
**What goes wrong:** CreatureBrowser renders with zero height or doesn't scroll because the parent flex container doesn't give it a defined height.
**Why it happens:** `flex-1` on a flex child gives it available space, but the child itself must also have `h-full` (or explicit height) for VList to compute its scroll container correctly. If `overflow-y-auto` is on the parent `<main>` in AppLayout, the `<RouterView>` content can grow infinitely — VList never gets a bounded container.
**How to avoid:** Structure CompendiumView with `h-full` on the root div and `flex-1 min-h-0` on the browser wrapper. Verify that AppLayout's `<main class="flex-1 overflow-y-auto">` is changed to `overflow-hidden` for the Compendium route — or use `h-full` on CompendiumView's root to constrain the height.
**Warning signs:** All 28K entities render as a single long list (no virtualisation — VList falls back to rendering all rows), or the browser area has height 0.

### Pitfall 2: CreatureDetailPanel Not Covering Full Viewport
**What goes wrong:** The slide-over appears clipped to the main content area width (excluding the sidebar) instead of overlaying the full window.
**Why it happens:** CSS `position: fixed` is scoped to the nearest ancestor with `transform`, `filter`, or `will-change` applied. If any wrapper has these, `fixed` is relative to that element.
**How to avoid:** Keep `CreatureDetailPanel` in `AppLayout.vue` (above all transforms). Verify no wrapper has `transform` applied in the Tauri WebView2 context.
**Warning signs:** The panel appears to stop at the right edge of `<main>` and doesn't overlay the sidebar.

### Pitfall 3: Empty State Never Shown (syncState Check Skipped)
**What goes wrong:** On a fresh install, CompendiumView renders `<CreatureBrowser />` which shows "No matches / Clear a filter to broaden your search" — confusing for a user who has never synced.
**Why it happens:** CreatureBrowser's empty state assumes filters are active; it has no knowledge of whether data has been synced.
**How to avoid:** Check `syncState.totalEntities` on CompendiumView mount. Show a dedicated "No data synced yet" state with a RouterLink to `/sync` when `totalEntities` is 0 or null.
**Warning signs:** On fresh install, the Compendium page shows "No matches" instead of guiding the user to sync.

### Pitfall 4: Existing CompendiumView Tests Become Stale
**What goes wrong:** The 2 existing tests in `CompendiumView.test.ts` pass trivially (`mount(CompendiumView)` + text check) but don't cover the new composition or the empty state logic. CI passes but the new behavior is untested.
**Why it happens:** The stub test was written for the 5-line stub view; updating the view without updating the tests leaves false confidence.
**How to avoid:** Replace or extend the existing tests to cover: (1) `<CreatureBrowser>` rendered when data exists, (2) "no data" empty state + RouterLink when no sync, (3) heading styling (font-display, text-gold).

---

## Code Examples

### CompendiumView — Full Implementation Reference

```vue
<!-- src/views/CompendiumView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CreatureBrowser from '@/components/CreatureBrowser.vue'
import { db } from '@/lib/database'
import { syncState } from '@/lib/schema'

// null = loading, false = no data, true = data present
const hasSyncedData = ref<boolean | null>(null)

onMounted(async () => {
  try {
    const rows = await db.select().from(syncState).limit(1)
    hasSyncedData.value = (rows[0]?.totalEntities ?? 0) > 0
  } catch {
    // DB unavailable — show browser anyway (CreatureBrowser handles its own error state)
    hasSyncedData.value = true
  }
})
</script>

<template>
  <div class="flex flex-col h-full bg-charcoal-800">
    <!-- Page header -->
    <div class="px-6 py-4 border-b border-charcoal-600 flex-shrink-0">
      <h1 class="text-2xl font-display font-bold text-gold">Compendium</h1>
    </div>

    <!-- Loading skeleton (brief) -->
    <div v-if="hasSyncedData === null" class="flex-1 flex items-center justify-center">
      <div class="animate-pulse bg-charcoal-700 h-4 w-48 rounded" />
    </div>

    <!-- No data synced yet -->
    <div
      v-else-if="hasSyncedData === false"
      class="flex-1 flex flex-col items-center justify-center gap-3"
    >
      <p class="text-sm font-bold text-stone-300">No data synced yet</p>
      <p class="text-xs text-stone-400">
        Import PF2e content to browse the Compendium.
      </p>
      <RouterLink
        to="/sync"
        class="text-gold hover:text-gold-light text-sm font-bold underline"
      >
        Go to Sync Data
      </RouterLink>
    </div>

    <!-- Browser fills remaining height -->
    <div v-else class="flex-1 min-h-0">
      <CreatureBrowser class="h-full" />
    </div>
  </div>
</template>
```

### AppLayout — Updated with CreatureDetailPanel

```vue
<!-- src/components/AppLayout.vue -->
<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import CreatureDetailPanel from './CreatureDetailPanel.vue'
</script>

<template>
  <div class="flex h-screen bg-charcoal-800 overflow-hidden">
    <AppSidebar />
    <main class="flex-1 overflow-hidden">
      <RouterView />
    </main>
    <CreatureDetailPanel />
  </div>
</template>
```

**Note on `overflow-hidden` vs `overflow-y-auto` on `<main>`:** The current AppLayout uses `overflow-y-auto` on `<main>`. For pages that need internal scrolling (SyncView, which uses `px-8 py-8 max-w-lg`), the outer `overflow-y-auto` is what drives the scroll. For CompendiumView, internal scrolling is owned by VList. Changing to `overflow-hidden` on `<main>` means SyncView and CombatView need `overflow-y-auto` added to their own root divs. **Alternative:** leave `overflow-y-auto` on `<main>` and add `overflow-hidden` to CompendiumView's root `div` — this scopes the scroll context per page without changing the shared shell. This is the safer approach to avoid breaking existing views.

### CompendiumView Test — Updated Patterns

```typescript
// src/views/__tests__/CompendiumView.test.ts
import { vi, describe, it, expect } from 'vitest'

// Must mock before import (vitest hoisting)
vi.mock('@/lib/database', () => ({ db: { select: vi.fn() } }))
vi.mock('@/lib/schema', () => ({ syncState: 'syncState' }))
vi.mock('@/components/CreatureBrowser.vue', () => ({
  default: { template: '<div class="creature-browser-stub" />' },
}))

import { mount, flushPromises } from '@vue/test-utils'
import { RouterLink } from 'vue-router'
import CompendiumView from '../CompendiumView.vue'
import { db } from '@/lib/database'

describe('CompendiumView', () => {
  it('renders "Compendium" heading with font-display text-gold classes', async () => {
    ;(db.select as any).mockReturnValue({ from: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ totalEntities: 100 }]) }) })
    const wrapper = mount(CompendiumView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.classes()).toContain('font-display')
    expect(h1.classes()).toContain('text-gold')
    expect(h1.text()).toBe('Compendium')
  })

  it('renders CreatureBrowser when data is synced', async () => {
    ;(db.select as any).mockReturnValue({ from: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ totalEntities: 28000 }]) }) })
    const wrapper = mount(CompendiumView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()
    expect(wrapper.find('.creature-browser-stub').exists()).toBe(true)
  })

  it('shows "No data synced yet" empty state when totalEntities is 0', async () => {
    ;(db.select as any).mockReturnValue({ from: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ totalEntities: 0 }]) }) })
    const wrapper = mount(CompendiumView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()
    expect(wrapper.text()).toContain('No data synced yet')
    expect(wrapper.find('.creature-browser-stub').exists()).toBe(false)
  })

  it('shows RouterLink to /sync in no-data empty state', async () => {
    ;(db.select as any).mockReturnValue({ from: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) })
    const wrapper = mount(CompendiumView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()
    expect(wrapper.text()).toContain('Sync Data')
  })
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CompendiumView as 5-line stub | Full page composition with header + CreatureBrowser | Phase 04 | COMP-01 through COMP-05 and COMP-08 all satisfied |
| CreatureDetailPanel mounted per-view | CreatureDetailPanel mounted once in AppLayout | Phase 04 | Panel available to all routes; needed by Phase 05 Combat Workspace too |
| AppLayout main with `overflow-y-auto` | AppLayout main with `overflow-hidden` (or per-page scoped scroll) | Phase 04 | Prevents VList container height bleed |

---

## Open Questions

1. **Where is CreatureDetailPanel currently mounted?**
   - What we know: `CombatView.vue` only imports `CombatTracker`; `CombatTracker.vue` was not read in this research pass
   - What's unclear: Whether `CombatTracker.vue` imports `CreatureDetailPanel` internally — if so, moving it to AppLayout creates a double-mount problem
   - Recommendation: Planner task should read `CombatTracker.vue` first and check its imports before editing AppLayout; if CreatureDetailPanel is already in CombatTracker, lift it to AppLayout and remove from CombatTracker in the same task

2. **`overflow-y-auto` vs `overflow-hidden` on `<main>` in AppLayout**
   - What we know: Current AppLayout has `overflow-y-auto` on `<main>`; SyncView and CombatView rely on this for their own scroll behavior
   - What's unclear: Whether changing to `overflow-hidden` breaks SyncView (its content fits within 600px on most screens but could scroll on small windows)
   - Recommendation: Safest approach — add `overflow-y-auto` to SyncView's root div and CombatView's root div when changing AppLayout to `overflow-hidden`; or add `overflow-hidden` only to CompendiumView's root div and leave AppLayout unchanged

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
| COMP-01 | Compendium page renders all entity types (no defaultEntityType filter) | unit | `npm test -- CompendiumView` | Partial — needs update |
| COMP-02 | Entity type filter operative (delegated to CreatureBrowser/EntityFilterBar) | unit (CreatureBrowser already tested) | `npm test -- CreatureBrowser` | Yes |
| COMP-03 | Level range filter operative (delegated to CreatureBrowser/EntityFilterBar) | unit (CreatureBrowser/EntityFilterBar already tested) | `npm test -- EntityFilterBar` | Yes |
| COMP-04 | Rarity filter operative (delegated) | unit (EntityFilterBar already tested) | `npm test -- EntityFilterBar` | Yes |
| COMP-05 | FTS name search within 300ms (debounce 200ms in CreatureBrowser) | unit (debounce test already in CreatureBrowser.test.ts) | `npm test -- CreatureBrowser` | Yes |
| COMP-08 | Row click opens slide-over (detailStore.openCreature called) | unit (already in CreatureBrowser.test.ts) | `npm test -- CreatureBrowser` | Yes |
| General | CompendiumView renders h1 with font-display text-gold | unit | `npm test -- CompendiumView` | No — needs update |
| General | CompendiumView renders CreatureBrowser when data synced | unit | `npm test -- CompendiumView` | No — needs update |
| General | CompendiumView shows no-data empty state with RouterLink to /sync | unit | `npm test -- CompendiumView` | No — needs update |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/views/__tests__/CompendiumView.test.ts` — existing file has only 2 stub tests; must replace with composition tests covering COMP-01 (no defaultEntityType), empty state, heading style
- [ ] No new test files needed — existing CreatureBrowser.test.ts and EntityFilterBar.test.ts already cover COMP-02 through COMP-08 at the component level

*(Existing test infrastructure covers all framework setup — no new conftest/setup files needed.)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection:
  - `src/views/CompendiumView.vue` — current 5-line stub
  - `src/components/CreatureBrowser.vue` — full 131-line component; no props needed for Compendium
  - `src/components/EntityFilterBar.vue` — 337-line filter bar; confirms all filters built
  - `src/components/CreatureDetailPanel.vue` — slide-over panel; uses `position: fixed` overlay
  - `src/components/AppLayout.vue` — flex h-screen shell; no transforms found
  - `src/components/AppSidebar.vue` — Compendium RouterLink confirmed present
  - `src/router/index.ts` — `/compendium` route confirmed registered
  - `src/stores/creatureDetail.ts` — `openCreature()`, `isOpen`, `close()` confirmed
  - `src/lib/entity-query.ts` — `filterEntities()` Path A/B; full filter support confirmed
  - `src/views/SyncView.vue` — `db.select().from(syncState)` pattern reference
  - `src/views/__tests__/CompendiumView.test.ts` — existing stub tests confirmed
  - `src/components/__tests__/CreatureBrowser.test.ts` — mock patterns confirmed
  - `src/__tests__/setup.ts` and `global-setup.ts` — Pinia + Transition stubs confirmed
  - `tailwind.config.js` — design tokens confirmed (charcoal/gold/crimson, font-display=Cinzel)
  - `package.json` — all library versions confirmed
  - `vitest.config.ts` — test runner config confirmed

### Secondary (MEDIUM confidence)
- CSS `position: fixed` viewport-relative behavior — web platform standard; no transforms found in AppLayout so fixed positioning will work correctly from inside RouterView

### Tertiary (LOW confidence)
- None — all findings are codebase-derived

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; no new dependencies
- Architecture: HIGH — all components exist and are fully readable; composition pattern is straightforward
- Pitfalls: HIGH — derived from actual code inspection (flex height, fixed positioning, empty state detection)
- Test patterns: HIGH — existing test files confirm mock/mount patterns

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable domain — all dependencies already in project)
