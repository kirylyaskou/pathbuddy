import { stripHtml } from './html'

export interface ResolveFoundryTokensOptions {
  /** Effective `@item.level` for expressions like `ceil(@item.level/2)`. For
   *  cantrips this is the heightened rank (`ceil(casterLevel/2)`), for ranked
   *  spells it's the slot rank. Omit to leave unresolved. */
  itemLevel?: number
}

/**
 * Resolve simple `@item.level` arithmetic expressions. Handles `ceil(...)`,
 * `floor(...)`, and bare `@item.level`. Returns the original string when
 * expression shape is unsupported.
 */
function resolveItemLevelExpr(expr: string, itemLevel: number | undefined): string {
  if (itemLevel === undefined) return expr
  // ceil(@item.level/N)
  expr = expr.replace(/ceil\(\s*@item\.level\s*\/\s*(\d+)\s*\)/gi, (_, n: string) =>
    String(Math.ceil(itemLevel / parseInt(n, 10))),
  )
  // floor(@item.level/N)
  expr = expr.replace(/floor\(\s*@item\.level\s*\/\s*(\d+)\s*\)/gi, (_, n: string) =>
    String(Math.floor(itemLevel / parseInt(n, 10))),
  )
  // @item.level alone
  expr = expr.replace(/@item\.level/g, String(itemLevel))
  return expr
}

/**
 * Resolve Foundry VTT inline tokens to human-readable text.
 * Handles @UUID, @Condition, @Damage, @Check, @Template, [[/act]], [[/br]], etc.
 */
export function resolveFoundryTokens(text: string, options: ResolveFoundryTokensOptions = {}): string {
  const { itemLevel } = options
  // @UUID with alias → alias text
  text = text.replace(/@UUID\[[^\]]*\]\{([^}]+)\}/g, '$1')
  // @UUID without alias → last path segment (Foundry IDs ~16 chars are dropped)
  text = text.replace(/@UUID\[([^\]]+)\]/g, (_, path: string) => {
    const seg = path.split('.').pop() ?? ''
    return /^[A-Za-z0-9]{16,}$/.test(seg) ? '' : seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  })
  // @Condition[slug]{alias} or @Condition[slug]
  text = text.replace(/@Condition\[[^\]]*\]\{([^}]+)\}/g, '$1')
  text = text.replace(/@Condition\[([^\]]+)\]/g, (_, slug: string) =>
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
  // @Damage: supports one level of nested brackets so that forms like
  // `@Damage[(ceil(@item.level/2))[persistent,acid]]` parse correctly.
  // Outer match: @Damage[ ... ] where inner allows `[...]` sub-tokens.
  text = text.replace(/@Damage\[((?:[^\[\]]|\[[^\]]*\])*)\]/g, (_, inner: string) =>
    inner.split(/,\s*(?![^\[]*\])/).map((p: string) => {
      const trimmed = p.trim()
      // Match "formula[type1,type2,...]" — the formula part can contain nested
      // parens/operators (ceil/floor/@item.level). Lazy up to the last `[`.
      const m = trimmed.match(/^(.+?)\[([^\]]+)\]$/)
      if (!m) return resolveItemLevelExpr(trimmed, itemLevel)
      const formula = resolveItemLevelExpr(m[1].trim(), itemLevel)
      // Strip parens that wrapped a pure numeric result so `(4)` → `4`.
      const cleanFormula = /^\(\s*-?\d+(?:\.\d+)?\s*\)$/.test(formula) ? formula.slice(1, -1).trim() : formula
      // Types are comma-separated, each may carry Foundry `|options:...`
      // metadata (e.g. `void|options:area-damage`) — strip everything after
      // the first `|` for display.
      const types = m[2]
        .split(/,\s*/)
        .map((t: string) => t.split('|')[0]!.trim())
        .filter(Boolean)
        .join(' ')
      return `${cleanFormula} ${types}`.trim()
    }).join(' plus ')
  )
  // @Check[type:perception|dc:20] → "DC 20 Perception check"
  // @Check[will|dc:17] → "DC 17 Will check" (Foundry positional)
  // @Check[dc:25] → "DC 25" (no type)
  text = text.replace(/@Check\[([^\]]+)\]/g, (_, inner: string) => {
    const segments = inner.split('|')
    const params: Record<string, string> = {}
    let positionalType: string | undefined
    for (const seg of segments) {
      if (seg.includes(':')) {
        const [k, v] = seg.split(':')
        params[k] = v
      } else if (!positionalType && seg) {
        positionalType = seg
      }
    }
    const rawType = params.type ?? positionalType
    if (!rawType) {
      return params.dc ? `DC ${params.dc}` : 'flat check'
    }
    const type = rawType.charAt(0).toUpperCase() + rawType.slice(1)
    const dc = params.dc ? `DC ${params.dc} ` : ''
    return `${dc}${type} check`
  })
  // Collapse accidental duplicate " check check" from source text that
  // already had a manual " check" suffix after the token.
  text = text.replace(/\bcheck\s+check\b/gi, 'check')
  // @Template[type:cone|distance:15] → "15-foot cone"
  text = text.replace(/@Template\[([^\]]+)\]/g, (_, inner: string) => {
    const params = Object.fromEntries(inner.split('|').map((p: string) => p.split(':')))
    return `${params.distance ?? '?'}-foot ${params.type ?? 'area'}`
  })
  // [[/act slug]] → readable action name
  text = text.replace(/\[\[\/act\s+([^#\s\]]*)[^\]]*\]\]/g, (_, slug: string) => {
    if (!slug) return ''
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  })
  // [[/br expr #label]]{display} → display text
  text = text.replace(/\[\[\/br\s+[^\]]*\]\]\{([^}]+)\}/g, '$1')
  // [[/br expr]] → expr
  text = text.replace(/\[\[\/br\s+([^#\s\]]+)[^\]]*\]\]/g, '$1')
  // {Nfeet} → "N feet"
  text = text.replace(/\{(\d+)feet?\}/gi, '$1 feet')
  // Strip remaining unresolved @ tokens
  text = text.replace(/@\w+\[[^\]]*\](?:\{[^}]*\})?/g, '')
  return text
}

/**
 * Resolve Foundry tokens then strip HTML — canonical sanitize for display text.
 * Optional `itemLevel` resolves `@item.level` expressions in @Damage formulas.
 */
export function sanitizeFoundryText(
  html: string | null | undefined,
  options: ResolveFoundryTokensOptions = {},
): string {
  if (!html) return ''
  return stripHtml(resolveFoundryTokens(html, options))
}
