---
gsd_state_version: 1.0
milestone: null
milestone_name: null
status: between_milestones
stopped_at: "v1.4.0 shipped and archived; awaiting /gsd-new-milestone for v1.5.0"
last_updated: "2026-04-20T00:00:00Z"
last_activity: 2026-04-20
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# STATE.md - PathMaid (Pathfinder 2e DM Assistant)

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-20)

**Core value:** Feature-complete PF2e DM tool — accurate game logic engine powering a React frontend with real Foundry VTT data, extended with manual spell effect application, homebrew creature authoring, and Paizo iconics/pregens as ready-to-use PC+NPC library.
**Current focus:** Planning v1.5.0 — run `/gsd-new-milestone` to define scope.

## Current Position

Milestone: v1.4.0 shipped 2026-04-20 — archived to `.planning/milestones/v1.4.0-*`
Last activity: 2026-04-20 — `/gsd-complete-milestone v1.4.0` done; git tag v1.4.0 created
Next: `/gsd-new-milestone` to start v1.5.0

Progress: (between milestones)

## v1.4.0 Phase Map

| Phase | Name | Reqs | Depends on | Parallel-safe? |
|-------|------|------|------------|----------------|
| 65 | Rule Engine Expansion | RULE-01..06 (6) | — | — |
| 66 | Predicate Evaluator | PRED-01..04 (4) | Phase 65 | No |
| 67 | Spellcasting UX Unification | SPELLCAST-U-01..02 (2) | — | Yes (UI only) |
| 68 | Cast → Target → Apply Flow | APPLY-01..04 (4) | Phase 67 | No |
| 69 | Encounter Export | EXPORT-01..02 (2) | — | Yes (independent) |
| 70 | Paizo Library Import | LIBRARY-01..04 (4) | — | Yes (sync pipeline) |

Independent chains: {65 → 66}, {67 → 68}, {69}, {70}. Up to 4 worktrees can run in parallel if file-overlap check passes.

## Performance Metrics

**Velocity:**

- Total plans completed: 70 (all prior milestones)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 42 | 2 | - | - |
| 43 | 1 | - | - |
| 51 | 3 | - | - |
| 52 | 7 | - | - |

## Accumulated Context

### v1.4.0 Design Notes

- Rule Engine Expansion is the largest category (6 reqs). Kept as single phase — splitting by rule type creates artificial seams since all rule types share the same pipeline entry point.
- Predicate Evaluator (PRED) separated from RULE because it is an orthogonal layer that sits on top of the rule pipeline. Sequencing 65 → 66 ensures the rule-type machinery exists before the evaluator plugs into it.
- Spellcasting UX Unification (67) is a pure component extraction. Cast→Target→Apply (68) lives on top of that same editor surface, hence the 67→68 dep.
- Encounter Export (69) and Paizo Library Import (70) are independent — no shared files with the other chains.
- Paizo Library keeps sync ingestion + UI surfacing + source filter inside one phase because splitting would create an unobservable half-state (data imported but not browseable).

### v1.3.0 Open Questions — RESOLVED 2026-04-18

- **Phase 62 (Spellcasting UX) — Q1 → C:** Foundry-style strike-through. Prepared spell помечается как "consumed for the day" при касте; снимается вручную через Edit-режим или по Refresh (который сбрасывает tab к template snapshot). Пережимает выход из live-combat; сбросится только через Refresh или Edit.
- **Phase 63 (Combat Entry + Refresh) — Q2 → A:** Template snapshot **включает** staging pool. При Refresh staged-креатуры откатываются обратно к состоянию, в котором энкаунтер пришёл из builder. Snapshot берётся в момент Load into combat.
- **Phase 64 (Encounter Import) — Q3 → A:** Modal dialog на `/encounters` page. Кнопка "Import" рядом с "New Encounter". Простой form-factor, без отдельного route.

### Decisions

Recent decisions affecting current work:

- [Phase 60 P01]: case 'attack' in resolveSingleSelector maps to strike-attack | melee-strike-attack | spell-attack intersection (D-01, D-02)
- [Phase 60 P01]: spell-attack virtual slug added to allStatSlugs in CreatureStatBlock and ALL_STAT_SLUGS in PCCombatCard (D-03)
- [Phase 60 P01]: case 'class-dc' returns [] for NPC — graceful no-op, PC integration deferred to v1.4+ (D-08)
- [Phase 60 P01]: case 'damage' returns [] — FlatModifier damage handled in engine/damage/ separately, not via stat modifier pipeline (D-09)

Full decision log: PROJECT.md Key Decisions table.

### Carry-forward architectural invariants

- VALUED_CONDITIONS includes dying/wounded; dying/wounded cascade gates on has() before delete
- Group exclusivity: clear all group members except new slug, then set
- vitality/void used instead of positive/negative energy — PF2e Remaster taxonomy
- @engine path alias (two tsconfig entries: @engine → index.ts, @engine/* → engine/*); single barrel export
- createHashRouter mandatory (no HTML5 history in Tauri WebView)
- FSD architecture; useShallow mandatory for Zustand object selectors
- shared/api/ is sole Tauri IPC boundary — all invoke() centralized there
- Engine stays outside FSD, consumed via @engine alias
- ConditionManager: module-level Map pattern, NOT in React/Zustand state
- import.meta.glob for Drizzle migrations (Node.js fs crashes in WebView)
- resolveFoundryTokens() called before stripHtml() at all sanitization call sites

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-04-19T00:00:00.000Z
Stopped at: v1.4.0 roadmap created — phases 65-70 mapped, REQUIREMENTS.md traceability filled (22/22, 100%)
Next step: `/gsd-plan-phase 65` (Rule Engine Expansion — largest/earliest, engine-only, unblocks Phase 66)

Resume file: None
