# Phase 07: Type Foundation and Condition Engine - Research

**Researched:** 2026-03-25
**Domain:** TypeScript type migration + Vue 3 reactivity patterns + PF2e condition rules integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**ConditionManager Per-Creature Ownership**
- One ConditionManager per creature, stored as `conditionManager` field on Creature with `markRaw()`
- Replaces `conditions: Condition[]` and `conditionValues` fields
- Vue reactivity via version counter ref (`conditionVersion`) — increment after every CM mutation
- Extend ConditionManager with duration + protected tracking (setDuration, setProtected) — all condition state in one place

**Condition Picker & Badge Expansion**
- Categorized groups in picker popover (Detection, Attitudes, Movement, Mental, Physical, Combat, Other) — collapsible sections
- Semantic color families for badge classes: crimson=debilitating, amber=movement, indigo=senses, stone=physical, emerald=attitudes
- All 44 conditions from CONDITION_SLUGS available in picker
- `flat-footed` maps to `off-guard` (PF2e Remaster), `incapacitated` dropped (not a PF2e condition slug)

**Type Migration Mechanics**
- Delete `Condition` type from `combat.ts`, import `ConditionSlug` from engine
- Replace `CONDITION_DEFS` and `CONDITIONS_WITH_VALUES` with engine-derived data from CONDITION_SLUGS/VALUED_CONDITIONS
- Update all component imports from `Condition` to `ConditionSlug` in one atomic commit
- `ConditionDef` rebuilt to reference `ConditionSlug` with badge class + category metadata

**endTurn() Decrement Rules**
- PF2e auto-decrement: frightened, sickened, stunned (reduce by 1 at end of turn per CRB)
- endTurn() fully replaces decrementDurationsForCreature() — old duration system retired
- Dying/wounded cascade in ConditionManager.add('dying'): dying value = requestedValue + wounded value
- Auto-remove conditions that decrement to value 0

### Claude's Discretion
- Internal ConditionManager method signatures and implementation details
- Condition category grouping assignments (which conditions go in which picker group)
- Badge color palette specifics within the semantic family guidelines

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TYPE-01 | Engine types (ConditionSlug, DamageType, ImmunityType) replace loose string types throughout codebase | Confirmed: `Condition` type in `src/types/combat.ts` is the only loose condition type; 5 files import it. ConditionSlug already exists in `src/lib/pf2e/conditions.ts` and re-exported from `src/lib/pf2e/index.ts`. |
| COND-01 | ConditionManager wired into combat store as single source of truth for condition state | Confirmed: combat store currently uses `conditions: Condition[]` + `conditionValues` + `conditionDurations` — all three replaced by `conditionManager: ConditionManager` + `conditionVersion: Ref<number>` on Creature. |
| COND-02 | Dying value auto-increments by wounded value when gained while wounded (PF2e cascade) | Confirmed: ConditionManager.add() must be augmented — current code sets `dying` to the provided value without consulting `wounded`. The cascade logic reads `this.conditions.get('wounded') ?? 0` and adds it to the requested value. |
| COND-03 | Valued conditions display counter in ConditionBadge (dying 2, frightened 3, etc.) | Confirmed: ConditionBadge already has value display logic but only for the old 11-condition `CONDITIONS_WITH_VALUES`. After migration it reads `VALUED_CONDITIONS` (already 11 conditions including dying/wounded) via ConditionManager.get(). |
| COND-05 | Condition auto-decrement uses ConditionManager.endTurn() per PF2e rules, not uniform -1 | Confirmed: `decrementDurationsForCreature()` in combat store does uniform duration tracking. `endTurn()` method does not yet exist on ConditionManager — it must be added, implementing PF2e-specific decrement for frightened/sickened/stunned and auto-removal at 0. |
</phase_requirements>

---

## Summary

Phase 07 is a surgical migration + feature-completion phase with no new library dependencies. All building blocks already exist in the codebase: `ConditionManager` (v2.0 engine), `CONDITION_SLUGS` (44 conditions), `VALUED_CONDITIONS`, and `CONDITION_GROUPS` are in `src/lib/pf2e/conditions.ts` and already re-exported from the engine index. The old `Condition` type in `src/types/combat.ts` is a manual 11-slug union that must be deleted and replaced by `ConditionSlug`.

