# Phase 5: Vite Scaffold + Next.js Teardown - Research

**Researched:** 2026-03-31
**Domain:** Tauri 2 + Vite 6 + React 19 SPA bootstrap — Next.js elimination, createHashRouter, Tailwind v4 OKLCH design system, shadcn/ui Vite re-init, FSD linting setup
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from STATE.md / accumulated decisions)

### Locked Decisions
- Next.js to Vite+React — SSR unnecessary for Tauri desktop SPA; `createHashRouter` mandatory (no server for HTML5 history)
- `@vitejs/plugin-react` (NOT swc — archived) for Vite React support
- FSD architecture for frontend layers (app/pages/widgets/features/entities/shared)
- shadcn/ui (Radix) component library stays; re-init with `rsc: false` for Vite
- Splash-before-router pattern for async DB initialization (Phase 5 scope: structure only, not live DB)
- `createHashRouter` for Tauri (no server for HTML5 history)
- `@engine` alias via `vite-tsconfig-paths` (single source of truth for path aliases)
- Tailwind v4 with OKLCH tokens — `@tailwindcss/vite` plugin, NOT postcss
- React 19 + Zustand 5
- Keep React — no Vue port

### Claude's Discretion
- Exact steiger config file contents and rule strictness
- Whether to include `eslint-plugin-import` alongside `eslint-plugin-boundaries`
- Whether to default to dark mode via simple class toggle or full `next-themes` (still works without Next.js)
- Font loading strategy: `next/font/google` used in prototype → plain CSS `@import` or system font fallback in Vite

### Deferred Ideas (OUT OF SCOPE for Phase 5)
- SQLite / Drizzle reconnection (Phase 7)
- Zustand store implementations beyond shell scaffolding (Phase 6)
- FSD layer content beyond app/, pages/ placeholders, shared/lib/cn.ts (Phase 6)
- Any real data wiring (mock data removal is Phase 7)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FND-01 | Next.js prototype ported to Vite 6 + React 19 SPA with Tauri 2 dev mode working | Vite 6.x + @vitejs/plugin-react + @tauri-apps/cli — full scaffold recipe below |
| FND-02 | React Router v7 (library mode, `createHashRouter`) replaces Next.js App Router with all page routes | createHashRouter with RouterProvider — exact API in Code Examples |
| FND-03 | Tailwind v4 `@theme inline` configured with all PF2e OKLCH color tokens from prototype | Full globals.css inventoried — 13 PF2e tokens + sidebar + all shadcn tokens confirmed in @theme inline |
| FND-04 | shadcn/ui re-initialized for Vite (`rsc: false`), all 60+ Radix components available | 57 UI components + 6 PF2e atoms confirmed in D:/parse_data — `npx shadcn@latest init` auto-detects Vite |
| FND-05 | `steiger` FSD linter + `eslint-plugin-boundaries` enforce layer import direction | steiger@0.5.11 + @feature-sliced/steiger-plugin@0.5.7 installed globally; eslint@10.x + eslint-plugin-boundaries@6.x |
</phase_requirements>

---

## Summary

Phase 5 creates the frontend project from scratch inside the existing Tauri 2 shell. The repo currently has `/engine` (complete), `src-tauri/` (Tauri 2 backend shell — only Cargo.lock and icons present, no tauri.conf.json or lib.rs visible at standard paths), and a root `package.json` that is currently the engine-only package. The frontend `src/` directory does not exist yet.

The primary work is: (1) rewrite `package.json` and `vite.config.ts` to be the Tauri+Vite frontend project instead of the engine-only project; (2) install all frontend dependencies; (3) create the minimal FSD `src/` skeleton with placeholder pages wired to `createHashRouter`; (4) port the `globals.css` with all OKLCH tokens (already fully authored in prototype); (5) re-initialize shadcn/ui with `rsc: false`; (6) wire `steiger` + `eslint-plugin-boundaries` into the lint script.

The prototype at `D:/parse_data` is the authoritative source for (a) the complete `globals.css` — all OKLCH tokens are already correct and in `@theme inline`, (b) all 57 shadcn/ui components + 6 PF2e atoms, and (c) the exact Next.js import pattern inventory that must be replaced. Only `app-sidebar.tsx` (`usePathname`, `Link` from `next/link`) and `command-palette.tsx` (`useRouter`) contain Next.js navigation. The `layout.tsx` has `next/font/google`, `@vercel/analytics`, and `next-themes` — all three are removed in the Vite version.

