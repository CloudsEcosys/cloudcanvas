/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `blit`: a thin handle over any DOM element, HTML or SVG. State lives in `./state.js` keyed by the element,
 * the handle cached there (`blit(el) === blit(el)`); the DOM tree is the hierarchy; events are native. A blit is
 * *potential* (detached or a `<template>`: writes apply at once), *indexed* (in a root: placement waits for the
 * write phase) or a *collection*. `set()` routes `x y z w h` to the port, `id` to the element (the root's
 * index), `fill` into `[data-slot]`s, `port`, `with` and `blit.use()` names to `./use.js`, the rest to `data-*`.
 */
import {
  BLIT_ATTR, PLACEMENT_KEYS, ROOT_ATTR, SLOT_ATTR, SLOT_HTML_ATTR,
  boundsOf, createState, isWithin, parentElementOf, rootOf, scopeContainerOf, sizeOf, stateOf
} from './state.js';
import { readSpec, writeAttribute } from './spec.js';
import { PHASES, paint, schedule } from './frame.js';
import {
  allows, attachBlit, demoteOthers, findBlit, heldRootOf, indexBlit, mountRoot, releaseBlits, setViewRoot
} from './root.js';
import { TYPE_ATTR, defineType, findType, instantiate, isTemplate } from './type.js';
import { runTraits, specTraits, use, writeTraitKey } from './use.js';

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
      .map(blit);
  }

  /** `data-*` keys, placement, slot text, named traits and port: `parent.blit(b.spec)` reproduces it. */
  get spec() {
    const s = this.#s;
    const spec = readSpec(s.el);
    for (const key of PLACEMENT_KEYS) delete spec[key];
    specTraits(s, spec);
    if (s.el.id) spec.id = s.el.id;
    spec.x = s.x;
    spec.y = s.y;
    if (s.z !== 0) spec.z = s.z;
    if (s.w !== null) spec.w = s.w;
    if (s.h !== null) spec.h = s.h;
    const fill = ownSlots(s.el).map((slot) => [slot.getAttribute(SLOT_ATTR), slotValue(slot)]);
    if (fill.length > 0) spec.fill = Object.fromEntries(fill);
    return spec;
  }

  /** Write keys: placement is queued to the port when attached, at once when potential; the rest lands now. */
  set(patch) {
    if (!patch || typeof patch !== 'object') throw new TypeError('blit.set: expected an object');
    const s = this.#s;
    if (s.root && PLACEMENT_KEYS.some((key) => key in patch)) {
      throw new TypeError('blit.set: a root has no placement; move its camera with view()');
    }

    let measure = false;
    for (const [key, value] of Object.entries(patch)) {
      if (PLACEMENT.has(key)) writePlacement(s, key, value);
      else if (key === 'id') writeId(s, value);
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

  /** A child blit: its type's content and defaults, `spec` over them; into `[data-scope]`, or a root's plane. */
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
    attachBlit(child.#s);
    return child;
  }

  /** Listen for a native event on the element. @returns {() => void} off */
  on(type, listener, options) {
    this.#s.el.addEventListener(type, listener, options);
    return () => this.#s.el.removeEventListener(type, listener, options);
  }

  /** Dispatch a bubbling, cancelable `CustomEvent`, `detail = {payload, source}`; returned for `defaultPrevented`. */
  emit(type, payload = null) {
    const event = new CustomEvent(type, { bubbles: true, cancelable: true, detail: { payload, source: this } });
    this.#s.el.dispatchEvent(event);
    return event;
  }

  /** Announce `remove` (it bubbles), then take the element and every blit inside it out of the document, the
   * frame and the id index. */
  remove() {
    const s = this.#s;
    this.emit('remove');
    const root = heldRootOf(s.el);
    if (root) releaseBlits(root, s.el);
    // A view root that goes, alone or inside this blit, hands the view back to the whole root.
    if (root?.view && (root.view === s.el || s.el.contains(root.view)) && setViewRoot(root, null)) demoteOthers(root);
    s.anchor?.remove();
    s.anchor = null;
    s.el.remove();
  }

  /** On a root collection, the blit it renders as its world: the host until another is promoted; else null. */
  get root() { return this.#s.root ? blit(this.#s.root.view || this.#s.el) : null; }

  /** Promote a blit of this root (null: the host again); every blit off its branch is hidden until it changes. */
  set root(target) {
    const root = this.#s.root;
    if (!root) throw new TypeError('blit.root: only a root collection has a root to set');
    const element = blit(target ?? root.host).el;
    if (element !== root.host && !isWithin(root.host, element)) throw new TypeError('blit.root: not a blit of this root');
    if (setViewRoot(root, element)) demoteOthers(root);
  }

  /** The blit this blit's root indexes under `id`, a parked one included, or null. */
  find(id) {
    const element = findBlit(requireRoot(this.#s, 'find'), id);
    return element ? blit(element) : null;
  }

  /**
   * Frame a blit in this blit's root - by default its current root; the host is the identity camera.
   * The camera snaps to fit the global bounds (the motion add-on makes it fly).
   * @param {Blit|Element|string} [target] a blit on the current root's branch
   * @param {object} [options] `padding`, `maxZoom`; with motion also `immediate`, `duration`, `easing`
   * @returns {{x: number, y: number, scale: number}} the resolved camera
   */
  view(target, options) {
    const root = requireRoot(this.#s, 'view');
    const handle = blit(target === undefined ? root.view || root.host : target);
    if (!allows(root, handle.el)) throw new TypeError('blit.view: the target is hidden by the current root');
    const atHost = handle.el === root.host;
    const { x, y, w, h } = atHost ? { x: 0, y: 0, w: root.hostRect.width, h: root.hostRect.height } : handle.bounds;
    const resolved = root.camera.fit({ x, y, width: w, height: h }, root.hostRect,
      atHost ? { ...options, padding: 0, maxZoom: 1 } : options);
    schedule(root);
    return resolved;
  }

  /** The extension hook: `fn(ctx)` every frame in the `read` or `write` phase of this blit's root. @returns off */
  tick(fn, phase = 'write') {
    const root = requireRoot(this.#s, 'tick');
    if (typeof fn !== 'function') throw new TypeError('blit.tick: expected a function');
    if (!PHASES.includes(phase)) throw new TypeError(`blit.tick: unknown phase "${phase}"`);
    root.hooks[phase].add(fn);
    schedule(root);
    return () => { root.hooks[phase].delete(fn); };
  }
}

/**
 * The handle for an element: the cached one; else a root over a host (a selector, or an element under no root),
 * a child adopted into the root it sits under, or a potential blit (detached, or a `<template>`).
 * @param {string|Element|Blit} target a handle answers itself
 * @returns {Blit}
 */
export function blit(target) {
  const element = typeof target === 'string' ? document.querySelector(target) : (target instanceof Blit ? target.el : target);
  if (!element || element.nodeType !== 1) throw new TypeError(`blit: no element for ${String(target)}`);

  const existing = stateOf(element);
  if (existing) return existing.handle;

  const state = createState(element);
  const handle = new Blit(state);
  const potential = isTemplate(element) || !element.isConnected;
  const hostElement = element.parentElement?.closest(`[${ROOT_ATTR}]`);
  if (potential || (hostElement && stateOf(hostElement))) {
    adoptType(state);
    adoptPlacement(state);
    if (!potential) attachBlit(state);
    return handle;
  }

  const root = mountRoot(state);
  runTraits(state);
  for (const found of root.host.querySelectorAll(`[${BLIT_ATTR}]`)) blit(found);
  return handle;
}

/**
 * Define a type, or look one up by name: a potential blit over the `<template data-type>`, its `spec` the
 * defaults every instance starts from; `with` traits run on every instance (`./type.js`).
 * @param {string} name
 * @param {{html?: string, template?: HTMLTemplateElement, defaults?: object, with?: Function[]}} [definition]
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

/** A placement key as a number; `w`/`h` also take null to undeclare a size. */
function writePlacement(state, key, value) {
  const unset = (key === 'w' || key === 'h') && (value === null || value === undefined);
  if (!unset && !Number.isFinite(Number(value))) throw new TypeError(`blit.set: ${key}=${String(value)} is not a number`);
  state[key] = unset ? null : Number(value);
}

/** The element id, which a root indexes the blit under (`find`); null or '' removes it. */
function writeId(state, value) {
  if (value === null || value === undefined || value === '') state.el.removeAttribute('id');
  else state.el.id = String(value);
  const root = heldRootOf(state.el);
  if (root && root.host !== state.el) indexBlit(root, state.el);
}

/** Text into the element's own slots; markup only into a slot its template marks `data-slot-html`. */
function writeFill(element, fill) {
  if (!fill || typeof fill !== 'object') throw new TypeError('blit.set: fill must be an object');
  const slots = ownSlots(element);
  for (const [name, text] of Object.entries(fill)) {
    const slot = slots.find((candidate) => candidate.getAttribute(SLOT_ATTR) === name);
    if (!slot) throw new TypeError(`blit.set: no slot "${name}"`);
    if (slot.hasAttribute(SLOT_HTML_ATTR)) slot.innerHTML = String(text ?? '');
    else slot.textContent = String(text ?? '');
  }
}

/** A slot's value as `fill` reads it back: markup from an html slot, else text. */
function slotValue(slot) {
  return slot.hasAttribute(SLOT_HTML_ATTR) ? slot.innerHTML : slot.textContent;
}

/** The `[data-slot]`s that are this blit's: not a nested blit's, nor inside another slot (html fill content). */
function ownSlots(element) {
  const scope = isTemplate(element) ? element.content : element;
  return Array.from(scope.querySelectorAll(`[${SLOT_ATTR}]`)).filter((slot) => {
    const outer = slot.parentElement?.closest(`[${SLOT_ATTR}]`);
    const nested = Boolean(outer) && outer !== element && scope.contains(outer);
    return !nested && (scope !== element || slot.closest(`[${BLIT_ATTR}]`) === element);
  });
}

function requireRoot(state, method) {
  const root = rootOf(state);
  if (!root) throw new TypeError(`blit.${method}: a potential blit has no root`);
  return root;
}

/** Markup naming a type: its structure cloned in when the element is empty, its defaults under what it declares. */
function adoptType(state) {
  const template = isTemplate(state.el) ? null : findType(state.el.getAttribute(TYPE_ATTR) ?? '');
  if (!template) return;
  if (state.el.children.length === 0) state.el.appendChild(template.content.cloneNode(true));
  const declared = readSpec(state.el);
  for (const [key, value] of Object.entries(blit(template).spec)) {
    if (!(key in declared) && !PLACEMENT.has(key) && key !== 'fill') writeAttribute(state.el, key, value === true ? '' : value);
  }
}

/** Move placement declared in `data-x` etc. into the state and off the element, where it would go stale. */
function adoptPlacement(state) {
  const declared = readSpec(state.el);
  for (const key of PLACEMENT_KEYS) {
    if (declared[key] === undefined) continue;
    state[key] = declared[key];
    writeAttribute(state.el, key, null);
    state.changed.add(key);
  }
}

