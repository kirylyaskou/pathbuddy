# Phase 01: XP & Encounter Budget - Research

**Researched:** 2026-03-24
**Domain:** PF2e encounter math — XP tables, encounter budgets, threat ratings (pure TypeScript)
**Confidence:** HIGH

## Summary

Phase 01 is a pure TypeScript module with zero framework or database dependency. All logic is table-driven: the XP values are hard-coded constants from the PF2e GM Core that never change at runtime. The implementation pattern is already proven in this codebase (`weak-elite.ts`, `xp-calculator.ts`) — a `Record<number, number>` keyed on level delta is the idiomatic approach.

The canonical XP values are fully verified against Archives of Nethys (official Paizo reference). Creature XP covers deltas -4 to +4. Complex hazard XP is identical to creature XP at each delta; simple hazard XP is exactly 1/5 of complex hazard XP (integer values from the official table). The PWOL variant extends the range to -7 to +7 with a distinct XP table from the Gamemastery Guide (Table 4-18), but uses the same encounter budget thresholds.

The `generateEncounterBudgets` function has a subtle but important scaling rule: the base XP budgets assume a party of 4, and each additional (or fewer) character adjusts the budget by the threat-level-specific "Character Adjustment" amount, not a flat rate. For example, Extreme adds 40 XP per PC above 4, while Trivial adds only 10. The orchestrator `calculateXP` is the only user-facing entry point for the full pipeline; sub-functions remain internal implementation details exposed only via `__testing` for unit tests.

**Primary recommendation:** Implement `src/lib/pf2e/xp.ts` using `Record<number, number>` lookup tables for all four XP tables (standard creature, PWOL creature, simple hazard, complex hazard), with a single `calculateXP` orchestrator that accepts `pwol` at the top level and propagates it down.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Create fresh `src/lib/pf2e/xp.ts` module from scratch
- Delete old `src/lib/xp-calculator.ts` and its tests entirely — clean break
- Update any app imports to point to the new module (one known caller: `src/components/CreatureBrowser.vue`)
- Use requirement names: `calculateCreatureXP`, `getHazardXp`, `generateEncounterBudgets`, `calculateEncounterRating`, `calculateXP`
- Barrel index at `src/lib/pf2e/index.ts` re-exports all public functions
- Creatures below -4 delta: return 0 XP, no flag
- Creatures above +4 delta: return `{ xp: null, outOfRange: true }` — not a number
- Hazards follow same out-of-range pattern as creatures
- PWOL as boolean parameter: `calculateCreatureXP(level, partyLevel, { pwol: true })`
- Top-level propagation: pass `pwol` once at `calculateXP`, flows to sub-functions automatically
- Party size 0 throws; empty creature/hazard lists return 0 XP; negative levels treated as level 0
- `calculateXP` returns: `{ totalXp, rating, creatures: [{level, xp}], hazards: [{level, xp}], warnings }`
- Warnings are structured objects: `{ type: 'outOfRange', creatureLevel: 12, partyLevel: 3 }`

### Claude's Discretion
- Internal module file structure within `src/lib/pf2e/`
- TypeScript interface naming and exact type shapes
- Test structure and organization
- Whether to use const enums, union types, or plain objects for threat ratings

### Deferred Ideas (OUT OF SCOPE)
- Encounter builder UI wired to XP budget engine
- Over-extreme threat popup in the UI
- Persisted PWOL preference toggle
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| XP-01 | XP lookup tables for creature, PWOL variant, simple hazard, complex hazard level differences | Four `Record<number, number>` tables verified from AoN and Gamemastery Guide |
| XP-02 | calculateCreatureXP maps party-vs-creature level difference to XP value | Standard table covers -4 to +4; PWOL table covers -7 to +7; out-of-range flag pattern documented |
| XP-03 | getHazardXp handles simple and complex hazard XP with level difference | Simple = 1/5 of complex; complex = creature XP at same delta; verified from AoN table |
| XP-04 | generateEncounterBudgets produces trivial/low/moderate/severe/extreme thresholds by party size | Base budgets (4-party) and per-PC character adjustments documented; 5 threat levels confirmed |
| XP-05 | calculateEncounterRating maps total XP to threat rating string | Threshold comparison against `generateEncounterBudgets` output; ordering matters |
| XP-06 | calculateXP orchestrates creatures + hazards + party into final XP total and threat rating | Propagation of `pwol`, structured return type, warnings collection pattern documented |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x (project) | Type-safe implementation | Existing project standard |
| Vitest | 2.x (project) | Unit testing | Existing test infrastructure |

