import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface PendingPersistentDamage {
  combatantId: string
  combatantName: string
  conditions: { slug: string; formula: string; damageType: string }[]
}

export interface CombatTrackerState {
  combatId: string | null
  activeCombatantId: string | null
  round: number
  turn: number
  isRunning: boolean
  pendingPersistentDamage: PendingPersistentDamage | null
  startCombat: (combatId: string) => void
  endCombat: () => void
  nextTurn: () => void
  previousTurn: () => void
  setActiveCombatant: (id: string | null) => void
  setRound: (round: number) => void
  setTurn: (turn: number) => void
  setCombatId: (id: string | null) => void
  setPendingPersistentDamage: (p: PendingPersistentDamage | null) => void
}

export const useCombatTrackerStore = create<CombatTrackerState>()(
  immer((set) => ({
    combatId: null,
    activeCombatantId: null,
    round: 0,
    turn: 0,
    isRunning: false,
    pendingPersistentDamage: null,
    startCombat: (combatId) =>
      set((state) => {
        state.combatId = combatId
        state.round = 1
        state.turn = 0
        state.isRunning = true
      }),
    endCombat: () =>
      set((state) => {
        state.combatId = null
        state.activeCombatantId = null
        state.round = 0
        state.turn = 0
        state.isRunning = false
      }),
    nextTurn: () =>
      set((state) => {
        state.turn += 1
      }),
    previousTurn: () =>
      set((state) => {
        if (state.turn > 0) state.turn -= 1
      }),
    setActiveCombatant: (id) =>
      set((state) => {
        state.activeCombatantId = id
      }),
    setRound: (round) =>
      set((state) => {
        state.round = round
      }),
    setTurn: (turn) =>
      set((state) => {
        state.turn = turn
      }),
    setCombatId: (id) =>
      set((state) => {
        state.combatId = id
      }),
    setPendingPersistentDamage: (p) =>
      set((state) => {
        state.pendingPersistentDamage = p
      }),
  }))
)
