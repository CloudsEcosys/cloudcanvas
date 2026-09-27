/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Pointer routing: how a raw DOM gesture becomes trait work.
 *
 * This module is the DOM's door. One rule runs through all of it: a pointer
 * event that lands on a Pin is delegated to that Pin's traits and never
 * interpreted here, and a pointer event that lands on nothing is a camera
 * gesture. No trait registers a DOM listener of its own.
 *
 * What the door decides, the machinery below it carries out: the gesture state
 * machine - pointer capture, the pinch, the end of a drag - lives in
 * `./gesture.js`, and the wheel maths in `./wheel.js`. Both are re-exported
 * here, because `pointer.js` is the module the gesture layer is addressed by
 * and the split is an implementation detail. The secondary button is routed the
 * same way: the door resolves *where* the click landed, and `./context-menu.js`
 * decides whether anything applies there.
 *
 * Every function takes the session as its first argument; the session keeps the
 * bound handlers, because those are what `addEventListener` holds.
 */

import { DRAG_CHAIN_CLASS, setElevationChain } from './elevation.js';
import { openContextMenu } from './context-menu.js';
import { isTextRegionTarget } from '../pins/pin-element.js';
import {
  TEXT_REGION_FLAG,
  armCapture,
  beginPinch,
  cancelDrag,
  cancelGesture,
  endPinch,
  hostRectOf,
  isGestureActive,
  releasePointer,
  takeDeferredCapture,
  updatePinch
} from './gesture.js';
import {
  PINCH_ZOOM_K,
  WHEEL_ZOOM_K,
  isDiscreteWheel,
  normalizeWheelDeltas,
  wheelZoomFactor
} from './wheel.js';

export {
  TEXT_REGION_FLAG,
  cancelDrag,
  cancelGesture,
  isGestureActive,
  pinchStateFrom,
  startsOnControl
} from './gesture.js';

export {
  DISCRETE_WHEEL_MIN_PX,
  LINE_HEIGHT_PX,
  MAX_WHEEL_DELTA_PX,
  PAGE_HEIGHT_FALLBACK_PX,
  PINCH_ZOOM_K,
  WHEEL_ZOOM_K,
  isDiscreteWheel,
  normalizeWheelDeltas,
  wheelPixelsPerUnit,
  wheelZoomFactor
} from './wheel.js';

/** Class marking a Pin's root element in the document. */
const PIN_SELECTOR = '.cloudcanvas-pin';

/* ------------------ EVENT PLUMBING ------------------ */

/** Run one pointer hook across every trait of a Pin. */
function routeToTraits(session, pin, hook, event) {
  for (const trait of pin.traits.values()) {
    if (typeof trait[hook] === 'function') {
      trait[hook](pin, event, session);
    }
  }
  return pin;
}

/** The Pin an event landed on, or null when it landed on the canvas. */
function pinForEvent(session, event) {
  const element = event.target && event.target.closest
    ? event.target.closest(PIN_SELECTOR)
    : null;
  const id = element ? element.getAttribute('data-pin-id') : null;
  return id ? session.pinManager.getPin(id) : null;
}

/**
 * A gesture starts on the primary pointer's main button only. Secondary
 * buttons raise menus, and a non-primary pointer is not a gesture of its own.
 */
function isPrimaryGesture(event) {
  return event.isPrimary === true && event.button === 0;
}

/**
 * ...with one exception: touch reports only the *first* contact as primary, so
 * the second finger of a pinch is non-primary by definition. It is admitted
 * only while exactly one gesture pointer is already down - never from idle.
 */
function isSecondFinger(session, event) {
  return event.button === 0 && session.activePointers.size === 1;
}

/* ------------------ POINTER ENTRY POINTS ------------------ */

/** Begin a Pin gesture, a canvas pan, or a pinch. */
export function onPointerDown(session, event) {
  if (!session.hostElement) return null;
  if (!isPrimaryGesture(event) && !isSecondFinger(session, event)) return null;

  // Marked first: both the capture decision below and the Pin's own drag trait
  // need to know that this press is a caret placement rather than a gesture.
  if (isTextRegionTarget(event.target)) event[TEXT_REGION_FLAG] = true;

  // Armed, not taken: the stream stays with whatever the press landed on until
  // the gesture proves itself a drag (see `armCapture`).
  armCapture(session, event);
  session.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (session.activePointers.size >= 2) {
    beginPinch(session);
    return null;
  }

  const pin = pinForEvent(session, event);
  if (!pin) {
    session.isPanning = true;
    session.lastPointer = { x: event.clientX, y: event.clientY };
    return null;
  }

  routeToTraits(session, pin, 'onPointerDown', event);
  session.activeDragPin = pin;
  // A dragged Pin has to clear everything, including the scopes it is nested in.
  setElevationChain(pin, DRAG_CHAIN_CLASS, true);
  return pin;
}

/** Continue the active gesture: the pinch, the Pin's traits, or the camera. */
export function onPointerMove(session, event) {
  if (!session.hostElement) return false;

  const tracked = session.activePointers.get(event.pointerId);
  if (tracked) {
    tracked.x = event.clientX;
    tracked.y = event.clientY;
  }

  // A pinch is driven only by its own pointers; anything else is a stray hover.
  if (session.pinch) return tracked ? updatePinch(session) : false;

  // A move only decides the capture while a gesture is actually running: a
  // hover over the canvas is not a drag, whatever distance it covers.
  if (tracked && isGestureActive(session)) takeDeferredCapture(session, event);

  if (session.activeDragPin) {
    routeToTraits(session, session.activeDragPin, 'onPointerMove', event);
    return true;
  }
  if (!session.isPanning) return false;

  session.viewport.panBy(
    event.clientX - session.lastPointer.x,
    event.clientY - session.lastPointer.y
  );
  session.lastPointer = { x: event.clientX, y: event.clientY };
  return true;
}

