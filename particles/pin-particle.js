/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * PinParticle represents the spatial, physical, and bounding state of a Pin in the display coordinate space.
 * Each Pin maintains an associated list of Vectors (represented as floats) indicating gradients,
 * magnitudes, or directional pointers.
 *
 * Placement geometry (`x y z width height`) is a VIEW: it reads from and writes
 * to the core record of the particle's element (`../core/state.js`), so the
 * element's state is the one home of where a Pin sits and how big it is. A
 * particle built without an element owns a detached one. Physics-only data -
 * velocity, mass, friction, the pinned flag, the vector list - stays here.
 */
import { boundsOf, createState, sizeOf, stateOf } from '../core/state.js';

/** The core record for `element`, made on first sight; a bare particle gets its own node. */
function stateFor(element) {
  const target = element || document.createElement('div');
  return stateOf(target) || createState(target);
}

/** The `{minX .. centerY}` box every spatial consumer here reads. */
function boxOf(x, y, width, height) {
  return {
    minX: x,
    minY: y,
    maxX: x + width,
    maxY: y + height,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2
  };
}

export class PinParticle {
  /** @type {import('../core/state.js').BlitState} */
  #state;

  constructor(options = {}) {
    this.id = options.id || `pin_${Math.random().toString(36).slice(2, 9)}`;
    this.#state = stateFor(options.element);
    this.x = Number(options.x) || 0;
    this.y = Number(options.y) || 0;
    this.z = Number(options.z) || 0;

    this.vx = Number(options.vx) || 0;
    this.vy = Number(options.vy) || 0;

    if (options.width !== undefined) this.width = Number(options.width) || 0;
    if (options.height !== undefined) this.height = Number(options.height) || 0;

    this.mass = Number(options.mass) > 0 ? Number(options.mass) : 1;
    this.friction = options.friction !== undefined ? Number(options.friction) : 0.92;
    this.pinned = Boolean(options.pinned);
    this.metadata = options.metadata || {};

    // Associated vector list (represented as floats for gradient / magnitude / pointer)
    if (Array.isArray(options.vectors)) {
      this.vectors = options.vectors.map(v => Number(v) || 0.0);
    } else if (options.vector !== undefined) {
      this.vectors = [Number(options.vector) || 0.0];
    } else {
      this.vectors = [];
    }
  }

  /* ------------------ PLACEMENT VIEW ------------------ */

