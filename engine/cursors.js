/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The session's side of the cursor system.
 *
 * `src/pins/cursor.js` owns what a cursor *is* - the utility Pin, the traits,
 * the overlay drawing. This module owns when the session builds it, how Pin
 * signals become cursor targets, and where the redraw sits in the frame. The
 * session keeps thin forwarding methods, exactly as it does for navigation.
 *
 * Cursor state has a single writer. Focus is written by `./navigation.js`,
 * because focus is already session state; selection and activation arrive as Pin
 * signals (`../pins/traits/base.js`) that the manager re-broadcasts, and
 * `handlePinSignal` below is the one place they are turned into targets. There
 * is no polling and no second route.
 */
import {
  CURSOR_ACTIVATED,
  CURSOR_SELECTED,
  createCursorPin,
  renderCursors
} from '../pins/cursor.js';

/**
 * Build the cursor Pin into the freshly mounted overlay and subscribe to the Pin
 * signals that move its targets.
 *
 * A re-mounted session gets a new overlay, so the previous cursor Pin - and the
 * groups it owned in the old one - go with it.
 *
 * @returns {Pin|null} the session's cursor Pin
 */
export function mountCursors(session) {
  destroyCursors(session);
  session.cursorPin = createCursorPin(session);
  session._unsubscribeSignals = session.pinManager.onSignal(session._onPinSignal);
  // A fresh cursor Pin draws on the next frame; ask for one.
  session.renderer.wake();
  return session.cursorPin;
}

/**
 * Rebuild the cursor Pin from the registry, keeping the targets it was on.
 *
 * A cursor is a registry definition, so re-registering one only changes what the
 * *next* cursor Pin is built from. This is the one call that makes a reskin take
 * effect on a live session: same targets, new traits, new drawings.
 *
 * @returns {Pin|null} the rebuilt cursor Pin
 */
export function remountCursors(session) {
  const targets = captureTargets(session);
  mountCursors(session);

  for (const [name, pin] of targets) {
    setCursorTarget(session, name, pin);
  }
  return session.cursorPin;
}

/** The current cursor targets, by trait name; empty before the first mount. */
function captureTargets(session) {
  const targets = new Map();
  if (!session.cursorPin) return targets;

  for (const [name, trait] of session.cursorPin.traits) {
    if (typeof trait.setTarget === 'function' && trait.target) {
      targets.set(name, trait.target);
    }
  }
  return targets;
}

/** Retire the cursor Pin and stop observing Pin signals. */
export function destroyCursors(session) {
  if (session._unsubscribeSignals) {
    session._unsubscribeSignals();
    session._unsubscribeSignals = null;
  }
  if (session.cursorPin) {
    session.pinManager.removePin(session.cursorPin.id);
    session.cursorPin = null;
  }
  return null;
}

/**
 * Turn one Pin signal into cursor state.
 *
 * `activate` always claims the activation cursor - it is by definition the most
 * recent activation - and `deactivate` releases it, because a Pin that went back
 * to sleep has stopped being an activated Pin at all. `select` claims the
 * selection cursor when it announces a selection, and releases it only when the
 * Pin being deselected is the one the cursor is actually on.
 *
 * Deactivation and deselection release; being hidden does not. A Pin that merely
 * left the screen (unmounted, demoted out of the render root) keeps its cursor
 * and only loses the drawing - see `CursorTrait.visibleTarget`.
 *
 * @returns {boolean} true when a cursor target changed
 */
export function handlePinSignal(session, event) {
  const pin = event && event.detail ? event.detail.source : null;
  if (!pin || pin.utility) return false;

  if (event.type === 'destroy') return releaseCursorsFor(session, pin);
  if (event.type === 'activate') {
    return setCursorTarget(session, CURSOR_ACTIVATED, pin);
  }
  if (event.type === 'deactivate') {
    return releaseCursorIfOn(session, CURSOR_ACTIVATED, pin);
  }
  if (event.type !== 'select') return false;

  if (event.payload) return setCursorTarget(session, CURSOR_SELECTED, pin);
  return releaseCursorIfOn(session, CURSOR_SELECTED, pin);
}

/** Clear one cursor, but only when it is the given Pin it is holding. */
function releaseCursorIfOn(session, name, pin) {
  if (getCursorTarget(session, name) !== pin) return false;
  return setCursorTarget(session, name, null);
}

/**
 * Point a cursor at a Pin, or clear it with `null`.
 * @returns {boolean} true when the target changed
 */
export function setCursorTarget(session, name, pin) {
  const trait = cursorTrait(session, name);
  if (!trait || typeof trait.setTarget !== 'function') return false;
  if (!trait.setTarget(pin || null)) return false;
  // A moved target is redrawn by the cursor pass, in the frame this asks for.
  session.renderer.wake();
  return true;
}

/** The Pin a cursor currently points at, or null. */
export function getCursorTarget(session, name) {
  const trait = cursorTrait(session, name);
  return trait ? trait.target : null;
}

/**
 * Let go of a Pin that is being destroyed.
 *
 * A cursor holds a direct reference to its target, so without this a removed Pin
 * would be kept alive by the cursor and its last drawing would hang in the
 * overlay for as long as nothing else moved.
 *
 * @returns {boolean} true when at least one cursor was cleared
 */
function releaseCursorsFor(session, pin) {
  if (!session.cursorPin) return false;

  let released = false;
  for (const trait of session.cursorPin.traits.values()) {
    if (typeof trait.setTarget !== 'function' || trait.target !== pin) continue;
    released = trait.setTarget(null) || released;
  }
  if (released) session.renderer.wake();
  return released;
}

/** One cursor trait off the session's cursor Pin, or null before it is mounted. */
function cursorTrait(session, name) {
  return session.cursorPin ? session.cursorPin.traits.get(name) : null;
}

/**
 * Redraw the cursors whose target, camera, or target geometry moved.
 *
 * Runs after the renderer's frame, so it sees final geometry, and while that
 * frame's dirt is still readable - `renderer.isGlobalDirty` is the same gate the
 * per-trait SVG groups use, so both passes agree on what moved.
 *
 * @returns {number} how many cursors were rewritten
 */
export function renderSessionCursors(session, context) {
  if (!session.cursorPin) return 0;

  return renderCursors(session.cursorPin, {
    context,
    viewportVersion: session.renderer.viewportVersion,
    isDirty: session._cursorDirty
  });
}
