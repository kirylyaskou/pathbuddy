# Phase 13: Combat UX Sweep - Research

**Researched:** 2026-04-02
**Domain:** React component refactoring — condition picker redesign, HP controls redesign, dialog verification
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 (CMB-06):** Already implemented in `DyingCascadeDialog.tsx:211-222` — "Kill (no check)" button exists and sets dying to death threshold. Verify it works correctly and mark done.

**D-02 (CMB-07):** Remove Detection group (`CONDITION_GROUPS.detection`: Observed, Hidden, Undetected, Unnoticed) and Attitudes group (`CONDITION_GROUPS.attitudes`: Hostile, Unfriendly, Friendly, Helpful, Indifferent) from `ConditionCombobox.tsx` groups array. Straightforward removal.

**D-03 (CMB-08):** Category tabs + grid layout. Tab bar across the top with 5 remaining groups (Persistent Damage, Death & Dying, Abilities, Senses, Other). Each tab shows a grid of clickable condition pills for that category.

**D-04 (CMB-08):** Search bar above tabs. Typing in search filters across all categories — tabs disappear while searching, showing flat filtered results.

**D-05 (CMB-08):** Wider popover to accommodate the grid layout (current `w-56` is too narrow).

**D-06 (CMB-09):** Single numeric input + 3 action buttons. Replace current 3-input `grid-cols-3` layout.

**D-07 (CMB-09):** Layout: input on the left, 3 buttons (Damage / Heal / TempHP) stacked on the right. Compact horizontal arrangement.

**D-08 (CMB-09):** Damage button uses split-button design — left side applies damage, right side is a dropdown arrow to select damage type. IWR preview appears when damage type is set and relevant.

**D-09 (CMB-09):** Enter key in the input applies damage (most common action during combat).

**D-10 (CMB-10):** Already implemented and working in `PersistentDamageDialog.tsx`. Verify end-to-end (flat-check, damage application, condition removal) and mark done.

### Claude's Discretion

- Exact width of the wider condition picker popover
- Grid column count for condition pills within each tab
- Split-button visual design (border between apply/dropdown, icon choices)
- Exact button sizing and spacing in the stacked HP buttons layout
- How IWR preview integrates visually with the split-button Damage approach

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMB-06 | Dying modal includes a "Kill" button to immediately kill the creature without rolling recovery | Kill button exists at DyingCascadeDialog.tsx:211-222. Sets `dyingValue` to `4 - doomedValue`, triggers `isDead = true`. Verification only. |
| CMB-07 | Condition picker excludes Detection conditions and Attitude conditions | `CONDITION_GROUPS.detection` and `CONDITION_GROUPS.attitudes` are named keys in the engine export. Remove 2 entries from the `groups` array in ConditionCombobox.tsx. |
| CMB-08 | Condition picker has improved UX — wider layout, easier to browse and select | Replace Command list with Tabs + pill grid. UI-SPEC: `w-80 p-0` popover, `grid-cols-3`, 5 tabs. Search hides tabs, shows flat filtered grid. |
| CMB-09 | HP controls use a single numeric input with 3 action buttons (Damage / Heal / TempHP) instead of 3 separate inputs | Replace `grid-cols-3` + 3 inputs with `flex gap-2` + 1 input + stacked buttons. Split-button on Damage for type picker. Enter applies damage. |
| CMB-10 | Persistent damage modal displays correctly and functions end-to-end (flat-check, damage application, condition removal) | PersistentDamageDialog.tsx fully implemented. Triggered via `setPendingPersistentDamage` in turn-manager.ts. Rendered in CombatPage.tsx. Verification only. |
</phase_requirements>

---

## Summary

Phase 13 is a surgical UX sweep across four combat components — no new architecture, no new Zustand stores, no new engine integration. Two of the five requirements (CMB-06, CMB-10) are verification-only: the code already exists and simply needs end-to-end confirmation. The remaining three (CMB-07, CMB-08, CMB-09) are component rewrites that stay within existing file boundaries and reuse already-installed shadcn components.

