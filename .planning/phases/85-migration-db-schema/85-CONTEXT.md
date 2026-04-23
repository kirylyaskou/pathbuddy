# Phase 85: Migration + DB Schema — Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

`translations` table получает column `structured_json TEXT NULL` для хранения `JSON.stringify(MonsterStructuredLoc)` результата `parseMonsterRuHtml` (Phase 84). Filename collision `0038_translations.sql` vs `0038_spell_overrides_heightened.sql` разрешается через rename первого в `0041_translations.sql` с cleanup `_migrations` таблицы. TypeScript-интерфейс `TranslationRow` в `shared/api/translations.ts` расширяется полем `structuredJson: string | null`.

**Scope:** миграции + TypeScript interface. Parser invocation, seed backfill — Phase 86. Consumer API enrichment (JSON.parse на read-path, typed `structured` field) — Phase 87.

</domain>

<decisions>
## Implementation Decisions

### Migration Strategy (D-01, D-02)

- **D-01:** Rename `src/shared/db/migrations/0038_translations.sql` → `src/shared/db/migrations/0041_translations.sql` + создать новую миграцию `0041_translation_structured_json.sql`. `localeCompare` сортирует их детерминированно: `0041_translation_structured_json.sql` < `0041_translations.sql` по лексикографии — обе применятся в правильном порядке (создание table + add column), что эквивалентно старому порядку на fresh install.
- **D-02:** Cleanup старой записи `_migrations` на existing installs — в `0041_translation_structured_json.sql` (первой по сортировке) выполнить:
  ```sql
  DELETE FROM _migrations WHERE name = '0038_translations.sql';
  INSERT OR IGNORE INTO _migrations (name) VALUES ('0041_translations.sql');
  ALTER TABLE translations ADD COLUMN structured_json TEXT;
  ```
  Cleanup + rename + new column в одной миграции. Idempotent по `_migrations` primary key. На fresh install `DELETE` затрагивает 0 rows (harmless), `INSERT OR IGNORE` — `_migrations` ещё не имеет `0041_translations.sql` (т.к. `0041_translations.sql` теоретически отсортируется ПОСЛЕ `0041_translation_structured_json.sql`; система применит его на том же проходе, увидит свежевставленную запись в `_migrations` и skip — поэтому CREATE TABLE IF NOT EXISTS в `0041_translations.sql` должен остаться для fresh installs — см. D-03).

### Migration Ordering (D-03)

- **D-03:** `0041_translations.sql` (переименованный из `0038_translations.sql`) СОДЕРЖИМОЕ НЕ МЕНЯЕТСЯ — остаётся `CREATE TABLE IF NOT EXISTS translations (...)`. На fresh install: `0041_translation_structured_json.sql` (по lexicographic order идёт раньше) попытается `ALTER TABLE translations ADD COLUMN` на НЕСУЩЕСТВУЮЩЕЙ таблице — упадёт. Решение: `0041_translation_structured_json.sql` переименовать в `0042_translation_structured_json.sql` чтобы применялась ПОСЛЕ `0041_translations.sql`. Но тогда cleanup `_migrations` (D-02) уходит в `0042_*`. Финальный план:
  - `0041_translations.sql` — неизменённое содержимое (just renamed).
  - `0042_translation_structured_json.sql` — cleanup старой migration-записи + add column + INSERT marker для переименованного файла. Порядок применения: (a) на fresh install сначала `0041_translations.sql` создаёт table, затем `0042_*` удаляет phantom `0038_translations.sql` (no-op), регистрирует `0041_translations.sql` как applied (INSERT OR IGNORE — loader сам это сделает в конце `0041_translations.sql`, но cleanup safe), ADD COLUMN работает. (b) на existing install: `_migrations` имеет `0038_translations.sql`; loader видит `0041_translations.sql` как unapplied → применяет `CREATE TABLE IF NOT EXISTS` (no-op, table уже есть) → INSERT `0041_translations.sql` в `_migrations`; затем `0042_*` → DELETE `0038_translations.sql` из `_migrations` (cleanup), ADD COLUMN (succeeds на existing).

### TypeScript Interface Strategy (D-04)

- **D-04:** Drizzle ORM НЕ вводится в Phase 85. Проект использует raw SQL через `@tauri-apps/plugin-sql` с ручными interfaces (`TranslationDbRow` + `TranslationRow` + `toRow()` маппер). Phase 85 расширяет существующий паттерн: добавить `structured_json: string | null` в `TranslationDbRow` и `structuredJson: string | null` в `TranslationRow` + обновить `toRow()`. Рефакторинг на Drizzle — deferred tech-debt для v1.8+ (см. `<deferred>`).

### Verification Strategy (D-05)

- **D-05:** Два уровня verification:
  1. **Smoke-test (manual):** удалить локальную DB (`%APPDATA%/com.pathmaid.app/pathmaid.db` на Windows), запустить `pnpm tauri dev`, проверить что app стартует без migration errors, открыть DevTools → `await (await getDb()).select("PRAGMA table_info(translations)", [])` → ожидать row с `name: "structured_json", type: "TEXT"`.
  2. **Debug harness:** по паттерну Phase 84 — `src/shared/db/migrations.debug.ts` с `window.__pathmaid_migrationsDebug()` в DEV mode. Assertions: `structured_json` column существует, `_migrations` таблица содержит `0041_translations.sql` И НЕ содержит `0038_translations.sql`, total migration count = N+1 где N было до Phase 85.

### Claude's Discretion

