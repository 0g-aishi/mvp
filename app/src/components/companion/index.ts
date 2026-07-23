// Main exports for Companion components
export { CompanionControlPanel } from './CompanionControlPanel';
export { ParameterSlider } from './ParameterSlider';
export { PhysicsPresetsLibrary } from './PhysicsPresetsLibrary';
export { StateManager } from './StateManager';
export {
  PARAMETER_DEFINITIONS,
  getAllCategories,
  getParametersByCategory,
  getTotalParameterCount,
  getParameterCountByCategory,
  isParameterAtDefault,
  getModifiedParameterCount
} from './ParameterDefinitions';

export type {
  ParameterCategory,
  ParameterDefinition
} from './ParameterDefinitions';

export type {
  PhysicsPreset
} from './PhysicsPresetsLibrary';

export type {
  CompanionState
} from './StateManager';
