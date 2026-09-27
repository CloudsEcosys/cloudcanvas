/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Focus & render-root navigation.
 *
 * The session owns the state (`focusedPin`, `focusStack`, `_forwardStack`, the
 * renderer); this module owns the transitions between states. Every entry
 * pushed onto either stack carries three things - the focused Pin, the camera,
 * and the *render root* - so traversing restores all three through one path.
 *
 * **Zooming into a Pin promotes it.** `focus()` makes the targeted Pin the new
 * render root: its subtree stays mounted, its full ancestor chain stays mounted
 * with it - that chain is the breadcrumb, and it is what keeps the scope above
 * navigable - and everything else demotes. That is what "zoom in" has always
 * meant on this canvas, and since 0.4.0 it is what the default does. `focus(pin, {promote: false})` is the
 * camera-only look, kept for chrome that wants to point the camera at something
 * without restructuring the canvas underneath it.
 *
 * **Back and forward are browser-shaped.** `popFocus()` pops the focus stack and
 * pushes what it left onto the forward stack; `goForward()` is its exact mirror.
 * Any *new* navigation invalidates the forward stack, which is the one rule that
 * keeps a history linear - and it is enforced in a single place, `focusPin`,
 * which every new navigation runs through and neither traversal does.
 */

import { CURSOR_FOCUS } from '../pins/cursor.js';
import { ELEVATED_CLASS, setElevationChain } from './elevation.js';

/** Camera framing used when the session has no measurable host element. */
export const DEFAULT_HOST_RECT = /* @__PURE__ */ Object.freeze({ width: 800, height: 600, left: 0, top: 0 });

/** Class that makes the focus veil opaque; the element lives on the session. */
export const VEIL_ACTIVE_CLASS = 'is-active';

/**
 * Resolve a Pin argument that may be an id, a Pin, or nothing.
 *
 * A utility Pin is never a navigation target: it has no element, no bounds worth
 * framing, and it is invisible to every query, so it can be neither focused,
 * stacked, nor promoted.
 */
function resolvePin(session, pinOrId) {
  if (!pinOrId) return null;
  const pin = typeof pinOrId === 'string' ? session.pinManager.getPin(pinOrId) : pinOrId;
  return pin && !pin.utility ? pin : null;
}

/**
 * Point the focus cursor at a Pin (or clear it).
 *
 * Focus state has one writer - this module - and the cursor is part of that
 * state, so every transition below sets it on the way through rather than
 * leaving the renderer to infer it.
 */
function setFocusCursor(session, pin) {
  if (typeof session.setCursorTarget !== 'function') return false;
  return session.setCursorTarget(CURSOR_FOCUS, pin || null);
}

/**
 * Move the focus presentation from one Pin to another.
 *
 * Three things travel together and must never disagree: the cursor, the
 * elevation chain (the focused Pin *and every scope above it*, or nothing
 * outranks a later-spawned root Pin), and the veil that dims what is left
 * behind. Every transition below routes through here, so "focused" has exactly
 * one visual definition.
 */
function setFocusPresentation(session, previous, next) {
  if (previous && previous !== next) setElevationChain(previous, ELEVATED_CLASS, false);
  if (next) setElevationChain(next, ELEVATED_CLASS, true);

  setFocusCursor(session, next);
  setFocusVeil(session, Boolean(next));
  return next;
}

/** Raise or drop the veil. Absent element (headless, unmounted) is a no-op. */
export function setFocusVeil(session, active) {
  const veil = session ? session.focusVeilElement : null;
  if (!veil || !veil.classList) return false;

  veil.classList.toggle(VEIL_ACTIVE_CLASS, Boolean(active));
  return true;
}

/** Snapshot of everything a traversal has to put back. */
function captureState(session) {
  return {
    focusedPin: session.focusedPin,
    viewport: {
      x: session.viewport.x,
      y: session.viewport.y,
      scale: session.viewport.scale
    },
    renderRoot: session.renderer.renderRoot || null
  };
}

/** The forward stack, created on first use so a bare session still navigates. */
function forwardStack(session) {
  if (!Array.isArray(session._forwardStack)) session._forwardStack = [];
  return session._forwardStack;
}

/** Whether there is a previous state to return to. */
export function canGoBack(session) {
  return Boolean(session) && session.focusStack.length > 0;
}

/** Whether a `popFocus` has left somewhere to go forward to. */
export function canGoForward(session) {
  return Boolean(session) && forwardStack(session).length > 0;
}

/**
 * Move focus to a Pin, framing it with its own focussable settings.
 *
 * This is where a *new* navigation is recognised, and so the one place the
 * forward stack is invalidated: `pushFocus`, `promoteToRoot` and `focusParent`
 * all end here, and `popFocus`/`goForward` deliberately do not.
 */
