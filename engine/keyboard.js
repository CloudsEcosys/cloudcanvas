/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Keyboard navigation for the legacy session: the keyboard add-on
 * (`../addons/keyboard.js`) installed on the session's host with Pin-shaped
 * hooks. The key table, the dispatch, the host's tab stop and role, roving and
 * reveal are the add-on's; what stays here is what a Pin means to them -
 *
 *   - the roving order is every active, participating Pin (a promoted render
 *     root narrows it to what is on screen), in reading order;
 *   - Enter on a Pin is `session.focus(pin)`, which zooms into it; Space offers
 *     the press to the Pin's traits' `onAction(pin, event, session)`, first
 *     truthy answer wins;
 *   - Escape at the host pops one stacked focus, else unfocuses; `0` and Home
 *     unfocus.
 *
 * Pins carry their own roving `tabindex="-1"` and ARIA (`../pins/pin-element.js`).
 */
import { handleKey, installKeyboard, keyboardEnv, reveal, sortReadingOrder } from '../addons/keyboard.js';
import { pinFromElement } from './hit-test.js';

export {
  ENSURE_VISIBLE_MS, KEY_BINDINGS, PAN_SHIFT_MULTIPLIER, PAN_STEP_PX, VISIBILITY_MARGIN_PX, ZOOM_STEP
} from '../addons/keyboard.js';

/** The first of a Pin's traits whose `onAction` consumes the press. @returns {boolean} consumed */
function runTraitAction(session, pin, event) {
  if (!pin || !(pin.traits instanceof Map)) return false;
  for (const trait of pin.traits.values()) {
    if (trait && typeof trait.onAction === 'function' && trait.onAction(pin, event, session)) return true;
  }
  return false;
}

/** A Pin's global box, or null for something that has none. */
function boundsOfPin(pin) {
  return pin && typeof pin.getGlobalBounds === 'function' ? pin.getGlobalBounds() : null;
}

/** What a Pin means to the add-on, built once per session. */
function hooksOf(session) {
  session._keyHooks ??= {
    targetOf: (event) => pinFromElement(session, event.target),
    order: () => readingOrder(session),
    elementOf: (pin) => pin.element,
    boundsOf: boundsOfPin,
    current: () => session.focusedPin,
    actions: {
      reset: () => session.unfocus(),
      unfocus: () => session.unfocus(),
      back: () => (session.focusStack.length > 0 ? session.popFocus() : session.unfocus()),
      focus: (pin) => session.focus(pin),
      act: (pin, event) => runTraitAction(session, pin, event)
    }
  };
  return session._keyHooks;
}

function envOf(session) {
  return keyboardEnv(session.hostElement, session._frame, hooksOf(session));
}

/**
 * Install the keyboard add-on on the session's host: the tab stop (an author
 * `tabindex` is kept), the listener, and the roving record `session._keyboard`.
 * @returns {boolean} true when a listener was registered
 */
export function bindKeyboard(session) {
  const host = session.hostElement;
  if (!host || typeof host.addEventListener !== 'function') return false;
  if (session._keyboard) unbindKeyboard(session);

  const state = {};
  const label = (session.options && session.options.label) || undefined;
  const tabStop = session.options?.tabStop;
  state.off = installKeyboard(host, session._frame, { state, label, tabStop, hooks: hooksOf(session) });
  session._keyboard = state;
  return true;
}

/** Stop listening and take back exactly what binding wrote. */
export function unbindKeyboard(session) {
  const state = session._keyboard;
  if (!state) return false;
  state.off();
  session._keyboard = null;
  return true;
}

/** Route one keydown to the camera or the roving order. @returns {boolean} handled */
export function onKeyDown(session, event) {
  return handleKey(session._keyboard ?? { order: [] }, event, envOf(session));
}

/** Every Pin a keyboard user can reach now - active, mounted, participating - in reading order. */
export function readingOrder(session) {
  const entries = [];
  for (const pin of session.pinManager.getAllPins()) {
    if (!pin.active || !pin.element) continue;
    if (session.renderer && !session.renderer.participates(pin)) continue;
    entries.push({ target: pin, bounds: pin.getGlobalBounds(), id: pin.id });
  }
  return sortReadingOrder(entries);
}

/** Pan the least distance that brings a Pin, plus its margin, into the host box. @returns {boolean} moved */
export function ensureVisible(session, pin) {
  if (!session.viewport) return false;
  return reveal(envOf(session), boundsOfPin(pin));
}
