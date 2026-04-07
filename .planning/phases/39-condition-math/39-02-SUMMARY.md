---
phase: 39-condition-math
plan: 02
status: complete
commit: ea46796c
---

# Plan 39-02 Summary

## What was built

**src/entities/creature/ui/CreatureStatBlock.tsx** (modified)
- Added imports: `useModifiedStats`, `useSpellModifiers`, `StatModifierResult`
- Added `allStatSlugs` memo: real slugs + `'strike-attack'` + `'spell-dc'` virtuals + skill slugs
- Added `modStats = useModifiedStats(encounterContext?.combatantId, allStatSlugs)`
- **StatItem enhanced**: new `modResult?: StatModifierResult` prop; color override
  (text-pf-blood / text-pf-threat-low / original colorClass); Tooltip breakdown when
  modifiers.length > 0; displays `base + netModifier`, DC updates too
- **Core stats** (AC, Fort, Ref, Will, Perception): `modResult={modStats.get(slug)}`
- **Spell DC / Class DC** (stats bar): inline modified display with optional Tooltip
- **Skills**: map → `finalMod = skill.modifier + net`; button color + updated roll formula;
  wrapped in Tooltip when conditions active
- **Strikes**: `modifiedMod = strike.modifier + strikeNet`; MAP uses modifiedMod;
  attack button with color + tooltip; roll formula updated
- **SpellcastingBlock**: `useSpellModifiers(combatantId, section.tradition)`;
  spell DC and spell attack both show modified values with tooltip

**src/widgets/initiative-list/ui/InitiativeRow.tsx** (modified)
- Added `stunnedCondition` derivation before render
- `⚡{N}` badge (`bg-amber-900/60 text-amber-200 border border-amber-600/50`) rendered
  inline between Skull/User icon and combatant name when stunned.value > 0

## Verification
- `npx tsc --noEmit`: 0 new errors (2 pre-existing unrelated errors unchanged)
- No visual change when no conditions active (empty Map → all netMod=0 → original colors)
