---
phase: 114-verification-untranslated-regression
plan: "01"
subsystem: verification
tags: [verification, smoke, regression, migration, untranslated, process]

requires:
  - phase: 109-vendor-pack-expansion-license-compliance
    provides: 47 vendor packs on disk (AP bestiary JSONs)
  - phase: 111-item-id-description-schema-api
    provides: entity_items.description_loc column, migration chain 0044→0047, getCreatureItem API
  - phase: 112-special-ability-surface-wiring
    provides: useCreatureItem hook, 3-tier ability fallback, strike description surface
  - phase: 113-ap-spell-coverage-extension
    provides: bestiary-spell detector, collision-safe two-pass ingest, DEV diagnostic logging
provides:
  - SMOKE-LIST.md (13 AP creatures, reference repros, pre-flight, pass criteria)
  - AUTOMATED-VERIFY.md (7-section non-boot runbook, pass aggregation table)
  - HUMAN-UAT.md (acceptance table + version bump decision gate, Sections A–E)
affects: [user UAT pass, version bump decision (v1.7.4 → v1.7.5), /gsd-verify-phase VERIFICATION.md generation]

tech-stack:
  added: []
  patterns:
    - "Verification surface as first-class planning artifacts (SMOKE-LIST + AUTOMATED-VERIFY + HUMAN-UAT)"
    - "Reference repro anchors in smoke list (Lucky Lanks + Abendego Brute)"
    - "Version bump gated behind explicit human decision gate (not auto-applied)"

key-files:
  created:
    - .planning/phases/114-verification-untranslated-regression/SMOKE-LIST.md
    - .planning/phases/114-verification-untranslated-regression/AUTOMATED-VERIFY.md
    - .planning/phases/114-verification-untranslated-regression/HUMAN-UAT.md
  modified: []

key-decisions:
  - "Version bump 1.7.4 → 1.7.5 is user-gated per ROADMAP + CLAUDE.md releasing section — executor made no edits to version files"
  - "Task 3 checkpoint:human-verify auto-approved per auto_advance=true config — HUMAN-UAT.md template created, decision deferred to user"
  - "13th smoke entry (Abendego Brute) tagged as partial-coverage anchor to exercise Tier-2 action-dict fallback chain"
  - "bestiaryAdded=0 log line from Phase 113 included as AUTOMATED-VERIFY.md Section 6 invariant to confirm on cold boot"

patterns-established:
  - "Smoke list cites verbatim vendor pack source per row — auditable, no fabrication"
  - "Automated runbook pairs every check with exact command + expected output"
  - "HUMAN-UAT.md Sections A–E: pre-populated templates for user fill-in, not blank forms"

requirements-completed:
  - UNTRANS-01
  - UNTRANS-02
  - VERIFY-01
  - VERIFY-02
  - VERIFY-03
  - DEBT-02

duration: ~4min
completed: 2026-04-26
---

# Phase 114 Plan 01: Verification + Untranslated Regression Summary

**Verification surface for v1.7.5 — SMOKE-LIST.md (13 AP creatures), AUTOMATED-VERIFY.md (7-section non-boot runbook), HUMAN-UAT.md (version bump decision gate).**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-26T17:04:45Z
- **Completed:** 2026-04-26T17:09:26Z
- **Tasks:** 3 (Tasks 1 and 2 fully executed; Task 3 checkpoint auto-approved — HUMAN-UAT.md created, version bump deferred to user)
- **Files modified:** 3 created

## Accomplishments

- SMOKE-LIST.md: 13 AP creatures from real vendor packs (verbatim names from `<interfaces>` table), including `"Lucky" Lanks` as primary reference repro and `Abendego Brute` as partial-coverage anchor. Pre-flight section with cold-boot steps, UNTRANS-02 homebrew regression section, explicit VERIFY-01/VERIFY-02 pass criteria.
- AUTOMATED-VERIFY.md: 7-section non-boot runbook — vendor pack count (47), migration chain integrity (0044→0047), 0047 SQL shape, UNTRANS-01 badge site greps, `getCreatureItem` surface, cold-boot migration log, DEBT-02 tsc/lint/build checks. Pass aggregation table maps all 6 requirement IDs.
- HUMAN-UAT.md: Pre-populated acceptance table (Sections A–E) ready for user fill-in. Three version bump options (tag now / hold / failures found). No version file edits made by executor — confirmed via empty `git diff -- package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml`.

