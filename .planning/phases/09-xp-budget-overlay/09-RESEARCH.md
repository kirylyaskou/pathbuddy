# Phase 09: XP Budget Overlay — Research

**Researched:** 2026-03-25
**Domain:** Pinia store architecture, SQLite persistence, Vue 3 computed reactivity, PF2e XP engine integration
**Confidence:** HIGH

## Summary

Phase 09 adds a live XP budget overlay to the Combat Workspace header. All core calculation logic already exists in `src/lib/pf2e/xp.ts` (tested, shipped in v2.0). This phase is primarily a wiring problem: connect the XP engine to a new Pinia store, persist party config in SQLite, and render the result in the CombatTracker header.

The most important architectural decision is that `useEncounterStore` is purpose-built to be shared between this phase (header overlay) and Phase 10 (Encounter Builder page). The store must own party config (level, size, PWOL), expose an `encounterResult` computed property that reads from `useCombatStore.creatures`, and handle async SQLite persistence without blocking reactivity.

The critical implementation risk is the `level` field gap in `Creature` interface and `addFromBrowser`. The field is absent from `Creature` in `src/types/combat.ts` (confirmed by reading the file). The `addFromBrowser` action in `combat.ts` already reads `entity.level ?? 0` from the `EntityResult` but does NOT store it on the Creature object. Both gaps must be closed in this phase. The correct level value is available immediately from `EntityResult.level` (the STORED generated column, path `$.system.details.level.value` confirmed by migration v4).

**Primary recommendation:** Create `useEncounterStore` as a thin orchestrator — it reads `useCombatStore().creatures` to extract levels, calls `calculateXP()` from the engine, and exposes a single `encounterResult` computed. Keep the store free of rendering logic; all color/label mapping lives in the header component.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Party Configuration UI**
- Party level and size controls are inline in the CombatTracker header — minimal friction, always visible
- Party level uses a number stepper (1-20) with +/- buttons matching PF2e level range
- Party size defaults to 4 (PF2e standard party), editable 1-8
- PWOL toggle is a checkbox next to party controls — always accessible

**XP Display & Threat Rating**
- XP shown as a badge displaying "120 XP" with threat-colored background — compact, scannable
- Threat label is a pill badge with semantic color per tier: Trivial=grey, Low=green, Moderate=gold, Severe=crimson, Extreme=purple
- Horizontal thin bar below header showing fill vs threshold — visual at-a-glance XP budget bar
- Empty state (no creatures): show "0 XP" with "—" threat label — always visible, no layout shift

**Persistence & Data Architecture**
- New `party_config` SQLite table (party_level, party_size, pwol) with single-row pattern — survives app restart per ENC-01
- New `useEncounterStore` Pinia store — shared between Phase 09 header and Phase 10 builder page
- Add `level: number` field to Creature interface, store from raw_data during addFromBrowser — enables XP calc
- Computed property on store — `encounterResult` recalculates when creatures or party config changes

