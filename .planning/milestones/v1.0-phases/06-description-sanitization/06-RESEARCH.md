# Phase 6: Description Sanitization - Research

**Researched:** 2026-03-20
**Domain:** Regex-based HTML transformation, Vue 3 event delegation, Tailwind CSS inline styling
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Link click behavior:**
- @UUID links navigate the existing detail panel (reuse Phase 5 single-panel pattern with back button)
- All links rendered with `data-entity-pack` and `data-entity-id` attributes; entity resolution happens on click (sanitizer stays pure/synchronous)
- If entity not in DB on click: show disabled/muted link style, no navigation
- Only `Compendium.pf2e.*` @UUID links become clickable entity links; non-pf2e compendium references fall through to plain text fallback

**Inline element styling:**
- @Damage: bold inline text with damage-type color coding — orange for fire, red for bleed, blue for electricity, etc.
- @Check: bold text with DC number highlighted/emphasized
- @Template: bold inline text (e.g., "**cone 60 ft.**")
- @UUID entity links: blue underlined text (standard web link style), muted/gray when entity not found

**Fallback & edge cases:**
- Unrecognized @-syntax (e.g., @Localize, @Action): strip the `@Type[...]` wrapper, keep `{Label}` text if present; if no label, show bracket content as plain text
- Standard HTML tags preserved — they provide formatting already rendered via `v-html`
- Non-pf2e @UUID references: same treatment as unrecognized @-syntax
- Graceful degradation — malformed @-syntax that doesn't match any regex passes through unchanged

**Integration scope:**
- `sanitizeDescription()` built as a general-purpose utility in `src/lib/description-sanitizer.ts`
- Sanitizer is pure HTML-in/HTML-out; click handling lives in the consuming component via event delegation on `.pf2e-link` elements
- Applied to ALL `system.description.value` fields that get rendered
- CreatureDetailPanel is the first consumer

### Claude's Discretion
- Exact regex patterns and ordering of replacement passes
- Damage-type color map completeness (which PF2e damage types get which colors)
- CSS class naming conventions for styled elements
- How to extract pack/slug from @UUID path for the data attributes
- Event delegation implementation details in CreatureDetailPanel

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DESC-01 | System parses Foundry @UUID links into internal entity links | Regex patterns in plan.txt §Phase 4 are complete; `data-entity-pack` / `data-entity-id` attrs map directly to `pf2eEntities.pack` + `pf2eEntities.slug` columns in schema.ts |
| DESC-02 | System renders @Damage, @Check, @Template as readable text | Regex patterns in plan.txt §Phase 4 cover all three; Tailwind classes replace React CSS class names |
</phase_requirements>

---

## Summary

Phase 6 is a pure text-transformation task. The heavy lifting is a single `sanitizeDescription(html: string): string` function that chains five `.replace()` calls to convert Foundry's @-syntax tokens into semantic HTML. The reference implementation already exists verbatim in `plans/plan.txt` §Phase 4 (lines 543–596); the only adaptation required is swapping the bare CSS class names (`pf2e-link`, `pf2e-damage`, etc.) for Tailwind utility classes, and adding a fallback pass for unrecognized @-syntax.

The second deliverable is event delegation inside `CreatureDetailPanel.vue`. Because the sanitized HTML is injected via `v-html`, Vue's template event binding doesn't reach elements inside that block. The panel must attach a native click listener to the container div, check `event.target.closest('[data-entity-pack]')`, perform an async DB lookup against `pf2eEntities` (same pattern as `creature-resolver.ts`), and call `store.navigateToCanonical()` on hit or apply a muted style on miss.

No new routes, stores, or schemas are required. The entire phase is additive: one new utility file, modifications to `getDescription()` in `CreatureDetailPanel.vue`, and a click handler on the description container.

