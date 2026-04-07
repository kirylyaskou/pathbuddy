# Phase 4: PF2e Data Sync - Research

**Researched:** 2026-03-19
**Domain:** Tauri 2 Rust commands, GitHub API, ZIP extraction, SQLite upsert, Web Crypto API
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Entity validation:** Skip malformed entities silently. Required fields: `_id`, `name`, `type`. No `system` requirement. JSON parse failure = skip and continue.
- **File filtering:** Skip files with names starting with `_` (e.g., `_folders.json`). Filter by filename first, then validate parsed JSON fields.
- **Content hashing:** Hash raw file bytes (not normalized JSON). Any upstream byte change triggers re-import.
- **Phase boundary:** Backend/data pipeline only. Sync UI is Phase 7. No UI work in this phase.
- **Data source:** `https://github.com/foundryvtt/pf2e` releases via `zipball_url`.
- **No git dependency:** Pure HTTP download.
- **UPSERT strategy:** `ON CONFLICT(pack, slug) DO UPDATE SET ... WHERE content_hash != excluded.content_hash`
- **Batch processing:** Groups of 500
- **Rust commands:** `download_file`, `extract_zip`, `glob_json_files`, `read_text_file`

### Claude's Discretion

- Sync pipeline architecture (Rust commands vs TS orchestration boundary)
- Batch processing size and strategy
- Sync failure/rollback behavior
- Error handling patterns
- SHA-256 implementation approach (Rust-side vs Web Crypto)
- Temp directory management and cleanup
- Pack name extraction logic

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SYNC-01 | User can sync PF2e data from foundryvtt/pf2e GitHub releases | GitHub API research, sync algorithm from plan.txt |
| SYNC-02 | System downloads release ZIP without requiring git on user machine | `reqwest::get()` in Rust handles redirects natively; `zipball_url` redirect chain confirmed |
| SYNC-03 | System upserts entities with content-hash change detection | Drizzle `onConflictDoUpdate` + `setWhere` for conditional update; Web Crypto SHA-256 pattern |
| SYNC-04 | System removes entities deleted from upstream | Delete-after-import pattern using `importedKeys` set; Drizzle `notInArray` or raw SQL approach |
</phase_requirements>

---

## Summary

Phase 4 implements a one-way data sync from the `foundryvtt/pf2e` GitHub repository. The core pipeline is: check latest release tag via GitHub API, download `zipball_url` (~50-80 MB) using a Rust `reqwest` command, extract the ZIP in Rust, then walk `packs/pf2e/**/*.json` files from TypeScript, skip `_`-prefixed files, hash raw bytes (Web Crypto SHA-256), upsert each entity into SQLite via Drizzle, then delete entities no longer in the upstream set, and update `sync_state`.

The architecture is: minimal Rust I/O helpers (`download_file`, `extract_zip`, `glob_json_files`, `read_text_file`) + TypeScript sync orchestration. All schema tables (`pf2e_entities`, `syncState`) are already defined and migrated. Rust crates (`reqwest`, `zip`) are already in `Cargo.toml`. Tauri plugins (`http`, `fs`, `sql`) are already registered in `lib.rs`.

**Primary recommendation:** Follow `plans/plan.txt` Phase 2 algorithm directly. Three adaptations are required: (1) add `path:allow-temp-dir` to capabilities; (2) use Drizzle `setWhere` for conditional upsert; (3) wrap the full import loop in a `BEGIN`/`COMMIT` transaction for performance with 28K inserts.

---

## Standard Stack

