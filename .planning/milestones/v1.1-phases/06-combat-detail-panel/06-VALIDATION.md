---
phase: 6
slug: combat-detail-panel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `pnpm test --run` |
| **Full suite command** | `pnpm test --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run`
- **After every plan wave:** Run `pnpm test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | WORK-06 | unit | `pnpm test --run src/__tests__/StatBlock.spec.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | WORK-06 | unit | `pnpm test --run src/__tests__/CombatDetailPanel.spec.ts` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 2 | WORK-06 | unit | `pnpm test --run src/__tests__/CombatView.spec.ts` | ❌ W0 | ⬜ pending |
| 06-01-04 | 01 | 2 | WORK-06 | unit | `pnpm test --run src/__tests__/CombatView.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/StatBlock.spec.ts` — unit tests for extracted StatBlock component (prop-driven rendering, no store dependency)
- [ ] `src/__tests__/CombatDetailPanel.spec.ts` — unit tests for CombatDetailPanel (empty state, live overlay fields, stat block display)
- [ ] `src/__tests__/CombatView.spec.ts` — unit tests for CombatView row-click wiring (select event → detail panel population, no slide-over triggered)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Slide-over NOT triggered on row click | WORK-06 SC3 | Requires visual inspection of DOM overlay state | Click a combat tracker row; confirm no overlay covers the combat tracker |
| Live combat state updates in panel | WORK-06 SC2 | Requires reactive combat store mutations in running session | Modify HP/conditions in combat; confirm right panel reflects changes without page reload |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
