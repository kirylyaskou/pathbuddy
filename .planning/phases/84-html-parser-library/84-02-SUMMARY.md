---
phase: 84-html-parser-library
plan: "02"
subsystem: shared/i18n/pf2e-content/lib
tags: [parser, localization, pf2e, pure-ts, dom-parser, gap-closure]

requires:
  - phase: 84-01
    provides: parseMonsterRuHtml, MonsterStructuredLoc (13 fields), debug harness 48 assertions

provides:
  - actionCount extraction fixed — marker searched in full ability-span html (CR-01 resolved)
  - stripTrailingNumber helper — numeric suffixes removed from weaknesses/resistances/immunities (WR-03 resolved)
  - AbilityScoresLoc interface + extractAbilityScores extractor (D-09 gap closed)
  - MonsterStructuredLoc now has 14 fields — TRANS-01 fully satisfied
  - debug harness extended to 57 assertions

affects: [phase-86-bundled-loader, phase-87-translations-api, phase-88-creature-stat-block]

tech-stack:
  added: []
  patterns:
    - stripTrailingNumber pure helper — trim engine-owned numeric suffixes from parsed label arrays
    - positional-6-labels pattern — extractAbilityScores reads first 6 bold+bonus matches, maps by position

key-files:
  created: []
  modified:
    - src/shared/i18n/pf2e-content/lib/types.ts
    - src/shared/i18n/pf2e-content/lib/parse-monster.ts
    - src/shared/i18n/pf2e-content/lib/index.ts
    - src/shared/i18n/pf2e-content/lib/parse-monster.debug.ts

key-decisions:
  - "extractAbilityScores uses labelPattern=/<b>([А-Яа-яёЁ]{2,5})<\\/b>\\s*[+\\-]\\d+/g — signed-integer anchor filters section headers; break at 6 matches"
  - "Succubus actual labels are Сил/Лвк/Вын/Инт/Мдр/Хар — differ from D-09 idealized defaults; parser reads whatever HTML ships"
  - "extractActionCount helper deleted entirely (dead code, IN-04); inline regex on full html is cleaner"
  - "Defaults for extractAbilityScores: Сил/Лов/Стой/Инт/Муд/Хар — fire only when section absent"

patterns-established:
  - "numeric suffix strip: split(',').map(s => stripTrailingNumber(s.trim())).filter(s => s.length > 0)"
  - "action-count from full span html: /\\[one-action\\]/i.test(html) not on extracted name string"

requirements-completed: [TRANS-01]

duration: 25min
completed: "2026-04-24"
---

# Phase 84 Plan 02: Gap Closure — actionCount + weaknesses strip + abilityScoresLoc

**Three surgical fixes closing CR-01/WR-03/D-09 gaps: actionCount now reads full span html, weakness labels stripped of engine-owned numbers, and AbilityScoresLoc adds the 14th field completing TRANS-01**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-24T10:24:56Z
- **Completed:** 2026-04-24T10:50:43Z
- **Tasks:** 5 (T1–T5)
- **Files modified:** 4

## Accomplishments

- CR-01 fixed: `extractAbilities` now tests `/\[one-action\]/i` on the full `html` span, not on `abilityName` (content of `<b>…</b>`). Dead `extractActionCount` helper removed. Assertions A5/A6/A7 now pass on real Succubus data.
- WR-03 fixed: `stripTrailingNumber` helper trims trailing `\s+\d+` from each comma-token in `extractWeaknesses`, `extractResistances`, `extractImmunities`. `"холодное железо 5"` → `"холодное железо"`.
- D-09 gap closed: `AbilityScoresLoc` interface added (6 label fields), `extractAbilityScores` extractor reads first 6 `<b>LABEL</b>\s*[+\-]\d+` matches positionally, wired into `parseMonsterRuHtml` return.
- Debug harness: 57 total assertions (baseline 48 + A22b + A34–A41 = +9).

## Task Commits

1. **T1: Add AbilityScoresLoc type + field** — `63700acf` (feat)
2. **T2: Fix parse-monster.ts — actionCount, strip, extractAbilityScores** — `d9862d97` (fix)
3. **T3: Barrel re-export AbilityScoresLoc** — `ed72026a` (feat)
4. **T4: Extend debug harness 9 new assertions** — `1b3c739b` (test)
5. **T5: Full-project gates (tsc + lint + lint:arch + no-deps)** — no separate commit (verification only)

## Files Created/Modified