**Primary recommendation:** Bootstrap a new `src/` FSD skeleton (not a Copy of the prototype), then port the design tokens, shadcn components, and navigation shell as discrete tasks. The prototype's page components are too large (combat: 1,358 lines; encounters: 400 lines) to copy — port only the shell (`AppShell`, `AppSidebar`, `AppHeader`, `CommandPalette`) and create thin placeholder pages for each route.

---

## Standard Stack

### Core (confirmed versions as of 2026-03-31)

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| `vite` | `^6.3.x` (6.3.x latest) | Build tool + dev server | npm registry |
| `@vitejs/plugin-react` | `^6.0.1` | React Fast Refresh + JSX transform (Oxc-powered) | npm: 6.0.1 |
| `react` | `19.2.4` | UI framework | prototype package.json |
| `react-dom` | `19.2.4` | DOM renderer | prototype package.json |
| `typescript` | `5.7.3` | Type safety | prototype package.json |
| `tailwindcss` | `^4.2.2` | Utility CSS | npm: 4.2.2 |
| `@tailwindcss/vite` | `^4.2.2` | Tailwind v4 Vite plugin (NOT postcss) | npm: 4.2.2 |
| `tw-animate-css` | `1.3.3` | Animation utilities (used in prototype globals.css) | prototype package.json |

### Routing

| Library | Version | Purpose |
|---------|---------|---------|
| `react-router-dom` | `^7.13.2` | SPA routing, library mode with `createHashRouter` |

### UI + Components

| Library | Version | Purpose |
|---------|---------|---------|
| `class-variance-authority` | `^0.7.1` | shadcn variant system |
| `clsx` | `^2.1.1` | Conditional class merging |
| `tailwind-merge` | `^3.3.1` | Tailwind conflict resolution |
| `lucide-react` | `^0.564.0` | Icons |
| `next-themes` | `^0.4.6` | Dark mode toggle (works without Next.js — CSS-agnostic) |
| `sonner` | `^1.7.1` | Toast notifications |
| `cmdk` | `1.1.1` | Command palette |
| `vaul` | `^1.1.2` | Drawer |
| `react-resizable-panels` | `^2.1.7` | Split-pane layout |
| All `@radix-ui/*` packages | (from prototype) | 25+ Radix primitives via shadcn CLI |

### FSD Architecture Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| `steiger` | `^0.5.11` | FSD architectural linter |
| `@feature-sliced/steiger-plugin` | `^0.5.7` | FSD rule definitions |
| `vite-tsconfig-paths` | `^6.1.1` | Sync tsconfig paths into Vite (single source of truth) |
| `eslint-plugin-boundaries` | `^6.0.2` | Import direction enforcement |
| `eslint` | `^10.1.0` | Linting runner |

### Tauri 2 Frontend Integration

| Library | Version | Purpose |
|---------|---------|---------|
| `@tauri-apps/api` | `^2.10.1` | IPC, `invoke()` — Phase 5 installs but uses minimally |
| `@tauri-apps/cli` | `^2.x` | Dev server runner (`tauri dev`) |

### DevDependencies

| Tool | Version | Purpose |
|------|---------|---------|
| `@types/react` | `19.2.14` | React TypeScript types |
| `@types/react-dom` | `19.2.3` | React DOM types |
| `@types/node` | `^22` | Node type stubs for vite.config.ts |

### Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `@vitejs/plugin-react` | `@vitejs/plugin-react-swc` | Archived — repository read-only |
| `createHashRouter` | `createBrowserRouter` | No server in Tauri WebView — hash routing required |
| `@tailwindcss/vite` plugin | postcss + `@tailwindcss/postcss` | Vite Tailwind v4 official path; prototype uses postcss only because it's Next.js |
| `vite-tsconfig-paths` | Manual alias in vite.config.ts | Two places to maintain; vite-tsconfig-paths gives single source of truth |
| `steiger` + `eslint-plugin-boundaries` | `@feature-sliced/eslint-config` alone | steiger checks structural rules (file naming, layer counts) beyond what ESLint sees |

**Installation command (Phase 5 scope):**
```bash
npm install react@19.2.4 react-dom@19.2.4 react-router-dom@^7 \
  class-variance-authority clsx tailwind-merge lucide-react \
  next-themes sonner cmdk vaul react-resizable-panels \
  @tauri-apps/api@^2

npm install -D vite@^6 @vitejs/plugin-react@^6 \
  tailwindcss@^4 @tailwindcss/vite tw-animate-css \
  vite-tsconfig-paths \
  steiger @feature-sliced/steiger-plugin \
  eslint eslint-plugin-boundaries \
  @types/react@19 @types/react-dom@19 @types/node@^22 \
  typescript@5.7.3
```

