---
phase: 07
slug: type-foundation-and-condition-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | TYPE-01 | unit | `npx vitest run src/lib/pf2e/__tests__/conditions.test.ts` | ✅ | ⬜ pending |
| 07-01-02 | 01 | 1 | COND-01 | unit | `npx vitest run src/stores/__tests__/combat.test.ts` | ✅ | ⬜ pending |
| 07-01-03 | 01 | 1 | COND-02 | unit | `npx vitest run src/lib/pf2e/__tests__/conditions.test.ts` | ✅ | ⬜ pending |
| 07-02-01 | 02 | 1 | COND-03 | unit+visual | `npx vitest run src/components/__tests__/ConditionBadge.test.ts` | ✅ | ⬜ pending |
| 07-02-02 | 02 | 1 | COND-05 | unit | `npx vitest run src/stores/__tests__/combat.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. vitest + vue-test-utils already installed and configured. 530 existing tests provide regression baseline.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Condition badge visual appearance | COND-03 | Color/layout visual check | Open combat tracker, add creature, apply valued condition (frightened 3), verify badge shows "Frightened 3" with correct styling |
| Condition picker categorization | TYPE-01 | Layout/UX check | Open condition picker, verify 44 conditions organized in category groups |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
