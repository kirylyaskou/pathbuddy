# Phase 6: FSD Structure + Zustand Stores - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-04-01
**Areas discussed:** Entity slice design, Feature slice design, Store stubbing depth, PF2e component placement

## Area 1: Entity slice design

### Q1: Which entity slices to create?
- Options: Only 4 from success criteria | Add hazard (5) | Full set (7)
- **Selected:** Full set — creature, combatant, condition, encounter, spell, item, hazard

### Q2: Internal structure per entity slice?
- Options: model+ui+lib | model+ui | Claude's discretion
- **Selected:** model + ui + lib (no api/ — IPC through shared/api/)

### Q3: PF2e component placement within entities?
- Options: Move by ownership | All to entities | Keep all in shared
- **Selected:** Move by ownership — creature-card/stat-block → entities/creature/ui/, xp-budget-bar → entities/encounter/ui/, generic atoms stay in shared/ui/

### Q4: What goes in spell/ and item/ entity slices?
- User proposed deferring full structure until after Phase 7 data import
- **Selected:** Minimal skeletons now, full content after Phase 7 reveals Foundry VTT entity structure

## Area 2: Feature slice design

### Q1: Which feature slices?
- Options: By roadmap phases (3) | Granular (5-6) | Broad (3 wider)
- **Selected:** By roadmap phases — combat-tracker, bestiary-browser, encounter-builder

### Q2: Internal structure per feature?
- Options: model+ui+lib | model+ui | Claude's discretion
- **Selected:** Claude's discretion

### Q3: Stubbing depth for feature slices?
- Options: Minimal skeleton | Skeleton + typed state shape | Claude's discretion
- **Selected:** Minimal skeleton — directory + index.ts + empty store stub

## Area 3: Store stubbing depth

### Q1: Entity store stub detail level?
- Options: Empty store + interface TODO | Typed shape without data | Claude's discretion
- **Selected:** Claude's discretion

### Q2: shared/api/ IPC boundary design?
- Options: Typed function stubs | Generic invoke wrapper only | Claude's discretion
- **Selected:** Claude's discretion

## Area 4: PF2e component placement

### Q1: Where do PF2e types come from after move?
- Options: Entity model/types.ts | shared/types/ | Import from @engine
- **Selected:** Import from @engine — no type duplication

### Q2: Component state after move?
- Options: Keep mock props | Clean presentational with typed props | Claude's discretion
- **Selected:** Clean presentational with typed @engine props, no mock data

---

*Discussion completed: 2026-04-01*
*All 4 areas covered, user confirmed ready for context*
