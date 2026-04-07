# Feature Research

**Domain:** PF2e DM Assistant — Frontend Rebuild + Engine Integration (v0.3.0)
**Researched:** 2026-03-31
**Confidence:** HIGH (competitor tools live-reviewed, prototype source reviewed, engine exports reviewed)

---

## Scope Note

This document covers the **v0.3.0 frontend rebuild**: porting the Next.js prototype to Vite+React+FSD, replacing all mock data with live SQLite-backed Foundry VTT entities, and wiring the `/engine` barrel exports into the UI. The engine is complete. The prototype pages exist with mock data. The SQLite + Foundry sync pipeline was built in v1.1 and needs reconnection.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features DMs assume exist. Missing these = this app is worse than free tools like pathfinderdashboard.com.

| Feature | Why Expected | Complexity | Engine Dependency | Mock Data to Replace |
|---------|--------------|------------|-------------------|----------------------|
| Initiative order list with active-turn highlight | Every combat tracker has this | LOW | None | `initialCombatants[]` in combat page (4 hardcoded combatants) |
| HP tracking with +/- per combatant, temp HP shown | Core combat need; all competitors have it | LOW | None | `currentHp/maxHp/tempHp` on Combatant |
| Condition badges on combatants with valued-condition numerics | PF2e's 44 conditions are core to the system | MEDIUM | `ConditionManager`, `CONDITION_SLUGS`, `VALUED_CONDITIONS` | `mockConditions` + `CombatantCondition[]` in combat page |
| Auto-decrement Frightened/Sickened at end of turn | PF2e rule; all serious trackers automate this | LOW | `CONDITION_EFFECTS` (status modifier data) | `AUTO_DECREMENT_CONDITIONS` array in combat page — hardcoded, not engine-derived |
| Dying/Wounded cascade on creature reaching 0 HP | Critical PF2e rule; missing = rules errors at table | MEDIUM | `performRecoveryCheck`, death-progression module | Hardcoded in combat page's HP logic |
| Add creature from bestiary to active combat | Standard workflow; every tracker supports it | MEDIUM | `Creature` type from engine/types.ts | Dialog queries `mockCreatures` (12 entries) |
| Creature stat block view (HP, AC, saves, IWR, strikes, abilities, skills, senses) | DMs need stats during combat | MEDIUM | `parseIwrData`, `formatIwrType`, `applyIWR` | `CreatureStatBlock` component uses mock Creature interface |
| Full-text search for bestiary creatures | 28K entities are unusable without search | HIGH | None (SQLite FTS5 — built in v1.1, needs reconnection) | `searchQuery` filters 12 mock creatures |
| Bestiary filters: level range, creature type, rarity, source | Standard browsing UX | LOW | None (SQLite query params) | Inline filter state against mock creature array |
| XP budget bar with live threat rating | PF2e encounter building requires this; all tools show it | LOW | `calculateEncounterRating`, `generateEncounterBudgets`, `ThreatRating` | `getXPThresholds`/`getThreatLevel` in mock pf2e-data.ts (duplicate of engine, uses simplified multiplier — wrong) |
| Party size + level config for XP calculation | Required input for XP engine | LOW | `calculateCreatureXP`, `calculateXP` | `partySize`/`partyLevel` state in encounter page |
| Round counter | Standard combat bookkeeping | LOW | None | `round` state in combat page |
| Add/remove creatures from encounter builder | Basic encounter construction | LOW | None | `encounterCreatures` state |
| Zustand stores replacing local useState | FSD architecture requires shared reactive state | MEDIUM | All engine modules consumed via stores | Scattered `useState` in combat, encounter, bestiary pages |

### Differentiators (Competitive Advantage)

Features that justify building this over using existing free tools. Each maps to an engine capability no web-based competitor exposes.

