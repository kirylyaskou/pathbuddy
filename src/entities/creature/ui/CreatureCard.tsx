import { Plus } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Card, CardContent } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { LevelBadge } from "@/shared/ui/level-badge"
import { StatBlock } from "@/shared/ui/stat-badge"
import { TraitList } from "@/shared/ui/trait-pill"
import type { Creature } from '../model/types'

interface CreatureCardProps {
  creature: Creature
  compact?: boolean
  onAdd?: () => void
  onClick?: () => void
  className?: string
}

export function CreatureCard({ creature, compact, onAdd, onClick, className }: CreatureCardProps) {
  if (compact) {
    return (
      <Card
        className={cn(
          "group cursor-pointer card-grimdark border-border/40 hover:border-primary/30",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-2.5">
          <div className="flex items-start gap-2.5">
            <LevelBadge level={creature.level} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-medium text-sm truncate">{creature.name}</h4>
                {onAdd && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20 hover:text-primary shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAdd()
                    }}
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <StatBlock
                  hp={creature.hp}
                  ac={creature.ac}
                  fort={creature.fort}
                  ref={creature.ref}
                  will={creature.will}
                  perception={creature.perception}
                  compact
                />
              </div>
              <TraitList
                traits={creature.traits.slice(0, 3)}
                rarity={creature.rarity}
                size={creature.size}
                showSize={false}
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "group cursor-pointer card-grimdark border-border/40 hover:border-primary/30",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <LevelBadge level={creature.level} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{creature.name}</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {creature.size} {creature.type}
                </p>
              </div>
              {onAdd && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 hover:bg-primary/20 text-primary border-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAdd()
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Summon
                </Button>
              )}
            </div>
            <StatBlock
              hp={creature.hp}
              ac={creature.ac}
              fort={creature.fort}
              ref={creature.ref}
              will={creature.will}
              perception={creature.perception}
              className="mt-3"
            />
            <TraitList
              traits={creature.traits}
              rarity={creature.rarity}
              size={creature.size}
              className="mt-3"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
