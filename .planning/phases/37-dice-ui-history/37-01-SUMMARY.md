---
plan: 37-01
phase: 37-dice-ui-history
status: complete
completed: 2026-04-04
key-files:
  created:
    - src/shared/ui/dice-cube-animation.tsx
    - src/shared/ui/roll-result-toast.tsx
    - src/shared/ui/roll-toast-listener.tsx
    - src/shared/ui/roll-die20-button.tsx
  modified:
    - src/app/styles/globals.css
---

## Summary

Created 4 core dice UI components as shared/ui building blocks for Phase 37.

**DiceCubeAnimation** — CSS 3D cube with 6 faces, spins 300ms via `cube-spin` keyframe, then shows the rolled result in gold (`dice-cube-face--result`) on the front face via `animationend` handler.

**RollResultToast** — Pure presentational component rendering formula badge, grouped die value squares, optional modifier, separator, and gold total. Natural 20 shows "Critical!" suffix; natural 1 shows "Fumble" in pf-blood red.

**RollToastListener** — Null-render component subscribing to `useRollStore` rolls array length. Fires `toast.custom(<RollResultToast ...>)` positioned `bottom-right` for 4 seconds on each new roll.

**RollDie20Button** — Ghost icon button with `Dices` lucide icon. Calls `rollDice('1d20')` then `addRoll()` on click.

**globals.css** — Added `@keyframes cube-spin`, `.dice-cube-container`, `.dice-cube`, `.dice-cube-face` (6 face variants), `.dice-cube-face--result`, and extended existing `.golden-glow` with `text-shadow`.

## Self-Check: PASSED

- All 4 files created with correct named exports
- CSS keyframes and face classes added to globals.css
- DiceCubeAnimation has no @engine imports (pure presentational with just React)
- RollResultToast imports Roll from @engine and DiceCubeAnimation
- RollToastListener imports useRollStore and fires toast.custom
- RollDie20Button imports rollDice from @engine and calls rollDice('1d20')
- Pre-existing TS errors in unrelated files (CreatureStatBlock, EncounterCreatureSearchPanel) — not introduced by this plan
