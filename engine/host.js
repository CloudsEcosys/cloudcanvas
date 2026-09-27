/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Everything the session does *to its host element*: the four layers it builds
 * inside it, the root add-ons it installs on it (announce, pan, menu, keyboard), and
 * taking both away again. The only place a layer element is created or removed.
 *
 * The layers are found before they are built, so a re-`mount()` onto a host that
 * already carries them adopts what is there instead of stacking a second set.
 */
import { bindKeyboard, unbindKeyboard } from './keyboard.js';
import { mountContextMenu, unmountContextMenu } from './context-menu.js';
import { bindPointer } from './pointer.js';
import { applyHostAria, mountAnnouncer, removeHostAria, unmountAnnouncer } from './announcer.js';

/** SVG namespace for the vector layer. */
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Layer classes, in paint order; each is also the selector it is found by. */
export const LAYER_CLASSES = /* @__PURE__ */ Object.freeze({
  SVG: 'cloudcanvas-svg-layer',
  PLANE: 'cloudcanvas-plane',
  VEIL: 'cloudcanvas-focus-veil',
  OVERLAY: 'cloudcanvas-overlay-layer'
});

/** Class the session puts on its host element while it is mounted. */
export const HOST_CLASS = 'cloudcanvas-host';

/** The existing child with this class, or a fresh element appended to `host`. */
function adoptOrCreate(host, className, create) {
  const existing = host.querySelector(`:scope > .${className}`);
  if (existing) return existing;

  const element = create();
  host.appendChild(element);
  return element;
}

/**
 * Build (or adopt) the session's four layers inside its host element.
 *
 * Order is paint order, and each layer's z-index is a token, so a consumer can
 * reorder them without the elements moving:
 *
 *   1/2. `.cloudcanvas-svg-layer`     connectors and vector geometry, in canvas
 *        coordinates - it carries the same camera transform as the plane.
 *   3.   `.cloudcanvas-plane`         every Pin element, and the focus veil as
 *        its first child so the veil sits under the Pins in document order and
 *        is lifted over them by `--cc-z-veil` alone.
 *   4.   `.cloudcanvas-overlay-layer` cursors and HUD, untransformed: the one
 *        layer that draws in screen space.
 *
 * @returns {boolean} true when the layers are in place
 */
export function mountLayers(session) {
  const host = session.hostElement;
  if (!host || typeof document === 'undefined') return false;

  // Recorded, not assumed: a page that already marks its own canvas host keeps
  // the class through `destroy()`, and one that does not gets it taken back off.
  session._hostClassAdded = !host.classList.contains(HOST_CLASS);
  host.classList.add(HOST_CLASS);

  session.svgLayerElement = adoptOrCreate(host, LAYER_CLASSES.SVG, () => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', LAYER_CLASSES.SVG);
    return svg;
  });
  // Persistent per-trait `<g>` groups live here, owned by the renderer.
  session.renderer.setSvgLayerElement(session.svgLayerElement);

  const plane = adoptOrCreate(host, LAYER_CLASSES.PLANE, () => {
    const element = document.createElement('div');
    element.className = LAYER_CLASSES.PLANE;
    return element;
  });
  session.planeElement = plane;
  session.pinManager.setContainer(plane);
  session.renderer.setPlaneElement(plane);

  let veil = plane.querySelector(`:scope > .${LAYER_CLASSES.VEIL}`);
  if (!veil) {
    veil = document.createElement('div');
    veil.className = LAYER_CLASSES.VEIL;
    plane.insertBefore(veil, plane.firstChild);
  }
  session.focusVeilElement = veil;

  session.overlayElement = adoptOrCreate(host, LAYER_CLASSES.OVERLAY, () => {
    const element = document.createElement('div');
    element.className = LAYER_CLASSES.OVERLAY;
    return element;
  });

  return true;
}

/**
 * Detach every layer this session built, forget them, and hand the host back.
 *
 * The host is the one element the session does not own, so the reversal is
 * exact rather than wholesale: the class goes only if `mountLayers` was the one
 * that added it, and the `class` attribute itself is removed when taking it
 * away leaves the attribute empty - an empty `class=""` is residue too.
 */
export function unmountLayers(session) {
  for (const key of ['focusVeilElement', 'planeElement', 'svgLayerElement', 'overlayElement']) {
    const element = session[key];
    if (element && element.parentNode) element.parentNode.removeChild(element);
    session[key] = null;
  }

  const host = session.hostElement;
  if (host && host.classList && session._hostClassAdded) {
    host.classList.remove(HOST_CLASS);
    if (host.getAttribute('class') === '') host.removeAttribute('class');
  }
  session._hostClassAdded = false;
  return true;
}

/**
 * Install the root add-ons on the session's host: the ARIA identity and live
 * region (`./announcer.js`), then pan before menu - so a right-click that
 * cancels a gesture opens nothing - then keyboard, and the resize listener that
 * keeps the cached host rect honest. A re-bind takes the previous set off first.
 * @returns {boolean} true when the add-ons were installed
 */
export function bindSessionEvents(session) {
  if (!session.hostElement) return false;
  unbindSessionEvents(session);

  applyHostAria(session);
  mountAnnouncer(session);
  session._offPointer = bindPointer(session);
  mountContextMenu(session);
  bindKeyboard(session);
  window.addEventListener('resize', session._onResize);
  return true;
}

/** Take off everything `bindSessionEvents` installed. */
export function unbindSessionEvents(session) {
  unbindKeyboard(session);
  unmountContextMenu(session);
  if (session._offPointer) session._offPointer();
  session._offPointer = null;
  unmountAnnouncer(session);
  removeHostAria(session);
  if (typeof window !== 'undefined') window.removeEventListener('resize', session._onResize);
  return true;
}
