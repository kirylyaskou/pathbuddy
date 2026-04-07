# Phase 01: XP & Encounter Budget - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Standalone TypeScript module at `src/lib/pf2e/` delivering PF2e encounter XP calculation and threat rating. Covers creature XP, hazard XP (simple + complex), PWOL variant tables, encounter budget thresholds, and threat rating classification. No UI, no database -- pure game math engine.

</domain>

<decisions>
## Implementation Decisions

### Module location & existing code
- Create fresh `src/lib/pf2e/xp.ts` module from scratch
- Delete old `src/lib/xp-calculator.ts` and its tests entirely -- clean break
- Update any app imports to point to the new module
- Use requirement names: `calculateCreatureXP`, `getHazardXp`, `generateEncounterBudgets`, `calculateEncounterRating`, `calculateXP`
- Barrel index at `src/lib/pf2e/index.ts` re-exports all public functions

### Out-of-range handling
- Creatures below -4 delta (trivially weak): return 0 XP, no flag -- they're no real threat
- Creatures above +4 delta (over-extreme): return `{ xp: null, outOfRange: true }` flag -- no fake XP number
- The flag enables the future UI to show a popup warning the DM about over-extreme threat levels
- Hazards follow the same pattern as creatures for out-of-range behavior

### PWOL variant
- Boolean parameter: `calculateCreatureXP(level, partyLevel, { pwol: true })`
- Top-level propagation: pass `pwol` once at the `calculateXP` orchestrator and it flows to all sub-functions automatically
- PWOL is a completeness feature for community support, not the primary use case -- no special UI attention needed

### Input validation
- Lenient approach: accept edge cases gracefully
- Empty creature/hazard lists return 0 XP
- Party size 0 throws (genuinely invalid)
- Negative levels treated as level 0
- Minimal friction for callers

### Return types
- `calculateXP` returns rich breakdown: `{ totalXp, rating, creatures: [{level, xp}], hazards: [{level, xp}], warnings }`
- Warnings are structured objects (e.g., `{ type: 'outOfRange', creatureLevel: 12, partyLevel: 3 }`) -- machine-readable for the future encounter builder UI
- Per-creature and per-hazard XP in the breakdown enables detailed UI display

### Claude's Discretion
- Internal module file structure within `src/lib/pf2e/`
- TypeScript interface naming and exact type shapes
- Test structure and organization
- Whether to use const enums, union types, or plain objects for threat ratings

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PF2e Rules (reference source)
- PF2e CRB Table 10-2: Creature XP by level difference (standard + PWOL variant)
- PF2e CRB Table 10-3: Encounter budget thresholds by party size
- PF2e CRB Table 10-1: Hazard XP (simple and complex) by level difference

### Project requirements
- `.planning/REQUIREMENTS.md` -- XP-01 through XP-06 define all required functions
- `.planning/ROADMAP.md` -- Phase 01 success criteria (5 items)

### Existing code (to be replaced)
- `src/lib/xp-calculator.ts` -- Current creature XP lookup (delete and replace)
- `src/lib/xp-calculator.test.ts` -- Current tests (delete)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/weak-elite.ts`: Bracket-based lookup table pattern (HP_TABLE with maxLevel/delta) -- similar approach for XP tables
- `__testing` namespace export pattern for internal-only functions needing test access

### Established Patterns
- Pure TypeScript functions, no framework dependency
- Colocated `__tests__/` directory for test files
- Vitest + describe/it/expect test structure
- Lookup-table approach for PF2e rules (Record<number, number> keyed by delta)

### Integration Points
- `src/lib/pf2e/index.ts` barrel will be the public API surface for all v2.0 modules
- Future phases (02-06) will add more modules under `src/lib/pf2e/`
- Future encounter builder UI will call `calculateXP` from this module

</code_context>

<specifics>
## Specific Ideas

- DM should see a popup warning for over-extreme encounters (creatures more than 4 levels above party) -- engine provides the structured warning flag, UI milestone implements the popup
- Per-creature XP breakdown in the return value enables the future encounter builder to show XP contribution per creature

</specifics>

<deferred>
## Deferred Ideas

- Encounter builder UI wired to XP budget engine -- next milestone (UI-01 in REQUIREMENTS.md)
- Over-extreme threat popup in the UI -- requires UI milestone
- Persisted PWOL preference toggle -- campaign settings feature, not engine scope

</deferred>

---

*Phase: 01-xp-encounter-budget*
*Context gathered: 2026-03-24*
