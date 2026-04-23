---
gsd_state_version: 1.0
milestone: v1.6.0
milestone_name: — Spellcasting Deep Fix
status: shipped
stopped_at: v1.6.0 archived and tagged
last_updated: "2026-04-23T15:00:00Z"
last_activity: 2026-04-23 -- v1.6.0 archived + v1.5.0 retroactive archive + MILESTONES.md created
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 32
  completed_plans: 14
  percent: 100
---

# STATE.md - PathMaid (Pathfinder 2e DM Assistant)

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-23 after v1.6.0 shipping)

**Core value:** Точность + скорость — чистый TS engine для PF2e-математики + React frontend с live Foundry-данными.
**Current focus:** v1.7.0 планирование (запустить `/gsd-new-milestone`).

## Current Position

Milestone: v1.6.0 → SHIPPED 2026-04-23
Tag: v1.6.0 (и v1.5.0 retroactive если отсутствует)
Next: `/gsd-new-milestone` для v1.7.0

Progress: [██████████] 100% (7/7 v1.6.0 phases)

## Accumulated Context

### Shipped Milestones

- v1.6.0 — Spellcasting Deep Fix (Phases 77-83) — archived [v1.6.0-ROADMAP.md](./milestones/v1.6.0-ROADMAP.md), audit [v1.6.0-MILESTONE-AUDIT.md](./milestones/v1.6.0-MILESTONE-AUDIT.md)
- v1.5.0 — In-App Updater (Phases 71-76) — archived retroactively [v1.5.0-ROADMAP.md](./milestones/v1.5.0-ROADMAP.md)

### Carry-forward architectural invariants

- `createHashRouter` mandatory (no HTML5 history в Tauri WebView)
- FSD: `useShallow` mandatory для Zustand object selectors
- `shared/api/` — единственный Tauri IPC boundary
- Engine остаётся вне FSD, `@engine` alias
- `import.meta.glob` для Drizzle migrations
- No IIFE в JSX; derived state через `useMemo`; декомпозиция по FSD (`lib → model → ui`)

### Known Tech Debt (v1.6.0 audit carryover)

См. [`.planning/milestones/v1.6.0-MILESTONE-AUDIT.md`](./milestones/v1.6.0-MILESTONE-AUDIT.md):

- Migration 0038 collision — `0038_translations.sql` (v1.5.1-1.5.3 RU branch) vs `0038_spell_overrides_heightened.sql` (Phase 79). Convention violated, но ordering стабилен.
- `use-spellcasting.ts` = 119 строк (goal было <100).
- Нет per-phase SUMMARY.md / VERIFICATION.md для фаз 77-83 (inline plans).
- 4 post-milestone hotfixes (UAT gap в Phase 79/81 scope на description rendering).

### Pending Todos

None (milestone closed).

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260422-rh9 | Add Recall Knowledge DC display to CreatureStatBlock | 2026-04-22 | 168e89f0 | _archived with v1.6.0_ |

## Session Continuity

Last session: 2026-04-23
Stopped at: v1.6.0 shipped, archived, tagged. Worktree: claude/upbeat-goldstine-a7bee2 merged into master.
Next step: `/gsd-new-milestone` for v1.7.0 scoping.
