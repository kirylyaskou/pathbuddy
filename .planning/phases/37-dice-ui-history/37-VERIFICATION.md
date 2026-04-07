---
phase: 37-dice-ui-history
status: passed
verified: 2026-04-04
---

## Phase 37: Dice UI + History — Verification

### Success Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Cube animation plays when a roll is triggered — simple fast-spin CSS effect | ✓ PASS | `@keyframes cube-spin` in globals.css; DiceCubeAnimation uses `animation: cube-spin 300ms ease-out forwards` |
| 2 | RollResultToast shows: formula, individual die values, modifier, total — dismissible | ✓ PASS | RollResultToast renders formula Badge, die value squares, conditional modifier, Separator, and gold total; sonner `duration: 4000` |
| 3 | RollHistoryPanel shows all rolls for the session; clearable; collapsible | ✓ PASS | RollHistoryPanel with clearRolls(), newest-first 50-roll cap, in Popover (collapsible dropdown) |
| 4 | Panel integrated into layout without breaking existing panels | ✓ PASS | Integrated into AppHeader (global app shell, all pages) — exceeds combat-page-only requirement |

### Must-Have Truths

**Plan 37-01:**
- [x] Cube spins 360deg in 300ms → `rotateX(360deg) rotateY(360deg)` in keyframe, `300ms ease-out`
- [x] Toast shows formula badge, die values in bordered squares, modifier, gold total
- [x] Natural 20: "Critical!" in pf-gold; natural 1: "Fumble" in pf-blood
- [x] RollDie20Button calls `rollDice('1d20')` and `addRoll()`
- [x] RollToastListener returns `null`, fires `toast.custom()` on new roll

**Plan 37-02:**
- [x] RollHistoryPanel: newest-first, `.slice(0, 50)`, Popover dropdown from AppHeader
- [x] Each row: HH:MM timestamp, formula badge, die breakdown, modifier, gold total
- [x] Clear History button calls `clearRolls()`, disabled when empty
- [x] Empty state: "No rolls yet" + "Rolls will appear here during the session."
- [x] AppHeader order: RollToastListener → RollDie20Button → Popover (History) → ThemeToggle
- [x] Globally accessible from any page via AppHeader

### Artifacts

| File | Status |
|------|--------|
| src/shared/ui/dice-cube-animation.tsx | ✓ Created |
| src/shared/ui/roll-result-toast.tsx | ✓ Created |
| src/shared/ui/roll-toast-listener.tsx | ✓ Created |
| src/shared/ui/roll-die20-button.tsx | ✓ Created |
| src/widgets/roll-history/ui/RollHistoryPanel.tsx | ✓ Created |
| src/widgets/roll-history/index.ts | ✓ Created |
| src/widgets/app-shell/ui/AppHeader.tsx | ✓ Updated |
| src/app/styles/globals.css | ✓ Updated |

### TypeScript

Pre-existing errors only (2 unused-variable errors in CreatureStatBlock.tsx and EncounterCreatureSearchPanel.tsx — not introduced by this phase). All new files type-check cleanly.

### Human Verification Items

1. Launch app and click the d20 button in the header — verify cube animation plays and toast appears bottom-right with formula + die breakdown + gold total
2. Roll nat20 (d20 result = 20) — verify "Critical!" suffix in gold
3. Roll nat1 (d20 result = 1) — verify "Fumble" suffix in pf-blood red
4. Click History icon — verify Popover opens showing roll history newest-first
5. Click "Clear History" — verify panel empties and shows empty state
6. Navigate to a different page (e.g., Bestiary) — verify d20 button and history still work globally
