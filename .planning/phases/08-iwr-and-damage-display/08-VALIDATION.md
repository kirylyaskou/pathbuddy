---
phase: 08
slug: iwr-and-damage-display
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.8 + @vue/test-utils 2.4.6 |
| **Config file** | `vitest.config.ts` (jsdom environment, globals: true) |
| **Quick run command** | `npm test -- --reporter=dot src/components/__tests__/StatBlock.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=dot src/components/__tests__/StatBlock.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | IWR-01 | unit | `npm test -- src/components/__tests__/StatBlock.test.ts` | Yes (extend) | ⬜ pending |
| 08-01-02 | 01 | 1 | IWR-01 | unit | same | Yes (extend) | ⬜ pending |
| 08-01-03 | 01 | 1 | IWR-01 | unit | same | Yes (extend) | ⬜ pending |
| 08-01-04 | 01 | 1 | IWR-01 | unit | same | Yes (extend) | ⬜ pending |
| 08-01-05 | 01 | 1 | IWR-01 | unit | same | Yes (extend) | ⬜ pending |
| 08-02-01 | 02 | 1 | DMG-01 | unit | same | Yes (extend) | ⬜ pending |
| 08-02-02 | 02 | 1 | DMG-01 | unit | same | Yes (extend) | ⬜ pending |
| 08-02-03 | 02 | 1 | DMG-01 | unit | same | Yes (extend) | ⬜ pending |
| 08-02-04 | 02 | 1 | DMG-01 | unit | same | Yes (extend) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. `StatBlock.test.ts` exists with established mock infrastructure (`makeRawData()`, `makeMeleeItem()` helpers). New tests are additions to the existing describe block — helpers need IWR fields and `damageRolls` fields added to their shape.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| IWR visual styling (crimson/emerald colors) | IWR-01 | CSS color verification needs visual confirmation | Open stat block for creature with weaknesses/resistances, verify crimson for weakness values, emerald for resistance values |
| Damage category icon appearance | DMG-01 | SVG rendering needs visual confirmation | Open creature stat block, verify sword/flame/circle icons appear next to strike damage entries |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
