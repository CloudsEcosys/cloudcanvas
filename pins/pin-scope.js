/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Pin scope chain: the parent walk, and everything that travels along it.
 *
 * Two halves of one structure - breadcrumb/ancestor access, and the event
 * transmission that bubbles up the same chain natively, Pin element to Pin
 * element (normalising anything transmittable into the event that makes the trip).
 *
 * `PinEvent` and the trait `onTransmit` contract live in `./traits/base.js`;
 * this module is only the Pin's transport. Every function takes the Pin as its
 * first argument.
 */
import { MAX_DEPTH } from '../core/state.js';
import { PinEvent, DEFAULT_EVENT_TYPE } from './traits.js';
import { pinOf } from './pin-hierarchy.js';
import { wakesWithParent } from './reload.js';
import { syncFlowChild } from './pin-element.js';
import { detachElement, placeElement } from './pin-membership.js';

/**
 * Normalise anything transmittable into the event that will travel the scope chain.
 *
 * Foreign `Event` instances are wrapped, never mutated. Legacy duck-typed event
 * objects (a plain object carrying a string `type`) are passed through untouched,
 * so user-defined event classes keep working; they simply skip native dispatch.
 */
export function normalizeTransmitEvent(pin, event) {
  if (typeof event === 'string') {
    return new PinEvent(event, { source: pin });
  }

  if (event instanceof PinEvent) {
    if (event.detail && !event.detail.source) event.detail.source = pin;
    return event;
  }

  if (typeof Event !== 'undefined' && event instanceof Event) {
    return wrapForeignEvent(event);
  }

  if (event && typeof event === 'object' && typeof event.type === 'string') {
    return event;
  }

  return new PinEvent(DEFAULT_EVENT_TYPE, { payload: event, source: pin });
}

/** Copy a foreign Event into a PinEvent; the original is kept in `detail.source`. */
export function wrapForeignEvent(event) {
  const detail = event.detail;
  let payload = null;
  if (detail && typeof detail === 'object' && 'payload' in detail) {
    payload = detail.payload;
  } else if (detail !== undefined && detail !== null) {
    payload = detail;
  } else if (event.payload !== undefined) {
    payload = event.payload;
  }

  return new PinEvent(event.type, {
    payload,
    bubbles: event.bubbles !== false,
    source: event
  });
}

/** @type {WeakMap<Event, {context: object, results: Array}>} the transmits under way */
const IN_FLIGHT = /* @__PURE__ */ new WeakMap();

/**
 * Transmit an event through a Pin and up its scope chain.
 *
 * One native dispatch, on the Pin's element with the event's own `bubbles`: the
 * browser carries it up the DOM, and the Pin elements above are the scope chain.
 * At every Pin the core listener (`onTransmitted`, installed ahead of any Pin
 * listener) runs the trait `onTransmit` hooks first, then the node's own
 * listeners run natively. Bubbling ends where a listener stopped it, at the
 * first Pin above a cancelled node (that node's own listeners still ran), or at
 * the top Pin, which stops it so nothing reaches the host or the document.
 *
 * Native listeners are typed, so the core listener is installed per event type
 * at first sight: by `Pin.addEventListener` (before the caller's listener), here
 * on the source, and on each parent as the event passes its child. A listener
 * added straight on the element before any of those precedes the hooks at that
 * node - listen through the Pin to keep hooks first. A parked element's tree
 * ends at the park: an event from a parked subtree stops at its top, exactly as
 * a core `emit` does.
 *
 * A legacy duck-typed event (a plain object with a string `type`) is not an
 * `Event` and cannot be dispatched; it walks the hooks by hand and never reaches
 * a native listener.
 *
 * @returns {Array} every trait hook result collected along the walk, in order
 */
export function transmit(pin, event, context = {}) {
  const evt = normalizeTransmitEvent(pin, event);
  if (typeof Event === 'undefined' || !(evt instanceof Event)) {
    return walkHooks(pin, evt, context);
  }

  const flight = { context, results: [] };
  hookElement(pin.element, evt.type);
  IN_FLIGHT.set(evt, flight);
  try {
    pin.element.dispatchEvent(evt);
  } finally {
    IN_FLIGHT.delete(evt);
  }
  return flight.results;
}

/**
 * Put the core listener for `type` on a Pin element. One function object per
 * type, so the DOM keeps a single registration and its first position.
 */
export function hookElement(element, type) {
  if (element) element.addEventListener(type, onTransmitted);
}

/**
 * The core listener: first at every Pin an in-flight event reaches. Anything
 * not sent through `transmit` (a raw DOM event, a `dispatchEvent`) passes by.
 */
function onTransmitted(event) {
  const flight = IN_FLIGHT.get(event);
  if (!flight) return;

  const at = event.currentTarget;
  const node = pinOf(at) || at;
  if (!node || !(node.traits instanceof Map)) return;

  if (event.defaultPrevented) {
    event.stopImmediatePropagation();
    return;
  }

  runHooks(node, event, flight.context, flight.results);

  const parent = event.bubbles ? node.parent : null;
  if (parent) hookElement(parent.element, event.type);
  else event.stopPropagation();
}

