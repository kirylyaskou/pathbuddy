# Phase 02: Auto-Round Processing - Research

**Researched:** 2026-03-18
**Domain:** Vue3/Pinia state management, turn-based combat mechanics, condition duration tracking
**Confidence:** HIGH

## Summary

Phase 2 extends the combat tracker with automatic round processing, initiative order management, and condition duration tracking. This requires extending the existing `Creature` and `CombatState` types to track condition durations per creature, adding round counter state, and implementing turn/round advancement logic.

**Primary recommendation:** Extend the existing `useCombatStore` with `roundNumber` state, `creatureConditionDurations` record, `regenerationDisabled` per-creature toggle, and new actions `advanceRound()` and `nextCreature()` that handle duration decrementing and turn effect timing (duration decrement first, then healing/regen).

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Condition duration tracking
- Use separate duration map: `creature.conditionDurations: Record<Condition, number>`
- `toggleCondition(id, condition, { duration: 2 })` - explicit duration parameter when adding
- Auto-remove condition when duration hits 0
- Integer rounds only (no fractional durations)

#### Protected conditions
- Add `protected` flag to condition instance: `toggleCondition(id, 'fear', { protected: true, duration: 3 })`
- Protected conditions skip duration decrement
- Protected flag is per-instance (not persisted on re-application)

#### Round advancement UI
- Two buttons: `[New Round]` `[Next Creature]`
- `New Round` button disabled until all creatures have taken their turn
- `Next Creature` moves to next creature in initiative order (constant initiative values)
- After clicking `New Round`, reset to first creature in initiative list

#### Drag-and-drop restrictions
- Can only drag creatures where: `HP > 0 && !isCurrentTurn`
- Locked (cannot drag): `isCurrentTurn || HP <= 0`

#### Turn effect timing
- At start of creature's turn (when they become current turn):
  - First: decrement their duration conditions (skip protected)
  - Then: apply healing/regen/ongoing damage effects
- Healing/regen/ongoing damage only applies to current turn creature

#### Regeneration disabled toggle
- Per-creature toggle button on each creature card: `[Regen Disabled: ON/OFF]`
- When ON: skip all healing/regen/ongoing damage for that creature
- Toggle is cleared when `New Round` is clicked (must re-enable each round)

#### Round counter
- Visual round counter increments when `New Round` is clicked
- Round counter persists across rounds

### Claude's Discretion

- Exact UI layout for buttons and creature cards
- Visual styling for protected conditions
- Animation/transitions for turn changes
- How to display duration countdown on conditions

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMBAT-05 | System auto-processes rounds with initiative order | `advanceRound()` and `nextCreature()` store actions, `roundNumber` state |
| COMBAT-06 | System auto-decrements duration-based conditions each round | `creatureConditionDurations` record, duration decrement logic in `setCurrentTurn()` |
| COMBAT-07 | System auto-calculates healing/regen and ongoing damage at turn start | Turn effect timing in `setCurrentTurn()`, `regenerationDisabled` toggle |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 | 3.5.13 | Reactive UI framework | Project default, established in Phase 1 |
| Pinia | 2.3.0 | State management | Project default, used for combat state |
| Vitest | 2.1.8 | Testing framework | Project default, already configured |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| uuid | 13.0.0 | UUID generation | Creating new creature IDs (already in use) |
| Tailwind CSS | 3.4.17 | Styling | Project default for UI components |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pinia | Vuex | Pinia is lighter-weight, better TypeScript support, Vue 3 native |
| Local state | Pinia | Pinia provides global reactive state accessible across components |

**Version verification:**
```bash
npm view vue version        # 3.5.30 (project uses 3.5.13)
npm view pinia version      # 2.9.0 (project uses 2.3.0)
npm view vitest version     # 3.0.0 (project uses 2.1.8)
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── stores/
│   └── combat.ts          # Extend with round/turn logic
├── types/
│   └── combat.ts          # Extend Creature, Condition types
├── composables/
│   ├── useInitiative.ts   # Already exists, extend with round logic
│   └── useConditions.ts   # Already exists, add protected flag support
├── components/
│   ├── CombatTracker.vue  # Add New Round / Next Creature buttons
│   ├── CreatureCard.vue   # Add regen toggle, condition duration display
│   └── RoundCounter.vue   # New: visual round counter
└── __tests__/
    └── stores/
        └── combat.test.ts # Add tests for new actions
```

