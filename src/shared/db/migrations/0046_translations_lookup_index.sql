-- Covering index for the warm-boot UPDATE that denormalises name_loc onto
-- entities. The correlated subquery filters on (kind, locale, name_key NOCASE);
-- the existing idx_translations_key has order (kind, name_key, level, locale),
-- so SQLite can only use the leading `kind` prefix and must scan all monster
-- rows to match locale — O(N) per entity row.
--
-- This index puts locale second so the lookup is O(log N) per entity:
--   WHERE kind = 'monster' AND locale = 'ru' AND name_key = ? COLLATE NOCASE
--
-- name_key uses NOCASE collation to match the COLLATE NOCASE clause in the
-- UPDATE subquery without requiring an extra UPPER/LOWER call.
CREATE INDEX IF NOT EXISTS idx_translations_kind_locale_name
  ON translations(kind, locale, name_key COLLATE NOCASE);
