import { X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { LevelBadge } from '@/shared/ui/level-badge'
import { useEncounterBuilderStore } from '../model/store'
import { calculateCreatureXP } from '@engine'
import { useShallow } from 'zustand/react/shallow'

export function EncounterCreatureList() {
  const { draftCreatures, partyLevel, removeCreatureFromDraft, clearDraft } =
    useEncounterBuilderStore(
      useShallow((s) => ({
        draftCreatures: s.draftCreatures,
        partyLevel: s.partyLevel,
        removeCreatureFromDraft: s.removeCreatureFromDraft,
        clearDraft: s.clearDraft,
      }))
    )

  if (draftCreatures.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Add creatures from the search panel to build an encounter</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <span className="text-xs text-muted-foreground font-medium">
          {draftCreatures.length} creature{draftCreatures.length !== 1 ? 's' : ''}
        </span>
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearDraft}>
          Clear All
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {draftCreatures.map((dc) => {
            const xpResult = calculateCreatureXP(dc.adjustedLevel, partyLevel)
            return (
              <div
                key={dc.instanceId}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-secondary/30 hover:bg-secondary/50 group"
              >
                <LevelBadge level={dc.adjustedLevel} size="sm" />
                {dc.tier !== 'normal' && (
                  <span className={`text-[10px] px-1 rounded ${dc.tier === 'elite' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {dc.tier === 'elite' ? 'E' : 'W'}
                  </span>
                )}
                <span className="flex-1 text-sm font-medium truncate">{dc.name}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {xpResult.xp != null ? `${xpResult.xp} XP` : 'OoR'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5 opacity-0 group-hover:opacity-100"
                  onClick={() => removeCreatureFromDraft(dc.instanceId)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
