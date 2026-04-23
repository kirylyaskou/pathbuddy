import { Flame, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip'
import { IconButton } from '@/shared/ui/icon-button'
import { SpellCard } from '@/entities/creature'

export interface SpellRowProps {
  name: string
  foundryId: string | null
  rank: number
  cast: boolean
  isEdit: boolean
  showCast: boolean
  canCast: boolean
  onCast?: () => void
  onRemove?: () => void
  sourceName?: string
  combatId?: string
  castRank?: number
  showCastTooltip: boolean
  removeTitle?: string
}

export function SpellRow({
  name,
  foundryId,
  rank,
  cast,
  isEdit,
  showCast,
  canCast,
  onCast,
  onRemove,
  sourceName,
  combatId,
  castRank,
  showCastTooltip,
  removeTitle,
}: SpellRowProps) {
  const castButton = showCast && canCast ? (
    <button
      type="button"
      onClick={onCast}
      className={cn(
        'p-1 rounded shrink-0 transition-colors',
        cast
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground/70 hover:text-primary hover:bg-accent/30',
      )}
      aria-label={`Cast ${name} at rank ${rank}`}
    >
      <Flame className="w-3 h-3" />
    </button>
  ) : null

  return (
    <div className="flex items-center gap-1 group">
      {castButton && (
        showCastTooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>{castButton}</TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Cast &amp; apply effect
            </TooltipContent>
          </Tooltip>
        ) : castButton
      )}
      <div className="flex-1">
        <SpellCard
          name={name}
          foundryId={foundryId}
          source={sourceName}
          combatId={combatId}
          castRank={castRank ?? rank}
          castConsumed={cast}
        />
      </div>
      {isEdit && onRemove && (
        <IconButton
          intent="danger"
          showOnHover
          onClick={onRemove}
          title={removeTitle ?? 'Remove'}
        >
          <X className="w-3 h-3" />
        </IconButton>
      )}
    </div>
  )
}
