/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The default port: the browser painting the element. A port is any `(b, ctx) => void` the write phase calls
 * for a dirty blit. This one writes the transform and any declared size, each only when it moved (five floats
 * against the last write), so a still blit costs no DOM write and no string.
 */
import { stateOf } from './state.js';

/** @type {WeakMap<Element, Float64Array>} element -> the last placement written */
const APPLIED = /* @__PURE__ */ new WeakMap();

/** A hardware-accelerated 3D transform; `../graphics/styles.js` re-exports it. */
export function formatTransform3D(x, y, z = 0, scale = 1) {
  const translate = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px)`;
  return scale === 1 ? translate : `${translate} scale(${scale.toFixed(4)})`;
}

/** Forget the last placement written for an element, so the next port call writes it in full. */
export function forgetPlacement(element) {
  return APPLIED.delete(element);
}

/** Paint a blit's placement: `b` is the handle, or any `{el, x, y, z}` (a Pin's state). @returns {boolean} wrote */
export function defaultPort(b) {
  const element = b.el;
  if (!element.style) return false;

  const { x, y, z } = b;
  if (!APPLIED.has(element)) APPLIED.set(element, new Float64Array(5).fill(NaN));
  const applied = APPLIED.get(element);
  let written = false;
  if (applied[0] !== x || applied[1] !== y || applied[2] !== z) {
    element.style.transform = formatTransform3D(x, y, z);
    applied.set([x, y, z]);
    written = true;
  }
  return writeSize(element, stateOf(element), applied) || written;
}

/** Write a declared width and height; an undeclared axis is left to the element. */
function writeSize(element, state, applied) {
  const { w, h } = state;
  let written = false;
  if (w !== null && applied[3] !== w) {
    element.style.width = `${w}px`;
    applied[3] = w;
    written = true;
  }
  if (h !== null && applied[4] !== h) {
    element.style.height = `${h}px`;
    applied[4] = h;
    written = true;
  }
  return written;
}
