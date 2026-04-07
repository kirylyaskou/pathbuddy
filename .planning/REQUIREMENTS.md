# Requirements: PathMaid — Pathfinder 2e DM Assistant

**Defined:** 2026-04-07
**Core Value:** Feature-complete PF2e DM tool — accurate game logic engine powering a React frontend with real Foundry VTT data.

## v1.1.0 Requirements

### BRAND — Rebrand

- [ ] **BRAND-01**: App renamed to PathMaid in tauri.conf.json (product-name, identifier) and package.json (name)
- [ ] **BRAND-02**: All UI-visible "Pathbuddy" strings replaced with "PathMaid"

### SANITIZE — Description Cleanup

- [ ] **SANITIZE-01**: Unresolved `@item.rank`, `@item.level` tokens stripped/replaced in displayed descriptions
- [ ] **SANITIZE-02**: Remaining unparsed `@UUID`, `@Check`, `@Template`, `@Damage` tokens removed from display output

### ENC — Encounters UX

- [ ] **ENC-01**: User can create a new encounter via an explicit "New Encounter" button (not just "+")
- [ ] **ENC-02**: Creature search supports filtering by family, traits, and source book
- [ ] **ENC-03**: Creature search results are ordered by level ascending

### MASCOT — Mascot Integration

- [ ] **MASCOT-01**: Goblin maid mascot image displayed on empty states (no combatants, no encounters)
- [ ] **MASCOT-02**: Mascot animated with CSS keyframes (gentle sway + horizontal mirror + slight rotation)

### XP — XP Budget Correctness

- [ ] **XP-01**: Group level calculation produces correct results for all party compositions per PF2e rules
- [ ] **XP-02**: XP budget thresholds and threat ratings match PF2e rules for the calculated group level

### BUG — Bug Fixes

- [ ] **BUG-01**: Loading an encounter after app restart shows initiative error popup and prompts re-roll
- [ ] **BUG-02**: Dice roll toasts stack in a column and auto-dismiss after timeout (do not replace each other)

### AUDIT — Code Quality

- [ ] **AUDIT-01**: Dead code, unused files, and commented-out blocks removed across the codebase
- [ ] **AUDIT-02**: React re-render hotspots identified and memoized (memo / useMemo / useCallback)
- [ ] **AUDIT-03**: FSD layer import violations fixed
- [ ] **AUDIT-04**: TypeScript `any` types and unsafe casts minimized, types tightened
- [ ] **AUDIT-05**: Duplicate logic consolidated into shared utilities/hooks

## Future Requirements

### BRAND

- **BRAND-03**: GitHub repository renamed to path-maid (deferred — affects remote URLs)

### ENC

- **ENC-04**: Drag-and-drop reorder of creatures within encounter builder
- **ENC-05**: Encounter templates (save/load named encounter compositions)

### MASCOT

- **MASCOT-03**: Additional mascot variants per page/context (combat vs. encounters vs. bestiary)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full i18n / localization | Not needed for DM tool used by single user |
| Automated E2E tests | No test infrastructure, breaking changes expected |
| Campaign management | Deferred to future milestone |
| Cloud sync | Local SQLite persistence only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-01 | Phase 47 | Pending |
| BRAND-02 | Phase 47 | Pending |
| SANITIZE-01 | Phase 48 | Pending |
| SANITIZE-02 | Phase 48 | Pending |
| ENC-01 | Phase 49 | Pending |
| ENC-02 | Phase 49 | Pending |
| ENC-03 | Phase 49 | Pending |
| MASCOT-01 | Phase 50 | Pending |
| MASCOT-02 | Phase 50 | Pending |
| XP-01 | Phase 51 | Pending |
| XP-02 | Phase 51 | Pending |
| BUG-01 | Phase 52 | Pending |
| BUG-02 | Phase 52 | Pending |
| AUDIT-01 | Phase 53 | Pending |
| AUDIT-02 | Phase 53 | Pending |
| AUDIT-03 | Phase 53 | Pending |
| AUDIT-04 | Phase 53 | Pending |
| AUDIT-05 | Phase 53 | Pending |

**Coverage:**
- v1.1.0 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after initial definition*
