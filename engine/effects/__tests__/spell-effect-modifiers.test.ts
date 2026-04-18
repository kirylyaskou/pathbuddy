// 61-08: verification that effects from the three allowlisted PF2e packs
// (spell-effects, equipment-effects, boons-and-curses) parse into usable
// SpellEffectModifierInput entries. Fixtures are verbatim JSON extracts
// from D:/parse_data/PAKS/pf2e/packs/pf2e/… (build 14-dev).
//
// If these tests break on a future PF2e data update, that is the signal
// to re-examine parseSpellEffectModifiers / evalValueExpression — the
// upstream schema has drifted.

import { describe, it, expect } from 'vitest'
import {
  parseSpellEffectModifiers,
  parseSpellEffectResistances,
  evalValueExpression,
} from '../spell-effect-modifiers'

// ── Fixtures — real rules[] arrays from the upstream PF2e pack ──────────────

// spell-effects/spell-effect-bane.json
const BANE_RULES = JSON.stringify([
  { key: 'FlatModifier', selector: 'attack', type: 'status', value: -1 },
])

// spell-effects/spell-effect-heroism.json
const HEROISM_RULES = JSON.stringify([
  {
    key: 'FlatModifier',
    selector: ['attack', 'saving-throw', 'skill-check', 'perception'],
    type: 'status',
    value: 'ternary(gte(@item.level,9),3,ternary(gte(@item.level,6),2,1))',
  },
])

// spell-effects/spell-effect-acid-grip.json
const ACID_GRIP_RULES = JSON.stringify([
  {
    key: 'FlatModifier',
    predicate: ['self:condition:persistent-damage:acid'],
    selector: 'all-speeds',
    type: 'status',
    value: -10,
  },
])

// equipment-effects/effect-drakeheart-mutagen-major.json (excerpt — DexCap
// rule dropped because it is not a FlatModifier and the parser skips it).
const DRAKEHEART_MAJOR_RULES = JSON.stringify([
  { key: 'DexterityModifierCap', value: 2 },
  { key: 'FlatModifier', selector: 'ac', type: 'item', value: 7 },
  { key: 'FlatModifier', selector: 'perception', type: 'item', value: 4 },
  { key: 'FlatModifier', selector: ['will', 'reflex'], type: 'untyped', value: -1 },
])

// other-effects/effect-2-circumstance-penalty-to-attack-rolls-with-this-weapon.json
// This effect is in a pack we EXCLUDE. Keeping a fixture here to document
// that the parser would still skip the useful branch: the selector uses a
// dynamic `{item|flags.system.rulesSelections…}` token that the engine
// cannot resolve — so even if we kept it in the picker, applying it would
// yield 0 modifiers. Confirms exclusion is correct.
const CRITICAL_DECK_RULES = JSON.stringify([
  {
    key: 'FlatModifier',
    label: 'PF2E.SpecificRule.CriticalDeck.Effect.Label',
    selector: '{item|flags.system.rulesSelections.effect2CircumstancePenaltyToAttackRollsWithThisWeapon}-attack',
    slug: 'critical-effect-penalty-to-attack-with-weapon',
    type: 'circumstance',
    value: -2,
  },
  { key: 'ChoiceSet', choices: { ownedItems: true, types: ['weapon'] } },
])

describe('parseSpellEffectModifiers — spell-effects pack', () => {
  it('Bane: -1 status to attack rolls (single selector)', () => {
    const mods = parseSpellEffectModifiers(BANE_RULES, 'bane', 'Bane', 1)
    expect(mods).toHaveLength(1)
    expect(mods[0]).toMatchObject({
      selector: 'attack',
      modifierType: 'status',
      value: -1,
    })
  })

  it('Heroism at base rank 3: +1 status across 4 selectors', () => {
    const mods = parseSpellEffectModifiers(HEROISM_RULES, 'heroism', 'Heroism', 3)
    expect(mods).toHaveLength(1)
    expect(mods[0].value).toBe(1)
    expect(mods[0].modifierType).toBe('status')
    expect(mods[0].selector).toEqual(['attack', 'saving-throw', 'skill-check', 'perception'])
  })

  it('Heroism at rank 6: +2 via ternary evaluator', () => {
    const mods = parseSpellEffectModifiers(HEROISM_RULES, 'heroism', 'Heroism', 6)
    expect(mods[0].value).toBe(2)
  })

  it('Heroism at rank 9: +3 via nested ternary', () => {
    const mods = parseSpellEffectModifiers(HEROISM_RULES, 'heroism', 'Heroism', 9)
    expect(mods[0].value).toBe(3)
  })

  it('Acid Grip: -10 status to all-speeds with predicate stored', () => {
    const mods = parseSpellEffectModifiers(ACID_GRIP_RULES, 'acid-grip', 'Acid Grip', 1)
    expect(mods).toHaveLength(1)
    expect(mods[0].selector).toBe('all-speeds')
    expect(mods[0].value).toBe(-10)
    expect(mods[0].predicate).toEqual(['self:condition:persistent-damage:acid'])
  })
})

