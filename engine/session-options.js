/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The session's options, open rather than closed.
 *
 * The session reads its own keys, the viewport becomes the root's camera, and
 * each root add-on it installs takes the object under its own name (`pan`,
 * `menu`), the same opts that add-on takes as a root trait; the keyboard
 * add-on's one option is `label`, under the name the session always gave it. Nothing is refused for being new: a key nothing reads is reported
 * through the logger seam as a warning and otherwise ignored.
 *
 * One mistake still throws. A session handed its container under another name
 * (`hostElement` was accepted in silence for a whole release) mounts nothing,
 * renders nothing and reports nothing, which no warning below the default log
 * threshold would change; so a container alias is an error, never a no-op.
 */
import { createLogger } from '../log.js';

const logger = /* @__PURE__ */ createLogger('session');

/**
 * Every key something reads: the session's own, then the root add-ons
 * `./host.js` installs that take options of their own, each under its name and
 * beneath the session's wiring.
 *
 *   autoInjectStyles `false` keeps the shared canvas stylesheet out of the page.
 *   container        Element or selector to mount into; omit to mount later.
 *   customCSS        Per-session author CSS, removed again by `destroy()`.
 *   defaultReload    Default reload strategy for every Pin.
 *   label            Accessible name for the host: the keyboard add-on's `label`.
 *   loadChildren     Session-level lazy child provider.
 *   offloadMargin    Screen-pixel clearance before an `offload` Pin is detached.
 *   viewport         Initial camera (`{x, y, scale, minScale, maxScale}`).
 *   menu             The menu add-on's opts: `{registry}` replaces the shared one.
 *   pan              The pan add-on's opts: `{wheel: false}` leaves the wheel to the page.
 *                    `false` stops a press on bare canvas from panning (a click or caret still lands).
 *   frameOnFocus     `false` stops `focus()` from moving the camera; promotion and presentation still happen.
 *   tabStop          `false` keeps the host out of the tab order; keys still work once it is focused.
 */
const READ_KEYS = [
  'autoInjectStyles', 'container', 'customCSS', 'defaultReload', 'label', 'loadChildren', 'offloadMargin', 'viewport',
  'menu', 'pan', 'frameOnFocus', 'tabStop'
];

/** Names `container` has been mistaken for: each would build a session that mounts nothing. */
const CONTAINER_ALIASES = ['element', 'host', 'hostElement', 'target'];

/**
 * Report every option nothing reads: a container alias throws, anything else
 * is a `warn` record on the `session` logger.
 *
 * @param {object} options
 * @returns {string[]} the keys reported and ignored
 * @throws {TypeError} for a container alias, naming `container`
 */
export function checkOptions(options = {}) {
  const ignored = Object.keys(options).filter((key) => !READ_KEYS.includes(key));
  for (const key of ignored) {
    if (CONTAINER_ALIASES.includes(key)) throw new TypeError(`CloudCanvasSession: unknown option "${key}" - did you mean "container"?`);
    logger.warn(`CloudCanvasSession: unknown option "${key}" ignored`);
  }
  return ignored;
}

/** `Node.ELEMENT_NODE`, named rather than assumed present on a bare object. */
const ELEMENT_NODE = 1;

/** A supplied value described by its kind, for an error message to quote back. */
function describeContainer(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') return 'an empty string';
  return typeof value;
}

/**
 * Reject a `container` the session cannot mount into: `null` from a
 * `getElementById` that missed, a plain object, an empty selector. Checked only
 * when supplied - omit it to mount later - and never defaulted to `document.body`,
 * which would hide the same bug one level down.
 *
 * @param {*} container the supplied option value
 * @returns {true}
 * @throws {TypeError} when `container` is neither a non-empty selector nor an element
 */
export function assertValidContainer(container) {
  if (typeof container === 'string' && container.length > 0) return true;
  if (container && container.nodeType === ELEMENT_NODE) return true;

  throw new TypeError(
    'CloudCanvasSession: option "container" must be a non-empty selector string'
    + ` or a DOM element, received ${describeContainer(container)}`
    + ' - omit it entirely to mount later with session.mount()'
  );
}
