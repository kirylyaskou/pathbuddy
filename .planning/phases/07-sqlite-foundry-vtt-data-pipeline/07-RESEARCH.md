# Phase 7: SQLite + Foundry VTT Data Pipeline — Research

**Researched:** 2026-04-01
**Status:** Complete

## 1. Foundry VTT Data Structure

### Content Packs
- 94 directories in `refs/pf2e/`, 28,026 JSON files total
- Nested subdirectories: e.g., `spells/spells/`, `spells/focus/`, `spells/rituals/`
- Each JSON file is one entity with top-level keys: `_id`, `name`, `type`, `system`, `img` (sometimes `items`)

### Entity Type Distribution
| Type | Count | Notes |
|------|-------|-------|
| feat | 7,177 | Class/ancestry/general feats |
| npc | 6,161 | Creatures — the primary use case |
| effect | 2,773 | Spell/ability effects |
| equipment | 2,268 | Generic equipment |
| spell | 1,796 | Arcane/divine/primal/occult spells |
| consumable | 1,654 | Potions, scrolls, etc. |
| action | 1,311 | Game actions |
| hazard | 1,139 | Traps, haunts, environmental |
| weapon | 971 | Weapon items |
| background | 490 | Character backgrounds |
| deity | 478 | Gods and pantheons |
| heritage | 321 | Ancestry heritages |
| other | 1,887 | ammo, armor, treasure, shield, vehicle, ancestry, condition, class, etc. |

### NPC (Creature) JSON Field Map
```
_id                           → id (TEXT PK)
name                          → name (TEXT)
type                          → type (TEXT, always 'npc')
system.details.level.value    → level (INTEGER)
system.attributes.hp.max      → hp (INTEGER)
system.attributes.ac.value    → ac (INTEGER)
system.saves.fortitude.value  → fort (INTEGER)
system.saves.reflex.value     → ref (INTEGER)
system.saves.will.value       → will (INTEGER)
system.perception.mod         → perception (INTEGER)
system.traits.value           → traits (TEXT, JSON array)
system.traits.rarity          → rarity (TEXT)
system.traits.size.value      → size (TEXT)
full JSON                     → raw_json (TEXT)
```

### Common Fields Across All Entity Types
Every entity has: `_id`, `name`, `type`. Most have `system.traits.rarity`, `system.traits.value` (traits array). Level location varies by type:
- NPC: `system.details.level.value`
- Spell: `system.level.value`
- Equipment/Weapon/Armor/Consumable: `system.level.value`
- Hazard: `system.details.level.value`
- Feat: `system.level.value`
- Action: no level field

## 2. Tauri Plugin SQL Setup

### Rust Side
```toml
# Cargo.toml
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
```

```rust
// lib.rs
tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(tauri_plugin_opener::init())
    .run(tauri::generate_context!())
```

### Capabilities
```json
{
  "permissions": [
    "core:default",
    "opener:default",
    "sql:default"
  ]
}
```

### Frontend
```bash
npm install @tauri-apps/plugin-sql
```

```typescript
import Database from '@tauri-apps/plugin-sql';
const db = await Database.load('sqlite:pathbuddy.db');
await db.execute('CREATE TABLE IF NOT EXISTS ...', []);
const rows = await db.select('SELECT * FROM entities WHERE ...', []);
```

### IPC Commands (under the hood)
- `plugin:sql|load` — open database connection
- `plugin:sql|execute` — INSERT/UPDATE/DELETE/DDL
- `plugin:sql|select` — SELECT queries

## 3. Schema Design

### Single `entities` Table
Best approach: one table for all 28K entities. NPC-specific columns are nullable (only populated for type='npc'). Raw JSON blob stores complete Foundry data for later use (Phases 8-10 parse it).

