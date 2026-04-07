# Phase 36: Roll Foundation - Research

**Researched:** 2026-04-04
**Domain:** Pure TypeScript dice engine module + Zustand session store
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `rollDice()`, formula parser, and all Roll types live in `engine/dice/` — pure TS, no framework deps; engine logic in Phase 39 can use rollDice without importing from `src/`
- **D-02:** Roll records use verbose per-die breakdown format:
  ```typescript
  interface Roll {
    id: string
    formula: string
    dice: Array<{ sides: number; value: number }>
    modifier: number
    total: number
    label?: string
    timestamp: number
  }
  ```
- **D-03:** Parser handles all PF2e patterns: `1d6`, `d20`, `2d8+5`, `1d6-1`, `1d4+1d6`, `2d6+1d4+3`, `1d6-2`, `+5`, `-2`, `0`
- **D-04:** `heightenFormula(base, { perRanks, add }, castRank, baseRank): string` included in Phase 36
- **D-05:** `RollStore` includes MAP state: `attackCountByCombatant: Record<string, number>`, `incrementAttackCount`, `resetAttackCount`, `resetAllMAP`
- **D-06:** `RollStore` lives at `src/shared/model/roll-store.ts` — FSD convention for cross-feature shared state

### Claude's Discretion

- Random number generation: `Math.random()` — no seeding needed (DM tool, not a simulation)
- Engine barrel export (`engine/index.ts`) should export all new dice types and functions
- `rollDice("1d20+N")` is the standard attack roll invocation — no separate `rollAttack()` wrapper; MAP penalty applied by caller before constructing formula string

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 36 builds a pure TypeScript dice foundation with two artifacts: an `engine/dice/` module (formula parser, `rollDice()`, `heightenFormula()`, Roll types) and a session-only Zustand store at `src/shared/model/roll-store.ts` (roll history + MAP tracking). No UI code is produced.

The dice module slots cleanly into the existing engine structure: one subdirectory, no per-subdirectory `index.ts`, exports added to `engine/index.ts`. The `DieSize` and `DieFace` types already exist in `engine/damage/damage.ts` — the new `Roll` types are independent but should reference `DieFace` for die-sides representation rather than duplicating the numeric union.

The Zustand store follows the established `create<T>()(immer((set, get) => ({...})))` pattern used in every existing store. `src/shared/model/` does not yet exist — it must be created. `crypto.randomUUID()` is already used in the codebase for ID generation (encounter-tabs-store.ts).

