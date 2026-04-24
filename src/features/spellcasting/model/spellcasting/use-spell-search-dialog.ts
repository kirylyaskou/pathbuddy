import { useState } from 'react'
import type { SpellcastingSection } from '@/entities/spell'

type HandleSlotDelta = (
  rank: number,
  change: 1 | -1,
  onIncremented?: (rank: number) => void,
) => Promise<void>

export function useSpellSearchDialog(
  castType: SpellcastingSection['castType'],
  pooledHandleSlotDelta: HandleSlotDelta,
) {
  const [spellDialogOpen, setSpellDialogOpen] = useState(false)
  const [spellDialogRank, setSpellDialogRank] = useState(0)

  async function handleSlotDelta(rank: number, change: 1 | -1) {
    await pooledHandleSlotDelta(rank, change, (r) => {
      if (castType === 'prepared') {
        setSpellDialogRank(r)
        setSpellDialogOpen(true)
      }
    })
  }

  return {
    spellDialogOpen,
    setSpellDialogOpen,
    spellDialogRank,
    setSpellDialogRank,
    handleSlotDelta,
  }
}
