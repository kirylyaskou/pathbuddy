# Phase 07: Remove AddCreatureForm - Research

**Researched:** 2026-03-24
**Domain:** Vue 3 component deletion, vitest test surgery
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Delete `src/components/AddCreatureForm.vue` entirely
- Delete `src/components/__tests__/AddCreatureForm.test.ts` entirely
- Remove `+ Add Creature` button from CombatTracker.vue toolbar
- Remove `AddCreatureForm` import, `formOpen` ref, and `<AddCreatureForm>` usage from CombatTracker.vue
- Remove the CombatTracker.test.ts test case that asserts `+ Add Creature` button opens the form
- No feature preservation — manual creature entry is removed with no replacement
- Creatures without compendium data (no sourceId) can no longer be created — accepted trade-off
- Add a new test in CombatTracker.test.ts confirming no "Add Creature" button is rendered
- Verify all existing tests pass with no references to AddCreatureForm
- CombatTracker empty state text ("Add a creature to begin tracking initiative and HP") remains as-is

### Claude's Discretion
- Whether to adjust toolbar spacing after button removal
- Whether empty state text should reference the browser panel explicitly

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 07 is a surgical cleanup phase: delete the superseded `AddCreatureForm` component and sanitize all three files that reference it. The creature browser (CombatAddBar.vue + CreatureBrowser.vue in mode="combat") has been the real add-creature path since Phase 05 and Phase 06. The old form is dead code.

The scope is exactly three source files plus one entire test file deleted. There are no architectural decisions to make, no new libraries, and no store changes. Every reference to `AddCreatureForm` or `formOpen` in the codebase is concentrated in four files, all identified precisely by code inspection.

The test work is an exact swap: remove one `it()` block (lines 46–65 of CombatTracker.test.ts) and add one new `it()` block asserting the button is absent. The existing 349-test suite passes cleanly against the current codebase; it must continue to pass with AddCreatureForm fully excised.

**Primary recommendation:** Delete both files, then make the four targeted edits to CombatTracker.vue and CombatTracker.test.ts — in that order — then run `npx vitest run` to confirm green.

---

## Standard Stack

No new libraries are introduced. This is pure deletion and test surgery using the project's existing stack.

| Tool | Version | Role |
|------|---------|------|
| Vitest | ^2.1.8 | Test runner — already configured |
| @vue/test-utils | existing | mount(), flushPromises(), wrapper.findAll() |

**Installation:** None required.

---

## Architecture Patterns

### What Is Being Removed (complete inventory)

**File deletions (entire files gone):**

| File | Lines | Why deleted |
|------|-------|-------------|
| `src/components/AddCreatureForm.vue` | 180 | The modal form component itself — superseded by CombatAddBar |
| `src/components/__tests__/AddCreatureForm.test.ts` | 84 | Tests for the deleted component — test file is now orphaned |

**Edits to `src/components/CombatTracker.vue`:**

| Location | What to remove |
|----------|---------------|
| Line 6 | `import AddCreatureForm from './AddCreatureForm.vue'` |
| Line 17 | `const formOpen = ref(false)` |
| Lines 106–112 | The entire `<!-- Add Creature button -->` block (button element + comment) |
| Line 154 | `<AddCreatureForm v-model="formOpen" @add="combatStore.addCreature" />` |

After removing `formOpen`, also verify `ref` is still used elsewhere in CombatTracker.vue. It is — `dragOverCreatureId` uses `ref` on line 55, so the `ref` import on line 2 (`import { ref, computed } from 'vue'`) stays intact.

**Edits to `src/components/__tests__/CombatTracker.test.ts`:**

| Action | Target |
|--------|--------|
| Remove | Entire `it('+ Add Creature button opens form', ...)` block — lines 46–65 |
| Add | New `it('no Add Creature button is rendered', ...)` — see Code Examples |

### What Is NOT Touched

- `combatStore.addCreature` — still called by CombatAddBar, no change
- `CombatAddBar.vue` — the replacement; already fully functional since Phase 05
- `CreatureBrowser.vue` — unchanged
- `CombatView.vue` — no AddCreatureForm references
- All 24 other test files — no AddCreatureForm references
- Empty state paragraph text — "Add a creature to begin tracking initiative and HP." remains accurate for the browser-based flow

### Toolbar Spacing (Claude's Discretion)

After removing the gold `+ Add Creature` button, the toolbar right section will show: `[Round badge] [New Round] [Next Creature]`. The gap-3 flex layout adapts automatically — no class changes needed unless the visual result looks unbalanced. This is a visual judgment call during implementation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Finding all AddCreatureForm references | Manual grep | Already done — only 4 files, fully listed above |
| Asserting absence of a button | DOM presence check | `wrapper.findAll('button').every(b => !b.text().includes('Add Creature'))` |

---

## Common Pitfalls

### Pitfall 1: Orphaned `ref` import after removing `formOpen`
**What goes wrong:** Removing `formOpen = ref(false)` might prompt removing the `ref` import — but `dragOverCreatureId` also uses `ref` on line 55.
**How to avoid:** Keep `import { ref, computed } from 'vue'` exactly as-is. Only delete the `formOpen` declaration line.

### Pitfall 2: The test that opens the form sets `[class*="fixed inset-0"]` expectation
**What goes wrong:** The removed test block (lines 46–65) contains a DOM selector for the modal overlay. It is entirely removed, not partially modified — the whole `it()` goes.
**How to avoid:** Delete the entire block from `it('+ Add Creature button opens form',` through its closing `})`.

