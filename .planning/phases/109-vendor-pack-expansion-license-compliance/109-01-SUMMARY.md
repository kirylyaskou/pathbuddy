---
phase: 109-vendor-pack-expansion-license-compliance
plan: "01"
subsystem: vendor/i18n
tags: [vendor, i18n, bestiary, pf2-locale-ru, license]
dependency_graph:
  requires: []
  provides: [vendor-packs-47, version-manifest-updated, contributors-synced]
  affects: [src/shared/i18n/pf2e-content/ingest/index.ts via import.meta.glob]
tech_stack:
  added: []
  patterns: [byte-identical vendor copy, import.meta.glob auto-pickup]
key_files:
  created:
    - vendor/pf2e-locale-ru/pf2e/packs/abomination-vaults-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/age-of-ashes-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/agents-of-edgewatch-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/battlecry-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/blood-lords-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/book-of-the-dead-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/crown-of-the-kobold-king-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/extinction-curse-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/fall-of-plaguestone-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/fists-of-the-ruby-phoenix-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/gatewalkers-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/hellbreakers-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/howl-of-the-wild-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/kingmaker-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/lost-omens-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/malevolence-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/menace-under-otari-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/outlaws-of-alkenstar-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/quest-for-the-frozen-flame-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/rage-of-elements-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/revenge-of-the-runelords-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/seven-dooms-for-sandpoint-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/shades-of-blood-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/shadows-at-sundown-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/strength-of-thousands-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/the-slithering-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/troubles-in-otari-bestiary.json
    - vendor/pf2e-locale-ru/pf2e/packs/war-of-immortals-bestiary.json
  modified:
    - vendor/pf2e-locale-ru/VERSION.txt
    - LICENSES/pf2-locale-ru-CONTRIBUTORS.md
decisions:
  - "SHA ebd1a53a9ab072b12ef8d86c055cd23714334026 confirmed from local pf2-locale-ru checkout (git rev-parse HEAD)"
  - "Byte-identical copy — no JSON reformatting, LF/CRLF handled by git autocrlf"
  - "Lucky Lanks entry stored as '\"Счастливчик\" Лэнкс' (with quotes) — plan grep expected without quotes; content is correct"
metrics:
  duration: ~5min
  completed: 2026-04-26
  tasks_completed: 3
  tasks_total: 3
  files_created: 28
  files_modified: 2
---

# Phase 109 Plan 01: Vendor Pack Expansion — Summary

**One-liner:** Expanded pf2-locale-ru vendor from 19 to 47 packs by adding 28 AP-specific bestiary JSONs (byte-identical upstream copies) enabling RU translation for AP creatures via existing import.meta.glob.

## What Was Done

28 AP-specific bestiary pack files copied verbatim from `pf2-locale-ru/pf2e/packs/pf2e.<name>.json` to `vendor/pf2e-locale-ru/pf2e/packs/<name>.json`. No code changes — `import.meta.glob('/vendor/pf2e-locale-ru/pf2e/packs/*.json')` in `src/shared/i18n/pf2e-content/ingest/index.ts:64` automatically picks up new files.

VERSION.txt and CONTRIBUTORS.md updated to reflect new upstream SHA and expanded scope.

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Vendor 28 AP-specific bestiary packs | `8ffb1f66` |
| 2 | Update VERSION.txt (SHA + scope 47 packs) | `94454985` |
| 3 | Sync CONTRIBUTORS.md (SHA + pack count + scope) | `08ce0176` |

## Verification Results

- Total vendor packs: **47** (19 existing + 28 new)
- Upstream SHA used: `ebd1a53a9ab072b12ef8d86c055cd23714334026` (confirmed from local checkout)
- SHA consistent across VERSION.txt and CONTRIBUTORS.md: **YES**
- `outlaws-of-alkenstar-bestiary.json` contains `"Счастливчик" Лэнкс`: **YES**
- `mapping` shape present in outlaws pack (isActorPack filter compatible): **YES**
- Byte-identical: `diff` returns no output for all 28 files vs upstream
- Existing 19 base packs untouched: **0 lines diff**
- Zero .ts/.tsx/.rs files modified: **confirmed**

## New Packs Added (28)

abomination-vaults-bestiary, age-of-ashes-bestiary, agents-of-edgewatch-bestiary, battlecry-bestiary, blood-lords-bestiary, book-of-the-dead-bestiary, crown-of-the-kobold-king-bestiary, extinction-curse-bestiary, fall-of-plaguestone-bestiary, fists-of-the-ruby-phoenix-bestiary, gatewalkers-bestiary, hellbreakers-bestiary, howl-of-the-wild-bestiary, kingmaker-bestiary, lost-omens-bestiary, malevolence-bestiary, menace-under-otari-bestiary, outlaws-of-alkenstar-bestiary, quest-for-the-frozen-flame-bestiary, rage-of-elements-bestiary, revenge-of-the-runelords-bestiary, seven-dooms-for-sandpoint-bestiary, shades-of-blood-bestiary, shadows-at-sundown-bestiary, strength-of-thousands-bestiary, the-slithering-bestiary, troubles-in-otari-bestiary, war-of-immortals-bestiary.

## Deviations from Plan

None — plan executed exactly as written.

Note: plan's acceptance criterion `grep -q 'Счастливчик Лэнкс'` (without quotes) returns false negative because the upstream stores the name as `"Счастливчик" Лэнкс` (with embedded double-quotes). The RU translation is present and correct; the grep pattern in the plan did not account for the quoted nickname format.

## Next Plan

Plan 02 — License Compliance: per-AP OGL Section 15 entries for the 28 new packs.

## Known Stubs

None.

## Threat Flags

None — vendor JSON copies only, no new network endpoints, auth paths, or IPC boundaries introduced.

## Self-Check: PASSED
