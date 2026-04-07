# Phase 3: Conditions & Statuses - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement all missing PF2e condition/status mechanics identified in the Phase 2 gap analysis. This includes condition groups, override mechanics, data-driven condition effects (modifiers + grants), max value enforcement, death progression for NPCs, condition immunity checking, and IWR type expansion. The engine fully models PF2e condition behavior matching Foundry VTT PF2e source data.

</domain>

<decisions>
## Implementation Decisions

### Condition effect system
- **D-01:** Data-driven lookup — a static map of condition slug to effects (modifiers, granted conditions, immunities). Not a full Foundry Rule Element processor.
- **D-02:** Valued conditions use simple multipliers: `valuePerLevel * conditionValue`. Frightened 3 = -3 to all checks, Clumsy 2 = -2 to Dex-based.
- **D-03:** Selectors follow Foundry convention as strings or arrays: `"all"`, `"dex-based"`, `["str-based", "str-damage"]`, `["cha-based", "int-based", "wis-based"]`, `"con-based"`.
- **D-04:** Drained HP reduction as a special effect (requires creature level for formula), not a simple multiplier.
- **D-05:** GrantItem chains implemented as `grants: ConditionSlug[]` in the effect map — Grabbed grants Off-Guard + Immobilized, Dying grants Unconscious, Paralyzed grants Off-Guard.

### Condition groups and overrides
- **D-06:** Add 3 missing groups: `senses` (blinded, concealed, dazzled, deafened, invisible), `abilities` (clumsy, cursebound, drained, enfeebled, stupefied), `death` (doomed, dying, unconscious, wounded).
- **D-07:** Override mechanic from `system.overrides` in refs/ JSON: Blinded overrides Dazzled, Stunned overrides Slowed, attitude conditions override each other.
- **D-08:** `abilities` group is NOT mutually exclusive — clumsy/drained/enfeebled/stupefied coexist (they affect different ability scores). Group membership is informational metadata only.
- **D-09:** `senses` group is NOT fully mutually exclusive — override behavior is driven by the `overrides` field, not group membership.
- **D-10:** `detection` and `attitudes` groups remain mutually exclusive (existing behavior correct).

### Death & dying progression
- **D-11:** Full death progression for NPC/monsters only — PCs are not processed by the engine (players handle their own).
- **D-12:** `deathDoor: boolean` flag on creature (default `false`):
  - When `true`: engine runs automatic recovery checks, dying progression, stabilization.
  - When `false`: monster dies at HP ≤ 0 (standard behavior for rank-and-file).
- **D-13:** Death threshold: dying >= (4 - doomed) = dead.
- **D-14:** Recovery check: flat check DC = 10 + dying value. Crit success: dying -2, success: dying -1, failure: dying +1, crit failure: dying +2.
- **D-15:** Stabilized monsters remain unconscious (do not regain consciousness on stabilization).
- **D-16:** Dying/wounded/doomed values are manually editable (engine provides setters, not just auto-progression).

### Creature type interface
- **D-17:** Minimal Creature interface in `engine/types.ts` — only what Phase 3 needs: `immunities: Immunity[]`, `conditions: ConditionManager`, `hp: { current: number; max: number; temp: number }`, `level: number`, `deathDoor: boolean`.
- **D-18:** Phase 4 will extend this interface with AC, saves, abilities, speed, attacks, traits, etc.

### IWR type expansion
- **D-19:** Include IWR expansion in Phase 3 — condition immunities are tightly coupled with condition system.
- **D-20:** Add ~50 missing immunity types: condition immunities (paralyzed, stunned, blinded, etc.) + effect categories (fear-effects, disease, magic, emotion, etc.).
- **D-21:** Add ~17 missing weakness types: holy, unholy, cold-iron, area-damage, splash-damage, earth, water, air, etc.
- **D-22:** Add ~14 missing resistance types: all-damage, precision, spells, mythic, plant, wood, metal, etc.
- **D-23:** Add `holy` and `unholy` to DAMAGE_TYPES — confirmed Remaster damage types (not legacy OGL names).
- **D-24:** `all-damage` resistance special handling in `applyIWR()` — matches any damage type.
- **D-25:** Separate condition immunity check path: `ConditionManager.add()` checks creature immunities before applying. Damage immunities continue through existing `applyIWR()`.

### Condition max values
- **D-26:** Enforce max values: dying 4 = dead, doomed reduces dying threshold. No explicit cap on other valued conditions (clumsy, frightened, etc. are mechanically unbounded but practically limited by source effects).

