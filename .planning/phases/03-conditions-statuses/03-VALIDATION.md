---
phase: 3
slug: conditions-statuses
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler (tsc) — no test framework installed per project decision |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit`
- **Before `/gsd:verify-work`:** Full compilation must be clean (zero errors)
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | ENG-01 | compilation | `npx tsc --noEmit` | N/A | pending |

*Status: pending · green · red · flaky*

*Note: Tests intentionally removed per project decision — breaking changes expected. Verification is TypeScript compilation + manual review of condition behavior against refs/ JSON.*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. TypeScript compiler is already configured. No test framework needed per project decision.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Condition effect modifiers match refs/ JSON values | ENG-01 | No test framework; verified by code review against refs/ source | Compare each CONDITION_EFFECTS entry against corresponding refs/pf2e/conditions/*.json |
| Grant chains produce correct condition additions | ENG-01 | No test framework | Verify Grabbed grants Off-Guard + Immobilized, Dying grants Unconscious, Paralyzed grants Off-Guard |
| Override mechanic removes correct conditions | ENG-01 | No test framework | Verify Blinded removes Dazzled, Stunned removes Slowed |
| Death progression threshold: dying >= (4 - doomed) = dead | ENG-01 | No test framework | Verify deathDoor creatures with doomed interact correctly |
| Condition immunity blocks add() for immune creatures | ENG-01 | No test framework | Verify creature with paralyzed immunity cannot receive paralyzed condition |
| all-damage resistance matches any damage type in applyIWR() | ENG-01 | No test framework | Verify all-damage resistance reduces fire, cold, etc. |

---

## Validation Sign-Off

- [ ] All tasks have compilation verify
- [ ] Sampling continuity: tsc runs after every task
- [ ] Wave 0: N/A — no test framework needed
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
