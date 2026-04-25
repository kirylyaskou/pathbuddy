/**
 * Trait dictionary — Foundry kebab-case slug to localized label and description.
 *
 * Source: top-level `PF2E.*` keys in pf2e.json. The upstream module stores
 * ~890 trait labels under `Trait<PascalCase>` keys and ~500 descriptions
 * under `TraitDescription<PascalCase>`. UI strings such as `Traits` and
 * `TraitsLabel` (no capitalized suffix beyond the prefix) are excluded by
 * the regex.
 *
 * Naming: PascalCase suffix → lowercase kebab-case via a two-step regex
 * (separator before each capital + acronym-aware boundary). Engine traits
 * are lowercase kebab (see engine/types.ts: `traits: string[]`, examples
 * include 'humanoid', 'serpentfolk').
 *
 * Numbered variants: `TraitAdditive0..3` produce slugs `additive-0..3`.
 * Bare `TraitAdditive` also exists and resolves to `additive`. Any trait
 * whose actual Foundry slug does not match the derived kebab silently
 * falls back to slug.
 *
 * Getter contracts:
 *   - getTraitLabel(slug, locale)
 *       locale='en' → echoes slug
 *       locale='ru' → Map lookup; silent slug fallback when missing
 *                     (production build emits no console.warn)
 *   - getTraitDescription(slug, locale): string | null
 *       locale='en' → null (EN canonical descriptions not covered)
 *       locale='ru' → Map lookup; null when missing (UI hides tooltip)
 *
 * Performance: extraction is one Object.entries pass at module init;
 * getter calls are O(1) Map lookups with no allocation.
 *
 * Source: vendor/pf2e-locale-ru/pf2e/pf2e.json
 * Vendor metadata: vendor/pf2e-locale-ru/VERSION.txt
 */

import pf2eJson from '@vendor/pf2e-locale-ru/pf2e/pf2e.json'
import type { SupportedLocale } from '@/shared/i18n/config'

function pascalToKebab(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

const ROOT = (pf2eJson as { PF2E: Record<string, unknown> }).PF2E

const TRAIT_LABELS = new Map<string, string>()
const TRAIT_DESCRIPTIONS = new Map<string, string>()

for (const [key, value] of Object.entries(ROOT)) {
  if (typeof value !== 'string') continue
  const descMatch = /^TraitDescription([A-Z].*)$/.exec(key)
  if (descMatch) {
    TRAIT_DESCRIPTIONS.set(pascalToKebab(descMatch[1]), value)
    continue
  }
  const labelMatch = /^Trait([A-Z].*)$/.exec(key)
  if (labelMatch) {
    TRAIT_LABELS.set(pascalToKebab(labelMatch[1]), value)
  }
}

export function getTraitLabel(slug: string, locale: SupportedLocale): string {
  if (locale === 'en') return slug
  return TRAIT_LABELS.get(slug) ?? slug
}

export function getTraitDescription(
  slug: string,
  locale: SupportedLocale,
): string | null {
  if (locale === 'en') return null
  return TRAIT_DESCRIPTIONS.get(slug) ?? null
}