| Feature | Value Proposition | Complexity | Engine Dependency | Notes |
|---------|-------------------|------------|-------------------|-------|
| Live IWR preview on damage input | DM types "20 fire damage" and instantly sees adjusted result per target. No standalone tool has this. | MEDIUM | `applyIWR`, `IWRApplicationResult`, `parseIwrData`, `formatIwrType` | Engine does the math; needs a damage input form per combatant + IWR result row |
| Condition effects as live modifier display | Show which stats are penalized by active conditions (e.g., Frightened 2 = -2 status to all checks and DCs). Foundry automates this; no standalone tool surfaces it. | MEDIUM | `CONDITION_EFFECTS`, `CONDITION_OVERRIDES`, `Statistic`, `resolveSelector` | Engine has complete CONDITION_EFFECTS map; Zustand derivation layer computes penalty totals |
| Dying/Wounded/Doomed cascade UI | Recovery check dialog with outcome text (recover, worsen, die). PF2e's dying system is complex; competitors handle it poorly or not at all. | MEDIUM | `performRecoveryCheck`, `RecoveryCheckResult`, death-progression module | Render `RecoveryCheckResult` outcomes as modal prompts; auto-apply condition changes |
| Weak/Elite HP presets on creature add | One-click HP adjustment per Monster Core. Android Battle Tracker has this; no web tool does. | LOW | `getHpAdjustment` from `encounter/weak-elite.ts` | Trivial to wire; high table value — DMs use weak/elite templates regularly |
| Action cost icons in stat blocks (PF2e action symbols) | Correct single/two/three-action, reaction, free-action icons. Most tools use plain text. | LOW | `ActionCost` type — `ActionIcon` component already exists in prototype | Component exists in prototype; needs real action data from Foundry entities |
| Hazard XP in encounter builder | Foundry handles hazards; no standalone encounter builder does. Correct per GM Core. | LOW | `getHazardXp`, `HazardType` | Small UI addition to encounter builder; engine already complete |
| Persistent damage tracking with turn-end flat-check prompt | PF2e persistent damage (fire, bleed) requires flat DC 15 check each turn. Android Battle Tracker added this recently; web tools don't have it. | MEDIUM | `CONDITION_EFFECTS`, persistent damage condition handling | Needs UI panel per combatant; flat check prompt shown at turn end |
| Full 28K entity bestiary (not just common monsters) | Every competitor uses a subset. This app has full Foundry VTT data (90+ packs). | HIGH | SQLite FTS5 backend (built in v1.1, needs reconnection) | Replace 12 mock creatures with live SQLite query |
| MAP display for attack sets | Show +X / +X-5 / +X-10 attack modifier progression. The `CreatureStatistics` engine already builds these. | LOW | `buildAttackModifierSets`, `CreatureStatistics` | Engine exports this; render it in stat block strikes section |
| Degree-of-success outcomes for actions | Show what happens on crit/success/fail/crit-fail for the active creature's actions. Unique to this tool. | MEDIUM | `ACTION_OUTCOMES`, `calculateDegreeOfSuccess`, `upgradeDegree`, `downgradeDegree` | Engine has 545 action entries + outcome map; surface as expandable section in stat block |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Virtual dice rolling for all checks | "Immersion"; some players want it | Slows fast analog tables; all major tools already have it; maintenance surface | Keep only the flat check prompt for dying recovery — that's the single case where automation genuinely speeds up play |
| Real-time multiplayer / player initiative view | Players want to see turn order on their phones | Defeats single-user Tauri desktop architecture; requires server; out of scope per PROJECT.md | Keep as deferred v0.4+ feature; single-DM use case is the right scope for v0.3 |
| Custom monster creation and editing | DMs want homebrew monsters | Complex form validation, stat derivation, persistence — a separate milestone's scope per PROJECT.md | Import-only; mark custom editing as v0.4+ |
| Campaign management (party roster, session history, notes persistence) | DMs want notes persistence | Orthogonal to combat/browsing; adds data modeling complexity; dilutes v0.3 focus | Dashboard shows party config; defer full campaign persistence to v0.4+ |
| Automatic saving throw resolution | Would be convenient | Requires attacker modifiers + spell DCs + defender values — too much data entry for a live DM tool | Surface degree-of-success rules text inline; let DM resolve manually |
| Map/battle grid | VTTs have this | Wrong architecture for a single-user Tauri desktop app without canvas rendering system | Out of scope per PROJECT.md |
| PWOL (Proficiency Without Level) support | Some DMs use this variant | Removed from engine permanently per PROJECT.md | Not applicable |
| Auto-apply condition modifier penalties to stat block numbers | "If frightened 2, show AC as base-2 live in tracker" | Creates stat block values DM no longer trusts vs the printed source; frightened applies to *attacker* checks, not defender AC | Show active condition effects as a separate modifier summary; DM applies mentally — how every tool except full Foundry works |