No npm dependencies are needed. This is pure TypeScript with no external packages.

### Supporting
No external libraries required. PF2e XP tables are static constants.

**Installation:** None required — no new packages.

---

## Architecture Patterns

### Recommended Project Structure
```
src/lib/pf2e/
├── xp.ts           # All XP functions (single file per CONTEXT.md decision)
├── index.ts        # Barrel re-export of public API
└── __tests__/
    └── xp.test.ts  # Colocated tests (Vitest)
```

The `src/lib/pf2e/` directory does not yet exist — both files are new.

### Pattern 1: Record<number, number> Lookup Table
**What:** Keyed by level delta (creature level minus party level), maps to XP value.
**When to use:** All four XP tables (standard creature, PWOL creature, simple hazard, complex hazard).
**Example:**
```typescript
// Source: PF2e GM Core Table 10-2, verified via https://2e.aonprd.com/Rules.aspx?ID=499
const CREATURE_XP: Record<number, number> = {
  [-4]: 10, [-3]: 15, [-2]: 20, [-1]: 30,
  [0]: 40, [1]: 60, [2]: 80, [3]: 120, [4]: 160,
}
```
This pattern is already in use in `src/lib/xp-calculator.ts` (the file being replaced) and in the bracket-lookup approach of `src/lib/weak-elite.ts`.

### Pattern 2: Options Object for Optional Parameters
**What:** Pass `{ pwol?: boolean }` as a trailing options object rather than a positional boolean.
**When to use:** `calculateCreatureXP`, `getHazardXp`, `calculateXP`.
**Example:**
```typescript
// Locked by CONTEXT.md
export function calculateCreatureXP(
  creatureLevel: number,
  partyLevel: number,
  options?: { pwol?: boolean }
): { xp: number; outOfRange?: false } | { xp: null; outOfRange: true } {
  const pwol = options?.pwol ?? false
  // ...
}
```

### Pattern 3: __testing Export for Internal Functions
**What:** Export internal helpers under a `__testing` namespace for unit test access without polluting the public API.
**When to use:** Any internal helper (e.g., the raw table lookup that `calculateCreatureXP` delegates to).
**Example:**
```typescript
// Source: established pattern in src/lib/weak-elite.ts
export const __testing = { lookupCreatureXp }
```
Test files then import via `import { __testing } from '@/lib/pf2e/xp'`.

### Pattern 4: Threat Rating as Union Type
**What:** `'trivial' | 'low' | 'moderate' | 'severe' | 'extreme'` string union — no enum.
**When to use:** Return type of `calculateEncounterRating`, field in `calculateXP` return.
**Why union over enum:** Per Claude's Discretion, but union types are idiomatic in this codebase (no existing enums found); they serialize naturally to JSON and require no import for callers.

### Anti-Patterns to Avoid
- **Returning calculated XP as always-numeric for out-of-range creatures:** The locked decision is `{ xp: null, outOfRange: true }` for >+4 delta. Do not return 0 or throw — the UI needs the flag.
- **Flat per-PC budget scaling:** Each threat level has its own character adjustment value (10/20/20/30/40 for trivial/low/moderate/severe/extreme). Do NOT multiply a single constant by party difference.
- **Mixing PWOL range into standard range:** PWOL covers deltas -7 to +7; standard covers -4 to +4. These are separate lookup tables, not an extended single table.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XP table values | Custom formulas or interpolation | Hard-coded `Record<number, number>` tables | PF2e rules are discrete lookup tables, not continuous formulas |
| Party size scaling | Complex multiplier math | Per-threat-level character adjustment from Table 10-1 | Each threat level has a different per-PC XP adjustment |
| Threat rating thresholds | Arbitrary cutoffs | `generateEncounterBudgets` output scaled by party size | Budget thresholds scale with party size; hardcoding for 4 players breaks other sizes |

**Key insight:** Every numeric value in this module comes from official PF2e lookup tables. The "math" is comparison and lookup, not arithmetic. Do not derive values from formulas.

---

## Canonical XP Tables (Verified)

### Table 1: Standard Creature XP (GM Core Table 10-2)
Source: https://2e.aonprd.com/Rules.aspx?ID=499

| Delta (creature - party) | XP |
|--------------------------|-----|
| -4 | 10 |
| -3 | 15 |
| -2 | 20 |
| -1 | 30 |
| 0 | 40 |
| +1 | 60 |
| +2 | 80 |
| +3 | 120 |
| +4 | 160 |

