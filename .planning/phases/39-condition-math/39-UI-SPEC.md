---
phase: 39
slug: condition-math
status: approved
shadcn_initialized: true
preset: none
created: 2026-04-04
---

# Phase 39 — UI Design Contract

> Visual and interaction contract for condition math display.
> Modifier values wired from engine conditions → stat block and initiative list.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui |
| Preset | none |
| Component library | Radix UI (via shadcn) |
| Icon library | lucide-react |
| Font | font-mono (values), system (labels) |

---

## Spacing Scale

Standard Tailwind 4px grid. No exceptions.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tooltip row gaps, badge padding |
| sm | 8px | Modifier breakdown row spacing |
| md | 16px | StatItem column padding |
| lg | 24px | Section padding |
| xl | 32px | Layout gaps |

Exceptions: none

---

## Typography

| Role | Size | Weight | Notes |
|------|------|--------|-------|
| Stat value | `clamp(0.7rem, 2.8cqw, 1.125rem)` | bold | font-mono, matches existing StatItem |
| Stat label | `clamp(0.55rem, 1.8cqw, 0.75rem)` | normal | muted-foreground, matches existing StatItem |
| Tooltip row | 12px (text-xs) | normal | font-mono for values, default for labels |
| Tooltip separator | 12px | normal | text-muted-foreground |
| Stunned badge | 10px (text-[10px]) | semibold | font-mono |
| Skill modifier | 13px (existing) | bold | font-mono, matches existing clickable skill |

---

## Color

| Role | Token | Usage |
|------|-------|-------|
| Dominant (60%) | `--background` | Card/page backgrounds |
| Secondary (30%) | `--card`, `--muted` | Stat block card surface, tooltip bg |
| Accent — gold | `--pf-gold` (oklch 0.75 0.18 75) | Unmodified AC value (unchanged) |
| Accent — saves | `--pf-threat-low` | Unmodified Fort/Ref/Will (unchanged) |
| Penalty modifier | `--pf-blood` (oklch 0.55 0.22 25) | RED — any stat with net negative modifier |
| Bonus modifier | `--pf-threat-low` | GREEN — any stat with net positive modifier |
| Tooltip divider | `--border` | Horizontal rule in breakdown |
| Stunned badge bg | `bg-amber-900/60` | Warm amber — visually urgent |
| Stunned badge text | `text-amber-200` | High contrast on badge bg |

**Penalty color rationale:** `--pf-blood` is already the established "danger/bad" semantic token in this codebase (used for nat-1, Fumble text, damage formulas). Using it for penalized stats is consistent.

**Bonus color rationale:** `--pf-threat-low` is the existing green semantic token. Bonuses are less common than penalties in this phase but the path is identical.

**Rule:** A stat's value color changes ONLY when `net modifier !== 0`. Zero net modifier → display as-is with original colorClass.

---

## Component Contracts

### StatItem (modified)

Add two optional props:
- `modifiers?: Modifier[]` — enabled modifiers after stacking (for tooltip)
- `netModifier?: number` — sum of enabled modifiers (drives color)

**Behavior:**
- `netModifier < 0` → value text color becomes `text-pf-blood` (overrides colorClass)
- `netModifier > 0` → value text color becomes `text-pf-threat-low` (overrides colorClass)
- `netModifier === 0` or `modifiers` not provided → unchanged (colorClass applies as before)
- `modifiers` provided → wrap value in `<Tooltip>` (shadcn Tooltip from @/shared/ui/tooltip)

**Value displayed:** `base + netModifier` (the modified value, not the base)

**StatItem tooltip — vertical breakdown:**
```
[modifier label]    [+N / −N]
[modifier label]    [+N / −N]
────────────────────────────
Total               [final value]
```
Font-mono for all numbers. Labels left-aligned, values right-aligned (flex justify-between).
Min-width: 180px. Max width: 240px. No max-height (modifier lists are short).

### Inline skill modifier (clickable button)

Currently: `font-mono text-primary font-bold cursor-pointer underline decoration-dotted`