### Pattern 1: Extending Pinia Store with Complex State

**What:** Use Pinia's `storeToRefs` and reactive primitives to manage complex nested state while maintaining reactivity.

**When to use:** When tracking per-entity metadata (condition durations, per-creature toggles) alongside entity data.

**Example:**

```typescript
// Source: pinia.vuejs.org - State Management with Pinia
export const useCombatStore = defineStore('combat', () => {
  const roundNumber = ref(1)
  const creatureConditionDurations = ref<Record<string, Record<Condition, number>>>({})
  const regenerationDisabled = ref<Record<string, boolean>>({})

  // Decrement all creature durations, skip protected
  function decrementDurations(skipProtected: Record<string, boolean>) {
    for (const creature of creatures.value) {
      if (!creatureConditionDurations.value[creature.id]) continue

      for (const [condition, duration] of Object.entries(
        creatureConditionDurations.value[creature.id]
      )) {
        if (skipProtected[creature.id]?.[condition]) continue
        creatureConditionDurations.value[creature.id][condition] = Math.max(
          0,
          duration - 1
        )
      }
    }
  }

  return {
    roundNumber,
    creatureConditionDurations,
    regenerationDisabled,
    decrementDurations,
  }
})
```

### Pattern 2: Turn Effect Timing Order

**What:** Execute effects in a specific order at turn start: (1) duration decrement, (2) healing/regen.

**When to use:** When implementing turn-based game mechanics where effect order matters.

**Example:**

```typescript
// Source: Pathfinder 2e combat mechanics (contextual)
function setCurrentTurn(index: number): void {
  // Step 1: Clear previous turn
  creatures.value.forEach(c => {
    c.isCurrentTurn = false
  })

  // Step 2: Set new current turn
  if (index >= 0 && index < creatures.value.length) {
    const sorted = sortedCreatures.value
    const creatureId = sorted[index].id
    const creature = creatures.value.find(c => c.id === creatureId)
    if (creature) {
      creature.isCurrentTurn = true

      // Step 3: At turn start - decrement durations (skip protected)
      decrementDurationsForCreature(creature.id, creatureConditionDurations.value[creature.id])

      // Step 4: Apply healing/regen/ongoing damage
      if (!regenerationDisabled.value[creature.id]) {
        applyTurnEffects(creature.id)
      }
    }
  }
}
```

### Anti-Patterns to Avoid

- **Using global duration tracking:** Don't track durations globally — use per-creature map for flexibility.
- **Re-sorting initiative:** Once combat starts, keep initiative values constant — don't re-sort.
- **Mutable nested objects:** When updating `conditionDurations`, replace the entire record rather than mutating in place to maintain reactivity.
- **Forgotten protected flag reset:** Protected flag should be cleared on re-application — track it separately from duration.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Initiative sorting | Custom sorting logic | `useInitiative.ts` (already exists) | Tested, consistent with Phase 1 |
| Condition formatting | Custom formatter | `useConditions.formatCondition()` | Already defined, consistent UI |
| UUID generation | Manual ID generation | `uuid` package | Proven, collision-resistant |
| Duration math | Custom decrement logic | Simple `Math.max(0, duration - 1)` | Integer rounds, no edge cases |

**Key insight:** Phase 1 already established the foundational combat mechanics — extend rather than rebuild.

## Common Pitfalls

### Pitfall 1: Reactivity Lost with Nested Objects

**What goes wrong:** Modifying `creature.conditionDurations[creature.id][condition]` directly may not trigger reactivity.

**Why it happens:** Vue 3 reactivity works at the object level, but deeply nested property changes may be missed.

**How to avoid:** Use `set()` or replace entire record objects when updating.

**Warning signs:** Condition durations not visually updating in UI after decrement.

### Pitfall 2: Round Reset Clears Too Much

**What goes wrong:** `New Round` action clears regeneration toggle but also accidentally resets other state.