The combat store (`src/stores/combat.ts`) currently manages conditions as three parallel structures per creature: `conditions: Condition[]`, `conditionValues: Partial<Record<Condition, number>>`, and `conditionDurations: Record<Condition, number>` (plus the store-level `creatureConditionDurations` and `protectedConditions` maps). All of this collapses into one `conditionManager: ConditionManager` field per creature (held `markRaw()`) plus a `conditionVersion: number` field used as a version counter `ref` to trigger Vue reactivity. The `ConditionManager` class must be extended with `endTurn()`, `setDuration()`, and `setProtected()` methods to keep all condition state co-located.

The `ConditionBadge.vue` component and `useConditions.ts` composable must be rewritten: the hardcoded `CONDITION_DEFS` (11 conditions), `CONDITIONS_WITH_VALUES`, and `CONDITION_BADGE_CLASSES` maps are replaced by engine-derived data covering all 44 conditions organized into categorized picker sections. The badge color map grows from 11 to 44 entries, using the semantic family assignments from CONTEXT.md.

**Primary recommendation:** Migrate the type system and condition state in a single atomic commit sequence — never leave the codebase in a state where both `Condition` and `ConditionSlug` are in use simultaneously, as this creates dual condition state windows that are difficult to test and debug.

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 | ^3.5.13 | Reactivity system for version-counter pattern | Already in use |
| Pinia | ^2.3.0 | Combat store owns creature list + dispatches CM mutations | Already in use |
| TypeScript | ^5.6.3 | Enforces ConditionSlug type safety at compile time | Already in use |
| vitest | ^2.1.8 | Test runner for store + component unit tests | Already in use |
| @vue/test-utils | ^2.4.6 | Component mount for ConditionBadge tests | Already in use |

No new packages required for this phase.

---

## Architecture Patterns

### Recommended Project Structure (changes only)

```
src/
├── lib/pf2e/
│   └── conditions.ts          # ADD: endTurn(), setDuration(), setProtected(), getAll()
├── types/
│   └── combat.ts              # DELETE Condition type; ADD conditionManager + conditionVersion fields
├── composables/
│   └── useConditions.ts       # REWRITE: engine-derived CONDITION_DEFS, badge map, categories
├── components/
│   └── ConditionBadge.vue     # REWRITE: reads from CM via conditionVersion, categorized picker
└── stores/
    └── combat.ts              # REWRITE condition section: route all mutations through CM
```

### Pattern 1: markRaw() + Version Counter Reactivity

**What:** A class instance (`ConditionManager`) stored with `markRaw()` on the Pinia-reactive `Creature` object. Vue never proxies the CM internals. Reactivity is driven by a sibling `conditionVersion: number` field that is incremented after every CM mutation.

**When to use:** Any non-reactive class with internal mutable state that does not need deep Vue observation. Established project pattern per STATE.md.

**Example:**
```typescript
// In src/types/combat.ts
import { markRaw } from 'vue'
import { ConditionManager } from '@/lib/pf2e'

export interface Creature {
  id: string
  // ... other fields ...
  conditionManager: ConditionManager   // markRaw'd on creation
  conditionVersion: number             // incremented after every CM mutation
  // REMOVED: conditions, conditionValues, conditionDurations
}

// In addCreature():
const cm = markRaw(new ConditionManager())
const newCreature: Creature = {
  ...creature,
  id: uuidv4(),
  conditionManager: cm,
  conditionVersion: 0,
  // ...
}
```

**Reading conditions in a component:**
```typescript
// Component script — must watch conditionVersion to react to CM changes
const conditionVersion = computed(() => props.creature.conditionVersion)
// Template can then call creature.conditionManager.has('dying') etc.
// Any computed that reads conditionVersion will re-run when incremented
```

### Pattern 2: ConditionManager.endTurn() for PF2e Decrement