- Exact SQL formulation в `0042_translation_structured_json.sql` — builder decides (должно соответствовать паттернам `0037_*`/`0040_*` для консистентности).
- Comments-inside-migration — builder writes explaining WHY не WHAT (CLAUDE.md rule).
- Debug harness assertion count — minimum 4 (column exists, column type, old marker gone, new marker present); builder может добавить больше по усмотрению.
- Filename для debug harness — `migrations.debug.ts` или `translations-schema.debug.ts`; builder picks.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Source

- `.planning/ROADMAP.md` §Phase 85 — phase goal + success criteria + file list
- `.planning/REQUIREMENTS.md` §TRANS-02 — requirement spec
- `.planning/phases/84-html-parser-library/84-CONTEXT.md` — D-01/D-02/D-07 (structured JSON shape which is what `structured_json` column stores)
- `.planning/phases/84-html-parser-library/84-VERIFICATION.md` — downstream contract (abilityScoresLoc added per D-09)

### Code References

- `src/shared/db/migrate.ts` — migration loader (import.meta.glob + localeCompare alphabetical sort + `_migrations` tracking)
- `src/shared/db/migrations/0038_translations.sql` — текущая translations table schema (будет переименована)
- `src/shared/db/migrations/0038_spell_overrides_heightened.sql` — вторая половина коллизии (остаётся без изменений)
- `src/shared/db/connection.ts` — `getDb()` pattern (возможно потребуется понять для debug harness)
- `src/shared/api/translations.ts` — `TranslationRow` + `TranslationDbRow` + `toRow()` (будут расширены)

### Convention

- `CLAUDE.md` §CONSTRAINTS — "No new npm or cargo dependencies without flagging to user first" (D-04 мотивация)
- `CLAUDE.md` §Releasing — не релевантно Phase 85, but в общем
- `CLAUDE.md` §React 19 Conventions — "No version refs in comments" (применяется к migration comments)

### Archived Context

- `.planning/milestones/v1.6.0-MILESTONE-AUDIT.md` — origin of 0038 collision tech-debt (DEBT note в STATE.md §Known Tech Debt)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`_migrations` system в `migrate.ts`** — готовый idempotent-механизм по filename. Phase 85 использует напрямую, не модифицирует.
- **Migration SQL pattern** — каждый файл: 1-20 statements split по `;`, comments через `--`, `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE` / `INSERT OR IGNORE`. Phase 85 следует этому.
- **`TranslationRow` + `toRow()` паттерн в `translations.ts`** — snake_case → camelCase mapping. Phase 85 просто добавляет одну пару.

### Established Patterns

- **Migration comments объясняют WHY** — см. `0038_translations.sql` (long JSDoc-style comment объясняющий дизайн polymorphic translation table). Phase 85 добавит analogous comment в `0042_*` объясняя *почему* structured_json nullable (legacy rows) + почему cleanup `_migrations` записи (rename artifact).
- **Deterministic migration order through lexicographic filename sort** — все файлы `NNNN_*.sql`, где NNNN — 4-digit zero-padded integer. Phase 85 вводит потенциально проблемный edge case (D-03) и решает его через `0042_*` (не `0041_*`) для структурного fix.

### Integration Points

- **Phase 86 (downstream):** `shared/i18n/pf2e-content/index.ts` loader дёргает `parseMonsterRuHtml` + `JSON.stringify` → пишет в `structured_json`. Phase 85 создаёт column; Phase 86 populates.
- **Phase 87 (downstream):** `shared/api/translations.ts` `getTranslation()` return type добавит поле `structured: MonsterStructuredLoc | null` (JSON.parse от `structuredJson`). Phase 85 добавляет raw `structuredJson: string | null`; Phase 87 добавляет parsed `structured` layer.

</code_context>

<specifics>
## Specific Ideas

- **Migration file paths:** `0041_translations.sql` (renamed from `0038_translations.sql`, content unchanged), `0042_translation_structured_json.sql` (new — cleanup + add column).
- **Column name:** `structured_json` (snake_case per SQL convention); TS field: `structuredJson` (camelCase per TS convention, matches existing `nameKey`/`nameLoc`/etc. pattern).
- **`NULL` semantics:** `structured_json IS NULL` означает "parser вернул null ИЛИ row был seeded до Phase 86". UI (Phase 88) treats both equivalently — falls back to EN.
- **Migration 0042 comment header** должен коротко объяснить: (1) почему renamed 0038→0041, (2) почему cleanup `_migrations`, (3) почему `structured_json` nullable.

</specifics>

<deferred>
## Deferred Ideas

- **Drizzle ORM migration** — deferred to v1.8+ (новый milestone или Phase 89.x tech-debt). Текущий `TranslationDbRow` + `TranslationRow` + `toRow()` boilerplate ~25 строк на table × 10 tables = ~250 строк текущего и растущего boilerplate. Drizzle removes это + добавляет type-safe queries. Стоимость intro — 2 deps (`drizzle-orm`, `drizzle-kit`), переработка `shared/db/`, миграция `migrate.ts` loader или сосуществование двух migration workflows. Не делаем в Phase 85 т.к. scope expansion 10x.
- **Backfill `structured_json` для existing installs** — Phase 86 scope (loader re-runs on next app start).
- **Drizzle-kit auto-generated migrations** — если когда-то переедем на Drizzle, существующие 40+ hand-written migrations останутся как есть (baseline), а новые генерируются.
- **JSON1 SQLite extension для query'ев внутри `structured_json`** — не релевантно v1.7.0 (UI рендерит целиком parsed object, не query'ит подполя). Может появиться если будем filtering/search по translated ability names.

</deferred>

---

*Phase: 85-migration-db-schema*
*Context gathered: 2026-04-24*
