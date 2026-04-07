# Phase 36: Roll Foundation - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure TypeScript dice rolling foundation — no UI, no animations.

Delivers:
- `engine/dice/` module with formula parser, `rollDice()`, `heightenFormula()`, and Roll types
- `RollStore` (Zustand, session-only) with roll history + MAP attack tracker
- Barrel export additions to `engine/index.ts`

Does NOT deliver any React components, toast/history UI, or clickable integration — those are Phases 37 and 38.

</domain>

<decisions>
## Implementation Decisions

### rollDice() Location
- **D-01:** `rollDice()`, formula parser, and all Roll types live in **`engine/dice/`** — alongside existing `DamageRoll` and `CreatureAttack` types in `engine/types.ts`. Engine is pure TS with no framework deps; placing dice utilities here lets Phase 39 (condition math) and engine logic use them without importing from `src/`.

### Roll Record Structure
- **D-02:** Roll records use **verbose per-die breakdown** format:
  ```typescript
  interface Roll {
    id: string                         // uuid or timestamp-based
    formula: string                    // original formula, e.g. "2d6+4"
    dice: Array<{ sides: number; value: number }>  // each individual die
    modifier: number                   // flat modifier (sum of all +N/-N terms)
    total: number                      // sum of all dice + modifier
    label?: string                     // e.g. "Fireball damage", "Longsword attack"
    timestamp: number                  // Date.now()
  }
  ```
  Needed for Phase 37 display showing each die individually (e.g. `[4]+[2]+5 = 11`).

### Formula Parser Scope
- **D-03:** Parser handles all PF2e damage/roll patterns:
  - Single die: `1d6`, `d20`
  - Dice + modifier: `2d8+5`, `1d6-1`
  - Multi-die: `1d4+1d6`, `2d6+1d4+3`
  - Negative modifiers: `1d6-2`
  - Modifier-only (for attack bonus rolls): `+5`, `-2`, `0`
  - Zero modifier treated as `+0` (no die)

### Spell Heightening Support
- **D-04:** `engine/dice/` includes a **`heightenFormula()` helper**:
  ```typescript
  function heightenFormula(
    base: string,                          // e.g. "6d6"
    heightened: { perRanks: number; add: string },  // e.g. { perRanks: 1, add: "2d6" }
    castRank: number,                      // rank the spell is being cast at
    baseRank: number,                      // spell's base rank
  ): string                               // returns resolved formula, e.g. "10d6"
  ```
  Handles PF2e "Heightened (+N)" notation. Phase 38 uses this when rendering clickable spell damage formulas.

  Reference: https://2e.aonprd.com/Rules.aspx?ID=2225 (PF2e Heightening rules)

### MAP Tracking in RollStore
- **D-05:** `RollStore` includes **MAP (Multiple Attack Penalty) state** in Phase 36:
  ```typescript
  interface RollStore {
    // Roll history
    rolls: Roll[]
    addRoll: (roll: Roll) => void
    clearRolls: () => void

    // MAP tracking (attack count per combatant per round)
    attackCountByCombatant: Record<string, number>   // combatantId → attack count
    incrementAttackCount: (combatantId: string) => void
    resetAttackCount: (combatantId: string) => void
    resetAllMAP: () => void   // called on round advance
  }
  ```
  Phase 38 reads and increments MAP; Phase 36 owns the state. No persistence — session-only Zustand store.

### RollStore Location
- **D-06:** `RollStore` lives at **`src/shared/model/roll-store.ts`** — FSD convention for cross-feature shared state. Accessible from any feature without circular imports.

### Claude's Discretion
- Random number generation: standard `Math.random()` is fine — no seeding needed (this is a DM tool, not a unit-tested game simulation)
- Engine barrel export (`engine/index.ts`) should export all new dice types and functions
- `rollDice("1d20+N")` is the standard attack roll invocation — no separate `rollAttack()` wrapper needed; MAP penalty is applied by the caller before constructing the formula string

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PF2e Rules
- `https://2e.aonprd.com/Rules.aspx?ID=2225` — PF2e Heightening rules (rank-specific and plus-notation patterns). `heightenFormula()` must implement both patterns.

### Engine Code (read before planning)
- `engine/types.ts` — `DamageRoll`, `CreatureAttack`, `Creature` — Roll types must be consistent with existing engine interfaces
- `engine/modifiers/modifiers.ts` — `Modifier`, `StatisticModifier`, `applyStackingRules` — pattern for engine module structure
- `engine/statistics/statistic.ts` — `Statistic` class — established engine coding conventions
- `engine/index.ts` — barrel export — new dice exports go here

### State Management
- `src/shared/model/` — FSD location for `roll-store.ts`
- Any existing Zustand store in `src/` for store pattern reference (immer middleware, devtools)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `engine/types.ts` — `DamageRoll.damage: string` is already the formula string pattern (`"1d6+6"`) — Roll types should be consistent with this
- `engine/modifiers/modifiers.ts` — `Modifier` class pattern (slug, label, value) — Roll could follow similar naming
- `engine/statistics/creature-statistics.ts` — `CreatureStatistics` with `attackMapSets` already built (MAP penalty lookup table exists per attack) — `roll-store.ts` MAP counter complements this

### Established Patterns
- Engine modules: pure TS classes + plain functions, exported from domain barrel, no framework imports
- Zustand stores: immer middleware pattern (check existing stores for exact middleware setup)
- FSD `shared/model/`: cross-feature stores live here, no UI imports

### Integration Points
- `engine/index.ts` → add dice exports
- `src/shared/model/` → add `roll-store.ts`
- Phase 37 will import `Roll` type and `rollDice()` from `@engine`
- Phase 38 will import `RollStore` actions and `heightenFormula()` for clickable integration

</code_context>

<specifics>
## Specific Ideas

- User referenced: https://2e.aonprd.com/Rules.aspx?ID=2225 — spell heightening must be handled in the formula layer (not deferred to Phase 38)
- Die display format implied by user: show each individual die value (e.g. `[4]+[2]+5 = 11`) — verbose Roll record structure supports this
- MAP state owned in `RollStore` from Phase 36 so Phase 38 has a clean API to increment/reset

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 36-roll-foundation*
*Context gathered: 2026-04-04*
