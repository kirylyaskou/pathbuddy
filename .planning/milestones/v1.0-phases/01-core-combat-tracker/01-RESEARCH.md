# Phase 1: Core Combat Tracker - Research

**Researched:** 2026-03-17
**Domain:** Vue3 + Tauri desktop application with combat tracking
**Confidence:** HIGH

## Summary

Phase 1 builds the foundational combat tracker UI for the Pathfinder 2e DM Assistant. The phase focuses on creating a reactive Vue3 interface that displays creatures in initiative order, allows adding creatures with HP and conditions, enables HP modifications, and supports toggling status conditions.

**Primary recommendation:** Use Vue 3.5+ with Composition API and `<script setup>`, Pinia for state management, and Tauri v2 for multi-window desktop capabilities. Implement a reactive combat state with initiative-based sorting and condition management using Vue's reactivity system.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Tech stack: Vue3 + Tauri desktop app
- Data format: Foundry VTT PF2e pack JSON compatibility (for later phases)
- Persistence: Local JSON files, offline-first
- Platform: Desktop (Windows/macOS/Linux)
- Multi-window workspace: DMs need to reference multiple tools simultaneously

### Claude's Discretion
- Vue3 version and specific libraries
- State management approach (Pinia vs Vuex vs vanilla)
- UI component library choice
- Condition data structure design
- Initiative sorting algorithm

### Deferred Ideas (OUT OF SCOPE)
- Cloud sync — Local JSON persistence only for v1
- Player-facing features — DM tool only
- Real-time multiplayer — Single-user desktop app
- Mobile version — Desktop-first with Tauri
- Custom monster creation — Import only in v1
- Auto-round processing — Phase 2 feature

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COMBAT-01 | User can view combat tracker with initiative order | Initiative state management, reactive sorting, creature card UI |
| COMBAT-02 | User can add creatures to combat with HP and conditions | Creature data model, form inputs, condition toggle UI |
| COMBAT-03 | User can track HP changes per creature | Reactive HP state, +/- controls, boundary validation |
| COMBAT-04 | User can apply/remove conditions (stunned, paralyzed, etc.) | Condition data structure, toggle mechanism, P2e condition list |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 | 3.5.x | Reactive UI framework | Current stable, Composition API, best performance |
| Vite | 6.x | Build tool | Native Vue support, fast HMR, zero-config |
| TypeScript | 5.6.x | Type safety | Essential for complex combat state modeling |
| Tauri | 2.2.x | Desktop runtime | Multi-window support, Rust backend, small binaries |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Pinia | 2.3.x | State management | Reactive combat state, persistence hooks |
| Composable APIs | N/A | Shared logic | Initiative sorting, condition helpers |
| Tailwind CSS | 3.4.x | Utility-first styling | Rapid UI development, consistent design |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pinia | Vuex | Vuex is heavier, Pinia is Vue 3 recommended |
| Tailwind | Element Plus | Tailwind gives more control over combat tracker layout |
| `<script>` tags | `<script setup>` | `<script setup>` is the modern Vue 3 pattern |
| LocalStorage | FileSystem Access API | FileSystem needed for JSON persistence (Phase 6) |

**Installation:**

```bash
# Create Vue project with Vite
npm create vue@latest pathbuddy

# Add Tauri
cd pathbuddy
npm create tauri-app@latest

# Add dependencies
npm install pinia
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Version verification:**

```bash
npm view vue version              # 3.5.x
npm view @vue/cli version         # 7.5.x
npm view @tauri-apps/cli version  # 2.2.x
npm view pinia version            # 2.3.x
npm view tailwindcss version      # 3.4.x
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── main.ts               # App entry, Vue + Tauri setup
├── App.vue               # Root component
├── stores/
│   └── combat.ts         # Pinia store for combat state
├── components/
│   ├── CombatTracker.vue     # Main tracker window
│   ├── CreatureCard.vue      # Individual creature display
│   ├── ConditionToggle.vue   # Condition toggle button
│   └── HPController.vue      # HP +/- controls
├── composables/
│   ├── useInitiative.ts      # Initiative sorting logic
│   └── useConditions.ts      # Condition helpers
├── types/
│   └── combat.ts             # TypeScript interfaces
└── assets/
    └── tailwind.css          # Tailwind imports

