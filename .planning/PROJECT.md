# PathMaid — Pathfinder 2e DM Assistant

## What This Is

PathMaid is a Tauri 2 desktop application for PF2e DMs. PF2e game logic engine complete. React 19 + Vite + FSD frontend with real Foundry VTT data, full combat tracker, bestiary browser, encounter builder, and PC import from Pathbuilder 2e JSON with character sheet display and combat integration.

## Current Milestone: v1.1.0 PathMaid — Day-One Patch

**Goal:** Full rebrand to PathMaid + UI/UX polish + bug fixes before public release.

**Target features:**
- Rename Pathbuddy → PathMaid (tauri.conf.json, package.json, window title, all UI strings)
- Remove unresolved Foundry @-tokens from spell/ability descriptions
- Encounters UX overhaul: creation flow, extended filters (family/traits/source), level-sorted lists
- Mascot (goblin maid PNG) in empty states + CSS animations (sway, mirror, rotation)
- XP budget / group level calculator audit and correctness fixes
- Fix 0-initiative bug on encounter load after app restart (popup + re-roll prompt)
- Dice toasts stack in column and auto-dismiss by timeout
- Full code audit: dead code, React perf, FSD violations, TS strictness, duplication, bad patterns

## Core Value

Feature-complete PF2e DM tool — accurate game logic engine powering a fast, well-organized React frontend with real Foundry VTT entity data.

## Requirements

### Validated

- PF2e XP & encounter budget calculation (creatures, hazards, threat ratings) -- v2.0
- Damage type taxonomy (16 types, 3 categories, 7 materials, die sizes) -- v2.0
- Modifier stacking system (typed highest-bonus/lowest-penalty, untyped stacking) -- v2.0
- Damage categorization utility and die size stepping -- v2.0
- IWR engine (immunity/weakness/resistance application, crit halving, precision zeroing) -- v2.0
- ConditionManager (44 slugs, valued conditions, dying/wounded cascade, group exclusivity) -- v2.0
- Missing conditions/statuses implemented per gap analysis (ENG-01) -- v0.2.2
- Action type system (545 entries, degree-of-success, statistics, MAP) -- v0.2.2
- Engine cleanup & architecture (UI deleted, PWOL removed, /engine barrel exports) -- v0.2.2
- Combat tracker with initiative, HP/tempHP, condition management, auto-decrement (CMB-01..05, BEST-03) -- v0.3.0 Phase 8
- Frontend rebuild: Vite 6 + React 19 SPA, FSD architecture, Zustand stores, SQLite data pipeline (FND, ARCH, DATA) -- v0.3.0
- Bestiary browser with FTS5 + stat blocks, encounter builder with XP budget (BEST-01..02, ENC-01..04) -- v0.3.0
- P2 differentiators: IWR preview, Dying/Wounded cascade, Weak/Elite, persistent damage, MAP, hazard XP (INT-01..06) -- v0.3.0
- Stat block @-syntax resolved to human-readable text; full 17-skill list; bestiary sources filter shows book names (STAT-01, STAT-02, BEST-04) -- v0.4.0 Phase 12
- Stat block fully color-coded and polished: per-stat colors, inline DCs, gradient headers, structured damage with blood-red types, weapon group badge, Spell/Class DC row, golden ability traits (STAT-01, STAT-02) -- v0.4.0 Phase 14
- Dice rolling foundation: parseFormula, rollDice, heightenFormula in engine/dice/dice.ts; useRollStore (session-only roll history + MAP tracking) in src/shared/model/roll-store.ts -- v0.9.6 Phase 36
- Dice UI + roll history: DiceCubeAnimation (CSS 3D spin), RollResultToast (formula+breakdown+total, nat20/nat1), RollToastListener (sonner toast on roll), RollDie20Button, RollHistoryPanel (Popover, 50-roll cap, clearable) — globally wired into AppHeader -- v0.9.6 Phase 37
- PC data pipeline: PathbuilderBuild type hierarchy + calculatePCMaxHP in engine/pc/; characters SQLite table (migration 0021) + full CRUD API (upsert/get/delete/notes) in shared/api/characters.ts (PCImp-01..04) -- v1.0.0 Phase 42
- Characters page: /characters route, PC card grid with name/class/level/ancestry, file + paste import dialog, delete with confirmation (CHAR-01..03) -- v1.0.0 Phase 43
- PC Sheet: full character sheet — core stats (HP/AC/saves/abilities/perception), skills with rank badges, equipment (armor/weapons/inventory), spellcasting entries + spell list, feats & class features, editable DM notes (SHEET-01..06) -- v1.0.0 Phase 44
- Combat integration: PC in combat tracker with AC, HP badge, conditions, PC marker, turn order — same as NPC (CMB-01..02) -- v1.0.0 Phase 45
- PC Combat Polish: [Bestiary|Hazards|Characters] 3-tab left panel, PCCombatCard in right panel, inline initiative edit, creature type filter, encounter picker for Characters page, hazard initiative roll button -- v1.0.0 Phase 46

### Active

