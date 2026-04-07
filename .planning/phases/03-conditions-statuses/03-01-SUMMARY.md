---
phase: 03-conditions-statuses
plan: 01
subsystem: engine
tags: [pf2e, conditions, iwr, damage-types, typescript, conditions-effects]

# Dependency graph
requires:
  - phase: 01-cleanup-architecture
    provides: /engine directory, engine/types.ts, engine/damage/damage.ts, engine/damage/iwr.ts, engine/conditions/conditions.ts
  - phase: 02-reference-analysis
    provides: GAP-ANALYSIS.md identifying 49 missing immunity types, 17 missing weakness types, 14 missing resistance types, holy/unholy damage types, and condition effect map requirements
provides:
  - Creature interface in engine/types.ts (immunities, conditions, hp, level, deathDoor)
  - engine/conditions/condition-effects.ts (CONDITION_EFFECTS map, CONDITION_OVERRIDES map, CONDITION_GROUPS_EXTENDED, EXCLUSIVE_GROUPS)
  - holy and unholy damage types in engine/damage/damage.ts
  - Expanded IWR type arrays in engine/damage/iwr.ts (CONDITION_IMMUNITY_TYPES, EFFECT_IMMUNITY_TYPES, new weakness/resistance strings, all-damage special handling)
affects: [03-conditions-statuses plan 02, 03-conditions-statuses plan 03, all future phases consuming Creature interface or IWR types]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Data-driven condition effect map: static CONDITION_EFFECTS record maps ConditionSlug to ConditionEffect[] (modifier, grant, drained-hp effect types)"
    - "IWR type array expansion via sub-array spreads: CONDITION_IMMUNITY_TYPES and EFFECT_IMMUNITY_TYPES spread into IMMUNITY_TYPES"
    - "Selector strings follow Foundry convention: 'all', 'dex-based', ['str-based', 'str-damage'], etc."
    - "EXCLUSIVE_GROUPS Set pattern: only detection and attitudes enforce mutual exclusivity (D-08/D-09)"
    - "all-damage early return: first check in typeMatches() handles the all-damage special case"

key-files:
  created:
    - engine/conditions/condition-effects.ts
  modified:
    - engine/damage/damage.ts
    - engine/damage/iwr.ts
    - engine/types.ts

key-decisions:
  - "CONDITION_EFFECTS covers 13 conditions (frightened, sickened, clumsy, enfeebled, stupefied, drained, blinded, unconscious, grabbed, dying, paralyzed, restrained, off-guard) with 15 FlatModifier effects and 5 GrantItem chains — all others are purely narrative"
  - "abilities and senses groups are NOT mutually exclusive (D-08, D-09) — only detection and attitudes enforce exclusivity; EXCLUSIVE_GROUPS = Set(['detection','attitudes'])"
  - "all-damage added to RESISTANCE_TYPES only — not IMMUNITY_TYPES or WEAKNESS_TYPES per Pitfall 6 in plan"
  - "holy/unholy categorized as 'other' damage type alongside spirit/mental/poison/untyped — confirmed PF2e Remaster types"
  - "Creature interface is minimal per D-17 — no AC, saves, abilities; those are Phase 4 scope"

patterns-established:
  - "Contracts-first approach: all data maps and type arrays in plan 01 before behavioral code in plans 02/03"
  - "IWR type sub-arrays (CONDITION_IMMUNITY_TYPES, EFFECT_IMMUNITY_TYPES) exported for downstream consumers"

requirements-completed: [ENG-01]

# Metrics
duration: 9min
completed: 2026-03-31
---

# Phase 03 Plan 01: Condition & IWR Data Contracts Summary

**Contracts-first foundation: Creature interface, CONDITION_EFFECTS data map (13 conditions), expanded IWR type arrays (69+ immunity types, 15 weakness extensions, 13 resistance extensions + all-damage), and holy/unholy damage types established for plans 02/03 to code against**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-31T07:07:37Z
- **Completed:** 2026-03-31T07:16:08Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added `holy` and `unholy` to `OTHER_DAMAGE_TYPES` and `DAMAGE_TYPE_CATEGORY` in engine/damage/damage.ts — now 18 damage types total
- Expanded IWR type arrays with `CONDITION_IMMUNITY_TYPES` (24 entries) + `EFFECT_IMMUNITY_TYPES` (25 entries) spread into `IMMUNITY_TYPES`; added 15 new weakness strings and 13 new resistance strings plus `all-damage`; added `all-damage` early return to `typeMatches()`
- Created engine/conditions/condition-effects.ts with `CONDITION_EFFECTS` (13 conditions), `CONDITION_OVERRIDES` (7 entries), `CONDITION_GROUPS_EXTENDED` (5 groups), `EXCLUSIVE_GROUPS` (2 entries), and all associated TypeScript types
- Added `Creature` interface to engine/types.ts with imports for `Immunity` and `ConditionManager`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add holy/unholy damage types and expand IWR type arrays** - `0c21772` (feat)
2. **Task 2: Create condition-effects.ts with CONDITION_EFFECTS map, overrides, and group metadata** - `9375458` (feat)
3. **Task 3: Add Creature interface to engine/types.ts** - `c28c74f` (feat)

## Files Created/Modified
- `engine/damage/damage.ts` — Added `'holy'` and `'unholy'` to `OTHER_DAMAGE_TYPES`, added `holy: 'other'` and `unholy: 'other'` to `DAMAGE_TYPE_CATEGORY`
- `engine/damage/iwr.ts` — Added `CONDITION_IMMUNITY_TYPES` (24), `EFFECT_IMMUNITY_TYPES` (25), expanded `IMMUNITY_TYPES` to spread both, expanded `WEAKNESS_TYPES` (+15 strings), expanded `RESISTANCE_TYPES` (+13 strings + `all-damage`), added `all-damage` early return to `typeMatches()`
- `engine/conditions/condition-effects.ts` — New file: `CONDITION_EFFECTS` (13 conditions, 15 FlatModifier + 5 GrantItem), `CONDITION_OVERRIDES` (7 entries), `CONDITION_GROUPS_EXTENDED` (5 groups), `EXCLUSIVE_GROUPS` (Set with 'detection'+'attitudes'), TypeScript effect types
- `engine/types.ts` — Added `Creature` interface with 5 fields, imports for `Immunity` and `ConditionManager`

## Decisions Made

- Abilities and senses groups are informational-only (non-exclusive) per D-08/D-09; only detection and attitudes remain mutually exclusive
- `all-damage` added to `RESISTANCE_TYPES` only — not `IMMUNITY_TYPES` or `WEAKNESS_TYPES` (per plan's Pitfall 6)
- `holy` and `unholy` categorized as `'other'` damage type — confirmed PF2e Remaster types per Phase 2 research
- `Creature` interface kept minimal per D-17 — no AC, saves, abilities, speed, attacks, traits (Phase 4 scope)
- `CONDITION_EFFECTS` covers exactly 13 conditions — all other conditions are purely narrative and have no mechanical engine effect

## Deviations from Plan

None - plan executed exactly as written. Worktree branch was reset to master HEAD before execution to pick up engine/ directory (worktree was created from older commit).

## Known Stubs

None. This plan creates only types, constants, and data structures (no UI rendering, no data flows).

---
*Phase: 03-conditions-statuses*
*Completed: 2026-03-31*
