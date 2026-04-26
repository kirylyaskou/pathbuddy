# AUTOMATED-VERIFY.md — Phase 114: Verification + Untranslated Regression

**Phase:** 114-verification-untranslated-regression  
**Requirements addressed:** VERIFY-03, UNTRANS-01, DEBT-02  
**Invocation:** Run before manual smoke. Failure here = stop, do not run smoke.  
**Note:** Sections 1–5 and 7 do NOT require booting the Tauri app. Section 6 requires one cold-boot cycle.

---

## Section 1 — Vendor pack inventory (Phase 109 non-regression)

**Purpose:** Phase 109 added 28 AP-specific packs bringing the total from 19 to 47. Drift in either direction (accidental add or remove) indicates a packaging error.

**Command:**
```bash
ls vendor/pf2e-locale-ru/pf2e/packs/*.json | wc -l
```

**Expected:** `47`

If count != 47: investigate `git status vendor/` — an unintended pack add/remove occurred between Phase 109 and the current HEAD. Do not proceed to smoke until resolved.

---

## Section 2 — Migration chain integrity (VERIFY-03)

**Purpose:** Confirms the 4-file migration sequence that wires `entity_items.description_loc` exists on disk in the correct order. The chain is the contractual state documented in Phase 111 SUMMARY.

**Command:**
```bash
ls src/shared/db/migrations/0044_*.sql \
   src/shared/db/migrations/0045_*.sql \
   src/shared/db/migrations/0046_*.sql \
   src/shared/db/migrations/0047_*.sql
```

**Expected output — 4 files, in order:**
```
src/shared/db/migrations/0044_entity_items.sql
src/shared/db/migrations/0045_translations_source_index.sql
src/shared/db/migrations/0046_translations_lookup_index.sql
src/shared/db/migrations/0047_entity_items_description.sql
```

**Why the chain matters:** `_migrations` table in `migrate.ts` tracks applied files by filename. Any rename or removal breaks the idempotence check — a "missing" filename would cause re-execution on every warm boot. Any gap in numbering would indicate an out-of-order apply.

If any file is missing: check git log for the relevant commit from Phase 111 (commits: `4371daa3` for 0047, earlier commits for 0044–0046).

---

## Section 3 — Migration 0047 ALTER TABLE shape

**Purpose:** Verifies the migration SQL matches what Phase 111 SUMMARY claims — `ALTER TABLE entity_items ADD COLUMN description_loc TEXT NULL`. This guards against a scenario where a different migration landed at 0047.

**Command:**
```bash
cat src/shared/db/migrations/0047_entity_items_description.sql
```

**Expected:** File contains exactly:
```sql
ALTER TABLE entity_items ADD COLUMN description_loc TEXT;
```
(Single statement; column is nullable — no DEFAULT, no NOT NULL constraint per Phase 111 decision. Actual file may include a trailing newline or comment — the `ALTER TABLE entity_items ADD COLUMN description_loc` prefix is the invariant to check.)

**Why:** Phase 112 wiring (`useCreatureItem`, `getCreatureItem` API) returns `description: string | null` based on this column. If the column name differs, the API query returns null for all rows regardless of seed state.

---

## Section 4 — Untranslated badge consumer sites unchanged (UNTRANS-01)

**Purpose:** UNTRANS-01 invariant — the badge predicate must remain `translation === null`, not a heuristic. This grep confirms no one has modified the consumer sites to a looser check (e.g. `!translation`, `translation?.length === 0`) between Phase 112 and Phase 114.

**Commands (run from repo root):**

**Creature badge consumer:**
```bash
rg -n "useContentTranslation\('creature'" src/
```
Expected: ≥1 hit. The creature badge fires at this call site. If 0 hits — the hook was removed or renamed; UNTRANS-01 is broken.

**Spell badge consumer sites:**
```bash
rg -n "useContentTranslation\('spell'" src/entities/spell/ src/widgets/
```
Expected: exactly 2 hits — `SpellCard.tsx:47` and `SpellReferenceDrawer.tsx:47` (per Phase 113 SUMMARY). If count differs, a new badge consumer was added (must be audited) or an existing one was removed (regression).

**Null predicate check:**
```bash
rg -n "translation === null" src/
```
Expected: ≥3 hits (creature site + 2 spell sites). The badge logic must read `translation === null` — this is the UNTRANS-01 invariant. If any badge site uses a looser predicate the badge may fire incorrectly (false negative = badge absent when translation missing) or not fire at all.

**Pass criteria:** All three greps return expected hit counts. Any deviation requires investigation before smoke proceeds.

---

## Section 5 — getCreatureItem API surface unchanged (Phase 111 carry)

