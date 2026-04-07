# Phase 44: PC Sheet - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 44-pc-sheet
**Areas discussed:** Navigation, Layout, Skills formula, Equipment data

---

## Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Full route /characters/:id | Navigate to separate page, deep link, browser back works | |
| Slide-over panel (shadcn Sheet) | Sheet opens over characters grid, no route change | ✓ |

**User's choice:** Slide-over панель (shadcn Sheet)
**Notes:** Аналог десктопных detail panels, route не меняется.

---

## Layout structure

| Option | Description | Selected |
|--------|-------------|----------|
| Tabbed sections | 5 tabs: Core & Skills / Equipment / Spells / Feats / Notes | ✓ |
| Single scrollable page | All sections in sequence with sticky headers | |

**User's choice:** Табы по разделам
**Notes:** Компактно для DM-инструмента, привычно для PF2e.

---

## Skills formula

**Context provided by user:** Official PF2e rules — "Skill check result = d20 roll + key attribute modifier + proficiency bonus + other bonuses + penalties". Proficiency bonus = level + 2 (T) / +4 (E) / +6 (M) / +8 (L), or +0 untrained.

| Option | Description | Selected |
|--------|-------------|----------|
| Full formula with level | ability_mod + level + rank_bonus if trained+ | ✓ |
| Simplified rank×2 + ability_mod | Matches REQUIREMENTS.md text literally but gives wrong numbers | |

**User's choice:** Полная формула с уровнем
**Notes:** Untrained = только ability_mod без уровня. Item bonuses из mods пропускаются (структура неизвестна).

---

## Equipment data structure

| Option | Description | Selected |
|--------|-------------|----------|
| weapons[] and armor[] separate | PathbuilderBuild type incomplete — Phase 44 extends it | ✓ |
| All in equipment[], runes in item name | No type extension needed | |

**User's choice:** Да, weapons[] и armor[] отдельно
**Notes:** engine/pc/types.ts нужно расширить PathbuilderWeapon и PathbuilderArmor interfaces.

---

## Claude's Discretion

- Точные размеры Sheet панели
- Типографика и разделители внутри табов
- Цветовое кодирование рангов навыков
- Порядок сортировки навыков (alphabetical)
- Парсинг item bonuses из mods (skip в v1)

## Deferred Ideas

- Deep link /characters/:id — v2
- Spell slot tracking — v2 (из REQUIREMENTS.md)
- Item bonuses из mods — revisit при наличии реального сложного JSON
