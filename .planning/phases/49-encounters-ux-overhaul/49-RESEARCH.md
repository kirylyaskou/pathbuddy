# Phase 49: Encounters UX Overhaul — Research

**Researched:** 2026-04-07
**Domain:** SQLite schema migration, React filter UI, Rust struct extension, FTS ORDER BY
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**ENC-01 — "New Encounter" button**
- Replace `<Button variant="ghost" size="icon">` (`w-5 h-5`) with `<Button variant="ghost" size="sm">` labelled `+ New Encounter`
- Inline input flow (type name → Enter/Blur) stays unchanged
- File: `src/features/encounter-builder/ui/SavedEncounterList.tsx`

**ENC-02 — Extended creature search filters**
- Collapsible "Filters" toggle below the search input, creatures tab only
- Default: collapsed
- Fields: level min/max, rarity chips (multi-select), family/type dropdown, traits combobox, source book dropdown
- Active filter count badge inline in button text as `Filters (N)`, color `text-primary`
- `creature_type` column: new, extracted from `/system/details/type/value` in Foundry JSON
- Migration strategy: non-destructive `ALTER TABLE entities ADD COLUMN creature_type TEXT` + `UPDATE ... SET creature_type = json_extract(raw_json, '$.system.details.type.value')`
- New API function: `fetchCreaturesFiltered(filters, limit, offset)` with `CreatureFilters` type including `creatureType?: string`, `rarity?: string[]` (multi-select array, not single string)
- New helper functions: `fetchDistinctCreatureTypes()`, `fetchDistinctCreatureSources()`

**ENC-03 — Sort by level ascending**
- Both browse and search modes: `ORDER BY e.level ASC, e.name ASC`
- Creatures tab only; hazards tab unchanged

### Claude's Discretion

None raised.

### Deferred Ideas (OUT OF SCOPE)

None raised.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENC-01 | User can create a new encounter via an explicit "New Encounter" button (not just "+") | SavedEncounterList.tsx current button identified; exact replacement spec in UI-SPEC and CONTEXT.md |
| ENC-02 | Creature search supports filtering by family, traits, and source book | creatures.ts already has partial filter infra; `creature_type` column absent from schema; migration pattern confirmed; ItemFilterPanel is direct reuse model |
| ENC-03 | Creature search results ordered by level ascending | Both `fetchCreatures` (ORDER BY name) and `searchCreatures` (ORDER BY rank) need updating; pattern: `ORDER BY e.level ASC, e.name ASC` |
</phase_requirements>

---

## Summary

Phase 49 is a well-scoped, three-part improvement to the Encounters page. All three requirements are purely additive — no destructive changes to existing data or behavior.

ENC-01 is a two-line change in `SavedEncounterList.tsx`: change `size="icon"` to `size="sm"`, remove the icon-only `<Plus>`, add text label. The inline name input flow is untouched.

ENC-02 requires: (1) a new `creature_type` column in `entities` (migration `0023`), (2) Rust `RawEntity` struct extension for forward-going syncs, (3) TypeScript `RawEntity` extension, (4) updating `batchInsertEntities` to pass the new field, (5) extending `CreatureRow` and `searchCreaturesFiltered` in `creatures.ts`, and (6) adding a collapsible filter panel to `CreatureSearchSidebar`. The filter panel is a close adaptation of the existing `ItemFilterPanel.tsx` — the same Popover+Command pattern for traits, the same Select pattern for source/type dropdowns, and the same level min/max inputs.

ENC-03 is a one-line SQL change in `fetchCreatures` and `searchCreatures` (or the unified `searchCreaturesFiltered`). The sort change affects only the creatures tab.

**Primary recommendation:** Wire all creature search (browse + text) through a single `fetchCreaturesFiltered` function to avoid maintaining two separate ORDER BY paths.

---

## Project Constraints (from CLAUDE.md)

