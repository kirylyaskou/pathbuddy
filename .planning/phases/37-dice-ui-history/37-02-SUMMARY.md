---
plan: 37-02
phase: 37-dice-ui-history
status: complete
completed: 2026-04-04
key-files:
  created:
    - src/widgets/roll-history/ui/RollHistoryPanel.tsx
    - src/widgets/roll-history/index.ts
  modified:
    - src/widgets/app-shell/ui/AppHeader.tsx
---

## Summary

Created `RollHistoryPanel` widget and integrated all Phase 37 dice components into `AppHeader`.

**RollHistoryPanel** — 320px-wide panel reading from `useRollStore`. Shows rolls newest-first (`.reverse().slice(0, 50)`) with HH:MM timestamp, formula badge, die value breakdown, optional modifier, and gold total. "Clear History" button calls `clearRolls()`. Empty state shows "No rolls yet" message.

**AppHeader** — Updated to include:
1. `<RollToastListener />` — null-render first child, fires sonner toasts globally
2. `<RollDie20Button />` — ghost icon button, rolls 1d20 from any page
3. History `<Popover>` with `<History>` icon trigger → `<RollHistoryPanel />` in content (align=end, p-0, w-80)
4. Theme toggle (unchanged)

Dice UI is now globally accessible from every route in the app shell.

## Self-Check: PASSED

- RollHistoryPanel exports correct named export with useRollStore, clearRolls, reverse(), slice(0,50), "No rolls yet", "Clear History" strings
- roll-history/index.ts barrel export in place
- AppHeader imports and renders all 3 Phase 37 components
- Popover, PopoverTrigger, PopoverContent from shared/ui/popover
- Button order: RollDie20Button → Popover (history) → theme toggle
- Only pre-existing TypeScript errors (unused vars in unrelated files)
