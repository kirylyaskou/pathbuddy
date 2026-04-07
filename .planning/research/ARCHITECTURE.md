# Architecture Research

**Domain:** Tauri 2 desktop app — PF2e DM Assistant, FSD frontend rebuild
**Researched:** 2026-03-31
**Confidence:** HIGH (FSD official docs + Zustand/FSD blog post + direct codebase inspection)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           src/ (FSD layers)                          │
├─────────────────────────────────────────────────────────────────────┤
│  app/          — Bootstrap, routing, global providers, DB init        │
├─────────────────────────────────────────────────────────────────────┤
│  pages/        — Route-level compositions (thin wrappers)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ bestiary │  │  combat  │  │encounters│  │conditions/spells │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
├─────────────────────────────────────────────────────────────────────┤
│  widgets/      — Stateful multi-feature UI sections                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │ combat-workspace│  │ bestiary-browser  │  │ encounter-builder  │  │
│  └─────────────────┘  └──────────────────┘  └────────────────────┘  │
│  ┌─────────────────────┐                                             │
│  │ app-shell (nav)     │                                             │
│  └─────────────────────┘                                             │
├─────────────────────────────────────────────────────────────────────┤
│  features/     — User interactions (what users CAN DO)                │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────────┐   │
│  │apply-damage │  │manage-combat │  │build-encounter            │   │
│  └─────────────┘  └──────────────┘  └───────────────────────────┘   │
│  ┌──────────────────┐  ┌──────────────────────────────────────────┐  │
│  │apply-condition   │  │search-bestiary                           │  │
│  └──────────────────┘  └──────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  entities/     — Business objects (what things ARE)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │
│  │ creature │  │combatant │  │ encounter│  │    condition     │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│  shared/       — Zero-business-knowledge infrastructure               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐  │
│  │   ui/   │  │  api/   │  │  lib/   │  │ config/ │  │ routes/  │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  engine/       — Pure PF2e domain logic (outside FSD, zero UI deps)   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │conditions│  │  damage  │  │encounter │  │statistics│  ...        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────────────────┘
         ▲ Tauri IPC bridge (invoke / listen)
┌─────────────────────────────────────────────────────────────────────┐
│  src-tauri/    — Rust backend                                         │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  SQLite (tauri-plugin-sql + sqlx)    Foundry sync pipeline     │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `engine/` | Pure PF2e game logic — zero UI, zero Tauri deps | TypeScript classes/fns, `@engine` alias |
| `shared/api/` | Tauri IPC wrappers — typed `invoke()` calls | `db-creatures.ts`, `db-sync.ts` per domain |
| `shared/lib/` | Generic utilities — no business semantics | `cn.ts`, `format.ts`, utility types |
| `shared/ui/` | shadcn/ui component re-exports + stateless PF2e atoms | Radix primitives, `ActionIcon`, `TraitPill` |
| `entities/*/model/` | Entity types + Zustand store + selectors | `create<Store>()`, selectors |
| `entities/*/api/` | Entity-specific data fetching (calls `shared/api/`) | `getCreature()`, `searchBestiary()` |
| `features/*/model/` | Feature-level Zustand store for interaction state | `useDamageStore`, `useCombatStore` |
| `features/*/ui/` | Feature interaction components | DamageDialog, ConditionPicker, CombatControls |
| `widgets/` | Multi-feature compositions for a page section | `CombatWorkspace`, `BestiaryBrowser` |
| `pages/` | Route-level wiring — minimal logic | compose widgets, set layout title |
| `app/` | Router, global providers, DB initialization | React Router (hash), TauriProvider, splash |

---

## Engine Placement Decision

**The `/engine` directory lives at repo root, outside `src/`. This is correct. Do not move it.**

The engine is a pure TypeScript library with zero frontend or Tauri dependencies, intentionally isolated in v0.2.2 so it can be consumed by any future frontend without modification. In FSD terms, it functions like a local third-party library — at the same conceptual level as `zustand` or `react-router`.