**Primary recommendation:** Create `engine/dice/index.ts` (parser + rollDice + heightenFormula + types), add exports to `engine/index.ts`, then create `src/shared/model/roll-store.ts` following the immer store pattern.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript (engine) | — (project's TS config) | Formula parser, Roll types, rollDice, heightenFormula | Engine is pure TS — no runtime deps added |
| zustand | ^5.0.12 | RollStore session state | Project standard — all stores use Zustand 5 |
| immer (zustand middleware) | ^11.1.4 | Mutable-style state updates in RollStore | Project standard — every existing store uses immer middleware |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `crypto.randomUUID()` | browser built-in | Roll record `id` generation | Already used in encounter-tabs-store.ts — no dep needed |
| `Date.now()` | JS built-in | Roll record `timestamp` | Sufficient for session-only ordering |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Math.random()` | Seeded PRNG (e.g. `seedrandom`) | Seeded PRNG adds a dependency and complexity; DM tool has no simulation/test need for deterministic rolls |
| `crypto.randomUUID()` for id | `Date.now().toString()` | UUID is better (collision-free); already available in the runtime |

**Installation:**
No new packages needed — Zustand and immer are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
engine/
├── dice/
│   └── index.ts           # parser, rollDice, heightenFormula, Roll interface
├── index.ts               # barrel — add dice exports here
src/
└── shared/
    └── model/
        └── roll-store.ts  # useRollStore (Zustand + immer)
```

No per-subdirectory `index.ts` rule already in the engine: the CONTEXT and engine/index.ts confirm single barrel. `engine/dice/index.ts` is the module file itself, not a re-exporter — the public API goes through `engine/index.ts`.

### Pattern 1: Engine Module Structure
**What:** Plain TypeScript functions and interfaces, no class required. Follows the `engine/encounter/xp.ts` pattern (exported functions + types, no class wrapper).
**When to use:** When the module is a collection of utilities rather than stateful objects.
**Example:**
```typescript
// engine/dice/index.ts — structure (source: engine/encounter/xp.ts pattern)
export interface Roll { ... }
export interface ParsedFormula { ... }

export function parseFormula(formula: string): ParsedFormula { ... }
export function rollDice(formula: string, label?: string): Roll { ... }
export function heightenFormula(
  base: string,
  heightened: { perRanks: number; add: string },
  castRank: number,
  baseRank: number,
): string { ... }
```

### Pattern 2: Zustand + Immer Store
**What:** `create<State>()(immer((set, get) => ({...})))` — identical to all existing stores.
**When to use:** Session-only cross-feature state (no persist middleware).
**Example:**
```typescript
// Source: src/features/combat-tracker/model/store.ts pattern
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export const useRollStore = create<RollStore>()(
  immer((set) => ({
    rolls: [],
    addRoll: (roll) => set((state) => { state.rolls.push(roll) }),
    clearRolls: () => set((state) => { state.rolls = [] }),
    attackCountByCombatant: {},
    incrementAttackCount: (id) => set((state) => {
      state.attackCountByCombatant[id] = (state.attackCountByCombatant[id] ?? 0) + 1
    }),
    resetAttackCount: (id) => set((state) => {
      delete state.attackCountByCombatant[id]
    }),
    resetAllMAP: () => set((state) => { state.attackCountByCombatant = {} }),
  }))
)
```

### Pattern 3: Formula Parser Implementation
**What:** Regex-based tokenizer that splits a formula string into dice tokens and modifier tokens.
**When to use:** All calls to `rollDice()` and `heightenFormula()`.

The formula grammar to handle (from D-03):
```
formula       = term (( '+' | '-' ) term)*
term          = dice_term | number
dice_term     = [number] 'd' number   // e.g. "2d6", "d20", "1d4"
number        = [0-9]+
modifier-only = ('+' | '-') number   // e.g. "+5", "-2"
zero          = '0'
```

Parsing strategy:
1. Normalize whitespace: `formula.trim().replace(/\s+/g, '')`
2. Tokenize with regex: `/([+-]?\d*d\d+|[+-]?\d+)/gi`
3. For each token: test `/(\d*)d(\d+)/i` → dice term; else → flat modifier
4. Handle leading `d20` (no count prefix) as `1d20`
5. Sum all flat modifiers into single `modifier: number`

```typescript
// Tokenize pattern (verified working for all D-03 patterns):
const TOKEN_RE = /([+-]?\d*d\d+|[+-]?\d+)/gi
```

### Pattern 4: heightenFormula() — PF2e "Heightened (+N)" Only
**What:** D-04 specifies the `{ perRanks, add }` shape — this is the "Heightened (+N)" pattern only. The "Heightened (Rank N)" pattern has spell-specific tables not generalized here.
**When to use:** Fireball-style progressive scaling: "Heightened (+1) The damage increases by 2d6"

Algorithm:
```
rankDelta = castRank - baseRank
if rankDelta <= 0: return base
increments = Math.floor(rankDelta / perRanks)
for i in range(increments): base = addFormulas(base, add)
return base
```

`addFormulas` merges two formula strings by combining like dice and summing modifiers:
- `addFormulas("6d6", "2d6")` → `"8d6"`
- `addFormulas("2d6+3", "2d6+1")` → `"4d6+4"`

### Anti-Patterns to Avoid
- **Importing from `src/` inside engine:** engine/dice must have zero imports from `src/`. RollStore in src/ can import from engine, not the reverse.
- **Per-subdirectory barrel in engine:** No `engine/dice/index.ts` re-exporting — the file IS the module. Exports go to `engine/index.ts` only.
- **Using DieSize (number) instead of DieFace (string) for Roll.dice.sides:** The Roll record uses `sides: number` (e.g. `6`) not `DieFace` (e.g. `"d6"`) because sides is a runtime value after parsing, not a type tag.
- **Persist middleware in RollStore:** Session-only — no `persist()` wrapper.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Roll ID generation | Custom counter or random string | `crypto.randomUUID()` | Already used in project; collision-free; browser built-in |
| Immer deep-clone for Record updates | Spread-and-replace | Immer's Proxy-based mutation in set() | Immer handles nested objects correctly; spread at top level breaks |

**Key insight:** The formula parser is genuinely custom — PF2e formulas are simple enough that no dice library is needed, and adding `@dice-roller/rpg-dice-roller` (or similar) would pull in a heavy dependency for trivially parseable expressions.

---

## Common Pitfalls

### Pitfall 1: Negative Token Parsing
**What goes wrong:** Regex splits `"1d6-2"` as `["1d6", "2"]` losing the minus sign, resulting in `modifier: +2` instead of `-2`.
**Why it happens:** Greedy split without sign-awareness.
**How to avoid:** Use token regex `/([+-]?\d*d\d+|[+-]?\d+)/gi` — includes the sign as part of the token. When the first token has no sign, treat as positive.
**Warning signs:** `rollDice("1d6-2").modifier === 2` (positive) when it should be `-2`.

### Pitfall 2: "d20" Without Count Prefix
**What goes wrong:** `"d20"` tokenizes as `{count: NaN, sides: 20}` because count prefix is empty string.
**Why it happens:** `parseInt("")` → `NaN`.
**How to avoid:** Default empty count to `1`: `const count = countStr ? parseInt(countStr) : 1`.
**Warning signs:** `rollDice("d20").dice.length === 0` or `NaN` in output.

### Pitfall 3: Modifier-Only Formula `"+5"` or `"0"`
**What goes wrong:** Parser emits zero dice entries but returns `total: 0` ignoring the flat modifier.
**Why it happens:** No dice tokens found, so the dice-summing logic returns 0 before adding modifier.
**How to avoid:** Ensure `total = dice_sum + modifier` even when `dice.length === 0`.
**Warning signs:** `rollDice("+5").total === 0`.

### Pitfall 4: heightenFormula with Zero or Negative Delta
**What goes wrong:** `heightenFormula("6d6", {perRanks:1, add:"2d6"}, 2, 3)` (castRank < baseRank) returns garbage or throws.
**Why it happens:** `Math.floor(negative / positive)` returns a negative integer.
**How to avoid:** Guard: `if (castRank <= baseRank) return base`.
**Warning signs:** Negative die counts in the resolved formula.

### Pitfall 5: `attackCountByCombatant` Immer Update Pattern
**What goes wrong:** `state.attackCountByCombatant[id]++` throws when key doesn't exist yet.
**Why it happens:** `undefined++` → `NaN`.
**How to avoid:** Nullish coalescing: `state.attackCountByCombatant[id] = (state.attackCountByCombatant[id] ?? 0) + 1`.
**Warning signs:** `attackCountByCombatant` shows `NaN` after first increment for a new combatant.

### Pitfall 6: Circular Import if Roll type is placed in src/
**What goes wrong:** `engine/dice` imports `Roll` from `src/shared/model/roll-store.ts` (or vice versa), breaking the engine-is-pure constraint.
**Why it happens:** Temptation to co-locate the Roll interface with the store.
**How to avoid:** Roll interface lives in `engine/dice/index.ts`. RollStore imports `Roll` from `@engine`. Zero imports from `src/` in engine code.
**Warning signs:** TypeScript path alias `@/` appearing inside `engine/` files.

---

## Code Examples

Verified patterns from existing codebase:

### Zustand + Immer Store (exact project pattern)
```typescript
// Source: src/features/combat-tracker/model/store.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export const useRollStore = create<RollStoreState>()(
  immer((set) => ({
    // ... initial state and actions
  }))
)
```

### crypto.randomUUID() for IDs (already used in project)
```typescript
// Source: src/features/combat-tracker/model/encounter-tabs-store.ts
const id = crypto.randomUUID()
```

### Engine barrel export pattern (engine/index.ts)
```typescript
// Source: engine/index.ts — existing pattern to follow for dice exports
export { rollDice, parseFormula, heightenFormula } from './dice'
export type { Roll, ParsedFormula, DiceToken } from './dice'
```

### DieSize reference (engine/damage/damage.ts — existing, do not duplicate)
```typescript
// DIE_SIZES = [4, 6, 8, 10, 12] as const — Roll.dice[].sides: number
// DieFace = 'd4'|'d6'|'d8'|'d10'|'d12' — NOT used in Roll record (sides is runtime number)
```

---

## Environment Availability

Step 2.6: SKIPPED — Phase 36 is pure TypeScript code with no external tool, CLI, database, or service dependencies. All required packages (zustand, immer, TypeScript) are already installed.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand v4 `create()` (no type param on outer call) | Zustand v5 `create<T>()()` curried pattern | Zustand 5.0 | Exact pattern confirmed in all existing project stores |
| Separate `devtools` middleware wrapper | immer only (no devtools in existing stores) | Project convention | Do not add devtools to RollStore — existing stores don't use it |

**Deprecated/outdated:**
- `zustand/middleware` (old import path): project uses `zustand/middleware/immer` (confirmed in all stores)

---

## Open Questions

1. **`engine/dice/index.ts` naming vs `engine/dice/dice.ts`**
   - What we know: every other engine subdirectory has a single named file (e.g. `engine/modifiers/modifiers.ts`, `engine/encounter/xp.ts`) — not an `index.ts`
   - What's unclear: D-01 says "live in `engine/dice/`" without specifying the filename. Using `index.ts` inside the subdir is a slight deviation from the pattern where every other subdir uses a named file.
   - Recommendation: Use `engine/dice/dice.ts` to match project convention (named file per subdirectory), then re-export from engine/index.ts as `from './dice/dice'`. Alternatively `engine/dice.ts` (flat, no subdirectory) would also match — planner should decide based on expected growth.

2. **Multi-die formula combining in `heightenFormula`**
   - What we know: D-04's `add` param is a formula string like `"2d6"` added per increment
   - What's unclear: if `base` is `"2d6+1d4"` and `add` is `"1d4"`, should the result be `"2d6+2d4"` (combined like dice) or `"2d6+1d4+1d4"` (appended)? Both are mathematically equivalent but the string differs.
   - Recommendation: Append approach (`"2d6+1d4+1d4"`) is simpler to implement correctly and the formula is still parseable by `rollDice()`. Combining like-dice optimization can be added later.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `engine/types.ts`, `engine/index.ts`, `engine/modifiers/modifiers.ts`, `engine/statistics/creature-statistics.ts`, `engine/damage/damage.ts`
- Direct code inspection: `src/features/combat-tracker/model/store.ts`, `src/entities/combatant/model/store.ts`, `src/features/combat-tracker/model/encounter-tabs-store.ts`
- `D:/pathbuddy/package.json` — zustand ^5.0.12, immer ^11.1.4 confirmed
- `.planning/phases/36-roll-foundation/36-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- WebFetch: https://2e.aonprd.com/Rules.aspx?ID=2225 — PF2e Heightening rules (Heightened +N pattern confirmed: rank delta / perRanks increments, each increment adds `add` formula)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified from package.json; no new packages needed
- Architecture: HIGH — file locations, module structure, store pattern all verified from existing codebase
- Pitfalls: HIGH — parser edge cases verified by reasoning through the D-03 formula list against the regex approach; store pitfall verified by immer Record mutation behavior

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable — zustand/immer are not fast-moving in patch behavior)
