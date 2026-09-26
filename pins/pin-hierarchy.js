/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The Pin hierarchy, read from the DOM.
 *
 * A Pin's element is the one record of where it sits: its parent is the nearest
 * Pin element above it, and its children are the Pins whose elements sit in its
 * scope container, in document order. Nothing here is stored twice - a parked
 * element (`../core/park.js`) is read through the anchor that holds its place,
 * so an unmounted, offloaded or demoted Pin keeps its ancestry and its position.
 *
 * Every function takes the Pin as its first argument; `Pin` forwards to them.
 */
import { MAX_DEPTH, parentElementOf } from '../core/state.js';
import { parkedStateOf } from '../core/park.js';

/** @type {WeakMap<Element, import('./pin.js').Pin>} element -> the Pin it belongs to */
const PIN_OF = /* @__PURE__ */ new WeakMap();

/** Record that `element` is this Pin's root element. */
export function registerElement(pin, element) {
  PIN_OF.set(element, pin);
}

/** The Pin whose root element this is, or undefined for any other element. */
export function pinOf(element) {
  return PIN_OF.get(element);
}

/** The nearest Pin above this one, read through anchors, or null at the root. */
export function parentOf(pin) {
  if (!pin.element) return null;

  let node = parentElementOf(pin.element);
  for (let depth = 0; node && depth < MAX_DEPTH; depth += 1) {
    const owner = PIN_OF.get(node);
    if (owner && owner !== pin) return owner;
    node = parentElementOf(node);
  }
  return null;
}

/** The Pins directly inside this one's scope container, in document order, as a fresh Set. */
export function childrenOf(pin) {
  const found = new Set();
  forEachChild(pin, addTo, found);
  return found;
}

/** `forEachChild` visitor for `childrenOf`. */
function addTo(child, found) {
  found.add(child);
}

/**
 * Call `fn(child, first, second)` for each Pin directly inside this one's scope
 * container, in document order, allocating nothing - the per-frame form of
 * `childrenOf`. The two extra arguments are forwarded so a per-frame caller can
 * pass a module-level function rather than allocate a closure.
 *
 * The walk is live, so `fn` may park or unpark the child it is handed, in place:
 * the next node is read after the call, falling back to the one captured before
 * it when the visited node itself left the scope. `fn` must not reorder siblings
 * (e.g. move the handed child to the end) or park a later sibling - the walk
 * would end early. Use `childrenOf` for a snapshot when that is needed.
 */
export function forEachChild(pin, fn, first, second) {
  const scope = pin.scopeElement;
  if (!scope) return;

  let node = scope.firstChild;
  while (node) {
    const next = node.nextSibling;
    const child = childOfNode(pin, node);
    if (child) fn(child, first, second);
    node = node.parentNode === scope ? node.nextSibling : next;
  }
}

/** Whether any Pin sits directly inside this one's scope container; allocates nothing. */
export function hasChildren(pin) {
  const scope = pin.scopeElement;
  if (!scope) return false;

  for (let node = scope.firstChild; node; node = node.nextSibling) {
    if (childOfNode(pin, node)) return true;
  }
  return false;
}

/** The child Pin a node of `pin`'s scope container stands for, or null. */
function childOfNode(pin, node) {
  const owner = pinOfNode(node);
  return owner && owner !== pin ? owner : null;
}

/** The Pin a scope-container node stands for: an element, or the anchor of a parked one. */
function pinOfNode(node) {
  if (node.nodeType === 1) return PIN_OF.get(node) || null;
  if (node.nodeType !== 8) return null;

  const parked = parkedStateOf(node);
  return parked ? PIN_OF.get(parked.el) || null : null;
}
