# Spell Slot Customization for NPC Spellcasters

**Date:** 2026-04-03
**Status:** Design approved (pending spec review + implementation plan)

## Summary

Allow GMs to add/remove spell slots and spells on NPC spellcasters in encounter context. Different behavior for prepared vs spontaneous casters. Spells filtered by caster's tradition. Meme warnings for exceeding limits.

## Data Model

**New table:**
```sql
encounter_slot_overrides (
  encounter_id TEXT,
  combatant_id TEXT,
  entry_id     TEXT,
  rank         INTEGER,   -- 0-10
  slot_delta   INTEGER,   -- +N / -N from base
  PRIMARY KEY (encounter_id, combatant_id, entry_id, rank)
)
```

- Final slots = `Math.max(0, baseSlots + delta)`
- Delta=0 → row deleted (no override)
- Reset via `DELETE FROM encounter_slot_overrides WHERE encounter_id = ?` in `resetEncounterCombat()`

**API (shared/api/encounters.ts):**
- `saveSlotOverride(encounterId, combatantId, entryId, rank, delta)` — upsert, deletes if delta=0
- `loadSlotOverrides(encounterId, combatantId)` — all overrides for combatant

**Existing tables unchanged:**
- `encounter_combatant_spells` — spell add/remove overrides (already works)
- `encounter_spell_slots` — used pip tracking (already works)

## Caster Progression Detection (Engine)

```ts
type CasterProgression = 'full' | 'bounded' | 'unknown'

function detectCasterProgression(
  creatureLevel: number,
  maxSlotRank: number  // highest rank with slots > 0 (excluding rank 0)
): CasterProgression
```

- **Full caster:** max rank = `ceil(level / 2)` — match if maxSlotRank within ±1
- **Bounded caster:** max rank = `min(5, ceil(level / 4))` — match if equal
- **Unknown:** neither formula matches (homebrew)

`getMaxRecommendedRank(level, progression)` — returns recommended max rank.

**Purely advisory** — shown as tooltip on `HelpCircle` icon next to spellcasting header badge.

## UI Changes (SpellcastingBlock)

### ± Buttons next to slot pips

For each rank (including rank 0 cantrips), when `encounterContext` exists:
- `−` button left of pips (disabled if total ≤ 0)
- `+` button right of pips
- Custom-added pips: `border-dashed` or different color to distinguish from base

### Prepared vs Spontaneous behavior on `+`:
- **Prepared:** `+` adds pip + auto-focuses AddSpellRow (each slot = specific spell)
- **Spontaneous:** `+` adds pip only. Known spells managed separately via AddSpellRow

### AddSpellRow — tradition filtering:
- New prop `tradition?: string`
- Passes to `searchSpells(query, rank, tradition)` (3rd param already exists in API)
- Focus entries: filter by tradition, warn if spell outside tradition
- Innate entries: no tradition filter (innate can be any tradition)

### Adding new ranks:
- Button "+ Add rank N" below last rank (N = next after existing)
- Creates slot override with delta=1 on new rank (base=0)
- Warning if N > recommended max rank

### Info icon on section header:
- `HelpCircle` icon next to "arcane prepared" badge
- Tooltip: "Full caster (arcane prepared) — max rank 5 at level 10"

## Meme Warnings

- **Rank exceeds recommended max:** "May Pharasma save your soul, fool."
- **Focus spell outside tradition:** "Pharasma is already preparing your grave. Bold choice."
- **Rank 9-10 on low-level NPC:** "A level 3 kobold with 9th rank spells? Sure. Your table, your funeral."
- **Removing last slot of a rank:** "Slot removed. The wizard inside is crying."

## Data Flow

**Load (stat card opens in encounter):**
1. `loadSlotOverrides(encounterId, combatantId)` → `Record<entryId, Record<rank, delta>>`
2. `loadSpellOverrides(...)` → existing flow
3. `loadSpellSlots(...)` → existing flow
4. Final pips per rank = `Math.max(0, baseSlots + delta)`

**Change slots (+ / −):**
1. `delta += 1` or `delta -= 1`
2. `saveSlotOverride(encounterId, combatantId, entryId, rank, delta)` — deletes row if delta=0
3. Local state updates, pips re-render
4. For prepared + add: auto-focus AddSpellRow

**Add new rank:**
1. Slot override with `delta = 1` on new rank (base = 0)
2. New rank section appears with 1 pip
3. AddSpellRow immediately available

**Reset encounter:**
```sql
DELETE FROM encounter_slot_overrides WHERE encounter_id = ?
```
Added to `resetEncounterCombat()` alongside existing cleanup.

## Bug Fixes (already applied in this session)

1. **Cantrip rank bug** (`sync.ts`): Cantrips stored as rank 1 instead of rank 0. Fixed by checking `cantrip` trait → rank_prepared = 0.
2. **Spellcasting entry ID collision** (`sync.ts`): Entry `id` used raw Foundry `_id` (not globally unique). Fixed to `${entity.id}:${it._id}` matching spell_lists pattern. Affected 20+ creatures.
3. **Initiative not rolled on encounter load** (`encounter-persistence.ts`): NPCs loaded with initiative=0. Fixed to roll initiative using creature perception.
4. **IWR not applied on encounter load** (`encounter-persistence.ts`): Combatants created without IWR data. Fixed to fetch creature rows and populate IWR fields.