- `shared/api/` is sole Tauri IPC boundary — new `fetchDistinctCreatureTypes()` and `fetchDistinctCreatureSources()` go in `src/shared/api/creatures.ts`
- `getSqlite()` raw SQL for performance paths; filter query uses `getDb()` direct select (consistent with existing `searchCreaturesFiltered`)
- `import.meta.glob` for migrations — new `.sql` file auto-picked up if filename matches `*.sql` pattern (confirmed in `migrate.ts`)
- FSD: filter state and UI stay inside `features/encounter-builder`; API in `shared/api/creatures.ts`
- No test files — no test maintenance required
- Tauri 2 desktop app — no SSR concerns; all DB calls go through `@tauri-apps/plugin-sql` IPC

---

## Standard Stack

### Core (already in use — no new installs)

| Component | Location | Purpose |
|-----------|----------|---------|
| `Button` | `@/shared/ui/button` | ENC-01 button replacement |
| `Input` | `@/shared/ui/input` | Level min/max filter inputs |
| `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` | `@/shared/ui/select` | Creature type + source book dropdowns |
| `Popover` / `PopoverTrigger` / `PopoverContent` | `@/shared/ui/popover` | Traits combobox wrapper |
| `Command` / `CommandInput` / `CommandList` / `CommandItem` / `CommandEmpty` | `@/shared/ui/command` | Traits searchable list |
| `ScrollArea` | `@/shared/ui/scroll-area` | Already wraps results list |
| `SlidersHorizontal` | `lucide-react` | Filter toggle button icon |
| `Check`, `X`, `Plus` | `lucide-react` | Trait checkbox, chip dismiss, new encounter button |

All components confirmed present in `src/shared/ui/`. [VERIFIED: ls src/shared/ui/]

### No new dependencies

No `npx shadcn add` calls required. [VERIFIED: UI-SPEC Registry Safety section]

---

## Architecture Patterns

### Migration Naming

Highest existing migration: `0022_encounter_combatant_ac.sql` [VERIFIED: ls src/shared/db/migrations/]

New migration must be: `0023_creature_type.sql`

`migrate.ts` uses `import.meta.glob('./migrations/*.sql', { eager: true, query: '?raw', import: 'default' })` and sorts entries lexicographically. Any new `.sql` file matching the glob is picked up automatically — no change to `migrate.ts` needed. [VERIFIED: src/shared/db/migrate.ts]

### Migration Pattern

Single-statement migrations are the norm. `0007_source_name.sql` is the exact precedent for this phase:

```sql
-- 0007_source_name.sql (precedent)
ALTER TABLE entities ADD COLUMN source_name TEXT;
```

New migration content:

```sql
ALTER TABLE entities ADD COLUMN creature_type TEXT;
UPDATE entities SET creature_type = json_extract(raw_json, '$.system.details.type.value') WHERE type = 'npc';
CREATE INDEX IF NOT EXISTS idx_entities_creature_type ON entities(creature_type);
```

`migrate.ts` splits on `;` and executes each statement individually — three-statement migrations work correctly. [VERIFIED: migrate.ts lines 30–36]

### Rust `extract_entity` Pattern

Current Rust extraction in `src-tauri/src/sync.rs` uses `system.pointer("/path/to/value")`. The `creature_type` field follows the exact same pattern as existing extractions:

```rust
// Existing pattern (source_name from sync.rs line 87-91):
let source_name = value
    .pointer("/system/details/publication/title")
    .and_then(|v| v.as_str())
    .filter(|s| !s.is_empty())
    .map(|s| s.to_string());

// New field (creature_type):
let creature_type = system
    .pointer("/details/type/value")
    .and_then(|v| v.as_str())
    .filter(|s| !s.is_empty())
    .map(|s| s.to_string());
```

The Foundry JSON path `/system/details/type/value` is confirmed in CONTEXT.md as the source. [VERIFIED: 49-CONTEXT.md] The Rust `RawEntity` struct and `extract_entity` fn must both be updated.

### TypeScript `RawEntity` and `batchInsertEntities` Pattern

`src/shared/api/sync.ts` defines `interface RawEntity` (16 fields) and `batchInsertEntities` uses a 16-column INSERT with `(?, ?, ..., ?)` placeholder. Adding `creature_type` requires:

1. Add `creature_type: string | null` to `interface RawEntity`
2. Change `batchInsertEntities` placeholder from `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` (16 `?`) to 17 `?`
3. Add `e.creature_type` to `batch.flatMap(...)` values array
4. Add `creature_type` to the INSERT column list