---

## Feature Dependencies

```
[SQLite + Drizzle reconnection + Foundry VTT sync pipeline]
    └──required by──> [Full bestiary browse (28K entities)]
                          └──required by──> [Add creature from bestiary to combat]
                          └──required by──> [Encounter builder with real creature data]

[Zustand combat store]
    └──required by──> [HP tracking + temp HP]
    └──required by──> [Initiative order management]
    └──required by──> [Round/turn counter]
    └──required by──> [Condition tracking per combatant]
                          └──enhanced by──> [Live condition modifier display (CONDITION_EFFECTS)]
                          └──enhanced by──> [Auto-decrement Frightened/Sickened via engine]

[Creature stat block with real Foundry data]
    └──required by──> [IWR preview on damage input]
    └──required by──> [MAP display for attack sets]
    └──required by──> [Weak/Elite HP presets]
    └──required by──> [Action cost icons with real action data]

[applyIWR engine function]
    └──required by──> [Live IWR preview on damage input]

[performRecoveryCheck engine function]
    └──required by──> [Dying/Wounded cascade UI with recovery check dialog]

[calculateEncounterRating engine function]
    └──required by──> [XP budget bar with threat rating]

[getHazardXp engine function]
    └──enhances──> [Encounter builder (adds hazard entries)]

[ACTION_OUTCOMES data]
    └──enhances──> [Stat block ability display (degree-of-success outcomes)]
```

### Dependency Notes

- **SQLite reconnection is the critical-path prerequisite**: bestiary browse, encounter builder, and combat creature-add all depend on real entity data. Mock data (12 creatures) makes these features demonstrably unusable. The pipeline was built in v1.1 and needs reconnection — highest-priority data work.
- **Zustand combat store must exist before all combat features**: HP, conditions, initiative, and round tracking need shared reactive state. Prototype uses scattered `useState` — must be elevated to Zustand so the bestiary panel can send a creature into the combat tracker.
- **All engine functions are synchronous pure functions**: `applyIWR`, `calculateCreatureXP`, `performRecoveryCheck`, `ConditionManager` methods — no async loading. Any component or store can call them immediately after import.
- **IWR preview depends on real creature data in the combat store**: To show "20 fire damage → 5 after resistance 15" the combatant's parsed IWR must be in state. This requires SQLite data, not mock data.
- **CONDITION_EFFECTS map is already complete in engine**: Surfacing condition modifier penalties in UI requires only computing penalty totals from the combatant's active condition list — no additional engine work.
- **Mock pf2e-data.ts contains duplicate engine logic that is wrong**: `getXPThresholds`, `calculateCreatureXP`, and `getThreatLevel` in the prototype's lib file are simplified duplicates of engine functions. They must be deleted and replaced with engine imports — not just wired, actually removed.

---

## MVP Definition

### Launch With (v0.3.0)

Minimum viable rebuild — app is actually usable at a PF2e table.

- [ ] SQLite + Drizzle reconnected, Foundry VTT data sync pipeline working — without this nothing else is real
- [ ] FSD directory structure with Zustand stores (app/pages/widgets/features/entities/shared)
- [ ] Bestiary browse with FTS5 search and filters over 28K entities — replaces 12 mock creatures
- [ ] Creature stat block with real Foundry data (HP, AC, saves, IWR, strikes, abilities, MAP) — replaces mock Creature interface
- [ ] Zustand combat store (initiative, HP, tempHP, conditions, round/turn) — replaces `useState` in combat page
- [ ] Add creature from bestiary to combat tracker — connects browse and combat features
- [ ] Condition badges on combatants with valued-condition numerics — wired to engine `CONDITION_SLUGS`/`VALUED_CONDITIONS`
- [ ] Auto-decrement Frightened/Sickened at end of turn — wired to engine `CONDITION_EFFECTS`
- [ ] XP budget bar in encounter builder, wired to engine `calculateEncounterRating` — replaces wrong duplicate in pf2e-data.ts
- [ ] Encounter builder with real creature data and party config — replaces `mockCreatures`
- [ ] Delete all mock data duplicates (`getXPThresholds`, `calculateCreatureXP`, `getThreatLevel` in pf2e-data.ts)

