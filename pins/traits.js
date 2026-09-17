/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Generic Trait System for Pins.
 * Abstracting all core functions, behaviors, scoping, focus, event transmission, and capabilities
 * of a Pin into modular, composable Traits.
 *
 * Barrel module: re-exports the trait implementations from ./traits/.
 */

export {
  PinEvent,
  PinTrait,
  DEFAULT_EVENT_TYPE,
  PIN_SIGNAL_TYPES,
  emitPinSignal
} from './traits/base.js';
export { DisplayTrait } from './traits/display.js';
export {
  DraggableTrait,
  SelectableTrait,
  FocussableTrait,
  PhysicsTrait,
  GRAB_HANDLE_CLASS,
  rotatePin
} from './traits/interaction.js';
export {
  ResizableTrait,
  MIN_RESIZE,
  RESIZE_DIRECTIONS,
  RESIZE_HANDLE_ATTR,
  RESIZE_HANDLE_CLASS,
  resizePin
} from './traits/resizable.js';
export {
  ConnectableTrait,
  TransmitterTrait,
  ScopeTrait
} from './traits/graph.js';
export { TraitRegistry, traitRegistry, mergeOptions } from './traits/registry.js';
export { definePrototype, createReactiveState } from './traits/prototype.js';
export { compileBlueprint } from './traits/blueprint-compiler.js';
