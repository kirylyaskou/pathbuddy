-- 61-fix: retroactively clean stale "Effect:"/"Spell Effect:"/"Stance:"/"Aura:"
-- prefixes from already-synced spell_effects rows, then re-run the spell_id
-- FK resolution so effects whose name only matched after the strip get linked
-- to their parent spell (fixes category='spell' grouping in the picker).

UPDATE spell_effects
SET name = TRIM(SUBSTR(name, 14))
WHERE name LIKE 'Spell Effect:%';

UPDATE spell_effects
SET name = TRIM(SUBSTR(name, 8))
WHERE name LIKE 'Effect:%';

UPDATE spell_effects
SET name = TRIM(SUBSTR(name, 8))
WHERE name LIKE 'Stance:%';

UPDATE spell_effects
SET name = TRIM(SUBSTR(name, 6))
WHERE name LIKE 'Aura:%';

UPDATE spell_effects
SET spell_id = (
  SELECT s.id FROM spells s
  WHERE LOWER(TRIM(s.name)) = LOWER(TRIM(spell_effects.name))
  LIMIT 1
)
WHERE spell_id IS NULL;