### Claude's Discretion
- Exact TypeScript types for the condition effect map structure
- Whether to store condition effects inline or in a separate file under `engine/conditions/`
- Internal organization of IWR type arrays (alphabetical, by category, etc.)
- Recovery check implementation details (pure function vs method on ConditionManager vs separate module)
- Whether `deathDoor` flag lives on Creature interface or as a ConditionManager constructor option

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Gap analysis (primary scope source)
- `.planning/phases/02-reference-analysis/GAP-ANALYSIS.md` — All condition gaps (#1-#8), IWR gaps (#9-#15), creature type gap (#30, #58). This is the definitive list of what Phase 3 must implement.

### Current engine modules (what exists)
- `engine/conditions/conditions.ts` — ConditionManager class, 44 slugs, VALUED_CONDITIONS, CONDITION_GROUPS (2 of 5), dying/wounded cascade, endTurn() auto-decrement
- `engine/damage/iwr.ts` — IMMUNITY_TYPES, WEAKNESS_TYPES, RESISTANCE_TYPES, applyIWR(), createImmunity/Weakness/Resistance factories
- `engine/damage/damage.ts` — DAMAGE_TYPES (16), DAMAGE_CATEGORIES, MATERIAL_EFFECTS, type taxonomy
- `engine/types.ts` — Currently only WeakEliteTier; Creature interface will be added here
- `engine/index.ts` — Barrel export, public API surface

### Foundry VTT PF2e reference data
- `refs/pf2e/conditions/` — 43 condition JSON files with `system.group`, `system.overrides`, `system.value`, `system.rules[]`
- `refs/pf2e/conditions/frightened.json` — Example of valued condition: `FlatModifier` with `"-@item.badge.value"` scaling
- `refs/pf2e/conditions/clumsy.json` — `selector: "dex-based"` pattern
- `refs/pf2e/conditions/enfeebled.json` — Array selector pattern: `["str-based", "str-damage"]`
- `refs/pf2e/conditions/drained.json` — Complex formula with `@actor.level`, LoseHitPoints rule
- `refs/pf2e/conditions/dying.json` — GrantItem for Unconscious
- `refs/pf2e/conditions/grabbed.json` — GrantItem for Off-Guard + Immobilized
- `refs/pf2e/conditions/blinded.json` — Override of Dazzled, Immunity to visual, FlatModifier -4 perception

### Requirements
- `.planning/REQUIREMENTS.md` — ENG-01 (missing conditions/statuses per analysis)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ConditionManager` class — already has add/remove/has/get/endTurn/setDuration/setProtected/getAll. Will be extended, not rewritten.
- `CONDITION_SLUGS` / `VALUED_CONDITIONS` arrays — correct and complete (44 slugs, 11 valued). No changes needed to these lists.
- `applyIWR()` function — correct processing order (immunities > weaknesses > resistances). Needs type expansion and `all-damage` special case.
- `createImmunity/Weakness/Resistance` factories and `parseIwrData` parser — extend with new types.

### Established Patterns
- Engine modules are pure TypeScript, zero external dependencies
- Source attribution comments referencing Foundry VTT and AON
- `as const` arrays with derived union types (`typeof ARRAY[number]`)
- Domain subdirectories under `/engine` (conditions/, damage/, modifiers/, encounter/)
- Single barrel export at `engine/index.ts`

### Integration Points
- `ConditionManager.add()` will need creature context (immunities) — either via constructor injection or method parameter
- Condition effects (modifiers) connect to `engine/modifiers/modifiers.ts` StatisticModifier — but actual wiring to statistics is Phase 4
- IWR type expansion modifies `engine/damage/iwr.ts` and `engine/damage/damage.ts`
- New Creature interface in `engine/types.ts` exported via barrel

</code_context>

<specifics>
## Specific Ideas

- Valued condition scaling uses `@item.badge.value` token in Foundry — engine uses simple `valuePerLevel * conditionValue` multiplier instead of parsing Foundry expressions
- `deathDoor` flag is for "important monsters" (bosses, named NPCs) — rank-and-file die instantly at HP 0
- Recovery check results map to degree-of-success (crit success/success/failure/crit failure) — this is a self-contained flat check, not dependent on Phase 4's full degree-of-success system
- User noted: "don't mess up the status logic!" — correctness of condition interactions is paramount

</specifics>

<deferred>
## Deferred Ideas

- **UI "Deathdoor" toggle button** — engine provides the flag and logic, UI button for toggling it deferred to frontend milestone
- **Full degree-of-success system** — Phase 4 scope. Recovery checks in Phase 3 are a self-contained flat check implementation.
- **Condition-to-statistic wiring** — Phase 3 defines what modifiers conditions produce (data-driven map); Phase 4 wires them to actual statistics (AC, saves, skills)
- **Rule Element processor** — Not building a general-purpose RE runtime. Condition effects are data-driven lookup, not parsed from Foundry JSON at runtime.

</deferred>

---

*Phase: 03-conditions-statuses*
*Context gathered: 2026-03-31*
