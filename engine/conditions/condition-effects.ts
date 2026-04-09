// ─── Condition Effects Data Map (D-01 through D-10) ──────────────────────────
// Source: Foundry VTT PF2e refs/pf2e/conditions/*.json (system.rules FlatModifier + GrantItem RE)
// Source: refs/pf2e/conditions/*.json system.overrides fields
// Source: AON https://2e.aonprd.com/Conditions.aspx (authoritative rule text)

import type { ConditionSlug } from './conditions'
import type { ModifierType } from '../modifiers/modifiers'

// ─── Selector Types (D-03) ────────────────────────────────────────────────────
// Selectors follow Foundry convention: string (single selector) or string[] (multiple selectors)
// "all" — all checks and DCs; "dex-based" — Dex-based checks and DCs, etc.

export type ConditionSelector = string | string[]

// ─── Effect Interfaces (D-01, D-02, D-04) ────────────────────────────────────

/** A flat modifier applied to checks matching the selector. valuePerLevel is multiplied by condition value for valued conditions. */
export interface ConditionModifierEffect {
  readonly type: 'modifier'
  readonly selector: ConditionSelector
  readonly modifierType: ModifierType
  readonly valuePerLevel: number
  readonly fixed?: true
}

/** Grants (forces active) one or more conditions when the parent condition is active. */
// Source: Foundry VTT PF2e GrantItem Rule Element — Grabbed grants Off-Guard + Immobilized, etc.
export interface ConditionGrantEffect {
  readonly type: 'grant'
  readonly grants: ConditionSlug[]
}

/** Reduces max HP and current HP when condition is gained/increased. */
// Source: AON Drained condition — HP loss = max(1, creature.level) * conditionValue
// HP loss = conditionValue * max HP reduction
export interface ConditionDrainedHpEffect {
  readonly type: 'drained-hp'
  // HP loss = max(1, creature.level) * conditionValue
  // Max HP reduction = same amount
}

export type ConditionEffect =
  | ConditionModifierEffect
  | ConditionGrantEffect
  | ConditionDrainedHpEffect

// ─── CONDITION_EFFECTS Map (D-01, D-02, D-05) ────────────────────────────────
// Complete map of condition slugs to their mechanical effects.
// Conditions not in this map have no mechanical effect tracked by the engine
// (purely narrative conditions: broken, controlled, cursebound, fleeing, etc.)
//
// Source: refs/pf2e/conditions/frightened.json    — FlatModifier: all, status, -1/level
// Source: refs/pf2e/conditions/sickened.json      — FlatModifier: all, status, -1/level
// Source: refs/pf2e/conditions/clumsy.json        — FlatModifier: dex-based, status, -1/level
// Source: refs/pf2e/conditions/enfeebled.json     — FlatModifier: str-based+str-damage, status, -1/level
// Source: refs/pf2e/conditions/stupefied.json     — FlatModifier: cha/int/wis-based, status, -1/level
// Source: refs/pf2e/conditions/drained.json       — FlatModifier: con-based, status, -1/level + HP reduction
// Source: refs/pf2e/conditions/blinded.json       — FlatModifier: perception, status, -4 (fixed)
// Source: refs/pf2e/conditions/unconscious.json   — FlatModifier: ac+perception+reflex, status, -4 (fixed) + GrantItem
// Source: refs/pf2e/conditions/grabbed.json       — GrantItem: off-guard + immobilized
// Source: refs/pf2e/conditions/dying.json         — GrantItem: unconscious
// Source: refs/pf2e/conditions/paralyzed.json     — GrantItem: off-guard
// Source: refs/pf2e/conditions/restrained.json    — GrantItem: off-guard + immobilized
// Source: refs/pf2e/conditions/off-guard.json     — FlatModifier: ac, circumstance, -2 (fixed)

