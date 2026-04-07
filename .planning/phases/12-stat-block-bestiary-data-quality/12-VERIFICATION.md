---
phase: 12-stat-block-bestiary-data-quality
verified: 2026-04-02T10:00:00Z
status: passed
score: 3/3 must-haves verified
re_verification: false
---

# Phase 12: Stat Block & Bestiary Data Quality Verification Report

**Phase Goal:** Creature ability descriptions are human-readable instead of raw Foundry markup, the stat block shows the complete 17-skill list, and the bestiary sources filter shows recognizable book names
**Verified:** 2026-04-02
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Ability descriptions show human-readable text instead of raw `@UUID[...]`, `@Damage[...]`, `@Check[...]`, `@Template[...]` markup | VERIFIED | `resolveFoundryTokens()` in mappers.ts lines 169–207 handles all 5 token types; called before `stripHtml()` at lines 71 and 113 |
| 2 | Stat block always shows 16 standard skills + lore skills (perception shown separately in core stats = 17 total coverage) | VERIFIED | STANDARD_SKILLS array (16 entries) + lore expansion in mappers.ts lines 75–105; unconditional render in CreatureStatBlock.tsx lines 201–215 |
| 3 | Bestiary sources filter shows book names (e.g. "Monster Core") instead of folder names (e.g. "pf2e") | VERIFIED | `source_name` column + `fetchDistinctSources()` returns `{pack, name}[]`; BestiaryFilterBar renders `s.name` with `s.pack` as filter value |

**Score:** 3/3 truths verified

---

## Required Artifacts

### Plan 12-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/entities/creature/model/types.ts` | `calculated?: boolean` in skills type | VERIFIED | Line 17: `skills: { name: string; modifier: number; calculated?: boolean }[]` |
| `src/entities/creature/model/mappers.ts` | `resolveFoundryTokens()` + 16-skill expansion | VERIFIED | Lines 75–105 (skills), 169–207 (token resolver); all 5 token patterns present |
| `src/entities/creature/ui/CreatureStatBlock.tsx` | Unconditional skills render, opacity-40 for calculated | VERIFIED | Lines 201–215; no `skills.length > 0` guard; `opacity-40` class; `modifier >= 0 ? "+"` sign handling |

### Plan 12-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/shared/db/migrations/0007_source_name.sql` | `ALTER TABLE entities ADD COLUMN source_name TEXT` | VERIFIED | File exists, contains exact expected SQL |
| `src-tauri/src/sync.rs` | `source_name` field in `RawEntity`, extraction from `/system/details/publication/title` | VERIFIED | Lines 23, 87–91, 109; empty-string filter at line 90 |
| `src/shared/api/sync.ts` | 16-column INSERT, `getLocalizeValue`, `@Localize` resolution, `source_name` in interface | VERIFIED | Lines 22, 35–43, 57, 75, 79, 113–136 |
| `src/shared/api/creatures.ts` | `source_name` in `CreatureRow`; `fetchDistinctSources` returns `{pack, name}[]` | VERIFIED | Lines 19, 116–125; fallback `r.source_name ?? r.source_pack` at line 123 |
| `src/features/bestiary-browser/ui/BestiaryFilterBar.tsx` | `useState<{ pack: string; name: string }[]>`, `s.pack`/`s.name` in SelectItem | VERIFIED | Lines 27, 113–116 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `mappers.ts` ability description | `resolveFoundryTokens()` | Called before `stripHtml()` at line 71 | WIRED | `stripHtml(resolveFoundryTokens(item.system?.description?.value \|\| ''))` |
| `mappers.ts` creature description | `resolveFoundryTokens()` | Called before `stripHtml()` at line 113 | WIRED | `stripHtml(resolveFoundryTokens(details.publicNotes \|\| ...))` |
| `sync.ts` `syncFoundryData()` | `@Localize` resolution | In-flight mutation before `batchInsertEntities()` | WIRED | Lines 128–136 resolve all entities before line 139 insert |
| `sync.rs` `extract_entity()` | `source_name` | `.pointer("/system/details/publication/title")` | WIRED | Lines 87–91; included in `RawEntity` return at line 109 |
| `creatures.ts` `fetchDistinctSources()` | `{pack, name}[]` | `SELECT DISTINCT source_pack, source_name` | WIRED | Line 119; null fallback at line 123 |
| `BestiaryFilterBar` | `fetchDistinctSources()` | `useEffect` → `setSources` | WIRED | Lines 29–31 |
| `BestiaryFilterBar` SelectItem | `s.name` display / `s.pack` filter value | Object property access | WIRED | Lines 114–115; filter onValueChange passes pack string |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `CreatureStatBlock.tsx` abilities descriptions | `ability.description` | `mappers.ts` → `resolveFoundryTokens()` → `stripHtml()` → Foundry JSON `raw_json` | Yes — transforms live DB data | FLOWING |
| `CreatureStatBlock.tsx` skills section | `creature.skills[]` | `mappers.ts` STANDARD_SKILLS expansion from `system.skills` in `raw_json` | Yes — reads Foundry skill data, derives fallback from `base.level` | FLOWING |
| `BestiaryFilterBar` sources Select | `sources` state | `fetchDistinctSources()` → SQLite `SELECT DISTINCT source_pack, source_name` | Yes — real DB query with `source_name` populated at sync time | FLOWING |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — requires running Tauri desktop app + live Foundry VTT sync. All behaviors depend on the Tauri WebView and SQLite plugin at runtime. No standalone runnable entry points exist for these data paths.

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| STAT-01 | 12-01 | Ability descriptions render @-syntax as human-readable text | SATISFIED | `resolveFoundryTokens()` handles @UUID (with/without alias), @Damage (multi-type plus separator), @Check (DC prefix), @Template (distance-foot type), @Localize (stripped as fallback); called at both description call sites |
| STAT-02 | 12-01 | Stat block shows all 17 PF2e skills with modifiers | SATISFIED (with note) | 16 standard skills in STANDARD_SKILLS array + perception already displayed in core stats section = 17 total PF2e skills covered; design decision documented in SUMMARY key-decisions |
| BEST-04 | 12-02 | Sources filter shows book names not folder names | SATISFIED | End-to-end: Rust extracts `publication.title` → SQLite `source_name` column → `fetchDistinctSources()` returns `{pack, name}[]` → BestiaryFilterBar renders `s.name` |

