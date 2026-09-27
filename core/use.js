/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Traits, `(b, opts, root) => cleanup`, run while their blit is in a frame, and the names `blit.use()` gives them.
 */
import { createLogger } from '../log.js';
import { camelCase, decodeAttribute, kebabCase, writeAttribute } from './spec.js';
import { BLIT_ATTR, PLACEMENT_KEYS, ROOT_ATTR, rootOf, stateOf } from './state.js';
import { TYPE_ATTR, typeTraits } from './type.js';

const logger = createLogger('blit');

/** A name round-trips through `data-*` unchanged and is no key or marker the core routes itself. */
const NAME = /^[a-z][a-zA-Z0-9]*$/;
const TAKEN = /* @__PURE__ */ new Set(['blit', 'blitRoot', 'port', 'with', 'fill', 'type', 'slot', ...PLACEMENT_KEYS]);

/** @type {Map<string, Function>} name -> the trait or port */
const NAMED = /* @__PURE__ */ new Map();

/** `blit.use({name: fn})`: the same pair again is a no-op, another function under a taken name throws, and
 * a late name upgrades the `[data-<name>]` elements already under live roots. */
export function use(entries) {
  if (!entries || typeof entries !== 'object') throw new TypeError('blit.use: expected {name: fn}');
  for (const [name, fn] of Object.entries(entries)) {
    if (!NAME.test(name) || TAKEN.has(name)) throw new TypeError(`blit.use: "${name}" cannot be a name`);
    if (typeof fn !== 'function') throw new TypeError(`blit.use: "${name}" is not a function`);
    if (NAMED.get(name) === fn) continue;
    if (NAMED.has(name)) throw new TypeError(`blit.use: "${name}" is already in use by another function`);
    NAMED.set(name, fn);
    upgrade(name);
  }
}

/** `set()` of `port`, `with` or a name (its trait restarts; false removes it). @returns {boolean} false otherwise */
export function writeTraitKey(state, key, value) {
  if (key === 'port') state.port = portOf(value);
  else if (key === 'with') setWith(state, value);
  else if (!NAMED.has(key)) return false;
  else {
    stopTraits(state, key);
    writeAttribute(state.el, key, value === true ? '' : (value === false ? null : value));
  }
  return true;
}

/** A `port` value: a function, a name given to `use()`, or null for the default. */
function portOf(value) {
  if (value === null || value === undefined || typeof value === 'function') return value ?? null;
  if (!NAMED.has(value)) throw new TypeError(`blit.set: no port named "${String(value)}"`);
  return NAMED.get(value);
}

/** A `with` value: anonymous traits by value; one dropped from the list stops. */
function setWith(state, value) {
  const next = value ?? [];
  const valid = Array.isArray(next) && next.every((fn) => typeof fn === 'function');
  if (!valid) throw new TypeError('blit.set: with must be an array of functions');
  for (const fn of (state.with ?? []).filter((each) => !next.includes(each))) stopTraits(state, fn);
  state.with = next;
}

/** The traits and port of `state` into `spec` by name; an anonymous one is left out, with a warning. */
export function specTraits(state, spec) {
  for (const key of Object.keys(spec)) {
    if (NAMED.has(key)) spec[key] = decodeAttribute(spec[key]);
  }
  for (const fn of [...(state.with ?? []), ...(state.port ? [state.port] : [])]) {
    const kind = fn === state.port ? 'port' : 'trait';
    const name = Array.from(NAMED.keys()).find((each) => NAMED.get(each) === fn);
    if (!name) logger.warn(`blit.spec: an anonymous ${kind} is not serialised; name it with blit.use()`);
    else if (kind === 'port') spec.port = name;
    else spec[name] ??= true;
  }
}

/** Run every trait `state` declares and is not running: its type's `with`, its own, then each named `data-*`. */
export function runTraits(state) {
  const root = rootOf(state);
  if (!root || !state.handle) return;
  state.traits = toggleTraits;
  const anonymous = [...typeTraits(state.el.getAttribute(TYPE_ATTR)), ...(state.with ?? [])];
  for (const fn of anonymous) start(state, root, fn, fn, true);
  for (const { name, value } of Array.from(state.el.attributes)) {
    const key = name.startsWith('data-') ? camelCase(name.slice(5)) : '';
    if (NAMED.has(key)) start(state, root, key, NAMED.get(key), decodeAttribute(value));
  }
}

/** Run one trait, marked running first so a trait that writes its own blit is not re-entered. */
function start(state, root, key, fn, opts) {
  if (state.cleanups?.has(key)) return;
  (state.cleanups ??= new Map()).set(key, null);
  try {
    const cleanup = fn(state.handle, opts, root);
    if (typeof cleanup === 'function') state.cleanups.set(key, cleanup);
  } catch (error) {
    state.cleanups.delete(key);
    throw error;
  }
}

/** Stop one running trait (`key` a name or a function), or every one without a key. */
export function stopTraits(state, key) {
  for (const each of key === undefined ? Array.from(state.cleanups?.keys() ?? []) : [key]) {
    const cleanup = state.cleanups?.get(each);
    if (state.cleanups?.delete(each) && cleanup) cleanup();
  }
}

/** `state.traits`: the blit and every blit inside it rejoin the frame (`run`: traits run) or leave it (stop). */
function toggleTraits(state, run) {
  for (const element of [state.el, ...state.el.querySelectorAll(`[${BLIT_ATTR}]`)]) {
    const each = stateOf(element);
    if (each && run) runTraits(each);
    else if (each) stopTraits(each);
  }
}

/** A name just given: every element under a live root that declares it gets the trait now. */
function upgrade(name) {
  if (typeof document === 'undefined') return;
  const attribute = `data-${kebabCase(name)}`;
  for (const element of document.querySelectorAll(`[${ROOT_ATTR}][${attribute}], [${ROOT_ATTR}] [${attribute}]`)) {
    const state = stateOf(element);
    if (state) runTraits(state);
  }
}
