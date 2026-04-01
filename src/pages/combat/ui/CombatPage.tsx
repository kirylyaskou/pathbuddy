import { useState, useEffect } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/shared/ui/resizable'
import { InitiativeList } from '@/widgets/initiative-list'
import { BestiarySearchPanel } from '@/widgets/bestiary-search'
import { CombatantDetail } from '@/widgets/combatant-detail'
import { CombatControls, AddPCDialog } from '@/features/combat-tracker'
import { TurnControls } from '@/features/combat-tracker/ui/TurnControls'
import { setupAutoSave, teardownAutoSave, loadActiveCombat } from '@/features/combat-tracker/lib/combat-persistence'

export function CombatPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    loadActiveCombat()
    setupAutoSave()
    return () => teardownAutoSave()
  }, [])

  return (
    <div className="flex flex-col h-full">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left panel — Initiative list */}
        <ResizablePanel defaultSize={25} minSize={18} maxSize={35}>
          <div className="flex flex-col h-full">
            <CombatControls />
            <div className="flex-1 min-h-0">
              <InitiativeList selectedId={selectedId} onSelect={setSelectedId} />
            </div>
            <TurnControls />
            <div className="p-2 border-t border-border/50">
              <AddPCDialog />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center panel — Combatant detail */}
        <ResizablePanel defaultSize={45} minSize={30}>
          {selectedId ? (
            <CombatantDetail combatantId={selectedId} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Select a combatant to view details</p>
            </div>
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel — Bestiary search */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <BestiarySearchPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
