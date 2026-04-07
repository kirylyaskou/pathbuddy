# Phase 1: Bug Fix and UI Improvements - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the Tauri HTTP scope bug blocking data sync, then overhaul the app's entire UI: dark fantasy design system, persistent sidebar navigation, redesigned creature cards, and condition badge polish. All five v1.1 active requirements are in scope for this phase.

</domain>

<decisions>
## Implementation Decisions

### HTTP Scope Fix
- Add `http:scope` allowlist to `src-tauri/capabilities/default.json`
- Scope: `https://**` (allow all HTTPS) — permissive, covers current and future fetch calls
- Only the frontend `fetch()` call to `api.github.com` is affected; ZIP download uses Rust `reqwest` via `invoke('download_file')` and is NOT subject to this scope

### Dark Fantasy Color Palette
- Background: near-black charcoal (target range `#0f0f0f`–`#1a1a1a`)
- Card surfaces: slightly lighter dark (`#2a2a2a` range) with subtle gold borders on dark background — layered depth, no parchment texture
- Accent/gold: warm gold (`#d4af37`–`#c9a84c` range) — used for primary actions, active states, highlights
- Danger/destructive: muted red — for HP loss, remove actions, error states
- Disabled: dark gray — low contrast, clearly inactive

### Typography
- Headings: serif display font — Cinzel (Google Fonts) or equivalent fantasy-book serif
- Body / UI text: system sans-serif (Tailwind default) — readable, not distracting
- Tailwind config needs `fontFamily.display` or `fontFamily.heading` extended with Cinzel

### Interactive States
- Primary buttons: gold fill or gold border glow
- Danger/destructive buttons: muted red
- Disabled states: dark gray, low opacity
- Active creature turn: gold left border + subtle gold glow around the card

### Navigation Structure
- Model: persistent left sidebar, fixed 180px width, not collapsible
- Header: small icon + "Pathbuddy" text at top of sidebar (brand identity)
- Nav items (this phase): Combat Tracker, Sync Data
- Active state: gold accent on active nav item
- `App.vue` layout: after splash clears, render sidebar + `<RouterView>` side-by-side (sidebar wraps the main layout)

### Creature Cards — Full Redesign
- Full layout + interaction redesign (not just reskin)
- Prominent creature name at top
- Initiative number shown as a badge
- HP displayed as a bar + current/max numbers
- Active turn: gold border + soft gold glow distinguishes current creature

### HP Controls
- Keep existing +/- increment buttons (restyle to dark theme with gold/red)
- ADD: numeric input field for the increment amount — user types a value (e.g., "8") then hits + or - to apply it as damage/healing
- Both buttons and direct-amount-input coexist on the card

### Condition Badges
- Conditions shown as colored pill badges directly visible on the card (no dropdown, no collapse)
- Color coding: red/dark-red for harmful conditions (stunned, paralyzed, dying), gold/amber for neutral/situational (prone, off-guard)
- Conditions with numeric values (stunned 2, slowed 1, frightened 3) show the value inside the badge
- Binary conditions with no value (prone, off-guard) show name only
- Click to toggle; conditions with values should allow incrementing/decrementing the value

### Sync Page
- SyncButton component becomes a full Sync view/page within the sidebar layout
- Styled with dark theme — stage pipeline list, progress bar, error state all get dark-fantasy treatment

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tauri HTTP scope
- `src-tauri/capabilities/default.json` — Current HTTP permissions; needs `http:scope` allowlist added
- `src/lib/sync-service.ts` — Only `https://api.github.com/repos/foundryvtt/pf2e/releases/latest` uses frontend fetch; ZIP download uses Rust invoke

### Existing components to redesign
- `src/components/CreatureCard.vue` — Current card layout to be fully replaced
- `src/components/HPController.vue` — +/- buttons; add amount input alongside
- `src/components/ConditionToggle.vue` — Current toggle; replace with badge system supporting values
- `src/components/CombatTracker.vue` — Header + layout; integrate with sidebar, full dark theme
- `src/components/SyncButton.vue` — Tile component; becomes full-page Sync view
- `src/components/AddCreatureForm.vue` — Modal form; restyle to dark theme

### App shell and routing
- `src/App.vue` — Splash-then-RouterView; sidebar wrapper goes here after splash
- `src/router/index.ts` — Two routes (`/` dashboard, `/combat`); add Sync route if SyncButton becomes a page

### Types and stores
- `src/types/combat.ts` — Condition types; check if numeric condition values are in the type
- `src/stores/combat.ts` — Combat store; may need condition value tracking added

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/SplashScreen.vue`: Splash pattern stays as-is; no redesign needed
- `src/components/CreatureDetailPanel.vue`: Slide-over panel; restyle to dark theme but keep slide-over pattern
- `src/lib/sync-service.ts`: Sync logic unchanged; only the UI and HTTP scope change
- `src/lib/database.ts` + `src/composables/useDatabase.ts`: DB layer untouched

### Established Patterns
- Tailwind CSS utility classes throughout — dark theme via `tailwind.config` extension (custom colors, font family) rather than replacing classes
- Pinia stores (`useCombatStore`, `useCreatureDetailStore`) — state management pattern stays
- `vue-router` with `createWebHistory` — sidebar will use `RouterLink` for nav items, `RouterView` for content
- Splash-before-router: `App.vue` controls splash visibility, then renders `<RouterView>` — sidebar layout wraps `<RouterView>` after splash

### Integration Points
- `App.vue`: Replace `<RouterView />` standalone with `<AppLayout><RouterView /></AppLayout>` (or inline sidebar + router-view flex layout) — this is the single integration point for persistent nav
- `src/router/index.ts`: Add `/sync` route if SyncButton is promoted to a full page view
- `tailwind.config.ts` (or `.js`): Extend with `colors.gold`, `colors.charcoal`, and `fontFamily.display` for Cinzel

</code_context>

<specifics>
## Specific Ideas

- HP control interaction: user types "8" in the input field, then clicks "-" to deal 8 damage or "+" to heal 8 HP — amount persists until cleared
- Condition badges: stunned shows as a red pill with "2" inside it; prone shows as a gray/amber pill with just "Prone"
- The sidebar is dark-themed to match the rest of the app — not a light sidebar on a dark page

</specifics>

<deferred>
## Deferred Ideas

- Data Browser page (search, filtering, stat block presentation) — this was listed as a v1.1 active requirement but no nav item was added for it; treat as a future phase or later addition within this phase if time allows
- Settings page stub — future
- Quick action buttons for attacks/saves — future (v1.2+)

</deferred>

---

*Phase: 01-bug-fix-and-ui-improvements*
*Context gathered: 2026-03-20*
