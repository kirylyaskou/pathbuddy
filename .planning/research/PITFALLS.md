# Domain Pitfalls

**Domain:** PF2e DM Assistant — v0.3.0 Frontend Rebuild + Engine Integration
**Researched:** 2026-03-31
**Confidence:** HIGH (codebase-derived from direct inspection of D:\parse_data prototype and D:\pathbuddy\engine); HIGH (official docs for Vite, shadcn/ui, Tauri 2, FSD); MEDIUM (Zustand + FSD integration from official FSD blog + WebSearch multi-source)

---

## Critical Pitfalls

Mistakes that cause rewrites or block progress entirely.

---

### Pitfall 1: `next/link` and `usePathname`/`useRouter` Left in Components After Migration

**What goes wrong:**
The prototype has `next/link` and `usePathname` from `next/navigation` used throughout `app-sidebar.tsx`, every page component, and any component that performs navigation or checks the current route. When the code is ported to Vite + React Router, these imports compile but fail silently at runtime — `usePathname()` returns `undefined`, `Link` from `next/link` navigates with a full page reload instead of client-side routing. The sidebar's active-state highlighting breaks (the `pathname === item.href` check returns `undefined === '/encounters'`), making it appear no route is ever active.

**Why it happens:**
The prototype files contain `"use client"` directives (required for Next.js App Router) and Next.js-specific imports. These directives are harmless in Vite but the import paths are not. IDEs do not flag missing modules during copy-paste if `next` is still in `package.json` or if TypeScript's `paths` config has a fallback.

**Consequences:**
Navigation silently fails. Active route detection broken. Any component calling `useRouter().push()` throws at runtime. The `<Link href="...">` → `<Link to="...">` prop rename is also a silent bug — `href` on a React Router `Link` is treated as a DOM attribute and does not trigger client-side routing.

**Prevention:**
Before porting any file, do a codebase-wide search for `next/navigation`, `next/link`, `next/image`, and `"use client"`. Establish replacements upfront:

| Next.js | Vite + React Router replacement |
|---------|--------------------------------|
| `import Link from 'next/link'` | `import { Link } from 'react-router-dom'` |
| `<Link href="/path">` | `<Link to="/path">` |
| `usePathname()` | `useLocation().pathname` |
| `useRouter().push('/path')` | `useNavigate()('/path')` |
| `useSearchParams()` | `useSearchParams()` from `react-router-dom` |
| `import Image from 'next/image'` | `<img>` tag with Vite asset import |
| `"use client"` | Delete — all Vite components are client-only |

**Warning signs:**
- Sidebar active-link highlight always shows the same item regardless of route
- Navigation links cause full page reloads (visible as network waterfall)
- `usePathname()` returning `undefined` in console logs
- TypeScript not flagging `next/navigation` import (Next.js still in node_modules)

**Phase to address:** Phase 1 (Vite scaffold and routing setup). Must be done before porting any page component.

**Severity:** BLOCKS PROGRESS — navigation is the skeleton of the app.

---

### Pitfall 2: Tailwind CSS v4 `@theme` Mismatch — CSS Variables Not Accessible in Components

**What goes wrong:**
The prototype uses Tailwind CSS v4 with a CSS-first configuration (`@import 'tailwindcss'`, no `tailwind.config.js`) and an extensive OKLCH color palette in `:root` and `.dark` blocks. The custom PF2e colors (`--pf-gold`, `--pf-threat-extreme`, `--pf-rarity-rare`, `--sidebar`, `--sidebar-foreground`, etc.) are used throughout component classes (e.g., `bg-pf-threat-extreme/10`, `text-sidebar-foreground`). When these variables are defined in `:root` without being re-declared inside a `@theme` block, Tailwind v4 does NOT automatically generate utility classes for them. All classes using these variables silently produce no styles — no error, just invisible or un-styled elements.

**Why it happens:**
In Tailwind v4, custom colors require declaration inside `@theme` or `@theme inline` to generate utility classes. Simply defining `:root { --pf-gold: oklch(...) }` in the CSS file is sufficient for CSS variable inheritance in plain CSS but insufficient for Tailwind utility generation. The prototype works because it was developed end-to-end in a single Next.js environment. When porting to a fresh Vite + shadcn/ui setup, the `globals.css` structure must be recreated correctly for the new Tailwind v4 build pipeline.

**Consequences:**
All PF2e-specific classes (`bg-pf-gold`, `text-pf-blood`, `bg-sidebar`, threat/rarity badge colors) produce no output. The entire dark fantasy UI loses its styling. Components look like unstyled HTML.

**Prevention:**
Re-declare all custom variables inside `@theme inline` in the Vite globals.css, mapping them to the `:root` definitions:

```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --pf-gold: oklch(0.75 0.18 75);
  /* ... all custom vars ... */
}

@theme inline {
  --color-pf-gold: var(--pf-gold);
  --color-pf-threat-extreme: var(--pf-threat-extreme);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  /* ... map every custom color used in component classes ... */
}
```

Audit every CSS class in the prototype that uses a custom color token before porting. The `@tailwindcss/upgrade` codemod exists but is reported unreliable for complex themes — do the mapping manually.

**Warning signs:**
- PF2e badge classes present in HTML but no background color applied
- DevTools shows `bg-pf-threat-extreme` class applied but no matching CSS rule
- Sidebar background identical to page background (sidebar vars not resolving)
- `tw-animate-css` import present but animations not working

**Phase to address:** Phase 1 (Vite scaffold). Must be resolved before any component renders correctly.

**Severity:** BLOCKS PROGRESS — the entire UI is invisible without this.

---

### Pitfall 3: Drizzle Migrator Fails in WebView — DB Not Initialized Before React Renders

**What goes wrong:**
The previous milestones (v1.0-v2.1) had a working SQLite + Drizzle ORM setup via `sqlite-proxy`. When reconnecting it, the Drizzle built-in `migrate()` function calls `readMigrationFiles()` internally, which uses Node.js `fs` module at runtime. The WebView has no `fs` module. This causes a runtime error during app startup, before any SQL queries run. If this is not handled, React renders with no database connection, every `invoke()` call to `run_sql` returns an error, and the app appears to load but all data is empty with silent failures.

**Why it happens:**
Drizzle's migration system was designed for Node.js server environments. The `sqlite-proxy` driver works correctly for query execution, but the migration runner does not. This is a known limitation documented in the Tauri + Drizzle community.

**Consequences:**
App starts but all SQLite queries fail. The migration system never runs, so the schema may be wrong. If the app previously had data (from v1.x) and the schema changed, queries fail with column-not-found errors.

**Prevention:**
Use the `import.meta.glob` pattern to inline migration SQL files at Vite build time, bypassing the `fs` dependency:

```typescript
// src/db/migrate.ts
const migrations = import.meta.glob('../drizzle/*.sql', {
  eager: true,
  query: '?raw',
  import: 'default'
})

export async function runMigrations(db: DrizzleProxyDB) {
  for (const [path, sql] of Object.entries(migrations)) {
    await invoke('run_sql', { query: sql as string, params: [] })
  }
}
```

Apply the `splash-before-router` pattern from project memory: in `main.tsx`, `await runMigrations()` before calling `ReactDOM.createRoot(...).render(...)`. The React tree never mounts until migrations succeed. If migrations fail, show an error screen — never render the app over a broken schema.

**Warning signs:**
- `Error: ENOENT: no such file or directory, open '...'` in console at startup
- All `useQuery` / `useStore` hooks returning empty arrays immediately
- SQLite plugin loaded but `window.__TAURI__` commands returning migration errors
- Components rendering with zero entities from the database

**Phase to address:** Phase 3 (SQLite reconnection). Must be resolved before any page that queries data.

**Severity:** BLOCKS PROGRESS — no database, no real data.

---

### Pitfall 4: Engine Types Imported as Runtime Values — Tree-Shaker Cannot Eliminate Constants

**What goes wrong:**
The engine barrel export (`engine/index.ts`) exports both types and runtime values — constants like `CONDITION_SLUGS`, `ACTIONS`, `DAMAGE_TYPES`, `IMMUNITY_TYPES` (large arrays/objects) alongside type-only exports. When a component in the `shared/` or `entities/` FSD layer imports from `@engine`, bundling tools include the entire engine value tree even if only a type is needed. With 545 action entries, 44 condition slugs, and the full damage taxonomy, the engine constants are non-trivial in bundle size. More critically: if any engine module is inadvertently imported in a way that causes a top-level side effect (e.g., a module-level `ConditionManager` instantiation in a file that the engine imports transitively), that side effect runs before Tauri's IPC is initialized, causing it to fail silently.

**Why it happens:**
The engine is a pure TypeScript library with zero UI dependencies — correct by design. But the barrel export mixes type-only and value exports. TypeScript's `import type` is the safeguard, but developers habitually write `import { ConditionSlug }` instead of `import type { ConditionSlug }`, pulling the value module into the bundle unnecessarily.

**Consequences:**
Increased bundle size (minor — engine is pure TS, no external deps). More importantly: any engine module with top-level initialization that assumes browser/Node context will throw before Tauri is ready. The `ConditionManager` constructor is safe, but any future engine module that reads from a global (e.g., `window.crypto`) at module load time will fail.

**Prevention:**
Use `import type` for all engine type imports in UI components:

```typescript
// CORRECT: type-only import, tree-shaken
import type { ConditionSlug, ActionType } from '@engine'

// WRONG: pulls entire engine module into component bundle
import { ConditionSlug } from '@engine'
```

In `vite.config.ts`, configure the `@engine` path alias:

```typescript
resolve: {
  alias: {
    '@engine': resolve(__dirname, '../engine/index.ts')
  }
}
```

Establish a rule: components in `shared/ui/` import only `type` from engine. Runtime engine values (`CONDITION_SLUGS`, `ACTIONS`, `calculateXP`) are imported only in `entities/*/model/` or `features/*/model/` segments.

**Warning signs:**
- `import { ConditionSlug }` (without `type`) in a `.tsx` component file
- Bundle analysis shows `engine/` included in a component chunk
- Tauri commands failing on first render (timing issue from top-level engine init)

**Phase to address:** Phase 1 (Vite config) + Phase 2 (FSD structure). Establish the import discipline rule before writing any component that uses engine types.

**Severity:** CAUSES TECH DEBT — bundle bloat is minor but the timing risk on future engine additions is a latent blocker.

---

### Pitfall 5: FSD Same-Layer Imports Between Feature Slices — Circular Dependency

**What goes wrong:**
FSD prohibits same-layer imports between slices. In this project, there are natural temptations: the `combat-tracker` feature needs creatures from the `encounter-builder` feature's staged list; the `bestiary` feature wants to share filtering logic with the `encounter-builder` feature. If `features/combat-tracker/model/store.ts` imports from `features/encounter-builder/model/store.ts`, FSD's core invariant is violated. As the codebase grows, these same-layer imports form cycles: A imports B imports C imports A. TypeScript does not catch import cycles by default, and the app may appear to work until one of the circular modules is lazy-loaded, causing it to initialize with `undefined` dependencies.

**Why it happens:**
The prototype has all state co-located in a single page component with `useState`. Splitting it into FSD forces decisions about ownership. The `EncounterCreature` type and the staging list feel like they "belong" to both the encounter builder and the combat tracker. Developers resolve this by importing from a sibling feature rather than lifting the shared type to `entities/`.

**Consequences:**
Circular import cycles detected by Vite at build time (crashes build) or at runtime (module evaluated in wrong order, undefined values). FSD architectural invariant broken — any feature can now depend on any other, defeating the purpose of the architecture.

**Prevention:**
The rule is strict: shared data types and business entities belong in `entities/`, not `features/`. Apply it:

- `EncounterCreature` type → `entities/creature/model/types.ts`
- `CombatCreature` type → `entities/creature/model/types.ts`
- Shared XP calculation results → `entities/encounter/model/types.ts`
- `combat-tracker` feature imports creature types from `entities/creature`
- `encounter-builder` feature imports creature types from `entities/creature`
- Neither feature imports from the other

The "send to combat" operation is a **cross-feature interaction** that belongs in the page layer (`pages/combat/`) or a dedicated widget (`widgets/encounter-launcher/`), not in either feature store.

Use the `eslint-plugin-import` with FSD rules (or `eslint-plugin-boundaries`) to enforce layer imports at CI level:

```json
// .eslintrc.json — enforce FSD import direction
{
  "rules": {
    "boundaries/element-types": ["error", {
      "default": "disallow",
      "rules": [
        { "from": "features", "allow": ["entities", "shared"] },
        { "from": "entities", "allow": ["shared"] },
        { "from": "shared", "allow": [] }
      ]
    }]
  }
}
```

**Warning signs:**
- `features/X/model/` importing from `features/Y/model/`
- `EncounterCreature` type defined in a `features/` directory
- `useCombatStore` imported inside `features/encounter-builder/`
- Vite HMR error: "Circular dependency detected"

**Phase to address:** Phase 2 (FSD structure setup). The entity layer must be established before any feature stores are written.

**Severity:** BLOCKS PROGRESS — circular deps crash the Vite build.

---

### Pitfall 6: Zustand Store Selector Returning New Object on Every Call — Perpetual Re-renders

**What goes wrong:**
The most common Zustand performance mistake: a selector that returns a new object reference on every call causes the subscribing component to re-render on every store update, regardless of whether the selected data changed. In this project, the combat tracker is a real-time view that updates on every initiative advance, HP change, and condition mutation. If the `CreatureRow` component's selector returns `{ creature, conditions, isActive }` as a new object literal, every single store write (any creature's HP, anywhere) causes every `CreatureRow` to re-render — for an encounter with 8 creatures, that is 8x the intended render work.

**Why it happens:**
Developers write `useStore(state => ({ creature: state.creatures[id], isActive: state.activeId === id }))` which looks correct but creates a new object on every call. Zustand uses `===` reference equality by default, so the new object is always "different", triggering re-render.

