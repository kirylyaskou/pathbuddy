# Phase 7: Sync UI - Research

**Researched:** 2026-03-20
**Domain:** Vue 3 reactive component with progress tracking, inline state transitions, DB reads
**Confidence:** HIGH

## Summary

Phase 7 is a pure frontend wiring task. The sync pipeline (`syncPacks()`) is complete and emits granular `SyncProgress` events. This phase adds `SyncButton.vue` — a reactive status card component that drives UI from those events. No new backend code, no new routes, no schema changes.

The component has three visual modes: idle (version info + sync button), active (stage list + progress bar), and error (inline error with retry). All state transitions derive from the `SyncProgress` callback and the `SyncResult` return value. The `syncState` table is the only external data read, on mount, to populate the version display.

The technical risk is minimal. The only genuine implementation decision left to Claude's discretion is whether to use a local `ref` store within the component or a dedicated Pinia store for sync state. Given no other view needs sync state, local refs are the idiomatic choice. The other discretion area is styling: Tailwind utility classes already used throughout the project are sufficient.

**Primary recommendation:** Implement SyncButton.vue using local `ref`/`reactive` state in `<script setup>`. Call `syncPacks(onProgress)` directly. Read `syncState` on `onMounted`. Keep all logic inside the single file component.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Replace the disabled "Sync Data" tile on DashboardView with a live `SyncButton.vue` component
- SyncButton.vue is a standalone component in `src/components/` — reusable outside the dashboard
- Tile expands inline to show progress during sync (no modal, no separate page)
- Combat Tracker tile remains alongside in the existing grid layout
- DashboardView imports and renders SyncButton in place of the static tile
- Stage indicator shows current stage name as text label (e.g., "Downloading...", "Importing: 1200 / 28000")
- Horizontal progress bar below the stage text
- Progress bar is determinate during `importing` stage (uses `current`/`total` from SyncProgress), indeterminate (animated) for all other stages (checking, downloading, extracting, cleanup)
- Completed stages show checkmarks in a simple vertical list (pipeline visualization)
- Minimal transitions — text swaps, no complex animations
- Current PF2e version shown within the sync tile: release tag, last synced date, entity count
- All three values read from `syncState` table on mount
- "Never synced" state shows a prompt text encouraging first sync (e.g., "No PF2e data yet — sync to get started")
- After successful sync: show brief result summary (added/updated/deleted counts) then settle to updated version display
- Sync errors display inline within the tile (no modal or error page)
- Error message shows by default; full error details collapsed/expandable for debugging
- Retry button appears on error, allowing user to retry without navigating
- Sync button is disabled during active sync to prevent double-triggers

### Claude's Discretion
- Exact Tailwind styling and color palette for progress states
- Stage checkmark icon choice (unicode vs SVG)
- How long to show result summary before settling to version display
- Error categorization (network vs data errors) — implementation detail
- Whether to use a Pinia store for sync state or keep it local to the component

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SYNCUI-01 | User sees sync progress with stage indicator and progress bar | SyncProgress type has `stage`, `message`, `current`, `total`; progress bar uses `current/total` for determinate mode during `importing`, CSS animation for indeterminate |
| SYNCUI-02 | User sees current data version after sync | syncState table (lastRelease, lastSyncAt, totalEntities) read on mount via `db.select().from(syncState).limit(1)` |
| SYNCUI-03 | Sync button component with error handling | try/catch around `syncPacks()` call; error ref captures thrown Error; retry button resets state and re-invokes |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 Composition API | 3.5.13 (installed) | Reactive refs, computed, onMounted | Project standard; all components use `<script setup>` |
| Tailwind CSS | 3.4.17 (installed) | Utility classes for all styling | Project standard; no custom CSS files elsewhere |
| Pinia | 2.3.0 (installed) | State management (discretionary here) | Project standard; local refs preferred for component-only state |
| @vue/test-utils | 2.4.6 (installed) | Component mounting in tests | Project standard for all component tests |
| Vitest | 2.1.8 (installed) | Test runner | Project standard; `npx vitest run` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-orm | 0.38.0 (installed) | DB query DSL | Reading syncState on mount |
| `src/lib/sync-service.ts` | (local) | syncPacks(), SyncProgress, SyncResult | Imported directly in SyncButton.vue |
| `src/lib/database.ts` | (local) | `db` instance | DB access for syncState read |
| `src/lib/schema.ts` | (local) | `syncState` table definition | Drizzle query target |