**Primary recommendation:** Copy the plan.txt reference implementation directly, replace CSS class strings with Tailwind utility classes, add the unrecognized-@-syntax fallback pass, then wire click delegation in the panel.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript (built-in) | 5.x | Pure function implementation | Already in use project-wide |
| Vue 3 Composition API | 3.x | `v-html`, `onMounted`/`onBeforeUnmount` for listener lifecycle | Already in use project-wide |
| Tailwind CSS | 3.x | Inline utility classes on generated `<span>`/`<a>` elements | Already in use project-wide |
| Drizzle ORM (sqlite-proxy) | existing | DB lookup on @UUID click | Same pattern as creature-resolver.ts |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest + jsdom | existing | Unit tests for sanitizeDescription() | Tests run without DOM; string-in/string-out is easily testable |
| @vue/test-utils | existing | Mount CreatureDetailPanel for click delegation tests | Same pattern as CreatureDetailPanel.test.ts |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex chain | DOMParser + tree walk | Parser approach handles edge cases better but adds complexity; regex is sufficient for Foundry's simple, predictable @-syntax |
| Tailwind utility strings in JS | scoped `<style>` block | Scoped styles don't apply inside v-html; utility classes on the generated elements DO work because Tailwind is global |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── description-sanitizer.ts   # NEW: pure sanitizeDescription() + damage color map
│   └── __tests__/
│       └── description-sanitizer.test.ts   # NEW: unit tests
├── components/
│   └── CreatureDetailPanel.vue    # MODIFIED: wire sanitizer + click delegation
```

### Pattern 1: Pure Sanitizer Utility

**What:** A single exported function with no side effects. Input: raw HTML string from `system.description.value`. Output: clean HTML string with Foundry @-syntax replaced.

**When to use:** Called from `getDescription()` in CreatureDetailPanel before the value is bound to `v-html`. Any future component rendering entity descriptions imports the same function.

**Reference implementation (from plan.txt §Phase 4, adapted for Tailwind):**

```typescript
// src/lib/description-sanitizer.ts

export const DAMAGE_TYPE_COLORS: Record<string, string> = {
  fire: 'text-orange-600',
  cold: 'text-blue-400',
  electricity: 'text-blue-600',
  acid: 'text-green-600',
  bleed: 'text-red-600',
  persistent: 'text-red-600',
  poison: 'text-green-700',
  mental: 'text-purple-600',
  void: 'text-gray-700',
  vitality: 'text-yellow-500',
  // default: text-gray-800 (applied at render time)
};

export function sanitizeDescription(html: string): string {
  return html
    // Pass 1: @UUID with label — pf2e compendium only → clickable link
    .replace(
      /@UUID\[Compendium\.pf2e\.([^.\]]+)\.Item\.([^\]]+)\]\{([^}]+)\}/g,
      (_match, pack, id, label) =>
        `<a data-entity-pack="${pack}" data-entity-id="${id}" class="pf2e-link cursor-pointer text-blue-600 underline hover:text-blue-800">${label}</a>`
    )
    // Pass 2: @UUID without label — pf2e compendium only
    .replace(
      /@UUID\[Compendium\.pf2e\.([^.\]]+)\.Item\.([^\]]+)\]/g,
      (_match, pack, id) =>
        `<a data-entity-pack="${pack}" data-entity-id="${id}" class="pf2e-link cursor-pointer text-blue-600 underline hover:text-blue-800">[${id}]</a>`
    )
    // Pass 3: @Damage[formula|options] → damage span with type color
    .replace(
      /@Damage\[([^\]]+)\]/g,
      (_match, expr) => {
        const [formulaPart] = expr.split('|');
        // e.g. "2d6[fire]" → "2d6 fire"
        const clean = formulaPart.replace(/\[([^\]]+)\]/g, ' $1').trim();
        const damageType = (formulaPart.match(/\[([^\]]+)\]/) ?? [])[1] ?? '';
        const colorClass = DAMAGE_TYPE_COLORS[damageType] ?? 'text-gray-800';
        return `<span class="pf2e-damage font-bold ${colorClass}">${clean}</span>`;
      }
    )
    // Pass 4: @Check[type|dc:N|basic]
    .replace(
      /@Check\[([^\]]+)\]/g,
      (_match, expr) => {
        const parts = expr.split('|');
        const type = parts[0];
        const dcPart = parts.find((p: string) => p.startsWith('dc:'));
        const basic = parts.includes('basic');
        const dc = dcPart ? dcPart.split(':')[1] : '';
        const text = `${basic ? 'basic ' : ''}${type}${dc ? ` DC ${dc}` : ''}`;
        return `<span class="pf2e-check font-bold text-gray-900">${text}</span>`;
      }
    )
    // Pass 5: @Template[type|distance:N]
    .replace(
      /@Template\[([^\]]+)\]/g,
      (_match, expr) => {
        const parts = expr.split('|');
        const type = parts[0];
        const distPart = parts.find((p: string) => p.startsWith('distance:'));
        const dist = distPart ? distPart.split(':')[1] : '';
        const text = `${type}${dist ? ` ${dist} ft.` : ''}`;
        return `<span class="pf2e-template font-bold text-gray-800">${text}</span>`;
      }
    )
    // Pass 6: fallback — strip remaining unrecognized @Type[...]{Label} keeping label
    .replace(
      /@\w+\[[^\]]*\]\{([^}]+)\}/g,
      (_match, label) => label
    )
    // Pass 7: fallback — strip remaining unrecognized @Type[content] keeping content
    .replace(
      /@\w+\[([^\]]*)\]/g,
      (_match, content) => content
    );
}
```

### Pattern 2: Event Delegation for v-html Links

**What:** Because Vue template `@click` bindings cannot target elements injected via `v-html`, the click handler must be attached as a native DOM event listener on the container element. The handler checks `event.target.closest('[data-entity-pack]')` to identify `.pf2e-link` clicks, then performs an async DB lookup and either navigates or applies a muted style.

**When to use:** Any time clickable elements are injected via `v-html`.

```typescript
// Inside CreatureDetailPanel.vue <script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { db } from '@/lib/database'
import { pf2eEntities } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import { useCreatureDetailStore } from '@/stores/creatureDetail'

