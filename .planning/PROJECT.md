# PathMaid — Project Reference

**Updated:** 2026-04-26 (v1.7.4 feature-complete, v1.7.5 starting)
**Repo:** github.com/kirylyaskou/PathMaid
**Current version (in code):** `1.7.4` (package.json + tauri.conf.json + Cargo.toml — bumped via `789e7e76`)
**Last git tag:** `v1.7.0` (2026-04-24) — v1.7.1/2/3/4 feature-complete но НЕ tag'нуты, ожидание combined release после v1.7.5

## Current Milestone: v1.7.5 — AP Bestiaries + Item-id RU + Special Abilities Coverage

**Goal:** Расширить translation ingest до полного pack coverage (`pf2-locale-ru/pf2e/packs/*` 72 packs vs текущие 19). Подхватывать все creature item entries (weapons + special abilities) для name + description RU lookup. После этого v1.7.x → tag-able combined release.

**Target features:**

A. AP Bestiaries Ingest:
- Расширить scope ingest до всех `*-bestiary.json` + `npc-gallery.json` + AP-specific packs (50+ файлов)
- Лимит-аware loading (chunked seed) для не повышения cold-boot времени
- Reference repro: `"Lucky" Lanks` из `outlaws-of-alkenstar-bestiary.json` рендерится с RU именем + items + abilities

B. Item-id RU Coverage Extension:
- `entity_items` populated из ВСЕХ packs (не только base) — strike names, equipment names per creature instance
- Lookup fallback chain: entity_items[id] → equipment-srd[name] → engine EN

C. Special Abilities Coverage:
- Creature `entries.<creature>.items[]` с `kind=action` → ability rows lookup (name + description)
- Wire AbilityCard / CreatureAbilityRow / strike row через `getCreatureAbility(creature, ability_name)`
- Cover monster-specific abilities (Brute Strength, Финт негодяя, Внезапная атака) которые не в base actionspf2e pack

D. Spell Coverage Audit:
- Spell entries из bestiary `items[]` (kind=spell) маппятся на spell rows
- Untranslated spell detection + badge

**Out of scope:**
- Effects packs ingest (`*-effects.json`) — v1.8+
- macOS notarization / Android distribution
- Custom creature translation pipeline (homebrew creatures без vendor entry)
- Programmatic upstream sync с pf2-locale-ru — vendor at point-in-time

## Completed Milestones

### v1.7.4 — Broad i18n Coverage + Tech Cleanup (feature-complete 2026-04-26, NOT TAGGED)

Phase 108 (seed perf hardening — bigger chunk sizes, dedup collect functions) + global i18n RU sweep (statblock + items/spells pages + trait colors) + TS strict + ESLint shared→shared boundaries fix. Full details: [`.planning/milestones/v1.7.4-ROADMAP.md`](./milestones/v1.7.4-ROADMAP.md).

### v1.7.3 — Strike Names + UI Shell + Item Surface Audit (feature-complete 2026-04-26, NOT TAGGED)

Phases 102-107 — `entity_items` denormalization (id-based strike name lookup), damage type RU labels через TraitPill, spell drawer chips polish, SettingsPage + toast localization, UpdateDialog + ErrorBoundary localization, action/feat/item/condition UI surface audit. Full details: [`.planning/milestones/v1.7.3-ROADMAP.md`](./milestones/v1.7.3-ROADMAP.md).

### v1.7.2 — Translation Polish + Tech Debt (feature-complete 2026-04-25, NOT TAGGED)

Phases 96-101 — paragraph spacing fix + orphan rows cleanup + spell-side untranslated badge + strike/ability TraitPill migration + item-shaped pack family ingest + structured spell overlay shape. Full details: [`.planning/milestones/v1.7.2-ROADMAP.md`](./milestones/v1.7.2-ROADMAP.md).

### v1.7.1 — pf2-locale-ru Migration (feature-complete 2026-04-25, NOT TAGGED)

Phases 90-95 — vendor pf2-locale-ru content + 4 LICENSES + ingest pipeline replacing HTML parser + 5 dictionary getters + UI wiring + untranslated badge + spell migration. Full details: [`.planning/milestones/v1.7.1-ROADMAP.md`](./milestones/v1.7.1-ROADMAP.md). Release blocked on paragraph spacing bug + 5 tech debts → v1.7.2 cycle.

