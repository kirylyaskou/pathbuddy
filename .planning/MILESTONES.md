# PathMaid — Shipped Milestones

Историческая лента зарелизенных версий. Полные детали — в `.planning/milestones/`.

---

## v1.6.0 — Spellcasting Deep Fix

**Shipped:** 2026-04-23
**Tag:** `v1.6.0`
**Phases:** 77-83 (7 phases)
**Commits:** 34 (+ 4 post-milestone hotfixes)
**Archive:** [v1.6.0-ROADMAP.md](./milestones/v1.6.0-ROADMAP.md)
**Audit:** [v1.6.0-MILESTONE-AUDIT.md](./milestones/v1.6.0-MILESTONE-AUDIT.md) — `tech_debt`

### Key Accomplishments

1. **Cantrip rank safety net** — Foundry cantrip trait override на `spells.rank = 0` в catalog sync (Phase 77)
2. **castType-aware UI split** — SpellcastingEditor стал dispatcher; 4 view-компонента для prepared/innate/spontaneous/focus (Phase 78)
3. **Heightening preview + persistence** — SpellSearchDialog показывает heightenable spells с damage scaling; `heightened_from_rank` в DB (Phase 79, migration 0038)
4. **use-spellcasting facade** — 393-строчный хук → facade + 6 сфокусированных sub-hooks (Phase 80)
5. **@item.level cast-rank** — per-instance `cast_at_rank` на `encounter_combatant_effects`; Fireball rank-8 = 16d6, Heroism rank-6 = +2 (Phase 81, migration 0039)
6. **FSD migration** — SpellcastingBlock + SpellSearchDialog + use-spellcasting переехали в `features/spellcasting/` (Phase 82)
7. **Innate frequency parsing** — at-will badge + N/day per-spell pips из Foundry `sys.frequency` (Phase 83, migration 0040)

### Known Tech Debt

- Migration 0038 collision (`0038_translations.sql` vs `0038_spell_overrides_heightened.sql`)
- `use-spellcasting.ts` = 119 строк (goal было <100)
- Нет per-phase SUMMARY/VERIFICATION артефактов (inline plans)
- 4 post-milestone hotfixes (UAT gap в Phase 79/81)

---

## v1.5.0 — In-App Updater

**Shipped:** 2026-04-23
**Tag:** `v1.5.0` (retroactive — см. worktree history)
**Phases:** 71-76 (6 phases)
**Archive:** [v1.5.0-ROADMAP.md](./milestones/v1.5.0-ROADMAP.md) (retroactive)

### Key Accomplishments

1. **ed25519 signing** — GitHub Secrets + подписанные `.sig` рядом с инсталляторами + `latest.json` с непустым signature (Phase 71)
2. **tauri-plugin-updater + process** — зарегистрированы с dev-guard; capabilities настроены; `pnpm tauri dev` без HTTP-запросов к GitHub (Phase 72)
3. **shared/api/updater.ts** — single FSD IPC boundary; `useUpdaterStore` Zustand state machine (Phase 73)
4. **UpdateDialog + Settings UI** — ручная проверка, release notes, progress bar, darwin-gate (Phase 74)
5. **Startup auto-check** — non-intrusive toast в production; platform gate на macOS; session-dedup (Phase 75)
6. **v1.5.0 release** — version bump в трёх источниках, SQLite graceful shutdown, release notes с upgrade-instructions от v1.4.1 (Phase 76)

### Tail Releases (не отдельные milestone'ы)

- **v1.5.1** — Cargo.lock sync
- **v1.5.2** — ConditionBadge enlargement + color-coded icons
- **v1.5.3** — migration FK disable, spell-drawer token resolution, mascot watermarks
- **RU translations merge** — commit `427e8136` (мини-релиз многоязычности)

### Known Tech Debt

- macOS updater только через `shell.open` — full in-app updater отложен до notarization
- `latest.json.platforms` hand-rolled в `main.yml`

---

## Prior Milestones

v1.0 — v1.4.x: архивированы частично. References в `.planning/milestones/v{X.Y}-ROADMAP.md` были в ROADMAP.md до v1.6.0, но соответствующие файлы не были созданы (планирование велось inline). Восстановление задним числом — по запросу.

Tags в git: `v1.4.1` — последний подтверждённый тег до v1.5.0.
