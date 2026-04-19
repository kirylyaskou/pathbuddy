// 69-06: round-trip integration test. Builds an in-memory sql.js database
// matching the production schema excerpt touched by the export/import path,
// seeds bestiary + hazard + custom creature rows, persists a sample encounter,
// then exports → re-imports and asserts combatant parity.
//
// The test mocks `@/shared/db` → an async wrapper around sql.js that exposes
// the same `{ select, execute }` surface as @tauri-apps/plugin-sql's Database.
// All DB-touching helpers (listEncounters, loadEncounterCombatants,
// createEncounter, saveEncounterCombatants, matchEncounter, exportEncounter)
// go through getDb, so one mock suffices for the whole pipeline.

import { describe, it, expect, beforeAll, vi } from 'vitest'
import initSqlJs from 'sql.js'
import type { Database as SqlJsDatabase } from 'sql.js'
import fs from 'node:fs'
import path from 'node:path'

// ── sql.js-backed fake satisfying the Tauri plugin-sql Database surface ─────
// Production code uses positional `?` placeholders (sqlite mode); sql.js also
// speaks `?`, so no placeholder rewriting is needed.

interface FakeDb {
  select<T>(query: string, bindValues?: unknown[]): Promise<T>
  execute(
    query: string,
    bindValues?: unknown[],
  ): Promise<{ rowsAffected: number; lastInsertId?: number }>
}

let sqlDb: SqlJsDatabase | null = null

function makeFakeDb(db: SqlJsDatabase): FakeDb {
  return {
    async select<T>(query: string, bindValues: unknown[] = []): Promise<T> {
      const stmt = db.prepare(query)
      stmt.bind(bindValues as (string | number | null)[])
      const out: Record<string, unknown>[] = []
      while (stmt.step()) {
        out.push(stmt.getAsObject() as Record<string, unknown>)
      }
      stmt.free()
      return out as T
    },
    async execute(query: string, bindValues: unknown[] = []) {
      const stmt = db.prepare(query)
      stmt.bind(bindValues as (string | number | null)[])
      stmt.step()
      const rowsAffected = db.getRowsModified()
      stmt.free()
      return { rowsAffected }
    },
  }
}

vi.mock('@/shared/db', () => ({
  getDb: async () => {
    if (!sqlDb) throw new Error('sql.js DB not initialised — check beforeAll')
    return makeFakeDb(sqlDb)
  },
}))

// ── Schema excerpt — only what the export / import pipeline touches ─────────
const SCHEMA = `
CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  level INTEGER,
  hp INTEGER
);
CREATE TABLE custom_creatures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE hazards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  hp INTEGER,
  hazard_type TEXT NOT NULL DEFAULT 'simple'
);
CREATE TABLE encounters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  party_level INTEGER NOT NULL DEFAULT 1,
  party_size INTEGER NOT NULL DEFAULT 4,
  round INTEGER NOT NULL DEFAULT 0,
  turn INTEGER NOT NULL DEFAULT 0,
  active_combatant_id TEXT,
  is_running INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE encounter_combatants (
  id TEXT PRIMARY KEY,
  encounter_id TEXT NOT NULL,
  creature_ref TEXT,
  display_name TEXT NOT NULL,
  initiative REAL NOT NULL DEFAULT 0,
  hp INTEGER NOT NULL DEFAULT 0,
  max_hp INTEGER NOT NULL DEFAULT 0,
  temp_hp INTEGER NOT NULL DEFAULT 0,
  is_npc INTEGER NOT NULL DEFAULT 1,
  weak_elite_tier TEXT NOT NULL DEFAULT 'normal',
  creature_level INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_hazard INTEGER NOT NULL DEFAULT 0,
  hazard_ref TEXT
);
`

async function loadSqlJs(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs({
    locateFile: (file) => path.resolve('node_modules/sql.js/dist', file),
    wasmBinary: fs.readFileSync(
      path.resolve('node_modules/sql.js/dist/sql-wasm.wasm'),
    ),
  })
  return new SQL.Database()
}

// ── Test body ────────────────────────────────────────────────────────────────

