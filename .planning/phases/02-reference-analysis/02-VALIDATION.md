---
phase: 2
slug: reference-analysis
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — this phase produces documentation only, no code changes |
| **Config file** | none |
| **Quick run command** | `test -f .planning/phases/02-reference-analysis/GAP-ANALYSIS.md && echo OK` |
| **Full suite command** | `npm run typecheck` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `test -f .planning/phases/02-reference-analysis/GAP-ANALYSIS.md && echo OK`
- **After every plan wave:** Run `npm run typecheck`
- **Before `/gsd:verify-work`:** GAP-ANALYSIS.md present and covers all domains
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | ANAL-01 | smoke | `test -f .planning/phases/02-reference-analysis/GAP-ANALYSIS.md && echo OK` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | ANAL-02 | smoke | `grep -c "HIGH\|LOWER" .planning/phases/02-reference-analysis/GAP-ANALYSIS.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test infrastructure needed. File-existence checks are sufficient smoke tests for a documentation-only phase.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GAP-ANALYSIS.md covers all 12+ PF2e domains | ANAL-01 | Document completeness requires content review | Verify each domain section (conditions, actions, spells, feats, equipment, etc.) is present with current-vs-missing comparison |
| Priority assignments follow D-06 two-tier system | ANAL-02 | Priority classification requires semantic review | Check that combat-related items are HIGH, downtime items are LOWER |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
