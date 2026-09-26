/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * 
 * PinManager manages the collection of Pins on the canvas,
 * hierarchical scopes, capability indexing, and synchronization with ParticleEngine.
 */
import { Pin } from './pin.js';
import {
  RELOAD_STRATEGIES,
  RELOAD_MODES,
  normalizeReloadStrategy,
  resolveReloadMode
} from './reload.js';
import { LazyChildrenLoader } from './children-loader.js';
import { indexPin, unindexPin } from './manager-index.js';
import { announceProvision } from '../engine/announcer.js';
import { PinSignalBus } from './pin-signals.js';
import { ParticleEngine } from '../particles/engine.js';

/** Drop utility Pins from a result set; see `Pin.utility`. */
function visible(pins) {
  return pins.filter((pin) => !pin.utility);
}

export class PinManager {
  constructor(options = {}) {
    this.options = options;

    // Reload strategy applied to Pins created without one. Validated up front so
    // a typo fails at construction, not silently per-Pin.
    this.defaultReload = normalizeReloadStrategy(options.defaultReload);

    // Provisioning service for lazy scopes; `options.loadChildren` is the
    // session-level provider every lazy Pin falls back to.
    this.childrenLoader = new LazyChildrenLoader(this);

    this.pins = new Map();
    this.particleEngine = options.particleEngine || new ParticleEngine();
    this.container = options.container || null;

    // Conjugate renderer, supplied by the session. Null in headless use: every
    // call site is guarded, so a manager without one still works synchronously.
    this.renderer = options.renderer || null;

    // Owning session, read back through `session` below. Held here rather than
    // on every Pin: registration with this manager is what puts a Pin in a
    // session, so this is the one place that fact lives (see `Pin#session`).
    this._session = options.session || null;

    // Reverse indices: name -> Set<Pin>
    this.capabilityIndex = new Map();
    this.traitIndex = new Map();

    // particle.id -> pin.id. A Pin built around a pre-existing particle has
    // particle.id !== pin.id, so spatial results cannot be keyed by particle id alone.
    this.particleToPin = new Map();

    // Per-pin record of the index keys it currently occupies
    this._indexKeys = new WeakMap();

    // Re-broadcast of every registered Pin's lifecycle signals (see `onSignal`).
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

  /**
   * Set the parent DOM container for all root Pins.
   * Flushes the pre-mount queue: any root Pin registered before a container
   * existed is mounted now.
   */
  setContainer(container) {
    this.container = container;
    if (container) {
      this.mountAll(container);
    }
  }

  /**
   * The session that owns this manager, or null in headless use.
   *
   * Falls back to the renderer's own back-reference, so a manager wired the way
   * `CloudCanvasSession` wires one - `setRenderer` with a session-owned renderer
   * - already answers correctly without a second call.
   *
   * @returns {CloudCanvasSession|null}
   */
  get session() {
    if (this._session) return this._session;
    return (this.renderer && this.renderer.session) || null;
  }

  /**
   * Declare the owning session explicitly.
   * @returns {CloudCanvasSession|null} the session now held
   */
  setSession(session) {
    this._session = session || null;
    return this._session;
  }

  /**
   * Adopt a conjugate renderer. Pins registered before this call are handed over
   * now, so registration order never decides whether a Pin gets rendered.
   */
  setRenderer(renderer) {
    this.renderer = renderer || null;
    if (!this.renderer) return null;

    for (const pin of this.pins.values()) {
      this.renderer.attach(pin);
    }
    return this.renderer;
  }

  /**
   * Create and register a new Pin.
   * A Pin that declares neither `reload` nor the `lazy` alias inherits the
   * manager's default strategy.
   */
  createPin(options = {}) {
    const declaresStrategy = options.reload !== undefined || options.lazy !== undefined;
    const pin = new Pin(declaresStrategy ? options : { ...options, reload: this.defaultReload });
    return this.registerPin(pin, options.parent);
  }

  /**
   * Register an existing Pin instance
   */
  registerPin(pin, parentPin = null) {
    if (!(pin instanceof Pin)) {
      throw new TypeError('Expected an instance of Pin');
    }

    this.pins.set(pin.id, pin);
    this.particleEngine.addPin(pin.particle);
    if (pin.particle) {
      this.particleToPin.set(pin.particle.id, pin.id);
    }
    pin._manager = this;
    this._indexPin(pin);
    this.signals.attach(pin);

    // A utility Pin owns its own placement: it has no element on the canvas
    // plane and no per-frame render work, so neither the container nor the
    // renderer adopts it. Its creator (the session, for the cursor Pin) decides
    // where it lives.
    if (pin.utility) return pin;

    if (parentPin instanceof Pin) {
      parentPin.addChild(pin);
    } else if (this.container && !pin.parent) {
      // A root Pin joins the container only if its reload strategy says so.
      if (resolveReloadMode(pin) === RELOAD_MODES.MOUNTED) pin.mount(this.container);
      else pin._reconcile();
    }

    // Attached last: the renderer mounts against the final parent linkage.
    if (this.renderer) {
      this.renderer.attach(pin);
    }

    // A lazy Pin born active is already required: provision it now.
    if (pin.reload === RELOAD_STRATEGIES.LAZY && pin.active) {
      this.loadChildrenFor(pin);
    }

    return pin;
  }

  /* ------------------ LAZY CHILDREN PROVIDER ------------------ */

  /**
   * Provision a lazy Pin's children exactly once (see `LazyChildrenLoader`).
   *
   * A provider run is a state change no sighted-only signal covers - the scope
   * simply fills in - so the *first* run, and only the first, is announced.
   * Callers that arrive while a flight is in progress, or after it finished,
   * get the loader's own promise untouched, so single-flight identity and the
   * cached-result path both behave exactly as before.
   *
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

  /**
   * Destroy every child subtree of a Pin, keeping the manager's registries and
   * indices clean. The Pin itself is untouched.
   *
   * @returns {number} how many direct child subtrees were removed
   */
  removeSubtreeChildren(pin) {
    if (!pin) return 0;

    let removed = 0;
    for (const child of Array.from(pin.children)) {
      if (this.pins.has(child.id)) {
        if (this.removePin(child.id)) removed += 1;
      } else {
        child.destroy();
        removed += 1;
      }
    }
    return removed;
  }

  /**
   * Remove and destroy a Pin along with its entire subtree.
   * Pin.destroy() recursively destroys children and detaches their elements,
   * so the subtree is collected before destruction.
   */
  removePin(id) {
    const pin = this.pins.get(id);
    if (!pin) return false;

    const subtree = this._collectSubtree(pin);

    if (pin.parent) {
      pin.parent.removeChild(pin);
    }

    pin.destroy();

    for (const member of subtree) {
      this._deregister(member);
    }

    return true;
  }

  /**
   * Collect a Pin and all of its descendants (depth-first, cycle-safe)
   */
  _collectSubtree(pin) {
    const collected = [];
    const seen = new Set();
    const stack = [pin];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || seen.has(current)) continue;
      seen.add(current);
      collected.push(current);

      if (current.children) {
        for (const child of current.children) {
          stack.push(child);
        }
      }
    }

