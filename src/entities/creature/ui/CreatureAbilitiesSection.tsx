import { useEffect, useState } from 'react'
import { Swords, Shield as ShieldIcon, Sparkles } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Collapsible, CollapsibleContent } from '@/shared/ui/collapsible'
import { SectionHeader } from '@/shared/ui/section-header'
import { AbilityCard } from '@/shared/ui/ability-card'
import { highlightGameText } from '../lib/foundry-text'
import type { ClassifiedAbilities } from '../model/classify-abilities'
import type { AbilityLoc } from '@/shared/i18n'
import type { DisplayActionCost } from '../model/types'
import { renderMarkdownLite } from '@/shared/lib/render-markdown-lite'

type AbilityTab = 'offensive' | 'defensive' | 'other'
type AbilityEntry = ClassifiedAbilities['offensive'][number]

interface CreatureAbilitiesSectionProps {
  classified: ClassifiedAbilities
  onRoll: (formula: string, label: string) => void
  abilitiesLocByName?: Map<string, AbilityLoc>
}

function resolveAbilityLoc(
  ability: { name: string; actionCost?: DisplayActionCost; description: string; traits?: string[] },
  loc: AbilityLoc | undefined,
) {
  return {
    displayName: loc?.name ?? ability.name,
    displayCost: ability.actionCost,
    displayTraits: ability.traits ?? [],
    locDescription: loc?.description,
  }
}

function AbilityCardResolved({
  ability,
  loc,
  cardKey,
  actionCostOverride,
  onRoll,
}: {
  ability: AbilityEntry
  loc: AbilityLoc | undefined
  cardKey: string
  actionCostOverride?: DisplayActionCost
  onRoll: (formula: string, label: string) => void
}) {
  const { displayName, displayCost, displayTraits, locDescription } = resolveAbilityLoc(ability, loc)
  const cost = actionCostOverride ?? (displayCost !== 0 ? displayCost : undefined)
  return (
    <AbilityCard key={cardKey} name={displayName} actionCost={cost} traits={displayTraits}>
      <p className="text-sm text-foreground/80 leading-relaxed">
        {locDescription
          // RU descriptions render via markdown-lite — clickable-formula
          // extraction does not survive parsing into RU tokens; engine
          // numeric values are surfaced via separate strike/skill rows.
          ? renderMarkdownLite(locDescription)
          : highlightGameText(ability.description, (f) => onRoll(f, ability.name))}
      </p>
    </AbilityCard>
  )
}

export function CreatureAbilitiesSection({ classified, onRoll, abilitiesLocByName }: CreatureAbilitiesSectionProps) {
  const [tab, setTab] = useState<AbilityTab>('offensive')

  // Switch away from 'offensive' if it's empty — fall back to first non-empty
  // tab so creatures with only defensive/other abilities don't open blank.
  useEffect(() => {
    if (tab === 'offensive' && classified.offensive.length === 0) {
      if (classified.defensive.length > 0) setTab('defensive')
      else if (classified.other.length > 0) setTab('other')
    }
  }, [tab, classified.offensive.length, classified.defensive.length, classified.other.length])

  const tabs = (
    [
      { id: 'offensive', label: 'Offensive', icon: Swords, count: classified.offensive.length },
      { id: 'defensive', label: 'Defensive', icon: ShieldIcon, count: classified.defensive.length },
      { id: 'other', label: 'Other', icon: Sparkles, count: classified.other.length },
    ] as const
  ).filter(({ count }) => count > 0)

  const activeList = classified[tab]

  return (
    <Collapsible defaultOpen>
      <SectionHeader>Abilities</SectionHeader>
      <CollapsibleContent>
        <div className="px-4 py-3 space-y-3">
          <div className="flex flex-wrap gap-1">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors',
                  tab === id
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'hover:bg-muted/50 border border-transparent',
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
                <span className="text-muted-foreground">({count})</span>
              </button>
            ))}
          </div>

          {activeList.length === 1 ? (
            <AbilityCardResolved
              ability={activeList[0]}
              loc={abilitiesLocByName?.get(activeList[0].name.trim().toLowerCase())}
              cardKey={`${tab}-0`}
              onRoll={onRoll}
            />
          ) : (
            <div
              className="grid gap-2 items-start"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            >
              {activeList.map((ability, i) => (
                <AbilityCardResolved
                  key={`${tab}-${i}`}
                  ability={ability}
                  loc={abilitiesLocByName?.get(ability.name.trim().toLowerCase())}
                  cardKey={`${tab}-${i}`}
                  onRoll={onRoll}
                />
              ))}
            </div>
          )}

          {classified.reactions.length > 0 && (
            <div className="pt-2 border-t border-border/30">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Reactions
              </p>
              <div
                className="grid gap-2 items-start"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
              >
                {classified.reactions.map((ability, i) => (
                  <AbilityCardResolved
                    key={`react-${i}`}
                    ability={ability}
                    loc={abilitiesLocByName?.get(ability.name.trim().toLowerCase())}
                    cardKey={`react-${i}`}
                    actionCostOverride="reaction"
                    onRoll={onRoll}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
