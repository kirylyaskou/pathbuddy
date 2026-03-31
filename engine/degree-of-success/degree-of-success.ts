// ─── Degree of Success System (D-17, D-18, D-19, D-20) ─────────────────────
// Source: PF2e Player Core — Degree of Success rules
// Centralized calculation matching performRecoveryCheck() pattern (Pitfall 4).

// ─── Types ──────────────────────────────────────────────────────────────────

export type DegreeOfSuccess = 'criticalSuccess' | 'success' | 'failure' | 'criticalFailure'

/** Ordered from worst to best for upgrade/downgrade arithmetic */
const DEGREE_ORDER: DegreeOfSuccess[] = ['criticalFailure', 'failure', 'success', 'criticalSuccess']

export interface DegreeAdjustment {
  /** Whether to upgrade (improve) or downgrade (worsen) the degree */
  type: 'upgrade' | 'downgrade'
  /** Number of steps to shift (1 or 2) */
  steps: 1 | 2
  /** Optional label for this adjustment source (e.g., 'incapacitation', 'basic-save') */
  label?: string
}

// ─── Core Calculation (D-17) ────────────────────────────────────────────────

/**
 * Calculate the degree of success for a check.
 *
 * @param roll - The d20 roll result (1-20). Natural 20 and natural 1 apply
 *   upgrade/downgrade per PF2e rules.
 * @param totalModifier - Sum of all modifiers applied to the roll. The
 *   "check result" is roll + totalModifier.
 * @param dc - The Difficulty Class to check against.
 * @param adjustments - Optional array of degree adjustments to apply after
 *   base calculation (D-18). Pipeline accommodates future adjustments (D-20).
 * @returns The final degree of success after all adjustments.
 */
export function calculateDegreeOfSuccess(
  roll: number,
  totalModifier: number,
  dc: number,
  adjustments: DegreeAdjustment[] = [],
): DegreeOfSuccess {
  const checkResult = roll + totalModifier

  // Base calculation — PF2e Player Core degree-of-success rules
  let degree: DegreeOfSuccess

  if (checkResult >= dc + 10) {
    degree = 'criticalSuccess'
  } else if (checkResult >= dc) {
    degree = 'success'
  } else if (checkResult <= dc - 10) {
    degree = 'criticalFailure'
  } else {
    degree = 'failure'
  }

  // Natural 20: upgrade one step (at least success)
  // Natural 1: downgrade one step (at most failure)
  // Applied AFTER numeric check per PF2e rules
  if (roll === 20) {
    degree = upgradeDegree(degree, 1)
  } else if (roll === 1) {
    degree = downgradeDegree(degree, 1)
  }

  // Apply adjustment pipeline (D-18, D-19, D-20)
  for (const adj of adjustments) {
    degree = adj.type === 'upgrade'
      ? upgradeDegree(degree, adj.steps)
      : downgradeDegree(degree, adj.steps)
  }

  return degree
}

// ─── Degree Shifting Helpers ────────────────────────────────────────────────

/** Upgrade (improve) a degree by the given number of steps. Caps at criticalSuccess. */
export function upgradeDegree(degree: DegreeOfSuccess, steps: number): DegreeOfSuccess {
  const idx = DEGREE_ORDER.indexOf(degree)
  return DEGREE_ORDER[Math.min(idx + steps, DEGREE_ORDER.length - 1)]
}

/** Downgrade (worsen) a degree by the given number of steps. Caps at criticalFailure. */
export function downgradeDegree(degree: DegreeOfSuccess, steps: number): DegreeOfSuccess {
  const idx = DEGREE_ORDER.indexOf(degree)
  return DEGREE_ORDER[Math.max(idx - steps, 0)]
}

// ─── Pre-built Adjustments (D-19) ──────────────────────────────────────────

/**
 * Incapacitation trait adjustment.
 * If the target's level is higher than the effect's level (or double the
 * spell rank), degrees of success are shifted:
 *   - Critical success becomes success (downgrade 1)
 *   - Success becomes failure (downgrade 1)
 *
 * Caller is responsible for checking level comparison and only including
 * this adjustment when the target qualifies.
 */
export const INCAPACITATION_ADJUSTMENT: DegreeAdjustment = {
  type: 'downgrade',
  steps: 1,
  label: 'incapacitation',
}

// ─── Basic Save Damage Multiplier (D-19) ────────────────────────────────────
// Note: Basic save is NOT a degree adjustment — it is a damage multiplier
// protocol the caller applies after getting the degree.

/** Returns the damage multiplier for a basic save result. */
export function basicSaveDamageMultiplier(degree: DegreeOfSuccess): number {
  switch (degree) {
    case 'criticalSuccess': return 0    // no damage
    case 'success':         return 0.5  // half damage
    case 'failure':         return 1    // full damage
    case 'criticalFailure': return 2    // double damage
  }
}
