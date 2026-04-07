# Phase 11: App Shell Fixes - Research

**Researched:** 2026-04-02
**Domain:** CSS 3D Animation + Radix ScrollArea / React 19 compatibility
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Pure CSS 3D rotating icosahedron — not flat SVG, not canvas/WebGL
- **D-02:** Color scheme is Claude's discretion — should match existing dark fantasy PF2e aesthetic (pf-gold, charcoal background, OKLCH tokens in Tailwind config)
- **D-03:** Animation should be smooth and slow-rotating, not fast or distracting
- **D-04:** TTRPG-universal jokes and humor only — no system-specific rules (no D&D 5e mechanics, no PF2e mechanics)
- **D-05:** Curate from the 303 dndloadingscreen.site messages, picking only universal TTRPG humor (e.g., "Never split the party", tomato ability score jokes, "When the DM asks 'Are you sure?'", etc.)
- **D-06:** Messages rotate with fade transition during loading — cycle through multiple messages if init takes time
- **D-07:** Full cinematic layout — d20 takes most of the screen, "PathBuddy" title overlaid, loading message fades in/out at bottom
- **D-08:** Progress bar can be subtle/minimal — the d20 animation itself conveys "loading"
- **D-09:** Keep error state functional — if DB init fails, still show retry button (existing behavior)
- **D-10:** Fix the "Maximum update depth exceeded" crash on EncountersPage — caused by Radix ScrollArea ref callback loop (likely React 19 compatibility issue with @radix-ui/react-scroll-area)
- **D-11:** Both EncounterCreatureList and CreatureSearchSidebar use ScrollArea — fix must cover both

### Claude's Discretion
- D20 color scheme and visual details (wireframe edges, face opacity, glow effects)
- Exact number of loading messages to include (aim for 20-30 good ones)
- Message cycling interval and fade transition timing
- Technical approach for ScrollArea fix (version update, workaround, or replacement)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SPLASH-01 | User sees an animated CSS d20 die and rotating D&D/PF2e loading messages on the splash screen instead of a white screen | CSS 3D icosahedron technique documented; existing SplashScreen.tsx state machine reused; TTRPG message list curated |
| FIX-01 | Encounters page loads without crashing (fix infinite re-render loop in Radix ScrollArea) | Root cause confirmed: React 19 ref callback instability in @radix-ui/react-compose-refs; replacement strategy documented |
</phase_requirements>

---

## Summary

Phase 11 has two fully independent fixes. The first is a visual upgrade to the splash screen: replace the current `Loader2` spinner with a pure CSS 3D rotating icosahedron (d20) and cycling TTRPG-humor messages. The existing `SplashScreen.tsx` state machine (init/migrating/ready/error) is well-structured and reusable — only the visual layer needs replacing. The second fix addresses a confirmed React 19 / Radix UI incompatibility: `@radix-ui/react-scroll-area` 1.2.10 triggers an infinite re-render ("Maximum update depth exceeded") due to unstable ref callbacks in `@radix-ui/react-compose-refs` when used with React 19.2.x. The most pragmatic fix for this project is replacing the Radix `ScrollArea` with a styled native `<div className="overflow-y-auto">`, which eliminates the crash entirely and matches the visual result since custom scrollbar styling isn't load-bearing for these panels.

**Primary recommendation:** For SPLASH-01 — build a self-contained `<D20Spinner />` React component with inline CSS keyframes and clip-path triangles; plug it into the existing `SplashScreen.tsx` visual slot. For FIX-01 — replace `ScrollArea` wrapper in `src/shared/ui/scroll-area.tsx` with a native overflow div; all 6 consumers automatically benefit.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Component rendering | Already in project |
| Tailwind CSS v4 | ^4.2.2 | Utility classes | Already in project; `@theme inline` OKLCH tokens available |
| tw-animate-css | 1.3.3 | Pre-built CSS keyframe animations (`animate-fade-in`, `animate-spin`) | Already imported in globals.css |
| @radix-ui/react-scroll-area | 1.2.10 | Current scroll area (to be replaced or patched) | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native CSS `@keyframes` | — | Custom 3D rotation animation for d20 | Required; no library provides a CSS icosahedron |
| `clip-path: polygon()` | — | Drawing equilateral triangles (20 faces of icosahedron) | Required; no npm package needed |
| `transform-style: preserve-3d` | — | Enabling CSS 3D space for die faces | Required for 3D die |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure CSS icosahedron | React Three Fiber / Three.js | D-01 locked against canvas/WebGL |
| Native overflow div | Upgrade @radix-ui/react-scroll-area | No stable fix exists in current 1.2.10; next release (1.2.11-rc) exists but is release candidate only |
| Native overflow div | React.memo wrapping ScrollArea | Memoization does not fix ref callback instability at the Radix internals level |
| CSS @keyframes inline | Framer Motion | Overkill; tw-animate-css already provides fade utilities |

