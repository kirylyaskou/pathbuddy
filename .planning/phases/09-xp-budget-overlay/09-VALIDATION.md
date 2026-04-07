---
phase: 09
slug: xp-budget-overlay
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (vitest.config.ts — defineConfig via vite) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/stores/__tests__/encounter.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/stores/__tests__/encounter.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | ENC-01 | unit | `npx vitest run src/stores/__tests__/encounter.test.ts` | Wave 0 | ⬜ pending |
| 09-01-02 | 01 | 1 | ENC-01 | unit | same | Wave 0 | ⬜ pending |
| 09-01-03 | 01 | 1 | ENC-01 | unit | same | Wave 0 | ⬜ pending |
| 09-02-01 | 02 | 1 | ENC-02 | unit | same | Wave 0 | ⬜ pending |
| 09-02-02 | 02 | 1 | ENC-02 | unit | same | Wave 0 | ⬜ pending |
| 09-02-03 | 02 | 1 | ENC-02 | unit | same | Wave 0 | ⬜ pending |
| 09-02-04 | 02 | 1 | ENC-02 | unit | same | Wave 0 | ⬜ pending |
| 09-03-01 | 01 | 1 | ENC-01/02 | unit | `npx vitest run src/stores/__tests__/combat.test.ts` | Exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/stores/__tests__/encounter.test.ts` — stubs for ENC-01 persistence and ENC-02 computed reactivity
- [ ] SQLite mock: `vi.mock` for `@/lib/database` (same approach as existing store tests)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| XP budget bar visual fill | ENC-02 | CSS width percentage rendering | Add 2-3 creatures, verify bar fills proportionally to threat threshold |
| Threat tier pill colors | ENC-02 | Semantic color confirmation | Add creatures to reach each threat tier, verify pill color changes |
| Party config persists across restart | ENC-01 | Requires app restart cycle | Set party level/size, close and reopen app, verify values restored |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
