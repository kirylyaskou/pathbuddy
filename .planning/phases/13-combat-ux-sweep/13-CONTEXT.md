# Phase 13: Combat UX Sweep - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Five focused UX improvements to the existing combat tracker — Kill button in Dying modal, condition picker cleanup (remove Detection/Attitude groups), wider condition picker layout, single-input HP controls, and persistent damage modal verification. No new architecture, no new features.

Requirements: CMB-06, CMB-07, CMB-08, CMB-09, CMB-10

</domain>

<decisions>
## Implementation Decisions

### Kill Button (CMB-06)
- **D-01:** Already implemented in `DyingCascadeDialog.tsx:211-222` — "Kill (no check)" button exists and sets dying to death threshold. Verify it works correctly and mark done.

### Condition Picker Cleanup (CMB-07)
- **D-02:** Remove Detection group (Observed, Hidden, Undetected, Unnoticed) and Attitudes group (Hostile, Unfriendly, Friendly, Helpful, Indifferent) from `ConditionCombobox.tsx` groups array. Straightforward removal.

### Condition Picker Layout (CMB-08)
- **D-03:** Category tabs + grid layout. Tab bar across the top with 5 remaining groups (Persistent Damage, Death & Dying, Abilities, Senses, Other). Each tab shows a grid of clickable condition pills for that category.
- **D-04:** Search bar above tabs. Typing in search filters across all categories — tabs disappear while searching, showing flat filtered results.
- **D-05:** Wider popover to accommodate the grid layout (current `w-56` is too narrow).

### HP Controls Redesign (CMB-09)
- **D-06:** Single numeric input + 3 action buttons. Replace current 3-input `grid-cols-3` layout.
- **D-07:** Layout: input on the left, 3 buttons (Damage / Heal / TempHP) stacked on the right. Compact horizontal arrangement.
- **D-08:** Damage button uses split-button design — left side applies damage, right side is a dropdown arrow to select damage type. IWR preview appears when damage type is set and relevant.
- **D-09:** Enter key in the input applies damage (most common action during combat).

### Persistent Damage Modal (CMB-10)
- **D-10:** Already implemented and working in `PersistentDamageDialog.tsx`. Verify end-to-end (flat-check, damage application, condition removal) and mark done.

### Claude's Discretion
- Exact width of the wider condition picker popover
- Grid column count for condition pills within each tab
- Split-button visual design (border between apply/dropdown, icon choices)
- Exact button sizing and spacing in the stacked HP buttons layout
- How IWR preview integrates visually with the split-button Damage approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — CMB-06 through CMB-10 requirements and success criteria
- `.planning/ROADMAP.md` §Phase 13 — Phase goal, success criteria

### Prior phase decisions
- `.planning/phases/08-combat-tracker-engine-integration/08-CONTEXT.md` — Original combat tracker design decisions (condition combobox, HP controls, turn advancement)

### Existing code (critical paths)
- `src/widgets/combatant-detail/ui/HpControls.tsx` — Current 3-input HP controls with damage type combobox + IWR preview
- `src/features/combat-tracker/ui/ConditionCombobox.tsx` — Current condition picker with grouped Command list
- `src/widgets/combatant-detail/ui/DyingCascadeDialog.tsx` — Dying modal with existing Kill button (line 211)
- `src/widgets/combatant-detail/ui/PersistentDamageDialog.tsx` — Persistent damage flat-check dialog
- `src/features/combat-tracker/lib/turn-manager.ts` — Turn advance + persistent damage trigger (lines 52-70)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DyingCascadeDialog.tsx` — Kill button already implemented, needs verification only
- `PersistentDamageDialog.tsx` — Full auto/manual flat-check flow exists, needs verification only
- shadcn/ui `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` — available for condition picker category tabs
- shadcn/ui `Popover`, `Command`, `Button`, `Input` — already used in current condition picker and HP controls
- Engine exports: `CONDITION_SLUGS`, `VALUED_CONDITIONS`, `CONDITION_GROUPS`, `DAMAGE_TYPES`, `applyIWR`

### Established Patterns
- Condition groups defined via engine `CONDITION_GROUPS` object — Detection and Attitudes are named groups, easy to filter out
- Zustand + immer for all entity/feature stores
- Toast notifications via sonner for condition changes
- Split-button pattern not yet used in codebase — new UI pattern for this phase

### Integration Points
- `ConditionCombobox` receives `combatantId` + `existingSlugs` — interface stays the same, only internal layout changes
- `HpControls` receives `combatant` + IWR data + abilities — interface stays the same, only internal layout changes
- Turn-manager triggers persistent damage dialog via `setPendingPersistentDamage` on combat tracker store

</code_context>

<specifics>
## Specific Ideas

- Split-button on Damage: left side applies damage at selected type, right dropdown opens damage type picker. This keeps IWR accessible without cluttering the default flow.
- Category tabs for condition picker keep the grouped mental model from Phase 8 D-09 while making browsing much faster than scrolling a narrow list.
- CMB-06 and CMB-10 are verification items — code exists, just needs confirmation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-combat-ux-sweep*
*Context gathered: 2026-04-02*
