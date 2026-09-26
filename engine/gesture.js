/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Gesture state: the pointer stream's ownership, the pinch, and the end of a
 * drag.
 *
 * `./pointer.js` is the DOM's door - it decides *what* an event is (a Pin
 * gesture, a camera gesture, a wheel) and routes it. This module is the state
 * machine underneath that decision: who holds the pointer stream, what the two
 * live contacts of a pinch were last measured as, and how a gesture ends when
 * nothing ends it. The split is the same one `./frame.js` draws against the
 * session - the door stays readable, the machinery stays testable.
 *
 * The session owns the *fields* (`activeDragPin`, `isPanning`, `lastPointer`,
 * `activePointers`, `pinch`, `_pendingCapture`); every function here takes the
 * session as its first argument and moves them.
 */

import { DRAG_CHAIN_CLASS, setElevationChain } from './elevation.js';
import { isControlTarget } from '../pins/pin-element.js';
import { DRAG_THRESHOLD_PX } from '../pins/traits/interaction.js';
import { createLogger } from '../log.js';

const logger = createLogger('gesture');

/**
 * Property set on a `pointerdown` that landed inside a Pin's selectable text.
 *
 * The event is the carrier because the decision has to travel from the router -
 * the only place that knows *where* the press landed in the document - to a
 * trait that is handed nothing but the Pin and the event. `DraggableTrait` reads
 * it and stands down, so the press places a caret instead of starting a drag.
 */
export const TEXT_REGION_FLAG = '_ccTextRegion';

/* ------------------ PINCH MATHS (pure) ------------------ */

/**
 * The pinch invariants of two live pointers: their separation and midpoint.
 *
 * @param {Array<{x: number, y: number}>} points at least two pointer positions
 * @returns {{dist: number, midX: number, midY: number}|null}
 */
export function pinchStateFrom(points) {
  if (!Array.isArray(points) || points.length < 2) return null;

  const [a, b] = points;
  return {
    dist: Math.hypot(b.x - a.x, b.y - a.y),
    midX: (a.x + b.x) / 2,
    midY: (a.y + b.y) / 2
  };
}

/** Every live gesture pointer, in the order it went down. */
function pointerPoints(session) {
  return Array.from(session.activePointers.values());
}

/** The host box, re-read per gesture event: cheap, and scroll makes it move. */
export function hostRectOf(session) {
  return session.hostElement.getBoundingClientRect();
}

/* ------------------ POINTER CAPTURE ------------------ */

/**
 * Whether a gesture started on a control the platform must keep.
 *
 * The selector itself lives with the other "where in a Pin did this land"
 * predicates (`CONTROL_SELECTOR` in `../pins/pin-element.js`), because
 * `DraggableTrait` draws the same line and there may only be one list.
 */
export function startsOnControl(event) {
  return isControlTarget(event ? event.target : null);
}

/**
 * Route one pointer's stream to the host.
 *
 * Best-effort by design: happy-dom implements no capture semantics and a
 * browser throws for an id that is no longer active. The window listeners
 * remain the delivery path either way, so a failure costs nothing.
 *
 * @returns {boolean} true when the host actually took the stream
 */
function capturePointerId(session, pointerId) {
  const host = session.hostElement;
  if (!host || typeof host.setPointerCapture !== 'function') return false;
  if (pointerId === undefined) return false;

  try {
    host.setPointerCapture(pointerId);
    return true;
  } catch (error) {
    logger.debug(`setPointerCapture(${pointerId}) refused`, error);
    return false;
  }
}

/**
 * Arm the capture decision without taking it.
 *
 * Capture is *deferred to the drag threshold*, because taking it at the press
 * retargets the whole rest of the stream - `pointerup`, the compatibility
 * `mouseup`, and therefore the `click` and `dblclick` computed from them - to
 * the host. A press that turns out to be a click then reaches nothing inside
 * the Pin: not the card template's own action button, not a `dblclick` listener
 * on the Pin itself. Deferring costs nothing, because the window listeners
 * (`./host.js`) are what deliver a gesture that leaves the box anyway; capture
 * only buys the stream back from an iframe or a cross-window drag, and that
 * only matters once the gesture is a real drag.
 *
 * `declined` is decided here and never revisited: a gesture that started on a
 * control or in selectable text must keep its native stream for the whole of
 * its life (the browser drives a text selection from the moves it delivers to
 * the text, and a retargeted `mouseup` is a button that cannot be pressed).
 *
 * @returns {{pointerId: number, x: number, y: number, declined: boolean}}
 */
export function armCapture(session, event) {
  session._pendingCapture = {
    pointerId: event.pointerId,
    x: Number(event.clientX),
    y: Number(event.clientY),
    declined: startsOnControl(event) || event[TEXT_REGION_FLAG] === true
  };
  return session._pendingCapture;
}