describe('encounter export → import round-trip', () => {
  const SRC_ENCOUNTER_ID = 'enc-src'

  beforeAll(async () => {
    sqlDb = await loadSqlJs()
    sqlDb.exec(SCHEMA)

    // Bestiary row — matched by `lookupName = 'Goblin Warrior'`.
    sqlDb.exec(`
      INSERT INTO entities (id, name, type, level, hp) VALUES
        ('goblin-bestiary-1', 'Goblin Warrior', 'npc', -1, 6);
    `)

    // Custom creature — matched by `lookupName = 'Abobus'`.
    sqlDb.exec(`
      INSERT INTO custom_creatures (id, name, level, data_json) VALUES
        ('abobus-custom-1', 'Abobus', 10, '{}');
    `)

    // Hazard row.
    sqlDb.exec(`
      INSERT INTO hazards (id, name, level, hp) VALUES
        ('pit-hazard-1', 'Spiked Pit', 3, 30);
    `)

    // Source encounter — created directly so we exercise the read path.
    sqlDb.exec(`
      INSERT INTO encounters (id, name, party_level, party_size, round, turn, is_running)
      VALUES ('enc-src', 'Братья дварфы', 4, 4, 0, 0, 0);
    `)

    // Three combatants — one bestiary NPC with a local moniker, one custom
    // creature (no name override), one hazard.
    sqlDb.exec(`
      INSERT INTO encounter_combatants
        (id, encounter_id, creature_ref, display_name, initiative, hp, max_hp, temp_hp,
         is_npc, weak_elite_tier, creature_level, sort_order, is_hazard, hazard_ref)
      VALUES
        ('cb-gob',    'enc-src', 'goblin-bestiary-1', 'Огрек',      18, 5,  6,  0, 1, 'elite',  0, 0, 0, NULL),
        ('cb-custom', 'enc-src', 'abobus-custom-1',   'Abobus',     12, 180, 200, 0, 1, 'normal', 10, 1, 0, NULL),
        ('cb-hazard', 'enc-src', '',                  'Spiked Pit',  0, 30, 30, 0, 0, 'normal',  3, 2, 1, 'pit-hazard-1');
    `)
  })

  it('round-trips combatants through exportEncounter → parseEncounterJson → matchEncounter → commitMatchedEncounter', async () => {
    // Dynamic imports AFTER the vi.mock call above so the mock binds.
    const { exportEncounter } = await import('../lib/export-encounter')
    const { parseEncounterJson } = await import('../lib/parse-formats')
    const { matchEncounter } = await import('../lib/match-combatants')
    const { commitMatchedEncounter } = await import('../lib/import-encounter')
    const { loadEncounterCombatants } = await import('../../../shared/api/encounters')

    // 1. Export
    const { filename, content } = await exportEncounter(SRC_ENCOUNTER_ID)
    expect(filename).toBe('Братья-дварфы.pathmaiden')
    const payload = JSON.parse(content)
    expect(payload.version).toBe('pathmaiden-v1')
    expect(payload.encounter.combatants).toHaveLength(3)

    // Spot-check the canonical lookup names landed in the export.
    const exported = payload.encounter.combatants as Array<{
      name: string
      lookupName: string
      weakEliteTier: string
      hp: number
      hpMax: number
      initiative: number
    }>
    const ogrek = exported.find((c) => c.name === 'Огрек')!
    expect(ogrek.lookupName).toBe('Goblin Warrior')
    expect(ogrek.weakEliteTier).toBe('elite')
    expect(ogrek.hp).toBe(5)
    expect(ogrek.hpMax).toBe(6)
    expect(ogrek.initiative).toBe(18)

    // 2. Re-parse
    const parsed = parseEncounterJson(JSON.parse(content))
    expect(parsed).toHaveLength(1)

    // 3. Match
    const matched = await matchEncounter(parsed[0])
    expect(matched.combatants).toHaveLength(3)
    const statuses = matched.combatants.map((c) => c.match.status).sort()
    expect(statuses).toEqual(['bestiary', 'custom', 'hazard'])

    // 4. Commit (name collides — deriveUniqueName appends "(imported)").
    const result = await commitMatchedEncounter(matched, 4, 4)
    expect(result.importedCount).toBe(3)
    expect(result.skippedCount).toBe(0)
    expect(result.name).not.toBe('Братья дварфы') // collision renamed

    // 5. Load newly committed combatants and assert parity with source.
    const reloaded = await loadEncounterCombatants(result.encounterId)
    expect(reloaded).toHaveLength(3)

    const byDisplay = new Map(reloaded.map((c) => [c.displayName, c]))
    const srcOgrek = byDisplay.get('Огрек')!
    expect(srcOgrek.creatureRef).toBe('goblin-bestiary-1')
    expect(srcOgrek.hp).toBe(5)
    expect(srcOgrek.maxHp).toBe(6)
    expect(srcOgrek.initiative).toBe(18)
    expect(srcOgrek.weakEliteTier).toBe('elite')

    const srcAbobus = byDisplay.get('Abobus')!
    expect(srcAbobus.creatureRef).toBe('abobus-custom-1')
    expect(srcAbobus.initiative).toBe(12)

    const srcHazard = byDisplay.get('Spiked Pit')!
    expect(srcHazard.isHazard).toBe(true)
    expect(srcHazard.hazardRef).toBe('pit-hazard-1')
    expect(srcHazard.hp).toBe(30)
  })
})
