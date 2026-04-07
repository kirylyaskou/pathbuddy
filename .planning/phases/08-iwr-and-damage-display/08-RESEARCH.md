# Phase 08: IWR and Damage Display - Research

**Researched:** 2026-03-25
**Domain:** Vue 3 component display — Foundry PF2e raw JSON parsing, structured IWR rendering, inline SVG damage category icons
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**IWR Section Layout & Placement**
- IWR section appears after saves row, before languages — standard PF2e stat block order per CRB
- Three labeled inline rows (Immunities, Weaknesses, Resistances) — matches PF2e printed stat block format
- IWR type labels title-cased from slug (e.g., "fire" -> "Fire", "cold-iron" -> "Cold Iron")
- Weakness values in crimson, resistance values in emerald — semantic color families from Phase 07 badge precedent

**Damage Category Icons on Strikes**
- Small inline SVG icons: sword for physical, flame for energy, sparkle for other — crisp at 16px
- Icons appear after strike name, before description — visible at a glance
- Parse `item.system.damage.damageType` from Foundry raw data, map through DamageCategorization.getCategory()
- Show damage type label next to category icon (e.g., [sword icon] "Slashing") — DMs need specific type for IWR interactions

**Data Parsing & Edge Cases**
- Hide IWR section entirely when creature has no IWR data — clean stat block
- Unknown IWR types not in engine taxonomy display as-is with title-cased slug, no icon — graceful fallback
- Exception lists shown parenthetically after value (e.g., "Resistance 5 fire (except cold iron)") — matches PF2e CRB notation
- Parse IWR from `system.attributes.immunities/weaknesses/resistances` arrays in Foundry raw_data

### Claude's Discretion
- SVG icon designs for physical/energy/other damage categories
- Exact Tailwind classes for IWR row styling within the dark fantasy design system
- Internal helper function signatures for IWR data extraction

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| IWR-01 | Structured IWR display in creature stat blocks using engine types (not raw text) | Engine interfaces (Immunity, Weakness, Resistance) in iwr.ts are ready; Foundry raw JSON shape confirmed; parse helpers needed |
| DMG-01 | Damage category icons (physical/energy/other) on Strike entries in stat blocks | DamageCategorization.getCategory() from damage-helpers.ts is ready; real damageRolls JSON path confirmed; multi-type strikes are real (fire mephit) |
</phase_requirements>

---

## Summary

Phase 08 is a pure display layer addition to `StatBlock.vue`. The PF2e game engine types (`iwr.ts`, `damage.ts`, `damage-helpers.ts`) are fully implemented from Phase 07 with no modifications required. The task is to parse Foundry raw JSON IWR and strike damage data, then render it using those engine types.

The Foundry raw JSON shape is confirmed from real bestiary data. IWR entries live at `system.attributes.immunities`, `system.attributes.weaknesses`, and `system.attributes.resistances` as sparse arrays (creature may have none, one, or any combination). Each weakness and resistance entry has a `value: number`; immunities do not. All three types have an optional `exceptions: string[]`.

The most important research finding is a **data path correction**: the CONTEXT.md and UI-SPEC both reference `item.system.damage.damageType` for strike damage type. Real Foundry bestiary JSON uses `item.system.damageRolls[key].damageType` — an object keyed by random IDs, not a flat `damage.damageType` field. Strikes can have multiple damageRolls entries (confirmed by fire mephit: `1d6 piercing` + `1d4 fire`). The category icon logic must iterate over all damageRolls values and render one icon+label per damage type.

**Primary recommendation:** Implement a `parseIWR()` helper and a `getDamageRolls()` helper in the script setup block of `StatBlock.vue`. Use the existing engine types as return types. Add the IWR template section and damage icon rendering in one focused plan.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 (script setup) | 3.5.13 | Component reactivity, computed properties | Project established; StatBlock.vue uses this pattern throughout |
| Tailwind CSS | 3.4.17 | Styling | Project standard; custom color tokens already defined in tailwind.config.js |
| TypeScript | project-configured | Type safety for parsed IWR objects | Already used in StatBlock.vue imports |

