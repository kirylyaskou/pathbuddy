# Phase 14: Stat Block Polish 2 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 14-stat-block-polish-2
**Areas discussed:** Skills collapsibility, Strike type shape changes, Edge cases for new tokens, Fighter's Fork data path, DC display (user-added)

---

## Skills Section Collapsibility

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, make it Collapsible | Consistent with Strikes/Abilities. defaultOpen. Gets full gradient header. | ✓ |
| No, just style the header | Keep always-expanded. Gradient on `<h4>` directly. Simpler but inconsistent. | |

**User's choice:** Make Skills a Collapsible (defaultOpen)
**Notes:** Must match the gradient trigger className from UI-SPEC, same as Strikes/Abilities.

---

## Strike Type Shape Changes

| Option | Description | Selected |
|--------|-------------|----------|
| additionalDamage as structured array | `{ formula, type, label? }[]` — matches damage type, enables coloring | ✓ |
| additionalDamage as flat string | Simpler, loses coloring for extra damage types | |

| Option | Description | Selected |
|--------|-------------|----------|
| Show group badge for all non-null weapons | Any weapon with `item.system.group` populated shows badge | ✓ |
| Allowlist notable groups | More work, risks missing cases | |

**User's choice:** Structured array for additionalDamage; group badge for all non-null/non-empty groups.
**Notes:** All additionalDamage entries render (not just first). Each shows label + colored type.

---

## Edge Cases for New Tokens

| Option | Description | Selected |
|--------|-------------|----------|
| Silently drop unknown [[/act]] | Empty string. Consistent with @Localize behavior. | ✓ |
| Show slug as-is | Might expose internal IDs to DM | |

| Option | Description | Selected |
|--------|-------------|----------|
| Use expr as-is for [[/br]] without display | `[[/br 1d6]]` → "1d6" | ✓ |
| Drop it | More conservative, risks losing damage numbers | |

**User's choice:** Drop unknown [[/act]]; use expr for [[/br]] without display.
**Notes:** Confirmed existing UI-SPEC rules.

---

## Fighter's Fork Data Path

| Option | Description | Selected |
|--------|-------------|----------|
| Verify from actual data first | Plan includes verification task against Foundry JSON | ✓ |
| Trust UI-SPEC paths, code directly | Null-safe guards, test at runtime | |

| Option | Description | Selected |
|--------|-------------|----------|
| Render all additionalDamage entries | Full array, each as separate line | ✓ |
| Render only first entry | Simpler, may miss multiple bonus sources | |

**User's choice:** Verify paths first; render all entries.

---

## DC Display (user-added scope)

| Option | Description | Selected |
|--------|-------------|----------|
| Inline with each stat | "Fort +10 (DC 20)" — DC = 10 + modifier | ✓ |
| Separate DC row below stats | Second row with all DCs listed | |
| Spell DC / Class DC only | Only from Foundry data, no derived save DCs | |

| Option | Description | Selected |
|--------|-------------|----------|
| Second row under 6-stat row | Spell DC / Class DC in a row below, only when present | ✓ |
| Extra cell in stats grid | Extends grid to 7-8 cols when DC exists | |

**User's choice:** Inline DC for saves/perception; Spell DC + Class DC in a second row below main stats.
**Notes:** User referenced Player Core pg. 401: DC = 10 + modifier. Fort, Ref, Will, Perception all get inline DC. Spell/Class DC from Foundry JSON shown in second row only when present.

---

## Claude's Discretion

- Exact column layout for Spell DC / Class DC second row
- Color for Spell DC values and labels
- `StatItem` extension approach (prop vs inline render)
- Foundry path for spell DC (verify during implementation)

## Deferred Ideas

None — all discussed items folded into Phase 14 scope.
