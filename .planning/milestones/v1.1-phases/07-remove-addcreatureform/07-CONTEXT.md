# Phase 07: Remove AddCreatureForm - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Delete the superseded AddCreatureForm component and all its references. The creature browser (left panel in CombatView) is now the sole entry point for adding creatures to combat. No features from the old manual form are preserved — this is a clean removal.

Requirements: WORK-07.

</domain>

<decisions>
## Implementation Decisions

### Removal scope
- Delete `src/components/AddCreatureForm.vue` entirely
- Delete `src/components/__tests__/AddCreatureForm.test.ts` entirely
- Remove `+ Add Creature` button from CombatTracker.vue toolbar
- Remove `AddCreatureForm` import, `formOpen` ref, and `<AddCreatureForm>` usage from CombatTracker.vue
- Remove the CombatTracker.test.ts test case that asserts `+ Add Creature` button opens the form

### No feature preservation
- Manual creature entry (name, HP, AC, initiative, dexMod, conditions) is removed — no replacement
- Creatures without compendium data (no sourceId) can no longer be created — accepted trade-off
- The old form's condition pre-selection at add time is not needed — conditions are applied after adding via the tracker

### Post-removal validation
- Add a new test in CombatTracker.test.ts confirming no "Add Creature" button is rendered
- Verify all existing tests pass with no references to AddCreatureForm
- CombatTracker empty state text ("Add a creature to begin tracking initiative and HP") remains as-is — still accurate for the browser flow

### Claude's Discretion
- Whether to adjust toolbar spacing after button removal
- Whether empty state text should reference the browser panel explicitly

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to delete
- `src/components/AddCreatureForm.vue` — The component being removed (168 lines)
- `src/components/__tests__/AddCreatureForm.test.ts` — Tests for the removed component

### Files to modify
- `src/components/CombatTracker.vue` — Remove import, formOpen ref, toolbar button, and component usage (lines 6, 17, 106-112, 154)
- `src/components/__tests__/CombatTracker.test.ts` — Remove "Add Creature button opens form" test (lines 46-65), add "no Add Creature button" test

### Project requirements
- `.planning/REQUIREMENTS.md` — WORK-07

</canonical_refs>

<code_context>
## Existing Code Insights

### What's being removed
- `AddCreatureForm.vue`: Modal dialog with name/maxHP/AC/initiative/dexMod/conditions form, emits `add` with `Omit<Creature, 'id'>`
- Toolbar button: `+ Add Creature` gold button in CombatTracker toolbar (line 107-112)
- `formOpen` ref: Controls modal visibility via `v-model` binding

### What replaces it (already shipped)
- `CombatAddBar.vue` (Phase 05): Bottom-of-browser-panel add bar with creature selection, quantity input, WeakEliteSelector, "Add to Combat" button
- `CreatureBrowser.vue` in `mode="combat"`: Row click selects creature for adding; CombatAddBar appears below
- Data comes from compendium (28K+ entities) instead of manual entry

### Integration points
- `CombatTracker.vue` is the only file that imports AddCreatureForm
- No other component references AddCreatureForm
- `combatStore.addCreature` continues to be called by CombatAddBar — no store changes needed

</code_context>

<specifics>
## Specific Ideas

No specific requirements — clean deletion with no feature preservation from the old form.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-remove-addcreatureform*
*Context gathered: 2026-03-24*