### Claude's Discretion
- Exact Tailwind color tokens for each threat tier (grey/green/gold/crimson/purple mapping)
- Budget bar height and animation (thin horizontal bar design confirmed)
- Number stepper component styling details
- Migration version number for party_config table

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENC-01 | Party level and party size config stored in Pinia with SQLite persistence | `party_config` table in migration v5; `useEncounterStore` with `loadConfig()`/`saveConfig()` using `getSqlite()` raw SQL; single-row upsert pattern matches `sync_state` table precedent |
| ENC-02 | XP budget overlay in Combat Workspace header (total XP, threat label, budget bar) | `calculateXP()` from `xp.ts` is the engine call; `encounterResult` computed on `useEncounterStore`; `CombatTracker.vue` header (lines 81-106) is the insertion point; threat color map and budget bar width computed from `generateEncounterBudgets()` output |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Pinia | already installed | `useEncounterStore` state management | Project standard; `useCombatStore` uses same pattern |
| `@tauri-apps/plugin-sql` | already installed | SQLite persistence for `party_config` | Only available DB driver in Tauri 2 setup |
| Vue 3 `computed` | already installed | `encounterResult` derived state | Reactive dependency tracking on `creatures` + party refs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/lib/pf2e/xp.ts` | local | `calculateXP()`, `generateEncounterBudgets()`, `calculateEncounterRating()` | All XP math — zero hand-rolling |
| `src/lib/database.ts` `getSqlite()` | local | Raw SQL for party_config read/write | Performance-adequate for single-row config; Drizzle not needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw SQL via `getSqlite()` | Drizzle ORM for party_config | Drizzle requires schema.ts update and is overkill for a single config row; raw SQL matches `sync_state` precedent |
| `ref()` for partyLevel/partySize | `reactive()` | `ref()` is consistent with all other stores in the project; reactive() adds indirection |

**Installation:** No new packages needed. All dependencies are already in the project.

---

## Architecture Patterns

### Recommended Project Structure

The phase touches these files:

```
src/
├── types/
│   └── combat.ts            # Add `level: number` field to Creature interface
├── stores/
│   ├── combat.ts            # Update addFromBrowser to pass level when calling addCreature
│   └── encounter.ts         # NEW: useEncounterStore
├── lib/
│   └── migrations.ts        # Add migration v5: party_config table
├── components/
│   └── CombatTracker.vue    # Add XP overlay UI to sticky header
└── __tests__/  (vitest)
    └── stores/
        └── encounter.test.ts  # NEW: unit tests for useEncounterStore
```

### Pattern 1: Single-Row Config Table (sync_state precedent)

**What:** A SQLite table that holds exactly one row of configuration. Reads load the first row; writes use INSERT OR REPLACE with id=1.

**When to use:** App-level persistent settings with no multi-row semantics.

**Example:**
```typescript
// Migration — append to MIGRATIONS array in src/lib/migrations.ts
{
  version: 5,
  name: 'party_config',
  sql: [
    `CREATE TABLE IF NOT EXISTS party_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      party_level INTEGER NOT NULL DEFAULT 1,
      party_size  INTEGER NOT NULL DEFAULT 4,
      pwol        INTEGER NOT NULL DEFAULT 0
    )`,
    `INSERT OR IGNORE INTO party_config (id, party_level, party_size, pwol)
      VALUES (1, 1, 4, 0)`,
  ],
}

// In useEncounterStore
async function loadConfig(): Promise<void> {
  const sqlite = await getSqlite()
  const rows = await sqlite.select<Array<{ party_level: number; party_size: number; pwol: number }>>(
    'SELECT party_level, party_size, pwol FROM party_config WHERE id = 1',
    []
  )
  if (rows.length > 0) {
    partyLevel.value = rows[0].party_level
    partySize.value  = rows[0].party_size
    pwol.value       = rows[0].pwol === 1
  }
}

async function saveConfig(): Promise<void> {
  const sqlite = await getSqlite()
  await sqlite.execute(
    'INSERT OR REPLACE INTO party_config (id, party_level, party_size, pwol) VALUES (1, $1, $2, $3)',
    [partyLevel.value, partySize.value, pwol.value ? 1 : 0]
  )
}
```

**Confidence:** HIGH — directly mirrors `sync_state` table pattern already in migrations.ts.

---

### Pattern 2: Cross-Store Computed (encounterResult)

**What:** `useEncounterStore` imports and calls `useCombatStore()` inside a `computed()` to read `creatures`. Vue's reactivity tracks the dependency automatically.

**When to use:** One store needs derived state from another store without owning or duplicating that state.

**Example:**
```typescript
// src/stores/encounter.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCombatStore } from './combat'
import { calculateXP, generateEncounterBudgets, type EncounterResult } from '@/lib/pf2e/xp'
import { getSqlite } from '@/lib/database'