src-tauri/
├── src/
│   └── main.rs           # Tauri Rust backend
├── Capabilities/
│   └── default.json      # Tauri permissions
└── tauri.conf.json       # Tauri config (multi-window)
```

### Pattern 1: Reactive Combat State

**What:** Centralized Pinia store managing all combat data with reactive properties for creatures, initiative order, and current turn.

**When to use:** All combat tracker operations read/write through this store.

**Example:**

```typescript
// src/stores/combat.ts
import { defineStore } from 'pinia'
import type { Creature, Condition } from '@/types/combat'

export const useCombatStore = defineStore('combat', {
  state: () => ({
    creatures: [] as Creature[],
    isActive: false,
  }),

  getters: {
    sortedCreatures: (state) =>
      [...state.creatures].sort((a, b) => a.initiative - b.initiative),
    currentTurnCreature: (state) => {
      const sorted = state.sortedCreatures
      return sorted.find(c => c.isCurrentTurn) || null
    }
  },

  actions: {
    addCreature(creature: Omit<Creature, 'id'>) {
      const newCreature: Creature = {
        ...creature,
        id: crypto.randomUUID(),
        initiative: Math.floor(Math.random() * 20) + 1
      }
      this.creatures.push(newCreature)
    },

    modifyHP(id: string, delta: number) {
      const creature = this.creatures.find(c => c.id === id)
      if (creature) {
        creature.currentHP = Math.max(0, creature.currentHP + delta)
        if (creature.currentHP === 0 && !creature.isDowned) {
          creature.isDowned = true
          creature.conditions.push('unconscious' as Condition)
        }
      }
    },

    toggleCondition(id: string, condition: Condition) {
      const creature = this.creatures.find(c => c.id === id)
      if (!creature) return

      const idx = creature.conditions.indexOf(condition)
      if (idx > -1) {
        creature.conditions.splice(idx, 1)
      } else {
        creature.conditions.push(condition)
      }
    },

    setCurrentTurn(index: number) {
      this.creatures.forEach((c, i) => {
        c.isCurrentTurn = i === index
      })
    }
  }
})
```

**Source:** Vue 3 + Pinia best practices

### Pattern 2: Initiative Sorting with Stability

**What:** Sort creatures by initiative with secondary sort for creatures with same initiative (insertion order or Dexterity modifier).

**When to use:** Whenever displaying the creature list, calculating turn order.

**Example:**

```typescript
// src/composables/useInitiative.ts
export function useInitiative() {
  const sortByInitiative = (creatures: Creature[]) => {
    return [...creatures].sort((a, b) => {
      if (a.initiative !== b.initiative) {
        return b.initiative - a.initiative
      }
      // Secondary sort: Dexterity modifier (higher first)
      return (b.dexMod || 0) - (a.dexMod || 0)
    })
  }

  const getNextCreatureIndex = (
    currentTurnIndex: number,
    totalCreatures: number
  ): number => {
    return (currentTurnIndex + 1) % totalCreatures
  }

  return { sortByInitiative, getNextCreatureIndex }
}
```

### Pattern 3: Condition Toggle UI

**What:** Reusable component for toggling P2e status conditions with visual feedback.

**When to use:** Displaying conditions on creature cards, quick condition application.

**Example:**

```vue
<!-- src/components/ConditionToggle.vue -->
<template>
  <button
    :class="[
      'condition-toggle px-2 py-1 rounded text-xs font-semibold',
      condition.active ? `bg-${condition.color}-600 text-white` : 'bg-gray-200 text-gray-600'
    ]"
    @click="$emit('toggle', condition.name)"
  >
    {{ formatCondition(condition.name) }}
  </button>
</template>

<script setup lang="ts">
import type { ConditionDef } from '@/types/combat'

defineProps<{
  condition: ConditionDef
}>()

defineEmits<{
  toggle: [name: string]
}>()

