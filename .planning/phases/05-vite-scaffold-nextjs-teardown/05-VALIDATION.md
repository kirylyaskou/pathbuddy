---
phase: 5
slug: vite-scaffold-nextjs-teardown
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if installed) / manual verification |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm run tauri dev` (verify app starts) |
| **Full suite command** | `npm run lint && npm run tauri dev` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run tauri dev` — verify app starts
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | FND-01 | smoke | `npm run tauri dev` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | FND-02 | grep | `grep -r "next/link\|usePathname\|useRouter" src/` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | FND-03 | visual | manual — verify OKLCH tokens render | N/A | ⬜ pending |
| TBD | TBD | TBD | FND-04 | import | `node -e "import('@radix-ui/...')"` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | FND-05 | lint | `npx steiger src/ && npx eslint src/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Vite + React project scaffold — `package.json`, `vite.config.ts`, `tsconfig.json`
- [ ] Tauri 2 dev command wired — `npm run tauri dev` succeeds
- [ ] ESLint + steiger configured — `npm run lint` succeeds

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OKLCH color tokens render correctly | FND-03 | Visual verification required | Open app, check sidebar/gold/threat colors match prototype |
| shadcn/ui components render | FND-04 | 60+ components, visual spot-check | Import a few representative components, verify no SSR errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