**No new packages required.** All dependencies are already installed.

**Version verification:** Confirmed via `package.json` — no npm installs needed for this phase.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── SyncButton.vue        # NEW: standalone sync tile component
├── views/
│   └── DashboardView.vue     # MODIFIED: replace static tile with <SyncButton />
```

### Pattern 1: Local Ref State in `<script setup>`
**What:** All sync state (isSyncing, progress, result, error, syncStateData) as `ref()` vars inside `<script setup>`. No Pinia store.
**When to use:** State is not shared across views. SyncButton owns its entire lifecycle.
**Example:**
```typescript
// Source: established pattern in this project (SplashScreen.vue, useDatabase.ts)
const isSyncing = ref(false)
const progress = ref<SyncProgress | null>(null)
const completedStages = ref<string[]>([])
const result = ref<SyncResult | null>(null)
const error = ref<string | null>(null)
const errorDetails = ref<string | null>(null)
const showErrorDetails = ref(false)
const syncStateData = ref<{ lastRelease: string | null; lastSyncAt: string | null; totalEntities: number | null } | null>(null)
```

### Pattern 2: onMounted DB Read (established pattern)
**What:** Read `syncState` table on component mount using the Drizzle `db` instance.
**When to use:** Loading stored state for display — mirrors how `useDatabase` composable is structured.
**Example:**
```typescript
// Source: src/lib/database.ts + src/lib/schema.ts (existing)
import { db } from '@/lib/database'
import { syncState } from '@/lib/schema'

