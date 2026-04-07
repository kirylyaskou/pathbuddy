---
phase: 06-description-sanitization
plan: 02
subsystem: ui
tags: [pf2e, html, sanitizer, vue3, click-delegation, event-handling, drizzle, sqlite, tdd]

# Dependency graph
requires:
  - phase: 06-01
    provides: "sanitizeDescription() pure HTML-in/HTML-out transformer"
provides:
  - "CreatureDetailPanel.getDescription() now pipes raw HTML through sanitizeDescription() before v-html rendering"
  - "handleDescriptionClick() event delegation on panelEl: DB lookup by sourceId, navigate or mute on result"
  - "4 new test cases covering sanitized rendering and click delegation behavior"
affects: [any consumer of CreatureDetailPanel description rendering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Watch template ref (panelEl) directly to attach event listeners — avoids timing issue with v-if DOM creation"
    - "Event delegation on panel root element for .pf2e-link clicks — single listener covers all expanded descriptions"
    - "sourceId format: Compendium.pf2e.{pack}.Item.{id} — constructed from data-entity-pack and data-entity-id attributes"
    - "Muted link style: classList.add(text-gray-400, cursor-not-allowed) on DB miss without navigation"

key-files:
  created: []
  modified:
    - src/components/CreatureDetailPanel.vue
    - src/components/__tests__/CreatureDetailPanel.test.ts

key-decisions:
  - "Watch panelEl ref instead of store.isOpen: panelEl is inside v-if, watching the ref directly ensures listener is attached after DOM element exists regardless of mount timing"
  - "Event delegation on panelEl root (not per-description containers): one listener covers all expanded descriptions via bubbling, avoids multiple-ref-for-multiple-expanded-items pitfall from RESEARCH.md"

patterns-established:
  - "TDD RED-GREEN: write failing tests first, commit, implement to green, commit"
  - "Mock chainable Drizzle query builder in tests: vi.fn().mockReturnThis() chain with separate mockLimit handle"

requirements-completed: [DESC-01]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 6 Plan 02: CreatureDetailPanel UI Wiring Summary

**sanitizeDescription() wired into getDescription() and pf2e-link click delegation added to panelEl — entity links now navigate the detail panel or apply muted style based on DB lookup**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-20T09:30:53Z
- **Completed:** 2026-03-20T09:33:33Z
- **Tasks:** 1 (TDD: RED + GREEN commits)
- **Files modified:** 2

## Accomplishments
- `getDescription()` in CreatureDetailPanel now calls `sanitizeDescription(raw)` before returning — all v-html descriptions render clean HTML with no raw @-syntax tokens
- `handleDescriptionClick()` async handler looks up clicked `.pf2e-link` element's `data-entity-pack` + `data-entity-id` attributes, constructs sourceId, queries DB, and either calls `store.navigateToCanonical()` or applies muted style
- Event delegation attached to `panelEl` via `watch(panelEl, ...)` — single listener covers all expanded description sections
- 4 new test cases added: @Damage rendering, @UUID rendering, click-found navigates, click-not-found mutes
- Full test suite: 130 tests, 11 files — zero regressions

## Task Commits

TDD RED-GREEN flow — two atomic commits:

1. **RED: Failing tests** - `7207c13` (test)
2. **GREEN: Implementation** - `759356a` (feat)

## Files Created/Modified
- `src/components/CreatureDetailPanel.vue` - Added sanitizeDescription import and usage in getDescription(), handleDescriptionClick() async function, watch(panelEl) listener attachment, onBeforeUnmount cleanup
- `src/components/__tests__/CreatureDetailPanel.test.ts` - Added mocks for @/lib/database, drizzle-orm, @/lib/schema; added 4 new test cases for sanitized rendering and click delegation

## Decisions Made
- **Watch panelEl ref directly** rather than watching `store.isOpen` + nextTick: when `store.openCreature()` is called before `mount()` in tests (or real usage where component already exists), the `isOpen` watch fires during initialization when `panelEl.value` is still null. Watching `panelEl` itself fires only when the DOM element actually becomes available — correct in all timing scenarios.
- **Single listener on panel root**: The plan's RESEARCH.md documented the "multiple expanded items / single ref" pitfall. Using event delegation on panelEl means one listener catches bubbled clicks from any expanded description section.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] panelEl watch timing fix for mount-before-openCreature test pattern**
- **Found during:** Task 1 GREEN (running tests after implementation)
- **Issue:** Plan specified `watch(() => store.isOpen, async (isOpen) => { if (isOpen) { await nextTick(); panelEl.value?.addEventListener(...) } })`. In tests where `store.openCreature()` runs before `mount()`, the watch fires with `isOpen=true` during component initialization — `panelEl.value` is null at that point even after nextTick because the component isn't yet mounted.
- **Fix:** Changed to `watch(panelEl, (el) => { if (el) { el.addEventListener('click', handleDescriptionClick) } })` — watches the ref directly, fires only when the DOM element is actually created, correct in all timing scenarios (tests, real usage).
- **Files modified:** src/components/CreatureDetailPanel.vue
- **Verification:** All 4 new click-delegation tests pass; full suite 130/130 green
- **Committed in:** 759356a (GREEN task commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required timing correction for event listener attachment. No scope creep. All planned behavior implemented as specified.

## Issues Encountered
None beyond the timing fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 6 complete: sanitizeDescription() built (Plan 01) and wired into UI with click delegation (Plan 02)
- Descriptions now render clean PF2e HTML with interactive entity links throughout the CreatureDetailPanel
- No blockers for subsequent phases

---
*Phase: 06-description-sanitization*
*Completed: 2026-03-20*
