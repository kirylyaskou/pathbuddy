---
plan: "44-01"
status: completed
---

## Summary

PCSheetPanel foundation complete. All 6 tasks executed.

### What was built

- `--pf-skill-expert` CSS token added in 3 locations (`:root`, `.dark`, `@theme inline`)
- `PathbuilderWeapon` and `PathbuilderArmor` interfaces added to `engine/pc/types.ts`; `PathbuilderBuild.weapons` and `.armor` fields declared
- `CharacterCard` now accepts `onView?` prop; card div is `cursor-pointer` with `onClick`; Swords and X buttons use `stopPropagation`; Eye icon button added for view sheet
- `CharactersPage` wired: `selectedCharacter` state, `onView={setSelectedCharacter}` on CharacterCard, `<PCSheetPanel>` rendered
- `PCSheetPanel.tsx` created with Sheet + 5-tab Tabs (Core & Skills / Equipment / Spells / Feats / Notes), all stubs
- Barrel export updated

### Key files

- `src/app/styles/globals.css`
- `engine/pc/types.ts`
- `src/features/characters/ui/CharacterCard.tsx`
- `src/pages/characters/ui/CharactersPage.tsx`
- `src/features/characters/ui/PCSheetPanel.tsx`
- `src/features/characters/index.ts`

### Self-Check: PASSED