### Add After Validation (v0.3.x)

Features with higher complexity that require the foundation to be stable first.

- [ ] Live IWR preview on damage input — trigger: real creature data in combat store
- [ ] Dying/Wounded cascade UI with recovery check dialog — trigger: combat store stable
- [ ] Weak/Elite HP presets on creature add — trigger: `getHpAdjustment` wired to combatant creation
- [ ] Persistent damage tracking with auto-flat-check prompt — trigger: condition tracking working
- [ ] Hazard XP in encounter builder — trigger: encounter builder working
- [ ] MAP attack set display in stat block — trigger: `buildAttackModifierSets` wired to stat block component

### Future Consideration (v0.4+)

Features to defer — orthogonal to core DM combat workflow or require architectural changes.

- [ ] Campaign management (party roster, session notes, encounter history) — separate data model, not combat/browse
- [ ] Custom monster creation — complex validation, persistence, stat derivation
- [ ] Full spell / item pages with Foundry data — reference material, not table-critical workflow
- [ ] Degree-of-success action outcome display — defer until core combat loop is stable and validated
- [ ] Player view mode — requires multi-window or server architecture

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| SQLite + Foundry sync reconnection | HIGH | HIGH | P1 — prerequisite for everything |
| FSD restructure + Zustand stores | HIGH | MEDIUM | P1 — prerequisite for feature wiring |
| Bestiary browse with real data + FTS5 | HIGH | MEDIUM | P1 |
| Creature stat block (real Foundry data) | HIGH | MEDIUM | P1 |
| HP + initiative tracking in combat | HIGH | LOW | P1 |
| Condition badges + auto-decrement | HIGH | MEDIUM | P1 |
| XP budget bar wired to engine | HIGH | LOW | P1 |
| Encounter builder with real data | HIGH | MEDIUM | P1 |
| Add creature from bestiary to combat | HIGH | LOW | P1 |
| Delete mock data duplicates | HIGH | LOW | P1 (prevents wrong data silently persisting) |
| Live IWR preview | HIGH | LOW | P2 — engine done, UX layer only |
| Weak/Elite HP presets | MEDIUM | LOW | P2 |
| Dying/Wounded cascade UI | HIGH | MEDIUM | P2 |
| Persistent damage tracking | MEDIUM | MEDIUM | P2 |
| MAP display in stat block | MEDIUM | LOW | P2 |
| Hazard XP in encounter builder | MEDIUM | LOW | P2 |
| Spells / items browse pages | LOW | LOW | P3 — reference material |
| Degree-of-success outcome display | MEDIUM | MEDIUM | P3 |
| Campaign management | LOW | HIGH | P3 |

**Priority key:**
- P1: Required for v0.3.0 — without these the app is not functional at a table
- P2: Add in v0.3.x patches — high value, low risk once foundation is stable
- P3: Future milestones — orthogonal or high complexity

---

## Competitor Feature Analysis

| Feature | PF2e Battle Tracker (Android) | pathfinderdashboard.com | Prep n' Pray | This App (v0.3.0) |
|---------|-------------------------------|------------------------|--------------|-------------------|
| Initiative + HP tracking | Yes | Yes | Yes | Yes (P1) |
| All 44 conditions + valued numerics | Yes | Partial | Partial | Yes — engine has all 44 |
| Auto-decrement Frightened | Yes | Yes | Unknown | Yes — wired to CONDITION_EFFECTS |
| Dying/Wounded cascade | Partial | No | No | Yes (P2) — `performRecoveryCheck` |
| Persistent damage + flat check prompt | Yes (recent) | No | No | Yes (P2) |
| Encounter XP builder | Yes | Yes | Yes | Yes — `calculateEncounterRating` |
| Hazard XP | No | No | No | Yes (P2) — `getHazardXp` |
| Weak/Elite presets | Yes | No | No | Yes (P2) — `getHpAdjustment` |
| Live IWR damage preview | No | No | No | Yes (P2) — unique differentiator |
| Condition modifier display | Partial (AC/saves only) | No | No | Yes (P2) — CONDITION_EFFECTS map |
| Full stat block in combat | Yes | Yes | No | Yes — with real Foundry data |
| 28K entity database | Yes (Paizo books) | Subset | Full | Yes — Foundry VTT 90+ packs |
| Desktop app (offline, no browser) | No (Android) | No (browser) | No (web/cloud) | Yes — Tauri desktop |
| MAP attack sets in stat block | No | No | No | Yes (P2) — `buildAttackModifierSets` |

