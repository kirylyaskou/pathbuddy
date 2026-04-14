import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ActiveEffect } from './types'

export interface SpellEffectState {
  activeEffects: ActiveEffect[]
  setEffectsForCombatant: (combatantId: string, effects: ActiveEffect[]) => void
  addEffect: (effect: ActiveEffect) => void
  removeEffect: (id: string) => void
  decrementTurns: (combatantId: string) => string[]  // returns removed effect IDs
  clearCombatantEffects: (combatantId: string) => void
  clearAll: () => void
}

export const useEffectStore = create<SpellEffectState>()(
  immer((set) => ({
    activeEffects: [],
    setEffectsForCombatant: (combatantId, effects) =>
      set((state) => {
        state.activeEffects = state.activeEffects.filter(
          (e) => e.combatantId !== combatantId
        )
        state.activeEffects.push(...effects)
      }),
    addEffect: (effect) =>
      set((state) => {
        state.activeEffects.push(effect)
      }),
    removeEffect: (id) =>
      set((state) => {
        state.activeEffects = state.activeEffects.filter((e) => e.id !== id)
      }),
    decrementTurns: (combatantId) => {
      const removedIds: string[] = []
      set((state) => {
        for (const e of state.activeEffects) {
          if (e.combatantId === combatantId) {
            e.remainingTurns -= 1
          }
        }
        const toRemove = state.activeEffects.filter(
          (e) => e.combatantId === combatantId && e.remainingTurns <= 0
        )
        for (const e of toRemove) removedIds.push(e.id)
        state.activeEffects = state.activeEffects.filter(
          (e) => !(e.combatantId === combatantId && e.remainingTurns <= 0)
        )
      })
      return removedIds
    },
    clearCombatantEffects: (combatantId) =>
      set((state) => {
        state.activeEffects = state.activeEffects.filter(
          (e) => e.combatantId !== combatantId
        )
      }),
    clearAll: () =>
      set((state) => {
        state.activeEffects = []
      }),
  }))
)
