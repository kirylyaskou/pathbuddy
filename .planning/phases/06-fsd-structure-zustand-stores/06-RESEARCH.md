# Phase 6: FSD Structure + Zustand Stores - Research

**Researched:** 2026-04-01
**Domain:** Feature-Sliced Design (FSD) + Zustand 5 state architecture
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Entity slices**
- D-01: 7 entity slices: `entities/creature/`, `entities/combatant/`, `entities/condition/`, `entities/encounter/`, `entities/spell/`, `entities/item/`, `entities/hazard/`
- D-02: Internal structure per entity: `model/` (types + Zustand store), `ui/` (presentational components), `lib/` (helpers). No `api/` segment — all IPC through `shared/api/`.
- D-03: `entities/spell/` and `entities/item/` get minimal skeletons only (directory + `index.ts` barrel + base type stub in `model/`). Full store shape, ui, and lib deferred to after Phase 7 data import reveals actual Foundry VTT entity structure.
- D-04: `entities/hazard/` gets the same minimal skeleton treatment as spell/item — fleshed out when needed in Phase 10.

**Feature slices**
- D-05: 3 feature slices: `features/combat-tracker/`, `features/bestiary-browser/`, `features/encounter-builder/`
- D-06: Minimal skeletons for all feature slices (directory + `index.ts` barrel + empty store stub). Content filled in Phase 8-10.

**PF2e component placement**
- D-07: `creature-card.tsx` + `creature-stat-block.tsx` move from `shared/ui/` to `entities/creature/ui/`
- D-08: `xp-budget-bar.tsx` moves from `shared/ui/` to `entities/encounter/ui/`
- D-09: Generic PF2e atoms stay in `shared/ui/`: `level-badge`, `trait-pill`, `stat-badge`, `action-icon`
- D-10: Moved components become clean presentational components with typed props from `@engine` — no mock data, no local type stubs

**Type sourcing**
- D-11: All PF2e types (`Creature`, `ActionCost`, etc.) imported directly from `@engine` barrel export — no type duplication in entity slices

**Carried forward**
- D-12: FSD layers: `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`
- D-13: `@engine` alias via `vite-tsconfig-paths` — single source of truth
- D-14: `shared/api/` is sole Tauri IPC boundary — all `invoke()` calls centralized there (ARCH-05)
- D-15: Entity state = serializable, SQLite-derived; feature state = session, in-memory runtime (ARCH-04)
- D-16: Zustand 5 + immer middleware; `useShallow` mandatory for object selectors
- D-17: ConditionManager: module-level Map pattern, NOT in React/Zustand state
- D-18: `createHashRouter` for Tauri (no HTML5 history)

### Claude's Discretion
- Internal structure of feature slices (model+ui+lib or subset — decide during planning)
- Store stubbing depth for the 5 full entity slices (creature, combatant, condition, encounter, hazard)
- shared/api/ design (wrapper pattern, function signatures, stub approach)
- Exact file organization within each slice during implementation

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-03 | Codebase organized by FSD (app/pages/widgets/features/entities/shared layers) | FSD directory skeleton, file moves documented in §Architecture Patterns |
| ARCH-04 | Zustand stores designed with correct FSD ownership — entity state (serializable, SQLite-derived) separated from feature runtime state (session, in-memory) | Entity vs. feature store pattern, immer middleware, Zustand v5 API in §Standard Stack + §Code Examples |
| ARCH-05 | `shared/api/` is the sole Tauri IPC boundary — all `invoke()` calls centralized there | shared/api/ stub pattern in §Architecture Patterns; no existing invoke() calls confirmed |
| ARCH-06 | `@engine` alias wired through `vite-tsconfig-paths`, consumed by entities and features layers | Already live in tsconfig.json + vite.config.ts; engine barrel export verified; see §Environment Availability |
</phase_requirements>

---

## Summary

