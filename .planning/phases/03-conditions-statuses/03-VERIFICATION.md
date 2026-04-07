---
phase: 03-conditions-statuses
verified: 2026-03-31T00:00:00Z
status: passed
score: 21/21 must-haves verified
re_verification: false
---

# Phase 3: Conditions & Statuses Verification Report

**Phase Goal:** The engine implements the complete set of PF2e conditions and statuses identified as missing in Phase 2 analysis
**Verified:** 2026-03-31
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

All truths are derived from the three plans' `must_haves` sections plus ROADMAP.md success criteria.

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Creature interface exists with immunities, conditions, hp, level, deathDoor fields | VERIFIED | `engine/types.ts` line 13–23 |
| 2  | CONDITION_EFFECTS map covers 13 conditions with FlatModifier effects and 5 GrantItem chains | VERIFIED | `engine/conditions/condition-effects.ts` — 13 keys confirmed (frightened, sickened, clumsy, enfeebled, stupefied, drained, blinded, unconscious, grabbed, dying, paralyzed, restrained, off-guard) |
| 3  | CONDITION_OVERRIDES map covers blinded->dazzled, stunned->slowed, and all 5 attitude overrides (7 total) | VERIFIED | `engine/conditions/condition-effects.ts` lines 120–128 — 7 entries confirmed |
| 4  | IMMUNITY_TYPES includes all condition + effect immunity strings (72 total) | VERIFIED | `engine/damage/iwr.ts` — 24 condition + 25 effect + 18 damage types + 3 categories + 2 specials = 72 |
| 5  | WEAKNESS_TYPES includes 15 new weakness strings (plus DAMAGE_TYPES and DAMAGE_CATEGORIES) | VERIFIED | `engine/damage/iwr.ts` lines 48–54 — 36 total |
| 6  | RESISTANCE_TYPES includes 13 new resistance strings plus all-damage | VERIFIED | `engine/damage/iwr.ts` lines 60–65 — 34 total |
| 7  | holy and unholy are valid DamageType values categorized as 'other' | VERIFIED | `engine/damage/damage.ts` line 14, 25–26 — confirmed in OTHER_DAMAGE_TYPES and DAMAGE_TYPE_CATEGORY |
| 8  | all-damage resistance matches any damage type in typeMatches() | VERIFIED | `engine/damage/iwr.ts` line 161 — early return `if (iwrType === 'all-damage') return true`; behavioral test passed |
| 9  | Adding a condition in an exclusive group removes other group members | VERIFIED | Behavioral test: adding 'hidden' removed 'observed' from detection group — PASS |
| 10 | Adding a condition in a non-exclusive group does NOT remove other group members | VERIFIED | Behavioral test: dazzled + concealed coexist in senses group — PASS |
| 11 | Adding blinded removes dazzled; adding stunned removes slowed | VERIFIED | Behavioral tests both passed — PASS |
| 12 | Adding grabbed auto-grants off-guard and immobilized | VERIFIED | Behavioral test: grabbed -> has('off-guard') && has('immobilized') — PASS |
| 13 | Removing grabbed auto-removes its granted off-guard and immobilized | VERIFIED | Behavioral test: remove('grabbed') -> neither granted condition remains — PASS |
| 14 | Adding dying auto-grants unconscious which auto-grants blinded, off-guard, prone | VERIFIED | Behavioral test: full chain confirmed — PASS |
| 15 | Condition immunity check prevents adding a condition the creature is immune to | VERIFIED | Behavioral test: paralyzed blocked, frightened not blocked — PASS |
| 16 | Valued conditions use Math.max for value | VERIFIED | Behavioral test: drained 1 then drained 2 = drained 2 — PASS |
| 17 | Dying value is capped at death threshold (4 - doomed value) | VERIFIED | Behavioral test: doomed 1 + dying 5 = dying 3 (threshold=3) — PASS |
| 18 | performRecoveryCheck returns correct outcome based on d20 roll vs DC (10 + dying value) | VERIFIED | Behavioral tests: DC=11, roll 11 = success, roll 10 = failure — PASS |
| 19 | Critical success reduces dying by 2; success reduces by 1; failure adds 1; crit failure adds 2 | VERIFIED | Behavioral tests: all 4 outcomes confirmed with correct dying value changes |
| 20 | Death threshold is 4 - doomed; dying >= threshold = dead (newDyingValue = -1) | VERIFIED | Behavioral test: dying 3, doomed 1 (threshold=3), failure -> newDyingValue=-1 — PASS |
| 21 | All Phase 3 exports available via engine/index.ts barrel | VERIFIED | `engine/index.ts` exports: Creature, CONDITION_EFFECTS, CONDITION_OVERRIDES, CONDITION_GROUPS_EXTENDED, EXCLUSIVE_GROUPS, all effect types, performRecoveryCheck, RecoveryCheckOutcome, RecoveryCheckResult, CONDITION_IMMUNITY_TYPES, EFFECT_IMMUNITY_TYPES, ConditionImmunityType, EffectImmunityType |

