---
phase: 01-core-combat-tracker
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/main.ts
  - src/App.vue
  - src/stores/combat.ts
  - src/types/combat.ts
  - src/components/CombatTracker.vue
  - src/components/CreatureCard.vue
  - src/components/ConditionToggle.vue
  - src/components/HPController.vue
  - src/components/AddCreatureForm.vue
  - src/composables/useInitiative.ts
  - src/composables/useConditions.ts
autonomous: true
requirements:
  - COMBAT-01
  - COMBAT-02
  - COMBAT-03
  - COMBAT-04
user_setup:
  - service: node
    why: "Project scaffolding requires Node.js 18+"
    env_vars: []
    dashboard_config: []
  - service: tauri
    why: "Desktop app runtime installation"
    env_vars: []
    dashboard_config: []

must_haves:
  truths:
    - Combat tracker displays list of creatures sorted by initiative (highest first)
    - User can add a creature with name, maxHP, currentHP, AC, and conditions
    - User can modify HP up/down for each creature with clamping at 0
    - User can toggle conditions on/off for each creature and see visual feedback
    - Current turn creature is visually highlighted
  artifacts:
    - path: "src/types/combat.ts"
      provides: "Type definitions for Creature, Condition, and CombatState"
      exports: ["Creature", "Condition", "CombatState", "ConditionDef"]
    - path: "src/stores/combat.ts"
      provides: "Pinia store with reactive combat state and actions"
      exports: ["useCombatStore", "addCreature", "modifyHP", "toggleCondition", "setCurrentTurn"]
    - path: "src/components/CombatTracker.vue"
      provides: "Main combat tracker window with creature list"
      exports: ["CombatTracker"]
    - path: "src/components/CreatureCard.vue"
      provides: "Individual creature display with HP and condition controls"
      exports: ["CreatureCard"]
    - path: "src/components/ConditionToggle.vue"
      provides: "Reusable condition toggle button component"
      exports: ["ConditionToggle"]
    - path: "src/components/HPController.vue"
      provides: "HP +/- buttons for each creature"
      exports: ["HPController"]
    - path: "src/components/AddCreatureForm.vue"
      provides: "Form for adding new creatures to combat"
      exports: ["AddCreatureForm"]
    - path: "src/composables/useInitiative.ts"
      provides: "Initiative sorting logic"
      exports: ["sortByInitiative", "getNextCreatureIndex"]
    - path: "src/composables/useConditions.ts"
      provides: "Condition helpers and definitions"
      exports: ["CONDITION_DEFS", "formatCondition"]
  key_links:
    - from: "src/components/CombatTracker.vue"
      to: "src/stores/combat.ts"
      via: "import useCombatStore"
      pattern: "import.*useCombatStore.*from.*stores/combat"
    - from: "src/components/CombatTracker.vue"
      to: "src/components/CreatureCard.vue"
      via: "v-for over sortedCreatures"
      pattern: "v-for=.*sortedCreatures.*CreatureCard"
    - from: "src/components/CreatureCard.vue"
      to: "src/stores/combat.ts"
      via: "emit modify-hp and toggle-condition events"
      pattern: "emit.*modify-hp|toggle-condition"
    - from: "src/stores/combat.ts"
      to: "src/types/combat.ts"
      via: "import Creature, Condition types"
      pattern: "import.*Creature.*from.*types/combat"
---

<objective>
Scaffold Vue3 + Tauri project with combat tracker foundational components and Pinia store

Purpose: Establish the project foundation with proper TypeScript types, reactive state management, and core UI components for the combat tracker. This plan creates all the scaffolding needed for Phase 1 requirements.

Output: A runnable Vue3 + Tauri project with combat tracker UI, creature management, and initiative display.
</objective>

<execution_context>
@C:/Users/kiryl/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/kiryl/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-core-combat-tracker/01-RESEARCH.md

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from research. -->
<!-- Executor should use these directly — no codebase exploration needed. -->

From src/types/combat.ts:
```typescript
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
  duration: number | null
}
```