Phase 6 is a structural reorganization and stubbing phase, not a feature-building phase. The hard infrastructure (FSD layers, steiger, eslint-plugin-boundaries, @engine alias) is already working from Phase 5 — lint passes with zero violations on the current codebase. The work is: (1) create 7 entity and 3 feature slice directories with the correct internal segments, (2) move 3 existing components from `shared/ui/` to their correct entity `ui/` segments and replace local type stubs with real `@engine` imports, (3) stub all Zustand stores with correct state ownership, and (4) create the `shared/api/` module with stubbed Tauri IPC wrappers.

Zustand v5.0.12 (latest stable, confirmed via npm registry) is not yet installed — `npm install zustand immer` must happen in Wave 0. The Zustand v5 API changed significantly from v4: `create` is now a plain function (no `.create` variant), `useShallow` is imported from `zustand/react/shallow`, and immer middleware is imported from `zustand/middleware`. TypeScript types are fully bundled with no separate `@types/zustand` needed.

The most critical correctness constraint is the entity vs. feature store ownership rule (D-15/ARCH-04). Entity stores hold only fields that can be serialized to JSON and round-tripped to SQLite — no derived state, no UI flags, no session references. Feature stores hold only what is ephemeral: selected IDs, UI state, pagination cursors, in-progress combat state. Mixing these causes Phase 7 (SQLite hydration) to break because it must wholesale replace entity store contents from a DB query.

**Primary recommendation:** Create slices in order — shared/api/ first (zero FSD violations possible), then entities (require types from @engine), then features (may reference entities). Run `npm run lint` and `npm run typecheck` after each group to catch violations immediately.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.12 | Lightweight React state management | Locked decision D-16; no context/provider needed, excellent TypeScript support |
| immer | 11.1.4 | Immutable update helper for Zustand middleware | Locked decision D-16; enables `draft.field = value` syntax instead of spreads |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand/middleware | (bundled) | `immer`, `persist`, `devtools` middleware | `immer` for entity stores; `devtools` optional for debugging |
| zustand/react/shallow | (bundled) | `useShallow` equality function | Mandatory for any selector that returns an object or array |

### Already Installed (Phase 5)

| Library | Version | Already Present |
|---------|---------|-----------------|
| @tauri-apps/api | ^2.10.1 | Yes — provides `invoke()` for Tauri IPC |
| vite-tsconfig-paths | ^6.1.1 | Yes — resolves @engine alias |
| eslint-plugin-boundaries | ^6.0.2 | Yes — enforces FSD layer directions |
| steiger + @feature-sliced/steiger-plugin | ^0.5.11 / ^0.5.7 | Yes — structural FSD linter |

**Installation (new packages only):**

```bash
npm install zustand immer
```

**Version verification (confirmed 2026-04-01):**

```
zustand: 5.0.12 (npm view zustand version)
immer:   11.1.4 (npm view immer version)
```

---

## Architecture Patterns

### Current State (Phase 5 output)

```
src/
├── app/
│   ├── providers.tsx        (ThemeProvider + Toaster)
│   ├── router.tsx           (createHashRouter, 8 routes)
│   └── styles/globals.css   (PF2e OKLCH tokens, Tailwind v4)
├── pages/
│   ├── bestiary/ui/BestiaryPage.tsx  + index.ts
│   ├── combat/ui/CombatPage.tsx      + index.ts
│   ├── conditions/ui/ConditionsPage.tsx + index.ts
│   ├── dashboard/ui/DashboardPage.tsx   + index.ts
│   ├── encounters/ui/EncountersPage.tsx + index.ts
│   ├── items/ui/ItemsPage.tsx           + index.ts
│   ├── settings/ui/SettingsPage.tsx     + index.ts
│   └── spells/ui/SpellsPage.tsx         + index.ts
├── shared/
│   ├── hooks/  (use-mobile, use-toast)
│   ├── lib/    (cn.ts, utils.ts)
│   ├── routes/ (paths.ts)
│   └── ui/     (60+ shadcn + creature-card, creature-stat-block, xp-budget-bar  <-- MOVE THESE)
├── widgets/
│   └── app-shell/ui/  (AppShell, AppSidebar, AppHeader, CommandPalette)
├── main.tsx
└── vite-env.d.ts
```

### Target State (Phase 6 output)

