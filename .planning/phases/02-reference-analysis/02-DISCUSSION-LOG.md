# Phase 2: Reference Analysis - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 02-reference-analysis
**Areas discussed:** Analysis scope, Gap document format, Priority framework, Reference depth

---

## Analysis Scope

### Question 1: What should the analysis boundary be for refs/?

| Option | Description | Selected |
|--------|-------------|----------|
| Combat mechanics only | Conditions, actions that affect combat, damage, IWR, modifiers. Excludes spells, feats, equipment, bestiaries, classes. | |
| DM-facing mechanics | Everything a DM needs to adjudicate: conditions, combat actions, hazards, basic skill actions, encounter building. | |
| Full rules engine | All mechanical systems: conditions, actions (all categories), modifiers, skills, spells, equipment properties, hazards. | ✓ |

**User's choice:** Full rules engine
**Notes:** None

### Question 2: Should the analysis also cover data-heavy content?

| Option | Description | Selected |
|--------|-------------|----------|
| Systems only | Analyze rule systems, not individual data entries. | |
| Systems + data schema | Analyze rule systems AND document data schema/shape for entities. | |
| Everything | Systems, data schemas, AND catalog what specific data exists. Full inventory. | ✓ |

**User's choice:** Everything
**Notes:** None

### Question 3: Single document or multiple analysis passes?

| Option | Description | Selected |
|--------|-------------|----------|
| Single document | One comprehensive gap-analysis document covering everything. | |
| Multiple documents | Break into domain-focused documents (conditions-gap.md, actions-gap.md, etc.). | |
| You decide | Claude picks the structure that makes the analysis most useful. | ✓ |

**User's choice:** You decide
**Notes:** None

---

## Gap Document Format

### Question 1: How should the gap analysis organize its findings?

| Option | Description | Selected |
|--------|-------------|----------|
| By domain area | Group by engine domain. Each section: what exists in refs/, what engine has, what's missing. | ✓ |
| By implementation status | Three buckets: Implemented, Partially Implemented, Missing. | |
| By priority tier | Tier 1 (core), Tier 2 (important), Tier 3 (nice-to-have). | |

**User's choice:** By domain area
**Notes:** None

### Question 2: What level of detail per gap entry?

| Option | Description | Selected |
|--------|-------------|----------|
| Summary-level | Name + what it does + priority tag. Enough to plan, not to implement. | |
| Implementation-ready | Name + what it does + key rules + refs/ file path + priority. Planner can write tasks directly. | |
| You decide | Claude picks the level of detail that best serves downstream planning agents. | ✓ |

**User's choice:** You decide
**Notes:** None

---

## Priority Framework

### Question 1: What's the primary lens for prioritizing missing mechanics?

| Option | Description | Selected |
|--------|-------------|----------|
| DM session utility | Prioritize mechanics a DM actually needs at the table. | |
| System completeness | Prioritize filling gaps for a complete PF2e rules reference. Every mechanic matters equally. | ✓ |
| Dependency order | Prioritize foundational systems first that other mechanics depend on. | |

**User's choice:** System completeness
**Notes:** None

### Question 2: Should priority tiers still distinguish urgency?

| Option | Description | Selected |
|--------|-------------|----------|
| Flat priority | No tiers — everything equally important. Analysis just catalogs what's missing. | ✓ (amended) |
| Dependency-based tiers | Tier by what blocks what. Foundational mechanics first, then dependents. | |
| Effort-based tiers | Group by implementation complexity: quick wins, medium, large. | |

**User's choice:** Initially "Flat priority", then amended via free-text
**Notes:** User clarified (in Russian): "Maximum priority for everything related to combat, creatures, items, spells, and similar. Things related to downtime (work, rest, etc.) have lower priority." Result: two-tier system — high (combat-related) and lower (downtime).

---

## Reference Depth

### Question 1: Should the analysis look at TypeScript code in refs/lib/?

| Option | Description | Selected |
|--------|-------------|----------|
| JSON data only | Analyze compendium JSON files only. Ignore TS tooling code. | |
| JSON + TS patterns | Analyze JSON data AND study TypeScript code for implementation patterns. | |
| You decide | Claude determines which refs/ files are useful and ignores the rest. | ✓ |

**User's choice:** You decide
**Notes:** None

### Question 2: Any specific area of Foundry VTT source to prioritize?

| Option | Description | Selected |
|--------|-------------|----------|
| No specifics | Let analysis discover what's there. | |
| Conditions first | Condition system needs the most work. | |
| Actions first | Actions are the biggest unknown. | |

**User's choice:** Free-text (Other)
**Notes:** User noted (in Russian): "The pf2e folder is the main content packs, the others also have something but I haven't looked deep." Key insight: refs/pf2e/ is the primary analysis target.

---

## Claude's Discretion

- Single vs multiple analysis documents
- Level of detail per gap entry
- Whether to analyze refs/lib/ TypeScript code
- Order of analysis across refs/pf2e/ directories

## Deferred Ideas

None — discussion stayed within phase scope.