The engine is consumed via the `@engine` alias from FSD layers. It is not placed inside any layer.

Rules:
- `shared/lib/` does NOT absorb engine code. The engine is domain logic, not generic utility functions.
- `entities/` does NOT duplicate engine logic. Entity slices import from `@engine` and add React/Zustand surface area only.
- `features/` calls engine functions directly when computing game outcomes (IWR, degree of success, XP).
- `shared/` does NOT import from `@engine`. The "shared knows nothing about the domain" rule holds.

Dependency direction: `pages → widgets → features → entities → shared` and separately `features → @engine`, `entities → @engine` (for types).

---

## Recommended Project Structure

```
src/
├── app/
│   ├── providers.tsx          # Toaster, error boundary, theme
│   ├── router.tsx             # createHashRouter — Tauri requires hash routing
│   ├── init-db.ts             # DB init/migration on start (calls shared/api)
│   └── styles/
│       └── globals.css        # Tailwind 4 + design tokens
│
├── pages/
│   ├── bestiary/
│   │   └── index.tsx          # Thin: renders BestiaryBrowser widget
│   ├── combat/
│   │   └── index.tsx          # Thin: renders CombatWorkspace widget
│   ├── encounters/
│   │   └── index.tsx          # Thin: renders EncounterBuilder widget
│   ├── conditions/
│   │   └── index.tsx          # Thin: ConditionReference widget
│   ├── spells/
│   │   └── index.tsx
│   ├── items/
│   │   └── index.tsx
│   └── settings/
│       └── index.tsx
│
├── widgets/
│   ├── app-shell/
│   │   ├── ui/
│   │   │   ├── AppShell.tsx         # layout wrapper used by all pages
│   │   │   ├── AppSidebar.tsx
│   │   │   └── AppHeader.tsx
│   │   └── index.ts
│   ├── bestiary-browser/
│   │   ├── ui/
│   │   │   ├── BestiaryBrowser.tsx  # search + filters + list
│   │   │   └── CreatureList.tsx
│   │   └── index.ts
│   ├── combat-workspace/
│   │   ├── ui/
│   │   │   ├── CombatWorkspace.tsx  # 3-panel layout
│   │   │   ├── CombatantRow.tsx
│   │   │   └── StatBlockPanel.tsx
│   │   └── index.ts
│   └── encounter-builder/
│       ├── ui/
│       │   ├── EncounterBuilder.tsx
│       │   └── XPBudgetPanel.tsx
│       └── index.ts
│
├── features/
│   ├── manage-combat/
│   │   ├── model/
│   │   │   └── combat.store.ts      # initiative order, round counter, turn state
│   │   ├── ui/
│   │   │   ├── CombatControls.tsx   # start/end/next-turn buttons
│   │   │   └── InitiativeInput.tsx
│   │   └── index.ts
│   ├── apply-damage/
│   │   ├── model/
│   │   │   └── damage.store.ts      # pending damage, IWR preview (calls @engine applyIWR)
│   │   ├── ui/
│   │   │   └── DamageDialog.tsx
│   │   └── index.ts
│   ├── apply-condition/
│   │   ├── model/
│   │   │   └── condition.store.ts   # condition application state (calls @engine ConditionManager)
│   │   ├── ui/
│   │   │   └── ConditionPicker.tsx
│   │   └── index.ts
│   ├── build-encounter/
│   │   ├── model/
│   │   │   └── encounter-draft.store.ts  # draft creature list (calls @engine XP functions)
│   │   ├── ui/
│   │   │   └── CreatureAdder.tsx
│   │   └── index.ts
│   ├── search-bestiary/
│   │   ├── model/
│   │   │   └── filter.store.ts      # search query + filter state (local, no Zustand cross-sharing)
│   │   ├── ui/
│   │   │   └── BestiaryFilters.tsx
│   │   └── index.ts
│   └── sync-data/
│       ├── model/
│       │   └── sync.store.ts        # sync status, progress (Foundry VTT data sync)
│       ├── ui/
│       │   └── SyncButton.tsx
│       └── index.ts
│
├── entities/
│   ├── creature/
│   │   ├── model/
│   │   │   ├── types.ts             # CreatureEntity extending @engine Creature
│   │   │   └── creature.store.ts    # selected creature, bestiary results cache
│   │   ├── api/
│   │   │   └── creature.api.ts      # calls shared/api — getCreature(), searchCreatures()
│   │   ├── ui/
│   │   │   ├── CreatureCard.tsx
│   │   │   ├── CreatureStatBlock.tsx
│   │   │   └── LevelBadge.tsx
│   │   └── index.ts
│   ├── combatant/
│   │   ├── model/
│   │   │   ├── types.ts             # Combatant = creature reference + combat runtime state
│   │   │   └── combatant.store.ts   # active combatants map, HP, conditions per combatant
│   │   ├── ui/
│   │   │   └── CombatantCard.tsx
│   │   └── index.ts
│   ├── encounter/
│   │   ├── model/
│   │   │   ├── types.ts             # EncounterEntity, ThreatRating (re-exports from @engine)
│   │   │   └── encounter.store.ts   # saved encounters, party config (partyLevel/partySize)
│   │   ├── api/
│   │   │   └── encounter.api.ts     # calls shared/api — getEncounters(), saveEncounter()
│   │   └── index.ts
│   └── condition/
│       ├── model/
│       │   └── types.ts             # re-export ConditionSlug, VALUED_CONDITIONS from @engine
│       ├── ui/
│       │   ├── ConditionBadge.tsx   # display-only pill
│       │   └── ConditionTooltip.tsx
│       └── index.ts
│
└── shared/
    ├── api/
    │   ├── tauri-invoke.ts          # typed invoke() wrapper + error handling
    │   ├── db-creatures.ts          # invoke('search_creatures', ...) etc.
    │   ├── db-spells.ts
    │   ├── db-items.ts
    │   └── db-sync.ts               # invoke('sync_foundry_data', ...)
    ├── lib/
    │   ├── cn.ts                    # clsx + tailwind-merge
    │   ├── format.ts                # number/string formatting utilities
    │   └── types.ts                 # generic utility types (ArrayValues<T>, etc.)
    ├── ui/
    │   ├── [shadcn components]      # button, card, dialog, badge, etc.
    │   ├── ActionIcon.tsx           # PF2e action cost icon — stateless, no business logic
    │   ├── TraitPill.tsx            # PF2e trait pill — stateless
    │   └── StatBadge.tsx            # stat display atom — stateless
    ├── config/
    │   └── app.config.ts            # DB path, app version, feature flags
    └── routes/
        └── paths.ts                 # route constants ('/bestiary', '/combat', ...)
```

