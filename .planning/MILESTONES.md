# PathMaid — Shipped Milestones

Историческая лента зарелизенных версий. Полные детали — в `.planning/milestones/`.

---

## v1.7.4 — Broad i18n Coverage + Tech Cleanup

**Status:** feature-complete (2026-04-26), version bump committed, **NOT YET TAGGED** (held для combined v1.7.x release)
**Tag:** —
**Phases:** 108 + post-phase i18n sweep (1 phase + global pass)
**Commits:** 6 (`3b064c5a` → `d6654ef5`)
**Archive:** [v1.7.4-ROADMAP.md](./milestones/v1.7.4-ROADMAP.md)

### Key Accomplishments

1. **Phase 108 — Seed perf hardening** — bigger seed chunk sizes cut cold-boot IPC count; dedup collect functions to match DB primary-key collisions (`3b064c5a`, `11163258`)
2. **Broad i18n RU coverage sweep** — statblock + items/spells pages + trait colors localized в одном PR (`f992c502`)
3. **TS strict + ESLint hardening** — tsc-fix pass; eslint boundaries rule allows shared→shared imports (`1b13ac80`, `c1322067`)

### Known Tech Debt

- AP-specific bestiaries packs (`outlaws-of-alkenstar-bestiary`, `abomination-vaults-bestiary`, etc. — 60+ packs) НЕ ingested → монстры из них показывают 🚫RU badge даже когда RU присутствует в `pf2-locale-ru/pf2e/packs/*.json` → scope для v1.7.5
- Strike/item names используют только `entity_items` denorm для weapons из base packs → AP-specific weapons не подхватываются
- Special abilities (Brute Strength, Финт негодяя, Внезапная атака) живут внутри pack `entries.<creature>.items[]` с `kind=action` — текущий ingest не маппит их по name на ability rows
- Spell name coverage от base spells-srd ОК, но AP-specific spell entries в bestiary packs не подхватываются как spell rows

---

## v1.7.3 — Strike Names + UI Shell + Item Surface Audit

**Status:** feature-complete (2026-04-26), milestone closed, NOT TAGGED
**Tag:** —
**Phases:** 102-107 (6 phases)
**Commits:** 7 (`0bf07961` → `04f0341b`)
**Archive:** [v1.7.3-ROADMAP.md](./milestones/v1.7.3-ROADMAP.md)

### Key Accomplishments

1. **Phase 102 — `entity_items` denormalization** — id-based RU strike name lookup; loader populates from pack `.items[]` arrays (`0bf07961`)
2. **Phase 103 — Damage type RU labels** — strike damage types routed через `getTraitLabel` (piercing/slashing/fire/etc.) (`c770c479`)
3. **Phase 104 — Spell drawer chips polish** — traditions/save type/damage type chips через dict (`94f99554`)
4. **Phase 105 — SettingsPage + toast localization** — `useTranslation` wired для Settings + sync/import/updater toasts (`6e4b3177`)
5. **Phase 106 — UpdateDialog + ErrorBoundary localization** — modal dialogs translated (`0d033e80`)
6. **Phase 107 — Action/Feat/Item/Condition UI surface audit** — Phase 100 seeded data surfaces correctly через `useContentTranslation` (`ea0d8fe8`)

---

## v1.7.2 — Translation Polish + Tech Debt

**Status:** feature-complete (2026-04-25), milestone closed, NOT TAGGED
**Tag:** —
**Phases:** 96-101 (6 phases)
**Commits:** 7 (`ace45c79` → `4e1ed5c2`)
**Archive:** [v1.7.2-ROADMAP.md](./milestones/v1.7.2-ROADMAP.md)

### Key Accomplishments

1. **Phase 96 — Paragraph spacing fix** — SafeHtml descriptions force visible vertical separation (`<p>` blocks читаемы как separate sections) (`ace45c79`)
2. **Phase 97 — Orphan rows cleanup** — `DELETE FROM translations WHERE source = 'pf2.ru'` на boot (`9ecc6982`)
3. **Phase 98 — Spell-side untranslated badge** — `🚫RU` slot top-right SpellReferenceDrawer (`08d213e0`)
4. **Phase 99 — TraitPill migration** — strike + ability trait pills routed через `<TraitPill>` (Phase 93 SC9 closure) (`09d74419`)
5. **Phase 100 — Item-shaped pack family ingest** — action/feat/equipment/condition packs adapted; `isItemPack` family detection (`1699c43c`)
6. **Phase 101 — Structured spell overlay shape** — `SpellStructuredLoc { range, target, duration, time, cost, requirements, heightening }` populates `structured_json` (`76830894`)

---

## v1.7.1 — pf2-locale-ru Migration

**Status:** feature-complete (2026-04-25), milestone closed, NOT TAGGED
**Tag:** —
**Phases:** 90-95 (6 phases)
**Commits:** 17 (`90e2c849` → `744893fd`)
**Archive:** [v1.7.1-ROADMAP.md](./milestones/v1.7.1-ROADMAP.md)

