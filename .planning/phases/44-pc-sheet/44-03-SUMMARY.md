---
plan: "44-03"
status: completed
---

## Summary

SpellsContent, FeatsContent, NotesContent stubs replaced with full implementations.

### What was built

- **SpellsContent** (SHEET-04): Per-caster blocks (tradition · type header), spells grouped by spell level with labels (Cantrips / 1st Level / ...), Focus badge on focus casters; "No spellcasting" empty state
- **FeatsContent** (SHEET-05): Feats sub-section (name semibold + type · level meta + optional note), Class Features sub-section; "No feats recorded" empty state
- **NotesContent** (SHEET-06): Textarea (resize-none, min-h-[200px], placeholder "DM notes for this character..."), saves to SQLite via updateCharacterNotes on onBlur

### Key files

- `src/features/characters/ui/PCSheetPanel.tsx`

### Self-Check: PASSED