### Core (all already installed/registered)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `reqwest` | 0.12 | Rust HTTP download with redirect-following | Already in Cargo.toml; follows GitHub 302 redirects automatically |
| `zip` | 2 | Rust ZIP extraction | Already in Cargo.toml; `archive.extract()` handles nested paths |
| `@tauri-apps/api` | ^2.0.0 | `invoke()`, `tempDir()` | Already installed; standard Tauri 2 IPC bridge |
| `@tauri-apps/plugin-http` | ^2.0.0 | GitHub API JSON fetch (not file download) | Already installed; use only for API calls, not binary downloads |
| `drizzle-orm` | ^0.38.0 | Drizzle upsert with `onConflictDoUpdate` + `setWhere` | Already installed; `setWhere` added in v0.30.9 |
| Web Crypto API | browser built-in | SHA-256 hashing via `crypto.subtle.digest` | Available in Tauri WebView2/WebKit without any dependency |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tauri-apps/api/path` | bundled with api ^2 | `tempDir()` for download destination | Used in sync-service.ts to get temp path |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Web Crypto SHA-256 (TS) | sha256 in Rust, return hex | Rust-side is ~3x faster for large batches, but adds command roundtrip per file (28K roundtrips = worse). TS-side is correct choice. |
| Drizzle `onConflictDoUpdate` | Raw `sqlite.execute()` with `INSERT OR REPLACE` | Drizzle is already the established pattern; raw SQL only if Drizzle limitation is hit |
| `tempDir()` from `@tauri-apps/api/path` | hardcoded app data dir | `tempDir()` is correct — OS-managed, auto-cleaned |

**Installation:** No new packages needed — all already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src-tauri/src/
├── lib.rs           # Add .invoke_handler() with generate_handler!
├── main.rs          # Delegates to lib.rs (unchanged)
└── commands.rs      # New: download_file, extract_zip, glob_json_files, read_text_file

src/lib/
├── database.ts      # Existing — Drizzle sqlite-proxy instance
├── schema.ts        # Existing — pf2eEntities, syncState tables
├── migrations.ts    # Existing — migration runner
└── sync-service.ts  # New: sync orchestration in TypeScript
```

### Pattern 1: Rust I/O Commands (Minimal Surface)

**What:** Four thin Rust commands handle all file system + network I/O. TypeScript owns all logic.
**When to use:** Rust handles what JS cannot do natively in WebView: large binary downloads, ZIP extraction, filesystem glob.

```rust
// src-tauri/src/lib.rs — updated
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::download_file,
            commands::extract_zip,
            commands::glob_json_files,
            commands::read_text_file,
            commands::remove_dir,
            commands::remove_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Source:** Tauri 2 official docs — https://v2.tauri.app/develop/calling-rust/ ; plan.txt Phase 2 Rust commands section.

### Pattern 2: Redirect-Safe File Download via reqwest

**What:** GitHub's `zipball_url` issues a 302 redirect to AWS S3. `reqwest::get()` follows redirects automatically. `@tauri-apps/plugin-http` has documented issues with redirect chains. Always use Rust for the binary download.

```rust
// Source: plan.txt Phase 2 + verified reqwest behavior
#[command]
async fn download_file(url: String, dest_path: String) -> Result<(), String> {
    let response = reqwest::get(&url).await.map_err(|e| e.to_string())?;
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    let mut file = std::fs::File::create(&dest_path).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;
    Ok(())
}
```

Note: `reqwest::get()` uses a default `Client` that follows up to 10 redirects automatically. No extra configuration needed for GitHub `zipball_url`.

### Pattern 3: Drizzle Conditional Upsert with setWhere

**What:** Only update DB rows when content_hash actually changed. Drizzle `setWhere` added in v0.30.9 (April 2024).

```typescript
// Source: https://orm.drizzle.team/docs/guides/upsert
import { sql } from 'drizzle-orm';

const excludedHash = sql.raw(`excluded.${pf2eEntities.contentHash.name}`);