const descContainerEl = ref<HTMLDivElement | null>(null)
const store = useCreatureDetailStore()

async function handleDescriptionClick(event: MouseEvent) {
  const link = (event.target as HTMLElement).closest<HTMLElement>('[data-entity-pack]')
  if (!link) return
  event.preventDefault()

  const pack = link.dataset.entityPack
  const id = link.dataset.entityId
  if (!pack || !id) return

  // Look up entity by pack + slug (id in @UUID path is the slug)
  const results = await db
    .select()
    .from(pf2eEntities)
    .where(and(eq(pf2eEntities.pack, pack), eq(pf2eEntities.slug, id)))
    .limit(1)

  if (results.length === 0) {
    // Entity not in DB — apply muted style
    link.classList.remove('text-blue-600')
    link.classList.add('text-gray-400', 'cursor-not-allowed', 'no-underline')
    return
  }

  const entity = results[0] as any
  const rawData = JSON.parse(entity.rawData)
  store.navigateToCanonical(rawData, rawData.name ?? id)
}

onMounted(() => {
  descContainerEl.value?.addEventListener('click', handleDescriptionClick)
})

onBeforeUnmount(() => {
  descContainerEl.value?.removeEventListener('click', handleDescriptionClick)
})
```

**Template integration — attach ref to description container:**

```html
<!-- In CreatureDetailPanel.vue expanded description section (line ~237) -->
<div
  v-if="expandedIds.has(item.embedded._id)"
  ref="descContainerEl"
  :class="['px-4 py-3 border-b border-gray-100 text-sm', item.isUnique ? 'bg-amber-50' : 'bg-blue-50']"
>
  <div v-html="getDescription(item)"></div>
</div>
```

**Important:** A single `ref="descContainerEl"` on the outer container is sufficient — the listener fires for all `.pf2e-link` clicks inside any expanded description section via bubbling.

### Pattern 3: Sanitizer Wired Into getDescription()

```typescript
// Modified getDescription() in CreatureDetailPanel.vue
import { sanitizeDescription } from '@/lib/description-sanitizer'

