/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `blit`: a thin handle over any DOM element, HTML or SVG.
 *
 * The element is the thing. Its state lives in `./state.js`, keyed by the
 * element, with the handle cached there, so `blit(el) === blit(el)`. The DOM
 * tree is the hierarchy, read on every question; events are native bubbling
 * `CustomEvent`s. A blit is *potential* (detached, or a `<template>`: writes
 * apply at once), *indexed* (in a root: placement waits for the write phase),
 * or a *collection* (blits inside it; a root is one).
 *
 * `set()` routes by key: `x y z w h` to the port, `fill` as text into
 * `[data-slot]`s, `port`, `with` and `blit.use()` names to `./use.js`, the rest to `data-*`.
 */
import {
  BLIT_ATTR, PLACEMENT_KEYS, ROOT_ATTR, SLOT_ATTR,
  boundsOf, createState, parentElementOf, rootOf, scopeContainerOf, sizeOf, stateOf
} from './state.js';
import { readSpec, writeAttribute } from './spec.js';
import { PHASES, paint, schedule } from './frame.js';
import { mountRoot, scanRoot } from './root.js';
import { defineType, findType, instantiate, isTemplate } from './type.js';
import { runTraits, specTraits, stopTraits, use, writeTraitKey } from './use.js';

const PLACEMENT = /* @__PURE__ */ new Set(PLACEMENT_KEYS);

export class Blit {
  #s;

  /** @param {import('./state.js').BlitState} state */
  constructor(state) {
    this.#s = state;
    state.handle = this;
  }

