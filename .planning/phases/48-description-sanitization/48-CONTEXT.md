# Phase 48: Description Sanitization - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove all unresolved Foundry @-tokens from every UI surface that displays entity descriptions. No architecture changes — purely fixing display output. Three targeted file changes.

</domain>

<decisions>
## Implementation Decisions

### @item.rank / @item.level handling
- **D-01:** Strip `@item.rank` and `@item.level` tokens entirely (no placeholder). Example: `"deals @item.rank × 2d6 fire damage"` → `"deals × 2d6 fire damage"`. The DM knows the spell rank — the stripped output is acceptable.

### Missing call sites
- **D-02:** `ItemReferenceDrawer.tsx` — replace `stripHtml(item.description)` with `sanitizeFoundryText(item.description)`. Update import accordingly.
- **D-03:** `SpellReferenceDrawer.tsx` — replace `stripHtml(spell.description)` with `sanitizeFoundryText(spell.description)`. Update import accordingly.

### Already-safe surfaces (no change needed)
- **D-04:** `CreatureStatBlock.tsx` creature.description — already sanitized at DB sync time via `mappers.ts` (`resolveFoundryTokens + stripHtml`). No render-time fix needed.
- **D-05:** `DyingCascadeDialog` — uses `.includes()` for filtering, not rendering. No change needed.

### Claude's Discretion
- Exact regex pattern for `@item.rank` / `@item.level` stripping in `foundry-tokens.ts`
- Whether to use a combined `@item\.\w+` pattern or specific per-property patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Token resolver
- `src/shared/lib/foundry-tokens.ts` — canonical sanitize functions (`resolveFoundryTokens`, `sanitizeFoundryText`). Add `@item.rank`/`@item.level` handling here.

### Affected components
- `src/entities/item/ui/ItemReferenceDrawer.tsx` — swap `stripHtml` → `sanitizeFoundryText`
- `src/entities/spell/ui/SpellReferenceDrawer.tsx` — swap `stripHtml` → `sanitizeFoundryText`

### Already-correct reference
- `src/entities/creature/model/mappers.ts` — shows the correct pattern: `stripHtml(resolveFoundryTokens(...))`

### Requirements
- `.planning/REQUIREMENTS.md` §SANITIZE — SANITIZE-01 and SANITIZE-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sanitizeFoundryText(html)` in `src/shared/lib/foundry-tokens.ts` — canonical function, already imported by SpellInlineCard, FeatInlineCard, ConditionSection, ActionsPage, ConditionsPage, HazardsPage
- `resolveFoundryTokens(text)` — lower-level function used by mappers.ts

### Established Patterns
- Render-time sanitization is the project pattern: components import `sanitizeFoundryText` from `@/shared/lib/foundry-tokens` and wrap description strings at the call site
- NOT sync-time: descriptions are stored raw in SQLite (except creatures which go through mappers.ts)

### Integration Points
- `foundry-tokens.ts` is the single place to add new token patterns — all existing sanitization routes through it
- ItemReferenceDrawer and SpellReferenceDrawer currently import from `@/shared/lib/html` — need to switch to `@/shared/lib/foundry-tokens`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — mechanical fixes only. Three changes total:
1. Add `@item.rank`/`@item.level` strip pattern to `resolveFoundryTokens` in `foundry-tokens.ts`
2. Fix `ItemReferenceDrawer.tsx` import + call
3. Fix `SpellReferenceDrawer.tsx` import + call

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 48-description-sanitization*
*Context gathered: 2026-04-07*
