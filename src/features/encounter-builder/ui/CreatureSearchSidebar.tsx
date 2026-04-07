import { useState, useEffect, useCallback } from 'react'
import { Search, UserPlus, SlidersHorizontal, Check, X } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { LevelBadge } from '@/shared/ui/level-badge'
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/ui/popover'
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/shared/ui/command'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/select'
import { CreatureCard, toCreature } from '@/entities/creature'
import type { WeakEliteTier } from '@/entities/creature'
import {
  searchCreaturesFiltered,
  fetchDistinctCreatureTypes,
  fetchDistinctCreatureSources,
  fetchDistinctTraits,
  searchHazards,
  getAllHazards,
  getAllCharacters,
} from '@/shared/api'
import type { CreatureRow, HazardRow, CharacterRecord } from '@/shared/api'
import { useEncounterBuilderStore } from '../model/store'
import { getHpAdjustment, getStatAdjustment } from '@engine'
import { cn } from '@/shared/lib/utils'

type SidebarTab = 'creatures' | 'hazards' | 'characters'

const TIERS: { value: WeakEliteTier; label: string }[] = [
  { value: 'weak', label: 'Weak' },
  { value: 'normal', label: 'Normal' },
  { value: 'elite', label: 'Elite' },
]

const RARITIES = ['common', 'uncommon', 'rare', 'unique'] as const

interface CreatureSearchSidebarProps {
  onAddCreature?: (row: CreatureRow, tier: WeakEliteTier) => void
  onAddHazard?: (hazard: HazardRow) => void
  onAddCharacter?: (character: CharacterRecord) => void
}

function DraggableCreatureRow({
  row,
  tier,
  children,
}: {
  row: CreatureRow
  tier: WeakEliteTier
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `creature-${row.id}`,
    data: { type: 'creature' as const, row, tier },
  })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0 : 1 }}>
      {children}
    </div>
  )
}

function DraggableHazardRow({
  hazard,
  children,
}: {
  hazard: HazardRow
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `hazard-${hazard.id}`,
    data: { type: 'hazard' as const, hazard },
  })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0 : 1 }}>
      {children}
    </div>
  )
}