export function focusPin(session, pinOrId, options = {}) {
  const pin = resolvePin(session, pinOrId);
  if (!pin) return null;

  forwardStack(session).length = 0;

  const previous = session.focusedPin;
  if (previous && previous !== pin) {
    previous.setFocused(false, session);
  }

  session.focusedPin = pin;
  pin.setFocused(true, session);
  setFocusPresentation(session, previous, pin);

  // The Pin's focussable trait declares its framing; caller options win over it.
  const focussable = pin.traits.get('focussable');
  session.viewport.zoomToFit(pin.getGlobalBounds(), session.getHostRect(), {
    padding: focussable ? focussable.padding : undefined,
    maxZoom: focussable ? focussable.maxZoom : undefined,
    ...options
  });
  return pin;
}

/**
 * Zoom into a Pin: promote it to render root and focus it.
 *
 * The default outcome of "focus a Pin" is the whole gesture the canvas was built
 * around - the targeted Pin becomes the parent view, its siblings leave the
 * active set, and a breadcrumb is what leads back out. `{promote: false}` opts
 * out into the plain camera move, which is a strictly smaller thing.
 */
export function focus(session, pinOrId, options = {}) {
  if (options.promote === false) return focusPin(session, pinOrId, options);
  return promoteToRoot(session, pinOrId, options);
}

/**
 * Push the current view state and focus a Pin.
 * `options.promote` additionally makes it the render root.
 */
export function pushFocus(session, pinOrId, options = {}) {
  if (options.promote) return promoteToRoot(session, pinOrId, options);

  const pin = resolvePin(session, pinOrId);
  if (!pin) return null;

  session.focusStack.push(captureState(session));
  return focusPin(session, pin, options);
}

/**
 * Promote a Pin to render root and focus it.
 *
 * The outgoing state - including the outgoing render root - goes on the stack
 * first, so `popFocus` restores the previous scope with its siblings remounted
 * and every Pin's contents, traits and particle state intact.
 *
 * Re-promoting the Pin that is *already* focused as the root re-frames it and
 * stacks nothing: a second identical entry is a Back that goes nowhere, and
 * repeat activation (a second click, a second Enter) is exactly how one arrives.
 */
export function promoteToRoot(session, pinOrId, options = {}) {
  const pin = resolvePin(session, pinOrId);
  if (!pin) return null;

  const settled = session.renderer.renderRoot === pin && session.focusedPin === pin;
  if (!settled) session.focusStack.push(captureState(session));

  session.renderer.setRenderRoot(pin);
  return focusPin(session, pin, options);
}

/**
 * Pop the focus stack, restoring the previous focus, camera, and render root.
 * An empty stack means there is nothing above the canvas: reset instead.
 *
 * What is left behind goes onto the forward stack, so the step is reversible by
 * `goForward` until a new navigation invalidates it.
 */
export function popFocus(session, options = {}) {
  if (session.focusStack.length === 0) return unfocus(session, options);

  const previous = session.focusStack.pop();
  forwardStack(session).push(captureState(session));
  return restoreState(session, previous, options);
}

/**
 * Re-apply the state the last `popFocus` left behind - the mirror image of it,
 * down to stacking what it leaves so Back works again immediately.
 *
 * Named for the direction rather than the stack (`popFocus`'s counterpart would
 * be `unpopFocus`, which describes the machinery instead of the move) because
 * the pair this belongs to is Back and Forward, and that is what the menu, the
 * chrome and the user all call it.
 *
 * @returns {Pin|null} the restored focus, which is null at the canvas root
 */
export function goForward(session, options = {}) {
  const stack = forwardStack(session);
  if (stack.length === 0) return null;

  const next = stack.pop();
  session.focusStack.push(captureState(session));
  return restoreState(session, next, options);
}

/**
 * Put a captured state back: render root, focused Pin, presentation, camera.
 *
 * Shared by both traversals, which is what makes them symmetric rather than
 * merely similar - there is one definition of "restore", and Back and Forward
 * differ only in which stack the entry came off.
 */
function restoreState(session, entry, options = {}) {
  const outgoing = session.focusedPin;
  if (outgoing) {
    outgoing.setFocused(false, session);
  }

  session.renderer.setRenderRoot(entry.renderRoot || null);

  session.focusedPin = entry.focusedPin;
  if (session.focusedPin) {
    session.focusedPin.setFocused(true, session);
  }
  // Cursor, elevation and veil follow the restored focus, including back to nothing.
  setFocusPresentation(session, outgoing, session.focusedPin);

  session.viewport.animateTo(
    entry.viewport.x,
    entry.viewport.y,
    entry.viewport.scale,
    options
  );
  return session.focusedPin;
}

/** Drop all focus and promotion state, returning to the whole canvas. */
export function unfocus(session, options = {}) {
  const outgoing = session.focusedPin;
  if (outgoing) {
    outgoing.setFocused(false, session);
    session.focusedPin = null;
  }
  setFocusPresentation(session, outgoing, null);

  session.focusStack = [];
  forwardStack(session).length = 0;
  session.renderer.setRenderRoot(null);
  session.viewport.reset(options);
  return null;
}

/** Focus the parent scope of the focused Pin, or the canvas when there is none. */
export function focusParent(session, options = {}) {
  if (session.focusedPin && session.focusedPin.parent) {
    return focusPin(session, session.focusedPin.parent, options);
  }
  return unfocus(session, options);
}
