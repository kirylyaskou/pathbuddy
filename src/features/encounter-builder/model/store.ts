import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  calculateXP,
  generateEncounterBudgets,
  type EncounterResult,
  type ThreatRating,
} from '@engine'
import { loadPartyConfig, savePartyConfig } from '@/shared/api'

export interface DraftCreature {
  instanceId: string
  creatureId: string
  name: string
  level: number
}

export interface EncounterBuilderState {
  draftCreatures: DraftCreature[]
  partyLevel: number
  partySize: number
  isLoaded: boolean

  addCreatureToDraft: (creature: { creatureId: string; name: string; level: number }) => void
  removeCreatureFromDraft: (instanceId: string) => void
  setPartyLevel: (level: number) => void
  setPartySize: (size: number) => void
  clearDraft: () => void
  loadConfig: () => Promise<void>
}

let instanceCounter = 0

export const useEncounterBuilderStore = create<EncounterBuilderState>()(
  immer((set, get) => ({
    draftCreatures: [],
    partyLevel: 1,
    partySize: 4,
    isLoaded: false,

    addCreatureToDraft: (creature) =>
      set((state) => {
        state.draftCreatures.push({
          instanceId: `draft-${++instanceCounter}`,
          creatureId: creature.creatureId,
          name: creature.name,
          level: creature.level,
        })
      }),

    removeCreatureFromDraft: (instanceId) =>
      set((state) => {
        state.draftCreatures = state.draftCreatures.filter((c) => c.instanceId !== instanceId)
      }),

    setPartyLevel: (level) => {
      set((state) => {
        state.partyLevel = Math.max(1, Math.min(20, level))
      })
      const s = get()
      savePartyConfig({ partyLevel: s.partyLevel, partySize: s.partySize })
    },

    setPartySize: (size) => {
      set((state) => {
        state.partySize = Math.max(1, Math.min(8, size))
      })
      const s = get()
      savePartyConfig({ partyLevel: s.partyLevel, partySize: s.partySize })
    },

    clearDraft: () =>
      set((state) => {
        state.draftCreatures = []
      }),

    loadConfig: async () => {
      const config = await loadPartyConfig()
      set((state) => {
        state.partyLevel = config.partyLevel
        state.partySize = config.partySize
        state.isLoaded = true
      })
    },
  }))
)

export function selectEncounterResult(state: EncounterBuilderState): EncounterResult {
  const levels = state.draftCreatures.map((c) => c.level)
  return calculateXP(levels, [], state.partyLevel, state.partySize)
}

export function selectBudgets(state: EncounterBuilderState): Record<ThreatRating, number> {
  return generateEncounterBudgets(state.partySize)
}

export function selectThreatRating(state: EncounterBuilderState): ThreatRating {
  return selectEncounterResult(state).rating
}
