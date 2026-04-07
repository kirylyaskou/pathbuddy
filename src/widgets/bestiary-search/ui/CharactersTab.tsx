import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { getAllCharacters } from '@/shared/api'
import type { CharacterRecord } from '@/shared/api'
import { useEncounterTabsStore } from '@/features/combat-tracker'
import { useShallow } from 'zustand/react/shallow'
import { calculatePCMaxHP } from '@engine'
import type { PathbuilderBuild } from '@engine'
import type { Combatant } from '@/entities/combatant'

export function CharactersTab() {
  const [characters, setCharacters] = useState<CharacterRecord[]>([])
  const [loadError, setLoadError] = useState(false)

  const { openTabs, addCombatantToTab } = useEncounterTabsStore(
    useShallow((s) => ({ openTabs: s.openTabs, addCombatantToTab: s.addCombatantToTab }))
  )

  useEffect(() => {
    getAllCharacters()
      .then(setCharacters)
      .catch(() => setLoadError(true))
  }, [])

  function buildCombatant(character: CharacterRecord): Combatant | null {
    try {
      const build = JSON.parse(character.rawJson) as PathbuilderBuild
      const maxHp = calculatePCMaxHP(build)
      const ac = build.acTotal.acProfBonus + build.acTotal.acAbilityBonus + build.acTotal.acItemBonus
      return {
        id: crypto.randomUUID(),
        creatureRef: character.id,
        displayName: character.name,
        initiative: 0,
        hp: maxHp,
        maxHp,
        tempHp: 0,
        isNPC: false,
        ac,
      }
    } catch {
      return null
    }
  }

  function handleAdd(character: CharacterRecord, tabId?: string) {
    const combatant = buildCombatant(character)
    if (!combatant) {
      toast(`Failed to add ${character.name}`)
      return
    }
    if (openTabs.length === 0) {
      toast('No encounter open. Open an encounter first.')
      return
    }
    const targetTabId = tabId ?? openTabs[0].id
    const tab = openTabs.find((t) => t.id === targetTabId)
    addCombatantToTab(targetTabId, combatant)
    toast(`${character.name} added to ${tab?.name ?? 'encounter'}`)
  }

  if (loadError) {
    return (
      <div className="p-3 text-sm text-muted-foreground text-center">
        Could not load characters. Check the Characters page.
      </div>
    )
  }

  if (characters.length === 0) {
    return (
      <div className="p-3 text-center space-y-1">
        <p className="text-sm font-medium text-muted-foreground">No characters</p>
        <p className="text-xs text-muted-foreground/70">Add characters on the Characters page.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2 space-y-0.5">
        {characters.map((character) => {
          const rowContent = (
            <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer">
              <UserPlus className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium flex-1 truncate">{character.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {character.class ?? '—'} {character.level ?? '?'}
              </span>
            </div>
          )

          if (openTabs.length > 1) {
            return (
              <DropdownMenu key={character.id}>
                <DropdownMenuTrigger asChild>
                  {rowContent}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {openTabs.map((tab) => (
                    <DropdownMenuItem key={tab.id} onClick={() => handleAdd(character, tab.id)}>
                      Add to: {tab.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }

          return (
            <div key={character.id} onClick={() => handleAdd(character)}>
              {rowContent}
            </div>
          )
        })}
      </div>
    </div>
  )
}