    return collected;
  }

  /**
   * Detach a single Pin from the manager, particle engine, and indices.
   * The particle engine keys by particle.id, which may differ from pin.id
   * when a pre-built particle is supplied.
   */
  _deregister(pin) {
    const particleId = pin.particle ? pin.particle.id : pin.id;
    this.signals.detach(pin);
    if (this.renderer) this.renderer.forget(pin);
    this.pins.delete(pin.id);
    this.particleEngine.removePin(particleId);
    this.particleToPin.delete(particleId);
    this._unindexPin(pin);
    if (pin._manager === this) {
      pin._manager = null;
    }
  }

  /**
   * Retrieve a Pin by ID
   */
  getPin(id) {
    return this.pins.get(id);
  }

  /**
   * Every registered Pin, utility Pins included.
   *
   * Internal: the engine needs full membership (the cursor Pin is registered and
   * has to be found by id), while every caller-facing query below reports the
   * canvas as the user built it.
   */
  allPins() {
    return Array.from(this.pins.values());
  }

  /**
   * Get all registered Pins
   */
  getAllPins() {
    return visible(this.allPins());
  }

  /**
   * Get only root-level Pins (no parent)
   */
  getRootPins() {
    return visible(this.allPins().filter(p => !p.parent));
  }

  /**
   * Get only currently active Pins
   */
  getActivePins() {
    return visible(this.allPins().filter(p => p.active));
  }

  /* ------------------ CAPABILITY & TRAIT INDICES ------------------ */

  /** Add every trait name and capability of a Pin to the indices. */
  _indexPin(pin) {
    return indexPin(this, pin);
  }

  /** Drop every index entry belonging to a Pin. */
  _unindexPin(pin) {
    return unindexPin(this, pin);
  }

  /**
   * Recompute index entries for a Pin whose traits changed.
   * Called by Pin.addTrait / Pin.removeTrait / Pin.destroy.
   */
  reindexPin(pin) {
    if (!pin || !this.pins.has(pin.id)) return false;
    this._unindexPin(pin);
    this._indexPin(pin);
    return true;
  }

  /**
   * Get all Pins possessing traits with a specific capability
   */
  getPinsByCapability(capability) {
    return visible(this.indexedByCapability(capability));
  }

  /**
   * Get all Pins carrying a trait by name
   */
  getPinsByTrait(traitName) {
    return visible(this.indexedByTrait(traitName));
  }

  /**
   * Raw index reads, utility Pins included. The global SVG pass walks the trait
   * index itself; these are for callers that need the same unfiltered view.
   */
  indexedByTrait(traitName) {
    const bucket = this.traitIndex.get(traitName);
    return bucket ? Array.from(bucket) : [];
  }

  indexedByCapability(capability) {
    const bucket = this.capabilityIndex.get(capability);
    return bucket ? Array.from(bucket) : [];
  }

  /**
   * Mount all root Pins into container
   */
  mountAll(container = this.container) {
    if (!container) return;
    this.container = container;
    for (const pin of this.pins.values()) {
      if (pin.parent) continue;
      // Dormant and unmounted strategies settle into their own resting state
      // rather than being dragged into the container.
      if (resolveReloadMode(pin) === RELOAD_MODES.MOUNTED) pin.mount(container);
      else pin._reconcile();
    }
  }

  /**
   * Run simulation tick on all active Pins
   */
  tickAll(dt = 1, context = {}) {
    for (const pin of this.pins.values()) {
      // Only tick root pins directly; root pins recursively tick their active children
      if (!pin.parent) {
        pin.tick(dt, context);
      }
    }
  }

  /**
   * Render all root Pins (which recursively render active children).
   *
   * Not used by the session loop any more - the ConjugateRenderer owns per-frame
   * work. Kept as an explicit, synchronous full-graph render for headless callers.
   */
  renderAll(context = {}) {
    for (const pin of this.pins.values()) {
      if (!pin.parent) {
        pin.render(context);
      }
    }
  }

  /**
   * Resolve spatial-query particles back to their owning Pins.
   * Particles belonging to no registered Pin are dropped.
   */
  _pinsForParticles(particles) {
    const pins = [];
    for (const particle of particles) {
      const pin = this.pins.get(this.particleToPin.get(particle.id));
      // A utility Pin has a particle but occupies no space on the canvas: a
      // spatial query must never return one.
      if (pin && !pin.utility) pins.push(pin);
    }
    return pins;
  }

  /**
   * Find Pins within a circular radius of (x, y)
   */
  queryRadius(x, y, radius) {
    return this._pinsForParticles(this.particleEngine.queryRadius(x, y, radius));
  }

  /**
   * Find Pins within a bounding box
   */
  queryBox(minX, minY, maxX, maxY) {
    return this._pinsForParticles(this.particleEngine.queryBox(minX, minY, maxX, maxY));
  }

  /**
   * Remove and clean up all Pins
   */
  clear() {
    for (const pin of this.pins.values()) {
      pin.destroy();
      this.signals.detach(pin);
      if (this.renderer) this.renderer.forget(pin);
      this._unindexPin(pin);
      if (pin._manager === this) {
        pin._manager = null;
      }
    }
    this.pins.clear();
    this.particleToPin.clear();
    this.capabilityIndex.clear();
    this.traitIndex.clear();
    this.particleEngine.clear();
  }
}