  /** The element this handle addresses. */
  get el() { return this.#s.el; }
  get x() { return this.#s.x; }
  get y() { return this.#s.y; }
  get z() { return this.#s.z; }

  /** The size the last read phase measured, or the declared one until then. */
  get size() { return sizeOf(this.#s); }

  /** The global box: local placement summed over every ancestor blit. */
  get bounds() { return boundsOf(this.#s); }

  /** The nearest blit above this one, or null. */
  get parent() {
    const element = parentElementOf(this.#s.el);
    return element ? blit(element) : null;
  }

  /** The blits directly inside this one, in document order. */
  get blits() {
    const element = this.#s.el;
    return Array.from(element.querySelectorAll(`[${BLIT_ATTR}]`))
      .filter((child) => parentElementOf(child) === element)
      .map((child) => blit(child));
  }

  /** `data-*` keys, placement, slot text, named traits and port: `parent.blit(b.spec)` reproduces it. */
  get spec() {
    const s = this.#s;
    const spec = readSpec(s.el);
    for (const key of PLACEMENT_KEYS) delete spec[key];
    specTraits(s, spec);

    spec.x = s.x;
    spec.y = s.y;
    if (s.z !== 0) spec.z = s.z;
    if (s.w !== null) spec.w = s.w;
    if (s.h !== null) spec.h = s.h;

    const slots = ownSlots(s.el);
    if (slots.length > 0) {
      spec.fill = Object.fromEntries(slots.map((slot) => [slot.getAttribute(SLOT_ATTR), slot.textContent]));
    }
    return spec;
  }

  /**
   * Write keys onto the blit. Placement is queued to the port when attached
   * and applied at once when potential; everything else lands immediately.
   * @returns {this}
   */
  set(patch) {
    if (!patch || typeof patch !== 'object') throw new TypeError('blit.set: expected an object');
    const s = this.#s;
    if (s.root && PLACEMENT_KEYS.some((key) => key in patch)) {
      throw new TypeError('blit.set: a root has no placement; move its camera with view()');
    }

    let measure = false;
    for (const [key, value] of Object.entries(patch)) {
      if (PLACEMENT.has(key)) writePlacement(s, key, value);
      else if (key === 'fill') { writeFill(s.el, value); measure = true; }
      else if (!writeTraitKey(s, key, value)) { writeAttribute(s.el, key, value); measure = true; }
      s.changed.add(key);
    }
    runTraits(s);

    // A root or a template paints nothing; a detached blit paints now; an attached one next frame.
    if (s.root || isTemplate(s.el)) { s.changed.clear(); return this; }
    const root = rootOf(s);
    if (!root) { paint(null, s); return this; }
    root.dirty.add(s);
    if (measure) root.measure.add(s);
    schedule(root);
    return this;
  }

  /**
   * Create a blit inside this one: its type's content and defaults, then
   * `spec` over them. It lands in this blit's `[data-scope]` when its type has
   * one, else in the element; a root's children go on its plane.
   * @returns {Blit}
   */
  blit(spec = {}) {
    const s = this.#s;
    const template = spec.type === undefined ? null : findType(spec.type);
    if (spec.type !== undefined && !template) throw new TypeError(`blit: unknown type "${spec.type}"`);

    const element = instantiate(template);
    const child = new Blit(createState(element));
    const defaults = template ? blit(template).spec : {};
    const patch = { ...defaults, ...spec };
    if (defaults.fill && spec.fill) patch.fill = { ...defaults.fill, ...spec.fill };
    child.set(patch);

    (s.root ? s.root.plane : scopeContainerOf(s.el)).appendChild(element);
    attach(child.#s);
    return child;
  }

  /** Listen for a native event on the element. @returns {() => void} off */
  on(type, listener, options) {
    this.#s.el.addEventListener(type, listener, options);
    return () => this.#s.el.removeEventListener(type, listener, options);
  }

  /**
   * Dispatch a bubbling, cancelable `CustomEvent` with `detail = {payload, source}`.
   * @returns {CustomEvent} so `defaultPrevented` can be read
   */
  emit(type, payload = null) {
    const detail = { payload, source: this };
    const event = new CustomEvent(type, { bubbles: true, cancelable: true, detail });
    this.#s.el.dispatchEvent(event);
    return event;
  }

  /** Take the element, and every blit inside it, out of the document and the frame. */
  remove() {
    const s = this.#s;
    const root = rootOf(s);
    if (root) {
      for (const element of [s.el, ...s.el.querySelectorAll(`[${BLIT_ATTR}]`)]) {
        const state = stateOf(element);
        root.dirty.delete(state);
        root.measure.delete(state);
        if (state) stopTraits(state);
      }
    }
    s.el.remove();
  }

  /**
   * Frame a blit in this blit's root: the camera snaps to fit its global
   * bounds (the motion add-on makes it fly).
   * @param {Blit|Element|string} target
   * @param {object} [options] `padding`, `maxZoom`; with motion also `immediate`, `duration`, `easing`
   * @returns {{x: number, y: number, scale: number}} the resolved camera
   */
  view(target, options) {
    const root = requireRoot(this.#s, 'view');
    const { x, y, w, h } = (target instanceof Blit ? target : blit(target)).bounds;
    const resolved = root.camera.fit({ x, y, width: w, height: h }, root.hostRect, options);
    schedule(root);
    return resolved;
  }

  /**
   * Run `fn(ctx)` every frame in the `read` or `write` phase of this blit's
   * root. The extension hook. @returns {() => void} off
   */
  tick(fn, phase = 'write') {
    const root = requireRoot(this.#s, 'tick');
    if (typeof fn !== 'function') throw new TypeError('blit.tick: expected a function');
    if (!PHASES.includes(phase)) throw new TypeError(`blit.tick: unknown phase "${phase}"`);
    root.hooks[phase].add(fn);
    schedule(root);
    return () => { root.hooks[phase].delete(fn); };
  }
}

/* ------------------ THE TWO EXPORTS ------------------ */

/**
 * The handle for an element: the cached one when it is already a blit;
 * otherwise a root over a host (a selector, or an element in the document
 * under no root), a child adopted into the root it sits under, or a potential
 * blit for a detached element or a `<template>`.
 *
 * @param {string|Element} target
 * @returns {Blit}
 */
export function blit(target) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element || element.nodeType !== 1) {
    throw new TypeError(`blit: no element for ${String(target)}`);
  }

  // A record made without a handle (the Pin engine's element state) gets one here.
  const existing = stateOf(element);
  if (existing) return existing.handle || new Blit(existing);

  const state = createState(element);
  const handle = new Blit(state);
  if (isTemplate(element) || !element.isConnected) {
    adoptPlacement(state);
    return handle;
  }

  const hostElement = element.parentElement?.closest(`[${ROOT_ATTR}]`);
  if (hostElement && stateOf(hostElement)) {
    adoptPlacement(state);
    attach(state);
    return handle;
  }

  const root = mountRoot(state);
  runTraits(state);
  for (const found of scanRoot(root)) blit(found);
  return handle;
}

/**
 * Define a type from `{html, defaults}`, or look one up by name. The result is
 * a potential blit over the `<template data-type>`; its `spec` is the
 * defaults every instance starts from.
 *
 * @param {string} name
 * @param {{html?: string, defaults?: object}} [definition]
 * @returns {Blit|null} null when looking up a name nothing declares
 */
export function type(name, definition) {
  const template = defineType(name, definition);
  if (!template) return null;

  const handle = blit(template);
  if (definition?.defaults) handle.set(definition.defaults);
  return handle;
}

/** Name traits and ports: `blit.use({drag: fn})`. The one static on `blit`. */
blit.use = use;

/* ------------------ HELPERS ------------------ */

/** A placement key as a number; `w`/`h` also take null to undeclare a size. */
function writePlacement(state, key, value) {
  if ((key === 'w' || key === 'h') && (value === null || value === undefined)) {
    state[key] = null;
    return;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`blit.set: ${key}=${String(value)} is not a number`);
  state[key] = number;
}

/** Text into the element's own slots. Text only: no markup path exists here. */
function writeFill(element, fill) {
  if (!fill || typeof fill !== 'object') throw new TypeError('blit.set: fill must be an object');
  const slots = ownSlots(element);
  for (const [name, text] of Object.entries(fill)) {
    const slot = slots.find((candidate) => candidate.getAttribute(SLOT_ATTR) === name);
    if (!slot) throw new TypeError(`blit.set: no slot "${name}"`);
    slot.textContent = String(text ?? '');
  }
}

/** The `[data-slot]`s that belong to this blit rather than to a nested one. */
function ownSlots(element) {
  const template = isTemplate(element);
  return Array.from((template ? element.content : element).querySelectorAll(`[${SLOT_ATTR}]`))
    .filter((slot) => template || slot.closest(`[${BLIT_ATTR}]`) === element);
}

function requireRoot(state, method) {
  const root = rootOf(state);
  if (!root) throw new TypeError(`blit.${method}: a potential blit has no root`);
  return root;
}

/**
 * Move placement declared in `data-x` etc. into the state and off the element,
 * where a stale value would lie. `readSpec` has already checked the numbers.
 */
function adoptPlacement(state) {
  const declared = readSpec(state.el);
  for (const key of PLACEMENT_KEYS) {
    if (declared[key] === undefined) continue;
    state[key] = declared[key];
    writeAttribute(state.el, key, null);
    state.changed.add(key);
  }
}

/** Join the root the element sits under; a top-level element moves onto the plane. Its traits start here. */
function attach(state) {
  const root = rootOf(state);
  if (parentElementOf(state.el) === root.host && state.el.parentElement !== root.plane) {
    root.plane.appendChild(state.el);
  }
  root.dirty.add(state);
  root.measure.add(state);
  schedule(root);
  runTraits(state);
}
