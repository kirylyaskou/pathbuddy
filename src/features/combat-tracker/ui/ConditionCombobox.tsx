import { useState, useCallback } from 'react'
import { Plus, Minus, Check } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/ui/popover'
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from '@/shared/ui/command'
import { Button } from '@/shared/ui/button'
import { CONDITION_SLUGS, VALUED_CONDITIONS, CONDITION_GROUPS } from '@engine'
import type { ConditionSlug } from '@engine'
import { applyCondition } from '@/features/combat-tracker'
import { toast } from 'sonner'

interface ConditionComboboxProps {
  combatantId: string
  existingSlugs: string[]
}

const groupedSlugs = new Set(Object.values(CONDITION_GROUPS).flat())
const otherSlugs = CONDITION_SLUGS.filter((s) => !groupedSlugs.has(s))

const groups: Array<{ label: string; slugs: readonly ConditionSlug[] }> = [
  { label: 'Death & Dying', slugs: CONDITION_GROUPS.death as ConditionSlug[] },
  { label: 'Abilities', slugs: CONDITION_GROUPS.abilities as ConditionSlug[] },
  { label: 'Senses', slugs: CONDITION_GROUPS.senses as ConditionSlug[] },
  { label: 'Detection', slugs: CONDITION_GROUPS.detection as ConditionSlug[] },
  { label: 'Attitudes', slugs: CONDITION_GROUPS.attitudes as ConditionSlug[] },
  { label: 'Other', slugs: otherSlugs as ConditionSlug[] },
]

export function ConditionCombobox({ combatantId, existingSlugs }: ConditionComboboxProps) {
  const [open, setOpen] = useState(false)
  const [selectedSlug, setSelectedSlug] = useState<ConditionSlug | null>(null)
  const [value, setValue] = useState(1)

  const isValued = selectedSlug && (VALUED_CONDITIONS as readonly string[]).includes(selectedSlug)

  const handleSelect = useCallback(
    (slug: ConditionSlug) => {
      if ((VALUED_CONDITIONS as readonly string[]).includes(slug)) {
        setSelectedSlug(slug)
        setValue(1)
      } else {
        const granted = applyCondition(combatantId, slug)
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
    const granted = applyCondition(combatantId, selectedSlug, value)
    if (granted.length > 0) {
      toast(`Applied ${selectedSlug} ${value} — also granted: ${granted.join(', ')}`)
    }
    setOpen(false)
    setSelectedSlug(null)
    setValue(1)
  }, [combatantId, selectedSlug, value])

  const handleBack = useCallback(() => {
    setSelectedSlug(null)
    setValue(1)
  }, [])

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSelectedSlug(null); setValue(1) } }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
          <Plus className="w-3 h-3" />
          Condition
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        {selectedSlug && isValued ? (
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