Modified behavior (same structure, color change only):
- `netModifier < 0` → replace `text-primary` with `text-pf-blood`; keep underline decoration as `decoration-pf-blood/50`
- `netModifier > 0` → replace with `text-pf-threat-low`; decoration `decoration-pf-threat-low/50`
- Wrap in Tooltip with same breakdown format as StatItem

**Displayed value:** `base + netModifier` (with leading + sign if positive)

### Strike attack bonus

Currently: `+{strike.modifier}` in bold mono, `text-primary`

Modified behavior:
- Apply `all`-selector delta (frightened, sickened) to each strike's bonus
- Color rules same as skill modifier above
- Tooltip: same vertical breakdown format
- MAP line below strike also updates: `MAP: +{modified} / +{modified-5} / +{modified-10}`

### Spell attack (SpellcastingBlock)

Currently: clickable `{fmt(section.spellAttack)}` in `text-primary`

Modified behavior:
- Delta computed from `all`-selector + tradition-based ability selector
- Color rules same as above
- Tooltip: same breakdown format
- Roll formula also updates: `1d20+${modifiedSpellAttack}`

### Spell DC / Class DC

Currently: `font-mono font-bold text-lg text-primary` centered display

Modified behavior:
- `all`-selector delta applied (frightened, sickened reduce DCs)
- Display shows modified value
- Wrap in Tooltip (same format)
- Color: `text-pf-blood` if penalized, `text-pf-threat-low` if buffed, `text-primary` if unmodified

### Stunned badge in InitiativeRow

Currently: Stunned appears as tiny text tag `stunned 2` in the conditions row below the HP bar.

**New:** Render a distinct badge adjacent to the Skull/User icon when `stunned` condition is active.

```
[⚡2]  Goblin Warrior   ← badge before (or overlaid near) the icon
```

Badge specs:
- Position: inline, immediately before the combatant name (same flex row as icon + name)
- Size: `px-1 py-0.5 text-[10px] rounded font-mono font-semibold`
- Colors: `bg-amber-900/60 text-amber-200 border border-amber-600/50`
- Content: value only — `{value}` (e.g., `2`, not `stunned 2`)
- Icon: `⚡` prefix (Unicode lightning) to signal "action loss"
- Only shown when `stunned` condition is present with `value > 0`
- Does NOT remove stunned from the small tag list below — both show

---

## Tooltip Implementation

Use shadcn `<Tooltip>`, `<TooltipTrigger>`, `<TooltipContent>` from `@/shared/ui/tooltip`.

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <p className={cn("font-mono font-bold ...", modifiedColorClass)}>
      {displayValue}
    </p>
  </TooltipTrigger>
  <TooltipContent side="top" className="min-w-[180px] p-2 font-mono text-xs">
    {modifiers.map(m => (
      <div key={m.slug} className="flex justify-between gap-4">
        <span className="text-muted-foreground">{m.label}</span>
        <span className={m.modifier < 0 ? 'text-pf-blood' : 'text-pf-threat-low'}>
          {m.modifier > 0 ? '+' : ''}{m.modifier}
        </span>
      </div>
    ))}
    <div className="border-t border-border mt-1 pt-1 flex justify-between">
      <span className="text-muted-foreground">Total</span>
      <span className={totalColorClass}>{finalValue}</span>
    </div>
  </TooltipContent>
</Tooltip>
```

`TooltipProvider` is already mounted in the app shell — no new provider needed.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Tooltip modifier label (condition) | Condition name + value — e.g., `Frightened 2` |
| Tooltip modifier label (fixed) | Condition name — e.g., `Off-Guard` |
| Tooltip total label | `Total` |
| Stunned badge | `⚡{N}` (e.g., `⚡2`) |
| No modifiers active | No tooltip shown — clean display |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | Tooltip (already installed) | not required |

No new shadcn blocks. No third-party registries.

---

## Anti-Patterns

- Do NOT show strikethrough base value + new value inline (too noisy when many conditions active)
- Do NOT show a warning icon (⚠) instead of the number — the colored number IS the signal
- Do NOT change the font size or weight of modified values — only the color changes
- Do NOT add a separate "modified stats" panel — modifications are inline where the stat already lives
- Do NOT show tooltip when no modifiers are active — tooltip only appears when `modifiers.length > 0`

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-04