**Why it happens:** Using `Object.assign()` or spread operator on wrong objects.

**How to avoid:** Explicitly clear only `regenerationDisabled`, preserve `creatureConditionDurations` across rounds.

**Warning signs:** Creature conditions disappear after round change.

### Pitfall 3: Protected Flag Persistence

**What goes wrong:** Protected condition stays protected even after duration ends or re-application.

**Why it happens:** Protected flag stored in condition instance but never cleared.

**How to avoid:** Protected flag is per-instance — track separately and clear on re-application.

**Warning signs:** Condition never decrements even after re-application.

### Pitfall 4: Drag-and-Drop State Sync

**What goes wrong:** Creature can be dragged while it's current turn or dead.

**Why it happens:** Drag disabled condition not synced with `isCurrentTurn` and `currentHP`.

**How to avoid:** Compute drag permission from reactive state: `HP > 0 && !isCurrentTurn`.

**Warning signs:** Dead creature or current turn creature can be reordered.

## Code Examples

### Extending Creature Type for Duration Tracking

```typescript
// Source: src/types/combat.ts extension
export interface Creature {
  id: string
  name: string
  maxHP: number
  currentHP: number
  ac: number
  initiative: number
  dexMod: number
  isCurrentTurn: boolean
  isDowned: boolean
  conditions: Condition[]
  conditionDurations?: Record<Condition, number> // New for Phase 2
}

// Per-creature duration map in store (recommended over Creature field)
// creatureConditionDurations: Record<string, Record<Condition, number>>
```

### Extending toggleCondition with Duration and Protected

```typescript
// Source: src/stores/combat.ts extension
type ConditionWithOptions = {
  condition: Condition
  duration?: number
  protected?: boolean
}

function toggleConditionWithOptions(
  id: string,
  conditionWithOptions: ConditionWithOptions
): void {
  const creature = creatures.value.find(c => c.id === id)
  if (!creature) return

  const { condition: conditionName, duration, protected: isProtected } = conditionWithOptions

  const index = creature.conditions.indexOf(conditionName)

  if (index > -1) {
    // Removing condition - also clear duration if tracked
    creature.conditions.splice(index, 1)
    if (creature.conditionDurations) {
      delete creature.conditionDurations[conditionName]
    }
  } else {
    // Adding condition
    creature.conditions.push(conditionName)

    // Set duration if provided
    if (duration !== undefined && duration > 0) {
      if (!creature.conditionDurations) {
        creature.conditionDurations = {}
      }
      creature.conditionDurations[conditionName] = duration

      // Protected flag tracked separately (not on creature, just for this instance)
      // Store in creatureConditionDurations as extended type or separate map
    }
  }
}
```

### Advance Round and Next Creature Actions

```typescript
// Source: src/composables/useInitiative.ts extension
export function advanceRound(
  creatures: Creature[],
  currentTurnIndex: number,
  roundNumber: number,
  onRoundAdvance: (round: number) => void
): { nextTurnIndex: number; newRoundNumber: number } {
  const hasAllActed = creatures.every(c => !c.isCurrentTurn)
  if (!hasAllActed) {
    throw new Error('Cannot advance round until all creatures have acted')
  }

  const newRoundNumber = roundNumber + 1
  onRoundAdvance(newRoundNumber)

  return {
    nextTurnIndex: 0, // Reset to first in initiative order
    newRoundNumber,
  }
}

export function nextCreature(
  currentIndex: number,
  totalCreatures: number
): number {
  if (totalCreatures === 0) return -1
  return (currentIndex + 1) % totalCreatures
}
```

### Per-Creature Regeneration Disabled Toggle

```typescript
// Source: Pattern from Pinia state management
function toggleRegenerationDisabled(creatureId: string): void {
  if (!regenerationDisabled.value[creatureId]) {
    regenerationDisabled.value[creatureId] = true
  } else {
    delete regenerationDisabled.value[creatureId]
  }
}

function clearRegenerationDisabledPerRound(): void {
  regenerationDisabled.value = {}
}
```

### Condition Duration Decrement Logic

