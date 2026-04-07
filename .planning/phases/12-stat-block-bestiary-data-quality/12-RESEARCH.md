# Phase 12: Stat Block + Bestiary Data Quality — Research

**Researched:** 2026-04-02
**Requirements:** STAT-01, STAT-02, BEST-04

---

## Summary

Three independent data quality improvements, each with a clear and bounded implementation path. No new architecture or new pages. Two plans: stat block display (STAT-01 + STAT-02) and data pipeline (BEST-04 + @Localize sync preprocessing). Fully parallel Wave 1.

---

## STAT-01: @-syntax Token Rendering

### Current state
- `toCreatureStatBlockData()` at `src/entities/creature/model/mappers.ts:24` maps all Foundry data to display types.
- `stripHtml()` at line 146 strips HTML tags and entities but does NOT handle Foundry `@Token` syntax.
- Two call sites:
  - Line 71: `description: stripHtml(item.system?.description?.value || '')` — ability descriptions
  - Line 90: `const description = stripHtml(details.publicNotes || ...)` — creature publicNotes

### Implementation: resolveFoundryTokens()

Add a `resolveFoundryTokens(text: string): string` function in `mappers.ts`. Call it **before** `stripHtml()`:
```
description: stripHtml(resolveFoundryTokens(item.system?.description?.value || ''))
const description = stripHtml(resolveFoundryTokens(details.publicNotes || ...))
```

**Token patterns and output (from CONTEXT.md decisions D-01 to D-05):**

| Token | Pattern | Output |
|-------|---------|--------|
| `@UUID[Compendium.pf2e.X.Item.Y]{alias}` | alias present | alias text |
| `@UUID[Compendium.pf2e.X.Item.Enfeebled]` | no alias | `Enfeebled` (last path segment) |
| `@Damage[9d10[untyped]]` | single type | `9d10 untyped` |
| `@Damage[2d6[fire], 1d4[bleed]]` | multiple | `2d6 fire plus 1d4 bleed` |
| `@Check[type:perception\|dc:20]` | with DC | `DC 20 Perception check` |
| `@Check[type:will\|dc:25]` | with DC | `DC 25 Will check` |
| `@Template[type:cone\|distance:15]` | cone | `15-foot cone` |
| `@Template[type:emanation\|distance:30]` | emanation | `30-foot emanation` |
| `@Localize[PF2E.NPC.Abilities.Glossary.X]` | resolved at sync time | strip token (fallback) |

**Regex implementation notes:**

```typescript
// @UUID with alias
text.replace(/@UUID\[[^\]]*\]\{([^}]+)\}/g, '$1')
// @UUID without alias — extract last path segment
text.replace(/@UUID\[([^\]]+)\]/g, (_, path) => {
  const parts = path.split('.')
  return parts[parts.length - 1]
})
// @Damage — parse [{formula}[{type}], ...] inside brackets
// Inner content: "9d10[untyped]" or "2d6[fire], 1d4[bleed]"
text.replace(/@Damage\[([^\]]+(?:\[[^\]]*\])*[^\]]*)\]/g, (_, inner) => {
  // inner = "9d10[untyped]" or "2d6[fire], 1d4[bleed]"
  // Split on "," then parse each "formula[type]"
  ...
})
// @Check — key|value pairs
text.replace(/@Check\[([^\]]+)\]/g, (_, inner) => {
  const params = Object.fromEntries(inner.split('|').map(p => p.split(':')))
  const type = (params.type || 'unknown').charAt(0).toUpperCase() + ...
  const dc = params.dc ? `DC ${params.dc} ` : ''
  return `${dc}${type} check`
})
// @Template
text.replace(/@Template\[([^\]]+)\]/g, (_, inner) => {
  const params = Object.fromEntries(inner.split('|').map(p => p.split(':')))
  return `${params.distance}-foot ${params.type}`
})
// @Localize fallback — strip (sync pipeline handles this at sync time)
text.replace(/@Localize\[[^\]]+\]/g, '')
```

**Note on @Damage regex:** The challenge is that `@Damage[2d6[fire]]` has nested brackets. The token ends at the OUTER closing bracket. Regex approach: match `@Damage[` then greedily capture until we've balanced brackets or use a simpler approach — capture everything up to the last `]` that closes the outer `[`:
```
/@Damage\[([^\[]+(?:\[[^\]]*\])*[^\[]*)\]/g
```
Or just capture up to `]` with a non-greedy match since the last closing bracket closes the `@Damage[...]` context. Actually the cleanest approach is to manually parse: find `@Damage[`, then scan forward counting brackets to find the matching close.