The highest implementation complexity is CMB-09 (HP controls redesign): consolidating three input states into one, adding split-button interaction for damage type selection, and maintaining the IWR preview flow. The split-button pattern is new to this codebase — it requires two `<Button>` elements in a flex row sharing a single visual container rather than a native `<SplitButton>` component (shadcn has none). CMB-08 (condition picker tabs) is the second most involved change: swapping the Command list for a Tabs + CSS Grid layout while preserving the existing sub-views (valued condition stepper, persistent damage formula input).

**Primary recommendation:** Work in file-at-a-time order: (1) ConditionCombobox.tsx — remove groups then rebuild layout, (2) HpControls.tsx — consolidate state then rebuild layout, (3) verify Kill button, (4) verify PersistentDamageDialog. No cross-file dependencies between these edits.

---

## Standard Stack

### Core (already installed — no new installs required)

| Library | Verified Version | Purpose | Status |
|---------|-----------------|---------|--------|
| shadcn/ui Tabs | bundled (Radix UI) | Category tabs in condition picker | `src/shared/ui/tabs.tsx` exists |
| shadcn/ui Popover + Command | bundled | Damage type dropdown in split-button | Already used in HpControls.tsx |
| shadcn/ui Button | bundled | All action buttons | Already used throughout |
| shadcn/ui Input | bundled | Single HP input | Already used in HpControls.tsx |
| lucide-react | 1.7.0 | Icons (Swords/Minus, Plus, Shield, ChevronDown) | Already installed |
| Zustand 5 + immer | in project | State — no store changes needed | No new stores |

### No New Installs

All components referenced in UI-SPEC are already present in `src/shared/ui/`. The split-button is assembled from two `<Button>` elements — no third-party split-button library needed.

---

## Architecture Patterns

### Component Boundaries (unchanged)

All changes are internal to existing files. External interfaces remain identical:

| File | Interface | What Changes |
|------|-----------|-------------|
| `ConditionCombobox.tsx` | `{ combatantId, existingSlugs }` | Internal layout: Command list → Tabs + grid |
| `HpControls.tsx` | `{ combatant, iwrImmunities, iwrWeaknesses, iwrResistances, abilities }` | Internal state consolidation + layout |
| `DyingCascadeDialog.tsx` | No change | Verify only |
| `PersistentDamageDialog.tsx` | No change | Verify only |

### Pattern 1: Tabs + Grid (CMB-07, CMB-08)

Replace the `<Command>` list entirely when no `selectedSlug` is active. The new structure wraps search + tabs in a plain `<div>` instead of `<Command>`:

```tsx
// Source: UI-SPEC + shadcn Tabs documentation
<PopoverContent className="w-80 p-0" align="start">
  {selectedSlug && isPersistent ? (
    /* existing persistent sub-view — unchanged */
  ) : selectedSlug && isValued ? (
    /* existing valued sub-view — unchanged */
  ) : (
    <div>
      {/* Search input — plain Input, not CommandInput */}
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search conditions..."
        className="h-8 text-xs border-0 border-b rounded-none px-3"
      />
      {search ? (
        /* flat filtered grid — all groups flattened, filtered by search */
        <div className="p-2 grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
          {allSlugs.filter(s => s.includes(search.toLowerCase())).map(...)}
        </div>
      ) : (
        <Tabs defaultValue="persistent">
          <TabsList className="w-full h-8 text-xs">
            <TabsTrigger value="persistent">Persistent</TabsTrigger>
            ...
          </TabsList>
          {groups.map(group => (
            <TabsContent key={group.id} value={group.id}>
              <div className="p-2 grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                {group.slugs.map(slug => <ConditionPill ... />)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )}
</PopoverContent>
```

**Key insight:** Replacing `<Command>` with a plain `<div>` + `<Input>` removes keyboard-navigation behavior from the list. This is acceptable — the pill grid is click-only per UI-SPEC. The sub-views (valued stepper, persistent formula) keep their existing structure.

### Pattern 2: Split-Button (CMB-09)

Two adjacent `<Button>` elements sharing a visual boundary — no native split-button component needed:

