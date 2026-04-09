# pathmaid — Claude Instructions

## Project
PF2e (Pathfinder 2e) GM Assistant. Tauri 2 desktop app.
- **Frontend:** React 19 + Zustand + Tailwind 4 + shadcn/ui + React Router v7
- **Backend:** SQLite + Drizzle ORM sqlite-proxy (via tauri-plugin-sql IPC)
- **Architecture:** FSD (Feature-Sliced Design) — `app/pages/widgets/features/entities/shared`
- **Engine:** pure TypeScript in `/engine`, consumed via `@engine` alias
- **Code graph:** 1036 nodes, 5644 edges, 253 files — use `code-review-graph` to understand dependencies before cross-module changes

## CONSTRAINTS (non-negotiable)
- All Tauri IPC **only** through `shared/api/` — never call `invoke()` elsewhere
- Domain/game logic **only** in `/engine` or `entities/` — never in components, widgets, or pages
- Drizzle ORM for schema definitions — raw `getSqlite()` only for performance-critical paths (batch insert, FTS5)
- No new npm or cargo dependencies without explicitly flagging to user first
- No improvisation on architecture decisions — if something is not in CONTEXT.md, stop and ask
- `.planning/` files are source of truth — code must match them, not vice versa
- `useShallow` mandatory for all Zustand object selectors
- `createHashRouter` only — no HTML5 history (Tauri WebView limitation)
- `import.meta.glob` for Drizzle migrations — no Node.js `fs` in WebView context
- Engine stays outside FSD — consumed as external lib via `@engine` alias
- No test files — breaking changes expected, tests removed intentionally

## Behaviour
- When uncertain about implementation detail → STOP and ask, never improvise
- Read existing code patterns before writing new code — match the style
- If refactoring scope creeps beyond the task → flag it, do not do it silently
- Check code graph for existing dependency paths before creating new cross-module connections
- `.planning/` and `plans/` are gitignored — never commit them

## Workflow
All feature work follows the GSD lifecycle — run everything inline, no subagents:
discuss-phase → ui-phase → plan-phase → execute-phase
Keep discuss → plan → execute in a single session without `/clear` between phases.
Use `/clear` only after a phase is fully complete.

### GSD Tools (Windows)
`$HOME` is intermittently empty in bash on Windows. Always use explicit path:
```bash
node "C:/Users/kiryl/.claude/get-shit-done/bin/gsd-tools.cjs" <command>
```
Agents live at: `C:/Users/kiryl/.claude/agents/`

### No subagents
- Run GSD workflows inline — do not spawn subagents or Task() calls
- If a workflow step says "spawn researcher" → execute that logic directly in current context

### Model preferences
- **Planning** (plan-phase, brainstorming): Opus
- **Everything else** (discussion, execution, debugging): Sonnet
- Config in `.planning/config.json` — planner=opus, checker=haiku

## Code Conventions
- `shared/api/` — sole Tauri IPC boundary, all `invoke()` calls here
- `getSqlite()` raw SQL for performance paths (batch insert, FTS5)
- `useShallow` mandatory for Zustand object selectors
- `createHashRouter` (no HTML5 history in Tauri WebView)
- `import.meta.glob` for Drizzle migrations (no Node.js `fs` in WebView)
- Engine stays outside FSD, consumed as external lib via `@engine` alias
- No test files — breaking changes expected, tests removed intentionally
- `.planning/` and `plans/` are gitignored (local only, never commit)

## Key Files
- `.planning/STATE.md` — current phase and progress
- `.planning/ROADMAP.md` — all phases
- `.planning/phases/NN-name/NN-CONTEXT.md` — phase decisions and rationale
- `.planning/phases/NN-name/NN-UI-SPEC.md` — UI design contract
- `src/shared/api/sync.ts` — Foundry VTT data extraction (spell/item/creature sync)
- `src/app/styles/globals.css` — design tokens (Golden Parchment theme)

## Known Issues
- **Superpowers broken**: v5.0.4 has `"type": "module"` + `require()` conflict in `server.js`. Use text-based brainstorming only.
- **`$HOME` in bash**: intermittently empty in Claude Code on Windows. Use explicit `C:/Users/kiryl/` paths.

## Communication
- Respond in Russian
- No emojis unless explicitly requested
- Concise — prefer token efficiency
- No filler phrases