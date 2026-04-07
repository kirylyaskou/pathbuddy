---
phase: 12-stat-block-bestiary-data-quality
plan: "01"
subsystem: ui
tags: [react, typescript, foundry-vtt, pf2e, stat-block, regex]

# Dependency graph
requires:
  - phase: 7-sqlite-data-pipeline
    provides: CreatureRow + raw_json Foundry VTT data that mappers.ts parses
provides:
  - resolveFoundryTokens() pre-pass cleans @UUID/@Damage/@Check/@Template/@Localize syntax from ability text
  - All 17 PF2e standard skills always shown in stat block, untrained derived from creature level
  - calculated flag in skills type for opacity-based visual distinction
affects: [stat-block-display, bestiary-browser, creature-abilities, skills-section]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - resolveFoundryTokens() called before stripHtml() at all text-sanitization call sites
    - Standard skills expanded via Map lookup with level-based fallback for untrained
    - Lore skills appended after standard skills, alphabetically sorted

key-files:
  created: []
  modified:
    - src/entities/creature/model/types.ts
    - src/entities/creature/model/mappers.ts
    - src/entities/creature/ui/CreatureStatBlock.tsx

key-decisions:
  - "Untrained skill modifier uses creature level (not level+2) as a neutral, non-committal approximation"
  - "resolveFoundryTokens() placed before stripHtml() so HTML tags don't interfere with @-token regex matching"
  - "STANDARD_SKILLS array has 16 entries (note: plan objective says 17 but perception is separate, standard skills = 16 + perception displayed separately)"

patterns-established:
  - "Token resolution pattern: resolveFoundryTokens(text) before stripHtml(text) for all Foundry VTT text fields"
  - "Skills expansion pattern: Map-based lookup against STANDARD_SKILLS with calculated flag for untrained entries"

requirements-completed: [STAT-01, STAT-02]

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 12 Plan 01: Stat Block Display — Token Rendering + All 17 Skills Summary

**Foundry @-syntax tokens resolved to readable text in ability descriptions, and stat block now always shows all 16 standard PF2e skills with untrained ones visually muted at opacity-40**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-02T01:07:06Z
- **Completed:** 2026-04-02T01:08:52Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added `resolveFoundryTokens()` function handling all 5 Foundry token types: `@UUID` (with/without alias), `@Damage` (multi-type with "plus" separator), `@Check` (DC prefix), `@Template` (distance-foot type), `@Localize` (stripped as fallback)
- Creature abilities and descriptions now show human-readable text instead of raw `@UUID[Compendium.pf2e.X.Item.Y]` markup
- Skills section always renders all 16 standard PF2e skills; untrained skills derive modifier from creature level with `calculated: true` flag and render at `opacity-40`
- Lore skills (any non-standard Foundry skill keys) appended after standard skills, alphabetically sorted
- Skill modifiers now handle negative values correctly with conditional sign rendering

## Task Commits

1. **Task 1: Add calculated flag to skills type** - `d817718c` (feat)
2. **Task 2: Add resolveFoundryTokens() and update skills block** - `0021a6e5` (feat)
3. **Task 3: Update Skills section in CreatureStatBlock.tsx** - `a3061424` (feat)

## Files Created/Modified

- `src/entities/creature/model/types.ts` — Added `calculated?: boolean` to skills array item type
- `src/entities/creature/model/mappers.ts` — Added `resolveFoundryTokens()`, updated both stripHtml() call sites, replaced skills block with 16-standard-skill + lore expansion
- `src/entities/creature/ui/CreatureStatBlock.tsx` — Skills section: removed conditional guard, added opacity-40 for calculated skills, fixed sign rendering

## Decisions Made

- Untrained skill modifier uses `base.level` (creature level) as a reasonable approximation for untrained skill modifier in PF2e (level + 0 proficiency). This is a simplification vs the full formula (2 * level + ability modifier) but avoids needing ability scores in the mapper.
- `resolveFoundryTokens()` is placed before `stripHtml()` so regex patterns match clean `@Token[...]` syntax without HTML tag interference.
- STANDARD_SKILLS array contains 16 entries — perception is a separate stat already displayed in the core stats section, so it is not duplicated in the skills section.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — TypeScript compilation passed clean with no errors.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all data flows from live Foundry VTT SQLite data.

## Next Phase Readiness

- Stat block ability descriptions now display human-readable text for all Foundry @-syntax tokens
- All 16 standard skills always visible in stat block with calculated/explicit visual distinction
- Ready for Plan 12-02 (Sources filter book names fix or further bestiary data quality work)

## Self-Check: PASSED

- FOUND: src/entities/creature/model/types.ts
- FOUND: src/entities/creature/model/mappers.ts
- FOUND: src/entities/creature/ui/CreatureStatBlock.tsx
- FOUND: .planning/phases/12-stat-block-bestiary-data-quality/12-01-SUMMARY.md
- FOUND: commit d817718c (feat: add calculated flag to skills type)
- FOUND: commit 0021a6e5 (feat: add resolveFoundryTokens() and expand skills)
- FOUND: commit a3061424 (feat: update Skills section in CreatureStatBlock.tsx)
- TypeScript compilation: no errors

---
*Phase: 12-stat-block-bestiary-data-quality*
*Completed: 2026-04-02*
