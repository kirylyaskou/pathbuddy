# Phase 47: Rebrand - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 47-rebrand
**Areas discussed:** SQLite DB filename, App identifier

---

## SQLite DB Filename

| Option | Description | Selected |
|--------|-------------|----------|
| Rename to pathmaid.db | Consistent with rebrand; pre-alpha so data loss acceptable | ✓ |
| Keep pathbuddy.db | Safe for existing installs; inconsistent | |

**User's choice:** Rename to `pathmaid.db`
**Notes:** Pre-alpha — no concern about losing existing database data.

---

## App Identifier

| Option | Description | Selected |
|--------|-------------|----------|
| com.pathmaid.app | Mirror of existing pattern | ✓ |
| com.kiryl.pathmaid | More personal reverse-domain style | |

**User's choice:** `com.pathmaid.app`

---

## Claude's Discretion

- User agent string version bump (pathmaid/1.1.0)
- Cargo crate rename (pathbuddy → pathmaid, pathbuddy_lib → pathmaid_lib)
- main.rs call site update

## Deferred Ideas

- BRAND-03: GitHub repo rename — deferred to future milestone
