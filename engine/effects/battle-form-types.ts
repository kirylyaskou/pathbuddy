// ─── BattleForm shared types (Phase 65, D-65-04) ─────────────────────────────
// Kept in a tiny standalone module so the feature-layer store (which cannot
// import from engine internals that pull in UI-only shapes) and the engine
// parser can both depend on the same strike-override contract.

export interface BattleFormStrikeOverride {
  /** Display name, e.g. "claw", "jaws". */
  name: string
  /** Damage die per attack, from Foundry BattleForm overrides.strikes.<name>.damage.die. */
  dieSize: 'd4' | 'd6' | 'd8' | 'd10' | 'd12'
  /** Dice count (usually 1–3). */
  diceNumber?: number
  /** Damage type token ("slashing", "piercing", "bludgeoning", …). */
  damageType?: string
}