```sql
CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,          -- Foundry _id
  name TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'npc', 'spell', 'equipment', 'hazard', etc.
  level INTEGER,                -- null for actions and some effects
  hp INTEGER,                   -- NPC/hazard only
  ac INTEGER,                   -- NPC/hazard only
  fort INTEGER,                 -- NPC only
  ref INTEGER,                  -- NPC only
  will INTEGER,                 -- NPC only
  perception INTEGER,           -- NPC only
  traits TEXT,                  -- JSON array serialized as TEXT
  rarity TEXT,                  -- 'common'|'uncommon'|'rare'|'unique'
  size TEXT,                    -- 'tiny'|'sm'|'med'|'lg'|'huge'|'grg' (NPC/hazard)
  source_pack TEXT,             -- content pack dirname
  raw_json TEXT NOT NULL        -- complete Foundry VTT JSON
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_level ON entities(level);
CREATE INDEX idx_entities_name ON entities(name);
```

### FTS5 Virtual Table
```sql
CREATE VIRTUAL TABLE IF NOT EXISTS entities_fts USING fts5(
  name,
  type,
  traits,
  rarity,
  content=entities,
  content_rowid=rowid
);
```

After bulk insert, rebuild FTS5 index:
```sql
INSERT INTO entities_fts(entities_fts) VALUES('rebuild');
```

Query pattern:
```sql
SELECT e.* FROM entities e
JOIN entities_fts f ON e.rowid = f.rowid
WHERE entities_fts MATCH ? ORDER BY rank LIMIT ?;
```

### Sync Metadata Table
```sql
CREATE TABLE IF NOT EXISTS sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Stores: 'foundry_version', 'last_sync_date', 'entity_count'
```

## 4. Drizzle ORM + sqlite-proxy

### Setup
```bash
npm install drizzle-orm
npm install -D drizzle-kit
```

### Proxy Driver
```typescript
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import Database from '@tauri-apps/plugin-sql';

let tauriDb: Database;

export const db = drizzle(async (sql, params, method) => {
  if (!tauriDb) tauriDb = await Database.load('sqlite:pathbuddy.db');
  if (method === 'run') {
    await tauriDb.execute(sql, params);
    return { rows: [] };
  }
  const rows = await tauriDb.select(sql, params);
  return { rows: rows as any[] };
});
```

### Decision: Raw SQL vs Drizzle Runtime
- **Drizzle for schema definition**: type-safe table/column definitions
- **Raw SQL via Database class for performance-critical operations**: bulk insert (28K rows), FTS5 queries, migrations
- **Drizzle queries for regular CRUD**: type-safe selects, single inserts/updates
- **Reasoning**: Drizzle sqlite-proxy adds IPC overhead per query (acceptable for single queries, not for 28K inserts)

### Migrations
SQL files loaded via `import.meta.glob` (Node.js `fs` crashes in Tauri WebView):
```typescript
const migrations = import.meta.glob('./migrations/*.sql', { eager: true, query: '?raw', import: 'default' });
// Sort by filename, execute sequentially
```

## 5. Sync Pipeline Architecture

### Why Rust for Download/Extract
1. JavaScript in Tauri WebView has no `fs` access — can't write ZIP to disk
2. 28K JSON files × full parse is CPU-intensive — Rust is faster
3. ZIP extraction needs native library — JS alternatives are slow/large
4. Progress events from Rust → frontend via Tauri event system

### Rust Custom Command Design
```rust
#[tauri::command]
async fn sync_foundry_data(
    app: tauri::AppHandle,
    url: Option<String>,
) -> Result<Vec<RawEntity>, String> {
    // 1. Determine URL (latest GitHub release if not specified)
    // 2. Download ZIP to temp dir (reqwest)
    // 3. Extract packs/ directory (zip crate)
    // 4. Parse all JSON files, extract common fields
    // 5. Emit progress events: app.emit("sync-progress", ...)
    // 6. Return Vec<RawEntity> for frontend to batch-insert
}
```