A simpler working regex for well-formed Foundry data:
```typescript
text.replace(/@Damage\[([^\]]*(?:\[[^\]]*\][^\]]*)*)\]/g, (_, inner) => {
  // inner = "9d10[untyped]" or "2d6[fire], 1d4[bleed]"
  const parts = inner.split(/,\s*/).map(part => {
    const m = part.trim().match(/^(.+?)\[(.+?)\]$/)
    return m ? `${m[1]} ${m[2]}` : part.trim()
  })
  return parts.join(' plus ')
})
```

### @Localize at sync time

**Decision D-05:** @Localize keys are resolved before writing to SQLite. Not at render time.

**Implementation in `src/shared/api/sync.ts` `syncFoundryData()`:**

1. After `invoke<RawEntity[]>('sync_foundry_data', ...)` returns entities:
2. Download en.json from GitHub raw URL: `https://raw.githubusercontent.com/foundryvtt/pf2e/v13-dev/static/lang/en.json`
3. Parse as JSON. The file is a NESTED object. Keys like `PF2E.NPC.Abilities.Glossary.ShieldBlock` are accessed via dot path traversal.
4. For each entity, replace `@Localize[KEY]` patterns in `raw_json` before passing to `batchInsertEntities`.

**Dot-path traversal helper:**
```typescript
function getNestedValue(obj: Record<string, unknown>, dotPath: string): string | undefined {
  const parts = dotPath.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}
```

**Substitution in `batchInsertEntities` or inline in `syncFoundryData`:**
```typescript
const resolveLocalize = (rawJson: string, enJson: Record<string, unknown>): string =>
  rawJson.replace(/@Localize\[([^\]]+)\]/g, (_, key) =>
    getNestedValue(enJson, key) ?? ''
  )
```

**Performance note:** 28K entities × string replace. Acceptable for a one-time sync operation. en.json is ~2-3MB downloaded once per sync.

**Error handling:** If en.json download fails, log warning and continue without @Localize substitution (raw tokens remain in DB, stripped by `resolveFoundryTokens` fallback at display time).

---

## STAT-02: All 17 Skills

### Current state (mappers.ts lines 75-82)
```typescript
const skillsObj = system.skills || {}
const skills = Object.entries(skillsObj)
  .filter(([, v]: [string, any]) => v && typeof v.base === 'number' && v.base > 0)
  .map(([name, v]: [string, any]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    modifier: v.base ?? 0,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))
```
Only renders skills explicitly in Foundry data with base > 0. Missing skills are hidden.

### New implementation

**Types.ts change:** Add `calculated?: boolean` to skills array item type:
```typescript
// BEFORE:
skills: { name: string; modifier: number }[]
// AFTER:
skills: { name: string; modifier: number; calculated?: boolean }[]
```

**Mappers.ts new skills block:**
```typescript
const STANDARD_SKILLS = [
  'acrobatics', 'arcana', 'athletics', 'crafting', 'deception',
  'diplomacy', 'intimidation', 'medicine', 'nature', 'occultism',
  'performance', 'religion', 'society', 'stealth', 'survival', 'thievery',
]

const skillsObj = system.skills || {}
// Build map of explicitly rated skills from Foundry data
const foundrySkills = new Map<string, number>(
  Object.entries(skillsObj)
    .filter(([, v]: [string, any]) => v && typeof v.base === 'number')
    .map(([k, v]: [string, any]) => [k, v.base as number])
)

// 17 standard skills — use Foundry value if present, else calculate from level
const standardSkills = STANDARD_SKILLS.map((key) => ({
  name: key.charAt(0).toUpperCase() + key.slice(1),
  modifier: foundrySkills.has(key) ? foundrySkills.get(key)! : base.level,
  calculated: !foundrySkills.has(key),
}))

// Lore skills — any Foundry keys not in STANDARD_SKILLS
const loreSkills = Object.entries(skillsObj)
  .filter(([k, v]: [string, any]) => !STANDARD_SKILLS.includes(k) && v && typeof v.base === 'number')
  .map(([k, v]: [string, any]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    modifier: v.base as number,
    calculated: false,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

const skills = [...standardSkills, ...loreSkills]
```

**Note:** `base.level` is available because `toCreatureStatBlockData` calls `toCreature(row)` first (line 25) and assigns `const base = toCreature(row)`. D-07 says untrained modifier = `level + 0`.

### UI change (CreatureStatBlock.tsx)

