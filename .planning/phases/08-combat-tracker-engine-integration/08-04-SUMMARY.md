---
phase: 08-combat-tracker-engine-integration
plan: 04
status: complete
started: 2026-04-01
completed: 2026-04-01
tasks_completed: 5
tasks_total: 5
---

## Summary

Turn advancement with engine-powered auto-decrement, previous turn reversal, toast notifications, and SQLite auto-save persistence. Completes the combat tracker gameplay loop.

## Key Files

### Created
- `src/features/combat-tracker/lib/turn-manager.ts` — advanceTurn, reverseTurn, canReverseTurn, clearTurnSnapshot
- `src/features/combat-tracker/lib/combat-persistence.ts` — setupAutoSave, teardownAutoSave, loadActiveCombat
- `src/features/combat-tracker/ui/TurnControls.tsx` — Next Turn / Previous Turn buttons

### Modified
- `src/features/combat-tracker/ui/CombatControls.tsx` — End Combat clears turn snapshot
- `src/features/combat-tracker/index.ts` — Added turn-manager, combat-persistence, TurnControls exports
- `src/pages/combat/ui/CombatPage.tsx` — useEffect for auto-save + combat load; TurnControls wired in

## Commit
`eda9ac6 feat(08-04): add turn advancement, auto-decrement, previous turn, auto-save persistence`

## Self-Check: PASSED
