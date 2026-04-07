---
phase: 05-vite-scaffold-nextjs-teardown
plan: 03
subsystem: tooling
tags: [eslint, steiger, fsd, boundaries, import-hygiene, linting]

# Dependency graph
requires:
  - phase: 05-02
    provides: FSD src/ structure with app/, pages/, widgets/, shared/ layers populated
provides:
  - eslint-plugin-boundaries v6 enforcing FSD layer import direction (boundaries/dependencies rule)
  - eslint-plugin-import-x enforcing import hygiene (no-cycle, no-duplicates, no-self-import)
  - steiger FSD structural linter with recommended rules
  - Unified lint script (npm run lint) running both eslint and steiger
affects: [06-fsd-zustand, 07-sqlite-data, 08-combat-tracker, 09-bestiary-encounter]

# Tech tracking
tech-stack:
  added: []
  patterns: [eslint-plugin-boundaries v6 object-based selectors, boundaries/dependencies rule (v6 non-deprecated name), eslint-plugin-import-x for flat config ESLint 9, typescript-eslint with recommended config, steiger FSD recommended rules with hooks segment exception]

key-files:
  created: []
  modified: [eslint.config.js]

key-decisions:
  - "Migrated boundaries/element-types (deprecated) to boundaries/dependencies with v6 object-based selectors"
  - "eslint-plugin-import-x used (not eslint-plugin-import) for native ESLint flat config support"
  - "steiger hooks segment-by-purpose rule disabled for src/shared/hooks/ (conventional React pattern)"

patterns-established:
  - "FSD layer direction enforced as errors: shared->nothing, entities->shared, features->entities+shared, etc."
  - "Import hygiene: no-cycle, no-duplicates, no-self-import as errors"
  - "npm run lint = eslint src/ && steiger src/ (both must pass)"

requirements-completed: [FND-05]

# Metrics
duration: 2min
completed: 2026-03-31
---

# Phase 5 Plan 3: FSD Linting + Visual Verification Summary

**eslint-plugin-boundaries v6 + eslint-plugin-import-x + steiger enforce FSD architecture with zero violations; boundaries/dependencies rule uses v6 object-based selectors**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T18:07:25Z
- **Completed:** 2026-03-31T18:09:25Z
- **Tasks:** 1/2 (Task 2 is checkpoint:human-verify)
- **Files modified:** 1

## Accomplishments
- Migrated eslint-plugin-boundaries from deprecated `element-types` rule to v6 `dependencies` rule with object-based selectors
- Verified all three linting tools pass with zero errors and zero warnings: eslint-plugin-boundaries (FSD layer direction), eslint-plugin-import-x (import hygiene), steiger (FSD structure)
- Confirmed `npm run lint` runs both eslint and steiger successfully with clean output

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure steiger FSD linter, eslint-plugin-boundaries, and eslint-plugin-import** - `906b199` (feat)
2. **Task 2: Visual verification of complete Phase 5 shell** - PENDING (checkpoint:human-verify)

## Files Created/Modified
- `eslint.config.js` - Migrated boundaries/element-types to boundaries/dependencies v6 object-based selectors

## Decisions Made
- **boundaries/dependencies v6 syntax**: Plan specified `boundaries/element-types` but that rule name is deprecated in eslint-plugin-boundaries v6.0.2. Migrated to `boundaries/dependencies` with object-based selectors (`{ from: { type: 'app' }, allow: { to: { type: [...] } } }`) to eliminate deprecation warnings.
- **eslint-plugin-import-x**: The installed package is `eslint-plugin-import-x` (not `eslint-plugin-import`) as it has native ESLint flat config support. Rules use `import-x/` prefix. Plan explicitly allowed this alternative.
- **Config files pre-created by Plan 01 executor**: The eslint.config.js and steiger.config.ts were already created by the Plan 01 parallel executor with correct structure. Task 1 only needed to fix the deprecated boundaries rule syntax.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Migrated deprecated boundaries/element-types to boundaries/dependencies**
- **Found during:** Task 1 (lint verification)
- **Issue:** eslint-plugin-boundaries v6.0.2 emits deprecation warnings for `boundaries/element-types` rule and legacy string-based selectors
- **Fix:** Renamed rule to `boundaries/dependencies`, converted selector syntax from string (`{ from: 'app', allow: ['pages', ...] }`) to v6 objects (`{ from: { type: 'app' }, allow: { to: { type: [...] } } }`)
- **Files modified:** eslint.config.js
- **Verification:** `npx eslint src/` now produces zero output (no errors, no warnings)
- **Committed in:** 906b199

---

**Total deviations:** 1 auto-fixed (1 bug - deprecated syntax)
**Impact on plan:** Essential fix to use current eslint-plugin-boundaries v6 syntax. No scope creep.

## Issues Encountered
None - both eslint and steiger passed immediately after the boundaries rule migration.

## Known Stubs
None - this plan only configures linting tools, no application code stubs.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All FSD linting tools operational and passing
- TypeScript, ESLint (boundaries + import hygiene), and steiger all pass with zero issues
- Phase 5 deliverables (FND-01 through FND-05) complete pending visual verification
- Ready for Phase 6 (FSD + Zustand state management) after checkpoint approval

## Self-Check: PASSED

All key files verified present (eslint.config.js, steiger.config.ts, SUMMARY.md). Task 1 commit (906b199) verified in git log.

---
*Phase: 05-vite-scaffold-nextjs-teardown*
*Completed: 2026-03-31*
