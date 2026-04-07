# Resume: New Milestone v0.4.0

## Completed Steps
1. Load Context -- done
2. Gather Milestone Goals -- done (user confirmed)
3. Determine Version -- v0.4.0-pre-alpha
4. Update PROJECT.md -- done
5. Update STATE.md -- done
6. Commit -- skipped (.planning gitignored)
7. Load init context -- done
8. Research -- done (inline, SUMMARY.md written)
9. Define Requirements -- done (REQUIREMENTS.md written, 12 requirements, user confirmed)

## Next Step
**Step 10: Create Roadmap** -- spawn gsd-roadmapper agent

Roadmapper needs:
- Continue phase numbering from Phase 10 (v0.3.0 ended at Phase 10) → v0.4.0 starts at Phase 11
- 12 requirements: FIX-01..02, FILT-01, STAT-01..02, XP-01..02, ROLL-01..03, CMOD-01..02
- Roadmapper model: sonnet
- After roadmap: present for approval, commit, show next steps

## Milestone Summary
**v0.4.0-pre-alpha: Combat Depth + Dice Rolling**
- Bug fixes: scroll + search in bestiary panel
- Bestiary level filter
- Stat block in combat tracker center panel
- XP Budget (GM Core pg. 75)
- Auto-roll attacks (d20 + modifier + MAP + degree of success)
- Full condition-modifier binding (CreatureStatistics integration)

## Key Research Findings
- CreatureStatistics: module-level Map pattern (NOT Zustand), same as ConditionManager
- buildAttackModifierSets accepts conditionModifiers parameter
- calculateDegreeOfSuccess(roll, dc) already in engine
- Condition bridge needs extension to sync CreatureStatistics
