# Phase 15: Combat Tracker Layout Redesign - Research

**Date:** 2026-04-02
**Status:** Complete

---

## Current Layout (CombatPage.tsx)

3-column horizontal ResizablePanelGroup:
- Left (25%): CombatControls → InitiativeList → TurnControls → AddPCDialog
- Center (45%): CombatantDetail (or placeholder)
- Right (30%): BestiarySearchPanel

## Target Layout

3-column horizontal ResizablePanelGroup:
- Left (22%): BestiarySearchPanel (moved from right)
- Center (38%): header bar [CombatControls | AddPCDialog] + nested vertical ResizablePanelGroup
  - Top sub-panel (35%): InitiativeList
  - Bottom sub-panel (65%): CombatantDetail + TurnControls footer
- Right (40%): CreatureStatBlock (lazy loaded, sticky NPC)

---

## Existing Assets — Reuse As-Is

| Asset | Location | Notes |
|-------|----------|-------|
| `BestiarySearchPanel` | `src/widgets/bestiary-search/ui/BestiarySearchPanel.tsx` | Self-contained, no interface changes needed |
| `InitiativeList` | `src/widgets/initiative-list/ui/InitiativeList.tsx` | Already takes `selectedId` + `onSelect` props |
| `CombatantDetail` | `src/widgets/combatant-detail/ui/CombatantDetail.tsx` | Already takes `combatantId` prop |
| `CreatureStatBlock` | `src/entities/creature/ui/CreatureStatBlock.tsx` | Takes `creature: CreatureStatBlockData` prop |
| `CombatControls` | `src/features/combat-tracker/ui/CombatControls.tsx` | Moves to center header |
| `TurnControls` | `src/features/combat-tracker/ui/TurnControls.tsx` | Compact row, renders null when not running |
| `AddPCDialog` | `src/features/combat-tracker/ui/AddPCDialog.tsx` | Moves to center header |
| `fetchCreatureById` | `src/shared/api/creatures.ts` | Already exists, returns CreatureRow |
| `toCreatureStatBlockData` | `src/entities/creature/model/mappers.ts` | Already exists, maps CreatureRow → CreatureStatBlockData |

---

## New Logic Required

### Lazy stat block fetch + sticky NPC cache in CombatPage

```typescript
// In CombatPage state:
const [lastNpcStatBlock, setLastNpcStatBlock] = useState<CreatureStatBlockData | null>(null)
const [statBlockLoading, setStatBlockLoading] = useState(false)
const statBlockCacheRef = useRef<Map<string, CreatureStatBlockData>>(new Map())

// When selectedId changes, and the combatant is NPC:
// 1. Check cache first
// 2. If miss: fetchCreatureById(combatant.creatureRef) → toCreatureStatBlockData(row) → cache + set
// 3. PC selected or no selection: do NOT clear lastNpcStatBlock (sticky)
```

No new files needed. All fetch/map functions already exist in `shared/api` and `entities/creature/model/mappers`.

### Combatant store access in CombatPage

`CombatPage` already imports `useCombatTrackerStore`. It also needs to read `combatants` to find the selected combatant's `creatureRef` and `isNPC`. This uses `useCombatantStore` from `@/entities/combatant`.

---

## ResizablePanelGroup Nesting

Nesting `ResizablePanelGroup direction="vertical"` inside an outer horizontal panel is supported by `react-resizable-panels` and already confirmed in CONTEXT.md (D-01). The inner group needs its own `id` for panel persistence.

---

## Right Panel Empty State (first load)

When `lastNpcStatBlock === null` (no NPC selected yet), the right panel shows:
```
<div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
  <Shield className="w-8 h-8 opacity-30" />
  <p className="text-sm">Select a creature to view its stat block</p>
</div>
```

---

## CombatControls + AddPCDialog Placement

Compact header bar above the nested vertical ResizablePanelGroup inside the center panel:
```
<div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
  <CombatControls />        {/* Start/End/Round — self-contained */}
  <div className="flex-1" />
  <AddPCDialog />           {/* Quick-add PC button */}
</div>
```

---

## Summary: Single-Plan Phase

All changes concentrate in `CombatPage.tsx` (primary) with minor new local state/refs. No new files. One plan is sufficient.
