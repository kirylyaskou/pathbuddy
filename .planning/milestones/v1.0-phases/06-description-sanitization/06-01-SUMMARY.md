---
phase: 06-description-sanitization
plan: 01
subsystem: ui
tags: [pf2e, html, sanitizer, tailwind, regex, pure-function, tdd]

# Dependency graph
requires: []
provides:
  - "sanitizeDescription() pure HTML-in/HTML-out transformer for Foundry @-syntax tokens"
  - "DAMAGE_TYPE_COLORS map with 13 PF2e damage types mapped to Tailwind text-color classes"
affects: [06-02, CreatureDetailPanel, any component rendering entity description HTML]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Chained .replace() transforms with ordered regex passes for safe HTML mutation"
    - "Nested-bracket-aware regex pattern for @Damage[2d6[fire]] using [^\[\]]*(?:\[[^\]]*\][^\[\]]*)*"
    - "Pure utility function in src/lib/ with no side effects — importable by any component"

key-files:
  created:
    - src/lib/description-sanitizer.ts
    - src/lib/__tests__/description-sanitizer.test.ts
  modified: []

key-decisions:
  - "Nested bracket regex for @Damage: [^\\[\\]]*(?:\\[[^\\]]*\\][^\\[\\]]*)* handles 2d6[fire] and 2d6[fire]|persistent patterns"
  - "Pass ordering is critical: labeled @UUID (Pass 1) must run before unlabeled (Pass 2); fallback passes (6-7) must be last"
  - "Non-pf2e @UUID references fall through to fallback passes (6-7), producing plain text — consistent with CONTEXT.md decisions"

patterns-established:
  - "TDD RED-GREEN flow: write all failing tests → commit → implement to green → commit"
  - "@-syntax replacement order: specific patterns first (UUID, Damage, Check, Template), generic fallback last"

requirements-completed: [DESC-01, DESC-02]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 6 Plan 01: sanitizeDescription — Foundry @-syntax HTML transformer Summary

**Pure sanitizeDescription() transformer with 7-pass regex chain converting PF2e @UUID/Damage/Check/Template tokens to Tailwind-styled HTML, including nested-bracket fix for @Damage patterns**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-20T09:25:39Z
- **Completed:** 2026-03-20T09:28:04Z
- **Tasks:** 2 (RED + GREEN TDD tasks)
- **Files modified:** 2

## Accomplishments
- `sanitizeDescription()` pure function processes all 4 Foundry @-syntax types and 2 fallback passes in correct order
- `DAMAGE_TYPE_COLORS` map exported with 13 PF2e damage types (fire, cold, electricity, acid, bleed, persistent, poison, mental, void, vitality, force, sonic, spirit)
- 25 unit tests passing across all @-syntax types, edge cases, fallbacks, and DAMAGE_TYPE_COLORS entries
- Full test suite (126 tests, 11 files) passes with zero regressions

## Task Commits

Each task was committed atomically:

1. **RED: Failing tests** - `0e53af5` (test)
2. **GREEN: Implementation** - `11367a6` (feat)

_TDD plan: two commits per the RED → GREEN cycle_

## Files Created/Modified
- `src/lib/description-sanitizer.ts` - Production sanitizer with DAMAGE_TYPE_COLORS export and sanitizeDescription() function
- `src/lib/__tests__/description-sanitizer.test.ts` - 25 unit tests covering all @-syntax types, fallbacks, edge cases, and color map entries

## Decisions Made
- Nested bracket regex for @Damage: The plan-specified `/@Damage\[([^\]]+)\]/g` pattern stops at the first `]` inside the expression, breaking `@Damage[2d6[fire]]`. Fixed to `/@Damage\[([^\[\]]*(?:\[[^\]]*\][^\[\]]*)*)\]/g` which allows exactly one level of inner brackets.
- Pass ordering strictly followed: labeled @UUID before unlabeled, specific patterns before fallback, to prevent partial matches.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Nested bracket regex for @Damage**
- **Found during:** GREEN task (running tests)
- **Issue:** Plan-specified `/@Damage\[([^\]]+)\]/g` stops at first `]` — `@Damage[2d6[fire]]` captures `2d6[fire` missing the inner bracket content entirely
- **Fix:** Changed to `/@Damage\[([^\[\]]*(?:\[[^\]]*\][^\[\]]*)*)\]/g` which explicitly allows inner `[type]` bracket pairs while still requiring a closing outer `]`
- **Files modified:** src/lib/description-sanitizer.ts
- **Verification:** `@Damage[2d6[fire]]` → `<span class="pf2e-damage font-bold text-orange-600">2d6 fire</span>`, `@Damage[1d4[sonic]]` and `@Damage[2d6[fire]|persistent]` both pass
- **Committed in:** 11367a6 (GREEN task commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required regex correction for nested bracket @Damage syntax. No scope creep. All 4 @-syntax types handled as specified.

## Issues Encountered
None beyond the regex fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `sanitizeDescription()` and `DAMAGE_TYPE_COLORS` are exported and ready to consume in Plan 02
- Plan 02 will wire sanitizeDescription() into CreatureDetailPanel's getDescription() return value
- Click delegation for `.pf2e-link` anchors is Plan 02 scope (entity resolution on click)

---
*Phase: 06-description-sanitization*
*Completed: 2026-03-20*
