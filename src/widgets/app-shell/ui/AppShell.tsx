import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { CommandPalette } from './CommandPalette'
import { ChordStatusBadge } from './ChordStatusBadge'
import { RollResultDrawer } from '@/shared/ui/roll-result-drawer'
import { useHotkeyStore } from '@/shared/model/hotkey-store'
import { useChordEngine } from '../model/use-chord-engine'
import { StatBlockModal } from '@/entities/creature/ui/StatBlockModal'
import { SpellReferenceDrawer } from '@/entities/spell/ui/SpellReferenceDrawer'
import { ItemReferenceDrawer } from '@/entities/item/ui/ItemReferenceDrawer'
import type { GlobalSearchResult } from '@/shared/api/global-search'
import { PATHS } from '@/shared/routes/paths'

export function AppShell() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<GlobalSearchResult | null>(null)
  const loadHotkeys = useHotkeyStore((s) => s.loadHotkeys)
  const navigate = useNavigate()
  useChordEngine()

  useEffect(() => {
    loadHotkeys()
  }, [loadHotkeys])

  const handleSelect = useCallback((result: GlobalSearchResult) => {
    setCommandOpen(false)
    if (result.kind === 'creature' || result.kind === 'spell' || result.kind === 'item') {
      setSelectedResult(result)
    } else if (result.kind === 'condition') {
      navigate(PATHS.CONDITIONS)
      setSelectedResult(null)
    } else if (result.kind === 'hazard') {
      navigate(PATHS.HAZARDS)
      setSelectedResult(null)
    } else if (result.kind === 'action') {
      navigate(PATHS.ACTIONS)
      setSelectedResult(null)
    }
  }, [navigate])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar onSearchOpen={() => setCommandOpen(true)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} onSelect={handleSelect} />
      <ChordStatusBadge />
      <RollResultDrawer />
      {selectedResult?.kind === 'creature' && (
        <StatBlockModal
          creatureId={selectedResult.id}
          open={true}
          onOpenChange={(open) => { if (!open) setSelectedResult(null) }}
        />
      )}
      {selectedResult?.kind === 'spell' && (
        <SpellReferenceDrawer
          spellId={selectedResult.id}
          onClose={() => setSelectedResult(null)}
        />
      )}
      {selectedResult?.kind === 'item' && (
        <ItemReferenceDrawer
          itemId={selectedResult.id}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  )
}
