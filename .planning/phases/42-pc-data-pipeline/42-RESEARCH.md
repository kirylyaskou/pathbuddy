# Phase 42: PC Data Pipeline — Research

**Date:** 2026-04-06
**Phase:** PC Data Pipeline
**Question answered:** What do I need to know to PLAN this phase well?

---

## RESEARCH COMPLETE

---

## 1. Pathbuilder 2e JSON Export Structure

The Pathbuilder 2e app exports a JSON file with this top-level shape:

```json
{
  "success": true,
  "build": {
    "name": "Aldric Stonebrow",
    "class": "Fighter",
    "ancestry": "Dwarf",
    "heritage": "Strong-blooded Dwarf",
    "background": "Warrior",
    "alignment": "NG",
    "gender": "Male",
    "age": "52",
    "deity": "",
    "level": 5,
    "attributes": {
      "ancestryhp": 10,
      "classhp": 10,
      "bonushp": 0,
      "bonushpPerLevel": 0,
      "speed": 20,
      "speedBonus": 0
    },
    "abilities": {
      "str": 18,
      "dex": 14,
      "con": 16,
      "int": 10,
      "wis": 12,
      "cha": 10
    },
    "proficiencies": {
      "classDC": 4,
      "perception": 4,
      "fortitude": 4,
      "reflex": 2,
      "will": 2,
      "heavy": 4,
      "medium": 4,
      "light": 4,
      "unarmored": 4,
      "advanced": 4,
      "martial": 4,
      "simple": 4,
      "unarmed": 4,
      "castingArcane": 0,
      "castingDivine": 0,
      "castingOccult": 0,
      "castingPrimal": 0
    },
    "skills": [
      { "name": "Athletics", "proficiency": 4, "ability": "str" },
      { "name": "Intimidation", "proficiency": 2, "ability": "cha" }
    ],
    "feats": [
      ["Power Attack", "", "", 1, ""],
      ["Shield Block", "", "", 1, ""]
    ],
    "specials": [
      ["Attack of Opportunity", 1, ""]
    ],
    "lores": [
      ["Warfare Lore", 2]
    ],
    "equipment": [
      ["Full Plate", "armor", 1],
      ["Longsword", "weapon", 1]
    ],
    "spellCasters": [],
    "focusPoints": 0,
    "focus": {},
    "mods": {},
    "formula": [],
    "acTotal": { "acProfBonus": 4, "acAbilityBonus": 2, "acItemBonus": 6 },
    "pets": [],
    "languages": ["Common", "Dwarven"],
    "resistances": [],
    "traits": []
  }
}
```

### Critical parsing notes:
- Top-level wrapper: `{ success: boolean; build: PathbuilderBuild }` — always extract `export.build`
- `attributes.ancestryhp` — ancestry HP contribution (flat, level-independent)
- `attributes.classhp` — class HP per level
- `attributes.bonushp` — flat bonus HP per level (e.g., from Toughness feat: +1/level)
- `abilities.con` — raw CON score (not modifier); `CON_mod = Math.floor((con - 10) / 2)`
- `feats` — array of arrays `[name, source, type, level, note]`
- `specials` — array of arrays `[name, level, note]`
- `skills` — array of `{ name, proficiency, ability }`
- `spellCasters` — array of spellcasting entries (name varies: "Prepared Arcane", "Spontaneous Divine", etc.)
- `equipment` — array of arrays `[name, category, quantity]`

### HP Calculation Verification:
For the example above (Fighter 5, CON 16):
- CON_mod = Math.floor((16 - 10) / 2) = 3
- Max HP = 10 + (10 + 0 + 3) × 5 = 10 + 65 = 75 ✓

---

## 2. PathbuilderBuild Type Coverage (Phase 44 readiness)

CONTEXT.md D-04 requires the type to cover skills, equipment, spells, feats, specials, mods for Phase 44. Full type definition needed:

```typescript
// engine/pc/types.ts

export interface PathbuilderAbilities {
  str: number; dex: number; con: number
  int: number; wis: number; cha: number
}

export interface PathbuilderAttributes {
  ancestryhp: number
  classhp: number
  bonushp: number
  bonushpPerLevel: number
  speed: number
  speedBonus: number
}

export interface PathbuilderProficiencies {
  classDC: number
  perception: number
  fortitude: number; reflex: number; will: number
  heavy: number; medium: number; light: number; unarmored: number
  advanced: number; martial: number; simple: number; unarmed: number
  castingArcane: number; castingDivine: number
  castingOccult: number; castingPrimal: number
}

export interface PathbuilderSkill {
  name: string
  proficiency: number  // 0=untrained, 2=trained, 4=expert, 6=master, 8=legendary
  ability: string      // e.g., "str", "dex"
  lore?: boolean
}

export interface PathbuilderSpellEntry {
  name: string
  magicTradition: string      // 'arcane' | 'divine' | 'occult' | 'primal'
  spellcastingType: string    // 'prepared' | 'spontaneous' | 'focus'
  ability: string
  proficiency: number
  focusPoints?: number
  spells: Array<{ spellLevel: number; list: string[] }>
  perDay: number[]
}

export interface PathbuilderBuild {
  name: string
  class: string
  ancestry: string
  heritage: string
  background: string
  alignment: string
  gender: string
  age: string
  deity: string
  level: number
  abilities: PathbuilderAbilities
  attributes: PathbuilderAttributes
  proficiencies: PathbuilderProficiencies
  skills: Array<{ name: string; proficiency: number; ability: string }>
  lores: Array<[string, number]>           // [name, proficiency]
  feats: Array<[string, string, string, number, string]>  // [name, source, type, level, note]
  specials: Array<[string, number, string]>               // [name, level, note]
  equipment: Array<[string, string, number]>              // [name, category, qty]
  spellCasters: PathbuilderSpellEntry[]
  focusPoints: number
  focus: Record<string, unknown>
  mods: Record<string, unknown>
  formula: unknown[]
  languages: string[]
  resistances: unknown[]
  traits: string[]
  acTotal: { acProfBonus: number; acAbilityBonus: number; acItemBonus: number }
  pets: unknown[]
}

export interface PathbuilderExport {
  success: boolean
  build: PathbuilderBuild
}
```

