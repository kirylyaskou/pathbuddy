# Phase 39: Condition Math — CONTEXT

## Phase Summary
Wire condition penalties to displayed stat values in CreatureStatBlock and InitiativeRow.
All engine building blocks already exist — this phase is purely wiring + display.

---

## Decision 1: Architecture — Two-Layer, No New Instances

**Layer 1 — Resolve which modifiers apply to which stat:**
New function in engine (or shared lib): reads `CONDITION_EFFECTS` + `resolveSelector` to
build `Modifier[]` per stat slug for a given set of active conditions.

```ts
// engine/statistics/compute-stat-modifiers.ts  (new, ~50 lines)
function resolveModifiersForStat(
  conditions: { slug: ConditionSlug; value: number }[],
  statSlug: string,
  allStatSlugs: string[],
): Modifier[]
```

**Layer 2 — Compute final value (already written, reuse as-is):**
```ts
const sm = new StatisticModifier(statSlug, modifiers)
const finalValue = base + sm.totalModifier
// sm.modifiers.filter(m => m.enabled) → breakdown for tooltip
```

**React hook:**
```ts
// src/shared/model/use-modified-stats.ts
useModifiedStats(combatantId: string | undefined, statSlugs: string[])
  → Map<statSlug, { value: number; modifiers: Modifier[] }>
```
Reads `useConditionStore`, computes via Layer 1 + Layer 2, memoized on conditions change.

**What is NOT done:** No `CreatureStatistics` instances in React layer. No persistent
modifier state. No engine `Creature` construction. Pure computation on each render
when conditions change.

**Future extensibility:** Same hook can accept additional modifier sources (elite/weak,
buffs) when those features exist — just push to the `Modifier[]` list before passing
to `StatisticModifier`.

---

## Decision 2: Scope — What Gets Modified

All stats shown in `CreatureStatBlock` get condition-modified values:

| Stat | Where displayed | Notes |
|------|----------------|-------|
| AC | Core stats bar | `clumsy` (dex-based), `off-guard` (circ -2), `frightened`/`sickened` (all) |
| Fort | Core stats bar | `frightened`, `sickened`, `drained` (con-based) |
| Ref | Core stats bar | `frightened`, `sickened`, `clumsy` (dex-based) |
| Will | Core stats bar | `frightened`, `sickened`, `stupefied` (wis-based) |
| Perception | Core stats bar | `frightened`, `sickened`, `blinded` (-4 fixed), `stupefied` (wis-based) |
| Skills | Skills section | Each skill modified by its ability-based conditions |
| Strike bonus | Attacks section | `frightened`, `sickened` (all selector covers attack rolls) |
| Spell attack | SpellcastingBlock | `frightened`, `sickened` (all) + `stupefied` (wis/int-based by tradition) |
| Spell DC | Core stats bar | Same as spell attack |
| Class DC | Core stats bar | Same as spell attack |

**Tradition → ability mapping (for stupefied on spell attack/DC):**
- `arcane` → int-based
- `occult` → int-based
- `divine` → wis-based
- `primal` → wis-based
- Since `stupefied` covers `['cha-based', 'int-based', 'wis-based']` — applies to ALL traditions.

**All other conditions in `CONDITION_EFFECTS` are automatically covered** (blinded, unconscious,
grabbed/off-guard, restrained, paralyzed, dying cascade) — no special cases needed.

---

## Decision 3: Display Style

**When a stat has net negative modifier applied:**
- Number shows in **red** (not the default gold/muted color)
- Tooltip on hover: vertical breakdown

**Tooltip format:**
```
Base: 23
Frightened 2: −2
Off-Guard: −2
──────────
Total: 19
```

**When no active modifier:** display unchanged (no visual noise).

**When net positive modifier** (e.g., future elite bonus): show in **green**.
Implement if the modifier math produces a positive net — same code path, different color.

**Where the colored display lives:** Wrap `StatItem` (and equivalent inline numbers for
strikes/spell attack) to accept `modifiers: Modifier[]` prop. Component handles
color + tooltip logic internally.

---

## Decision 4: Stupefied

**Included in Phase 39.** Automatically covered by existing `CONDITION_EFFECTS` entry:
```ts
stupefied: [{ selector: ['cha-based', 'int-based', 'wis-based'], modifierType: 'status', valuePerLevel: -1 }]
```
Skills (arcana, society, intimidation, perception, etc.) resolved automatically via
`resolveSelector`. Spell attack/DC needs explicit tradition → ability handling in
`SpellcastingBlock` (see Decision 2).

---

## Decision 5: Stunned

**NOT a stat modifier.** Stunned = action economy (lose N actions at turn start).
No entry in `CONDITION_EFFECTS` — correct by PF2e rules.

**Phase 39 scope:** Show Stunned value as a prominent numbered badge on the combatant
icon in `InitiativeRow`. Currently conditions show as tiny text tags below the HP bar.
Stunned should be visually distinct — a badge overlaid on or adjacent to the Skull/User
icon, with the condition value number clearly visible.

**Implementation:** `InitiativeRow` already receives `conditions: ActiveCondition[]`.
Check for `stunned` condition, render a badge with its value near the combatant icon.

---

## What Is Already Built (Do Not Rebuild)

- `CONDITION_EFFECTS` — complete map of condition → modifier effects (`engine/conditions/condition-effects.ts`)
- `resolveSelector()` — expands selector strings to stat slugs (`engine/statistics/selector-resolver.ts`)
- `applyStackingRules()` — status penalties don't stack, only worst applies (`engine/modifiers/modifiers.ts`)
- `StatisticModifier` — Layer 2 math, already written (`engine/modifiers/modifiers.ts`)
- `Modifier` class — typed modifier with slug/label/value/type (`engine/modifiers/modifiers.ts`)
- `useConditionStore` — reactive source of active conditions per combatant (`entities/condition`)
- `EncounterContext.combatantId` — already passed into `CreatureStatBlock`

## What Needs to Be Built

1. `engine/statistics/compute-stat-modifiers.ts` — Layer 1 resolver function (~50 lines)
2. `src/shared/model/use-modified-stats.ts` — React hook wrapping Layer 1 + Layer 2
3. `StatItem` (and inline stat displays) updated to accept + render modified values with color + tooltip
4. `CreatureStatBlock` — pass `combatantId` into stat display, wire `useModifiedStats`
5. `SpellcastingBlock` — apply spell attack/DC modifiers with tradition-based lookup
6. `InitiativeRow` — Stunned badge on combatant icon