onMounted(async () => {
  const [row] = await db.select().from(syncState).limit(1)
  syncStateData.value = row ?? null
})
```

### Pattern 3: Progress Callback Driving Reactive State
**What:** `syncPacks()` takes an `onProgress` callback. The callback mutates reactive refs, which Vue tracks automatically.
**Example:**
```typescript
// Source: src/lib/sync-service.ts (existing SyncProgress type)
async function startSync() {
  isSyncing.value = true
  completedStages.value = []
  progress.value = null
  error.value = null
  result.value = null

  try {
    const syncResult = await syncPacks((p: SyncProgress) => {
      // Previous stage is now complete
      if (progress.value && progress.value.stage !== p.stage) {
        completedStages.value = [...completedStages.value, progress.value.stage]
      }
      progress.value = p
    })
    result.value = syncResult
    // Refresh version display
    const [row] = await db.select().from(syncState).limit(1)
    syncStateData.value = row ?? null
    // After 3s, clear result summary (settle to version display)
    setTimeout(() => { result.value = null }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    errorDetails.value = err instanceof Error ? (err.stack ?? null) : null
  } finally {
    isSyncing.value = false
  }
}
```

### Pattern 4: Determinate vs Indeterminate Progress Bar
**What:** Use a single `<div>` progress bar element. During `importing`, compute `(current/total)*100` for width. Other stages use a CSS pulse/animate class for indeterminate state.
**Example:**
```html
<!-- Determinate (importing stage) -->
<div class="h-2 bg-gray-200 rounded-full overflow-hidden">
  <div
    class="h-full bg-blue-500 transition-all duration-300"
    :style="{ width: progressPercent + '%' }"
  />
</div>

<!-- Indeterminate (other stages) -->
<div class="h-2 bg-gray-200 rounded-full overflow-hidden">
  <div class="h-full bg-blue-500 animate-pulse w-full" />
</div>
```
```typescript
const progressPercent = computed(() => {
  if (!progress.value || progress.value.stage !== 'importing') return 0
  const { current, total } = progress.value
  if (!current || !total) return 0
  return Math.min(100, Math.round((current / total) * 100))
})
const isDeterminate = computed(() => progress.value?.stage === 'importing')
```

### Pattern 5: Stage Pipeline Visualization (Checkmark List)
**What:** Static ordered list of stage names. As stages complete, they show a checkmark. Current stage shows animated indicator. Future stages are muted.
**Example:**
```typescript
const STAGES = ['checking', 'downloading', 'extracting', 'importing', 'cleanup', 'done']

// In template:
// v-for stage in STAGES:
//   completedStages includes stage → show checkmark (✓)
//   progress.stage === stage → show animated dot (current)
//   else → show muted dot (upcoming)
```

### Pattern 6: Error Collapse/Expand
**What:** Error message always visible. Technical details behind a toggle button.
**Example:**
```html
<div v-if="error" class="mt-3 rounded bg-red-50 p-3 border border-red-200">
  <p class="text-sm text-red-700 font-medium">{{ error }}</p>
  <button
    v-if="errorDetails"
    @click="showErrorDetails = !showErrorDetails"
    class="text-xs text-red-500 underline mt-1"
  >
    {{ showErrorDetails ? 'Hide details' : 'Show details' }}
  </button>
  <pre v-if="showErrorDetails && errorDetails" class="mt-2 text-xs text-red-600 whitespace-pre-wrap break-all">{{ errorDetails }}</pre>
  <button @click="retrySync" class="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
    Retry
  </button>
</div>
```

### Pattern 7: DashboardView Integration
**What:** Replace the static `<div>` tile (lines 22-30 of DashboardView.vue) with `<SyncButton />`.
**Example:**
```html
<!-- DashboardView.vue — replace static tile with: -->
<SyncButton />
```
```typescript
// DashboardView.vue <script setup>
import SyncButton from '@/components/SyncButton.vue'
```

### Anti-Patterns to Avoid
- **Pinia store for this phase:** No other view needs sync state. A store adds indirection without benefit. Keep all state local.
- **Modal or route navigation for sync:** Locked decision — inline tile expansion only.
- **Calling syncPacks() from outside SyncButton:** SyncButton owns the sync trigger. DashboardView only renders `<SyncButton />`, no sync logic.
- **Direct currentHP/DOM manipulation:** Not applicable here, but follow the established pattern of not bypassing reactivity.
- **Blocking the button on `done` stage:** Only disable during active sync (`isSyncing`). After sync completes, re-enable for future syncs.
- **Missing try/finally:** syncPacks() does temp file cleanup in its own finally block, but SyncButton still needs its own try/catch/finally to reliably reset `isSyncing` even on unexpected throws.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress callback plumbing | Custom event bus or store subscription | Direct `syncPacks(onProgress)` callback | syncPacks already accepts the callback; Vue's reactivity handles UI updates |
| Progress bar CSS | Custom CSS animation file | Tailwind `animate-pulse` + `transition-all` | Tailwind already configured and used project-wide |
| DB read | Raw invoke() to sqlite | `db.select().from(syncState).limit(1)` | Drizzle sqlite-proxy is the established project pattern |
| State machine | Enum state class | Plain refs (`isSyncing`, `progress`, `error`, `result`) | Vue 3 composition API ref pattern handles this cleanly without complexity |

**Key insight:** This phase is wiring, not building. Every building block exists. The task is composing `syncPacks` + `db.select` + Vue reactivity into a UI.

## Common Pitfalls

### Pitfall 1: `done` stage is a Valid Progress Emission (not an error)
**What goes wrong:** Developer treats `stage: 'done'` as terminal signal and forgets the `syncPacks()` Promise ALSO resolves with `SyncResult`. Both arrive — the promise result is the authoritative one for `added`/`updated`/`deleted` counts.
**Why it happens:** `onProgress({ stage: 'done' })` fires just before `return result` at end of syncPacks. The result summary should come from the resolved SyncResult, not from parsing the `done` message.
**How to avoid:** Use the `await syncPacks(...)` return value for result display. The `done` stage emission just signals the pipeline finished.
**Warning signs:** Result counts are always 0 or missing from the display.

### Pitfall 2: `syncPacks()` Already Up-to-Date Short-Circuit
**What goes wrong:** Sync is triggered, `onProgress` fires once with `{ stage: 'done', message: 'Already up to date (v...)' }` immediately, and the pipeline exits without emitting other stages. UI shows incomplete stage list.
**Why it happens:** Lines 119-123 of sync-service.ts: if `currentState?.lastRelease === release.tag_name`, syncPacks returns early after a single `done` emission.
**How to avoid:** Handle `stage: 'done'` as a valid immediate outcome. Don't assume `downloading`/`extracting`/`importing` will always fire. The stage list should only show stages that were actually emitted, not all six always.
**Warning signs:** Stage pipeline visualization looks broken or shows uncompleted stages on "already up to date" syncs.

### Pitfall 3: syncState Table May Be Empty (Never Synced)
**What goes wrong:** `db.select().from(syncState).limit(1)` returns `[]` (empty array). Destructuring `const [row] = await ...` gives `row = undefined`. Accessing `row.lastRelease` throws.
**Why it happens:** Fresh install, no prior sync. syncState table exists but has no rows.
**How to avoid:** `syncStateData.value = row ?? null` and check `v-if="syncStateData"` before rendering version fields. Show "No PF2e data yet" empty state when null.
**Warning signs:** Component crashes on first load of a fresh install.

### Pitfall 4: `isSyncing` Not Reset on Error
**What goes wrong:** An unhandled throw inside the try block leaves `isSyncing = true` permanently. The button stays disabled.
**Why it happens:** Missing `finally { isSyncing.value = false }` block. syncPacks has its own finally for cleanup, but SyncButton needs its own.
**How to avoid:** Always wrap in try/catch/finally in `startSync()`. Set `isSyncing.value = false` in finally.
**Warning signs:** Button never re-enables after a sync error.

### Pitfall 5: `vi.mock` for DB and syncPacks in Tests
**What goes wrong:** Tests call real `db.select()` which calls real Tauri IPC, which is not available in jsdom test environment.
**Why it happens:** Forgot to mock `@/lib/database` and `@/lib/sync-service` before testing SyncButton.
**How to avoid:** Follow the established pattern in `CreatureDetailPanel.test.ts` — mock `@/lib/database` with a chainable mock builder, and mock `@/lib/sync-service` to return controlled progress sequences.
**Warning signs:** Tests fail with "invoke is not a function" or similar Tauri IPC errors.

### Pitfall 6: Progress Bar Width Not Reactive to Style Binding
**What goes wrong:** `:style="{ width: progressPercent + '%' }"` doesn't update because `progressPercent` is not declared as `computed()`.
**Why it happens:** Using a plain function call in template instead of a computed ref.
**How to avoid:** Declare `progressPercent` as `computed(() => ...)` so Vue tracks its dependencies.
**Warning signs:** Progress bar stays at 0% or at a stale value during import.

## Code Examples

### DB Read on Mount
```typescript
// Source: src/lib/database.ts + src/lib/schema.ts (existing project code)
import { db } from '@/lib/database'
import { syncState } from '@/lib/schema'
import { onMounted, ref } from 'vue'

const syncStateData = ref<typeof syncState.$inferSelect | null>(null)

onMounted(async () => {
  const rows = await db.select().from(syncState).limit(1)
  syncStateData.value = rows[0] ?? null
})
```

### SyncProgress Type (existing, import from sync-service.ts)
```typescript
// Source: src/lib/sync-service.ts
export interface SyncProgress {
  stage: 'checking' | 'downloading' | 'extracting' | 'importing' | 'cleanup' | 'done';
  message: string;
  current?: number;    // only present during 'importing' stage
  total?: number;      // only present during 'importing' stage
}

export interface SyncResult {
  added: number;
  updated: number;
  deleted: number;
  release: string;
}
```

### syncState Schema (existing, import from schema.ts)
```typescript
// Source: src/lib/schema.ts
export const syncState = sqliteTable('sync_state', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lastRelease: text('last_release'),      // nullable — null when never synced
  lastSyncAt: text('last_sync_at'),       // nullable ISO timestamp
  totalEntities: integer('total_entities'), // nullable integer
})
```

### Test Mock Pattern (follow CreatureDetailPanel.test.ts)
```typescript
// Source: src/components/__tests__/CreatureDetailPanel.test.ts (established pattern)
vi.mock('@/lib/database', () => {
  const mockLimit = vi.fn().mockResolvedValue([])
  const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere, limit: mockLimit })
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
  return { db: { select: mockSelect } }
})

