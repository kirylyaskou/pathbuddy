# Phase 43: Characters Page - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

`/characters` route — DM может просматривать всех импортированных PC в виде карточек, импортировать новых (file upload или paste JSON), удалять существующих и добавлять PC в активный combat tracker. UI целиком — это задача данной фазы. Backend (API, migration) готов из Phase 42.

</domain>

<decisions>
## Implementation Decisions

### PC Card Layout
- **D-01:** Compact grid (3-4 колонки, аналог ConditionsPage), не список и не rich cards
- **D-02:** Каждая карточка: имя (крупно, font-semibold), "Class • Level" (мелко), ancestry (мелко, muted) — только эти 4 поля из CharacterRecord
- **D-03:** Кнопки [+Combat] и [x] (Delete) отображаются только при hover на карточке
- **D-04:** Empty state при 0 персонажах: центрированный текст "No characters imported yet" + subtitle "Import your party from Pathbuilder 2e" + крупная кнопка [Import Character]

### Import Dialog
- **D-05:** Один Dialog с двумя вкладками: "File" и "Paste" (shadcn Tabs внутри Dialog)
- **D-06:** Вкладка File: drag-and-drop zone + кнопка [Browse files], принимает только `.json` (accept=".json")
- **D-07:** Вкладка Paste: Textarea для вставки сырого Pathbuilder JSON
- **D-08:** Ошибки валидации — inline в диалоге (красный текст под input/textarea), диалог не закрывается. Примеры: "Not a valid Pathbuilder export", "Missing build.name field". Проверяем: `success === true`, наличие `build.name`, `build.class`, `build.level`
- **D-09:** Успешный импорт: диалог закрывается, список перечитывается из DB (getAllCharacters), sonner toast "{Name} imported"

### Add to Combat
- **D-10:** Добавить PC в `useCombatantStore` тихо + sonner toast "{Name} added to combat" с action-кнопкой "Go to Combat" (useNavigate внутри toast action)
- **D-11:** Структура Combatant из PC: `maxHp = calculatePCMaxHP(build)`, `hp = maxHp`, `displayName = build.name`, `initiative = 0`, `isNPC = false`, `creatureRef = character.id`, без поля AC (Combatant type его не имеет — Phase 45)
- **D-12:** Работает независимо от состояния combat (список combatants может быть пустым) — добавляется в любом случае

### Delete Flow
- **D-13:** Кнопка [x] появляется при hover на карточке. Клик → AlertDialog (паттерн из EncounterEditor): "Delete {Name}? This action cannot be undone." → кнопки [Delete] (destructive) и [Cancel]
- **D-14:** Удаление затрагивает только `characters` SQLite таблицу (`deleteCharacter(id)`). Runtime combatant store не трогается — если PC был добавлен в combat, он остаётся там до конца сессии

### Claude's Discretion
- Точный размер карточек и типографика (соблюдать Golden Parchment тему)
- Порядок сортировки в grid (по умолчанию — alphabetically by name, как в getAllCharacters)
- Конкретный текст в drag-and-drop zone
- Debounce/loading state при импорте (показывать spinner на кнопке Import во время await)
- Структура файлов FSD (CharactersPage в pages/characters/ui/, feature в features/characters/)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend (готово, Phase 42)
- `src/shared/api/characters.ts` — getAllCharacters, upsertCharacter, deleteCharacter, CharacterRecord interface
- `engine/pc/hp.ts` — calculatePCMaxHP(build: PathbuilderBuild): number — нужен для Add to Combat

### Combat integration
- `src/entities/combatant/model/types.ts` — Combatant interface (maxHp, hp, isNPC, creatureRef и т.д.)
- `src/entities/combatant/model/store.ts` — useCombatantStore, addCombatant action
- `src/widgets/bestiary-search/ui/BestiarySearchPanel.tsx` — паттерн как createCombatantFromCreature + addCombatant

### UI patterns
- `src/features/encounter-builder/ui/EncounterEditor.tsx` — AlertDialog подтверждения удаления (copy pattern)
- `src/pages/conditions/ui/ConditionsPage.tsx` — compact card grid паттерн (reference для layout)
- `src/shared/ui/alert-dialog.tsx` — AlertDialog компонент
- `src/shared/ui/dialog.tsx` — Dialog компонент (для import dialog)
- `src/shared/ui/tabs.tsx` — Tabs компонент (File/Paste вкладки в import dialog)

### Routing
- `src/app/router.tsx` — добавить `{ path: 'characters', element: <CharactersPage /> }`
- `src/shared/routes.ts` — добавить PATHS.CHARACTERS = 'characters'
- `src/widgets/app-shell/ui/` — добавить Characters в nav

### Requirements
- `.planning/REQUIREMENTS.md` §"Characters Page (CHAR)" — CHAR-01, CHAR-02, CHAR-03
- `.planning/REQUIREMENTS.md` §"Import (PCImp)" — PCImp-01 (file), PCImp-02 (paste)
- `.planning/ROADMAP.md` §"Phase 43: Characters Page" — success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getAllCharacters()` → `CharacterRecord[]` — готов, вызвать в useEffect при mount
- `upsertCharacter(build)` → `Promise<string>` — вызвать в import handler
- `deleteCharacter(id)` — вызвать в confirm delete handler
- `calculatePCMaxHP(build)` из `@engine` — вызвать при Add to Combat
- `useCombatantStore((s) => s.addCombatant)` — прямой вызов без wrapping
- AlertDialog из `@/shared/ui/alert-dialog` — 7 компонентов, паттерн в EncounterEditor.tsx:221-240
- sonner `toast()` — уже используется в RollToastListener, тот же импорт

### Established Patterns
- Все pages живут в `src/pages/{name}/ui/{Name}Page.tsx` + `src/pages/{name}/index.ts` (barrel)
- Grid layout с hover actions: нет прямого аналога — можно взять за основу ConditionsPage grid + добавить hover visibility для кнопок (`opacity-0 group-hover:opacity-100`)
- File reading в Tauri: обычный `<input type="file">` + FileReader API работает в WebView, Tauri API не нужен
- Drag-and-drop для файлов: `onDragOver` / `onDrop` native events на div, без dnd-kit

### Integration Points
- `src/app/router.tsx` — добавить route `characters`
- `src/shared/routes.ts` — добавить PATHS.CHARACTERS
- `src/widgets/app-shell/ui/` — добавить nav link (паттерн: найти существующий NavLink для спеллов/предметов)
- `engine/index.ts` — `calculatePCMaxHP` уже должна быть экспортирована (Phase 42)

</code_context>

<specifics>
## Specific Ideas

- Карточки похожи на mockup: имя крупно, "Class • Level" строка, ancestry строка, кнопки при hover
- "Add to Combat" кнопка должна быть неброской — маленькая иконка или текст, чтобы не конкурировать с именем
- Toast после Add to Combat содержит action "Go to Combat" — useNavigate('/combat') внутри toast action callback

</specifics>

<deferred>
## Deferred Ideas

- Навигация на PC Sheet при клике на карточку — Phase 44
- Отображение HP/AC на карточке — Phase 44 (PC Sheet покажет детали)
- Поиск/фильтр по имени или классу — не в требованиях Phase 43, defer if needed
- Обнаружение "PC уже в combat" на карточке (badge/индикатор) — не в scope

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 43-characters-page*
*Context gathered: 2026-04-06*
