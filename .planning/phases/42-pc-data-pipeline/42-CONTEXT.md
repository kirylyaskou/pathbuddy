# Phase 42: PC Data Pipeline - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Всё необходимое для хранения и работы с данными Pathbuilder 2e персонажей в SQLite: SQL-миграция (`characters` table), полный тип `PathbuilderBuild`, парсер JSON, расчёт HP, CRUD-API через `shared/api/characters.ts`. UI (file picker, paste dialog, Characters Page) — Phase 43.

</domain>

<decisions>
## Implementation Decisions

### HP Calculation
- **D-01:** `calculatePCMaxHP(build: PathbuilderBuild)` живёт в `engine/pc/hp.ts` — pure TS, zero deps, соответствует архитектуре engine
- **D-02:** Формула: `ancestryhp + (classhp + bonushp + CON_mod) × level`, где `CON_mod = Math.floor((abilities.con - 10) / 2)`
- **D-03:** Функция экспортируется через `engine/index.ts` barrel

### Pathbuilder Types
- **D-04:** Полный `PathbuilderBuild` interface создаётся сейчас в `engine/pc/types.ts` — покрывает все поля, которые потребуются Phase 44 (skills, equipment, spells, feats, specials, mods). Позволяет избежать переписывания типов в Phase 44.
- **D-05:** `PathbuilderExport` = `{ success: boolean; build: PathbuilderBuild }` — обёртка как в реальном Pathbuilder JSON export

### SQLite — characters table
- **D-06:** Схема: `id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, class TEXT, level INTEGER, ancestry TEXT, raw_json TEXT NOT NULL, notes TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now'))`
- **D-07:** ID генерируется через `crypto.randomUUID()` — паттерн как везде в codebase (encounters, combat)
- **D-08:** Upsert по `name` (UNIQUE constraint) — при повторном импорте того же персонажа обновляются все поля кроме `id` и `created_at`

### API
- **D-09:** `shared/api/characters.ts` экспортирует: `getAllCharacters`, `getCharacterById`, `upsertCharacter`, `deleteCharacter`, `updateCharacterNotes`
- **D-10:** `upsertCharacter(build: PathbuilderBuild): Promise<string>` — принимает распарсенный build, возвращает id
- **D-11:** `CharacterRecord` interface (TypeScript) = строка из БД: id, name, class, level, ancestry, rawJson, notes, createdAt

### UI-граница Phase 42/43
- **D-12:** Phase 42 = чистый бэкенд. File picker (`<input type="file">`) и paste-диалог — Phase 43 (Characters Page).
- **D-13:** PCImp-01 и PCImp-02 из REQUIREMENTS.md реализуются в Phase 43, хотя трейсабилити указывает Phase 42 — success criteria Phase 42 чисто backend-ориентированы.

### Claude's Discretion
- Номер SQL-миграции (следующий после 0020 — должен быть 0021)
- Точная структура `PathbuilderBuild` полей (skills array format, equipment, spells) — нужно изучить реальный Pathbuilder JSON export формат при планировании

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing API patterns
- `src/shared/api/encounters.ts` — паттерн CRUD (INSERT OR IGNORE, upsert, camelCase↔snake_case mapping)
- `src/shared/api/creatures.ts` — паттерн fetchById, fetchAll
- `src/shared/api/index.ts` — как добавить новый модуль в barrel export

### Existing migration pattern
- `src/shared/db/migrate.ts` — import.meta.glob, sequential migration runner
- `src/shared/db/migrations/0020_encounter_hazard_columns.sql` — последняя миграция (следующая = 0021)

### Engine architecture
- `engine/index.ts` — barrel export (добавить engine/pc/ экспорты сюда)
- `engine/conditions/` — пример организации engine-модуля

### Requirements
- `.planning/REQUIREMENTS.md` — PCImp-01..04, success criteria для Phase 42
- `.planning/ROADMAP.md` §"Phase 42: PC Data Pipeline" — точные success criteria

No external specs — Pathbuilder 2e JSON format определяется по публичному экспорту (поле `build` в корне объекта).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getDb()` из `@/shared/db` — используется во всех api/*.ts файлах, то же здесь
- `crypto.randomUUID()` — ID generation паттерн (без импорта, нативный в WebView)
- `INSERT OR REPLACE` / snake_case→camelCase mapping — паттерн из encounters.ts

### Established Patterns
- Все `shared/api/*.ts` импортируют только `getDb` и возвращают типизированные интерфейсы
- SQLite: snake_case колонки; TypeScript: camelCase поля; маппинг явный в каждой функции
- `raw_json TEXT` уже используется в `entities` таблице — тот же подход для characters
- `import.meta.glob('./migrations/*.sql', { eager: true, query: '?raw' })` — добавить новый .sql файл, он подхватится автоматически

### Integration Points
- `src/shared/api/index.ts` — добавить `export * from './characters'`
- `engine/index.ts` — добавить `export * from './pc/hp'` и `export * from './pc/types'`
- Phase 43 вызовет `upsertCharacter(build)` из Characters Page
- Phase 45 вызовет `getCharacterById(id)` для получения HP/AC при добавлении в combat

</code_context>

<specifics>
## Specific Ideas

- `calculatePCMaxHP` должна быть доступна через `@engine` alias — Phase 45 вызовет её при добавлении PC в combat tracker для расчёта maxHp без повторной логики
- Pathbuilder JSON export имеет структуру `{ success: true, build: { ... } }` — парсер должен извлекать `export.build`

</specifics>

<deferred>
## Deferred Ideas

- Spell slot tracking per PC per session — v2 (deferred, отмечено в REQUIREMENTS.md)
- Pathbuilder URL sync по build ID — требует network + auth, out of scope
- Индексирование `max_hp` как отдельной колонки — raw_json + calculatePCMaxHP достаточно; не преоптимизировать

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 42-pc-data-pipeline*
*Context gathered: 2026-04-06*
