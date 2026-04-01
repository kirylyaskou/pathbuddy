import { useState } from 'react'
import { Flame, Dices, Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useConditionStore } from '@/entities/condition'
import { useCombatantStore } from '@/entities/combatant'
import type { PendingPersistentDamage } from '@/features/combat-tracker/model/store'

function rollFormula(formula: string): number {
  // Parse dice formulas like "2d6", "1d4+2", "5"
  const match = formula.match(/^(\d+)d(\d+)(?:\s*\+\s*(\d+))?$/)
  if (match) {
    const [, count, faces, bonus] = match
    let total = 0
    for (let i = 0; i < parseInt(count); i++) {
      total += Math.ceil(Math.random() * parseInt(faces))
    }
    return total + (bonus ? parseInt(bonus) : 0)
  }
  const num = parseInt(formula, 10)
  return isNaN(num) ? 0 : num
}

interface PersistentDamageDialogProps {
  pending: PendingPersistentDamage | null
  onClose: () => void
}

export function PersistentDamageDialog({ pending, onClose }: PersistentDamageDialogProps) {
  const [rollMode, setRollMode] = useState<'auto' | 'manual'>('auto')
  const [manualRoll, setManualRoll] = useState('')
  const [results, setResults] = useState<Array<{
    damageType: string
    slug: string
    formula: string
    roll: number
    passed: boolean
    damageDealt?: number
  }>>([])

  if (!pending) return null

  const allResolved = results.length === pending.conditions.length

  const handleRollAll = () => {
    const d20 = rollMode === 'manual'
      ? parseInt(manualRoll, 10)
      : Math.ceil(Math.random() * 20)

    if (isNaN(d20) || d20 < 1 || d20 > 20) return

    const newResults = pending.conditions.map((pc) => {
      const passed = d20 >= 15
      if (passed) {
        useConditionStore.getState().removeCondition(pending.combatantId, pc.slug)
        return { damageType: pc.damageType, slug: pc.slug, formula: pc.formula, roll: d20, passed: true }
      } else {
        const damage = rollFormula(pc.formula)
        useCombatantStore.getState().updateHp(pending.combatantId, -damage)
        return { damageType: pc.damageType, slug: pc.slug, formula: pc.formula, roll: d20, passed: false, damageDealt: damage }
      }
    })
    setResults(newResults)
  }

  const handleClose = () => {
    setResults([])
    setManualRoll('')
    setRollMode('auto')
    onClose()
  }

  return (
    <Dialog open={!!pending} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Persistent Damage — {pending.combatantName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            {pending.conditions.map((pc) => (
              <div key={pc.slug} className="flex items-center justify-between p-2 rounded bg-secondary/30">
                <span className="text-sm capitalize font-medium">{pc.damageType}</span>
                <span className="text-sm font-mono text-orange-400">{pc.formula}</span>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Flat-check DC: <span className="font-mono font-bold text-foreground">15</span>
          </div>

          {!allResolved && (
            <>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant={rollMode === 'auto' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setRollMode('auto')}
                >
                  <Dices className="w-3 h-3" />
                  Auto Roll
                </Button>
                <Button
                  variant={rollMode === 'manual' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setRollMode('manual')}
                >
                  <Keyboard className="w-3 h-3" />
                  Manual d20
                </Button>
              </div>

              {rollMode === 'manual' && (
                <div className="flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    value={manualRoll}
                    onChange={(e) => setManualRoll(e.target.value)}
                    placeholder="1-20"
                    className="h-8 w-20 text-center text-sm"
                    min={1}
                    max={20}
                    onKeyDown={(e) => e.key === 'Enter' && handleRollAll()}
                  />
                </div>
              )}

              <Button className="w-full" onClick={handleRollAll}>
                Roll Flat-Check
              </Button>
            </>
          )}

          {allResolved && (
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.slug} className="p-3 rounded bg-secondary/50 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{r.damageType}</span>
                    <span className="font-mono font-bold">d20 = {r.roll}</span>
                  </div>
                  {r.passed ? (
                    <p className="text-emerald-400 font-medium">
                      Passed! Persistent {r.damageType} removed.
                    </p>
                  ) : (
                    <p className="text-destructive font-medium">
                      Failed — {r.damageDealt} {r.damageType} damage dealt.
                    </p>
                  )}
                </div>
              ))}
              <Button className="w-full" variant="outline" onClick={handleClose}>
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