### In-Project Engine Libraries (no install needed)
| Module | Path | Purpose |
|--------|------|---------|
| `iwr.ts` | `@/lib/pf2e/iwr.ts` | `Immunity`, `Weakness`, `Resistance` interfaces; `ImmunityType`, `WeaknessType`, `ResistanceType` unions |
| `damage.ts` | `@/lib/pf2e/damage.ts` | `DamageType`, `DamageCategory`, `DAMAGE_TYPES` |
| `damage-helpers.ts` | `@/lib/pf2e/damage-helpers.ts` | `DamageCategorization.getCategory(type: DamageType): DamageCategory` |
| `pf2e/index.ts` | `@/lib/pf2e` | Barrel export for all of the above |

**No new npm packages required for this phase.**

---

## Architecture Patterns

### Foundry Raw JSON IWR Shape (CONFIRMED from real bestiary data)

Source: Adamantine Golem, Troll, Alchemical Golem, Fire Mephit from `github.com/foundryvtt/pf2e v13-dev`

```typescript
// Confirmed shape for system.attributes in creature raw_data
interface FoundryCreatureAttributes {
  immunities?: Array<{
    type: string           // e.g. "fire", "poison", "bleed", "paralyzed"
    exceptions?: string[]  // e.g. ["vorpal-adamantine"] — may be absent
  }>
  weaknesses?: Array<{
    type: string           // e.g. "fire", "cold-iron", "physical"
    value: number          // e.g. 10
    exceptions?: string[]  // may be absent
  }>
  resistances?: Array<{
    type: string           // e.g. "physical"
    value: number          // e.g. 15
    exceptions?: string[]  // e.g. ["adamantine"] — may be absent
    doubleVs?: string[]    // rarely present; not displayed in Phase 08
  }>
}
```

Real examples from bestiary:
- Adamantine Golem: `immunities: [{type:"fire"}]`, `resistances: [{type:"physical",value:15,exceptions:["vorpal-adamantine"]}]`
- Troll: `weaknesses: [{type:"fire",value:10}]`
- Alchemical Golem: `immunities: [{type:"acid"}]`, `resistances: [{type:"physical",value:12,exceptions:["adamantine","bludgeoning"]}]`
- Fire Mephit: `immunities: [{type:"bleed"},{type:"fire"},{type:"paralyzed"},{type:"poison"},{type:"sleep"}]`, `weaknesses: [{type:"cold",value:3}]`

### CRITICAL: Foundry Raw JSON Strike Damage Shape (CORRECTED)

The CONTEXT.md and UI-SPEC reference `item.system.damage.damageType`. **This path does not exist in real Foundry data.** The confirmed path from multiple bestiary creatures is:

```typescript
// Confirmed shape for melee/ranged item system object
interface FoundryMeleeItemSystem {
  damageRolls: {
    [rollId: string]: {   // rollId is a random alphanumeric string, e.g. "2aqz1foetaojgodwjsl3"
      damage: string      // dice expression, e.g. "2d10+5"
      damageType: string  // e.g. "piercing", "slashing", "fire"
    }
  }
  // NOTE: system.damage does NOT exist — only system.damageRolls
}
```

Real examples from bestiary:
- Adamantine Golem Fist: `damageRolls: { "xxx": { damage:"3d10+17", damageType:"bludgeoning" } }`
- Troll Jaws: `damageRolls: { "yyy": { damage:"2d10+5", damageType:"piercing" } }`
- **Fire Mephit Jaws (multi-type)**: `damageRolls: { "aaa": { damage:"1d6", damageType:"piercing" }, "bbb": { damage:"1d4", damageType:"fire" } }`

**Multi-damage strikes are real and must be handled.** The fire mephit is a creature in the base bestiary. The category icon logic must iterate `Object.values(item.embedded.system.damageRolls ?? {})` and render one icon+label per entry.

### Recommended StatBlock.vue Additions

#### IWR Computed Property
```typescript
// Source: confirmed Foundry JSON shape from github.com/foundryvtt/pf2e v13-dev bestiary
const iwr = computed(() => {
  const raw = currentRawData.value
  const attrs = raw?.system?.attributes
  if (!attrs) return null
  const immunities: Array<{ type: string; exceptions: string[] }> =
    (attrs.immunities ?? []).map((e: any) => ({
      type: e.type ?? '',
      exceptions: e.exceptions ?? [],
    }))
  const weaknesses: Array<{ type: string; value: number; exceptions: string[] }> =
    (attrs.weaknesses ?? []).map((e: any) => ({
      type: e.type ?? '',
      value: e.value ?? 0,
      exceptions: e.exceptions ?? [],
    }))
  const resistances: Array<{ type: string; value: number; exceptions: string[] }> =
    (attrs.resistances ?? []).map((e: any) => ({
      type: e.type ?? '',
      value: e.value ?? 0,
      exceptions: e.exceptions ?? [],
    }))
  const hasAny = immunities.length > 0 || weaknesses.length > 0 || resistances.length > 0
  return hasAny ? { immunities, weaknesses, resistances } : null
})
```

