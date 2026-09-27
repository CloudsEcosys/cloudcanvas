/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The trait kit: what the built-in add-ons share.
 *
 * A built-in trait is written once, as a *behaviour* - plain functions over a
 * state record `s` and a blit-shaped handle `b` (`el x y size bounds set emit
 * on`). `defineTrait` turns a behaviour into a function trait the core runs,
 * `(b, opts, root) => cleanup`, wiring its pointer hooks to native events;
 * `./class-from-trait.js` turns the same behaviour into the legacy class, with
 * the Pin's session routing the pointer instead. One implementation, two shells.
 *
 *   init(options)             the state record's fields
 *   attach(s, b) / detach     start and stop, on both shells
 *   press(s, b, event, env)   a press the blit owns; truthy arms move/release
 *   move / release            the gesture; `release` without an event is a cancel
 *   mount(s, b, root)         wiring only a core blit has (ticks, root passes); returns its off
 *
 * `env.point(event)` is the press in canvas coordinates. Hooks only a core blit
 * runs go in `defineTrait`'s second argument, so the legacy class never carries them.
 */
import { BLIT_ATTR } from '../core/state.js';

/** Pointer travel (px) a press must exceed before it moves anything. */
export const DRAG_THRESHOLD_PX = 3;

/** Largest pointer travel (px) that still counts as a click rather than a drag. */
export const CLICK_TRAVEL_PX = 5;

/** The attribute a real control carries; a press on one is the page's, never a gesture. */
export const CONTROL_ATTR = 'data-cc-control';

/** Everything a press stands down on: the platform's controls and any `data-cc-control`. */
export const CONTROL_SELECTOR = /* @__PURE__ */ [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'label',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  `[${CONTROL_ATTR}]`
].join(', ');

/** Whether a press on `target` belongs to a control. */
export function isControlTarget(target) {
  if (!target || typeof target.closest !== 'function') return false;
  return Boolean(target.closest(CONTROL_SELECTOR));
}

/** A finite coordinate, or null. */
export function coordinate(value) {
  return Number.isFinite(value) ? value : null;
}

/**
 * Whether a move is far enough from the press (`s._downX/_downY`) to be a
 * gesture. A press or move with no coordinates passes: the threshold absorbs
 * wobble, it is not a second way to drop a gesture.
 */
export function passedThreshold(s, event) {
  if (s._downX === null || s._downY === null) return true;
  if (!Number.isFinite(event?.clientX) || !Number.isFinite(event?.clientY)) return true;
  return Math.hypot(event.clientX - s._downX, event.clientY - s._downY) > DRAG_THRESHOLD_PX;
}

/** The class a selected element carries (`./select.js` owns the selection). */
export const SELECTED_CLASS = 'is-selected';

/** The selection a handle reports: a Pin's from its trait, a blit's from its class. */
export function selectedOf(b) {
  if (typeof b.selected === 'boolean') return b.selected;
  return Boolean(b.el && b.el.classList.contains(SELECTED_CLASS));
}

/** Whether `event` landed on `b` itself rather than on a blit nested inside it. */
export function ownsEvent(b, event) {
  const target = event ? event.target : null;
  return Boolean(target && typeof target.closest === 'function' && target.closest(`[${BLIT_ATTR}]`) === b.el);
}

/** The primary pointer's main button: the only press that starts a gesture. */
export function isPrimaryPress(event) {
  return event.isPrimary !== false && event.button === 0;
}

/** A root's projection: client coordinates to canvas coordinates through its camera. */
export function rootEnv(root) {
  return {
    root,
    point(event) {
      const rect = root.host.getBoundingClientRect();
      const { x, y, scale } = root.camera;
      return { x: (event.clientX - rect.left - x) / scale, y: (event.clientY - rect.top - y) / scale };
    }
  };
}

/**
 * The press, and the move and release that follow it on the window, for one
 * blit. @returns {() => void} off, which also drops a gesture in flight
 */
function wirePointer(s, b, env, behaviour) {
  const onMove = (event) => { if (behaviour.move) behaviour.move(s, b, event, env); };
  const onUp = (event) => {
    stop();
    if (behaviour.release) behaviour.release(s, b, event, env);
  };
  const stop = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  };
  const offDown = b.on('pointerdown', (event) => {
    if (!isPrimaryPress(event) || !ownsEvent(b, event)) return;
    if (!behaviour.press(s, b, event, env)) return;
    stop();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });
  return () => { offDown(); stop(); };
}

/**
 * A behaviour as a function trait; `native` adds (or overrides) the hooks only
 * a core blit runs. The shared behaviour rides on the result as `.behaviour`.
 * Kept apart so a bundle holding only the legacy class sheds the native wiring.
 * @returns {(b: object, opts: any, root: object) => () => void}
 */
export function defineTrait(shared, native = {}) {
  const behaviour = { ...shared, ...native };
  const trait = (b, opts, root) => {
    const s = behaviour.init(opts && typeof opts === 'object' ? opts : {});
    if (behaviour.attach) behaviour.attach(s, b);
    const offs = [];
    if (behaviour.press) offs.push(wirePointer(s, b, rootEnv(root), behaviour));
    if (behaviour.mount) offs.push(behaviour.mount(s, b, root));
    return () => {
      for (const off of offs) if (typeof off === 'function') off();
      if (behaviour.detach) behaviour.detach(s, b);
    };
  };
  trait.behaviour = shared;
  return trait;
}