### Pitfall 3: CombatView.test.ts warns about AddCreatureForm but still passes
**What's happening:** CombatView.test.ts currently produces Vue warnings about AddCreatureForm's Transition component receiving extraneous non-prop attributes. These warnings will disappear after AddCreatureForm.vue is deleted because CombatTracker (which CombatView renders) will no longer mount it.
**Impact:** Tests pass before and after — this is a positive side effect of the removal.

### Pitfall 4: Asserting absence needs to not find ANY button with "Add Creature" text
**What goes wrong:** The "Add Creature" submit button inside AddCreatureForm.vue also contains the text "Add Creature". After removal, no buttons in CombatTracker's rendered output should match.
**How to avoid:** The new negative assertion using `wrapper.findAll('button')` and filtering by text will naturally work because the whole form is gone from the DOM.

---

## Code Examples

### New test: no Add Creature button is rendered

```typescript
// Source: project pattern from CombatTracker.test.ts existing tests
it('no Add Creature button is rendered', () => {
  const wrapper = mount(CombatTracker, {
    global: {
      plugins: [pinia],
    },
  })

  const buttons = wrapper.findAll('button')
  const addButton = buttons.find(b => b.text().includes('Add Creature'))
  expect(addButton).toBeUndefined()
})
```

This test is synchronous (no async/await needed) because CombatTracker's template renders without async data loading. It follows the same `buttons.find(...)` pattern used throughout the existing test file.

### CombatTracker.vue toolbar after removal

```vue
<!-- Toolbar right section — after removal -->
<div class="flex items-center gap-3">
  <!-- Round badge -->
  <div class="px-3 py-1 rounded-md bg-charcoal-600 border border-charcoal-500 flex items-center gap-2">
    <span class="text-xs text-stone-400 font-normal">Round</span>
    <span class="text-lg font-bold text-gold">{{ combatStore.roundNumber }}</span>
  </div>
  <!-- New Round button -->
  <button
    @click="handleAdvanceRound"
    :disabled="!hasAllActed || combatStore.creatures.length === 0"
    class="px-3 py-1.5 rounded bg-charcoal-500 hover:bg-charcoal-400 border border-charcoal-400 text-sm font-bold text-stone-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  >
    New Round
  </button>
  <!-- Next Creature button -->
  <button
    @click="handleNextCreature"
    :disabled="combatStore.creatures.length === 0"
    class="px-3 py-1.5 rounded bg-charcoal-500 hover:bg-charcoal-400 border border-charcoal-400 text-sm font-bold text-stone-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  >
    Next Creature
  </button>
</div>
```

### CombatTracker.vue script after removal (relevant lines only)

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'          <!-- keep: ref used for dragOverCreatureId -->
import { useCombatStore } from '@/stores/combat'
import type { Condition } from '@/types/combat'
import CreatureCard from './CreatureCard.vue'
<!-- AddCreatureForm import: DELETE this line -->

<!-- formOpen ref: DELETE this line -->
const dragOverCreatureId = ref<string | null>(null)  <!-- stays -->
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^2.1.8 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/components/__tests__/CombatTracker.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| WORK-07 | No "Add Creature" button exists in CombatTracker | unit | `npx vitest run src/components/__tests__/CombatTracker.test.ts` | Wave 0 (new test to add) |
| WORK-07 | No AddCreatureForm component exists in codebase | file deletion | `npx vitest run` (full suite must pass) | ✅ (deletion confirms) |

### Sampling Rate

- **Per task commit:** `npx vitest run src/components/__tests__/CombatTracker.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green (currently 349 tests) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] New `it('no Add Creature button is rendered', ...)` in `src/components/__tests__/CombatTracker.test.ts` — covers WORK-07 positive assertion
- No framework install needed — Vitest already configured and running

---

## State of the Art

| Old State | New State | Impact |
|-----------|-----------|--------|
| AddCreatureForm: live modal with manual data entry | Deleted | CombatAddBar is sole add path |
| CombatTracker imports and mounts AddCreatureForm | CombatTracker imports only CreatureCard | Cleaner component surface |
| CombatTracker.test.ts tests form opens on click | Test removed, negative assertion added | Test suite reflects actual behavior |
| Vue warning about Transition non-prop attrs in CombatView tests | Warning gone (form no longer rendered) | Cleaner test output |

---

## Open Questions

None. The research is complete. Every file is inspected, every reference is located, the test baseline (349 passing) is confirmed, and the exact edits are specified.

---

## Sources

### Primary (HIGH confidence)
- Direct file inspection: `src/components/AddCreatureForm.vue` — full content read (180 lines)
- Direct file inspection: `src/components/CombatTracker.vue` — full content read (157 lines, exact line numbers confirmed)
- Direct file inspection: `src/components/__tests__/AddCreatureForm.test.ts` — full content read (84 lines)
- Direct file inspection: `src/components/__tests__/CombatTracker.test.ts` — full content read (239 lines, removal block lines 46-65 confirmed)
- `grep -r "AddCreatureForm"` — confirmed exactly 3 source files contain references
- `npx vitest run` — confirmed 349 tests pass in current state

### Secondary (MEDIUM confidence)
- `.planning/phases/07-remove-addcreatureform/07-CONTEXT.md` — locked decisions, canonical refs

---

## Metadata

**Confidence breakdown:**
- Removal scope: HIGH — every file and line number verified by direct inspection
- Test surgery: HIGH — exact line range (46-65) confirmed, new test pattern matches existing style
- Side effects: HIGH — grep confirms no other files reference AddCreatureForm

**Research date:** 2026-03-24
**Valid until:** Stable — this is a one-time removal, not a recurring pattern