#### IWR Type Label Helper
```typescript
// Split slug on '-', title-case each word
function formatIwrType(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
```

#### Strike Damage Rolls Helper
```typescript
// Source: confirmed Foundry JSON shape — damageRolls is keyed object, not flat damage field
import { DamageCategorization } from '@/lib/pf2e/damage-helpers'
import type { DamageType } from '@/lib/pf2e/damage'
import { DAMAGE_TYPES } from '@/lib/pf2e/damage'

interface StrikeDamageEntry {
  damageType: DamageType
  category: 'physical' | 'energy' | 'other'
}

function getStrikeDamageEntries(item: ResolvedCreatureItem): StrikeDamageEntry[] {
  const rolls = item.embedded?.system?.damageRolls
  if (!rolls || typeof rolls !== 'object') return []
  return Object.values(rolls)
    .filter((r: any) => r && DAMAGE_TYPES.includes(r.damageType))
    .map((r: any) => ({
      damageType: r.damageType as DamageType,
      category: DamageCategorization.getCategory(r.damageType as DamageType),
    }))
}
```

### Recommended Project Structure
No new files. All additions within `src/components/StatBlock.vue`:

```
src/components/StatBlock.vue
  script setup:
    + import { DamageCategorization } from '@/lib/pf2e/damage-helpers'
    + import { DAMAGE_TYPES } from '@/lib/pf2e/damage'
    + import type { DamageType } from '@/lib/pf2e/damage'
    + const iwr = computed(...)       — after `skills` computed
    + function formatIwrType(...)     — in helpers section
    + function getStrikeDamageEntries(...) — in helpers section
  template:
    + IWR section after saves row    — v-if="iwr" with three sub-rows
    + damage icons in melee/ranged item rows — v-for over getStrikeDamageEntries(item)
```

### IWR Template Position in StatBlock.vue

The saves row ends at line 349. Languages row starts at line 352. The IWR section inserts between them:

```html
<!-- Row 4: Saves (Fort, Ref, Will) -->
<!-- [saves template — unchanged] -->

<!-- Row 4b: IWR (Immunities, Weaknesses, Resistances) — NEW -->
<div v-if="iwr" class="mt-1 px-[inherited]">
  <!-- three sub-rows rendered independently, each with v-if="array.length > 0" -->
</div>

<!-- Row 5: Languages (if any) — unchanged -->
```

### Damage Icon Template Position in StatBlock.vue

The item name row is at lines 386-399. Icons insert after the item name span and before the canonical link button:

```html
<div class="px-4 py-2 border-b border-charcoal-700 bg-charcoal-800 flex items-center gap-2">
  <span class="text-sm font-bold text-stone-200 flex-1">{{ item.embedded.name }}</span>

  <!-- NEW: damage category icons (melee/ranged sections only) -->
  <template v-if="section.key === 'melee' || section.key === 'ranged'">
    <span
      v-for="entry in getStrikeDamageEntries(item)"
      :key="entry.damageType"
      class="flex items-center gap-1"
    >
      <!-- SVG icon per category -->
      <span class="text-xs text-stone-400">{{ formatIwrType(entry.damageType) }}</span>
    </span>
  </template>

  <!-- existing canonical link button — unchanged -->
</div>
```

### Anti-Patterns to Avoid
- **Accessing `item.system.damage.damageType` directly**: Field does not exist in Foundry JSON. Use `item.embedded.system.damageRolls` (object iteration).
- **Assuming one damage type per strike**: Fire mephit and similar creatures have multiple damageRolls entries. Render all of them.
- **Using `reactive()` or modifying stores**: This is a pure display computed — no store interaction.
- **Skipping `exceptions` normalization**: The `exceptions` field is absent (not `[]`) on many creatures. Always default to `[]` when mapping.
- **Rendering IWR section when all arrays are empty**: `v-if="iwr"` guards the entire section; the `iwr` computed returns `null` when no IWR data exists.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type-to-category mapping | Custom lookup table | `DamageCategorization.getCategory()` from `@/lib/pf2e/damage-helpers` | Already handles all 20 damage types with correct PF2e Remaster taxonomy (vitality/void not positive/negative) |
| ImmunityType validation | Custom type guard | `IMMUNITY_TYPES` set from `@/lib/pf2e/iwr` | Engine source of truth — special cases (critical-hits, precision) already included |
| Damage type constants | Inline string array | `DAMAGE_TYPES` from `@/lib/pf2e/damage` | All 20 types, maintained with engine |

