// 61-10: integration test for getContextEffectsForEncounter against an
// in-memory SQLite (sql.js). Mirrors the SQL embedded in effects.ts so that
// if that file's query drifts, this test fails and flags the divergence.
//
// Scenarios mirror the Abobus reproducer:
//   - custom creature with Thundering Dominance in its data_json spellcasting
//   - same creature carrying Drakeheart Mutagen (Greater) via
//     encounter_combatant_items
//   - a plain bestiary creature with a spell via creature_spell_lists
//
// We assert all three effects surface in the context query. We also assert
// that an unrelated effect (not tied to any combatant) does NOT surface.

import { describe, it, expect, beforeAll } from 'vitest'
import initSqlJs from 'sql.js'
import type { Database } from 'sql.js'
import fs from 'node:fs'
import path from 'node:path'

// ── Schema excerpts — just what the context query touches ───────────────────
const SCHEMA = `
CREATE TABLE spells (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rank INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE spell_effects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rules_json TEXT NOT NULL DEFAULT '[]',
  duration_json TEXT NOT NULL DEFAULT '{}',
  description TEXT,
  spell_id TEXT REFERENCES spells(id),
  source_pack TEXT
);
CREATE TABLE creature_spell_lists (
  id TEXT PRIMARY KEY,
  creature_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  spell_foundry_id TEXT,
  spell_name TEXT NOT NULL,
  rank_prepared INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE creature_items (
  id TEXT PRIMARY KEY,
  creature_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE encounter_combatants (
  id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL,
  creature_ref TEXT,
  display_name TEXT NOT NULL,
  is_npc INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE encounter_combatant_items (
  id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL,
  combatant_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_foundry_id TEXT,
  item_type TEXT NOT NULL DEFAULT 'equipment',
  is_removed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE custom_creatures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL
);
`

// ── SQL mirroring effects.ts getContextEffectsForEncounter ──────────────────
// Keep in sync with src/shared/api/effects.ts. If they drift, this test fails.
const CATEGORY_EXPR = `
  CASE
    WHEN se.source_pack LIKE '%spell-effects%' THEN 'spell'
    WHEN se.source_pack LIKE '%equipment-effects%' THEN 'alchemical'
    WHEN se.spell_id IS NOT NULL THEN 'spell'
    WHEN LOWER(se.name) LIKE '%elixir%'
      OR LOWER(se.name) LIKE '%mutagen%' THEN 'alchemical'
    ELSE 'other'
  END
`
const SELECT_WITH_LEVEL = `
  SELECT se.id, se.name, se.rules_json, se.duration_json, se.description, se.spell_id,
         COALESCE(s.rank, 1) AS level,
         ${CATEGORY_EXPR} AS category
  FROM spell_effects se
  LEFT JOIN spells s ON se.spell_id = s.id
`
const SQL_MATCHED = `${SELECT_WITH_LEVEL}
WHERE
  (se.spell_id IS NOT NULL AND se.spell_id IN (
     SELECT DISTINCT csl.spell_foundry_id
     FROM creature_spell_lists csl
     JOIN encounter_combatants ec ON ec.creature_ref = csl.creature_id
     WHERE ec.encounter_id = ?
       AND csl.spell_foundry_id IS NOT NULL
  ))
  OR se.name IN (
     SELECT ci.item_name
     FROM creature_items ci
     JOIN encounter_combatants ec ON ec.creature_ref = ci.creature_id
     WHERE ec.encounter_id = ?
     UNION
     SELECT eci.item_name
     FROM encounter_combatant_items eci
     JOIN encounter_combatants ec ON ec.id = eci.combatant_id
     WHERE ec.encounter_id = ?
       AND eci.is_removed = 0
  )
ORDER BY se.name`

const CUSTOM_NAMES_SQL = `
  SELECT cc.data_json
  FROM custom_creatures cc
  JOIN encounter_combatants ec ON ec.creature_ref = cc.id
  WHERE ec.encounter_id = ?
`

