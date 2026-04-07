---
plan: "47-01"
phase: 47
status: complete
commit: fff8e2af
---

# Summary: Plan 47-01 — Rebrand PathBuddy → PathMaid

## What Was Built

Mechanical text replacement across 8 files replacing all "PathBuddy"/"pathbuddy" references with "PathMaid"/"pathmaid". No architecture or logic changes.

## key-files

### modified
- src-tauri/tauri.conf.json — productName, identifier, window title
- package.json — name field
- src-tauri/Cargo.toml — package name, lib name
- src-tauri/src/main.rs — crate call
- src/shared/db/connection.ts — sqlite DB filename + AppData error path
- src/app/SplashScreen.tsx — h1 visible app name
- src/widgets/app-shell/ui/AppSidebar.tsx — sidebar logo text
- src-tauri/src/sync.rs — HTTP user-agent string

## Must-Haves Check

- [x] productName: "PathMaid" in tauri.conf.json
- [x] identifier: "com.pathmaid.app" in tauri.conf.json
- [x] window title: "PathMaid" in tauri.conf.json
- [x] package.json name: "pathmaid"
- [x] Cargo.toml package: "pathmaid", lib: "pathmaid_lib"
- [x] main.rs calls pathmaid_lib::run()
- [x] SQLite DB: sqlite:pathmaid.db
- [x] SplashScreen h1: PathMaid
- [x] AppSidebar span: PathMaid
- [x] sync.rs user-agent: pathmaid/1.1.0

## Self-Check: PASSED

grep -rn "PathBuddy\|pathbuddy" across all modified files → 0 matches
grep -rn "PathMaid\|pathmaid" across all modified files → 12 matches

## Deviations

Also updated AppData error message path in connection.ts (com.pathbuddy.app → com.pathmaid.app) — not in original plan scope but required for zero old-string grep result.