**Key insight:** All IWR and damage categorization logic is pre-built in the engine layer. This phase is purely a mapping from raw JSON strings to display using those engine utilities.

---

## Common Pitfalls

### Pitfall 1: Wrong Foundry Damage Field Path
**What goes wrong:** `item.embedded.system.damage.damageType` evaluates to `undefined` for every strike. No icons render. No error thrown (optional chaining silently returns undefined).
**Why it happens:** CONTEXT.md says `item.system.damage.damageType`; the real Foundry JSON structure uses `system.damageRolls[id].damageType`.
**How to avoid:** Use `Object.values(item.embedded.system.damageRolls ?? {})` and map each entry's `damageType`.
**Warning signs:** All strike rows show no damage icon when real creatures should show them.

### Pitfall 2: Missing Exceptions Array Normalization
**What goes wrong:** `entry.exceptions.map(...)` throws `TypeError: Cannot read properties of undefined` because `exceptions` is absent on immunity entries like `{type:"fire"}` (no `exceptions` key at all).
**Why it happens:** Foundry JSON omits the `exceptions` key when there are none — it's not `[]`, it's absent.
**How to avoid:** Always map with `exceptions: e.exceptions ?? []`.
**Warning signs:** Stat blocks for creatures like Fire Mephit (5 immunities, all without exceptions) crash.

### Pitfall 3: Rendering IWR Section for Empty Arrays
**What goes wrong:** Creature has `immunities: []` or no IWR arrays at all. An IWR section header renders with no content below it.
**Why it happens:** Guarding only on array presence without checking `hasAny = length > 0`.
**How to avoid:** `iwr` computed returns `null` when `immunities.length === 0 && weaknesses.length === 0 && resistances.length === 0`. Template uses `v-if="iwr"`.
**Warning signs:** Empty "Immunities / Weaknesses / Resistances" rows appear for mundane creatures like Goblins.

### Pitfall 4: Multi-Damage Strike Icons Overlap With Section Key Check
**What goes wrong:** Damage icons render on spellcasting or action item rows where `type` is not `'melee'` or `'ranged'`. Spells don't have `damageRolls`; `getStrikeDamageEntries` returns `[]` silently, but the v-if logic may render empty containers.
**Why it happens:** Forgetting to gate on `section.key === 'melee' || section.key === 'ranged'` in the template.
**How to avoid:** Template-level `v-if` guard on section key. `getStrikeDamageEntries` also returns `[]` for non-melee items as a second layer of safety.
**Warning signs:** Empty flex containers appear in spellcasting rows.

### Pitfall 5: emerald-400 Not in Custom Tailwind Config
**What goes wrong:** Developer adds `text-emerald-400` and wonders if it will purge correctly.
**Why it happens:** `tailwind.config.js` has custom `crimson` tokens but no custom `emerald`. Tailwind's default `emerald` palette is available without extension.
**How to avoid:** Use `text-emerald-400` directly — it uses Tailwind's built-in emerald scale. No config change needed.
**Warning signs:** None — this works correctly. Note is for awareness only.

---

## Code Examples

Verified patterns from project source:

### IWR Computed Pattern (matching existing computed style)
```typescript
// Source: StatBlock.vue lines 38-52 — follows existing computed property conventions
const iwr = computed(() => {
  const raw = currentRawData.value
  const attrs = raw?.system?.attributes
  if (!attrs) return null
  const immunities = (attrs.immunities ?? []).map((e: any) => ({
    type: e.type ?? '',
    exceptions: e.exceptions ?? [],
  }))
  const weaknesses = (attrs.weaknesses ?? []).map((e: any) => ({
    type: e.type ?? '',
    value: e.value ?? 0,
    exceptions: e.exceptions ?? [],
  }))
  const resistances = (attrs.resistances ?? []).map((e: any) => ({
    type: e.type ?? '',
    value: e.value ?? 0,
    exceptions: e.exceptions ?? [],
  }))
  if (!immunities.length && !weaknesses.length && !resistances.length) return null
  return { immunities, weaknesses, resistances }
})
```