[VERIFIED: src/shared/api/sync.ts lines 6-23, 793-845]

### `CreatureRow` and `searchCreaturesFiltered` Pattern

`src/shared/api/creatures.ts` already has:
- `interface CreatureRow` — needs `creature_type: string | null` added
- `searchCreaturesFiltered(filters, limit, offset)` — already exists with partial filter support
- `CreatureFilters` interface — needs `creatureType?: string` added, and `rarity` changed from `string | null` to `string[] | null` (multi-select per CONTEXT.md)
- `fetchDistinctSources()` — exists but returns `{pack, name}[]` using `source_pack`; the spec requires `source_name` — a new `fetchDistinctCreatureSources()` using `source_name` is needed
- `fetchDistinctTraits()` — exists and works correctly

[VERIFIED: src/shared/api/creatures.ts]

**Important gap in current `searchCreaturesFiltered`:**
- Current rarity filter: `e.rarity = ?` (single string)
- Required: multi-select array — needs `e.rarity IN (?, ?, ...)` dynamic placeholder or separate conditions per value
- Current source filter uses `e.source_pack`, spec says `source_name`
- ORDER BY is currently `e.name` — must change to `e.level ASC, e.name ASC`

### Filter UI Pattern — Direct Reuse from `ItemFilterPanel.tsx`

`ItemFilterPanel.tsx` at `src/features/items-catalog/ui/ItemFilterPanel.tsx` is the canonical reference. [VERIFIED: file contents]

**Traits combobox** (exact reuse):
```tsx
<Popover open={traitsOpen} onOpenChange={setTraitsOpen}>
  <PopoverTrigger asChild>
    <button className="h-6 px-2 text-xs border border-border/40 rounded hover:border-border transition-colors text-muted-foreground">
      {selectedTraits.length > 0 ? `${selectedTraits.length} trait${selectedTraits.length !== 1 ? 's' : ''}` : 'Traits'}
    </button>
  </PopoverTrigger>
  <PopoverContent className="w-[200px] p-0" align="start">
    <Command>
      <CommandInput placeholder="Search traits..." />
      <CommandList className="max-h-[300px]">
        <CommandEmpty>No traits found.</CommandEmpty>
        {traits.map((trait) => (
          <CommandItem key={trait} onSelect={() => toggleTrait(trait)} className="flex items-center gap-2 text-xs">
            <div className={cn('w-3 h-3 border rounded-sm flex items-center justify-center shrink-0', selectedTraits.includes(trait) ? 'bg-primary border-primary' : 'border-border')}>
              {selectedTraits.includes(trait) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
            </div>
            <span className="uppercase tracking-wider text-[10px]">{trait}</span>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

**Source dropdown** (exact reuse, replace `selectedSource`/`setSelectedSource` with local state):
```tsx
<Select value={selectedSource ?? '__all__'} onValueChange={(v) => setSelectedSource(v === '__all__' ? null : v)}>
  <SelectTrigger className="h-6 text-xs w-full border-border/40">
    <SelectValue placeholder="All sources" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="__all__">All sources</SelectItem>
    {sources.map((src) => <SelectItem key={src} value={src}>{src}</SelectItem>)}
  </SelectContent>
</Select>
```

**Rarity chips** (ItemFilterPanel uses single-select; ENC-02 requires multi-select array — adapt):
```tsx
// Multi-select version (adapted from ItemFilterPanel single-select pattern):
{RARITIES.map((r) => (
  <button
    key={r}
    onClick={() => toggleRarity(r)}
    className={cn(
      'px-2 py-0.5 text-[10px] rounded border capitalize font-normal transition-colors',
      selectedRarities.includes(r)
        ? cn(RARITY_COLORS[r], 'bg-secondary border-current')
        : 'text-muted-foreground border-border/40 hover:border-border'
    )}
  >{r}</button>
))}
```

**Level range inputs** (exact reuse from ItemFilterPanel):
```tsx
<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
  <span className="text-[10px] uppercase tracking-wider">Lv</span>
  <Input type="number" placeholder="min" value={levelMin} onChange={(e) => setLevelMin(e.target.value)} className="w-14 h-6 text-xs px-1.5" min={0} max={25} />
  <span>–</span>
  <Input type="number" placeholder="max" value={levelMax} onChange={(e) => setLevelMax(e.target.value)} className="w-14 h-6 text-xs px-1.5" min={0} max={25} />
