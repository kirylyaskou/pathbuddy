# Phase 45: Combat Integration - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Полная интеграция импортированных PC в combat tracker. DM добавляет PC из Characters page в активный combat encounter; PC отслеживается идентично NPC (initiative, HP/tempHP, conditions, turn advancement). Правая панель (stat block зона) не меняется — sticky NPC поведение сохраняется. PC Sheet остаётся read-only на /characters. Никаких spell slot tracking или item override UI для PC.

</domain>

<decisions>
## Implementation Decisions

### AC — Storage
- **D-01:** Добавить миграцию `0022_encounter_combatant_ac.sql` — `ALTER TABLE encounter_combatants ADD COLUMN ac INTEGER;`. Обновить `saveEncounterCombatants` (INSERT + ac) и `loadEncounterCombatants` (SELECT + map ac). Поле nullable — NPC combatants сохраняют null.
- **D-02:** Добавить `ac?: number` в интерфейс `Combatant` (`src/entities/combatant/model/types.ts`) и `EncounterCombatantRow` (`src/shared/api/encounters.ts`).
- **D-03:** Обновить `handleAddToCombat` в `CharactersPage` — вычислять `ac = build.acTotal.acProfBonus + build.acTotal.acAbilityBonus + build.acTotal.acItemBonus` и включать в создаваемый `Combatant`.

### AC — Display
- **D-04:** AC отображается в `CombatantDetail` — в заголовочной секции под именем, рядом с initiative строкой. Формат: `"Initiative: {N} — PC | AC: {N}"` или отдельная строка `"AC: {N}"`. Показывается только если `combatant.ac !== undefined`. NPC AC остаётся только в stat block панели справа — ничего не меняется.

### AddPCDialog — Удалить
- **D-05:** Удалить `src/features/combat-tracker/ui/AddPCDialog.tsx` полностью. Убрать все импорты и JSX-использования `<AddPCDialog />` из `src/pages/combat/ui/CombatPage.tsx` (два места: lines ~131 и ~396). Убрать экспорт из `src/features/combat-tracker/index.ts`.
- **D-06:** Функцию `createPCCombatant` в `initiative.ts` также удалить — она использовалась только в AddPCDialog и больше нигде не нужна.

### PC Right Panel
- **D-07:** Правая панель в `CombatPage` при выборе PC ничего не обновляет — sticky NPC stat block остаётся. Это уже реализовано (гард `if (!combatant?.isNPC || !combatant.creatureRef) return`) — никаких изменений в CombatPage stat block логике не нужно.

### Claude's Discretion
- Точный визуальный формат AC в CombatantDetail (inline в одну строку с initiative или отдельная строка)
- Порядок полей в EncounterCombatantRow INSERT (добавить ac в конец)
- Обновить `encounter-persistence.ts` loadEncounterState: при восстановлении PC combatant проставить `ac: c.ac ?? undefined`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Types & Store
- `src/entities/combatant/model/types.ts` — Combatant interface (добавить `ac?: number`)
- `src/shared/api/encounters.ts` — EncounterCombatantRow interface + saveEncounterCombatants + loadEncounterCombatants (добавить ac)

### Migrations
- `src/shared/db/migrations/0021_characters.sql` — пример последней миграции (формат файла)
- `src/shared/db/migrate.ts` — import.meta.glob система миграций

### Characters → Combat integration
- `src/pages/characters/ui/CharactersPage.tsx` — handleAddToCombat (обновить, добавить ac)
- `engine/pc/types.ts` — PathbuilderBuild.acTotal: { acProfBonus, acAbilityBonus, acItemBonus }

### Combat UI
- `src/widgets/combatant-detail/ui/CombatantDetail.tsx` — добавить AC в header секцию
- `src/features/combat-tracker/ui/AddPCDialog.tsx` — удалить файл
- `src/features/combat-tracker/lib/initiative.ts` — удалить createPCCombatant
- `src/features/combat-tracker/index.ts` — убрать экспорт AddPCDialog и createPCCombatant
- `src/pages/combat/ui/CombatPage.tsx` — убрать <AddPCDialog /> (два места)

### Encounter restore
- `src/features/combat-tracker/lib/encounter-persistence.ts` — loadEncounterState, построение Combatant[] из snapshot (добавить ac: c.ac ?? undefined)

### Requirements
- `.planning/REQUIREMENTS.md` §"Combat Integration (CMB)" — CMB-01, CMB-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useCombatantStore.addCombatant` — без изменений; просто передавать combatant с полем ac
- `CombatantDetail` header pattern — уже показывает `initiative` и `isNPC ? ' — NPC' : ' — PC'`; добавить AC рядом
- `Separator` из shadcn — уже используется в CombatantDetail для разделения секций

### Established Patterns
- `ac = build.acTotal.acProfBonus + build.acTotal.acAbilityBonus + build.acTotal.acItemBonus` — та же формула, что в Phase 44 D-09
- SQLite ALTER TABLE ADD COLUMN — non-destructive, nullable column safe approach (паттерн из Phase 12)
- `EncounterCombatantRow` INSERT SQL: positional params array в порядке полей — добавить `c.ac ?? null` в конец

### Integration Points
- `src/pages/characters/ui/CharactersPage.tsx:handleAddToCombat` — единственное место создания PC Combatant из Pathbuilder data
- `src/pages/combat/ui/CombatPage.tsx` — два места рендеринга `<AddPCDialog />` для удаления (~line 131 и ~line 396)
- `src/features/combat-tracker/lib/encounter-persistence.ts:loadEncounterState` — построение Combatant из snapshot.combatants, добавить `...(c.ac != null ? { ac: c.ac } : {})` spread

</code_context>

<specifics>
## Specific Ideas

- AC в CombatantDetail: можно добавить в строку после `Initiative: N — PC`, например `Initiative: 14 — PC · AC 19`
- Sticky NPC в правой панели при выборе PC — уже работает из коробки, не трогать

</specifics>

<deferred>
## Deferred Ideas

- PC info card в правой панели (saves, skills из Pathbuilder) — решено не делать в Phase 45; PC Sheet на /characters — достаточно
- Class info badge в InitiativeRow — не в требованиях Phase 45, можно добавить в Phase 999.2 (visual improvement backlog)
- AddPCDialog-like fallback для PC без Pathbuilder — out of scope; DM tool с импортом обязателен

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 45-combat-integration*
*Context gathered: 2026-04-07*
