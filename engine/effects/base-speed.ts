// ─── BaseSpeed Rule Parser (v1.4.1 UAT BUG-5) ────────────────────────────────
// Parses `BaseSpeed` rule elements from a spell effect's rules_json.
// PF2e uses BaseSpeed to declare that an effect grants a movement type
// (fly / swim / climb / burrow / land) at either a literal value or a
// formula resolved against the actor's land speed at runtime.
//
// Foundry expressions we understand here:
//   <integer>                                               — literal feet
//   @actor.system.movement.speeds.land.value                — land speed
//   max(A, B)                                               — larger of two
//   round(expr / 2)                                         — half (rounded)
//   round(expr * N), round(expr / N)                        — scaled
//
// The goal is UI display only — the consumer side passes in the creature's
// current land speed, and we return a concrete number. Expressions we can't
// parse fall back to `undefined`; the caller then shows the bare selector
// label ("fly — ft") so the speed type is still surfaced even when the
// numeric value is unavailable.

export type SpeedType = 'land' | 'fly' | 'swim' | 'climb' | 'burrow'

export interface BaseSpeedInput {
  /** Which speed type this rule contributes. */
  type: SpeedType
  /**
   * Foundry value expression from the raw rule — stored verbatim so callers
   * can re-evaluate against different land-speed contexts if needed.
   */
  rawValue: string | number
  /** Predicate terms attached to the rule (unevaluated; consumer handles). */
  predicate?: unknown[]
}

/**
 * Parse BaseSpeed rule elements from a rules_json string.
 * Skips rules that aren't BaseSpeed or carry a non-speed selector.
 */
export function parseBaseSpeedRules(rulesJson: string): BaseSpeedInput[] {
  let rules: unknown[]
  try {
    rules = JSON.parse(rulesJson)
  } catch {
    return []
  }
  if (!Array.isArray(rules)) return []
  const out: BaseSpeedInput[] = []
  for (const rule of rules) {
    const r = rule as Record<string, unknown>
    if (r.key !== 'BaseSpeed') continue
    const selector = typeof r.selector === 'string' ? r.selector : null
    if (!selector) continue
    const type = toSpeedType(selector)
    if (!type) continue
    const rawValue = (typeof r.value === 'number' || typeof r.value === 'string') ? r.value : 0
    out.push({
      type,
      rawValue,
      predicate: Array.isArray(r.predicate) ? r.predicate : undefined,
    })
  }
  return out
}

function toSpeedType(sel: string): SpeedType | null {
  switch (sel) {
    case 'land':
    case 'fly':
    case 'swim':
    case 'climb':
    case 'burrow':
      return sel
    default:
      return null
  }
}

/**
 * Evaluate a BaseSpeed rawValue against a creature's current land speed.
 * Returns the resolved feet value, or `null` if the expression uses tokens
 * we don't understand (consumer decides UX for null: fall back to land
 * speed, hide the number, etc.).
 */
export function resolveBaseSpeedValue(
  rawValue: string | number,
  landSpeedFeet: number,
): number | null {
  if (typeof rawValue === 'number') return rawValue
  const src = rawValue.trim()
  if (!src) return null
  // Literal integer
  if (/^-?\d+$/.test(src)) return parseInt(src, 10)
  // Bare @actor.…land.value reference
  if (src === '@actor.system.movement.speeds.land.value') return landSpeedFeet
  // max(A, B)
  const maxMatch = /^max\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)$/i.exec(src)
  if (maxMatch) {
    const a = resolveBaseSpeedValue(maxMatch[1], landSpeedFeet)
    const b = resolveBaseSpeedValue(maxMatch[2], landSpeedFeet)
    if (a === null || b === null) return null
    return Math.max(a, b)
  }
  // round(expr / N) or round(expr * N)
  const roundMatch = /^round\(\s*(.+?)\s*\)$/i.exec(src)
  if (roundMatch) {
    const inner = roundMatch[1]
    const divMatch = /^(.+?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(inner)
    if (divMatch) {
      const lhs = resolveBaseSpeedValue(divMatch[1], landSpeedFeet)
      if (lhs === null) return null
      return Math.round(lhs / parseFloat(divMatch[2]))
    }
    const mulMatch = /^(.+?)\s*\*\s*(\d+(?:\.\d+)?)$/.exec(inner)
    if (mulMatch) {
      const lhs = resolveBaseSpeedValue(mulMatch[1], landSpeedFeet)
      if (lhs === null) return null
      return Math.round(lhs * parseFloat(mulMatch[2]))
    }
    return resolveBaseSpeedValue(inner, landSpeedFeet)
  }
  return null
}
