import { getDb } from '@/shared/db'

export interface PartyConfig {
  partyLevel: number
  partySize: number
}

export async function loadPartyConfig(): Promise<PartyConfig> {
  const db = await getDb()
  const rows = await db.select<{ party_level: number; party_size: number }[]>(
    'SELECT party_level, party_size FROM party_config WHERE id = 1'
  )
  if (rows.length > 0) {
    return { partyLevel: rows[0].party_level, partySize: rows[0].party_size }
  }
  return { partyLevel: 1, partySize: 4 }
}

export async function savePartyConfig(config: PartyConfig): Promise<void> {
  const db = await getDb()
  await db.execute(
    'INSERT OR REPLACE INTO party_config (id, party_level, party_size) VALUES (1, ?, ?)',
    [config.partyLevel, config.partySize]
  )
}
