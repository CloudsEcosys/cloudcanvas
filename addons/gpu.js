/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * GPU: a root that draws blits on the GPU. `gpu(app, {backend, layer})` puts a `<canvas data-blit-gpu>` in the
 * host (under the plane by default), loads a backend by `import()` only, and draws every blit on the named port
 * `gpu` (`b.set({port: 'gpu'})`) from one scene (`./gpu-scene.js`) in one write-phase pass after the plane's -
 * and draws nothing on a frame where no drawn blit changed and the camera stood still. A gpu blit's element stays
 * where the default port puts it, transparent, as its hit proxy: pointer events, hit-testing, keyboard roving and
 * the accessibility tree work unchanged. What a blit draws is its `tint` (`#rgb`, `#rrggbb` or `#rrggbbaa`) or
 * the content an add-on gives it through `gpuContent(b, ...)`.
 */
import { schedule } from '../core/frame.js';
import { defaultPort } from '../core/port.js';
import { BLIT_ATTR, boundsOf, isWithin, parentElementOf, rootOf, stateOf } from '../core/state.js';
import { use } from '../core/use.js';
import { createLogger } from '../log.js';
import { Scene, clipMatrix } from './gpu-scene.js';

const logger = /* @__PURE__ */ createLogger('gpu');

/** The marker on the canvas a gpu root draws into. */
export const GPU_ATTR = 'data-blit-gpu';

/** @type {WeakMap<object, object>} root -> its gpu controller */
const GPUS = /* @__PURE__ */ new WeakMap();

/** @type {WeakMap<object, object>} blit state -> the content an add-on gave it */
const CONTENT = /* @__PURE__ */ new WeakMap();

/** @type {WeakMap<Element, string>} proxy element -> the inline opacity it had before */
const PROXIES = /* @__PURE__ */ new WeakMap();

/** The backends by name, loaded on demand so neither lands in a static chunk. */
const BACKENDS = /* @__PURE__ */ Object.freeze({
  webgpu: () => import('./gpu-webgpu.js'),
  webgl2: () => import('./gpu-webgl2.js')
});