### Structure Rationale

- **`engine/` at repo root:** Pure TypeScript library with its own scope and `@engine` alias. No FSD layer owns it — it is an external dependency that happens to be local.
- **`shared/api/` as IPC boundary:** The only place `@tauri-apps/api/core`'s `invoke()` is called. Every layer above uses typed wrapper functions. Backend command renames require updating one file.
- **`entities/*/api/` distinct from `shared/api/`:** `shared/api/` returns raw JSON rows from SQLite. `entities/*/api/` hydrates those rows into entity types. This separation keeps `shared/` free of business-domain knowledge.
- **`entities/condition/` is thin:** ConditionManager (the class with cascade logic) lives in `@engine`. This entity layer re-exports engine types and provides display UI. The management behavior belongs in `features/apply-condition/`.
- **`features/` calls `@engine` directly:** XP budget calculation, IWR application, and degree-of-success evaluations are game-rule computations triggered by user interactions. Feature stores are the right place for these calls.
- **`widgets/` for expensive compositions:** Any component that combines multiple features and entities is a widget. `AppShell` is a widget because it wraps every page — it belongs in `widgets/`, not `shared/ui/` (which has no business context) or `pages/` (which does not reuse things).
- **`pages/` thin by rule:** Pages render one or two widgets. Zero `useState` for business concerns, zero direct store subscriptions. All ported prototype page.tsx files must have their logic extracted before landing in this layer.

