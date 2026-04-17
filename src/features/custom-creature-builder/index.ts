// Full public surface — BuilderPage is added in Task 2 of plan 59-04.
export { DirtyGuardDialog } from './ui/DirtyGuardDialog'
export type { BuilderState, BuilderAction } from './model/builderReducer'
export { builderReducer, makeInitialState } from './model/builderReducer'
export { isDirty } from './model/isDirty'