---

## 3. SQLite Upsert Strategy

**Important**: `INSERT OR REPLACE` deletes the old row and reinserts (new rowid, `created_at` resets, `id` changes). This violates CONTEXT.md D-08 ("обновляются все поля кроме `id` и `created_at`").

**Correct approach** — SQLite `ON CONFLICT` clause:

```sql
INSERT INTO characters (id, name, class, level, ancestry, raw_json, notes, created_at)
VALUES (?, ?, ?, ?, ?, ?, '', datetime('now'))
ON CONFLICT(name) DO UPDATE SET
  class = excluded.class,
  level = excluded.level,
  ancestry = excluded.ancestry,
  raw_json = excluded.raw_json
```

This preserves the original `id` and `created_at` on re-import. Available in SQLite 3.24+ (supported in Tauri 2 bundled SQLite).

---

## 4. Migration File

File: `src/shared/db/migrations/0021_characters.sql`

```sql
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  class TEXT,
  level INTEGER,
  ancestry TEXT,
  raw_json TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Auto-picked up by `import.meta.glob('./migrations/*.sql', { eager: true, query: '?raw' })` in `migrate.ts` — no code changes needed in `migrate.ts`.

---

## 5. API Implementation Pattern

Based on `encounters.ts` and `creatures.ts`:

```typescript
// src/shared/api/characters.ts
import { getDb } from '@/shared/db'
import type { PathbuilderBuild } from '@engine'

export interface CharacterRecord {
  id: string
  name: string
  class: string | null
  level: number | null
  ancestry: string | null
  rawJson: string
  notes: string
  createdAt: string
}

// Map DB row (snake_case) → TypeScript record (camelCase)
function rowToRecord(r: {
  id: string; name: string; class: string | null; level: number | null;
  ancestry: string | null; raw_json: string; notes: string; created_at: string
}): CharacterRecord {
  return {
    id: r.id,
    name: r.name,
    class: r.class,
    level: r.level,
    ancestry: r.ancestry,
    rawJson: r.raw_json,
    notes: r.notes,
    createdAt: r.created_at,
  }
}

export async function getAllCharacters(): Promise<CharacterRecord[]>
export async function getCharacterById(id: string): Promise<CharacterRecord | null>
export async function upsertCharacter(build: PathbuilderBuild): Promise<string>  // returns id
export async function deleteCharacter(id: string): Promise<void>
export async function updateCharacterNotes(id: string, notes: string): Promise<void>
```

---

## 6. Engine Module Structure

New directory: `engine/pc/`

```
engine/pc/
  types.ts   — PathbuilderAbilities, PathbuilderAttributes, ..., PathbuilderBuild, PathbuilderExport
  hp.ts      — calculatePCMaxHP(build: PathbuilderBuild): number
```

No `engine/pc/index.ts` — per engine barrel convention (D-02 in engine/index.ts comment), all exports go through `engine/index.ts`.

Additions to `engine/index.ts`:
```typescript
// ── PC ────────────────────────────────────────────────────────────────────────
export type { PathbuilderAbilities, PathbuilderAttributes, PathbuilderProficiencies,
              PathbuilderSkill, PathbuilderSpellEntry, PathbuilderBuild, PathbuilderExport
} from './pc/types'
export { calculatePCMaxHP } from './pc/hp'
```

---

## 7. Plan Structure Recommendation

**Wave 1 — Engine (no deps)**
- Plan 01: `engine/pc/types.ts` + `engine/pc/hp.ts` + update `engine/index.ts`

**Wave 2 — Data layer (depends on Wave 1 types)**
- Plan 02: `0021_characters.sql` migration + `src/shared/api/characters.ts` + update `src/shared/api/index.ts`

Sequential ordering required: Plan 02 imports `PathbuilderBuild` from `@engine`, so types must exist first.

---

## 8. Verification Approach

1. `engine/pc/hp.ts` — unit-verifiable: `calculatePCMaxHP({ level: 5, abilities: { con: 16 }, attributes: { ancestryhp: 10, classhp: 10, bonushp: 0 } })` should return `75`
2. Migration: `SELECT * FROM characters` after app init — table exists
3. `upsertCharacter` — call twice with same name → same id, updated fields
4. `getAllCharacters` — returns typed array
5. `shared/api/index.ts` includes `export * from './characters'`
6. `engine/index.ts` exports `calculatePCMaxHP` and `PathbuilderBuild`

---

## 9. Risk / Gotchas

| Risk | Mitigation |
|------|-----------|
| `INSERT OR REPLACE` changes `id`/`created_at` | Use `ON CONFLICT(name) DO UPDATE SET` instead |
| Pathbuilder `feats`/`specials` are arrays of arrays, not objects | Define as `Array<[string, ...]>` tuples |
| `bonushpPerLevel` vs `bonushp` confusion | Formula uses `bonushp` (per-level value already); `bonushpPerLevel` appears redundant in real exports |
| Engine has no `pc/` directory yet | Create `engine/pc/` with both files |
| No test harness | Verify HP formula manually with known character values |
