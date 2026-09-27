/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * PinManager: the legacy registry, as a facade over the core root.
 *
 * Registration is the root's id index (`./manager-index.js`): `pins`, `getPin`
 * and every query read it, the DOM tree answers parentage, and the one index
 * kept here is the per-trait Set the global SVG pass reads each frame. What
 * stays is Pin-shaped: reload defaults, lazy provisioning, the signal bus, the
 * particle engine's spatial queries, and mounting root Pins into the plane.
 * The per-frame tick is a pass the session registers (`../engine/frame.js`).
 */
import { Pin } from './pin.js';
import { RELOAD_STRATEGIES, RELOAD_MODES, normalizeReloadStrategy, resolveReloadMode } from './reload.js';
import { LazyChildrenLoader } from './children-loader.js';
import {
  PinIndex, hasCapability, indexPin, indexTraits, registeredPin, unindexPin, unindexTraits
} from './manager-index.js';
import { announceProvision } from '../engine/announcer.js';
import { PinSignalBus } from './pin-signals.js';
import { ParticleEngine } from '../particles/engine.js';
import { createRoot } from '../core/frame.js';

/** A root Pin joins the container if its reload strategy mounts it, else settles into its own resting state. */
function settle(pin, container) {
  if (resolveReloadMode(pin) === RELOAD_MODES.MOUNTED) pin.mount(container);
  else pin._reconcile();
}

/** Drop utility Pins from a result set; see `Pin.utility`. */
function visible(pins) {
  return pins.filter((pin) => !pin.utility);
}

export class PinManager {
  /**
   * @param {object} [options] `root` (the core root whose index is the registry;
   *   a stopped one of its own without), `particleEngine`, `container`, `renderer`,
   *   `session`, `defaultReload`, `loadChildren`
   */
  constructor(options = {}) {
    this.options = options;
    // Validated up front so a typo fails at construction, not silently per-Pin.
    this.defaultReload = normalizeReloadStrategy(options.defaultReload);
    this.childrenLoader = new LazyChildrenLoader(this);

    this.root = options.root || createRoot({ running: false });
    /** Every registered Pin by id, read through the root index: Map reads, no writes (`PinIndex`). */
    this.pins = new PinIndex(this);
    this.particleEngine = options.particleEngine || new ParticleEngine();
    this.container = options.container || null;
    // Null in headless use: every call site is guarded.
    this.renderer = options.renderer || null;
    this._session = options.session || null;
    /** @type {Map<string, Set<Pin>>} trait name -> the Pins carrying it */
    this.traitIndex = new Map();
    this.signals = new PinSignalBus();
  }

  /**
   * Observe `activate` / `select` / `destroy` signals from every registered Pin.
   * @param {(event: PinEvent) => void} handler
   * @returns {() => boolean} unsubscribe
   */
  onSignal(handler) {
    return this.signals.subscribe(handler);
  }

  /** Set the parent DOM container for root Pins, mounting any registered before it existed. */
  setContainer(container) {
    this.container = container;
    if (container) this.mountAll(container);
  }

  /** The owning session - declared, else the renderer's - or null in headless use. */
  get session() {
    if (this._session) return this._session;
    return (this.renderer && this.renderer.session) || null;
  }

  /** Declare the owning session explicitly. @returns {CloudCanvasSession|null} */
  setSession(session) {
    this._session = session || null;
    return this._session;
  }

  /** Adopt a renderer; Pins registered before it are handed over now. */
  setRenderer(renderer) {
    this.renderer = renderer || null;
    if (!this.renderer) return null;
    for (const pin of this.allPins()) this.renderer.attach(pin);
    return this.renderer;
  }

  /** Create and register a Pin; one declaring neither `reload` nor `lazy` takes the default. */
  createPin(options = {}) {
    const declaresStrategy = options.reload !== undefined || options.lazy !== undefined;
    const pin = new Pin(declaresStrategy ? options : { ...options, reload: this.defaultReload });
    return this.registerPin(pin, options.parent);
  }

  /** Register an existing Pin instance. */
  registerPin(pin, parentPin = null) {
    if (!(pin instanceof Pin)) throw new TypeError('Expected an instance of Pin');

    pin._manager = this;
    indexPin(this, pin);
    this.particleEngine.addPin(pin.particle);
    this.signals.attach(pin);
    // A utility Pin owns its placement: neither the container nor the renderer adopts it.
    if (pin.utility) return pin;

    if (parentPin instanceof Pin) parentPin.addChild(pin);
    else if (this.container && !pin.parent) settle(pin, this.container);
    // Attached last: the renderer mounts against the final parent linkage.
    if (this.renderer) this.renderer.attach(pin);
    // A lazy Pin born active is already required: provision it now.
    if (pin.reload === RELOAD_STRATEGIES.LAZY && pin.active) this.loadChildrenFor(pin);
    return pin;
  }

