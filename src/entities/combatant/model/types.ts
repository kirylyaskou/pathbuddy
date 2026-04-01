// Combatant is a runtime concept: creature in an active combat slot.
// Not in @engine (engine has no combat-slot concept) — defined here as entity layer type.
export interface Combatant {
  id: string           // uuid — unique per combat slot
  creatureRef: string  // Creature.name or future DB id
  displayName: string
  initiative: number
  hp: number
  maxHp: number
  tempHp: number
  conditions: string[] // condition slugs — ConditionManager is module-level, not stored here
  isNPC: boolean
}
