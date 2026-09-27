/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The carrier: a Pin-shaped facade over a core blit, what a class trait sees
 * when the bridge (`./adapt-trait.js`) runs it on one. It answers the Pin
 * surface the traits read - `element`, `particle`, `traits`, `setPosition`,
 * `getGlobalBounds`, the event methods and `transmit` - from the blit's own
 * state, so nothing is copied and nothing goes stale. One carrier per element,
 * made on first use and dropped when its last trait leaves.
 *
 * A root keeps an index of its carriers by id (`pinMap`, what a global-render
 * trait resolves its targets through); the groups those traits draw go in the
 * `<svg>` on its plane (`./connect.js`, `svgLayerOf`).
 */
import { schedule } from '../core/frame.js';
import { rootOf, scopeContainerOf, stateOf } from '../core/state.js';
import { registerElement } from '../pins/pin-hierarchy.js';
import { hookElement, transmit } from '../pins/pin-scope.js';
import { svgLayerOf } from './connect.js';

/** The marker on the `<svg>` global-render groups draw into, shared with `./connect.js`. */
export { SVG_LAYER_ATTR } from './connect.js';
export { svgLayerOf };

/** @type {WeakMap<Element, Carrier>} element -> its carrier */
const CARRIERS = /* @__PURE__ */ new WeakMap();

/** @type {WeakMap<object, RootIndex>} root -> its carriers and groups */
const INDEXES = /* @__PURE__ */ new WeakMap();

let sequence = 0;

/**
 * @typedef {object} RootIndex
 * @property {Map<string, Carrier>} pinMap every carrier under the root, by id
 * @property {Map<string, object>} groups one record per global-render trait name
 */

/** The particle view of a blit: placement and size read live, `pinned` a plain flag. */
function particleOf(b) {
  return {
    pinned: true,
    get x() { return b.x; },
    get y() { return b.y; },
    get z() { return b.z; },
    get width() { return b.size.w; },
    get height() { return b.size.h; },
    setPosition(x, y, z) { b.set({ x, y, z }); }
  };
}

export class Carrier {
  /** @param {import('../core/blit.js').Blit} b */
  constructor(b) {
    this.blit = b;
    this.element = b.el;
    this.id = b.el.id || `blit_${sequence += 1}`;
    /** @type {Map<string, import('../pins/traits/base.js').PinTrait>} */
    this.traits = new Map();
    this.particle = particleOf(b);
    this.lazy = false;
    this.active = true;
  }

  /** A core blit has no chrome to switch off; the trait chrome logic stands down. */
  get chrome() { return true; }
  get contentElement() { return this.element; }

  /** The nearest blit above with a carrier of its own, or null. */
  get parent() {
    let above = this.blit.parent;
    while (above) {
      const carrier = CARRIERS.get(above.el);
      if (carrier) return carrier;
      above = above.parent;
    }
    return null;
  }

  /** The direct blits inside that carry traits, in document order. */
  get children() {
    return this.blit.blits.map((child) => CARRIERS.get(child.el)).filter(Boolean);
  }

  /** Selection, owned by a `selectable` trait; false without one. */
  get selected() {
    const trait = this.traits.get('selectable');
    return trait ? trait.selected : false;
  }

  set selected(value) {
    const trait = this.traits.get('selectable');
    if (!trait) return;
    if (value) trait.select(this);
    else trait.deselect(this);
  }

  setPosition(x, y, z = this.blit.z) { this.blit.set({ x, y, z }); }

  /** The global box in the Pin shape: edges, size and centre. */
  getGlobalBounds() {
    const { x, y, w, h } = this.blit.bounds;
    return { minX: x, minY: y, maxX: x + w, maxY: y + h, width: w, height: h, centerX: x + w / 2, centerY: y + h / 2 };
  }

  /** The blit's `[data-scope]`, else its element; a core blit needs nothing created. */
  getOrCreateScopeElement() { return scopeContainerOf(this.element); }

  /** Rendering is the frame's; a class trait asking for a repaint marks the blit dirty. */
  invalidate() {
    const root = rootOf(stateOf(this.element));
    if (!root) return false;
    root.dirty.add(stateOf(this.element));
    return schedule(root);
  }

  /** A lazy child's activation (`ScopeTrait`); a core blit is always live. */
  activate() {}

  /** Listening through the carrier keeps the transmit hooks first (`../pins/pin-scope.js`). */
  addEventListener(type, listener, options) {
    hookElement(this.element, type);
    this.element.addEventListener(type, listener, options);
  }

  removeEventListener(type, listener, options) {
    this.element.removeEventListener(type, listener, options);
  }

  dispatchEvent(event) { return this.element.dispatchEvent(event); }

  /** Send an event through this carrier's `onTransmit` hooks and up the blit tree. */
  transmit(event, context = {}) { return transmit(this, event, context); }
}

/**
 * The carrier for a blit, made on first use. It joins its root's index, and the
 * transmit listener resolves the element to it (`registerElement`).
 * @param {import('../core/blit.js').Blit} b
 * @returns {Carrier}
 */
export function carrierOf(b) {
  const existing = CARRIERS.get(b.el);
  if (existing) return existing;

  const carrier = new Carrier(b);
  CARRIERS.set(b.el, carrier);
  registerElement(carrier, b.el);
  const root = rootOf(stateOf(b.el));
  if (root) indexOf(root).pinMap.set(carrier.id, carrier);
  return carrier;
}

/** Forget a carrier whose traits have all left; its element gets a fresh one next time. */
export function releaseCarrier(carrier) {
  CARRIERS.delete(carrier.element);
  const root = rootOf(stateOf(carrier.element));
  const index = root ? INDEXES.get(root) : null;
  if (index && index.pinMap.get(carrier.id) === carrier) index.pinMap.delete(carrier.id);
}

/** A root's carrier index, made on first use. @returns {RootIndex} */
export function indexOf(root) {
  let index = INDEXES.get(root);
  if (!index) {
    index = { pinMap: new Map(), groups: new Map() };
    INDEXES.set(root, index);
  }
  return index;
}
