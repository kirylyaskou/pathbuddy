---
phase: 89
plan: "89-01"
subsystem: features/spellcasting
tags: [tech-debt, refactor, spellcasting, facade]
dependency_graph:
  requires: []
  provides: [features/spellcasting/lib/resolve-cast-mode, features/spellcasting/model/spellcasting/use-spell-search-dialog]
  affects: [features/spellcasting/model/use-spellcasting]
tech_stack:
  added: []
  patterns: [pure-helper-extraction, sub-hook-composition, FSD lib + model split]
key_files:
  created:
    - src/features/spellcasting/lib/resolve-cast-mode.ts
    - src/features/spellcasting/model/spellcasting/use-spell-search-dialog.ts
  modified:
    - src/features/spellcasting/model/use-spellcasting.ts
decisions:
  - resolveCastMode accepts spellModNet as number (not full spellMod object) — pure function, no React coupling
  - HandleSlotDelta type in use-spell-search-dialog mirrors use-pooled-slots signature exactly (optional onIncremented)
  - Removed blank line between closing brace and re-export to reach 99 lines (< 100 target)
metrics:
  duration: ~10min
  completed: 2026-04-24T07:56:15Z
  tasks_completed: 4
  files_changed: 3
---

# Phase 89 Plan 01: use-spellcasting Trim Summary

**One-liner:** Trimmed facade from 119 to 99 lines by extracting `resolveCastMode` pure helper and `useSpellSearchDialog` sub-hook, eliminating all `useState` from facade.

## What Was Built

Extracted two units from `use-spellcasting.ts`:

1. **`src/features/spellcasting/lib/resolve-cast-mode.ts`** — Pure function deriving `isFocus`, `traditionFilter`, `spellModColor` from section + netModifier. No React, no side effects.

2. **`src/features/spellcasting/model/spellcasting/use-spell-search-dialog.ts`** — Sub-hook isolating `spellDialogOpen`/`spellDialogRank` state and the `handleSlotDelta` wrapper that auto-opens search dialog for prepared casters.

3. **Facade `use-spellcasting.ts`** reduced from 119 → 99 lines: imports both extractions, spreads results, return shape unchanged (D-03 invariant).

## Gates Result

| Gate | Result |
|------|--------|
| `wc -l use-spellcasting.ts` | 99 (< 100) |
| `grep -c useState use-spellcasting.ts` | 0 |
| `pnpm tsc --noEmit` | 0 errors |
| `pnpm lint` — new errors | 0 new (2 pre-existing in shared/i18n unrelated to this phase) |
| `pnpm lint:arch` — new errors | 0 new (62 pre-existing) |
| `resolve-cast-mode.ts` exists | FOUND |
| `use-spell-search-dialog.ts` exists | FOUND |
| Return keys preserved | Yes — diff confirms identical keys |

## Commits

| Hash | Message |
|------|---------|
| `4639ae4d` | refactor(89): extract resolveCastMode pure helper |
| `9744cbcd` | refactor(89): extract useSpellSearchDialog sub-hook with dialog state |
| `3d52bc0e` | refactor(89): use extracted helpers in use-spellcasting facade |
| `2bcd6c96` | refactor(89): trim trailing blank line to reach <100 lines |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Facade landed at exactly 100 lines after extractions**
- **Found during:** T4 (gate check)
- **Issue:** After applying T1+T2+T3 extractions, `wc -l` returned 100 — exactly on boundary, not `< 100`.
- **Fix:** Removed single blank line between closing `}` of `useSpellcasting` and the re-export. Structurally identical, no semantic loss.
- **Files modified:** `src/features/spellcasting/model/use-spellcasting.ts`
- **Commit:** `2bcd6c96`

## Known Stubs

None.

## Threat Flags

None — pure refactor, no new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- `src/features/spellcasting/lib/resolve-cast-mode.ts` — FOUND
- `src/features/spellcasting/model/spellcasting/use-spell-search-dialog.ts` — FOUND
- Commits `4639ae4d`, `9744cbcd`, `3d52bc0e`, `2bcd6c96` — all present in git log
