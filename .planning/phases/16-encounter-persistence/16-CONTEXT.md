# Phase 16: Encounter Persistence - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the Encounters page from a volatile XP-builder draft tool into a persistent encounter manager. Each saved encounter stores its full creature list (name, HP, tier, level) in SQLite. A "Load into Combat" action populates the combat tracker from the saved encounter. During active combat, HP changes, conditions, round/turn state, and initiative order all write back to the encounter SQLite record in real time. "Reset Encounter" restores all combatants to max HP and clears conditions.

Requirements: ENCP-01, ENCP-02, ENCP-03, ENCP-04

</domain>

<decisions>
## Implementation Decisions

### EncountersPage Layout
- **D-01:** Replace current page with a split layout: saved encounters list (left panel, narrow) + selected encounter editor (right panel, wide). Party Config Bar + XP Budget Bar stay at top of the page.
- **D-02:** XP Budget Bar reflects the selected encounter's creature list and partyLevel/partySize — not a global draft. When an encounter is selected, the XP bar re-calculates from its creature list.
- **D-03:** Adding creatures to a saved encounter: clicking "+ Add Creature" opens a search panel inline within the right editor (slides in). After adding, panel stays open for multi-add, can be dismissed.
- **D-04:** The add-creature search results show three compact buttons per row — `[W] [+] [E]` — directly adding as Weak, Normal, or Elite. No separate tier toggle/switcher needed.
- **D-05:** New encounter creation: inline name input in the encounter list. DM types a name, presses Enter, encounter is immediately created in SQLite with an empty creature list.

### Database Schema
- **D-06:** Merge strategy — the encounter record IS the combat state. New SQLite tables:
  - `encounter_combatants` — `(id, encounter_id, creature_ref, display_name, initiative, hp, max_hp, temp_hp, is_npc, weak_elite_tier, sort_order)`
  - `encounter_conditions` — `(combatant_id, slug, value, is_locked, granted_by, formula)`
- **D-07:** `encounters` table gets new columns: `round`, `turn`, `active_combatant_id`, `is_running`. These are written back during combat and restored on "Load into Combat".
- **D-08:** Ad-hoc combat (no saved encounter loaded) keeps the existing `combats` + `combat_combatants` + `combat_conditions` tables unchanged. The tracker distinguishes between encounter-backed and ad-hoc combat via a flag or by checking if `combatId` is an encounter ID.

### Load into Combat
- **D-09:** "Load into Combat" populates `useCombatantStore` from `encounter_combatants`, sets `useCombatTrackerStore.combatId` to the encounter ID (not a `combats` row ID), and restores round/turn/active_combatant_id if present.
- **D-10:** If combat is already running when "Load into Combat" is clicked, show a confirm dialog: "Active combat is in progress. Discard and load new encounter?" On confirm, end active combat, then load.

### Save Timing (Encounters page)
- **D-11:** Auto-save on every change — same debounced 300ms pattern as `combat-persistence.ts`. Zustand store subscription triggers save. No explicit Save button needed.

### Write-back Scope (during active combat)
- **D-12:** All of the following write back to the encounter SQLite record in real time during active encounter-backed combat:
  - HP / maxHP / tempHP changes
  - Condition adds, removes, and modifications
  - Round, turn, active_combatant_id progression
  - Initiative sort_order (if DM re-orders or adds mid-combat)
- **D-13:** `combat-persistence.ts` is extended (or a parallel `encounter-persistence.ts` is created) to route writes: when `combatId` matches an encounter ID, write to `encounter_combatants` / `encounter_conditions` + `encounters` (round/turn). When ad-hoc, write to `combat_combatants` / `combat_conditions` as before.

### Reset Encounter
- **D-14:** Reset restores `hp = max_hp` for every `encounter_combatant` row (no re-fetch from creatures table). Deletes all rows in `encounter_conditions` for the encounter. Resets `round = 0`, `turn = 0`, `active_combatant_id = NULL`, `is_running = 0` on the `encounters` row. Initiative and sort_order are preserved.

### Claude's Discretion
- Exact panel width defaults for the split layout (encounter list vs. editor)
- Visual design of the `[W] [+] [E]` button group per result row (size, colors matching existing Weak/Elite badge styling)
- Empty state for the right panel when no encounter is selected
- Visual indicator on the encounter list item when `is_running = 1` (e.g., a pulse dot)
- Whether to create a new `encounter-persistence.ts` or extend `combat-persistence.ts`
- Exact confirm dialog copy for "Load into Combat while combat is running"

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — ENCP-01 through ENCP-04 requirements and success criteria
- `.planning/ROADMAP.md` §Phase 16 — Phase goal, success criteria