</div>
```

### Filter State Location

`CreatureSearchSidebar` is a feature-local component with local `useState`. The filter state stays local (no Zustand store needed for this phase) — consistent with how `query` and `selectedTier` are handled. [VERIFIED: CreatureSearchSidebar.tsx]

### FTS + ORDER BY Level

Current `searchCreatures` query:
```sql
SELECT e.* FROM entities e
JOIN entities_fts f ON e.rowid = f.rowid
WHERE entities_fts MATCH ?
AND e.type = 'npc'
ORDER BY rank
LIMIT ?
```

SQLite FTS5 allows mixing `ORDER BY rank` with other columns, but once you use a non-rank `ORDER BY`, FTS rank is ignored. The decision (CONTEXT.md ENC-03) is to drop rank ordering entirely in favor of `ORDER BY e.level ASC, e.name ASC`. This is valid SQLite — ORDER BY on joined columns works when FTS is used via subquery pattern (which `searchCreaturesFiltered` already uses: `e.rowid IN (SELECT rowid FROM entities_fts WHERE entities_fts MATCH ?)`).

The subquery FTS approach in `searchCreaturesFiltered` is the right foundation — ORDER BY level works correctly when FTS is a subquery filter rather than a JOIN with `ORDER BY rank`. [VERIFIED: src/shared/api/creatures.ts lines 80-113]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Traits combobox with search | Custom dropdown | `Popover` + `Command` from shadcn | Already implemented in ItemFilterPanel — direct copy |
| Source/type dropdown | Native `<select>` | `Select` from shadcn | Visual consistency, existing pattern |
| Filter active count | Custom Badge component | Inline `(N)` text in `text-primary` | UI-SPEC specifies this — no Badge component overhead |
| Trait multi-select chips | Custom tag input | Pattern from ItemFilterPanel (bg-primary/10 chips with X) | Exact match needed for consistency |
| json_each traits filtering | LIKE-based string search | `EXISTS (SELECT 1 FROM json_each(e.traits) WHERE value = ?)` | Already in `searchCreaturesFiltered`; handles JSON array correctly |

---

## Common Pitfalls

### Pitfall 1: Multi-select rarity IN clause with variable bindings
**What goes wrong:** SQLite `IN (?, ?, ?)` requires the exact number of placeholders to match the array length. Building this dynamically is error-prone.
**Why it happens:** The `rarity` filter changed from single-value to multi-value array between the existing `CreatureFilters` interface and the ENC-02 spec.
**How to avoid:** Build placeholders dynamically: `e.rarity IN (${rarities.map(() => '?').join(',')})` and push values to params array. Already done for traits in `searchCreaturesFiltered` — same pattern applies.
**Warning signs:** TypeScript will catch type mismatch if old `rarity: string | null` isn't updated to `rarity?: string[] | null`.

### Pitfall 2: `fetchDistinctSources` vs new `fetchDistinctCreatureSources`
**What goes wrong:** Existing `fetchDistinctSources()` returns `{pack, name}[]` based on `source_pack`. The UI-SPEC dropdown binds to `source_name` string values.
**Why it happens:** Two different source representations in the schema (`source_pack` = pack ID, `source_name` = human-readable title).
**How to avoid:** Add new `fetchDistinctCreatureSources(): Promise<string[]>` that queries `DISTINCT source_name FROM entities WHERE type = 'npc' AND source_name IS NOT NULL ORDER BY source_name`.

### Pitfall 3: Rust struct serialization order must match TypeScript INSERT column order
**What goes wrong:** `batchInsertEntities` in `sync.ts` uses positional `?` bindings. If `creature_type` is added to `RawEntity` in Rust but not appended in the same position in the TypeScript INSERT, column-value mismatch silently stores wrong data.
**Why it happens:** The INSERT column list and the `flatMap` values array are maintained separately.
**How to avoid:** Add `creature_type` as the last column in both the Rust struct, the TypeScript interface, the INSERT column list, and the `flatMap` values array. Verify the placeholder count (16 → 17).

### Pitfall 4: `migrate.ts` semicolon-splitting with comments
**What goes wrong:** `migrate.ts` splits SQL on `;` — inline SQL comments (`-- comment`) in migration files are fine, but multi-line statements with semicolons in string literals would break. The `UPDATE ... WHERE type = 'npc'` does not contain semicolons in values, so it is safe.
**Why it happens:** Simple string split on `;` is used rather than a full SQL parser.
**How to avoid:** Keep migration SQL simple — no semicolons inside string literals or comments.

### Pitfall 5: Filter panel active-count calculation
**What goes wrong:** Counting "active filters" incorrectly (e.g., counting level inputs independently when both are empty, or counting an empty traits array).
**Why it happens:** Each filter type has different empty representations (`null`, `[]`, `''`, `undefined`).
**How to avoid:** Compute count explicitly:
```ts
const activeCount = [
  levelMin != null && levelMin !== '' ? 1 : 0,
  levelMax != null && levelMax !== '' ? 1 : 0,
  selectedRarities.length > 0 ? 1 : 0,
  creatureType != null ? 1 : 0,
  selectedTraits.length > 0 ? selectedTraits.length : 0,
  sourceName != null ? 1 : 0,
].reduce((a, b) => a + b, 0)
```
(The UI-SPEC says count badge shows total active filters, not total selected values — treat level min and max as one filter or two based on UX judgment; CONTEXT.md says "active filter count badge when any filter is active".)

---

## Code Examples

### Migration 0023 (new file)
```sql
-- Source: pattern from 0007_source_name.sql [VERIFIED]
ALTER TABLE entities ADD COLUMN creature_type TEXT;
UPDATE entities SET creature_type = json_extract(raw_json, '$.system.details.type.value') WHERE type = 'npc';
CREATE INDEX IF NOT EXISTS idx_entities_creature_type ON entities(creature_type);
```

### Rust RawEntity addition (src-tauri/src/sync.rs)
```rust
// Add to struct after source_name field [VERIFIED: sync.rs lines 6-24]
pub creature_type: Option<String>,