**Score:** 21/21 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `engine/types.ts` | Creature interface with 5 fields | VERIFIED | exports `Creature` with immunities, conditions, hp, level, deathDoor; WeakEliteTier preserved |
| `engine/conditions/condition-effects.ts` | CONDITION_EFFECTS, CONDITION_OVERRIDES, CONDITION_GROUPS_EXTENDED, EXCLUSIVE_GROUPS | VERIFIED | All 4 constants exported plus all type exports (ConditionSelector, ConditionModifierEffect, ConditionGrantEffect, ConditionDrainedHpEffect, ConditionEffect) |
| `engine/conditions/conditions.ts` | Extended ConditionManager with all Phase 3 behavioral mechanics | VERIFIED | grantedBy Map, grantDepth counter, creature_ field, setCreature(), getGranter(), applyGrantsFor(), removeInternal(), removeGranteesOf() all present; CONDITION_GROUPS = CONDITION_GROUPS_EXTENDED (5 groups) |
| `engine/conditions/death-progression.ts` | performRecoveryCheck pure function and types | VERIFIED | RecoveryCheckOutcome, RecoveryCheckResult, performRecoveryCheck — all exported; nat 20/1 handling present |
| `engine/damage/damage.ts` | holy and unholy damage types | VERIFIED | Both in OTHER_DAMAGE_TYPES and DAMAGE_TYPE_CATEGORY as 'other' |
| `engine/damage/iwr.ts` | Expanded IWR type arrays, all-damage handling, CONDITION/EFFECT sub-arrays | VERIFIED | CONDITION_IMMUNITY_TYPES (24), EFFECT_IMMUNITY_TYPES (25), IMMUNITY_TYPES (72), WEAKNESS_TYPES (36), RESISTANCE_TYPES (34); all-damage early return in typeMatches() |
| `engine/index.ts` | All Phase 3 additions barrel-exported | VERIFIED | 14+ new named exports confirmed |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `engine/conditions/condition-effects.ts` | `engine/conditions/conditions.ts` | `import type { ConditionSlug }` | VERIFIED | Line 6: `import type { ConditionSlug } from './conditions'` |
| `engine/types.ts` | `engine/damage/iwr.ts` | `import type { Immunity }` | VERIFIED | Line 1: `import type { Immunity } from './damage/iwr'` |
| `engine/damage/iwr.ts` | `engine/damage/damage.ts` | `DAMAGE_TYPES` spread in IWR arrays | VERIFIED | Lines 36, 50, 61: `...DAMAGE_TYPES` spreads confirmed |
| `engine/conditions/conditions.ts` | `engine/conditions/condition-effects.ts` | `import { CONDITION_EFFECTS, CONDITION_OVERRIDES, CONDITION_GROUPS_EXTENDED, EXCLUSIVE_GROUPS }` | VERIFIED | Lines 69–74 |
| `engine/conditions/conditions.ts` | `engine/types.ts` | `import type { Creature }` | VERIFIED | Line 76 |
| `engine/index.ts` | `engine/conditions/condition-effects.ts` | barrel re-export | VERIFIED | Lines 18–30 |
| `engine/index.ts` | `engine/conditions/death-progression.ts` | barrel re-export | VERIFIED | Lines 32–36 |
| `engine/index.ts` | `engine/types.ts` | Creature type re-export | VERIFIED | Line 7: `export type { WeakEliteTier, Creature }` |

### Data-Flow Trace (Level 4)

Not applicable. Phase 3 produces engine logic modules (pure TypeScript functions and classes) — no components, pages, or UI rendering data pipelines. There are no data variables flowing from an API to a render layer.

### Behavioral Spot-Checks

All tests run with `npx tsx` from the project root using `rollOverride` for deterministic recovery checks.

