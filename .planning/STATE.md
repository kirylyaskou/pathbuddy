---
gsd_state_version: 1.0
milestone: v1.7.5
milestone_name: AP Bestiaries + Item-id RU + Special Abilities Coverage
status: defining_requirements
stopped_at: ~
last_updated: "2026-04-26T00:00:00.000Z"
last_activity: 2026-04-26
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# STATE.md - PathMaid (Pathfinder 2e DM Assistant)

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-26 для v1.7.5 kickoff)

**Core value:** Точность + скорость — чистый TS engine для PF2e-математики + React frontend с live Foundry-данными.
**Current focus:** v1.7.5 — расширить translation ingest до полного pack coverage (72 vendor packs vs текущие 19); item-id RU lookup для всех packs; special abilities mapping из creature `entries.<creature>.items[]`.

## Current Position

Milestone: v1.7.5 AP Bestiaries + Item-id RU + Special Abilities Coverage
Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-26 — Milestone v1.7.5 started, cleanup completed (MILESTONES.md sync, v1.7.{1,2,3,4} archive stubs created)

Progress: [░░░░░░░░░░] 0%

## Accumulated Context

### Shipped + Feature-Complete Milestones

- v1.7.4 — Broad i18n Coverage + Tech Cleanup (Phase 108 + sweep) — feature-complete 2026-04-26, NOT TAGGED — [archive](./milestones/v1.7.4-ROADMAP.md)
- v1.7.3 — Strike Names + UI Shell + Item Surface Audit (Phases 102-107) — feature-complete 2026-04-26, NOT TAGGED — [archive](./milestones/v1.7.3-ROADMAP.md)
- v1.7.2 — Translation Polish + Tech Debt (Phases 96-101) — feature-complete 2026-04-25, NOT TAGGED — [archive](./milestones/v1.7.2-ROADMAP.md)
- v1.7.1 — pf2-locale-ru Migration (Phases 90-95) — feature-complete 2026-04-25, NOT TAGGED — [archive](./milestones/v1.7.1-ROADMAP.md)
- v1.7.0 — Monster Translation (Phases 84-89) — shipped 2026-04-24, tag `v1.7.0` — [archive](./milestones/v1.7.0-ROADMAP.md)
- v1.6.0 — Spellcasting Deep Fix (Phases 77-83) — archived [v1.6.0-ROADMAP.md](./milestones/v1.6.0-ROADMAP.md)
- v1.5.0 — In-App Updater (Phases 71-76) — archived [v1.5.0-ROADMAP.md](./milestones/v1.5.0-ROADMAP.md)

### Carry-forward architectural invariants

- `createHashRouter` mandatory (no HTML5 history в Tauri WebView)
- FSD: `useShallow` mandatory для Zustand object selectors
- `shared/api/` — единственный Tauri IPC boundary
- Engine остаётся вне FSD, `@engine` alias
- `import.meta.glob` для Drizzle migrations + для vendor pack ingest (`@vendor` alias)
- No IIFE в JSX; derived state через `useMemo`; декомпозиция по FSD (`lib → model → ui`)
- Translation IPC boundary: `shared/api/translations.ts` — единственный consumer DB translations; `shared/i18n/use-content-translation.ts` — единственный React-hook
- `entity_items` table denormalization для id-based item RU lookup (Phase 102)
- LICENSES requirement: vendor pack additions требуют OGL Section 15 update + COPYRIGHT chain check

### v1.7.x Translation Architecture (current state)

**Vendor:** `pf2-locale-ru/pf2e/packs/*.json` (Babele format) — 72 packs total в repo, **19 ingested** (base PF2e content); 50+ AP-specific packs **NOT ingested** → v1.7.5 scope.

**Pipeline:** vendor pack → `pack-adapter.ts` → `MonsterStructuredLoc | SpellStructuredLoc | ItemStructuredLoc` → DB `translations.structured_json` → `useContentTranslation` hook → UI render через SafeHtml + dictionary getters (TraitPill, getTraitLabel, getSkillLabel, etc.).

**Per-instance items:** Pack `entries.<creature>.items[]` array содержит {id, name, description?} для weapons + special abilities. Phase 102 `entity_items` table denormalizes id→name lookup для weapons. **Special abilities (kind=action items с description) НЕ маппятся** на ability rows → English fallback в AbilityCard / strike row → v1.7.5 scope.

### v1.7.4 Known Tech Debt → v1.7.5 Scope

1. AP-specific bestiaries packs (`outlaws-of-alkenstar-bestiary`, `abomination-vaults-bestiary`, etc., 50+ файлов) НЕ ingested → монстры рендерятся EN с 🚫RU несмотря на наличие RU в vendor
2. Item-id RU lookup только для weapons из base packs
3. Special ability descriptions (Brute Strength, Финт негодяя, Внезапная атака) НЕ переведены — даже когда есть в pack `entries.<creature>.items[]`
4. AP-specific spell entries в bestiary `items[]` (kind=spell) не подхватываются как spell rows

Reference repro: `"Lucky" Lanks` из `outlaws-of-alkenstar-bestiary.json` — full RU entry в vendor (name "Счастливчик Лэнкс" + 9 items + 2 abilities), но рендерится EN с 🚫RU badge.

### Pending Todos

- Push накопленные v1.7.1-v1.7.4 commits на origin/master — ожидание решения пользователя
- Tag всех v1.7.x после v1.7.5 (combined release decision)

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260425-ayz | Multi-encounter `.pathmaid` export bundle + adapt import + file picker | 2026-04-25 | 2c8ea780 | [260425-ayz-pathmaid-pathmaid-file-picker](./quick/260425-ayz-pathmaid-pathmaid-file-picker/) |
| 260425-bq2 | Degree-of-success highlights (bold + PF2e color) in spell/item/ability descriptions | 2026-04-25 | 8d882a88 | [260425-bq2-highlight-degree-of-success-labels-bold-](./quick/260425-bq2-highlight-degree-of-success-labels-bold-/) |

## Session Continuity

Last session: 2026-04-26
Stopped at: v1.7.5 milestone init — cleanup completed, REQUIREMENTS.md pending
Next step: Probe v1.7.5 scope details → write REQUIREMENTS.md → spawn roadmapper → commit kickoff → `/gsd-discuss-phase 109` или `/gsd-plan-phase 109`.
