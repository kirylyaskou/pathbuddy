-- Phase 62 / Plan 62-01
-- Track which prepared spell instances have been "cast" during a live combat.
-- Strike-through UX in combat-detail renders from this table.
--
-- spell_slot_key = `${spell_name}#${occurrence_index}` to disambiguate
-- duplicate prepared spells at the same rank (e.g., Fireball x2). Index is
-- computed at UI layer from the currently-visible spell list.
--
-- Reset on Refresh via resetEncounterCombat() — see shared/api/encounters.ts.

CREATE TABLE IF NOT EXISTS encounter_prepared_casts (
  encounter_id TEXT NOT NULL,
  combatant_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  rank INTEGER NOT NULL,
  spell_slot_key TEXT NOT NULL,
  PRIMARY KEY (encounter_id, combatant_id, entry_id, rank, spell_slot_key)
);

CREATE INDEX IF NOT EXISTS idx_epc_encounter
  ON encounter_prepared_casts(encounter_id);
CREATE INDEX IF NOT EXISTS idx_epc_combatant
  ON encounter_prepared_casts(combatant_id);
