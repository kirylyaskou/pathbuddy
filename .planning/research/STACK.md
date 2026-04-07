# Stack Research

**Domain:** PF2e DM Assistant — v0.3.0 Frontend Rebuild + Engine Integration
**Researched:** 2026-03-31
**Confidence:** HIGH

## Context

This is a **subsequent milestone** replacing an entire frontend framework. The previous milestone
used Vue 3 + Pinia — that code is deleted. The PF2e game engine (`/engine`, pure TypeScript,
zero UI deps) is complete and intact. This file documents only what the v0.3.0 rebuild requires:
Vite+React SPA wiring into Tauri 2, React Router for client-side navigation, Zustand for state,
FSD architecture tooling, shadcn/ui re-initialization under Vite, and SQLite reconnection via
tauri-plugin-sql.

**Existing validated and in-place (do not re-research):**
- `/engine` — pure TypeScript, barrel export at `engine/index.ts`, consumed via `@engine` alias
- `src-tauri/` — Tauri 2 shell (Cargo.lock, icons, gen/) present
- React prototype at `D:/parse_data` — Next.js 16 + React 19.2.4 + Tailwind 4 + shadcn/ui (60+ Radix components)
- Foundry VTT entity data in `refs/` (28K+ entities across 90+ content packs)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vite | `^6.x` | Build tool + dev server | Already in root `package.json`. Faster than Next.js for a Tauri SPA; no SSR overhead; native ESM; HMR works perfectly in Tauri WebView. Tauri 2 official frontend guide targets Vite. |
| `@vitejs/plugin-react` | `^4.x` (latest v4/v5) | React Fast Refresh + JSX transform | Actively maintained, now Oxc-powered (not Babel). Use this — NOT `@vitejs/plugin-react-swc`, which is archived. |
| React | `19.2.4` | UI framework | Already in prototype. Matches engine consumer pattern. React 19 is stable and fully supported by Zustand 5, shadcn/ui, React Router 7. |
| React DOM | `19.2.4` | DOM renderer | Paired with React. |
| TypeScript | `^5.7.x` | Type safety | Already in prototype at `5.7.3`. Vite transpiles with esbuild; tsc for type-checking only. |
| Tailwind CSS | `^4.x` | Utility CSS | Already in prototype at `^4.2.0`. Use `@tailwindcss/vite` plugin (NOT postcss for Vite projects). |

### Routing

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| `react-router-dom` | `^7.x` (latest v7.12.0) | Client-side SPA routing | React Router v7 is the current stable release. Use it as a **library** (not the framework Vite plugin mode) — add `ssr: false` is irrelevant here since we don't use the RR Vite plugin. Plain `createBrowserRouter` + `RouterProvider` is the correct pattern for a Tauri SPA. v6→v7 is non-breaking for library usage. |

### State Management

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| `zustand` | `^5.0.12` | Global state management | Lightweight, minimal boilerplate, React 19 compatible. Chosen over Redux (too heavy) and Pinia (Vue-only). Slice pattern + devtools + immer is the standard production pattern. |
| `immer` | `^10.x` | Immutable state mutations inside Zustand | Zustand's `immer` middleware enables direct mutation syntax. Required for complex nested state (combat tracker, condition maps). Import from `zustand/middleware/immer`. |

### Tauri Integration

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| `@tauri-apps/api` | `^2.10.1` | IPC, `invoke()`, app APIs | The v2 API. Import from `@tauri-apps/api/core` (module renamed in v2 — `/tauri` is no longer valid). Provides `invoke()` for Rust command calls. |
| `@tauri-apps/plugin-sql` | `^2.x` (Rust crate: `2.3.2`) | SQLite access via IPC | The established pattern from v1.0–v2.1: JS `Database` class bridges Drizzle ORM's `sqlite-proxy` driver to Tauri's SQL plugin. Required permissions: `sql:default`, `sql:allow-load`, `sql:allow-execute`, `sql:allow-select`, `sql:allow-close` in `src-tauri/capabilities/default.json`. |

### UI Components

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| shadcn/ui (CLI) | `latest` | 60+ accessible Radix-based components | Already in prototype. Under Vite, re-initialize with `npx shadcn@latest init` — it auto-detects Vite and sets `"rsc": false` in `components.json`. Components are copied into source (not an npm package). |
| `@radix-ui/*` | (managed by shadcn CLI) | Headless accessible primitives | 25+ Radix packages already in prototype. shadcn manages versions. |
| `class-variance-authority` | `^0.7.1` | Variant-based component styling | shadcn dependency. |
| `clsx` | `^2.1.1` | Conditional class merging | shadcn dependency. |
| `tailwind-merge` | `^3.x` | Tailwind class conflict resolution | shadcn dependency. |
| `lucide-react` | `^0.564.0` | Icon library | Already in prototype. shadcn uses lucide as default icon library. |