**Consequences:**
With 8 creatures in combat, every HP change causes 8 re-renders instead of 1. Not noticeable in development with a few mock creatures but becomes visible with real data — especially with the FTS5 bestiary browser open alongside, which triggers frequent state updates.

**Prevention:**
Use `useShallow` from `zustand/react/shallow` for any selector that returns an object or array:

```typescript
import { useShallow } from 'zustand/react/shallow'

// CORRECT: shallow comparison — only re-renders if creature or isActive actually changed
const { creature, isActive } = useCombatStore(
  useShallow(state => ({
    creature: state.creatures.find(c => c.id === id),
    isActive: state.activeId === id,
  }))
)

// WRONG: new object reference on every call
const { creature, isActive } = useCombatStore(state => ({
  creature: state.creatures.find(c => c.id === id),
  isActive: state.activeId === id,
}))
```

For primitive values, no wrapper is needed (primitive equality is `===` safe):

```typescript
// CORRECT: primitive selector, no useShallow needed
const hp = useCombatStore(state => state.creatures.find(c => c.id === id)?.hp ?? 0)
```

Split components so each subscribes to its own minimal slice of state. A `CreatureRow` should select only the fields it renders, not the entire creature object.

**Warning signs:**
- React DevTools Profiler showing all `CreatureRow` components re-rendering on every HP change
- Selector returning `{ a, b, c }` object literal without `useShallow`
- `console.log('render')` in `CreatureRow` firing 8+ times per HP click

**Phase to address:** Phase 2 (Zustand store setup) — establish the `useShallow` pattern in the first store selector. Phase 4 (combat tracker) — enforce per-field selectors in `CreatureRow`.

**Severity:** CAUSES TECH DEBT — not immediately visible but compounds badly in real combat sessions.

---

### Pitfall 7: Zustand Store Placed at Wrong FSD Layer — Crossing Slice Boundaries

**What goes wrong:**
When adopting FSD and Zustand simultaneously, the question "where does the store live?" has a non-obvious answer. The common mistake is placing the combat tracker's Zustand store in `features/combat-tracker/model/store.ts` and the encounter builder's store in `features/encounter-builder/model/store.ts`, then discovering that both features need to read creature data from `entities/creature/` — but the creature *instances* (with HP, conditions, initiative) are only in the combat store. The encounter builder needs to read the combat creatures to check for duplicates. This creates pressure to import from a sibling feature (violating FSD) or to duplicate the creature list in both stores (creating dual source of truth).

**Why it happens:**
The distinction between "entity state" (what a creature IS: level, HP max, AC, traits from SQLite) and "feature state" (what a creature IS DOING in combat: current HP, conditions, initiative) is not made explicit during initial store design. Both feel like "creature data."

**Consequences:**
Either FSD violation (cross-feature store import) or dual source of truth (two creature lists that diverge). The combat tracker and encounter builder show inconsistent data. Removing a creature from the encounter builder doesn't remove it from the combat tracker.

**Prevention:**
Separate entity state from feature state clearly:

| Store | FSD Layer | What It Owns |
|-------|-----------|--------------|
| `entities/creature/model/creatureStore.ts` | `entities/` | SQLite-fetched creature data, search results, stat block cache |
| `features/combat-tracker/model/combatStore.ts` | `features/` | Active combat: HP, initiative, conditions (derives creature base data from entity store) |
| `features/encounter-builder/model/encounterStore.ts` | `features/` | Staged creature list for XP calculation (references creature IDs, not full objects) |

The encounter builder stages `creatureId + quantity` references. It queries the entity store for display names and levels. It does NOT own the full creature objects. The combat store assembles a `CombatCreature` (entity data + runtime state) when the encounter is launched.

**Warning signs:**
- `features/encounter-builder/model/store.ts` containing `currentHp`, `initiative`, or `conditions` fields
- `features/combat-tracker/` importing from `features/encounter-builder/`
- "Send to combat" logic written inside either feature store

**Phase to address:** Phase 2 (FSD + Zustand store design). Architecture decision must be made before any store is written.

**Severity:** BLOCKS PROGRESS — wrong store ownership causes a rewrite of both stores once the problem surfaces.

---

## Moderate Pitfalls

Mistakes that cause rework but not rewrites.

---

### Pitfall 8: `@vercel/analytics` Left in the Ported Code

**What goes wrong:**
The prototype's `layout.tsx` imports and renders `<Analytics />` from `@vercel/analytics/next`. This package makes network requests to Vercel's analytics endpoint. In a Tauri desktop app, this is both non-functional (no Vercel deployment) and potentially flagged by Tauri's CSP. At a minimum, it adds unnecessary startup overhead. At worst, it violates the app's offline-first design — the analytics call may time out and block or delay app initialization if improperly handled.

