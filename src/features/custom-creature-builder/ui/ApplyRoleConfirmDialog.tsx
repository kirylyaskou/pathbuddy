import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { applyRole, ROLE_PRESETS } from '@engine'
import type { RoleId } from '@engine'

interface Props {
  roleId: RoleId
  level: number
  onCancel: () => void
  onConfirm: () => void
}

type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export function ApplyRoleConfirmDialog({ roleId, level, onCancel, onConfirm }: Props) {
  const { t } = useTranslation('common')

  const roleLabels = useMemo<Record<RoleId, string>>(
    () => ({
      brute: t('customCreatureBuilder.applyRole.roleLabels.brute'),
      soldier: t('customCreatureBuilder.applyRole.roleLabels.soldier'),
      skirmisher: t('customCreatureBuilder.applyRole.roleLabels.skirmisher'),
      sniper: t('customCreatureBuilder.applyRole.roleLabels.sniper'),
      spellcaster: t('customCreatureBuilder.applyRole.roleLabels.spellcaster'),
      skillParagon: t('customCreatureBuilder.applyRole.roleLabels.skillParagon'),
      magicalStriker: t('customCreatureBuilder.applyRole.roleLabels.magicalStriker'),
    }),
    [t],
  )

  const preset = ROLE_PRESETS[roleId]
  const values = applyRole(roleId, level)

  // Build a list of field→(tier, value) rows reflecting ONLY the keys the preset defines.
  const rows = useMemo(() => {
    const result: { label: string; tier: string; value: string }[] = []

    const addRow = (
      label: string,
      tier: string | undefined,
      value: string | number | undefined,
    ) => {
      if (tier !== undefined && value !== undefined) {
        result.push({ label, tier, value: String(value) })
      }
    }

    addRow(t('customCreatureBuilder.applyRole.perception'), preset.perception, values.perception)
    addRow(t('customCreatureBuilder.applyRole.ac'), preset.ac, values.ac)
    addRow(t('customCreatureBuilder.applyRole.hp'), preset.hp, values.hp)
    addRow(t('customCreatureBuilder.applyRole.fort'), preset.saves?.fort, values.fort)
    addRow(t('customCreatureBuilder.applyRole.ref'), preset.saves?.ref, values.ref)
    addRow(t('customCreatureBuilder.applyRole.will'), preset.saves?.will, values.will)
    addRow(t('customCreatureBuilder.applyRole.strikeAttack'), preset.strikeAttackBonus, values.strikeAttackBonus)
    addRow(t('customCreatureBuilder.applyRole.strikeDamage'), preset.strikeDamage, values.strikeDamage?.formula)
    addRow(t('customCreatureBuilder.applyRole.spellDc'), preset.spellDC, values.spellDC)
    addRow(t('customCreatureBuilder.applyRole.spellAttack'), preset.spellAttack, values.spellAttack)
    addRow(t('customCreatureBuilder.applyRole.skillLabel'), preset.skill, values.skill)

    return result
  }, [t, preset, values])

  const abilityRows = useMemo(() => {
    const result: { label: string; tier: string; value: number }[] = []
    if (preset.abilities) {
      const abilityEntries = Object.entries(preset.abilities) as Array<[AbilityKey, string]>
      for (const [k, tier] of abilityEntries) {
        const v = values.abilityMods[k]
        if (v !== undefined) {
          result.push({
            label: t('customCreatureBuilder.applyRole.abilityModLabel', { ability: k.toUpperCase() }),
            tier,
            value: v,
          })
        }
      }
    }
    return result
  }, [t, preset, values])

  return (
    <AlertDialog
      open
      onOpenChange={(o) => {
        if (!o) onCancel()
      }}
    >
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('customCreatureBuilder.applyRole.dialogTitle', { role: roleLabels[roleId] })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('customCreatureBuilder.applyRole.dialogDesc', { level })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[50vh] overflow-y-auto space-y-1 pr-2">
          {abilityRows.length > 0 && (
            <div className="pt-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                {t('customCreatureBuilder.applyRole.abilityMods')}
              </div>
              {abilityRows.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between text-sm py-0.5"
                >
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-mono">
                    {r.tier} = {r.value >= 0 ? `+${r.value}` : r.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          {rows.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                {t('customCreatureBuilder.applyRole.stats')}
              </div>
              {rows.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between text-sm py-0.5"
                >
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-mono">
                    {r.tier} = {r.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          {abilityRows.length === 0 && rows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t('customCreatureBuilder.applyRole.noOverrides')}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t('customCreatureBuilder.applyRole.apply')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
