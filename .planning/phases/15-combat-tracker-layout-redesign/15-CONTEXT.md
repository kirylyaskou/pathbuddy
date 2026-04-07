# Phase 15: Combat Tracker Layout Redesign - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Rearrange the combat tracker's 3 panels: Bestiary search moves to the left, a new creature stat card occupies the right, and the center panel merges the initiative list (top) and combatant HP/conditions/turn controls (bottom) into a single resizable column. Selecting a combatant updates both the center detail and the right stat card simultaneously.

Requirements: CMBL-01, CMBL-02, CMBL-03, CMBL-04

</domain>

<decisions>
## Implementation Decisions

### Center Panel Layout
- **D-01:** The center panel uses a nested vertical `ResizablePanelGroup` — initiative list in the top sub-panel, combatant HP/conditions/turn controls in the bottom sub-panel. The DM drags the divider to allocate space between them.
- **D-02:** Both sub-panels are always visible — no switching, no tabs, no modal. Satisfies CMBL-01 and CMBL-02.

### Right Panel — Stat Card
- **D-03:** The right panel renders `CreatureStatBlock` for the currently selected NPC combatant.
- **D-04:** The right panel is **sticky** — when a PC is selected (no `creatureRef`) or no combatant is selected, the last rendered NPC stat block stays visible. The panel does not reset or show a placeholder.
- **D-05:** On first load (no combatant ever selected), the right panel shows a neutral empty state (Claude's discretion — simple placeholder text).

### Stat Block Data Loading
- **D-06:** Stat block data is fetched **lazily on select** — when the DM clicks an NPC row, the right panel fetches `CreatureStatBlockData` from SQLite by `creatureRef`. No data is stored in the `Combatant` object.
- **D-07:** Cache strategy (last N stat blocks in memory) is Claude's discretion — prevents redundant fetches when DM toggles between the same few creatures.

### Bestiary Panel (Left)
- **D-08:** The `BestiarySearchPanel` moves to the **left** panel. Internal logic (FTS5 search, tier selector, `+ Add` button on each CreatureCard) is unchanged.
- **D-09:** No drag-and-drop from bestiary to initiative list — button-based add satisfies CMBL-02 success criteria ("without a modal").

### Panel Width Defaults
- **D-10:** Claude's discretion — suggested starting point: Bestiary 22% / Center 38% / Stat Card 40%. Stat card needs enough width to render the full stat block comfortably.

### CombatControls Placement
- **D-11:** Claude's discretion — `CombatControls` (Start Combat / Round counter / End Combat) and `AddPCDialog` move to the center panel. Suggested: above the vertical `ResizablePanelGroup` as a compact header bar.

### Claude's Discretion
- Exact default sizes for the nested vertical ResizablePanelGroup (e.g., 35% list / 65% detail)
- In-memory cache implementation for stat block data (size limit, eviction)
- Empty state content for the right panel on first load
- Exact placement of `CombatControls` and `AddPCDialog` within the center panel

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — CMBL-01 through CMBL-04 requirements and success criteria
- `.planning/ROADMAP.md` §Phase 15 — Phase goal, success criteria, success criteria list

### Existing code (critical paths)
- `src/pages/combat/ui/CombatPage.tsx` — Current 3-panel layout (left=initiative, center=detail, right=bestiary). This file is the primary target for restructuring.
- `src/widgets/initiative-list/ui/InitiativeList.tsx` — Initiative list with dnd-kit sortable. Moves to top sub-panel of center.
- `src/widgets/combatant-detail/ui/CombatantDetail.tsx` — HP controls + conditions. Moves to bottom sub-panel of center.
- `src/widgets/bestiary-search/ui/BestiarySearchPanel.tsx` — Bestiary search + Add button. Moves to left panel.
- `src/entities/creature/ui/CreatureStatBlock.tsx` — Full stat block component (polished in Phase 14). Becomes the right panel.
- `src/entities/combatant/model/types.ts` — `Combatant.creatureRef` is the creature entity ID used to fetch stat block data.
- `src/features/combat-tracker/ui/CombatControls.tsx` — Start/End/Round controls. Needs relocation within center panel.
- `src/features/combat-tracker/ui/AddPCDialog.tsx` — PC quick-add. Needs relocation within center panel.

### Prior phase decisions
- `.planning/phases/08-combat-tracker-engine-integration/08-CONTEXT.md` — Original combat tracker layout decisions (D-01 through D-22)
- `.planning/phases/13-combat-ux-sweep/13-CONTEXT.md` — HP controls redesign, condition picker tabs (already implemented)
- `.planning/phases/14-stat-block-polish-2/14-CONTEXT.md` — CreatureStatBlock color system, structured damage, DC display (already implemented)

### Shared API
- `src/shared/api/creatures.ts` — `fetchCreatures()`, `searchCreatures()` — already used by BestiarySearchPanel. A new `fetchCreatureStatBlock(creatureId)` function may be needed for lazy stat block loading.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CreatureStatBlock` — fully polished (Phase 14), just needs to be dropped into the right panel with a `creature` prop
- `BestiarySearchPanel` — self-contained, already handles search + add; no internal changes needed for panel relocation
- `InitiativeList` — already receives `selectedId` + `onSelect` props; interface unchanged
- `CombatantDetail` — already receives `combatantId` prop; interface unchanged
- `ResizablePanelGroup` + `ResizablePanel` + `ResizableHandle` — already imported and used in `CombatPage.tsx`; nesting is supported

### Established Patterns
- Panel layout via `ResizablePanelGroup direction="horizontal"` at page level — extend with nested `direction="vertical"` for center
- `selectedId` state in `CombatPage` already drives `CombatantDetail`; extend the same state to drive right panel
- `src/shared/api/` is the sole IPC boundary — any new `fetchCreatureStatBlock()` goes here
- Zustand + immer for any new store state (e.g., cached stat block data)

### Integration Points
- `CombatPage.tsx` — single file to restructure; all widget imports stay the same, just repositioned
- New stat block cache: either a local `useState` in `CombatPage` (simple) or a small Zustand store slice (Claude's discretion)
- `src/shared/api/creatures.ts` — extend with `fetchCreatureStatBlock(id)` → returns `CreatureStatBlockData`
- `src/entities/creature/model/` — `toCreatureStatBlock(row)` mapper likely needed (check if it already exists or if `CreatureStatBlock` already used in bestiary detail view)

</code_context>

<specifics>
## Specific Ideas

- The sticky right panel (D-04) means `CombatPage` tracks `lastNpcStatBlock` separately from `selectedId` — updated only when an NPC is selected, not cleared on PC selection.
- Cache "last N" in memory (D-07) — even N=3 or N=5 covers most encounters where DM toggles between a handful of creatures.
- The nested vertical `ResizablePanelGroup` (D-01) should have its own `id` for persistence if `react-resizable-panels` supports it — DM's preferred split is remembered across sessions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-combat-tracker-layout-redesign*
*Context gathered: 2026-04-02*
