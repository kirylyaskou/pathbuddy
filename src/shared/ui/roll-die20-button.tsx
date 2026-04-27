import { Dices } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { useRoll } from '@/shared/hooks'

export function RollDie20Button() {
  const { t } = useTranslation('common')
  const roll = useRoll()

  function handleClick() {
    roll('1d20')
  }

  return (
    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleClick}>
      <Dices className="h-4 w-4" />
      <span className="sr-only">{t('shared.roll.rollD20')}</span>
    </Button>
  )
}
