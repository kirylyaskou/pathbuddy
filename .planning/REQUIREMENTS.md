# Requirements: Pathfinder 2e DM Assistant — v0.5.0-pre-alpha

**Milestone:** Combat Redesign + Spells
**Created:** 2026-04-02
**Status:** Active

---

## v1 Requirements

### [COMBAT LAYOUT] — 3-panel combat tracker redesign

- [ ] **CMBL-01**: DM sees the initiative order list and the selected creature's HP/conditions/turn controls in a single merged center panel — no separate panel switching required
- [ ] **CMBL-02**: Bestiary search is the always-visible left panel during combat — DM can search and drag creatures into the initiative list without a modal
- [ ] **CMBL-03**: Full creature stat card (stat block with HP, AC, saves, strikes, abilities, spells) is the right panel, showing the currently selected combatant
- [ ] **CMBL-04**: Clicking any combatant in the initiative list selects it and immediately updates both the center detail view and the right stat card

### [ENCOUNTER PERSISTENCE] — Encounters as source of truth for combat state

- [ ] **ENCP-01**: Saved encounters store their creature list (not just XP budget) — each encounter record has combatants with name, HP, level, and weak/elite tier
- [ ] **ENCP-02**: A "Load into Combat" action on the Encounters page starts the combat tracker pre-populated with the saved creature list
- [ ] **ENCP-03**: HP changes, condition additions/removals, and spell slot usage during combat are saved back to the encounter SQLite record in real time
- [ ] **ENCP-04**: DM can reset an encounter — all creatures return to initial HP, all conditions are cleared, and all spent spell slots are restored

### [SPELL IMPORT] — Parse Foundry VTT spells into SQLite

- [ ] **SPLI-01**: Sync pipeline parses all 1,797 spell files from `refs/pf2e/spells/` and stores them in a `spells` table (foundry_id, name, rank, traditions, traits, description, damage, area, range, duration, action_cost, save_stat, source_book)
- [ ] **SPLI-02**: Spellcasting entries per NPC creature are parsed during creature sync and stored (creature_id, entry_name, tradition, cast_type, spell_dc, spell_attack, slots per rank)
- [ ] **SPLI-03**: Prepared/spontaneous/focus spell lists per creature are parsed and stored (creature_id, entry_id, spell_foundry_id, rank_prepared)

### [SPELL DISPLAY] — Spellcasting section in stat block

- [ ] **SPLD-01**: Spellcaster creatures show a Spellcasting section in their stat block: tradition badge, spell DC, attack modifier, cast type (prepared/spontaneous/focus)
- [ ] **SPLD-02**: Spells are grouped by rank (Cantrips, Rank 1, Rank 2, etc.) with slot count shown; Focus spells appear in a separate section
- [ ] **SPLD-03**: Clicking a spell name expands an inline description showing area, range, duration, damage formula, save type, traits, and heightening

### [SPELL CATALOG] — Standalone spells browser page

- [ ] **SPLC-01**: A new Spells page shows all imported spells with FTS5 name search
- [ ] **SPLC-02**: Spells can be filtered by rank (0–10), tradition (arcane/divine/occult/primal), and traits
- [ ] **SPLC-03**: Clicking a spell shows its full stat card: description, damage, area, range, duration, save, action cost, traits, heightening rules

### [SPELL SLOT TRACKING] — Per-encounter slot state

- [ ] **SLOT-01**: In the combat tracker's creature stat card, spell slots per rank are shown as clickable pips — DM clicks to toggle a slot between available and used
- [ ] **SLOT-02**: Slot state (used count per rank per entry) is saved to the encounter SQLite record (encounter_id + combatant_id + entry_id + rank → used_count), surviving tab navigation and app restart
- [ ] **SLOT-03**: The same slot UI is available on the Encounters page creature card — DM can pre-mark slots before loading into combat

### [CUSTOM SPELL OVERRIDE] — Non-destructive per-encounter customization

- [ ] **CUST-01**: DM can add spells (searched from the catalog) to a creature's spellcasting entry for a specific encounter — stored in `encounter_combatant_spells`, original creature unchanged
- [ ] **CUST-02**: DM can remove default spells from a creature's prepared list for a specific encounter — the removal is stored as an override, original creature unchanged
- [ ] **CUST-03**: Spell override editor is accessible from both the Encounters page creature card and the combat tracker creature card — both views modify the same encounter_combatant_spells record

---

## Future Requirements (deferred)

- Class-based spell slot progression tables: infer spellcaster class from focus entry name (e.g. "Wizard School Spells") and generate recommended slot counts per level
- Ritual spells support
- Spontaneous spell known-list management
- Spell heightening UI (cast at higher rank)

## Out of Scope

- Custom monster creation (import only)
- Player-facing features (DM tool only)
- Real-time multiplayer
- Mobile version

---

## Traceability

| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| CMBL-01 | 15 | TBD | — |
| CMBL-02 | 15 | TBD | — |
| CMBL-03 | 15 | TBD | — |
| CMBL-04 | 15 | TBD | — |
| ENCP-01 | 16 | TBD | — |
| ENCP-02 | 16 | TBD | — |
| ENCP-03 | 16 | TBD | — |
| ENCP-04 | 16 | TBD | — |
| SPLI-01 | 17 | TBD | — |
| SPLI-02 | 17 | TBD | — |
| SPLI-03 | 17 | TBD | — |
| SPLD-01 | 18 | TBD | — |
| SPLD-02 | 18 | TBD | — |
| SPLD-03 | 18 | TBD | — |
| SPLC-01 | 18 | TBD | — |
| SPLC-02 | 18 | TBD | — |
| SPLC-03 | 18 | TBD | — |
| SLOT-01 | 19 | TBD | — |
| SLOT-02 | 19 | TBD | — |
| SLOT-03 | 19 | TBD | — |
| CUST-01 | 19 | TBD | — |
| CUST-02 | 19 | TBD | — |
| CUST-03 | 19 | TBD | — |