Note: `npm install` may need `--legacy-peer-deps` if Radix packages have peer dep declarations that haven't updated for React 19. The STATE.md already flags this.

**shadcn/ui initialization (run after vite.config.ts is in place):**
```bash
npx shadcn@latest init
# Auto-detects Vite, sets "rsc": false, prompts for CSS path
```

---

## Architecture Patterns

### Minimal FSD src/ Skeleton for Phase 5

Phase 5 creates only what is needed to satisfy the 5 success criteria. The full FSD population is Phase 6.

```
src/
├── app/
│   ├── router.tsx          # createHashRouter — all 7 routes
│   ├── providers.tsx       # ThemeProvider + Toaster
│   └── styles/
│       └── globals.css     # Tailwind v4 + full OKLCH token set
│
├── pages/
│   ├── dashboard/
│   │   └── index.tsx       # Placeholder renders AppShell + "Dashboard"
│   ├── combat/
│   │   └── index.tsx       # Placeholder
│   ├── bestiary/
│   │   └── index.tsx       # Placeholder
│   ├── encounters/
│   │   └── index.tsx       # Placeholder
│   ├── conditions/
│   │   └── index.tsx       # Placeholder
│   ├── spells/
│   │   └── index.tsx       # Placeholder
│   ├── items/
│   │   └── index.tsx       # Placeholder
│   └── settings/
│       └── index.tsx       # Placeholder
│
├── widgets/
│   └── app-shell/
│       ├── ui/
│       │   ├── AppShell.tsx      # Port from prototype — remove "use client", no logic changes
│       │   ├── AppSidebar.tsx    # Port + replace next/link → Link, usePathname → useLocation
│       │   ├── AppHeader.tsx     # Port — no Next.js deps, straightforward
│       │   └── CommandPalette.tsx # Port + replace useRouter → useNavigate
│       └── index.ts
│
└── shared/
    ├── lib/
    │   └── cn.ts            # clsx + tailwind-merge (identical to prototype lib/utils.ts)
    ├── ui/
    │   └── [shadcn components]  # Re-initialized via shadcn CLI; 57 components from prototype
    └── routes/
        └── paths.ts         # Route path constants

engine/   # existing — untouched
src-tauri/ # existing — untouched
```

### Pattern 1: Tauri-Compatible Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),  // reads tsconfig.json paths
  ],
  clearScreen: false,  // Required: don't obscure Rust error output
  server: {
    strictPort: true,   // Fail fast if port unavailable
    host: process.env.TAURI_DEV_HOST || false,
    port: 5173,
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})
```

### Pattern 2: tsconfig.json Paths (Single Source of Truth)

The existing tsconfig.json includes only `engine/**/*.ts`. It must be replaced to cover the `src/` tree:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@engine": ["engine/index.ts"],
      "@engine/*": ["engine/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "engine/**/*.ts"]
}
```

### Pattern 3: createHashRouter — Tauri-Mandatory Routing

```typescript
// src/app/router.tsx
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { DashboardPage } from '@/pages/dashboard'
import { CombatPage } from '@/pages/combat'
import { BestiaryPage } from '@/pages/bestiary'
import { EncountersPage } from '@/pages/encounters'
import { ConditionsPage } from '@/pages/conditions'
import { SpellsPage } from '@/pages/spells'
import { ItemsPage } from '@/pages/items'
import { SettingsPage } from '@/pages/settings'
import { AppShell } from '@/widgets/app-shell'

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'combat', element: <CombatPage /> },
      { path: 'bestiary', element: <BestiaryPage /> },
      { path: 'encounters', element: <EncountersPage /> },
      { path: 'conditions', element: <ConditionsPage /> },
      { path: 'spells', element: <SpellsPage /> },
      { path: 'items', element: <ItemsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
```

AppShell renders `<Outlet />` from react-router-dom where the page content goes.

