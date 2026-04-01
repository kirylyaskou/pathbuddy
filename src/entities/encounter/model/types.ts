// Encounter is a saved encounter entity (SQLite-derived).
// Not to be confused with feature/encounter-builder runtime state.
export interface Encounter {
  id: string
  name: string
  partyLevel: number
  partySize: number
  creatureIds: string[]  // references to Creature names / future DB ids
  createdAt: string      // ISO string — serializable
}
