/**
 * Pack ingest orchestrator — reads vendored Babele packs and produces
 * DB-ready translation rows.
 *
 * Splitting orchestration from DB I/O keeps the adapter testable and lets
 * the loader (the entry point that owns the DB handle) drive the INSERT
 * loop in a single pass without holding an open transaction across the
 * glob enumeration. Per-row error tolerance: a malformed entry is logged
 * and skipped — one bad record never aborts seeding of the rest.
 */

import type { MonsterStructuredLoc } from '../lib/types'
import {
  adaptBabeleActorEntry,
  adaptBabeleSpellEntry,
  isActorPack,
  isSpellPack,
  type BabelePackFile,
  type BabeleSpellEntry,
} from './pack-adapter'

export interface MonsterTranslationRow {
  packKey: string
  packLabel: string
  packPath: string
  nameLoc: string
  textLoc: string
  structured: MonsterStructuredLoc
}

export interface SpellTranslationRow {
  packKey: string
  packLabel: string
  packPath: string
  nameLoc: string
  textLoc: string
}

const packFiles = import.meta.glob('/vendor/pf2e-locale-ru/pf2e/packs/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, BabelePackFile>

export function collectMonsterTranslations(): MonsterTranslationRow[] {
  const rows: MonsterTranslationRow[] = []

  for (const [path, pack] of Object.entries(packFiles)) {
    if (!isActorPack(pack)) continue

    if (!pack.entries || typeof pack.entries !== 'object') {
      console.warn(`[ingest] ${path}: missing or invalid entries field`)
      continue
    }

    for (const [packKey, entry] of Object.entries(pack.entries)) {
      if (!entry || typeof entry !== 'object') {
        console.warn(`[ingest] ${path}: skipping non-object entry "${packKey}"`)
        continue
      }
      if (typeof entry.name !== 'string' || entry.name.length === 0) {
        console.warn(`[ingest] ${path}: skipping entry "${packKey}" without name`)
        continue
      }

      try {
        const structured = adaptBabeleActorEntry(entry)
        rows.push({
          packKey,
          packLabel: pack.label,
          packPath: path,
          nameLoc: entry.name,
          textLoc: entry.description ?? '',
          structured,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[ingest] ${path}: adapter failed for "${packKey}": ${msg}`)
      }
    }
  }

  return rows
}

export function collectSpellTranslations(): SpellTranslationRow[] {
  const rows: SpellTranslationRow[] = []
  const spellPackFiles = packFiles as unknown as Record<
    string,
    BabelePackFile & { entries: Record<string, BabeleSpellEntry> }
  >

  for (const [path, pack] of Object.entries(spellPackFiles)) {
    if (!isSpellPack(pack)) continue

    if (!pack.entries || typeof pack.entries !== 'object') {
      console.warn(`[ingest] ${path}: missing or invalid entries field`)
      continue
    }

    for (const [packKey, entry] of Object.entries(pack.entries)) {
      if (!entry || typeof entry !== 'object') {
        console.warn(`[ingest] ${path}: skipping non-object spell entry "${packKey}"`)
        continue
      }
      if (typeof entry.name !== 'string' || entry.name.length === 0) {
        console.warn(`[ingest] ${path}: skipping spell entry "${packKey}" without name`)
        continue
      }

      try {
        const adapted = adaptBabeleSpellEntry(entry)
        rows.push({
          packKey,
          packLabel: pack.label,
          packPath: path,
          nameLoc: adapted.name,
          textLoc: adapted.description,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[ingest] ${path}: spell adapter failed for "${packKey}": ${msg}`)
      }
    }
  }

  return rows
}
