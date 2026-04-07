---
phase: 02
slug: damage-constants-types
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.8 |
| **Config file** | `vite.config.ts` (project root, `test` key) |
| **Quick run command** | `npx vitest run src/lib/pf2e/__tests__/damage.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/pf2e/__tests__/damage.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DMG-01 | unit | `npx vitest run src/lib/pf2e/__tests__/damage.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | DMG-02 | unit | `npx vitest run src/lib/pf2e/__tests__/damage.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | DMG-03 | unit | `npx vitest run src/lib/pf2e/__tests__/damage.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/pf2e/__tests__/damage.test.ts` — stubs for DMG-01, DMG-02, DMG-03
- [ ] `src/lib/pf2e/damage.ts` — implementation file

*Existing infrastructure covers framework and config — no new tooling needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TypeScript interfaces compile | DMG-03 | Compile-time only; no runtime representation | Run `npx vue-tsc --noEmit` and verify zero errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
