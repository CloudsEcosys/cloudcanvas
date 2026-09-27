/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `data-*` <-> spec: the one conversion between attributes and the plain object
 * a blit is described by. Only declared kinds are coerced (placement is
 * numeric); a numeric key that does not parse throws rather than reaching the
 * port as `NaN`. Prefix and kinds are parameters so the legacy `data-cc-*`
 * hydration (`../engine/hydrate.js`) reads through the same code.
 */
import { BLIT_ATTR, PLACEMENT_KEYS, ROOT_ATTR } from './state.js';

/**
 * @typedef {object} AttributeKinds
 * @property {Set<string>} numeric keys that must parse as finite numbers
 * @property {Set<string>} boolean keys that convert from the two literals
 * @property {string} label the prefix of a coercion error
 */

/** The core's own kinds: placement is numeric, nothing is boolean-by-name. */
export const SPEC_KINDS = /* @__PURE__ */ Object.freeze({
  numeric: /* @__PURE__ */ new Set(PLACEMENT_KEYS),
  boolean: /* @__PURE__ */ new Set(),
  label: 'blit'
});

/** The namespace every spec attribute lives under. */
export const SPEC_PREFIX = 'data-';

/** The markers that are flags on the element, never spec keys. */
const SPEC_SKIP = /* @__PURE__ */ new Set([BLIT_ATTR, ROOT_ATTR]);

const BOOLEAN_VALUES = /* @__PURE__ */ new Map([['true', true], ['false', false]]);

/** `selectable-text` -> `selectableText`. */
export function camelCase(name) {
  return name.replace(/-([a-z])/g, (_, character) => character.toUpperCase());
}

/** `selectableText` -> `selectable-text`. */
export function kebabCase(name) {
  return name.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}

/**
 * A raw attribute value as its camel-cased key's declared kind. `kinds` is
 * required, so a caller that never uses the core's own never bundles them.
 * @param {AttributeKinds} kinds
 * @throws {TypeError} when a numeric key does not hold a finite number
 */
export function coerce(key, value, attributeName, kinds) {
  if (kinds.numeric.has(key)) {
    const number = value.trim() === '' ? NaN : Number(value);
    if (Number.isFinite(number)) return number;
    throw new TypeError(`${kinds.label}: ${attributeName}="${value}" is not a number`);
  }
  return kinds.boolean.has(key) && BOOLEAN_VALUES.has(value) ? BOOLEAN_VALUES.get(value) : value;
}

/**
 * Every attribute under `prefix`, except the `skip` flags, as a camel-cased,
 * coerced key. @returns {object}
 */
export function readAttributes(element, prefix, skip, kinds) {
  const spec = {};
  for (const attribute of element.attributes) {
    if (!attribute.name.startsWith(prefix) || skip.has(attribute.name)) continue;
    const key = camelCase(attribute.name.slice(prefix.length));
    spec[key] = coerce(key, attribute.value, attribute.name, kinds);
  }
  return spec;
}

/** The spec keys an element declares in its own `data-*` attributes. */
export function readSpec(element) {
  return readAttributes(element, SPEC_PREFIX, SPEC_SKIP, SPEC_KINDS);
}

/** A `data-*` value read back as trait options: bare or `"true"` is `true`, JSON is parsed. */
export function decodeAttribute(value) {
  if (value === '' || value === 'true') return true;
  return /^[[{]/.test(value) ? JSON.parse(value) : value;
}

/** One spec key as a `data-*` attribute: an object as JSON, else stringified; null or undefined removes it. */
export function writeAttribute(element, key, value) {
  const name = `${SPEC_PREFIX}${kebabCase(key)}`;
  if (value === null || value === undefined) element.removeAttribute(name);
  else element.setAttribute(name, typeof value === 'object' ? JSON.stringify(value) : String(value));
}
