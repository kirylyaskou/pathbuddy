// 65-02 + v1.4.1 UAT BUG-B: planFortuneRoll — engine helper tests.
// Pure-function coverage; no store / IPC dependencies.

import { describe, it, expect } from 'vitest'
import { planFortuneRoll } from '../fortune'

describe('planFortuneRoll', () => {
  const ctx = { type: 'attack' as const }

  it('no-op passthrough when no fortune flags set → kind=normal', () => {
    const plan = planFortuneRoll('1d20+7', 'c1', ctx)
    expect(plan).toEqual({ kind: 'normal', formula: '1d20+7' })
  })

  it('fortune returns a kind=fortune plan with the UNREWRITTEN base formula', () => {
    const plan = planFortuneRoll('1d20+7', 'c1', ctx, { fortune: true })
    expect(plan.kind).toBe('fortune')
    // Critical: formula must remain the base 1d20+mod. The wiring layer
    // rolls it twice independently — no 2d20kh1 rewriting anymore.
    if (plan.kind === 'fortune') {
      expect(plan.formula).toBe('1d20+7')
      expect(plan.label).toBe('Sure Strike (fortune)')
    }
  })

  it('misfortune returns a kind=misfortune plan with the UNREWRITTEN base formula', () => {
    const plan = planFortuneRoll('1d20-1', 'c1', ctx, { misfortune: true })
    expect(plan.kind).toBe('misfortune')
    if (plan.kind === 'misfortune') {
      expect(plan.formula).toBe('1d20-1')
      expect(plan.label).toBe('Misfortune (keep lower)')
    }
  })

  it('fortune + misfortune on the same roll cancel — returns kind=normal', () => {
    const plan = planFortuneRoll('1d20+7', 'c1', ctx, {
      fortune: true,
      misfortune: true,
    })
    expect(plan).toEqual({ kind: 'normal', formula: '1d20+7' })
  })

  it('assurance short-circuits — returns kind=assurance with pre-computed value', () => {
    const plan = planFortuneRoll('1d20+9', 'c1', ctx, {
      fortune: true, // should be ignored under assurance
      assurance: { proficiencyBonus: 9 },
    })
    expect(plan.kind).toBe('assurance')
    if (plan.kind === 'assurance') {
      expect(plan.formula).toBe('10+9')
      expect(plan.value).toBe(19)
      expect(plan.label).toBe('Assurance (flat)')
    }
  })

  it('assurance handles negative proficiency (untrained-ish edge)', () => {
    const plan = planFortuneRoll('1d20-2', 'c1', ctx, {
      assurance: { proficiencyBonus: -2 },
    })
    expect(plan.kind).toBe('assurance')
    if (plan.kind === 'assurance') {
      expect(plan.formula).toBe('10-2')
      expect(plan.value).toBe(8)
    }
  })

  it('non-d20 base formula falls through to normal on fortune (damage rolls ignored)', () => {
    const plan = planFortuneRoll('2d6+4', 'c1', ctx, { fortune: true })
    expect(plan).toEqual({ kind: 'normal', formula: '2d6+4' })
  })

  it('handles bare "d20" (no leading count)', () => {
    const plan = planFortuneRoll('d20+5', 'c1', ctx, { fortune: true })
    expect(plan.kind).toBe('fortune')
    if (plan.kind === 'fortune') {
      // Formula remains untouched — wiring layer rolls d20+5 twice.
      expect(plan.formula).toBe('d20+5')
    }
  })
})
