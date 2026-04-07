---
phase: 1
slug: bug-fix-and-ui-improvements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.8 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | HTTP-01 | manual smoke | `pnpm tauri:dev` + Sync Now | N/A | ⬜ pending |
| 1-01-02 | 01 | 0 | UI-01 | unit | `pnpm test src/components/__tests__/AppLayout.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 0 | UI-02 | unit | `pnpm test src/components/__tests__/AppSidebar.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | UI-03 | unit | `pnpm test src/components/__tests__/CreatureCard.test.ts` | ✅ update | ⬜ pending |
| 1-02-02 | 02 | 1 | UI-04 | unit | `pnpm test src/components/__tests__/HPController.test.ts` | ✅ update | ⬜ pending |
| 1-02-03 | 02 | 1 | UI-05 | unit | `pnpm test src/components/__tests__/ConditionBadge.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-04 | 02 | 1 | UI-06 | unit | `pnpm test src/components/__tests__/ConditionBadge.test.ts` | ❌ W0 | ⬜ pending |
| 1-02-05 | 02 | 1 | STORE-01 | unit | `pnpm test src/stores/__tests__/combat.test.ts` | ✅ update | ⬜ pending |
| 1-03-01 | 03 | 2 | UI-07 | unit | `pnpm test src/views/__tests__/SyncView.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/AppLayout.test.ts` — stubs for UI-01 (sidebar + RouterView render)
- [ ] `src/components/__tests__/AppSidebar.test.ts` — stubs for UI-02 (nav items, active class, routes)
- [ ] `src/components/__tests__/ConditionBadge.test.ts` — stubs for UI-05, UI-06 (badge render, toggle, value display)
- [ ] `src/views/__tests__/SyncView.test.ts` — stubs for UI-07 (page structure, sync button)
- [ ] Update `src/components/__tests__/CreatureCard.test.ts` — replace `border-blue-500` assertion with `border-gold` (active turn class change)
- [ ] Update `src/components/__tests__/HPController.test.ts` — add tests for amount input; verify default amount=1 still emits delta=-1/+1

*Existing infrastructure covers base framework needs — Vitest 2.1.8 already installed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sync Now unblocked after HTTP scope fix | HTTP-01 | Runtime Tauri HTTP plugin — cannot mock the capability scope in unit tests | Run `pnpm tauri:dev`, navigate to Sync page, click Sync Now, verify no scope error in console |
| Dark fantasy palette renders correctly | UI-VISUAL | CSS visual output cannot be asserted via unit tests | Run dev server, verify charcoal backgrounds, gold accents, Cinzel headings in browser |
| Gold glow on active creature turn | UI-VISUAL | Box-shadow + ring CSS effects require visual inspection | Run dev server, add creature, click Next Creature, verify gold border+glow appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