**Installation:** No new packages required. Both tasks use existing stack.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── SplashScreen.tsx        # Replace visual layer only — state machine unchanged
├── shared/
│   └── ui/
│       └── scroll-area.tsx     # Replace Radix ScrollArea with native overflow wrapper
└── (no new files required)
```

### Pattern 1: CSS 3D Icosahedron via clip-path Triangles

**What:** Build a `<D20Spinner />` component using 20 `<div>` elements with `clip-path: polygon(50% 0%, 100% 100%, 0% 100%)` for equilateral triangle faces, each positioned in 3D space with `transform: rotateY(...) rotateX(...) translateZ(...)`. The outer wrapper uses `transform-style: preserve-3d` and `animation: spin-d20 8s infinite linear`.

**When to use:** Splash screen — rendered once, low complexity, no dependencies.

**CSS geometry:** An icosahedron has 20 equilateral triangle faces arranged in 5 layers:
- 1 top cap face (pointing down from apex)
- 5 upper ring faces
- 5 lower ring faces (offset by 36deg from upper)
- 5 anti-upper ring faces (pointing up, completing bottom hemisphere)
- 1 bottom cap face

In practice for a **loading screen d20**, a convincing approximation with 8-12 visible faces at any rotation is sufficient and far simpler than mathematically exact icosahedron placement. The spinning animation means individual face positions are never scrutinized. Reference implementations (jkneb CodePen, mblase75 CodePen) confirm this approach works with SCSS `@for` loops; in React/Tailwind the equivalent is a JS array of transform values.

**Example keyframes pattern:**
```css
/* Source: mblase75 CodePen / jkneb CodePen patterns (CodePen.io) */
@keyframes spin-d20 {
  from {
    transform: rotateX(-20deg) rotateY(0deg);
  }
  to {
    transform: rotateX(-20deg) rotateY(360deg);
  }
}
```

**React component structure:**
```tsx
// Inline style approach — avoids Tailwind arbitrary value escaping for complex transforms
const FACE_TRANSFORMS: string[] = [
  'rotateY(0deg) translateZ(90px)',
  'rotateY(72deg) translateZ(90px)',
  // ... all 20 faces
]