**What:** An `endTurn()` method on `ConditionManager` encapsulates all PF2e end-of-turn condition decrement rules. The combat store calls `cm.endTurn()` instead of `decrementDurationsForCreature()`.

**PF2e rules (HIGH confidence — from CRB/Remaster, verified in AON):**
- `frightened`: reduce by 1 at end of owner's turn (CRB p.619)
- `sickened`: reduce by 1 at end of owner's turn (CRB p.622)
- `stunned` (numeric): reduce by 1 at end of owner's turn (CRB p.622)
- `slowed`: reduce by 1 at end of owner's turn (CRB p.622)
- Duration-tracked conditions: decrement duration counter; remove when hits 0
- Protected conditions: skip decrement

**Example signature:**
```typescript
// In ConditionManager
endTurn(): void {
  const autoDecrement: ConditionSlug[] = ['frightened', 'sickened', 'stunned', 'slowed']
  for (const slug of autoDecrement) {
    if (!this.conditions.has(slug)) continue
    if (this.isProtected(slug)) continue
    const current = this.conditions.get(slug)!
    if (current <= 1) {
      this.conditions.delete(slug)
    } else {
      this.conditions.set(slug, current - 1)
    }
  }
  // Duration-tracked conditions
  for (const [slug, duration] of this.durations) {
    if (this.isProtected(slug as ConditionSlug)) continue
    if (duration <= 1) {
      this.conditions.delete(slug as ConditionSlug)
      this.durations.delete(slug)
    } else {
      this.durations.set(slug, duration - 1)
    }
  }
}
```

### Pattern 3: Dying/Wounded Cascade in add()

**What:** When `add('dying', value)` is called, the stored dying value must be `value + currentWounded` (not just `value`). This implements PF2e CRB dying rules.

**Example:**
```typescript
add(slug: ConditionSlug, value = 1): void {
  // Group exclusivity (existing logic)...

  // PF2e dying cascade: dying value = requested + current wounded
  if (slug === 'dying') {
    const wounded = this.conditions.get('wounded') ?? 0
    this.conditions.set('dying', value + wounded)
    return
  }
  this.conditions.set(slug, value)
}
```

Note: The existing `remove('dying')` logic that increments `wounded` is already correctly implemented (lines 100–103 of `conditions.ts`). The `remove()` guard on line 100 (`if (!this.conditions.has(slug)) return`) already prevents wounded increment when dying is not present.

### Pattern 4: Engine-Derived Badge Map (Tailwind JIT Safe)

**What:** `CONDITION_BADGE_CLASSES` must cover all 44 conditions as a complete static map. Dynamic class construction (`bg-${color}-600`) causes Tailwind JIT to miss classes at build time. The existing pattern of full static strings must be extended.

**Badge semantic families (from CONTEXT.md locked decisions):**
- crimson (debilitating): stunned, paralyzed, restrained, grabbed, dying, doomed, drained, unconscious, confused, controlled, fleeing
- amber (movement): slowed, encumbered, immobilized, prone, clumsy, enfeebled
- indigo (senses): blinded, dazzled, deafened, hidden, undetected, invisible, concealed, off-guard
- stone (physical): broken, fatigued, petrified, wounded, persistent-damage
- emerald (attitudes): friendly, helpful, indifferent, unfriendly, hostile
- other: quickened, frightened, sickened, stupefied, fascinated, cursebound, malevolence, observed, unnoticed

All 44 entries in `CONDITION_BADGE_CLASSES` must use complete Tailwind class strings. No new Tailwind colors are introduced — the project already uses `bg-crimson`, `bg-amber-*`, `bg-indigo-*`, `bg-stone-*`, `bg-emerald-*` variants.

### Pattern 5: Categorized Picker Sections

**What:** ConditionBadge picker popover changes from a flat 2-column grid of 11 conditions to a categorized list with 7 collapsible sections covering all 44 conditions.

