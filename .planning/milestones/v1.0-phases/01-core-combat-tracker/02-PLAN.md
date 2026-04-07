---
phase: 01-core-combat-tracker
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - vitest.config.ts
  - package.json
  - src/stores/__tests__/combat.test.ts
  - src/components/__tests__/CreatureCard.test.ts
  - src/components/__tests__/HPController.test.ts
  - src/components/__tests__/ConditionToggle.test.ts
  - src/components/__tests__/AddCreatureForm.test.ts
  - src/components/__tests__/CombatTracker.test.ts
autonomous: true
requirements:
  - COMBAT-01
  - COMBAT-02
  - COMBAT-03
  - COMBAT-04
user_setup: []

must_haves:
  truths:
    - All unit tests for Pinia store actions pass
    - All component unit tests render correctly and emit events
    - Test infrastructure runs without configuration errors
  artifacts:
    - path: "vitest.config.ts"
      provides: "Vitest test configuration"
      exports: []
    - path: "src/stores/__tests__/combat.test.ts"
      provides: "Tests for combat store actions"
      exports: []
    - path: "src/components/__tests__/CreatureCard.test.ts"
      provides: "Tests for CreatureCard component"
      exports: []
    - path: "src/components/__tests__/HPController.test.ts"
      provides: "Tests for HPController component"
      exports: []
    - path: "src/components/__tests__/ConditionToggle.test.ts"
      provides: "Tests for ConditionToggle component"
      exports: []
    - path: "src/components/__tests__/AddCreatureForm.test.ts"
      provides: "Tests for AddCreatureForm component"
      exports: []
    - path: "src/components/__tests__/CombatTracker.test.ts"
      provides: "Tests for CombatTracker component"
      exports: []
  key_links:
    - from: "src/stores/__tests__/combat.test.ts"
      to: "src/stores/combat.ts"
      via: "import useCombatStore"
      pattern: "import.*useCombatStore.*from.*stores/combat"
    - from: "src/components/__tests__/*.test.ts"
      to: "src/components/*.vue"
      via: "import component"
      pattern: "import.*from.*components"
---

<objective>
Set up Vitest test infrastructure and create unit tests for all combat tracker components

Purpose: Establish automated testing to verify combat tracker functionality and prevent regressions. Each requirement has corresponding tests.

Output: Working test infrastructure with unit tests covering all Phase 1 requirements.
</objective>

<execution_context>
@C:/Users/kiryl/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/kiryl/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-core-combat-tracker/01-RESEARCH.md
@.planning/phases/01-core-combat-tracker/01-PLAN.md

<interfaces>
<!-- Key types and contracts the executor needs. -->

