/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Pin DOM membership: where a Pin's element goes, and how it leaves.
 *
 * Two ways out, and the difference is the hierarchy. An element that *unmounts*
 * (sleep, offload, demotion) is parked behind a Comment anchor, so the Pin keeps
 * its parent, its place among its siblings, and comes back to the same spot
 * (`../core/park.js`). An element that is *detached* (`removeChild`, `destroy`)
 * leaves the tree entirely, anchor and all - that is what ends the parent link.
 *
 * Nothing here decides *whether* a Pin should be mounted - that is reload policy
 * (`./reload.js`). Every function takes the Pin as its first argument.
 */
import { stateOf } from '../core/state.js';
import { detach, park, place } from '../core/park.js';
import { DORMANT_CLASS, RELOAD_MODES, resolveReloadMode } from './reload.js';
import { SCOPE_POPULATED_CLASS } from './pin-element.js';

/** Put the element in `container` (back at its anchor when that is where it was). */
export function placeElement(pin, container) {
  if (!container || !pin.element) return false;
  return place(stateOf(pin.element), container);
}

/** Append into `parentContainer`, then measure and render in place. */
export function mountInto(pin, parentContainer) {
  if (!parentContainer || !pin.element) return;

  placeElement(pin, parentContainer);
  pin.syncDimensions();
  pin.render();
}

/** Park the element: out of the document, its place and ancestry kept. The Pin's state is untouched. */
export function unmountElement(pin) {
  if (!pin.element) return false;
  return park(stateOf(pin.element));
}

/** Leave the tree entirely: the element out and no anchor left, so the parent link ends here. */
export function detachElement(pin) {
  if (!pin.element) return false;
  return detach(stateOf(pin.element));
}

/** Synchronous mount / hide / unmount with no renderer; a utility Pin's node stays detached. */
export function applyReloadMode(pin) {
  if (!pin.element || pin.utility) return false;

  const mode = resolveReloadMode(pin);
  const classList = pin.element.classList || null;

  if (mode === RELOAD_MODES.UNMOUNTED) {
    if (classList) classList.remove(DORMANT_CLASS);
    pin.unmount();
    return syncScopeWells(pin);
  }

  if (classList) {
    if (mode === RELOAD_MODES.DORMANT) classList.add(DORMANT_CLASS);
    else classList.remove(DORMANT_CLASS);
  }

  const container = reloadContainer(pin);
  if (container && pin.element.parentNode !== container) {
    // A dormant Pin is placed without rendering: it is asleep, not stale.
    if (mode === RELOAD_MODES.DORMANT) placeElement(pin, container);
    else pin.mount(container);
  }

  return syncScopeWells(pin);
}

/**
 * The renderer-less mirror of the renderer's `ScopeWellPass`.
 *
 * A Pin with no renderer applies its reload mode synchronously, so the wells it
 * just changed have to be brought along in the same call - both the one above it
 * (which gained or lost an occupant) and its own (whose children may have moved
 * with it). Only the population flag is mirrored: sizing needs measured
 * geometry, which is exactly what a Pin without a renderer does not batch.
 *
 * @returns {boolean} always true; the caller's contract is "handled"
 */
function syncScopeWells(pin) {
  syncScopePopulation(pin);
  syncScopePopulation(pin.parent);
  return true;
}

/**
 * Toggle `cc-populated` from the scope container's own DOM.
 *
 * Read from the element rather than the Pin graph, because this path also
 * serves Pins whose scope holds markup the graph never registered. An anchor
 * is a Comment, not an element, so a parked child does not populate the well.
 *
 * @returns {boolean} whether the well ended up populated
 */
export function syncScopePopulation(pin) {
  const scope = pin ? pin.scopeElement : null;
  if (!scope || !scope.classList) return false;

  let populated = false;
  for (const node of scope.children) {
    if (node.classList && !node.classList.contains(DORMANT_CLASS)) {
      populated = true;
      break;
    }
  }

  scope.classList.toggle(SCOPE_POPULATED_CLASS, populated);
  return populated;
}

/** Where this Pin's element belongs: the parent scope, its current (or parked) host, or the manager's container. */
export function reloadContainer(pin) {
  if (pin.parent) return pin.parent.getOrCreateScopeElement();

  const state = pin.element ? stateOf(pin.element) : null;
  const held = state && state.anchor ? state.anchor.parentNode : null;
  if (held) return held;
  if (pin.element && pin.element.parentNode) return pin.element.parentNode;
  return pin._manager ? pin._manager.container : null;
}
