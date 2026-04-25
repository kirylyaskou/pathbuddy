/**
 * Safe HTML renderer for translation content.
 *
 * Input: raw HTML from vendored Babele/Foundry pack content (see
 * shared/i18n/pf2e-content/ingest).
 * Output: sanitized React node.
 *
 * Pipeline:
 *   1. Pre-process Foundry inline tokens (`@UUID[...]{label}`, `@Trait[...]`,
 *      `@Check[...]`, `@Damage[...]`, generic `@Kind[ref]{label}`) into span
 *      elements with semantic class names. Runs FIRST so the injected markup
 *      passes through the same DOMPurify allowlist.
 *   2. Pre-process action-cost tokens (`[one-action]`, `[reaction]`, …)
 *      into span elements carrying canonical PF2e glyphs.
 *   3. DOMPurify sanitize with an explicit tag+attribute allowlist. Anything
 *      outside the allowlist (script, iframe, onclick handlers, inline styles)
 *      is stripped.
 *   4. Render via dangerouslySetInnerHTML — necessary because pack content
 *      contains rich structure (lists, tables, collapsibles, nested
 *      bold/italic). Constructing React nodes manually would require a full
 *      HTML parser and still end up as dangerouslySetInnerHTML internally.
 *
 * XSS posture:
 *   - DOMPurify is the single source of sanitization (no hand-rolled regex).
 *   - ALLOWED_TAGS is a whitelist — additions must be reviewed for XSS impact.
 *   - ALLOWED_ATTR limited to `class` (styling hooks) and `data-trait` (used
 *     for trait-pill hover wiring at the component layer). No `style`, no
 *     `on*`, no `href` (Foundry @UUID tokens are normalized to plain spans).
 *   - `ALLOW_DATA_ATTR: false` keeps every other data-* attribute out, even
 *     though `data-trait` is whitelisted explicitly via ALLOWED_ATTR.
 */

import DOMPurify from 'dompurify'
import { useMemo } from 'react'
import { cn } from '@/shared/lib/utils'
import { actionCostLabel } from '@/shared/lib/pf2e-display'

const ALLOWED_TAGS = [
  // Text structure
  'b', 'strong', 'i', 'em', 'u', 'br', 'hr', 'p',
  // Inline containers
  'span',
  // Headings (Babele uses h2/h3 inside collapsibles and item breakdowns)
  'h2', 'h3',
  // Lists (frequent in description / descriptionGM blocks)
  'ul', 'ol', 'li',
  // Tables (mutation tables, ability charts)
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  // Collapsibles (descriptionGM uses <details><summary>)
  'details', 'summary',
]

const ALLOWED_ATTR = ['class', 'data-trait']

const ACTION_TOKEN_MAP: Record<string, string> = {
  'one-action': actionCostLabel('1'),
  'two-actions': actionCostLabel('2'),
  'three-actions': actionCostLabel('3'),
  'reaction': actionCostLabel('reaction'),
  'free-action': actionCostLabel('free'),
}

const ACTION_TOKEN_REGEX = /\[(one-action|two-actions|three-actions|reaction|free-action)\]/g

/**
 * Replace `[one-action]` style tokens with span-wrapped glyphs.
 * The wrapper class `pf2e-action-cost` lets us style them uniformly via
 * globals.css (monospace font, slight kerning to group the diamonds).
 */
function preprocessActionTokens(html: string): string {
  return html.replace(ACTION_TOKEN_REGEX, (_match, token) => {
    const glyph = ACTION_TOKEN_MAP[token as keyof typeof ACTION_TOKEN_MAP] ?? ''
    return `<span class="pf2e-action-cost" aria-label="${token}">${glyph}</span>`
  })
}

/**
 * Replace Foundry inline-link tokens (`@UUID[ref]{label}`, `@Trait[slug]`,
 * `@Check[…]{label}`, `@Damage[formula]`, generic `@Kind[ref]{label}`)
 * with semantically-classed `<span>` elements that survive DOMPurify.
 *
 * The reference component of @UUID is intentionally dropped — Foundry-side
 * UUIDs are not resolvable in PathMaid's offline DB. Trait `data-trait`
 * survives the allowlist so a future hover-tooltip wiring can read it.
 */
function preprocessFoundryTokens(html: string): string {
  let out = html
  out = out.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, '<span class="pf2e-uuid-ref">$1</span>')
  out = out.replace(/@UUID\[[^\]]+\]/g, '')
  out = out.replace(/@Trait\[([^\]]+)\]\{([^}]+)\}/g, '<span class="pf2e-trait" data-trait="$1">$2</span>')
  out = out.replace(/@Trait\[([^\]]+)\]/g, '<span class="pf2e-trait" data-trait="$1">$1</span>')
  out = out.replace(/@Check\[[^\]]+\]\{([^}]+)\}/g, '<span class="pf2e-check">$1</span>')
  out = out.replace(/@Damage\[([^\]]+)\]/g, '<span class="pf2e-damage">$1</span>')
  out = out.replace(/@\w+\[[^\]]+\]\{([^}]+)\}/g, '<span>$1</span>')
  out = out.replace(/@\w+\[([^\]]+)\]/g, '<span>$1</span>')
  return out
}

export interface SafeHtmlProps {
  html: string
  className?: string
  /** Override the outer tag (default: <div>). Use 'span' for inline contexts. */
  as?: 'div' | 'span'
}

export function SafeHtml({ html, className, as = 'div' }: SafeHtmlProps) {
  const sanitized = useMemo(() => {
    const tokensExpanded = preprocessFoundryTokens(html)
    const actionsExpanded = preprocessActionTokens(tokensExpanded)
    return DOMPurify.sanitize(actionsExpanded, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      USE_PROFILES: { html: true },
    })
  }, [html])

  const Tag = as
  return (
    <Tag
      className={cn('pf2e-safe-html', className)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
