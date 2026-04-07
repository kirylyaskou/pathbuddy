# Phase 12: Stat Block + Bestiary Data Quality - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 12-stat-block-bestiary-data-quality
**Areas discussed:** @-syntax rendering, Full skills display, Source names

---

## @UUID Tokens

| Option | Description | Selected |
|--------|-------------|----------|
| Alias-first | Use {alias} if present, last path segment as fallback | ✓ |
| Strip completely | Remove entire @UUID token including alias | |

**User's choice:** Alias-first
**Notes:** `@UUID[Compendium.pf2e.conditionitems.Item.Enfeebled]{Enfeebled 2}` → `Enfeebled 2`

---

## @Damage Tokens

| Option | Description | Selected |
|--------|-------------|----------|
| Format as dice | `@Damage[9d10[untyped]]` → `9d10 untyped` | ✓ |
| Strip token | Remove @Damage, keep surrounding text | |

**User's choice:** Format as dice
**Notes:** `@Damage[2d10[healing]]` → `2d10 healing` (not "HP healing")

---

## @Check and @Template Tokens

| Option | Description | Selected |
|--------|-------------|----------|
| Parse to readable text | `@Check[type:perception\|dc:20]` → `DC 20 Perception check`; `@Template[type:cone\|distance:15]` → `15-foot cone` | ✓ |
| Strip tokens | Remove entire token | |

**User's choice:** Parse to readable text

---

## @Localize Tokens

| Option | Description | Selected |
|--------|-------------|----------|
| Lookup lang file | Fetch en.json from GitHub, expand full text | ✓ (at import time) |
| Humanize key | Last part of key, camelCase split | |
| Strip completely | Remove token | |

**User's choice:** Lookup at import/sync time
**Notes:** User clarified that `refs/` is a dev crutch to be removed. en.json should be fetched from `https://github.com/foundryvtt/pf2e/blob/v13-dev/static/lang/en.json` during sync pipeline, not read from refs/. @Localize resolved before INSERT into SQLite so raw_json stores clean text.

---

## Skills Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All 17 skills always | Show all 17, calculated for missing ones | ✓ |
| Only trained skills | Only skills present in Foundry data (base > 0) | |

**User's choice:** All 17 skills always

---

## Untrained Formula

| Option | Description | Selected |
|--------|-------------|----------|
| level - 2 | Standard PF2e without PWOL | |
| level + 0 | Simple: untrained = level | ✓ |
| ~level | Approximate with visual marker | |

**User's choice:** level + 0
**Notes:** Slightly generous but readable.

---

## Source Names Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Extract at sync time | Store `source_name` column from publication.title | ✓ |
| Static TS map | Hardcode 60+ folder → book name mappings | |
| Dynamic from raw_json | Parse at display time per source | |

**User's choice:** Extract at sync time
**Notes:** Add `source_name` column to entities table (migration). fetchDistinctSources() returns {pack, name} pairs. Filter queries by source_pack, displays source_name.

---

## AON GM Screen Reference

| Option | Description | Selected |
|--------|-------------|----------|
| Just add as canonical ref | Add URL to CONTEXT.md for planner/researcher | ✓ |

**User's choice:** Just add as canonical ref

---

## Claude's Discretion

- Visual treatment for untrained calculated skills (muted color vs `~` prefix)
- Formatting edge cases for @Check (missing dc) and @Template (unknown type)
- Skills sort order (alphabetical)
- Fallback when publication.title is empty (humanize folder name)

## Deferred Ideas

None mentioned during discussion.