export const useEncounterStore = defineStore('encounter', () => {
  const partyLevel = ref(1)
  const partySize  = ref(4)
  const pwol       = ref(false)

  const encounterResult = computed((): EncounterResult => {
    const combatStore = useCombatStore()
    const levels = combatStore.creatures
      .map(c => c.level ?? 0)
    return calculateXP(levels, [], partyLevel.value, partySize.value, { pwol: pwol.value })
  })

  const budgets = computed(() => generateEncounterBudgets(partySize.value))

  // loadConfig / saveConfig as above

  return { partyLevel, partySize, pwol, encounterResult, budgets, loadConfig, saveConfig }
})
```

**Confidence:** HIGH — `useCombatStore()` call inside `computed()` is standard Pinia cross-store pattern; Vue tracks reactive reads inside computed.

---

### Pattern 3: Creature Interface Level Field Extension

**What:** Add optional `level?: number` to `Creature` interface and pass it through `addCreature` / `addFromBrowser`.

**Why optional with `?`:** Allows existing tests calling `makeCreature()` without level to keep passing without changes. The XP engine handles `undefined` via `?? 0` fallback.

**Example:**
```typescript
// src/types/combat.ts — add one field
export interface Creature {
  // ... existing fields ...
  level?: number   // creature level from Foundry raw_data; used by useEncounterStore for XP calc
}

// src/stores/combat.ts — addFromBrowser already has: const level: number = entity.level ?? 0
// Pass it to addCreature:
addCreature({
  name,
  maxHP: adjustedMaxHP,
  currentHP: adjustedMaxHP,
  ac,
  initiative: 0,
  dexMod,
  level,        // ADD THIS
  sourceId: entity.slug,
  tier,
})
```

**Confidence:** HIGH — `addFromBrowser` already reads `entity.level ?? 0` at line 296 of combat.ts; it just doesn't store it.

---

### Pattern 4: Budget Bar Width Calculation

**What:** Express current XP as a percentage of the "extreme" budget threshold for the bar fill. Cap at 100%.

**When to use:** Visual budget bar representing XP progress up to the maximum tracked threshold.

**Example:**
```typescript
// In CombatTracker.vue computed or inline template expression
const barWidthPercent = computed(() => {
  const result = encounterStore.encounterResult
  const budget = encounterStore.budgets
  if (budget.extreme === 0) return 0
  return Math.min(100, Math.round((result.totalXp / budget.extreme) * 100))
})
```

Bar fill color should match the current threat tier (see color map below).

---

### Pattern 5: Threat Tier Color Map (Claude's Discretion)

All tokens from `tailwind.config.js`. "Purple" is not a custom token — use Tailwind's built-in `purple` scale (violet-600 is close to the PF2e extreme threat color).

| Tier | Text class | Background class | Rationale |
|------|-----------|-----------------|-----------|
| trivial | `text-stone-400` | `bg-charcoal-600` | Grey — subdued, not alarming |
| low | `text-emerald-400` | `bg-emerald-400/20` | Green — safe encounter territory |
| moderate | `text-gold` | `bg-gold/20` | Gold — project accent, attention-worthy |
| severe | `text-crimson-light` | `bg-crimson-light/20` | Crimson — danger, matches ongoing damage color |
| extreme | `text-violet-400` | `bg-violet-400/20` | Violet/purple — PF2e extreme is "party at serious risk" |

**Confidence:** MEDIUM — token choices match existing project color semantics (emerald=positive, crimson=danger, gold=attention) but exact shades are Claude's discretion per CONTEXT.md.

---

### Anti-Patterns to Avoid

- **Putting encounterResult in useCombatStore:** violates single-responsibility; Phase 10 needs a standalone store for the builder page
- **Calling saveConfig() on every keystroke:** debounce or call on blur/change; SQLite writes are async and each call is a Tauri IPC round-trip
- **Making partyLevel/partySize/pwol watchers that await saveConfig directly:** use `watch()` with `{ immediate: false }` or call saveConfig explicitly on user action — avoids save-on-store-init
- **Storing EncounterResult in a ref() instead of computed():** breaks reactivity; when `creatures` changes, the result must recompute automatically
- **Using `reactive()` for party config:** inconsistent with project pattern (all stores use `ref()`)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XP per creature | custom delta formula | `calculateCreatureXP()` from xp.ts | Handles PWOL, out-of-range, negative levels — 117 tests |
| Total XP + threat rating | custom summation | `calculateXP()` from xp.ts | Orchestrator handles all edge cases (outOfRange warnings, party size scaling) |
| Tier thresholds | hardcoded numbers | `generateEncounterBudgets(partySize)` | Scales per party size, returns all 5 tiers |
| Budget bar threshold | manual arithmetic | `generateEncounterBudgets().extreme` as max | The engine already has the number |
| PWOL creature XP | second lookup table | `calculateCreatureXP(level, partyLevel, { pwol: true })` | Engine has PWOL_CREATURE_XP with correct values |

**Key insight:** The XP engine in `src/lib/pf2e/xp.ts` is the only source of truth. Any arithmetic in the store or component that touches XP values is a bug waiting to happen.

---

## Common Pitfalls

### Pitfall 1: `level` Field Not Passed Through addCreature

**What goes wrong:** `encounterStore.encounterResult` computes `c.level ?? 0` for every creature — if `level` is never set on the Creature object, all creatures appear as level 0 to the XP engine, producing wrong XP totals.

**Why it happens:** `addFromBrowser` reads `entity.level ?? 0` but passes only a subset of fields to `addCreature`. The field is not in the `Creature` interface.

**How to avoid:** Add `level?: number` to `Creature` interface AND add `level` to the `addCreature` call inside `addFromBrowser`.

**Warning signs:** XP total is always the same regardless of creature levels; all creatures show delta=0 in XP calculation.

---

### Pitfall 2: `loadConfig()` Not Called on App Start

**What goes wrong:** partyLevel/partySize/pwol reset to defaults on every app restart, failing ENC-01.

**Why it happens:** Pinia stores initialize synchronously; `loadConfig()` is async and must be explicitly awaited.

**How to avoid:** Call `encounterStore.loadConfig()` in the same initialization sequence as other async init (e.g., `SplashScreen.vue` or the router's `beforeEach` guard where `runMigrations` is called). The store exposes `loadConfig()` so callers can await it.

**Warning signs:** Settings reset to level 1 / size 4 after every app restart even after being changed.

---

### Pitfall 3: Computed `encounterResult` Calling `useCombatStore()` Outside `computed()`

**What goes wrong:** If `useCombatStore()` is called once at module level and its `creatures` ref is captured in a closure, reactivity to subsequent creature changes is lost.

**Why it happens:** Store references captured outside reactive context don't re-track.

**How to avoid:** Call `useCombatStore()` inside the `computed()` callback body, not at store initialization time. Vue tracks reactive reads from inside computed callbacks.

```typescript
// CORRECT
const encounterResult = computed(() => {
  const combat = useCombatStore()  // called inside computed — tracked
  return calculateXP(combat.creatures.map(c => c.level ?? 0), ...)
})

