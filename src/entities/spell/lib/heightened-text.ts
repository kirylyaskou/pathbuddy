/**
 * Extract Heightened (+N) blocks from a spell HTML description and (when an
 * effective rank is known) scale matching numeric properties in the main body.
 *
 * Foundry's `system.heightening` is dice-only — fixed numeric scalings such as
 * Shield's Hardness are described in plain prose. This utility parses those
 * lines so the UI can:
 *   1. Show heightened blocks as a separate, visually distinct section.
 *   2. Substitute the scaled value (e.g. "Hardness 5" → "Hardness 15") in the
 *      main description when the spell is cast above its base rank.
 */

export interface HeightenedBlock {
  /** Step in ranks between successive bumps (e.g. "+2" → 2). */
  step: number
  /** Raw inner text of the heightened paragraph (with HTML tags stripped). */
  text: string
  /** Detected scaling targets — one per "X increases by N" hit. */
  scalings: Array<{ property: string; amount: number }>
}

export interface ParsedHeightening {
  /** Description with all `<p>Heightened (+N) ...</p>` blocks removed. */
  mainHtml: string
  blocks: HeightenedBlock[]
}

// `<p><strong>Heightened (+2)</strong> The shield's Hardness increases by 5.</p>`
// — Foundry pf2e wraps the heightened prefix in <strong>; tolerate any optional
// inline tag(s) before "Heightened".
const HEIGHTENED_BLOCK_RE = /<p[^>]*>\s*(?:<\w+[^>]*>\s*)*Heightened\s*\(\+(\d+)\)\s*(?:<\/\w+>\s*)*([\s\S]*?)<\/p>/gi
const SCALING_RE = /(?:the\s+(?:spell|shield|target|creature)?(?:'s)?\s+)?([A-Za-z][A-Za-z\s-]{0,30})\s+(?:is\s+)?increases?\s+by\s+(\d+)/gi

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Pulls all heightened blocks out of an HTML description and returns the
 * remaining "main" body plus the structured blocks.
 */
export function extractHeightening(html: string | null | undefined): ParsedHeightening {
  if (!html) return { mainHtml: '', blocks: [] }

  const blocks: HeightenedBlock[] = []
  let mainHtml = html.replace(HEIGHTENED_BLOCK_RE, (_match, stepStr: string, body: string) => {
    const text = stripHtml(body)
    const step = parseInt(stepStr, 10)
    const scalings: HeightenedBlock['scalings'] = []
    SCALING_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = SCALING_RE.exec(text)) !== null) {
      const property = m[1].trim().split(/\s+/).pop() ?? ''
      const amount = parseInt(m[2], 10)
      if (property.length > 0 && Number.isFinite(amount)) {
        scalings.push({ property, amount })
      }
    }
    blocks.push({ step, text, scalings })
    return ''
  })

  // Tidy up any double-blank-paragraphs left behind.
  mainHtml = mainHtml.replace(/(<p[^>]*>\s*<\/p>\s*){2,}/gi, '<p></p>').trim()

  return { mainHtml, blocks }
}

/**
 * Applies heightened numeric scalings to the main description body. For each
 * scaling `{ property: "Hardness", amount: 5 }` with step 2 in a block, when
 * `effectiveRank > baseRank`, replaces every standalone "Hardness {N}" hit
 * with the scaled value.
 *
 * Returns the original body untouched when no scaling applies.
 */
export function applyHeightenedScalings(
  mainHtml: string,
  blocks: HeightenedBlock[],
  effectiveRank: number,
  baseRank: number,
): string {
  if (effectiveRank <= baseRank) return mainHtml
  if (blocks.length === 0) return mainHtml

  let out = mainHtml
  for (const block of blocks) {
    if (block.step <= 0) continue
    const increments = Math.floor((effectiveRank - baseRank) / block.step)
    if (increments <= 0) continue
    for (const { property, amount } of block.scalings) {
      const propRe = new RegExp(`(\\b${escapeRegExp(property)}\\s+)(\\d+)`, 'gi')
      out = out.replace(propRe, (_match, prefix: string, valueStr: string) => {
        const base = parseInt(valueStr, 10)
        if (!Number.isFinite(base)) return _match
        return `${prefix}${base + increments * amount}`
      })
    }
  }
  return out
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