await db.insert(pf2eEntities).values({
  sourceId: data._id,
  pack,
  slug,
  name: data.name,
  entityType: data.type,
  rawData: content,
  contentHash,
  syncedAt: new Date().toISOString(),
}).onConflictDoUpdate({
  target: [pf2eEntities.pack, pf2eEntities.slug],
  set: {
    sourceId: data._id,
    name: data.name,
    entityType: data.type,
    rawData: content,
    contentHash,
    syncedAt: new Date().toISOString(),
  },
  setWhere: sql`${pf2eEntities.contentHash} != ${excludedHash}`,
});
```

### Pattern 4: Web Crypto SHA-256 (TS-side hashing)

**What:** Hash raw file content string using browser-native `crypto.subtle`. Available in Tauri WebView2/WebKit without any dependency.

```typescript
// Source: MDN Web Crypto API — https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
async function computeHash(content: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(content);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
```

### Pattern 5: SQLite Transaction Wrapping for Bulk Insert

**What:** 28K individual IPC roundtrips to SQLite without a transaction wrapper will be extremely slow (each `execute()` auto-commits). Wrapping in `BEGIN`/`COMMIT` via `getSqlite().execute()` reduces write overhead by 100x+.

```typescript
// Source: SQLite performance best practice — wrap batch in single transaction
const sqlite = await getSqlite();
await sqlite.execute('BEGIN', []);
try {
  for (const entity of batch) {
    await db.insert(pf2eEntities).values(entity).onConflictDoUpdate({ ... });
  }
  await sqlite.execute('COMMIT', []);
} catch (err) {
  await sqlite.execute('ROLLBACK', []);
  throw err;
}
```

Apply per-batch (every 500 entities), not as a single transaction across all 28K (too large; risk of OOM or timeout).

### Pattern 6: Pack Name Extraction

**What:** GitHub ZIP archives have a root folder like `foundryvtt-pf2e-abc1234/`. The `pf2e` directory is nested at `{root}/packs/pf2e/{packName}/`. Extract pack name by finding the `pf2e` segment index.

```typescript
// Source: plan.txt Phase 2
function extractPackName(filePath: string): string {
  const parts = filePath.split('/');
  const pf2eIdx = parts.lastIndexOf('pf2e'); // use lastIndexOf — root folder may contain 'pf2e'
  return pf2eIdx >= 0 && pf2eIdx + 1 < parts.length
    ? parts[pf2eIdx + 1]
    : 'unknown';
}
```

Note: `parts.indexOf('pf2e')` from plan.txt would find the first occurrence (root folder name `foundryvtt-pf2e-xxx`). Use `lastIndexOf` or specifically look for `packs/pf2e` sequence.

### Pattern 7: Deletion of Removed Entities

**What:** After importing, delete entities whose `pack::slug` key is no longer in the upstream set.

```typescript
// Source: plan.txt Phase 2 algorithm
import { notInArray, sql } from 'drizzle-orm';

// Build imported keys as "pack||':::'||slug" strings for comparison
// Or: fetch all current DB keys before import, diff against importedKeys Set after
const existingEntities = await db
  .select({ pack: pf2eEntities.pack, slug: pf2eEntities.slug })
  .from(pf2eEntities);

const toDelete = existingEntities.filter(
  (e) => !importedKeys.has(`${e.pack}::${e.slug}`)
);

if (toDelete.length > 0) {
  // Delete in batches of 500 to avoid SQLite variable limit
  for (let i = 0; i < toDelete.length; i += 500) {
    const batch = toDelete.slice(i, i + 500);
    // Use raw SQL for composite key deletion
    for (const { pack, slug } of batch) {
      await db.delete(pf2eEntities)
        .where(
          and(eq(pf2eEntities.pack, pack), eq(pf2eEntities.slug, slug))
        );
    }
  }
}
```

### Anti-Patterns to Avoid

- **Using `@tauri-apps/plugin-http` fetch() for the ZIP download:** It has documented issues following 302 redirect chains. Use the Rust `download_file` command instead.
- **Single global transaction for all 28K inserts:** SQLite can handle it but risks long lock times; batch transactions of 500 are safer.
- **`indexOf('pf2e')` for pack name:** Matches the repo root folder name (`foundryvtt-pf2e-{sha}`). Use path segment matching for `packs/pf2e/{packName}` pattern.
- **Calling `invoke_handler` more than once:** Only the last call takes effect. All commands must go into a single `generate_handler![]` call.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP redirect following | Custom redirect logic in TS | `reqwest::get()` in Rust | reqwest follows up to 10 redirects by default; GitHub ZIP URL is a 302 chain |
| SHA-256 hashing | npm sha256 package | `window.crypto.subtle.digest` | Browser-native, zero dependency, available in Tauri WebView |
| ZIP extraction | Custom ZIP parser | `zip` crate `archive.extract()` | Already in Cargo.toml; handles encoding, nested dirs, permissions |
| SQLite upsert | Manual SELECT+INSERT/UPDATE | Drizzle `onConflictDoUpdate` + `setWhere` | Single atomic SQL statement; no race conditions |

**Key insight:** Every "custom" solution in this domain adds surface area for subtle bugs (redirect chains, ZIP encoding edge cases, hash collisions). The existing dependencies already handle these correctly.

---

## Common Pitfalls

### Pitfall 1: GitHub zipball_url Redirect Chain
**What goes wrong:** Fetching `zipball_url` with `@tauri-apps/plugin-http` (TypeScript fetch) silently fails or returns wrong data because GitHub issues a 302 redirect to S3, and the Tauri HTTP plugin has documented issues following redirect chains.
**Why it happens:** `tauri-plugin-http` wraps a Rust `reqwest` Client but exposes limited redirect behavior to the JS layer.
**How to avoid:** Always download via the Rust `download_file` command using `reqwest::get()` directly, which follows redirects natively.
**Warning signs:** Zero-byte zip file, `Not Found` JSON response instead of binary data.

### Pitfall 2: Missing `path:allow-temp-dir` Capability
**What goes wrong:** `tempDir()` from `@tauri-apps/api/path` throws a Tauri permission error at runtime.
**Why it happens:** Tauri 2 requires explicit capability declaration for all path APIs. Current `capabilities/default.json` has `core:default` but not `path:allow-temp-dir`.
**How to avoid:** Add `"path:allow-temp-dir"` to `capabilities/default.json` permissions array before any code calls `tempDir()`.
**Warning signs:** Runtime error with message like "forbidden path" or "permission denied" when calling `tempDir()`.

### Pitfall 3: Pack Name Extraction from GitHub Archive Root
**What goes wrong:** `parts.indexOf('pf2e')` returns the index of the root folder (`foundryvtt-pf2e-{sha}`), not the `packs/pf2e` directory. Every entity gets assigned pack `"unknown"`.
**Why it happens:** GitHub ZIP archives wrap content in a root folder named `{owner}-{repo}-{sha}`, e.g., `foundryvtt-pf2e-abc1234/packs/pf2e/spells/...`. The word `pf2e` appears in the root folder name.
**How to avoid:** Find the `packs/pf2e` two-segment sequence in the path parts array: find index where `parts[i] === 'packs' && parts[i+1] === 'pf2e'`, then pack = `parts[i+2]`. Or use `lastIndexOf('pf2e')`.
**Warning signs:** All entities inserted with `pack = 'unknown'` or `pack = 'foundryvtt-pf2e-{sha}'`.

### Pitfall 4: Performance Without Transaction Wrapping
**What goes wrong:** 28K individual Drizzle inserts each make an IPC roundtrip to Rust and auto-commit. Sync takes 10+ minutes.
**Why it happens:** Each `db.insert()` in the sqlite-proxy pattern sends a message through the Tauri IPC bridge. Without an explicit transaction, SQLite fsync-commits each statement.
**How to avoid:** Wrap each batch of 500 in `BEGIN`/`COMMIT` via `getSqlite().execute('BEGIN', [])` / `getSqlite().execute('COMMIT', [])`.
**Warning signs:** Sync progress bar stalls at "Importing: 500 / 28000" for 30+ seconds per batch.

### Pitfall 5: Drizzle `setWhere` Not Available in Older Versions
**What goes wrong:** `onConflictDoUpdate` silently ignores the `setWhere` option if using a Drizzle version before 0.30.9 — all rows get updated unconditionally.
**Why it happens:** `setWhere` was added in drizzle-orm v0.30.9 (April 2024). The project has `^0.38.0` installed, so this is fine, but worth noting.
**How to avoid:** Already avoided — project has drizzle-orm 0.38.x. Verify with `npm list drizzle-orm`.
**Warning signs:** Every entity in DB shows `synced_at` updated on re-sync even when content hasn't changed.

### Pitfall 6: Deletions Fetching All DB Keys Before Import
**What goes wrong:** For the first sync (empty DB), fetching existing keys is a no-op. But on re-sync, fetching 28K rows into JS memory to build the diff set is a significant memory allocation.
**Why it happens:** The straightforward deletion strategy collects all current `pack::slug` keys first, then diffs against the `importedKeys` Set.
**How to avoid:** This is acceptable for 28K entities (well under 1MB of key strings). No change needed. If it grows to 200K+ entities, revisit with SQL-side deletion.
**Warning signs:** Memory spike during the deletion phase on large DBs.

---

## Code Examples

Verified patterns from official sources and plan.txt:

### GitHub API Release Check

```typescript
// Source: plan.txt Phase 2; GitHub API v3
import { fetch } from '@tauri-apps/plugin-http';

const releaseResp = await fetch(
  'https://api.github.com/repos/foundryvtt/pf2e/releases/latest',
  {
    method: 'GET',
    headers: { 'Accept': 'application/vnd.github.v3+json' },
  }
);
const release = await releaseResp.json() as { tag_name: string; zipball_url: string };
```

Note: The GitHub API for latest release metadata (JSON, not binary) does NOT redirect — this fetch is safe to do in TypeScript. Only the `zipball_url` binary download needs Rust.

### tempDir Usage

```typescript
// Source: https://v2.tauri.app/reference/javascript/api/namespacepath/
import { tempDir } from '@tauri-apps/api/path';

const tmpPath = await tempDir();
const zipPath = `${tmpPath}/pf2e-release.zip`;
const extractPath = `${tmpPath}/pf2e-extracted`;
```

### Rust Command Registration in lib.rs

```rust
// src-tauri/src/lib.rs
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::download_file,
            commands::extract_zip,
            commands::glob_json_files,
            commands::read_text_file,
            commands::remove_dir,
            commands::remove_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Capability Permission Addition

```json
// src-tauri/capabilities/default.json — add path:allow-temp-dir
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capability for pathbuddy",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "path:allow-temp-dir",
    "sql:default",
    "sql:allow-execute",
    "sql:allow-select",
    "http:default",
    "http:allow-fetch",
    "http:allow-fetch-cancel",
    "http:allow-fetch-read-body",
    "http:allow-fetch-send",
    "fs:default"
  ]
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Drizzle `where` in onConflictDoUpdate | `setWhere` and `targetWhere` (separate) | drizzle-orm v0.30.9, April 2024 | `setWhere` is the correct property for conditional update; old `where` was deprecated/moved |
| Single global transaction | Per-batch transactions (500 rows) | SQLite best practice | Prevents long lock times; rollback is limited to one batch on failure |
| `@tauri-apps/api/core` path utilities | `@tauri-apps/api/path` module | Tauri 2 refactor | Path functions now in dedicated submodule |

**Deprecated/outdated:**
- `where` property on `onConflictDoUpdate`: Split into `setWhere` (update condition) and `targetWhere` (partial index condition) in Drizzle 0.30.9. Project uses 0.38.x — use `setWhere`.

---

## Open Questions

1. **GitHub API rate limit for unauthenticated requests**
   - What we know: GitHub allows 60 unauthenticated requests/hour for the releases API
   - What's unclear: Whether a single sync (1 API call) could be affected in practice
   - Recommendation: One API call per sync is fine. No auth needed. Add `User-Agent` header as GitHub recommends.

2. **ZIP extraction path separator on Windows**
   - What we know: Rust `zip` crate extracts with OS-native path separators. `glob_json_files` returns Windows backslash paths on Windows.
   - What's unclear: Whether `filePath.split('/')` in TypeScript will correctly parse Windows paths (`\`) returned by the Rust glob command.
   - Recommendation: In `glob_json_files` Rust command, normalize path separators to forward slashes before returning (`path.replace('\\', '/')` or use `path.to_string_lossy().replace('\\', '/')`). Alternatively handle in TypeScript with `filePath.split(/[\\/]/)`.

3. **syncState table: single row or append log**
   - What we know: plan.txt uses `db.delete(syncState)` then `db.insert()` — single-row pattern.
   - What's unclear: Is a sync history log desired?
   - Recommendation: Single-row per plan.txt. History is out of scope for Phase 4.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SYNC-01 | syncPacks() returns SyncResult with release tag | unit | `npm test -- --reporter=verbose src/lib/__tests__/sync-service.test.ts` | ❌ Wave 0 |
| SYNC-02 | download_file Rust command — not testable in Vitest | manual-only | manual: cargo test or integration test | N/A |
| SYNC-03 | computeHash() returns correct hex string; upsert skips unchanged entity | unit | `npm test -- src/lib/__tests__/sync-service.test.ts` | ❌ Wave 0 |
| SYNC-04 | entities not in importedKeys are removed from DB after sync | unit | `npm test -- src/lib/__tests__/sync-service.test.ts` | ❌ Wave 0 |

Note: Rust commands (`download_file`, `extract_zip`, etc.) require a real Tauri runtime. They cannot be unit-tested via Vitest. The TypeScript sync orchestration logic (hash computation, pack name extraction, entity validation, deletion logic) is fully testable with mocked `invoke` calls.

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/__tests__/sync-service.test.ts` — covers SYNC-01, SYNC-03, SYNC-04
  - Test `computeHash()` against known SHA-256 output
  - Test `extractPackName()` with GitHub archive path format (`foundryvtt-pf2e-abc/packs/pf2e/spells/fireball.json`)
  - Test entity validation logic (skip `_id`/`name`/`type` missing entities)
  - Test filename filter (skip `_folders.json`)
  - Mock `invoke` and `db` for deletion logic test
- [ ] Tauri mock in test setup — `invoke` must be mocked (already pattern in Phase 1-3 tests via jsdom; Tauri IPC unavailable in Vitest)

*(Existing `src/__tests__/setup.ts` and `global-setup.ts` already configure Pinia and component stubs — Tauri `invoke` mock must be added for sync-service tests.)*

---

## Sources

### Primary (HIGH confidence)

- `plans/plan.txt` Phase 2 section — complete sync algorithm, Rust commands, TypeScript service
- `src/lib/schema.ts` — actual Drizzle schema (pf2eEntities, syncState confirmed)
- `src-tauri/Cargo.toml` — confirmed: reqwest 0.12, zip 2, all plugins present
- `src-tauri/src/lib.rs` — confirmed: all three plugins registered, no invoke_handler yet
- `src-tauri/capabilities/default.json` — confirmed: missing `path:allow-temp-dir`
- `package.json` — confirmed: drizzle-orm ^0.38.0 (has setWhere), @tauri-apps/api ^2.0.0

### Secondary (MEDIUM confidence)

- https://orm.drizzle.team/docs/guides/upsert — `setWhere` confirmed in Drizzle upsert guide
- https://v2.tauri.app/reference/javascript/api/namespacepath/ — `tempDir()` function signature confirmed
- https://v2.tauri.app/develop/calling-rust/ — `invoke_handler` + `generate_handler!` pattern confirmed
- https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest — `crypto.subtle.digest` SHA-256 pattern

### Tertiary (LOW confidence — flagged for validation)

- WebSearch finding: `tauri-plugin-http` has documented issues with 302 redirect chains — multiple GitHub issues confirm behavior, but exact behavior may depend on plugin version. Mitigated by using Rust `download_file` for all binary downloads.
- WebSearch finding: `path:allow-temp-dir` required in capabilities — confirmed by search but not verified in official Tauri permission reference page directly.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed present in Cargo.toml and package.json; versions verified against installed state
- Architecture: HIGH — follows plan.txt algorithm directly with three documented adaptations
- Pitfalls: HIGH (redirect issue, pack name extraction) / MEDIUM (capability permission) — multiple sources confirm

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain; Drizzle and Tauri 2 APIs stable)