// Add to extract_entity() after source_name extraction:
let creature_type = system
    .pointer("/details/type/value")
    .and_then(|v| v.as_str())
    .filter(|s| !s.is_empty())
    .map(|s| s.to_string());

// Add to Some(RawEntity { ... }) literal:
creature_type,
```

### TypeScript batchInsertEntities update (src/shared/api/sync.ts)
```typescript
// In interface RawEntity — add after source_name:
creature_type: string | null

// In batchInsertEntities placeholder: change 16 ? to 17 ?
.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')

// In flatMap values — add e.creature_type after e.source_name:
e.source_name,
e.creature_type,   // new

// In INSERT column list — add creature_type after source_name:
INSERT OR REPLACE INTO entities (id, name, type, level, hp, ac, fort, ref, will, perception, traits, rarity, size, source_pack, raw_json, source_name, creature_type) VALUES ${placeholders}
```

### CreatureRow and CreatureFilters update (src/shared/api/creatures.ts)
```typescript
// Add to CreatureRow after source_name:
creature_type: string | null

// Update CreatureFilters (rarity becomes array, add creatureType):
export interface CreatureFilters {
  query?: string
  levelMin?: number | null
  levelMax?: number | null
  rarity?: string[] | null          // was: string | null
  creatureType?: string | null      // new
  traits?: string[]
  sourceName?: string | null        // rename from source for clarity
}

// New helper:
export async function fetchDistinctCreatureTypes(): Promise<string[]> {
  const db = await getDb()
  const rows = await db.select<{ creature_type: string }[]>(
    "SELECT DISTINCT creature_type FROM entities WHERE type = 'npc' AND creature_type IS NOT NULL ORDER BY creature_type"
  )
  return rows.map(r => r.creature_type)
}

