import type { Immunity } from './damage/iwr'
import type { ConditionManager } from './conditions/conditions'

// ─── Shared Engine Types ──────────────────────────────────────────────────────

/** Weak/Elite creature adjustment tier per PF2e Monster Core */
export type WeakEliteTier = 'normal' | 'weak' | 'elite'

// ─── Creature Interface (Phase 3) ────────────────────────────────────────────
// Source: D-17 — Minimal creature interface for Phase 3 condition/death mechanics.
// Phase 4 extends with AC, saves, abilities, speed, attacks, traits (D-18).

export interface Creature {
  immunities: Immunity[]
  conditions: ConditionManager
  hp: {
    current: number
    max: number
    temp: number
  }
  level: number
  deathDoor: boolean
}
