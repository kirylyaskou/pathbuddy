---
phase: 01-bug-fix-and-ui-improvements
plan: 03
subsystem: ui
tags: [vue3, tailwind, combat-tracker, dark-theme, creature-card]

# Dependency graph
requires:
  - phase: 01-01
    provides: AppLayout with overflow constraints and charcoal/gold/crimson design tokens
  - phase: 01-02
    provides: HPController (already dark-themed), ConditionBadge component with CONDITION_BADGE_CLASSES
provides:
  - CreatureCard with dark fantasy three-column layout, initiative badge, HP bar, ConditionBadge integration
  - CombatTracker with dark sticky toolbar, gold accents, correct empty state copywriting
  - AddCreatureForm dark modal with gold submit, Discard cancel, CONDITION_BADGE_CLASSES condition pills
affects: [future combat UI plans]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-column creature card layout: initiative badge | creature info | HP+controls"
    - "HP bar with threshold colors: bg-gold (>50%), bg-amber-600 (26-50%), bg-crimson-light (<=25%)"
    - "setConditionValue event bubbling: ConditionBadge -> CreatureCard -> CombatTracker -> store"
    - "CONDITION_BADGE_CLASSES used in AddCreatureForm condition pills (no dynamic class construction)"

key-files:
  created: []
  modified:
    - src/components/CreatureCard.vue
    - src/components/CombatTracker.vue
    - src/components/AddCreatureForm.vue

key-decisions:
  - "setConditionValue event added to CreatureCard emits — ConditionBadge emits up to CreatureCard which bubbles to CombatTracker which calls store"
  - "CombatTracker outermost element is plain div (no min-h-screen/bg) — AppLayout provides bg-charcoal-800 background"
  - "AddCreatureForm cancel button renamed to 'Discard' per UI-SPEC copywriting contract"

patterns-established:
  - "Condition value propagation: badge click -> ConditionBadge emit -> CreatureCard handleSetConditionValue -> parent CombatTracker -> combatStore.setConditionValue"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-03-20
---

# Phase 01 Plan 03: CreatureCard, CombatTracker, and AddCreatureForm Dark Fantasy Redesign Summary

**Three-component dark fantasy UI overhaul: initiative badge with HP threshold bar on CreatureCard, sticky dark toolbar with gold accents on CombatTracker, and dark charcoal modal with CONDITION_BADGE_CLASSES pills on AddCreatureForm**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-20T15:05:00Z
- **Completed:** 2026-03-20T15:13:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- CreatureCard fully replaced with three-column dark layout: circular initiative badge, creature name/stats/conditions, HP fraction + bar + controls
- HP bar uses threshold-based colors (gold > 50%, amber 26-50%, crimson <= 25%) via computed `hpPercent` and `hpBarColor`
- CombatTracker toolbar is now sticky charcoal-900 with gold round number, charcoal buttons, and gold "Add Creature" CTA — no more min-h-screen white wrapper
- Drag-over highlight changed from ring-blue-400 to ring-gold
- AddCreatureForm modal is dark charcoal-600 with gold submit button, "Discard" cancel, and CONDITION_BADGE_CLASSES static condition pills (eliminates dynamic bg-${color} JIT failure)

## Task Commits

Each task was committed atomically:

1. **Task 1: CreatureCard full dark fantasy redesign** - `a03c77b` (feat)
2. **Task 2: CombatTracker dark toolbar + AddCreatureForm dark modal** - `9300879` (feat)

## Files Created/Modified
- `src/components/CreatureCard.vue` - Full dark fantasy redesign with initiative badge, HP bar, ConditionBadge integration, setConditionValue emit
- `src/components/CombatTracker.vue` - Dark sticky toolbar, gold accents, ring-gold drag highlight, setConditionValue handler
- `src/components/AddCreatureForm.vue` - Dark charcoal modal, CONDITION_BADGE_CLASSES condition pills, Discard/gold-submit buttons

## Decisions Made
- `setConditionValue` added to CreatureCard emits to propagate ConditionBadge's value decrement events up to CombatTracker, which calls `combatStore.setConditionValue` — consistent with Plan 02 design where ConditionBadge is props-in/emits-out with no store imports
- CombatTracker outermost element is a plain `<div>` (no background/min-height) — AppLayout's `<main>` provides the charcoal-800 background from Plan 01
- AddCreatureForm cancel button text changed to "Discard" matching the UI-SPEC copywriting contract established in Phase 01

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three primary combat UI components are fully dark-themed with gold accents
- setConditionValue event chain is complete: ConditionBadge -> CreatureCard -> CombatTracker -> store
- Ready for Plan 04 (remaining UI improvements or bug fixes in the phase)

---
*Phase: 01-bug-fix-and-ui-improvements*
*Completed: 2026-03-20*