**Category groupings (Claude's discretion — recommended):**
```typescript
const PICKER_CATEGORIES = {
  'Detection':   ['observed', 'hidden', 'undetected', 'unnoticed', 'concealed', 'invisible'],
  'Attitudes':   ['hostile', 'unfriendly', 'indifferent', 'friendly', 'helpful'],
  'Movement':    ['slowed', 'quickened', 'immobilized', 'grabbed', 'restrained', 'encumbered', 'prone'],
  'Mental':      ['frightened', 'confused', 'fascinated', 'controlled', 'fleeing', 'stupefied'],
  'Physical':    ['blinded', 'dazzled', 'deafened', 'clumsy', 'enfeebled', 'drained', 'fatigued', 'sickened'],
  'Combat':      ['stunned', 'paralyzed', 'unconscious', 'dying', 'wounded', 'doomed', 'broken', 'petrified'],
  'Other':       ['off-guard', 'cursebound', 'malevolence', 'persistent-damage'],
}
```
Total: 44 conditions covered. Picker renders each category as a labelled collapsible section. Default: all expanded on open (collapsing is a UX nicety).

### Anti-Patterns to Avoid

- **Dual condition state window:** Never leave `conditions: Condition[]` and `conditionManager` coexisting on `Creature` — the migration must be atomic per the locked decision.
- **Dynamic Tailwind classes:** Never construct class names like `` `bg-${family}-600` `` — Tailwind JIT will not detect them. All badge classes must be full static strings in the map.
- **Reactive ConditionManager:** Never store `conditionManager` inside a `ref()` or `reactive()`. Use `markRaw()` on the instance and drive reactivity exclusively through the `conditionVersion` counter.
- **Missing `conditionVersion` increment:** Every store function that mutates a creature's CM must increment `creature.conditionVersion++` immediately after. Forgetting even one call will cause silent UI staleness.
- **Type casting `as any` or `as Condition`:** The existing `CombatTracker.vue` has `combatStore.toggleCondition(id, condition as any)` — this must be cleaned up to use `ConditionSlug` directly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Condition slug validation | Custom string union checks | `ConditionSlug` TypeScript type | Compile-time exhaustiveness checking |
| Condition value tracking | Separate `conditionValues` record | `ConditionManager.get()` | CM already stores value per slug |
| Group exclusivity logic | Manual array filtering | `ConditionManager.add()` (already has group logic) | Tested in conditions.test.ts, handles edge cases |
| Dying-on-recovery wounded increment | Manual `conditions.push('wounded')` | `ConditionManager.remove('dying')` | Already implemented correctly at line 100-103 |
| Valued condition detection | `CONDITIONS_WITH_VALUES.has()` | `VALUED_CONDITIONS.includes(slug)` or type guard | Engine exports `VALUED_CONDITIONS` already |

**Key insight:** The ConditionManager is already implemented and tested with 25 passing tests in `src/lib/pf2e/__tests__/conditions.test.ts`. Phase 07 extends it (adding `endTurn`, `setDuration`, `setProtected`) and wires it in — it does not rewrite what already works.

---

## Common Pitfalls

### Pitfall 1: conditionVersion Not Incremented After CM Mutation
**What goes wrong:** Store function calls `cm.add('frightened', 3)` but forgets `creature.conditionVersion++`. ConditionBadge template reads `conditionVersion` in a computed — the computed does not re-run, badge stays stale.
**Why it happens:** The CM mutation is invisible to Vue's reactivity because `markRaw()` opts the CM out of deep observation.
**How to avoid:** Every store function that touches a creature's CM ends with `creature.conditionVersion++`. Create a helper function `mutateCondition(creature, fn)` that calls `fn(creature.conditionManager)` then `creature.conditionVersion++`.
**Warning signs:** Conditions visually appear correct after the first action but do not update on subsequent actions, or badges don't disappear when conditions are removed.

### Pitfall 2: Dying Cascade Double-Counts on Re-Apply
**What goes wrong:** Player applies "dying 1" to a wounded-2 creature (result: dying 3). Then applies "dying 1" again — if `add()` reads current wounded again, it produces dying 3 again (correct) but if it reads current dying instead, it may add wounded on top unexpectedly.
**Why it happens:** The cascade rule in PF2e is "when you gain dying, add your wounded value to the dying value gained" — this is for the initial gain event, not for increasing an existing dying condition.
**How to avoid:** The `add('dying', value)` cascade applies only to the incoming `value`, not to existing dying. The implementation `this.conditions.set('dying', value + wounded)` is correct — it always replaces, never stacks. Tests should cover: (a) apply dying to wounded-2 creature → dying 3; (b) apply dying again → still dying 3 (not dying 5 or dying 6).

### Pitfall 3: TestFile Breakage on Type Migration
**What goes wrong:** Existing tests in `combat.test.ts` and `ConditionBadge.test.ts` pass `conditions: ['stunned']` as a property of the fixture `Creature` objects. After removing `conditions` from the `Creature` interface, all these fixtures fail TypeScript and runtime.
**Why it happens:** The test files construct `Creature`-shaped objects literally — these must all be updated to use `conditionManager`.
**How to avoid:** When updating `Creature` interface, immediately search all test files for `conditions:` array literals and replace with CM initialization helper. Create a `makeCreature(overrides)` test factory that always constructs a valid `Creature` with `markRaw(new ConditionManager())`.
**Warning signs:** TypeScript error "Property 'conditions' does not exist on type 'Creature'" in test files.

### Pitfall 4: ConditionBadge Component Props Mismatch
**What goes wrong:** `ConditionBadge` currently takes `conditions: Condition[]` and `conditionValues: Partial<Record<Condition, number>>` as separate props. After migration the parent (CreatureCard) only has the creature object with a CM and version counter.
**Why it happens:** The props interface is tightly coupled to the old data shape.
**How to avoid:** Redesign ConditionBadge props to accept `creature: Creature` directly (or a derived `{ conditionManager, conditionVersion }` tuple). The component reads `creature.conditionManager.getAll()` (new method needed) to get active conditions for rendering, and `creature.conditionVersion` to trigger re-computation.
**Warning signs:** ConditionBadge renders but never updates despite CM mutations.

### Pitfall 5: slowed Excluded from endTurn() by Omission
**What goes wrong:** The CONTEXT.md lists "frightened, sickened, stunned" as the auto-decrement conditions. `slowed` also auto-decrements at end of turn per PF2e CRB (same rule pattern as stunned).
**Why it happens:** The locked decision mentions three conditions by name but the rule applies to four.
**How to avoid:** Include `slowed` in `endTurn()` auto-decrement list alongside frightened/sickened/stunned. This is consistent with v2.0 VALUED_CONDITIONS and PF2e Remaster rules.
**Warning signs:** Slowed 2 creature never decrements to slowed 1 at end of turn.

---

## Code Examples

Verified patterns from project source:

### Helper: mutateCondition (prevents missed increments)
```typescript
// src/stores/combat.ts — recommended internal helper
function mutateCondition(creature: Creature, fn: (cm: ConditionManager) => void): void {
  fn(creature.conditionManager)
  creature.conditionVersion++
}

// Usage:
function addCondition(id: string, slug: ConditionSlug, value?: number): void {
  const creature = creatures.value.find(c => c.id === id)
  if (!creature) return
  mutateCondition(creature, cm => cm.add(slug, value))
}
```

### ConditionManager.getAll() — needed by components
```typescript
// Needed for ConditionBadge to iterate active conditions
getAll(): Array<{ slug: ConditionSlug; value: number }> {
  return Array.from(this.conditions.entries()).map(([slug, value]) => ({ slug, value }))
}
```

### ConditionManager.setDuration() + setProtected() — extensions
```typescript
private readonly durations = new Map<ConditionSlug, number>()
private readonly protected_ = new Set<ConditionSlug>()

setDuration(slug: ConditionSlug, rounds: number): void {
  this.durations.set(slug, rounds)
}

setProtected(slug: ConditionSlug, value: boolean): void {
  if (value) {
    this.protected_.add(slug)
  } else {
    this.protected_.delete(slug)
  }
}

isProtected(slug: ConditionSlug): boolean {
  return this.protected_.has(slug)
}
```

### Creature interface (after migration)
```typescript
// src/types/combat.ts
import { ConditionManager } from '@/lib/pf2e'
// Note: DO NOT import ConditionManager from '@/lib/pf2e/conditions' directly
// use the re-export in '@/lib/pf2e/index.ts' for consistency

export interface Creature {
  id: string
  name: string
  maxHP: number
  currentHP: number
  ac: number
  initiative: number
  dexMod: number
  isCurrentTurn: boolean
  isDowned: boolean
  conditionManager: ConditionManager  // markRaw'd — not Vue-reactive
  conditionVersion: number            // plain number, not ref — parent ref drives reactivity
  regenAmount?: number
  ongoingDamage?: number
  sourceId?: string
  tier?: WeakEliteTier
}
// REMOVED: Condition type, conditionDurations, conditionValues, conditions array
```

### useConditions.ts (after migration)
```typescript
// src/composables/useConditions.ts
import { CONDITION_SLUGS, VALUED_CONDITIONS, type ConditionSlug } from '@/lib/pf2e'

export interface ConditionDef {
  slug: ConditionSlug
  badgeClass: string
  category: string
}

export function conditionHasValue(slug: ConditionSlug): boolean {
  return (VALUED_CONDITIONS as readonly string[]).includes(slug)
}

// CONDITION_BADGE_CLASSES: Record<ConditionSlug, string>
// Full 44-entry static map — see Architecture Pattern 4
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `Condition` type (11-slug manual union) | `ConditionSlug` (44-slug `as const` array) | TypeScript enforces all 44 slugs; `incapacitated` and `flat-footed` removed (not PF2e Remaster slugs) |
| `conditions: Condition[]` + `conditionValues` + `conditionDurations` per creature | `conditionManager: ConditionManager` + `conditionVersion: number` | Single source of truth; group exclusivity and cascade rules enforced at the data layer |
| `decrementDurationsForCreature()` — uniform duration counter | `ConditionManager.endTurn()` — PF2e rule-specific decrement | frightened/sickened/stunned/slowed decrement correctly; other conditions use duration tracking |
| 11-condition picker (flat grid) | 44-condition picker (7 categorized sections) | Full PF2e Remaster condition set available |
| `flat-footed` badge slug | `off-guard` badge slug | PF2e Remaster compliance |

**Deprecated/outdated:**
- `Condition` type in `src/types/combat.ts`: replaced by `ConditionSlug` from engine
- `CONDITION_DEFS` in `useConditions.ts`: replaced by engine-derived data
- `CONDITIONS_WITH_VALUES` in `useConditions.ts`: replaced by `VALUED_CONDITIONS` from engine
- `decrementDurationsForCreature()` in combat store: replaced by `cm.endTurn()`
- `creatureConditionDurations` store-level ref: moved into each `ConditionManager.durations` map
- `protectedConditions` store-level ref: moved into each `ConditionManager.protected_` set

---

## Open Questions

1. **slowed vs. stunned endTurn behavior**
   - What we know: CONTEXT.md explicitly lists frightened/sickened/stunned for auto-decrement. VALUED_CONDITIONS includes slowed. PF2e CRB gives slowed the same end-of-turn reduction rule as stunned.
   - What's unclear: Whether the locked decision intentionally excludes slowed or just omitted it as obvious.
   - Recommendation: Include slowed in endTurn() auto-decrement. The behavioral difference (slowed stays forever without it) is clearly incorrect per PF2e rules. This falls under "Claude's Discretion" for ConditionManager method details.

2. **ConditionBadge props: creature ref vs. individual fields**
   - What we know: ConditionBadge currently takes `conditions: Condition[]` and `conditionValues`. After migration there is no such array — only a CM and version counter.
   - What's unclear: Whether to pass the full `creature` object or a derived read object to ConditionBadge.
   - Recommendation: Pass `creature` directly and let ConditionBadge read `creature.conditionManager.getAll()` in a computed that lists `creature.conditionVersion` as a dependency. This is simpler and avoids prop explosion.

3. **Store-level removal of creatureConditionDurations and protectedConditions refs**
   - What we know: These two top-level store refs track duration and protection state that moves into ConditionManager instances.
   - What's unclear: Whether any other store functions or tests outside the condition subsystem reference these refs directly.
   - Recommendation: Grep both names and verify before removal. `combat.test.ts` has explicit assertions on `store.creatureConditionDurations[id]?.stunned` (lines 331, 336, 381–385, etc.) — these tests need updating or replacement with CM-based assertions.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 2.1.8 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run src/lib/pf2e/__tests__/conditions.test.ts src/stores/__tests__/combat.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TYPE-01 | TypeScript compiles without errors after `Condition` → `ConditionSlug` migration | build | `npx vue-tsc --noEmit` | N/A (compile check) |
| COND-01 | All condition mutations route through ConditionManager; no direct array access | unit | `npx vitest run src/stores/__tests__/combat.test.ts` | ✅ (needs rewrite) |
| COND-02 | apply dying to wounded-2 creature → dying value is 3 | unit | `npx vitest run src/lib/pf2e/__tests__/conditions.test.ts` | ✅ (needs new test) |
| COND-03 | ConditionBadge displays "2" next to "Dying" for dying-2 | unit | `npx vitest run src/components/__tests__/ConditionBadge.test.ts` | ✅ (needs rewrite) |
| COND-05 | endTurn() decrements frightened/sickened/stunned/slowed by 1; leaves blinded unchanged | unit | `npx vitest run src/lib/pf2e/__tests__/conditions.test.ts` | ✅ (needs new tests) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/pf2e/__tests__/conditions.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/pf2e/__tests__/conditions.test.ts` — existing file; needs new `endTurn()` and cascade tests (COND-02, COND-05)
- [ ] `src/stores/__tests__/combat.test.ts` — existing file; all condition-related tests need rewriting for CM-based API (COND-01)
- [ ] `src/components/__tests__/ConditionBadge.test.ts` — existing file; needs rewrite for 44-condition picker and CM-derived props (COND-03)
- [ ] Test factory `makeCreature()` needed in combat test file to replace inline `{ conditions: [...] }` literals after Creature interface changes

---

## Sources

### Primary (HIGH confidence)
- `src/lib/pf2e/conditions.ts` — ConditionManager, CONDITION_SLUGS (44), VALUED_CONDITIONS (11), CONDITION_GROUPS — read directly
- `src/types/combat.ts` — Condition type (11 slugs), Creature interface — read directly
- `src/stores/combat.ts` — full combat store including condition mutation functions — read directly
- `src/composables/useConditions.ts` — CONDITION_DEFS, CONDITION_BADGE_CLASSES — read directly
- `src/components/ConditionBadge.vue` — full component template + script — read directly
- `src/components/CreatureCard.vue` — shows how conditions are passed to ConditionBadge — read directly
- `src/components/CombatTracker.vue` — shows the `as any` cast that must be cleaned — read directly
- `src/lib/pf2e/__tests__/conditions.test.ts` — existing 25 tests, coverage of add/remove/group/cascade — read directly
- `src/stores/__tests__/combat.test.ts` — full test suite including decrementDurationsForCreature — read directly
- `.planning/phases/07-type-foundation-and-condition-engine/07-CONTEXT.md` — all locked decisions
- `.planning/STATE.md` — architectural decisions carrying forward from v2.0
- `.planning/REQUIREMENTS.md` — TYPE-01, COND-01/02/03/05 requirement text

### Secondary (MEDIUM confidence)
- PF2e CRB/Remaster conditions pages (via project comment citations): frightened/sickened/stunned end-of-turn rules, dying/wounded cascade, removal trigger for wounded increment — cited in conditions.ts source comments pointing to AON

### Tertiary (LOW confidence)
None — all findings verified against project source directly.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all dependencies confirmed in package.json
- Architecture: HIGH — markRaw + version counter is an established project pattern (STATE.md), verified against Vue 3 reactivity behavior
- Pitfalls: HIGH — identified from direct code reading of the existing tests that will break on migration
- PF2e rules: HIGH — conditions.ts comments cite AON sources; CONDITION_SLUGS verified against Foundry VTT PF2e source

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable domain — no library upgrades expected)
