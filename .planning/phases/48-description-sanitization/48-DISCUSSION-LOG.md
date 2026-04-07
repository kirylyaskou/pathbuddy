# Phase 48: Description Sanitization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 48-description-sanitization
**Areas discussed:** @item tokens, Missing call sites

---

## @item.rank / @item.level

| Option | Description | Selected |
|--------|-------------|----------|
| Удалить | `@item.rank × 2d6` → `× 2d6` — чисто, DM знает ранг | ✓ |
| Заменить на [rank] | `@item.rank × 2d6` → `[rank] × 2d6` — явный placeholder | |
| Слово "rank" | `@item.rank × 2d6` → `rank × 2d6` — читаемо но амбигюно | |

**User's choice:** Удалить (strip entirely)
**Notes:** DM knows the spell rank, stripped output is acceptable for a DM tool.

---

## Missing call sites

Full audit performed. Two sites confirmed:
- `ItemReferenceDrawer.tsx:151` — `stripHtml` without token resolver
- `SpellReferenceDrawer.tsx:112` — `stripHtml` without token resolver

**Verified safe:**
- `CreatureStatBlock.tsx:487` — data pre-sanitized via mappers.ts at sync time
- `DyingCascadeDialog` — filtering only, not rendering

---

## Claude's Discretion

- Exact regex pattern for `@item.rank`/`@item.level` stripping

## Deferred Ideas

None.
