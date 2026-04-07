---
status: resolved
trigger: "zip-eocd-sync-failure — Tauri extract_zip call in sync-service.ts fails with 'invalid Zip archive: Could not find EOCD' when user clicks Sync button to download and import PF2e creatures from GitHub."
created: 2026-03-20T00:00:00Z
updated: 2026-03-20T00:02:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED — reqwest::get() uses a default client that does NOT send a User-Agent header. GitHub API requires a User-Agent header and GitHub zipball_url also redirects via 302 to an S3 URL. The default reqwest client does follow redirects, but without User-Agent GitHub returns a 403/HTML error page which gets written to disk as the "zip" file. extract_zip then opens that HTML file and fails with "Could not find EOCD" because HTML has no ZIP End Of Central Directory marker.
test: Code reviewed — download_file in commands.rs calls reqwest::get(&url) with no headers, no User-Agent, no client config.
expecting: Applying a custom reqwest::Client with User-Agent set and redirect policy enabled will fix the download.
next_action: Await human verification — rebuild Tauri app and test Sync button end-to-end

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Clicks Sync → downloads latest PF2e release ZIP from GitHub → extracts it → imports creature data into local SQLite DB
actual: Fails with "invalid Zip archive: Could not find EOCD" during the extract step
errors: "invalid Zip archive: Could not find EOCD while syncing"
reproduction: Click Sync button → always fails 100% of the time
started: Never worked — first time trying the sync feature

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: extract_zip itself is broken / zip crate misconfigured
  evidence: zip = "2" is present in Cargo.toml; extract_zip code is correct standard usage. Error originates from the file not being a valid ZIP at all, not from the extraction logic.
  timestamp: 2026-03-20T00:01:00Z

- hypothesis: Redirect following is disabled in reqwest
  evidence: By default reqwest follows redirects (up to 10). The redirect is not the problem alone — the missing User-Agent causes GitHub to return an error page before or after redirect. Both issues must be addressed together.
  timestamp: 2026-03-20T00:01:00Z

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-03-20T00:00:30Z
  checked: src-tauri/src/commands.rs download_file function
  found: Uses bare `reqwest::get(&url)` — no custom client, no User-Agent header, no explicit redirect policy.
  implication: GitHub API rejects requests without User-Agent. The zipball_url is a 302 redirect to S3. Without User-Agent the API may return a 403 HTML error page instead of redirecting to the ZIP. That HTML is then written to disk as pf2e-release.zip.

- timestamp: 2026-03-20T00:00:40Z
  checked: src-tauri/Cargo.toml reqwest dependency
  found: reqwest = { version = "0.12", features = ["json"] } — no "blocking" feature, async usage. Default redirect policy is follow (up to 10). But no User-Agent is set anywhere.
  implication: The redirect will be followed IF GitHub accepts the request. GitHub's API docs explicitly require a User-Agent header — requests without it receive a 403 "Must send User-Agent" response, which is an HTML/JSON error body, not a ZIP.

- timestamp: 2026-03-20T00:00:50Z
  checked: src/lib/sync-service.ts fetch call for GitHub API
  found: The TS side (using @tauri-apps/plugin-http fetch) correctly sends User-Agent: "pathbuddy" and Accept headers. The Rust download_file command however makes its own independent reqwest call with NO headers.
  implication: Two separate HTTP clients: the TS fetch (correct) gets the release metadata including zipball_url. Then invoke('download_file', { url: zipball_url }) makes a raw reqwest::get() with no User-Agent to that zipball_url, which GitHub rejects with an error page.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: download_file in src-tauri/src/commands.rs uses reqwest::get() with no User-Agent header. GitHub API requires a User-Agent header on all requests — including zipball download URLs. Without it GitHub returns a 403 error response (HTML body), which is written to disk as the "zip" file. extract_zip then fails with "Could not find EOCD" because the file is HTML, not a ZIP archive.
fix: Replace reqwest::get(&url) with a custom reqwest::Client that sets User-Agent: "pathbuddy" and has redirect following enabled (which is the default but should be explicit). Use .header(reqwest::header::USER_AGENT, "pathbuddy") on the request builder.
verification: Human confirmed "confirmed fixed" — Sync is now working end-to-end after rebuilding with the patched commands.rs.
files_changed: [src-tauri/src/commands.rs]
