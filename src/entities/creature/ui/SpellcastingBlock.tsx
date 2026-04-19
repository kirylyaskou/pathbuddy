import { useState } from 'react'
import { useRoll } from '@/shared/hooks'
import { formatModifier, formatRollFormula } from '@/shared/lib/format'
import { ModifierTooltip } from '@/shared/ui/ModifierTooltip'
import { cn } from '@/shared/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible'
import { ChevronDown, HelpCircle, Pencil, Check } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/ui/tooltip'
import type { SpellcastingSection } from '@/entities/spell'
import { traditionColor } from '../lib/spellcasting-helpers'
import { useSpellcasting } from '../model/use-spellcasting'
import { SpellSearchDialog } from './SpellSearchDialog'
import { SpellcastingEditor } from '@/features/spellcasting-editor'

interface EncounterContext {
  encounterId: string
  combatantId: string
  onInventoryChanged?: () => void
}

export function SpellcastingBlock({ section, creatureLevel, encounterContext, creatureName }: {
  section: SpellcastingSection
  creatureLevel: number
  encounterContext?: EncounterContext
  creatureName?: string
}) {
  const handleSpellRoll = useRoll(creatureName, encounterContext?.encounterId)
  const {
    usedSlots, slotDeltas,
    spellDialogOpen, setSpellDialogOpen, spellDialogRank, setSpellDialogRank,
    selectedSlotLevel, setSelectedSlotLevel,
    spellMod, modifiedSpellAttack, modifiedSpellDc, spellModColor,
    progression, recommendedMaxRank,
    handleTogglePip, handleSlotDelta, handleAddRank, handleAddSpell, handleRemoveSpell,
    removedSpells, addedByRank, isFocus, traditionFilter,
    rankWarning, minAvailableRank, filteredRanks,
    preparedCasts, handleCastPreparedSpell, handleCastSpontaneousSpell,
  } = useSpellcasting(section, creatureLevel, encounterContext)
  const { encounterId } = encounterContext ?? {}

  // 62-02: mode toggle — view default, edit unlocks +/-, add/remove spell, pip click.
  // Mode is per-component; not persisted. Only relevant when combat-backed.
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const isEdit = mode === 'edit' && !!encounterId
  const editorMode: 'view' | 'edit' = isEdit ? 'edit' : 'view'

  const dcCol = spellMod.netModifier < 0 ? 'text-pf-blood' : spellMod.netModifier > 0 ? 'text-pf-threat-low' : 'text-primary'

  return (
    <Collapsible defaultOpen>
      <div className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-primary/10 to-transparent border-l-2 border-primary/40">
        <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="font-semibold text-sm text-foreground">Spellcasting</span>
          <span className={cn("px-1.5 py-0.5 text-[10px] rounded border uppercase tracking-wider font-semibold", traditionColor(section.tradition))}>
            {section.tradition} {section.castType}
          </span>
          <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <div className="flex items-center gap-1">
          {encounterId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setMode((m) => (m === 'view' ? 'edit' : 'view'))}
                  className={cn(
                    'p-1 rounded transition-colors',
                    isEdit
                      ? 'text-primary bg-primary/10 hover:bg-primary/20'
                      : 'text-muted-foreground hover:text-primary hover:bg-accent/30'
                  )}
                  aria-label={isEdit ? 'Exit edit mode' : 'Edit spellcasting'}
                >
                  {isEdit ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {isEdit ? 'Done — exit edit mode' : 'Edit slots and spell list'}
              </TooltipContent>
            </Tooltip>
          )}
          {encounterId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-0.5" type="button">
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {progression === 'unknown'
                  ? `Custom progression — max rank ${recommendedMaxRank} at level ${creatureLevel}`
                  : `${progression === 'full' ? 'Full' : 'Bounded'} caster (${section.tradition} ${section.castType}) — max rank ${recommendedMaxRank} at level ${creatureLevel}`
                }
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <CollapsibleContent>
        <div className="px-4 pb-3 pt-2 space-y-3">
          {/* DC + Attack */}
          <div className="flex gap-4 text-sm">
            {section.spellDc > 0 && (
              <span className="text-muted-foreground">DC{' '}
                <ModifierTooltip modifiers={spellMod.modifiers} netModifier={spellMod.netModifier} finalDisplay={String(modifiedSpellDc)}>
                  <span className={cn('font-mono font-bold', dcCol)}>{modifiedSpellDc}</span>
                </ModifierTooltip>
              </span>
            )}
            {section.spellAttack !== 0 && (
              <span className="text-muted-foreground">Attack{' '}
                <ModifierTooltip modifiers={spellMod.modifiers} netModifier={spellMod.netModifier} finalDisplay={formatModifier(modifiedSpellAttack)}>
                  <button
                    onClick={() => handleSpellRoll(formatRollFormula(modifiedSpellAttack), `${section.tradition} spell attack`)}
                    title={`Roll spell attack ${formatRollFormula(modifiedSpellAttack)}`}
                    className={cn(
                      'font-mono font-bold cursor-pointer underline decoration-dotted underline-offset-2 hover:text-pf-gold transition-colors duration-100',
                      spellModColor || 'text-primary decoration-primary/50',
                    )}
                  >
                    {formatModifier(modifiedSpellAttack)}
                  </button>
                </ModifierTooltip>
              </span>
            )}
          </div>
          {/* Shared editor body — rank pills + per-rank slot pips + spell cards. */}
          <SpellcastingEditor
            entry={section}
            creatureLevel={creatureLevel}
            mode={editorMode}
            usedSlots={usedSlots}
            slotDeltas={slotDeltas}
            preparedCasts={preparedCasts}
            removedSpells={removedSpells}
            addedByRank={addedByRank}
            onTogglePip={encounterId ? handleTogglePip : undefined}
            onSlotDelta={encounterId ? handleSlotDelta : undefined}
            onAddRank={encounterId ? handleAddRank : undefined}
            onRemoveSpell={encounterId ? handleRemoveSpell : undefined}
            onCastPrepared={encounterId ? handleCastPreparedSpell : undefined}
            onCastSpontaneous={encounterId ? handleCastSpontaneousSpell : undefined}
            onOpenSpellSearch={encounterId ? (rank) => { setSpellDialogRank(rank); setSpellDialogOpen(true) } : undefined}
            selectedSlotLevel={selectedSlotLevel}
            onSelectSlotLevel={setSelectedSlotLevel}
            minAvailableRank={minAvailableRank}
            filteredRanks={filteredRanks}
            rankWarning={encounterId ? rankWarning : undefined}
            sourceName={creatureName}
            combatId={encounterContext?.encounterId}
          />
        </div>
      </CollapsibleContent>

      {/* Spell search dialog */}
      {encounterId && (
        <SpellSearchDialog
          open={spellDialogOpen}
          onOpenChange={setSpellDialogOpen}
          defaultRank={spellDialogRank}
          defaultTradition={traditionFilter}
          focusOnly={isFocus}
          onAdd={(name, rank) => handleAddSpell(name, rank)}
        />
      )}
    </Collapsible>
  )
}