**Prevention:**
Delete `@vercel/analytics` from `package.json` and remove the import from the root layout before porting. Search for any other analytics or telemetry that assumes a web deployment context.

**Warning signs:**
- `import { Analytics } from '@vercel/analytics/next'` in any ported file
- Network requests to `vitals.vercel-insights.com` visible in Tauri's network panel
- CSP violation errors in Tauri's webview console

**Phase to address:** Phase 1 (initial port). One-time cleanup during setup.

**Severity:** CAUSES TECH DEBT — silent failures in a desktop context, but not a blocker.

---

### Pitfall 9: Mock XP Functions in `lib/pf2e-data.ts` Shadow Engine Functions with Different Logic

**What goes wrong:**
The prototype's `lib/pf2e-data.ts` defines `calculateCreatureXP()` and `getThreatLevel()` — custom implementations that differ from the engine's `calculateCreatureXP()` and `calculateEncounterRating()`. The prototype's version uses a simple `levelDiff` table with hard caps at ±4. The engine's version uses the official PF2e XP chart with out-of-range handling. If components are ported and the mock functions are retained (even temporarily), the XP calculation in the ported app produces different results than the engine will once connected. A DM who used the prototype sees different XP values after the migration — eroding trust.

**Why it happens:**
The mock file is ported wholesale as a convenience. The functions have the same name and similar signatures, so there is no immediate type error.

**Consequences:**
XP calculations are wrong during the transition period. If the mock functions persist longer than intended, the engine is never connected for XP and the bug persists to production.

**Prevention:**
Delete `lib/pf2e-data.ts` entirely when porting — do not copy it to the Vite project. Replace immediately with engine imports:

```typescript
// CORRECT: engine-backed XP
import { calculateXP, generateEncounterBudgets } from '@engine'
```

If mock data is needed temporarily during Phase 1 (before SQLite is reconnected), use only the creature array from the prototype and import all calculation functions from the engine.

**Warning signs:**
- `calculateCreatureXP` imported from anywhere other than `@engine`
- `getThreatLevel` function defined locally in any feature or entity
- XP values in the encounter builder differing from what the engine produces in unit tests

**Phase to address:** Phase 1 (port setup) — delete the mock file. Phase 3 (engine integration) — verify all XP paths use engine functions.

**Severity:** CAUSES TECH DEBT — wrong calculations, erodes DM trust.

---

### Pitfall 10: Tauri IPC Command Name Mismatch Silently Returns `null`

**What goes wrong:**
Tauri rejects `invoke()` calls for commands that don't exist or have mismatched argument names — but the rejection is silent in the frontend: `invoke()` returns `null` or an empty result rather than throwing a catchable error, depending on whether the command has a Rust-side handler. When the SQLite layer is reconnected, commands like `invoke('plugin:sql|execute', { db: '...', query: '...', values: [] })` (the `tauri-plugin-sql` IPC signature) must match exactly — including the `|` separator and the `plugin:` prefix for plugin commands. Developers who reconstruct the IPC calls from memory use `invoke('sql:execute', ...)` or `invoke('execute', ...)`, which silently fail.

**Why it happens:**
The exact Tauri IPC command name format is not obvious. `tauri-plugin-sql` uses the `plugin:sql|method` naming convention, which differs from custom `#[tauri::command]` functions that use plain names. The previous working implementation was deleted in v0.2.2, so there is no living reference.

**Consequences:**
All database reads return empty results. SQLite appears connected (no initialization error) but all queries silently return nothing. The app renders with empty creature lists, no conditions load, and no sync works.

**Prevention:**
Verify exact IPC command signatures against the `tauri-plugin-sql` source before writing any `invoke()` calls:

- Plugin commands: `plugin:sql|load`, `plugin:sql|execute`, `plugin:sql|select`, `plugin:sql|close`
- Custom commands: `invoke('command_name', { argName: value })` where `argName` must exactly match the Rust function parameter name

Add `console.log` wrapping every `invoke()` call during initial SQLite reconnection. Log both the call and the result to verify the pipeline before removing debug output.

**Warning signs:**
- `invoke('sql:execute', ...)` or `invoke('execute', ...)` — incorrect command name format
- All SQLite queries returning empty arrays with no error in console
- `window.__TAURI_INTERNALS__` showing the plugin is loaded but commands never fire

**Phase to address:** Phase 3 (SQLite reconnection).

**Severity:** MODERATE — silent failure is harder to debug than an explicit error.

---

### Pitfall 11: Tailwind Ring Width Default Change Breaks shadcn/ui Focus Styles

**What goes wrong:**
Tailwind CSS v4 changed the default ring width from 3px (v3) to 1px (v4). All shadcn/ui interactive components (Button, Input, Select, Dialog trigger) use `ring` classes for focus-visible styles. After migrating to v4, focus rings are visually imperceptible — a 1px ring in the dark theme disappears entirely. This is not a build error, it is a silent UI regression that degrades accessibility.

