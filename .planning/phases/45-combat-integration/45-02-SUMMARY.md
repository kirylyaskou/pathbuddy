---
plan: 45-02
title: Integration — CharactersPage + Encounter Persistence
status: complete
completed: 2026-04-07
commit: b2aa2106
---

## What Was Built

1. **`CharactersPage.tsx` — rawJson bug fix**: replaced `PathbuilderExport` import with `PathbuilderBuild`; parse `rawJson` directly as `PathbuilderBuild` (the stored format); compute `ac = acProfBonus + acAbilityBonus + acItemBonus` and include it in the created `Combatant`.

2. **`encounter-persistence.ts`** — `loadEncounterIntoCombat` now restores `ac` with `...(c.ac != null ? { ac: c.ac } : {})` spread, placed between `isNPC` and the IWR spreads.

## Self-Check: PASSED

- [x] `CharactersPage.tsx` imports `PathbuilderBuild` (not `PathbuilderExport`)
- [x] `const build = JSON.parse(character.rawJson) as PathbuilderBuild` present
- [x] `calculatePCMaxHP(build)` — no `.build` accessor
- [x] AC computed from `build.acTotal.acProfBonus + build.acTotal.acAbilityBonus + build.acTotal.acItemBonus`
- [x] `ac,` included in Combatant literal
- [x] `...(c.ac != null ? { ac: c.ac } : {})` in `loadEncounterIntoCombat`

## key-files

### modified
- src/pages/characters/ui/CharactersPage.tsx
- src/features/combat-tracker/lib/encounter-persistence.ts