/** A hex tint as straight RGBA in 0..1; anything else is white. */
export function parseTint(value) {
  const hex = typeof value === 'string' ? value.trim().replace(/^#/, '') : '';
  if (!/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) return [1, 1, 1, 1];
  const full = hex.length === 3 ? hex.replace(/./g, '$&$&') : hex;
  const channels = full.match(/../g).map((pair) => parseInt(pair, 16) / 255);
  return channels.length === 3 ? [...channels, 1] : channels;
}

/**
 * The port: the default port places the element (the hit proxy), and the blit's record is queued for the
 * scene. Under a root without `gpu(app)` it is the default port and nothing more.
 */
export function gpuPort(b) {
  defaultPort(b);
  const state = stateOf(b.el);
  const controller = state && controllerOf(state);
  if (!controller) return;
  if (!PROXIES.has(b.el)) {
    PROXIES.set(b.el, b.el.style.opacity);
    b.el.style.opacity = '0';
  }
  controller.members.add(state);
  controller.touched.add(state);
}

/**
 * Give a blit what it draws: `{color: [r, g, b, a], texture, uv: [u0, v0, u1, v1], rotation, version}` (a new
 * `version` re-uploads the texture); null goes back to its `tint`. Content add-ons (sprites, text, media) build
 * on this. @returns {object} the blit
 */
export function gpuContent(b, content) {
  const state = stateOf(b.el);
  if (!state) throw new TypeError('gpuContent: not a blit');
  if (content) CONTENT.set(state, content);
  else CONTENT.delete(state);
  const controller = controllerOf(state);
  if (controller) {
    controller.touched.add(state);
    schedule(controller.root);
  }
  return b;
}

/** The controller of the gpu root a blit sits under, or null. */
function controllerOf(state) {
  const root = rootOf(state);
  return (root && GPUS.get(root)) || null;
}

/** What the scene draws for a blit: its global box, depth and content. */
function recordOf(state) {
  const { x, y, w, h } = boundsOf(state);
  const content = CONTENT.get(state);
  return {
    x, y, w, h, z: state.z,
    rotation: content?.rotation ?? 0,
    color: content?.color ?? parseTint(state.el.getAttribute('data-tint')),
    texture: content?.texture ?? null,
    uv: content?.uv,
    version: content?.version
  };
}

/** Whether two records draw the same (a texture's version included). */
function sameRecord(a, b) {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h && a.z === b.z && a.rotation === b.rotation
    && a.texture === b.texture && a.version === b.version && a.uv === b.uv && String(a.color) === String(b.color);
}

/**
 * Draw a root's gpu blits on the GPU. Idempotent per root: a second call returns the first controller.
 * @param {object} app the root collection (`blit('#app')`)
 * @param {{backend?: 'auto'|'webgpu'|'webgl2'|Function, layer?: 'under'|'over'}} [options] `auto` tries WebGPU, then
 *   WebGL2; a function is a `createBackend(canvas)` of your own (the contract in `./gpu-scene.js`)
 * @returns {{canvas: HTMLCanvasElement, ready: Promise<string>, readonly kind: string|null,
 *   snapshot: () => Promise<{width: number, height: number, data: Uint8Array}>, destroy: () => void}}
 */
export function gpu(app, options = {}) {
  const state = stateOf(app.el);
  const root = state?.root;
  if (!root) throw new TypeError('gpu: expected a root, blit(host)');
  if (GPUS.has(root)) return GPUS.get(root).api;
  use({ gpu: gpuPort });

  const controller = {
    root, backend: null, canvas: null, scene: new Scene(), members: new Set(), touched: new Set(), records: new Map(),
    sweep: true, redraw: true, view: root.view, destroyed: false, offs: []
  };
  const layer = options.layer === 'over' ? 'over' : 'under';
  controller.ready = loadBackend(controller, options.backend || 'auto', layer).then((backend) => {
    if (controller.destroyed) {
      backend.destroy();
      return backend.kind;
    }
    controller.backend = backend;
    controller.redraw = true;
    schedule(root);
    return backend.kind;
  });
  controller.ready.catch((error) => logger.warn('no GPU backend; gpu blits stay invisible proxies', error));

  controller.offs.push(
    app.tick(() => readPass(controller), 'read'),
    app.tick((ctx) => drawPass(controller, ctx), 'write'),
    app.on('remove', () => { controller.sweep = true; schedule(root); })
  );
  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(() => {
      // The tilt is about the host's centre, so a new host size re-derives the camera as if it had moved.
      root.applied = null;
      schedule(root);
    });
    observer.observe(root.host);
    controller.offs.push(() => observer.disconnect());
  }

  controller.api = {
    get canvas() { return controller.canvas; },
    get kind() { return controller.backend?.kind ?? null; },
    ready: controller.ready,
    snapshot: () => snapshot(controller),
    destroy: () => destroy(controller, state)
  };
  GPUS.set(root, controller);
  // Blits already on the port (it was named before this root drew) join now.
  for (const element of root.host.querySelectorAll(`[${BLIT_ATTR}]`)) {
    const each = stateOf(element);
    if (each?.port === gpuPort && each.handle) gpuPort(each.handle);
  }
  schedule(root);
  return controller.api;
}

/** A fresh canvas in the host per attempt: a canvas that has handed out one context kind refuses the other. */
function mountCanvas(controller, layer) {
  controller.canvas?.remove();
  const { host, plane } = controller.root;
  const canvas = document.createElement('canvas');
  canvas.setAttribute(GPU_ATTR, '');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', display: 'block'
  });
  host.insertBefore(canvas, layer === 'over' ? plane.nextSibling : plane);
  controller.canvas = canvas;
  return canvas;
}

/** The first backend that comes up, in `auto` order WebGPU then WebGL2; a function is a custom `createBackend`. */
async function loadBackend(controller, wanted, layer) {
  const order = wanted === 'auto' ? ['webgpu', 'webgl2'] : [wanted];
  if (!order.every((name) => typeof name === 'function' || Object.hasOwn(BACKENDS, name))) {
    throw new TypeError(`gpu: unknown backend "${wanted}"`);
  }
  for (const name of order) {
    const canvas = mountCanvas(controller, layer);
    try {
      const create = typeof name === 'function' ? name : (await BACKENDS[name]()).createBackend;
      return await create(canvas);
    } catch (error) {
      logger.info(`${typeof name === 'function' ? 'the custom backend' : name} is unavailable`, error);
    }
  }
  controller.canvas?.remove();
  controller.canvas = null;
  throw new Error('gpu: no backend available');
}

