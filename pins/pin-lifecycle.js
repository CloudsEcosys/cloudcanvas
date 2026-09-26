/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Pin lifecycle: activation, focus, lazy provisioning, and the reconciliation
 * that settles a Pin into the DOM state its reload strategy prescribes.
 *
 * The policy - what a strategy *means* - lives in `./reload.js`; the DOM
 * mechanics live in `./pin-membership.js`. This module is the sequencing between
 * them: which trait hooks fire, how deactivation cascades, when the children
 * provider is asked to fill a scope.
 *
 * Every function takes the Pin as its first argument; `Pin` forwards to them.
 */
import { RELOAD_STRATEGIES, wakesWithParent } from './reload.js';
import { applyReloadMode, detachElement } from './pin-membership.js';
import { emitPinSignal } from './traits/base.js';

/**
 * Seed the reload strategy, activation flag, and lazy provisioning state.
 * A lazy Pin starts inactive unless `active: true` says otherwise.
 */
export function initReloadState(pin, options, reload) {
  pin.reload = reload;
  pin.active = options.active !== undefined
    ? Boolean(options.active)
    : reload !== RELOAD_STRATEGIES.LAZY;
  pin.isFocused = false;

  // `_provisioned` flips on first activation: from then on the Pin keeps its
  // element (dormant while inactive) until `unload()` re-arms the provider.
  pin._provisioned = pin.active && reload === RELOAD_STRATEGIES.LAZY;
  pin._childrenLoaded = false;
  pin._childrenLoading = null;
  pin.loadChildren = typeof options.loadChildren === 'function' ? options.loadChildren : null;

  // Lazy offload: opt-in DOM virtualization on the viewport axis, orthogonal to
  // the reload strategy above (see `../engine/offload.js`). `offload` is the
  // opt-in; `offloadMargin` is the per-Pin override of the session default (a
  // number, honoured even at zero); `_offloadDormant` is the live flag the
  // offload pass raises when the Pin has left the visible canvas.
  pin.offload = Boolean(options.offload);
  pin.offloadMargin = typeof options.offloadMargin === 'number' ? options.offloadMargin : null;
  pin._offloadDormant = false;
}

/**
 * Activate this Pin: run trait hooks, wake the subtree, provision a lazy
 * scope's children, and hand the resulting DOM state to the renderer.
 */
export function activate(pin, context) {
  if (pin.active) return;
  pin.active = true;
  if (pin.reload === RELOAD_STRATEGIES.LAZY) pin._provisioned = true;

  for (const trait of pin.traits.values()) {
    if (typeof trait.onActivate === 'function') {
      trait.onActivate(pin, context);
    }
  }

  // Wake the subtree; an unrequired lazy child stays asleep.
  for (const child of pin.children) {
    if (wakesWithParent(child)) {
      child.activate(context);
    }
  }

  pin._reconcile();
  // With a renderer attached the reconciliation flush owns content and
  // measurement; without one this is the only render this Pin will get.
  if (!pin._renderer) pin.render(context);

  provisionChildren(pin, context);

  // One signal per real activation (an already-active Pin returned above), so a
  // session observer sees exactly the Pins that woke this frame.
  emitPinSignal(pin, 'activate');
}

/**
 * Deactivate this Pin (sleep mode for off-screen / unfocused Pins).
 * The strategy decides what happens to the element: unmounted for `active`,
 * hidden for `persistent` and for a provisioned `lazy` Pin.
 */
export function deactivate(pin, context) {
  if (!pin.active) return;
  pin.active = false;

  for (const trait of pin.traits.values()) {
    if (typeof trait.onDeactivate === 'function') {
      trait.onDeactivate(pin, context);
    }
  }

  // Cascade first: every child settles into its own strategy's resting state
  // before this Pin's element is hidden or detached.
  for (const child of pin.children) {
    child.deactivate(context);
  }

  pin._reconcile();

  // The counterpart of the `activate` signal above, and for the same reason: a
  // session observer holding this Pin (an activation cursor) has to hear that it
  // went back to sleep, since sleep is invisible to anything watching positions.
  emitPinSignal(pin, 'deactivate');
}

