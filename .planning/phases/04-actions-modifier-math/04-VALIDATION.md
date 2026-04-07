---
phase: 4
slug: actions-modifier-math
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — tests intentionally removed per project decision (breaking changes expected) |
| **Config file** | none |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit`
- **Before `/gsd:verify-work`:** TypeScript compilation must pass
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | ENG-02 | typecheck | `npx tsc --noEmit` | N/A | ⬜ pending |
| TBD | TBD | TBD | ENG-03 | typecheck | `npx tsc --noEmit` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Note: No unit tests — project policy is no test maintenance during pre-alpha. Validation relies on TypeScript type checking and acceptance criteria verification.*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework to scaffold — TypeScript compiler is the sole automated validation tool.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Modifier stacking matches Foundry VTT | ENG-03 | No test framework; requires comparison against reference | Manually verify applyStackingRules() output for typed/untyped combinations against Foundry source |
| All 545 action entries present | ENG-02 | Count verification | `grep -c "actionType" engine/actions/action-data.ts` should show 545 entries |
| Outcome descriptors for ~40 combat actions | ENG-02 | Content completeness | Verify each combat action in action-outcomes.ts has all 4 degree-of-success keys |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
