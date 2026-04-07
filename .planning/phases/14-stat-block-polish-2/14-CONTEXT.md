# Phase 14: Stat Block Polish 2 - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Three targeted improvements to `CreatureStatBlock` — resolving remaining Foundry token patterns (`[[/act]]`, `[[/br]]`, `{Nfeet}`), exposing Fighter's Fork weapon data (group, additionalDamage, traits), and applying the color system from the approved UI-SPEC to make key stats instantly scannable. Also adds DC display inline with saves and a Spell DC row.

</domain>

<decisions>
## Implementation Decisions

### Token Rendering (resolveFoundryTokens additions)

- **D-01:** `[[/act slug]]` → capitalize slug, hyphens to spaces. `[[/act shove]]` → "Shove". `[[/act stride #stride]]` → "Stride" (drop `#id` suffix).
- **D-02:** `[[/br expr #label]]{display}` → use `{display}` text only. `[[/br 2d6+5 #hit]]{2d6+5}` → "2d6+5".
- **D-03:** `[[/br expr]]` with NO `{display}` wrapper → use expr as-is. `[[/br 1d6]]` → "1d6".
- **D-04:** `{Nfeet}` / `{Nfoot}` (N = digits) → "N feet". `{30feet}` → "30 feet", `{5foot}` → "5 feet".
- **D-05:** Unknown or empty `[[/act]]` slug → silently drop (empty string). Never show raw `[[...]]` markup to user.
- **D-06:** All new token handlers are added to `resolveFoundryTokens()` in `src/entities/creature/model/mappers.ts`, called before `stripHtml()` (same pattern as Phase 12).

### Strike Type Shape

- **D-07:** `damage` field on Strike changes from `string` to `{ formula: string; type: string }[]`. `formatDamage()` returns this structured array instead of a plain string.
- **D-08:** `additionalDamage?: { formula: string; type: string; label?: string }[]` added to Strike interface. Populated from `item.system.additionalDamage` array. All entries rendered (not just first). Each entry shows as a separate line with its label (e.g. "Brute Strength").
- **D-09:** `group?: string` added to Strike interface. Populated from `item.system.group`. Shown as a small badge below the strike name for ALL weapons with a non-null, non-empty group value — no allowlist.
- **D-10:** Plan includes a data verification task — read actual Fighter's Fork JSON from SQLite (or `refs/`) to confirm `item.system.group`, `item.system.additionalDamage`, and `item.system.traits.value` paths before coding the mapper.

### Skills Section

- **D-11:** Skills section becomes a `<Collapsible defaultOpen>` (matching Strikes and Abilities). The `<h4>Skills</h4>` is replaced with a `CollapsibleTrigger` using the gradient header className from UI-SPEC.

### DC Display

- **D-12:** Fort, Ref, Will, and Perception `StatItem` cells show the derived DC inline: `+10 (DC 20)`. DC = 10 + modifier. This is purely derived — no additional Foundry data needed.
- **D-13:** Spell DC (from `system.attributes.spellDC.value` or equivalent Foundry path — verify during implementation) and Class DC are shown in a **second row below the 6-stat row**, only when present in Foundry data. Absent for non-spellcasting creatures.
- **D-14:** Color for Spell DC / Class DC row: Claude's Discretion (suggest `text-primary` for DC value to match other derived stats, `text-muted-foreground` for label).

### Color System (from UI-SPEC — locked)

All from the approved `14-UI-SPEC.md`. Listed here for planner reference:

- **D-15:** AC value → `text-pf-gold`
- **D-16:** Fort / Ref / Will values → `text-pf-threat-low`
- **D-17:** Perception value → `text-pf-gold-dim`
- **D-18:** Stat labels ("Fort", "Ref", "Will", "AC", "Perception") → `text-muted-foreground` (neutral — let values carry color)
- **D-19:** Damage type text in strikes → `text-pf-blood`; dice formula remains `font-mono` inherited color
- **D-20:** Section header CollapsibleTrigger (Strikes, Abilities, Skills): `bg-gradient-to-r from-primary/10 to-transparent border-l-2 border-primary/40 hover:from-primary/15`
- **D-21:** Ability traits: `bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase tracking-wider` (golden tint, replaces current `bg-secondary/80`)
- **D-22:** Ability body text: `text-foreground/80` (was `text-foreground/70`)

### Claude's Discretion
- Exact column layout when Spell DC / Class DC row is present (grid or flex)
- Color treatment for Spell DC / Class DC values and labels in the second row
- How `StatItem` is extended for the inline DC display (prop vs inline render)
- Whether `StatItem` accepts a `colorClass?: string` prop or named color variants

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Code (critical paths)
- `src/entities/creature/model/mappers.ts` — `resolveFoundryTokens()` (line 169): add 3 new handlers here. `formatDamage()` (line 153): return type changes to `{ formula, type }[]`. Strike mapper (line 58-64): add `group`, `additionalDamage` fields.
- `src/entities/creature/model/types.ts` — `CreatureStatBlockData.strikes` (line 15): update Strike shape. `Creature` interface is separate (line 27) — do not conflate.
- `src/entities/creature/ui/CreatureStatBlock.tsx` — Full component: Skills section (line 201-214), StatItem (line 263-278), strike rendering (line 113-154), ability traits (line 185-191).

### Design Contract
- `.planning/phases/14-stat-block-polish-2/14-UI-SPEC.md` — Approved UI design contract. ALL color classes, spacing, typography, and copywriting rules are specified here. Planner and executor MUST read this.

### PF2e Rules
- DC formula: DC = 10 + modifier (Player Core pg. 401). Applies to all save/skill modifiers — no additional data needed.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resolveFoundryTokens()` in `mappers.ts:169`: 5 patterns already handled. Add 3 more regex handlers for `[[/act]]`, `[[/br]]`, `{Nfeet}`.
- `StatItem` in `CreatureStatBlock.tsx:263`: currently takes `highlight?: boolean`. Needs extension for per-stat color classes and inline DC display.
- `Collapsible` + `CollapsibleTrigger` already imported and used for Strikes and Abilities — reuse exactly for Skills.

### Established Patterns
- Token handlers: `text.replace(/<regex>/g, handler)` chain in `resolveFoundryTokens()` — add new handlers in the same pattern.
- `formatDamage()` currently does `Object.values(damageRolls).map(...).join(' plus ')` — refactor to return array instead of string.
- Damage type coloring requires the component to render the structured `{ formula, type }[]` array (not a string), wrapping type in `<span className="text-pf-blood">`.

### Integration Points
- `CreatureStatBlockData.strikes[].damage` type change from `string` to `{ formula, type }[]` is a breaking change — must update type definition, mapper, and component in the same plan.
- Skills `<h4>` → `<Collapsible>` requires importing Collapsible (already imported). Move the `<div>` wrapper structure to match Strikes/Abilities pattern.
- Inline DC in `StatItem` changes the rendered output format — `"+10 (DC 20)"` vs `"+10"`. Consider prop or separate render path so HP and AC don't get DC appended.

</code_context>

<specifics>
## Specific Ideas

- Fighter's Fork is the motivating example for weapon group/additionalDamage. Verify actual Foundry JSON paths for this creature before coding the mapper (D-10).
- DC = 10 + modifier is a pure derivation. No lookup needed. Fort +10 → "(DC 20)" appended inline.
- Spell DC appears in a second row (below the 6-stat grid), not squeezed into the primary row.
- `{Nfeet}` and `{Nfoot}` are distinct patterns — both need handling. `N` must be digits only to avoid false positives.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-stat-block-polish-2*
*Context gathered: 2026-04-02*
