---
phase: 08-tech-debt-cleanup
plan: 02
subsystem: ui-design-system, lib-utilities
tags: [dark-fantasy, design-tokens, tailwind, weak-elite, internal-api]
dependency_graph:
  requires: []
  provides: [themed-splash-screen, internal-getAdjustedLevel]
  affects: [src/components/SplashScreen.vue, src/lib/weak-elite.ts, src/lib/__tests__/weak-elite.test.ts]
tech_stack:
  added: []
  patterns: [__testing-namespace, JSDoc-@internal, dark-fantasy-design-tokens]
key_files:
  modified:
    - src/components/SplashScreen.vue
    - src/lib/weak-elite.ts
    - src/lib/__tests__/weak-elite.test.ts
decisions:
  - "08-02: SplashScreen uses bg-charcoal-950 (not bg-gray-900) as base — consistent with app shell charcoal palette"
  - "08-02: getAdjustedLevel kept exported but scoped under __testing namespace — no production callers, tests intact"
  - "08-02: text-stone-300/text-stone-400 used for readable body copy on dark/crimson backgrounds — stone neutrals available from Tailwind core"
metrics:
  duration: ~2min
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_modified: 3
requirements_completed: [WORK-01, WORK-02, WORK-03, WORK-04, WORK-05]
---

# Phase 08 Plan 02: Tech Debt Cleanup — Theme + Export Cleanup Summary

**One-liner:** SplashScreen fully themed with charcoal/gold/crimson tokens and getAdjustedLevel scoped to __testing namespace.

## What Was Built

Two targeted cleanup items identified in the v1.1 milestone audit:

1. **SplashScreen.vue restyle** — The only component still using light-theme Tailwind classes was SplashScreen.vue. All eight offending classes replaced with dark fantasy equivalents from the established charcoal/gold/crimson palette. The Cinzel display font (font-display) was added to the app title and error heading to match the sidebar heading pattern.

2. **getAdjustedLevel encapsulation** — The function had no production callers but was a top-level `export function`. The `export` keyword was removed and a `__testing` namespace object added at the bottom of the file. The test file import was updated to destructure from `__testing`. All 27 existing tests continue to pass unchanged.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 — SplashScreen restyle | 9ea2152 | feat(08-02): restyle SplashScreen with dark fantasy design tokens |
| Task 2 — getAdjustedLevel internal | ee1240d | refactor(08-02): make getAdjustedLevel internal via __testing export |

## Class Replacements (Task 1)

| Before | After | Location |
|--------|-------|----------|
| `bg-gray-900` | `bg-charcoal-950` | Outer container |
| `border-gray-700` | `border-charcoal-600` | Loading spinner ring |
| `border-t-blue-500` | `border-t-gold` | Loading spinner accent |
| `text-gray-300` | `text-stone-400` | Status message |
| `bg-red-50` | `bg-crimson-dark` | Error card background |
| `text-red-600` (heading) | `text-crimson-light` | Error heading |
| `text-red-600` (body) | `text-stone-300` | Error description |
| `bg-blue-600` | `bg-gold-dark` | Retry button base |
| `text-white` (button) | `text-charcoal-950` | Retry button text |
| `hover:bg-blue-700` | `hover:bg-gold` | Retry button hover |
| *(added)* | `font-display` | App title + error heading |

## Decisions Made

- **08-02: SplashScreen uses bg-charcoal-950 as base** — Deepest charcoal shade matches full-viewport overlay feel; consistent with rest of app's darkest backgrounds.
- **08-02: getAdjustedLevel under __testing namespace** — Keeps all 27 existing tests passing without any test logic changes; removes function from public API surface without test breakage. Pattern mirrors common "internal for testing" conventions.
- **08-02: text-stone-300/text-stone-400 for body copy** — Tailwind core stone neutrals read well on dark/crimson backgrounds; avoids introducing new custom tokens.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- `grep -cE "text-gray-300|bg-blue-600|bg-red-50|text-red-600|bg-blue-700" src/components/SplashScreen.vue` → **0** (no light-theme classes)
- `grep -c "bg-charcoal-950" src/components/SplashScreen.vue` → **1**
- `grep -c "border-t-gold" src/components/SplashScreen.vue` → **1**
- `grep -c "bg-crimson-dark" src/components/SplashScreen.vue` → **1**
- `grep -c "bg-gold-dark" src/components/SplashScreen.vue` → **1**
- `grep -c "font-display" src/components/SplashScreen.vue` → **2**
- `grep -c "^export function getAdjustedLevel" src/lib/weak-elite.ts` → **0**
- `grep -c "^function getAdjustedLevel" src/lib/weak-elite.ts` → **1**
- `grep -c "__testing" src/lib/weak-elite.ts` → **1**
- Full test suite: **331 tests passed, 23 test files, 0 failures**

## Self-Check: PASSED

- FOUND: src/components/SplashScreen.vue
- FOUND: src/lib/weak-elite.ts
- FOUND: src/lib/__tests__/weak-elite.test.ts
- FOUND: .planning/phases/08-tech-debt-cleanup/08-02-SUMMARY.md
- FOUND commit: 9ea2152 (Task 1)
- FOUND commit: ee1240d (Task 2)