export const CONDITION_EFFECTS: Partial<Record<ConditionSlug, readonly ConditionEffect[]>> = {
  frightened: [
    { type: 'modifier', selector: 'all', modifierType: 'status', valuePerLevel: -1 },
  ],
  sickened: [
    { type: 'modifier', selector: 'all', modifierType: 'status', valuePerLevel: -1 },
  ],
  clumsy: [
    { type: 'modifier', selector: 'dex-based', modifierType: 'status', valuePerLevel: -1 },
  ],
  enfeebled: [
    // Str-based: athletics + melee strikes (virtual slug melee-strike-attack).
    // str-damage handled by damage system; melee-strike-attack resolved via default
    // exact-match branch in selector-resolver.
    { type: 'modifier', selector: ['str-based', 'str-damage', 'melee-strike-attack'], modifierType: 'status', valuePerLevel: -1 },
  ],
  stupefied: [
    { type: 'modifier', selector: ['cha-based', 'int-based', 'wis-based'], modifierType: 'status', valuePerLevel: -1 },
  ],
  drained: [
    { type: 'modifier', selector: 'con-based', modifierType: 'status', valuePerLevel: -1 },
    { type: 'drained-hp' },
  ],
  blinded: [
    { type: 'modifier', selector: 'perception', modifierType: 'status', valuePerLevel: -4, fixed: true },
  ],
  unconscious: [
    { type: 'modifier', selector: ['ac', 'perception', 'reflex'], modifierType: 'status', valuePerLevel: -4, fixed: true },
    { type: 'grant', grants: ['blinded', 'off-guard', 'prone'] },
  ],
  grabbed: [
    { type: 'grant', grants: ['off-guard', 'immobilized'] },
  ],
  dying: [
    { type: 'grant', grants: ['unconscious'] },
  ],
  paralyzed: [
    { type: 'grant', grants: ['off-guard'] },
  ],
  restrained: [
    { type: 'grant', grants: ['off-guard', 'immobilized'] },
  ],
  'off-guard': [
    { type: 'modifier', selector: 'ac', modifierType: 'circumstance', valuePerLevel: -2, fixed: true },
  ],
}

// ─── CONDITION_OVERRIDES Map (D-07) ──────────────────────────────────────────
// When a condition is active, it overrides (suppresses) the listed conditions.
// Source: refs/pf2e/conditions/blinded.json       — system.overrides: ["dazzled"]
// Source: refs/pf2e/conditions/stunned.json       — system.overrides: ["slowed"]
// Source: refs/pf2e/conditions/hostile.json       — system.overrides: ["unfriendly", "indifferent", "friendly", "helpful"]
// Source: refs/pf2e/conditions/unfriendly.json    — system.overrides: ["hostile", "indifferent", "friendly", "helpful"]
// Source: refs/pf2e/conditions/indifferent.json   — system.overrides: ["hostile", "unfriendly", "friendly", "helpful"]
// Source: refs/pf2e/conditions/friendly.json      — system.overrides: ["hostile", "unfriendly", "indifferent", "helpful"]
// Source: refs/pf2e/conditions/helpful.json       — system.overrides: ["hostile", "unfriendly", "indifferent", "friendly"]

export const CONDITION_OVERRIDES: Partial<Record<ConditionSlug, ConditionSlug[]>> = {
  blinded:     ['dazzled'],
  stunned:     ['slowed'],
  hostile:     ['unfriendly', 'indifferent', 'friendly', 'helpful'],
  unfriendly:  ['hostile', 'indifferent', 'friendly', 'helpful'],
  indifferent: ['hostile', 'unfriendly', 'friendly', 'helpful'],
  friendly:    ['hostile', 'unfriendly', 'indifferent', 'helpful'],
  helpful:     ['hostile', 'unfriendly', 'indifferent', 'friendly'],
}

// ─── Extended Condition Groups (D-06) ────────────────────────────────────────
// Extends the base CONDITION_GROUPS in conditions.ts with 3 additional groups.
// Note: abilities, senses, and death groups are informational only — NOT mutually exclusive (D-08, D-09).
// Source: PF2e CRB — condition categorization + Foundry VTT PF2e ConditionGroup type

export const CONDITION_GROUPS_EXTENDED: Record<string, ConditionSlug[]> = {
  detection:  ['observed', 'hidden', 'undetected', 'unnoticed'],
  attitudes:  ['hostile', 'unfriendly', 'indifferent', 'friendly', 'helpful'],
  senses:     ['blinded', 'concealed', 'dazzled', 'deafened', 'invisible'],
  abilities:  ['clumsy', 'cursebound', 'drained', 'enfeebled', 'stupefied'],
  death:      ['doomed', 'dying', 'unconscious', 'wounded'],
}

// ─── Exclusive Groups (D-08, D-09, D-10) ─────────────────────────────────────
// Only detection and attitudes enforce mutual exclusivity.
// abilities: NOT exclusive — clumsy/drained/enfeebled/stupefied affect different ability scores (D-08)
// senses: NOT fully exclusive — override behavior is driven by overrides field, not group membership (D-09)
// death: NOT exclusive — multiple death-related conditions can coexist

export const EXCLUSIVE_GROUPS = new Set(['detection', 'attitudes'])