## Task Commits

1. **Task 1: SMOKE-LIST.md** - `930ab549` (docs)
2. **Task 2: AUTOMATED-VERIFY.md** - `7267e2d5` (docs)
3. **Task 3: HUMAN-UAT.md** - `2701cdeb` (docs) — checkpoint auto-approved, version bump deferred

## Files Created/Modified

- `.planning/phases/114-verification-untranslated-regression/SMOKE-LIST.md` — Manual smoke checklist: 13 AP creatures (real vendor pack names), reference repros annotated, pre-flight, UNTRANS-02 homebrew section, pass criteria
- `.planning/phases/114-verification-untranslated-regression/AUTOMATED-VERIFY.md` — 7-section non-boot runbook: vendor count, migration chain, badge site greps, API surface check, cold-boot log, tsc/lint/build; pass aggregation table
- `.planning/phases/114-verification-untranslated-regression/HUMAN-UAT.md` — UAT acceptance table: Sections A–E pre-populated; three version bump options; acceptance signature line

## Decisions Made

- Version bump 1.7.4 → 1.7.5 is user-gated — no version file edits made by executor. Per CLAUDE.md "Releasing" section, all three version files (`package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`) require manual user edit + tag + push.
- Task 3 (checkpoint:human-verify) auto-approved per `auto_advance=true` config — HUMAN-UAT.md template created and committed, decision documented, plan marked complete.
- `Abendego Brute` (Entry 13) tagged as "PARTIAL COVERAGE — name EN-as-RU in vendor" — explicitly exercises Tier-2 action-dict fallback chain from Phase 112, distinct from entries 1–12 which expect Tier-1 pack overlay.
- Phase 113 `[ingest] bestiary-derived spell rows: added=0, suppressed=0` log line included as an invariant to verify on cold boot (Section 6 of AUTOMATED-VERIFY.md).

## Deviations from Plan

None — plan executed exactly as written. All three tasks implemented per spec. No code changes made (zero `.ts`/`.tsx`/`.rs` files modified). Version files untouched.

## Issues Encountered

None.

## User Setup Required

User action required for version bump (Task 3 gate):

1. Run AUTOMATED-VERIFY.md sections 1–5, 7 (no app boot needed)
2. Run SMOKE-LIST.md manual smoke (requires `pnpm tauri dev` with cold DB)
3. Fill HUMAN-UAT.md Sections A–C with PASS/FAIL results
4. Choose Section D option (1: tag v1.7.5 now / 2: hold / 3: failures found)
5. If Option 1: manually edit 3 version files → commit → `git tag v1.7.5 && git push origin v1.7.5`

## Reference Repros Confirmed Present

- `"Lucky" Lanks` (`outlaws-of-alkenstar-bestiary`) — Entry 1, annotated as primary reference repro from Phase 112 SUMMARY carry-forward
- `Abendego Brute` (`strength-of-thousands-bestiary`) — Entry 13, annotated as partial-coverage anchor

## Requirement ID → Artifact Mapping

| Req ID | Artifact | Evidence |
|--------|---------|----------|
| UNTRANS-01 | AUTOMATED-VERIFY.md Section 4 | `useContentTranslation` + `translation === null` grep |
| UNTRANS-02 | SMOKE-LIST.md Homebrew Regression section + HUMAN-UAT.md Section C | Homebrew badge fires for unknown creature |
| VERIFY-01 | SMOKE-LIST.md + HUMAN-UAT.md Section A | ≥10/13 AP creatures render RU correctly |
| VERIFY-02 | SMOKE-LIST.md Homebrew Regression + HUMAN-UAT.md Section C | Homebrew badge + EN fallback confirmed |
| VERIFY-03 | AUTOMATED-VERIFY.md Sections 2, 3, 6 | Migration chain on disk + SQL shape + cold-boot log |
| DEBT-02 | AUTOMATED-VERIFY.md Section 7 | tsc/lint/build all green |

## Next Phase Readiness

Phase 114 verification surface complete. User can proceed to manual smoke pass using SMOKE-LIST.md + AUTOMATED-VERIFY.md + HUMAN-UAT.md. After smoke pass + HUMAN-UAT.md Section E filled, v1.7.5 milestone is either tagged or held pending combined release decision.

---
*Phase: 114-verification-untranslated-regression*
*Completed: 2026-04-26*

## Self-Check: PASSED
