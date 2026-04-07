# Phase 01: Bug Fix and UI Improvements - Research

**Researched:** 2026-03-20
**Domain:** Tauri 2 HTTP capabilities, Tailwind CSS v3 theme extension, Vue 3 component architecture, condition value types
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**HTTP Scope Fix**
- Add `http:scope` allowlist to `src-tauri/capabilities/default.json`
- Scope: `https://**` (allow all HTTPS) — permissive, covers current and future fetch calls
- Only the frontend `fetch()` call to `api.github.com` is affected; ZIP download uses Rust `reqwest` via `invoke('download_file')` and is NOT subject to this scope

**Dark Fantasy Color Palette**
- Background: near-black charcoal (`#0f0f0f`–`#1a1a1a`)
- Card surfaces: slightly lighter dark (`#2a2a2a` range) with subtle gold borders
- Accent/gold: warm gold (`#d4af37`–`#c9a84c` range)
- Danger/destructive: muted red
- Disabled: dark gray

**Typography**
- Headings: Cinzel (Google Fonts) serif display font
- Body: system sans-serif (Tailwind default)
- Tailwind config needs `fontFamily.display` extended with Cinzel

**Interactive States**
- Primary buttons: gold fill or gold border glow
- Danger/destructive buttons: muted red
- Active creature turn: gold left border + subtle gold glow around the card

**Navigation Structure**
- Persistent left sidebar, fixed 180px width, not collapsible
- `App.vue` layout: after splash clears, render sidebar + `<RouterView>` side-by-side
- Nav items (this phase): Combat Tracker, Sync Data

**Creature Cards — Full Redesign**
- Full layout + interaction redesign (not just reskin)
- Initiative number as badge
- HP displayed as bar + current/max numbers
- Active turn: gold border + soft gold glow

**HP Controls**
- Keep existing +/- increment buttons (restyle)
- ADD: numeric input field for the increment amount (user types value, then clicks + or -)
- Both buttons and amount input coexist on the card

**Condition Badges**
- Colored pill badges directly visible on the card (no dropdown, no collapse)
- Conditions with numeric values show the value inside the badge
- Binary conditions show name only
- Click to toggle; value conditions allow incrementing/decrementing

**Sync Page**
- SyncButton component becomes a full Sync view/page within the sidebar layout
- Dark-themed

### Claude's Discretion

None specified.

### Deferred Ideas (OUT OF SCOPE)
- Data Browser page (search, filtering, stat block presentation)
- Settings page stub
- Quick action buttons for attacks/saves
</user_constraints>

---

## Summary

This phase has two distinct areas: a one-line config bug fix and a comprehensive UI overhaul. The HTTP scope bug fix is straightforward — the current `capabilities/default.json` has `http:default` and `http:allow-fetch*` permissions listed as bare strings, which enables the commands but lacks the required URL scope object. Adding the scope object as a permission entry (not replacing the string entries) unblocks `fetch()` to `api.github.com`.

The UI overhaul is an in-place Tailwind CSS reskin and component redesign — no new libraries are needed. The design system is fully specified in `01-UI-SPEC.md`, including exact color tokens, spacing, and component contracts. The Tailwind config extension is a mechanical change to `tailwind.config.js`. The sidebar layout requires two new components (`AppLayout`, `AppSidebar`) and a small change to `App.vue`. All other work is replacing or restyling existing components.

The biggest type-system gap is condition value support. `Creature` in `src/types/combat.ts` tracks `conditions: Condition[]` (presence/absence) and `conditionDurations?: Record<Condition, number>` (duration countdown). But the badge system needs a separate `conditionValues?: Partial<Record<Condition, number>>` field for PF2e-style numeric condition severity (stunned 2, frightened 3). `conditionDurations` tracks auto-decrement timing, while `conditionValues` tracks the PF2e value shown on the badge — they are semantically distinct. The store's `toggleCondition` and `toggleConditionWithOptions` need companion functions to get/set condition values.

