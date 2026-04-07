---
phase: 45
status: passed
verified: 2026-04-07
plans_checked: 3
must_haves_total: 16
must_haves_verified: 16
human_verification: []
gaps: []
---

## Phase Goal

Wire Pathbuilder AC into the combat tracker: persist it in SQLite, compute it when adding a PC to combat, restore it when loading an encounter, display it in CombatantDetail, and remove the superseded AddPCDialog flow.

## Must-Haves Verification

### 45-01: Foundation — Migration, Types, API

| # | Must-Have | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Migration file with `ALTER TABLE encounter_combatants ADD COLUMN ac INTEGER` | ✓ | `src/shared/db/migrations/0022_encounter_combatant_ac.sql` |
| 2 | `Combatant.ac?: number` field added | ✓ | `src/entities/combatant/model/types.ts` |
| 3 | `EncounterCombatantRow.ac?: number` field added | ✓ | `src/shared/api/encounters.ts` |
| 4 | `saveEncounterCombatants` INSERT includes `ac` as 15th column | ✓ | `hazard_ref, ac)` in INSERT |
| 5 | `loadEncounterCombatants` maps `ac: r.ac ?? undefined` | ✓ | Confirmed in file |
| 6 | No new TypeScript errors | ✓ | Pre-existing errors only (PCSheetPanel, CreatureStatBlock, etc.) |

### 45-02: Integration — CharactersPage + Encounter Persistence

| # | Must-Have | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `handleAddToCombat` parses `rawJson` as `PathbuilderBuild` | ✓ | `const build = JSON.parse(character.rawJson) as PathbuilderBuild` |
| 2 | AC computed correctly from `acTotal` fields | ✓ | `build.acTotal.acProfBonus + build.acTotal.acAbilityBonus + build.acTotal.acItemBonus` |
| 3 | `ac` included in Combatant created by `handleAddToCombat` | ✓ | `ac,` in Combatant literal |
| 4 | `loadEncounterIntoCombat` restores `ac` | ✓ | `...(c.ac != null ? { ac: c.ac } : {})` |
| 5 | No new TypeScript errors | ✓ | Pre-existing errors only |

### 45-03: Cleanup + UI

| # | Must-Have | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `AddPCDialog.tsx` deleted | ✓ | File does not exist |
| 2 | `createPCCombatant` removed from `initiative.ts` and `index.ts` | ✓ | 0 occurrences in both files |
| 3 | `CombatPage.tsx` has zero references to `AddPCDialog` | ✓ | 0 occurrences |
| 4 | PC combatants show `· AC {N}` conditional rendering | ✓ | `!combatant.isNPC && combatant.ac !== undefined` guard present |
| 5 | NPC combatants unaffected — `!combatant.isNPC` guard present | ✓ | Confirmed |
| 6 | No new TypeScript errors | ✓ | Pre-existing errors only |

## Requirement Traceability

| Req ID | Status |
|--------|--------|
| CMB-01 | ✓ Verified — AC persisted and restored in encounter save/load |
| CMB-02 | ✓ Verified — AC displayed in CombatantDetail for PC combatants |

## Notes

- Pre-existing TypeScript errors in `PCSheetPanel.tsx`, `CreatureStatBlock.tsx`, `ConditionCombobox.tsx`, `EncounterCreatureSearchPanel.tsx`, `roll-result-drawer.tsx` are from prior phases and unrelated to this phase.
- The rawJson bug fix (parsing as `PathbuilderBuild` instead of `PathbuilderExport`) is a correctness fix — `exp.build` was `undefined` at runtime since upsertCharacter stores the build directly.
- Human testing recommended: add a Pathbuilder-imported character to combat and verify AC appears in CombatantDetail header.
