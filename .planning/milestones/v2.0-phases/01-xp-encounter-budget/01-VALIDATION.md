---
phase: 01
slug: xp-encounter-budget
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (~2.x) |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/pf2e/__tests__/xp.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | XP-01 | unit | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | XP-02 | unit | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | XP-03 | unit | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | XP-04 | unit | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | XP-05 | unit | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | XP-06 | unit | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/pf2e/__tests__/xp.test.ts` — stubs for XP-01 through XP-06
- [ ] `src/lib/pf2e/` directory — create before writing any files

*Existing infrastructure covers test framework (vitest already installed).*

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