/** Before the root paints: a blit that left the gpu port is let go, and something changed means a sweep. */
function readPass(controller) {
  const { root, members } = controller;
  if (root.dirty.size > 0 || root.measure.size > 0 || root.view !== controller.view) controller.sweep = true;
  controller.view = root.view;
  for (const state of root.dirty) if (members.has(state) && state.port !== gpuPort) forget(controller, state);
}

/** After the plane: bring the scene up to date and draw, only when something drawn changed or the camera moved. */
function drawPass(controller, ctx) {
  if (controller.sweep) sweep(controller);
  for (const state of controller.touched) record(controller, state);
  controller.touched.clear();

  const { backend, canvas, scene, root } = controller;
  if (!backend) return;
  const resized = fitCanvas(canvas, root.hostRect);
  if (!scene.dirty && !ctx.cameraMoved && !resized && !controller.redraw) return;
  draw(controller);
}

/** Whether a member draws now: in the document and not hidden (a demoted branch, a parked blit). */
function visible(state) {
  return state.el.isConnected && !state.el.closest('[hidden]');
}

/**
 * Every member: one gone from the root or off the port is let go, one hidden leaves the scene but stays a member,
 * one missing from the scene or nested or unsized is re-read (its parent or measured size may have moved it).
 */
function sweep(controller) {
  controller.sweep = false;
  const { root, members, scene } = controller;
  for (const state of Array.from(members)) {
    const element = state.el;
    if (state.port !== gpuPort || !isWithin(root.host, element)) forget(controller, state);
    else if (!visible(state)) {
      scene.delete(state);
      controller.records.delete(state);
    } else if (!scene.has(state) || state.w === null || state.h === null || parentElementOf(element)) {
      controller.touched.add(state);
    }
  }
}

/** Put a visible member's record in the scene when it draws differently than before. */
function record(controller, state) {
  if (!controller.members.has(state) || !visible(state)) return;
  const next = recordOf(state);
  const previous = controller.records.get(state);
  if (previous && sameRecord(previous, next)) return;
  controller.records.set(state, next);
  controller.scene.set(state, next);
}

/** Let a blit go: out of the scene, its element visible again. */
function forget(controller, state) {
  controller.members.delete(state);
  controller.scene.delete(state);
  controller.records.delete(state);
  const element = state.el;
  if (PROXIES.has(element)) {
    element.style.opacity = PROXIES.get(element);
    PROXIES.delete(element);
  }
}

/** Size the backing store to the host at the device pixel ratio. @returns {boolean} resized */
function fitCanvas(canvas, hostRect) {
  const ratio = globalThis.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(hostRect.width * ratio));
  const height = Math.max(1, Math.round(hostRect.height * ratio));
  if (canvas.width === width && canvas.height === height) return false;
  canvas.width = width;
  canvas.height = height;
  return true;
}

/** Hand the scene to the backend: texture work first, then one frame. A backend that throws costs that frame,
 * never the root's loop. */
function draw(controller) {
  const { backend, scene, root } = controller;
  const { instances, count, dirty, batches, uploads, drops } = scene.pack();
  controller.redraw = false;
  try {
    for (const id of drops) backend.dropTexture(id);
    for (const [id, source] of uploads) backend.texture(id, source);
    const clip = clipMatrix(root.camera, root.hostRect, backend.depthRange);
    backend.draw({ clip, instances, count, dirty, batches, clear: [0, 0, 0, 0] });
  } catch (error) {
    logger.error('a GPU frame failed', error);
  }
}

/** Draw now and read the frame back (tests, thumbnails). */
async function snapshot(controller) {
  await controller.ready;
  sweep(controller);
  for (const state of controller.touched) record(controller, state);
  controller.touched.clear();
  fitCanvas(controller.canvas, controller.root.hostRect);
  draw(controller);
  return controller.backend.read();
}

/** Undo `gpu(app)`: the passes, the canvas, the backend, and every proxy back to visible. */
function destroy(controller, state) {
  if (controller.destroyed) return;
  controller.destroyed = true;
  for (const off of controller.offs) off();
  for (const member of Array.from(controller.members)) forget(controller, member);
  controller.backend?.destroy();
  controller.canvas?.remove();
  controller.canvas = null;
  GPUS.delete(state.root);
}