/** Run every trait `onTransmit` hook on `node`, collecting the results in order. */
function runHooks(node, event, context, results) {
  for (const trait of node.traits.values()) {
    if (typeof trait.onTransmit === 'function') {
      results.push(trait.onTransmit(node, event, context));
    }
  }
}

/** The hooks-only walk for a non-`Event` object: up the parents, stopping as `transmit` would. */
function walkHooks(pin, evt, context) {
  const results = [];
  let node = pin;
  for (let depth = 0; node && depth < MAX_DEPTH; depth += 1) {
    runHooks(node, evt, context, results);
    if (!evt.bubbles || evt.cancelled || evt.cancelBubble) break;
    node = node.parent;
  }
  return results;
}

/** Parent chain, nearest first: [parent, grandparent, ... root]. */
export function ancestorsOf(pin) {
  const chain = [];
  let node = pin.parent;
  while (node && !chain.includes(node)) {
    chain.push(node);
    node = node.parent;
  }
  return chain;
}

/** Nearest ancestor's trait instance (never this pin's own), or null. */
export function scopeTrait(pin, name) {
  for (const ancestor of pin.ancestors()) {
    const trait = ancestor.traits.get(name);
    if (trait) return trait;
  }
  return null;
}

/**
 * Read a value off the nearest ancestor trait that defines it.
 * Opt-in per call: nothing is cached, merged, or inherited automatically.
 */
export function deriveFromScope(pin, traitName, key) {
  for (const ancestor of pin.ancestors()) {
    const trait = ancestor.traits.get(traitName);
    if (!trait) continue;
    if (trait[key] !== undefined) return trait[key];
    const fromOptions = trait.options ? trait.options[key] : undefined;
    if (fromOptions !== undefined) return fromOptions;
  }
  return undefined;
}

/* ------------------ MEMBERSHIP ------------------ */

/**
 * Link a child Pin into this Pin's scope.
 *
 * The link *is* the DOM move: the child's element goes into this Pin's scope
 * container now, so `parent` and `children` answer from the tree at once. Three
 * things follow, and none of them is "render it": a child added into a live
 * scope joins the same renderer (so it gets per-frame position writes without
 * the parent re-rendering it), it wakes with an already awake parent if its
 * strategy says so, and it then settles into whatever DOM state *its own*
 * reload strategy asks for - a lazy child is parked behind its anchor until it
 * is required, still in place, still this Pin's child.
 *
 * The caller has already established that `childPin` is a Pin other than
 * `pin` - that guard stays in `./pin.js`, where the class is.
 *
 * @returns {Pin} the child
 */
export function addChild(pin, childPin) {
  if (childPin.parent && childPin.parent !== pin) {
    childPin.parent.removeChild(childPin);
  }

  // Structure is synchronous; whether the element stays mounted or is parked
  // there is the reload mode's call, made by the next structure flush
  // (`../engine/mounting.js`) or the `_reconcile` below.
  placeElement(childPin, pin.getOrCreateScopeElement());

  // Offload is a root-only concept: only root Pins are individually
  // visibility-tested by the offload sweep (`../engine/offload.js`), which skips
  // anything with a parent. A nested Pin's DOM membership follows its root's
  // activate/deactivate cascade instead. So a `_offloadDormant` flag left over
  // from this Pin's time as a root would strand it forever - `resolveRenderMode`
  // short-circuits an offload-dormant Pin to `unmounted`, and the sweep never
  // revisits a non-root Pin to lower the flag again. Clearing it here holds the
  // invariant "a Pin with a parent never carries `_offloadDormant`" for *every*
  // path that gives a Pin a parent, not just `reparentPin`. The reload mode is
  // re-resolved on the next structure flush by the `_reconcile` below.
  childPin._offloadDormant = false;

  if (pin._renderer && !childPin._renderer) {
    pin._renderer.attach(childPin);
  }
  if (pin.active && wakesWithParent(childPin)) {
    childPin.activate();
  }

  // A child of a flow container (`layout !== 'free'`) is laid out by flex/grid,
  // not by its transform: flag it so it drops to `position: relative` and the
  // renderer stops writing it one. Runs after the renderer attach above, so the
  // applied-position cache reset inside can reach it. A child of a free parent -
  // the overwhelming default - clears the flag and is otherwise untouched.
  syncFlowChild(childPin);

  childPin._reconcile();
  return childPin;
}

/**
 * Unlink a child Pin: its element leaves this Pin's scope entirely (no anchor),
 * which is what ends the parent link.
 */
export function removeChild(pin, childPin) {
  if (!childPin || childPin.parent !== pin) return false;

  detachElement(childPin);
  // No parent means no flow: drop the `is-flow-child` class, so a Pin pulled out
  // of a flow container is a free, transform-placed Pin again.
  syncFlowChild(childPin);
  return true;
}
