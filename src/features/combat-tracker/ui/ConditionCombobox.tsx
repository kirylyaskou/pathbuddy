import { useState, useCallback } from 'react'
import { Plus, Minus, Check } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/ui/popover'
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from '@/shared/ui/command'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { CONDITION_SLUGS, VALUED_CONDITIONS, CONDITION_GROUPS } from '@engine'
import type { ConditionSlug } from '@engine'
import { applyCondition } from '@/features/combat-tracker'
import { useConditionStore } from '@/entities/condition'
import { toast } from 'sonner'

interface ConditionComboboxProps {
  combatantId: string
  existingSlugs: string[]
}

const PERSISTENT_SLUGS = [
  'persistent-fire', 'persistent-cold', 'persistent-acid',
  'persistent-bleed', 'persistent-electricity', 'persistent-poison',
] as const

const groupedSlugs = new Set(Object.values(CONDITION_GROUPS).flat())
const otherSlugs = CONDITION_SLUGS.filter((s) => !groupedSlugs.has(s))

const groups: Array<{ label: string; slugs: readonly string[] }> = [
  { label: 'Persistent Damage', slugs: PERSISTENT_SLUGS },
  { label: 'Death & Dying', slugs: CONDITION_GROUPS.death as ConditionSlug[] },
  { label: 'Abilities', slugs: CONDITION_GROUPS.abilities as ConditionSlug[] },
  { label: 'Senses', slugs: CONDITION_GROUPS.senses as ConditionSlug[] },
  { label: 'Detection', slugs: CONDITION_GROUPS.detection as ConditionSlug[] },
  { label: 'Attitudes', slugs: CONDITION_GROUPS.attitudes as ConditionSlug[] },
  { label: 'Other', slugs: otherSlugs as ConditionSlug[] },
]

export function ConditionCombobox({ combatantId, existingSlugs }: ConditionComboboxProps) {
  const [open, setOpen] = useState(false)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [value, setValue] = useState(1)
  const [formula, setFormula] = useState('')

  const isPersistent = selectedSlug?.startsWith('persistent-')
  const isValued = selectedSlug && !isPersistent && (VALUED_CONDITIONS as readonly string[]).includes(selectedSlug)

  const handleSelect = useCallback(
    (slug: string) => {
      if (slug.startsWith('persistent-')) {
        setSelectedSlug(slug)
        setFormula('')
      } else if ((VALUED_CONDITIONS as readonly string[]).includes(slug)) {
        setSelectedSlug(slug)
        setValue(1)
      } else {
        const granted = applyCondition(combatantId, slug as ConditionSlug)
        if (granted.length > 0) {
          toast(`Applied ${slug} — also granted: ${granted.join(', ')}`)
        }
        setOpen(false)
        setSelectedSlug(null)
      }
    },
    [combatantId]
  )

  const handleApplyValued = useCallback(() => {
    if (!selectedSlug) return
    const granted = applyCondition(combatantId, selectedSlug as ConditionSlug, value)
    if (granted.length > 0) {
      toast(`Applied ${selectedSlug} ${value} — also granted: ${granted.join(', ')}`)
    }
    setOpen(false)
    setSelectedSlug(null)
    setValue(1)
  }, [combatantId, selectedSlug, value])

  const handleApplyPersistent = useCallback(() => {
    if (!selectedSlug || !formula.trim()) return
    useConditionStore.getState().setCondition({
      combatantId,
      slug: selectedSlug,
      value: 1,
      formula: formula.trim(),
    })
    toast(`Applied ${selectedSlug.replace('persistent-', 'persistent ')} (${formula.trim()})`)
    setOpen(false)
    setSelectedSlug(null)
    setFormula('')
  }, [combatantId, selectedSlug, formula])

  const handleBack = useCallback(() => {
    setSelectedSlug(null)
    setValue(1)
    setFormula('')
  }, [])

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSelectedSlug(null); setValue(1); setFormula('') } }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
          <Plus className="w-3 h-3" />
          Condition
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        {selectedSlug && isPersistent ? (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={handleBack} className="text-xs text-muted-foreground hover:text-foreground">
                ← Back
              </button>
              <span className="text-sm font-medium capitalize">
                {selectedSlug.replace('persistent-', 'persistent ')}
              </span>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Dice Formula</label>
              <Input
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="e.g. 2d6"
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleApplyPersistent()}
              />
            </div>
            <Button className="w-full h-8 text-xs" onClick={handleApplyPersistent} disabled={!formula.trim()}>
              <Check className="w-3 h-3 mr-1" />
              Apply {selectedSlug.replace('persistent-', 'persistent ')}
            </Button>
          </div>
        ) : selectedSlug && isValued ? (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={handleBack} className="text-xs text-muted-foreground hover:text-foreground">
                ← Back
              </button>
              <span className="text-sm font-medium capitalize">
                {selectedSlug.replace('-', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button
                size="icon"
                variant="outline"
                className="w-8 h-8"
                onClick={() => setValue(Math.max(1, value - 1))}
                disabled={value <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="text-2xl font-mono font-bold w-8 text-center">{value}</span>
              <Button
                size="icon"
                variant="outline"
                className="w-8 h-8"
                onClick={() => setValue(value + 1)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button className="w-full h-8 text-xs" onClick={handleApplyValued}>
              <Check className="w-3 h-3 mr-1" />
              Apply {selectedSlug.replace('-', ' ')} {value}
            </Button>
          </div>
        ) : (
          <Command>
            <CommandInput placeholder="Search conditions..." className="h-8" />
            <CommandList className="max-h-60">
              <CommandEmpty>No condition found.</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.slugs.map((slug) => (
                    <CommandItem
                      key={slug}
                      value={slug}
                      onSelect={() => handleSelect(slug)}
                      disabled={existingSlugs.includes(slug)}
                      className="text-xs capitalize"
                    >
                      {slug.replace('-', ' ')}
                      {existingSlugs.includes(slug) && (
                        <Check className="w-3 h-3 ml-auto opacity-50" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}