### Title-Case Slug Helper
```typescript
// Source: pattern — matches existing rarityColorClass() helper style in StatBlock.vue line 131
function formatIwrType(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
```

### Strike Damage Rolls Access (CORRECTED field path)
```typescript
// Source: confirmed from github.com/foundryvtt/pf2e v13-dev real bestiary JSON
// Path: item.embedded.system.damageRolls[id].damageType (NOT item.system.damage.damageType)
function getStrikeDamageEntries(item: ResolvedCreatureItem): Array<{ damageType: DamageType; category: DamageCategory }> {
  const rolls = item.embedded?.system?.damageRolls
  if (!rolls || typeof rolls !== 'object') return []
  return Object.values(rolls as Record<string, any>)
    .filter((r) => r?.damageType && (DAMAGE_TYPES as readonly string[]).includes(r.damageType))
    .map((r) => ({
      damageType: r.damageType as DamageType,
      category: DamageCategorization.getCategory(r.damageType as DamageType),
    }))
}
```

### IWR Template Sub-Row Pattern
```html
<!-- Source: StatBlock.vue lines 352-355 — follows existing label + value row pattern -->
<div v-if="iwr?.immunities?.length" class="mt-1">
  <span class="text-xs text-stone-400">Immunities </span>
  <span v-for="(entry, i) in iwr.immunities" :key="entry.type" class="text-sm text-stone-300">
    <template v-if="i > 0">, </template>
    {{ formatIwrType(entry.type) }}
    <span v-if="entry.exceptions.length" class="text-xs text-stone-400">
      (except {{ entry.exceptions.map(formatIwrType).join(', ') }})
    </span>
  </span>
</div>
```

### Weakness Sub-Row Pattern (value in crimson)
```html
<!-- Source: UI-SPEC color contract — crimson-light for weakness values -->
<div v-if="iwr?.weaknesses?.length" class="mt-1">
  <span class="text-xs text-stone-400">Weaknesses </span>
  <span v-for="(entry, i) in iwr.weaknesses" :key="entry.type" class="text-sm text-stone-300">
    <template v-if="i > 0">, </template>
    {{ formatIwrType(entry.type) }}
    <span class="font-bold text-crimson-light"> {{ entry.value }}</span>
    <span v-if="entry.exceptions.length" class="text-xs text-stone-400">
      (except {{ entry.exceptions.map(formatIwrType).join(', ') }})
    </span>
  </span>
</div>
```

### SVG Icon Inline Pattern (matching existing icon in StatBlock.vue line 395-397)
```html
<!-- Source: StatBlock.vue line 395 — existing w-4 h-4 SVG icon style for reference -->
<!-- Physical (sword icon) -->
<svg v-if="entry.category === 'physical'" class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <!-- sword diagonal line with crossguard -->
  <line x1="5" y1="19" x2="19" y2="5" stroke-linecap="round" stroke-width="2"/>
  <line x1="14" y1="10" x2="10" y2="14" stroke-linecap="round" stroke-width="2"/>
  <circle cx="5.5" cy="18.5" r="1" fill="currentColor"/>
</svg>
<!-- Exact SVG paths at Claude's discretion per CONTEXT.md locked decision -->
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Display raw Foundry JSON text for IWR | Parse into typed objects, render with semantic colors | DMs see "Fire 10" not raw JSON; enables engine-level correctness |
| No damage category on strike entries | Inline SVG icon + type label per damageRolls entry | DMs immediately see weapon category for IWR interaction decisions |
| `system.damage.damageType` (assumed) | `system.damageRolls[id].damageType` (confirmed real shape) | Avoids silent undefined bug in production |

---

## Open Questions

1. **`item.system.damage.damageType` path in CONTEXT.md and UI-SPEC**
   - What we know: Real Foundry bestiary JSON uses `system.damageRolls[id].damageType`. The `system.damage` field does not exist on melee/ranged items.
   - What's unclear: Whether an older Foundry PF2e version used `system.damage` — possible for very old synced data. Some legacy creatures from older packs may have been synced with different schemas.
   - Recommendation: Use `damageRolls` as primary path. Add fallback: if `damageRolls` is absent/empty, check `system.damage?.damageType` as legacy fallback. Planner should note this discrepancy explicitly in the plan.

2. **Section key check for damage icons (`section.key` access in item rows)**
   - What we know: The item name row template is inside `v-for="item in section.items"` which is inside `v-for="section in orderedSections"`. The `section` variable is in scope.
   - What's unclear: Whether the template can access `section.key` from the outer loop inside the inner loop's template without any scoping issues.
   - Recommendation: This is standard Vue 3 template scope — outer loop variables are accessible inside inner loops. Confirmed pattern is safe.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 + @vue/test-utils 2.4.6 |
| Config file | `vitest.config.ts` (jsdom environment, globals: true) |
| Quick run command | `npm test -- --reporter=dot src/components/__tests__/StatBlock.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IWR-01 | IWR section renders after saves, shows typed entries | unit | `npm test -- src/components/__tests__/StatBlock.test.ts` | Yes (extend existing) |
| IWR-01 | Immunities show title-cased type labels, no value | unit | same | Yes |
| IWR-01 | Weaknesses show type label + crimson value | unit | same | Yes |
| IWR-01 | Resistances show type label + emerald value | unit | same | Yes |
| IWR-01 | Exception parenthetical shown when exceptions non-empty | unit | same | Yes |
| IWR-01 | IWR section hidden when creature has no IWR data | unit | same | Yes |
| DMG-01 | Damage category icon appears in melee strike rows | unit | `npm test -- src/components/__tests__/StatBlock.test.ts` | Yes (extend existing) |
| DMG-01 | Damage type label rendered next to icon | unit | same | Yes |
| DMG-01 | Multi-damage strike shows one icon per damageRoll entry | unit | same | Yes |
| DMG-01 | No icon renders when damageRolls is absent | unit | same | Yes |
| DMG-01 | Icons do NOT appear on spellcasting/action item rows | unit | same | Yes |

