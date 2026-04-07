# Phase 12: Stat Block + Bestiary Data Quality - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Data quality improvements to the existing stat block and bestiary display — making what's already rendered more readable and complete. Three independent improvements: @-syntax token rendering in ability descriptions, full 17-skill list in stat blocks, and human-readable book names in the sources filter. No new architecture, no new pages.

</domain>

<decisions>
## Implementation Decisions

### @-syntax Rendering (STAT-01)

All token resolution happens in `toCreatureStatBlockData()` in `src/entities/creature/model/mappers.ts`, extending the existing `stripHtml()` function. Tokens are processed AFTER HTML stripping.

- **D-01:** `@UUID[Compendium...]{alias}` → use `{alias}` text if present; if no alias, use the last path segment of the UUID (e.g., `Compendium.pf2e.conditionitems.Item.Enfeebled` → `Enfeebled`). Never show raw UUID paths to the user.
- **D-02:** `@Damage[9d10[untyped]]` → format as readable dice expression: `9d10 untyped`. Multiple damage types: `2d6[fire], 1d4[bleed]` → `2d6 fire plus 1d4 bleed`.
- **D-03:** `@Check[type:perception|dc:20]` → `DC 20 Perception check`. Type is capitalized; include "check" suffix.
- **D-04:** `@Template[type:cone|distance:15]` → `15-foot cone`. `@Template[type:emanation|distance:30]` → `30-foot emanation`. Distance in feet.
- **D-05:** `@Localize[PF2E.NPC.Abilities.Glossary.ShieldBlock]` → resolved at **import/sync time** (not render time). The Foundry VTT sync pipeline downloads `en.json` from GitHub alongside the data ZIP and substitutes `@Localize` keys with their English text before writing to SQLite. The `raw_json` stored in the DB already has clean text — no runtime lookup needed.

### Skills Display (STAT-02)

- **D-06:** Show **all 17 PF2e skills** always — not just skills present in Foundry data. The 17 standard skills: Acrobatics, Arcana, Athletics, Crafting, Deception, Diplomacy, Intimidation, Medicine, Nature, Occultism, Performance, Religion, Society, Stealth, Survival, Thievery, plus any Lore skills explicitly in Foundry data.
- **D-07:** For skills not present in Foundry data (untrained), calculate modifier as: `level + 0`. No subtraction, no ability mod — keeps it simple and slightly generous. Skills present in Foundry data use their exact `base` value as before.
- **D-08:** Untrained calculated skills should be visually distinct from explicitly listed ones — use muted/secondary color or `~` prefix (Claude's discretion).

### Source Names Display (BEST-04)

- **D-09:** Extract `system.details.publication.title` from each entity's raw_json at **sync time** and store as a new `source_name` column in the `entities` SQLite table. Migration required.
- **D-10:** `fetchDistinctSources()` returns `{ pack: string; name: string }[]` pairs. The filter still queries by `source_pack` (unchanged SQL), but the dropdown displays `source_name` to the user.
- **D-11:** Filter value sent to the query remains `source_pack` (folder name) — only the display label changes. No changes to existing filter logic in `BestiaryFilterBar.tsx` beyond the data shape.

### Claude's Discretion
- Visual treatment for untrained calculated skills (muted color vs `~` prefix)
- Exact formatting details for @Check/@Template edge cases (missing dc, unknown type)
- Order of 17 skills (alphabetical is fine)
- Whether to use a fallback when `publication.title` is empty (fall back to humanized folder name)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PF2e Rules Reference
- `https://2e.aonprd.com/GMScreen.aspx` — AON GM Screen: skill formulas, DC by level, action reference. Verify any PF2e formula against this.

### Foundry VTT Data
- `https://github.com/foundryvtt/pf2e/blob/v13-dev/static/lang/en.json` — English localization file for @Localize key resolution. Must be downloaded during sync, not bundled at build time.

### Existing Code (critical paths)
- `src/entities/creature/model/mappers.ts` — `toCreatureStatBlockData()` (line 24): where all stat block mapping happens. `stripHtml()` (line 146): extend this or add a new `resolveTokens()` step before it.
- `src/entities/creature/ui/CreatureStatBlock.tsx` — Skills section (line 201–217): renders `creature.skills[]`, already handles flex-wrap layout.
- `src/features/bestiary-browser/ui/BestiaryFilterBar.tsx` — Source filter (line 103–120): uses `fetchDistinctSources()` result directly.
- `src/shared/api/creatures.ts` — `fetchDistinctSources()` (line 115): returns `string[]` today, needs to return `{ pack: string; name: string }[]`.
- `src/shared/api/sync.ts` — sync pipeline: add en.json download + @Localize resolution here.
- `src/shared/db/migrations/` — add migration to add `source_name` column to entities table.
- `src-tauri/src/sync.rs` — `extract_pack_name()` (line 297): produces the `source_pack` folder name stored in DB.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `stripHtml()` in `mappers.ts:146`: exists but only strips HTML tags and HTML entities. Extend with a `resolveFoundryTokens()` pre-pass before HTML stripping.
- `CreatureStatBlockData.skills[]` in `types.ts`: `{ name: string; modifier: number }[]` — add optional `calculated?: boolean` flag to distinguish untrained derived skills.
- `fetchDistinctSources()` in `creatures.ts:115`: needs return type change from `string[]` to `{ pack: string; name: string }[]`.

### Established Patterns
- All creature data mapping happens in `mappers.ts` — token resolution belongs there too, not in the component.
- SQLite migrations use `src/shared/db/migrations/` SQL files loaded via `import.meta.glob`.
- Sync pipeline in `src/shared/api/sync.ts` already downloads a ZIP and processes it — en.json download follows the same pattern.

### Integration Points
- `BestiaryFilterBar.tsx` calls `fetchDistinctSources()` in a `useEffect` — return type change is a breaking change, update both the API and the component.
- The `source` field in `CreatureStatBlockData` already reads `details.publication?.title` as the first fallback (line 92 in mappers.ts) — this is consistent with the approach.
- The new `source_name` column needs to be nullable (some entities may not have `publication.title`).

</code_context>

<specifics>
## Specific Ideas

- `@Localize` keys for NPC ability glossary (ShieldBlock, GolemAntimagic, etc.) are verbose multi-paragraph texts — they should be fully expanded, not just named.
- The `refs/` directory is a development crutch and will be removed after development completes. Do not write any code that reads from `refs/` — all data comes from SQLite or GitHub downloads at runtime.
- For @Damage with healing type: `@Damage[2d10[healing]]` → `2d10 healing` (not "2d10 HP healing").

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 12-stat-block-bestiary-data-quality*
*Context gathered: 2026-04-02*
