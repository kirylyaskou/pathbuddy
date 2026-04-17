import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import type { Dispatch } from 'react'
import type { BuilderState, BuilderAction } from '../model/builderReducer'

export interface BuilderTabsProps {
  state: BuilderState
  dispatch: Dispatch<BuilderAction>
}

// D-18: 10 tabs in this exact order. Tab values are stable kebab-case ids.
const TAB_DEFS = [
  { id: 'concept', label: 'Concept' },
  { id: 'ability-mods', label: 'Ability Mods' },
  { id: 'defense', label: 'Defense' },
  { id: 'perception-skills', label: 'Perception & Skills' },
  { id: 'speeds-senses', label: 'Speeds & Senses' },
  { id: 'strikes', label: 'Strikes' },
  { id: 'spellcasting', label: 'Spellcasting' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'iwr', label: 'IWR' },
  { id: 'auras-rituals', label: 'Auras & Rituals' },
] as const

export type BuilderTabId = typeof TAB_DEFS[number]['id']

function Placeholder({ label }: { label: string }) {
  return (
    <div className="p-4">
      <h2 className="text-base font-semibold mb-3">{label}</h2>
      <p className="text-sm text-muted-foreground">
        Tab content pending (plans 59-05 through 59-07).
      </p>
    </div>
  )
}

// Underscore-prefixed `_state` / `_dispatch` are sentinels — downstream plans
// 59-05/06/07 replace this component's body, threading real state through
// per-tab components.
export function BuilderTabs({ state: _state, dispatch: _dispatch }: BuilderTabsProps) {
  return (
    <Tabs defaultValue="concept" className="flex-1 flex flex-col">
      <TabsList className="flex-wrap h-auto gap-1 px-2 py-2 bg-muted/30">
        {TAB_DEFS.map((t) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            className="text-xs data-[state=active]:text-primary"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TAB_DEFS.map((t) => (
        <TabsContent key={t.id} value={t.id} className="flex-1 overflow-y-auto">
          <Placeholder label={t.label} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