```
src/
├── app/                     (unchanged)
├── entities/
│   ├── creature/
│   │   ├── model/
│   │   │   ├── types.ts     (re-exports Creature, Rarity, etc. from @engine)
│   │   │   └── store.ts     (useCreatureStore — Zustand entity store)
│   │   ├── ui/
│   │   │   ├── CreatureCard.tsx         (moved + @engine types)
│   │   │   └── CreatureStatBlock.tsx    (moved + @engine types)
│   │   └── index.ts         (barrel: exports store hook + ui components)
│   ├── combatant/
│   │   ├── model/
│   │   │   ├── types.ts     (Combatant interface — SQLite-derived)
│   │   │   └── store.ts     (useCombatantStore)
│   │   └── index.ts
│   ├── condition/
│   │   ├── model/
│   │   │   ├── types.ts     (re-exports ConditionSlug, ValuedCondition from @engine)
│   │   │   └── store.ts     (useConditionStore — active conditions per combatant)
│   │   └── index.ts
│   ├── encounter/
│   │   ├── model/
│   │   │   ├── types.ts     (Encounter interface — SQLite-derived)
│   │   │   └── store.ts     (useEncounterStore)
│   │   ├── ui/
│   │   │   └── XPBudgetBar.tsx          (moved + real engine calculateEncounterRating)
│   │   └── index.ts
│   ├── spell/
│   │   ├── model/
│   │   │   └── types.ts     (minimal Spell stub — fleshed out Phase 7)
│   │   └── index.ts
│   ├── item/
│   │   ├── model/
│   │   │   └── types.ts     (minimal Item stub — fleshed out Phase 7)
│   │   └── index.ts
│   └── hazard/
│       ├── model/
│       │   └── types.ts     (minimal Hazard stub — fleshed out Phase 10)
│       └── index.ts
├── features/
│   ├── combat-tracker/
│   │   ├── model/
│   │   │   └── store.ts     (useCombatTrackerStore — session state: activeId, round, turn)
│   │   └── index.ts
│   ├── bestiary-browser/
│   │   ├── model/
│   │   │   └── store.ts     (useBestiaryStore — filter state, selectedId, searchQuery)
│   │   └── index.ts
│   └── encounter-builder/
│       ├── model/
│       │   └── store.ts     (useEncounterBuilderStore — draft encounter, partyConfig)
│       └── index.ts
├── pages/                   (unchanged)
├── shared/
│   ├── api/
│   │   ├── index.ts         (barrel: all IPC function exports)
│   │   ├── creatures.ts     (invoke wrappers for creature queries)
│   │   ├── combat.ts        (invoke wrappers for combat persistence)
│   │   └── db.ts            (invoke wrappers for DB init/migration)
│   ├── hooks/               (unchanged)
│   ├── lib/                 (unchanged)
│   ├── routes/              (unchanged)
│   └── ui/                  (creature-card + creature-stat-block + xp-budget-bar REMOVED)
├── widgets/                 (unchanged)
└── main.tsx
```

### Pattern 1: Entity Store (Zustand v5 + immer)

Entity stores hold **only serializable, SQLite-derived data**. No UI flags, no session IDs, no derived values.

```typescript
// Source: Zustand v5 official docs + immer middleware
// entities/creature/model/store.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Creature } from '@engine'

interface CreatureState {
  // Serializable SQLite-derived data only
  creatures: Creature[]
  selectedId: string | null  // NOTE: selectedId is ENTITY state (persisted), not feature state
  // Actions
  setCreatures: (creatures: Creature[]) => void
  setSelectedId: (id: string | null) => void
  upsertCreature: (creature: Creature) => void
}

export const useCreatureStore = create<CreatureState>()(
  immer((set) => ({
    creatures: [],
    selectedId: null,
    setCreatures: (creatures) =>
      set((state) => {
        state.creatures = creatures
      }),
    setSelectedId: (id) =>
      set((state) => {
        state.selectedId = id
      }),
    upsertCreature: (creature) =>
      set((state) => {
        const idx = state.creatures.findIndex((c) => c.name === creature.name)
        if (idx >= 0) state.creatures[idx] = creature
        else state.creatures.push(creature)
      }),
  }))
)
```

