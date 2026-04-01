CREATE TABLE IF NOT EXISTS party_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  party_level INTEGER NOT NULL DEFAULT 1,
  party_size INTEGER NOT NULL DEFAULT 4
);

INSERT OR IGNORE INTO party_config (id, party_level, party_size) VALUES (1, 1, 4);