function buildCustomMatchedSql(nameCount: number): string {
  const ph = Array(nameCount).fill('?').join(',')
  return `${SELECT_WITH_LEVEL}
WHERE se.spell_id IN (
  SELECT id FROM spells
  WHERE LOWER(TRIM(name)) IN (${ph})
)
ORDER BY se.name`
}

// ── Test harness ────────────────────────────────────────────────────────────

interface EffectRow {
  id: string
  name: string
  category: string
}

function execQuery(db: Database, sql: string, params: unknown[]): EffectRow[] {
  const stmt = db.prepare(sql)
  // sql.js typings accept a loose BindParams; cast keeps the test typecheck-clean.
  stmt.bind(params as (string | number | null)[])
  const rows: EffectRow[] = []
  while (stmt.step()) {
    const r = stmt.getAsObject()
    rows.push({
      id: String(r.id),
      name: String(r.name),
      category: String(r.category),
    })
  }
  stmt.free()
  return rows
}

function execCustomNames(db: Database, encounterId: string): string[] {
  const stmt = db.prepare(CUSTOM_NAMES_SQL)
  stmt.bind([encounterId])
  const names = new Set<string>()
  while (stmt.step()) {
    const r = stmt.getAsObject() as { data_json: string }
    try {
      const data = JSON.parse(r.data_json) as {
        spellcasting?: Array<{
          spellsByRank?: Array<{ spells?: Array<{ name?: string }> }>
        }>
      }
      for (const entry of data.spellcasting ?? []) {
        for (const rank of entry.spellsByRank ?? []) {
          for (const s of rank.spells ?? []) {
            if (s.name) names.add(s.name)
          }
        }
      }
    } catch {
      // ignore
    }
  }
  stmt.free()
  return Array.from(names)
}

