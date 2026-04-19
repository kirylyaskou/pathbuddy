// ─── Fortune / Misfortune / Assurance (Phase 65 + v1.4.1 UAT BUG-B) ───────────
// Engine-side helper to describe what a roll should do based on active
// fortune-type effects and direct Assurance invocations. Pure function — no
// DB/UI dependency. Caller is expected to supply whatever "active
// option/effect" evidence it has about the combatant; the helper itself is
// stateless.
//
// PF2e RAW (Player Core pg. 11):
//   - Fortune effect:    roll the d20 twice and use the HIGHER total.
//   - Misfortune effect: roll the d20 twice and use the LOWER total.
//   - Both on the same roll cancel, producing a plain single d20 roll.
// Each of the two rolls is a full independent d20 check: both can crit or
// fumble on their own; the GM picks the better / worse TOTAL (not the
// better / worse d20 die result) between them.
//
// Round-5 UAT BUG-B fix: the previous iteration of this helper rewrote the
// formula to "2d20kh1+mod". That form rolled two d20s into a single Roll
// whose `total` was dice-sum+modifier — it displayed as a single merged
// formula, and it double-counted the modifier because both d20s were summed
// before the modifier was added ONCE. The UI could not show two independent
// totals because only one Roll came out of the dice engine.
//
// The helper now produces a structured PLAN: a discriminated union that
// tells the wiring layer to either roll once (normal), roll twice and
// highlight the higher/lower total (fortune/misfortune), or emit a flat
// assurance value without rolling at all. parseFormula stays untouched —
// no "kh1/kl1" DSL extension needed.

export type RollContext = {
  type: 'attack' | 'skill' | 'save' | 'perception'
}

export interface FortuneInputs {
  fortune?: boolean
  misfortune?: boolean
  /**
   * Assurance short-circuit. When present, dice are bypassed entirely and the
   * output plan becomes a flat `10+<prof>` value. All other inputs ignored.
   */
  assurance?: { proficiencyBonus: number }
}

/**
 * Plan describing what the caller should do with a roll formula. The wiring
 * site (`use-roll.ts`) branches on `kind`:
 *   - `normal`    → roll `formula` once (legacy behaviour)
 *   - `fortune`   → roll `formula` twice independently, keep higher total
 *   - `misfortune`→ roll `formula` twice independently, keep lower total
 *   - `assurance` → emit a flat Roll with `total = value` (no dice)
 */
export type FortuneRollPlan =
  | {
      kind: 'normal'
      /** Same string the caller handed in. */
      formula: string
    }
  | {
      kind: 'fortune' | 'misfortune'
      /** Base `1d20+mod` formula — NO `kh1`/`kl1` rewriting. */
      formula: string
      /** Human-readable label the wiring layer appends to the toast. */
      label: string
    }
  | {
      kind: 'assurance'
      /** Pre-computed final value, e.g. 19 for `10+9`. */
      value: number
      /** Formula string preserved for display (`10+9`). */
      formula: string
      /** Human-readable label. */
      label: string
    }

/**
 * Describe how to execute a roll given the combatant's fortune / misfortune /
 * assurance state. Pure function. No implicit lookup — the caller resolves
 * RollOption state and passes booleans in.
 *
 * @param formula     - Base roll formula, e.g. "1d20+7".
 * @param combatantId - Kept in the signature for call-site symmetry (logging,
 *                      future tracing). Not used in the computation itself.
 * @param _context    - RollContext — reserved for future type-scoped rules
 *                      (e.g. fortune-only-on-attacks). Currently all fortune
 *                      inputs are treated as universally applicable.
 * @param inputs      - Fortune/misfortune/assurance flags.
 */
export function planFortuneRoll(
  formula: string,
  combatantId: string,
  _context: RollContext,
  inputs: FortuneInputs = {},
): FortuneRollPlan {
  // Silence unused-parameter warning while keeping the documented signature.
  void combatantId

  // Assurance wins above everything — no dice at all.
  if (inputs.assurance) {
    const prof = inputs.assurance.proficiencyBonus
    const sign = prof >= 0 ? '+' : '-'
    const assuranceFormula = `10${sign}${Math.abs(prof)}`
    const value = 10 + prof
    return {
      kind: 'assurance',
      formula: assuranceFormula,
      value,
      label: 'Assurance (flat)',
    }
  }

  const fortune = Boolean(inputs.fortune)
  const misfortune = Boolean(inputs.misfortune)

  // PF2e: fortune and misfortune on the same roll cancel to a normal roll.
  if (fortune && misfortune) {
    return { kind: 'normal', formula }
  }

  // Fortune / misfortune only make sense for d20 rolls (attacks, saves,
  // skill checks, perception). If the base formula doesn't lead with a d20
  // term, fall back to normal — callers shouldn't wire fortune onto damage
  // rolls in the first place, but a defensive passthrough avoids surprise.
  if ((fortune || misfortune) && !leadsWithD20(formula)) {
    return { kind: 'normal', formula }
  }

  if (fortune) {
    return {
      kind: 'fortune',
      formula,
      label: 'Sure Strike (fortune)',
    }
  }
  if (misfortune) {
    return {
      kind: 'misfortune',
      formula,
      label: 'Misfortune (keep lower)',
    }
  }
  return { kind: 'normal', formula }
}

// ─── Internals ───────────────────────────────────────────────────────────────

/** Returns true when the formula starts with a d20 term (`d20` or `1d20`). */
function leadsWithD20(formula: string): boolean {
  return /^\s*([+-]?\s*\d*)d20\b/i.test(formula)
}