```tsx
// Source: UI-SPEC D-08, assembled from shadcn Button
<div className="flex">
  {/* Left: apply damage */}
  <Button
    variant="destructive"
    className="flex-1 h-7 text-xs justify-start gap-1.5 rounded-r-none"
    onClick={() => handleAction('damage')}
  >
    <Minus className="w-3 h-3" />
    {damageType ? `Damage (${damageType})` : 'Damage'}
  </Button>
  {/* Right: open damage type picker */}
  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
    <PopoverTrigger asChild>
      <Button
        variant="destructive"
        className="h-7 w-7 px-0 rounded-l-none border-l border-destructive-foreground/20"
      >
        <ChevronDown className="w-3 h-3" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-48 p-0" align="end">
      {/* existing DAMAGE_TYPE_GROUPS Command — unchanged from current HpControls */}
    </PopoverContent>
  </Popover>
</div>
```

### Pattern 3: State Consolidation (CMB-09)

Replace three inputs with one. The action is determined by which button is pressed, not by which input holds the value:

```tsx
// Before (3 states):
const [damageInput, setDamageInput] = useState('')
const [healInput, setHealInput] = useState('')
const [tempHpInput, setTempHpInput] = useState('')

// After (1 state):
const [hpInput, setHpInput] = useState('')

// Single handler, action discriminated by argument:
const handleAction = useCallback((action: 'damage' | 'heal' | 'tempHp') => {
  const amount = parseInt(hpInput, 10)
  if (isNaN(amount) || amount <= 0) return
  if (action === 'damage') { /* existing damage logic */ }
  if (action === 'heal') { updateHp(combatant.id, amount) }
  if (action === 'tempHp') { updateTempHp(combatant.id, Math.max(combatant.tempHp, amount)) }
  setHpInput('')
}, [hpInput, /* deps */])

// Enter key → damage (D-09):
onKeyDown={(e) => e.key === 'Enter' && handleAction('damage')}
```

### Recommended File Edit Order

1. `ConditionCombobox.tsx` — self-contained, no deps on HpControls
2. `HpControls.tsx` — self-contained, no deps on ConditionCombobox
3. `DyingCascadeDialog.tsx` — read-only verification (no edits expected)
4. `PersistentDamageDialog.tsx` — read-only verification (no edits expected)

### Anti-Patterns to Avoid

