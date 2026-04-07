---
phase: 06
slug: conditions-module
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/lib/pf2e/__tests__/conditions.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/pf2e/__tests__/conditions.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | COND-01 | unit | `npx vitest run src/lib/pf2e/__tests__/conditions.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | COND-02 | unit | `npx vitest run src/lib/pf2e/__tests__/conditions.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | COND-03 | unit | `npx vitest run src/lib/pf2e/__tests__/conditions.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/pf2e/__tests__/conditions.test.ts` — stubs for COND-01, COND-02, COND-03

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