**Note on STAT-02:** The requirement says "all 17 PF2e skills." The implementation shows 16 skills in the skills section + perception in the core stats. This is correct per PF2e rules (perception is not a trained skill, it is a separate statistic). The plan SUMMARY explicitly documents this: "STANDARD_SKILLS array has 16 entries (note: plan objective says 17 but perception is separate, standard skills = 16 + perception displayed separately)." No gap.

**Orphaned requirements:** None. All three requirement IDs declared in plan frontmatter (`STAT-01`, `STAT-02`, `BEST-04`) are mapped to this phase in REQUIREMENTS.md and all are satisfied.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/shared/api/sync.ts` | 147–168 | `importLocalPacks()` does not run @Localize resolution before `batchInsertEntities()` | Info | @Localize tokens in locally-imported packs will not be resolved at sync time; display-time `resolveFoundryTokens()` fallback strips them (shows blank) rather than English text. The scope of plan 12-02 was limited to `syncFoundryData()`. |

No blocker or warning anti-patterns found.

---

## Human Verification Required

### 1. @-token rendering in ability descriptions

**Test:** Open any creature stat block (e.g. an elemental or undead with abilities). Read ability descriptions.
**Expected:** No raw `@UUID[Compendium.pf2e...]`, `@Damage[...]`, `@Check[...]`, or `@Template[...]` text visible. Descriptions should read naturally, e.g. "DC 20 Will check" not "@Check[type:will|dc:20]".
**Why human:** Requires live app + SQLite data loaded from Foundry VTT sync. Cannot grep for rendered output.

### 2. Source filter book names

**Test:** After a Foundry VTT sync, open the bestiary browser. Click the Source dropdown.
**Expected:** Options read "Monster Core", "Player Core", "Rage of Elements" etc., not "pf2e", "sf2e".
**Why human:** `source_name` is populated at sync time from live Foundry JSON. No way to verify the actual dropdown values without running a sync against real pf2e data.

### 3. Skills section — 16 skills always visible

**Test:** Open a stat block for a creature known to have minimal skills (e.g. a Zombie). Scroll to the Skills section.
**Expected:** All 16 standard skills visible; untrained ones appear faded (opacity-40); trained skills appear at full opacity with higher modifiers.
**Why human:** Visual opacity distinction requires UI rendering. Structural presence is verified; visual output is not.

---

## Gaps Summary

No gaps found. All three phase goal components are implemented end-to-end:

1. **Foundry markup → human-readable text**: `resolveFoundryTokens()` handles all 5 token types, called before `stripHtml()` at both text sanitization call sites in mappers.ts.

2. **Complete skill list**: 16 standard skills always rendered (unconditional, no length guard), with untrained skills derived from creature level and visually muted via opacity-40. Perception covered separately in core stats.

3. **Readable source names**: Full pipeline from Rust extraction of `publication.title` → SQLite `source_name` column → TypeScript `{pack, name}[]` API → SelectItem display with `s.name`.

**Minor observation (info only):** The `importLocalPacks()` path in sync.ts does not include @Localize resolution (only `syncFoundryData()` does). This is within the scope of plan 12-02, which targeted the remote sync path. The display-time fallback in `resolveFoundryTokens()` strips unresolved @Localize tokens rather than expanding them — acceptable degradation.

---

_Verified: 2026-04-02_
_Verifier: Claude (gsd-verifier)_