Out of range (< -4): 0 XP, no flag. Out of range (> +4): `{ xp: null, outOfRange: true }`.

### Table 2: PWOL Creature XP (Gamemastery Guide Table 4-18)
Source: https://2e.aonprd.com/Rules.aspx?ID=1370

| Delta (creature - party) | XP |
|--------------------------|-----|
| -7 | 9 |
| -6 | 12 |
| -5 | 14 |
| -4 | 18 |
| -3 | 21 |
| -2 | 26 |
| -1 | 32 |
| 0 | 40 |
| +1 | 48 |
| +2 | 60 |
| +3 | 72 |
| +4 | 90 |
| +5 | 108 |
| +6 | 135 |
| +7 | 160 |

PWOL uses the same encounter budget thresholds (Table 10-1) — only the per-creature XP cost changes.

### Table 3: Hazard XP (GM Core, verified via AoN Rules ID 2649)
Source: https://2e.aonprd.com/Rules.aspx?ID=2649

Complex hazard XP = creature XP at same delta. Simple hazard XP = 1/5 of complex hazard XP.

| Delta | Simple Hazard XP | Complex Hazard XP |
|-------|-----------------|-------------------|
| -4 | 2 | 10 |
| -3 | 3 | 15 |
| -2 | 4 | 20 |
| -1 | 6 | 30 |
| 0 | 8 | 40 |
| +1 | 12 | 60 |
| +2 | 16 | 80 |
| +3 | 24 | 120 |
| +4 | 32 | 160 |

**Note:** Simple hazard at +4 = 32 XP (160 / 5 = 32). An earlier WebFetch returned 30 — this was an AI summarization error. The authoritative value from the rule "simple = one-fifth of complex" and "complex = creature XP" yields 32. This is confirmed by the AoN Rules ID 2649 fetch.

### Table 4: Encounter Budget Thresholds (GM Core Table 10-1)
Source: https://2e.aonprd.com/Rules.aspx?ID=497 and https://2e.aonprd.com/Rules.aspx?ID=498

| Threat | XP Budget (4 PCs) | Character Adjustment (per PC above/below 4) |
|--------|-------------------|---------------------------------------------|
| Trivial | 40 or less | 10 |
| Low | 60 | 20 |
| Moderate | 80 | 20 |
| Severe | 120 | 30 |
| Extreme | 160 | 40 |

`generateEncounterBudgets(partySize)` must scale each threshold: `budget + (partySize - 4) * characterAdjustment`. For Trivial, any result ≤ that threshold counts as Trivial.

---

## Common Pitfalls

### Pitfall 1: Flat Per-PC Budget Scaling
**What goes wrong:** Using a single multiplier (e.g., 20 XP per extra PC) for all threat levels.
**Why it happens:** Only moderate/low use 20; trivial uses 10, severe uses 30, extreme uses 40.
**How to avoid:** Store character adjustments per threat level: `{ trivial: 10, low: 20, moderate: 20, severe: 30, extreme: 40 }`.
**Warning signs:** `generateEncounterBudgets(5)` returns wrong values for extreme (should be 200, not 180).

### Pitfall 2: Wrong Return for Below-Minimum Creatures
**What goes wrong:** Returning `null` or throwing for creatures with delta < -4.
**Why it happens:** CONTEXT.md differentiates below -4 (return 0, no flag) from above +4 (return null + flag).
**How to avoid:** Check the decision: trivially weak = 0; over-extreme = `{ xp: null, outOfRange: true }`.
**Warning signs:** Tests for delta -5 checking for 0 XP fail because null was returned.

### Pitfall 3: PWOL Range Boundary Confusion
**What goes wrong:** Applying out-of-range handling at ±4 when `pwol: true` is set.
**Why it happens:** Standard range is -4 to +4; PWOL range is -7 to +7.
**How to avoid:** Select the correct table AND the correct out-of-range boundary based on `pwol`.
**Warning signs:** PWOL tests at delta -5 or +5 return `outOfRange: true` when they should return valid XP.

### Pitfall 4: calculateEncounterRating Using Hardcoded 4-Player Budgets
**What goes wrong:** Comparing total XP against fixed thresholds (40/60/80/120/160) instead of the party-scaled values.
**Why it happens:** 4-player values are the most visible in the rules.
**How to avoid:** `calculateEncounterRating` must receive `partySize` (or the scaled budgets) as input, not just total XP.
**Warning signs:** Ratings are wrong for parties of 3 or 5+ players.