### Rust Dependencies
```toml
reqwest = { version = "0.12", features = ["json", "stream"] }
zip = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
```

### Frontend Sync Orchestration (shared/api/)
```typescript
export async function syncFoundryData(onProgress: (msg: string, pct: number) => void) {
  // 1. invoke('sync_foundry_data') → gets parsed entities from Rust
  // 2. Begin SQLite transaction
  // 3. Clear existing entities (REPLACE or DELETE + INSERT)
  // 4. Batch INSERT in chunks (500 per execute() call)
  // 5. Rebuild FTS5 index
  // 6. Update sync_metadata
}
```

### Alternative: Local refs/ Import for Development
For dev/testing, also support importing from local `refs/pf2e/` directory:
```rust
#[tauri::command]
async fn import_local_packs(pack_dir: String) -> Result<Vec<RawEntity>, String> { ... }
```

## 6. Splash Screen Implementation

### Current State
- `main.tsx` renders `AppProviders > AppRouter` directly — no gate
- Need splash screen that blocks router mount until DB is ready

### Pattern: Splash Gate Component
```tsx
// src/app/SplashScreen.tsx
function App() {
  const [status, setStatus] = useState<'init' | 'migrating' | 'ready' | 'error'>('init');

  useEffect(() => {
    initDatabase()
      .then(() => runMigrations(setStatus))
      .then(() => setStatus('ready'))
      .catch(() => setStatus('error'));
  }, []);

  if (status !== 'ready') return <SplashScreen status={status} />;
  return <AppProviders><AppRouter /></AppProviders>;
}
```

### Visual Requirements (from CONTEXT.md D-07 through D-10)
- Dark fantasy PF2e aesthetic using existing OKLCH tokens
- "PathBuddy" app name prominent
- Progress bar at bottom with stage text
- Polished first impression

## 7. Critical Findings

### Creature Interface Needs `id` Field
Current `entities/creature/model/types.ts` has 12 fields but NO `id`. The store uses `name` for deduplication (fragile — duplicate names exist across bestiaries). Must add `id: string` field and update store to use it as key.

### creatures.ts Import Bug
`shared/api/creatures.ts` imports `Creature` from `@engine` — this is the ENGINE type with non-serializable ConditionManager. It should import from `entities/creature` (the serializable SQLite-backed type). Phase 7 must fix this.

### Size Code Mismatch
Foundry uses short codes: `tiny`, `sm`, `med`, `lg`, `huge`, `grg`. Entity `Creature.size` uses `DisplaySize` type: `'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan'`. Need a mapping function during import.

### Batch Insert Performance
28K entities × ~10KB JSON each ≈ 280MB raw data. Must:
- Use transactions (single BEGIN/COMMIT wrapping all inserts)
- Batch INSERT statements (multi-row VALUES or prepared statements)
- Consider chunking Rust→JS data transfer (IPC has serialization overhead)
- Rebuild FTS5 index once after all inserts (not per-row triggers)

### No Mock Data to Delete
`git ls-files | grep pf2e-data` returns nothing — DATA-05 may already be satisfied. But verify no inline mock arrays exist in components.

## 8. Validation Architecture

### Testable Assertions per Requirement
- **DATA-01**: `Database.load('sqlite:pathbuddy.db')` succeeds; `db.select('SELECT count(*) FROM entities')` returns > 0 after sync
- **DATA-02**: After sync, `db.select('SELECT count(*) FROM entities')` returns ≥ 28,000; `sync_metadata` has version entry
- **DATA-03**: `db.select("SELECT * FROM entities_fts WHERE entities_fts MATCH 'goblin' LIMIT 5")` returns results in < 200ms
- **DATA-04**: Splash screen visible before any route; router only renders after `initDatabase()` resolves
- **DATA-05**: `git ls-files | grep -i 'pf2e-data\|mock-creature\|mock-data'` returns empty

---

## RESEARCH COMPLETE