  /**
   * Provision a lazy Pin's children exactly once (`LazyChildrenLoader`); the
   * first run, and only the first, is announced.
   * @returns {Promise<Pin[]>} the Pins created by the provider
   */
  loadChildrenFor(pin, context = {}) {
    const provisioning = Boolean(pin) && !pin._childrenLoaded && !pin._childrenLoading;
    const flight = this.childrenLoader.load(pin, context);
    if (!provisioning) return flight;

    return flight.then((created) => {
      announceProvision(this.session, pin, created);
      return created;
    });
  }

  /** Destroy every child subtree of a Pin - removed if registered, else destroyed; the Pin is untouched. */
  removeSubtreeChildren(pin) {
    if (!pin) return 0;
    const children = Array.from(pin.children);
    for (const child of children) {
      if (!this.removePin(child.id)) child.destroy();
    }
    return children.length;
  }

  /** Remove and destroy a Pin; `destroy` takes its subtree, and each Pin deregisters as it goes. */
  removePin(id) {
    const pin = this.getPin(id);
    if (!pin) return false;

    if (pin.parent) pin.parent.removeChild(pin);
    pin.destroy();
    return true;
  }

  /** Detach one Pin from the root index, the particle engine, the signals and the trait index; `destroy` ends here. */
  _deregister(pin) {
    this.signals.detach(pin);
    if (this.renderer) this.renderer.forget(pin);
    unindexPin(this, pin);
    this.particleEngine.removePin(pin.particle ? pin.particle.id : pin.id);
    if (pin._manager === this) pin._manager = null;
  }

  /** The registered Pin with this id, or undefined. */
  getPin(id) {
    return this.pins.get(id);
  }

  /** Every registered Pin, utility Pins included: the engine's full membership. */
  allPins() {
    return Array.from(this.pins.values());
  }

  /** Every registered Pin a caller built. */
  getAllPins() {
    return visible(this.allPins());
  }

  /** Root-level Pins (no parent). */
  getRootPins() {
    return visible(this.allPins().filter((pin) => !pin.parent));
  }

  /** Currently active Pins. */
  getActivePins() {
    return visible(this.allPins().filter((pin) => pin.active));
  }

  /** Recompute a Pin's trait entries (`addTrait`, `removeTrait`). @returns {boolean} the Pin is registered here */
  reindexPin(pin) {
    if (!pin || pin._manager !== this) return false;
    unindexTraits(this, pin);
    indexTraits(this, pin);
    return true;
  }

  /** Pins possessing a trait with this capability. */
  getPinsByCapability(capability) {
    return visible(this.indexedByCapability(capability));
  }

  /** Pins carrying a trait by name. */
  getPinsByTrait(traitName) {
    return visible(this.indexedByTrait(traitName));
  }

  /** Raw reads, utility Pins included. */
  indexedByTrait(traitName) {
    const bucket = this.traitIndex.get(traitName);
    return bucket ? Array.from(bucket) : [];
  }

  indexedByCapability(capability) {
    return this.allPins().filter((pin) => hasCapability(pin, capability));
  }

  /** Settle every root Pin into the container. */
  mountAll(container = this.container) {
    if (!container) return;
    this.container = container;
    for (const pin of this.allPins()) {
      if (!pin.parent) settle(pin, container);
    }
  }

  /** Spatial-query particles back to the registered, non-utility Pins that own them. */
  _pinsForParticles(particles) {
    const pins = [];
    for (const particle of particles) {
      const pin = registeredPin(this, particle.element);
      if (pin && !pin.utility) pins.push(pin);
    }
    return pins;
  }

  /** Pins within a circular radius of (x, y). */
  queryRadius(x, y, radius) {
    return this._pinsForParticles(this.particleEngine.queryRadius(x, y, radius));
  }

  /** Pins within a bounding box. */
  queryBox(minX, minY, maxX, maxY) {
    return this._pinsForParticles(this.particleEngine.queryBox(minX, minY, maxX, maxY));
  }

  /** Destroy - and so deregister - every Pin. */
  clear() {
    for (const pin of this.allPins()) pin.destroy();
    this.traitIndex.clear();
    this.particleEngine.clear();
  }
}