function getDescription(item: ResolvedCreatureItem): string {
  const raw = item.canonical
    ? (item.canonical.system?.description?.value ?? '')
    : (item.embedded.system?.description?.value ?? '')
  return sanitizeDescription(raw)
}
```

### Anti-Patterns to Avoid

- **Scoped CSS for v-html content:** Vue scoped styles do NOT apply to elements injected via `v-html`. Use Tailwind utility classes embedded in the generated HTML strings, or add styles to a non-scoped block (but Tailwind inline is cleaner).
- **Async sanitizer:** Keep `sanitizeDescription()` synchronous. DB lookups happen on click, not at render time — this was a locked decision.
- **Replacing @UUID id segment with pack slug:** The @UUID path uses `Item.{some-id}` where the id is the Foundry internal ID, not always the entity slug. See "Common Pitfalls" below.
- **Single ref for multiple expanded items:** If multiple description sections can be expanded simultaneously, a single `ref` will only bind to the last rendered element. Use event delegation on the panel's root div instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Damage-type color mapping | Custom style injection logic | `DAMAGE_TYPE_COLORS` map + Tailwind class strings | Simple string lookup; Tailwind classes are purge-safe if present in source |
| Entity lookup on click | Custom fetch/IPC call | Drizzle `db.select().from(pf2eEntities).where(and(...))` | Same pattern as creature-resolver.ts; already proven pattern in project |
| Sanitizer test setup | Custom DOM parsing in tests | Plain string assertions — sanitizeDescription returns a string | No DOM needed; pure function is trivially testable |

---

## Common Pitfalls

### Pitfall 1: @UUID id vs. slug Mismatch

**What goes wrong:** The @UUID path segment after `Item.` is a Foundry internal item ID (e.g., `AbCdEfGhIj123456`), NOT the entity slug (e.g., `fireball`). The `pf2eEntities` table indexes by `slug` and `pack`, not by Foundry ID.

**Why it happens:** Foundry's @UUID format uses internal document IDs. The pf2e pack data stores the same entity under a human-readable slug in the JSON filename, which is what the sync process captures.

**How to avoid:** Query by `data-entity-pack` + `data-entity-id` where `data-entity-id` is checked against both `slug` AND the `sourceId` column (which stores the full Foundry source path). The `pf2eEntities.sourceId` column (format: `Compendium.pf2e.PACK.Item.ID`) is the right join key for @UUID lookups.

**Corrected click handler query:**
```typescript
// sourceId stored as "Compendium.pf2e.{pack}.Item.{id}"
const sourceId = `Compendium.pf2e.${pack}.Item.${id}`
const results = await db
  .select()
  .from(pf2eEntities)
  .where(eq(pf2eEntities.sourceId, sourceId))
  .limit(1)
```

**Warning signs:** Click handler always falls through to "entity not found" even for entities known to be in the DB.

### Pitfall 2: Single ref Binding Multiple Expanded Sections

**What goes wrong:** Vue's `ref="descContainerEl"` on a `v-for` element inside a template binds only to the last rendered instance. If the user expands two item sections simultaneously, clicks on the first section's links are not handled.

**Why it happens:** Vue's template ref semantic — `ref` on repeated elements in `v-for` produces an array in Vue 3, but only when using the array ref pattern (`ref="(el) => arr.push(el)`).

**How to avoid:** Attach the native click listener to the panel's root scrollable div (`panelEl` ref already exists on line 8 of CreatureDetailPanel.vue) rather than to the individual description containers. The listener bubbles up from any `.pf2e-link` click anywhere in the panel.

```typescript
// Use existing panelEl ref — no new ref needed
onMounted(() => {
  panelEl.value?.addEventListener('click', handleDescriptionClick)
})
onBeforeUnmount(() => {
  panelEl.value?.removeEventListener('click', handleDescriptionClick)
})
```

### Pitfall 3: Tailwind Purge Removing Dynamic Classes

**What goes wrong:** Tailwind's content scan may not detect Tailwind class strings assembled dynamically in JS (e.g., `'text-' + color`). Classes that never appear as complete strings in source files get purged from the production bundle.

**Why it happens:** Tailwind scans files for complete class name strings. String concatenation breaks detection.

**How to avoid:** The `DAMAGE_TYPE_COLORS` map should contain complete Tailwind class strings (`'text-orange-600'`, not `'orange'`), and the map object must live in a file that Tailwind's content glob covers (e.g., any `.ts` file in `src/`). Vite + Tailwind's default config covers `src/**/*.{ts,vue}`.

### Pitfall 4: Regex Order Matters

**What goes wrong:** Running the labeled `@UUID` pattern after the unlabeled pattern causes the unlabeled regex to consume the `@UUID[...]{Label}` token before the labeled pattern gets a chance, stripping the label.

**Why it happens:** Both patterns start with `@UUID[Compendium.pf2e.`. If the unlabeled one runs first on `@UUID[...]{Label}`, it matches `@UUID[...]` and leaves `{Label}` as literal text.

**How to avoid:** Always run the labeled pattern (with `\{([^}]+)\}`) BEFORE the unlabeled pattern. This is the order in the plan.txt reference and in the Pattern 1 code above.