**Why it happens:**
Tailwind v4 documented this change, but it is easy to miss during migration. shadcn/ui components copy-pasted from the prototype were generated against v3 defaults. The components render and function correctly; only the focus visual is broken.

**Prevention:**
In the project's global CSS, add a Tailwind v4 compatibility override after `@import "tailwindcss"`:

```css
@layer base {
  * {
    --tw-ring-offset-shadow: 0 0 #0000;
    --tw-ring-shadow: 0 0 #0000;
    --tw-shadow: 0 0 #0000;
  }
  /* Restore v3 ring-3 as default ring size */
  [data-radix-focus-guard] ~ * :focus-visible {
    @apply ring-3;
  }
}
```

Or explicitly use `ring-3` on all shadcn/ui component variants that use ring for focus. The `npx shadcn diff` command can identify which component files need updating.

**Warning signs:**
- Buttons and inputs have no visible focus ring when tabbed to
- `ring` class applied but focus ring is 1px (nearly invisible on dark background)
- Accessibility audit tool reporting insufficient focus indicator contrast

**Phase to address:** Phase 1 (Vite scaffold + shadcn setup).

**Severity:** CAUSES TECH DEBT — accessibility regression; not a visual priority until QA but worth fixing at setup.

---

### Pitfall 12: Engine `ConditionManager` Used Directly in React State — No Reactivity

**What goes wrong:**
The engine's `ConditionManager` class stores state in a private `Map<ConditionSlug, number>`. If stored directly in React state (`useState(new ConditionManager())`) or a Zustand store property, mutations via `.add()` and `.remove()` do not trigger React re-renders. The condition was mutated, but React sees the same object reference and skips re-rendering. This is the React analog of the Vue reactivity problem from PITFALLS.md v2.1 — the same root issue, different framework.

**Why it happens:**
React's `useState` setter triggers re-renders when called with a new reference. If the `ConditionManager` instance is mutated in-place and the same reference is returned, React batching skips the update. Developers expect `setState(existing => { existing.add(slug); return existing })` to work — it does not.

**Prevention:**
Never store `ConditionManager` instances in React state or Zustand store properties directly. Instead, store the output as a plain serializable object and re-run the engine after each mutation:

```typescript
// In Zustand combat store
interface CombatCreatureState {
  id: string
  conditions: Record<string, number>  // plain object, NOT ConditionManager
  // ...
}

// Engine instance is module-level (not in store) — stateless executor
const conditionManagers = new Map<string, ConditionManager>()

function getManager(id: string) {
  if (!conditionManagers.has(id)) conditionManagers.set(id, new ConditionManager())
  return conditionManagers.get(id)!
}

// Zustand action
addCondition: (creatureId, slug, value = 1) =>
  set(state => {
    const manager = getManager(creatureId)
    manager.add(slug, value)
    // Project to plain object — triggers React re-render via new reference
    const conditions = Object.fromEntries(
      (manager as any)['conditions'] as Map<string, number>
    )
    return {
      creatures: state.creatures.map(c =>
        c.id === creatureId ? { ...c, conditions } : c
      )
    }
  })
```

**Warning signs:**
- `useState(new ConditionManager())` in any component file
- Conditions added via engine but badge not appearing (no re-render)
- Zustand store's `creatures[id].conditions` being a `ConditionManager` instance

**Phase to address:** Phase 4 (combat tracker + engine integration).

**Severity:** CAUSES TECH DEBT — silent rendering bug in the most interactive part of the app.

---

## Minor Pitfalls

---

### Pitfall 13: FSD Over-Segmentation — Creating Empty `api/`, `lib/`, `config/` Folders Upfront

**What goes wrong:**
FSD defines segments (`ui/`, `model/`, `api/`, `lib/`, `config/`) as optional organizational units within a slice. Developers who read the FSD documentation upfront create all segments for every slice immediately. The result: 6 empty folders per feature, 8 features = 48 empty directories, most of which never get populated. This creates cognitive overhead ("do I put this helper in `lib/` or `api/`?") and makes the codebase look more complex than it is.

**Prevention:**
Start each slice with only `ui/` (for components) and `model/` (for store/types). Add `api/` only when the slice makes async calls. Add `lib/` only when there are 2+ helper functions that don't belong in model. The FSD docs explicitly warn against over-segmentation.

**Phase to address:** Phase 2 (FSD structure). Establish the minimal-segment rule upfront.

**Severity:** MINOR — cognitive overhead only.

---

### Pitfall 14: `next-themes` ThemeProvider Left in App — Duplicate Theme Systems

