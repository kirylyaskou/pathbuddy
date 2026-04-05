import type { PathbuilderBuild } from './types'

/**
 * Calculates the maximum HP for a Pathbuilder 2e character.
 *
 * Formula: ancestryhp + (classhp + bonushp + CON_mod) × level
 * Source: PF2e Player Core, Hit Points rules.
 *
 * Example: Dwarf Fighter 5, CON 16
 *   CON_mod = floor((16 - 10) / 2) = 3
 *   Max HP  = 10 + (10 + 0 + 3) × 5 = 75
 */
export function calculatePCMaxHP(build: PathbuilderBuild): number {
  const { ancestryhp, classhp, bonushp } = build.attributes
  const conMod = Math.floor((build.abilities.con - 10) / 2)
  return ancestryhp + (classhp + bonushp + conMod) * build.level
}
