/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A core scene for the add-on suites: a root over `#app`, and the native
 * pointer stream a real press produces - `pointerdown` on the element (it
 * bubbles), then `pointermove` / `pointerup` on the window.
 */
import { blit } from '../../core/index.js';
import { stateOf } from '../../core/state.js';
import { resetDocument } from './dom.js';

/** A root over a fresh `#app` holding `html`, scanned. */
export function coreScene(t, html = '') {
  const host = document.createElement('div');
  host.id = 'app';
  host.innerHTML = html;
  document.body.appendChild(host);
  t.after(resetDocument);
  const app = blit('#app');
  return { host, app, root: stateOf(host).root };
}

function pointer(type, x, y, extra = {}) {
  return new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, isPrimary: true, pointerId: 1, ...extra });
}

/** Press on `target` at client `(x, y)`. */
export function press(target, x, y, extra) {
  target.dispatchEvent(pointer('pointerdown', x, y, extra));
}

/** Move the pointer to `(x, y)`. */
export function move(x, y) {
  window.dispatchEvent(pointer('pointermove', x, y));
}

/** Release the pointer at `(x, y)`. */
export function release(x, y) {
  window.dispatchEvent(pointer('pointerup', x, y));
}

/** Every `type` event dispatched on (or bubbling through) the blit, as `{type, payload}`. */
export function signals(b, type) {
  const seen = [];
  b.on(type, (event) => seen.push({ type: event.type, payload: event.detail.payload }));
  return seen;
}