const formatCondition = (name: string) => {
  return name.split('_').map(w => w.charAt(0) + w.slice(1)).join(' ')
}
</script>
```

### Anti-Patterns to Avoid

- **Manual DOM manipulation:** Don't use `document.querySelector` or `refs` for state updates — use Vue's reactivity system
- **Nested reactive objects:** Keep state flat where possible; use Pinia actions for complex mutations
- **Synchronous file I/O in main thread:** Tauri's async API must be used for any file operations (Phase 6)
- **Hardcoded P2e rules:** Extract condition names, durations, and effects to constants/types
- **Initiative re-sorting on every render:** Use computed properties for sorted list

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Initiative sorting | Custom sort algorithm | Computed property with `.sort()` | Vue reactivity handles updates automatically |
| UUID generation | Manual ID creation | `crypto.randomUUID()` | Browser-native, collision-safe |
| Condition list | Hardcoded array in components | Centralized type definition | Ensures consistency across app |
| HP boundary validation | Check everywhere | Pinia action with Math.max(0, value) | Single source of truth |
| Turn tracking | Manual index management | Store action `setCurrentTurn()` | Ensures all creatures update correctly |

**Key insight:** Vue's reactivity system handles UI updates automatically when state changes. Don't try to manually sync state and UI — let Vue do the work.

## Common Pitfalls

### Pitfall 1: Reactive State Loss

**What goes wrong:** Using plain objects for creature state loses reactivity when adding to arrays.

**Why it happens:** Vue 3 uses `reactive()` which works on objects, but array pushing plain objects doesn't maintain reactivity.

**How to avoid:** Always use `reactive()` or `ref()` on creature objects before adding to arrays:

```typescript
// WRONG
creatures.push({ name: 'Goblin', currentHP: 7 })

// RIGHT
creatures.push(reactive({ name: 'Goblin', currentHP: 7 }))
```

**Warning signs:** HP changes don't update UI, condition toggles have no effect

### Pitfall 2: Initiative Order Not Updating

**What goes wrong:** Creature initiative values change but display order doesn't update.

**Why it happens:** Using `sort()` directly on reactive array mutates it in place, breaking reactivity.

**How to avoid:** Create a computed property that returns sorted copy:

```typescript
const sortedCreatures = computed(() =>
  [...creatures.value].sort((a, b) => b.initiative - a.initiative)
)
```

**Warning signs:** After manually changing initiative, list order is wrong

### Pitfall 3: Condition State Not Synced

**What goes wrong:** Condition toggle button shows wrong state after user action.

**Why it happens:** Using local component state instead of store state for condition toggles.

**How to avoid:** Always read/write conditions from Pinia store, never cache in component.

**Warning signs:** Clicking condition button shows it toggled, but button reverts

### Pitfall 4: HP Going Negative

**What goes wrong:** HP can become -10, -100, etc. instead of clamping at 0.

**Why it happens:** Direct state mutation without boundary validation.

**How to avoid:** Always use action for HP changes:

```typescript
modifyHP(id: string, delta: number) {
  const creature = this.creatures.find(c => c.id === id)
  if (creature) {
    creature.currentHP = Math.max(0, creature.currentHP + delta)
  }
}
```

**Warning signs:** Creature shows -5 HP, unconscious check fails

## Code Examples

### Combat Tracker Component

```vue
<!-- src/components/CombatTracker.vue -->
<template>
  <div class="combat-tracker h-full flex flex-col">
    <header class="p-4 border-b">
      <h1 class="text-xl font-bold">Combat Tracker</h1>
      <div class="mt-2 flex gap-2">
        <button
          @click="addCreatureForm.open = true"
          class="px-3 py-1 bg-blue-600 text-white rounded"
        >
          + Add Creature
        </button>
        <button
          @click="advanceTurn"
          class="px-3 py-1 bg-green-600 text-white rounded"
          :disabled={!combatStore.isActive}
        >
          Advance Turn
        </button>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto p-4">
      <div
        v-for="(creature, index) in combatStore.sortedCreatures"
        :key="creature.id"
        class="mb-2"
      >
        <CreatureCard
          :creature="creature"
          :is-current-turn="creature.isCurrentTurn"
          :turn-index="index"
          @modify-hp="combatStore.modifyHP"
          @toggle-condition="combatStore.toggleCondition"
        />
      </div>

      <div v-if="combatStore.creatures.length === 0" class="text-center py-8 text-gray-500">
        No creatures in combat. Click "+ Add Creature" to begin.
      </div>
    </main>

    <AddCreatureForm v-model="addCreatureForm.open" @add="combatStore.addCreature" />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useCombatStore } from '@/stores/combat'
