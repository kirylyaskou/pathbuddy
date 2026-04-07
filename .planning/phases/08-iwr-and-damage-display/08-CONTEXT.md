# Phase 08: IWR and Damage Display - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Add structured immunities, weaknesses, and resistances display to creature stat blocks using engine types from `src/lib/pf2e/iwr.ts` and `src/lib/pf2e/damage.ts`. Add damage category icons (physical/energy/other) to Strike entries in stat blocks. Pure display changes to StatBlock.vue — no engine modifications.

</domain>

<decisions>
## Implementation Decisions

### IWR Section Layout & Placement
- IWR section appears after saves row, before languages — standard PF2e stat block order per CRB
- Three labeled inline rows (Immunities, Weaknesses, Resistances) — matches PF2e printed stat block format
- IWR type labels title-cased from slug (e.g., "fire" -> "Fire", "cold-iron" -> "Cold Iron")
- Weakness values in crimson, resistance values in emerald — semantic color families from Phase 07 badge precedent

### Damage Category Icons on Strikes
- Small inline SVG icons: sword for physical, flame for energy, sparkle for other — crisp at 16px
- Icons appear after strike name, before description — visible at a glance
- Parse `item.system.damage.damageType` from Foundry raw data, map through DamageCategorization.getCategory()
- Show damage type label next to category icon (e.g., [sword icon] "Slashing") — DMs need specific type for IWR interactions

### Data Parsing & Edge Cases
- Hide IWR section entirely when creature has no IWR data — clean stat block
- Unknown IWR types not in engine taxonomy display as-is with title-cased slug, no icon — graceful fallback
- Exception lists shown parenthetically after value (e.g., "Resistance 5 fire (except cold iron)") — matches PF2e CRB notation
- Parse IWR from `system.attributes.immunities/weaknesses/resistances` arrays in Foundry raw_data

### Claude's Discretion
- SVG icon designs for physical/energy/other damage categories
- Exact Tailwind classes for IWR row styling within the dark fantasy design system
- Internal helper function signatures for IWR data extraction

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/pf2e/iwr.ts` — Immunity, Weakness, Resistance interfaces; ImmunityType, WeaknessType, ResistanceType unions; factory functions
- `src/lib/pf2e/damage.ts` — DamageType, DamageCategory types; DAMAGE_TYPE_CATEGORY mapping; DAMAGE_CATEGORIES
- `src/lib/pf2e/damage-helpers.ts` — DamageCategorization.getCategory() for type-to-category mapping
- `src/components/StatBlock.vue` — 420-line pure display component with header block, trait pills, stats rows, section-based item rendering

### Established Patterns
- StatBlock uses computed properties for data extraction from raw Foundry JSON
- formatMod() helper for +/- display; rarityColorClass() for conditional Tailwind classes
- SECTION_CONFIG array drives ordered item sections with type-based grouping
- Dark fantasy palette: charcoal-900 backgrounds, stone-400 labels, stone-100 values, gold accents

### Integration Points
- `StatBlock.vue` — Add IWR computed properties after `stats` computed; add IWR template section after saves row
- `StatBlock.vue` — Add damage category icon rendering in melee/ranged strike item rows
- No store changes — pure display from existing raw_data prop

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard PF2e stat block conventions from CRB/Remaster apply.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
