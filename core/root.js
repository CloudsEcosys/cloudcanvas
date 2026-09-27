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
import { DEFAULT_HOST_RECT, createRoot, measureBlits, paintBlits } from './frame.js';
import { formatTransform3D } from './port.js';
import { BLIT_ATTR, ROOT_ATTR } from './state.js';

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

  const root = createRoot({
    host,
    plane: adoptOrCreate(host, PLANE_ATTR),
    overlay: adoptOrCreate(host, OVERLAY_ATTR),
    camera: new Camera()
  });
  root.hostRect = hostRectOf(host);
  // The root's own passes, registered before any hook can be: its blits are
  // measured first in the read phase, painted first in the write phase, and the
  // camera transform follows the ports.
  root.hooks.read.add(() => measureBlits(root));
  root.hooks.write.add(() => paintBlits(root));
  root.hooks.write.add((ctx) => planePass(root, ctx));

  state.root = root;
  return root;
}

/** Rewrite the plane's transform on the frames the camera moved. */
function planePass(root, ctx) {
  if (!ctx.cameraMoved) return;
  const { x, y, scale } = root.camera;
  root.plane.style.transform = formatTransform3D(x, y, 0, scale);
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
