# Phase 44: PC Sheet - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Просмотр полного листа персонажа Pathbuilder 2e — клик по карточке на `/characters` открывает slide-over панель со всеми данными персонажа: кор-статы, навыки, снаряжение, заклинания, умения/черты, редактируемые DM-заметки. Маршрут не меняется. Только чтение (кроме заметок). Боевая интеграция — Phase 45.

</domain>

<decisions>
## Implementation Decisions

### Навигация
- **D-01:** PC Sheet открывается как shadcn `Sheet` (slide-over панель) поверх `/characters` — маршрут не меняется, `CharacterCard` получает `onClick` → `setSelectedCharacter(character)`.
- **D-02:** Роут `/characters/:id` НЕ создаётся — панель управляется состоянием `selectedCharacter: CharacterRecord | null` в `CharactersPage`.
- **D-03:** Закрытие панели — кнопка X в SheetHeader или клик вне панели (поведение shadcn Sheet по умолчанию).

### Структура листа (табы)
- **D-04:** 5 табов через shadcn Tabs: **Core & Skills** | **Equipment** | **Spells** | **Feats** | **Notes**.
- **D-05:** Шапка Sheet (вне табов): имя персонажа, class • level • ancestry, SheetClose кнопка.
- **D-06:** Таб по умолчанию: Core & Skills.

### Таб Core & Skills
- **D-07:** Кор-секция: HP (calculated), AC (из `acTotal`), Speed; все 6 характеристик с модификатором (`Math.floor((score - 10) / 2)`); Fort/Ref/Will/Perception с итоговым бонусом.
- **D-08:** HP формула: `ancestryhp + (classhp + bonushp + CON_mod) × level` — через `calculatePCMaxHP(build)` из `@engine`.
- **D-09:** AC формула: `acTotal.acProfBonus + acTotal.acAbilityBonus + acTotal.acItemBonus`.
- **D-10:** Save/Perception формула: PF2e стандарт — `ability_mod + level + proficiency_rank_bonus` (если proficiency > 0), иначе `ability_mod`. rank_bonus: T=2, E=4, M=6, L=8.
- **D-11:** Skills секция: все навыки из `build.skills` + lores из `build.lores`. Формула: если proficiency > 0: `ability_mod + level + (proficiency × 2)`; если 0: только `ability_mod`. Отображается ранг как T/E/M/L (2→T, 4→E, 6→M, 8→L) и итоговый модификатор со знаком (+7, -1).
- **D-12:** Item bonuses из `build.mods` не парсятся — структура неизвестна, пропускается в v1.

### Таб Equipment
- **D-13:** `PathbuilderBuild` расширяется в `engine/pc/types.ts`: добавляются `weapons: PathbuilderWeapon[]` и `armor: PathbuilderArmor[]`.
- **D-14:** `PathbuilderWeapon` = `{ name: string; qty: number; prof: string; die: string; damageType: string; pot: number; str: string; runes: string[] }`.
- **D-15:** `PathbuilderArmor` = `{ name: string; qty: number; prof: string; pot: number; res: string; runes: string[] }`.
- **D-16:** Отображение: секция **Armor** (из `build.armor`, рунная нотация: `name +pot [runes]`), секция **Weapons** (из `build.weapons`, аналогично), секция **Inventory** (`build.equipment` сгруппирована по `category` как контейнеру — Worn, Backpack, Belt Pouch и т.д.).
- **D-17:** Рунная нотация брони: `name` + ` +{pot}` если pot > 0 + ` [{res}]` если res не пустой + ` [{rune1}, ...]` если runes не пустой.
- **D-18:** Если `build.armor` и `build.weapons` пустые — секции не отображаются; показывается только Inventory.

### Таб Spells
- **D-19:** Для каждого entry в `build.spellCasters`: заголовок с традицией + типом (prepared/spontaneous/focus), список заклинаний сгруппирован по `spellLevel`.
- **D-20:** Focus entry (`spellcastingType === 'focus'`) отображается отдельно с лейблом "Focus". Slot tracking не ведётся (SHEET-04: read-only reference).
- **D-21:** Если `build.spellCasters` пустой — empty state "No spellcasting".

