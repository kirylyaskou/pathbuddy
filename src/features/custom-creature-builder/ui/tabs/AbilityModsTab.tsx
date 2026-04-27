import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { BuilderTabsProps } from '../BuilderTabs'
import { BenchmarkHint } from '../BenchmarkHint'

type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export function AbilityModsTab({ state, dispatch }: BuilderTabsProps) {
  const { t } = useTranslation('common')
  const { form } = state

  const abilities = useMemo<{ key: AbilityKey; label: string }[]>(
    () => [
      { key: 'str', label: t('customCreatureBuilder.abilityModsTab.strength') },
      { key: 'dex', label: t('customCreatureBuilder.abilityModsTab.dexterity') },
      { key: 'con', label: t('customCreatureBuilder.abilityModsTab.constitution') },
      { key: 'int', label: t('customCreatureBuilder.abilityModsTab.intelligence') },
      { key: 'wis', label: t('customCreatureBuilder.abilityModsTab.wisdom') },
      { key: 'cha', label: t('customCreatureBuilder.abilityModsTab.charisma') },
    ],
    [t],
  )

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-base font-semibold">{t('customCreatureBuilder.abilityModsTab.heading')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {abilities.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`abm-${key}`}>{label}</Label>
              <BenchmarkHint
                stat="abilityMod"
                level={form.level}
                value={form.abilityMods[key]}
                onSelectTier={(v) => dispatch({ type: 'SET_ABILITY_MOD', key, value: v })}
              />
            </div>
            <Input
              id={`abm-${key}`}
              type="number"
              className="font-mono"
              value={form.abilityMods[key]}
              onChange={(e) =>
                dispatch({ type: 'SET_ABILITY_MOD', key, value: Number(e.target.value) })
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}
