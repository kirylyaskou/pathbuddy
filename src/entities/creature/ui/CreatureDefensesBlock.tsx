import { StatRow } from '@/shared/ui/stat-row'
import type { CreatureStatBlockData } from '../model/types'
import { normalizeImmunities, formatImmunityWithExceptions } from '../model/iwr-normalize'

interface CreatureDefensesBlockProps {
  immunities: CreatureStatBlockData['immunities']
  resistances: CreatureStatBlockData['resistances']
  weaknesses: CreatureStatBlockData['weaknesses']
}

function formatIwrEntry(entry: { type: string; value: number; exceptions?: string[] }) {
  const base = `${entry.type} ${entry.value}`
  return entry.exceptions && entry.exceptions.length > 0
    ? `${base} (except ${entry.exceptions.join(', ')})`
    : base
}

// TODO: replace hardcoded RU labels with getDictLabel('PF2E.Immunities', locale)
// when the dictionary getter API lands. Until then, the section reads RU
// regardless of locale — the locale selector is currently RU-focused.
const IMMUNITIES_LABEL = 'Иммунитеты'
const RESISTANCES_LABEL = 'Сопротивления'
const WEAKNESSES_LABEL = 'Уязвимости'

export function CreatureDefensesBlock({
  immunities,
  resistances,
  weaknesses,
}: CreatureDefensesBlockProps) {
  if (immunities.length === 0 && resistances.length === 0 && weaknesses.length === 0) {
    return null
  }

  return (
    <div className="p-4 space-y-2">
      {immunities.length > 0 && (
        <StatRow label={IMMUNITIES_LABEL}>
          {normalizeImmunities(immunities).map(formatImmunityWithExceptions).join(', ')}
        </StatRow>
      )}
      {resistances.length > 0 && (
        <StatRow label={RESISTANCES_LABEL}>
          {resistances.map(formatIwrEntry).join(', ')}
        </StatRow>
      )}
      {weaknesses.length > 0 && (
        <StatRow label={WEAKNESSES_LABEL}>
          {weaknesses.map(formatIwrEntry).join(', ')}
        </StatRow>
      )}
    </div>
  )
}
