---
phase: 46
status: passed
date: 2026-04-07
---

## Verification: Phase 46 — PC Combat Polish

### Must-Haves Check

| # | Success Criterion | Evidence | Status |
|---|-------------------|----------|--------|
| 1 | Characters tab in left panel, click adds PC to encounter | `CharactersTab` in `BestiarySearchPanel` 3-tab layout | ✓ PASS |
| 2 | Add to Combat shows encounter picker when >1 tabs open | `CharactersPage` Dialog with `pickerTabs`/`addCombatantToTab` | ✓ PASS |
| 3 | PC initiative editable (click → input → Enter/blur saves) | `InitiativeRow` `isEditing` + `saveEdit` + `reorderAfterChange` | ✓ PASS |
| 4 | PC selection shows stat card (ability scores, saves, skills, AC, HP) | `PCCombatCard` + `handleSelect` PC branch in `CombatPage` | ✓ PASS |
| 5 | Combat + Encounters creature lists have type filter | `BestiarySearchPanel` Select (20 types) + `EncounterCreatureSearchPanel` Select | ✓ PASS |
| 6 | Hazard rows have Roll Initiative button (Stealth DC bonus) | `InitiativeRow` `Dices` button + `handleHazardRoll` + toast | ✓ PASS |

### TypeScript

```
npx tsc --noEmit — 0 new errors (7 pre-existing from prior phases)
```

### Automated Checks

```bash
grep "isHazard\?:" src/entities/combatant/model/types.ts  # ✓
grep "initiativeBonus\?:" src/entities/combatant/model/types.ts  # ✓
grep "isEditing" src/widgets/initiative-list/ui/InitiativeRow.tsx  # ✓
grep "handleHazardRoll" src/widgets/initiative-list/ui/InitiativeRow.tsx  # ✓
test -f src/widgets/bestiary-search/ui/HazardSearchPanel.tsx  # ✓
test -f src/widgets/bestiary-search/ui/CharactersTab.tsx  # ✓
grep "activeTab" src/widgets/bestiary-search/ui/BestiarySearchPanel.tsx  # ✓
grep "CREATURE_TYPES" src/widgets/bestiary-search/ui/BestiarySearchPanel.tsx  # ✓
grep "hazard-add" src/pages/combat/ui/CombatPage.tsx  # ✓
test -f src/features/characters/ui/PCCombatCard.tsx  # ✓
grep "selectedPcBuild" src/pages/combat/ui/CombatPage.tsx  # ✓
grep "pickerOpen" src/pages/characters/ui/CharactersPage.tsx  # ✓
grep "searchCreaturesFiltered" src/features/encounter-builder/ui/EncounterCreatureSearchPanel.tsx  # ✓
```

### Verdict: PASSED