### Pattern 2: Feature Store (Zustand v5, no immer needed for simple state)

Feature stores hold **only ephemeral session state**. Cleared on page reload is acceptable.

```typescript
// features/combat-tracker/model/store.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface CombatTrackerState {
  // Session runtime state only — NOT persisted to SQLite
  activeCombatantId: string | null
  round: number
  turn: number
  isRunning: boolean
  // Actions
  startCombat: () => void
  endCombat: () => void
  nextTurn: () => void
  setActiveCombatant: (id: string | null) => void
}

export const useCombatTrackerStore = create<CombatTrackerState>()(
  immer((set) => ({
    activeCombatantId: null,
    round: 0,
    turn: 0,
    isRunning: false,
    startCombat: () =>
      set((state) => {
        state.round = 1
        state.turn = 0
        state.isRunning = true
      }),
    endCombat: () =>
      set((state) => {
        state.activeCombatantId = null
        state.round = 0
        state.turn = 0
        state.isRunning = false
      }),
    nextTurn: () =>
      set((state) => {
        state.turn += 1
      }),
    setActiveCombatant: (id) =>
      set((state) => {
        state.activeCombatantId = id
      }),
  }))
)
```

### Pattern 3: useShallow for Object Selectors (mandatory per D-16)

```typescript
// Source: zustand/react/shallow — Zustand v5 export path
import { useShallow } from 'zustand/react/shallow'
import { useCreatureStore } from '@/entities/creature'

// WRONG — causes re-render on every store update
const { creatures, selectedId } = useCreatureStore((s) => ({
  creatures: s.creatures,
  selectedId: s.selectedId,
}))

// CORRECT — useShallow compares object fields individually
const { creatures, selectedId } = useCreatureStore(
  useShallow((s) => ({ creatures: s.creatures, selectedId: s.selectedId }))
)
```

### Pattern 4: shared/api/ — Tauri IPC Boundary

All `invoke()` calls MUST live here. Features/entities/pages call these functions, never `invoke()` directly.

```typescript
// shared/api/creatures.ts
import { invoke } from '@tauri-apps/api/core'
import type { Creature } from '@engine'

// Stubs for Phase 6 — real SQL added in Phase 7
export async function fetchCreatures(): Promise<Creature[]> {
  // Phase 7 will implement: return invoke<Creature[]>('get_creatures')
  return []
}

export async function fetchCreatureById(id: string): Promise<Creature | null> {
  // Phase 7: return invoke<Creature | null>('get_creature', { id })
  return null
}
```

```typescript
// shared/api/index.ts — barrel export
export * from './creatures'
export * from './combat'
export * from './db'
```

### Pattern 5: Entity Slice Barrel Export

Steiger enforces that cross-slice imports must go through the slice's `index.ts` barrel. Internal segments are private.

```typescript
// entities/creature/index.ts
export { useCreatureStore } from './model/store'
export type { CreatureState } from './model/store'
export { CreatureCard } from './ui/CreatureCard'
export { CreatureStatBlock } from './ui/CreatureStatBlock'
```

### Pattern 6: @engine Type Consumption in Entity Models

Entities import types directly from `@engine`, no local re-declaration.

```typescript
// entities/creature/model/types.ts
// Re-export engine types as the entity's canonical types
export type { Creature, Rarity, CreatureSize, ActionCost } from '@engine'
```

### Pattern 7: Combatant Type (entity-layer type, not in @engine)

`Combatant` is a runtime concept (creature + HP + conditions in combat) that does not exist in the engine. It belongs in `entities/combatant/model/types.ts`.

```typescript
// entities/combatant/model/types.ts
import type { Creature } from '@engine'

export interface Combatant {
  id: string              // unique per combat slot (uuid)
  creatureRef: string     // references Creature.name or future DB id
  displayName: string
  initiative: number
  hp: number
  maxHp: number
  tempHp: number
  conditions: string[]    // condition slugs — ConditionManager is module-level, not stored here
  isNPC: boolean
}
```

