import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { SpellRow } from './sections/SpellRow'
import { RankHeader } from './sections/RankHeader'
import type { SpellcastingSection } from '@/entities/spell'

interface SpellRankBlockProps {
  rank: number
  byRank: SpellcastingSection['spellsByRank'][number] | undefined
  slotDelta: number
  used: number
  warn: string | null
  addedSpells: string[]
  removedSpells: Set<string>
  preparedCasts: Set<string>
  mode: 'view' | 'edit'
  castType: SpellcastingSection['castType']
  tradition: SpellcastingSection['tradition']
  sourceName?: string
  combatId?: string
  onTogglePip?: (rank: number, idx: number, total: number) => void
  onSlotDelta?: (rank: number, delta: 1 | -1) => void
  onRemoveSpell?: (name: string, rank: number, isDefault: boolean) => void
  onCastPrepared?: (name: string, foundryId: string | null, rank: number, slotKey: string, total: number) => void
  onCastSpontaneous?: (name: string, foundryId: string | null, rank: number, total: number) => void
  onOpenSpellSearch?: (rank: number) => void
}

interface SlotInstance {
  kind: 'default' | 'added'
  name: string
  foundryId: string | null
  slotKey: string
}

export function SpellRankBlock(props: SpellRankBlockProps) {
  const {
    rank, byRank, slotDelta, used, warn, addedSpells, removedSpells, preparedCasts,
    mode, castType, tradition, sourceName, combatId,
    onTogglePip, onSlotDelta, onRemoveSpell,
    onCastPrepared, onCastSpontaneous, onOpenSpellSearch,
  } = props

  const isEdit = mode === 'edit'
  const isPrepared = castType === 'prepared'
  const isSpontaneous = castType === 'spontaneous'
  const baseSlots = byRank?.slots ?? 0
  const totalSlots = Math.max(0, baseSlots + slotDelta)
  const canSpontCast = isSpontaneous && used < totalSlots
  const showCast = !isEdit && rank > 0 && (!!onCastPrepared || !!onCastSpontaneous)

  const { defaultSlots, addedSlots } = useMemo(() => {
    const visible = byRank
      ? byRank.spells.filter((s) => !removedSpells.has(`${rank}:${s.name}`))
      : []
    const occ = new Map<string, number>()
    const take = (name: string) => {
      const seen = occ.get(name) ?? 0
      occ.set(name, seen + 1)
      return `${name}#${seen}`
    }
    const def: SlotInstance[] = visible.map((s) => ({
      kind: 'default',
      name: s.name,
      foundryId: s.foundryId,
      slotKey: take(s.name),
    }))
    const add: SlotInstance[] = addedSpells.map((name) => ({
      kind: 'added',
      name,
      foundryId: null,
      slotKey: take(name),
    }))
    return { defaultSlots: def, addedSlots: add }
  }, [byRank, removedSpells, rank, addedSpells])

  function castHandler(slot: SlotInstance): (() => void) | undefined {
    if (isPrepared) {
      return onCastPrepared
        ? () => onCastPrepared(slot.name, slot.foundryId, rank, slot.slotKey, totalSlots)
        : undefined
    }
    if (isSpontaneous) {
      return onCastSpontaneous
        ? () => onCastSpontaneous(slot.name, slot.foundryId, rank, totalSlots)
        : undefined
    }
    return undefined
  }

  return (
    <div>
      <RankHeader
        rank={rank}
        warn={warn}
        totalSlots={totalSlots}
        baseSlots={baseSlots}
        used={used}
        tradition={tradition}
        isEdit={isEdit}
        showPips={rank !== 0}
        onTogglePip={onTogglePip}
        onSlotDelta={onSlotDelta}
      />

      <div className="space-y-1">
        {defaultSlots.map((slot, i) => {
          const cast = isPrepared && preparedCasts.has(`${rank}:${slot.slotKey}`)
          const canCast = isPrepared || canSpontCast
          return (
            <SpellRow
              key={`def-${i}`}
              name={slot.name}
              foundryId={slot.foundryId}
              rank={rank}
              cast={cast}
              isEdit={isEdit}
              showCast={showCast}
              canCast={canCast}
              onCast={castHandler(slot)}
              onRemove={onRemoveSpell ? () => onRemoveSpell(slot.name, rank, true) : undefined}
              sourceName={sourceName}
              combatId={combatId}
              showCastTooltip
              removeTitle="Remove"
            />
          )
        })}

        {addedSlots.map((slot, i) => {
          const cast = isPrepared && preparedCasts.has(`${rank}:${slot.slotKey}`)
          const canCast = isPrepared || canSpontCast
          return (
            <SpellRow
              key={`add-${i}`}
              name={slot.name}
              foundryId={slot.foundryId}
              rank={rank}
              cast={cast}
              isEdit={isEdit}
              showCast={showCast}
              canCast={canCast}
              onCast={castHandler(slot)}
              onRemove={onRemoveSpell ? () => onRemoveSpell(slot.name, rank, false) : undefined}
              sourceName={sourceName}
              combatId={combatId}
              showCastTooltip={false}
              removeTitle="Remove added spell"
            />
          )
        })}

        {isEdit && onOpenSpellSearch && (
          <button
            type="button"
            onClick={() => onOpenSpellSearch(rank)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add spell…</span>
          </button>
        )}
      </div>
    </div>
  )
}
