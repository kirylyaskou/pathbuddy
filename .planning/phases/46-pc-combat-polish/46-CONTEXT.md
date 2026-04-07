# Phase 46: PC Combat Polish - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Полировка боевого трекера для PC: три тогла в левой панели (Bestiary / Hazards / Characters), PC-карточка в правой панели при выборе PC, inline-редактирование инициативы для всех (NPC и PC), creature type filter в поисковых панелях bestiary и encounters, кнопка Roll Initiative для хазардов. Spell slot tracking и item overrides для PC вне scope.

</domain>

<decisions>
## Implementation Decisions

### Left panel: 3-toggle structure
- **D-01:** Три кнопки-тогла сверху левой панели: `[Bestiary | Hazards | Characters]`. Тот же визуальный паттерн что Tier chips в BestiarySearchPanel (маленькие button с highlight активного).
- **D-02:** Characters tab — compact rows: ⊕ имя + (Класс уровень) в одну строку. Клик добавляет PC в encounter.
- **D-03:** При клике на PC в Characters tab: если открыт один encounter tab — добавить сразу в активный; если >1 tabs открыто — показать dropdown picker с именами encounter tabs.
- **D-04:** Hazards tab — HazardSearchPanel с поиском + drag-and-drop (аналогично BestiarySearchPanel). При drag-добавлении хазарда в combat: `isHazard: true`, `initiativeBonus: hazard.stealth_dc ?? hazard.stealth_details` (использовать числовой stealth_dc из HazardRow).

### SC2: Characters page "Add to Combat" picker
- **D-05:** На `/characters` страница: кнопка "Add to Combat" при >1 открытых encounter tabs — показывать dropdown Select с именами tabs. При единственном или нулевом tabs — поведение без изменений (addCombatant в глобальный store).
- **D-06:** Для получения списка открытых tabs использовать `useEncounterTabsStore.getState().openTabs` из CharactersPage. При выборе конкретного tab — `useEncounterTabsStore.getState().addCombatantToTab(tabId, combatant)`.

### SC4: PC stat card в правой панели
- **D-07:** Правая панель CombatPage переключается по типу выбранного combatant:
  - NPC: показывает NPC stat block (как сейчас, sticky при выборе NPC)
  - PC: показывает `PCCombatCard` (новый compact компонент)
  - Hazard: ничего не меняется (sticky последний stat block)
  - Sticky NPC при выборе PC из Phase 45 D-07 — **отменён**.
- **D-08:** `PCCombatCard` — новый compact read-only компонент (`src/entities/character/ui/PCCombatCard.tsx`). Секции без вкладок:
  1. Заголовок: имя, класс + уровень
  2. HP (из combatant.hp/maxHp текущий/макс) + AC (из combatant.ac)
  3. 6 ability scores: STR/DEX/CON/INT/WIS/CHA — только модификаторы `floor((score-10)/2)`
  4. Saves: Fort / Ref / Will — total modifier
  5. Skills: список с rank badge (U/T/E/M/L) и total modifier
- **D-09:** Данные для PCCombatCard: `CombatPage` хранит `pcBuildCache = useRef<Map<characterId, PathbuilderBuild>>()`. При выборе PC combatant — проверить кэш по `combatant.creatureRef`, если нет — `getCharacter(id)` → парсить rawJson → сохранить в кэш. Тот же паттерн что `statBlockCache` для NPC.

### SC3: Inline initiative editing
- **D-10:** И NPC, и PC (и хазарды) — inline edit initiative в `InitiativeRow`: клик на цифру initiative → заменяется на `input[type=number]` шириной ~40px, значение pre-filled. Enter / blur — сохранить через `setInitiative(id, value)` + `reorderInitiative(sortedByInitiativeDesc)`.
- **D-11:** `useCombatantStore.setInitiative` уже существует. После изменения вызывать reorder: отсортировать combatants по initiative по убыванию → `reorderInitiative(orderedIds)`.

### SC5: Creature type filter в поисковых панелях
- **D-12:** Добавить `creatureType` filter (Select dropdown, "All types" по умолчанию) в `BestiarySearchPanel` (левая панель combat) и `EncounterCreatureSearchPanel` (страница Encounters). 20 типов из `CREATURE_TYPES` в BestiaryFilterBar.
- **D-13:** Переключить эти два компонента с `searchCreatures` / `fetchCreatures` на `searchCreaturesFiltered` из `src/shared/api/creatures.ts`. Creature type передаётся как `traits: [selectedType]` (в PF2e creature types хранятся как traits в `entities.traits`). При "All types" — `traits: undefined`.
- **D-14:** UI: маленький `Select` (shadcn) после search input. Label "All types" → выпадает список 20 типов. Тот же паттерн что rarity Select в BestiaryFilterBar.

### SC6: Hazard initiative roll
- **D-15:** Добавить в `Combatant` два поля: `isHazard?: boolean`, `initiativeBonus?: number`.
- **D-16:** В `InitiativeRow`: если `combatant.isHazard === true` — показывать маленькую кнопку (Dice20/Dices icon) рядом с цифрой initiative (между X и цифрой). Клик: `Math.floor(Math.random() * 20) + 1 + (combatant.initiativeBonus ?? 0)` → `setInitiative(id, result)` + `reorderInitiative` + toast с результатом.
- **D-17:** Встроить в существующий `rollDice` из `engine/dice/dice.ts` если там есть нужный API, иначе inline.