### Pattern 8: XPBudgetBar Migration

The existing `xp-budget-bar.tsx` uses local stub functions. After move to `entities/encounter/ui/`, it imports from `@engine` instead.

```typescript
// entities/encounter/ui/XPBudgetBar.tsx (after migration)
import { generateEncounterBudgets } from '@engine'  // replaces local getXPThresholds()
// ... rest of component stays unchanged visually
```

### Anti-Patterns to Avoid

- **invoke() outside shared/api/**: Any `invoke()` call in `features/`, `entities/`, `pages/`, or `widgets/` is an ARCH-05 violation. ESLint does not enforce this automatically — it's a manual convention. The planner should include a grep verification step.
- **Upward imports in FSD**: `entities/` importing from `features/` or higher. `eslint-plugin-boundaries` catches this — run `npm run lint` after every entity creation.
- **Mixed store state**: Putting `isDialogOpen` (UI state) in an entity store alongside `creatures` (data state). Entity stores must be hydrate-able from SQLite wholesale.
- **Importing internal segments directly**: `import { CreatureCard } from '@/entities/creature/ui/CreatureCard'` instead of `@/entities/creature'`. Steiger enforces public API via `index.ts` only.
- **Type duplication**: Defining a local `Creature` interface in `entities/creature/model/` when `@engine` already exports one. D-11 prohibits this.
- **Immer middleware on feature stores with only primitives**: Not wrong, but immer adds overhead. For stores with only scalar state (booleans, numbers, strings), vanilla zustand `set` is sufficient.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Immutable state updates | Custom reducer/spread chains | `immer` middleware | Handles nested mutation correctly; spread chains break on deep nesting |
| Selector equality checks | Custom deep-equal fn | `useShallow` from `zustand/react/shallow` | Built-in, proven, handles arrays and shallow objects |
| Tauri IPC serialization | Custom serializer | `@tauri-apps/api/core` `invoke()` | Already handles JSON bridge; adding a layer adds bugs |
| FSD layer enforcement | Custom ESLint rules | `eslint-plugin-boundaries` (already configured) | Rules already defined in `eslint.config.js`; boundaries/elements already maps all 6 layers |
| FSD structural checks | Manual CI script | `steiger` (already configured) | Detects cross-slice internal imports, missing barrels, etc. |

**Key insight:** All enforcement infrastructure is already installed and passing. Phase 6 must keep it passing — run `npm run lint` after every file creation/move.

---

## Common Pitfalls

### Pitfall 1: Steiger "no-public-api" Violation on Moved Components

**What goes wrong:** After moving `creature-card.tsx` to `entities/creature/ui/CreatureCard.tsx`, any existing import of `@/shared/ui/creature-card` breaks. If the pages (BestiaryPage, etc.) import the old path, steiger flags a cross-segment import.

**Why it happens:** The Phase 5 code does NOT import creature-card or xp-budget-bar in pages — these components are present but unused (placeholder pages have no content). Verify with grep before moving.

**How to avoid:** Search for existing import consumers before moving any file. In this codebase, the components are unused in pages — so no consumer updates are needed. Verify with `grep -r "creature-card\|creature-stat-block\|xp-budget-bar" src/ --include="*.tsx" --include="*.ts"`.

**Warning signs:** TypeScript errors about missing module after move without consumers.

### Pitfall 2: @engine Alias Not Resolving in New Entity Files

**What goes wrong:** A new file in `entities/creature/model/types.ts` tries `import type { Creature } from '@engine'` and TypeScript reports "cannot find module '@engine'".

**Why it happens:** The `tsconfig.json` `include` array only covers `src/**/*.ts` and `engine/**/*.ts`. The `paths` mapping is set correctly: `"@engine": ["engine/index.ts"]`. Since new entity files ARE under `src/`, this should resolve automatically.

**How to avoid:** The alias is already confirmed working (Phase 5, typecheck passes). After creating the first entity file, run `npm run typecheck` immediately to verify. If it fails, check that the new file is under `src/` (not at root or elsewhere).

**Warning signs:** TypeScript errors only in entity/feature files referencing `@engine`, but not in other src/ files.

### Pitfall 3: Steiger Segment Name Violations

**What goes wrong:** Steiger flags `entities/creature/model/` or `entities/creature/ui/` as invalid segment names.

**Why it happens:** FSD convention has "recommended" segment names (`ui`, `model`, `api`, `lib`, `config`). Steiger `segments-by-purpose` rule validates against this list. `model` IS a recognized segment. The custom exception in `steiger.config.ts` only exempts `shared/hooks`.

**How to avoid:** Use only canonical FSD segment names: `ui`, `model`, `api`, `lib`, `config`. D-02 specifies `model/`, `ui/`, `lib/` — all three are FSD-recognized. Do NOT use `store/` or `types/` as top-level segment names.

**Warning signs:** `steiger: fsd/segments-by-purpose` errors on entity/feature directories.

### Pitfall 4: Zustand v5 Import Path Changes from v4

**What goes wrong:** Code written for Zustand v4 using `import create from 'zustand'` (default export) fails in v5.

**Why it happens:** Zustand v5 switched `create` to a named export only: `import { create } from 'zustand'`. The default export was removed.

**How to avoid:** Always use named import. This is first-install for this project (not upgrading from v4), so there's no legacy code to worry about.

**Warning signs:** TypeScript error "Module 'zustand' has no default export".

### Pitfall 5: immer Middleware Import Path

**What goes wrong:** `import { produce } from 'immer'` used directly instead of Zustand's immer middleware, or wrong import path for the middleware.

**Why it happens:** Immer can be used standalone OR via Zustand middleware. For Zustand stores, use the middleware, not `produce()` directly.

**How to avoid:** Always import from `zustand/middleware/immer` (note: NOT `zustand/middleware` — immer has its own sub-path in v5):
```typescript
import { immer } from 'zustand/middleware/immer'
```

**Warning signs:** TypeScript error about `immer` not being exported from `zustand/middleware`.

### Pitfall 6: ConditionManager Must NOT Go in a Zustand Store

**What goes wrong:** Creating a `conditionManagerStore` that holds the `ConditionManager` instance (which is a `Map`-based module).

**Why it happens:** ConditionManager uses a module-level Map pattern for performance (D-17). React state triggers re-renders; Zustand stores serialize to JSON; Map objects do neither.

**How to avoid:** ConditionManager stays as module-level singleton in `engine/conditions/conditions.ts`. The condition *data* (condition slugs per combatant ID) lives in the entity store as serializable arrays. ConditionManager is called at action dispatch time, never stored.

**Warning signs:** Trying to `JSON.stringify(new Map(...))` — always returns `{}`.

---

## Code Examples

### Minimal Skeleton (spell/item/hazard pattern)

```typescript
// entities/spell/model/types.ts
// Minimal stub — full shape deferred to Phase 7 when Foundry VTT data reveals structure
export interface Spell {
  id: string
  name: string
  level: number
}
```

```typescript
// entities/spell/index.ts
export type { Spell } from './model/types'
```

### Combatant Store (full entity store — most complex in this phase)

```typescript
// entities/combatant/model/store.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Combatant } from './types'

