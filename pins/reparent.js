/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Reparenting: moving a live Pin from wherever it is nested into a new parent,
 * or back out to the canvas root, without ever destroying it.
 *
 * A free function taking the Pin first, beside `resizePin` and `rotatePin`: one
 * primitive, two directions, and the two are the *same* operation with the
 * source and target roles reversed - never a rebuild. The Pin instance survives
 * untouched: its `traits` Map, its particle, its selection and drag state, its
 * element and every listener on it. Only two things change - which scope holds
 * it, and where inside that scope it sits.
 *
 * The membership half is already solved and is reused, not reimplemented:
 * `addChild` / `removeChild` (`./pin-scope.js`) relink the graph, move the
 * element between scope wells, re-attach the renderer, and wake the subtree -
 * and `addChild` already detaches the Pin from its current parent first. What
 * they do *not* do is convert coordinates: a Pin dropped at a canvas point has
 * to land at that same visible place in its new parent's local space. That
 * conversion is the whole of what this module adds, through `scopeOriginOf`
 * (`./pin-element.js`) - the inverse of the sum `getGlobalBounds` walks.
 */
import { nodeOf } from '../core/park.js';
import { captureScopeOffset, scopeOriginOf } from './pin-element.js';
import { placeElement, syncScopePopulation } from './pin-membership.js';

/**
 * Move `pin` under `newParent`, or - with `newParent === null` - out to the
 * canvas root, keeping it at the given canvas-space point.
 *
 * The point is the top-left corner the Pin should come to rest at, in canvas
 * space. It is optional: with none, the Pin's current global corner is used, so
 * a reparent with no position keeps it exactly where it already is (which is
 * what a drop wants - the drag has already moved it to the release point).
 *
 * @param {Pin} pin the Pin to move
 * @param {Pin|null} newParent the Pin to nest under, or null to promote to root
 * @param {{x?: number, y?: number}} [position] canvas-space top-left to land at
 * @returns {Pin|null} the Pin, or null when the move was rejected
 */
export function reparentPin(pin, newParent, position = {}) {
  if (!pin || newParent === pin) return null;
  // A Pin can never become a child of its own descendant - that is a cycle.
  if (newParent && descendsFrom(newParent, pin)) return null;

  const oldParent = pin.parent || null;
  if (newParent === oldParent && !newParent) return null;

  const corner = pin.getGlobalBounds();
  const canvasX = Number.isFinite(position.x) ? position.x : corner.minX;
  const canvasY = Number.isFinite(position.y) ? position.y : corner.minY;

  if (newParent) {
    // `addChild` detaches from the old parent, relinks, moves the element into
    // the new scope well, re-attaches the renderer, and wakes the subtree.
    newParent.addChild(pin);
    // Settle the target well *now*, before reading its origin. With a renderer
    // attached `addChild` only enqueues the structure change, so the element
    // move, the well's `cc-populated` box, and the re-measured `_scopeOffset`
    // would not exist until later frames - and reading a stale (empty-well)
    // offset here places the Pin permanently wrong (see `settleNewWell`).
    settleNewWell(pin, newParent);
    const origin = scopeOriginOf(newParent);
    pin.setPosition(canvasX - origin.x, canvasY - origin.y, pin.z);
  } else {
    if (oldParent) oldParent.removeChild(pin);
    pin.setPosition(canvasX, canvasY, pin.z);
    // `removeChild` unmounts the element; reconcile re-mounts it on the canvas
    // plane, the DOM home every root Pin already resolves to.
    pin._reconcile();
  }

  notifyOldWell(pin, oldParent);
  return pin;
}

/**
 * Bring `newParent`'s scope well to its settled, populated geometry *now* - the
 * one deliberate crossing of the renderer's "structure changes settle next frame"
 * contract, scoped to this call alone.
 *
 * Ordinarily `addChild` only enqueues a structure invalidation: with a renderer
 * attached the moved element, the well's `cc-populated` box, and the re-measured
 * `_scopeOffset` all settle over the *following* frame(s). That deferral is
 * correct for dirty-marking, which is free to be a frame late - but `reparentPin`
 * needs the *current* frame's correct scope origin to convert the drop point, and
 * the error is not self-correcting: once the Pin's local position is computed
 * against a stale, empty-well offset (an empty well is `display: none`, so its
 * measured offset is zero), no later frame ever re-derives it, and the Pin lands
 * permanently off by that offset - the ~66px drop the empty-well case exhibits,
 * exactly the populated well's own `margin-top` + content height.
 *
 * So we do here, synchronously, precisely what the structure flush and the
 * scope-well pass would have done, in the same order: move the element into the
 * well, grant the well its `cc-populated` box (which is what lifts its layout
 * offset off zero, `display: none` -> `display: block`), and read that offset
 * back. The `offsetTop`/`offsetLeft` read in `captureScopeOffset` forces the one
 * layout the conversion depends on.
 *
 * Idempotent when the well was already populated (a container that already held a
 * child): the element append is a no-op if it is already there, `cc-populated` is
 * unchanged, and the offset re-reads to the same value - so the already-correct
 * populated-container case is never double-counted or regressed. The renderer's
 * own next flush repeats all three harmlessly.
 */
