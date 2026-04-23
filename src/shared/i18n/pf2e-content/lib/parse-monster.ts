/**
 * HTML stat block parser for PF2e monster RU localizations.
 *
 * Contract:
 *   parseMonsterRuHtml(textEn, rusText) → MonsterStructuredLoc | null
 *
 * Inputs:
 *   textEn  — English HTML stat block (optional; used for ability name matching)
 *   rusText — Russian HTML stat block from pf2.ru (primary parse target)
 *
 * Returns null when:
 *   - rusText is falsy (null, undefined, empty string)
 *   - DOMParser.parseFromString() throws (malformed input causing parser failure)
 *
 * Returns MonsterStructuredLoc with empty arrays / default labels when:
 *   - rusText parses successfully but a specific section is missing or malformed
 *   - Individual field extractors fail (each wraps in try/catch with safe default)
 *
 * WHY numeric values are not parsed:
 *   Bonuses, damage dice, HP, AC, DC values are engine-computed (D-03).
 *   Parsing them here would create a two-source-of-truth risk. Consumers
 *   (Phase 88) read structural labels/names here and engine values elsewhere.
 */

import type {
  MonsterStructuredLoc,
  AbilityLoc,
  AbilityScoresLoc,
  SkillLoc,
  SpeedsLoc,
  SavesLoc,
  StrikeLoc,
} from './types'

