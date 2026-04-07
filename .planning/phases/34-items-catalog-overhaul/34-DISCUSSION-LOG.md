# Phase 34: Items Catalog Overhaul - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 34-items-catalog-overhaul
**Areas discussed:** Table layout & columns, Extended filters, Item reference popup, Favorites

---

## Table Layout & Columns

| Option | Description | Selected |
|--------|-------------|----------|
| Name, Category, Traits, Level, Price, Bulk, Usage, Source | Roadmap spec; Usage needs migration | ✓ |
| Fewer columns — omit Usage | Avoids migration, no Usage column | |
| You decide | Claude decides based on data availability | |

**User's choice:** Full roadmap column set including Usage
**Notes:** Usage column requires a new migration to add to the items table.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Level ASC, then Name ASC | Same as current behavior | ✓ |
| Name ASC | Alphabetical | |
| Category, then Level ASC | Groups similar items | |

**User's choice:** Level ASC, then Name ASC

---

| Option | Description | Selected |
|--------|-------------|----------|
| Single-column sort, click to toggle ASC/DESC | Standard, Archives of Nethys behavior | ✓ |
| Multi-column sort (shift+click) | Power-user, complex | |

**User's choice:** Single-column sort

---

| Option | Description | Selected |
|--------|-------------|----------|
| First 2-3 trait badges, truncated with +N | Compact; full traits in popup | ✓ |
| Text list, comma-separated | Even more compact | |
| No traits in table row | Minimal table | |

**User's choice:** 2–3 trait badges + "+N more"

---

## Extended Filters

| Option | Description | Selected |
|--------|-------------|----------|
| Text input — type a trait name | Simple substring match | ✓ |
| Multi-select dropdown from all distinct traits | More discoverable but heavier | |

**User's choice:** Text input for traits filter

---

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown of distinct source_books from DB | Requires distinct query | ✓ |
| Text input — type partial source name | Simpler, but book names are long | |

**User's choice:** Sources dropdown populated from DB

---

| Option | Description | Selected |
|--------|-------------|----------|
| Context-sensitive — only shown when type selected | weapon_category for Weapon, consumable_category for Consumable | ✓ |
| Flat dropdown with all values | Mixing categories is confusing | |
| Skip subcategory filter | Defer | |

**User's choice:** Context-sensitive subcategory filter

---

## Item Reference Popup

| Option | Description | Selected |
|--------|-------------|----------|
| Dialog (centered modal) | Standard shadcn Dialog, Esc to close | ✓ |
| Sheet (slide-in from right) | Keeps table visible | |
| You decide | Claude chooses | |

**User's choice:** Dialog

---

| Option | Description | Selected |
|--------|-------------|----------|
| Full item details | All stats, all traits, full description | ✓ |
| Same as current expanded card | Stats panel + truncated description | |

**User's choice:** Full details in popup

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show minimal popup with creature_items data | Graceful degradation | ✓ |
| Only open popup if foundry_item_id matches | Simpler but confusing UX | |

**User's choice:** Show minimal fallback popup with creature data

---

| Option | Description | Selected |
|--------|-------------|----------|
| No navigation — close and click another | Simpler, standard | ✓ |
| Prev/Next arrows in the popup | Better for browsing | |

**User's choice:** No prev/next navigation

---

## Favorites

| Option | Description | Selected |
|--------|-------------|----------|
| New SQLite table 'item_favorites' | Persists across sessions, new migration | ✓ |
| Zustand store (in-memory only) | No migration, but resets on restart | |
| localStorage via tauri-plugin-store | Persists, more setup | |

**User's choice:** SQLite table `item_favorites`, migration `0017_item_favorites.sql`

---

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped by item_type | Natural categories, collapsible sections | ✓ |
| Flat list, sorted by name | Simpler but ignores requirement | |
| Grouped by rarity | Useful for encounter prep | |

**User's choice:** Grouped by item_type with collapsible sections

---

| Option | Description | Selected |
|--------|-------------|----------|
| Leftmost column | Easy to click without opening item | |
| Rightmost column | Out of the way but accessible | ✓ |
| Inside popup only | Cleaner table, but requires opening item to star | |

**User's choice:** Rightmost column

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — same popup as main catalog | Consistent behavior | ✓ |
| No — favorites tab is list only | Simpler, inconsistent | |

**User's choice:** Favorites tab items open the same popup

---

## Claude's Discretion

- Exact column widths and responsive behavior
- Whether to use `<table>` or virtualized list
- Toolbar/filter bar layout for new filters
- FSD file structure for the overhaul
- `usage` field display format

## Deferred Ideas

None during this discussion.
