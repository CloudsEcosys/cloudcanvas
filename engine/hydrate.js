/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Adoption & hydration: DOM that already exists becomes live Pins, and the
 * framework re-creates none of it.
 *
 * Every other route onto the canvas starts from data - a Contents Map a display
 * template turns into nodes. This one starts from the nodes: a server-rendered
 * page, a hand-written fragment, another framework's output. The markup is not
 * a description of what to build, it *is* the built thing, so the only display
 * type that can be given to it is the one that never writes (`preserve`, in
 * `../pins/traits/display-templates.js`).
 *
 * Nothing here is new machinery. `adopt` is `createPin` with two defaults
 * (`preserve`, no chrome) and the caller's element; `hydrate` is `adopt` in
 * document order with the parent taken from the DOM's own nesting, linked
 * through the `createPin({ parent })` path every other child Pin uses. The
 * relocation of the caller's markup into the Pin's content node is
 * `buildElementStructure`'s (`../pins/pin-element.js`), unchanged.
 *
 * Free functions taking the session first, like every other engine transition.
 */

import { PRESERVE_TYPE } from '../pins/traits/display-templates.js';
import { readAttributes } from '../core/spec.js';

/** Namespace every hydration attribute lives under. */
const ATTR_PREFIX = 'data-cc-';

/** The marker attribute itself: a flag, never an option. */
const PIN_ATTR = `${ATTR_PREFIX}pin`;

/**
 * What `hydrate` scans for when the caller names no selector.
 * Exported because a consumer writing the markup should write the attribute the
 * scanner actually reads, not a copy of it.
 */
export const HYDRATE_SELECTOR = `[${PIN_ATTR}]`;

/**
 * Pin options that are numbers.
 *
 * An attribute is always a string, and `data-cc-x="40"` must not reach the
 * spatial node as `"40"`. The list is exactly the numeric options
 * `particleFromOptions` reads (`../particles/pin-particle.js`) plus the two
 * dimensions - deliberately closed, because a blind attempt-to-number would
 * turn `data-cc-id="42"` into a numeric id and `data-cc-type="3d"` into `NaN`.
 */
const NUMERIC_OPTIONS = new Set(['x', 'y', 'z', 'width', 'height', 'mass', 'friction']);

/**
 * Pin options that are booleans, and the two strings that may express one.
 *
 * The same string problem with a nastier failure: `data-cc-draggable="false"`
 * is a truthy string, so without this the Pin would silently stay draggable -
 * the opposite of what the markup says. Only the two literals convert; anything
 * else is left a string rather than guessed at.
 */
const BOOLEAN_OPTIONS = new Set([
  'chrome', 'bordered', 'draggable', 'selectable', 'selectableText', 'pinned'
]);

/** The two sets above plus the error prefix, in the shape the core reader takes. */
const HYDRATE_KINDS = /* @__PURE__ */ Object.freeze({
  numeric: NUMERIC_OPTIONS,
  boolean: BOOLEAN_OPTIONS,
  label: 'hydrate'
});

/** The marker is a flag, never an option. */
const HYDRATE_SKIP = /* @__PURE__ */ new Set([PIN_ATTR]);

/** `Node.ELEMENT_NODE`, named rather than assumed present on a bare object. */
const ELEMENT_NODE = 1;

/** Whether a value is a real element, not a text node, a string, or a selector. */
function isElement(value) {
  return Boolean(value) && value.nodeType === ELEMENT_NODE;
}

/**
 * Turn an existing element into a Pin without touching what is inside it.
 *
 * Two defaults, both overridable by `options`: the `preserve` display type (the
 * markup is the content) and no chrome (the caller's element already looks the
 * way the caller wants). A caller who supplies their own `type` or
 * `displayTrait` is asking for their markup to be replaced by that type's
 * subtree, and gets it.
 *
 * @param {CloudCanvasSession} session
 * @param {Element} element the element to adopt; it moves onto the canvas plane
 * @param {object} [options] any `createPin` option
 * @returns {Pin} the registered Pin
 * @throws {TypeError} when `element` is not a DOM element
 */
export function adopt(session, element, options = {}) {
  if (!isElement(element)) {
    throw new TypeError('adopt: a real DOM element is required');
  }

  const config = { chrome: false, ...options, element };
  if (!config.type && !config.displayTrait) {
    config.type = PRESERVE_TYPE;
  }
  return session.createPin(config);
}

/**
 * Adopt every matching element inside `container`, nesting Pins as the DOM nests.
 *
 * `querySelectorAll` answers in document order, so an ancestor is always adopted
 * before its descendants and the parent Pin exists by the time a child asks for
 * it. The parent is the nearest *matched* ancestor - `closest` from the
 * element's parent, which skips the content node the ancestor's structure pass
 * just relocated it into - and it is handed to `createPin({ parent })`, the same
 * linkage every programmatically created child Pin uses.
 *
 * @param {CloudCanvasSession} session
 * @param {Element} container the subtree to scan; not itself a candidate
 * @param {string} [selector] what counts as a Pin
 * @returns {Pin[]} the adopted Pins, in document order
 * @throws {TypeError} when `container` is not a DOM element
 */
export function hydrate(session, container, selector = HYDRATE_SELECTOR) {
  if (!isElement(container)) {
    throw new TypeError('hydrate: a real DOM element is required');
  }

  const matches = Array.from(container.querySelectorAll(selector));
  const pinByElement = new Map();

  for (const element of matches) {
    const parentElement = element.parentElement
      ? element.parentElement.closest(selector)
      : null;
    const parent = parentElement ? pinByElement.get(parentElement) : null;

    pinByElement.set(element, adopt(session, element, { ...readConfig(element), parent }));
  }

  return Array.from(pinByElement.values());
}

/**
 * The `createPin` options an element declares in its attributes.
 *
 * `data-cc-` is stripped, the rest is camel-cased (`data-cc-selectable-text` ->
 * `selectableText`), and the marker attribute is not an option. Values are
 * coerced only where the option's type is known; see `NUMERIC_OPTIONS`. The
 * reader itself is the core's (`../core/spec.js`), parameterised by prefix and
 * kinds; a numeric option that does not parse throws by attribute name.
 *
 * @param {Element} element
 * @returns {object}
 */
export function readConfig(element) {
  return readAttributes(element, ATTR_PREFIX, HYDRATE_SKIP, HYDRATE_KINDS);
}
