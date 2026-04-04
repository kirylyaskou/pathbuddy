import { Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Separator } from '@/shared/ui/separator'
import { useRollStore } from '@/shared/model/roll-store'
import type { Roll } from '@engine'

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function RollRow({ roll }: { roll: Roll }) {
  return (
    <div className="flex items-center gap-2 px-3 h-8 hover:bg-muted/50 transition-colors duration-150">
      <span className="text-xs text-muted-foreground font-mono w-10 shrink-0">
        {formatTime(roll.timestamp)}
      </span>
      <Badge variant="secondary" className="text-xs font-mono">
        {roll.formula}
      </Badge>
      <span className="text-xs font-mono text-muted-foreground">
        {roll.dice.map((d) => d.value).join('+')}
      </span>
      {roll.modifier !== 0 && (
        <span className="text-xs font-mono text-muted-foreground">
          {roll.modifier > 0 ? '+' : ''}{roll.modifier}
        </span>
      )}
      <span className="flex-1" />
      <span className="text-xs font-mono font-semibold" style={{ color: 'var(--pf-gold)' }}>
        = {roll.total}
      </span>
    </div>
  )
}

export function RollHistoryPanel() {
  const rolls = useRollStore((state) => state.rolls)
  const clearRolls = useRollStore((state) => state.clearRolls)

  const displayRolls = [...rolls].reverse().slice(0, 50)

  return (
    <div className="w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center">
          <span className="text-sm font-semibold">Roll History</span>
          <Badge variant="secondary" className="ml-2">
            {rolls.length === 1 ? '1 roll' : `${rolls.length} rolls`}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearRolls}
          disabled={rolls.length === 0}
          aria-label="Clear roll history"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Clear History
        </Button>
      </div>

      <Separator />

      {/* Content */}
      <div className="max-h-[240px] overflow-y-auto">
        {rolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm font-semibold">No rolls yet</p>
            <p className="text-xs">Rolls will appear here during the session.</p>
          </div>
        ) : (
          displayRolls.map((roll) => <RollRow key={roll.id} roll={roll} />)
        )}
      </div>
    </div>
  )
}