### Architectural Shift

v1.7.0 канал «pf2.ru → HTML parse → structured_json» **полностью заменён** на «pf2-locale-ru pack JSON → adapter → structured_json». UI consumers сохранены через adapter layer.

### Key Accomplishments

1. **Phase 90 — Vendoring** — pf2-locale-ru content (19 packs + pf2e.json + VERSION.txt) committed; LICENSES (OGL 1.0a + Paizo CUP + Section 15 + CONTRIBUTORS); `@vendor` alias в vite + tsconfig; About section в SettingsPage; README license disclosure (`90e2c849`, `839055a6`, `d32beda5`, `080e0ca2`, `edb71921`)
2. **Phase 91 — Ingest pipeline rewrite** — pack-adapter + ingest orchestrator; `loadContentTranslations` reads packs via `import.meta.glob`; HTML parser code path удалён; creature UI adapted to pack-native shape; batch+transaction-wrap seed; warm-boot skip (`30022a8d`, `11bb98af`, `ba0e3aa6`, `60884b93`, `095287f9`, `bb9657f9`, `e21c883e`)
3. **Phase 92 — 5 dictionary getters** — sizes / skills / languages / traits + dict smoke test (`f7df0ab8`, `47a16058`, `939473fa`)
4. **Phase 93 — UI wiring** — TraitPill через dict + Radix tooltip; UI consumers wired; IWR i18n keys; `useCurrentLocale` hook; `unmapSize` helper (`92f73e22`, `efa0d663`, `344fb3ed`)
5. **Phase 94 — Untranslated badge** — `NoTranslationBadge` component wired для creature surfaces (`0c844d8c`)
6. **Phase 95 — Spell migration** — vendor spell pack ingest + per-kind seed helper; RU spell description via SafeHtml (`a971fa8d`, `34e63dc0`)

### Known Issues at Close

- Paragraph spacing bug в spell drawer → fixed в v1.7.2 Phase 96
- 5 tech-debts → addressed в v1.7.2

### Rollback History

Original v1.7.1 plan (DICT-01..05 + SPELL-REG-01) был implemented в phases 90-91-92 then **ROLLED BACK** к старту 2026-04-25 после обнаружения false attribution в `traits.ts` / `languages.ts` JSDoc (AI-generated descriptions с заявлением `Source: pf2.ru/rules/traits` без реального fetch). Replanned same-day as E1 architecture shift (drop pf2.ru, vendor pf2-locale-ru).

---

## v1.7.0 — Monster Translation

**Shipped:** 2026-04-24
**Tag:** `v1.7.0`
**Phases:** 84-89 (6 phases)
**Archive:** [v1.7.0-ROADMAP.md](./milestones/v1.7.0-ROADMAP.md)

### Key Accomplishments

1. **Phase 84 — HTML parser library** — `parseMonsterRuHtml(text, rus_text)` pure TS; native DOMParser (Tauri WebView), zero deps
2. **Phase 85 — DB schema** — Migration 0041 `structured_json TEXT NULL` column; rename collision fix `0038_translations.sql` → `0041_translations.sql` (resolved Phase 79 conflict); migration 0042 RU FTS5 denormalization
3. **Phase 86 — Bundled loader integration** — `loadContentTranslations` populates `translations.structured_json` on seed
4. **Phase 87 — API + hook extension** — `useContentTranslation` returns typed `structured` field
5. **Phase 88 — CreatureStatBlock overlay wiring** — RU abilities / skills / saves / speeds / strikes с EN fallback
6. **Phase 89 — `use-spellcasting.ts` trim** — facade <100 строк (DEBT-01 carryover from v1.6.0)

### Architectural Decisions Carried Forward

- Translation IPC boundary: `shared/api/translations.ts` — единственный consumer; `shared/i18n/use-content-translation.ts` — единственный React hook
- `structured_json` column shape preserved через v1.7.1 adapter — UI consumers не переписывались при architecture shift

### Known Tech Debt at Close

- pf2.ru source fragility — full migration к community module (`pf2-locale-ru`) выполнен в v1.7.1
- DEBT-02 — per-phase SUMMARY/VERIFICATION/UAT discipline (process invariant carried into v1.7.x cycle)

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

- Migration 0038 collision (`0038_translations.sql` vs `0038_spell_overrides_heightened.sql`) — fixed в v1.7.0 Phase 85
- `use-spellcasting.ts` = 119 строк (goal было <100) — fixed в v1.7.0 Phase 89
- Нет per-phase SUMMARY/VERIFICATION артефактов (inline plans) — discipline reinstated в v1.7.0 DEBT-02
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

Tags в git: `v1.4.1` — последний подтверждённый тег до v1.5.0. После v1.7.0 tag — длинный gap (v1.7.1/2/3/4 feature-complete но не tag'нуты, ожидание combined release).

---

_Last updated: 2026-04-26 — v1.7.4 closed, v1.7.5 starting_