---

## Architectural Patterns

### Pattern 1: Tauri IPC Isolation in shared/api

**What:** All `invoke()` calls live in `shared/api/`. Each file covers one backend domain. Higher layers call typed async functions, never raw `invoke('some_string', ...)`.

**When to use:** Every Tauri command call, without exception.

**Trade-offs:** Slight indirection; major payoff is that backend command renames or signature changes require updating one file.

**Example:**
```typescript
// shared/api/db-creatures.ts
import { invoke } from '@tauri-apps/api/core'

export interface CreatureRow {
  slug: string
  name: string
  level: number
  source: string
  data: string  // JSON blob — Foundry VTT system format
}

export async function dbSearchCreatures(
  query: string,
  filters: { minLevel?: number; maxLevel?: number; creatureType?: string }
): Promise<CreatureRow[]> {
  return invoke('search_creatures', { query, ...filters })
}

export async function dbGetCreature(slug: string): Promise<CreatureRow | null> {
  return invoke('get_creature', { slug })
}
```

### Pattern 2: Engine as External Library, Consumed at Feature and Entity Layers

**What:** `@engine` exports are imported wherever PF2e computation is needed. Features use them to compute outcomes; entities use them only for types.

**When to use:** Any PF2e calculation — XP budgets, IWR application, condition cascades, degree of success, modifier stacking.

**Trade-offs:** None. This is the intended design established in v0.2.2.

**Example:**
```typescript
// features/apply-damage/model/damage.store.ts
import { create } from 'zustand'
import { applyIWR, type DamageInstance } from '@engine'
import type { Combatant } from '@/entities/combatant'

interface DamageState {
  pending: DamageInstance | null
  preview: ReturnType<typeof applyIWR> | null
  setPending: (damage: DamageInstance, target: Combatant) => void
  confirm: (commitFn: (finalHp: number) => void) => void
}

export const useDamageStore = create<DamageState>((set, get) => ({
  pending: null,
  preview: null,
  setPending: (damage, target) => {
    const preview = applyIWR(damage, target.iwr)
    set({ pending: damage, preview })
  },
  confirm: (commitFn) => {
    const { preview } = get()
    if (preview) commitFn(preview.finalDamage)
    set({ pending: null, preview: null })
  },
}))
```

### Pattern 3: Zustand Slice-Per-Feature, Public API via index.ts

**What:** Each feature and entity slice owns its Zustand store. The `model/` segment holds the store. The slice's `index.ts` re-exports only what other slices should use.

**When to use:** For all state that crosses component boundaries within or above the slice. Use local `useState` for purely local UI state (open/closed, hover).

**Trade-offs:** More files than a monolithic store; each store is independently understandable and refactorable without tracing cross-store dependencies.

**Example:**
```typescript
// features/manage-combat/index.ts
export { useCombatStore } from './model/combat.store'
export type { CombatState } from './model/combat.store'
// Internal selectors, factory helpers are NOT exported
```

### Pattern 4: Entity Types Extend Engine Types Without Duplication

**What:** Engine exports pure game-logic types (`Creature`, `ConditionSlug`, `ThreatRating`). Entity layer extends these with persistence and display concerns.

**When to use:** When a SQLite row or UI component needs fields the engine type does not have (`id`, `searchRank`, `isBookmarked`).

**Trade-offs:** Two type layers, but avoids engine contamination with frontend concerns. Engine types stay stable and re-usable.

**Example:**
```typescript
// entities/creature/model/types.ts
import type { Creature as EngineCreature } from '@engine'

// Raw shape from SQLite (shared/api returns this)
export interface CreatureRow {
  slug: string
  name: string
  level: number
  source: string
  data: string  // JSON blob
}

// Hydrated entity used throughout UI
export interface CreatureEntity extends EngineCreature {
  slug: string
  source: string
  searchRank?: number  // FTS5 rank — display concern only
}
```

