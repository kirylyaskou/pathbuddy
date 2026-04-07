# Phase 02: Auto-Round Processing - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement automatic round processing for combat tracker with:
- Condition duration tracking and decrementing
- Round advancement controls (New Round / Next Creature buttons)
- Healing/regen/ongoing damage effects at turn start
- Protected conditions that skip duration decrement
- Drag-and-drop restrictions for creatures who have acted

</domain>

<decisions>
## Implementation Decisions

### Condition duration tracking
- Use separate duration map: `creature.conditionDurations: Record<Condition, number>`
- `toggleCondition(id, condition, { duration: 2 })` - explicit duration parameter when adding
- Auto-remove condition when duration hits 0
- Integer rounds only (no fractional durations)

### Protected conditions
- Add `protected` flag to condition instance: `toggleCondition(id, 'fear', { protected: true, duration: 3 })`
- Protected conditions skip duration decrement
- Protected flag is per-instance (not persisted on re-application)

### Round advancement UI
- Two buttons: `[New Round]` `[Next Creature]`
- `New Round` button disabled until all creatures have taken their turn
- `Next Creature` moves to next creature in initiative order (constant initiative values)
- After clicking `New Round`, reset to first creature in initiative list

### Drag-and-drop restrictions
- Can only drag creatures where: `HP > 0 && !isCurrentTurn`
- Locked (cannot drag): `isCurrentTurn || HP <= 0`

### Turn effect timing
- At start of creature's turn (when they become current turn):
  - First: decrement their duration conditions (skip protected)
  - Then: apply healing/regen/ongoing damage effects
- Healing/regen/ongoing damage only applies to current turn creature

### Regeneration disabled toggle
- Per-creature toggle button on each creature card: `[Regen Disabled: ON/OFF]`
- When ON: skip all healing/regen/ongoing damage for that creature
- Toggle is cleared when `New Round` is clicked (must re-enable each round)

### Round counter
- Visual round counter increments when `New Round` is clicked
- Round counter persists across rounds

### Claude's Discretion
- Exact UI layout for buttons and creature cards
- Visual styling for protected conditions
- Animation/transitions for turn changes
- How to display duration countdown on conditions

</decisions>

<canonical_refs>
## Canonical References

### Combat tracker
- `.planning/ROADMAP.md` — Phase 2 requirements (COMBAT-05, COMBAT-06, COMBAT-07)
- `.planning/REQUIREMENTS.md` — Full requirement specifications

### Existing code
- `src/types/combat.ts` — Current Creature, Condition, CombatState types
- `src/stores/combat.ts` — Existing combat store with creature management

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Creature` type (src/types/combat.ts) — extend with `conditionDurations` field
- `Condition` type (src/types/combat.ts) — add `protected` flag support
- `useCombatStore` (src/stores/combat.ts) — extend with round tracking and duration decrement logic
- `setCurrentTurn` function — triggers turn effects when creature becomes current

### Established Patterns
- Pinia store pattern for state management
- Vue 3 composition API with composables
- Reactive state with computed properties for current turn detection

### Integration Points
- Extend `Creature` interface to add `conditionDurations: Record<Condition, number>`
- Modify `toggleCondition` to accept optional `{ duration, protected }` options
- Add `roundNumber` state to `CombatState`
- Add `regenerationDisabled: Record<string, boolean>` to track per-creature toggle
- Create `advanceRound()` and `nextCreature()` functions in combat store
- Update creature card component to show regeneration toggle and handle drag restrictions

</code_context>

<specifics>
## Specific Ideas

- "Fear can't be dropped below 2 while something happening" — protected conditions for narrative control
- Initiative values constant after battle starts — no re-sorting during combat
- Drag-and-drop only for creatures who haven't acted — prevents reordering mid-combat
- Regeneration toggle for special cases (trolls damaged by fire, suppressed magic)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-auto-round-processing*
*Context gathered: 2026-03-18*
