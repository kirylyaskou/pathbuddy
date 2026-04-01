import { useEffect } from 'react'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/shared/ui/resizable'
import { XPBudgetBar } from '@/entities/encounter'
import {
  useEncounterBuilderStore,
  selectEncounterResult,
  PartyConfigBar,
  EncounterCreatureList,
  CreatureSearchSidebar,
} from '@/features/encounter-builder'

export function EncountersPage() {
  const loadConfig = useEncounterBuilderStore((s) => s.loadConfig)
  const isLoaded = useEncounterBuilderStore((s) => s.isLoaded)
  const result = useEncounterBuilderStore(selectEncounterResult)
  const partySize = useEncounterBuilderStore((s) => s.partySize)

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Loading encounter builder...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Party config + XP summary */}
      <PartyConfigBar />

      {/* XP Budget Bar */}
      <div className="px-4 py-2 border-b border-border/50">
        <XPBudgetBar currentXP={result.totalXp} partySize={partySize} />
      </div>

      {/* Main content — creature list + search */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left — Encounter creatures */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <EncounterCreatureList />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right — Creature search */}
        <ResizablePanel defaultSize={40} minSize={25} maxSize={50}>
          <CreatureSearchSidebar />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
