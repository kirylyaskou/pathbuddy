---
phase: 02
slug: types-utilities-and-query-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test --run` |
| **Full suite command** | `pnpm test --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run`
- **After every plan wave:** Run `pnpm test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | family-path-check | manual | spot-check SQL | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | migration-v3 | unit | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | schema-family | unit | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | getHpAdjustment | unit | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | getAdjustedLevel | unit | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | filterEntities | unit | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | filterEntities-fts | unit | `pnpm test --run` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | compendium-route | unit | `pnpm test --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/weak-elite.test.ts` — stubs for getHpAdjustment + getAdjustedLevel (12 bracket boundaries + 4 edge cases)
- [ ] `src/lib/__tests__/entity-query.test.ts` — stubs for filterEntities (list-all, FTS5+filter, each filter axis)
- [ ] `src/lib/__tests__/migrations.test.ts` — stub for migration v3 smoke test (if not already covered)

*Existing vitest infrastructure is already installed — no framework install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `$.system.details.family` path correctness | migration v3 safety | Requires spot-check against production 28K-row SQLite DB before DDL is written | Run: `SELECT json_extract(raw_data, '$.system.details.family') as family FROM pf2e_entities WHERE entity_type = 'creature' LIMIT 20` in the running app's DB; confirm non-null values before writing migration |
| FTS5 triggers survive table drop/rename | migration v3 integrity | Requires live DB inspection post-migration | After migration runs: `SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'pf2e_fts%'` — all 3 triggers must be present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