**Primary recommendation:** Fix HTTP scope first (one file change, verifiable immediately), then layer in Tailwind tokens, then build AppLayout/AppSidebar, then redesign components top-down (CombatTracker → CreatureCard → HPController → ConditionBadge → AddCreatureForm → SyncView).

---

## Standard Stack

### Core (already in project — no new installs)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | 3.4.19 (installed) | Utility CSS framework | Already in use; v3 `theme.extend` pattern covers all token needs |
| vue | 3.5.13 | Component framework | Project stack |
| vue-router | 4.5.0 | Routing + RouterLink | Already powers navigation; `router-link-active` provides active state hook |
| pinia | 2.3.0 | State management | Already powers combat store; `conditionValues` field is an additive change |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Google Fonts CDN | — | Cinzel display font | `<link>` tags in `index.html` — no npm package needed |
| @tauri-apps/plugin-http | 2.x (installed) | Tauri fetch with scope enforcement | Existing; only `capabilities/default.json` needs updating |

### No new dependencies required

All work is configuration + component code in the existing stack.

**Version verification:**
```bash
# These are already installed — confirmed from package.json and node_modules
# tailwindcss: 3.4.19 (pnpm-lock confirms)
# vue: 3.5.13
# vue-router: 4.5.0
```

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
src/
├── components/
│   ├── AppLayout.vue        # NEW — flex wrapper: sidebar + router-view
│   ├── AppSidebar.vue       # NEW — persistent 180px left nav
│   ├── ConditionBadge.vue   # NEW — replaces ConditionToggle
│   ├── CreatureCard.vue     # FULL REDESIGN — keep file
│   ├── HPController.vue     # REDESIGN — add amount input
│   ├── CombatTracker.vue    # REDESIGN — header + layout
│   ├── AddCreatureForm.vue  # REDESIGN — dark theme
│   └── CreatureDetailPanel.vue  # RESTYLE only — keep structure
├── views/
│   ├── SyncView.vue         # NEW — replaces SyncButton tile usage
│   └── DashboardView.vue    # REMOVE — dashboard route replaced by sidebar nav
src-tauri/
└── capabilities/
    └── default.json         # FIX — add http:default scope object
