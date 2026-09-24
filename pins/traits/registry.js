/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * TraitRegistry: definition-based factory for composable Pin Traits.
 *
 * The registry stores *definitions* (constructor + default options), never trait
 * instances: every `create()` yields a fresh trait, so two Pins declaring the same
 * trait name never share mutable state (connections, selection, drag flags).
 *
 * The instance index lives on PinManager (`traitIndex` / `capabilityIndex`), which
 * is the only component that knows which Pins actually exist.
 */

import { DisplayTrait } from './display.js';
import { PRESERVE_TYPE } from './display-templates.js';
import {
  DraggableTrait,
  SelectableTrait,
  FocussableTrait,
  PhysicsTrait
} from './interaction.js';
import {
  ConnectableTrait,
  TransmitterTrait,
  ScopeTrait
} from './graph.js';
import { ResizableTrait } from './resizable.js';
import { SvgStateTrait } from './svg-state.js';

/**
 * Shallow-merge caller options over registered defaults.
 * `capabilities` is the one additive key: defaults and caller values concatenate
 * so a caller can extend the capability set without erasing it.
 */
export function mergeOptions(defaults = {}, options = {}) {
  const merged = { ...defaults, ...options };

  if (Array.isArray(defaults.capabilities) || Array.isArray(options.capabilities)) {
    merged.capabilities = [
      ...(defaults.capabilities || []),
      ...(options.capabilities || [])
    ];
  }

  return merged;
}

/**
 * @typedef {{ name: string, ctor: Function, defaults: Object }} TraitDefinition
 */
export class TraitRegistry {
  constructor() {
    /** @type {Map<string, TraitDefinition>} */
    this._definitions = new Map();

    /**
     * Registrars of built-in definitions that live outside this module, replayed
     * by `clear()`. Cursors register through here: they are built-ins, but
     * `src/pins/cursor.js` reaches back into this registry to build a cursor Pin,
     * so it cannot be imported from here without a cycle.
     * @type {Set<(registry: TraitRegistry) => void>}
     */
    this._defaultProviders = new Set();

    this._initDefaults();
  }

  _initDefaults() {
    this.register('card', DisplayTrait, { name: 'card', displayType: 'card' });
    this.register('vector-pointer', DisplayTrait, { name: 'vector-pointer', displayType: 'vector-pointer' });
    this.register('media', DisplayTrait, { name: 'media', displayType: 'media' });
    this.register('raw', DisplayTrait, { name: 'raw', displayType: 'raw' });
    // Adopted DOM: a display type that renders nothing, so the markup the caller
    // already wrote survives every frame (see `./display-templates.js`).
    this.register(PRESERVE_TYPE, DisplayTrait, { name: PRESERVE_TYPE, displayType: PRESERVE_TYPE });
    this.register('draggable', DraggableTrait);
    this.register('selectable', SelectableTrait);
    // Opt-in, unlike the two above: holding the trait *is* the resize toggle.
    this.register('resizable', ResizableTrait);
    this.register('physics', PhysicsTrait);
    this.register('connectable', ConnectableTrait);
    this.register('focussable', FocussableTrait);
    this.register('scope', ScopeTrait);
    this.register('transmitter', TransmitterTrait);
    this.register('svg-state', SvgStateTrait);
  }

  /**
   * Register a trait definition. Names are unique: re-registering an existing
   * name throws rather than silently replacing a definition other code depends on.
   *
   * @returns {TraitDefinition}
   */
  register(name, ctor, defaults = {}) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('TraitRegistry.register: name must be a non-empty string');
    }
    if (typeof ctor !== 'function') {
      throw new Error(`TraitRegistry.register: "${name}" requires a trait constructor`);
    }
    if (this._definitions.has(name)) {
      throw new Error(`TraitRegistry.register: "${name}" is already registered`);
    }

    const definition = { name, ctor, defaults };
    this._definitions.set(name, definition);
    return definition;
  }

  /**
   * Instantiate a registered trait. Each call returns a distinct instance.
   */
  create(name, options = {}) {
    const definition = this._definitions.get(name);
    if (!definition) {
      throw new Error(`Unknown trait: ${name}`);
    }
    return new definition.ctor(mergeOptions(definition.defaults, options));
  }

  /** The definition registered under `name`, or undefined. */
  get(name) {
    return this._definitions.get(name);
  }

  has(name) {
    return this._definitions.has(name);
  }

  unregister(name) {
    return this._definitions.delete(name);
  }

  /** @returns {TraitDefinition[]} */
  list() {
    return Array.from(this._definitions.values());
  }

  /**
   * Adopt an external provider of built-in definitions and run it now.
   * Providers are replayed by `clear()`, so what they register is a built-in in
   * every sense that matters.
   */
  registerDefaults(provider) {
    if (typeof provider !== 'function') {
      throw new Error('TraitRegistry.registerDefaults: provider must be a function');
    }
    this._defaultProviders.add(provider);
    provider(this);
    return this;
  }

  /** Drop every custom definition and restore the built-in set. */
  clear() {
    this._definitions.clear();
    this._initDefaults();
    for (const provider of this._defaultProviders) {
      provider(this);
    }
  }
}

// Singleton registry shared by Pin.addTrait
export const traitRegistry = new TraitRegistry();
