/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Pointer routing for the legacy session: the pan add-on (`../addons/pan.js`)
 * installed on the session's host, with the session itself as the gesture
 * record (`isPanning`, `activePointers`, `pinch`, `lastPointer`,
 * `_pendingCapture`) and a claimer that hands a press on a Pin to that Pin's
 * traits. A press on nothing is a camera gesture, exactly as on a core root.
 *
 * What stays here is Pin-shaped: resolving the Pin under an event, routing the
 * pointer hooks across its traits, the drag's elevation chain, and marking a
 * press in selectable text. The module functions keep their `(session, event)`
 * signatures and run the same add-on code the installed listeners do.
 */
import { DRAG_CHAIN_CLASS, setElevationChain } from './elevation.js';
import { pinFromElement } from './hit-test.js';
import { openContextMenu } from './context-menu.js';
import { isTextRegionTarget } from '../pins/pin-element.js';
import { isControlTarget, listen } from '../addons/trait.js';
import {
  TEXT_REGION_FLAG, cancelPan, initPanState, installPan, isPanActive, panContextMenu, panEnv,
  panMove, panPress, panRelease, panWheel
} from '../addons/pan.js';

export {
  DISCRETE_WHEEL_MIN_PX, LINE_HEIGHT_PX, MAX_WHEEL_DELTA_PX, PAGE_HEIGHT_FALLBACK_PX, PINCH_ZOOM_K,
  SCROLL_REGION_SELECTOR, TEXT_REGION_FLAG, WHEEL_ZOOM_K, isDiscreteWheel, normalizeWheelDeltas,
  pinchStateFrom, scrollRegionFor, wheelPixelsPerUnit, wheelZoomFactor
} from '../addons/pan.js';

/** Run one pointer hook across every trait of a Pin. */
function routeToTraits(session, pin, hook, event) {
  for (const trait of pin.traits.values()) {
    if (typeof trait[hook] === 'function') trait[hook](pin, event, session);
  }
  return pin;
}

/** The Pin an event landed on, or null when it landed on the canvas. */
export function pinForEvent(session, event) {
  return pinFromElement(session, event ? event.target : null);
}

/** The claimer: a press on a Pin starts that Pin's drag, which its traits carry to the end. */
function pinTarget(session) {
  return {
    press(event) {
      const pin = pinForEvent(session, event);
      if (!pin) return null;
      routeToTraits(session, pin, 'onPointerDown', event);
      session.activeDragPin = pin;
      // A dragged Pin has to clear everything, including the scopes it is nested in.
      setElevationChain(pin, DRAG_CHAIN_CLASS, true);
      return pin;
    },
    move: (event) => routeToTraits(session, session.activeDragPin, 'onPointerMove', event),
    release(event) {
      const pin = session.activeDragPin;
      if (!pin) return null;
      session.activeDragPin = null;
      // Cleared on the chain the Pin is in *before* its `onPointerUp` may reparent it.
      setElevationChain(pin, DRAG_CHAIN_CLASS, false);
      return routeToTraits(session, pin, 'onPointerUp', event);
    },
    cancel: () => cancelDrag(session),
    active: () => Boolean(session.activeDragPin)
  };
}

/** The env the add-on runs in for this session; the claimer is built once per session. */
function envOf(session) {
  session._pinTarget ??= pinTarget(session);
  return panEnv(session.hostElement, session._frame, session._pinTarget);
}

/** Seed the session's gesture record: the pan add-on's fields, plus the Pin drag. */
export function initPointerState(session) {
  initPanState(session);
  session.activeDragPin = null;
}

/** Mark a press in a Pin's selectable text: it places a caret, so neither capture nor drag may take it. */
function markTextRegion(event) {
  if (isTextRegionTarget(event.target)) event[TEXT_REGION_FLAG] = true;
}

/** Install the pan add-on on the session's host, the text marker ahead of it. @returns {() => void} off */
export function bindPointer(session) {
  const host = session.hostElement;
  const offMark = listen(host, ['pointerdown'], markTextRegion);
  const pan = session.options?.pan;
  const options = { ...(pan === false ? { press: false } : pan), state: session, target: envOf(session).target };
  const offPan = installPan(host, session._frame, options);
  return () => { offPan(); offMark(); };
}

/** Begin a Pin gesture, a canvas pan, or a pinch. */
export function onPointerDown(session, event) {
  if (!session.hostElement) return null;
  markTextRegion(event);
  return panPress(session, event, envOf(session));
}

/** Continue the active gesture: the pinch, the Pin's traits, or the camera. */
export function onPointerMove(session, event) {
  if (!session.hostElement) return false;
  return panMove(session, event, envOf(session));
}

/** End whatever gesture this pointer was part of. */
export function onPointerUp(session, event) {
  return panRelease(session, event, envOf(session));
}

/** Zoom or pan from one wheel event (`panWheel`). */
export function onWheel(session, event) {
  return panWheel(event, envOf(session));
}

/**
 * A right-click mid-gesture cancels it; otherwise the canvas menu opens if any
 * command applies, else the platform's. @returns {boolean} native menu suppressed
 */
export function onContextMenu(session, event) {
  if (panContextMenu(session, event, envOf(session))) return true;
  const opened = openContextMenu(session, {
    pin: pinForEvent(session, event),
    x: event ? event.clientX : 0,
    y: event ? event.clientY : 0
  });
  if (opened && event && typeof event.preventDefault === 'function') event.preventDefault();
  return opened;
}

/** Whether a gesture started on a control the platform must keep. */
export function startsOnControl(event) {
  return isControlTarget(event ? event.target : null);
}

/** Whether a camera or Pin gesture is currently running. */
export function isGestureActive(session) {
  return isPanActive(session, envOf(session));
}

/** Abandon every gesture and forget every pointer. */
export function cancelGesture(session) {
  return cancelPan(session, envOf(session));
}

/**
 * End the active drag without a pointer event - the renderer calls this when
 * the dragged Pin's element leaves the document. @returns {Pin|null}
 */
export function cancelDrag(session) {
  session._pendingCapture = null;
  const pin = session.activeDragPin;
  if (!pin) return null;

  session.activeDragPin = null;
  setElevationChain(pin, DRAG_CHAIN_CLASS, false);
  const draggable = pin.traits.get('draggable');
  if (draggable && typeof draggable.onPointerUp === 'function') draggable.onPointerUp(pin);
  return pin;
}