// WRONG
const combat = useCombatStore()  // captured at init — NOT re-tracked on creature changes
const encounterResult = computed(() => {
  return calculateXP(combat.creatures.map(c => c.level ?? 0), ...)
})
```

**Confidence:** HIGH — standard Vue 3 reactivity rule.

---

### Pitfall 4: Budget Bar Overflows at Extreme+ Encounters

**What goes wrong:** `width: ${xp / extreme * 100}%` can exceed 100% when XP surpasses the extreme threshold, breaking the bar layout.

**How to avoid:** Always `Math.min(100, ...)` the percentage. The bar visually maxes out at 100%; the XP badge still shows the true value.

---

### Pitfall 5: `party_config` Migration Version Collision

**What goes wrong:** If a new migration is assigned version 4 but version 4 already exists (`fix_npc_level_json_path`), the migration runner skips it silently (checks applied versions).

**Current state:** Migrations 1–4 exist. The next migration is **version 5**.

**How to avoid:** Always check the last version in `MIGRATIONS` array before adding. Current last version is 4 (`fix_npc_level_json_path`). The `party_config` migration must be version 5.

---

### Pitfall 6: Number Stepper Input Drift

**What goes wrong:** `<input type="number">` in Vue can produce string values if v-model is not bound with `.number` modifier, causing arithmetic to produce NaN in the XP engine.

**How to avoid:** Use `v-model.number="partyLevel"` on the direct input. For +/- button steppers that call functions, ensure the function does integer arithmetic: `partyLevel.value = Math.min(20, partyLevel.value + 1)`.

---

## Code Examples

### Calling calculateXP from useEncounterStore

```typescript
// Source: src/lib/pf2e/xp.ts (confirmed by reading the file)
// calculateXP(creatures: number[], hazards: Array<{ level: number; type: HazardType }>,
//              partyLevel: number, partySize: number, options?: { pwol?: boolean }): EncounterResult
//
// EncounterResult = { totalXp, rating, creatures, hazards, warnings }