### Pitfall 5: Old Import Paths Not Updated
**What goes wrong:** `src/components/CreatureBrowser.vue` still imports from `@/lib/xp-calculator`.
**Why it happens:** That file is being deleted; the import breaks at build time.
**How to avoid:** Update `CreatureBrowser.vue` line 6 to import `calculateCreatureXP` from `@/lib/pf2e`.
**Warning signs:** TypeScript build error after deletion.

### Pitfall 6: Missing `src/lib/pf2e/` Directory
**What goes wrong:** Writing `xp.ts` to a directory that doesn't exist yet.
**Why it happens:** `src/lib/pf2e/` is a new directory created in this phase.
**How to avoid:** Create the directory before writing files (Plan 01-01 Wave 0).

---

## Code Examples

### calculateCreatureXP Skeleton
```typescript
// Based on CONTEXT.md locked decisions and existing xp-calculator.ts pattern
export type XpResult = { xp: number; outOfRange?: false } | { xp: null; outOfRange: true }

export function calculateCreatureXP(
  creatureLevel: number,
  partyLevel: number,
  options?: { pwol?: boolean }
): XpResult {
  const level = Math.max(creatureLevel, 0)  // negative levels → 0
  const delta = level - partyLevel
  const table = options?.pwol ? PWOL_CREATURE_XP : CREATURE_XP
  const minDelta = options?.pwol ? -7 : -4
  const maxDelta = options?.pwol ? 7 : 4

  if (delta < minDelta) return { xp: 0 }
  if (delta > maxDelta) return { xp: null, outOfRange: true }
  return { xp: table[delta]! }
}
```

### generateEncounterBudgets Skeleton
```typescript
// Source: GM Core Table 10-1 — https://2e.aonprd.com/Rules.aspx?ID=498
const BASE_BUDGETS = {
  trivial: 40, low: 60, moderate: 80, severe: 120, extreme: 160,
} as const

const CHARACTER_ADJUSTMENTS = {
  trivial: 10, low: 20, moderate: 20, severe: 30, extreme: 40,
} as const

export function generateEncounterBudgets(partySize: number): Record<ThreatRating, number> {
  if (partySize === 0) throw new Error('Party size cannot be 0')
  const diff = partySize - 4
  return {
    trivial: BASE_BUDGETS.trivial + diff * CHARACTER_ADJUSTMENTS.trivial,
    low:     BASE_BUDGETS.low     + diff * CHARACTER_ADJUSTMENTS.low,
    moderate: BASE_BUDGETS.moderate + diff * CHARACTER_ADJUSTMENTS.moderate,
    severe:  BASE_BUDGETS.severe  + diff * CHARACTER_ADJUSTMENTS.severe,
    extreme: BASE_BUDGETS.extreme + diff * CHARACTER_ADJUSTMENTS.extreme,
  }
}
```

### Barrel Index Pattern
```typescript
// src/lib/pf2e/index.ts
export {
  calculateCreatureXP,
  getHazardXp,
  generateEncounterBudgets,
  calculateEncounterRating,
  calculateXP,
} from './xp'
// Future phases add exports here
```

### Test File Location
```
src/lib/pf2e/__tests__/xp.test.ts
```
Use `@/lib/pf2e` (barrel) for public API tests and `@/lib/pf2e/xp` + `__testing` for internal function tests. Follow the pattern in `src/lib/__tests__/weak-elite.test.ts`.

---

## Integration Points

### File Being Deleted
`src/lib/xp-calculator.ts` — has one export: `getXpForCreature`. After deletion:
- `src/lib/__tests__/xp-calculator.test.ts` — DELETE (new tests cover XP-01/XP-02)
- `src/components/CreatureBrowser.vue` line 6 — UPDATE import to `@/lib/pf2e`
- `src/components/__tests__/CreatureBrowser.test.ts` line 9 — UPDATE `vi.mock` path