- [ ] BRAND-01: Rename Pathbuddy → PathMaid (all configs + UI strings)
- [ ] SANITIZE-01: Remove/resolve unresolved Foundry @-tokens in descriptions
- [x] ENC-01: Encounters creation flow (buttons, not "+") — Validated in Phase 49
- [x] ENC-02: Extended creature filters (family, traits, source) — Validated in Phase 49
- [x] ENC-03: Creature lists sorted by level — Validated in Phase 49
- [ ] MASCOT-01: Goblin maid mascot in empty states + CSS animations
- [ ] XP-01: XP budget / group level calculator audit and fixes
- [ ] BUG-01: Fix 0-initiative on encounter load after restart
- [ ] DICE-01: Dice toasts stack in column with auto-dismiss
- [ ] AUDIT-01: Full code audit (dead code, React perf, FSD, TS, patterns)

### Out of Scope

- Custom monster creation -- Import only, custom editing deferred
- Cloud sync -- Local SQLite persistence only
- Player-facing features -- DM tool only
- Real-time multiplayer -- Single-user desktop app
- Mobile version -- Desktop-first with Tauri
- PWOL (Proficiency Without Level) -- Removed, not supported
- Vue.js -- Staying with React, no framework port

## Context

Version v1.0.0 shipped 2026-04-07. 27,500+ LOC TypeScript/TSX.
Engine complete in `/engine` with domain subdirectories (actions/, conditions/, damage/, degree-of-success/, encounter/, modifiers/, pc/, statistics/), barrel export at `engine/index.ts`.
Frontend: React 19 + Vite 6 + Tauri 2 SPA, FSD architecture (app/pages/widgets/features/entities/shared), Zustand 5 + immer stores, 60+ shadcn/ui components.
Working features: combat tracker (3-panel, initiative, HP/tempHP, conditions, auto-decrement, SQLite persistence), bestiary browser (FTS5 28K+ creatures, stat blocks, Weak/Elite), encounter builder (XP budget, hazard XP, drag-to-drop), IWR damage preview, Dying/Wounded cascade, persistent damage flat-checks, MAP display, PC import from Pathbuilder 2e, full PC sheet, PCs in combat tracker with stat card.
Foundry VTT PF2e source repo in `refs/` — 90+ content packs, 28K+ entities. SQLite + Drizzle ORM pipeline active.

### Future (deferred)

- Campaign management system
- Session notes and encounter history persistence
- Advanced search with FTS5 faceted filters
- Hazard stat block in right panel when hazard selected
- Level range filter in BestiarySearchPanel
- PC Sheet: Feats & Class Features visual improvements (backlog 999.2)

## Constraints

- **Engine**: Pure TypeScript, zero dependencies on UI/Tauri — consumed via `@engine` alias
- **Frontend**: React 19 + Vite + Tailwind 4 + shadcn/ui + Zustand
- **Architecture**: FSD (Feature-Sliced Design) — app/pages/widgets/features/entities/shared
- **Reference**: Foundry VTT PF2e system as source of truth for rules and entity data
- **Platform**: Tauri 2 desktop app, SQLite for persistence

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Standalone pf2e/ game logic modules | Pure TS, no Foundry dependency | Done -- v2.0 |
| Delete all frontend code | Focus on engine completeness before rebuilding UI | Done -- v0.2.2 |
| Remove PWOL | Simplify engine, user doesn't need variant rule | Done -- v0.2.2 |
| `/engine` isolated directory | Zero UI deps, importable by any future frontend | Done -- v0.2.2 |
| Keep React, skip Vue port | Working React prototype exists; porting to Vue is pure cost, no benefit | Done -- v0.3.0 |
| Next.js to Vite+React | SSR unnecessary for Tauri desktop SPA; Vite is lighter and faster | Done -- v0.3.0 P5 |
| FSD architecture | Clean separation of concerns for growing frontend | Done -- v0.3.0 P6 |
| Zustand over Pinia/Redux | Lightweight, React-native, minimal boilerplate | Done -- v0.3.0 P6 |
| shadcn/ui stays | 60+ accessible Radix-based components already in prototype | Done -- v0.3.0 P5 |
| Auto-roll + manual d20 dual mode | Consistent pattern for dice checks (recovery, flat-check, attacks) | Done -- v0.3.0 |
| Full condition-modifier binding | Engine Statistic class + CONDITION_EFFECTS drive all modifier calculations | Deferred |
| PathbuilderBuild type hierarchy in engine/pc/ | Type-only module, no API boundary needed | Done -- v1.0.0 P42 |
| characters SQLite table with raw_json blob | Preserve full build for future fields without schema migrations | Done -- v1.0.0 P42 |
| PCSheetPanel as tab-based widget | Reuses shadcn Tabs for consistent UX; 6 tabs match Pathbuilder sections | Done -- v1.0.0 P44 |
| ac field on EncounterCombatantRow | PC-only field, null for NPCs; avoids re-querying character on each render | Done -- v1.0.0 P45 |
| PCCombatCard separate from PCSheetPanel | Compact read-only card for combat; full sheet is too heavy for right panel | Done -- v1.0.0 P46 |
| onAddCharacter prop pattern for CreatureSearchSidebar | FSD: feature cannot import from widget; prop injection keeps layers clean | Done -- v1.0.0 P46 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-08 after Phase 49 complete — Encounters UX Overhaul (ENC-01, ENC-02, ENC-03)*