  /** The element whose core record holds this particle's placement. */
  get element() { return this.#state.el; }

  get x() { return this.#state.x; }

  set x(value) { this.#state.x = value; }

  get y() { return this.#state.y; }

  set y(value) { this.#state.y = value; }

  get z() { return this.#state.z; }

  set z(value) { this.#state.z = value; }

  /** The size in force, by the core's rule: measured when there is one, else declared. */
  get width() { return sizeOf(this.#state).w; }

  set width(value) { this.#state.w = this.#state.mw = value; }

  get height() { return sizeOf(this.#state).h; }

  set height(value) { this.#state.h = this.#state.mh = value; }

  /**
   * Move this particle's placement onto `element`'s core record and view that
   * from now on. A one-time move for a particle built before its Pin's element
   * existed; after it there is again exactly one copy of the geometry.
   * @returns {this}
   */
  bindTo(element) {
    const next = stateFor(element);
    if (next === this.#state) return this;
    for (const key of ['x', 'y', 'z', 'w', 'h', 'mw', 'mh']) next[key] = this.#state[key];
    this.#state = next;
    return this;
  }

  /**
   * Add a float vector (gradient/magnitude/pointer) to the Pin's vector list
   */
  addVector(value) {
    const floatVal = Number(value) || 0.0;
    this.vectors.push(floatVal);
    return floatVal;
  }

  /**
   * Set the entire vector list
   */
  setVectors(vectorList) {
    if (Array.isArray(vectorList)) {
      this.vectors = vectorList.map(v => Number(v) || 0.0);
    } else {
      this.vectors = [];
    }
  }

  /**
   * Replace the vector at `index`.
   *
   * Bounds-checked rather than permissive: writing past the end would leave a
   * sparse array whose holes read back as `undefined` through `getVector`, and
   * every consumer here treats a vector list as a dense list of floats. An index
   * outside the list is therefore a no-op the caller can detect.
   *
   * @param {number} index position in the vector list
   * @param {number} value the new float value
   * @returns {number|null} the written value, or null when the index is out of range
   */
  setVector(index, value) {
    if (!Number.isInteger(index) || index < 0 || index >= this.vectors.length) {
      return null;
    }
    const floatVal = Number(value) || 0.0;
    this.vectors[index] = floatVal;
    return floatVal;
  }

  /**
   * Retrieve all associated vectors
   */
  getVectors() {
    return [...this.vectors];
  }

  /**
   * Retrieve a specific vector by index
   */
  getVector(index = 0) {
    return this.vectors[index] !== undefined ? this.vectors[index] : 0.0;
  }

  /**
   * Retrieve the primary vector (index 0)
   */
  getPrimaryVector() {
    return this.getVector(0);
  }

  /**
   * Compute overall vector magnitude (L2 Euclidean norm or absolute value)
   */
  getMagnitude() {
    if (this.vectors.length === 0) return 0.0;
    if (this.vectors.length === 1) return Math.abs(this.vectors[0]);
    let sumSq = 0;
    for (const v of this.vectors) {
      sumSq += v * v;
    }
    return Math.sqrt(sumSq);
  }

  /**
   * Retrieve the directional gradient (defaults to primary vector or average gradient)
   */
  getGradient() {
    if (this.vectors.length === 0) return 0.0;
    if (this.vectors.length === 1) return this.vectors[0];
    const sum = this.vectors.reduce((acc, v) => acc + v, 0);
    return sum / this.vectors.length;
  }

  /**
   * Remove a vector by index
   */
  removeVector(index) {
    if (index >= 0 && index < this.vectors.length) {
      return this.vectors.splice(index, 1)[0];
    }
    return null;
  }

  /**
   * Clear all associated vectors
   */
  clearVectors() {
    this.vectors = [];
  }

  /**
   * Apply an instantaneous force vector to the Pin
   */
  applyForce(fx, fy) {
    if (this.pinned) return;
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
  }

  /**
   * Explicitly set the position of the Pin
   */
  setPosition(x, y, z = this.z) {
    this.x = Number(x);
    this.y = Number(y);
    this.z = Number(z);
  }

  /**
   * Explicitly set the velocity of the Pin
   */
  setVelocity(vx, vy) {
    if (this.pinned) return;
    this.vx = Number(vx);
    this.vy = Number(vy);
  }

  /**
   * Declare a size: the box the element is told to have (an option, a resize).
   * Declared and measured at once, so the size reads back before the next frame.
   */
  setSize(width, height) {
    this.width = Math.max(0, Number(width));
    this.height = Math.max(0, Number(height));
  }

  /**
   * Record a measured size: the box the element turned out to have. Only the
   * measured pair moves, so an auto-sized element keeps no declared size and
   * the port never writes its box back onto it.
   */
  setMeasured(width, height) {
    this.#state.mw = Math.max(0, Number(width));
    this.#state.mh = Math.max(0, Number(height));
  }

  /**
   * Advance physics / motion state by dt, expressed in reference frames
   * (1 = one 60Hz frame). Damping is exponentiated by dt so the decay curve is
   * identical regardless of how the elapsed time is subdivided.
   */
  update(dt = 1) {
    if (this.pinned) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Apply frame-rate independent friction / damping
    const damping = Math.pow(this.friction, dt);
    this.vx *= damping;
    this.vy *= damping;

    // Stop micro-jitters
    if (Math.abs(this.vx) < 0.001) this.vx = 0;
    if (Math.abs(this.vy) < 0.001) this.vy = 0;
  }

  /**
   * Compute bounding box in the parent's (local) space
   */
  getBounds() {
    return boxOf(this.x, this.y, this.width, this.height);
  }

  /**
   * Compute bounding box in canvas space: the local box summed over every
   * ancestor element the core knows (`boundsOf`), so a nested Pin reports where
   * it actually sits. A detached or root element's global box is its local one.
   */
  getGlobalBounds() {
    const { x, y, w, h } = boundsOf(this.#state);
    return boxOf(x, y, w, h);
  }

  /**
   * Euclidean distance to another Pin or coordinate {x, y}
   */
  distanceTo(target) {
    const dx = this.x - target.x;
    const dy = this.y - target.y;
    return Math.hypot(dx, dy);
  }
}

/**
 * Build the spatial node a Pin is constructed with, over the Pin's element.
 *
 * The mapping from Pin construction options to particle options lives here, next
 * to the constructor that defines their shape, rather than inside the Pin: a
 * caller-supplied particle is adopted as-is, and declared dimensions seed canvas
 * space before any layout measurement has happened.
 *
 * @param {string} id the Pin's id, which the particle carries
 * @param {object} options the Pin's construction options
 * @param {Element} element the Pin's element, whose core record the particle views
 * @returns {PinParticle}
 */
export function particleFromOptions(id, options = {}, element = undefined) {
  if (options.particle instanceof PinParticle) {
    return element ? options.particle.bindTo(element) : options.particle;
  }

  const particle = new PinParticle({
    id,
    element,
    x: options.x || 0,
    y: options.y || 0,
    z: options.z || 0,
    pinned: options.pinned !== undefined ? options.pinned : true,
    mass: options.mass || 1,
    friction: options.friction !== undefined ? options.friction : 0.92,
    vectors: options.vectors,
    vector: options.vector,
    metadata: options.metadata || {}
  });

  // Only the axes given are declared: a `width`-only card keeps an auto height,
  // and the port writes back exactly the sizes that were declared.
  if (options.width !== undefined) particle.width = Math.max(0, Number(options.width));
  if (options.height !== undefined) particle.height = Math.max(0, Number(options.height));
  return particle;
}
