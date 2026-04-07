# Phase 11: App Shell Fixes - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the splash screen (replace white screen with animated d20 + loading messages) and fix the encounters page crash (infinite re-render in Radix ScrollArea). Two independent fixes — no shared dependencies.

</domain>

<decisions>
## Implementation Decisions

### D20 Animation
- **D-01:** Pure CSS 3D rotating icosahedron — not flat SVG, not canvas/WebGL
- **D-02:** Color scheme is Claude's discretion — should match the existing dark fantasy PF2e aesthetic (pf-gold, charcoal background, OKLCH tokens in Tailwind config)
- **D-03:** Animation should be smooth and slow-rotating, not fast or distracting

### Loading Messages
- **D-04:** TTRPG-universal jokes and humor only — no system-specific rules (no D&D 5e mechanics, no PF2e mechanics)
- **D-05:** Curate from the 303 dndloadingscreen.site messages, picking only universal TTRPG humor (e.g., "Never split the party", tomato ability score jokes, "When the DM asks 'Are you sure?'", etc.)
- **D-06:** Messages rotate with fade transition during loading — cycle through multiple messages if init takes time

### Splash Layout
- **D-07:** Full cinematic layout — d20 takes most of the screen, "PathBuddy" title overlaid, loading message fades in/out at bottom
- **D-08:** Progress bar can be subtle/minimal — the d20 animation itself conveys "loading"
- **D-09:** Keep error state functional — if DB init fails, still show retry button (existing behavior)

### Encounters Crash Fix
- **D-10:** Fix the "Maximum update depth exceeded" crash on EncountersPage — caused by Radix ScrollArea ref callback loop (likely React 19 compatibility issue with @radix-ui/react-scroll-area)
- **D-11:** Both EncounterCreatureList and CreatureSearchSidebar use ScrollArea — fix must cover both

### Claude's Discretion
- D20 color scheme and visual details (wireframe edges, face opacity, glow effects)
- Exact number of loading messages to include (aim for 20-30 good ones)
- Message cycling interval and fade transition timing
- Technical approach for ScrollArea fix (version update, workaround, or replacement)

</decisions>

<specifics>
## Specific Ideas

- Source for loading messages: https://dndloadingscreen.site/ (303 messages scraped)
- Only pick jokes that work without knowing any specific RPG system — pure TTRPG culture humor
- The splash screen should feel like a AAA game loading screen, not a web app spinner

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above.

### Existing code
- `src/app/SplashScreen.tsx` — Current splash screen component (title + Loader2 spinner + progress bar)
- `src/pages/encounters/ui/EncountersPage.tsx` — Page that crashes with infinite re-render
- `src/features/encounter-builder/ui/CreatureSearchSidebar.tsx` — Uses ScrollArea, part of crash
- `src/features/encounter-builder/ui/EncounterCreatureList.tsx` — Uses ScrollArea, part of crash
- `src/shared/ui/scroll-area.tsx` — Radix ScrollArea wrapper

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SplashScreen.tsx`: Has init/migrating/ready/error state machine, fade-out transition, retry logic — all reusable, just replace the visual layer
- `shared/ui/scroll-area.tsx`: Radix ScrollArea wrapper — the fix may need to happen here or the component may need replacement

### Established Patterns
- Splash-before-router pattern: SplashScreen gates React Router mount until DB is ready (main.tsx)
- PF2e dark fantasy design tokens: pf-gold, bg-background (charcoal), OKLCH palette in Tailwind v4 @theme inline
- Lucide icons used throughout — but d20 needs custom CSS, not an icon

### Integration Points
- SplashScreen is rendered in main.tsx before router — standalone component, low coupling
- ScrollArea is used in 6 files — fix should be in the shared wrapper or Radix version, not per-component

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-app-shell-fixes*
*Context gathered: 2026-04-02*
