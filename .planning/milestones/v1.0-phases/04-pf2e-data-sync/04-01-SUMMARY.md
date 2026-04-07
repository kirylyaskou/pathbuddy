---
phase: 04-pf2e-data-sync
plan: 01
subsystem: infra
tags: [rust, tauri, reqwest, zip, filesystem, commands]

# Dependency graph
requires:
  - phase: 03-tauri-sqlite-foundation
    provides: lib.rs plugin registrations (sql, http, fs), Cargo.toml with reqwest/zip crates
provides:
  - Six Rust #[command] functions for file I/O (download_file, extract_zip, glob_json_files, read_text_file, remove_dir, remove_file)
  - invoke_handler registration in lib.rs for all six commands
  - path:allow-temp-dir capability enabling tempDir() API
affects: [04-pf2e-data-sync]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Thin Rust I/O layer: Rust handles filesystem+network, TypeScript owns sync logic
    - Forward-slash path normalization in glob_json_files for Windows compatibility
    - Single generate_handler! macro call for all commands (only one invoke_handler allowed)

key-files:
  created:
    - src-tauri/src/commands.rs
  modified:
    - src-tauri/src/lib.rs
    - src-tauri/capabilities/default.json

key-decisions:
  - "glob_json_files uses recursive collect_json_files helper with to_string_lossy().replace('\\', '/') for Windows path normalization"
  - "download_file uses reqwest::get() directly (follows GitHub 302 redirects automatically, not the Tauri HTTP plugin)"
  - "extract_zip uses archive.extract() from the zip crate — no custom extraction logic"

patterns-established:
  - "Rust thin I/O commands: all file/network ops in Rust, TypeScript owns business logic"
  - "Path normalization at Rust boundary: always return forward-slash paths from glob_json_files"

requirements-completed: [SYNC-02]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 4 Plan 01: Rust I/O Command Layer Summary

**Six Rust #[command] I/O helpers registered in lib.rs for file download, ZIP extraction, recursive JSON glob with Windows path normalization, and cleanup**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T20:02:17Z
- **Completed:** 2026-03-19T20:03:25Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `src-tauri/src/commands.rs` with six Rust command functions covering the full I/O surface the TypeScript sync service needs
- Registered all six commands via a single `generate_handler![]` call in lib.rs, preserving existing sql/http/fs plugin registrations
- Added `path:allow-temp-dir` capability to `default.json` so `tempDir()` from `@tauri-apps/api/path` works at runtime

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Rust commands module with six I/O helper commands** - `9347cec` (feat)
2. **Task 2: Register commands in lib.rs and add path:allow-temp-dir capability** - `83be534` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `src-tauri/src/commands.rs` - Six `#[tauri::command]` functions: download_file (reqwest redirect-safe), extract_zip (zip crate), glob_json_files (recursive walk + forward-slash normalization), read_text_file, remove_dir, remove_file
- `src-tauri/src/lib.rs` - Added `mod commands;` and `.invoke_handler(tauri::generate_handler![...])` with all six commands
- `src-tauri/capabilities/default.json` - Added `path:allow-temp-dir` permission for `tempDir()` API

## Decisions Made

- `glob_json_files` uses a recursive helper `collect_json_files` instead of `_pattern` parameter from plan.txt — the pattern was not needed since TypeScript filters the returned file list. Path separator normalization via `to_string_lossy().replace('\\', '/')` handles Windows backslashes.
- `download_file` uses `reqwest::get()` (follows up to 10 redirects by default) rather than any custom redirect logic or the Tauri HTTP plugin — required for GitHub `zipball_url` 302-to-S3 redirect chain.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Rust I/O command layer complete; TypeScript sync service (Plan 02) can now invoke all six commands via `invoke()`
- `path:allow-temp-dir` capability is in place; `tempDir()` calls will succeed at runtime
- No blockers for Plan 02

---
*Phase: 04-pf2e-data-sync*
*Completed: 2026-03-19*