**Conclusion:** This app matches the best competitors on all table-stakes features and adds IWR preview, MAP display, full condition modifier surfacing, and the complete Foundry dataset — none of which any current standalone tool exposes.

---

## Mock Data Replacement Map

Every mock data source in the prototype and its real replacement.

| Mock Source | Mock Contents | Real Replacement | Engine/DB Involved |
|-------------|---------------|-----------------|---------------------|
| `mockCreatures` (12 entries) | 12 hand-written creature stat blocks | SQLite `entities` table, Foundry VTT creatures (28K+) | `Creature` type from engine/types.ts; FTS5 search |
| `mockConditions` (44 entries) | Hand-written condition data | `CONDITION_SLUGS`, `CONDITION_EFFECTS`, `CONDITION_GROUPS` from engine | `ConditionManager` — all 44 already in engine |
| `getXPThresholds()` in pf2e-data.ts | Simplified XP threshold logic (wrong — uses party-size multiplier not per-player scaling) | `generateEncounterBudgets()` from engine/encounter/xp.ts | Engine — DELETE pf2e-data.ts version |
| `calculateCreatureXP()` in pf2e-data.ts | Simplified XP table (misses out-of-range handling, treats level -1 as -1 not 0) | `calculateCreatureXP()` from engine/encounter/xp.ts | Engine — DELETE pf2e-data.ts version |
| `getThreatLevel()` in pf2e-data.ts | Duplicate threat rating logic | `calculateEncounterRating()` from engine/encounter/xp.ts | Engine — DELETE pf2e-data.ts version |
| `mockSpells` (10 entries) | 10 hand-written spells | SQLite `entities` table, Foundry VTT spells (thousands) | None — pure data display |
| `mockItems` (8 entries) | 8 hand-written items | SQLite `entities` table, Foundry VTT items (thousands) | None — pure data display |
| `mockCampaigns` (2 entries) | 2 hand-written campaigns | v0.4+ persistent campaign store or static party config | None for v0.3 |
| `initialCombatants[]` in combat page | 4 hardcoded combatants pre-loaded | Zustand combat store, empty on load, populated from bestiary | `ConditionManager` for condition ops |
| `creatureTypes` array in pf2e-data.ts | 14 creature type strings | SQLite distinct query on creature type/traits | None |
| `sourceBooks` array in pf2e-data.ts | 7 source book strings | SQLite distinct query on `source` field | None |

---

## Sources

- [PF2e Battle Tracker (Android)](https://play.google.com/store/apps/details?id=com.piR.pf2eBattleTracker&hl=en_US) — MEDIUM confidence, feature list from store listing and Paizo forum thread
- [Pathfinder 2e Dashboard](https://pathfinderdashboard.com/) — HIGH confidence, live tool reviewed
- [Prep n' Pray](https://app.prepnpray.com) — HIGH confidence, live tool reviewed
- [PF2Calc](https://pf2calc.com/) — MEDIUM confidence, search result summary
- [PF2e Threat Tracker (Foundry module)](https://foundryvtt.com/packages/pf2e-threat-tracker) — MEDIUM confidence, for IWR integration approach
- [Gamedev Bram PF2e Combat Tracker](https://gamedevbram.itch.io/pathfinder-2e-combat-tracker) — MEDIUM confidence, feature set from itch.io page
- Prototype source code at `D:/parse_data/` — HIGH confidence, directly reviewed
- Engine source at `D:/pathbuddy/engine/` — HIGH confidence, directly reviewed
- PROJECT.md at `D:/pathbuddy/.planning/PROJECT.md` — HIGH confidence, authoritative project context

---

*Feature research for: PF2e DM Assistant v0.3.0 — Frontend Rebuild + Engine Integration*
*Researched: 2026-03-31*