```typescript
// Source: Combat mechanics implementation
function decrementConditionDurations(
  creatureId: string,
  durations: Record<Condition, number> | undefined,
  protectedConditions: Set<Condition> | undefined
): void {
  if (!durations) return

  for (const [condition, duration] of Object.entries(durations)) {
    // Skip protected conditions
    if (protectedConditions?.has(condition as Condition)) {
      continue
    }

    const newDuration = Math.max(0, duration - 1)
    durations[condition as Condition] = newDuration

    // Auto-remove when duration hits 0
    if (newDuration === 0) {
      const creature = creatures.value.find(c => c.id === creatureId)
      if (creature) {
        const index = creature.conditions.indexOf(condition as Condition)
        if (index > -1) {
          creature.conditions.splice(index, 1)
        }
        delete durations[condition as Condition]
      }
    }
  }
}
```

## State of the Art

### Condition Duration Patterns

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Global duration map | Per-creature duration map | Project Phase 2 | Better isolation, per-entity control |
| Protected conditions via metadata | Protected flag per instance | Project Phase 2 | Clearer semantics, no persistence issues |
| Round-based regeneration | Turn-based regeneration | Project Phase 2 | More granular control, per-turn toggles |

### Deprecated/outdated:

- **Vuex:** Pinia is the recommended state management for Vue 3 projects
- **Manual reactivity wrappers:** Use `ref()`, `reactive()`, `computed()` directly
- **Global condition tracking:** Per-creature tracking is more flexible and aligns with PF2e mechanics

## Open Questions

1. **How to handle regeneration/healing values?**
   - What we know: Context mentions "healing/regen/ongoing damage" effects
   - What's unclear: Where regeneration values come from (creature stat, spell effect, item)?
   - Recommendation: For Phase 2, assume placeholder values (e.g., +2 HP per turn) — refine in Phase 3 when Foundry import adds creature stats

2. **Should condition durations persist across rounds?**
   - What we know: Context specifies "Integer rounds only" and durations decrement each round
   - What's unclear: Whether durations should reset or persist when condition is reapplied
   - Recommendation: Per CONTEXT.md, protected flag is per-instance and not persisted on re-application — same pattern for durations (new duration on re-application)

3. **UI placement for New Round / Next Creature buttons?**
   - What we know: Two buttons required, New Round disabled until all acted
   - What's unclear: Exact layout (header? separate controls panel?)
   - Recommendation: Follow Context.md suggestion — header buttons similar to existing "+ Add Creature" and "Advance Turn"

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- src/stores/__tests__/combat.test.ts -t "Phase 2"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMBAT-05 | System auto-processes rounds with initiative order | unit | `npm test -t "advanceRound"` | ❌ Wave 0 |
| COMBAT-06 | System auto-decrements duration-based conditions each round | unit | `npm test -t "decrementDurations"` | ❌ Wave 0 |
| COMBAT-07 | System auto-calculates healing/regen and ongoing damage at turn start | unit | `npm test -t "setCurrentTurn effects"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- src/stores/__tests__/combat.test.ts -t "Phase 2" --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/stores/__tests__/combat.test.ts` — add tests for `advanceRound()`, `nextCreature()`, duration decrement, regeneration toggle
- [ ] Framework install: `npm test` — Vitest already configured

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- `src/types/combat.ts` — Current Creature, Condition, CombatState types
- `src/stores/combat.ts` — Existing combat store with creature management
- `src/composables/useInitiative.ts` — Initiative sorting and next creature logic
- `src/composables/useConditions.ts` — Condition definitions and formatting
- `vitest.config.ts` — Test configuration

### Secondary (MEDIUM confidence)
- Vue 3 Composition API patterns — reactive state, computed properties
- Pinia state management patterns — store extensions, reactive primitives

### Tertiary (LOW confidence)
- Pathfinder 2e condition duration mechanics — contextual understanding from project requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via package.json and existing codebase
- Architecture: HIGH - Pinia patterns well-established in Phase 1, clear extension path
- Pitfalls: MEDIUM - Based on Vue 3 reactivity principles, verified against existing store implementation

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (30 days for stable Vue/Pinia stack)