- **Keeping `<Command>` as the outer wrapper for CMB-08:** `CommandList` enforces a scrollable list layout. Replacing it with `<Tabs>` + CSS grid requires removing `<Command>` from the no-selection branch. The sub-views (valued/persistent) do not use `<Command>` at all — they're plain divs already.
- **Using `replaceAll` instead of a global regex for slug display:** `slug.replace('-', ' ')` only replaces the first hyphen. `persistent-fire` becomes `persistent fire` correctly, but `clumsy` has no hyphen so it's fine. However, `persistent-bleed` → `persistent bleed` works. Double-check multi-hyphen slugs aren't needed in the remaining groups (they aren't — no remaining group has multi-hyphen slugs after removing detection/attitudes).
- **Not clearing `hpInput` after every action:** The UI-SPEC specifies "Input cleared after any action — Yes, always." Forgetting this in one branch will leave stale values.
- **Nested Popover inside Popover (CMB-09 split-button):** Radix Popover supports nesting but requires the inner Popover to have its own `open`/`onOpenChange` state. The existing `typeOpen` state in HpControls already handles this correctly — just wire the ChevronDown button to it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab navigation | Custom tab state machine | shadcn `Tabs` (Radix) | Already installed, handles keyboard nav, ARIA |
| Damage type search | Custom search input + filter | Existing `<Command>` inside the type Popover | Already working in current HpControls — keep unchanged |
| Split-button | Third-party library | Two `<Button>` elements + `flex` | shadcn has no SplitButton component; two buttons is the idiomatic approach |
| Condition pill grid | `CommandItem` styling hack | Plain `div` + `grid` + `onClick` | CommandItem enforces list layout; grid needs no Command context |

---

## Common Pitfalls

### Pitfall 1: IWR preview depends on `hpInput` not `damageInput`

**What goes wrong:** After consolidating to `hpInput`, the `iwrPreview` useMemo still reads `damageInput` (the old variable). IWR preview stops updating.

**Why it happens:** Rename oversight — the memo dep array references the old state name.

**How to avoid:** Update the `iwrPreview` useMemo dependency array: `[damageType, hpInput, iwrImmunities, iwrWeaknesses, iwrResistances]`. Update the `parseInt` call inside the memo from `damageInput` to `hpInput`.

**Warning signs:** IWR preview never appears even after typing a value and selecting a damage type.

### Pitfall 2: Tabs `defaultValue` must match a real tab id

**What goes wrong:** If `defaultValue="persistent"` but the TabsTrigger value is `"Persistent Damage"` (or any mismatch), the first tab renders empty.

**Why it happens:** Radix Tabs matches `defaultValue` to `TabsTrigger value` by string equality.

**How to avoid:** Define tab ids as a constant array and use them for both `TabsTrigger value` and `TabsContent value`:

```tsx
const TABS = [
  { id: 'persistent', label: 'Persistent', slugs: PERSISTENT_SLUGS },
  { id: 'death', label: 'Death', slugs: CONDITION_GROUPS.death },
  // ...
] as const
```

### Pitfall 3: Search filter must use `replaceAll` or global regex

**What goes wrong:** Searching "fire" finds `persistent-fire` but not `clumsy` (fine). But searching "per" should match `persistent-fire`, `persistent-cold`, etc. The search compares against the raw slug, which contains hyphens. If the DM types "persistent fire" (with a space), it won't match `persistent-fire`.

**How to avoid:** Normalize both the search term and the slug before comparing:

```tsx
const normalized = (s: string) => s.replaceAll('-', ' ').toLowerCase()
const matches = (slug: string) => normalized(slug).includes(normalized(search))
```

### Pitfall 4: Kill button triggers `isDead` but `DyingCascadeDialog` still expects `onClose` to be called

**What goes wrong:** If the DM clicks "Kill (no check)", `isDead` is set to `true` and the DEAD screen shows. But the dialog needs to be manually closed afterward. Verify that the dialog does not auto-close on kill (it should show the DEAD state and let the DM close it).

**Why it matters:** Looking at the implementation (line 211-222), the Kill button sets `isDead = true` without calling `onClose()`. The DEAD screen shows an "Override (DM Fiat)" button. This is intentional — the DM needs to explicitly dismiss. Verification must confirm clicking Kill renders the DEAD state and the dialog can be closed.

### Pitfall 5: PersistentDamageDialog dialog not opening

**What goes wrong:** `setPendingPersistentDamage` is called in `turn-manager.ts` but the dialog in `CombatPage.tsx` uses `useCombatTrackerStore((s) => s.pendingPersistentDamage)` — if `advanceTurn()` is called correctly this works. Verification must confirm that `advanceTurn()` is actually called from `TurnControls` and that `pendingPersistentDamage` non-null causes the dialog to open.

**How to avoid:** Trace the call chain: `TurnControls` → `advanceTurn()` → `tracker.setPendingPersistentDamage(...)` → `CombatPage` re-renders → `PersistentDamageDialog open={!!pending}` opens.

---

## Code Examples

### Verified: Current CONDITION_GROUPS structure (from engine source)

```typescript
// engine/conditions/condition-effects.ts
export const CONDITION_GROUPS_EXTENDED: Record<string, ConditionSlug[]> = {
  detection:  ['observed', 'hidden', 'undetected', 'unnoticed'],
  attitudes:  ['hostile', 'unfriendly', 'indifferent', 'friendly', 'helpful'],
  senses:     ['blinded', 'concealed', 'dazzled', 'deafened', 'invisible'],
  abilities:  ['clumsy', 'cursebound', 'drained', 'enfeebled', 'stupefied'],
  death:      ['doomed', 'dying', 'unconscious', 'wounded'],
}
export const CONDITION_GROUPS = CONDITION_GROUPS_EXTENDED
```

After removing `detection` and `attitudes`, the 5 remaining groups map directly to the 5 UI-SPEC tabs.

### Verified: Kill button implementation (DyingCascadeDialog.tsx:211-222)

```tsx
<Button
  className="w-full"
  variant="destructive"
  size="sm"
  onClick={() => {
    setConditionValue(combatantId, 'dying' as ConditionSlug, 4 - doomedValue)
    setIsDead(true)
    setCheckResult(null)
  }}
>
  Kill (no check)
</Button>
```

Sets dying value to `4 - doomedValue` (the death threshold), triggers the DEAD display. Logic is correct per PF2e rules (doomed reduces the death threshold).

### Verified: PersistentDamageDialog trigger flow

```
turn-manager.ts advanceTurn()
  → useCombatTrackerStore.getState().setPendingPersistentDamage({ combatantId, combatantName, conditions })
    → CombatPage.tsx: pendingPersistentDamage = useCombatTrackerStore(s => s.pendingPersistentDamage)
      → <PersistentDamageDialog pending={pendingPersistentDamage} onClose={() => setPendingPersistentDamage(null)} />
        → Dialog open={!!pending}  ← opens when pending is non-null
```

### Verified: shadcn Tabs usage

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
// File exists: src/shared/ui/tabs.tsx — already installed
```

---

## Runtime State Inventory

Step 2.5 SKIPPED — this is a component UX refactor phase, not a rename/migration phase. No stored data, service config, or OS-registered state is involved.

---

## Environment Availability

Step 2.6 SKIPPED — purely frontend component changes. No external tools, CLIs, databases, or services beyond the existing project stack.

---

## Open Questions

1. **Does the Kill button actually render the DEAD screen in the current build?**
   - What we know: Code at lines 211-222 is correct. `setIsDead(true)` triggers the dead branch at line 132.
   - What's unclear: Whether there are any runtime issues (e.g., `setConditionValue` throwing when dying is already non-zero).
   - Recommendation: Verify manually by adding a combatant to combat, dealing enough damage to drop to 0 HP, then clicking Kill in the resulting dialog.

2. **Does the condition picker `allSlugs` for search mode need to include persistent slugs?**
   - What we know: `PERSISTENT_SLUGS` is a local constant in ConditionCombobox.tsx (not from engine). It must be included in the flat search array.
   - What's unclear: Whether search should also match persistent conditions by their damage type label ("fire", "cold") vs. their slug ("persistent-fire").
   - Recommendation: Search against the slug (after hyphen-space normalization) — "fire" will match "persistent fire" when normalized. No extra mapping needed.

3. **`w-80` popover — is there enough horizontal space in the combatant detail panel?**
   - What we know: The center panel has `defaultSize={45} minSize={30}` of the ResizablePanelGroup. At minimum screen width this could be tight.
   - What's unclear: Whether `w-80` (320px) overflows visually at minimum panel size.
   - Recommendation: UI-SPEC mandates `w-80`. Use `align="start"` on PopoverContent (already present) so it opens to the right. Radix handles overflow detection and flips direction automatically via floating-ui.

---

## Sources

### Primary (HIGH confidence)

- `src/features/combat-tracker/ui/ConditionCombobox.tsx` — current implementation, direct inspection
- `src/widgets/combatant-detail/ui/HpControls.tsx` — current implementation, direct inspection
- `src/widgets/combatant-detail/ui/DyingCascadeDialog.tsx` — Kill button at lines 211-222
- `src/widgets/combatant-detail/ui/PersistentDamageDialog.tsx` — full implementation verified
- `src/features/combat-tracker/lib/turn-manager.ts` — `setPendingPersistentDamage` call at lines 60-69
- `src/pages/combat/ui/CombatPage.tsx` — PersistentDamageDialog render location
- `engine/conditions/condition-effects.ts` — CONDITION_GROUPS_EXTENDED structure
- `src/shared/ui/tabs.tsx` — shadcn Tabs confirmed installed
- `.planning/phases/13-combat-ux-sweep/13-CONTEXT.md` — locked decisions D-01 through D-10
- `.planning/phases/13-combat-ux-sweep/13-UI-SPEC.md` — visual and interaction contracts

### Secondary (MEDIUM confidence)

- lucide-react v1.7.0 — verified via `npm view lucide-react version`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components verified as installed in project
- Architecture: HIGH — all patterns derived directly from current source code + UI-SPEC
- Pitfalls: HIGH — derived from reading actual implementation, no speculation

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable components, slow-moving)