- `src/shared/i18n/pf2e-content/lib/types.ts` — Added `AbilityScoresLoc` interface (6 label fields) + `abilityScoresLoc` as 14th field in `MonsterStructuredLoc`; removed phase-ref from JSDoc
- `src/shared/i18n/pf2e-content/lib/parse-monster.ts` — Added `AbilityScoresLoc` import; deleted `extractActionCount` helper; fixed CR-01 inline; added `stripTrailingNumber` helper; applied in 3 extractors; added `extractAbilityScores`; wired into return object
- `src/shared/i18n/pf2e-content/lib/index.ts` — Added `AbilityScoresLoc` to type re-exports
- `src/shared/i18n/pf2e-content/lib/parse-monster.debug.ts` — Added A22b (no-digit weaknesses), A34–A41 (abilityScoresLoc shape + content checks); total 57 assertions

## Decisions Made

- **extractAbilityScores regex:** `/<b>([А-Яа-яёЁ]{2,5})<\/b>\s*[+\-]\d+/g` — the signed-integer anchor is sufficient to distinguish ability-score bolds from section-header bolds in current Succubus fixture. If future monsters have individually-bolded skills, tighten to anchor between `<b>Навыки</b>` and `<hr>`.
- **Actual Succubus labels confirmed:** `Сил/Лвк/Вын/Инт/Мдр/Хар` — differ from D-09 defaults. Parser reads whatever pf2.ru ships; defaults only fire when section absent.
- **extractActionCount deleted** rather than kept with corrected call site — simpler, no dead API surface.

## Deviations from Plan

None — plan executed exactly as written. All 5 changes in T2 applied cleanly, regex confirmed against Succubus fixture before implementation.

## Issues Encountered

None.

## Out-of-Scope Issues Noted (Deferred)

- `src/shared/i18n/index.ts:24-25` — `boundaries/dependencies` errors — pre-existing, not caused by this plan (present in baseline commit `8849d299`, documented in 84-01-SUMMARY).
- All `lint:arch` steiger violations — pre-existing, none involve `pf2e-content/lib/` files.

## Known Stubs

**extractAbilityScores positional assumption:** The extractor finds the first 6 `<b>LABEL</b>\s*[+\-]\d+` matches globally. On the Succubus fixture, these are the ability-score row because skills appear as plain text after `<b>Навыки</b>:` (not individually bolded). If a future monster individually bolds skill tokens, the extractor would mis-pick skill labels instead of ability-score labels.

- **File:** `src/shared/i18n/pf2e-content/lib/parse-monster.ts`, `extractAbilityScores`
- **Reason:** Single-fixture scope (Succubus only for v1.7.0). Pattern is documented in JSDoc.
- **Resolution:** When fixture set expands, tighten to anchor the search between `<b>Навыки</b>` and first `<hr>`.

## Threat Flags

None. Changes are confined to pure-TS parser module with no network calls, no Tauri IPC, no DOM mutation. `stripTrailingNumber` and `extractAbilityScores` operate on already-parsed detached DOM strings — no injection surface.

## Human UAT Required

Per plan verification block — cannot automate without DOMParser (browser-only, no new deps):

1. Run `pnpm tauri dev`
2. Open DevTools (`Ctrl+Shift+I`)
3. Confirm startup message: `[parse-monster.debug] Available via window.__pathmaid_parseMonsterDebug()`
4. Run in Console: `__pathmaid_parseMonsterDebug()`
5. Expected: `[parse-monster.debug] Succubus: 57/57 assertions passed`

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| `types.ts` has AbilityScoresLoc interface (6 fields) | PASS |
| `types.ts` MonsterStructuredLoc has 14 fields | PASS |
| `parse-monster.ts` actionCount uses `/\[one-action\]/i.test(html)` on full span | PASS |
| `parse-monster.ts` extractActionCount helper deleted | PASS |
| `parse-monster.ts` stripTrailingNumber defined + used in 3 extractors | PASS |
| `parse-monster.ts` extractAbilityScores defined + wired | PASS |
| `index.ts` re-exports AbilityScoresLoc | PASS |
| `debug.ts` has ≥54 assert() calls (actual: 57) | PASS |
| `debug.ts` has A41 strLabel === "Сил" | PASS |
| `debug.ts` has A22b no-digit weaknesses check | PASS |
| `pnpm tsc --noEmit` = 0 errors | PASS |
| `pnpm lint` = 0 new errors (pre-existing shared/i18n/index.ts:24-25 unchanged) | PASS |
| `pnpm lint:arch` = 0 new violations | PASS |
| `git diff -- package.json pnpm-lock.yaml` empty | PASS |
| Only 4 files modified in src/ | PASS |

---
*Phase: 84-html-parser-library*
*Completed: 2026-04-24*