```

### Pattern 1: Tauri 2 HTTP Scope Fix

**What:** Add a scope object alongside the existing string permissions. The string entries enable the Tauri commands; the scope object restricts which URLs those commands may access. Both are required.

**When to use:** Any time a Tauri 2 frontend plugin needs URL-scoped access.

**Example:**
```json
// src-tauri/capabilities/default.json
// Source: https://v2.tauri.app/plugin/http-client/ + github.com/tauri-apps/plugins-workspace/issues/1468
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capability for pathbuddy",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:scope-temp",
    "sql:default",
    "sql:allow-execute",
    "sql:allow-select",
    {
      "identifier": "http:default",
      "allow": [{ "url": "https://**" }]
    },
    "http:allow-fetch",
    "http:allow-fetch-cancel",
    "http:allow-fetch-read-body",
    "http:allow-fetch-send",
    "fs:default"
  ]
}
```

The bare `"http:default"` string entry must be replaced by the object form with the `allow` array. The other `http:allow-fetch*` string entries stay as-is.

### Pattern 2: Tailwind v3 Theme Extension

**What:** Extend `tailwind.config.js` with custom color scales and fontFamily. The `theme.extend` pattern adds to Tailwind's defaults without replacing them.

**When to use:** Adding project-specific design tokens.

**Example:**
```javascript
// tailwind.config.js — exact tokens from 01-UI-SPEC.md
// Source: tailwindcss.com/docs/theme (v3)
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#0f0f0f',
          900: '#141414',
          800: '#1a1a1a',
          700: '#222222',
          600: '#2a2a2a',
          500: '#333333',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light:   '#d4af37',
          dark:    '#a8893b',
          muted:   '#6b5c28',
          glow:    'rgba(201,168,76,0.15)',
        },
        crimson: {
          DEFAULT: '#8b2020',
          light:   '#b03030',
          dark:    '#5c1515',
          muted:   'rgba(139,32,32,0.20)',
        },
      },
      fontFamily: {
        display: ['"Cinzel"', 'Georgia', 'serif'],
        body:    ['system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 12px 2px rgba(201,168,76,0.25)',
        'card':      '0 2px 8px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
```

**Important:** Tailwind v3 does NOT support `bg-gold/80` opacity modifier syntax for custom colors defined as hex strings — only for colors defined as RGB tuples or CSS variables. The UI-SPEC uses `bg-crimson/80` for condition badges. To support this, define crimson colors as RGB tuples in the config, or use inline `style` attributes for opacity variants. The color `'rgba(139,32,32,0.20)'` is already defined as `crimson.muted` for the pre-set opacity variant.

### Pattern 3: Google Fonts Integration

**What:** Load Cinzel via CDN `<link>` tags in `index.html`. No npm package or Vite plugin needed.

**When to use:** Display font used only for headings — CDN is acceptable since the app is a desktop Tauri app (network available when needed, font cached after first load).

**Example:**
```html
<!-- index.html <head> section -->
<!-- Source: 01-UI-SPEC.md Registry Safety section -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap" rel="stylesheet">
```

### Pattern 4: Vue 3 Sidebar Layout Wrapping RouterView

**What:** Replace bare `<RouterView v-else />` in `App.vue` with `<AppLayout>` that renders sidebar + RouterView. The splash condition remains unchanged.

**When to use:** Adding persistent shell UI around route content.

**Example:**
```vue
<!-- src/App.vue — after change -->
<template>
  <SplashScreen v-if="showSplash" ... />
  <AppLayout v-else />
</template>

<!-- src/components/AppLayout.vue -->
<template>
  <div class="flex h-screen bg-charcoal-800 overflow-hidden">
    <AppSidebar />
    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>
```

This preserves the splash-before-router pattern exactly. `AppLayout` is only rendered after `showSplash` becomes false.

### Pattern 5: Vue Router Active Class on RouterLink

**What:** Vue Router 4 applies `router-link-active` to any RouterLink whose target route matches the current path (prefix match) and `router-link-exact-active` for exact matches. Both classes can be targeted with CSS.

**When to use:** Sidebar nav items need gold active styling.

**Example:**
```vue
<!-- src/components/AppSidebar.vue -->
<RouterLink
  to="/combat"
  class="flex items-center gap-3 h-10 px-4 text-sm text-stone-300 hover:bg-charcoal-700 hover:text-stone-100"
  active-class="border-l-2 border-gold text-gold bg-charcoal-700"
>
  Combat Tracker
</RouterLink>
```

Using `active-class` prop on each RouterLink is cleaner than global config for this case because each nav item needs the full set of active classes (border + text + bg).

### Pattern 6: Condition Values — Type and Store Extension

**What:** Add `conditionValues` to `Creature` type as a separate field from `conditionDurations`. Values are PF2e condition severity (stunned 2, frightened 3). Durations are auto-decrement timers (existing system, unchanged).

**When to use:** Badge needs to display the numeric severity value.

**Example:**
```typescript
// src/types/combat.ts — additive change only
export interface Creature {
  // ... existing fields unchanged ...
  conditionDurations?: Record<Condition, number>   // existing — auto-decrement timer
  conditionValues?: Partial<Record<Condition, number>>  // NEW — PF2e severity value shown on badge
}
```

```typescript
// src/composables/useConditions.ts — add hasValue flag
export const CONDITIONS_WITH_VALUES = new Set<Condition>([
  'stunned', 'slowed', 'frightened', 'dying'
])

export function conditionHasValue(condition: Condition): boolean {
  return CONDITIONS_WITH_VALUES.has(condition)
}
```

```typescript
// src/stores/combat.ts — two new actions
function setConditionValue(id: string, condition: Condition, value: number): void {
  const creature = creatures.value.find(c => c.id === id)
  if (!creature) return
  if (value <= 0) {
    // Remove condition when value reaches 0
    const index = creature.conditions.indexOf(condition)
    if (index > -1) creature.conditions.splice(index, 1)
    delete creature.conditionValues?.[condition]
  } else {
    if (!creature.conditionValues) creature.conditionValues = {}
    creature.conditionValues[condition] = value
    // Ensure condition is active
    if (!creature.conditions.includes(condition)) {
      creature.conditions.push(condition)
    }
  }
}

function getConditionValue(id: string, condition: Condition): number {
  const creature = creatures.value.find(c => c.id === id)
  return creature?.conditionValues?.[condition] ?? 1
}
```

### Pattern 7: ConditionBadge Popover (click-outside)

**What:** The "Add condition" `+` button opens a picker popover. Clicking outside should close it. Vue 3 composable pattern with `onMounted`/`onUnmounted` for document click listener.

**When to use:** Lightweight popover with no external dependency.

**Example:**
```typescript
// Inside ConditionBadge.vue or a composable
const showPicker = ref(false)
const pickerRef = ref<HTMLElement | null>(null)

function handleClickOutside(event: MouseEvent) {
  if (pickerRef.value && !pickerRef.value.contains(event.target as Node)) {
    showPicker.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
```

### Anti-Patterns to Avoid

- **Replacing string permissions with scope object only:** The `http:allow-fetch`, `http:allow-fetch-send` etc. string entries must remain — they enable the Tauri commands. The scope object replaces only the `"http:default"` string entry (they are distinct).
- **Using Tailwind opacity modifiers on hex custom colors:** `bg-crimson/80` does NOT work with hex-defined colors in Tailwind v3. Use the pre-defined `crimson.muted` token or `style="opacity: 0.8"` for opacity variants.
- **Tailwind v4 `@theme` directive:** This project uses Tailwind v3.4 (confirmed from `node_modules`). The v4 `@theme` CSS directive is not available — use `tailwind.config.js` `theme.extend` only.
- **Dynamic Tailwind classes with template literals:** Tailwind's JIT scanner cannot detect dynamically constructed classes like `` `bg-${color}-600` `` (current pattern in `ConditionToggle.vue` and `AddCreatureForm.vue`). The new badge system must use static class strings or a `computed` that returns complete class strings from a lookup map.
- **Collapsing `conditionValues` into `conditionDurations`:** These are different concepts. `conditionDurations` drives auto-decrement on round advance. `conditionValues` drives the displayed badge number. A condition can have both (e.g., slowed 2 that also auto-decrements) or just one.
- **Removing DashboardView without updating router:** The dashboard currently hosts both the CombatTracker link and SyncButton. With sidebar nav taking over navigation, the `/` route behavior needs a decision: redirect to `/combat`, or retire the dashboard entirely. The router must be updated to avoid a blank landing.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Active nav state styling | Custom router event listener | `RouterLink` `active-class` prop | Vue Router already tracks matched routes; custom listener is redundant |
| Click-outside popover | Complex event delegation | `document.addEventListener('mousedown', ...)` composable | 5-line pattern, no library needed |
| Font loading | Vite font plugin, self-hosting | Google Fonts CDN `<link>` in `index.html` | Desktop app has reliable network; CDN cached after first load |
| Condition color mapping | Dynamic class construction | Static lookup object `{ stunned: 'bg-crimson/80 text-stone-100', ... }` | JIT scanner requires static strings; lookup is simpler and type-safe |

**Key insight:** This phase is all mechanical — the design system and component contracts are fully specified in `01-UI-SPEC.md`. No architectural decisions remain open; the work is implementing what's specified.

---

## Common Pitfalls

### Pitfall 1: Tailwind JIT Dynamic Class Scanning Failure

**What goes wrong:** Condition badge colors silently fall back to no styling or wrong color.
**Why it happens:** Current `ConditionToggle.vue` uses `` `bg-${condition.color}-600` `` and `AddCreatureForm.vue` uses the same pattern. These template literals are invisible to Tailwind's content scanner at build time — classes are never generated.
**How to avoid:** Define a static lookup map:
```typescript
const CONDITION_BADGE_CLASSES: Record<Condition, string> = {
  stunned: 'bg-crimson text-stone-100',
  paralyzed: 'bg-crimson text-stone-100',
  // ...
}
```
Use `CONDITION_BADGE_CLASSES[condition.name]` in templates.
**Warning signs:** Condition badges render with no background color, or correct in dev (Vite serves all classes) but broken in Tauri build.

### Pitfall 2: HTTP Scope — Wrong Object Placement

**What goes wrong:** Sync still fails with a permissions error after the fix.
**Why it happens:** Adding `http:scope` as a separate top-level entry rather than replacing the `"http:default"` string with the object form. Or adding it correctly but also keeping the plain string `"http:default"` which may conflict.
**How to avoid:** Replace the `"http:default"` string with the full object `{ "identifier": "http:default", "allow": [{ "url": "https://**" }] }`. Keep all `http:allow-fetch*` strings unchanged.
**Warning signs:** Error in Tauri console: `scope not defined` or `URL not in allowlist`; sync still fails with a network-layer error rather than a Rust-layer error.

### Pitfall 3: `overflow-hidden` on App Shell Breaks Scroll

**What goes wrong:** The creature list is not scrollable; content is clipped.
**Why it happens:** `AppLayout` uses `h-screen overflow-hidden` on the outer flex container. The inner `<main>` must have `overflow-y-auto` and the `CombatTracker` must not have its own `min-h-screen` wrapper.
**How to avoid:** The UI-SPEC specifies `<main class="flex-1 overflow-y-auto">`. `CombatTracker` must be refactored to remove its current `min-h-screen` outer div (it now fills `RouterView` which fills `main`).
**Warning signs:** Long creature lists are clipped at the viewport bottom with no scrollbar.

### Pitfall 4: Dashboard Route Becomes a Dead End

**What goes wrong:** App launches to `/` (DashboardView) which is no longer a meaningful route in the sidebar layout.
**Why it happens:** The router still has `path: '/'` pointing to `DashboardView`. DashboardView contains a grid with a "Combat Tracker" tile and `SyncButton` — both of which are now replaced by sidebar nav + `/sync` route.
**How to avoid:** Either (a) redirect `/` to `/combat` in the router, or (b) replace `DashboardView` with a minimal redirect component. The sidebar makes the dashboard redundant.
**Warning signs:** App launches to an empty or legacy-styled page.

### Pitfall 5: Condition Values Not Persisted Across Store Mutations

**What goes wrong:** Setting a condition value (stunned 2) is lost after any round advance.
**Why it happens:** `advanceRound()` and `decrementDurationsForCreature()` in the combat store manipulate `conditionDurations` and `creature.conditions` but have no awareness of `conditionValues`. A condition removed by duration countdown should also clear its value.
**How to avoid:** When `decrementDurationsForCreature` removes a condition (duration hits 0), also `delete creature.conditionValues?.[conditionName]`. When `toggleConditionWithOptions` removes a condition, also clear its value.
**Warning signs:** After a round ends, badges disappear visually but `conditionValues` still has stale data (not an immediate visible bug but causes state drift).

### Pitfall 6: `regenerationDisabled` Prop Missing from CreatureCard

**What goes wrong:** `TypeError: Cannot read properties of undefined` when mounting the redesigned `CreatureCard`.
**Why it happens:** Current `CreatureCard.vue` has `regenerationDisabled` as a required prop (`defineProps<{ ..., regenerationDisabled: boolean }>`). The redesign keeps this prop. `CombatTracker` passes it via `getRegenerationDisabled(creature.id)`. If the prop is accidentally dropped during redesign, the component fails.
**How to avoid:** Preserve all existing prop names and emit names during the redesign — only change the template and visual logic, not the component interface.
**Warning signs:** TypeScript error in CombatTracker about missing prop, or runtime error during mount.

---

## Code Examples

### Current capability file (before fix)
```json
// src-tauri/capabilities/default.json — CURRENT (broken for fetch scope)
"permissions": [
  "http:default",        // ← string form — enables commands but no URL scope
  "http:allow-fetch",
  ...
]
```

### Fixed capability file
```json
// src-tauri/capabilities/default.json — AFTER FIX
"permissions": [
  {
    "identifier": "http:default",
    "allow": [{ "url": "https://**" }]
  },                    // ← object form — enables commands AND enforces URL scope
  "http:allow-fetch",
  "http:allow-fetch-cancel",
  "http:allow-fetch-read-body",
  "http:allow-fetch-send",
  ...
]
```

### HP Controller with amount input (new behavior)
```typescript
// HPController.vue — new reactive state for amount
const amount = ref(1)

const handleDamage = () => emit('modifyHp', -amount.value)
const handleHeal = () => emit('modifyHp', amount.value)

// amount.value is NOT reset on click — persists until user changes it
```

### Static condition class map (avoids JIT failure)
```typescript
// src/composables/useConditions.ts — add to existing file
export const CONDITION_BADGE_CLASSES: Record<Condition, string> = {
  stunned:       'bg-crimson text-stone-100',
  paralyzed:     'bg-crimson text-stone-100',
  restrained:    'bg-crimson/70 text-stone-100',
  incapacitated: 'bg-crimson text-stone-100',
  unconscious:   'bg-charcoal-500 border border-crimson text-stone-300',
  grabbed:       'bg-crimson/60 text-stone-100',
  grappled:      'bg-amber-800 text-stone-100',
  slowed:        'bg-amber-700 text-stone-100',
  prone:         'bg-stone-600 text-stone-200',
  'flat-footed': 'bg-stone-700 text-stone-300',
  invisible:     'bg-indigo-900 border border-indigo-500 text-indigo-200',
}
```

Note: Tailwind v3 opacity modifier syntax (`bg-crimson/70`) on custom hex colors requires the color to be defined as an RGB channel tuple, not a hex string. Either switch to RGB tuple definitions for crimson in the config, or use the pre-defined `crimson.muted` / `crimson.dark` variants from the UI-SPEC token set. Best approach: define the full static class string for each condition (no opacity shortcuts) to avoid this entirely.

### SyncView route addition
```typescript
// src/router/index.ts
import SyncView from '@/views/SyncView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/combat' },       // redirect dashboard to combat
    { path: '/combat', name: 'combat', component: CombatView },
    { path: '/sync', name: 'sync', component: SyncView },
  ],
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tauri v1 `allowlist.http.scope` array in `tauri.conf.json` | Tauri v2 `capabilities/*.json` permission objects with `allow` array | Tauri 2.0 stable (Oct 2024) | Config file location and format completely changed |
| Tailwind v4 `@theme` CSS directive | Tailwind v3 `tailwind.config.js` `theme.extend` | v4 released 2025 | Project uses v3.4.19 — do NOT use v4 syntax |
| All conditions shown as toggles (always visible) | Only active conditions shown as badges | This phase | Reduces visual noise; empty condition state is clean |

**Deprecated/outdated:**
- `ConditionToggle.vue`: The existing pattern of showing all 11 conditions as toggle buttons simultaneously is being replaced by showing only active conditions as badges with an "Add condition" picker.
- `SyncButton.vue` as a dashboard tile: Being promoted to a full-page `SyncView.vue` at `/sync`. The old component can be kept or deleted; it should no longer be used in `DashboardView`.
- `DashboardView.vue`: The dashboard-as-landing-page pattern is replaced by direct navigation via sidebar. The view becomes a redirect or is removed.

---

## Open Questions

1. **Tailwind v3 opacity modifier on custom hex colors (`bg-crimson/80`)**
   - What we know: Tailwind v3 supports `/opacity` modifiers only for colors defined as RGB channel tuples (e.g., `[139, 32, 32]`) or CSS variables with `rgb()` format, not plain hex strings.
   - What's unclear: The UI-SPEC uses `bg-crimson/80` and similar — these will silently produce no background in a pure hex config.
   - Recommendation: Define crimson and gold colors as RGB tuples in `tailwind.config.js` to enable opacity modifiers. Alternatively, pre-define all required opacity variants as named tokens (e.g., `crimson.opacity70: 'rgba(139,32,32,0.7)'`). The UI-SPEC already provides a few pre-computed rgba values (`crimson.muted`, `gold.glow`). The planner should decide: either expand the named rgba variants to cover all needed opacities, or switch to RGB tuple color definitions.

2. **Dashboard route fate**
   - What we know: DashboardView currently renders at `/` and contains a SyncButton tile and a link to `/combat`. With the sidebar nav, both are redundant.
   - What's unclear: Should the `/` route redirect to `/combat`, show a future "home" page, or be removed?
   - Recommendation: Redirect `/` to `/combat` for this phase. The redirect is a single line in `router/index.ts` and is easily changed when a future home page is built.

3. **`frightened` condition missing from `Condition` type**
   - What we know: `useConditions.ts` `CONDITIONS_WITH_VALUES` example included `frightened`, but `src/types/combat.ts` does not define `frightened` in the `Condition` union type. The current 11 conditions are: stunned, paralyzed, grappled, restrained, prone, flat-footed, invisible, unconscious, grabbed, slowed, incapacitated.
   - What's unclear: Is `frightened` intentionally absent from v1.0 (a PF2e condition that would be valuable to track)?
   - Recommendation: Leave the `Condition` union unchanged for this phase. The `conditionValues` feature can work with the existing 11 conditions. `frightened` is a future addition. The value-bearing conditions in the existing set are: stunned, slowed (both auto-decrement via `conditionDurations` and can also carry a PF2e severity value).

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 |
| Config file | `vitest.config.ts` (inline in Vite config via `test:` key) |
| Quick run command | `pnpm test` (runs `vitest run`) |
| Full suite command | `pnpm test` |
| Test directory | `src/**/__tests__/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HTTP-01 | HTTP scope fix unblocks fetch to api.github.com | manual smoke | `pnpm tauri:dev` + Sync Now | N/A (runtime) |
| UI-01 | AppLayout renders sidebar + RouterView | unit | `vitest run src/components/__tests__/AppLayout.test.ts` | ❌ Wave 0 |
| UI-02 | AppSidebar renders nav items with correct routes | unit | `vitest run src/components/__tests__/AppSidebar.test.ts` | ❌ Wave 0 |
| UI-03 | CreatureCard renders initiative badge, HP bar, name | unit | `vitest run src/components/__tests__/CreatureCard.test.ts` | ✅ (needs update) |
| UI-04 | HPController amount input changes delta on +/- click | unit | `vitest run src/components/__tests__/HPController.test.ts` | ✅ (needs update) |
| UI-05 | ConditionBadge shows active conditions; toggle removes them | unit | `vitest run src/components/__tests__/ConditionBadge.test.ts` | ❌ Wave 0 |
| UI-06 | ConditionBadge shows value inside badge for value-conditions | unit | `vitest run src/components/__tests__/ConditionBadge.test.ts` | ❌ Wave 0 |
| UI-07 | SyncView renders stage pipeline, progress bar, sync button | unit | `vitest run src/views/__tests__/SyncView.test.ts` | ❌ Wave 0 |
| STORE-01 | setConditionValue adds condition + value; value 0 removes | unit | `vitest run src/stores/__tests__/combat.test.ts` | ✅ (needs new tests) |

**Note on existing tests:** `HPController.test.ts` asserts that `-` emits `modifyHp` with delta `-1` (line 36). After the amount input is added, clicking `-` when amount input = 1 should still emit `-1`, so this test continues to pass. However tests that hardcode `[-1]` will break if the default amount is ever changed, so new tests must also cover `amount=5` → emits `[-5]`.

`CreatureCard.test.ts` asserts `wrapper.classes()` contains `border-blue-500` (line 93). After the redesign, the active-turn border becomes `border-gold`. This test WILL fail and must be updated.

`ConditionToggle.test.ts` asserts `bg-purple-600` on active (line 19) and `bg-gray-200` on inactive (line 28). `ConditionToggle.vue` is being replaced by `ConditionBadge.vue`; the old tests become dead code but won't error unless the file is deleted.

### Sampling Rate
- **Per task commit:** `pnpm test` (full suite, ~2s for unit tests)
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/__tests__/AppLayout.test.ts` — covers UI-01 (sidebar + router-view render)
- [ ] `src/components/__tests__/AppSidebar.test.ts` — covers UI-02 (nav items, active class)
- [ ] `src/components/__tests__/ConditionBadge.test.ts` — covers UI-05, UI-06 (badge render, toggle, values)
- [ ] `src/views/__tests__/SyncView.test.ts` — covers UI-07 (page structure, sync button)
- [ ] Update `src/components/__tests__/CreatureCard.test.ts` — replace `border-blue-500` assertion with `border-gold`
- [ ] Update `src/components/__tests__/HPController.test.ts` — add tests for amount input changing delta

---

## Sources

### Primary (HIGH confidence)
- `src/types/combat.ts` — Current `Creature` type; `conditionValues` gap confirmed by inspection
- `src/stores/combat.ts` — Store structure; `conditionDurations` vs value gap confirmed
- `src/composables/useConditions.ts` — `CONDITION_DEFS` structure; dynamic class anti-pattern confirmed
- `src/components/HPController.vue` — Current hardcoded `delta: -1 / +1`; amount input gap confirmed
- `src/components/ConditionToggle.vue` — Current toggle pattern; being replaced confirmed
- `src-tauri/capabilities/default.json` — Missing scope object confirmed
- `package.json` — Tailwind 3.4.19 confirmed; no new dependencies needed confirmed
- `.planning/phases/01-bug-fix-and-ui-improvements/01-UI-SPEC.md` — Complete component contracts, color tokens, spacing scale

### Secondary (MEDIUM confidence)
- [Tauri HTTP Client docs](https://v2.tauri.app/plugin/http-client/) — Scope permission object format; `allow` array with `url` field
- [GitHub Issue #1468 — tauri-apps/plugins-workspace](https://github.com/tauri-apps/plugins-workspace/issues/1468) — Confirms `https://**` is the correct glob pattern; fix was a plugin update not a config change
- [Vue Router RouterLink props](https://router.vuejs.org/api/interfaces/RouterLinkProps.html) — `active-class` prop behavior confirmed

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- HTTP scope fix: HIGH — format confirmed by official docs + GitHub issue with same exact use case
- Tailwind config extension: HIGH — project is on v3.4; `theme.extend` pattern is stable and well-documented; opacity modifier caveat is a known v3 limitation
- Component architecture: HIGH — all components read directly; no unknowns in structure
- Condition values type gap: HIGH — `conditionValues` field is absent from `Creature`; store has no getter/setter — confirmed by direct inspection
- Test impact: HIGH — existing tests with class name assertions will break on redesign; mapped precisely above

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable stack; Tailwind v3 and Vue Router 4 are not moving fast)