interface CombatantState {
  combatants: Combatant[]
  addCombatant: (combatant: Combatant) => void
  removeCombatant: (id: string) => void
  updateHp: (id: string, delta: number) => void
  updateTempHp: (id: string, tempHp: number) => void
  addCondition: (id: string, slug: string) => void
  removeCondition: (id: string, slug: string) => void
  reorderInitiative: (orderedIds: string[]) => void
  clearAll: () => void
}

export const useCombatantStore = create<CombatantState>()(
  immer((set) => ({
    combatants: [],
    addCombatant: (combatant) =>
      set((state) => { state.combatants.push(combatant) }),
    removeCombatant: (id) =>
      set((state) => {
        state.combatants = state.combatants.filter((c) => c.id !== id)
      }),
    updateHp: (id, delta) =>
      set((state) => {
        const c = state.combatants.find((c) => c.id === id)
        if (c) c.hp = Math.max(0, Math.min(c.maxHp, c.hp + delta))
      }),
    updateTempHp: (id, tempHp) =>
      set((state) => {
        const c = state.combatants.find((c) => c.id === id)
        if (c) c.tempHp = Math.max(0, tempHp)
      }),
    addCondition: (id, slug) =>
      set((state) => {
        const c = state.combatants.find((c) => c.id === id)
        if (c && !c.conditions.includes(slug)) c.conditions.push(slug)
      }),
    removeCondition: (id, slug) =>
      set((state) => {
        const c = state.combatants.find((c) => c.id === id)
        if (c) c.conditions = c.conditions.filter((s) => s !== slug)
      }),
    reorderInitiative: (orderedIds) =>
      set((state) => {
        state.combatants.sort(
          (a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
        )
      }),
    clearAll: () =>
      set((state) => { state.combatants = [] }),
  }))
)
```

### shared/api/ DB Stub

```typescript
// shared/api/db.ts
import { invoke } from '@tauri-apps/api/core'

// Phase 7 will implement these with real SQL commands
export async function initDatabase(): Promise<void> {
  // await invoke('plugin:sql|execute', { db: 'sqlite:pathbuddy.db', ... })
  return
}

export async function runMigrations(): Promise<void> {
  return
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand `import create from 'zustand'` (default export) | `import { create } from 'zustand'` (named export only) | Zustand v5 (2024) | Must use named import |
| `import { shallow } from 'zustand/shallow'` | `import { useShallow } from 'zustand/react/shallow'` | Zustand v5 | Import path changed |
| `import { immer } from 'zustand/middleware'` | `import { immer } from 'zustand/middleware/immer'` | Zustand v5 | Sub-path changed |
| eslint-plugin-boundaries `element-types` rule | `dependencies` rule with object-based selectors | v6.0.0 (2024) | Already migrated in Phase 5 |
| FSD `hooks` segment (purpose-named) | FSD `api`, `model`, `ui`, `lib`, `config` (canonical names) | FSD 2.0 | steiger enforces; `hooks` excepted in `shared/` only |

**Deprecated/outdated:**
- `zustand/context`: Removed in v5. Zustand stores are global singletons by default. No provider needed.
- `devtools` middleware with `name` property string syntax: Still works in v5, but optional for this phase.

---

## Open Questions

1. **Condition store shape**
   - What we know: Conditions are tracked per combatant; ConditionManager is module-level Map; valued conditions (Frightened 2) have numeric values
   - What's unclear: Should the entity condition store mirror the Map (keyed by combatant ID), or store a flat list of `{combatantId, slug, value}` tuples? The flat list is more SQLite-serialization-friendly.
   - Recommendation: Use flat array `{ combatantId: string; slug: string; value?: number }[]` in entity store for SQLite compatibility. ConditionManager stays module-level for fast lookup.

2. **XPBudgetBar engine integration depth**
   - What we know: Current `xp-budget-bar.tsx` uses local stub functions mimicking `generateEncounterBudgets` from `@engine`. D-10 says moved components use `@engine` types.
   - What's unclear: Should XPBudgetBar call `generateEncounterBudgets` from `@engine` directly, or receive pre-computed thresholds as props?
   - Recommendation: Pass pre-computed thresholds as props (pure presentational component, per D-10). The feature store or page computes them using `@engine`. This keeps the component testable and boundary-clean.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | `npm install zustand immer` | Yes | (project already running) | — |
| zustand | ARCH-04 stores | No — not installed | — | Install in Wave 0 |
| immer | ARCH-04 immer middleware | No — not installed | — | Install in Wave 0 |
| @tauri-apps/api | ARCH-05 shared/api/ stubs | Yes — ^2.10.1 in package.json | ^2.10.1 | — |
| vite-tsconfig-paths | ARCH-06 @engine alias | Yes — confirmed resolving | ^6.1.1 | — |
| eslint-plugin-boundaries | ARCH-03 FSD violations | Yes — v6.0.2, passing | ^6.0.2 | — |
| steiger | ARCH-03 FSD structural lint | Yes — v0.5.11, passing | ^0.5.11 | — |

**Missing dependencies with no fallback:**
- `zustand` + `immer` — required for all ARCH-04 entity/feature stores. Must be installed before any store file is created.

**Missing dependencies with fallback:**
- None.

---

## Validation Architecture

> nyquist_validation is enabled (config.json has `"nyquist_validation": true`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — tests intentionally removed (MEMORY.md: "Tests intentionally removed — breaking changes expected, no test maintenance") |
| Config file | None |
| Quick run command | `npm run lint && npm run typecheck` |
| Full suite command | `npm run lint && npm run typecheck` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-03 | All files under FSD layers, no legacy dirs | lint | `npm run lint` (steiger + eslint-plugin-boundaries) | ✅ Existing lint config |
| ARCH-04 | Entity stores hold only serializable state; feature stores hold only session state | manual-only | Code review — no automated test for data ownership rule | N/A |
| ARCH-05 | Zero invoke() calls outside shared/api/ | shell grep | `grep -r "invoke(" src --include="*.ts" --include="*.tsx" \| grep -v "shared/api/"` | ✅ Grep-based verification |
| ARCH-06 | @engine resolves in entities/ and features/ | typecheck | `npm run typecheck` | ✅ Existing tsconfig |

**Note on ARCH-04:** The entity/feature ownership split cannot be enforced by eslint or steiger — it's a semantic rule about what *data* lives where, not an import rule. The planner should include a human-verify checkpoint with explicit checklist items.

### Sampling Rate

- **Per task commit:** `npm run lint && npm run typecheck`
- **Per wave merge:** `npm run lint && npm run typecheck`
- **Phase gate:** `npm run lint && npm run typecheck` green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `npm install zustand immer` — required before first store file

*(No test files needed — project has no test suite by design.)*

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md does not exist in the working directory. Constraints are sourced from MEMORY.md and CONTEXT.md:

- No subagents — all execution inline/synchronous
- No tests — breaking changes expected, no test maintenance
- `.planning/` is gitignored — local only
- One branch per milestone (currently on `master` for v0.3.0)
- Use `--interactive` flag for execute-phase
- Keep React (no Vue)
- `master` is main branch

---

## Sources

### Primary (HIGH confidence)

- npm registry (`npm view zustand version`, `npm view immer version`) — verified versions 5.0.12 and 11.1.4 as of 2026-04-01
- `D:/pathbuddy/tsconfig.json` — @engine alias paths confirmed: `"@engine": ["engine/index.ts"]`
- `D:/pathbuddy/vite.config.ts` — tsconfigPaths() plugin confirmed active
- `D:/pathbuddy/eslint.config.js` — All 6 FSD layers mapped as boundaries/elements; rules active
- `D:/pathbuddy/steiger.config.ts` — fsd.configs.recommended active; shared/hooks exception confirmed
- `D:/pathbuddy/engine/index.ts` — Full barrel export verified; Creature, ActionCost, ConditionSlug, etc. all exported
- `D:/pathbuddy/src/` file tree — Phase 5 output fully mapped; no invoke() calls confirmed
- `npm view zustand@5 peerDependencies` — immer >=9.0.6 confirmed as Zustand v5 peer dep

### Secondary (MEDIUM confidence)

- Zustand v5 changelog / migration guide (from training data, cross-verified against npm dist-tags showing 5.0.12 as latest) — named export, new import paths for shallow/immer

### Tertiary (LOW confidence)

- None — all critical claims verified via direct filesystem inspection and npm registry.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm registry verified versions, packages confirmed working in project
- Architecture: HIGH — built directly from locked CONTEXT.md decisions + existing Phase 5 codebase inspection
- Pitfalls: HIGH — sourced from actual codebase state (no existing invoke() calls, no existing Zustand usage, confirmed component locations)
- Zustand v5 API: MEDIUM-HIGH — training data cross-verified against npm (5.0.12 latest), peer dep check confirms immer compat

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (Zustand/immer are stable; FSD tooling is stable)
