# Phase 5: Vite Scaffold + Next.js Teardown - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Bootstrap the Tauri 2 + Vite 6 + React 19 SPA frontend project. Tear down all Next.js artifacts from the prototype, scaffold FSD directory structure with createHashRouter routing, port the full PF2e OKLCH design system, re-init shadcn/ui for Vite, and wire FSD linting. Phase ends with the app running in `npm run tauri dev` showing the full navigation shell with placeholder page content.

</domain>

<decisions>
## Implementation Decisions

### Font Loading
- **D-01:** Use Google Fonts via CSS `@import` from fonts.googleapis.com
- **D-02:** Specific font choice is Claude's discretion (Inter from prototype or alternative)

### Shell Porting Scope
- **D-03:** Full shell port — AppShell + AppSidebar + AppHeader + CommandPalette all ported from prototype in Phase 5
- **D-04:** All 8 routes scaffolded as placeholder pages: Dashboard, Combat, Encounters, Bestiary, Conditions, Items, Spells, Settings
- **D-05:** Placeholder pages show route name only — no real content until later phases

### Dark Mode
- **D-06:** Use `next-themes` for dark/light mode (works without Next.js, handles system preference, localStorage persistence)
- **D-07:** Dark theme is the default on first launch — PF2e dark fantasy aesthetic

### FSD Linting
- **D-08:** Full strictness from day one — all steiger rules + eslint-plugin-boundaries enabled as errors, not warnings
- **D-09:** Include both `eslint-plugin-boundaries` (FSD layer direction) AND `eslint-plugin-import` (import hygiene, no circular deps)

### Carried Forward (locked from prior decisions)
- **D-10:** createHashRouter mandatory — no server for HTML5 history in Tauri
- **D-11:** @vitejs/plugin-react (NOT swc — archived)
- **D-12:** shadcn/ui re-init with `rsc: false`; style=new-york, baseColor=neutral, iconLibrary=lucide
- **D-13:** Tailwind v4 with `@tailwindcss/vite` plugin, `@theme inline` with all PF2e OKLCH tokens
- **D-14:** @engine alias via vite-tsconfig-paths (single source of truth for path aliases)
- **D-15:** Splash-before-router pattern structure (shell only in Phase 5, no live DB)
- **D-16:** React 19 + Zustand 5
- **D-17:** FSD architecture: app/pages/widgets/features/entities/shared layers

### Claude's Discretion
- Exact steiger config file contents and individual rule configuration
- Specific font choice (Inter or alternative that fits design system)
- Internal file organization within shell components during port
- Exact eslint-plugin-import rule selection

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prototype Source (authoritative)
- `D:/parse_data/app/globals.css` — Complete OKLCH token set (13 PF2e tokens + all shadcn semantic tokens, dark+light)
- `D:/parse_data/components.json` — shadcn config (style=new-york, rsc=true needs changing to false)
- `D:/parse_data/app/layout.tsx` — Current Next.js layout with next/font, next-themes, @vercel/analytics (teardown targets)
- `D:/parse_data/components/app-shell.tsx` — AppShell layout structure
- `D:/parse_data/components/app-sidebar.tsx` — Sidebar nav items, usePathname usage (needs createHashRouter replacement)
- `D:/parse_data/components/app-header.tsx` — Header component
- `D:/parse_data/components/command-palette.tsx` — Command palette with useRouter (needs replacement)
- `D:/parse_data/components/theme-provider.tsx` — next-themes ThemeProvider wrapper

### Engine (consumed via @engine alias)
- `engine/index.ts` — Barrel export, must remain importable after project restructure

### Tauri Backend Shell
- `src-tauri/` — Existing Tauri 2 backend (Cargo.lock, icons, gen)

### UI Design Contract
- `.planning/phases/05-vite-scaffold-nextjs-teardown/05-UI-SPEC.md` — Visual/interaction contracts for Phase 5
- `.planning/phases/05-vite-scaffold-nextjs-teardown/05-RESEARCH.md` — Technical research with exact versions and recipes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 57 shadcn/ui components in `D:/parse_data/components/ui/` — file-copy to new project, fix imports
- 6 PF2e atom components in `D:/parse_data/components/pf2e/` — port with import path updates
- `D:/parse_data/lib/utils.ts` — cn() utility (clsx + tailwind-merge)
- Complete OKLCH token set in globals.css — copy verbatim

### Established Patterns
- shadcn new-york style with Radix primitives
- next-themes for dark/light toggle (ThemeProvider wraps app)
- cmdk-based CommandPalette for keyboard navigation
- AppShell layout: fixed sidebar (240px) + header + main content area

### Integration Points
- `src-tauri/` already exists — Vite project must integrate with Tauri 2 CLI
- `engine/` at project root — consumed via @engine tsconfig alias
- Root `package.json` currently engine-only — must be rewritten for full frontend project

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond what was discussed — standard approaches for all implementation details.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-vite-scaffold-nextjs-teardown*
*Context gathered: 2026-03-31*