### Pitfall 5: onMounted Listener Timing

**What goes wrong:** If `handleDescriptionClick` is attached in `onMounted` but the panel is conditionally rendered (`v-if="store.isOpen"`), the component mounts when the panel first opens — this is fine. But if the component is ever unmounted and remounted, `onBeforeUnmount` must clean up the listener to avoid duplicates.

**Why it happens:** Vue lifecycle — `onMounted` fires once per component instance mount. `CreatureDetailPanel` is mounted at the root of `CombatTracker` (not conditionally), so `v-if` on the inner panel div is already the existing pattern. The component lifecycle fires once — no issue.

**How to avoid:** Confirm the listener is on `panelEl` (the outer ref that always exists when component is mounted, independent of `store.isOpen`). The `v-if` is on the inner panel div, not the component root.

---

## Code Examples

### sanitizeDescription() — Complete Reference

```typescript
// Source: plans/plan.txt §Phase 4 (lines 543-596), adapted for Tailwind + fallback passes

export function sanitizeDescription(html: string): string {
  return html
    .replace(
      /@UUID\[Compendium\.pf2e\.([^.\]]+)\.Item\.([^\]]+)\]\{([^}]+)\}/g,
      (_match, pack, id, label) =>
        `<a data-entity-pack="${pack}" data-entity-id="${id}" class="pf2e-link cursor-pointer text-blue-600 underline hover:text-blue-800 font-medium">${label}</a>`
    )
    .replace(
      /@UUID\[Compendium\.pf2e\.([^.\]]+)\.Item\.([^\]]+)\]/g,
      (_match, pack, id) =>
        `<a data-entity-pack="${pack}" data-entity-id="${id}" class="pf2e-link cursor-pointer text-blue-600 underline hover:text-blue-800 font-medium">[${id}]</a>`
    )
    .replace(
      /@Damage\[([^\]]+)\]/g,
      (_match, expr) => {
        const [formulaPart] = expr.split('|');
        const clean = formulaPart.replace(/\[([^\]]+)\]/g, ' $1').trim();
        const typeMatch = formulaPart.match(/\[([^\]]+)\]/);
        const colorClass = typeMatch ? (DAMAGE_TYPE_COLORS[typeMatch[1]] ?? 'text-gray-800') : 'text-gray-800';
        return `<span class="pf2e-damage font-bold ${colorClass}">${clean}</span>`;
      }
    )
    .replace(
      /@Check\[([^\]]+)\]/g,
      (_match, expr) => {
        const parts = expr.split('|');
        const type = parts[0];
        const dcPart = parts.find((p: string) => p.startsWith('dc:'));
        const basic = parts.includes('basic');
        const dc = dcPart ? dcPart.split(':')[1] : '';
        return `<span class="pf2e-check font-bold text-gray-900">${basic ? 'basic ' : ''}${type}${dc ? ` DC ${dc}` : ''}</span>`;
      }
    )
    .replace(
      /@Template\[([^\]]+)\]/g,
      (_match, expr) => {
        const parts = expr.split('|');
        const type = parts[0];
        const distPart = parts.find((p: string) => p.startsWith('distance:'));
        const dist = distPart ? distPart.split(':')[1] : '';
        return `<span class="pf2e-template font-bold text-gray-800">${type}${dist ? ` ${dist} ft.` : ''}</span>`;
      }
    )
    // Fallback: unrecognized @Type[...]{Label} → keep label only
    .replace(/@\w+\[[^\]]*\]\{([^}]+)\}/g, (_match, label) => label)
    // Fallback: unrecognized @Type[content] → keep bracket content
    .replace(/@\w+\[([^\]]*)\]/g, (_match, content) => content);
}
```

### Unit Test Pattern for sanitizeDescription