const encounterResult = computed((): EncounterResult => {
  const combatStore = useCombatStore()
  const levels = combatStore.creatures.map(c => c.level ?? 0)
  return calculateXP(levels, [], partyLevel.value, partySize.value, { pwol: pwol.value })
})
```

### Budget Bar Template Pattern

```vue
<!-- In CombatTracker.vue — thin bar below the sticky header -->
<div class="h-1 bg-charcoal-700 w-full">
  <div
    class="h-full transition-all duration-300"
    :class="threatBarColor"
    :style="{ width: `${barWidthPercent}%` }"
  />
</div>
```

Where `threatBarColor` and `barWidthPercent` are computed from `encounterStore.encounterResult` and `encounterStore.budgets`.

### Threat Label Pill Badge Template Pattern

```vue
<!-- Compact pill badge, color driven by threat tier -->
<span
  class="px-2 py-0.5 rounded-full text-xs font-bold"
  :class="threatBadgeClass"
>
  {{ threatLabel }}
</span>
```

### Number Stepper Pattern (matching EntityFilterBar.vue style)

```vue
<div class="flex items-center gap-1">
  <button @click="decrement" class="px-1.5 py-0.5 rounded bg-charcoal-600 text-stone-300 text-xs">-</button>
  <span class="text-sm text-stone-100 min-w-[1.5rem] text-center">{{ partyLevel }}</span>
  <button @click="increment" class="px-1.5 py-0.5 rounded bg-charcoal-600 text-stone-300 text-xs">+</button>
</div>
```

### party_config Single-Row Upsert

```typescript
// Source: migrations.ts sync_state precedent (adapted)
// Use INSERT OR REPLACE with fixed id=1 — atomically replaces the single row
await sqlite.execute(
  'INSERT OR REPLACE INTO party_config (id, party_level, party_size, pwol) VALUES (1, $1, $2, $3)',
  [partyLevel.value, partySize.value, pwol.value ? 1 : 0]
)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| XP as ad-hoc template math | `calculateXP()` engine function | v2.0 (2026-03-25) | All XP calculations go through the engine; zero hand-rolling |
| No party config persistence | `party_config` SQLite table (this phase) | v2.1 Phase 09 | Settings survive app restart per ENC-01 |
| Creature level only in DB | `level` on Creature interface (this phase) | v2.1 Phase 09 | Enables live XP recalculation as creatures enter/leave combat |

---

## Open Questions

1. **`saveConfig()` trigger timing**
   - What we know: Save must happen when user changes partyLevel/partySize/pwol
   - What's unclear: Should save happen on every +/- click (high frequency) or on blur/change? Each call is a Tauri IPC round-trip.
   - Recommendation: Save on every committed change (button click / checkbox toggle). The party size/level updates at most a few times per session. Debouncing adds complexity without real benefit at this volume.

2. **`loadConfig()` initialization timing**
   - What we know: Must be called before CombatTracker renders to avoid flash of default values
   - What's unclear: Whether to call in SplashScreen (where runMigrations runs) or in CombatTracker `onMounted`
   - Recommendation: Call `encounterStore.loadConfig()` immediately after `runMigrations()` in SplashScreen.vue — same async init chain, natural sequencing, no flash.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (vitest.config.ts — defineConfig via vite) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/stores/__tests__/encounter.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENC-01 | `loadConfig()` reads party_level/party_size/pwol from SQLite | unit | `npx vitest run src/stores/__tests__/encounter.test.ts` | Wave 0 |