vi.mock('@/lib/sync-service', () => ({
  syncPacks: vi.fn().mockResolvedValue({ added: 0, updated: 0, deleted: 0, release: 'v1.0.0' })
}))
```

### DashboardView Replacement (existing file lines 22-30)
```html
<!-- BEFORE (lines 22-30 of DashboardView.vue): -->
<div class="bg-white rounded-lg shadow-md p-4 opacity-60 cursor-default">
  <h2 class="text-xl font-bold text-gray-800">Sync Data</h2>
  <p class="text-sm text-gray-500 mt-2">
    Import Pathfinder 2e content from the official data source. (Coming soon)
  </p>
</div>

<!-- AFTER: -->
<SyncButton />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Options API + `data()` | Composition API + `<script setup>` | Vue 3 (project uses Vue 3.5.13) | All project components use `<script setup>` |
| Global event bus for state | Pinia stores or local refs | Vue 3 / Pinia 2 | Local refs for component-only state, Pinia for shared state |
| CSS `width` style with inline `style` attribute | Tailwind `transition-all` + `:style` binding for dynamic width | Standard Vue+Tailwind pattern | No custom CSS needed for progress bar animation |

**Not deprecated in this phase:**
- `v-if` / `v-else` / `v-for` — all remain idiomatic Vue 3
- Tailwind utility classes — project uses v3.4 throughout
- `<Transition>` component — used in SplashScreen and CreatureDetailPanel; optional for SyncButton given "minimal transitions" decision

