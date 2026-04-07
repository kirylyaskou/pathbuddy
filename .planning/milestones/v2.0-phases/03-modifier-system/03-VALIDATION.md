---
phase: 03
slug: modifier-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^2.1.8 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | MOD-01 | unit | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | MOD-02 | unit | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | MOD-03 | unit | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | MOD-04 | unit | `npx vitest run src/lib/pf2e/__tests__/modifiers.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/pf2e/__tests__/modifiers.test.ts` — stubs for MOD-01, MOD-02, MOD-03, MOD-04

*Existing infrastructure covers framework and fixtures. No new fixtures needed — pure TS, no mocks required.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