/**
 * Ask the lazy-children provider to fill this scope. No-op for any other
 * strategy, and for Pins that belong to no manager (the provider is a
 * manager-level service).
 */
export function provisionChildren(pin, context) {
  if (pin.reload !== RELOAD_STRATEGIES.LAZY) return null;
  if (!pin._manager || typeof pin._manager.loadChildrenFor !== 'function') return null;
  return pin._manager.loadChildrenFor(pin, context);
}

/**
 * Drop everything the lazy provider produced and re-arm it.
 * The whole scope is cleared: a lazily provisioned Pin owns its children.
 *
 * @returns {number} how many child subtrees were destroyed
 */
export function unload(pin) {
  const removed = pin._manager && typeof pin._manager.removeSubtreeChildren === 'function'
    ? pin._manager.removeSubtreeChildren(pin)
    : destroyChildren(pin);

  pin._childrenLoaded = false;
  pin._childrenLoading = null;
  pin._provisioned = false;
  pin._reconcile();
  return removed;
}

/** Destroy every child locally (manager-less fallback for `unload`). */
export function destroyChildren(pin) {
  const children = Array.from(pin.children);
  for (const child of children) {
    child.destroy();
  }
  return children.length;
}

/**
 * Bring this Pin's DOM membership in line with its reload strategy.
 * With a renderer attached the work is queued for the next frame's structure
 * flush; otherwise it happens synchronously, so unattached Pins keep working.
 */
export function reconcile(pin) {
  if (pin._renderer) {
    pin._renderer.reconcile(pin);
    return false;
  }
  return applyReloadMode(pin);
}

/**
 * Focus (or unfocus) this Pin: mark the element, run the trait hooks, and - on
 * focus - treat it as an activation trigger for this Pin and its scope.
 */
export function setFocused(pin, focused, session) {
  pin.isFocused = Boolean(focused);

  if (pin.element && pin.element.classList) {
    if (pin.isFocused) pin.element.classList.add('is-focused');
    else pin.element.classList.remove('is-focused');
  }

  for (const trait of pin.traits.values()) {
    if (pin.isFocused && typeof trait.onFocus === 'function') {
      trait.onFocus(pin, session);
    } else if (!pin.isFocused && typeof trait.onUnfocus === 'function') {
      trait.onUnfocus(pin, session);
    }
  }

  if (!pin.isFocused) return;

  // Focus is an activation trigger: it provisions a lazy Pin's own scope.
  pin.activate(session);
  provisionChildren(pin, session);

  // Direct children wake with the parent, except unrequired lazy ones - those
  // are provisioned only when they are themselves required.
  for (const child of pin.children) {
    if (wakesWithParent(child)) child.activate(session);
  }
}

/**
 * Tear a Pin down: the end of the lifecycle this module owns the rest of.
 *
 * Order is the whole of it. An edit lock still held is released first: `'edit'`
 * is a *paired* signal (`./pin-edit.js`), and a Pin that dies mid-edit without
 * closing it leaves whatever the true half opened - the announcer's "Editing X",
 * an editing affordance in the page's own chrome - open against a Pin that no
 * longer exists. The `'destroy'` signal goes next, while the manager is still
 * listening, so whatever holds a reference to this Pin - a cursor pointing at
 * it - gets to let go. Then the subtree, the traits' own `onDetach`, the
 * renderer (which still reads `parent` to invalidate the well above), the
 * element - detached outright, which is what ends the parent link - and
 * finally the manager's indices.
 *
 * @returns {Pin} the Pin, now detached from everything
 */
export function destroy(pin) {
  // The replay `endEdit` may owe is a content invalidation, which the renderer
  // drops again at `forget` below: a dying Pin repaints nothing.
  pin.endEdit();
  emitPinSignal(pin, 'destroy');

  for (const child of Array.from(pin.children)) {
    child.destroy();
  }

  for (const trait of pin.traits.values()) {
    if (typeof trait.onDetach === 'function') trait.onDetach(pin);
  }
  pin.traits.clear();

  if (pin._renderer) pin._renderer.forget(pin);
  detachElement(pin);
  if (pin._manager) pin._manager.reindexPin(pin);

  return pin;
}
