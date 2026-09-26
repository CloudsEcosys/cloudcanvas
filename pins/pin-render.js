/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The Pin's render contract: how work is *requested* (invalidation) and the
 * synchronous tick and render path that serves callers with no renderer.
 *
 * `ConjugateRenderer` splits this same work across its frame phases for every
 * attached Pin; this path stays for unattached and headless Pins, and for
 * direct callers. Both agree by construction because both read their DOM
 * membership decisions from the same reload policy (`./reload.js`), and both
 * enter the content write through `renderContent` below.
 *
 * Every function takes the Pin as its first argument.
 */
import { CONTENT_CLASS } from './pin-element.js';
import { deferRender } from './pin-edit.js';
import { forEachChild, hasChildren } from './pin-hierarchy.js';
import { RELOAD_MODES, resolveReloadMode } from './reload.js';

/** The two invalidation kinds the conjugate renderer understands. */
const INVALIDATION_KINDS = new Set(['content', 'structure']);

/**
 * Declare that a Pin needs work on the next frame.
 *
 * With a renderer attached the request is queued (nothing touches the DOM
 * here). Otherwise the kind is kept for replay at attach time and the Pin
 * renders synchronously, which keeps unattached and headless Pins behaving
 * exactly as they always have.
 *
 * @param {'content'|'structure'} kind
 */
export function invalidate(pin, kind = 'content') {
  if (!INVALIDATION_KINDS.has(kind)) {
    throw new TypeError(`Pin "${pin.id}": unknown invalidation kind "${kind}"`);
  }

  if (pin._renderer) {
    pin._renderer.invalidate(pin, kind);
    return;
  }

  pin._pendingInvalidations.add(kind);
  pin.render();
}

/** Invalidation kinds recorded before a renderer existed (replayed at attach). */
export function takePendingInvalidations(pin) {
  const pending = Array.from(pin._pendingInvalidations);
  pin._pendingInvalidations.clear();
  return pending;
}

/**
 * Execute trait tick lifecycle hooks.
 *
 * Sleep is absolute: an inactive Pin runs no trait ticks, and its subtree is
 * skipped with it (deactivation cascades, so those children are asleep too).
 */
export function tick(pin, dt = 1, context = {}) {
  if (!pin.active) return;

  for (const trait of pin.traits.values()) {
    if (typeof trait.onTick === 'function') {
      trait.onTick(pin, dt, context);
    }
  }

  // Per frame: the non-allocating walk, never the `children` Set.
  forEachChild(pin, tickChild, dt, context);
}

/** `forEachChild` visitor for `tick`. */
function tickChild(child, dt, context) {
  child.tick(dt, context);
}

/**
 * Run every trait's `onRender` hook against the display-only content element.
 *
 * This is the single content funnel: the renderer's batched write phase and the
 * synchronous path below both arrive here, so the two gates it opens with are
 * total.
 *
 *   - the edit lock (`./pin-edit.js`): a Pin being edited defers, whole. Not
 *     even the accessible name is rewritten, because a live editor is exactly
 *     the moment a screen reader must not be told the label changed underneath
 *     it, and
 *   - the content class: re-asserted below, because losing it is silent.
 *
 * The trait contract, in one sentence: a trait owns what is *inside* the content
 * node, and touches its class list with `classList.add/remove/toggle` - never
 * `element.className = '...'`, which erases the structural class the pointer
 * router, the text-selection predicate, and the stylesheet all key on. The
 * funnel repairs that class, but nothing can repair the trait's own classes it
 * takes down with it.
 *
 * The Pin's root element and its scope container are never handed to a trait,
 * so no display implementation can detach mounted child Pins.
 *
 * @returns {boolean} true when the traits actually rendered
 */
export function renderContent(pin, context = {}) {
  if (deferRender(pin)) return false;

  const target = pin.getContentElement();
  if (!target) return false;

  assertContentClass(target);
  writeAriaLabel(pin);

  for (const trait of pin.traits.values()) {
    if (typeof trait.onRender === 'function') {
      trait.onRender(pin, pin.contents, target, context);
    }
  }
  return true;
}

/**
 * Re-assert the content node's structural class.
 *
 * `CONTENT_CLASS` is structure, not decoration: `../engine/pointer.js` finds
 * text regions through it, `isTextRegionTarget` walks to it, and every content
 * rule in the stylesheet hangs off it. One `element.className = 'my-thing'`
 * inside a trait erases all three at once, and nothing fails loudly - the Pin
 * simply stops behaving like a Pin.
 *
 * Repaired additively so a trait keeps the classes it meant to set, and gated on
 * a `contains` check so the healthy case is a hash lookup and zero DOM writes.
 *
 * @returns {boolean} true when the class had to be restored
 */
function assertContentClass(target) {
  if (!target.classList || target.classList.contains(CONTENT_CLASS)) return false;
  target.classList.add(CONTENT_CLASS);
  return true;
}

/**
 * Keep the element's accessible name in step with the Pin's title.
 *
 * This is the render funnel every content write passes through - the batched
 * one in the renderer and the synchronous one below - so it is the only place
 * that has to know about it. The write is change-gated against a value cached
 * on the Pin: an idle frame performs zero DOM writes, and re-rendering a Pin
 * whose title did not change must not turn that into one.
 *
 * A Pin with no title is named by its id rather than left anonymous: `group`
 * with no accessible name is announced as nothing at all.
 *
 * @returns {boolean} true when the attribute was rewritten
 */
function writeAriaLabel(pin) {
  if (!pin.element || typeof pin.element.setAttribute !== 'function') return false;

  const title = pin.contents.get('title');
  const text = title === null || title === undefined ? '' : String(title).trim();
  const label = text === '' ? pin.id : text;

  if (pin._ariaLabel === label) return false;
  pin._ariaLabel = label;
  pin.element.setAttribute('aria-label', label);
  return true;
}

/** Full synchronous render: contents, measurement, transform, and children. */
export function render(pin, context = {}) {
  if (!pin.active) {
    // An inactive Pin renders nothing; it only settles into its resting DOM state.
    pin._reconcile();
    return;
  }

  if (pin.element) {
    pin.renderContent(context);
    pin.syncDimensions();
  }
  pin.renderPosition();

  if (hasChildren(pin)) renderChildren(pin, context);
}

/**
 * Render children, honouring each child's reload strategy: an unmounted or
 * dormant child is never dragged back into the scope by a parent render.
 */
function renderChildren(pin, context) {
  const scopeElement = pin.getOrCreateScopeElement();
  forEachChild(pin, renderChild, scopeElement, context);
}

/** `forEachChild` visitor for `renderChildren`: settle a child, or bring it back into scope and render it. */
function renderChild(child, scopeElement, context) {
  if (resolveReloadMode(child) !== RELOAD_MODES.MOUNTED) {
    child._reconcile();
    return;
  }
  if (scopeElement && child.element && child.element.parentNode !== scopeElement) {
    child.mount(scopeElement);
  }
  child.render(context);
}