### v1.7.0 — Monster Translation (shipped 2026-04-24, tag `v1.7.0`)

Phases 84-89 — HTML→structured parser (native DOMParser, zero deps), migration 0041/0042/0043 (structured_json column + RU FTS5 denormalization), bundled loader integration, typed API + hook surface, CreatureStatBlock overlay wiring + markdown-lite renderer, use-spellcasting facade trim. Full details: [`.planning/milestones/v1.7.0-ROADMAP.md`](./milestones/v1.7.0-ROADMAP.md).

---

## What This Is

Pathfinder 2e GM Assistant — десктопное приложение для ведения игровых сессий. Импорт данных из Foundry VTT, точный PF2e rules engine, UI поверх SQLite.

Платформы: Windows + Linux (desktop canonical), macOS (через shell.open для update flow, notarization отложена), Android (удалён из CI в v1.5.0).

## Core Value

**Точность + скорость** — чистый TypeScript engine для PF2e-математики (damage, IWR, conditions, heightening) + React frontend с live-данными реальных Foundry-паков. GM не считает руками, не листает PDFs, не переключается между табами.

## Tech Stack

- **Frontend:** React 19, Zustand (w/ `useShallow` mandatory для object selectors), Tailwind 4, shadcn/ui, React Router v7 (`createHashRouter` only — Tauri WebView constraint)
- **Backend:** SQLite via `tauri-plugin-sql` IPC, Drizzle ORM (sqlite-proxy), migrations через `import.meta.glob`
- **Architecture:** FSD (Feature-Sliced Design) — `app/pages/widgets/features/entities/shared`; engine — external lib via `@engine` alias (stays outside FSD)
- **Desktop:** Tauri 2, Rust backend, ed25519 signing, GitHub Releases self-update (tauri-plugin-updater)

## Requirements

### Validated (shipped in v1.X)

- ✓ **PF2e rules engine** — damage/IWR/conditions/heightening в чистом TS — v1.0+
- ✓ **Foundry VTT import** — bestiary, spells, equipment, hazards, actions — v0.9
- ✓ **Combat tracker** — inicitive, conditions, effects, @-token resolution — v1.0
- ✓ **Encounter builder** — dual combat view, encounter persistence — v1.2
- ✓ **PC support** — characters page, PC sheet, combat integration — v1.3
- ✓ **Effect rules engine** — predicate evaluator, cast → target → apply flow, encounter export, Paizo library import — v1.4
- ✓ **In-app updater** — ed25519 signing, UpdateDialog, startup auto-check, darwin-gate — v1.5.0
- ✓ **Spellcasting deep fix** — castType dispatcher (prepared/innate/spontaneous/focus), heightening preview + persistence, @item.level cast-rank, FSD migration, innate frequency — v1.6.0

### Active (v1.7.5 scope)

- [ ] **PACK-01** Ingest scope расширен на ВСЕ `*-bestiary.json` + `npc-gallery.json` packs (50+ файлов из 72)
- [ ] **PACK-02** Cold-boot seed time не растёт > +30% при полном scope (chunked + warm-skip preserved)
- [ ] **ITEM-ID-01** `entity_items` populated из всех packs (AP-specific weapons + equipment)
- [ ] **ITEM-ID-02** Lookup fallback chain: `entity_items[id]` → `equipment-srd[name]` → engine EN
- [ ] **ABIL-01** Special ability ingest: creature `entries.<creature>.items[]` где `kind=action` маппится на ability rows с {creature_name, ability_name, description}
- [ ] **ABIL-02** AbilityCard / CreatureAbilityRow читают через `getCreatureAbility(creature, ability_name)` с EN fallback
- [ ] **SPELL-AP-01** Spell entries из bestiary `items[]` (kind=spell) маппятся на spell rows; untranslated detection работает
- [ ] **DEBT-02 carryover** — Per-phase SUMMARY/VERIFICATION discipline preserved

### Validated (shipped/feature-complete v1.7.x)