export async function fetchDistinctCreatureSources(): Promise<string[]> {
  const db = await getDb()
  const rows = await db.select<{ source_name: string }[]>(
    "SELECT DISTINCT source_name FROM entities WHERE type = 'npc' AND source_name IS NOT NULL ORDER BY source_name"
  )
  return rows.map(r => r.source_name)
}
```

### searchCreaturesFiltered ORDER BY and rarity fix
```typescript
// Rarity multi-select — replace single equality with IN:
if (filters.rarity && filters.rarity.length > 0) {
  const placeholders = filters.rarity.map(() => '?').join(', ')
  conditions.push(`e.rarity IN (${placeholders})`)
  params.push(...filters.rarity)
}

// creatureType filter:
if (filters.creatureType) {
  conditions.push('e.creature_type = ?')
  params.push(filters.creatureType)
}

// sourceName filter (was: source_pack; now: source_name):
if (filters.sourceName) {
  conditions.push('e.source_name = ?')
  params.push(filters.sourceName)
}

// ORDER BY — change from e.name to level ASC, name ASC:
`SELECT e.* FROM entities e WHERE ${where} ORDER BY e.level ASC, e.name ASC LIMIT ? OFFSET ?`
```

### ENC-01 button replacement (SavedEncounterList.tsx)
```tsx
// Before [VERIFIED: SavedEncounterList.tsx lines 43-50]:
<Button variant="ghost" size="icon" className="w-5 h-5" onClick={() => setIsCreating(true)}>
  <Plus className="w-3 h-3" />
</Button>

// After:
<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsCreating(true)}>
  <Plus className="w-3 h-3 mr-1" />
  New Encounter
</Button>
```

### Collapsible filter toggle (CreatureSearchSidebar.tsx — new section)
```tsx
// State additions:
const [filtersOpen, setFiltersOpen] = useState(false)
const [levelMin, setLevelMin] = useState<string>('')
const [levelMax, setLevelMax] = useState<string>('')
const [selectedRarities, setSelectedRarities] = useState<string[]>([])
const [creatureType, setCreatureType] = useState<string | null>(null)
const [selectedTraits, setSelectedTraits] = useState<string[]>([])
const [sourceName, setSourceName] = useState<string | null>(null)
const [traitsOpen, setTraitsOpen] = useState(false)
const [availableTypes, setAvailableTypes] = useState<string[]>([])
const [availableSources, setAvailableSources] = useState<string[]>([])
const [availableTraits, setAvailableTraits] = useState<string[]>([])

// Active count:
const activeFilterCount = [
  levelMin !== '' ? 1 : 0,
  levelMax !== '' ? 1 : 0,
  selectedRarities.length,
  creatureType ? 1 : 0,
  selectedTraits.length,
  sourceName ? 1 : 0,
].reduce((a, b) => a + b, 0)

