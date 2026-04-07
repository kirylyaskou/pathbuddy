---
phase: 07
plan: 01
status: complete
started: 2026-04-01
completed: 2026-04-01
---

## Summary

Installed tauri-plugin-sql (Rust + JS), created SQLite schema with 3 migrations (entities, FTS5, sync_metadata), built the Database singleton and migration runner using import.meta.glob, implemented real DB init in shared/api/db.ts, and fixed Creature entity type bugs.

## Key Files

### Created
- `src/shared/db/connection.ts` — Database singleton via `Database.load('sqlite:pathbuddy.db')`
- `src/shared/db/migrate.ts` — Migration runner with import.meta.glob and _migrations tracking
- `src/shared/db/index.ts` — Barrel export for getDb + runMigrations
- `src/shared/db/migrations/0001_entities.sql` — Entities table with indexes
- `src/shared/db/migrations/0002_entities_fts.sql` — FTS5 virtual table
- `src/shared/db/migrations/0003_sync_metadata.sql` — Key-value sync metadata

### Modified
- `src-tauri/Cargo.toml` — Added tauri-plugin-sql with sqlite feature
- `src-tauri/src/lib.rs` — Registered SQL plugin in Tauri builder
- `src-tauri/capabilities/default.json` — Added sql:default permission
- `src-tauri/tauri.conf.json` — Removed invalid app.title field
- `package.json` — Added @tauri-apps/plugin-sql dependency
- `src/shared/api/db.ts` — Real initDatabase with WAL, foreign keys, migration execution
- `src/shared/api/creatures.ts` — CreatureRow DTO type (FSD-compliant, no entity import)
- `src/entities/creature/model/types.ts` — Added id: string field
- `src/entities/creature/model/store.ts` — Upsert by id instead of name

## Deviations
- `shared/api/creatures.ts` now defines `CreatureRow` DTO instead of importing entity `Creature` — steiger (FSD linter) forbids shared→entities imports. Entities layer will map `CreatureRow` → `Creature`.
- Fixed `tauri.conf.json` invalid `app.title` field that was blocking `cargo check`.

## Decisions
- CreatureRow is a raw DB row type in shared/api (with `traits: string` as JSON, `rarity: string` etc.) — entity Creature has parsed types. This maintains FSD layer boundary.
