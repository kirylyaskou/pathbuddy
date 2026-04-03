-- Purge all synced entity data to remove Starfinder content.
-- Next sync will re-import PF2e-only data thanks to the Rust path filter.
DELETE FROM entities;
DELETE FROM entities_fts;
DELETE FROM items;
DELETE FROM items_fts;
DELETE FROM creature_items;
DELETE FROM spells;
DELETE FROM spells_fts;
DELETE FROM creature_spellcasting_entries;
DELETE FROM creature_spell_lists;
DELETE FROM conditions;
DELETE FROM hazards;
DELETE FROM actions;

-- Clear sync metadata so the app knows data needs re-syncing
DELETE FROM sync_metadata
