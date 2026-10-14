/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Per-blit engine state: one record per element in a module WeakMap, so the browser owns the lifetime and nothing
 * is ever unregistered. The handle is cached on the record, which gives `blit(el)` its stable identity.
 */

/** The markers: every blit; a root's host; where a blit's children go when its type declares a scope container. */
export const BLIT_ATTR = 'data-blit';
export const ROOT_ATTR = 'data-blit-root';
export const SCOPE_ATTR = 'data-scope';

/** The slots a `fill` write lands in, by name; as text unless the template marks the slot `data-slot-html`. */
export const SLOT_ATTR = 'data-slot';
export const SLOT_HTML_ATTR = 'data-slot-html';

/** The placement keys `set()` routes to the port rather than to `data-*`. */
export const PLACEMENT_KEYS = /* @__PURE__ */ Object.freeze(['x', 'y', 'z', 'w', 'h']);

/** Depth guard on ancestor walks: a malformed tree must never hang a frame. */
export const MAX_DEPTH = 4096;

/** @type {WeakMap<Element, BlitState>} element -> its engine record */
const STATES = /* @__PURE__ */ new WeakMap();

/**
 * @typedef {object} BlitState
 * @property {Element} el the element this record belongs to
 * @property {object|null} handle the cached `Blit` handle
 * @property {number} x local placement, relative to the parent's scope origin
 * @property {number} y
 * @property {number} z
 * @property {number|null} w explicit size, or null when the element sizes itself
 * @property {number|null} h
 * @property {number} mw the size last measured in a read phase
 * @property {number} mh
 * @property {number} sx the scope container's layout offset inside the element
 * @property {number} sy
 * @property {number|null} [fx] a flow child's offset as flex/grid placed it, read over x/y (`../addons/layout.js`)
 * @property {number|null} [fy]
 * @property {Set<string>} changed keys written since the last port call
 * @property {boolean} painted whether a port has run for this blit yet
 * @property {Function|null} port a custom port, or null for the default
 * @property {object|null} root the frame machinery, present on a root's record only
 * @property {Comment|null} anchor the place-holder left in the tree while the element is parked (`../addons/park.js`)
 * @property {Function[]|null} with anonymous traits given by value (`./use.js`)
 * @property {Map<string|Function, Function|null>|null} cleanups the running traits, by name or function
 * @property {Function|null} traits `(state, run)` once indexed: run or stop the traits of its subtree (`./use.js`)
 * @property {string|null} id the id its root indexes it under, not always `el.id` (`./root.js`)
 */

/** @type {WeakMap<Comment, BlitState>} anchor -> the record it holds a place for (`../addons/park.js`) */
const ANCHORS = /* @__PURE__ */ new WeakMap();

/** The record an anchor comment holds a place for, or undefined for any other node. */
export function parkedStateOf(node) {
  return ANCHORS.get(node);
}

/** Record (or with no state, forget) what an anchor holds a place for. */
export function holdPlace(anchor, state) {
  if (state) ANCHORS.set(anchor, state);
  else ANCHORS.delete(anchor);
}

/** The blit elements directly inside `node` in document order, a parked one read through its anchor. */
export function childBlitsOf(node, out = []) {
  for (const child of node.childNodes) {
    const parked = child.nodeType === 8 ? ANCHORS.get(child) : null;
    if (parked) out.push(parked.el);
    else if (child.nodeType === 1) {
      if (child.hasAttribute(BLIT_ATTR)) out.push(child);
      else childBlitsOf(child, out);
    }
  }
  return out;
}

/** The record for `element`, or undefined when it is not a blit. */
export function stateOf(element) {
  return STATES.get(element);
}

/** Create the record for an element and mark it `data-blit`; the caller decides what kind. */
export function createState(element) {
  const state = {
    el: element, handle: null, x: 0, y: 0, z: 0, w: null, h: null, mw: 0, mh: 0, sx: 0, sy: 0, changed: new Set(),
    painted: false, port: null, root: null, anchor: null, with: null, cleanups: null, traits: null, id: null
  };
  STATES.set(element, state);
  element.setAttribute(BLIT_ATTR, '');
  return state;
}

/** Forget the record for `element` and take its `data-blit` mark off: a host handed back as it was found. */
export function dropState(element) {
  STATES.delete(element);
  element.removeAttribute(BLIT_ATTR);
}

/** The root record the element sits under, or null; read from the DOM, never cached. */
export function rootOf(state) {
  const host = state.el.closest(`[${ROOT_ATTR}]`);
  return (host && STATES.get(host)?.root) || null;
}

/** The node `element` hangs from: its anchor's parent while parked, else its own. */
export function parentNodeOf(element) {
  return STATES.get(element)?.anchor?.parentNode || element.parentNode;
}

/** The nearest blit element above `element`, read through its anchor when parked, or null. */
export function parentElementOf(element) {
  const parent = parentNodeOf(element);
  return parent && typeof parent.closest === 'function' ? parent.closest(`[${BLIT_ATTR}]`) : null;
}

/** Whether `element` sits inside `ancestor`, read through anchors: a parked blit is still inside. */
export function isWithin(ancestor, element) {
  let node = parentElementOf(element);
  for (let depth = 0; node && node !== ancestor && depth < MAX_DEPTH; depth += 1) node = parentElementOf(node);
  return Boolean(node) && node === ancestor;
}

/** The size in force: the last measured box, or the declared one until then. */
export function sizeOf(state) {
  return { w: state.mw > 0 ? state.mw : (state.w ?? 0), h: state.mh > 0 ? state.mh : (state.h ?? 0) };
}

/** The global box: local placement (a flow child's flow origin while it has one) summed over every ancestor blit. */
export function boundsOf(state) {
  let x = state.fx ?? state.x;
  let y = state.fy ?? state.y;
  let node = parentElementOf(state.el);

  for (let depth = 0; node && depth < MAX_DEPTH; depth += 1) {
    const above = STATES.get(node);
    if (!above || above.root) break;
    x += (above.fx ?? above.x) + above.sx;
    y += (above.fy ?? above.y) + above.sy;
    node = parentElementOf(node);
  }
  return { x, y, ...sizeOf(state) };
}

/** Where a blit's children go: its own `[data-scope]`, else the element itself. */
export function scopeContainerOf(element) {
  const scope = element.querySelector(`[${SCOPE_ATTR}]`);
  if (scope && scope.closest(`[${BLIT_ATTR}]`) === element) return scope;
  return element;
}
