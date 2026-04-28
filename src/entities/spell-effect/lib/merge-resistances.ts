type ResistanceBase = { type: string; value: number; exceptions?: string[]; doubleVs?: string[] }

/**
 * Merge spell effect resistances into base creature resistances.
 * For each damage type, keeps the higher value (take max per type).
 * New types from overlays are added if not present in base.
 * exceptions and doubleVs from base entries are preserved when base wins.
 */
export function mergeResistances(
  base: ResistanceBase[],
  overlays: { type: string; value: number }[],
): ResistanceBase[] {
  const baseMap = new Map(base.map((r) => [r.type, r]))
  for (const r of overlays) {
    const current = baseMap.get(r.type)
    if (!current || r.value > current.value) {
      // overlay wins — store without exceptions/doubleVs (spell effects don't have them)
      baseMap.set(r.type, { type: r.type, value: r.value })
    }
  }
  return Array.from(baseMap.values())
}
