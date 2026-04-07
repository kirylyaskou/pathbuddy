# Phase 1: Cleanup + Architecture - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 01-cleanup-architecture
**Areas discussed:** Engine directory structure, Non-PF2e lib files, Types disposition, Build/infra cleanup

---

## Engine Directory Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Flat | All 6 module files + index.ts directly in /engine — mirrors current src/lib/pf2e/ layout | |
| Grouped by domain | Subdirectories for related modules (conditions/, damage/, modifiers/, encounter/) | ✓ |
| You decide | Claude picks based on what makes sense | |

**User's choice:** Grouped by domain
**Notes:** None

### Follow-up: Barrel Exports

| Option | Description | Selected |
|--------|-------------|----------|
| Top-level only | /engine/index.ts re-exports everything. Consumers do `import { X } from '@/engine'` | ✓ |
| Per-subdirectory + top-level | Each subdirectory gets index.ts for granular imports | |
| You decide | Claude picks | |

**User's choice:** Top-level only
**Notes:** None

---

## Types Disposition

| Option | Description | Selected |
|--------|-------------|----------|
| types.ts in /engine | Single /engine/types.ts for shared engine types. TagLogic deleted (UI concern). | ✓ |
| /engine/types/ directory | Separate type files per domain inside /engine/types/ | |
| Co-located per module | Each module defines its own types inline, shared types in types.ts | |
| You decide | Claude picks | |

**User's choice:** types.ts in /engine
**Notes:** None

---

## Non-PF2e Lib Files

| Option | Description | Selected |
|--------|-------------|----------|
| Delete all, move engine bits | Move weak-elite.ts and iwr-utils.ts to /engine. Delete everything else. | ✓ |
| Keep data layer, delete UI only | Move engine files, keep database.ts/schema.ts/etc. Delete only UI files. | |
| Delete everything in src/ | Nuclear — move PF2e modules, then delete entire src/ | |

**User's choice:** Delete all, move engine bits
**Notes:** None

---

## Build/Infra Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Strip to engine-only | Remove Vue, Pinia, Tailwind, Tauri, etc. Keep TS + Vite minimal. | ✓ |
| Delete everything except /engine | Remove ALL npm deps. /engine stands alone. | |
| Keep Tauri shell | Keep src-tauri/ and Tauri config. Strip frontend deps only. | |

**User's choice:** Strip to engine-only
**Notes:** None

### Follow-up: Drizzle ORM

| Option | Description | Selected |
|--------|-------------|----------|
| Remove it | Engine is pure TypeScript with zero external deps | ✓ |
| Keep it | Leave Drizzle in package.json for potential future use | |

**User's choice:** Remove it
**Notes:** None

### Follow-up: Build Tooling

| Option | Description | Selected |
|--------|-------------|----------|
| Keep TS + Vite minimal | tsconfig.json for path aliases, Vite for bundling, scripts reduced to typecheck | ✓ |
| Raw TS source only | Only tsconfig.json stays. No Vite, no build scripts. | |
| You decide | Claude picks | |

**User's choice:** Keep TS + Vite minimal
**Notes:** None

---

## Claude's Discretion

- Exact subdirectory placement of weak-elite.ts and iwr-utils.ts within /engine domain structure
- Which Creature interface fields are engine vs UI state
- Minimal vite.config.ts content
- package.json script names and tsconfig paths

## Deferred Ideas

None — discussion stayed within phase scope.
