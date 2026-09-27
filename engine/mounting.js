/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * DOM membership: where a Pin's element goes, and which Pins are allowed
 * anywhere at all.
 *
 * Three concerns, all deliberately kept out of `ConjugateRenderer` so the frame
 * loop reads as three phases and nothing else:
 *
 *   - the element primitives (`mountPin` / `detachPin` / `setDormant`), which are
 *     the only functions in the engine that move a Pin's root element,
 *   - `RenderRootScope`, which answers one question - may this Pin take part? -
 *     for the promoted render root, and
 *   - `flushStructure`, the renderer's first phase: the loop that resolves every
 *     structurally dirty Pin to a DOM state and puts it there. It takes the
 *     renderer as its first argument, the same way the session's transitions
 *     take the session, so the class keeps the sets and this keeps the moves.
 *
 * Nothing here decides *whether* a Pin should be mounted; that is reload policy
 * (`src/pins/reload.js`). These are the mechanics that carry the decision out.
 */
import { stateOf } from '../core/state.js';
import { allows, setViewRoot } from '../core/root.js';
import { park, place } from '../addons/park.js';
import { DORMANT_CLASS, RELOAD_MODES, resolveRenderMode } from '../pins/reload.js';

/** Depth walk guard: a malformed parent cycle must not hang a frame. */
export const MAX_DEPTH = 4096;

/**
 * Place a Pin's element in its parent's scope container, or on the canvas plane
 * when it is a root Pin. A parked element goes back at its anchor, so it keeps
 * its place among its siblings (`../addons/park.js`).
 *
 * @returns {boolean} true when the element ended up inside a container
 */
export function mountPin(pin, planeElement) {
  if (!pin.element) return false;

  const container = pin.parent
    ? pin.parent.getOrCreateScopeElement()
    : planeElement;
  if (!container) return false;

  place(stateOf(pin.element), container);
  return true;
}

/** Park a Pin's element behind an anchor. The Pin instance and all its state are untouched. */
export function detachPin(pin) {
  if (!pin.element) return false;
  return park(stateOf(pin.element));
}

/** Toggle the hidden-but-mounted class (`display: none`). */
export function setDormant(pin, dormant) {
  const classList = pin.element ? pin.element.classList : null;
  if (!classList) return false;

  if (dormant) classList.add(DORMANT_CLASS);
  else classList.remove(DORMANT_CLASS);
  return true;
}

/** Whether a Pin is currently mounted-but-hidden, and so has no layout box. */
export function isDormant(pin) {
  const classList = pin.element ? pin.element.classList : null;
  return Boolean(classList && classList.contains(DORMANT_CLASS));
}

/* ------------------ STRUCTURE FLUSH (renderer phase 1) ------------------ */

/**
 * Bring DOM membership in line with the Pin graph and each Pin's reload
 * strategy.
 *
 * Shallower Pins are handled first, so a child always finds its parent's scope
 * container already in place. Only a Pin that ends up *live* earns work: a
 * dormant one keeps its last rendering and its cached size, and an unmounted
 * one has no box to read at all.
 *
 * @param {ConjugateRenderer} renderer
 * @returns {number} how many Pins ended up mounted in their container
 */
export function flushStructure(renderer) {
  if (renderer.dirtyStructure.size === 0) return 0;

  const pending = byDepth(renderer.dirtyStructure);
  renderer.dirtyStructure.clear();

  let mounted = 0;
  for (const pin of pending) {
    if (!renderer.activeSet.has(pin)) continue;

    const mode = resolveRenderMode(pin, renderer.participates(pin));
    renderer._frameDirty.add(pin);
    if (applyMode(renderer, pin, mode)) mounted += 1;

    if (mode === RELOAD_MODES.MOUNTED) {
      renderer.dirtyContent.add(pin);
      if (pin.element) renderer.measureQueue.add(pin);
    }
  }
  return mounted;
}

/**
 * Put a Pin into the DOM state its reload strategy asks for and update its
 * `liveSet` membership.
 *
 * @returns {boolean} true when the Pin ended up mounted in its container
 */
export function applyMode(renderer, pin, mode) {
  if (!pin.element) {
    renderer.liveSet.delete(pin);
    return false;
  }

  if (mode === RELOAD_MODES.UNMOUNTED) {
    renderer.liveSet.delete(pin);
    setDormant(pin, false);
    cancelDragFor(renderer, pin);
    detachPin(pin);
    return false;
  }

  const mounted = mountPin(pin, renderer.planeElement);

  if (mode === RELOAD_MODES.DORMANT) {
    renderer.liveSet.delete(pin);
    setDormant(pin, true);
    return mounted;
  }

  setDormant(pin, false);
  renderer.liveSet.add(pin);
  return mounted;
}

/**
 * A Pin cannot be dragged by an element that is leaving the document: root
 * promotion mid-gesture ends the gesture rather than stranding it.
 */
function cancelDragFor(renderer, pin) {
  const session = renderer.session;
  if (!session || session.activeDragPin !== pin) return false;
  if (typeof session.cancelDrag !== 'function') return false;

  session.cancelDrag();
  return true;
}

/** Pins ordered shallowest-first by scope depth. */
export function byDepth(pins) {
  const ordered = Array.from(pins);
  const depths = new Map();
  for (const pin of ordered) {
    depths.set(pin, depthOf(pin));
  }
  return ordered.sort((a, b) => depths.get(a) - depths.get(b));
}

/** Number of scope ancestors above a Pin (cycle-safe). */
export function depthOf(pin) {
  let depth = 0;
  let node = pin.parent;
  while (node && depth < MAX_DEPTH) {
    depth += 1;
    node = node.parent;
  }
  return depth;
}

/**
 * The promoted render root and the participation question it answers.
 *
 * Participation is the promoted Pin's whole subtree *plus* its full ancestor
 * chain. The ancestors are the breadcrumb: each one stays mounted and rendered,
 * so the scope above the promoted Pin - and the one above that - stays
 * navigable rather than being torn down and rebuilt on the way back out.
 *
 * With no root promoted every Pin participates, which is exactly the unpromoted
 * canvas: one code path, two configurations.
 *
 * The promotion itself is the core root's (`../core/root.js`): this scope sets
 * the Pin's element as the frame root's view root and asks it the question, so
 * the Pin engine and a `blit('#app')` share one definition of participation.
 */
export class RenderRootScope {
  /** @param {object} frameRoot the core frame root the promotion is held on */
  constructor(frameRoot) {
    this.frameRoot = frameRoot;
    /** @type {Pin|null} */
    this.pin = null;
  }

  /**
   * Promote a Pin, or restore the whole canvas with `null`.
   *
   * @returns {boolean} true when the root actually changed
   */
  set(pin = null) {
    const next = pin || null;
    if (next === this.pin) return false;

    this.pin = next;
    setViewRoot(this.frameRoot, next ? next.element : null);

    // A breadcrumb must be live to be navigable: wake the chain outermost first,
    // so each scope exists before the one nested inside it wakes.
    if (next) {
      for (const ancestor of next.ancestors().reverse()) ancestor.activate();
      next.activate();
    }
    return true;
  }

  /** Whether the current root lets a Pin take part in rendering at all. */
  allows(pin) {
    if (!this.pin || !pin || pin === this.pin) return true;
    return Boolean(pin.element) && allows(this.frameRoot, pin.element);
  }

  /** Root-first trail to the promoted Pin, or [] at the canvas root. */
  breadcrumb() {
    return this.pin ? this.pin.breadcrumb() : [];
  }

  clear() {
    this.pin = null;
    setViewRoot(this.frameRoot, null);
  }
}