### Pattern 4: main.tsx Entry Point

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRouter } from './app/router'
import { AppProviders } from './app/providers'
import './app/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>
)
```

Note: Splash-before-router (DB migration await) is a Phase 7 concern. Phase 5 mounts immediately.

### Pattern 5: Next.js Import Replacement Map

All occurrences found in prototype:

| File | Next.js Import | Vite/React Router Replacement |
|------|---------------|-------------------------------|
| `layout.tsx` | `import type { Metadata, Viewport } from 'next'` | Delete — Vite SPA has no Metadata API |
| `layout.tsx` | `import { Inter, JetBrains_Mono } from 'next/font/google'` | CSS `@import url(...)` or load via Vite asset |
| `layout.tsx` | `import { Analytics } from '@vercel/analytics/next'` | Delete entirely |
| `layout.tsx` | `<ThemeProvider>` with next-themes | `<ThemeProvider>` with next-themes but standalone (works without Next.js) |
| `app-sidebar.tsx` | `import Link from "next/link"` | `import { Link } from 'react-router-dom'` |
| `app-sidebar.tsx` | `<Link href="/path">` | `<Link to="/path">` |
| `app-sidebar.tsx` | `usePathname()` | `useLocation().pathname` |
| `command-palette.tsx` | `useRouter()` | `const navigate = useNavigate()` |
| `command-palette.tsx` | `router.push('/path')` | `navigate('/path')` |
| `theme-provider.tsx` | `from 'next-themes'` | Keep — `next-themes` works without Next.js |
| All pages | `"use client"` directive | Delete — all Vite components are client-only |

Only 4 files contain Next.js-specific code: `layout.tsx`, `app-sidebar.tsx`, `command-palette.tsx`, `theme-provider.tsx`. No individual page.tsx file imports from `next/` directly.

### Pattern 6: Tailwind v4 CSS Setup — globals.css

The prototype already has the correct `@theme inline` structure. Port it verbatim with one adjustment: the prototype uses `'app/globals.css'` as the CSS path; Vite uses `'src/app/styles/globals.css'`. Content is identical.

Full token inventory confirmed in prototype `app/globals.css`:

**shadcn/ui semantic tokens (in `@theme inline`):**
`background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`, `chart-1..5`, `radius-sm/md/lg/xl`

**Sidebar tokens (in `@theme inline`):**
`sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring`

**PF2e OKLCH tokens (in `@theme inline`):**
`pf-gold`, `pf-gold-dim`, `pf-parchment`, `pf-blood`, `pf-threat-trivial`, `pf-threat-low`, `pf-threat-moderate`, `pf-threat-severe`, `pf-threat-extreme`, `pf-rarity-common`, `pf-rarity-uncommon`, `pf-rarity-rare`, `pf-rarity-unique`

**Custom utility classes (in `@layer utilities`):**
`golden-glow`, `golden-border`, `text-gold`, `bg-gold`, `metallic-gold`, `parchment-texture`, `card-grimdark`, `stat-block-header`

The `@custom-variant dark (&:is(.dark *))` line must be included — this is how Tailwind v4 handles the `.dark` class selector variant.

### Pattern 7: shadcn/ui Re-initialization

```bash
# 1. Run in project root after vite.config.ts exists
npx shadcn@latest init

# It asks:
# - Tailwind CSS? → Yes (auto-detects via @tailwindcss/vite)
# - CSS file → src/app/styles/globals.css
# - Path alias (@) → @/src  (matches tsconfig paths @/* → src/*)
# - rsc? → NO (auto-set to false for Vite projects)
```

The resulting `components.json` should have:
```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "css": "src/app/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/shared/ui",
    "utils": "@/shared/lib/utils",
    "ui": "@/shared/ui",
    "lib": "@/shared/lib",
    "hooks": "@/shared/hooks"
  }
}
```

Alias paths must be adjusted to match FSD `shared/ui/` placement instead of prototype's `@/components/ui/`.

After init, copy all 57 component files from `D:/parse_data/components/ui/` to `src/shared/ui/` and remove any `"use client"` directives (harmless but unnecessary in Vite).

Also copy the 6 PF2e atom components from `D:/parse_data/components/pf2e/`: `action-icon.tsx`, `creature-card.tsx`, `creature-stat-block.tsx`, `level-badge.tsx`, `stat-badge.tsx`, `trait-pill.tsx`, `xp-budget-bar.tsx` → `src/shared/ui/`.

### Pattern 8: steiger Configuration

```typescript
// steiger.config.ts
import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ['src/app/**'],  // app/ is allowed to import from all layers (it's the root)
  },
])
```

### Pattern 9: eslint-plugin-boundaries Configuration

```javascript
// eslint.config.js  (ESLint 10 flat config)
import boundaries from 'eslint-plugin-boundaries'

