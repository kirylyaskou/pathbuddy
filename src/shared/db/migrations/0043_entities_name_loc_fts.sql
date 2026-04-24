-- Denormalize translated name onto entities + extend FTS5 to index it.
--
-- Why denormalize: FTS5 with external content can only index columns
-- that live on the content table. Joining translations at query time
-- with LIKE would lose FTS5 acceleration. Keeping a mirrored name_loc
-- column on entities lets existing MATCH queries include Russian names
-- with zero query changes.
--
-- Null semantics: name_loc is NULL until translations loader populates
-- it on the next app start (see shared/i18n/pf2e-content loader).
--
-- FTS5 limitation: ALTER TABLE adding a column to an FTS5 virtual table
-- is not supported. Must DROP and recreate, then REBUILD from content.

ALTER TABLE entities ADD COLUMN name_loc TEXT;

DROP TABLE IF EXISTS entities_fts;

CREATE VIRTUAL TABLE entities_fts USING fts5(
  name,
  name_loc,
  type,
  traits,
  rarity,
  content=entities,
  content_rowid=rowid
);

-- Reseed index from entities. name_loc column is NULL on every row at
-- this point; the translations loader will UPDATE + REBUILD once
-- bundled JSON is applied.
INSERT INTO entities_fts(entities_fts) VALUES('rebuild');