- ✓ **TRANS-01..05 + DEBT-01** — v1.7.0 (Phases 84-89)
- ✓ **VENDOR-01..04 + INGEST-01..05 + WIRE-01..06 + UNTRANS-01..02 + SPELL-01..03** — v1.7.1 (Phases 90-95)
- ✓ **POLISH-01..02 + CLEAN-01 + INGEST-FAMILY-01..02 + SPELL-STRUCT-01..03** — v1.7.2 (Phases 96-101)
- ✓ **STRIKE-01..03 + SPELL-CHIPS-01..03 + SHELL-01..05 + AUDIT-01..05** — v1.7.3 (Phases 102-107)
- ✓ Broad i18n RU coverage + seed perf hardening + ESLint boundaries — v1.7.4 (Phase 108 + sweep)

### Deferred (future milestones)

- Integration regression tests для FSD-миграций — v1.8+
- macOS notarization + full in-app updater для darwin — требует Apple Developer ID
- Android build разморозка — только если спрос
- Effects packs ingest (`*-effects.json`) — v1.8+
- Programmatic upstream sync с pf2-locale-ru community module — v1.8+
- Custom (homebrew) creature translation pipeline без vendor entry

### Out of Scope

- **Online multiplayer / cloud sync** — PathMaid остаётся local-first desktop app. GMs работают локально с Foundry-экспортами.
- **Character-side play** — инструмент для GM, не для игроков. PC sheet существует для combat automation GM'а, не для самостоятельной игры.
- **Mobile-first UI** — desktop canonical (Windows/Linux), mobile responsive — not priority.
- **Custom rule authoring UI** — PF2e rules hardcoded в `/engine`. Homebrew через data override, не через UI-редактор правил.

## Context

- **Codebase size (post v1.6.0):** ~253 files (TS/TSX/JS/Rust), 1036 nodes / 5644 edges в code graph
- **CI/CD:** GitHub Actions — `ci.yml` (lint + tsc on push/PR), `main.yml` (Windows + Linux builds on tag, signed, release drafts)
- **Known architectural invariants:**
  - `shared/api/` — единственный Tauri IPC boundary; `invoke()` больше нигде
  - Engine outside FSD, `@engine` alias
  - `createHashRouter` only (Tauri WebView constraint)
  - `useShallow` mandatory для Zustand object selectors
  - `import.meta.glob` для Drizzle migrations (no Node.js fs в WebView)
  - Drizzle ORM для schema; raw `getSqlite()` only для perf-critical paths (batch insert, FTS5)
- **Development workflow:** GSD (discuss-phase → ui-phase → plan-phase → execute-phase); model split — Opus для планирования, Sonnet для execution/debug.

## Key Decisions (history of major calls)

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| FSD architecture | Predictable layering для long-lived desktop app | ✓ Good — Steiger lint enforces |
| Engine outside FSD | Pure rules engine не relates к UI layers | ✓ Good — tested in isolation |
| `createHashRouter` only | Tauri WebView hard constraint | ✓ Good — no alternatives |
| Drizzle + sqlite-proxy | Type-safe queries через Tauri IPC | ✓ Good — migrations через `import.meta.glob` |
| Remove all test files | Breaking changes expected, tests stale | ⚠️ Revisit — не хватало для v1.6.0 hotfix-regressions |
| ed25519 signing (v1.5) | tauri-plugin-updater-native | ✓ Good |
| NSIS canonical Windows updater | `updaterJsonPreferNsis: true` | ✓ Good — .msi не поддерживает in-place |
| castType dispatcher (v1.6) | prepared/innate/spontaneous/focus UX расходились | ✓ Good — 4 views чище одного монолита |
| Inline plans в v1.6.0 | 6 взаимозависимых фаз на одной теме | ⚠️ Revisit — затруднил audit, teach rolled back для v1.7 |
| Migration 0038 collision | Параллельная RU-ветка + Phase 79 оба взяли 0038 | — Pending — rename на следующем touch |

## Constraints (current)

- No new npm / cargo dependencies без явного флажка
- Domain / game logic только в `/engine` или `entities/` — никогда в components / widgets / pages
- React 19 conventions: no IIFE в JSX, derived state через `useMemo`, декомпозиция по FSD (`lib → model → ui`)
- No comments про версии / фазы / UAT в коде — история живёт в git blame + PR description
- Code Graph Usage — MCP graph tools первичны, `Read`/`Grep` — last resort

---

_Last updated: 2026-04-26 — v1.7.5 AP Bestiaries + Item-id RU + Special Abilities Coverage init_