## Open Questions

1. **Result summary display duration**
   - What we know: "Show brief result summary then settle to version display" (locked decision)
   - What's unclear: Duration is Claude's discretion
   - Recommendation: 3 seconds (3000ms setTimeout). Enough to read "Added 28,000, Updated 0, Deleted 0" without feeling abrupt.

2. **Stage checkmark icon**
   - What we know: Unicode vs SVG is Claude's discretion
   - What's unclear: No established icon pattern for non-interactive indicators in the project
   - Recommendation: Unicode `✓` (U+2713) for simplicity. The project uses SVG for interactive icons (chevron, external link button) and inline text for non-interactive elements. A checkmark is display-only, so unicode fits.

3. **Pinia store vs local refs**
   - What we know: Claude's discretion; no other view needs sync state
   - Recommendation: Local refs. A Pinia store for single-component state adds file count, import overhead, and test complexity with zero benefit. Follow the precedent of SplashScreen.vue (component-local state only).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/components/__tests__/SyncButton.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SYNCUI-01 | Progress bar renders during sync with stage text | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | ❌ Wave 0 |
| SYNCUI-01 | Determinate bar width reflects current/total during importing | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | ❌ Wave 0 |
| SYNCUI-01 | Completed stages show checkmark in pipeline list | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | ❌ Wave 0 |
| SYNCUI-02 | Version info (release, date, count) renders from syncStateData | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | ❌ Wave 0 |
| SYNCUI-02 | "Never synced" empty state renders when syncStateData is null | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | ❌ Wave 0 |
| SYNCUI-02 | Version display updates after successful sync | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | ❌ Wave 0 |
| SYNCUI-03 | Sync button disabled during active sync | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | ❌ Wave 0 |
| SYNCUI-03 | Error message renders inline on syncPacks rejection | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | ❌ Wave 0 |
| SYNCUI-03 | Retry button resets error and re-invokes sync | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | ❌ Wave 0 |
| SYNCUI-03 | Error details expand/collapse on toggle | unit | `npx vitest run src/components/__tests__/SyncButton.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/__tests__/SyncButton.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/__tests__/SyncButton.test.ts` — covers SYNCUI-01, SYNCUI-02, SYNCUI-03

*(Existing test infrastructure — Vitest, @vue/test-utils, jsdom, pinia, global-setup.ts stubs — is complete. Only the test file itself needs creating.)*

## Sources

### Primary (HIGH confidence)
- `src/lib/sync-service.ts` — SyncProgress type, SyncResult type, syncPacks() signature and behavior verified by reading source
- `src/lib/schema.ts` — syncState table schema (lastRelease, lastSyncAt, totalEntities) verified by reading source
- `src/views/DashboardView.vue` — Current placeholder tile (lines 22-30) verified by reading source
- `src/components/CreatureDetailPanel.vue` — Established patterns for onMount DB reads, reactive refs, error state, watch usage
- `src/components/SplashScreen.vue` — Established pattern for component-local state (no Pinia) with status/error/retry flow
- `src/components/__tests__/CreatureDetailPanel.test.ts` — Established mock pattern for `@/lib/database` in component tests
- `package.json` — All dependency versions verified
- `vitest.config.ts` — Test configuration verified

### Secondary (MEDIUM confidence)
- `plans/plan.txt` — Original React implementation plan; Vue 3 patterns extracted by translation

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, versions read from package.json
- Architecture: HIGH — patterns read directly from existing project source files
- Pitfalls: HIGH — derived from reading the actual syncPacks() implementation and existing test mocking patterns
- Test strategy: HIGH — test framework fully in place; only the test file is new

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable domain; Vue/Tauri/Vitest versions won't drift mid-project)
