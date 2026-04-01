import { useCallback } from 'react'
import { useConditionStore, ConditionBadge } from '@/entities/condition'
import { ConditionCombobox } from '@/features/combat-tracker/ui/ConditionCombobox'
import { removeCondition, setConditionLocked } from '@/features/combat-tracker'
import type { ConditionSlug } from '@engine'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'

interface ConditionSectionProps {
  combatantId: string
}

export function ConditionSection({ combatantId }: ConditionSectionProps) {
  const conditions = useConditionStore(
    useShallow((s) => s.activeConditions.filter((c) => c.combatantId === combatantId))
  )

  const handleRemove = useCallback(
    (slug: string) => {
      const removed = removeCondition(combatantId, slug as ConditionSlug)
      if (removed.length > 0) {
        toast(`Removed ${slug} — also removed: ${removed.join(', ')}`)
      }
    },
    [combatantId]
  )

  const handleToggleLock = useCallback(
    (slug: string, currentlyLocked: boolean) => {
      setConditionLocked(combatantId, slug as ConditionSlug, !currentlyLocked)
    },
    [combatantId]
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Conditions
        </h4>
        <ConditionCombobox
          combatantId={combatantId}
          existingSlugs={conditions.map((c) => c.slug)}
        />
      </div>
      {conditions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {conditions.map((c) => (
            <ConditionBadge
              key={c.slug}
              condition={c}
              onRemove={() => handleRemove(c.slug)}
              onToggleLock={() => handleToggleLock(c.slug, !!c.isLocked)}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No active conditions</p>
      )}
    </div>
  )
}
