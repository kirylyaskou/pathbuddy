export type { ConditionSlug, ValuedCondition } from '@engine'

// ActiveCondition: flat record stored per combatant in the entity store.
// Flat array is SQLite-serialization-friendly (easier to upsert than nested Map).
export interface ActiveCondition {
  combatantId: string
  slug: string         // ConditionSlug value
  value?: number       // Only present for valued conditions (frightened, sickened, etc.)
}
