// TODO: stub from stash recovery — original implementation never landed in master.
// Replace with the real HazardSearchPanel when the hazard search feature ships.
import { useTranslation } from 'react-i18next'

export function HazardSearchPanel() {
  const { t } = useTranslation('common')
  return (
    <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
      {t('bestiarySearch.hazardsNotImplemented')}
    </div>
  )
}
