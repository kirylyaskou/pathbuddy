# Phase 85: Migration + DB Schema — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 85-migration-db-schema
**Areas discussed:** Migration rename strategy, Drizzle introduction, Verification strategy

---

## GA1: Migration rename strategy

| Option | Description | Selected |
|--------|-------------|----------|
| A (clean rename + _migrations cleanup) | Rename файла + в новой migration DELETE старой записи + INSERT новой; мутирует `_migrations` table | ✓ |
| B (rename, accept cruft) | Rename файла, позволить 2 cruft-записи в `_migrations` на existing installs | |
| C (no rename, keep collision) | Оставить 0038_translations.sql, считать "collision" косметической; обновить ROADMAP | |

**User's choice:** A
**Notes:** Выбран clean путь, несмотря на более сложную migration логику. Решение D-03 уточнило финальную структуру: cleanup + add column живут в `0042_translation_structured_json.sql`, а `0041_translations.sql` — неизменённый renamed файл (чтобы fresh install сначала создавал table, потом добавлял column).

---

## GA2: Drizzle introduction

| Option | Description | Selected |
|--------|-------------|----------|
| X (skip Drizzle, update TS interface only) | Расширить `TranslationRow` + `TranslationDbRow` в translations.ts | |
| Y (introduce Drizzle in Phase 85) | Добавить `drizzle-orm` + `drizzle-kit` deps, переписать schema | |
| Z (skip Drizzle now + deferred note) | Вариант X + явная запись в `<deferred>` как v1.8+ tech-debt | ✓ |

**User's choice:** Z (after explanation)
**Notes:** User сначала попросил пояснить что такое Drizzle. После explanation — согласился с instinct: scope Phase 85 слишком узкий для 10x expansion под Drizzle. Deferred note в CONTEXT.md упоминает ~250 строк boilerplate (25 × 10 tables) который Drizzle устранил бы, — это triggering point для возврата к идее в будущем milestone.

---

## GA3: Verification strategy

| Option | Description | Selected |
|--------|-------------|----------|
| I (manual smoke-test) | Удалить local DB, `pnpm tauri dev`, проверить migration + PRAGMA | ✓ |
| II (debug script по паттерну Phase 84) | `migrations.debug.ts` с `window.__pathmaid_migrationsDebug()` в DEV | ✓ |
| III (only CI gates tsc/lint) | Minimal — типы подтверждают корректность, migration — манульно | |

**User's choice:** I + II (both)
**Notes:** Выбрана два-уровневая верификация. Debug script следует паттерну Phase 84 parse-monster.debug.ts (including dev-import wiring в main.tsx lesson-learned). Assertion coverage: `structured_json` column existence + type, `_migrations` cleanup (old gone, new present), total migration count delta.

---

## Claude's Discretion

- Exact SQL formulation в `0042_translation_structured_json.sql`
- Comments-inside-migration style (объясняющий WHY per CLAUDE.md)
- Debug harness filename (migrations.debug.ts vs translations-schema.debug.ts)
- Minimum 4 assertions в debug harness; builder может добавить больше

## Deferred Ideas

- Drizzle ORM integration — v1.8+ tech-debt (new milestone или Phase 89.x)
- Drizzle-kit auto-generated migrations workflow
- Backfill structured_json на existing installs — Phase 86 scope
- SQLite JSON1 query'и внутри structured_json — не релевантно v1.7.0
