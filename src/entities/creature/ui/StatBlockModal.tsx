import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import { LevelBadge } from '@/shared/ui/level-badge'
import { SafeHtml } from '@/shared/lib/safe-html'
import { useContentTranslation } from '@/shared/i18n'
import { CreatureStatBlock } from './CreatureStatBlock'
import { fetchCreatureStatBlockData } from '../model/fetchStatBlock'
import type { CreatureStatBlockData } from '../model/types'

interface StatBlockModalProps {
  creatureId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StatBlockModal({ creatureId, open, onOpenChange }: StatBlockModalProps) {
  const [data, setData] = useState<CreatureStatBlockData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !creatureId) { setData(null); return }
    setLoading(true)
    fetchCreatureStatBlockData(creatureId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [open, creatureId])

  // Phase 79: content translation lookup. When RU locale is active and a
  // translation exists for this creature, we render the pf2.ru-sourced
  // Russian stat block inside <SafeHtml/> instead of the structured EN one.
  const { data: translation } = useContentTranslation(
    'monster',
    data?.name,
    data?.level ?? null,
  )
  const showTranslation = translation !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl w-[90vw] max-h-[90vh] overflow-y-auto p-0">
        {/* BUG-04 (52-08): Radix Dialog requires a DialogTitle for a11y; a
            missing title surfaces as a console error in dev and can break
            focus trap timing. Visually hidden since the stat block has its
            own heading. */}
        <DialogTitle className="sr-only">
          {translation?.nameLoc ?? data?.name ?? 'Creature stat block'}
        </DialogTitle>
        {loading && (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        )}
        {!loading && data && showTranslation && translation && (
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <LevelBadge level={data.level} />
              <div>
                <h2 className="text-xl font-semibold">{translation.nameLoc}</h2>
                {translation.traitsLoc && (
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                    {translation.traitsLoc}
                  </p>
                )}
              </div>
            </div>
            <SafeHtml html={translation.textLoc} className="text-sm" />
          </div>
        )}
        {!loading && data && !showTranslation && <CreatureStatBlock creature={data} />}
        {!loading && !data && open && (
          <div className="p-8 text-center text-sm text-muted-foreground">No stat block available.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
