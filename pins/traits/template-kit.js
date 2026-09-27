/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Template kit: the mutation primitives a `{ build, update }` template writes
 * through, and the one list reconciler.
 *
 * These helpers were private to `./display-templates.js` for as long as the
 * built-in templates were the only templates. They are the public half of that
 * module now: a component author writing an `update` pass needs exactly the same
 * four writes the built-ins do - text through `Text.data`, attributes only when
 * they moved, an SVG slot only when its inputs changed, and visibility through
 * `hidden` - and re-deriving them per component is how inline styles, `innerHTML`
 * churn and unescaped text get back in.
 *
 * Every write is a *diff first*: nothing is assigned unless the new value
 * differs from what the DOM already holds. That is what keeps an idle frame at
 * zero DOM writes, which the renderer's whole update model depends on.
 *
 * `CLS` is re-exported so a component author has one import for both the class
 * table and the writes that use it. The list reconciler lives on the add-on side
 * (`../../addons/keyed-list.js`) and is re-exported here under its old names.
 */

export { CLS } from './display-templates.js';
export { KEY_ATTR, reconcileKeyedList } from '../../addons/keyed-list.js';

/* ------------------ ELEMENT CONSTRUCTION ------------------ */

/** Create an element, optionally classed. Structure only - never a style. */
export function makeElement(tag, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

/** Append an empty Text node and hand it back as the write target. */
export function makeTextNode(parent) {
  const node = document.createTextNode('');
  parent.appendChild(node);
  return node;
}

/* ------------------ MUTATION ------------------ */

/**
 * Write text through `Text.data`, which the DOM escapes for us.
 * `undefined` and `null` are the empty string, not the words.
 */
export function setText(node, value) {
  const text = value === undefined || value === null ? '' : String(value);
  if (node.data !== text) node.data = text;
}

/** Show or hide an element through `hidden`, so no inline style is needed. */
export function setVisible(element, visible) {
  const hidden = !visible;
  if (element.hidden !== hidden) element.hidden = hidden;
}

/** Write an attribute only when its value actually moved (cheap, and `img.src` re-fetches). */
export function setAttr(element, name, value, cache, key) {
  if (cache[key] === value) return;
  cache[key] = value;
  element.setAttribute(name, value);
}

/** Re-render an SVG string slot only when its inputs changed. */
export function setSlot(slot, markup, cache, key, signature) {
  if (cache[key] === signature) return;
  cache[key] = signature;
  slot.innerHTML = markup;
}
