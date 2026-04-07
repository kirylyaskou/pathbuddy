---
phase: 7
slug: sync-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.8 + jsdom |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npx vitest run src/components/__tests__/SyncButton.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/__tests__/SyncButton.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | SYNCUI-01 | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | W0 | pending |
| 07-01-02 | 01 | 1 | SYNCUI-01 | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | W0 | pending |
| 07-01-03 | 01 | 1 | SYNCUI-02 | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | W0 | pending |
| 07-01-04 | 01 | 1 | SYNCUI-02 | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | W0 | pending |
| 07-01-05 | 01 | 1 | SYNCUI-03 | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | W0 | pending |
| 07-01-06 | 01 | 1 | SYNCUI-03 | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | W0 | pending |
| 07-02-01 | 02 | 2 | SYNCUI-01+02+03 | unit | `npx vitest run src/views/__tests__/DashboardView.test.ts` | W0 | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/SyncButton.test.ts` — stubs for SYNCUI-01, SYNCUI-02, SYNCUI-03 (all SyncButton unit tests)
- [ ] `src/views/__tests__/DashboardView.test.ts` — stubs for dashboard integration (SyncButton rendered within dashboard)

*Existing infrastructure covers framework install: Vitest + jsdom + @vue/test-utils + Pinia test setup all present.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual progress bar animation | SYNCUI-01 | CSS animation rendering | Trigger sync, observe indeterminate/determinate bar transitions |
| Stage pipeline visual layout | SYNCUI-01 | Visual checkmark rendering | Trigger sync, verify completed stages show checkmarks |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
