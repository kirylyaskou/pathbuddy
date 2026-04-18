import { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { SearchInput } from '@/shared/ui/search-input'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Skeleton } from '@/shared/ui/skeleton'
import { MascotHex } from '@/shared/ui/mascot-hex'
import { cn } from '@/shared/lib/utils'
import {
  listSpellEffects,
  getContextEffectsForEncounter,
  applyEffectToCombatant,
} from '@/shared/api/effects'
import type { SpellEffectRow, SpellEffectCategory } from '@/entities/spell-effect'
import { useEffectStore, durationToRounds } from '@/entities/spell-effect'
import { useCombatTrackerStore } from '../model/store'
import { toast } from 'sonner'

interface EffectPickerDialogProps {
  combatantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TABS: { id: SpellEffectCategory; label: string }[] = [
  { id: 'spell', label: 'Spell' },
  { id: 'alchemical', label: 'Alchemical' },
  { id: 'other', label: 'Other' },
]

export function EffectPickerDialog({ combatantId, open, onOpenChange }: EffectPickerDialogProps) {
  const [allEffects, setAllEffects] = useState<SpellEffectRow[]>([])
  const [contextEffects, setContextEffects] = useState<SpellEffectRow[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<SpellEffectCategory>('spell')

  // 61-02: refetch context when data version bumps (sync, overrides).
  const entityDataVersion = useCombatTrackerStore((s) => s.entityDataVersion)

  useEffect(() => {
    if (!open) return
    const encounterId = useCombatTrackerStore.getState().combatId
    setLoading(true)
    setSearchQuery('')
    Promise.all([
      listSpellEffects(),
      encounterId ? getContextEffectsForEncounter(encounterId) : Promise.resolve([]),
    ])
      .then(([all, ctx]) => {
        setAllEffects(all)
        setContextEffects(ctx)
      })
      .finally(() => setLoading(false))
  }, [open, entityDataVersion])

  const isSearching = searchQuery.trim().length > 0

  // Empty search: show context default (fall back to all if context empty).
  // Non-empty search: global search across all effects, name + description.
  const displayed = useMemo(() => {
    if (isSearching) {
      const q = searchQuery.toLowerCase()
      return allEffects.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.description ?? '').toLowerCase().includes(q)
      )
    }
    return contextEffects.length > 0 ? contextEffects : allEffects
  }, [isSearching, searchQuery, allEffects, contextEffects])

  // 61-04: pre-compute per-tab buckets so counts on tab strip and the rendered
  // list are always consistent with the same source set.
  const byCategory = useMemo(() => {
    const acc: Record<SpellEffectCategory, SpellEffectRow[]> = {
      spell: [],
      alchemical: [],
      other: [],
    }
    for (const e of displayed) acc[e.category].push(e)
    return acc
  }, [displayed])

  // Auto-switch to a non-empty tab when the active one has no rows (e.g. after
  // clearing search into a context where only one category is populated).
  useEffect(() => {
    if (loading) return
    if (byCategory[activeTab].length > 0) return
    const firstNonEmpty = TABS.find((t) => byCategory[t.id].length > 0)
    if (firstNonEmpty) setActiveTab(firstNonEmpty.id)
  }, [byCategory, activeTab, loading])

  const rows = byCategory[activeTab]
  const showFallbackHint =
    !isSearching && contextEffects.length === 0 && !loading

  const handleSelect = useCallback(
    async (effect: SpellEffectRow) => {
      const encounterId = useCombatTrackerStore.getState().combatId
      if (!encounterId) return
      const remainingTurns = durationToRounds(effect.duration_json)
      try {
        const newId = await applyEffectToCombatant(encounterId, combatantId, effect.id, remainingTurns)
        useEffectStore.getState().addEffect({
          id: newId,
          combatantId,
          effectId: effect.id,
          effectName: effect.name,
          remainingTurns,
          rulesJson: effect.rules_json,
          durationJson: effect.duration_json,
          description: effect.description,
          level: effect.level,
        })
        toast(`Applied ${effect.name}`)
        onOpenChange(false)
      } catch {
        toast(`Failed to apply ${effect.name}`)
      }
    },
    [combatantId, onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm">Spell Effects</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              contextEffects.length > 0 && !isSearching
                ? 'Search all effects…'
                : 'Search effects…'
            }
            aria-label="Search spell effects"
            autoFocus
            className="h-8 text-xs"
          />
          {showFallbackHint && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              No spell context in this encounter — browsing full library ({allEffects.length} effects).
            </p>
          )}
        </div>

        {/* Tab strip */}
        <div className="flex items-stretch border-y border-border/40">
          {TABS.map((t) => {
            const count = byCategory[t.id].length
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-r border-border/40 last:border-r-0',
                  isActive
                    ? 'bg-primary/10 text-primary border-b-2 border-b-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/20'
                )}
              >
                <span>{t.label}</span>
                <span className={cn('font-mono text-[10px]', isActive ? 'text-primary/80' : 'text-muted-foreground/70')}>
                  ({count})
                </span>
              </button>
            )
          })}
        </div>

        <ScrollArea className="h-[28rem] px-2">
          {loading ? (
            <div className="space-y-1 px-2 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState isSearching={isSearching} tabLabel={TABS.find((t) => t.id === activeTab)!.label} />
          ) : (
            <div className="space-y-1 py-2">
              {rows.map((effect) => {
                const desc = effect.description ? effect.description.slice(0, 160) : null
                return (
                  <div
                    key={effect.id}
                    role="button"
                    tabIndex={0}
                    className="flex flex-col px-3 py-2 rounded-md cursor-pointer hover:bg-accent/30 transition-colors border border-border/20 bg-card/30"
                    onClick={() => handleSelect(effect)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelect(effect)}
                  >
                    <span className="text-sm font-semibold">{effect.name}</span>
                    {desc && (
                      <span className="text-xs text-muted-foreground line-clamp-2 leading-snug">{desc}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function EmptyState({ isSearching, tabLabel }: { isSearching: boolean; tabLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
      <MascotHex height={128} className="opacity-70" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">
          {isSearching ? 'No effects match your search' : `No ${tabLabel.toLowerCase()} effects here`}
        </p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          {isSearching
            ? 'Try a different term, or switch tabs to browse other categories.'
            : 'Switch tabs to browse other categories, or type in search to find any effect in the library.'}
        </p>
      </div>
    </div>
  )
}
