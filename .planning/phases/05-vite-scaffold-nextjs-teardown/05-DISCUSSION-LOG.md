# Phase 5: Vite Scaffold + Next.js Teardown - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 05-vite-scaffold-nextjs-teardown
**Areas discussed:** Font loading strategy, Shell porting scope, Dark mode approach, Steiger/lint strictness

---

## Font Loading Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Self-hosted Inter (Recommended) | Bundle Inter font files in src/assets/fonts. Works fully offline, ~100KB. | |
| System font stack | Use -apple-system, Segoe UI, etc. Zero font files, varies per OS. | |
| Google Fonts @import | CSS @import from fonts.googleapis.com. Simplest migration. | ✓ |
| You decide | Claude picks the best approach. | |

**User's choice:** Google Fonts @import
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Inter | Same font as prototype — visual continuity. | |
| You decide | Claude picks whichever works best. | ✓ |

**User's choice:** You decide (Claude's discretion on font choice)
**Notes:** None

---

## Shell Porting Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full shell port (Recommended) | Port AppShell + AppSidebar + AppHeader + CommandPalette. Phase 5 ends looking like the real app. | ✓ |
| Skeleton only | Bare sidebar with route links, no AppHeader/CommandPalette. | |
| You decide | Claude determines optimal porting scope. | |

**User's choice:** Full shell port
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| All 8 routes | Port all routes from prototype as placeholders. Shows full app vision. | ✓ |
| Only v0.3.0 routes | Only scaffold routes getting content in this milestone. | |
| You decide | Claude determines which routes. | |

**User's choice:** All 8 routes
**Notes:** None

---

## Dark Mode Approach

| Option | Description | Selected |
|--------|-------------|----------|
| next-themes (Recommended) | Keep using next-themes — works without Next.js, handles system preference, 2KB. | ✓ |
| Hardcoded dark only | Just set class="dark" on html. No toggle, no system preference. | |
| You decide | Claude picks the approach. | |

**User's choice:** next-themes
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Dark (Recommended) | Dark by default — matches UI-SPEC, PF2e dark fantasy aesthetic. | ✓ |
| System preference | Respect OS dark/light setting on first launch. | |

**User's choice:** Dark default
**Notes:** None

---

## Steiger/Lint Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Full strictness (Recommended) | All steiger rules + eslint-plugin-boundaries as errors from day one. | ✓ |
| Lenient start | Rules as warnings first, promote to errors in Phase 6. | |
| You decide | Claude picks appropriate strictness. | |

**User's choice:** Full strictness
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Both plugins | eslint-plugin-boundaries + eslint-plugin-import for comprehensive coverage. | ✓ |
| Boundaries only | Just eslint-plugin-boundaries for FSD layer direction. | |
| You decide | Claude determines optimal plugin set. | |

**User's choice:** Both plugins
**Notes:** None

---

## Claude's Discretion

- Specific font choice (Inter or alternative)
- Exact steiger config file contents
- Internal file organization within shell components
- Exact eslint-plugin-import rule selection

## Deferred Ideas

None — discussion stayed within phase scope.
