# Phase 37: Dice UI + History - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Visual dice rolling UI — three components consuming the Phase 36 dice engine:
1. `DiceCubeAnimation` — CSS 3D cube that spins on each roll, landing face shows rolled value
2. `RollResultToast` — sonner toast showing formula + die breakdown + total
3. `RollHistoryPanel` — collapsible session history, clearable

All three are wired to `useRollStore`. Integration point: **AppHeader** (global, all pages).

Does NOT deliver clickable roll formulas (Phase 38) or condition modifier math (Phase 39).

</domain>

<decisions>
## Implementation Decisions

### Roll History Placement
- **D-01:** `RollHistoryPanel` lives in **AppHeader** — globally accessible from any page, not
  limited to CombatPage. An icon button (🎲 or dice icon) in the AppHeader right section
  opens it as a slide-out panel or dropdown, similar in pattern to the existing theme toggle.
  **This overrides the UI-SPEC placement** (UI-SPEC placed it in the CombatPage bottom
  ResizablePanel below TurnControls — that placement is superseded by this decision).

### Roll Trigger in Phase 37
- **D-02:** A **"Roll d20" icon button** is added to AppHeader alongside the Roll History
  button. Clicking it calls `rollDice("1d20")` and dispatches to `addRoll()`. This serves
  as Phase 37 verification and stays as a **permanent manual quick-roll** feature (not a
  dev-only fixture — Phase 38 keeps it). Placement: AppHeader right section, left of the
  Roll History button, left of the theme toggle.

### Toast Subscription Architecture
- **D-03:** A **`<RollToastListener />`** React component is mounted inside AppHeader. It
  uses `useEffect` watching `rolls[0]` (the newest roll in the store) and fires `toast()`
  via sonner when a new roll appears. The component renders null — pure side-effect listener.
  ```tsx
  // AppHeader structure after Phase 37:
  <header>
    <RollToastListener />   {/* null render, fires toast on rolls[0] change */}
    <div>
      <RollDie20Button />   {/* 🎲 quick roll d20 */}
      <RollHistoryButton /> {/* opens RollHistoryPanel */}
      <ThemeToggle />
    </div>
  </header>
  ```

### Cube Result Face Behavior
- **D-04:** During the 360° CSS spin animation, all 6 cube faces display the die type label
  (e.g., "d20"). After the animation completes (`animationend` event or CSS `animation-fill-mode: forwards`),
  JS updates the front face div content to show the **rolled value in gold** (`var(--pf-gold)`).
  The face swap happens post-animation — no need to calculate a specific landing rotation
  per face. The cube always returns to its original orientation (360° = full rotation), and
  the front face content is then replaced with the result.

### RollHistoryPanel UI (from UI-SPEC, placement updated)
- **D-05:** Panel is still collapsible with the UI-SPEC-defined layout (header with roll count
  badge + "Clear History" button, 240px max height, 50 rolls cap, history rows with
  HH:MM timestamp + formula Badge + breakdown + total in gold). Only the **container changes**:
  instead of CombatPage bottom panel, it renders as an overlay/dropdown from AppHeader.
- **D-06:** No confirmation dialog for "Clear History" — session-only data, acceptable loss.

### Claude's Discretion
- Whether RollHistoryPanel opens as a Popover, Sheet (slide-in), or dropdown — Claude
  decides based on what fits cleanly with shadcn/ui patterns and AppHeader constraints.
- Exact width/positioning of the panel relative to the AppHeader trigger button.
- Whether `RollToastListener` uses `useRollStore.subscribe()` or `useEffect` with roll count
  as dep — either is fine, Claude picks the cleaner pattern.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### UI Design Contract (partially overridden)
- `.planning/phases/37-dice-ui-history/37-UI-SPEC.md` — visual/interaction spec for this
  phase. **IMPORTANT:** The placement section (RollHistoryPanel in CombatPage bottom panel)
  is superseded by D-01 above. All other sections (colors, typography, animation durations,
  copywriting, component inventory) remain authoritative.

### Phase 36 Foundation
- `.planning/phases/36-roll-foundation/36-CONTEXT.md` — Roll types, store decisions, formula
  parser scope, MAP tracking in RollStore.

### Implementation Files (read before planning)
- `engine/dice/dice.ts` — `rollDice()`, `parseFormula()`, `Roll`, `DiceEntry` types
- `src/shared/model/roll-store.ts` — `useRollStore` with `addRoll()`, `clearRolls()`, MAP actions
- `src/widgets/app-shell/ui/AppHeader.tsx` — integration point; currently has theme toggle
  in right `<div>`. New components added here.

### Design System
- `src/app/styles/globals.css` — PF2e OKLCH tokens: `--pf-gold`, `--pf-blood`,
  `--muted-foreground`, `--card`, `--border`. Also `.d20` CSS animation pattern (reference
  for cube CSS approach).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sonner` toast (`shared/ui/sonner.tsx`) — already installed, `<Toaster />` mounted app-wide
- `Collapsible` (`shared/ui/collapsible`) — for RollHistoryPanel open/close
- `Button`, `Badge`, `Separator` — standard shadcn components already present
- `AppHeader` right `<div>` — already has theme toggle icon button pattern (ghost, size=icon, w-8 h-8)

### Established Patterns
- AppHeader: icon buttons in right section, `variant="ghost" size="icon" className="w-8 h-8"`
- Toast: `sonner` fired via `toast()` call, `<Toaster />` already mounted globally
- Zustand: immer middleware, `useShallow` for object selectors (not needed for simple array reads)
- FSD layers: `DiceCubeAnimation` → `shared/ui/`, `RollToastListener` → `shared/ui/`,
  `RollHistoryPanel` → `widgets/roll-history/`, `RollDie20Button` → `shared/ui/`

### Integration Points
- `AppHeader.tsx` — mount RollToastListener (null render), RollDie20Button, RollHistoryButton
- `useRollStore` → consumed by RollToastListener + RollHistoryPanel + RollDie20Button
- `rollDice()` from `@engine` → called by RollDie20Button, result passed to `addRoll()`

</code_context>

<specifics>
## Specific Ideas

- AppHeader addition order (left to right in right section): `RollDie20Button` → `RollHistoryButton` → `ThemeToggle`
- Natural 20 toast: total in `var(--pf-gold)` + "Critical!" suffix label in gold
- Natural 1 toast: total in `var(--pf-blood)` + "Fumble" suffix label
- Die breakdown in toast: each die value in a 24×24px bordered square (var(--card) bg, var(--border) border, mono font)

</specifics>

<deferred>
## Deferred Ideas

- **Spell damage button** ("Damage 🔥" with flame icon) — fires all damage types at once,
  shows breakdown of each component (cold, spirit, etc). User example: Chilling Darkness
  deals 5d6 cold + conditional 5d6 spirit. This is Phase 38+ scope.
- **Multi-type spell damage display** — when a spell has conditional or secondary damage
  types, show each component separately with source label. Phase 38+ scope.

</deferred>

---

*Phase: 37-dice-ui-history*
*Context gathered: 2026-04-04*