From src/stores/combat.ts:
```typescript
export const useCombatStore = defineStore('combat', {
  state: () => ({
    creatures: [] as Creature[],
    isActive: false,
  }),
  getters: {
    sortedCreatures: (state) => [...state.creatures].sort((a, b) => b.initiative - a.initiative),
    currentTurnCreature: (state) => {
      const sorted = state.sortedCreatures
      return sorted.find(c => c.isCurrentTurn) || null
    }
  },
  actions: {
    addCreature(creature: Omit<Creature, 'id'>): void,
    modifyHP(id: string, delta: number): void,
    toggleCondition(id: string, condition: Condition): void,
    setCurrentTurn(index: number): void
  }
})
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold Vue3 + Tauri project with dependencies</name>
  <files>package.json, tsconfig.json, vite.config.ts, src/main.ts, src/App.vue, src/assets/tailwind.css</files>
  <read_first>
    - .planning/phases/01-core-combat-tracker/01-RESEARCH.md (Section: Standard Stack)
    - https://vuejs.org/guide/quick-start.html (Vue 3 + Vite setup)
    - https://tauri.app/start/create-a-project/ (Tauri setup)
  </read_first>
  <acceptance_criteria>
    - project.json exists with @vue/cli or vue create scaffolding
    - package.json contains vue, vite, typescript, pinia, tailwindcss dependencies
    - tsconfig.json configured for TypeScript + Vue
    - vite.config.ts configured with Vue plugin
    - src/main.ts creates Vue app with Pinia and mounts to #app
    - src/App.vue contains basic app structure with router-view or combat-tracker placeholder
    - src/assets/tailwind.css contains @tailwind base, components, utilities
    - postcss.config.js and tailwind.config.js exist
  </acceptance_criteria>
  <action>
    1. Initialize project structure:
       - Create package.json with dependencies: vue@3.5.x, pinia@2.3.x, tailwindcss@3.4.x, @tauri-apps/api@1.x
       - Create devDependencies: vite@6.x, @vitejs/plugin-vue@5.x, typescript@5.6.x, @types/node@22.x, tailwindcss, postcss, autoprefixer
       - Add scripts: dev, build, preview, tauri, tauri:dev

    2. Create Vite config (vite.config.ts):
       - Use @vitejs/plugin-vue
       - Configure resolve alias for @ pointing to src
       - Set root to ., outDir to dist

    3. Create TypeScript config (tsconfig.json, tsconfig.node.json):
       - Compiler options: strict, esModuleInterop, skipLibCheck, esNext
       - Include src/**/*.ts, src/**/*.vue

    4. Initialize Vue entry points:
       - src/main.ts: Create Vue app, install Pinia, mount to #app
       - src/App.vue: Root component with basic layout

    5. Setup Tailwind CSS:
       - src/assets/tailwind.css: @tailwind base; @tailwind components; @tailwind utilities;
       - tailwind.config.js: content: ['./index.html', './src/**/*.{vue,ts}']
       - postcss.config.js: plugins: tailwindcss, autoprefixer

    6. Create src-tauri scaffold:
       - src-tauri/tauri.conf.json: Basic app config with window size 800x600
       - src-tauri/src/main.rs: Tauri entry point
  </action>
  <verify>
    <automated>npm run dev -- --run 2>&1 | grep -i "ready\|error" || echo "No server running (expected)"</automated>
    <manual>Files exist: package.json, vite.config.ts, tsconfig.json, src/main.ts, src/App.vue, src/assets/tailwind.css, src-tauri/tauri.conf.json</manual>
  </verify>
  <done>
    - package.json with all required dependencies
    - Vite + Vue 3 + TypeScript configured
    - Tailwind CSS installed and configured
    - Tauri scaffold created
    - Project builds without errors: npm run build succeeds
  </done>
</task>

<task type="auto">
  <name>Task 2: Define TypeScript types and Pinia combat store</name>
  <files>src/types/combat.ts, src/stores/combat.ts</files>
  <read_first>
    - src/types/combat.ts (if exists from task scaffolding)
    - .planning/phases/01-core-combat-tracker/01-RESEARCH.md (Section: Pattern 1: Reactive Combat State)
    - https://pinia.vuejs.org/core-concepts/state.html (Pinia state)
  </read_first>
  <acceptance_criteria>
    - src/types/combat.ts exports: Creature, Condition (union type), ConditionDef, CombatState
    - Creature interface has: id, name, maxHP, currentHP, ac, initiative, dexMod, isCurrentTurn, isDowned, conditions
    - Condition is union of: stunned, paralyzed, grappled, restrained, prone, flat-footed, invisible, unconscious, grabbed, slowed, incapacitated
    - src/stores/combat.ts exports useCombatStore with defineStore
    - Store state has: creatures (Creature[]), isActive (boolean)
    - Store has sortedCreatures computed getter that sorts by initiative descending
    - Store has currentTurnCreature computed getter returning creature with isCurrentTurn
    - Store has actions: addCreature, modifyHP, toggleCondition, setCurrentTurn
    - modifyHP clamps currentHP to Math.max(0, value)
    - toggleCondition adds/removes condition from creature's conditions array
    - setCurrentTurn sets isCurrentTurn on all creatures, only one true
  </acceptance_criteria>
  <action>
    1. Create src/types/combat.ts:
       - Define Condition type as union of all P2e conditions
       - Define ConditionDef interface with name, color, duration
       - Define Creature interface with all required fields
       - Define CombatState interface as aggregate type

    2. Create src/stores/combat.ts:
       - Import defineStore from pinia
       - Import Creature, Condition types from '@/types/combat'
       - Create store with state: creatures: [] as Creature[], isActive: false
       - Create sortedCreatures getter: computed(() => [...state.creatures].sort((a, b) => b.initiative - a.initiative))
       - Create currentTurnCreature getter: finds creature with isCurrentTurn in sorted list
       - Implement addCreature: creates creature with randomUUID(), adds to creatures array
       - Implement modifyHP: finds creature by id, updates currentHP with Math.max(0, currentHP + delta)
       - Implement toggleCondition: finds creature, adds/removes condition from array
       - Implement setCurrentTurn: loops through creatures, sets isCurrentTurn based on index

    3. Register store in main.ts:
       - Import createPinia from pinia
       - Add app.use(createPinia()) before mounting
  </action>
  <verify>
    <automated>npx tsc --noEmit src/types/combat.ts src/stores/combat.ts 2>&1 | grep -i error || echo "No type errors"</automated>
  </verify>
  <done>
    - src/types/combat.ts with all type definitions exported
    - src/stores/combat.ts with Pinia store and all actions
    - TypeScript compiles without errors
    - Store actions follow P2e rules (HP clamping, condition toggling)
  </done>
</task>

<task type="auto">
  <name>Task 3: Create composables for initiative and condition helpers</name>
  <files>src/composables/useInitiative.ts, src/composables/useConditions.ts</files>
  <read_first>
    - src/composables/useInitiative.ts (if exists)
    - src/composables/useConditions.ts (if exists)
    - .planning/phases/01-core-combat-tracker/01-RESEARCH.md (Section: Pattern 2: Initiative Sorting, Pattern 3: Condition Toggle UI)
  </read_first>
  <acceptance_criteria>
    - src/composables/useInitiative.ts exports: sortByInitiative, getNextCreatureIndex
    - sortByInitiative takes Creature[], returns sorted copy by initiative descending, secondary sort by dexMod
    - getNextCreatureIndex takes currentTurnIndex, totalCreatures, returns (index + 1) % total
    - src/composables/useConditions.ts exports: CONDITION_DEFS array
    - CONDITION_DEFS contains all P2e conditions with name, color, duration properties
    - formatCondition helper function exists and formats kebab-case/snake_case to title case
  </acceptance_criteria>
  <action>
    1. Create src/composables/useInitiative.ts:
       - Export sortByInitiative function: takes Creature[], returns sorted copy
       - Sort primary: initiative descending (b.initiative - a.initiative)
       - Sort secondary: dexMod descending (b.dexMod || 0) - (a.dexMod || 0)
       - Export getNextCreatureIndex function: returns (currentTurnIndex + 1) % totalCreatures

    2. Create src/composables/useConditions.ts:
       - Define CONDITION_DEFS constant array with all P2e conditions
       - Each entry has: name (Condition), color (string), duration (number | null)
       - Colors: stunned=purple, paralyzed=indigo, grappled=orange, restrained=red, prone=yellow, flat-footed=gray, invisible=pink, unconscious=black, grabbed=brown, slowed=blue, incapacitated=red
       - Export formatCondition function: converts 'flat-footed' to 'Flat Footed'
  </action>
  <verify>
    <automated>npx tsc --noEmit src/composables/useInitiative.ts src/composables/useConditions.ts 2>&1 | grep -i error || echo "No type errors"</automated>
  </verify>
  <done>
    - src/composables/useInitiative.ts with sortByInitiative and getNextCreatureIndex
    - src/composables/useConditions.ts with CONDITION_DEFS and formatCondition
    - All P2e conditions defined with colors
  </done>
</task>

<task type="auto">
  <name>Task 4: Create HPController component for damage/healing controls</name>
  <files>src/components/HPController.vue</files>
  <read_first>
    - src/components/HPController.vue (if exists)
    - .planning/phases/01-core-combat-tracker/01-RESEARCH.md (Section: Creature Card Component)
  </read_first>
  <acceptance_criteria>
    - src/components/HPController.vue exists as Vue SFC with <script setup lang="ts">
    - Component accepts props: currentHP (number), maxHP (number), creatureId (string)
    - Component emits: modify-hp (id: string, delta: number)
    - UI shows: - button, HP display (current/max), + button
    - - button emits modify-hp with delta: -1
    - + button emits modify-hp with delta: +1
    - HP display uses monospace font for alignment
    - Buttons have title attributes for accessibility
    - Styling: buttons are small (w-6 h-6), colored (red for damage, green for heal)
  </acceptance_criteria>
  <action>
    1. Create src/components/HPController.vue:
       - Template: flex container with - button, HP text span, + button
       - - button: class "w-6 h-6 rounded bg-red-100 hover:bg-red-200 text-red-600", @click emits modify-hp(-1)
       - HP text: class "w-12 text-center font-mono", displays `${currentHP} / ${maxHP}`
       - + button: class "w-6 h-6 rounded bg-green-100 hover:bg-green-200 text-green-600", @click emits modify-hp(1)
       - Script: defineProps with currentHP, maxHP, creatureId; defineEmits with modify-hp
       - Use inline styles or Tailwind classes for button colors
  </action>
  <verify>
    <automated>npx tsc --noEmit src/components/HPController.vue 2>&1 | grep -i error || echo "No type errors"</automated>
  </verify>
  <done>
    - src/components/HPController.vue component created
    - Props and emits properly typed
    - UI shows HP with +/- buttons
    - Components emit modify-hp events with correct deltas
  </done>
</task>

<task type="auto">
  <name>Task 5: Create ConditionToggle reusable component</name>
  <files>src/components/ConditionToggle.vue</files>
  <read_first>
    - src/components/ConditionToggle.vue (if exists)
    - .planning/phases/01-core-combat-tracker/01-RESEARCH.md (Section: Pattern 3: Condition Toggle UI)
  </read_first>
  <acceptance_criteria>
    - src/components/ConditionToggle.vue exists as Vue SFC with <script setup lang="ts">
    - Component accepts props: condition (ConditionDef), active (boolean)
    - Component emits: toggle (name: string)
    - UI shows button with condition name formatted
    - Button class includes bg-{color}-600 when active, bg-gray-200 when inactive
    - @click emits toggle with condition.name
    - Uses formatCondition from useConditions composable
  </acceptance_criteria>
  <action>
    1. Create src/components/ConditionToggle.vue:
       - Template: button element with dynamic class binding
       - Dynamic classes: 'condition-toggle px-2 py-1 rounded text-xs font-semibold', conditional bg class based on active prop
       - Active state: bg-${condition.color}-600 text-white
       - Inactive state: bg-gray-200 text-gray-600
       - Button text: {{ formatCondition(condition.name) }}
       - @click="$emit('toggle', condition.name)"
       - Script: defineProps<{ condition: ConditionDef; active: boolean }>()
       - defineEmits<{ toggle: [name: string] }>()
       - Import formatCondition from '@/composables/useConditions'
       - Implement formatCondition locally or import
  </action>
  <verify>
    <automated>npx tsc --noEmit src/components/ConditionToggle.vue 2>&1 | grep -i error || echo "No type errors"</automated>
  </verify>
  <done>
    - src/components/ConditionToggle.vue component created
    - Props: condition (ConditionDef), active (boolean)
    - Emits: toggle with condition name
    - Visual feedback based on active state
  </done>
</task>

<task type="auto">
  <name>Task 6: Create CreatureCard component with HP and condition display</name>
  <files>src/components/CreatureCard.vue</files>
  <read_first>
    - src/components/CreatureCard.vue (if exists)
    - src/components/HPController.vue (created in Task 4)
    - src/components/ConditionToggle.vue (created in Task 5)
    - .planning/phases/01-core-combat-tracker/01-RESEARCH.md (Section: Creature Card Component)
  </read_first>
  <acceptance_criteria>
    - src/components/CreatureCard.vue exists as Vue SFC with <script setup lang="ts">
    - Component accepts props: creature (Creature), isCurrentTurn (boolean), turnIndex (number)
    - Component emits: modify-hp (id: string, delta: number), toggle-condition (id: string, condition: string)
    - Card has visual distinction for current turn (border-blue-500, bg-blue-50)
    - Card shows creature name (h3), initiative, and AC (if available)
    - Card includes HPController component
    - Card shows condition toggles for all CONDITION_DEFS
    - Each ConditionToggle binds :active to creature.conditions.includes(condition.name)
    - @modify-hp emits modify-hp event
    - @toggle emits toggle-condition event for each condition
    - Downed creatures (isDowned && !isCurrentTurn) have reduced opacity
  </acceptance_criteria>
  <action>
    1. Create src/components/CreatureCard.vue:
       - Template: div with creature-card class, dynamic classes for turn state and downed state
       - Main container: flex justify-between items-start
       - Left section (flex-1): creature name (h3), initiative and AC info
       - Right section: HPController + Condition toggles
       - HPController: :currentHP="creature.currentHP", :maxHP="creature.maxHP", :creatureId="creature.id", @modify-hp="$emit('modify-hp', creature.id, $event)"
       - Condition toggles: v-for over CONDITION_DEFS, :condition="def", :active="creature.conditions.includes(def.name)", @toggle="$emit('toggle-condition', creature.id, $event)"
       - Dynamic classes: border-l-4, border-{blue-500|gray-300}, bg-{blue-50|white}, opacity-50 for downed
       - Script: defineProps<{ creature: Creature; isCurrentTurn: boolean; turnIndex: number }>()
       - defineEmits<{ 'modify-hp': [id: string, delta: number]; 'toggle-condition': [id: string, condition: string] }>()
       - Import CONDITION_DEFS from '@/composables/useConditions'
  </action>
  <verify>
    <automated>npx tsc --noEmit src/components/CreatureCard.vue 2>&1 | grep -i error || echo "No type errors"</automated>
  </verify>
  <done>
    - src/components/CreatureCard.vue component created
    - Displays creature name, initiative, AC
    - Embeds HPController and ConditionToggle components
    - Visual distinction for current turn and downed state
  </done>
</task>

<task type="auto">
  <name>Task 7: Create AddCreatureForm component</name>
  <files>src/components/AddCreatureForm.vue</files>
  <read_first>
    - src/components/AddCreatureForm.vue (if exists)
    - .planning/phases/01-core-combat-tracker/01-RESEARCH.md (Section: Combat Tracker Component)
  </read_first>
  <acceptance_criteria>
    - src/components/AddCreatureForm.vue exists as Vue SFC with <script setup lang="ts">
    - Component has v-model binding for open (boolean)
    - Form fields: name (text input), maxHP (number input), ac (number input), initiative (number input)
    - Condition checkboxes for all CONDITION_DEFS (multi-select)
    - Submit button calls emit('add', creatureData)
    - Cancel button closes form (emits 'update:modelValue', false)
    - Creature data includes: name, maxHP, currentHP (same as maxHP initially), ac, initiative, conditions (array of selected)
    - Form is modal-like with overlay when open
    - Creature ID is auto-generated by parent, not form
  </acceptance_criteria>
  <action>
    1. Create src/components/AddCreatureForm.vue:
       - Template: conditional render based on v-model open
       - Overlay div with @click="emit('update:modelValue', false)" for backdrop
       - Form container: centered modal with header, form fields, actions
       - Header: "Add Creature to Combat"
       - Name input: v-model="form.name", placeholder "Creature name"
       - Max HP input: v-model.number="form.maxHP", type="number", min="1"
       - AC input: v-model.number="form.ac", type="number", min="1"
       - Initiative input: v-model.number="form.initiative", type="number", min="1"
       - Conditions section: checkboxes with v-model="form.conditions" array
       - Submit button: @click="handleSubmit", validates form, emits 'add' with creature object
       - Cancel button: @click="cancel", sets v-model to false
       - Script: reactive form object with default values
       - handleSubmit: emit 'add' with { name, maxHP, currentHP: maxHP, ac, initiative, conditions: [...form.conditions] }
       - Import CONDITION_DEFS for checkboxes
  </action>
  <verify>
    <automated>npx tsc --noEmit src/components/AddCreatureForm.vue 2>&1 | grep -i error || echo "No type errors"</automated>
  </verify>
  <done>
    - src/components/AddCreatureForm.vue component created
    - v-model binding for open/close state
    - Form collects name, HP, AC, initiative, conditions
    - Emits 'add' event with creature data (without id)
  </done>
</task>

<task type="auto">
  <name>Task 8: Create CombatTracker main component and wire everything together</name>
  <files>src/components/CombatTracker.vue, src/App.vue</files>
  <read_first>
    - src/components/CombatTracker.vue (if exists)
    - src/App.vue (created in Task 1)
    - src/components/CreatureCard.vue (created in Task 6)
    - src/components/AddCreatureForm.vue (created in Task 7)
    - .planning/phases/01-core-combat-tracker/01-RESEARCH.md (Section: Combat Tracker Component)
  </read_first>
  <acceptance_criteria>
    - src/components/CombatTracker.vue exists as Vue SFC with <script setup lang="ts">
    - Component imports useCombatStore from '@/stores/combat'
    - Component accesses combatStore.creatures and combatStore.sortedCreatures
    - Header shows "Combat Tracker" title
    - Header has "+ Add Creature" button that toggles AddCreatureForm open
    - Header has "Advance Turn" button that calls setCurrentTurn
    - Main section v-for over sortedCreatures with index
    - Each iteration renders CreatureCard with creature, is-current-turn, turn-index props
    - CreatureCard @modify-hp calls combatStore.modifyHP
    - CreatureCard @toggle-condition calls combatStore.toggleCondition
    - Empty state message when no creatures
    - AddCreatureForm v-model bound to form open state
    - advanceTurn function calculates next index and calls setCurrentTurn
    - src/App.vue imports and renders CombatTracker component
  </acceptance_criteria>
  <action>
    1. Create src/components/CombatTracker.vue:
       - Template: main combat tracker container with header, main, modal
       - Header: h1 "Combat Tracker", Add Creature button, Advance Turn button
       - Main: v-for over combatStore.sortedCreatures with :key="creature.id"
       - CreatureCard: :creature="creature", :is-current-turn="creature.isCurrentTurn", :turn-index="index"
       - @modify-hp="combatStore.modifyHP"
       - @toggle-condition="combatStore.toggleCondition"
       - Empty state: v-if="combatStore.creatures.length === 0"
       - AddCreatureForm: v-model="formOpen", @add="combatStore.addCreature"
       - Script: import useCombatStore, reactive formOpen = ref(false)
       - advanceTurn: calculates next index, calls combatStore.setCurrentTurn(nextIndex)

    2. Update src/App.vue:
       - Import CombatTracker from '@/components/CombatTracker.vue'
       - Template: <CombatTracker />
       - Add Tailwind classes for full-height layout
  </action>
  <verify>
    <automated>npx tsc --noEmit src/components/CombatTracker.vue src/App.vue 2>&1 | grep -i error || echo "No type errors"</automated>
  </verify>
  <done>
    - src/components/CombatTracker.vue created and wired to Pinia store
    - Creature list displays sorted by initiative
    - Add Creature form works and adds creatures to store
    - HP modification calls store action
    - Condition toggle calls store action
    - Advance turn button moves current turn to next creature
    - src/App.vue renders CombatTracker
  </done>
</task>

</tasks>

<verification>
Overall Phase 1 Verification:

1. Combat tracker displays creatures by initiative:
   - Visit app in dev server
   - Click "+ Add Creature" multiple times
   - Verify list is sorted highest initiative first

2. Add creature with HP and conditions:
   - Add creature with name "Goblin", HP 7, AC 13
   - Check conditions checkboxes (stunned, prone)
   - Submit form
   - Verify creature appears in list with correct stats

3. Track HP changes:
   - Click - button on creature HP
   - Verify currentHP decreases
   - Click + button multiple times
   - Verify HP clamps at 0 (cannot go negative)

4. Toggle conditions:
   - Click condition buttons on creature card
   - Verify visual state changes (color)
   - Click again to remove
   - Verify state reverts

Automated verification command:
npm run build -- --run 2>&1 | grep -E "(error|Error)" || echo "Build successful"
</verification>

<success_criteria>
Phase 1 Complete when:
- [ ] Project builds without errors: npm run build succeeds
- [ ] Combat tracker displays list of creatures sorted by initiative (highest first)
- [ ] User can add a creature with name, maxHP, currentHP, AC, and conditions
- [ ] User can modify HP up/down for each creature with clamping at 0
- [ ] User can toggle conditions on/off for each creature and see visual feedback
- [ ] Current turn creature is visually highlighted (blue border and background)
- [ ] TypeScript compiles without errors
- [ ] All component props and emits are properly typed
</success_criteria>

<output>
After completion, create `.planning/phases/01-core-combat-tracker/01-01-SUMMARY.md`
</output>
