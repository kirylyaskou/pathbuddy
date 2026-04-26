/**
 * React hook for looking up bundled content translations.
 *
 * Thin wrapper around `getTranslation()` that:
 *   - reads current locale from i18next (useTranslation())
 *   - short-circuits to null when locale === 'en' (no network, no DB round-trip)
 *   - runs the lookup as a simple fetch-on-change effect (no TanStack Query
 *     dep — single-row lookups against a local SQLite table are cheap and
 *     don't need caching/invalidation infrastructure)
 *   - recomputes on kind/name/level/locale change
 *
 * Returns `{ data, isLoading, locale }`:
 *   - `data === null` → caller must render the English original
 *   - `data.textLoc` / `data.nameLoc` / `data.traitsLoc` → raw RU HTML for existing consumers
 *   - `data.structured` → typed `MonsterStructuredLoc` (monster kind only; null for
 *     other kinds or when the parser produced no output). Consumers (e.g.
 *     CreatureStatBlock) use this for structured overlays without touching raw JSON.
 *
 * Callers: CreatureCard, StatBlockModal, SpellCard, ItemCard, FeatDetail,
 * ActionsPage. Each one owns the conditional render branch; the hook stays
 * pure data-access.
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getTranslation, getCreatureItem, type TranslationKind, type TranslationRow } from '@/shared/api'
import type { AbilityLoc } from './pf2e-content/lib'

interface UseContentTranslationResult {
  data: TranslationRow | null
  isLoading: boolean
  locale: string
}

export function useContentTranslation(
  kind: TranslationKind,
  name: string | null | undefined,
  level: number | null | undefined,
): UseContentTranslationResult {
  const { i18n } = useTranslation()
  const locale = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0]

  const [data, setData] = useState<TranslationRow | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 'en' or missing name → no lookup, no loading state.
    if (locale === 'en' || !name) {
      setData(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    getTranslation(kind, name, level ?? null, locale)
      .then((row) => {
        if (!cancelled) setData(row)
      })
      .catch((err) => {
        console.warn('[useContentTranslation]', err)
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [kind, name, level, locale])

  return { data, isLoading, locale }
}

export interface UseCreatureItemResult {
  data: AbilityLoc | null
  isLoading: boolean
  locale: string
}

/**
 * Resolve a per-creature item (weapon or special ability) to its localized
 * { name, description } overlay. Designed as the stable consumer surface
 * for contexts where the full creature stat-block context is unavailable —
 * e.g. encounter sheet preview rows that show one ability without mounting
 * a full CreatureStatBlock.
 *
 * Hot-path optimization: when callers already hold an in-memory Map
 * (`itemsLocById` built from MonsterStructuredLoc.items in CreatureStatBlock),
 * pass `localFallback` to skip the async DB call and return the Map value
 * synchronously. The DB fallback fires only when localFallback is undefined
 * AND locale !== 'en' AND creatureName/itemId both non-empty.
 *
 * No-N+1 contract: when a parent already built itemsLocById, ALL children
 * pass their Map.get(id) result as localFallback — never triggering
 * the DB path. The API path is reserved for genuinely cold contexts.
 *
 * Three return states (mirroring getCreatureItem):
 *   - data === null              → no overlay; caller renders engine EN.
 *   - data.description undefined → name-only overlay (Babele entry sans description).
 *   - data.description string    → full overlay; caller renders SafeHtml(description).
 */
export function useCreatureItem(
  creatureName: string | null | undefined,
  itemId: string | null | undefined,
  localFallback?: AbilityLoc | undefined,
): UseCreatureItemResult {
  const { i18n } = useTranslation()
  const locale = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0]

  // Synchronous fast path — caller already has the structured Map. Skip
  // any DB roundtrip. This branch covers ~100% of CreatureStatBlock usage.
  const initial: AbilityLoc | null = localFallback ?? null
  const [data, setData] = useState<AbilityLoc | null>(initial)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Fast path — local fallback supplied OR locale=en OR missing inputs.
    if (localFallback !== undefined) {
      setData(localFallback)
      setIsLoading(false)
      return
    }
    if (locale === 'en' || !creatureName || !itemId) {
      setData(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    getCreatureItem(creatureName, itemId, locale)
      .then((row) => {
        if (cancelled) return
        if (row === null) {
          setData(null)
        } else {
          // getCreatureItem returns description: string | null; AbilityLoc has description?: string.
          // Convert null → undefined to match AbilityLoc shape exactly.
          setData({
            name: row.name,
            ...(row.description !== null && { description: row.description }),
          })
        }
      })
      .catch((err) => {
        console.warn('[useCreatureItem]', err)
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [creatureName, itemId, locale, localFallback])

  return { data, isLoading, locale }
}