| Behavior | Result | Status |
|----------|--------|--------|
| Recovery DC = 10 + dying, nat 20 = criticalSuccess, dying -2 = 0, stabilized | `outcome: criticalSuccess, dc: 11, newDying: 0, stabilized: true` | PASS |
| Nat 1 with dying 1 = criticalFailure, dying +2 = 3 | `outcome: criticalFailure, newDying: 3` | PASS |
| Roll 11 with dying 1 (DC=11) = success, dying -1 = 0, stabilized | `outcome: success, newDying: 0, stabilized: true` | PASS |
| Roll 10 with dying 1 (DC=11) = failure, dying +1 = 2 | `outcome: failure, newDying: 2` | PASS |
| Dying 3, doomed 1 (threshold=3), failure -> dead (newDying=-1) | `outcome: failure, newDying: -1` | PASS |
| Exclusive group (detection): adding hidden removes observed | Both assertions PASS | PASS |
| Non-exclusive group (senses): dazzled + concealed coexist | Both present after add — PASS | PASS |
| Override: blinded removes dazzled; stunned removes slowed | Both assertions PASS | PASS |
| Grant chain: grabbed -> off-guard + immobilized | Both granted — PASS | PASS |
| Grant removal cascade: remove grabbed removes its grantees | Both removed — PASS | PASS |
| Nested grant chain: dying -> unconscious -> blinded + off-guard + prone | All 4 present — PASS | PASS |
| Valued condition max semantics: drained 1 then 2 = 2 | `get('drained') === 2` — PASS | PASS |
| Dying cap at death threshold: doomed 1 + dying 5 = dying 3 | `get('dying') === 3` — PASS | PASS |
| Immunity check: paralyzed blocked, frightened not blocked | Both assertions PASS | PASS |
| all-damage resistance 5 reduces fire 20 to 15 | `finalDamage === 15` — PASS | PASS |
| all-damage resistance 5 reduces cold 10 to 5 | `finalDamage === 5` — PASS | PASS |
| holy damage immunity zeroes holy damage | `finalDamage === 0` — PASS | PASS |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ENG-01 | 03-01-PLAN.md, 03-02-PLAN.md, 03-03-PLAN.md | Missing conditions/statuses implemented per analysis results | SATISFIED | Creature interface, CONDITION_EFFECTS (13 entries), CONDITION_OVERRIDES (7 entries), 5 condition groups with correct exclusivity, grant chains, immunity check, valued max semantics, dying cap, IWR type expansion (72 immunity types, 36 weakness types, 34 resistance types), holy/unholy damage types, all-damage special handling, performRecoveryCheck — all implemented and verified |

**Orphaned requirements:** None. ENG-01 is the only requirement mapped to Phase 3 in both REQUIREMENTS.md and all three plan frontmatter sections. No unmapped requirements exist for this phase.

**ROADMAP.md Success Criteria:**

| # | Criterion | Status |
|---|-----------|--------|
| 1 | All conditions and statuses flagged as missing in the gap-analysis document are implemented in `/engine` | SATISFIED — condition effect system (CONDITION_EFFECTS), override mechanic (CONDITION_OVERRIDES), 3 new condition groups, IWR type expansion, Creature interface, death progression all implemented |
| 2 | Each implemented condition matches Foundry VTT PF2e source behavior for value range, cascade rules, and group exclusivity | SATISFIED — behavioral spot-checks confirm: blinded overrides dazzled (refs/pf2e/conditions/blinded.json), grabbed grants off-guard+immobilized (refs/pf2e/conditions/grabbed.json), dying grants unconscious (refs/pf2e/conditions/dying.json), detection/attitudes exclusive, senses/abilities/death non-exclusive |

### Anti-Patterns Found

None. Scan of all 7 Phase 3 files revealed:
- Zero TODO/FIXME/HACK/PLACEHOLDER comments
- Zero empty return stubs (return null / return {} / return [])
- All data maps are fully populated with sourced entries
- No hardcoded empty props or disconnected data variables

### Human Verification Required

No automated blockers exist. The following items involve rule interpretation that may warrant human spot-check:

#### 1. Recovery Check Natural 20 Logic at DC=11

**Test:** Call `performRecoveryCheck(1, 0, 20)` — nat 20 with DC=11 (roll >= DC so base outcome = success, upgraded to criticalSuccess)
**Expected:** `outcome: 'criticalSuccess'` — verified programmatically as PASS
**Why human might check:** PF2e flat check nat 20 upgrade behavior — implementation treats roll >= DC as success upgraded to crit success, roll < DC as failure upgraded to success. This matches Player Core flat check rules but edge cases at DC=20 could be worth confirming.

#### 2. Grant Chain Independence on Removal

**Test:** Add 'grabbed', then also independently add 'off-guard'. Remove 'grabbed'.
**Expected:** off-guard should remain (independently applied), immobilized should be removed (only granted by grabbed)
**Why human might check:** The `grantedBy` tracking correctly handles this case by only removing conditions where `grantedBy.get(grantee) === slug`, but this nuanced "independently applied" distinction was not covered in the automated spot-check above.

### Gaps Summary

No gaps. All 21 must-haves verified across all three plans. TypeScript compiles with zero errors (`npx tsc --noEmit` exits 0). All behavioral spot-checks pass. Phase 3 goal is fully achieved.

---

_Verified: 2026-03-31_
_Verifier: Claude (gsd-verifier)_