// Filter toggle button (placed below search input, creatures tab only):
{activeTab === 'creatures' && (
  <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => setFiltersOpen(o => !o)}>
    <SlidersHorizontal className="w-3 h-3 mr-1.5" />
    Filters{activeFilterCount > 0 && <span className="text-primary font-normal ml-1">({activeFilterCount})</span>}
  </Button>
)}
```

---

## State of the Art

| Area | Current | New (Phase 49) |
|------|---------|----------------|
| `fetchCreatures` ORDER BY | `ORDER BY name` | `ORDER BY level ASC, name ASC` |
| `searchCreatures` ORDER BY | `ORDER BY rank` (FTS relevance) | `ORDER BY level ASC, name ASC` (via unified `searchCreaturesFiltered`) |
| `CreatureFilters.rarity` | `string \| null` (single) | `string[] \| null` (multi-select) |
| `entities` schema | 16 columns including `source_name` | 17 columns adding `creature_type` |
| `RawEntity` Rust struct | 16 fields | 17 fields |
| `RawEntity` TS interface | 16 fields | 17 fields |
| Creature search UI | Search + tier selector only | Search + tier + collapsible filter panel |
| "New Encounter" trigger | Icon-only `+` button | Labeled `+ New Encounter` button |

---

## Open Questions

1. **`fetchCreatures` vs `searchCreaturesFiltered` unification**
   - What we know: `CreatureSearchSidebar` calls `fetchCreatures` for browse (no query) and `searchCreatures` for text search. `searchCreaturesFiltered` already unifies both paths.
   - What's unclear: Whether `fetchCreatures` and `searchCreatures` should be deprecated or kept as thin wrappers.
   - Recommendation: Wire `CreatureSearchSidebar` to call `searchCreaturesFiltered` for all cases. The old functions can remain for backward compat but the sidebar should use only the unified one. This avoids two ORDER BY maintenance points.

2. **Rarity `RARITY_COLORS` import in CreatureSearchSidebar**
   - What we know: `ItemFilterPanel` imports `RARITY_COLORS` from `@/entities/item`. For creatures, rarity chips use `--pf-rarity-{value}` CSS tokens directly (specified in UI-SPEC).
   - What's unclear: Whether `RARITY_COLORS` from `@/entities/item` is correct to reuse here or if creature rarity uses a separate export.
   - Recommendation: Check `src/entities/item/index.ts` — if `RARITY_COLORS` maps to the same `--pf-rarity-*` CSS vars, reuse it. Otherwise use inline Tailwind arbitrary values.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely frontend/DB changes. No external tools, services, or runtimes beyond the existing project stack (Tauri, Node.js, Rust) are required.

---

## Validation Architecture

> `workflow.nyquist_validation` not explicitly set to false — section included.

### Test Framework

No test infrastructure in this project — intentionally removed (CLAUDE.md: "No test files — breaking changes expected, tests removed intentionally"). All validation is manual smoke testing.

| Property | Value |
|----------|-------|
| Framework | None |
| Config file | None |
| Quick run | Manual: launch app, open Encounters page |
| Full suite | Manual: follow success criteria checklist |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENC-01 | "New Encounter" button visible and labeled | manual-only | — | N/A |
| ENC-02 | Filter panel appears, all 5 filter types functional | manual-only | — | N/A |
| ENC-03 | Results sorted level ASC | manual-only | — | N/A |

### Wave 0 Gaps

None — no test infrastructure to scaffold per project policy.

---

## Security Domain

This phase has no authentication, session management, access control, cryptographic operations, or external network calls. The only data operations are:

- SQLite read queries (parameterized, using existing `db.select()` pattern — no concatenated user input in SQL)
- SQLite migration (static SQL, no user input)
- Rust struct: no new network calls or file I/O beyond existing sync patterns

No ASVS categories apply specifically to this phase beyond the general parameterized query practice already in use. [VERIFIED: searchCreaturesFiltered uses parameterized `?` bindings throughout]

---

## Sources

### Primary (HIGH confidence)
- `src/features/encounter-builder/ui/CreatureSearchSidebar.tsx` — current search UI, state patterns, API calls
- `src/features/encounter-builder/ui/SavedEncounterList.tsx` — current button to replace
- `src/shared/api/creatures.ts` — existing CreatureRow, CreatureFilters, searchCreaturesFiltered implementation
- `src/shared/api/sync.ts` — RawEntity TS interface, batchInsertEntities INSERT pattern
- `src-tauri/src/sync.rs` — RawEntity Rust struct, extract_entity() field extraction pattern
- `src/shared/db/migrate.ts` — migration auto-loading confirmed via import.meta.glob
- `src/shared/db/migrations/` (ls) — highest migration number: 0022
- `src/features/items-catalog/ui/ItemFilterPanel.tsx` — filter UI patterns to reuse
- `.planning/phases/49-encounters-ux-overhaul/49-CONTEXT.md` — all locked decisions
- `.planning/phases/49-encounters-ux-overhaul/49-UI-SPEC.md` — visual spec, component inventory

### Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Foundry VTT JSON path `/system/details/type/value` contains the creature family string (e.g. "Humanoid", "Dragon") | Migration + Rust | Migration UPDATE populates nothing; re-sync required to fix |
| A2 | `RARITY_COLORS` from `@/entities/item` maps to the same CSS vars needed for creature rarity chips | Code Examples | Wrong colors on rarity chips; fix is trivial inline style change |

Note: A1 is confirmed in CONTEXT.md as a locked decision — user verified the JSON path during discussion phase. Risk is very low.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components verified present in `src/shared/ui/`
- Architecture: HIGH — migration pattern, INSERT pattern, filter UI pattern all verified from existing code
- Pitfalls: HIGH — derived from reading actual implementation code, not assumed

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable stack, no fast-moving dependencies)