### Таб Feats & Features
- **D-22:** Feats из `build.feats` — `[name, source, type, level, note]`. Отображаются: name (крупно), type + level (мелко), note если не пустой.
- **D-23:** Class specials из `build.specials` — `[name, level, note]`. Аналогичное отображение.
- **D-24:** Две sub-секции: **Feats** и **Class Features**.

### Таб Notes (DM Notes)
- **D-25:** Редактируемый Textarea с `defaultValue={character.notes}`. Сохраняется через `updateCharacterNotes(id, value)` при onBlur.
- **D-26:** Placeholder: "DM notes for this character...".

### Claude's Discretion
- Точные размеры/ширина Sheet панели (рекомендовано min 400px, side="right")
- Точная типографика секций, разделители
- Порядок навыков в списке (alphabetical)
- Цветовое кодирование рангов (T=green, E=blue, M=purple, L=amber) — если уместно в Golden Parchment теме

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing PC data layer (готов, Phase 42+43)
- `engine/pc/types.ts` — PathbuilderBuild, PathbuilderAbilities, PathbuilderAttributes, PathbuilderProficiencies, PathbuilderSpellEntry (расширить weapons/armor)
- `engine/pc/hp.ts` — calculatePCMaxHP(build) — использовать для отображения HP
- `src/shared/api/characters.ts` — getCharacterById, updateCharacterNotes, CharacterRecord

### UI patterns
- `src/pages/characters/ui/CharactersPage.tsx` — место установки Sheet + selectedCharacter state
- `src/features/characters/ui/CharacterCard.tsx` — добавить onClick prop
- `src/shared/ui/sheet.tsx` — Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose
- `src/shared/ui/tabs.tsx` — Tabs, TabsList, TabsTrigger, TabsContent
- `src/shared/ui/textarea.tsx` — для DM Notes

### Theme
- `src/app/styles/globals.css` — Golden Parchment design tokens

### Requirements
- `.planning/REQUIREMENTS.md` §"PC Sheet (SHEET)" — SHEET-01..06
- `.planning/ROADMAP.md` §"Phase 44: PC Sheet" — success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getCharacterById(id)` — уже готов, но CharactersPage загружает полный список; для Sheet можно читать из `characters` state + JSON.parse(rawJson)
- `calculatePCMaxHP(build)` из `@engine` — уже используется в CharactersPage для Add to Combat
- shadcn `Sheet` — установлен (62 компонента), аналог используется для других панелей
- shadcn `Tabs` — установлен, используется в ImportDialog (File/Paste вкладки)
- shadcn `Textarea` — установлен

### Established Patterns
- `JSON.parse(character.rawJson) as PathbuilderExport` — паттерн уже в CharactersPage.handleAddToCombat
- FSD: новый Sheet-компонент живёт в `features/characters/ui/PCSheetPanel.tsx` или отдельном widget
- Ability mod: `Math.floor((score - 10) / 2)` — стандартная PF2e формула
- Proficiency rank map: `{ 0: 'U', 2: 'T', 4: 'E', 6: 'M', 8: 'L' }`

### Integration Points
- `src/pages/characters/ui/CharactersPage.tsx` — добавить `selectedCharacter` state + Sheet render
- `src/features/characters/ui/CharacterCard.tsx` — добавить `onView?: (character: CharacterRecord) => void` prop + onClick на card div
- `engine/pc/types.ts` — добавить PathbuilderWeapon и PathbuilderArmor interfaces + поля в PathbuilderBuild

</code_context>

<specifics>
## Specific Ideas

- Slide-over panel аналогична десктопным detail panels — side="right", w-[420px] или w-[480px]
- Ранги навыков лучше отображать через цветные бейджи: U=muted, T=green, E=blue, M=purple, L=amber
- Рунная нотация: "Chain Mail +1 [resilient]" — компактно, в одну строку

</specifics>

<deferred>
## Deferred Ideas

- Item bonuses из `build.mods` — структура неизвестна, skip в v1; revisit когда будет реальный сложный JSON
- Deep link `/characters/:id` — не нужен для DM-инструмента, но легко добавить в v2
- Spell slot tracking — v2 (из REQUIREMENTS.md Future)
- Редактирование персонажа — Pathbuilder source of truth, out of scope

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 44-pc-sheet*
*Context gathered: 2026-04-06*
