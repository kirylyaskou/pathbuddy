import type { Creature } from '@engine'

// Stubs for Phase 6 — real SQL queries added in Phase 7

export async function fetchCreatures(): Promise<Creature[]> {
  return []
}

export async function fetchCreatureById(_id: string): Promise<Creature | null> {
  return null
}

export async function searchCreatures(_query: string, _limit?: number): Promise<Creature[]> {
  return []
}