function settleNewWell(pin, newParent) {
  const scope = newParent.getOrCreateScopeElement();
  if (!scope || !pin.element) return;
  placeElement(pin, scope);
  syncScopePopulation(newParent);
  captureScopeOffset(newParent);
}

/* ------------------ IN-PLACE REORDER (Sprint 8.2) ------------------ */

/**
 * Reorder `pin` within its flow container, moving it to sit immediately before
 * `beforeSibling` - or to the end when that is null.
 *
 * A reorder is not a reparent, and deliberately does *not* go through
 * `removeChild`/`addChild`: `pin` is already a child of `container`, so there is
 * no relinking, no renderer re-attach, no coordinate conversion, and no well to
 * settle - only order changes. The DOM is the one order: the browser paints it
 * and `children` reads it, so one native `insertBefore` is the whole move. A
 * parked Pin moves by its anchor, so it comes back in its new place.
 *
 * @param {Pin} container the flow parent both siblings belong to
 * @param {Pin} pin the child being moved
 * @param {Pin|null} [beforeSibling] the child to insert before, or null for the end
 * @returns {Pin|null} the moved Pin, or null when the move was rejected
 */
export function reorderChild(container, pin, beforeSibling = null) {
  if (!container || !pin || pin === beforeSibling) return null;
  if (pin.parent !== container) return null;
  if (beforeSibling && beforeSibling.parent !== container) return null;

  reorderChildElement(container, pin, beforeSibling);
  return pin;
}

/** Move the Pin's node (element, or anchor while parked) to its new place in the scope. */
function reorderChildElement(container, pin, beforeSibling) {
  const scope = container.scopeElement;
  if (!scope || !pin.element) return;

  const ref = beforeSibling && beforeSibling.element ? nodeOf(beforeSibling.element) : null;
  scope.insertBefore(nodeOf(pin.element), ref && ref.parentNode === scope ? ref : null);
}

/**
 * The sibling a drop at `event` should place `pin` before within `container`'s
 * flow, or null to append at the end.
 *
 * The main axis follows the layout: horizontal for a `row`, vertical for a
 * `column` or `grid` (which auto-flows into rows). A drop before the midpoint of a
 * sibling on that axis lands before it; the first sibling whose midpoint the drop
 * has not yet reached is the insertion point, and a drop past all of them appends.
 * Read straight off `getBoundingClientRect` because a flow child's particle x/y no
 * longer describes where it renders - the flex/grid box does.
 *
 * @returns {Pin|null} the reference sibling, or null to append
 */
export function insertionSiblingFor(container, pin, event) {
  const horizontal = container && container.layout === 'row';
  const point = horizontal ? event && event.clientX : event && event.clientY;
  if (!Number.isFinite(point)) return null;

  for (const sibling of container.children) {
    if (sibling === pin || !sibling.element) continue;
    const rect = boundsOf(sibling.element);
    if (!rect) continue;

    const mid = horizontal ? (rect.left + rect.right) / 2 : (rect.top + rect.bottom) / 2;
    if (point < mid) return sibling;
  }
  return null;
}

/** A live bounding box, or null when the element cannot report one. */
function boundsOf(element) {
  if (!element || typeof element.getBoundingClientRect !== 'function') return null;
  return element.getBoundingClientRect();
}

/** Whether `candidate` sits somewhere in `ancestor`'s subtree. */
function descendsFrom(candidate, ancestor) {
  return typeof candidate.ancestors === 'function'
    && candidate.ancestors().includes(ancestor);
}

/**
 * Recompute the scope well of the parent a Pin just left.
 *
 * A departed child leaves no dirt of its own behind, so the old parent's well
 * would never be recomputed - it would stay sized and populated for a child that
 * is gone. `removeChild` does not touch it (a destroyed child's well is handled
 * by the renderer's `forget`), so a *live* reparent has to, in whichever mode
 * the Pin is in: through the renderer's own well pass when one is attached
 * (exactly as `ConjugateRenderer.forget` does), synchronously off the element
 * otherwise. The new parent needs no such nudge - the moved Pin is dirty this
 * frame, which is what already marks the parent that now holds it.
 */
function notifyOldWell(pin, oldParent) {
  if (!oldParent) return;
  const renderer = oldParent._renderer || pin._renderer || null;
  if (renderer && renderer.scopeWells) renderer.scopeWells.invalidate(oldParent);
  else syncScopePopulation(oldParent);
}
