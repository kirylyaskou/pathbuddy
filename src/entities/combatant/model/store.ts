import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Combatant } from './types'

export interface CombatantState {
  combatants: Combatant[]
  addCombatant: (combatant: Combatant) => void
  removeCombatant: (id: string) => void
  updateHp: (id: string, delta: number) => void
  updateTempHp: (id: string, tempHp: number) => void
  addCondition: (id: string, slug: string) => void
  removeCondition: (id: string, slug: string) => void
  reorderInitiative: (orderedIds: string[]) => void
  clearAll: () => void
}

export const useCombatantStore = create<CombatantState>()(
  immer((set) => ({
    combatants: [],
    addCombatant: (combatant) =>
      set((state) => {
        state.combatants.push(combatant)
      }),
    removeCombatant: (id) =>
      set((state) => {
        state.combatants = state.combatants.filter((c) => c.id !== id)
      }),
    updateHp: (id, delta) =>
      set((state) => {
        const c = state.combatants.find((c) => c.id === id)
        if (c) c.hp = Math.max(0, Math.min(c.maxHp, c.hp + delta))
      }),
    updateTempHp: (id, tempHp) =>
      set((state) => {
        const c = state.combatants.find((c) => c.id === id)
        if (c) c.tempHp = Math.max(0, tempHp)
      }),
    addCondition: (id, slug) =>
      set((state) => {
        const c = state.combatants.find((c) => c.id === id)
        if (c && !c.conditions.includes(slug)) c.conditions.push(slug)
      }),
    removeCondition: (id, slug) =>
      set((state) => {
        const c = state.combatants.find((c) => c.id === id)
        if (c) c.conditions = c.conditions.filter((s) => s !== slug)
      }),
    reorderInitiative: (orderedIds) =>
      set((state) => {
        state.combatants.sort(
          (a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
        )
      }),
    clearAll: () =>
      set((state) => {
        state.combatants = []
      }),
  }))
)
