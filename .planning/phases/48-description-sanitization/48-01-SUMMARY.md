---
plan: "48-01"
phase: 48
status: complete
completed: 2026-04-07
commit: f938670b
---

# Summary: Plan 48-01 — Description Sanitization

## One-liner

Strip `@item.*` inline tokens in `resolveFoundryTokens`; switch `ItemReferenceDrawer` and `SpellReferenceDrawer` from `stripHtml` to `sanitizeFoundryText`.

## What was built

Three targeted changes to eliminate unresolved Foundry @-tokens from item and spell description surfaces:

1. **`foundry-tokens.ts`** — Added `/@item\.\w+/g → ''` replacement immediately before the existing catch-all, covering `@item.rank`, `@item.level`, and any other `@item.*` inline property references.

2. **`ItemReferenceDrawer.tsx`** — Replaced `import { stripHtml } from '@/shared/lib/html'` with `import { sanitizeFoundryText } from '@/shared/lib/foundry-tokens'` and updated the call site: `stripHtml(item.description)` → `sanitizeFoundryText(item.description)`.

3. **`SpellReferenceDrawer.tsx`** — Same import and call site swap as above.

## Key decisions

- Used combined `/@item\.\w+/g` pattern (covers all `@item.*` variants, not just rank/level)
- Pattern placed BEFORE the catch-all `@\w+\[...]` to handle bare `@item.prop` syntax (no brackets)
- No changes to sync pipeline or DB — render-time sanitization is the established project pattern

## Requirements addressed

- SANITIZE-01 ✓ — `@item.rank` / `@item.level` no longer visible in displayed text
- SANITIZE-02 ✓ — `@UUID`, `@Check`, `@Template`, `@Damage` now resolved in both drawers (via `sanitizeFoundryText` → `resolveFoundryTokens`)

## Self-Check: PASSED

- `foundry-tokens.ts` contains `text.replace(/@item\.\w+/g, '')` before catch-all ✓
- `ItemReferenceDrawer.tsx` imports `sanitizeFoundryText`, no `stripHtml` ✓
- `SpellReferenceDrawer.tsx` imports `sanitizeFoundryText`, no `stripHtml` ✓
