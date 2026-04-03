import { useState } from 'react'
import { X } from 'lucide-react'
import { useEncounterTabsStore } from '@/features/combat-tracker'
import { cn } from '@/shared/lib/utils'
import { BlueprintSelectorDialog } from './BlueprintSelectorDialog'

export function EncounterTabBar() {
  const openTabs = useEncounterTabsStore((s) => s.openTabs)
  const activeTabId = useEncounterTabsStore((s) => s.activeTabId)
  const setActiveTab = useEncounterTabsStore((s) => s.setActiveTab)
  const closeTab = useEncounterTabsStore((s) => s.closeTab)

  const [showSelector, setShowSelector] = useState(false)

  return (
    <div className="flex items-center h-9 border-b border-border/50 bg-muted/20 shrink-0 overflow-x-auto">
      {openTabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            'group px-3 py-1.5 text-sm font-medium flex items-center gap-2 shrink-0 cursor-pointer border-r border-border/30 h-full select-none',
            tab.id === activeTabId
              ? 'bg-card border-b-2 border-b-primary text-foreground'
              : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
          )}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="max-w-[120px] truncate">{tab.name}</span>
          <button
            className="w-4 h-4 opacity-0 group-hover:opacity-100 rounded hover:bg-destructive/20 flex items-center justify-center transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              closeTab(tab.id)
            }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Add tab button */}
      <button
        className="px-2 h-full flex items-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 text-lg leading-none"
        onClick={() => setShowSelector(true)}
        title="Open encounter"
      >
        +
      </button>

      <BlueprintSelectorDialog open={showSelector} onOpenChange={setShowSelector} />
    </div>
  )
}
