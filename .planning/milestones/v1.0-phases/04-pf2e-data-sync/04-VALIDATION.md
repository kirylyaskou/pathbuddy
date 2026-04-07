---
phase: 4
slug: pf2e-data-sync
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.8 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SYNC-01 | unit | `npm test -- --reporter=verbose src/lib/__tests__/sync-service.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | SYNC-03 | unit | `npm test -- src/lib/__tests__/sync-service.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | SYNC-04 | unit | `npm test -- src/lib/__tests__/sync-service.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | SYNC-02 | manual-only | manual: cargo test or integration test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/sync-service.test.ts` — stubs for SYNC-01, SYNC-03, SYNC-04
  - Test `computeHash()` against known SHA-256 output
  - Test `extractPackName()` with GitHub archive path format
  - Test entity validation logic (skip entities missing `_id`/`name`/`type`)
  - Test filename filter (skip `_folders.json`)
  - Mock `invoke` and `db` for deletion logic test
- [ ] Tauri `invoke` mock in test setup — IPC unavailable in Vitest, must be mocked

*(Existing `src/__tests__/setup.ts` and `global-setup.ts` already configure Pinia and component stubs.)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Rust `download_file` downloads ZIP via redirect chain | SYNC-02 | Requires real Tauri runtime + network | 1. Run app 2. Trigger sync 3. Verify ZIP downloaded to temp dir |
| Rust `extract_zip` extracts archive correctly | SYNC-02 | Requires real Tauri runtime + filesystem | 1. Run app 2. Trigger sync 3. Verify JSON files extracted |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