**What goes wrong:**
The prototype uses `next-themes` (`ThemeProvider` in `layout.tsx`) for dark mode. When porting to Vite, `next-themes` must be replaced. If the import is missed, `next-themes` ships without tree-shaking and its SSR-specific logic attempts to access `document` during initialization, sometimes causing hydration-like errors in the Tauri WebView. Additionally, shadcn/ui's own dark mode integration expects the `next-themes` pattern (`class` attribute on `<html>`) — which must be replicated in the Vite entry point.

**Prevention:**
Replace `next-themes` with either `next-themes` for non-Next.js (it works standalone) or a simple custom implementation:

```typescript
// src/app/providers/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'
// ... minimal implementation that sets 'dark' class on <html>
```

Since this is a desktop Tauri app that defaults to dark mode, a simple `document.documentElement.classList.add('dark')` in `main.tsx` may be sufficient for v0.3.0 scope.

**Warning signs:**
- `import { ThemeProvider } from 'next-themes'` in any ported file
- `"use client"` on the theme provider (Next.js artifact)
- `next-themes` in `package.json` of the Vite project

**Phase to address:** Phase 1 (initial port). One-time cleanup.

**Severity:** MINOR — functional but carries SSR-related dead code.

---

### Pitfall 15: SQLite `import.meta.glob` Migration Files Not Included in Tauri Bundle

**What goes wrong:**
When using `import.meta.glob` to inline migration SQL files, Vite includes them in the frontend bundle. However, if the `glob` pattern is relative to a path that Tauri's bundler does not include (e.g., outside the `src/` directory), the files are not packaged in the final `.msi` / `.exe` installer. The app works in `tauri dev` (where the file system is the project directory) but fails after installation (where only bundled assets exist).

**Prevention:**
Keep migration SQL files inside `src/db/migrations/` (within the Vite source tree). Use a relative glob from that location:

```typescript
const migrations = import.meta.glob('./migrations/*.sql', { eager: true, query: '?raw', import: 'default' })
```

Verify that the SQL files appear in the Vite build output (`dist/`) before testing in a Tauri production build.

**Warning signs:**
- Migration works in `tauri dev` but fails after `tauri build`
- SQL files in `drizzle/` (outside `src/`) referenced by `import.meta.glob`
- Migration table missing after fresh install

**Phase to address:** Phase 3 (SQLite reconnection). Verify before building a release.

**Severity:** MINOR in dev, BLOCKS PROGRESS in production build.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Vite scaffold | `next/link`, `usePathname` in ported components | Audit all Next.js imports before porting any component |
| Phase 1: Tailwind config | Custom OKLCH variables not generating utility classes | Declare all custom tokens in `@theme inline` |
| Phase 1: shadcn setup | `next-themes`, `@vercel/analytics` artifacts | Delete both before first Vite render |
| Phase 1: shadcn ring width | Focus rings invisible after v4 migration | Add `ring-3` baseline or v4 compat override |
| Phase 2: FSD layers | Cross-feature imports for shared creature types | Define entity types in `entities/creature/` before any feature store |
| Phase 2: FSD store design | Combat creature state mixed with encounter builder state | Separate entity state vs. feature runtime state explicitly |
| Phase 2: Zustand selectors | Object selectors without `useShallow` | Establish `useShallow` rule in first selector written |
| Phase 3: SQLite reconnection | Drizzle migrator using Node.js `fs` | Use `import.meta.glob` pattern from day one |
| Phase 3: IPC command names | Mismatched `tauri-plugin-sql` command signatures | Log every `invoke()` call and result during reconnection |
| Phase 3: Migration bundling | SQL files outside Vite source tree not bundled | Keep migrations in `src/db/migrations/` |
| Phase 4: Engine integration | `ConditionManager` stored in React state directly | Use module-level manager map + plain object projection |
| Phase 4: Engine integration | Mock XP functions shadowing engine functions | Delete `lib/pf2e-data.ts` on day one of porting |
| Phase 4: Engine types | Runtime value imports pulling full engine into UI chunks | Use `import type` in all component files |
| All phases | FSD ESLint not enforced | Install `eslint-plugin-boundaries` in Phase 2, run in CI |

---

## "Looks Done But Isn't" Checklist

