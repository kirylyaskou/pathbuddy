# Phase 42: PC Data Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 42-pc-data-pipeline
**Areas discussed:** HP calc location, Pathbuilder types scope, UI boundary Phase 42/43, Character ID strategy

---

## HP calc location

| Option | Description | Selected |
|--------|-------------|----------|
| engine/pc/hp.ts | Pure TS, zero deps. Phase 45 вызывает напрямую из engine. Сохраняет engine как единственное место PF2e-логики. | ✓ |
| src/shared/lib/pc-math.ts | Pathbuilder-специфичная утилита, не загрязняет engine форматом 3rd-party. Минус: shared/lib — UI-утилиты, не business logic. | |

**User's choice:** engine/pc/hp.ts
**Notes:** Соответствует архитектуре — engine уже содержит conditions/, statistics/. HP calc — PF2e rules domain.

---

## Pathbuilder types scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full type сейчас | PathbuilderBuild полный интерфейс в engine/pc/types.ts, покрывает все поля Phase 44. Без переписывания в Phase 44. | ✓ |
| Minimal тип для Phase 42 | Только поля для таблицы + HP calc. Phase 44 дотипизирует позже. | |

**User's choice:** Full type сейчас
**Notes:** Предотвращает рефакторинг типов в Phase 44; JSON.parse<PathbuilderBuild>() работает везде.

---

## UI-граница Phase 42/43

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 43 (file picker + paste) | Phase 42 = чистый бэкенд. Очевидное разделение ответственности. | ✓ |
| Phase 42 (по traceability) | PCImp-01/02 числятся за Phase 42 в REQUIREMENTS.md. Добавить минимальный тестовый UI. | |

**User's choice:** Phase 43
**Notes:** Success criteria Phase 42 чисто backend-ориентированы. Трейсабилити некорректна — PCImp-01/02 логически в Phase 43.

---

## Character ID strategy

| Option | Description | Selected |
|--------|-------------|----------|
| crypto.randomUUID() | UUID v4, паттерн как во всём остальном коде. Upsert по name сохраняет ID. Предсказуемо. | ✓ |
| name-based slug | Читаемо, но коллизии, проблемы с unicode/спецсимволами. | |

**User's choice:** crypto.randomUUID()
**Notes:** Consistency с encounters, combat. Upsert по UNIQUE name, ID не меняется при повторном импорте.

---

## Claude's Discretion

- Точная структура полей PathbuilderBuild (skills array, equipment nested objects, spells format) — определяется при реализации по публичному Pathbuilder JSON format
- Номер следующей SQL-миграции: 0021

## Deferred Ideas

- max_hp как индексированная колонка — не нужно, raw_json + calc достаточно
