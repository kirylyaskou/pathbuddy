---
phase: 6
slug: fsd-structure-zustand-stores
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — tests intentionally removed (project policy) |
| **Config file** | None |
| **Quick run command** | `npm run lint && npx tsc --noEmit` |
| **Full suite command** | `npm run lint && npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint && npx tsc --noEmit`
- **After every plan wave:** Run `npm run lint && npx tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-xx | 01 | 1 | ARCH-03 | lint | `npm run lint` (steiger + eslint-plugin-boundaries) | Existing | pending |
| 06-01-xx | 01 | 1 | ARCH-05 | grep | `grep -r "invoke(" src --include="*.ts" --include="*.tsx" \| grep -v "shared/api/"` | N/A | pending |
| 06-01-xx | 01 | 1 | ARCH-06 | typecheck | `npx tsc --noEmit` | Existing | pending |
| 06-01-xx | 01 | 1 | ARCH-04 | manual | Code review — semantic data ownership rule | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `npm install zustand immer` — required before any store file is created

*No test files needed — project has no test suite by design.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Entity stores hold only serializable SQLite-derived data | ARCH-04 | Semantic rule about data content, not import direction — no linter can enforce | Review each entity store: verify state fields are serializable primitives/arrays, no functions/Maps/Sets/class instances |
| Feature stores hold only session runtime state | ARCH-04 | Same — data ownership is semantic | Review each feature store: verify state fields represent session/in-memory data, not SQLite-derived entities |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