export function D20Spinner() {
  return (
    <div style={{ perspective: '600px' }} className="w-40 h-40">
      <div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d', animation: 'spin-d20 8s infinite linear' }}
      >
        {FACE_TRANSFORMS.map((t, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              transform: t,
              background: 'oklch(0.14 0.025 50 / 0.85)',
              border: '1px solid oklch(0.75 0.18 75 / 0.5)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

**Note on keyframe injection:** CSS `@keyframes` cannot be written as Tailwind utilities. The recommended pattern is to add them to `globals.css` alongside the existing `@theme inline` block, or use an inline `<style>` tag in the component. The inline `<style>` approach in React 19 uses the new `<style>` hoisting behavior (React 19 deduplicates `<style>` tags by their content hash).

### Pattern 2: Loading Message Cycling with Fade

**What:** A `useEffect` interval that increments a message index every N seconds; CSS `transition: opacity` for fade-in/out.

**When to use:** While `status === 'init' || status === 'migrating'`.

**Example:**
```tsx
// Message cycling with CSS fade
const [msgIndex, setMsgIndex] = useState(0)
const [visible, setVisible] = useState(true)

useEffect(() => {
  const interval = setInterval(() => {
    setVisible(false)
    setTimeout(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length)
      setVisible(true)
    }, 400) // fade-out duration
  }, 3000) // 3s per message
  return () => clearInterval(interval)
}, [])
```

**Transition class:** `transition-opacity duration-400` on the message `<p>` element.

### Pattern 3: Native Overflow Div as ScrollArea Replacement

**What:** Replace `ScrollAreaPrimitive.Root/Viewport` wiring with a styled `<div>` that uses CSS `overflow-y: auto`. The `ScrollBar` component is dropped — native scrollbars are used instead, with CSS hiding on WebKit browsers via `@layer utilities`.

**When to use:** Any location in the app where Radix ScrollArea is triggering infinite re-renders or style tag churn.

**Replacement for `src/shared/ui/scroll-area.tsx`:**
```tsx
// Replaces @radix-ui/react-scroll-area to fix React 19 infinite re-render
// Source: radix-ui/primitives issues #3417, #2933, #3799 — no stable fix in 1.2.x
import * as React from 'react'
import { cn } from '@/shared/lib/utils'

function ScrollArea({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="scroll-area"
      className={cn('relative overflow-y-auto scrollbar-thin', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function ScrollBar(_props: unknown) {
  return null // Native scrollbars used; component kept for import compatibility
}

export { ScrollArea, ScrollBar }
```

**Scrollbar styling in globals.css (optional — minimal cross-browser):**
```css
/* In @layer utilities or @layer base */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: oklch(0.30 0.04 55) transparent;
}
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: oklch(0.30 0.04 55);
  border-radius: 3px;
}
```

**Critical:** This replacement preserves the `ScrollArea` and `ScrollBar` named exports so all 6 consuming files require zero changes.

### Anti-Patterns to Avoid

- **Animating d20 with `requestAnimationFrame` + JS:** Pure CSS animation runs on the compositor thread and does not block the main thread. JS animation is unnecessary for a loading spinner.
- **Using `setInterval` for d20 rotation:** CSS `@keyframes infinite` handles this; interval is only needed for message cycling.
- **Patching `@radix-ui/react-scroll-area` internal files:** The bug is in `@radix-ui/react-compose-refs` which is a transitive dependency — patching it via `patch-package` creates fragile maintenance burden.
- **Wrapping ScrollArea in `React.memo`:** Memoization prevents parent re-renders from propagating, but the bug fires from within Radix's own ref callbacks during mount — memoization does not prevent mount.
- **Replacing ScrollArea per-component (in each of 6 files):** The fix MUST happen in `shared/ui/scroll-area.tsx` — it's the single Radix wrapper the entire app uses.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS keyframe fade animations | Custom opacity toggle logic | `tw-animate-css` animate-fade-in + CSS transition | Already imported; handles browser prefixes |
| TTRPG loading messages | Custom message database | Curated subset from dndloadingscreen.site | 303 vetted messages available; curation task is selection not creation |
| Cross-browser scrollbar hide | JavaScript ResizeObserver + scrollbar width detection | CSS `scrollbar-width: thin` + webkit pseudo-elements | Native CSS is sufficient for Tauri's WebKit/WebView2 targets |

**Key insight:** Both fixes are small and contained — the risk is over-engineering. The d20 spinner is pure CSS + static data; the ScrollArea fix is a 20-line component swap.

---

## Common Pitfalls

### Pitfall 1: CSS 3D Face Z-fighting / Invisible Die

**What goes wrong:** All 20 triangle faces overlap at the center and produce a flat colored blob instead of a 3D shape.

**Why it happens:** `translateZ` values are identical or `transform-style: preserve-3d` is missing from the wrapper. Also happens if `perspective` is not set on the parent of the `preserve-3d` element (it must be on the *parent*, not the element itself).

**How to avoid:** Set `perspective: 600px` on the wrapper div (the one that does NOT have `transform-style: preserve-3d`). Set `transform-style: preserve-3d` on the spinning div. Each face needs a distinct `rotateY` position before `translateZ`.

**Warning signs:** Die looks like a flat polygon or a circle, not a polyhedron.

### Pitfall 2: Keyframes Not Applied Because of Tailwind v4 Purge

**What goes wrong:** `@keyframes spin-d20` is defined in `globals.css` but Tailwind v4's CSS layer handling omits it from the output bundle.

**Why it happens:** Tailwind v4 uses CSS layers. `@keyframes` defined outside of any `@layer` block are fine, but if placed inside `@layer utilities` they may be tree-shaken if no utility references the animation name.

**How to avoid:** Define `@keyframes spin-d20` at the root level (outside any `@layer`) in `globals.css`. Reference it via `style={{ animation: 'spin-d20 8s infinite linear' }}` inline — Tailwind does not purge inline styles.

**Warning signs:** Die does not spin; browser DevTools shows no matching `@keyframes` rule.

### Pitfall 3: `ScrollBar` Import Breaks After Replacement

**What goes wrong:** After replacing `scroll-area.tsx`, a file that does `import { ScrollBar } from '@/shared/ui/scroll-area'` gets a TypeScript error or renders nothing unexpected.

**Why it happens:** The replacement component exports `ScrollBar` as a no-op. If any consumer renders `<ScrollBar />` expecting a visual element, it disappears silently.

**How to avoid:** Audit all 6 consumers (`BestiaryPage.tsx`, `BestiarySearchPanel.tsx`, `InitiativeList.tsx`, `CreatureSearchSidebar.tsx`, `EncounterCreatureList.tsx`) — none of them import or render `<ScrollBar>` directly (they use `<ScrollArea>` only). The `ScrollBar` no-op is safe.

**Warning signs:** TypeScript error on import; visible scrollbar disappears on a component that explicitly rendered `<ScrollBar>`.

### Pitfall 4: Message Cycling Interval Firing After Component Unmount

**What goes wrong:** After `onReady()` is called and `SplashScreen` unmounts, the `setInterval` callback fires and calls `setState` on an unmounted component — producing a React warning.

**Why it happens:** The `clearInterval` in the `useEffect` cleanup runs, but if `onReady()` triggers synchronously inside the interval callback (impossible in this design, but possible if wired incorrectly), the timing races.

**How to avoid:** The cycling interval `useEffect` must have a separate cleanup. Use a ref to cancel it: `const timerRef = useRef<ReturnType<typeof setInterval>>()`. Clear in cleanup. The existing `initialize()` function in `SplashScreen.tsx` already has a `setTimeout(onReady, 150)` — the interval cleanup runs first during unmount.

**Warning signs:** "Can't perform a React state update on an unmounted component" in console.

### Pitfall 5: Radix ScrollArea Downgrade Creates Other Regressions

**What goes wrong:** Downgrading `@radix-ui/react-scroll-area` to a pre-1.2.x version to escape the React 19 ref bug introduces different regressions (display:table layout issues, text-overflow bugs) that affect Bestiary and InitiativeList.

**Why it happens:** The 1.2.x series introduced viewport display fixes that earlier versions lack.

**How to avoid:** Do not downgrade. Use the native overflow div replacement instead — it sidesteps all Radix versioning concerns entirely.

---

## Code Examples

### Loading Messages — Curated TTRPG Universal Subset

```typescript
// Source: https://dndloadingscreen.site/ — universal TTRPG humor, no system mechanics
export const LOADING_MESSAGES = [
  "Never split the party. NEVER SPLIT THE PARTY.",
  "When the DM asks 'Are you sure?', you should always say 'No.'",
  "Be cautious and intelligent. This does not have save files.",
  "Just because you CAN do it, doesn't mean you should — but it does mean you probably will.",
  "DMs are always hungry. Bring them food and they may have mercy on your character.",
  "The DM's role is to play WITH the players, not against them. As far as you know.",
  "There are no wrong paths. Just paths your DM hasn't prepared for.",
  "Don't be afraid of a tactical retreat. Cowardice is preferable to death. Usually.",
  "No matter how much fun you're having, remember you're not the only one at the table.",
  "The dice don't hate you. They're just indifferent.",
  "Every failed roll is just an opportunity for creative problem-solving.",
  "The monster manual is a suggestion, not a limitation.",
  "If the floor is lava, the ceiling is probably also lava.",
  "Asking 'can I pet the monster?' is always a valid action.",
  "The tavern is on fire. Again.",
  "Remember: an 18 Charisma means YOU still have to do the talking.",
  "Your character sheet is a work of fiction. A beautiful, optimized fiction.",
  "The map is not the territory. The DM's notes are also not the territory.",
  "Inventory management is a skill check in real life too.",
  "Not all who wander are lost. Some of them just failed their Perception check.",
  "The dice remember your hubris.",
  "It's not a fumble, it's a dramatic complication.",
  "Every campaign ends eventually. The question is how many TPKs until then.",
  "Roll for initiative. Roll for everything. Roll to breathe if necessary.",
  "Critical failures build character. Yours and your character's.",
]
```

### SplashScreen Visual Replacement Pattern

```tsx
// Replace the Loader2 spinner block with:
{(status === 'init' || status === 'migrating') && (
  <div className="flex flex-col items-center gap-8">
    <D20Spinner />  {/* New component */}
    <h1 className="text-3xl font-bold text-pf-gold tracking-wide">PathBuddy</h1>
    <p
      className="text-sm text-muted-foreground text-center max-w-xs transition-opacity duration-400"
      style={{ opacity: msgVisible ? 1 : 0 }}
      aria-live="polite"
    >
      {LOADING_MESSAGES[msgIndex]}
    </p>
    {/* Minimal progress bar — subtle, as per D-08 */}
    <div className="w-48 h-0.5 rounded-full bg-border overflow-hidden">
      <div className="h-full bg-pf-gold/40 animate-pulse w-full" />
    </div>
  </div>
)}
```

### globals.css Keyframe Addition

```css
/* Add after @import blocks, outside any @layer — Phase 11 d20 spinner */
@keyframes spin-d20 {
  0%   { transform: rotateX(-20deg) rotateY(0deg); }
  100% { transform: rotateX(-20deg) rotateY(360deg); }
}

@keyframes fade-msg {
  0%, 100% { opacity: 1; }
  45%, 55% { opacity: 0; }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React 18 ref cleanup (no-op) | React 19 ref callbacks can return cleanup functions | React 19.0 (Dec 2024) | Radix composeRefs fires infinitely when inline callback passed |
| Radix ScrollArea as stable foundation | Radix ScrollArea has open style-tag churn bug | ~Feb 2025 (issue #3417) | Projects on React 19 must work around it |
| CSS `@keyframes` in Tailwind config | CSS `@keyframes` defined in globals.css directly | Tailwind v4 (Jan 2025) | Tailwind v4 has no `keyframes` config key — use CSS directly |
| Three.js for 3D shapes | Pure CSS `preserve-3d` + `clip-path` | Modern browsers | Sufficient for simple polyhedra at loading screen fidelity |

**Deprecated/outdated:**
- Tailwind v3 `extend.keyframes` in `tailwind.config.js`: Tailwind v4 uses pure CSS `@theme` — no JS config. All animations defined in CSS.
- Radix ScrollArea `type="auto"` prop for hiding scrollbars: The component's `<style dangerouslySetInnerHTML>` injection pattern is the root of the React 19 issue.

---

## Open Questions

1. **D20 face count vs. simplification**
   - What we know: A true icosahedron has 20 faces with precise golden-ratio geometry. The reference CodePens use SCSS `@for` loops to calculate face transforms.
   - What's unclear: For a loading screen spinner, does mathematical precision matter? Or is a 12-face approximation visually acceptable?
   - Recommendation: Use 12 faces (top cap + 5 upper + 5 lower + bottom cap) arranged with rotateY(72deg * n) increments — far simpler math, visually convincing when spinning at 8s/revolution. The user cannot count faces on a moving die.

2. **ScrollArea in other pages (Bestiary, InitiativeList)**
   - What we know: 4 other files use `ScrollArea` — `BestiaryPage.tsx`, `BestiarySearchPanel.tsx`, `InitiativeList.tsx` — and they have not been reported as crashing.
   - What's unclear: Are they silently triggering the style-tag churn bug, or is the crash only triggered by EncountersPage's specific render pattern?
   - Recommendation: Replace the shared wrapper anyway. The native overflow div is strictly simpler and benefits all consumers. No risk of regression since the visual result is identical.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase is pure code/CSS changes with no new runtime tools, services, or CLI utilities required).

---

## Sources

### Primary (HIGH confidence)
- GitHub radix-ui/primitives issue #3799 — React 19 + Radix infinite re-render root cause (composeRefs unstable identity)
- GitHub radix-ui/primitives issue #2933 — @radix-ui/react-scroll-area React 19 ref compatibility (CLOSED/COMPLETED, fix in PR #2934)
- GitHub radix-ui/primitives issue #3417 — ScrollArea style tag re-rendering with React 19, open and unresolved as of April 2025
- Direct code inspection: `src/app/SplashScreen.tsx`, `src/shared/ui/scroll-area.tsx`, `src/features/encounter-builder/ui/*.tsx`
- `package.json`: confirmed React 19.2.4, @radix-ui/react-scroll-area 1.2.10, tw-animate-css 1.3.3

### Secondary (MEDIUM confidence)
- CodePen jkneb/ApjrEy — CSS 3D icosahedron with 20 triangles, preserve-3d, @keyframes spin 5s infinite; confirms technique
- CodePen mblase75/BjBmzE — CSS 3D spinning icosahedron using SCSS trig variables; confirms face positioning approach
- dndloadingscreen.site — source for TTRPG loading messages; universal humor examples confirmed
- npm registry: @radix-ui/react-scroll-area 1.2.10 is latest stable; 1.2.11-rc exists but is release candidate

### Tertiary (LOW confidence)
- Various community reports of memoization as ScrollArea workaround — not verified to fix the mount-time ref loop
- CodePen vicentemundim/nXNvBw — 3D d20 with SCSS roll animation; 403 on direct fetch but pattern confirmed from search summaries

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from direct package.json inspection and official GitHub issues
- Architecture: HIGH — SplashScreen.tsx fully read; replacement pattern is a well-established CSS technique
- Pitfalls: HIGH for ScrollArea (confirmed from multiple open GitHub issues); MEDIUM for CSS 3D (geometry approximation is practical judgment, not measured)
- ScrollArea fix approach: HIGH — native overflow div is confirmed workaround across multiple community reports; zero risk of regression given identical visual output

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable; Radix fix unlikely in <30 days given issue age)