import CreatureCard from './CreatureCard.vue'
import AddCreatureForm from './AddCreatureForm.vue'

const combatStore = useCombatStore()

const addCreatureForm = reactive({ open: false })

const advanceTurn = () => {
  if (combatStore.creatures.length === 0) return

  const currentTurnIndex = combatStore.creatures.findIndex(c => c.isCurrentTurn)
  const nextIndex = (currentTurnIndex + 1) % combatStore.creatures.length

  combatStore.setCurrentTurn(nextIndex)
}
</script>
```

### Creature Card Component

```vue
<!-- src/components/CreatureCard.vue -->
<template>
  <div
    :class="[
      'creature-card p-3 rounded border-l-4',
      creature.isCurrentTurn ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white',
      creature.isDowned && !creature.isCurrentTurn ? 'opacity-50' : ''
    ]"
  >
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <h3 class="font-semibold">{{ creature.name }}</h3>
        <div class="text-sm text-gray-600">
          Initiative: {{ creature.initiative }}
          <span v-if="creature.ac"> | AC: {{ creature.ac }}</span>
        </div>
      </div>

      <div class="flex gap-2 items-center">
        <!-- HP Controls -->
        <div class="flex items-center gap-1">
          <button
            @click="$emit('modify-hp', creature.id, -1)"
            class="w-6 h-6 rounded bg-red-100 hover:bg-red-200 text-red-600"
            title="Damage -1"
          >
            -
          </button>
          <span class="w-12 text-center font-mono">{{ creature.currentHP }} / {{ creature.maxHP }}</span>
          <button
            @click="$emit('modify-hp', creature.id, 1)"
            class="w-6 h-6 rounded bg-green-100 hover:bg-green-200 text-green-600"
            title="Heal +1"
          >
            +
          </button>
        </div>

        <!-- Conditions -->
        <div class="flex flex-wrap gap-1">
          <ConditionToggle
            v-for="condition in combatConditions"
            :key="condition.name"
            :condition="condition"
            :active="creature.conditions.includes(condition.name)"
            @toggle="$emit('toggle-condition', creature.id, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Creature, ConditionDef } from '@/types/combat'
import ConditionToggle from './ConditionToggle.vue'

const combatConditions: ConditionDef[] = [
  { name: 'stunned', color: 'purple', duration: null },
  { name: 'paralyzed', color: 'indigo', duration: null },
  { name: 'grappled', color: 'orange', duration: null },
  { name: 'restrained', color: 'red', duration: null },
  { name: 'prone', color: 'yellow', duration: null },
  { name: 'flat-footed', color: 'gray', duration: null },
  { name: 'invisible', color: 'pink', duration: null },
  { name: 'unconscious', color: 'black', duration: null },
]

defineProps<{
  creature: Creature
  isCurrentTurn: boolean
  turnIndex: number
}>()

defineEmits<{
  'modify-hp': [id: string, delta: number]
  'toggle-condition': [id: string, condition: string]
}>()
</script>
```

### Type Definitions

```typescript
// src/types/combat.ts
export interface Creature {
  id: string
  name: string
  maxHP: number
  currentHP: number
  ac: number
  initiative: number
  dexMod: number
  isCurrentTurn: boolean
  isDowned: boolean
  conditions: Condition[]
  // Optional: speed, senses, skills, attacks for later phases
}

export type Condition =
  | 'stunned'
  | 'paralyzed'
  | 'grappled'
  | 'restrained'
  | 'prone'
  | 'flat-footed'
  | 'invisible'
  | 'unconscious'
  | 'grabbed'
  | 'slowed'
  | 'incapacitated'

export interface ConditionDef {
  name: Condition
  color: string
  duration: number | null  // Rounds remaining, null = permanent until removed
}