### New Public API Surface
```typescript
// All exported from src/lib/pf2e/index.ts
calculateCreatureXP(creatureLevel, partyLevel, options?) → XpResult
getHazardXp(hazardLevel, partyLevel, type: 'simple' | 'complex', options?) → XpResult
generateEncounterBudgets(partySize) → Record<ThreatRating, number>
calculateEncounterRating(totalXp, partySize) → ThreatRating | 'trivial'
calculateXP(creatures, hazards, partyLevel, partySize, options?) → EncounterResult
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getXpForCreature` in `src/lib/xp-calculator.ts` | `calculateCreatureXP` in `src/lib/pf2e/xp.ts` | Phase 01 | Richer return type, PWOL support, hazard support, orchestrator |
| Returns `number | null` | Returns `XpResult` union type | Phase 01 | Distinguishes 0 XP (trivially weak) from null+flag (over-extreme) |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (version from project, ~2.x) |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| XP-01 | All 9 standard table deltas return correct XP; all 15 PWOL table entries correct; simple/complex hazard table values correct | unit | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` | ❌ Wave 0 |
| XP-02 | calculateCreatureXP returns correct XP for all deltas in range; returns 0 for <min; returns null+outOfRange for >max; PWOL uses different table and range | unit | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` | ❌ Wave 0 |
| XP-03 | getHazardXp returns correct values for simple and complex; out-of-range behavior matches creatures | unit | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` | ❌ Wave 0 |
| XP-04 | generateEncounterBudgets(4) returns {trivial:40,low:60,moderate:80,severe:120,extreme:160}; party of 3 subtracts per-threat adjustment; party of 5 adds; party of 0 throws | unit | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` | ❌ Wave 0 |
| XP-05 | calculateEncounterRating maps total XP to correct threat string for party of 4 and non-4 party sizes | unit | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` | ❌ Wave 0 |
| XP-06 | calculateXP with mixed creatures+hazards returns correct totalXp, correct rating, per-entity breakdown, and outOfRange warnings | unit | `npx vitest run src/lib/pf2e/__tests__/xp.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/pf2e/__tests__/xp.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/pf2e/__tests__/xp.test.ts` — covers XP-01 through XP-06
- [ ] `src/lib/pf2e/` directory — create before writing any files

---

## Open Questions

1. **Simple hazard XP at delta +4: 32 or 30?**
   - What we know: The rule "simple = 1/5 of complex" with complex = 160 gives 32. One WebFetch returned 30 (likely AI summarizer error). A second AoN fetch (Rules ID 2649) returned 32.
   - What's unclear: Whether the GM Core reprint has any errata changing this value.
   - Recommendation: Use 32 (mathematically consistent with the rule). Flag in code comment with AoN source URL. Test at this boundary.

2. **PWOL hazard XP: does it use the standard or PWOL creature table as its basis?**
   - What we know: Official docs say complex hazard XP = creature XP at same level. Under PWOL, creature XP values change.
   - What's unclear: Whether PWOL hazard XP uses PWOL creature XP values as its base (which would be consistent with the rule) or stays on standard creature XP values (which would be simpler).
   - Recommendation: Implement as PWOL hazard XP = PWOL creature XP at same delta (i.e., apply PWOL consistently). If wrong, tests will catch it.

---

## Sources

### Primary (HIGH confidence)
- https://2e.aonprd.com/Rules.aspx?ID=499 — Creature XP table (Table 10-2), all 9 delta values verified
- https://2e.aonprd.com/Rules.aspx?ID=497 — Encounter budget overview
- https://2e.aonprd.com/Rules.aspx?ID=498 — Encounter budget thresholds table (Table 10-1), character adjustments
- https://2e.aonprd.com/Rules.aspx?ID=2649 — Hazard XP awards table, simple/complex values for all deltas -4 to +4
- https://2e.aonprd.com/Rules.aspx?ID=2857 — Hazard experience rules (rule: complex = creature XP, simple = 1/5)
- https://2e.aonprd.com/Rules.aspx?ID=1370 — PWOL variant rules, Table 4-18 creature XP (-7 to +7)
- `src/lib/xp-calculator.ts` — Existing standard XP table (cross-confirms creature table values)
- `src/lib/weak-elite.ts` — Establishes `Record<number,number>` and `__testing` patterns

### Secondary (MEDIUM confidence)
- https://pf2calc.com — Community encounter calculator cross-verifying table values
- https://pf2easy.com/index.php?id=5943 — Different party sizes rules cross-reference

### Tertiary (LOW confidence)
- WebSearch aggregate summaries — discarded where contradicting AoN primary source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no external packages needed; vitest already installed
- XP table values: HIGH — verified from multiple AoN pages; cross-confirmed by existing `xp-calculator.ts`
- PWOL table values: HIGH — directly from AoN Rules ID 1370 (Table 4-18)
- Hazard table values: HIGH — from AoN Rules ID 2649; one open question at +4 delta documented
- Architecture patterns: HIGH — all patterns are established in this codebase
- Integration points: HIGH — files identified via grep and direct read

**Research date:** 2026-03-24
**Valid until:** 2026-09-24 (stable rules; PF2e core rules don't change frequently)
