/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The root: what `blit('#app')` does to its host element. Two layers go inside
 * the host - the plane, which carries the camera transform and every blit, and
 * the overlay, drawn in screen space on top - and the frame machinery lives on
 * the host's own state. Existing layers are adopted, so a second `blit()` over
 * the host is the same root. The host is itself a blit: `app.blits` are the
 * plane's direct blits.
 */
import { Camera } from './camera.js';
import { OVERLAY_ATTR, PLANE_ATTR, injectCoreStyles } from './css.js';
import { loopStep } from './frame.js';
import { BLIT_ATTR, ROOT_ATTR } from './state.js';

/** Camera framing used when the host has no measurable box yet. */
const DEFAULT_HOST_RECT = /* @__PURE__ */ Object.freeze({ width: 800, height: 600, left: 0, top: 0 });

/** The existing direct child carrying `attribute`, or a fresh one appended. */
function adoptOrCreate(host, attribute) {
  const existing = host.querySelector(`:scope > [${attribute}]`);
  if (existing) return existing;

  const element = document.createElement('div');
  element.setAttribute(attribute, '');
  host.appendChild(element);
  return element;
}

/** Turn a host's state into a root - layers, camera, frame loop - kept as `state.root`. */
export function mountRoot(state) {
  const host = state.el;
  injectCoreStyles();
  host.setAttribute(ROOT_ATTR, '');

  const root = {
    host,
    plane: adoptOrCreate(host, PLANE_ATTR),
    overlay: adoptOrCreate(host, OVERLAY_ATTR),
    camera: new Camera(),
    hostRect: hostRectOf(host),
    rafId: null,
    _lastTs: null,
    loop: null,
    frameCount: 0,
    applied: null,
    /** @type {Set<object>} states queued for the next write phase */
    dirty: new Set(),
    /** @type {Set<object>} states queued for the next read phase */
    measure: new Set(),
    /** Extension hooks, run every frame in their phase. */
    hooks: { read: new Set(), write: new Set() }
  };
  root.loop = (timestamp) => loopStep(root, timestamp);

  state.root = root;
  return root;
}

/** The host's client box, or the default framing box without one. */
function hostRectOf(host) {
  const rect = host.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? rect : DEFAULT_HOST_RECT;
}

/** Every `[data-blit]` under the host, in document order: ancestors come first. */
export function scanRoot(root) {
  return Array.from(root.host.querySelectorAll(`[${BLIT_ATTR}]`));
}