// ---------------------------------------------------------------------------
// Skill dictionary (RU display name → EN canonical engine key)
// 17 PF2e core skills per D-05
// ---------------------------------------------------------------------------
const SKILL_RU_TO_EN: Record<string, string> = {
  Акробатика: 'Acrobatics',
  Искусство: 'Arcana',
  Атлетика: 'Athletics',
  Ремесло: 'Crafting',
  Обман: 'Deception',
  Дипломатия: 'Diplomacy',
  Запугивание: 'Intimidation',
  Медицина: 'Medicine',
  Природа: 'Nature',
  Оккультизм: 'Occultism',
  Исполнение: 'Performance',
  Религия: 'Religion',
  Общество: 'Society',
  Скрытность: 'Stealth',
  Выживание: 'Survival',
  Воровство: 'Thievery',
  Внимание: 'Perception',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert HTML string to markdown-lite text.
 * Handles bold, italic, br, hr, action markers.
 * Returns plain text with markdown-lite conventions.
 */
function htmlToMarkdownLite(html: string): string {
  // Replace <br> variants first (before DOM stripping)
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    .replace(/<b>(.*?)<\/b>/gis, '**$1**')
    .replace(/<strong>(.*?)<\/strong>/gis, '**$1**')
    .replace(/<i>(.*?)<\/i>/gis, '*$1*')
    .replace(/<em>(.*?)<\/em>/gis, '*$1*')
    // Strip remaining tags but preserve inner text
    .replace(/<[^>]+>/g, '')
    // Normalize HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Collapse multiple spaces (but preserve \n)
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim()

  return text
}

/**
 * Get the inner HTML of an element as a string, for further processing.
 * Falls back to textContent if innerHTML unavailable.
 */
function getInnerHtml(el: Element): string {
  return el.innerHTML ?? el.textContent ?? ''
}

/**
 * Strip a trailing numeric value from a comma-token.
 * "холодное железо 5" → "холодное железо"
 * "холод 10" → "холод"
 * "благословлённое оружие" → "благословлённое оружие" (unchanged)
 *
 * WHY: Engine owns weakness/resistance magnitudes. Parser returns text
 * labels only — numeric bonuses must not leak into localization output.
 */
function stripTrailingNumber(s: string): string {
  return s.replace(/\s+\d+\s*$/, '').trim()
}

// ---------------------------------------------------------------------------
// Field extractors
// ---------------------------------------------------------------------------

function extractPerception(rusBody: Element): {
  label: string
  senses: string
} {
  try {
    const bodyHtml = rusBody.innerHTML
    // Match <b>Внимание</b> or <b>Восприятие</b>
    const match = /<b>(Внимание|Восприятие)<\/b>\s*[+\-]?\d+\s*;?\s*([^<\n]*)/i.exec(bodyHtml)
    if (!match) return { label: 'Внимание', senses: '' }

    const label = match[1]
    const sensesRaw = match[2]?.trim() ?? ''
    // Clean up the senses text
    const senses = sensesRaw.replace(/[;,\s]+$/, '').trim()
    return { label, senses }
  } catch {
    return { label: 'Внимание', senses: '' }
  }
}

function extractLanguages(rusBody: Element): string[] {
  try {
    const bodyHtml = rusBody.innerHTML
    // Match <b>Языки</b>: ... content
    const match = /<b>Язык[иа]<\/b>\s*:?\s*([^<\n]+)/i.exec(bodyHtml)
    if (!match) return []

    const raw = match[1].trim()
    return raw
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  } catch {
    return []
  }
}

function extractSkills(rusBody: Element): SkillLoc[] {
  try {
    const bodyHtml = rusBody.innerHTML
    // Match <b>Навыки</b>: SkillName +N, ...
    const match = /<b>Навыки<\/b>\s*:?\s*([^<\n]+)/i.exec(bodyHtml)
    if (!match) return []

    const raw = match[1].trim()
    const skills: SkillLoc[] = []

    // Parse "Акробатика +14, Обман +18, ..."
    const skillPattern = /([А-Яа-яёЁ][А-Яа-яёЁ\s]*?)\s*([+\-]\d+)/g
    let m: RegExpExecArray | null
    while ((m = skillPattern.exec(raw)) !== null) {
      const name = m[1].trim()
      const bonus = parseInt(m[2], 10)
      const engineKey = SKILL_RU_TO_EN[name]
      if (name && !isNaN(bonus)) {
        skills.push({
          name,
          engineKey: engineKey ?? name,
          bonus,
        })
      }
    }

    return skills
  } catch {
    return []
  }
}

function extractAC(rusBody: Element): { label: string } {
  try {
    const bodyHtml = rusBody.innerHTML
    const match = /<b>(КБ|AC)<\/b>/i.exec(bodyHtml)
    return { label: match ? match[1] : 'КБ' }
  } catch {
    return { label: 'КБ' }
  }
}

function extractHP(rusBody: Element): { label: string } {
  try {
    const bodyHtml = rusBody.innerHTML
    const match = /<b>(ПЗ|HP)<\/b>/i.exec(bodyHtml)
    return { label: match ? match[1] : 'ПЗ' }
  } catch {
    return { label: 'ПЗ' }
  }
}

function extractSaves(rusBody: Element): SavesLoc {
  try {
    const bodyHtml = rusBody.innerHTML

    const fortMatch = /<b>(Стойкость|Выносливость)<\/b>/i.exec(bodyHtml)
    const refMatch = /<b>(Реакция|Рефлексы)<\/b>/i.exec(bodyHtml)
    const willMatch = /<b>(Воля)<\/b>/i.exec(bodyHtml)

    return {
      fortLabel: fortMatch ? fortMatch[1] : 'Стойкость',
      refLabel: refMatch ? refMatch[1] : 'Реакция',
      willLabel: willMatch ? willMatch[1] : 'Воля',
    }
  } catch {
    return { fortLabel: 'Стойкость', refLabel: 'Реакция', willLabel: 'Воля' }
  }
}

function extractWeaknesses(rusBody: Element): string[] {
  try {
    const bodyHtml = rusBody.innerHTML
    const match = /<b>Уязвимост[иь][^<]*<\/b>\s*:?\s*([^<\n]+)/i.exec(bodyHtml)
    if (!match) return []

    const raw = match[1].trim()
    return raw
      .split(',')
      .map((s) => stripTrailingNumber(s.trim()))
      .filter((s) => s.length > 0)
  } catch {
    return []
  }
}

function extractResistances(rusBody: Element): string[] {
  try {
    const bodyHtml = rusBody.innerHTML
    const match = /<b>Сопротивлени[яе][^<]*<\/b>\s*:?\s*([^<\n]+)/i.exec(bodyHtml)
    if (!match) return []

    const raw = match[1].trim()
    return raw
      .split(',')
      .map((s) => stripTrailingNumber(s.trim()))
      .filter((s) => s.length > 0)
  } catch {
    return []
  }
}

function extractImmunities(rusBody: Element): string[] {
  try {
    const bodyHtml = rusBody.innerHTML
    const match = /<b>Иммунитет[ыий][^<]*<\/b>\s*:?\s*([^<\n]+)/i.exec(bodyHtml)
    if (!match) return []

    const raw = match[1].trim()
    return raw
      .split(',')
      .map((s) => stripTrailingNumber(s.trim()))
      .filter((s) => s.length > 0)
  } catch {
    return []
  }
}

function extractSpeeds(rusBody: Element): SpeedsLoc {
  try {
    const bodyHtml = rusBody.innerHTML
    // Match <b>Скорость</b>: 25 футов, полёт 35 футов, ...
    const match = /<b>Скорость<\/b>\s*:?\s*([^<\n]+)/i.exec(bodyHtml)
    if (!match) return {}

    const raw = match[1].trim()
    const speeds: SpeedsLoc = {}

    // Tokenize by comma
    const tokens = raw.split(',').map((s) => s.trim())

    for (const token of tokens) {
      const flyMatch = /полёт\s+(\d+)\s*футов/i.exec(token)
      const climbMatch = /лазани[ея]\s+(\d+)\s*футов/i.exec(token)
      const burrowMatch = /рытьё\s+(\d+)\s*футов/i.exec(token)
      const swimMatch = /плавани[ея]\s+(\d+)\s*футов/i.exec(token)
      const landMatch = /^(\d+)\s*футов/.exec(token.trim())

      if (flyMatch) {
        speeds.fly = `${flyMatch[1]} футов`
      } else if (climbMatch) {
        speeds.climb = `${climbMatch[1]} футов`
      } else if (burrowMatch) {
        speeds.burrow = `${burrowMatch[1]} футов`
      } else if (swimMatch) {
        speeds.swim = `${swimMatch[1]} футов`
      } else if (landMatch) {
        speeds.land = `${landMatch[1]} футов`
      }
    }

    return speeds
  } catch {
    return {}
  }
}

function extractStrikes(rusBody: Element): StrikeLoc[] {
  try {
    const strikes: StrikeLoc[] = []
    const abilities = rusBody.querySelectorAll('span.in-box-ability')

    for (const ability of abilities) {
      const html = getInnerHtml(ability)
      // Detect melee/ranged strike by bolded header
      const isStrike =
        /<b>В ближнем бою<\/b>/i.test(html) ||
        /<b>На расстоянии<\/b>/i.test(html)
      if (!isStrike) continue

      // Extract strike name: text after [one-action] marker and before bonus (+N)
      // Pattern: "В ближнем бою [one-action] <name> +N ..."
      const nameMatch = /(?:В ближнем бою|На расстоянии)[^>]*>?\s*\[one-action\]\s+([А-Яа-яёЁa-zA-Z\s]+?)\s*[+\-]\d+/i.exec(
        html.replace(/<[^>]+>/g, ' '),
      )

      // Extract damage type: last word after "Урон Nd+M <type>"
      const dmgMatch = /<b>Урон<\/b>\s*[\d\w\s+]+\s+([А-Яа-яёЁ]+)(?:\s|<|$)/i.exec(html)

      if (nameMatch) {
        const name = nameMatch[1].trim()
        const damageType = dmgMatch ? dmgMatch[1].trim() : ''
        strikes.push({ name, damageType })
      }
    }

    return strikes
  } catch {
    return []
  }
}

function extractSpellcastingHeading(rusBody: Element): { headingLabel: string } {
  try {
    const bodyHtml = rusBody.innerHTML
    // Match bolded heading ending with "заклинания" — innate, prepared, spontaneous
    const match = /<b>([^<]*заклинания[^<]*)<\/b>/i.exec(bodyHtml)
    if (match) {
      return { headingLabel: match[1].trim() }
    }
    return { headingLabel: '' }
  } catch {
    return { headingLabel: '' }
  }
}

/**
 * Extract 6 ability-score labels from the RU stat block.
 * pf2.ru renders them as a sequence of six bolded tokens each followed
 * by a numeric bonus, e.g.:
 *   <b>Сил</b> +2, <b>Лвк</b> +3, <b>Вын</b> +4, <b>Инт</b> +4, <b>Мдр</b> +2, <b>Хар</b> +7
 *
 * Positional mapping: 1st→strLabel, 2nd→dexLabel, 3rd→conLabel,
 * 4th→intLabel, 5th→wisLabel, 6th→chaLabel.
 *
 * Bonuses (+N) are ignored — engine owns numeric values, parser returns
 * text labels only. Returns fallback defaults when the section is absent
 * or yields fewer than 6 matching tokens (graceful degradation).
 */
function extractAbilityScores(rusBody: Element): AbilityScoresLoc {
  const defaults: AbilityScoresLoc = {
    strLabel: 'Сил',
    dexLabel: 'Лов',
    conLabel: 'Стой',
    intLabel: 'Инт',
    wisLabel: 'Муд',
    chaLabel: 'Хар',
  }

  try {
    const bodyHtml = rusBody.innerHTML
    // Match <b>LABEL</b> followed by optional whitespace + signed integer.
    // The signed-integer anchor eliminates false matches on section headers
    // (e.g. <b>Скорость</b>: 25) and ability descriptions.
    const labelPattern = /<b>([А-Яа-яёЁ]{2,5})<\/b>\s*[+\-]\d+/g
    const labels: string[] = []
    let m: RegExpExecArray | null
    while ((m = labelPattern.exec(bodyHtml)) !== null) {
      labels.push(m[1].trim())
      if (labels.length >= 6) break
    }

    if (labels.length < 6) return defaults

    return {
      strLabel: labels[0],
      dexLabel: labels[1],
      conLabel: labels[2],
      intLabel: labels[3],
      wisLabel: labels[4],
      chaLabel: labels[5],
    }
  } catch {
    return defaults
  }
}

/**
 * Extract in-box abilities from an HTML body element.
 * Matches EN abilities by index (positional fallback per matching strategy).
 */
function extractAbilities(rusBody: Element, _enBody: Element | null): AbilityLoc[] {
  try {
    const abilities: AbilityLoc[] = []
    const spans = rusBody.querySelectorAll('span.in-box-ability')

    for (const span of spans) {
      const html = getInnerHtml(span)

      // Skip strikes — they have a different heading pattern
      const isStrike =
        /<b>В ближнем бою<\/b>/i.test(html) ||
        /<b>На расстоянии<\/b>/i.test(html)
      if (isStrike) continue

      // Extract name from first <b>Title</b>
      const nameMatch = /<b>([^<]+)<\/b>/i.exec(html)
      if (!nameMatch) continue

      const abilityName = nameMatch[1].trim()

      // Action markers ([one-action]/[two-actions]/[three-actions]) in pf2.ru HTML
      // stand AFTER the closing </b>, not inside it. Search on the full span html.
      let actionCount: 1 | 2 | 3 | null = null
      if (/\[one-action\]/i.test(html)) actionCount = 1
      else if (/\[two-actions\]/i.test(html)) actionCount = 2
      else if (/\[three-actions\]/i.test(html)) actionCount = 3

      // Extract traits from parenthesized list after the name
      // Pattern: (trait1, trait2, trait3)
      const afterName = html.slice(html.indexOf(nameMatch[0]) + nameMatch[0].length)
      const traitsMatch = /\(([^)]+)\)/.exec(afterName)
      const traits = traitsMatch
        ? traitsMatch[1]
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : []

      // Build description: everything after title (and optional traits)
      // Remove first <b>title</b> tag and the traits parenthetical
      let descHtml = html
        // Remove name tag
        .replace(/<b>[^<]+<\/b>/, '')
        // Remove action marker text
        .replace(/\[one-action\]|\[two-actions\]|\[three-actions\]/gi, '')

      // Remove traits parenthetical at the start of the remaining text
      if (traitsMatch) {
        descHtml = descHtml.replace(traitsMatch[0], '')
      }

      // Convert to markdown-lite
      let description = htmlToMarkdownLite(descHtml)
      description = description.replace(/^\s+/, '').trim()

      abilities.push({
        name: abilityName,
        description,
        actionCount,
        traits,
      })
    }

    return abilities
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseMonsterRuHtml(
  textEn: string | undefined | null,
  rusText: string | undefined | null,
): MonsterStructuredLoc | null {
  if (!rusText) return null

  let rusDoc: Document
  let enDoc: Document | null = null

  try {
    const parser = new DOMParser()
    rusDoc = parser.parseFromString(rusText, 'text/html')
    if (textEn) {
      enDoc = parser.parseFromString(textEn, 'text/html')
    }
  } catch {
    return null
  }

  const rusBody = rusDoc.body
  const enBody = enDoc?.body ?? null

  return {
    abilitiesLoc: extractAbilities(rusBody, enBody),
    skillsLoc: extractSkills(rusBody),
    speedsLoc: extractSpeeds(rusBody),
    savesLoc: extractSaves(rusBody),
    acLoc: extractAC(rusBody),
    hpLoc: extractHP(rusBody),
    weaknessesLoc: extractWeaknesses(rusBody),
    resistancesLoc: extractResistances(rusBody),
    immunitiesLoc: extractImmunities(rusBody),
    perceptionLoc: extractPerception(rusBody),
    languagesLoc: extractLanguages(rusBody),
    strikesLoc: extractStrikes(rusBody),
    spellcastingLoc: extractSpellcastingHeading(rusBody),
    abilityScoresLoc: extractAbilityScores(rusBody),
  }
}
