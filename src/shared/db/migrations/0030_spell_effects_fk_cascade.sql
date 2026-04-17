-- Phase 59 / live-fix: make spell_effects FKs cascade-safe.
--
-- PRAGMA foreign_keys=ON (enabled in shared/api/db.ts at init) now actually
-- enforces the FKs declared in 0025_spell_effects.sql. Two constraints broke
-- Foundry sync:
--   spell_effects.spell_id           -> spells(id)         (no ON DELETE)
--   encounter_combatant_effects.effect_id -> spell_effects(id) (no ON DELETE)
--
-- Sync's DELETE FROM spells (extractAndInsertSpells) tripped the first FK
-- whenever any spell_effects row referenced a spell being deleted:
--   error: FOREIGN KEY constraint failed (SQLITE_CONSTRAINT, code 787)
--
-- Rebuild both tables with sensible cascade policies:
--   spell_id -> NULL on parent delete (effect persists, parent reference lost)
--   effect_id -> CASCADE (encounter combatant_effect rows get removed with
--                         their source effect — user can re-apply from the
--                         rebuilt effects table)
--
-- SQLite cannot ALTER a column's FK policy, hence the rebuild-via-swap pattern.
-- All existing rows are preserved byte-for-byte; only the FK behavior changes.

CREATE TABLE spell_effects_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rules_json TEXT NOT NULL DEFAULT '[]',
  duration_json TEXT NOT NULL DEFAULT '{}',
  description TEXT,
  spell_id TEXT REFERENCES spells(id) ON DELETE SET NULL
);

INSERT INTO spell_effects_new (id, name, rules_json, duration_json, description, spell_id)
  SELECT id, name, rules_json, duration_json, description, spell_id FROM spell_effects;

DROP TABLE spell_effects;

ALTER TABLE spell_effects_new RENAME TO spell_effects;

CREATE INDEX IF NOT EXISTS idx_spell_effects_name ON spell_effects(name);
CREATE INDEX IF NOT EXISTS idx_spell_effects_spell ON spell_effects(spell_id);

CREATE TABLE encounter_combatant_effects_new (
  id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL,
  combatant_id TEXT NOT NULL,
  effect_id TEXT NOT NULL REFERENCES spell_effects(id) ON DELETE CASCADE,
  applied_at INTEGER NOT NULL,
  remaining_turns INTEGER NOT NULL
);

INSERT INTO encounter_combatant_effects_new
  (id, encounter_id, combatant_id, effect_id, applied_at, remaining_turns)
  SELECT id, encounter_id, combatant_id, effect_id, applied_at, remaining_turns
  FROM encounter_combatant_effects;

DROP TABLE encounter_combatant_effects;

ALTER TABLE encounter_combatant_effects_new RENAME TO encounter_combatant_effects;

CREATE INDEX IF NOT EXISTS idx_ece_encounter_combatant
  ON encounter_combatant_effects(encounter_id, combatant_id);
