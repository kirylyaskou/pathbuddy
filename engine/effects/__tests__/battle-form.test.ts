// 65-04: BattleForm / CreatureSize parser coverage.
// Literal-value CreatureSize rules yield a size override.
// BattleForm `overrides` block yields size + optional numeric AC + strikes.
// Dynamic `{item|flags…}` references and non-numeric AC expressions are dropped.

import { describe, it, expect } from 'vitest'
import {
  parseSpellEffectBattleForm,
  parseSpellEffectCreatureSize,
} from '../battle-form'

describe('parseSpellEffectCreatureSize', () => {
  it('literal value "large" → size "lg"', () => {
    const json = JSON.stringify([{ key: 'CreatureSize', value: 'large' }])
    expect(parseSpellEffectCreatureSize(json, 'e', 'E')).toEqual([
      { effectId: 'e', effectName: 'E', size: 'lg' },
    ])
  })

  it('Foundry shorthand "huge" passes through', () => {
    const json = JSON.stringify([{ key: 'CreatureSize', value: 'huge' }])
    expect(parseSpellEffectCreatureSize(json, 'e', 'E')[0].size).toBe('huge')
  })

  it('drops dynamic reference values', () => {
    const json = JSON.stringify([
      { key: 'CreatureSize', value: '{item|flags.system.rulesSelections.enlarge.size}' },
    ])
    expect(parseSpellEffectCreatureSize(json, 'e', 'E')).toEqual([])
  })

  it('drops rules of other keys', () => {
    const json = JSON.stringify([
      { key: 'FlatModifier', selector: 'ac', value: 1 },
      { key: 'Resistance', type: 'fire', value: 5 },
    ])
    expect(parseSpellEffectCreatureSize(json, 'e', 'E')).toEqual([])
  })
})

describe('parseSpellEffectBattleForm', () => {
  it('extracts size + numeric AC + strikes', () => {
    const json = JSON.stringify([
      {
        key: 'BattleForm',
        overrides: {
          size: 'huge',
          armorClass: { modifier: 21 },
          strikes: {
            claw: { damage: { die: 'd10', dice: 3, damageType: 'slashing' } },
            jaws: { damage: { die: 'd12', dice: 2, damageType: 'piercing' } },
          },
        },
      },
    ])
    const form = parseSpellEffectBattleForm(json, 'dragon', 'Dragon Form')
    expect(form).not.toBeNull()
    expect(form!.size).toBe('huge')
    expect(form!.ac).toBe(21)
    expect(form!.strikes).toHaveLength(2)
    expect(form!.strikes!.find((s) => s.name === 'claw')).toMatchObject({
      dieSize: 'd10',
      diceNumber: 3,
      damageType: 'slashing',
    })
  })

  it('skips AC when armorClass.modifier is an expression string', () => {
    const json = JSON.stringify([
      {
        key: 'BattleForm',
        overrides: {
          size: 'lg',
          armorClass: { modifier: '18 + @actor.level' },
        },
      },
    ])
    const form = parseSpellEffectBattleForm(json, 'x', 'X')
    expect(form).not.toBeNull()
    expect(form!.size).toBe('lg')
    expect(form!.ac).toBeUndefined()
  })

  it('returns null when no BattleForm rule present', () => {
    const json = JSON.stringify([{ key: 'FlatModifier', selector: 'ac', value: 1 }])
    expect(parseSpellEffectBattleForm(json, 'x', 'X')).toBeNull()
  })

  it('drops strikes with non-standard die values', () => {
    const json = JSON.stringify([
      {
        key: 'BattleForm',
        overrides: {
          strikes: {
            weird: { damage: { die: 'd7', dice: 1, damageType: 'x' } },
          },
        },
      },
    ])
    const form = parseSpellEffectBattleForm(json, 'x', 'X')
    expect(form!.strikes).toBeUndefined()
  })
})