### Database / ORM

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| `drizzle-orm` | `^0.39.x` | Type-safe SQL query builder | Re-use the established `sqlite-proxy` pattern from v1.0–v2.1. Drizzle generates SQL; a proxy callback forwards it via `@tauri-apps/plugin-sql` `invoke()`. The Drizzle migrator does NOT work in WebView (uses Node `fs`) — use `tauri-plugin-sql` migrations in Rust instead. |
| `drizzle-kit` | `^0.30.x` (dev) | Schema codegen + migration file generation | Generate migration SQL files that Rust registers with `add_migrations`. Do not run `drizzle-kit migrate` at runtime. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-hook-form` | `^7.54.1` | Form state management | Already in prototype. Use for any form with validation (encounter builder inputs, settings). |
| `zod` | `^3.24.1` | Schema validation | Already in prototype. Pair with `@hookform/resolvers/zod`. |
| `react-resizable-panels` | `^2.1.7` | Resizable split-pane layouts | Already in prototype. Required for 3-panel combat workspace. |
| `sonner` | `^1.7.1` | Toast notifications | Already in prototype. Preferred over `@radix-ui/react-toast` for imperative usage. |
| `cmdk` | `1.1.1` | Command palette (⌘K) | Already in prototype. |
| `vaul` | `^1.1.2` | Drawer / bottom sheet | Already in prototype. |
| `next-themes` | `^0.4.6` | Dark/light theme toggle | Keep from prototype — it is CSS-framework-agnostic and works in Vite SPAs. For Tailwind v4 dark mode, configure `@custom-variant dark` in CSS instead of `darkMode: "selector"`. |

### FSD Architecture Tooling

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| `steiger` | `^0.x` (latest) | FSD architectural linter | Enforces layer import rules (pages cannot import from other pages, etc.). Run in CI and as dev script. Uses `steiger.config.ts` with `@feature-sliced/steiger-plugin`. |
| `@feature-sliced/steiger-plugin` | `latest` | FSD rule definitions for Steiger | Peer of `steiger`. Provides `fsd.configs.recommended`. |
| `vite-tsconfig-paths` | `^5.x` | Sync `tsconfig.json` `paths` into Vite | Single source of truth for all path aliases (`@/*`, `@engine`, etc.). Eliminates duplicate alias maintenance between `tsconfig.json` and `vite.config.ts`. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `@tauri-apps/cli` | Tauri dev server + build runner | Use `tauri dev` and `tauri build`. Do not use `vite dev` directly — Tauri CLI wraps it. |
| `@types/react` | React TypeScript types | `19.2.14` — already in prototype. Note: `useRef()` now requires an argument in React 19. |
| `@types/react-dom` | React DOM TypeScript types | `19.2.3` — already in prototype. |
| `@types/node` | Node type stubs | `^22` — needed for `path.resolve` in `vite.config.ts`. |

---

## Installation

```bash
# Core framework (new installs for React frontend)
npm install react@19.2.4 react-dom@19.2.4
npm install react-router-dom@^7
npm install zustand@^5 immer@^10

# Tauri 2 integration
npm install @tauri-apps/api@^2
npm install @tauri-apps/plugin-sql@^2

# Database
npm install drizzle-orm@^0.39
npm install -D drizzle-kit@^0.30

# UI (already in prototype — re-install from package.json)
npm install tailwind-merge clsx class-variance-authority lucide-react
npm install next-themes sonner cmdk vaul react-hook-form zod @hookform/resolvers
npm install react-resizable-panels

# FSD tooling
npm install -D steiger @feature-sliced/steiger-plugin
npm install -D vite-tsconfig-paths

# Vite plugins
npm install -D @vitejs/plugin-react
npm install -D @tailwindcss/vite
npm install -D @types/react@19 @types/react-dom@19 @types/node@^22

# shadcn/ui initialization (run after Vite project is set up)
npx shadcn@latest init
```

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `next` (package) | SSR is useless in a Tauri SPA. `next/image`, `next/link`, `next/router`, `next/navigation` are all Next.js-specific. Pulls in ~150MB of Node.js server code. | `vite` + `@vitejs/plugin-react` + `react-router-dom` |
| `@vercel/analytics` | Vercel analytics only makes sense for web deployments, not a local Tauri desktop app. | Remove entirely — no analytics needed in a desktop app |
| `@vitejs/plugin-react-swc` | Archived (repository is read-only). The Vite team deprecated it in favor of Oxc. Latest v3.8.1 is final. | `@vitejs/plugin-react` (Oxc-powered, actively maintained) |
| `@react-router/dev` Vite plugin | The framework-mode React Router plugin (replaces Remix). Adds SSR, file-based routing, and a full build pipeline — none of which a Tauri SPA needs. | `react-router-dom` as a library with `createBrowserRouter` |
| Pinia | Vue-only state manager from previous milestones. | `zustand` |
| `vue`, `vue-router`, `@vueuse/core` | All Vue 3 dependencies from previous codebase — deleted in v0.2.2 cleanup. Should not reappear. | React equivalents |
| `vitest` / `@vue/test-utils` | Intentionally removed per project decision. Breaking changes expected; no test maintenance during pre-alpha. | — (no testing framework for now) |
| `reactive()` / `ref()` / `computed()` | Vue 3 reactivity — wrong framework. | Zustand stores + React hooks |
| Drizzle migrator at runtime | `drizzle-kit migrate` calls Node `fs` which does not exist in Tauri WebView — will crash. | Define migrations in Rust using `tauri-plugin-sql` `Migration` struct |
| `next-themes` SSR features | SSR hydration mismatch prevention is irrelevant in a Vite SPA with no server. | Use it as a simple client-side theme manager only; or replace with Tailwind v4 `@custom-variant dark` |

---

## Vite Configuration for Tauri 2

The `vite.config.ts` must accommodate: Tauri's dev server requirements, the `@engine` alias, FSD layer aliases, and shadcn's `@` alias.

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),  // reads tsconfig.json paths — single source of truth
  ],
  // Required for Tauri: prevents Vite from obscuring Rust errors
  clearScreen: false,
  server: {
    // Tauri expects a fixed port; fail if it's not available
    strictPort: true,
    // Use TAURI_DEV_HOST for mobile/device targets
    host: process.env.TAURI_DEV_HOST || false,
    port: 5173,
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    // Tauri uses Chromium on Windows/macOS/Linux — target modern baseline
    target: process.env.TAURI_ENV_PLATFORM === 'windows'
      ? 'chrome105'
      : 'safari13',
    // Don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})
```

`tsconfig.json` paths (single source of truth for `vite-tsconfig-paths`):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@engine": ["engine/index.ts"],
      "@engine/*": ["engine/*"]
    }
  }
}
```

---

## Zustand Store Pattern

The established pattern for this project — slice + devtools + immer + TypeScript:

```typescript
// src/shared/store/combat-store.ts (FSD: shared layer for cross-cutting stores)
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {} from '@redux-devtools/extension'  // required for devtools typing

interface CombatState {
  round: number
  // ...
  incrementRound: () => void
}

export const useCombatStore = create<CombatState>()(
  devtools(
    immer((set) => ({
      round: 0,
      incrementRound: () => set((state) => { state.round++ }),
      //                                             ^^ direct mutation via immer
    })),
    { name: 'CombatStore' },
    //         ^^ devtools last, named for Redux DevTools
  )
)
```

Key rules:
- Always use `create<T>()()` (double parentheses) in TypeScript
- Middleware order: `devtools(immer(...))` — devtools wraps immer
- Pass action name as third arg to `set`: `set(fn, false, 'actionName')`
- Import `type {} from '@redux-devtools/extension'` for devtools TypeScript support

---

## shadcn/ui Re-initialization Under Vite

The prototype `components.json` has `"rsc": true` (Next.js RSC mode). After migrating to Vite:

1. Run `npx shadcn@latest init` — auto-detects Vite, sets `"rsc": false`
2. Key `components.json` diff: `"rsc": false`, `"tailwind.css": "src/app/globals.css"` → `"src/styles/globals.css"` (FSD path)
3. All 60+ existing Radix components re-add via `npx shadcn@latest add [component]` or copy from prototype `/components/ui/`
4. Remove `use client` directives (added by shadcn for RSC mode) — they are harmless but unnecessary in Vite

---

## SQLite Reconnection Pattern

The `sqlite-proxy` pattern from v1.0–v2.1 is unchanged — just the import source shifts from Vue context to a Zustand store:

```typescript
// src/shared/db/client.ts
import Database from '@tauri-apps/plugin-sql'
import { drizzle } from 'drizzle-orm/sqlite-proxy'

const db = await Database.load('sqlite:pathbuddy.db')

export const orm = drizzle(
  async (sql, params, method) => {
    if (method === 'run') {
      await db.execute(sql, params)
      return { rows: [] }
    }
    const rows = await db.select<Record<string, unknown>[]>(sql, params)
    return { rows: rows.map(Object.values) }
  }
)
```

Migrations: defined in Rust `src-tauri/src/lib.rs` using `tauri_plugin_sql::Builder::new().add_migrations(...)`. The Drizzle migrator (`drizzle-kit migrate`) must NOT be called at runtime in the WebView.

---

## FSD Layer Structure

```
src/
  app/           # Router setup, global providers, store initialization
  pages/         # Route-level page components (one per route)
  widgets/       # Composed UI sections (CombatTracker, EncounterBuilder, StatBlock)
  features/      # User interactions with side effects (AddCondition, RollDamage)
  entities/      # Domain objects with UI (CreatureCard, ConditionBadge)
  shared/        # Cross-cutting: ui/, db/, store/, lib/, hooks/
engine/          # Pure TypeScript engine (outside src/ — no FSD layer, consumed via @engine alias)
src-tauri/       # Rust backend
```

Steiger enforces import direction: `pages` → `widgets` → `features` → `entities` → `shared`. No back-references. `engine/` is external — `shared/` imports from `@engine`, other layers import from `shared/` wrappers.

---

## Packages to Remove (Next.js Cleanup)

| Package | Reason |
|---------|--------|
| `next` | Core Next.js — incompatible with Tauri SPA |
| `@vercel/analytics` | Vercel cloud analytics — irrelevant for desktop app |
| `next-themes` | Keep if preferred, but no SSR benefit in Vite; replaceable with custom context |
| `next.config.mjs` | Delete — replaced by `vite.config.ts` |
| `.next/` directory | Build artifact — delete |
| `app/` directory (Next.js App Router) | Replace with FSD `src/` structure |

Remove from `package.json` scripts: `"dev": "next dev"`, `"build": "next build"`, `"start": "next start"`.

Replace with:
```json
{
  "scripts": {
    "dev": "tauri dev",
    "build": "tauri build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `react-router-dom` v7 (library mode) | `@tanstack/react-router` | TanStack Router is excellent but adds migration cost; React Router v7 is the direct v6 successor, lower friction for porting the prototype |
| `react-router-dom` v7 (library mode) | React Router v7 framework mode (`@react-router/dev`) | Framework mode is a Remix successor with SSR/file-routing — zero benefit for a Tauri SPA, adds complexity |
| `zustand` | `jotai` | Jotai's atom model is fine but slice pattern is harder; Zustand is closer to Pinia's ergonomics which the team knows |
| `zustand` | Redux Toolkit | 3x more boilerplate for identical capability; overkill for a desktop DM tool |
| `vite-tsconfig-paths` | Manual alias mirroring in `vite.config.ts` | Two places to maintain — any alias change requires two edits; `vite-tsconfig-paths` is one source of truth |
| `@vitejs/plugin-react` | `@vitejs/plugin-react-swc` | `plugin-react-swc` is archived/read-only; Vite team deprecated it for Oxc |
| `steiger` + `@feature-sliced/steiger-plugin` | `@feature-sliced/eslint-config` only | Steiger checks structural rules beyond ESLint (naming, layer counts, reuse); use both for full coverage |
| `drizzle-orm` sqlite-proxy | Direct `invoke()` raw SQL | Raw SQL loses type safety; `drizzle-orm` generates typed queries; the proxy pattern is proven from v1.0–v2.1 |

---

## Version Compatibility Matrix

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `react@19.2.4` | — | `zustand@^5`, `react-router-dom@^7`, shadcn/ui Radix components | All confirmed compatible. Some Radix packages may need `--force` on npm install due to peer dep declarations not yet updated for React 19. |
| `zustand@^5` | — | `react@18–19`, `typescript@5+` | `use-sync-external-store` peer dep issues from v5.0.2 are resolved in v5.0.12+. |
| `vite@^6` | — | `react@19`, `typescript@^5.7`, `@vitejs/plugin-react@^4` | Node 20.19+ or 22.12+ required. |
| `@vitejs/plugin-react@^4` | — | `vite@^6` | Oxc-powered. No Babel required. |
| `tailwindcss@^4` | — | `vite@^6` via `@tailwindcss/vite` plugin | Do NOT use postcss config for Tailwind v4 in Vite — use `@tailwindcss/vite` plugin directly. |
| `react-router-dom@^7` | — | `react@19`, `vite@^6` | v7.12.0 current. Library mode (no `@react-router/dev`) avoids all SSR/framework setup. |
| `@tauri-apps/api@^2` | `2.10.1` | Tauri 2 shell | Import from `@tauri-apps/api/core` — NOT `@tauri-apps/api/tauri` (renamed in v2). |
| `@tauri-apps/plugin-sql@^2` | Rust: `2.3.2` | `@tauri-apps/api@^2` | JS npm package + Rust crate must be on v2 branch together. |
| `drizzle-orm@^0.39` | — | `@tauri-apps/plugin-sql@^2` | sqlite-proxy driver compatible with Tauri's IPC. Migrator must NOT run in WebView. |
| `typescript@^5.7` | — | `react@19`, `vite@^6` | React 19 TypeScript notes: `useRef()` now requires argument; JSX is `React.JSX` not global `JSX`. |
| `next-themes@^0.4.6` | — | `react@19`, Vite SPA | CSS-agnostic — works without Next.js. SSR features unused; client-only is sufficient. |

---

## Sources

- [Tauri 2 Vite Frontend Guide](https://v2.tauri.app/start/frontend/vite/) — Tauri 2 official Vite setup, `clearScreen`, `strictPort`, `TAURI_DEV_HOST` (HIGH confidence)
- [Tauri 2 Create Project](https://v2.tauri.app/start/create-project/) — confirmed `@vitejs/plugin-react` + `@tauri-apps/api` v2 template (HIGH confidence)
- [Tauri SQL Plugin Docs](https://v2.tauri.app/plugin/sql/) — `@tauri-apps/plugin-sql` v2 installation, migrations in Rust, permissions (HIGH confidence)
- [`@tauri-apps/api` npm](https://www.npmjs.com/package/@tauri-apps/api) — latest version 2.10.1 confirmed (HIGH confidence)
- [`@tauri-apps/plugin-sql` npm](https://www.npmjs.com/package/@tauri-apps/plugin-sql) — v2 npm package confirmed (HIGH confidence)
- [Drizzle + SQLite in Tauri](https://dev.to/huakun/drizzle-sqlite-in-tauri-app-kif) — sqlite-proxy pattern, WebView fs limitation, IPC bridge (MEDIUM confidence, verified against prior working v1.0–v2.1 codebase)
- [Drizzle SQLite Migrations in Tauri 2.0](https://keypears.com/blog/2025-10-04-drizzle-sqlite-tauri) — migration-in-Rust pattern, Drizzle migrator WebView limitation (MEDIUM confidence)
- [Zustand npm](https://www.npmjs.com/package/zustand) — v5.0.12 latest confirmed (HIGH confidence)
- [Zustand React 19 Discussion](https://github.com/pmndrs/zustand/discussions/2686) — confirmed React 19 compatibility in v5.x (HIGH confidence)
- [Zustand Middleware TypeScript Patterns](https://github.com/pmndrs/zustand/discussions/2070) — devtools + immer slice pattern (HIGH confidence)
- [React Router Installation](https://reactrouter.com/start/library/installation) — v7 library mode setup (HIGH confidence)
- [React Router Changelog](https://reactrouter.com/changelog) — v7.12.0 latest confirmed (HIGH confidence)
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) — `rsc: false`, Tailwind v4 `@tailwindcss/vite` plugin, path alias setup (HIGH confidence)
- [shadcn/ui components.json](https://ui.shadcn.com/docs/components-json) — `rsc` field semantics (HIGH confidence)
- [`@vitejs/plugin-react` npm](https://www.npmjs.com/package/@vitejs/plugin-react) — Oxc-powered, actively maintained (HIGH confidence)
- [`@vitejs/plugin-react-swc` GitHub](https://github.com/vitejs/vite-plugin-react-swc/releases) — archived/read-only confirmed (HIGH confidence)
- [vite-tsconfig-paths npm](https://www.npmjs.com/package/vite-tsconfig-paths) — path alias sync plugin (HIGH confidence)
- [Feature-Sliced Design](https://feature-sliced.design/) — layer definitions, import rules (HIGH confidence)
- [Steiger GitHub](https://github.com/feature-sliced/steiger) — FSD architectural linter, `steiger.config.ts` format (HIGH confidence)
- [Next.js → Vite migration guide](https://nextjs.org/docs/app/guides/migrating/from-vite) — packages to remove/replace (HIGH confidence)
- Prototype `D:/parse_data/package.json` — exact versions of all 60+ Radix packages, Tailwind 4, React 19 (direct inspection, HIGH confidence)
- Engine `engine/index.ts` — barrel export structure, `@engine` alias consumption pattern (direct inspection, HIGH confidence)

---

*Stack research for: v0.3.0 Frontend Rebuild + Engine Integration — Tauri 2 / Vite / React 19 / FSD desktop app*
*Researched: 2026-03-31*
