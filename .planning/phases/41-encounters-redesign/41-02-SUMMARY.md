---
phase: 41
plan: "02"
subsystem: encounters-page
tags: [dnd-kit, drag-and-drop, 3-panel-layout, encounters]
dependency_graph:
  requires: ["41-01"]
  provides: ["encounters-page-3panel", "drag-drop-creatures"]
  affects: ["src/pages/encounters", "src/features/encounter-builder"]
tech_stack:
  added: []
  patterns:
    - "DndContext scoped to page (no nested contexts)"
    - "useDraggable data carries tier for drag-time snapshot"
    - "useDroppable id='encounter-drop-zone' for visual feedback"
    - "handleAddCreature/handleAddHazard lifted from EncounterEditor to EncountersPage"
    - "Optional callback props pattern for CreatureSearchSidebar backward compatibility"
key_files:
  created: []
  modified:
    - src/features/encounter-builder/ui/CreatureSearchSidebar.tsx
    - src/features/encounter-builder/ui/EncounterEditor.tsx
    - src/pages/encounters/ui/EncountersPage.tsx
decisions:
  - "Add logic lifted from EncounterEditor to EncountersPage so DndContext onDragEnd can call it directly"
  - "CreatureSearchSidebar accepts optional onAddCreature/onAddHazard props; falls back to builder store when absent"
  - "EncounterEditor retains handleRemove and load/reset logic; only add logic was lifted"
metrics:
  duration_seconds: 268
  completed_date: "2026-04-05"
  tasks_completed: 2
  files_modified: 3
---

# Phase 41 Plan 02: 3-Panel Encounters Page with Drag-and-Drop Summary

3-panel DndContext layout wiring drag-from-search to encounter editor — creatures/hazards draggable from middle panel, drop target on right panel with isOver visual feedback.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add useDraggable to CreatureSearchSidebar cards + callback props | 51f0e230 | CreatureSearchSidebar.tsx |
| 2 | 3-panel EncountersPage + DndContext + EncounterEditor drop target | d0a0f036 | EncountersPage.tsx, EncounterEditor.tsx |

## What Was Built

**CreatureSearchSidebar** now has:
- `DraggableCreatureRow` wrapper component using `useDraggable({ id: 'creature-${row.id}', data: { type, row, tier } })`
- `DraggableHazardRow` wrapper component using `useDraggable({ id: 'hazard-${hazard.id}', data: { type, hazard } })`
- Optional `onAddCreature` / `onAddHazard` callback props — delegates to them when provided, falls back to `useEncounterBuilderStore` for backward compatibility
- `isDragging ? opacity: 0 : opacity: 1` on drag source to hide original while ghost is shown

**EncounterEditor** now has:
- `useDroppable({ id: 'encounter-drop-zone' })` on the outer `div`
- Visual drop feedback: `border-dashed border border-primary/40 bg-primary/5` when `isOver`
- `handleAddCreature` and `handleAddHazard` removed (lifted to EncountersPage)
- `cn()` imported from `@/shared/lib/utils` for conditional classes

**EncountersPage** now has:
- 3-panel `ResizablePanelGroup` (20/32/48 default sizes, 15/22/30 min sizes)
- `DndContext` wrapping the 3-panel area with `onDragStart` + `onDragEnd` handlers
- `DragOverlay` with creature ghost (bg-card, border) and hazard ghost (amber left border)
- `handleAddCreature` and `handleAddHazard` lifted from EncounterEditor
- XP calculation updated to handle hazard combatants (`c.isHazard ? c.creatureLevel` — no tier adjustment)
- Drop with no encounter selected shows "Select an encounter first" tooltip for 1.5s
- `activeDragData` state cleared in `handleDragEnd` regardless of drop outcome (prevents ghost stuck bug)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all functionality fully wired.

## Self-Check

**Files exist:**
- `src/features/encounter-builder/ui/CreatureSearchSidebar.tsx` — FOUND
- `src/features/encounter-builder/ui/EncounterEditor.tsx` — FOUND
- `src/pages/encounters/ui/EncountersPage.tsx` — FOUND

**Commits exist:**
- `51f0e230` — FOUND
- `d0a0f036` — FOUND

## Self-Check: PASSED
