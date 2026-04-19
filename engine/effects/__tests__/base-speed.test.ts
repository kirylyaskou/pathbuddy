// v1.4.1 UAT BUG-5 — BaseSpeed rule parsing + resolution.

import { describe, it, expect } from 'vitest'
import { parseBaseSpeedRules, resolveBaseSpeedValue } from '../base-speed'

describe('parseBaseSpeedRules', () => {
  it('parses a Fly-style rule', () => {
    const rules = JSON.stringify([
      { key: 'BaseSpeed', selector: 'fly', value: 'max(20,@actor.system.movement.speeds.land.value)' },
    ])
    const out = parseBaseSpeedRules(rules)
    expect(out).toHaveLength(1)
    expect(out[0].type).toBe('fly')
    expect(typeof out[0].rawValue).toBe('string')
  })

  it('parses a literal burrow speed', () => {
    const rules = JSON.stringify([
      { key: 'BaseSpeed', selector: 'burrow', value: 10 },
    ])
    const out = parseBaseSpeedRules(rules)
    expect(out).toEqual([{ type: 'burrow', rawValue: 10, predicate: undefined }])
  })

  it('retains predicate', () => {
    const rules = JSON.stringify([
      { key: 'BaseSpeed', selector: 'fly', value: 30, predicate: ['elemental-motion:air'] },
    ])
    const out = parseBaseSpeedRules(rules)
    expect(out[0].predicate).toEqual(['elemental-motion:air'])
  })

  it('skips non-BaseSpeed rules', () => {
    const rules = JSON.stringify([
      { key: 'FlatModifier', selector: 'ac', value: 1 },
    ])
    expect(parseBaseSpeedRules(rules)).toEqual([])
  })

  it('skips unknown selectors', () => {
    const rules = JSON.stringify([
      { key: 'BaseSpeed', selector: 'teleport', value: 40 },
    ])
    expect(parseBaseSpeedRules(rules)).toEqual([])
  })
})

describe('resolveBaseSpeedValue', () => {
  it('returns literal numbers verbatim', () => {
    expect(resolveBaseSpeedValue(10, 25)).toBe(10)
    expect(resolveBaseSpeedValue('40', 25)).toBe(40)
  })

  it('resolves the bare land-speed reference', () => {
    expect(resolveBaseSpeedValue('@actor.system.movement.speeds.land.value', 30)).toBe(30)
  })

  it('Fly: max(20, landSpeed) picks the larger value', () => {
    const src = 'max(20,@actor.system.movement.speeds.land.value)'
    expect(resolveBaseSpeedValue(src, 25)).toBe(25)
    expect(resolveBaseSpeedValue(src, 15)).toBe(20)
  })

  it('Adapt Self (Swim): round(landSpeed/2) halves the land speed', () => {
    const src = 'round(@actor.system.movement.speeds.land.value/2)'
    expect(resolveBaseSpeedValue(src, 30)).toBe(15)
    expect(resolveBaseSpeedValue(src, 25)).toBe(13) // Math.round(12.5) → 13
  })

  it('returns null for unsupported expressions', () => {
    expect(resolveBaseSpeedValue('@item.badge.value', 30)).toBeNull()
    expect(resolveBaseSpeedValue('floor(@actor.level/2)', 30)).toBeNull()
  })
})
