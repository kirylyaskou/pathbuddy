/**
 * Pure transform from a Babele actor entry to MonsterStructuredLoc.
 *
 * Babele packs ship overlay deltas: a field appears only when the upstream
 * translation differs from the engine's English source. Numeric values
 * (HP/AC/save totals, ability scores, perception number) stay in
 * engine.creature.* — duplicating them here would create a two-source-of-truth
 * risk.
 *
 * Fields prefixed with underscore in pack JSON (e.g. `_descriptionGM`) are
 * the Babele convention for disabled translations and are intentionally
 * dropped by this adapter.
 */

import type { MonsterStructuredLoc } from '../lib/types'

export interface BabeleActorEntry {
  name?: string
  blurb?: string
  description?: string
  descriptionGM?: string
  language?: string
  senses?: string
  speed?: string
  hp?: string
  ac?: string
  allSaves?: string
  stealth?: string
  skills?: Record<string, { details?: string }>
  items?: Array<{
    id: string
    name: string
    description?: string
    rules?: Record<string, { label?: string }>
  }>
  [key: string]: unknown
}

export interface BabelePackFile {
  label: string
  mapping?: Record<string, unknown>
  entries: Record<string, BabeleActorEntry>
}

export function isActorPack(pack: BabelePackFile): boolean {
  if (!pack.mapping || typeof pack.mapping !== 'object') return false
  const fields = Object.keys(pack.mapping)
  return fields.includes('items') && fields.includes('description')
}

/**
 * Detect a spell-shaped pack: spell entries carry name + description text
 * with spell-specific overlay fields (range, duration, time, heightening,
 * cost, target) but no items[]. Used to route the spells-srd pack into
 * the simpler text-overlay path (no MonsterStructuredLoc).
 */
export function isSpellPack(pack: BabelePackFile): boolean {
  if (!pack.mapping || typeof pack.mapping !== 'object') return false
  const fields = Object.keys(pack.mapping)
  return (
    !fields.includes('items') &&
    fields.includes('range') &&
    fields.includes('duration') &&
    fields.includes('heightening')
  )
}

/**
 * Babele spell entry — minimal shape consumed by adapter. Full schema
 * carries more fields (target, time, cost, etc.) but they are not needed
 * for the current text-overlay rendering path.
 */
export interface BabeleSpellEntry {
  name?: string
  description?: string
  [key: string]: unknown
}

/**
 * Pure transform: Babele spell entry → minimal text-overlay row payload.
 * Spells use a simpler shape than monsters — no structured_json yet, just
 * RU display name and HTML description in text_loc.
 */
export function adaptBabeleSpellEntry(
  entry: BabeleSpellEntry,
): { name: string; description: string } {
  if (entry === null || typeof entry !== 'object') {
    throw new Error('Invalid Babele spell entry: not an object')
  }
  return {
    name: typeof entry.name === 'string' ? entry.name : '',
    description: typeof entry.description === 'string' ? entry.description : '',
  }
}

export function adaptBabeleActorEntry(
  entry: BabeleActorEntry,
): MonsterStructuredLoc {
  if (entry === null || typeof entry !== 'object') {
    throw new Error('Invalid Babele entry: not an object')
  }

  const items: MonsterStructuredLoc['items'] = []
  if (Array.isArray(entry.items)) {
    for (const item of entry.items) {
      if (!item || typeof item !== 'object') continue
      if (typeof item.id !== 'string' || typeof item.name !== 'string') continue
      items.push({
        id: item.id,
        name: item.name,
        ...(item.description !== undefined && { description: item.description }),
        ...(item.rules !== undefined && { rules: item.rules }),
      })
    }
  }

  return {
    ...(entry.blurb !== undefined && { blurb: entry.blurb }),
    ...(entry.description !== undefined && { description: entry.description }),
    ...(entry.descriptionGM !== undefined && { descriptionGM: entry.descriptionGM }),
    ...(entry.language !== undefined && { languageDetails: entry.language }),
    ...(entry.senses !== undefined && { sensesDetails: entry.senses }),
    ...(entry.speed !== undefined && { speedDetails: entry.speed }),
    ...(entry.hp !== undefined && { hpDetails: entry.hp }),
    ...(entry.ac !== undefined && { acDetails: entry.ac }),
    ...(entry.allSaves !== undefined && { allSavesDetails: entry.allSaves }),
    ...(entry.stealth !== undefined && { stealthDetails: entry.stealth }),
    ...(entry.skills !== undefined && { skillsDetails: entry.skills }),
    items,
  }
}
