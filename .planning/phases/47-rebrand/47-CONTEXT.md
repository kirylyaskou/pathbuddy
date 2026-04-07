# Phase 47: Rebrand - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Rename "Pathbuddy" → "PathMaid" across all configs and UI strings. No new features, no architecture changes — purely a find-and-replace pass across specific files.

</domain>

<decisions>
## Implementation Decisions

### SQLite Database Filename
- **D-01:** Rename `sqlite:pathbuddy.db` → `sqlite:pathmaid.db` in `src/shared/db/connection.ts`. Pre-alpha — existing data loss acceptable for consistency.

### App Identifier
- **D-02:** Change `com.pathbuddy.app` → `com.pathmaid.app` in `src-tauri/tauri.conf.json`.

### UI Strings
- **D-03:** Replace "PathBuddy" with "PathMaid" in `src/app/SplashScreen.tsx` and `src/widgets/app-shell/ui/AppSidebar.tsx`.

### Tauri Config
- **D-04:** `productName: PathBuddy` → `PathMaid` in `src-tauri/tauri.conf.json`.

### Package Name
- **D-05:** `"name": "pathbuddy"` → `"name": "pathmaid"` in `package.json`.

### Cargo Crates
- **D-06:** Rename `name = "pathbuddy"` → `"pathmaid"` and `name = "pathbuddy_lib"` → `"pathmaid_lib"` in `src-tauri/Cargo.toml`. Update `main.rs`: `pathbuddy_lib::run()` → `pathmaid_lib::run()`.

### User Agent String
- **D-07:** Update user-agent in `src-tauri/src/sync.rs` from `"pathbuddy/0.3.0"` to `"pathmaid/1.1.0"`.

### Claude's Discretion
- Target/build artifacts under `src-tauri/target/` — auto-generated, not touched manually.
- GitHub remote URL rename (BRAND-03) — explicitly deferred to future milestone per REQUIREMENTS.md.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### Requirements
- `.planning/REQUIREMENTS.md` §BRAND — BRAND-01, BRAND-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None relevant — this phase is purely string/config replacement.

### Established Patterns
- `src/shared/db/connection.ts` — sole SQLite connection point; DB filename set here.
- `src-tauri/tauri.conf.json` — Tauri app metadata (productName, identifier, window title).
- `src-tauri/Cargo.toml` — binary and lib crate names; `main.rs` references lib by name.

### Integration Points
- Cargo.toml crate rename requires updating `src-tauri/src/main.rs` call site.
- DB filename rename is purely a string — no migration needed (pre-alpha, fresh DB acceptable).

</code_context>

<specifics>
## Specific Ideas

No specific requirements — mechanical text replacement per the file list identified in codebase scout.

</specifics>

<deferred>
## Deferred Ideas

- BRAND-03: GitHub repository rename to `path-maid` — deferred, affects remote URLs.

</deferred>

---

*Phase: 47-rebrand*
*Context gathered: 2026-04-07*