/**
 * Take the deferred capture, once this move proves the gesture is a drag.
 *
 * The threshold is `DRAG_THRESHOLD_PX`, imported from the trait that owns it
 * (`../pins/traits/interaction.js`) rather than restated: capture and
 * translation have to start on the same move, or a drag exists that the host
 * never took the stream for.
 *
 * The gate is one-shot in both directions - taken or declined, the pending
 * record is gone and the rest of the gesture asks nothing further.
 *
 * @returns {boolean} true when the stream was taken on this move
 */
export function takeDeferredCapture(session, event) {
  const pending = session._pendingCapture;
  if (!pending || pending.declined) return false;
  if (pending.pointerId !== event.pointerId) return false;

  const travel = Math.hypot(event.clientX - pending.x, event.clientY - pending.y);
  // NaN travel (a synthetic event with no coordinates) is not proof of a drag;
  // the window listeners deliver it regardless.
  if (!(travel > DRAG_THRESHOLD_PX)) return false;

  session._pendingCapture = null;
  return capturePointerId(session, event.pointerId);
}

/** Hand the pointer stream back, under the same guards as the capture. */
export function releasePointer(session, event) {
  const host = session.hostElement;
  const id = event ? event.pointerId : undefined;
  if (!host || id === undefined) return false;
  if (typeof host.releasePointerCapture !== 'function') return false;

  try {
    if (typeof host.hasPointerCapture === 'function' && !host.hasPointerCapture(id)) return false;
    host.releasePointerCapture(id);
    return true;
  } catch (error) {
    logger.debug(`releasePointerCapture(${id}) refused`, error);
    return false;
  }
}

/* ------------------ PINCH TRANSITIONS ------------------ */

/**
 * A second finger converts whatever was running into a pinch: a two-pointer
 * gesture is a camera gesture, so any Pin drag and any pan is ended first.
 *
 * Both contacts are captured immediately, and unconditionally. A pinch is a
 * drag by definition - there is no click to preserve, no threshold to wait for,
 * and losing either finger to an element that scrolls out from under it turns a
 * zoom into a jump. The deferred gate is closed with them.
 */
export function beginPinch(session) {
  cancelDrag(session);
  session.isPanning = false;
  for (const pointerId of session.activePointers.keys()) {
    capturePointerId(session, pointerId);
  }
  session._pendingCapture = null;
  session.pinch = pinchStateFrom(pointerPoints(session));
  return session.pinch;
}

/**
 * Apply one pinch step: scale by the change in separation, then follow the
 * midpoint.
 *
 * The zoom is anchored at the *previous* midpoint, which is the only focal
 * point that keeps both fingers glued to the content beneath them - anchoring
 * at the new midpoint would double-count the translation.
 */
export function updatePinch(session) {
  const previous = session.pinch;
  const next = pinchStateFrom(pointerPoints(session));
  if (!next) {
    session.pinch = null;
    return false;
  }

  const hostRect = hostRectOf(session);
  if (previous.dist > 0 && next.dist > 0) {
    session.viewport.zoomAt(
      next.dist / previous.dist,
      previous.midX - hostRect.left,
      previous.midY - hostRect.top
    );
  }

  session.viewport.panBy(next.midX - previous.midX, next.midY - previous.midY);
  session.pinch = next;
  return true;
}

/**
 * A finger left a pinch. Two or more remain: re-seed from the survivors so the
 * next step measures no jump. One remains: the gesture degrades to a pan from
 * wherever that finger currently is.
 *
 * @returns {boolean} true when the lift was absorbed by the pinch
 */
export function endPinch(session) {
  if (session.activePointers.size >= 2) {
    session.pinch = pinchStateFrom(pointerPoints(session));
    return true;
  }

  session.pinch = null;
  const [survivor] = pointerPoints(session);
  if (!survivor) return false;

  session.lastPointer = { x: survivor.x, y: survivor.y };
  session.isPanning = true;
  return true;
}

/* ------------------ ENDING A GESTURE ------------------ */

/**
 * End the active drag without a pointer event.
 *
 * The renderer calls this when the dragged Pin's element leaves the document
 * (root promotion, deactivation): a gesture cannot continue against an element
 * that is no longer there.
 *
 * @returns {Pin|null} the Pin whose drag was cancelled
 */
export function cancelDrag(session) {
  session._pendingCapture = null;

  const pin = session.activeDragPin;
  if (!pin) return null;

  session.activeDragPin = null;
  setElevationChain(pin, DRAG_CHAIN_CLASS, false);
  const draggable = pin.traits.get('draggable');
  if (draggable && typeof draggable.onPointerUp === 'function') {
    draggable.onPointerUp(pin);
  }
  return pin;
}

/** Whether a camera or Pin gesture is currently running. */
export function isGestureActive(session) {
  return Boolean(session.isPanning || session.activeDragPin || session.pinch);
}

/**
 * Abandon every gesture and forget every pointer, as a `pointercancel` for all
 * of them at once. Used when the platform takes the input stream away.
 */
export function cancelGesture(session) {
  cancelDrag(session);
  session.pinch = null;
  session.isPanning = false;
  session.activePointers.clear();
  session._pendingCapture = null;
  return true;
}
