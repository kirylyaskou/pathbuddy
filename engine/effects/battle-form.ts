// ─── BattleForm / CreatureSize (Phase 65, D-65-04) ───────────────────────────
// Parse Foundry PF2e rule elements that reshape a combatant's physical form.
//
//   - `CreatureSize` with a literal `value` ("tiny" / "sm" / "med" / "lg" /
//     "huge" / "grg") — produces a size override.
//   - `BattleForm` with an `overrides` block carrying size / AC / strikes —
//     produces a full battle-form override (AC is required to be numeric;
//     Foundry sometimes stores it as an expression string like "18 + @actor.level"
//     which we flag as unresolvable and skip the AC piece while keeping the
//     strikes + size).
//
// Dynamic references (`{item|flags.system.rulesSelections…}`) are NOT resolved
// here — caller is expected to resolve them via ChoiceSet selections before
// dispatching. We skip any rule whose resolved size is not a literal PF2e size
// token. Strikes with non-numeric dice/die values are dropped.

import type { CreatureSize } from '../types'
import type { BattleFormStrikeOverride } from './battle-form-types'

// Re-export the strike override shape so consumers can import from a single module.
export type { BattleFormStrikeOverride } from './battle-form-types'

export interface CreatureSizeInput {
  effectId: string
  effectName: string
  size: CreatureSize
}

export interface BattleFormInput {
  effectId: string
  effectName: string
  size?: CreatureSize
  /** Numeric AC value (string expressions skipped). */
  ac?: number
  strikes?: BattleFormStrikeOverride[]
}

// Foundry PF2e size tokens (pre-remaster "tiny"/"sm"/…; post-remaster uses
// full words). Normalize either form to our CreatureSize ('tiny' | 'sm' | ...).
const SIZE_ALIASES: Record<string, CreatureSize> = {
  tiny: 'tiny',
  sm: 'sm',
  small: 'sm',
  med: 'med',
  medium: 'med',
  lg: 'lg',
  large: 'lg',
  huge: 'huge',
  grg: 'grg',
  gargantuan: 'grg',
}

function coerceSize(value: unknown): CreatureSize | null {
  if (typeof value !== 'string') return null
  const lower = value.toLowerCase().trim()
  return SIZE_ALIASES[lower] ?? null
}

const DIE_PATTERN = /^d(4|6|8|10|12)$/i

function coerceStrike(
  name: string,
  entry: Record<string, unknown>,
): BattleFormStrikeOverride | null {
  const dmg = entry.damage as Record<string, unknown> | undefined
  if (!dmg) return null
  const dieRaw = typeof dmg.die === 'string' ? dmg.die.toLowerCase() : ''
  if (!DIE_PATTERN.test(dieRaw)) return null
  const die = dieRaw as BattleFormStrikeOverride['dieSize']
  const dice = typeof dmg.dice === 'number' ? dmg.dice : 1
  const damageType = typeof dmg.damageType === 'string' ? dmg.damageType : undefined
  return { name, dieSize: die, diceNumber: dice, damageType }
}

/**
 * Parse CreatureSize rules with literal size values. Rules with unresolved
 * `{item|flags…}` references are skipped.
 */
export function parseSpellEffectCreatureSize(
  rulesJson: string,
  effectId: string,
  effectName: string,
): CreatureSizeInput[] {
  let rules: unknown[]
  try {
    rules = JSON.parse(rulesJson)
  } catch {
    return []
  }
  if (!Array.isArray(rules)) return []

  const out: CreatureSizeInput[] = []
  for (const rule of rules) {
    const r = rule as Record<string, unknown>
    if (r.key !== 'CreatureSize') continue
    const size = coerceSize(r.value)
    if (!size) continue
    out.push({ effectId, effectName, size })
  }
  return out
}

/**
 * Parse BattleForm rules — returns the first concrete override block
 * (BattleForm is not meant to stack with itself). Returns null when no
 * BattleForm rule is present or when its `overrides` block is unresolvable.
 */
export function parseSpellEffectBattleForm(
  rulesJson: string,
  effectId: string,
  effectName: string,
): BattleFormInput | null {
  let rules: unknown[]
  try {
    rules = JSON.parse(rulesJson)
  } catch {
    return null
  }
  if (!Array.isArray(rules)) return null

  for (const rule of rules) {
    const r = rule as Record<string, unknown>
    if (r.key !== 'BattleForm') continue
    const overrides = (r.overrides ?? null) as Record<string, unknown> | null
    if (!overrides) continue

    const size = coerceSize(overrides.size)

    // AC: Foundry sometimes stores as `{ modifier: <number> }`; sometimes as
    // an expression string we can't resolve. Keep only the numeric shape.
    let ac: number | undefined
    const acBlock = overrides.armorClass as
      | { modifier?: unknown }
      | number
      | undefined
    if (typeof acBlock === 'number') {
      ac = acBlock
    } else if (acBlock && typeof acBlock === 'object') {
      const mod = acBlock.modifier
      if (typeof mod === 'number') ac = mod
      // else: string expression — unresolvable; skip AC
    }

    // Strikes are a record keyed by name.
    const strikes: BattleFormStrikeOverride[] = []
    const strikesBlock = overrides.strikes as Record<string, unknown> | undefined
    if (strikesBlock && typeof strikesBlock === 'object') {
      for (const [name, raw] of Object.entries(strikesBlock)) {
        if (!raw || typeof raw !== 'object') continue
        const strike = coerceStrike(name, raw as Record<string, unknown>)
        if (strike) strikes.push(strike)
      }
    }

    return {
      effectId,
      effectName,
      size: size ?? undefined,
      ac,
      strikes: strikes.length > 0 ? strikes : undefined,
    }
  }
  return null
}
