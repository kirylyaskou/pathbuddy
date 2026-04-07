---
plan: 45-01
title: Foundation — Migration, Types, API
status: complete
completed: 2026-04-07
commit: d4bbf4b7
---

## What Was Built

Added `ac` field end-to-end through the data layer:

1. **Migration** `0022_encounter_combatant_ac.sql` — `ALTER TABLE encounter_combatants ADD COLUMN ac INTEGER` (non-destructive, existing NPC rows get NULL)
2. **`Combatant` interface** — added `ac?: number` with PC-only comment
3. **`EncounterCombatantRow` interface** — added `ac?: number`
4. **`saveEncounterCombatants`** — INSERT expanded to 15 columns with `c.ac ?? null`
5. **`loadEncounterCombatants`** — SELECT type annotation and row mapping both include `ac`

## Self-Check: PASSED

- [x] Migration file exists and contains `ALTER TABLE encounter_combatants ADD COLUMN ac INTEGER`
- [x] `Combatant.ac?: number` added
- [x] `EncounterCombatantRow.ac?: number` added
- [x] INSERT uses `hazard_ref, ac)` as 15th column with `c.ac ?? null`
- [x] Mapping uses `ac: r.ac ?? undefined`
- [x] No new TypeScript errors introduced (pre-existing errors unrelated to this plan)

## key-files

### created
- src/shared/db/migrations/0022_encounter_combatant_ac.sql

### modified
- src/entities/combatant/model/types.ts
- src/shared/api/encounters.ts