export default [
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app',      pattern: 'src/app/**' },
        { type: 'pages',    pattern: 'src/pages/**' },
        { type: 'widgets',  pattern: 'src/widgets/**' },
        { type: 'features', pattern: 'src/features/**' },
        { type: 'entities', pattern: 'src/entities/**' },
        { type: 'shared',   pattern: 'src/shared/**' },
      ],
    },
    rules: {
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: 'app',      allow: ['pages', 'widgets', 'features', 'entities', 'shared'] },
          { from: 'pages',    allow: ['widgets', 'features', 'entities', 'shared'] },
          { from: 'widgets',  allow: ['features', 'entities', 'shared'] },
          { from: 'features', allow: ['entities', 'shared'] },
          { from: 'entities', allow: ['shared'] },
          { from: 'shared',   allow: [] },
        ],
      }],
    },
  },
]
```

### Pattern 10: package.json Scripts

The existing `package.json` is engine-only. Phase 5 replaces it:

```json
{
  "name": "pathbuddy",
  "version": "0.3.0-pre-alpha",
  "type": "module",
  "scripts": {
    "dev": "tauri dev",
    "build": "tauri build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/ && steiger src/"
  }
}
```

### Anti-Patterns to Avoid

- **Copying prototype pages 1-for-1:** Combat page is 1,358 lines, encounters is 400 lines — these are fat Next.js pages with all state as `useState`. Phase 5 creates placeholder pages only. Real ports happen in Phases 8 and 9.
- **Using `createBrowserRouter`:** Tauri WebView has no server. Hash routing is mandatory.
- **PostCSS config for Tailwind:** The prototype uses `@tailwindcss/postcss` because it's Next.js. Vite uses `@tailwindcss/vite` plugin. Do not create `postcss.config.mjs` in the Vite project.
- **Leaving `"include": ["engine/**/*.ts"]` in tsconfig:** The Phase 5 tsconfig must cover `src/**/*.tsx` or TypeScript won't type-check the new frontend code.
- **`@` alias pointing to root instead of `src/`:** Prototype has `"@/*": ["./*"]` (root). Vite project needs `"@/*": ["src/*"]`. The shadcn CLI aliases in `components.json` must match.
- **Keeping `next-themes` SSR features active:** `next-themes` ThemeProvider works standalone. No changes needed — just remove `"use client"` and use it as-is.
- **Font imports via `next/font/google`:** Not available in Vite. Use CSS `@import url('https://fonts.googleapis.com/...')` or inline fonts via `@font-face` in globals.css.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hash-based routing | Custom history/location management | `createHashRouter` from react-router-dom | Battle-tested, TypeScript types, nested routes, code splitting |
| CSS variable-to-utility mapping | Manual class generators | Tailwind v4 `@theme inline` | Declarative, co-located with CSS variables, generates all modifier variants |
| FSD import rule enforcement | Manual code review | `steiger` + `eslint-plugin-boundaries` | Automated, catches violations in CI before they cause rewrites |
| Path alias resolution | Duplicate aliases in vite.config.ts | `vite-tsconfig-paths` | One source of truth; tsconfig `paths` drives both TS type resolution and Vite bundling |
| Accessible UI primitives | Custom dialogs, dropdowns, popovers | shadcn/ui Radix components | 57 components already authored in prototype; keyboard/ARIA correct |
| Dark mode toggle | Custom CSS class toggler | `next-themes` (standalone) | Handles system preference, localStorage, class toggling — free from Next.js dependency |

---

## Common Pitfalls

### Pitfall 1: `next/link` href vs `to` — Silent Routing Failure

**What goes wrong:** `<Link href="/path">` on React Router's `Link` component is treated as a raw DOM attribute and does not trigger client-side routing. Navigation causes full page reloads.

**Why it happens:** The prototype uses Next.js `Link`. React Router `Link` uses `to=` not `href=`. The prop difference is silent — no TypeScript error if `href` is passed as a JSX prop.

**How to avoid:** Replace at the same time as the import:
```tsx
// Before (Next.js)
import Link from 'next/link'
<Link href="/combat">Combat</Link>

// After (React Router)
import { Link } from 'react-router-dom'
<Link to="/combat">Combat</Link>
```

**Warning signs:** Sidebar active link highlight never changes; browser network tab shows full page loads on nav click.

### Pitfall 2: Tailwind v4 `@theme inline` Required for Custom Token Utility Classes

**What goes wrong:** Defining `--pf-gold: oklch(...)` in `:root` generates no `bg-pf-gold` utility. The variable is accessible in plain CSS but Tailwind v4 ignores `:root` for utility generation.

**How to avoid:** The prototype's `globals.css` already has the correct `@theme inline` block mapping every custom variable to `--color-*`. Copy this file verbatim — do not reconstruct the `@theme inline` block manually.

**Warning signs:** `bg-pf-threat-extreme` class present in HTML but no background color in DevTools computed styles.

### Pitfall 3: shadcn `components.json` Alias Mismatch After FSD Reorganization

**What goes wrong:** shadcn CLI generates `components.json` with `"components": "@/components"` by default. After setting up FSD, components live in `@/shared/ui/`. If `components.json` still points to `@/components`, `npx shadcn add [component]` writes to the wrong directory.

**How to avoid:** Edit `components.json` aliases immediately after `npx shadcn@latest init`:
```json
"aliases": {
  "components": "@/shared/ui",
  "utils": "@/shared/lib/utils",
  "ui": "@/shared/ui"
}
```

**Warning signs:** `npx shadcn add button` creates `src/components/ui/button.tsx` instead of `src/shared/ui/button.tsx`.

### Pitfall 4: Tailwind v4 Ring Default Changed from 3px to 1px

**What goes wrong:** shadcn/ui components use `ring` for focus-visible styles. In Tailwind v4 the default ring width is 1px (was 3px in v3). On dark backgrounds, 1px focus rings are invisible.

**How to avoid:** Add to globals.css `@layer base`:
```css
@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}
```
The prototype already includes this. Also use explicit `ring-3` on interactive component variants where needed.

### Pitfall 5: `next/font/google` Not Available in Vite

**What goes wrong:** `import { Inter, JetBrains_Mono } from 'next/font/google'` works only inside Next.js's font optimization system. Vite has no equivalent — the import will fail.

**How to avoid:** Replace with a Google Fonts CSS import in `globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap');
```
Or use system font stack as fallback during Phase 5 (fonts are not a success criterion). The `@theme inline` block in the prototype already includes font variables with system fallbacks (`'Inter', 'Geist', system-ui, sans-serif`).

### Pitfall 6: src-tauri/ Has No tauri.conf.json at Standard Path

**What goes wrong:** The `src-tauri/` directory currently contains only `Cargo.lock` and `icons/`. There is no `tauri.conf.json`, no `Cargo.toml`, and no `lib.rs` in the standard locations. This means `npm run tauri dev` will fail unless the Tauri CLI can find its config.

**How to avoid:** The Tauri project must be initialized. Options:
1. Run `npm create tauri-app@latest` in an empty directory, take the generated `src-tauri/` structure, and merge/copy into the repo — keeping the existing icons.
2. Manually create `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and `src-tauri/src/lib.rs` from the Tauri 2 template.

The gen/schemas/ directory and Cargo.lock suggest this was partially initialized. The target/ directory has build artifacts indicating a prior build succeeded. The missing files may have been gitignored — check if `src-tauri/src/` exists outside the paths searched.

**Warning signs:** `npm run tauri dev` errors with "No tauri.conf.json found".

### Pitfall 7: `@` Alias Points to Wrong Root

**What goes wrong:** The prototype's tsconfig has `"@/*": ["./*"]` (repo root). The Vite project needs `"@/*": ["src/*"]`. shadcn components use `@/shared/ui/`, `@/lib/utils` etc. — all relative to `src/`. If the alias points to root, imports resolve to wrong paths.

**How to avoid:** The new `tsconfig.json` must have `"@/*": ["src/*"]`. Verify by importing a component and checking that TypeScript resolves it to `src/shared/ui/button.tsx`, not `button.tsx` at root.

---

## Code Examples

### Router Entry Point
```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRouter } from './app/router'
import { AppProviders } from './app/providers'
import './app/styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>
)
```

### AppShell with Outlet
```tsx
// src/widgets/app-shell/ui/AppShell.tsx
import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { CommandPalette } from './CommandPalette'
import { useState } from 'react'