### Sampling Rate
- **Per task commit:** `npm test -- --reporter=dot src/components/__tests__/StatBlock.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green (551+ tests) before `/gsd:verify-work`

### Wave 0 Gaps
None — `StatBlock.test.ts` exists with established mock infrastructure. New tests are additions to the existing describe block using existing `makeRawData()` and `makeMeleeItem()` fixture helpers (those helpers need IWR fields and `damageRolls` fields added to their shape). No new test files or framework setup required.

---

## Sources

### Primary (HIGH confidence)
- `github.com/foundryvtt/pf2e v13-dev` — Adamantine Golem, Troll, Alchemical Golem, Fire Mephit, Air Mephit JSON: confirmed `system.attributes.{immunities,weaknesses,resistances}` shape and `system.damageRolls` structure
- `github.com/foundryvtt/pf2e` actor data/iwr.ts — ImmunitySource, WeaknessSource, ResistanceSource interfaces
- `D:/pathbuddy/src/lib/pf2e/iwr.ts` — Engine Immunity, Weakness, Resistance interfaces; ImmunityType, WeaknessType, ResistanceType
- `D:/pathbuddy/src/lib/pf2e/damage.ts` — DamageType, DamageCategory, DAMAGE_TYPES, DAMAGE_TYPE_CATEGORY
- `D:/pathbuddy/src/lib/pf2e/damage-helpers.ts` — DamageCategorization.getCategory()
- `D:/pathbuddy/src/components/StatBlock.vue` — Existing computed property patterns, template conventions, color classes
- `D:/pathbuddy/tailwind.config.js` — Custom color tokens (charcoal, gold, crimson); confirms emerald uses default Tailwind scale
- `D:/pathbuddy/src/components/__tests__/StatBlock.test.ts` — Existing test patterns, mock infrastructure

### Secondary (MEDIUM confidence)
- `D:/pathbuddy/.planning/phases/08-iwr-and-damage-display/08-UI-SPEC.md` — Color contract (crimson-light for weakness, emerald-400 for resistance), layout spec, icon sizing

### Tertiary (LOW confidence — for awareness)
- CONTEXT.md `item.system.damage.damageType` field path: superseded by HIGH confidence Foundry JSON evidence showing `system.damageRolls[id].damageType`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are in-project, no new dependencies
- Architecture: HIGH — Foundry JSON shape confirmed from real bestiary files; engine interfaces confirmed from source code
- Data path correction (damageRolls): HIGH — verified from 4+ real creature JSON files
- Pitfalls: HIGH — derived from confirmed JSON structure discrepancies and existing StatBlock patterns
- SVG icon paths: LOW (Claude's discretion per CONTEXT.md) — no external reference; planner chooses paths

**Research date:** 2026-03-25
**Valid until:** 2026-09-25 (stable — Foundry PF2e JSON schema changes slowly; engine types are project-controlled)
