# Phase 02 Plan 02 Summary Summary

## One-liner
Implement core store logic for duration decrement with protected conditions, turn effects with regeneration check, round advancement, and wire setCurrentTurn to trigger turn effects

## Phase
02-auto-round-processing

## Plan
02

## Subsystem
Combat Store

## Tags
- combat-store
- turn-effects
- duration-tracking
- round-advancement

## Dependency Graph

### Requires
- 02-01: Types and store extension for round tracking

### Provides
- Duration decrement for conditions with protected condition support
- Turn effects (healing/regen/damage) with regeneration disabled toggle
- Round advancement logic
- Initiative-based creature turn progression

## Tech Stack

### Added
- `decrementDurationsForCreature`: Decrements condition durations, skipping protected conditions
- `applyTurnEffects`: Applies turn effects only when regeneration is not disabled
- `advanceRound`: Increments round number, resets all creature turns, clears regenerationDisabled
- `nextCreature`: Moves isCurrentTurn to next creature with wrap-around
- `toggleRegenerationDisabled`: Per-creature regeneration toggle

### Patterns
- Pinia store with Vue 3 refs
- Reactive state management for combat tracking
- Protected conditions pattern for locked duration conditions

## Key Files

### Created/Modified
- `src/stores/combat.ts`: Core combat store with turn effect logic
- `src/stores/__tests__/combat.test.ts`: Comprehensive tests for new functions

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Protected conditions skip duration decrement | Per CONTEXT.md locked decision - conditions marked as protected (e.g., from Grapple) don't expire automatically |
| Regeneration disabled is per-creature | Allows DM to selectively disable regen for specific creatures during combat |
| Turn effects trigger at turn start | Per CONTEXT.md: when creature becomes current turn, first decrement durations, then apply healing/regen |
| setCurrentTurn uses sortedCreatures | Maintains initiative order consistency across turn transitions |

## Deviations from Plan

None - plan executed exactly as written.

## Test Results

All 29 combat store tests pass:
- decrementDurationsForCreature: 4 tests (decrement, remove at 0, protected skip, no durations)
- applyTurnEffects: 3 tests (healing when enabled, skip when disabled, ongoing damage)
- advanceRound: 3 tests (increment round, reset turns, clear regen toggle)
- nextCreature: 2 tests (move forward, wrap around)
- toggleRegenerationDisabled: 2 tests (enable, disable)
- setCurrentTurn with turn effects: 2 tests (decrement call, apply call)

## Metrics

- Duration: ~2 hours
- Lines added: ~550 (including tests)
- Tests added: 13 new tests
- Tests passing: 52/52 (no regressions)

## Self-Check: PASSED

All verification criteria met:
- decrementDurationsForCreature checks protectedConditions map before decrementing
- applyTurnEffects checks regenerationDisabled[creatureId] before applying effects
- advanceRound increments roundNumber, resets all !isCurrentTurn, clears regenerationDisabled
- nextCreature moves isCurrentTurn to next index with wrap-around
- toggleRegenerationDisabled toggles regenerationDisabled map entry
- setCurrentTurn calls decrementDurationsForCreature then applyTurnEffects
- npm test passes (52/52 tests)