---

## Data Flow

### SQLite to UI Read Flow (Bestiary)

```
User opens Bestiary page
    ↓
pages/bestiary/index.tsx  (renders BestiaryBrowser widget)
    ↓
widgets/bestiary-browser  (subscribes to creature.store + filter.store)
    ↓
features/search-bestiary/model/filter.store.ts  (filter state changes)
    ↓
entities/creature/api/creature.api.ts  (searchCreatures(query, filters))
    ↓
shared/api/db-creatures.ts  (invoke('search_creatures', {...}))
    ↓
Tauri IPC — src-tauri/ SQLite FTS5 query
    ↓ [response path]
shared/api returns CreatureRow[]
    ↓
entities/creature/api parses JSON blobs → CreatureEntity[]
    ↓
entities/creature/model/creature.store.ts updates results
    ↓
widgets/bestiary-browser re-renders
```

### Engine Calculation Flow (Damage Application)

```
DM enters damage in DamageDialog
    ↓
features/apply-damage/ui/DamageDialog.tsx  (local form state)
    ↓
useDamageStore.setPending(damageInstance, targetCombatant)
    ↓
features/apply-damage/model/damage.store.ts
    → calls applyIWR(damage, target.iwr)  ← from @engine
    → stores IWR preview in store
    ↓
DamageDialog renders IWR breakdown from store.preview
    ↓
DM confirms
    ↓
useDamageStore.confirm() → entities/combatant/model/combatant.store.ts.applyDamage()
    ↓
Combatant HP updated → CombatantRow re-renders
```

### Encounter XP Flow

```
DM adds creature to encounter draft
    ↓
features/build-encounter/model/encounter-draft.store.ts
    → calls calculateXP(creatureLevels, [], partyLevel, partySize)  ← from @engine
    → updates xpResult, threatRating in store
    ↓
widgets/encounter-builder/ui/XPBudgetPanel renders live rating
```

### State Ownership Map

```
Persistent (SQLite, survives restart):
  entities/encounter/model/encounter.store.ts  → partyLevel, partySize, saved encounters
  shared/api/db-*.ts                           → all 28K entity data

Session (in-memory, cleared on app close):
  entities/combatant/model/combatant.store.ts  → active combatants, HP, conditions
  features/manage-combat/model/combat.store.ts → round counter, initiative order, turn pointer
  features/apply-damage/model/damage.store.ts  → pending damage dialog state

Transient (local useState, per-component):
  Filter panel open/closed, hover state, tooltip visibility, form input values
```

---

## Scaling Considerations

This is a single-user desktop app. Scale concerns are runtime performance, not concurrency.

| Concern | Approach | Notes |
|---------|----------|-------|
| 28K bestiary entities | FTS5 via Rust, paginated, no client-side filtering | SQLite does the heavy lifting |
| Large combatant lists | Virtualized list in widget if >50 entries | `@tanstack/virtual` or `virtua` |
| IWR/XP recalculation | Synchronous in `@engine`, microsecond-range | No optimization needed |
| Foundry sync (bulk upsert) | Rust-side; bypasses IPC for batch | No change from previous implementation |
| New page routes | Add to `pages/`, add widget if needed | FSD is additive — no restructuring |

---

## Anti-Patterns

### Anti-Pattern 1: Engine Code Inside FSD Layers

**What people do:** Move `applyIWR` or `ConditionManager` into `entities/*/model/` or `shared/lib/` because "it feels more organized inside src/".

**Why it's wrong:** The engine has zero UI deps by design. Folding it into FSD risks accidentally importing React or Tauri things into it. The `@engine` alias encapsulation is load-bearing — it enables future frontend portability.

**Do this instead:** Keep engine at repo root. Import via `@engine` alias. Only the React/Zustand surface area lives in `entities/` and `features/`.

---