- [ ] **No `next/link` or `next/navigation` imports remain:** `grep -r "next/link\|next/navigation" src/` returns zero results
- [ ] **All custom Tailwind tokens render correctly:** `bg-pf-gold`, `bg-sidebar`, `text-pf-threat-extreme` produce visible colors in DevTools computed styles
- [ ] **Drizzle migrations run before React mounts:** App startup shows migration logs before any component renders; cold install (no prior DB) works without errors
- [ ] **Engine type imports use `import type`:** No `import { ConditionSlug }` without `type` keyword in any `.tsx` component file
- [ ] **No cross-feature imports in `features/` layer:** `eslint-plugin-boundaries` or manual audit shows zero `features/X` → `features/Y` imports
- [ ] **Zustand selectors returning objects use `useShallow`:** No object literal selector without `useShallow` wrapper in any `useStore()` call
- [ ] **`ConditionManager` not stored in React state:** No `useState(new ConditionManager())` or Zustand state property of type `ConditionManager`
- [ ] **Mock XP functions deleted:** `calculateCreatureXP`, `getThreatLevel` not defined anywhere outside `@engine`
- [ ] **`tauri-plugin-sql` IPC signatures verified:** All `invoke('plugin:sql|...')` calls match documented plugin command names exactly
- [ ] **Migration SQL files inside `src/`:** `import.meta.glob` pattern references files within `src/db/migrations/`, confirmed present in `dist/`
- [ ] **Focus rings visible in dark mode:** Tab through interactive elements — all have visible focus ring (not the 1px v4 default)
- [ ] **Encounter builder state isolated from combat store:** Add 3 creatures in encounter builder, cancel without launching — combat tracker shows 0 creatures

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| `next/link` left in codebase, navigation broken | LOW | Global search-replace; ~30 min for 8 pages + sidebar |
| Tailwind v4 custom tokens not rendering | LOW | Add `@theme inline` block in globals.css; ~1 hour for full token audit |
| Drizzle migrator crashes (Node.js `fs`) | MEDIUM | Implement `import.meta.glob` migration runner; ~2–3 hours |
| FSD circular dependency (features importing features) | HIGH | Extract shared types to `entities/` layer; may require store redesign; ~4–8 hours |
| Zustand selectors causing perpetual re-renders | LOW | Add `useShallow` to identified selectors; ~1 hour once the problematic selector is identified |
| Zustand store at wrong FSD layer | HIGH | Redesign store ownership model; split entity vs. feature state; ~4–6 hours including Zustand store rewrites |
| ConditionManager stored in React state | MEDIUM | Extract to module-level map + plain object projection pattern; ~2–4 hours |
| Mock XP functions retained alongside engine | LOW | Delete mock file, fix import paths; ~1 hour |
| Tauri IPC command name mismatch | LOW | Fix command name strings; ~30 min once root cause identified |
| Migration SQL files not bundled in production | LOW | Move files to `src/db/migrations/`; ~30 min |

---

## Sources

- Official Next.js migration guide (to Vite): https://nextjs.org/docs/app/guides/migrating/from-vite (HIGH confidence)
- Plane.so migration post-mortem (Next.js → Vite + React Router): https://plane.so/blog/why-did-we-migrate-plane-from-nextjs-to-react-router-vite (MEDIUM confidence)
- shadcn/ui Vite installation: https://ui.shadcn.com/docs/installation/vite (HIGH confidence)
- shadcn/ui Tailwind v4 migration: https://ui.shadcn.com/docs/tailwind-v4 (HIGH confidence)
- Tailwind CSS v4 release notes: https://tailwindcss.com/blog/tailwindcss-v4 (HIGH confidence)
- FSD official documentation — layers and import rules: https://feature-sliced.design/docs/reference/layers (HIGH confidence)
- FSD + Zustand integration guide: https://feature-sliced.design/blog/zustand-simple-state-guide (HIGH confidence)
- Zustand `useShallow` — avoid performance issues: https://dev.to/devgrana/avoid-performance-issues-when-using-zustand-12ee (MEDIUM confidence — verified against Zustand official docs)
- Zustand GitHub — selectors and re-rendering: https://deepwiki.com/pmndrs/zustand/2.3-selectors-and-re-rendering (MEDIUM confidence)
- Drizzle ORM + SQLite in Tauri App: https://dev.to/huakun/drizzle-sqlite-in-tauri-app-kif (MEDIUM confidence)
- Drizzle + Tauri migration system: https://deepwiki.com/tdwesten/tauri-drizzle-sqlite-proxy-demo/4.2-migration-system (MEDIUM confidence)
- Tauri 2 IPC documentation: https://v2.tauri.app/concept/inter-process-communication/ (HIGH confidence)
- Tauri 2 window configuration: https://v2.tauri.app/reference/config/ (HIGH confidence)
- Direct codebase inspection (HIGH confidence): `D:\parse_data\` (prototype), `D:\pathbuddy\engine\index.ts` (engine barrel), `D:\parse_data\app-sidebar.tsx`, `D:\parse_data\lib\pf2e-data.ts`, `D:\parse_data\app\globals.css`

---

*Pitfalls research for: PF2e DM Assistant — v0.3.0 Frontend Rebuild + Engine Integration (Next.js → Vite + React + FSD + Zustand + Tauri 2)*
*Researched: 2026-03-31*
