---
phase: 04-pf2e-data-sync
plan: 02
subsystem: database
tags: [drizzle-orm, sqlite, web-crypto, sha-256, tauri, pf2e, sync, vitest, tdd]

# Dependency graph
requires:
  - phase: 04-pf2e-data-sync-01
    provides: Rust I/O commands (download_file, extract_zip, glob_json_files, read_text_file, remove_dir, remove_file) registered via invoke_handler
  - phase: 03-tauri-sqlite-foundation
    provides: Drizzle sqlite-proxy db instance, getSqlite(), pf2eEntities and syncState schema tables

provides:
  - syncPacks() orchestration function implementing full GitHub-to-SQLite sync pipeline
  - computeHash() SHA-256 hashing via Web Crypto API
  - extractPackName() two-segment packs/pf2e path parsing
  - isValidEntity() type guard for Foundry document validation
  - shouldSkipFile() underscore-prefix filter
  - SyncProgress and SyncResult TypeScript interfaces
  - 20 unit tests covering all pure utility functions

affects:
  - 04-pf2e-data-sync-03 (cross-reference queries will use pf2eEntities populated by syncPacks)
  - 07-sync-ui (SyncProgress and SyncResult types used by sync UI components)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD red-green pattern: test file written and confirmed failing before implementation"
    - "Web Crypto SHA-256: crypto.subtle.digest with TextEncoder for TS-side hashing"
    - "Two-segment path match for pack extraction: find packs/pf2e sequence, not indexOf(pf2e)"
    - "Per-batch SQLite transactions: BEGIN/COMMIT via getSqlite().execute() wrapping 500-entity batches"
    - "Drizzle setWhere for conditional upsert: only update rows when content_hash differs"
    - "importedKeys Set for post-import deletion diff: O(n) membership check"
    - "Single-row syncState replacement: db.delete() then db.insert() for atomic state update"
    - "Cleanup in finally block: temp file removal always runs even on error"

key-files:
  created:
    - src/lib/sync-service.ts
    - src/lib/__tests__/sync-service.test.ts
  modified: []

key-decisions:
  - "computeHash uses crypto.subtle (not window.crypto.subtle) for Node/jsdom test compatibility"
  - "extractPackName uses two-segment packs/pf2e loop search — indexOf('pf2e') matches root folder name"
  - "isValidEntity does not require system object per locked CONTEXT.md decision"
  - "Test file polyfills globalThis.crypto with node:crypto/webcrypto for jsdom environment"
  - "syncPacks filters to /packs/pf2e/ path segment before processing to exclude non-pack JSON files"

patterns-established:
  - "Pattern: Web Crypto polyfill at top of test file before any imports using crypto.subtle"
  - "Pattern: Drizzle onConflictDoUpdate with sql`excluded.{column}` references in set + setWhere condition"
  - "Pattern: Rust I/O commands invoked via @tauri-apps/api/core invoke() for file system operations"

requirements-completed: [SYNC-01, SYNC-03, SYNC-04]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 4 Plan 02: PF2e Sync Service Summary

**TypeScript sync orchestration service with Web Crypto SHA-256 hashing, Drizzle conditional upsert (setWhere), batched SQLite transactions, and 20 unit tests for all pure utility functions**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T20:05:52Z
- **Completed:** 2026-03-19T20:08:04Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments

- Implemented complete syncPacks() pipeline: GitHub release check, ZIP download via Rust invoke, extraction, JSON file walking with filtering, SHA-256 hashing, batched upsert with content-hash change detection, deletion of removed entities, sync_state replacement, temp cleanup
- Exported four pure utility functions (computeHash, extractPackName, isValidEntity, shouldSkipFile) fully unit-tested with 20 passing tests
- Used two-segment path search `parts[i] === 'packs' && parts[i+1] === 'pf2e'` to correctly extract pack names from GitHub ZIP archive paths — avoids the documented anti-pattern of indexOf('pf2e') which matches the root folder name

## Task Commits

Each task was committed atomically:

1. **Task 1: sync-service.ts with full sync pipeline and tests** - `5207841` (feat)

**Plan metadata:** (final docs commit — recorded below after state updates)

_Note: TDD task — test file written and confirmed failing before implementation_

## Files Created/Modified

- `src/lib/sync-service.ts` - Full sync pipeline with syncPacks(), computeHash(), extractPackName(), isValidEntity(), shouldSkipFile(), SyncProgress, SyncResult
- `src/lib/__tests__/sync-service.test.ts` - 20 unit tests for all pure utility functions; includes node:crypto webcrypto polyfill for jsdom environment

## Decisions Made

- `computeHash` uses bare `crypto.subtle` (not `window.crypto.subtle`) so it works in both jsdom test environment and Tauri WebView without modification
- Test file places `webcrypto` polyfill before module imports to ensure `globalThis.crypto.subtle` is available when sync-service.ts loads in the jsdom environment
- `extractPackName` iterates with two-segment match rather than lastIndexOf — more explicit and matches the documented reasoning in RESEARCH.md
- `syncPacks` filters `allFiles` to those containing `/packs/pf2e/` before processing to avoid inadvertently importing other JSON files in the GitHub archive (e.g., package.json at repo root)

## Deviations from Plan

None - plan executed exactly as written. All acceptance criteria met on first implementation.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required for this plan. Runtime sync requires network access and valid `path:allow-temp-dir` capability (documented in RESEARCH.md Pitfall 2, added in Plan 01 capability updates).

## Next Phase Readiness

- syncPacks() is fully implemented and callable from any Vue component or composable
- SyncProgress and SyncResult types exported for Phase 7 sync UI
- All pure functions tested; syncPacks() Tauri integration requires real runtime (not testable in Vitest)
- Phase 4 Plan 03 (cross-reference queries) can build on pf2eEntities table populated by syncPacks()

## Self-Check: PASSED

- src/lib/sync-service.ts: FOUND
- src/lib/__tests__/sync-service.test.ts: FOUND
- .planning/phases/04-pf2e-data-sync/04-02-SUMMARY.md: FOUND
- Commit 5207841: FOUND

---
*Phase: 04-pf2e-data-sync*
*Completed: 2026-03-19*
