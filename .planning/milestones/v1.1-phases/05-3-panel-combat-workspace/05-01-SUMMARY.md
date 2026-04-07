---
phase: 05-3-panel-combat-workspace
plan: 01
subsystem: combat-store
tags: [combat, store, types, tdd, auto-numbering, weak-elite]
dependency_graph:
  requires: []
  provides: [addFromBrowser, Creature.tier]
  affects: [src/stores/combat.ts, src/types/combat.ts]
tech_stack:
  added: []
  patterns: [escapeRegex helper, nextNumberFor helper, buildNames helper, Math.max(1, hp) floor guard]
key_files:
  created: []
  modified:
    - src/types/combat.ts
    - src/stores/combat.ts
    - src/stores/__tests__/combat.test.ts
decisions:
  - "05-01: buildNames uses existingCount > 0 threshold to decide whether to number — single creature with no matches gets no suffix, matching the must-have truth"
  - "05-01: nextNumberFor treats un-suffixed match (m[1] undefined) as number 1, so next always starts at 2 after a bare-name creature exists"
  - "05-01: adjustedMaxHP = Math.max(1, baseMaxHP + hpDelta) — prevents 0 or negative HP on weak creatures with very low base HP"
  - "05-01: Tier prefix pattern in regex uses non-capturing group (?:Elite: |Weak: )? so base name pool is shared across all tiers"
metrics:
  duration_minutes: 8
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_changed: 3
requirements: [WORK-03, WORK-04, WORK-05]
requirements_completed: [WORK-03, WORK-04, WORK-05]
---

# Phase 05 Plan 01: addFromBrowser Action and Creature Tier Field Summary

**One-liner:** Creature type extended with optional `tier` field and `addFromBrowser(entity, qty, tier)` store action added with cross-tier auto-numbering, regex-safe name matching, and weak/elite HP adjustment via `getHpAdjustment`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend Creature type with optional tier field | 2eeff91 | src/types/combat.ts |
| 2 | Add addFromBrowser store action with auto-numbering and tests | 29b9924 | src/stores/combat.ts, src/stores/__tests__/combat.test.ts |

## What Was Built

**Task 1 — Creature type extension:**
- Added `import type { WeakEliteTier } from '@/types/entity'` to `src/types/combat.ts`
- Added `tier?: WeakEliteTier` to the `Creature` interface (optional, fully backward-compatible)

**Task 2 — addFromBrowser action:**
- Three private helper functions inside `defineStore` callback: `escapeRegex`, `nextNumberFor`, `buildNames`
- `addFromBrowser(entity: EntityResult, qty: number, tier: WeakEliteTier)` action exported from store
- Auto-numbering logic: qty=1 with no existing same-name creatures gets no suffix; qty>1 or existing matches trigger sequential numbering starting at `nextNumberFor(baseName)`
- Cross-tier numbering: the regex `^(?:Elite: |Weak: )?{baseName}(?: \d+)?$` matches names across all tier prefixes so the number pool is shared
- HP computed as `Math.max(1, baseMaxHP + getHpAdjustment(tier, level))` with floor guard
- Defaults from rawData: maxHP=0 (then clamped to 1), ac=10, dexMod=0

## Test Results

- 48 tests pass, 0 failures
- 11 new tests in `describe('addFromBrowser', ...)` covering:
  - qty=1 no suffix, qty=3 numbered, continuation numbering
  - Cross-tier pool sharing
  - Elite/weak prefix and HP delta
  - Full health on entry (currentHP = maxHP)
  - sourceId, tier, initiative fields
  - Minimal rawData fallbacks
  - Elite qty>1 prefix applied to all names
  - Regex special chars in entity names (Dragon (Adult))

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/types/combat.ts: contains `tier?: WeakEliteTier` - FOUND
- src/stores/combat.ts: contains `function addFromBrowser` - FOUND
- src/stores/combat.ts: contains `function escapeRegex` - FOUND
- src/stores/combat.ts: contains `function nextNumberFor` - FOUND
- src/stores/combat.ts: contains `function buildNames` - FOUND
- src/stores/__tests__/combat.test.ts: contains `describe('addFromBrowser'` - FOUND
- Commits 2eeff91, 29b9924 - FOUND
