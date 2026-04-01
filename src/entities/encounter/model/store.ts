import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Encounter } from './types'

export interface EncounterState {
  encounters: Encounter[]
  selectedId: string | null
  setEncounters: (encounters: Encounter[]) => void
  setSelectedId: (id: string | null) => void
  upsertEncounter: (encounter: Encounter) => void
  removeEncounter: (id: string) => void
  clearAll: () => void
}

export const useEncounterStore = create<EncounterState>()(
  immer((set) => ({
    encounters: [],
    selectedId: null,
    setEncounters: (encounters) =>
      set((state) => {
        state.encounters = encounters
      }),
    setSelectedId: (id) =>
      set((state) => {
        state.selectedId = id
      }),
    upsertEncounter: (encounter) =>
      set((state) => {
        const idx = state.encounters.findIndex((e) => e.id === encounter.id)
        if (idx >= 0) state.encounters[idx] = encounter
        else state.encounters.push(encounter)
      }),
    removeEncounter: (id) =>
      set((state) => {
        state.encounters = state.encounters.filter((e) => e.id !== id)
      }),
    clearAll: () =>
      set((state) => {
        state.encounters = []
        state.selectedId = null
      }),
  }))
)
