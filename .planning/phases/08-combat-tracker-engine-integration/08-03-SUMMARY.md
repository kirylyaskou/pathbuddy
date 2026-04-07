---
phase: 08-combat-tracker-engine-integration
plan: 03
status: complete
started: 2026-04-01
completed: 2026-04-01
tasks_completed: 5
tasks_total: 5
---

## Summary

Combatant detail center panel with HP controls (tempHP-first damage absorption), searchable condition combobox grouped by CONDITION_GROUPS with value stepper, and ConditionBadge with category colors, lock toggle, and chain icon.

## Key Files

### Created
- `src/entities/condition/ui/ConditionBadge.tsx` — Category-colored pill with lock toggle and chain icon
- `src/features/combat-tracker/ui/ConditionCombobox.tsx` — Searchable cmdk combobox with grouped sections and value stepper
- `src/widgets/combatant-detail/ui/HpControls.tsx` — Damage/Heal/TempHP controls with tempHP-first absorption
- `src/widgets/combatant-detail/ui/ConditionSection.tsx` — Condition list with add/remove/lock via bridge
- `src/widgets/combatant-detail/ui/CombatantDetail.tsx` — Center panel assembling header + HP + conditions
- `src/widgets/combatant-detail/index.ts` — Barrel export

### Modified
- `src/entities/condition/index.ts` — Added ConditionBadge export
- `src/pages/combat/ui/CombatPage.tsx` — Center panel renders CombatantDetail

## Commit
`a87fbf1 feat(08-03): add combatant detail panel, HP controls, condition combobox, condition badges`

## Self-Check: PASSED
