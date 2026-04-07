---
phase: 5
slug: cross-reference-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.8 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | XREF-01 | unit | `npx vitest run src/lib/__tests__/creature-resolver.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | XREF-01 | unit | `npx vitest run src/lib/__tests__/creature-resolver.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | XREF-01 | unit | `npx vitest run src/lib/__tests__/creature-resolver.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 1 | XREF-01 | unit | `npx vitest run src/lib/__tests__/creature-resolver.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | XREF-02 | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | XREF-02 | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 2 | XREF-02 | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-04 | 02 | 2 | XREF-02 | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-05 | 02 | 2 | XREF-02 | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-06 | 02 | 2 | XREF-02 | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-01 | 02 | 2 | XREF-03 | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-02 | 02 | 2 | XREF-03 | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-03 | 02 | 2 | XREF-03 | component | `npx vitest run src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/creature-resolver.test.ts` — stubs for XREF-01 (pure function unit tests with `vi.mock('@/lib/database')`)
- [ ] `src/components/__tests__/CreatureDetailPanel.test.ts` — stubs for XREF-02 + XREF-03 (component tests with `@vue/test-utils`)
- [ ] `src/stores/__tests__/creatureDetail.test.ts` — stubs for panel state management (open/close/navigate/back)

*No new framework install needed — Vitest + @vue/test-utils already installed and configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Slide-over animation smoothness | XREF-02 | CSS transition timing is visual | Open panel, verify slide-in takes ~250ms, no jank |
| Panel scroll reset on navigation | XREF-02 | Scroll position is visual state | Open creature, scroll down, click canonical link, verify panel scrolls to top |
| Backdrop click dismisses panel | XREF-02 | Click target depends on z-index stacking | Click backdrop area outside panel, verify panel closes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