From src/stores/combat.ts:
```typescript
export const useCombatStore = defineStore('combat', {
  state: () => ({ creatures: [] as Creature[], isActive: false }),
  getters: {
    sortedCreatures: (state) => [...state.creatures].sort((a, b) => b.initiative - a.initiative),
    currentTurnCreature: (state) => state.sortedCreatures.find(c => c.isCurrentTurn) || null
  },
  actions: {
    addCreature(creature: Omit<Creature, 'id'>): void,
    modifyHP(id: string, delta: number): void,
    toggleCondition(id: string, condition: Condition): void,
    setCurrentTurn(index: number): void
  }
})
```

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
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install and configure Vitest test framework</name>
  <files>vitest.config.ts, package.json</files>
  <read_first>
    - .planning/phases/01-core-combat-tracker/01-RESEARCH.md (Section: Validation Architecture)
    - https://vitest.dev/guide/ (Vitest documentation)
    - https://testing-library.com/docs/vue-testing-library/intro/ (Vue Test Utils)
  </read_first>
  <acceptance_criteria>
    - vitest.config.ts exists with Vite integration
    - package.json has devDependencies: vitest, @vue/test-utils, jsdom
    - package.json has test script: "test": "vitest run"
    - vitest.config.ts imports defineConfig from vite, vue from @vitejs/plugin-vue
    - vitest config includes test: { environment: 'jsdom', globals: true }
    - vitest can run: npm test discovers test files
  </acceptance_criteria>
  <action>
    1. Add devDependencies to package.json:
       - vitest@2.x
       - @vue/test-utils@2.x
       - jsdom@25.x
       - @types/node@22.x (if not present)

    2. Create vitest.config.ts:
       - import { defineConfig } from 'vite'
       - import vue from '@vitejs/plugin-vue'
       - export default defineConfig({ plugins: [vue()], test: { environment: 'jsdom', globals: true, include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'] } })

    3. Add test script to package.json:
       - "scripts": { "test": "vitest run" }

    4. Verify installation:
       - Run npm test to ensure no errors
  </action>
  <verify>
    <automated>npm test -- --run 2>&1 | grep -E "(Test Files|FAIL|PASS)" || echo "No tests yet (expected)"</automated>
  </verify>
  <done>
    - vitest.config.ts configured with jsdom environment
    - package.json has test script
    - npm test runs without configuration errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Create combat store unit tests</name>
  <files>src/stores/__tests__/combat.test.ts</files>
  <read_first>
    - src/stores/combat.ts
    - src/types/combat.ts
    - .planning/phases/01-core-combat-tracker/01-RESEARCH.md (Section: Pattern 1: Reactive Combat State)
  </read_first>
  <acceptance_criteria>
    - src/stores/__tests__/combat.test.ts exists
    - Tests import useCombatStore from '@/stores/combat'
    - Test: addCreature creates creature with randomUUID for id
    - Test: addCreature adds creature to creatures array
    - Test: modifyHP decreases HP correctly
    - Test: modifyHP increases HP correctly
    - Test: modifyHP clamps at 0 (cannot go negative)
    - Test: toggleCondition adds condition to creature
    - Test: toggleCondition removes condition from creature
    - Test: sortedCreatures getter returns creatures sorted by initiative descending
    - Test: currentTurnCreature returns creature with isCurrentTurn=true
    - Test: setCurrentTurn updates isCurrentTurn on all creatures
    - All tests use beforeEach to create fresh store instance
  </acceptance_criteria>
  <action>
    1. Create src/stores/__tests__/combat.test.ts:
       - Import { describe, it, expect, beforeEach } from 'vitest'
       - Import { createPinia, setActivePinia } from 'pinia'
       - Import useCombatStore from '@/stores/combat'
       - Import type { Creature } from '@/types/combat'

    2. beforeEach setup:
       - setActivePinia()
       - createPinia()

    3. Test addCreature:
       - const store = useCombatStore()
       - const newCreature = { name: 'Goblin', maxHP: 7, currentHP: 7, ac: 13, initiative: 15, dexMod: 2, conditions: [] }
       - store.addCreature(newCreature)
       - expect(store.creatures).toHaveLength(1)
       - expect(store.creatures[0].id).toBeDefined()
       - expect(store.creatures[0].name).toBe('Goblin')

    4. Test modifyHP:
       - Add creature first
       - store.modifyHP(creature.id, -3)
       - expect(creature.currentHP).toBe(4)
       - store.modifyHP(creature.id, 2)
       - expect(creature.currentHP).toBe(6)
       - store.modifyHP(creature.id, -100)
       - expect(creature.currentHP).toBe(0)

    5. Test toggleCondition:
       - Add creature
       - store.toggleCondition(creature.id, 'stunned')
       - expect(creature.conditions).toContain('stunned')
       - store.toggleCondition(creature.id, 'stunned')
       - expect(creature.conditions).not.toContain('stunned')

    6. Test sortedCreatures:
       - Add multiple creatures with different initiative values
       - const sorted = store.sortedCreatures
       - expect(sorted[0].initiative).toBeGreaterThan(sorted[1].initiative)

    7. Test currentTurnCreature:
       - Add creature, set isCurrentTurn
       - expect(store.currentTurnCreature?.id).toBe(creature.id)

    8. Test setCurrentTurn:
       - Add multiple creatures
       - store.setCurrentTurn(1)
       - Check only creature at index 1 has isCurrentTurn=true
  </action>
  <verify>
    <automated>npm test -- src/stores/__tests__/combat.test.ts 2>&1 | grep -E "(PASS|FAIL|Tests:)"</automated>
  </verify>
  <done>
    - src/stores/__tests__/combat.test.ts with comprehensive store tests
    - All store actions tested
    - HP clamping at 0 verified
    - Condition toggling verified
    - Initiative sorting verified
  </done>
</task>

<task type="auto">
  <name>Task 3: Create HPController component tests</name>
  <files>src/components/__tests__/HPController.test.ts</files>
  <read_first>
    - src/components/HPController.vue
    - https://vue-test-utils.vuejs.org/ (Vue Test Utils docs)
  </read_first>
  <acceptance_criteria>
    - src/components/__tests__/HPController.test.ts exists
    - Test: component renders - button, HP text, + button
    - Test: - button click emits modify-hp with delta -1
    - Test: + button click emits modify-hp with delta +1
    - Test: HP text shows currentHP / maxHP format
    - Test: Uses monospace font for alignment
  </acceptance_criteria>
  <action>
    1. Create src/components/__tests__/HPController.test.ts:
       - Import { describe, it, expect } from 'vitest'
       - Import { mount } from '@vue/test-utils'
       - Import HPController from '@/components/HPController.vue'

    2. Test rendering:
       - const props = { currentHP: 7, maxHP: 10, creatureId: 'test-id' }
       - const wrapper = mount(HPController, { props })
       - expect(wrapper.find('button').exists()).toBe(true)
       - expect(wrapper.find('.font-mono').text()).toBe('7 / 10')

    3. Test - button:
       - await wrapper.find('button').trigger('click')
       - expect(wrapper.emitted('modify-hp')).toHaveLength(1)
       - expect(wrapper.emitted('modify-hp')?.[0]).toEqual([-1])

    4. Test + button:
       - await wrapper.findAll('button').at(1).trigger('click')
       - expect(wrapper.emitted('modify-hp')?.[1]).toEqual([1])
  </action>
  <verify>
    <automated>npm test -- src/components/__tests__/HPController.test.ts 2>&1 | grep -E "(PASS|FAIL|Tests:)"</automated>
  </verify>
  <done>
    - src/components/__tests__/HPController.test.ts created
    - Component renders correctly
    - Emits modify-hp with correct deltas
  </done>
</task>

<task type="auto">
  <name>Task 4: Create ConditionToggle component tests</name>
  <files>src/components/__tests__/ConditionToggle.test.ts</files>
  <read_first>
    - src/components/ConditionToggle.vue
    - src/composables/useConditions.ts
  </read_first>
  <acceptance_criteria>
    - src/components/__tests__/ConditionToggle.test.ts exists
    - Test: component shows condition name formatted
    - Test: button has active class when active=true
    - Test: button has inactive class when active=false
    - Test: click emits toggle with condition name
  </acceptance_criteria>
  <action>
    1. Create src/components/__tests__/ConditionToggle.test.ts:
       - Import { describe, it, expect } from 'vitest'
       - Import { mount } from '@vue/test-utils'
       - Import ConditionToggle from '@/components/ConditionToggle.vue'
       - Import { CONDITION_DEFS } from '@/composables/useConditions'

    2. Test rendering:
       - const condition = CONDITION_DEFS[0]
       - const wrapper = mount(ConditionToggle, { props: { condition, active: false } })
       - expect(wrapper.text()).toContain(condition.name formatted)

    3. Test active state:
       - const activeWrapper = mount(ConditionToggle, { props: { condition, active: true } })
       - expect(activeWrapper.classes()).toContain('bg-purple-600')

    4. Test click:
       - await wrapper.find('button').trigger('click')
       - expect(wrapper.emitted('toggle')).toHaveLength(1)
       - expect(wrapper.emitted('toggle')?.[0]).toEqual([condition.name])
  </action>
  <verify>
    <automated>npm test -- src/components/__tests__/ConditionToggle.test.ts 2>&1 | grep -E "(PASS|FAIL|Tests:)"</automated>
  </verify>
  <done>
    - src/components/__tests__/ConditionToggle.test.ts created
    - Visual active/inactive states verified
    - Toggle event emitted correctly
  </done>
</task>

<task type="auto">
  <name>Task 5: Create AddCreatureForm component tests</name>
  <files>src/components/__tests__/AddCreatureForm.test.ts</files>
  <read_first>
    - src/components/AddCreatureForm.vue
  </read_first>
  <acceptance_criteria>
    - src/components/__tests__/AddCreatureForm.test.ts exists
    - Test: form is hidden when open=false
    - Test: form is shown when open=true
    - Test: form fields accept values
    - Test: submit emits 'add' with creature data
    - Test: cancel sets open=false
  </acceptance_criteria>
  <action>
    1. Create src/components/__tests__/AddCreatureForm.test.ts:
       - Import { describe, it, expect } from 'vitest'
       - Import { mount } from '@vue/test-utils'
       - Import AddCreatureForm from '@/components/AddCreatureForm.vue'

    2. Test visibility:
       - const wrapper = mount(AddCreatureForm, { props: { modelValue: false } })
       - expect(wrapper.find('form').exists()).toBe(false)
       - const openWrapper = mount(AddCreatureForm, { props: { modelValue: true } })
       - expect(openWrapper.find('form').exists()).toBe(true)

    3. Test form fields:
       - await openWrapper.find('input[name="name"]').setValue('Goblin')
       - await openWrapper.find('input[name="maxHP"]').setValue('7')
       - await openWrapper.find('input[name="ac"]').setValue('13')
       - await openWrapper.find('input[name="initiative"]').setValue('15')

    4. Test submit:
       - await openWrapper.find('button[type="submit"]').trigger('click')
       - expect(openWrapper.emitted('add')).toHaveLength(1)
       - const added = openWrapper.emitted('add')?.[0]?.[0]
       - expect(added.name).toBe('Goblin')
       - expect(added.maxHP).toBe(7)

    5. Test cancel:
       - await openWrapper.find('button[data-test="cancel"]').trigger('click')
       - expect(openWrapper.emitted('update:modelValue')).toBeDefined()
  </action>
  <verify>
    <automated>npm test -- src/components/__tests__/AddCreatureForm.test.ts 2>&1 | grep -E "(PASS|FAIL|Tests:)"</automated>
  </verify>
  <done>
    - src/components/__tests__/AddCreatureForm.test.ts created
    - Form visibility toggles correctly
    - Submit emits creature data
    - Cancel closes form
  </done>
</task>

<task type="auto">
  <name>Task 6: Create CreatureCard component tests</name>
  <files>src/components/__tests__/CreatureCard.test.ts</files>
  <read_first>
    - src/components/CreatureCard.vue
    - src/stores/combat.ts
  </read_first>
  <acceptance_criteria>
    - src/components/__tests__/CreatureCard.test.ts exists
    - Test: component displays creature name
    - Test: component displays initiative
    - Test: component displays AC when available
    - Test: component has blue border when isCurrentTurn=true
    - Test: component has reduced opacity when isDowned
    - Test: emits modify-hp when HP buttons clicked
    - Test: emits toggle-condition when condition clicked
  </acceptance_criteria>
  <action>
    1. Create src/components/__tests__/CreatureCard.test.ts:
       - Import { describe, it, expect } from 'vitest'
       - Import { mount } from '@vue/test-utils'
       - Import CreatureCard from '@/components/CreatureCard.vue'

    2. Test rendering:
       - const creature = { id: '1', name: 'Goblin', maxHP: 7, currentHP: 7, ac: 13, initiative: 15, dexMod: 2, isCurrentTurn: true, isDowned: false, conditions: [] }
       - const wrapper = mount(CreatureCard, { props: { creature, isCurrentTurn: true, turnIndex: 0 } })
       - expect(wrapper.find('h3').text()).toBe('Goblin')
       - expect(wrapper.text()).toContain('15')

    3. Test current turn styling:
       - expect(wrapper.classes()).toContain('border-blue-500')

    4. Test downed styling:
       - const downedCreature = { ...creature, isDowned: true, isCurrentTurn: false }
       - const downedWrapper = mount(CreatureCard, { props: { creature: downedCreature, isCurrentTurn: false, turnIndex: 0 } })
       - expect(downedWrapper.classes()).toContain('opacity-50')

    5. Test HP modification:
       - const hpWrapper = mount(CreatureCard, { props: { creature, isCurrentTurn: false, turnIndex: 0 } })
       - await hpWrapper.find('button').trigger('click')
       - expect(hpWrapper.emitted('modify-hp')).toBeDefined()

    6. Test condition toggle:
       - await hpWrapper.find('.condition-toggle').trigger('click')
       - expect(hpWrapper.emitted('toggle-condition')).toBeDefined()
  </action>
  <verify>
    <automated>npm test -- src/components/__tests__/CreatureCard.test.ts 2>&1 | grep -E "(PASS|FAIL|Tests:)"</automated>
  </verify>
  <done>
    - src/components/__tests__/CreatureCard.test.ts created
    - Creature card renders correctly
    - Styling for turn state works
    - Events emitted correctly
  </done>
</task>

<task type="auto">
  <name>Task 7: Create CombatTracker component tests</name>
  <files>src/components/__tests__/CombatTracker.test.ts</files>
  <read_first>
    - src/components/CombatTracker.vue
    - src/stores/combat.ts
  </read_first>
  <acceptance_criteria>
    - src/components/__tests__/CombatTracker.test.ts exists
    - Test: component displays empty state when no creatures
    - Test: component displays creature list when creatures exist
    - Test: + Add Creature button opens form
    - Test: Advance Turn button calls setCurrentTurn
    - Test: creature list is sorted by initiative
  </acceptance_criteria>
  <action>
    1. Create src/components/__tests__/CombatTracker.test.ts:
       - Import { describe, it, expect, beforeEach } from 'vitest'
       - Import { createPinia, setActivePinia } from 'pinia'
       - Import { mount } from '@vue/test-utils'
       - Import CombatTracker from '@/components/CombatTracker.vue'
       - Import { useCombatStore } from '@/stores/combat'

    2. beforeEach setup:
       - setActivePinia()
       - createPinia()

    3. Test empty state:
       - const wrapper = mount(CombatTracker)
       - const store = useCombatStore()
       - store.creatures = []
       - expect(wrapper.text()).toContain('No creatures')

    4. Test creature list:
       - const store = useCombatStore()
       - store.addCreature({ name: 'Goblin', maxHP: 7, currentHP: 7, ac: 13, initiative: 10, dexMod: 2, conditions: [] })
       - expect(wrapper.text()).toContain('Goblin')

    5. Test add creature form:
       - await wrapper.find('button:contains("Add Creature")').trigger('click')
       - expect(wrapper.findComponent({ name: 'AddCreatureForm' })).toBeDefined()

    6. Test advance turn:
       - const store = useCombatStore()
       - store.addCreature({ name: 'Goblin', maxHP: 7, currentHP: 7, ac: 13, initiative: 10, dexMod: 2, conditions: [] })
       - store.addCreature({ name: 'Orc', maxHP: 15, currentHP: 15, ac: 14, initiative: 15, dexMod: 0, conditions: [] })
       - await wrapper.find('button:contains("Advance Turn")').trigger('click')
       - // Verify turn moved to next creature
  </action>
  <verify>
    <automated>npm test -- src/components/__tests__/CombatTracker.test.ts 2>&1 | grep -E "(PASS|FAIL|Tests:)"</automated>
  </verify>
  <done>
    - src/components/__tests__/CombatTracker.test.ts created
    - Empty state displays correctly
    - Creature list renders and sorts
    - Form opens on add button
    - Advance turn works
  </done>
</task>

</tasks>

<verification>
Overall Phase 1 Test Verification:

1. All tests pass:
   npm test -- --run 2>&1 | grep "Test Files"

2. Store tests pass:
   npm test -- src/stores/__tests__/combat.test.ts --run

3. Component tests pass:
   npm test -- src/components/__tests__ --run

Expected output: "Test Files  passed" with all tests green
</verification>

<success_criteria>
Phase 1 Testing Complete when:
- [ ] npm test runs without configuration errors
- [ ] All store tests pass (addCreature, modifyHP, toggleCondition, setCurrentTurn)
- [ ] All component tests pass (rendering, events, styling)
- [ ] HP clamping at 0 is verified by tests
- [ ] Initiative sorting is verified by tests
- [ ] Condition toggling is verified by tests
</success_criteria>

<output>
After completion, create `.planning/phases/01-core-combat-tracker/01-02-SUMMARY.md`
</output>