| ENC-01 | `saveConfig()` writes correct values to SQLite | unit | `npx vitest run src/stores/__tests__/encounter.test.ts` | Wave 0 |
| ENC-01 | Default values (level=1, size=4, pwol=false) used when no row exists | unit | `npx vitest run src/stores/__tests__/encounter.test.ts` | Wave 0 |
| ENC-02 | `encounterResult.totalXp` sums all creature levels correctly | unit | `npx vitest run src/stores/__tests__/encounter.test.ts` | Wave 0 |
| ENC-02 | `encounterResult.rating` updates when creature added/removed | unit | `npx vitest run src/stores/__tests__/encounter.test.ts` | Wave 0 |
| ENC-02 | PWOL toggle shifts thresholds (encounterResult differs with pwol=true) | unit | `npx vitest run src/stores/__tests__/encounter.test.ts` | Wave 0 |
| ENC-02 | `budgets` computed returns all 5 tier thresholds scaled for partySize | unit | `npx vitest run src/stores/__tests__/encounter.test.ts` | Wave 0 |
| ENC-02 | Creature with `level: undefined` treated as level 0 in XP calc | unit | `npx vitest run src/stores/__tests__/encounter.test.ts` | Wave 0 |
| ENC-02 | Empty combat (no creatures) produces 0 XP and `trivial` rating | unit | `npx vitest run src/stores/__tests__/encounter.test.ts` | Wave 0 |
| ENC-01/02 | `addFromBrowser` stores `level` on created Creature objects | unit | `npx vitest run src/stores/__tests__/combat.test.ts` | Exists (add case) |

### Sampling Rate

- **Per task commit:** `npx vitest run src/stores/__tests__/encounter.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/stores/__tests__/encounter.test.ts` — covers ENC-01 persistence and ENC-02 computed reactivity
- [ ] SQLite mock strategy: `getSqlite()` must be mocked (same approach as combat.test.ts — check how existing tests mock Tauri plugins; if combat.test.ts does not mock SQLite it's because it doesn't call DB methods; encounter.test.ts needs a `vi.mock` for `@/lib/database`)

*(Note: `src/__tests__/global-setup.ts` and `setup.ts` provide pinia initialization globally — no extra fixture setup needed for store tests.)*

---

## Sources

### Primary (HIGH confidence)
- `src/lib/pf2e/xp.ts` — Full XP engine API: `calculateXP`, `calculateCreatureXP`, `generateEncounterBudgets`, `calculateEncounterRating`, `EncounterResult` type (read directly)
- `src/lib/migrations.ts` — Migration versioning pattern, current max version = 4, single-row `sync_state` precedent (read directly)
- `src/types/combat.ts` — `Creature` interface missing `level` field (confirmed by reading)
- `src/stores/combat.ts` — `addFromBrowser` reads `entity.level ?? 0` but does not pass it to `addCreature` (confirmed by reading lines 292-316)
- `src/lib/schema.ts` — `pf2e_entities.level` STORED column uses `$.system.details.level.value` (NPC path) via COALESCE (confirmed by reading)
- `tailwind.config.js` — Complete color token inventory (confirmed by reading)
- `.planning/phases/09-xp-budget-overlay/09-CONTEXT.md` — All locked decisions and discretion areas (read directly)

### Secondary (MEDIUM confidence)
- `src/components/CombatTracker.vue` — Header insertion point at lines 81-106 (confirmed by reading)
- `.planning/phases/08-iwr-and-damage-display/08-UI-SPEC.md` — Established design system (Vue 3 + plain Tailwind, inline SVG, no shadcn)
- Pinia cross-store pattern: calling `useStore()` inside `computed()` for reactive cross-store reads — standard documented Pinia pattern

### Tertiary (LOW confidence)
- None — all key claims verified from source files in this project.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies confirmed present in project, no new installs
- Architecture: HIGH — migration pattern, store pattern, and XP engine API all confirmed from source
- Pitfalls: HIGH — level field gap and migration version confirmed from source; reactivity pitfall is standard Vue 3 documented behavior
- Color tokens: MEDIUM — token choices for threat tiers are Claude's discretion; the tokens used (violet-400, emerald-400, crimson-light, gold, stone-400) all exist in tailwind.config.js or Tailwind defaults

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable project — no fast-moving dependencies)