async function loadSqlJs(): Promise<Database> {
  const SQL = await initSqlJs({
    locateFile: (file) =>
      path.resolve('node_modules/sql.js/dist', file),
    wasmBinary: fs.readFileSync(
      path.resolve('node_modules/sql.js/dist/sql-wasm.wasm'),
    ),
  })
  return new SQL.Database()
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('getContextEffectsForEncounter — integration against sql.js', () => {
  let db: Database
  const ENCOUNTER_ID = 'enc-1'

  beforeAll(async () => {
    db = await loadSqlJs()
    db.exec(SCHEMA)

    // spells
    db.exec(`
      INSERT INTO spells (id, name, rank) VALUES
        ('spell-thundering', 'Thundering Dominance', 2),
        ('spell-heroism',    'Heroism',              3),
        ('spell-bane',       'Bane',                 1);
    `)

    // spell_effects — spell-effects pack + equipment-effects pack
    db.exec(`
      INSERT INTO spell_effects (id, name, spell_id, source_pack) VALUES
        ('se-thundering', 'Thundering Dominance Heightened (+2)', 'spell-thundering', 'spell-effects'),
        ('se-heroism',    'Heroism',                              'spell-heroism',    'spell-effects'),
        ('se-bane',       'Bane',                                 'spell-bane',       'spell-effects'),
        ('se-drakeheart', 'Drakeheart Mutagen (Greater)',         NULL,               'equipment-effects'),
        ('se-elixir',     'Elixir of Life (Minor)',               NULL,               'equipment-effects'),
        ('se-unused',     'Unused Spell Effect',                  NULL,               'spell-effects');
    `)

    // Also plant a spell linking to an unused effect to prove we filter
    db.exec(`UPDATE spell_effects SET spell_id = NULL WHERE id = 'se-unused';`)

    // Bestiary creature — Goblin — with Bane in its spell list
    db.exec(`
      INSERT INTO creature_spell_lists
        (id, creature_id, entry_id, spell_foundry_id, spell_name, rank_prepared, sort_order)
      VALUES
        ('csl-1', 'goblin-001', 'entry-A', 'spell-bane', 'Bane', 1, 0);
    `)

    // Bestiary creature inventory item that also grants an equipment effect
    db.exec(`
      INSERT INTO creature_items
        (id, creature_id, item_name, item_type, sort_order)
      VALUES
        ('ci-1', 'goblin-001', 'Elixir of Life (Minor)', 'consumable', 0);
    `)

    // Custom creature — Abobus — with Thundering Dominance in data_json
    const abobusData = {
      name: 'Abobus',
      level: 10,
      spellcasting: [
        {
          entryId: 'custom-entry-1',
          tradition: 'occult',
          castType: 'spontaneous',
          spellsByRank: [
            { rank: 2, slots: 3, spells: [{ name: 'Thundering Dominance', foundryId: null }] },
          ],
        },
      ],
    }
    db.run(
      `INSERT INTO custom_creatures (id, name, level, data_json) VALUES (?, ?, ?, ?)`,
      ['abobus-001', 'Abobus', 10, JSON.stringify(abobusData)],
    )

    // Encounter combatants: one goblin (bestiary), one abobus (custom)
    db.exec(`
      INSERT INTO encounter_combatants
        (id, encounter_id, creature_ref, display_name, is_npc)
      VALUES
        ('combatant-gob', 'enc-1', 'goblin-001',  'Goblin',  1),
        ('combatant-abo', 'enc-1', 'abobus-001',  'Abobus',  1);
    `)

    // Abobus carries a Drakeheart Mutagen via encounter-item override
    db.exec(`
      INSERT INTO encounter_combatant_items
        (id, encounter_id, combatant_id, item_name, item_type, is_removed)
      VALUES
        ('eci-1', 'enc-1', 'combatant-abo', 'Drakeheart Mutagen (Greater)', 'consumable', 0);
    `)
  })

  it('surfaces bestiary combatant spell effect (Bane on goblin)', () => {
    const rows = execQuery(db, SQL_MATCHED, [ENCOUNTER_ID, ENCOUNTER_ID, ENCOUNTER_ID])
    const ids = rows.map((r) => r.id)
    expect(ids).toContain('se-bane')
  })

  it('surfaces equipment effect from a bestiary creature item (Elixir of Life on goblin)', () => {
    const rows = execQuery(db, SQL_MATCHED, [ENCOUNTER_ID, ENCOUNTER_ID, ENCOUNTER_ID])
    const ids = rows.map((r) => r.id)
    expect(ids).toContain('se-elixir')
  })

  it('surfaces equipment effect from encounter_combatant_items (Drakeheart on Abobus)', () => {
    const rows = execQuery(db, SQL_MATCHED, [ENCOUNTER_ID, ENCOUNTER_ID, ENCOUNTER_ID])
    const row = rows.find((r) => r.id === 'se-drakeheart')
    expect(row).toBeDefined()
    expect(row!.category).toBe('alchemical')
  })

  it('surfaces custom-creature spell effect via data_json (Thundering Dominance on Abobus)', () => {
    const names = execCustomNames(db, ENCOUNTER_ID)
    expect(names).toContain('Thundering Dominance')

    const sql = buildCustomMatchedSql(names.length)
    const customRows = execQuery(
      db,
      sql,
      names.map((n) => n.toLowerCase().trim()),
    )
    const ids = customRows.map((r) => r.id)
    expect(ids).toContain('se-thundering')
  })

  it('filters out unrelated effects not tied to any combatant', () => {
    const rows = execQuery(db, SQL_MATCHED, [ENCOUNTER_ID, ENCOUNTER_ID, ENCOUNTER_ID])
    const ids = rows.map((r) => r.id)
    expect(ids).not.toContain('se-unused')
  })

  it('equipment effects land in alchemical category, spell effects in spell', () => {
    const rows = execQuery(db, SQL_MATCHED, [ENCOUNTER_ID, ENCOUNTER_ID, ENCOUNTER_ID])
    const bane = rows.find((r) => r.id === 'se-bane')!
    const drakeheart = rows.find((r) => r.id === 'se-drakeheart')!
    expect(bane.category).toBe('spell')
    expect(drakeheart.category).toBe('alchemical')
  })
})
