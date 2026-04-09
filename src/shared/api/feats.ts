import { getDb } from '@/shared/db'

export interface FeatEntityRow {
  id: string
  name: string
  level: number | null
  traits: string | null
  raw_json: string
}

export async function getFeatByName(name: string): Promise<FeatEntityRow | null> {
  const db = await getDb()
  const rows = await db.select<FeatEntityRow[]>(
    "SELECT id, name, level, traits, raw_json FROM entities WHERE type = 'feat' AND name = ? COLLATE NOCASE LIMIT 1",
    [name]
  )
  return rows[0] ?? null
}