export function CreatureSearchSidebar({ onAddCreature, onAddHazard, onAddCharacter }: CreatureSearchSidebarProps = {}) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('creatures')
  const [query, setQuery] = useState('')

  // Creature state
  const [creatureResults, setCreatureResults] = useState<CreatureRow[]>([])
  const [creatureLoading, setCreatureLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState<WeakEliteTier>('normal')

  // Filter panel state — creatures tab only
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [levelMin, setLevelMin] = useState<string>('')
  const [levelMax, setLevelMax] = useState<string>('')
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])
  const [creatureType, setCreatureType] = useState<string | null>(null)
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
  const [sourceName, setSourceName] = useState<string | null>(null)
  const [traitsOpen, setTraitsOpen] = useState(false)

  // Distinct value pools (loaded once on mount)
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [availableSources, setAvailableSources] = useState<string[]>([])
  const [availableTraits, setAvailableTraits] = useState<string[]>([])

  // Hazard state
  const [hazardResults, setHazardResults] = useState<HazardRow[]>([])
  const [hazardLoading, setHazardLoading] = useState(false)

  // Character state
  const [characters, setCharacters] = useState<CharacterRecord[]>([])
  const [characterLoadError, setCharacterLoadError] = useState(false)

  const addCreatureToDraft = useEncounterBuilderStore((s) => s.addCreatureToDraft)
  const addHazardToDraft = useEncounterBuilderStore((s) => s.addHazardToDraft)

  // Load filter option pools once
  useEffect(() => {
    fetchDistinctCreatureTypes().then(setAvailableTypes).catch(() => {})
    fetchDistinctCreatureSources().then(setAvailableSources).catch(() => {})
    fetchDistinctTraits().then(setAvailableTraits).catch(() => {})
  }, [])

  const toggleRarity = useCallback((r: string) => {
    setSelectedRarities((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    )
  }, [])

  const toggleTrait = useCallback((t: string) => {
    setSelectedTraits((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
  }, [])

  const activeFilterCount = [
    levelMin !== '' ? 1 : 0,
    levelMax !== '' ? 1 : 0,
    selectedRarities.length,
    creatureType ? 1 : 0,
    selectedTraits.length,
    sourceName ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  // Creature search
  useEffect(() => {
    if (activeTab !== 'creatures') return
    let cancelled = false
    const search = async () => {
      setCreatureLoading(true)
      try {
        const parsedMin = levelMin.trim() === '' ? null : Number(levelMin)
        const parsedMax = levelMax.trim() === '' ? null : Number(levelMax)
        const filters = {
          query: query.trim() || undefined,
          levelMin: Number.isFinite(parsedMin) ? parsedMin : null,
          levelMax: Number.isFinite(parsedMax) ? parsedMax : null,
          rarity: selectedRarities.length > 0 ? selectedRarities : null,
          creatureType: creatureType,
          traits: selectedTraits,
          sourceName: sourceName,
        }
        const rows = await searchCreaturesFiltered(filters, 50, 0)
        if (!cancelled) setCreatureResults(rows)
      } finally {
        if (!cancelled) setCreatureLoading(false)
      }
    }
    const timer = setTimeout(search, 200)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query, activeTab, levelMin, levelMax, selectedRarities, creatureType, selectedTraits, sourceName])

  // Hazard search
  useEffect(() => {
    if (activeTab !== 'hazards') return
    let cancelled = false
    const search = async () => {
      setHazardLoading(true)
      try {
        const rows = query.trim()
          ? await searchHazards(query, 50)
          : await getAllHazards()
        if (!cancelled) setHazardResults(rows)
      } finally {
        if (!cancelled) setHazardLoading(false)
      }
    }
    const timer = setTimeout(search, 200)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query, activeTab])

  // Character loading
  useEffect(() => {
    if (activeTab !== 'characters') return
    getAllCharacters()
      .then(setCharacters)
      .catch(() => setCharacterLoadError(true))
  }, [activeTab])

  // Reset tier on query change
  useEffect(() => {
    setSelectedTier('normal')
  }, [query])

  const handleAddCreature = useCallback(
    (row: CreatureRow) => {
      if (onAddCreature) {
        onAddCreature(row, selectedTier)
      } else {
        const creature = toCreature(row)
        addCreatureToDraft({
          creatureId: creature.id,
          name: creature.name,
          level: creature.level,
          tier: selectedTier,
        })
      }
      setSelectedTier('normal')
    },
    [onAddCreature, addCreatureToDraft, selectedTier]
  )

  const handleAddHazard = useCallback(
    (hazard: HazardRow) => {
      if (onAddHazard) {
        onAddHazard(hazard)
      } else {
        addHazardToDraft({
          name: hazard.name,
          level: hazard.level,
          type: hazard.is_complex ? 'complex' : 'simple',
        })
      }
    },
    [onAddHazard, addHazardToDraft]
  )

  const handleTabChange = (tab: SidebarTab) => {
    setActiveTab(tab)
    setQuery('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab toggle */}
      <div className="p-2 border-b border-border/50 space-y-1.5">
        <div className="flex gap-1">
          <button
            onClick={() => handleTabChange('creatures')}
            className={`flex-1 py-1 text-xs rounded font-semibold transition-colors ${
              activeTab === 'creatures'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            Creatures
          </button>
          <button
            onClick={() => handleTabChange('hazards')}
            className={`flex-1 py-1 text-xs rounded font-semibold transition-colors ${
              activeTab === 'hazards'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            Hazards
          </button>
          <button
            onClick={() => handleTabChange('characters')}
            className={`flex-1 py-1 text-xs rounded font-semibold transition-colors ${
              activeTab === 'characters'
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            Characters
          </button>
        </div>

        {/* Search input — creatures and hazards only */}
        {activeTab !== 'characters' && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeTab === 'creatures' ? 'Search creatures...' : 'Search hazards...'}
              className="pl-8 h-8 text-sm"
            />
          </div>
        )}

        {/* Tier selector — creatures only */}
        {activeTab === 'creatures' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Tier</span>
            {TIERS.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedTier(t.value)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  selectedTier === t.value
                    ? t.value === 'elite'
                      ? 'bg-primary text-primary-foreground'
                      : t.value === 'weak'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Filters toggle + panel — creatures tab only */}
        {activeTab === 'creatures' && (
          <div className="space-y-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-7 text-xs"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <SlidersHorizontal className="w-3 h-3 mr-1.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="text-primary font-normal ml-1">({activeFilterCount})</span>
              )}
            </Button>

            {filtersOpen && (
              <div className="space-y-2 pt-1.5">
                {/* Level range */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="text-[10px] uppercase tracking-wider">Lv</span>
                  <Input
                    type="number"
                    placeholder="min"
                    value={levelMin}
                    onChange={(e) => setLevelMin(e.target.value)}
                    className="w-14 h-6 text-xs px-1.5"
                    min={0}
                    max={25}
                  />
                  <span>–</span>
                  <Input
                    type="number"
                    placeholder="max"
                    value={levelMax}
                    onChange={(e) => setLevelMax(e.target.value)}
                    className="w-14 h-6 text-xs px-1.5"
                    min={0}
                    max={25}
                  />
                </div>

                {/* Rarity chips (multi-select) */}
                <div className="flex gap-1">
                  {RARITIES.map((r) => {
                    const active = selectedRarities.includes(r)
                    return (
                      <button
                        key={r}
                        onClick={() => toggleRarity(r)}
                        className={cn(
                          'px-2 py-0.5 text-[10px] rounded border capitalize font-normal transition-colors',
                          active
                            ? 'bg-secondary border-current text-[var(--pf-rarity-' + r + ')]'
                            : 'text-muted-foreground border-border/40 hover:border-border'
                        )}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>

                {/* Creature type (family) dropdown */}
                <Select
                  value={creatureType ?? '__all__'}
                  onValueChange={(v) => setCreatureType(v === '__all__' ? null : v)}
                >
                  <SelectTrigger className="h-6 text-xs w-full border-border/40">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All types</SelectItem>
                    {availableTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Traits combobox */}
                <Popover open={traitsOpen} onOpenChange={setTraitsOpen}>
                  <PopoverTrigger asChild>
                    <button className="h-6 px-2 text-xs border border-border/40 rounded hover:border-border transition-colors text-muted-foreground w-full text-left">
                      {selectedTraits.length > 0
                        ? `${selectedTraits.length} trait${selectedTraits.length !== 1 ? 's' : ''}`
                        : 'Traits'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search traits..." />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No traits found.</CommandEmpty>
                        {availableTraits.map((trait) => (
                          <CommandItem
                            key={trait}
                            onSelect={() => toggleTrait(trait)}
                            className="flex items-center gap-2 text-xs"
                          >
                            <div
                              className={cn(
                                'w-3 h-3 border rounded-sm flex items-center justify-center shrink-0',
                                selectedTraits.includes(trait) ? 'bg-primary border-primary' : 'border-border'
                              )}
                            >
                              {selectedTraits.includes(trait) && (
                                <Check className="w-2.5 h-2.5 text-primary-foreground" />
                              )}
                            </div>
                            <span className="uppercase tracking-wider text-[10px]">{trait}</span>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected trait chips */}
                {selectedTraits.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTraits.map((trait) => (
                      <button
                        key={trait}
                        onClick={() => toggleTrait(trait)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider hover:bg-destructive/20 hover:text-destructive hover:border-destructive/30 transition-colors"
                      >
                        {trait}
                        <X className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Source book dropdown */}
                <Select
                  value={sourceName ?? '__all__'}
                  onValueChange={(v) => setSourceName(v === '__all__' ? null : v)}
                >
                  <SelectTrigger className="h-6 text-xs w-full border-border/40">
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All sources</SelectItem>
                    {availableSources.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {/* Creature results */}
          {activeTab === 'creatures' && (
            <>
              {creatureLoading && creatureResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
              )}
              {!creatureLoading && creatureResults.length === 0 && query.trim() && (
                <p className="text-sm text-muted-foreground text-center py-4">No creatures found</p>
              )}
              {creatureResults.map((row) => {
                const creature = toCreature(row)
                const hpDelta = getHpAdjustment(selectedTier, creature.level)
                const statDelta = getStatAdjustment(selectedTier)
                return (
                  <DraggableCreatureRow key={row.id} row={row} tier={selectedTier}>
                    <CreatureCard
                      creature={creature}
                      compact
                      onAdd={() => handleAddCreature(row)}
                    />
                    {hpDelta !== 0 && (
                      <p className="text-[10px] text-muted-foreground px-2 -mt-0.5 mb-1">
                        HP: {creature.hp} → {Math.max(1, creature.hp + hpDelta)}{' '}
                        <span className={hpDelta > 0 ? 'text-primary' : 'text-destructive'}>
                          ({hpDelta > 0 ? '+' : ''}{hpDelta})
                        </span>
                        {' | '}AC: {creature.ac} → {creature.ac + statDelta}{' '}
                        <span className={statDelta > 0 ? 'text-primary' : 'text-destructive'}>
                          ({statDelta > 0 ? '+' : ''}{statDelta})
                        </span>
                      </p>
                    )}
                  </DraggableCreatureRow>
                )
              })}
            </>
          )}

          {/* Character results */}
          {activeTab === 'characters' && (
            <>
              {characterLoadError && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Could not load characters. Check the Characters page.
                </p>
              )}
              {!characterLoadError && characters.length === 0 && (
                <div className="text-center py-4 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">No characters</p>
                  <p className="text-xs text-muted-foreground/70">Add characters on the Characters page.</p>
                </div>
              )}
              {characters.map((character) => (
                <div
                  key={character.id}
                  onClick={() => onAddCharacter?.(character)}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary/50 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium flex-1 truncate">{character.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {character.class ?? '—'} {character.level ?? '?'}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* Hazard results */}
          {activeTab === 'hazards' && (
            <>
              {hazardLoading && hazardResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
              )}
              {!hazardLoading && hazardResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {query.trim() ? 'No hazards found' : 'Run sync to import hazards'}
                </p>
              )}
              {hazardResults.map((hazard) => (
                <DraggableHazardRow key={hazard.id} hazard={hazard}>
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-secondary/30 hover:bg-secondary/50 group cursor-pointer"
                    onClick={() => handleAddHazard(hazard)}
                  >
                    <LevelBadge level={hazard.level} size="sm" />
                    <span className="flex-1 text-sm font-medium truncate">{hazard.name}</span>
                    {hazard.is_complex ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-900/30 text-orange-400 shrink-0">
                        complex
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/50 text-zinc-400 shrink-0">
                        simple
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0">
                      + add
                    </span>
                  </div>
                </DraggableHazardRow>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
