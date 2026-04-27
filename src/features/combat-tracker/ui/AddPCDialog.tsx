import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { useCombatantStore } from '@/entities/combatant'
import { createPCCombatant } from '../lib/initiative'

export function AddPCDialog() {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [initiative, setInitiative] = useState('')
  const [maxHp, setMaxHp] = useState('')
  const addCombatant = useCombatantStore((s) => s.addCombatant)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !initiative || !maxHp) return
    const combatant = createPCCombatant(
      name.trim(),
      parseInt(initiative, 10),
      parseInt(maxHp, 10)
    )
    addCombatant(combatant)
    setName('')
    setInitiative('')
    setMaxHp('')
    setOpen(false)
  }

  return (
    <Dialog modal={false} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <UserPlus className="w-3.5 h-3.5" />
          {t('combatTracker.addPc.trigger')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('combatTracker.addPc.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="pc-name">{t('combatTracker.addPc.name')}</Label>
            <Input
              id="pc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('combatTracker.addPc.namePlaceholder')}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pc-initiative">{t('combatTracker.addPc.initiative')}</Label>
              <Input
                id="pc-initiative"
                type="number"
                value={initiative}
                onChange={(e) => setInitiative(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="pc-hp">{t('combatTracker.addPc.maxHp')}</Label>
              <Input
                id="pc-hp"
                type="number"
                value={maxHp}
                onChange={(e) => setMaxHp(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={!name.trim() || !initiative || !maxHp}>
            {t('combatTracker.addPc.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