### Anti-Pattern 2: Calling invoke() Outside shared/api

**What people do:** Write `await invoke('get_creature', { slug })` directly inside a Zustand action or a feature component.

**Why it's wrong:** Scatters the Tauri API surface across the codebase. Backend command renames require grep-and-fix across many files. Makes the feature untestable without mocking Tauri.

**Do this instead:** All `invoke()` calls live in `shared/api/`. Naming convention: `db*` for SQLite data commands (`dbGetCreature`), `cmd*` for operational commands (`cmdSyncFoundryData`).

---

### Anti-Pattern 3: Porting Next.js Pages One-for-One

**What people do:** Copy `D:/parse_data/app/combat/page.tsx` (800+ lines with all `useState`, `useMemo`, event handlers) directly into `pages/combat/index.tsx`.

**Why it's wrong:** Next.js pages are the natural composition boundary in that framework; in FSD, pages are thin. All the logic in the prototype pages must be distributed into features, entities, and widgets.

**Do this instead:** For each prototype page, extract:
- Filter/search state → `features/search-*/model/filter.store.ts`
- Entity data + mock calls → `entities/*/api/` backed by `shared/api/`
- Interaction handlers → `features/*/ui/` and `features/*/model/`
- Layout composition → `widgets/*/ui/`
- The page itself → 20–40 lines that render one or two widgets.

---

### Anti-Pattern 4: One Monolithic Combat Store

**What people do:** Create `src/store/combat.ts` with all combat state — initiative, HP, conditions, damage dialogs, IWR previews — in one Zustand store.

**Why it's wrong:** The store becomes a god object. Unrelated components re-render when unrelated state changes. Refactoring any part requires understanding the whole thing.

**Do this instead:** Separate by concern:
- `features/manage-combat/model/combat.store.ts` — round counter, initiative order, whose turn
- `features/apply-damage/model/damage.store.ts` — pending damage dialog, IWR preview
- `features/apply-condition/model/condition.store.ts` — condition picker open state
- `entities/combatant/model/combatant.store.ts` — persisted combatant HP and active conditions

Feature stores communicate via imports (respecting FSD layer direction), not by being merged.

---

### Anti-Pattern 5: Duplicating Engine Types in Entity Layer

**What people do:** Define a `Condition` interface or `ThreatRating` union in `entities/condition/model/types.ts` that mirrors the engine's `ConditionSlug` or `ThreatRating`.

**Why it's wrong:** Creates a synchronization burden. When the engine type evolves (e.g., a new condition slug), both definitions need updating. The engine type will silently diverge.

**Do this instead:** Re-export or extend engine types. `entities/condition/index.ts` can do `export type { ConditionSlug } from '@engine'`. Only add fields that are purely UI concerns (display label, icon name, badge class).

---

### Anti-Pattern 6: Importing Between Entities at the Same Layer

**What people do:** `entities/combatant/model/types.ts` imports `CreatureEntity` directly from `entities/creature/model/types.ts`.

**Why it's wrong:** FSD cross-slice imports at the same layer are disallowed by default. This creates hidden coupling that makes slices non-independently refactorable.

**Do this instead:** Either:
- Move the shared type to `shared/lib/types.ts` if it has no business domain
- Use the FSD `@x` cross-slice notation: `import type { CreatureEntity } from 'entities/creature/@x/combatant'`
- Push the cross-slice relationship up to a `features/` slice that imports both entities

---

## Integration Points

### External Libraries / Systems

| Integration | Pattern | Notes |
|-------------|---------|-------|
| `@engine` | Import from alias, never from subdirectories | Barrel export at `engine/index.ts` — always use that |
| Tauri IPC | `invoke()` wrapped in `shared/api/` only | `@tauri-apps/api/core` |
| SQLite data | Rust commands return typed JSON rows | FTS5 via raw SQL in Rust (getSqlite() pattern from v2.x) |
| shadcn/ui | Re-exported from `shared/ui/` | Keeps Radix version centralized |
| React Router | `createHashRouter` (Tauri requires hash routing — no server) | Configured in `app/router.tsx` |
| Zustand | Store-per-slice, imported from slice `index.ts` only | No global store barrel file |
| Tailwind 4 | CSS-first config in `globals.css` | No `tailwind.config.js` in v4 |

