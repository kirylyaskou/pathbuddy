import type { ActionOutcomeMap } from './types'

// ─── Action Outcome Descriptors (D-03, D-04) ────────────────────────────────
// Hand-coded outcome maps for ~40 combat-relevant actions. Foundry stores outcomes
// as HTML prose, not structured data, so these are manually transcribed from the
// PF2e Player Core / GM Core rules.
//
// Keyed by action slug. Only combat-relevant actions have entries here — data-only
// actions (Stride, Step, Interact, etc.) are intentionally excluded.

export const ACTION_OUTCOMES: Record<string, ActionOutcomeMap> = {
  // ─── Basic Combat Actions ──────────────────────────────────────────────────

  strike: {
    critical_success: { damage: 'double', effect: 'Deal double damage.' },
    success: { effect: 'Deal normal damage.' },
  },

  escape: {
    critical_success: {
      effect: 'Free from all restraints. Can Step or Stride.',
    },
    success: {
      effect:
        'Free from one effect imposing grabbed, immobilized, or restrained.',
    },
    critical_failure: {
      effect: 'Cannot attempt to Escape again until next turn.',
    },
  },

  aid: {
    critical_success: {
      effect:
        'Target gains +2 circumstance bonus (or +3/+4 if expert/master/legendary).',
    },
    success: { effect: 'Target gains +1 circumstance bonus.' },
    critical_failure: { effect: 'Target gains -1 circumstance penalty.' },
  },

  'raise-a-shield': {
    success: {
      effect:
        'AC increases by shield bonus (+2 standard) until start of next turn.',
    },
  },

  'drop-prone': {
    success: {
      conditions: [{ slug: 'prone' }],
      effect: 'You fall prone.',
    },
  },

  stand: {
    success: {
      effect:
        'You stand up from prone (costs 1 action, triggers reactions).',
    },
  },

  'take-cover': {
    success: {
      effect:
        'You gain +4 circumstance bonus to AC and Reflex saves against area effects, or +2 behind standard cover.',
    },
  },

  ready: {
    success: {
      effect:
        'You prepare to take a single action or free action as a reaction with a trigger you specify.',
    },
  },

  delay: {
    success: {
      effect:
        'Your initiative position changes to before the creature that is currently acting.',
    },
  },

  crawl: {
    success: { effect: 'While prone, Stride 5 feet.' },
  },

  seek: {
    critical_success: {
      effect:
        'If undetected/hidden, target becomes observed. Gain information about illusion.',
    },
    success: {
      effect:
        'If undetected, target becomes hidden. If hidden, target becomes observed.',
    },
  },

  'sense-motive': {
    critical_success: {
      effect: 'Determine true intentions and any magical auras.',
    },
    success: { effect: 'Gain a sense of their intentions.' },
    failure: { effect: 'Gain no information.' },
    critical_failure: {
      effect: 'You get a false impression of their intentions.',
    },
  },

  'grab-an-edge': {
    critical_success: { effect: 'You catch yourself with no damage.' },
    success: {
      effect:
        'You catch yourself but take bludgeoning damage equal to the fall.',
    },
    critical_failure: {
      effect: 'You fail to catch yourself and fall.',
    },
  },

  // ─── Skill-Based Combat Actions ────────────────────────────────────────────

  grapple: {
    critical_success: {
      conditions: [{ slug: 'restrained' }],
      effect:
        'Target is restrained until end of your next turn unless you Grapple to extend.',
    },
    success: {
      conditions: [{ slug: 'grabbed' }],
      effect:
        'Target is grabbed until end of your next turn unless you Grapple to extend.',
    },
    failure: {
      effect:
        'You fail to grab the target and release it if already grabbed.',
    },
    critical_failure: {
      effect:
        'Target can grab you or force you to fall prone.',
    },
  },

  trip: {
    critical_success: {
      conditions: [{ slug: 'prone' }],
      damage: '1d6 bludgeoning',
      effect: 'Target falls prone and takes 1d6 bludgeoning.',
    },
    success: {
      conditions: [{ slug: 'prone' }],
      effect: 'Target falls prone.',
    },
    critical_failure: {
      conditions: [{ slug: 'prone' }],
      effect: 'You fall prone.',
    },
  },

  demoralize: {
    critical_success: {
      conditions: [{ slug: 'frightened', value: 2 }],
    },
    success: {
      conditions: [{ slug: 'frightened', value: 1 }],
    },
  },

  feint: {
    critical_success: {
      conditions: [{ slug: 'off-guard' }],
      effect:
        'Target is off-guard to your melee attacks until end of your next turn.',
    },
    success: {
      conditions: [{ slug: 'off-guard' }],
      effect:
        'Target is off-guard to your next melee attack against it before end of your current turn.',
    },
    critical_failure: {
      conditions: [{ slug: 'off-guard' }],
      effect:
        'You are off-guard to that target until end of your next turn.',
    },
  },

  shove: {
    critical_success: {
      effect: 'Push target 10 feet. You can Stride after it.',
    },
    success: {
      effect: 'Push target 5 feet. You can Stride after it.',
    },
    critical_failure: {
      conditions: [{ slug: 'prone' }],
      effect: 'You fall prone.',
    },
  },

  disarm: {
    critical_success: {
      effect: 'Target drops held item to ground in its space.',
    },
    success: {
      effect:
        'Target takes -2 circumstance penalty to attacks and DCs with the item until start of your next turn.',
    },
    critical_failure: {
      conditions: [{ slug: 'off-guard' }],
      effect: 'You are off-guard until start of your next turn.',
    },
  },

  'tumble-through': {
    success: {
      effect:
        'Move through the enemy space, treating each square as difficult terrain.',
    },
    failure: {
      effect:
        'Your movement ends and you trigger reactions as if you moved out of the square.',
    },
  },

  steal: {
    success: {
      effect:
        'You take a small unattended or loosely held item from the target.',
    },
    failure: { effect: 'You fail to take the item.' },
    critical_failure: {
      effect: 'You fail and the target notices your attempt.',
    },
  },

  reposition: {
    critical_success: {
      effect: 'Move target 10 feet to a space within your reach.',
    },
    success: {
      effect: 'Move target 5 feet to a space within your reach.',
    },
    critical_failure: {
      effect: 'Target can reposition you 5 feet.',
    },
  },
}
