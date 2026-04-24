# Phase 89: use-spellcasting Trim — Context

**Gathered:** 2026-04-24
**Status:** Ready for planning (express path — tech debt, locked scope)

<domain>
## Phase Boundary

Trim `src/features/spellcasting/model/use-spellcasting.ts` от 119 до <100 строк через:
1. Extract pure helper `resolveCastMode(section)` в `features/spellcasting/lib/resolve-cast-mode.ts` (traditionFilter + isFocus + spellModColor derivation).
2. Extract dialog state (`spellDialogOpen`/`spellDialogRank` + `handleSlotDelta` side-effect) в новый sub-hook `use-spell-search-dialog.ts` в `features/spellcasting/model/spellcasting/`.
3. Facade становится чистым composer'ом — 0 useState, 0 derived expressions.

Zero user-visible behavior changes. Return shape preserved для backward compat с existing consumers (SpellcastingBlock + CombatantSpellcasting).

</domain>

<decisions>
## Implementation Decisions

### resolve-cast-mode Helper (D-01)

- **D-01:** `src/features/spellcasting/lib/resolve-cast-mode.ts` — pure function:
  ```ts
  export function resolveCastMode(section: SpellcastingSection, spellModNet: number): {
    isFocus: boolean
    traditionFilter: string | undefined
    spellModColor: string
  }
  ```
  Inputs: `section` (типы `SpellcastingSection`), `netModifier` от `useSpellModifiers`. Output: derived slice готовый к spread в return. Pure — no React.

### use-spell-search-dialog Sub-hook (D-02)

- **D-02:** Новый `src/features/spellcasting/model/spellcasting/use-spell-search-dialog.ts`:
  ```ts
  export function useSpellSearchDialog(castType: SpellcastingSection['castType'], poolHandleSlotDelta) {
    const [spellDialogOpen, setSpellDialogOpen] = useState(false)
    const [spellDialogRank, setSpellDialogRank] = useState(0)
    async function handleSlotDelta(rank, change) {
      await poolHandleSlotDelta(rank, change, (r) => {
        if (castType === 'prepared') {
          setSpellDialogRank(r)
          setSpellDialogOpen(true)
        }
      })
    }
    return { spellDialogOpen, setSpellDialogOpen, spellDialogRank, setSpellDialogRank, handleSlotDelta }
  }
  ```
  Изолирует UI local state + side-effect handler. Facade после трима не имеет useState.

### Facade Shape Preservation (D-03)

- **D-03:** Return object keys НЕ меняются. Consumers (SpellcastingBlock, CombatantSpellcasting, любые) продолжают работать без изменений. Только внутренняя composition меняется. Это zero-regression invariant.

### File Location (D-04)

- **D-04:** Новый sub-hook идёт в `model/spellcasting/` (existing convention — там уже use-caster-progression.ts, use-rank-filter.ts, etc.). Помощник идёт в `lib/` (FSD convention — pure utilities без React). Не создаём новый domain name.

### Verification (D-05)

- **D-05:** Gates + manual spellcasting regression (prepared/innate/spontaneous/focus — все 4 cast types должны работать в `pnpm tauri dev`). Смысл: если facade правильно preserves return shape, consumers не сломаются. Automated coverage: tsc + lint + lint:arch + line count grep.

### Claude's Discretion

- Точное имя returning variable в resolveCastMode (can use destructuring directly)
- Whether to also extract `spellMod` setup (3 строки) — НЕ трогаем если и так ниже 100 после extractions
- Naming `use-spell-search-dialog` vs `use-spell-dialog-state` — builder picks clearer

</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` §Phase 89 — SC1-5
- `.planning/REQUIREMENTS.md` §DEBT-01
- `.planning/STATE.md` — v1.6.0 audit carryover context
- `src/features/spellcasting/model/use-spellcasting.ts` — facade (trim target)
- `src/features/spellcasting/model/spellcasting/` — existing sub-hooks directory
- `src/features/spellcasting/lib/` — pure helpers (may not exist yet — создать если нет)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **6 existing sub-hooks pattern** — `use-caster-progression`, `use-rank-filter`, `use-spell-overrides`, `use-spell-link-map`, `use-pooled-slots`, `use-consumable-copies`. Новый sub-hook следует тому же паттерну.
- **`SpellcastingSection` type** — из `@/entities/spell` — использует и facade и будущий helper.

### Established Patterns

- **FSD:** pure utilities в `features/<X>/lib/`, реактивные hooks в `features/<X>/model/`. D-01 и D-02 следуют этому.
- **useShallow + useMemo** — в sub-hook при derived state; new hook использует useState для dialog UI — это OK, это локальный UI state.

### Integration Points

- Consumers: `SpellcastingBlock.tsx`, `CombatantSpellcasting.tsx`, etc. — читают returned объект. D-03 гарантирует zero breakage.

</code_context>

<deferred>
## Deferred Ideas

- **Further facade trim** — если после extractions всё ещё > ~80 строк, дальнейшее сокращение требует рефакторинга return composition; вне Phase 89 scope.
- **useSpellModifiers inlining** — move into sub-hook (use-spellcasting-modifiers.ts) — не нужно в Phase 89, facade композирует напрямую.

</deferred>

---

*Phase: 89-tech-debt-use-spellcasting-trim*
*Context gathered: 2026-04-24 via express path*