### Internal Layer Boundaries

| Boundary | Communication | Constraint |
|----------|---------------|------------|
| `pages` → `widgets` | Direct import | Pages import exactly one or two widgets |
| `widgets` → `features` | Import from feature `index.ts` | Never import from `features/*/model/` directly |
| `widgets` → `entities` | Import from entity `index.ts` | Same rule |
| `features` → `entities` | Import entity store + types from entity `index.ts` | Features depend on entities — valid direction |
| `entities` → `shared/api` | Entity `api/` segment calls `shared/api/` functions | Entities do NOT call `invoke()` directly |
| `entities` → `@engine` | Type imports and engine function calls in `model/` | Bridge layer: engine types get React/Zustand surface |
| `features` → `@engine` | Engine function calls for game-rule computations | Valid: features are below pages/widgets, engine is below all |
| `shared` → `@engine` | Not allowed | `shared/` knows nothing about PF2e domain |
| `entities` ↔ `entities` | Use `@x` notation if unavoidable | Prefer extracting shared types to `shared/lib/` |

---

## Build Order Recommendation

Build bottom-up — each step depends only on layers below it.

1. **`shared/`** — `tauri-invoke.ts`, `db-*.ts` wrappers, shadcn/ui re-exports, `cn.ts`, `paths.ts`
2. **`entities/creature/`** — types extending `@engine Creature`, `creature.api.ts`, Zustand store, `CreatureCard`/`CreatureStatBlock`/`LevelBadge` UI
3. **`entities/combatant/`** — types (references creature entity via `@x` or imported type), `combatant.store.ts`, `CombatantCard`
4. **`entities/encounter/`** + **`entities/condition/`** — thin: types re-exporting from `@engine`, minimal UI atoms
5. **`features/search-bestiary/`** — filter store, filter UI components (depends on creature entity)
6. **`features/manage-combat/`** — combat store with initiative/round logic (depends on combatant entity)
7. **`features/apply-damage/`** — damage store calling `@engine applyIWR` (depends on combatant entity)
8. **`features/apply-condition/`** — condition store calling `@engine ConditionManager` (depends on condition entity)
9. **`features/build-encounter/`** — encounter draft store calling `@engine calculateXP` (depends on creature entity + encounter entity)
10. **`widgets/app-shell/`** — navigation shell (depends on `shared/ui/`, `shared/routes/`)
11. **`widgets/bestiary-browser/`** — composes creature entity UI + search-bestiary feature
12. **`widgets/encounter-builder/`** — composes creature entity + build-encounter feature + XP budget display
13. **`widgets/combat-workspace/`** — composes combatant entity + manage-combat + apply-damage + apply-condition
14. **`pages/`** — thin wrappers rendering widgets, setting route titles
15. **`app/`** — router with `createHashRouter`, providers, DB init calling `shared/api/`

---

## Sources

- [Feature-Sliced Design — Layers Reference](https://feature-sliced.design/docs/reference/layers) — HIGH confidence
- [Zustand: The Minimalist State Architecture | FSD Blog (Feb 2026)](https://feature-sliced.design/blog/zustand-simple-state-guide) — HIGH confidence
- [FSD Overview](https://feature-sliced.design/docs/get-started/overview) — HIGH confidence
- [Tauri SQL Plugin v2](https://v2.tauri.app/plugin/sql/) — HIGH confidence
- Project codebase: `engine/index.ts`, `D:/parse_data/` prototype structure — HIGH confidence (direct inspection)

---

*Architecture research for: Pathfinder 2e DM Assistant v0.3.0 — FSD Frontend Rebuild + Engine Integration*
*Researched: 2026-03-31*
