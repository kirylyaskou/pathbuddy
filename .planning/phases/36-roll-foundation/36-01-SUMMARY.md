---
plan: 36-01
phase: 36-roll-foundation
status: complete
self_check: PASSED
completed: 2026-04-04
commit: e84eb985
---

## Summary

Created the pure TypeScript dice rolling foundation and session-only roll store. All non-UI dice infrastructure is in place for Phase 37 (Dice UI) and Phase 38 (Clickable Rolls).

## What Was Built

- **engine/dice/dice.ts** — `Roll`, `DiceEntry`, `ParsedFormula` types; `parseFormula` (tokenizes PF2e formula strings with TOKEN_RE), `rollDice` (random die rolls with crypto.randomUUID IDs), `heightenFormula` (spell rank scaling via string append)
- **engine/index.ts** — barrel re-exports for all dice types and functions
- **src/shared/model/roll-store.ts** — Zustand + immer store with roll history (`addRoll`, `clearRolls`) and MAP tracking (`incrementAttackCount`, `resetAttackCount`, `resetAllMAP`)

## Key Decisions

- `heightenFormula` uses simple string append (`base + '+' + add`) rather than like-dice combining — `rollDice` handles the resulting formula correctly
- `roll-store.ts` is session-only (no `persist` middleware) per D-05
- `Roll` imported via `@engine` barrel alias in roll-store (not direct path)

## Verification

- `npx tsc --noEmit` — 0 new errors (2 pre-existing unused-var warnings in unrelated files)
- All acceptance criteria from PLAN.md confirmed via grep
- engine/dice/dice.ts has zero imports from `src/` or `@/`

## key-files

created:
  - engine/dice/dice.ts
  - src/shared/model/roll-store.ts
modified:
  - engine/index.ts
