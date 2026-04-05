import { getDb } from '@/shared/db'
import type { PathbuilderBuild } from '@engine'

export interface CharacterRecord {
  id: string
  name: string
  class: string | null
  level: number | null
  ancestry: string | null
  rawJson: string
  notes: string
  createdAt: string
}

type CharacterRow = {
  id: string
  name: string
  class: string | null
  level: number | null
  ancestry: string | null
  raw_json: string
  notes: string
  created_at: string
}

function rowToRecord(r: CharacterRow): CharacterRecord {
  return {
    id: r.id,
    name: r.name,
    class: r.class,
    level: r.level,
    ancestry: r.ancestry,
    rawJson: r.raw_json,
    notes: r.notes,
    createdAt: r.created_at,
  }
}

export async function getAllCharacters(): Promise<CharacterRecord[]> {
  const db = await getDb()
  const rows = await db.select<CharacterRow[]>(
    `SELECT id, name, class, level, ancestry, raw_json, notes, created_at
     FROM characters ORDER BY name ASC`,
    []
  )
  return rows.map(rowToRecord)
}

export async function getCharacterById(id: string): Promise<CharacterRecord | null> {
  const db = await getDb()
  const rows = await db.select<CharacterRow[]>(
    `SELECT id, name, class, level, ancestry, raw_json, notes, created_at
     FROM characters WHERE id = ?`,
    [id]
  )
  return rows.length > 0 ? rowToRecord(rows[0]) : null
}

/**
 * Upsert a Pathbuilder character by name.
 * - First import: INSERT with new UUID id.
 * - Re-import (same name): UPDATE class/level/ancestry/raw_json; preserve id and created_at.
 * Returns the character's id.
 */
export async function upsertCharacter(build: PathbuilderBuild): Promise<string> {
  const db = await getDb()
  const id = crypto.randomUUID()
  await db.execute(
    `INSERT INTO characters (id, name, class, level, ancestry, raw_json, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, '', datetime('now'))
     ON CONFLICT(name) DO UPDATE SET
       class = excluded.class,
       level = excluded.level,
       ancestry = excluded.ancestry,
       raw_json = excluded.raw_json`,
    [
      id,
      build.name,
      build.class ?? null,
      build.level ?? null,
      build.ancestry ?? null,
      JSON.stringify(build),
    ]
  )
  // Return the actual id (may differ from generated id if record already existed)
  const rows = await db.select<{ id: string }[]>(
    `SELECT id FROM characters WHERE name = ?`,
    [build.name]
  )
  return rows[0].id
}

export async function deleteCharacter(id: string): Promise<void> {
  const db = await getDb()
  await db.execute(`DELETE FROM characters WHERE id = ?`, [id])
}

export async function updateCharacterNotes(id: string, notes: string): Promise<void> {
  const db = await getDb()
  await db.execute(`UPDATE characters SET notes = ? WHERE id = ?`, [notes, id])
}
