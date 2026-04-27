import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Button } from '@/shared/ui/button'
import { applyRole, ROLE_PRESETS } from '@engine'
import type { AppliedRoleValues, RoleId } from '@engine'
import { ApplyRoleConfirmDialog } from './ApplyRoleConfirmDialog'

interface Props {
  level: number
  onApply: (values: AppliedRoleValues) => void
}

const ALL_ROLES = Object.keys(ROLE_PRESETS) as RoleId[]

export function ApplyRoleButton({ level, onApply }: Props) {
  const { t } = useTranslation('common')
  const [pendingRole, setPendingRole] = useState<RoleId | null>(null)

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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {t('customCreatureBuilder.applyRole.buttonLabel')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          {ALL_ROLES.map((r) => (
            <DropdownMenuItem key={r} onClick={() => setPendingRole(r)}>
              {roleLabels[r]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {pendingRole && (
        <ApplyRoleConfirmDialog
          roleId={pendingRole}
          level={level}
          onCancel={() => setPendingRole(null)}
          onConfirm={() => {
            const values = applyRole(pendingRole, level)
            onApply(values)
            setPendingRole(null)
          }}
        />
      )}
    </>
  )
}
