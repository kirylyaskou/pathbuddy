---
phase: 6
slug: description-sanitization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.8 + jsdom |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npm test -- --reporter=verbose src/lib/__tests__/description-sanitizer.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose src/lib/__tests__/description-sanitizer.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | DESC-01 | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | DESC-01 | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | DESC-02 | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-04 | 01 | 1 | DESC-02 | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-05 | 01 | 1 | DESC-02 | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-06 | 01 | 1 | DESC-01+02 | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | DESC-01 | unit | `npm test -- src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | DESC-01 | unit | `npm test -- src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/description-sanitizer.test.ts` — stubs for DESC-01, DESC-02 (all sanitizer unit tests)
- [ ] New test cases in `src/components/__tests__/CreatureDetailPanel.test.ts` — stubs for DESC-01 click delegation behavior

*Existing infrastructure covers framework install: Vitest + jsdom + @vue/test-utils + Pinia test setup all present.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual color-coding of damage types | DESC-02 | CSS color rendering needs visual check | Render a creature with @Damage in description, verify color matches type |
| Link click navigates detail panel | DESC-01 | E2E navigation flow | Click @UUID link in description, verify panel navigates to entity |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
