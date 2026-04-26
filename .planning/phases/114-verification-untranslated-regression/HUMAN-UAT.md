# HUMAN-UAT.md — Phase 114: Verification + Untranslated Regression

**Phase:** 114-verification-untranslated-regression  
**Requirements addressed:** UNTRANS-01, UNTRANS-02, VERIFY-01, VERIFY-02, VERIFY-03, DEBT-02  
**Invocation date:** 2026-04-26  
**Status:** Template ready — user fills PASS/FAIL columns during UAT pass

---

## Section A: Smoke Results Table

Fill PASS / FAIL / N/A after walking through SMOKE-LIST.md.

| # | EN Name | AP Pack | Result | Notes |
|---|---------|---------|--------|-------|
| 1 | `"Lucky" Lanks` _(REFERENCE REPRO)_ | `outlaws-of-alkenstar-bestiary` | [ ] | Strike "Финт негодяя" + ability must pass |
| 2 | `Agradaemon` | `agents-of-edgewatch-bestiary` | [ ] | |
| 3 | `Clockwork Amalgam` | `agents-of-edgewatch-bestiary` | [ ] | |
| 4 | `Aller Rosk` | `abomination-vaults-bestiary` | [ ] | |
| 5 | `Augrael` | `abomination-vaults-bestiary` | [ ] | |
| 6 | `Charau-ka Dragon Priest` | `age-of-ashes-bestiary` | [ ] | |
| 7 | `Lion Visitant` | `extinction-curse-bestiary` | [ ] | |
| 8 | `Aecora Silverfire` | `kingmaker-bestiary` | [ ] | |
| 9 | `Anadi Fateweaver` | `strength-of-thousands-bestiary` | [ ] | |
| 10 | `Arghun the Annihilator` | `blood-lords-bestiary` | [ ] | |
| 11 | `Anemos` | `rage-of-elements-bestiary` | [ ] | |
| 12 | `Ainamuuren` | `gatewalkers-bestiary` | [ ] | |
| 13 | `Abendego Brute` _(PARTIAL COVERAGE — name EN-as-RU)_ | `strength-of-thousands-bestiary` | [ ] | Tier-2 action-dict fallback for "Brute Strength" |

**VERIFY-01 gate:** ≥10/13 PASS + entries 1 and 13 MUST both PASS.

---

## Section B: Automated Verification Results

Fill after running AUTOMATED-VERIFY.md sections 1–5 (no app boot) and optionally Section 6 (cold-boot required) and Section 7 (build run).

| Section | Check | Result | Notes |
|---------|-------|--------|-------|
| 1 | Vendor pack count = 47 | [ ] | |
| 2 | Migration chain 0044→0047 on disk | [ ] | |
| 3 | 0047 SQL = `ALTER TABLE entity_items ADD COLUMN description_loc` | [ ] | |
| 4 | UNTRANS-01: badge consumer sites use `=== null` predicate | [ ] | |
| 5 | `getCreatureItem` export present in translations.ts | [ ] | |
| 6 | Cold-boot: 0047 applied; warm-boot: 0047 skipped; `added=0` line present | [ ] | Requires app boot |
| 7 | `pnpm tsc --noEmit` 0 errors | [ ] | |
| 7 | `pnpm lint` 0 errors | [ ] | |
| 7 | `pnpm build` Vite green | [ ] | |

**VERIFY-03 gate:** Sections 2, 3, 6 all PASS.  
**DEBT-02 gate:** Section 7 all three commands green.

---

## Section C: Homebrew Regression Result (UNTRANS-02)

| Check | Result | Notes |
|-------|--------|-------|
| Homebrew creature created with unknown name | [ ] | e.g. "Test Goblin Scout v999" |
| 🚫RU badge IS present on header | [ ] | Badge must fire — UNTRANS-02 invariant |
| Name + subtitle render in EN (engine fallback) | [ ] | No fabricated translation |
| No fabricated translation appears | [ ] | |

**UNTRANS-02 gate:** All 4 checks PASS.

---

## Section D: Version Bump Decision Gate

Phase 114 verification is complete when all sections A–C are filled. The version bump from 1.7.4 → 1.7.5 is a **user decision** — the executor has NOT modified any version files.

Files that require manual edit for version bump:
- `package.json` → `"version"` field
- `src-tauri/tauri.conf.json` → `"version"` field  
- `src-tauri/Cargo.toml` → `version` field

Choose one of the following options:

---

### Option 1: Tag v1.7.5 now

**Prerequisite:** Sections A–C all PASS (VERIFY-01, VERIFY-02, VERIFY-03, UNTRANS-01, UNTRANS-02, DEBT-02 all green).

**Steps (user performs manually):**

1. Edit all three version files to `1.7.5` (or run `pnpm version 1.7.5 --no-git-tag-version` for package.json, then edit the two Tauri files manually).
2. Commit: `git commit -m "chore: bump version to 1.7.5"`
3. Tag and push:
   ```bash
   git tag v1.7.5
   git push origin v1.7.5
   ```
4. GitHub Actions (`main.yml`) will build Windows/macOS/Linux/Android and create a draft release automatically.
5. After all jobs finish — go to GitHub Releases and click **Publish release**.

---

### Option 2: Hold for combined tag

**Use when:** All checks pass but v1.7.1–v1.7.5 are to be tagged together as a combined release (per STATE.md pending todo: "Tag всех v1.7.x после v1.7.5 combined release decision").

Version files remain at 1.7.4. Return to tag when the combined release decision is made.

---

### Option 3: Smoke failures found

**Use when:** Any entry in Section A fails (especially entries 1 or 13 — reference repros), or any automated check in Section B fails.

Steps:
1. Record which checks failed and the observed vs expected behavior.
2. Do NOT bump version.
3. File regression issue in the relevant phase (Phase 109–113).
4. Return to plan-phase with `--gaps` for gap closure before re-running smoke.

---

## Section E: Final Acceptance

_User fills this section._

**Decision:** (Option 1 / Option 2 / Option 3)

**Date:**

**Notes:**

**Signature / confirmation:**

---

_Version bump is user-gated per CLAUDE.md "Releasing" section. Executor has confirmed: `git diff -- package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml` returns empty — no version file edits made during Phase 114 execution._
