import { useState, useCallback } from 'react'
import { Plus, Minus, Shield, Heart } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { useCombatantStore } from '@/entities/combatant'
import type { Combatant } from '@/entities/combatant'

interface HpControlsProps {
  combatant: Combatant
}

export function HpControls({ combatant }: HpControlsProps) {
  const [damageInput, setDamageInput] = useState('')
  const [healInput, setHealInput] = useState('')
  const [tempHpInput, setTempHpInput] = useState('')
  const { updateHp, updateTempHp } = useCombatantStore()

  const handleDamage = useCallback(() => {
    const amount = parseInt(damageInput, 10)
    if (isNaN(amount) || amount <= 0) return

    let remaining = amount
    if (combatant.tempHp > 0) {
      const absorbed = Math.min(combatant.tempHp, remaining)
      updateTempHp(combatant.id, combatant.tempHp - absorbed)
      remaining -= absorbed
    }
    if (remaining > 0) {
      updateHp(combatant.id, -remaining)
    }
    setDamageInput('')
  }, [damageInput, combatant, updateHp, updateTempHp])

  const handleHeal = useCallback(() => {
    const amount = parseInt(healInput, 10)
    if (isNaN(amount) || amount <= 0) return
    updateHp(combatant.id, amount)
    setHealInput('')
  }, [healInput, combatant.id, updateHp])

  const handleSetTempHp = useCallback(() => {
    const amount = parseInt(tempHpInput, 10)
    if (isNaN(amount) || amount < 0) return
    updateTempHp(combatant.id, Math.max(combatant.tempHp, amount))
    setTempHpInput('')
  }, [tempHpInput, combatant, updateTempHp])

  const hpPercent = combatant.maxHp > 0 ? (combatant.hp / combatant.maxHp) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-destructive" />
          <span className="text-lg font-mono font-bold">
            {combatant.hp}
            <span className="text-muted-foreground font-normal"> / {combatant.maxHp}</span>
          </span>
          {combatant.tempHp > 0 && (
            <span className="text-sm font-mono text-blue-400 flex items-center gap-0.5">
              <Shield className="w-3 h-3" />
              +{combatant.tempHp}
            </span>
          )}
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              hpPercent > 50 ? 'bg-emerald-500' :
              hpPercent > 25 ? 'bg-amber-500' : 'bg-destructive'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Damage</label>
          <div className="flex gap-1">
            <Input
              type="number"
              value={damageInput}
              onChange={(e) => setDamageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDamage()}
              placeholder="0"
              className="h-7 text-xs"
              min={0}
            />
            <Button
              size="icon"
              variant="destructive"
              className="h-7 w-7 shrink-0"
              onClick={handleDamage}
              disabled={!damageInput}
            >
              <Minus className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Heal</label>
          <div className="flex gap-1">
            <Input
              type="number"
              value={healInput}
              onChange={(e) => setHealInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleHeal()}
              placeholder="0"
              className="h-7 text-xs"
              min={0}
            />
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 shrink-0 bg-emerald-900/50 hover:bg-emerald-900/70 text-emerald-300"
              onClick={handleHeal}
              disabled={!healInput}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Temp HP</label>
          <div className="flex gap-1">
            <Input
              type="number"
              value={tempHpInput}
              onChange={(e) => setTempHpInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetTempHp()}
              placeholder="0"
              className="h-7 text-xs"
              min={0}
            />
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 shrink-0 bg-blue-900/50 hover:bg-blue-900/70 text-blue-300"
              onClick={handleSetTempHp}
              disabled={!tempHpInput}
            >
              <Shield className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
