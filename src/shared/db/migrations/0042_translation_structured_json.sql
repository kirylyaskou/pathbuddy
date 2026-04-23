-- Adds structured_json to the translations table: JSON.stringify'd output of
-- the monster HTML parser. Loader populates this column on next seed pass
-- (legacy rows remain NULL until that pass — UI falls back to EN for NULL).
--
-- Companion cleanup: the original translations migration shipped under the
-- filename 0038_translations.sql, which collided with 0038_spell_overrides_
-- heightened.sql (two migrations sharing the same NNNN prefix breaks the
-- intent of the lexicographic migration order even though both applied
-- cleanly in practice). The translations migration was renamed to
-- 0041_translations.sql. On existing installs the DELETE + INSERT OR IGNORE
-- below rewrites the _migrations marker so the renamed file is recognised as
-- already-applied; on fresh installs the DELETE is a harmless no-op and the
-- INSERT OR IGNORE is preempted by migrate.ts's own post-apply INSERT.
--
-- structured_json is nullable because legacy rows pre-date the parser-backed
-- seed — UI treats NULL and JSON.parse-failures equivalently (EN fallback).

DELETE FROM _migrations WHERE name = '0038_translations.sql';

INSERT OR IGNORE INTO _migrations (name) VALUES ('0041_translations.sql');

ALTER TABLE translations ADD COLUMN structured_json TEXT;