**Purpose:** Phase 112 wiring (`useCreatureItem` hook, `CreatureStrikesSection`, `CreatureAbilitiesSection`) depends on the `getCreatureItem` export from `src/shared/api/translations.ts`. If the export was renamed or removed, all strike/ability description lookups silently fall back to EN regardless of locale.

**Command:**
```bash
rg -n "export async function getCreatureItem" src/shared/api/translations.ts
```

**Expected:** exactly 1 hit.

If 0 hits: the export was renamed or removed — Phase 112 consumers are broken. Check `src/shared/api/translations.ts` and restore the export if missing.

---

## Section 6 — Cold-boot migration log capture (VERIFY-03 manual half)

**Purpose:** Confirms the migration chain executes cleanly on first cold boot and is idempotent on subsequent warm boots. Also confirms Phase 113 ingest diagnostic — zero bestiary-derived spell rows added.

**This section requires app boot.** Capture devtools console output.

**Steps:**

1. Delete local DB: `%APPDATA%\com.pathmaid.app\pathmaid.db` (Windows)
   Or: `rm -f "$APPDATA/com.pathmaid.app/pathmaid.db"` from bash.

2. Cold boot: `cd D:/pathmaid && pnpm tauri dev`

3. Open browser devtools (F12 in the Tauri WebView).

4. **Expected log lines on first cold boot:**
   ```
   [migrate] applying 0047_entity_items_description.sql
   ```
   (0044–0046 may also appear if DB was fully deleted; 0047 is the Phase 111 migration.)

5. **Restart without deleting DB (warm boot):**
   `Ctrl+C` → `pnpm tauri dev`

6. **Expected: 0047 NOT in the applying list on warm boot.** Idempotence gate — `_migrations` table records 0047 as already applied, loader skips it.

7. **Phase 113 invariant — check on every boot:**
   ```
   [ingest] bestiary-derived spell rows: added=0, suppressed=0
   ```
   This line must appear. If `added>0` — a new AP-only spell entry slipped through Signal C; audit `isSpellShapedActorItem` logic. If line absent entirely — diagnostic logging was removed (regression check).

**Pass criteria:** Migration 0047 applied on cold boot, absent on warm boot. Phase 113 diagnostic line present with `added=0`.

This constitutes VERIFY-03 PASS evidence.

---

## Section 7 — TypeScript + Lint + Build green (DEBT-02 process invariant)

**Purpose:** DEBT-02 — each phase must not regress the baseline established before it. This section verifies the codebase is clean at Phase 114 HEAD.

**Commands:**

```bash
# TypeScript type-check (no emit)
pnpm tsc --noEmit

# ESLint
pnpm lint

# Vite + Tauri build
pnpm build
```

**Expected results:**

| Command | Expected |
|---------|----------|
| `pnpm tsc --noEmit` | Exit 0, 0 errors |
| `pnpm lint` | 0 errors; warnings baseline is 36 pre-existing (gated DEV console.log blocks from Phase 113); 0 new errors |
| `pnpm lint:arch` | 70 pre-existing arch violations (all from Phase 111 baseline); 0 new violations |
| `pnpm build` | Vite build succeeds; Tauri signing key warning (`TAURI_SIGNING_PRIVATE_KEY missing`) expected in local env — this is NOT a build failure |

**Why:** DEBT-02 process invariant — phases 109–113 and 114 collectively must leave the codebase in green state. A `pnpm tsc` error or new lint error here means a Phase 112/113 change introduced a regression that the in-phase checks missed.

**If tsc/lint fails:** compare against Phase 113 SUMMARY baseline (`tsc: 0 errors, lint: 36 warnings`) to identify which files regressed.

---

## Pass Aggregation Table

| Req ID | Section(s) | Evidence |
|--------|-----------|----------|
| VERIFY-01 | (deferred to SMOKE-LIST.md) | Manual UI render — ≥10/13 AP creatures render RU correctly |
| VERIFY-02 | (deferred to SMOKE-LIST.md) | Homebrew badge present — UNTRANS-02 homebrew regression section |
| VERIFY-03 | 2, 3, 6 | Migration chain 0044→0047 on disk (Section 2) + SQL shape verified (Section 3) + cold-boot migration log (Section 6) |
| UNTRANS-01 | 4 | Badge consumer sites use `translation === null` predicate — grep confirms |
| UNTRANS-02 | (deferred to SMOKE-LIST.md) | Homebrew badge present for creature with no vendor entry |
| DEBT-02 | 7 | `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` all green |

All sections 1–7 must PASS before recording results in HUMAN-UAT.md Section B.
