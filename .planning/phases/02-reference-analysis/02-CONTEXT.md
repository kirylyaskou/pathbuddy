# Phase 2: Reference Analysis - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Analyze the Foundry VTT PF2e source repository (`refs/`) against the current `/engine` to produce a comprehensive gap-analysis document. Every missing mechanic, data schema, and content category is identified and cataloged. The output drives Phases 3 and 4.

</domain>

<decisions>
## Implementation Decisions

### Analysis scope
- **D-01:** Full rules engine scope — analyze all mechanical systems (conditions, actions, modifiers, skills, spells, equipment properties, hazards, and any other system with rules logic)
- **D-02:** Include data schemas AND full content inventory — document what fields entities have, and catalog what specific data exists (list of all spells, all feats, etc.)
- **D-03:** Not limited to DM-facing mechanics — cover the complete PF2e rules as represented in the Foundry VTT source

### Gap document format
- **D-04:** Organized by domain area — each section covers one engine domain (conditions, actions, damage, modifiers, spells, equipment, etc.) with: what exists in refs/, what engine currently has, what's missing
- **D-05:** Claude decides whether to produce one document or multiple domain-focused documents, and what level of detail per entry (summary vs implementation-ready)

### Priority framework
- **D-06:** Two-tier priority system:
  - **High priority:** Everything combat-related — conditions, combat actions, creatures, items, spells, hazards, and related mechanics
  - **Lower priority:** Downtime mechanics — work, rest, crafting, earning income, and similar non-combat activities
- **D-07:** Within each tier, no further ranking — all items are equally important. Implementation order decided in later phases.

### Reference depth
- **D-08:** `refs/pf2e/` is the primary source of content packs to analyze
- **D-09:** Other directories (`refs/lib/`, `refs/fonts/`, `refs/icons/`, `refs/lang/`, `refs/uuid-redirects/`) are secondary — may contain useful information but lower priority
- **D-10:** Claude decides whether to analyze TypeScript code in refs/lib/ for implementation patterns or focus on JSON data

### Claude's Discretion
- Single vs multiple analysis documents (one comprehensive doc or domain-focused splits)
- Level of detail per gap entry (summary-level vs implementation-ready)
- Whether to analyze refs/lib/ TypeScript utilities for implementation patterns
- Order of analysis across the 90+ directories in refs/pf2e/

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current engine modules
- `engine/index.ts` — Barrel export, public API surface
- `engine/types.ts` — Shared engine types (Creature, WeakEliteTier, etc.)
- `engine/conditions/conditions.ts` — ConditionManager, 44 slugs, dying/wounded cascade, group exclusivity
- `engine/damage/damage.ts` — Damage type taxonomy (16 types, 3 categories, 7 materials)
- `engine/damage/damage-helpers.ts` — DamageCategorization, die size stepping
- `engine/damage/iwr.ts` — IWR engine (immunity/weakness/resistance application)
- `engine/damage/iwr-utils.ts` — IWR parsing from Foundry VTT JSON
- `engine/modifiers/modifiers.ts` — Modifier stacking system (typed highest/lowest, untyped additive)
- `engine/encounter/xp.ts` — XP & encounter budget calculation
- `engine/encounter/weak-elite.ts` — Weak/elite HP presets (Monster Core)

### Reference source (Foundry VTT PF2e)
- `refs/pf2e/` — Primary content packs (90+ directories: conditions, actions, spells, feats, equipment, bestiaries, hazards, etc.)
- `refs/pf2e/conditions/` — Condition JSON definitions (blinded, broken, clumsy, etc.)
- `refs/pf2e/actions/` — Actions by category (basic, skill, class, archetype, exploration, downtime, mythic, etc.)
- `refs/lib/` — TypeScript utilities (extractor, helpers, types) — secondary reference

### Requirements
- `.planning/REQUIREMENTS.md` — ANAL-01 (gap analysis doc), ANAL-02 (missing mechanics list)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `engine/conditions/conditions.ts` — 44 condition slugs already implemented, dying/wounded cascade, group exclusivity patterns
- `engine/damage/damage.ts` — Complete damage type taxonomy with categories and materials
- `engine/modifiers/modifiers.ts` — Modifier stacking system (typed/untyped)

### Established Patterns
- Engine modules are pure TypeScript with zero external dependencies
- Source attribution comments referencing Foundry VTT and Archives of Nethys
- Domain subdirectories under `/engine` (conditions/, damage/, modifiers/, encounter/)
- Single barrel export at `engine/index.ts`

### Integration Points
- Gap analysis documents are consumed by Phase 3 (Conditions & Statuses) and Phase 4 (Actions & Modifier Math) planners
- Analysis output determines the exact scope of Phases 3 and 4 — those phases are intentionally TBD until this analysis completes

</code_context>

<specifics>
## Specific Ideas

- User noted `refs/pf2e/` is the main content packs; other directories haven't been deeply explored
- The goal is system completeness — building a full PF2e rules engine, not just a DM combat tool
- Downtime mechanics are explicitly lower priority than combat-related mechanics
- User communicates in both English and Russian

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-reference-analysis*
*Context gathered: 2026-03-31*
