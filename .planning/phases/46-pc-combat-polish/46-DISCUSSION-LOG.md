# Phase 46: PC Combat Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 46-pc-combat-polish
**Areas discussed:** Left panel Characters tab, PC карточка в правой панели, Редактирование инициативы, Фильтр-чипы (SC5) + Hazard initiative (SC6)

---

## Left panel: Characters tab

| Option | Description | Selected |
|--------|-------------|----------|
| Кнопки-тогглы сверху | [Bestiary | Characters] button-toggle над панелью, тот же паттерн что Tier chips | ✓ (extended to 3 toggles: Bestiary|Hazards|Characters) |
| shadcn Tabs | Стандартный Tabs/TabsList/TabsTrigger | |

**User's choice:** Кнопки-тогглы сверху — 3 тогла [Bestiary | Hazards | Characters]

---

## Characters list style

| Option | Description | Selected |
|--------|-------------|----------|
| Compact rows | ⊕ имя (Класс уровень) в одну строку | ✓ |
| CharacterCard (reuse) | Тот же компонент что на /characters | |

**User's choice:** Compact rows

---

## Куда добавлять PC из Characters tab при >1 tabs

| Option | Description | Selected |
|--------|-------------|----------|
| В активный encounter сразу | Всегда добавляет в текущий активный tab | |
| Picker при >1 табе | Dropdown при нескольких open tabs | ✓ |

**User's choice:** Picker при >1 табе

---

## Characters page "Add to Combat" при нескольких encounter tabs

| Option | Description | Selected |
|--------|-------------|----------|
| В активный encounter | Как сейчас | |
| Dropdown picker | Dropdown со списком encounter tabs | ✓ |

**User's choice:** Dropdown picker (SC2 требует именно это)

---

## PC stat card — поведение правой панели

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky NPC, switch на PC | NPC sticky, PC card заменяет при выборе PC | |
| PC + NPC показывают разным | Без sticky: NPC → stat block, PC → PC card | ✓ |

**User's choice:** PC + NPC показывают разное по типу (Phase 45 D-07 sticky behavior отменён)

---

## PC card компонент

| Option | Description | Selected |
|--------|-------------|----------|
| Compact новый компонент | PCCombatCard: abilities, saves, skills без вкладок | ✓ |
| PCSheetPanel (переиспользовать) | Полный Sheet с вкладками — перегружен | |

**User's choice:** Compact новый компонент PCCombatCard

---

## PC build data source

| Option | Description | Selected |
|--------|-------------|----------|
| CombatPage: кэш PC builds | pcBuildCache = useRef<Map<id, PathbuilderBuild>>() | ✓ |
| Пропс в PCCombatCard | Компонент сам загружает — нельзя кэшировать | |

**User's choice:** CombatPage кэш (тот же паттерн что statBlockCache для NPC)

---

## Initiative редактирование

| Option | Description | Selected |
|--------|-------------|----------|
| NPC и PC — оба editable | setInitiative для обоих | ✓ |
| Только PC editable | SC3 говорит только о PC | |

**User's choice:** Оба — NPC и PC editable

---

## Где редактировать initiative

| Option | Description | Selected |
|--------|-------------|----------|
| Inline в InitiativeRow | Клик на цифру → input → Enter/blur сохраняет | ✓ |
| В CombatantDetail header | Edit кнопка в detail panel | |

**User's choice:** Inline в InitiativeRow

---

## SC5: Creature type filter UI

| Option | Description | Selected |
|--------|-------------|----------|
| creature type chips | Dropdown по creature type (aberration, dragon...) | ✓ |
| Combatant type filter | NPC/PC/Hazard filter в InitiativeList | |
| Оба варианта | И то и другое | |

**User's choice:** Creature type Select dropdown в BestiarySearchPanel + EncounterCreatureSearchPanel

---

## SC5: Filter UI style

| Option | Description | Selected |
|--------|-------------|----------|
| Select дропдаун | Компактный shadcn Select "All types" | ✓ |
| Chips для популярных + Select | Top-5 + More | |

**User's choice:** Select дропдаун

---

## SC6: Hazard добавление в combat tracker

| Option | Description | Selected |
|--------|-------------|----------|
| Только через encounter blueprint | Hazards только из encounter blueprint | |
| Также drag из left panel | Hazards tab в left panel + drag | ✓ |

**User's choice:** Также drag из left panel → добавить Hazards tab в left panel [Bestiary|Hazards|Characters]

---

## SC6: Left panel layout с Hazards

| Option | Description | Selected |
|--------|-------------|----------|
| [Bestiary | Hazards | Characters] (3 таба) | Отдельный HazardSearchPanel | ✓ |
| Bestiary tab с Creatures/Hazards внутри | Вложенный toggle | |

**User's choice:** 3 тогла [Bestiary | Hazards | Characters]

---

## SC6: Combatant fields для хазардов

| Option | Description | Selected |
|--------|-------------|----------|
| isHazard + initiativeBonus | Один числовой бонус для roll | ✓ |
| isHazard + stealthDc + perception | Два поля + picker при roll | |

**User's choice:** isHazard + initiativeBonus (проще, достаточно)

---

## SC6: Roll Initiative button location

| Option | Description | Selected |
|--------|-------------|----------|
| В InitiativeRow рядом с цифрой | Dice-кнопка рядом с цифрой initiative | ✓ |
| В CombatantDetail при выборе | Кнопка в detail panel | |

**User's choice:** В InitiativeRow рядом с цифрой — только при isHazard=true

---

## Claude's Discretion

- Точный layout PCCombatCard (padding, разделители)
- Стиль input при inline initiative edit
- Toast format для hazard roll результата
- Порядок секций в PCCombatCard

## Deferred Ideas

- Hazard stat block в правой панели при выборе hazard — возможно Phase 47
- Level range filter в BestiarySearchPanel (combat) — не обсуждался