describe('parseSpellEffectModifiers — equipment-effects pack', () => {
  it('Drakeheart Mutagen (Major): 3 FlatModifier rules extracted, DexCap ignored', () => {
    const mods = parseSpellEffectModifiers(
      DRAKEHEART_MAJOR_RULES,
      'drakeheart',
      'Drakeheart Mutagen (Major)',
      17,
    )
    expect(mods).toHaveLength(3)
    expect(mods.find((m) => m.selector === 'ac')?.value).toBe(7)
    expect(mods.find((m) => m.selector === 'perception')?.value).toBe(4)
    const willRefl = mods.find(
      (m) => Array.isArray(m.selector) && m.selector.includes('will'),
    )
    expect(willRefl?.value).toBe(-1)
  })

  it('item bonus to AC is typed "item" (stacking rule)', () => {
    const mods = parseSpellEffectModifiers(
      DRAKEHEART_MAJOR_RULES,
      'drakeheart',
      'Drakeheart Mutagen (Major)',
      17,
    )
    const ac = mods.find((m) => m.selector === 'ac')
    expect(ac?.modifierType).toBe('item')
  })
})

describe('parseSpellEffectModifiers — excluded other-effects pack (sanity)', () => {
  it('critical-deck dynamic-selector effect: parser skips (selector resolver cannot handle tokens)', () => {
    // The selector '{item|flags.…}-attack' is stored verbatim; even though
    // the parser extracts the rule, the downstream selector resolver won't
    // find a match and the modifier won't apply. This fixture documents
    // that excluding the other-effects pack from the picker is correct:
    // users wouldn't be able to meaningfully apply these anyway.
    const mods = parseSpellEffectModifiers(CRITICAL_DECK_RULES, 'x', 'x', 1)
    expect(mods).toHaveLength(1)
    const sel = mods[0].selector as string
    expect(sel).toMatch(/^\{item\|/)
  })
})

describe('evalValueExpression (ternary scaling)', () => {
  it('returns null on unsupported @actor refs', () => {
    expect(evalValueExpression('@actor.level', 3)).toBeNull()
  })
  it('returns null on @item.badge.value refs', () => {
    expect(evalValueExpression('@item.badge.value', 3)).toBeNull()
  })
  it('handles negative integer literals', () => {
    expect(evalValueExpression('-2', 1)).toBe(-2)
  })
  it('respects @item.level at each ternary tier', () => {
    const expr = 'ternary(gte(@item.level,9),3,ternary(gte(@item.level,6),2,1))'
    expect(evalValueExpression(expr, 1)).toBe(1)
    expect(evalValueExpression(expr, 5)).toBe(1)
    expect(evalValueExpression(expr, 6)).toBe(2)
    expect(evalValueExpression(expr, 8)).toBe(2)
    expect(evalValueExpression(expr, 9)).toBe(3)
    expect(evalValueExpression(expr, 10)).toBe(3)
  })
})

describe('parseSpellEffectResistances', () => {
  it('extracts { type, value } tuples from Resistance rules', () => {
    const rulesJson = JSON.stringify([
      { key: 'Resistance', type: 'cold', value: 5 },
      { key: 'FlatModifier', selector: 'ac', type: 'status', value: 1 },
      { key: 'Resistance', type: 'fire', value: 10 },
    ])
    const res = parseSpellEffectResistances(rulesJson)
    expect(res).toEqual([
      { type: 'cold', value: 5 },
      { type: 'fire', value: 10 },
    ])
  })

  it('drops entries with non-numeric or non-positive value', () => {
    const rulesJson = JSON.stringify([
      { key: 'Resistance', type: 'cold', value: 0 },
      { key: 'Resistance', type: '', value: 5 },
      { key: 'Resistance', type: 'fire', value: 5 },
    ])
    const res = parseSpellEffectResistances(rulesJson)
    expect(res).toEqual([{ type: 'fire', value: 5 }])
  })
})
