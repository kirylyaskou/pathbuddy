---
phase: 14-stat-block-polish-2
plan: 01
subsystem: creature-model
tags: [types, mappers, token-handlers, damage, foundry]
provides:
  - Strike type with structured damage array (formula + type per entry)
  - Strike.group resolved from linked weapon items
  - Strike.additionalDamage for extra damage entries (e.g. Brute Strength)
  - spellDC/classDC extracted from creature JSON, added to CreatureStatBlockData
  - Four new Foundry token handlers: [[/act]], [[/br]]{display}, [[/br]], {Nfeet}
  - formatDamage() returns { formula, type }[] instead of joined string
affects: [creature-model, stat-block-component]
tech-stack:
  added: []
  patterns: [structured-data-over-strings, null-safe-json-access]
key-files:
  created: []
  modified:
    - src/entities/creature/model/types.ts
    - src/entities/creature/model/mappers.ts
key-decisions:
  - "group resolved via flags.pf2e.linkedWeapon lookup in items array rather than direct item.system.group (Foundry uses linked weapon reference)"
  - "formatDamage return type changed from string to array — downstream component must iterate, not render directly"
  - "join(' plus ') kept in @Damage token handler (different context, correct behavior)"
duration: "~30 min"
completed: "2026-04-02"
---

# Phase 14 Plan 01: Type Foundation + Mapper Changes Summary

**Data layer updated — Strike type is now structured, three token handlers added, Spell/Class DC extracted.**

## Performance
- **Duration:** ~30 min
- **Tasks:** 5 completed
- **Files modified:** 2

## Accomplishments
- `Strike` type updated: `damage: string` → `damage: { formula: string; type: string }[]`, added `group?: string` and `additionalDamage?`
- `CreatureStatBlockData` extended with `spellDC?: number` and `classDC?: number`
- `resolveFoundryTokens()` gets 4 new handlers: `[[/act slug]]` → capitalized action name, `[[/br expr]]{display}` → display text, `[[/br expr]]` → expr, `{Nfeet}` → "N feet"
- `formatDamage()` refactored to return `{ formula, type }[]` array (was joined string)
- Strike mapper now resolves `group` via `flags.pf2e.linkedWeapon` lookup and populates `additionalDamage` from `item.system.additionalDamage`
- Spell DC extracted from `system.attributes.spellDC.value`; Class DC from `attributes.classOrSpellDC.value` or `10 + proficiencies.classDC.totalModifier`

## Task Commits
1. **T1-T5: All tasks** — `17417221`

## Files Created/Modified
- `src/entities/creature/model/types.ts` — Strike type shape updated, spellDC/classDC added to CreatureStatBlockData
- `src/entities/creature/model/mappers.ts` — formatDamage() refactored, strike mapper updated, 4 token handlers added, spellDC/classDC extraction

## Decisions & Deviations
- T1 (Fighter's Fork verification): refs/ directory not present; weapon group resolved via `flags.pf2e.linkedWeapon` lookup pattern instead of direct `item.system.group`. This is the correct Foundry PF2e approach for melee/ranged items.
- `join(' plus ')` still present in the `@Damage` token handler — this is intentional and unrelated to the `formatDamage()` refactor.

## Next Phase Readiness
Plan 14-02 can consume the structured `Strike.damage` array, `group`, `additionalDamage`, `spellDC`, and `classDC` fields for visual rendering.