/** End whatever gesture this pointer was part of. */
export function onPointerUp(session, event) {
  releasePointer(session, event);
  if (event && event.pointerId !== undefined) {
    session.activePointers.delete(event.pointerId);
  }
  // An up ends the gesture whichever pointer carried it, so the deferred
  // decision goes with it rather than surviving into the next press.
  session._pendingCapture = null;

  if (session.pinch && endPinch(session)) return null;

  const pin = session.activeDragPin;
  if (pin) {
    session.activeDragPin = null;
    // Cleared on the chain the Pin is *currently* in, before its own
    // `onPointerUp` gets the chance to reparent it: `setElevationChain` walks
    // `pin.parent`, so removing the class after a drop would strip the new chain
    // and strand the class on the old one. The same order `cancelDrag` uses.
    setElevationChain(pin, DRAG_CHAIN_CLASS, false);
    routeToTraits(session, pin, 'onPointerUp', event);
  }
  session.isPanning = false;
  return pin || null;
}

/**
 * Raise the canvas's own menu - or don't, and let the platform have the click.
 *
 * Three outcomes, in order:
 *
 *   1. Mid-gesture, the event is swallowed and the gesture cancelled. A
 *      long-press or a stray right button would otherwise leave a pan running
 *      under an open menu, and that is true of *our* menu too.
 *   2. Otherwise the click is resolved to a context - the Pin it landed on, or
 *      null for bare canvas - and offered to `./context-menu.js`. If any
 *      registered command applies, the menu opens and the native one is
 *      suppressed.
 *   3. If none applies, the event is left completely alone. The platform menu -
 *      reload, inspect, spellcheck - is worth more than an empty box of ours.
 *
 * @returns {boolean} true when the native menu was suppressed
 */
export function onContextMenu(session, event) {
  if (isGestureActive(session)) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    cancelGesture(session);
    return true;
  }

  const opened = openContextMenu(session, {
    pin: pinForEvent(session, event),
    x: event ? event.clientX : 0,
    y: event ? event.clientY : 0
  });
  if (!opened) return false;

  if (event && typeof event.preventDefault === 'function') event.preventDefault();
  return true;
}

/* ------------------ WHEEL ------------------ */

/**
 * Attribute a scrollable region inside the canvas opts in with.
 *
 * Written by the author on the element that scrolls - normally a Pin's scope
 * well, but any element inside the canvas may carry it. An attribute rather
 * than a computed `overflow-y` read, deliberately: `getComputedStyle` on every
 * wheel event is a forced style resolution on the highest-frequency input the
 * canvas receives, and it would make the routing depend on a stylesheet the
 * consumer is free not to load.
 */
export const SCROLL_REGION_SELECTOR = '[data-cc-scroll]';

/**
 * The opted-in scrolling region this event landed in, or null.
 * @returns {Element|null}
 */
export function scrollRegionFor(event) {
  const target = event ? event.target : null;
  if (!target || typeof target.closest !== 'function') return null;
  return target.closest(SCROLL_REGION_SELECTOR);
}

/**
 * Zoom or pan from one wheel event.
 *
 * Three routes, in order: ctrl/meta is a trackpad pinch and zooms at the
 * pointer; an unmodified event that looks like a discrete notch zooms at the
 * pointer with the gentler gain; everything else is a two-axis scroll and pans
 * the camera against the gesture. A purely horizontal event never zooms.
 *
 * ...over one exception, and the arbitration is the whole point of it: inside a
 * region that opted into scrolling (`SCROLL_REGION_SELECTOR`) an unmodified
 * wheel is the region's, and the event is left alone entirely - not defaulted
 * away, not read as camera intent - so the browser scrolls it natively, with
 * its own overscroll and momentum. Zooming the canvas from in there is still
 * possible, and explicit: ctrl/meta says "the camera, not the list".
 *
 * `preventDefault` is unconditional everywhere else: the host owns the wheel
 * inside its box, and the listener is registered `passive: false`.
 */
export function onWheel(session, event) {
  const zoomModifier = Boolean(event.ctrlKey || event.metaKey);
  if (!zoomModifier && scrollRegionFor(event)) return false;

  event.preventDefault();
  if (!session.hostElement) return false;

  const hostRect = hostRectOf(session);
  const { dx, dy } = normalizeWheelDeltas(event, hostRect.height);
  if (dx === 0 && dy === 0) return false;

  if (dy !== 0 && (zoomModifier || isDiscreteWheel(event))) {
    const gain = zoomModifier ? PINCH_ZOOM_K : WHEEL_ZOOM_K;
    session.viewport.zoomAt(
      wheelZoomFactor(dy, gain),
      event.clientX - hostRect.left,
      event.clientY - hostRect.top
    );
    return true;
  }

  session.viewport.panBy(-dx, -dy);
  return true;
}

/**
 * Seed the session's gesture state. `activePointers` is the live set of gesture
 * pointers (one for a drag or a pan, two for a pinch); `pinch` is the
 * separation/midpoint pair the last pinch step was measured against; and
 * `_pendingCapture` is the armed-but-untaken pointer capture -
 * `{pointerId, x, y, declined}` from the press until the gesture crosses the
 * drag threshold (or ends). See `armCapture` for why capture is deferred at all.
 */
export function initPointerState(session) {
  session.isPanning = false;
  session.activeDragPin = null;
  session.lastPointer = { x: 0, y: 0 };
  session.activePointers = new Map();
  session.pinch = null;
  session._pendingCapture = null;
}