```typescript
// src/lib/__tests__/description-sanitizer.test.ts
import { describe, it, expect } from 'vitest'
import { sanitizeDescription } from '../description-sanitizer'

describe('sanitizeDescription', () => {
  it('converts @UUID with label to pf2e-link anchor', () => {
    const input = '@UUID[Compendium.pf2e.spells.Item.abc123]{Fireball}'
    const output = sanitizeDescription(input)
    expect(output).toContain('data-entity-pack="spells"')
    expect(output).toContain('data-entity-id="abc123"')
    expect(output).toContain('class="pf2e-link')
    expect(output).toContain('>Fireball<')
  })

  it('converts @Damage[2d6[fire]] to styled span', () => {
    const output = sanitizeDescription('@Damage[2d6[fire]]')
    expect(output).toContain('2d6 fire')
    expect(output).toContain('pf2e-damage')
    expect(output).toContain('text-orange-600')
  })

  it('converts @Check[reflex|dc:25|basic] to readable text', () => {
    const output = sanitizeDescription('@Check[reflex|dc:25|basic]')
    expect(output).toContain('basic reflex DC 25')
    expect(output).toContain('pf2e-check')
  })

  it('converts @Template[cone|distance:60] to readable text', () => {
    const output = sanitizeDescription('@Template[cone|distance:60]')
    expect(output).toContain('cone 60 ft.')
    expect(output).toContain('pf2e-template')
  })

  it('strips unrecognized @-syntax keeping label', () => {
    const output = sanitizeDescription('@Localize[PF2E.SomeKey]{Localized Text}')
    expect(output).toBe('Localized Text')
  })

  it('strips unrecognized @-syntax with no label keeping bracket content', () => {
    const output = sanitizeDescription('@Action[strike]')
    expect(output).toBe('strike')
  })

  it('passes through non-@ HTML unchanged', () => {
    const input = '<p><strong>Persistent Damage</strong></p>'
    expect(sanitizeDescription(input)).toBe(input)
  })

  it('passes through malformed @-syntax unchanged', () => {
    const input = '@UUID[malformed'
    expect(sanitizeDescription(input)).toBe(input)
  })

  it('labeled @UUID runs before unlabeled to preserve label', () => {
    const input = '@UUID[Compendium.pf2e.spells.Item.abc]{Fireball}'
    const output = sanitizeDescription(input)
    // Should contain "Fireball" as link text, not {Fireball} as literal
    expect(output).toContain('>Fireball<')
    expect(output).not.toContain('{Fireball}')
  })
})
```

### DB Lookup for @UUID Click (using sourceId column)

```typescript
// Entity lookup using sourceId — correct join key for @UUID format
import { eq } from 'drizzle-orm'
import { db } from '@/lib/database'
import { pf2eEntities } from '@/lib/schema'

async function resolveEntityByUUID(pack: string, id: string): Promise<any | null> {
  // sourceId format: "Compendium.pf2e.{pack}.Item.{id}"
  const sourceId = `Compendium.pf2e.${pack}.Item.${id}`
  const results = await db
    .select()
    .from(pf2eEntities)
    .where(eq(pf2eEntities.sourceId, sourceId))
    .limit(1)
  if (results.length === 0) return null
  return JSON.parse((results[0] as any).rawData)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DOMParser tree walking for Foundry HTML | Regex chain (chain of .replace()) | Plan established at project start | Regex is sufficient for Foundry's predictable @-syntax; no AST overhead |
| Inline `<style>` for v-html content | Tailwind utility classes embedded in generated HTML strings | Vue 3 scoped styles limitation | Utility classes in generated strings work because Tailwind is global |
| onClick handler per link | Event delegation on panel container | Phase 5 established single-panel pattern | One listener handles all links regardless of how many items are expanded |

---

## Open Questions

1. **sourceId column population**
   - What we know: `pf2eEntities.sourceId` column exists (schema.ts line 5) and is indexed (line 15: `idxSourceId`)
   - What's unclear: Whether the Phase 4 sync process actually stores the full Foundry sourceId path (`Compendium.pf2e.{pack}.Item.{id}`) or another format
   - Recommendation: Before implementing the click handler, query a sample entity from the DB and inspect the `sourceId` value to confirm format. If it's stored differently, fall back to pack+slug query (which would require the @UUID id to be the slug, which is true for pack files where filenames are slugs)

2. **@UUID entity type beyond "Item"**
   - What we know: The reference implementation handles `Compendium.pf2e.PACK.Item.ID` format
   - What's unclear: Foundry @UUID can also reference `Actor.ID` or `JournalEntry.PageID`. These may appear in some PF2e descriptions.
   - Recommendation: The locked decision already handles this — non-pf2e and unrecognized @UUID formats fall through to plain text. The labeled/unlabeled regex patterns only match `\.Item\.` explicitly, so Actor/JournalEntry references naturally fall through to the fallback passes.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.8 + jsdom |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npm test -- --reporter=verbose src/lib/__tests__/description-sanitizer.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DESC-01 | @UUID with label → `<a data-entity-pack data-entity-id class="pf2e-link">Label</a>` | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ Wave 0 |
| DESC-01 | @UUID without label → `<a>` with id as text | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ Wave 0 |
| DESC-01 | Click on pf2e-link → DB lookup → navigateToCanonical called | unit | `npm test -- src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ Wave 0 (new test case) |
| DESC-01 | Click on pf2e-link → entity not in DB → link gets muted classes | unit | `npm test -- src/components/__tests__/CreatureDetailPanel.test.ts` | ❌ Wave 0 (new test case) |
| DESC-02 | @Damage[2d6[fire]] → `<span class="pf2e-damage...">2d6 fire</span>` | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ Wave 0 |
| DESC-02 | @Check[reflex\|dc:25\|basic] → "basic reflex DC 25" | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ Wave 0 |
| DESC-02 | @Template[cone\|distance:60] → "cone 60 ft." | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ Wave 0 |
| DESC-01 + DESC-02 | Unrecognized @-syntax stripped, label preserved | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ Wave 0 |
| DESC-01 + DESC-02 | Malformed @-syntax passes through unchanged | unit | `npm test -- src/lib/__tests__/description-sanitizer.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- src/lib/__tests__/description-sanitizer.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/__tests__/description-sanitizer.test.ts` — covers DESC-01, DESC-02 (all sanitizer unit tests)
- [ ] New test cases in `src/components/__tests__/CreatureDetailPanel.test.ts` — covers DESC-01 click delegation behavior (file exists, needs new test cases added)