### Claude's Discretion
- Точный layout PCCombatCard (padding, разделители между секциями)
- Анимация/стиль input при inline initiative edit (border highlight, focus outline)
- Порядок табов в левой панели (Bestiary | Hazards | Characters) или другой
- Toast format для hazard initiative roll ("Pit Trap rolled initiative: 14 (d20=11 + 3)")

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Combat page & left panel
- `src/pages/combat/ui/CombatPage.tsx` — основной файл; левая панель (BestiarySearchPanel), правая панель (lastNpcStatBlock), handleSelect логика, pcBuildCache добавить
- `src/widgets/bestiary-search/ui/BestiarySearchPanel.tsx` — добавить creature type Select; переключить на searchCreaturesFiltered

### Initiative list
- `src/widgets/initiative-list/ui/InitiativeRow.tsx` — добавить inline initiative edit + hazard roll button
- `src/widgets/initiative-list/ui/InitiativeList.tsx` — без изменений (передаёт combatant дальше)

### Combatant type
- `src/entities/combatant/model/types.ts` — добавить `isHazard?: boolean`, `initiativeBonus?: number`
- `src/entities/combatant/model/store.ts` — `setInitiative` + `reorderInitiative` уже есть, использовать

### PC stat card
- `src/features/characters/ui/PCSheetPanel.tsx` — взять паттерн расчёта ability mods, saves, skills для PCCombatCard
- `engine/pc/types.ts` — PathbuilderBuild: acTotal, abilities, saves, skills, attributes
- `src/shared/api/characters.ts` — `getCharacter(id)` для загрузки rawJson в pcBuildCache

### Characters page picker
- `src/pages/characters/ui/CharactersPage.tsx` — handleAddToCombat; добавить encounter picker
- `src/features/combat-tracker/model/encounter-tabs-store.ts` — `openTabs`, `addCombatantToTab`

### Encounter creature search
- `src/features/encounter-builder/ui/EncounterCreatureSearchPanel.tsx` — добавить creature type Select; переключить на searchCreaturesFiltered
- `src/shared/api/creatures.ts` — `searchCreaturesFiltered` + `CreatureFilters` интерфейс (traits поле)

### Hazard data
- `src/shared/api/hazards.ts` — HazardRow: stealth_dc, stealth_details — источник initiativeBonus
- `src/features/encounter-builder/ui/CreatureSearchSidebar.tsx` — паттерн Hazard search + drag; перенести/адаптировать для left panel combat

### Engine dice
- `engine/dice/dice.ts` — rollDice(1, 20) уже есть

### Filter bar reference
- `src/features/bestiary-browser/ui/BestiaryFilterBar.tsx` — CREATURE_TYPES array, паттерн Select для creature type

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BestiarySearchPanel` — добавить creature type Select и toggle header; searchCreaturesFiltered уже экспортирован
- `CreatureSearchSidebar` (encounter-builder) — имеет Creatures/Hazards tab toggle + drag; адаптировать логику hazard search для нового HazardSearchPanel
- `statBlockCache` в CombatPage (useRef<Map<string, CreatureStatBlockData>>) — та же структура для `pcBuildCache`
- `useCombatantStore.setInitiative` + `reorderInitiative` — готовы к использованию без изменений
- `rollDice` в engine/dice — использовать для hazard initiative roll

### Established Patterns
- Button-toggle для tier chips в BestiarySearchPanel (`px-2 py-0.5 text-xs rounded transition-colors`) — копировать для [Bestiary|Hazards|Characters]
- Toast (`sonner`) для feedback при добавлении combatant — использовать для hazard roll result
- `useRef<Map<>>` cache pattern (statBlockCache в CombatPage) — применить для pcBuildCache
- `isNPC ? <Skull/> : <User/>` в InitiativeRow — добавить третий case для isHazard (AlertTriangle icon)

### Integration Points
- `CombatPage.handleSelect` — добавить branch: `if (!combatant.isNPC && !combatant.isHazard)` → load PC build → setPcStatCard
- `CombatPage` правая панель — добавить `else if (selectedPcBuild)` branch рядом с `lastNpcStatBlock`
- `CharactersPage.handleAddToCombat` — обернуть в encounter picker при >1 openTabs
- `InitiativeRow` — добавить `onClick` на span initiative + `isEditing` state

</code_context>

<specifics>
## Specific Ideas

- Inline initiative edit: клик на цифру initiative в InitiativeRow → input шириной ~3rem, pre-filled значением. Enter/blur → setInitiative + reorderInitiative (сортировка по убыванию). Escape → отмена.
- Hazard в InitiativeRow: AlertTriangle icon вместо User/Skull; маленькая dice кнопка рядом с цифрой initiative только при isHazard=true.
- PCCombatCard: compact, без Separator между секциями — visual divider через `border-b border-border/50` или просто spacing. Skills можно в ScrollArea если список длинный.
- Left panel toggle: `[Bestiary | Hazards | Characters]` — при переключении panel content меняется, search state каждой вкладки независим.

</specifics>

<deferred>
## Deferred Ideas

- Hazard stat block в правой панели (hardness, disable details, actions) при выборе hazard в combat — пока sticky behavior, может быть Phase 47
- Level range filter в BestiarySearchPanel (combat left panel) — только type filter сейчас
- Multi-select add to combat (несколько PC сразу) — не в scope

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 46-pc-combat-polish*
*Context gathered: 2026-04-07*
