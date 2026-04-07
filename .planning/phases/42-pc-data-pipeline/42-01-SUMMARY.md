---
id: 42-01
phase: 42
title: Engine PC Module — Types and HP Calculation
status: complete
self_check: PASSED
---

## What Was Built

Created `engine/pc/` module with full Pathbuilder 2e type coverage and HP calculation.

## Key Files

### Created
- `engine/pc/types.ts` — PathbuilderBuild, PathbuilderExport, PathbuilderAbilities, PathbuilderAttributes, PathbuilderProficiencies, PathbuilderSpellEntry interfaces
- `engine/pc/hp.ts` — calculatePCMaxHP pure function

### Modified
- `engine/index.ts` — added `// ── PC` section re-exporting all pc/types and calculatePCMaxHP

## Verification

- TypeScript: no errors in engine/ (pre-existing errors only in ConditionCombobox.tsx, unrelated)
- `engine/index.ts` exports `PathbuilderBuild`, `PathbuilderExport`, `calculatePCMaxHP`
- HP formula: `ancestryhp + (classhp + bonushp + conMod) * level`

## Notes

No deviations from plan. Exact file content as specified.