*(Existing test infrastructure: Vitest + jsdom + @vue/test-utils + Pinia test setup all present — no framework install needed)*

---

## Sources

### Primary (HIGH confidence)

- `plans/plan.txt` §Phase 4 (lines 532–596) — Complete reference implementation of `sanitizeDescription()` with all four regex patterns; used as direct source for Pattern 1
- `src/components/CreatureDetailPanel.vue` — Confirmed `v-html` at line 240, `getDescription()` at lines 76–79, `panelEl` ref at line 8; event delegation attachment point identified
- `src/lib/creature-resolver.ts` — Established pattern for Drizzle DB lookup (select → from → where → await); click handler follows identical structure
- `src/lib/schema.ts` — Confirmed `pf2eEntities` columns: `sourceId`, `pack`, `slug`, `entityType`, `rawData`; `idxSourceId` index at line 15
- `src/stores/creatureDetail.ts` — Confirmed `navigateToCanonical(rawData, name)` signature at line 17
- `vitest.config.ts` — Confirmed test setup: jsdom environment, `src/**/*.{test,spec}.ts` glob, setup files at `src/__tests__/setup.ts` and `src/__tests__/global-setup.ts`
- `src/__tests__/setup.ts` — Pinia instance per test (beforeEach pattern)
- `src/__tests__/global-setup.ts` — Vue Transition stub for all tests

### Secondary (MEDIUM confidence)

- Vue 3 docs: `v-html` directive behavior — styles in scoped blocks do not apply to v-html content; this is documented Vue 3 behavior. Tailwind utility classes in generated HTML strings work because Tailwind processes the entire `src/` directory globally.
- Tailwind CSS docs: content purge scans for complete class name strings — dynamic string concatenation breaks purge detection; full class strings in source files are safe.

### Tertiary (LOW confidence)

- Foundry VTT @UUID format convention: `Compendium.{namespace}.{packName}.{documentType}.{id}` — inferred from the reference patterns in plan.txt and the pf2e system source; not verified against current Foundry v12 docs but consistent with all observed data in the codebase.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use; no new dependencies
- Architecture: HIGH — reference implementation from plan.txt directly applies; existing patterns (creature-resolver, creatureDetail store) verified in source
- Pitfalls: HIGH for regex ordering and Tailwind purge (well-known); MEDIUM for sourceId format (requires runtime verification per Open Question 1)
- Validation: HIGH — existing Vitest infrastructure is confirmed; test patterns from creature-resolver.test.ts are directly applicable

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable domain — regex + Vue 3 patterns don't change rapidly)
