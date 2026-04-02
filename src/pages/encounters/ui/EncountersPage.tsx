import { useEffect, useMemo } from 'react'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/shared/ui/resizable'
import { XPBudgetBar } from '@/entities/encounter'
import { useEncounterStore } from '@/entities/encounter'
import {
  useEncounterBuilderStore,
  PartyConfigBar,
  SavedEncounterList,
  EncounterEditor,
} from '@/features/encounter-builder'
import { calculateXP } from '@engine'

export function EncountersPage() {
  const encounters = useEncounterStore((s) => s.encounters)
  const selectedId = useEncounterStore((s) => s.selectedId)
  const loadEncounters = useEncounterStore((s) => s.loadEncounters)
  const loadCombatantsForEncounter = useEncounterStore((s) => s.loadCombatantsForEncounter)

  // Party config from global store (shared with encounter builder)
  const partyLevel = useEncounterBuilderStore((s) => s.partyLevel)
  const partySize = useEncounterBuilderStore((s) => s.partySize)
  const isLoaded = useEncounterBuilderStore((s) => s.isLoaded)
  const loadConfig = useEncounterBuilderStore((s) => s.loadConfig)

  // Load party config + encounters on mount
  useEffect(() => {
    loadConfig()
    loadEncounters()
  }, [loadConfig, loadEncounters])

  // Load combatants for selected encounter (lazy, idempotent)
  useEffect(() => {
    if (selectedId) loadCombatantsForEncounter(selectedId)
  }, [selectedId, loadCombatantsForEncounter])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Loading...</p>
      </div>
    )
  }

  const selectedEncounter = encounters.find((e) => e.id === selectedId)

  const { totalXp, xpPartySize } = useMemo(() => {
    if (!selectedEncounter) return { totalXp: 0, xpPartySize: partySize }
    const adjustedLevels = selectedEncounter.combatants.map((c) =>
      c.weakEliteTier === 'elite' ? c.creatureLevel + 1
      : c.weakEliteTier === 'weak' ? c.creatureLevel - 1
      : c.creatureLevel
    )
    return {
      totalXp: calculateXP(adjustedLevels, [], selectedEncounter.partyLevel, selectedEncounter.partySize).totalXp,
      xpPartySize: selectedEncounter.partySize,
    }
  }, [selectedEncounter, partySize])

  return (
    <div className="flex flex-col h-full">
      {/* Party config + XP summary */}
      <PartyConfigBar />
      <div className="px-4 py-2 border-b border-border/50">
        <XPBudgetBar currentXP={totalXp} partySize={xpPartySize} />
      </div>

      {/* Main split: list (left) + editor (right) */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
          <SavedEncounterList />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={78} minSize={50}>
          {selectedId ? (
            <EncounterEditor encounterId={selectedId} partyLevel={partyLevel} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Select an encounter to edit its creature list.</p>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