export function AppShell() {
  const [commandOpen, setCommandOpen] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar onSearchOpen={() => setCommandOpen(true)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto">
          <Outlet />  {/* React Router renders active page here */}
        </main>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}
```

### Sidebar Navigation (Next.js → React Router)
```tsx
// src/widgets/app-shell/ui/AppSidebar.tsx  (key replacements only)
// Before:
import Link from "next/link"
import { usePathname } from "next/navigation"
const pathname = usePathname()
<Link href={item.href}>

// After:
import { Link, useLocation } from "react-router-dom"
const { pathname } = useLocation()
<Link to={item.href}>
```

### Providers
```tsx
// src/app/providers.tsx
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/shared/ui/sonner'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      {children}
      <Toaster />
    </ThemeProvider>
  )
}
```

### cn utility (identical to prototype)
```typescript
// src/shared/lib/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Route paths constants
```typescript
// src/shared/routes/paths.ts
export const PATHS = {
  HOME: '/',
  COMBAT: '/combat',
  BESTIARY: '/bestiary',
  ENCOUNTERS: '/encounters',
  CONDITIONS: '/conditions',
  SPELLS: '/spells',
  ITEMS: '/items',
  SETTINGS: '/settings',
} as const
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `@tailwindcss/postcss` plugin (Tailwind v4 + Next.js) | `@tailwindcss/vite` plugin (Tailwind v4 + Vite) | No postcss.config needed; Vite plugin is the canonical path |
| `@vitejs/plugin-react-swc` | `@vitejs/plugin-react` (Oxc-powered) | plugin-react-swc is archived; new default uses Oxc, no Babel |
| `createBrowserRouter` | `createHashRouter` (Tauri constraint) | Hash routing is required when no web server exists |
| `"@/*": ["./*"]` (Next.js root-relative) | `"@/*": ["src/*"]` (src-relative) | Aligns with FSD `src/` root; shadcn components import correctly |
| Manual alias in `vite.config.ts` | `vite-tsconfig-paths` reading `tsconfig.json` | Single source of truth; tsconfig paths drive both TS and Vite |
| steiger `@feature-sliced/steiger-plugin` config via `defineConfig` | Same — steiger v0.5.11 uses this pattern | `defineConfig` available since steiger v0.2.x, still current |

**Deprecated/outdated:**
- `@vitejs/plugin-react-swc`: archived — use `@vitejs/plugin-react`
- `darkMode: "selector"` in `tailwind.config.js`: no config file in v4; use `@custom-variant dark` in CSS
- `tailwind.config.js` / `tailwind.config.ts`: Tailwind v4 is CSS-first — no config file needed
- `next/font/google`: Next.js only — use CSS `@import url()` or `@font-face` in globals.css

---

## Open Questions

1. **src-tauri/ structure: missing tauri.conf.json**
   - What we know: `src-tauri/` has `Cargo.lock`, `icons/`, `gen/schemas/`, `target/` (with build artifacts suggesting prior successful build)
   - What's unclear: Whether `tauri.conf.json`, `Cargo.toml`, and `src/lib.rs` are gitignored, were deleted, or never existed in this location
   - Recommendation: Before running any Tauri commands, verify with `find src-tauri -name "*.toml" -not -path "*/target/*"` and `find src-tauri -name "*.rs" -not -path "*/target/*"`. If missing, the planner must include a "scaffold Tauri config" task first — either via `npm create tauri-app@latest` in isolation or manual template files.

2. **package.json replacement vs. merge**
   - What we know: Root `package.json` is `pathbuddy-engine` with only `typescript` and `vite` devDeps; `vite.config.ts` has only the `@engine` alias
   - What's unclear: Whether the Tauri CLI (`@tauri-apps/cli`) expects to be invoked from the same directory as the frontend or from `src-tauri/`
   - Recommendation: Replace root `package.json` entirely (new name, scripts, deps). The Tauri 2 standard is a single root `package.json` with the frontend code, and `src-tauri/` as the Rust subdirectory. The `tauri dev` command invokes Vite automatically via `beforeDevCommand` in `tauri.conf.json`.

3. **`--legacy-peer-deps` for Radix React 19 peer deps**
   - What we know: STATE.md already flags this as pending. Some Radix packages declare `peerDependencies: { react: "^18" }` even though they work with React 19.
   - Recommendation: Run install first without the flag; if peer dep errors surface, add `--legacy-peer-deps`. Document which packages need it.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite, npm install | Yes | v22.13.1 | — |
| npm | Package installation | Yes | 10.9.2 | — |
| Rust / Cargo | Tauri 2 build | Yes | cargo 1.94.0 | — |
| npx | shadcn CLI | Yes | bundled with npm 10 | — |
| steiger (global) | FSD lint | Yes (via npx) | 0.5.11 | Install as devDep |
| @tauri-apps/cli | `tauri dev` | Not yet in project | — | Install via npm |
| tauri.conf.json | `tauri dev` | Unknown (not found in standard paths) | — | Must be created in Phase 5 task 1 |

**Missing dependencies with no fallback:**
- `tauri.conf.json` — must exist for `npm run tauri dev` to work. This is the first blocker the planner must address.

**Missing dependencies with fallback:**
- Radix peer dep conflicts with React 19 — use `--legacy-peer-deps` flag during npm install.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — tests intentionally removed per project decision (breaking changes expected during pre-alpha) |
| Config file | None |
| Quick run command | `npm run typecheck` (TypeScript only) |
| Full suite command | `npm run lint && npm run typecheck` |

Per project decisions in STATE.md and REQUIREMENTS.md (Out of Scope): "Tests intentionally removed — breaking changes expected, no test maintenance".

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| FND-01 | `npm run tauri dev` starts without errors | manual smoke | `npm run typecheck` (proxy) |
| FND-02 | All 7 routes render placeholder without crash; no `next/link` imports | manual smoke + grep | `grep -r "next/link\|next/navigation" src/` must return 0 |
| FND-03 | PF2e OKLCH tokens render correctly | manual visual | DevTools computed styles on `bg-pf-gold` element |
| FND-04 | 60+ shadcn components importable without errors | manual smoke + typecheck | `npm run typecheck` covers import resolution |
| FND-05 | steiger + eslint-plugin-boundaries run with zero violations | automated | `npm run lint` (includes both) |

### Sampling Rate

- Per task commit: `npm run typecheck`
- Per wave merge: `npm run lint && npm run typecheck`
- Phase gate: `npm run lint && npm run typecheck` green + all 5 success criteria verified manually before moving to Phase 6

### Wave 0 Gaps

No test files to create (tests intentionally removed). The lint and typecheck infrastructure is created as part of Phase 5 itself:
- [ ] `eslint.config.js` — created in Phase 5 FSD tooling task
- [ ] `steiger.config.ts` — created in Phase 5 FSD tooling task
- [ ] `package.json` with `"lint"` script — created in Phase 5 package scaffold task

---

## Sources

### Primary (HIGH confidence)
- `D:/parse_data/package.json` — exact Radix/shadcn versions, prototype dependency list
- `D:/parse_data/app/globals.css` — complete OKLCH token inventory, `@theme inline` structure, `@custom-variant dark`
- `D:/parse_data/components/app-sidebar.tsx` — exact Next.js imports: `next/link`, `usePathname`
- `D:/parse_data/components/command-palette.tsx` — exact: `useRouter` from `next/navigation`
- `D:/parse_data/components/theme-provider.tsx` — `next-themes` usage pattern
- `D:/parse_data/components.json` — `"rsc": true` (must change to `false`)
- `D:/pathbuddy/package.json` — current engine-only root package (to be replaced)
- `D:/pathbuddy/tsconfig.json` — current engine-only tsconfig (to be replaced)
- `D:/pathbuddy/vite.config.ts` — current minimal config (to be replaced)
- npm registry (direct query) — verified versions: steiger@0.5.11, @feature-sliced/steiger-plugin@0.5.7, @vitejs/plugin-react@6.0.1, react-router-dom@7.13.2, tailwindcss@4.2.2, @tailwindcss/vite@4.2.2, vite@8.0.3 (latest), eslint-plugin-boundaries@6.0.2
- `.planning/research/STACK.md` — prior validated stack research (HIGH confidence)
- `.planning/research/PITFALLS.md` — prior validated pitfalls (HIGH confidence)
- `.planning/research/ARCHITECTURE.md` — FSD structure decisions (HIGH confidence)

### Secondary (MEDIUM confidence)
- [Tauri 2 Vite Frontend Guide](https://v2.tauri.app/start/frontend/vite/) — `clearScreen`, `strictPort`, `TAURI_DEV_HOST` pattern
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) — `rsc: false`, `@tailwindcss/vite`, alias setup
- [React Router v7 createHashRouter](https://reactrouter.com/start/library/installation) — library mode setup

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry
- Architecture: HIGH — based on direct codebase inspection of prototype + prior research
- Pitfalls: HIGH — derived from prototype source inspection (exact import locations confirmed)
- Environment: MEDIUM — tauri.conf.json absence is an open question requiring verification

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (30 days — stack is stable; Tailwind 4.x and React Router 7.x are minor-version-stable)