Replace the skills section (lines 202-217) per UI-SPEC markup contract:
```tsx
{/* Skills — always rendered, all 17 standard skills */}
<div className="p-4">
  <h4 className="font-semibold mb-2">Skills</h4>
  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
    {creature.skills.map((skill) => (
      <span key={skill.name} className={skill.calculated ? "opacity-40" : ""}>
        <span className="text-muted-foreground">{skill.name}</span>{" "}
        <span className="font-mono text-primary">
          {skill.modifier >= 0 ? "+" : ""}{skill.modifier}
        </span>
      </span>
    ))}
  </div>
</div>
<Separator />
```

Key changes from current code:
- Remove `{creature.skills.length > 0 && (...)}` guard — always render
- Add `className={skill.calculated ? "opacity-40" : ""}` wrapper
- Change `+{skill.modifier}` to `{skill.modifier >= 0 ? "+" : ""}{skill.modifier}` to handle negatives correctly

---

## BEST-04: Source Names

### Architecture

Per D-09: add `source_name TEXT` column to `entities` table. Populated at sync time from `system.details.publication.title`. `fetchDistinctSources()` returns `{ pack, name }[]` pairs.

### Files and changes

**1. New migration: `src/shared/db/migrations/0007_source_name.sql`**
```sql
ALTER TABLE entities ADD COLUMN source_name TEXT;
```
Simple ALTER TABLE — SQLite supports adding nullable columns. No data backfill needed (will be populated on next sync).

**2. `src-tauri/src/sync.rs`**

Add to `RawEntity` struct:
```rust
pub source_name: Option<String>,
```

Add to `extract_entity()` function (before the `Some(RawEntity { ... })` return):
```rust
let source_name = value
    .pointer("/system/details/publication/title")
    .and_then(|v| v.as_str())
    .filter(|s| !s.is_empty())
    .map(|s| s.to_string());
```

Add `source_name` to the `RawEntity { ... }` struct literal at the bottom of `extract_entity`.

**3. `src/shared/api/sync.ts` — RawEntity interface + batchInsertEntities**

Add to `RawEntity` interface:
```typescript
source_name: string | null
```

Update `batchInsertEntities`:
- Placeholders: `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` (16 `?` placeholders)
- values flatMap: add `e.source_name` after `e.raw_json`
- INSERT column list: add `source_name` after `raw_json`

Full updated INSERT statement:
```sql
INSERT OR REPLACE INTO entities (id, name, type, level, hp, ac, fort, ref, will, perception, traits, rarity, size, source_pack, raw_json, source_name) VALUES ${placeholders}
```

**4. `src/shared/api/creatures.ts`**

Add to `CreatureRow` interface:
```typescript
source_name: string | null
```

Update `fetchDistinctSources()`:
```typescript
export async function fetchDistinctSources(): Promise<{ pack: string; name: string }[]> {
  const db = await getDb()
  const rows = await db.select<{ source_pack: string; source_name: string | null }[]>(
    "SELECT DISTINCT source_pack, source_name FROM entities WHERE type = 'npc' AND source_pack IS NOT NULL ORDER BY source_pack"
  )
  return rows.map(r => ({
    pack: r.source_pack,
    name: r.source_name ?? r.source_pack,
  }))
}
```

Fallback: if `source_name` is null (no publication.title in data, or pre-migration data), use `source_pack` as display name. Covers D-11 fallback requirement.

**5. `src/features/bestiary-browser/ui/BestiaryFilterBar.tsx`**

Per UI-SPEC markup contract:
```tsx
// State type change (line 27):
const [sources, setSources] = useState<{ pack: string; name: string }[]>([])

// SelectItem rendering change (lines 113-115):
{sources.map((s) => (
  <SelectItem key={s.pack} value={s.pack}>
    {s.name}
  </SelectItem>
))}
```

No other changes. `filters.source` remains a `source_pack` string. Filter query unchanged.

---

## Plan Structure

**Plan 01 (Wave 1): Stat block display — STAT-01 + STAT-02**
- `src/entities/creature/model/types.ts`
- `src/entities/creature/model/mappers.ts`
- `src/entities/creature/ui/CreatureStatBlock.tsx`

**Plan 02 (Wave 1): Data pipeline — BEST-04 + @Localize sync**
- `src/shared/db/migrations/0007_source_name.sql` (NEW)
- `src-tauri/src/sync.rs`
- `src/shared/api/sync.ts`
- `src/shared/api/creatures.ts`
- `src/features/bestiary-browser/ui/BestiaryFilterBar.tsx`

The two plans touch completely disjoint file sets — fully parallel Wave 1.

---

## ## RESEARCH COMPLETE
