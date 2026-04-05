// ConditionCombobox — portal modal, no Radix Presence, single view (no tabs).
//
// WHY NO TABS: Radix TabsContent uses Presence internally. Presence creates a new
// composeRefs callback every render. When Zustand (useSyncExternalStore) forces a
// sync re-render while Presence is mounted, React calls old ref(null) + new ref(node)
// → setNode(null/node) → Presence re-renders → new composeRefs → infinite loop.
//
// FIX: createPortal + flushSync — no Radix Presence anywhere in this tree.

import { useState, useCallback, useEffect } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { Plus, Minus, Check, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { CONDITION_SLUGS, VALUED_CONDITIONS, CONDITION_GROUPS } from '@engine'
import type { ConditionSlug } from '@engine'
import { applyCondition } from '@/features/combat-tracker'
import { useConditionStore } from '@/entities/condition'
import { toast } from 'sonner'

interface Props {
  combatantId: string
  existingSlugs: string[]
}

const PERSISTENT_SLUGS = [
  'persistent-fire',
  'persistent-cold',
  'persistent-acid',
  'persistent-bleed',
  'persistent-electricity',
  'persistent-poison',
] as const

const SECTIONS: { label: string; slugs: readonly string[] }[] = [
  { label: 'Persistent Damage', slugs: PERSISTENT_SLUGS },
  { label: 'Death',             slugs: CONDITION_GROUPS['death']     ?? [] },
  { label: 'Abilities',         slugs: CONDITION_GROUPS['abilities'] ?? [] },
  { label: 'Senses',            slugs: CONDITION_GROUPS['senses']    ?? [] },
  { label: 'Detection',         slugs: CONDITION_GROUPS['detection'] ?? [] },
  { label: 'Attitudes',         slugs: CONDITION_GROUPS['attitudes'] ?? [] },
]

const groupedSet = new Set(SECTIONS.flatMap((s) => [...s.slugs]))
const otherSlugs = CONDITION_SLUGS.filter((s) => !groupedSet.has(s))
const allSlugs = [...SECTIONS.flatMap((s) => [...s.slugs]), ...otherSlugs]

const fmt = (s: string) => s.split('-').join(' ')
const norm = (s: string) => fmt(s).toLowerCase()

function ConditionPill({
  slug,
  disabled,
  selected,
  onClick,
}: {
  slug: string
  disabled: boolean
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`px-2 py-1.5 rounded text-xs capitalize cursor-pointer text-left break-words transition-colors
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-secondary/20'
            : selected
              ? 'bg-primary/20 border border-primary/50 text-primary'
              : 'bg-secondary/30 hover:bg-secondary/50 border border-border/30'
        }`}
      disabled={disabled}
      onClick={onClick}
    >
      {fmt(slug)}
      {disabled && <Check className="w-2.5 h-2.5 inline ml-1 opacity-50" />}
    </button>
  )
}

export function ConditionCombobox({ combatantId, existingSlugs }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [value, setValue] = useState(1)
  const [formula, setFormula] = useState('')

  const isPersistent = selected?.startsWith('persistent-') ?? false
  const isValued =
    selected != null &&
    !isPersistent &&
    (VALUED_CONDITIONS as readonly string[]).includes(selected)

  const close = useCallback(() => {
    setOpen(false)
    setSelected(null)
    setValue(1)
    setFormula('')
    setSearch('')
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  const handleSelect = useCallback(
    (slug: string) => {
      if (slug.startsWith('persistent-')) {
        setSelected(slug)
        setFormula('')
      } else if ((VALUED_CONDITIONS as readonly string[]).includes(slug)) {
        setSelected(slug)
        setValue(1)
      } else {
        flushSync(close)
        const granted = applyCondition(combatantId, slug as ConditionSlug)
        if (granted.length > 0) {
          toast(`Applied ${slug} — also granted: ${granted.join(', ')}`)
        }
      }
    },
    [combatantId, close],
  )

  const handleApply = useCallback(() => {
    if (!selected) return
    if (isPersistent) {
      if (!formula.trim()) return
      const slug = selected
      const f = formula.trim()
      flushSync(close)
      useConditionStore.getState().setCondition({ combatantId, slug, value: 1, formula: f })
      toast(`Applied ${slug.replace('persistent-', 'persistent ')} (${f})`)
    } else if (isValued) {
      const slug = selected
      const val = value
      flushSync(close)
      const granted = applyCondition(combatantId, slug as ConditionSlug, val)
      if (granted.length > 0) {
        toast(`Applied ${slug} ${val} — also granted: ${granted.join(', ')}`)
      }
    }
  }, [combatantId, selected, isPersistent, isValued, formula, value, close])

  const filtered = search
    ? allSlugs.filter((s) => norm(s).includes(norm(search)))
    : null

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 h-7 text-xs"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-3 h-3" />
        Condition
      </Button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50" onClick={close} />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-lg bg-background border border-border rounded-lg shadow-xl flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <span className="text-sm font-semibold">Add Condition</span>
                <button
                  onClick={close}
                  className="opacity-70 hover:opacity-100 transition-opacity text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="px-3 pt-2 pb-1 shrink-0">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conditions..."
                  className="h-8 text-xs"
                  autoFocus
                />
              </div>

              {/* Condition list */}
              <div className="overflow-y-auto flex-1 px-3 py-2">
                {filtered ? (
                  filtered.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      No condition found.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {filtered.map((slug) => (
                        <ConditionPill
                          key={slug}
                          slug={slug}
                          disabled={existingSlugs.includes(slug)}
                          selected={selected === slug}
                          onClick={() => handleSelect(slug)}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    {SECTIONS.map((section) => (
                      <div key={section.label}>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                          {section.label}
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {section.slugs.map((slug) => (
                            <ConditionPill
                              key={slug}
                              slug={slug}
                              disabled={existingSlugs.includes(slug)}
                              selected={selected === slug}
                              onClick={() => handleSelect(slug)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    {otherSlugs.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                          Other
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {otherSlugs.map((slug) => (
                            <ConditionPill
                              key={slug}
                              slug={slug}
                              disabled={existingSlugs.includes(slug)}
                              selected={selected === slug}
                              onClick={() => handleSelect(slug)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom config bar — valued or persistent */}
              {selected && (isPersistent || isValued) && (
                <div className="border-t border-border px-4 py-3 shrink-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium capitalize">{fmt(selected)}</span>
                    <button
                      onClick={() => setSelected(null)}
                      className="opacity-70 hover:opacity-100 transition-opacity text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isPersistent ? (
                    <div className="flex gap-2">
                      <Input
                        value={formula}
                        onChange={(e) => setFormula(e.target.value)}
                        placeholder="e.g. 2d6"
                        className="h-8 text-xs flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                        autoFocus
                      />
                      <Button
                        className="h-8 text-xs px-3"
                        onClick={handleApply}
                        disabled={!formula.trim()}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Apply
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="outline"
                        className="w-8 h-8 shrink-0"
                        onClick={() => setValue((v) => Math.max(1, v - 1))}
                        disabled={value <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-2xl font-mono font-bold w-8 text-center">
                        {value}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="w-8 h-8 shrink-0"
                        onClick={() => setValue((v) => v + 1)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                      <Button className="h-8 text-xs flex-1" onClick={handleApply}>
                        <Check className="w-3 h-3 mr-1" />
                        Apply {fmt(selected)} {value}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
