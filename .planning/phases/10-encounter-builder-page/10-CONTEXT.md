# Phase 10: P2 Differentiators - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase surfaces the engine's unique PF2e capabilities in the existing UI — IWR damage preview in combat tracker, Dying/Wounded cascade with recovery checks, Weak/Elite HP presets on creature add, persistent damage with flat-check prompts, MAP attack display in creature stat blocks, and hazard XP in the encounter builder. These are 6 features distributed across existing pages (combat, bestiary, encounters), not a new page.

Requirements: INT-01, INT-02, INT-03, INT-04, INT-05, INT-06

</domain>

<decisions>
## Implementation Decisions

### IWR Damage Dialog (INT-01)
- **D-01:** Inline expansion in HpControls — no dialog. Damage input gets a damage type combobox (searchable dropdown, same pattern as condition combobox). Selecting a type + entering damage shows an IWR breakdown row below the input.
- **D-02:** IWR preview row only appears when the creature actually has matching IWR. No preview for creatures without relevant immunities/weaknesses/resistances — keeps UI uncluttered.
- **D-03:** Healing stays simple — plain number input, no type selector. IWR flow only applies to the Damage input.
- **D-04:** Damage type combobox lists all 18 engine damage types. If no type selected, damage applies as untyped (bypasses IWR, same as current behavior — backwards compatible).
- **D-05:** IWR breakdown shows: raw damage → immunities applied → weaknesses applied → resistances applied → final damage. Uses engine `applyIWR` result.

### Dying/Wounded Cascade (INT-02)
- **D-06:** Auto dialog when HP reaches 0 from damage. Before showing dying flow, scan creature's `abilities[]` for death-prevention keywords (Ferocity, Rejuvenation, etc.) and show a warning note in the dialog if found.
- **D-07:** Recovery check supports both auto-roll and manual input. Default is auto-roll button; a toggle/input lets DM enter a physical dice result. Engine `performRecoveryCheck` calculates degree of success.
- **D-08:** Full dying cascade in the dialog — if dying value reaches death threshold (4 - doomed), shows DEAD state with skull icon. DM confirms death or can override (DM fiat button).
- **D-09:** Dialog shows current dying/wounded/doomed values, DC calculation, roll result, outcome (Critical Success/Success/Failure/Critical Failure), and resulting condition changes.

### Weak/Elite on Creature Add (INT-03)
- **D-10:** Tier selector appears in both combat bestiary panel (BestiarySearchPanel) and encounter builder (CreatureSearchSidebar). Consistent behavior everywhere creatures are added.
- **D-11:** Inline 3-segment toggle (Weak / Normal / Elite) next to each creature's Add button. Default: Normal. HP preview updates immediately when toggled via engine `getHpAdjustment`.
- **D-12:** Weak/Elite also adjusts displayed level (+1/-1) per engine rules. Both HP delta and level change shown before adding.

### Persistent Damage & Flat-Check (INT-04)
- **D-13:** Actionable toast on turn advance — when active combatant has persistent damage, turn advances normally and a toast appears: "X takes Yd6 fire (persistent). [Roll Flat-Check]". Non-blocking flow.
- **D-14:** Persistent damage tracked as condition with value = damage dice formula string (e.g., "persistent-fire: 2d6"). DM enters formula when applying the condition.
- **D-15:** Flat-check uses same auto-roll + manual input pattern as recovery check. DC 15. Pass removes persistent damage condition; fail keeps it.
- **D-16:** Persistent damage toast shows damage amount. DM must manually apply the damage (enter in HpControls) — app does not auto-subtract, since DM may need to apply IWR to persistent damage.

### MAP Attack Display (INT-05)
- Claude's discretion on placement — likely in creature stat block strikes section, showing MAP 0 / MAP -5 / MAP -10 computed by engine `buildAttackModifierSets`.

### Hazard XP (INT-06)
- Claude's discretion on hazard integration in encounter builder — needs hazard search, add to encounter, XP contribution via engine `getHazardXp`.

### Claude's Discretion
- Exact IWR breakdown row styling and layout within HpControls
- Dying dialog visual design (dark fantasy theme, skull/death iconography)
- Death-prevention ability keyword list for scanning creature abilities
- Persistent damage dice formula parsing and display approach
- MAP modifier set display format in stat block strikes
- Hazard entity type, search UI, and encounter builder integration
- Toast styling for persistent damage prompts (actionable toast pattern)
- Order of operations when multiple end-of-turn effects fire (persistent damage + condition decrement)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — INT-01 through INT-06 requirements and success criteria
- `.planning/ROADMAP.md` §Phase 10 — Phase goal, success criteria, dependency on Phase 9

