import { useCallback } from 'react'
import { applyFortuneToRoll, parseSpellEffectRollTwice, rollDice } from '@engine'
import type { RollContext, Roll } from '@engine'
import { useRollStore } from '@/shared/model/roll-store'
import { useEffectStore } from '@/entities/spell-effect'

/**
 * Returns a stable callback that rolls a formula, pushes the result to
 * the shared roll history, and returns the Roll for further inspection.
 * Optionally tags the roll with a source name and combat encounter id.
 *
 * v1.4.1 UAT BUG-7: when `combatantId` is supplied, the hook inspects every
 * active effect on that combatant for `RollTwice` rules whose selector
 * matches `rollContext`. At least one `keep: "higher"` → fortune;
 * `keep: "lower"` → misfortune. Both cancel. The formula is rewritten via
 * `applyFortuneToRoll` so the toast shows `2d20kh1±mod` and an
 * effect-labelled tag. Actual pick-highest-of-two execution is deferred
 * (parseFormula doesn't yet understand `kh1/kl1`) — this wiring at least
 * surfaces the fortune effect to the user.
 */
export function useRoll(
  source?: string,
  combatId?: string,
  combatantId?: string,
  rollContext?: RollContext['type'],
) {
  const addRoll = useRollStore((s) => s.addRoll)
  return useCallback(
    (formula: string, label?: string): Roll => {
      let finalFormula = formula
      let finalLabel = label
      if (combatantId && rollContext) {
        const activeEffects = useEffectStore
          .getState()
          .activeEffects.filter((e) => e.combatantId === combatantId)
        let fortune = false
        let misfortune = false
        const selectorTarget =
          rollContext === 'attack' ? 'attack-roll'
          : rollContext === 'save' ? 'saving-throw'
          : rollContext === 'skill' ? 'skill-check'
          : rollContext === 'perception' ? 'perception'
          : ''
        for (const eff of activeEffects) {
          const rules = parseSpellEffectRollTwice(eff.rulesJson)
          for (const r of rules) {
            const selectors = Array.isArray(r.selector) ? r.selector : [r.selector]
            if (!selectors.some((s) => s === selectorTarget || s === 'all')) continue
            if (r.keep === 'higher') fortune = true
            else misfortune = true
          }
        }
        if (fortune || misfortune) {
          const rewritten = applyFortuneToRoll(
            formula,
            combatantId,
            { type: rollContext },
            { fortune, misfortune },
          )
          finalFormula = rewritten.formula
          finalLabel = rewritten.label
            ? (label ? `${label} — ${rewritten.label}` : rewritten.label)
            : label
        }
      }
      const roll = rollDice(finalFormula, finalLabel, { source, combatId })
      addRoll(roll)
      return roll
    },
    [addRoll, source, combatId, combatantId, rollContext],
  )
}