### Existing encounter/combat code (primary targets)
- `src/entities/encounter/model/types.ts` — Current `Encounter` type (needs expansion: add round, turn, active_combatant_id, is_running)
- `src/entities/encounter/model/store.ts` — `useEncounterStore` (needs `upsertEncounter` to accept expanded type)
- `src/features/encounter-builder/model/store.ts` — `DraftCreature`, `EncounterBuilderStore` (XP draft logic may be repurposed for encounter editor)
- `src/features/encounter-builder/ui/EncounterCreatureList.tsx` — Current creature list UI (base for encounter editor creature list)
- `src/features/encounter-builder/ui/CreatureSearchSidebar.tsx` — Existing search sidebar (reuse for inline add-creature panel)
- `src/pages/encounters/ui/EncountersPage.tsx` — Page to replace with split layout
- `src/features/combat-tracker/lib/combat-persistence.ts` — Auto-save pattern (extend or fork for encounter write-back)
- `src/entities/combatant/model/types.ts` — `Combatant` type (used when populating tracker from encounter)
- `src/features/combat-tracker/model/store.ts` — `useCombatTrackerStore` (`combatId` needs to support encounter IDs)
- `src/shared/api/combat.ts` — `CombatSnapshot` pattern (extend or parallel `EncounterSnapshot` for encounter-backed path)

### Existing DB schema
- `src/shared/db/migrations/0004_combat.sql` — Existing `combats`, `combat_combatants`, `combat_conditions` tables (ad-hoc path stays unchanged)
- `src/shared/db/migrate.ts` — Migration runner pattern (new migration file `0008_encounters_persistence.sql` needed)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `combat-persistence.ts` — `setupAutoSave()` / `teardownAutoSave()` / `buildSnapshot()` / `debouncedSave()` pattern: directly reusable for encounter write-back
- `CreatureSearchSidebar` — self-contained search + `addCreatureToDraft()` call; reuse for inline add-creature panel in the encounter editor (swap action from draft to encounter)
- `useEncounterBuilderStore.addCreatureToDraft()` — already handles tier adjustment (adjustedLevel = level ± 1), reuse this logic for encounter creature add
- `BestiarySearchPanel` — used in combat left panel; same search pattern applies to encounter creature search
- `ResizablePanelGroup` + `ResizablePanel` — already used on EncountersPage; extend for split list/editor layout
- `DraftCreature` type — `{instanceId, creatureId, name, level, adjustedLevel, tier}` — close to what `encounter_combatants` needs

### Established Patterns
- Auto-save: Zustand store subscription + 300ms debounce → `saveCombatState()` in `combat-persistence.ts` — clone this for `saveEncounterState()`
- SQLite write: `INSERT OR REPLACE` + `DELETE + re-INSERT` child rows (see `saveCombatState` in `shared/api/combat.ts`)
- Encounter store: `upsertEncounter()` action already exists in `useEncounterStore` — extend to accept new fields
- `shared/api/` is the sole Tauri IPC boundary — new `encounters.ts` in `shared/api/` for all encounter CRUD

### Integration Points
- `CombatPage.tsx` — needs to know whether active combat is encounter-backed (`isEncounterCombat` flag or check `combatId` format); affects which persistence path fires
- `useCombatTrackerStore.startCombat(combatId)` — currently takes a random UUID; when encounter-backed, will take the encounter's ID
- `BestiarySearchPanel.onAddCreature()` — in combat context adds to `useCombatantStore`; in encounters context adds to `encounter_combatants`
- `src/shared/api/index.ts` — barrel; new `encounters.ts` API module needs to be exported here

</code_context>

<specifics>
## Specific Ideas

- The `[W] [+] [E]` button group should visually match existing Weak/Elite badge styling — `W` in muted/grey tones, `+` as the default action button, `E` in primary/gold tones. Same compact sizing as the existing `E`/`W` badges in `EncounterCreatureList`.
- The encounter list item should show a small visual indicator (pulse dot or "LIVE" badge) when `is_running = 1` so the DM can immediately see which encounter is currently in combat.
- When loading an encounter into combat: if `round > 0` (encounter was previously in combat), restore the tracker to that state. If `round = 0`, initialize as a fresh combat (round = 0, no active combatant).
- The `encounters` table migration should be non-destructive — `ALTER TABLE encounters ADD COLUMN` for new fields (round, turn, active_combatant_id, is_running) with appropriate defaults, preserving existing encounter rows.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 16-encounter-persistence*
*Context gathered: 2026-04-02*