### Prior phase decisions
- `.planning/phases/08-combat-tracker-engine-integration/08-CONTEXT.md` — 3-panel combat layout, HpControls, ConditionSection, turn advance, auto-decrement, SQLite persistence
- `.planning/phases/09-xp-budget-overlay/09-CONTEXT.md` — XP budget bar, encounter store, party config

### Engine exports (consumed via @engine)
- `engine/index.ts` — Barrel export with applyIWR, performRecoveryCheck, getHpAdjustment, buildAttackModifierSets, getHazardXp, calculateEncounterRating
- `engine/damage/iwr.ts` — applyIWR function, IWRApplicationResult interface (finalDamage, appliedImmunities, appliedWeaknesses, appliedResistances)
- `engine/conditions/death-progression.ts` — performRecoveryCheck(dyingValue, doomedValue, rollOverride?) → RecoveryCheckResult
- `engine/encounter/weak-elite.ts` — getHpAdjustment(tier, level) → HP delta number
- `engine/statistics/creature-statistics.ts` — buildAttackModifierSets(attack, conditionModifiers?) → [MAP0, MAP5, MAP10] StatisticModifier tuple
- `engine/encounter/xp.ts` — getHazardXp(hazardLevel, partyLevel, type)

### Existing UI components to modify
- `src/widgets/combatant-detail/ui/HpControls.tsx` — Current damage/heal/tempHP controls (INT-01 modifies this)
- `src/widgets/combatant-detail/ui/ConditionSection.tsx` — Condition management (INT-02, INT-04 integrate here)
- `src/widgets/bestiary-search/ui/BestiarySearchPanel.tsx` — Combat bestiary panel (INT-03 adds tier toggle)
- `src/features/encounter-builder/ui/CreatureSearchSidebar.tsx` — Encounter builder search (INT-03 adds tier toggle)
- `src/features/combat-tracker/ui/TurnControls.tsx` — Turn advance (INT-04 hooks into this)
- `src/entities/creature/ui/CreatureStatBlock.tsx` — Stat block display (INT-05 adds MAP)
- `src/entities/creature/model/types.ts` — CreatureStatBlockData with strikes[] (INT-05 uses this)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HpControls` — damage/heal/tempHP with grid layout, needs IWR expansion
- `ConditionCombobox` — searchable condition dropdown, reuse pattern for damage type combobox
- `ConditionBadge` — pill badges with value, reuse for persistent damage display
- `XPBudgetBar` — encounter XP display, extend for hazard XP contributions
- `CreatureStatBlock` — full stat block with strikes section, extend for MAP display
- `TurnControls` — turn advance with auto-decrement, extend for persistent damage toast
- 60+ shadcn/ui components including Dialog, Popover, Toast, ToggleGroup, Badge

### Established Patterns
- Zustand + immer for all stores; useShallow for object selectors
- ConditionManager: module-level Map, NOT in React state
- Auto-save on every combat state change (Phase 8 D-16)
- Toasts for turn-advance summaries (Phase 8 D-13)
- Searchable combobox for conditions (Phase 8 D-09)
- shared/api/ IPC boundary for all SQLite operations

### Integration Points
- `useCombatantStore.updateHp` — damage path needs IWR-aware variant
- `useConditionStore` — dying/wounded conditions, persistent damage conditions
- `features/combat-tracker/lib/turn-manager.ts` — turn advance logic, hook for persistent damage
- `features/combat-tracker/lib/condition-bridge.ts` — engine ConditionManager integration
- `entities/encounter/model/store.ts` — encounter store for hazard XP

</code_context>

<specifics>
## Specific Ideas

- IWR damage type combobox should follow same pattern as ConditionCombobox (searchable, grouped by category: physical/energy/alignment/material)
- Dying dialog should scan `CreatureStatBlockData.abilities[].name` for keywords like "Ferocity", "Rejuvenation", "Negative Healing" and show a warning if found — prevents DM from accidentally killing creatures with death-prevention abilities
- Persistent damage formula stored as string in condition value (e.g., "2d6") — needs light dice parser for display but DM manually enters actual damage in HpControls
- Flat-check and recovery check share the same UI pattern: auto-roll button + manual d20 input toggle. Build as a reusable `DiceCheckDialog` or `DiceCheckToast` component
- Engine `applyIWR` needs DamageInstance[] input — the combobox selection maps to a single DamageInstance with the entered amount and selected type

</specifics>

<deferred>
## Deferred Ideas

- Regeneration/fast-healing tracking (auto-heal at turn start) — future enhancement
- Multiple damage types per attack (e.g., 1d8 slashing + 1d6 fire) — future enhancement, current flow handles one type at a time
- Undead healing reversal (void heals, vitality damages) — future enhancement
- Full combat log with all IWR/dying/damage history — future enhancement

</deferred>

---

*Phase: 10-encounter-builder-page*
*Context gathered: 2026-04-01*
