import { exportEncounter } from './export-encounter'
import type { PathmaidenV1Encounter, PathmaidenV1Export } from './export-encounter'

export interface PathmaidBundleV1 {
  version: 'pathmaid-bundle-v1'
  exportedAt: string
  encounters: PathmaidenV1Encounter[]
}

/** Filename: "pathmaid-encounters-YYYY-MM-DD.pathmaid" (UTC date — file metadata, not localised). */
export function buildBundleFilename(date: Date = new Date()): string {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `pathmaid-encounters-${yyyy}-${mm}-${dd}.pathmaid`
}

/** Export multiple encounters as a single .pathmaid bundle.
 *  Reuses exportEncounter to guarantee identical per-encounter schema
 *  and avoid duplicating the lookupCanonicalName resolution logic. */
export async function exportEncountersBundle(
  encounterIds: string[]
): Promise<{ filename: string; content: string }> {
  const encounters: PathmaidenV1Encounter[] = []
  for (const id of encounterIds) {
    const { content } = await exportEncounter(id)
    const single = JSON.parse(content) as PathmaidenV1Export
    encounters.push(single.encounter)
  }
  const payload: PathmaidBundleV1 = {
    version: 'pathmaid-bundle-v1',
    exportedAt: new Date().toISOString(),
    encounters,
  }
  return {
    filename: buildBundleFilename(),
    content: JSON.stringify(payload, null, 2),
  }
}