export interface CombatState {
  creatures: Creature[]
  isActive: boolean
  currentRound: number
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vue 2 Options API | Vue 3 Composition API (`<script setup>`) | Vue 3.0 (2020) | Better type inference, more modular |
| Vuex | Pinia | Vue 3.0 | Simpler API, better TS support |
| Webpack | Vite | 2021 | Faster builds, better HMR |
| Tauri 1.x | Tauri 2.x | 2024 | Rust-based, better multi-window |
| LocalStorage | FileSystem Access API | 2025 (v1.0) | True file persistence vs string storage |

**Deprecated/outdated:**
- `this.$options` style — use `<script setup>`
- `mapState`, `mapActions` — Pinia uses auto-imported store methods
- `component.*` lifecycle — Vue 3 uses `onMounted`, `onUnmounted`, etc.

## Open Questions

1. **Should initiative be manually set or randomly generated?**
   - What we know: P2e combat rolls initiative (d20 + Dex mod)
   - What's unclear: User preference for manual vs automated
   - Recommendation: Allow manual entry in Phase 1, add roll button in Phase 2

2. **What is the complete list of P2e conditions?**
   - What we know: stun, paralysis, grapple, etc. are common
   - What's unclear: Full P2e condition list, including temporary conditions
   - Recommendation: Research official P2e rules for complete condition list

3. **Should conditions have durations in Phase 1?**
   - What we know: Many P2e conditions last "1 round" or "until end of turn"
   - What's unclear: Whether auto-decrement is needed in Phase 1
   - Recommendation: Store duration but don't auto-decrement until Phase 2

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (Vue 3 recommended) |
| Config file | `vitest.config.ts` — auto-detected by Vite |
| Quick run command | `npm test -- --run src/stores/combat.test.ts` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| COMBAT-01 | Combat tracker displays initiative order | unit | `vitest run src/components/CombatTracker.test.ts` | ❌ Wave 0 |
| COMBAT-02 | Add creature with HP and conditions | unit | `vitest run src/stores/combat.test.ts::test_addCreature` | ❌ Wave 0 |
| COMBAT-03 | Track HP changes per creature | unit | `vitest run src/stores/combat.test.ts::test_modifyHP` | ❌ Wave 0 |
| COMBAT-04 | Apply/remove conditions | unit | `vitest run src/stores/combat.test.ts::test_toggleCondition` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run --testPathPattern="combat|creature"`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/stores/__tests__/combat.test.ts` — covers COMBAT-02, COMBAT-03, COMBAT-04
- [ ] `src/components/__tests__/CreatureCard.test.ts` — covers COMBAT-01 display
- [ ] `vitest.config.ts` — test configuration if not auto-detected
- [ ] Framework install: `npm install -D vitest @vue/test-utils jsdom` — if none detected

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- Vue 3 Documentation — Composition API, reactivity system
- Tauri v2 Documentation — Desktop application framework, multi-window support
- Pinia Documentation — State management for Vue 3
- P2e Core Rulebook — Combat, initiative, conditions

### Secondary (MEDIUM confidence)
- Vue.js Slack/Discord community patterns
- Tauri GitHub issues — multi-window best practices
- Vite documentation — Build configuration

### Tertiary (LOW confidence)
- WebSearch only, marked for validation — P2e condition list completeness

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — Vue 3 + Vite + Tauri 2 + Pinia is well-established pattern
- Architecture: **HIGH** — Composition API + Pinia provides clean separation of concerns
- Pitfalls: **MEDIUM** — Common Vue reactivity issues documented, P2e specifics may vary

**Research date:** 2026-03-17
**Valid until:** 2026-04-16 (30 days for Vue/Tauri stack)

---

## What I Might Have Missed

1. **Tauri multi-window setup specifics** — Need to verify exact Tauri config for multiple independent windows
2. **CSS framework choice** — Could use Element Plus or PrimeVue for pre-built components
3. **P2e condition completeness** — Official condition list from SRD needed
4. **Windows-specific considerations** — Tauri on Windows may have specific requirements

## Next Steps for Planning

1. Verify P2e condition list from official sources
2. Confirm Tauri multi-window configuration for Phase 5 integration
3. Create initial project scaffold with Vue + Tauri + Pinia
4. Establish test infrastructure with Vitest
