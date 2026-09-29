/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The frame: structure, read and write phases, and the one loop every root (a `blit('#app')` host) runs on. A
 * root asks for a frame (`schedule`, the only way) while it has work - a dirty blit, a pending measurement, a
 * camera in flight, a busy pass - and stops once settled. The host box is read first, then any structure pass,
 * every layout read, then every write. Every pass is registered, a root's own included (`./root.js`).
 */
import { defaultPort } from './port.js';
import { scopeContainerOf } from './state.js';

/** Duration of one reference frame at 60Hz, in milliseconds. */
export const FRAME_MS = 16.67;

/** Largest frame delta the simulation will accept (guards tab-switch stalls). */
export const MAX_FRAME_DELTA_MS = 50;

/** The two phases an extension hook may join. */
export const PHASES = /* @__PURE__ */ Object.freeze(['read', 'write']);

/** The host box assumed until a root's own has been read. */
export const DEFAULT_HOST_RECT = /* @__PURE__ */ Object.freeze({ width: 800, height: 600, left: 0, top: 0 });

/**
 * The loop's record. `hooks.structure`, `read` and `write` are passes, run in
 * registration order within their phase; `hooks.busy` are predicates that keep
 * the loop alive while any answers true. A root made with `running: false` is
 * driven by hand until it is started.
 */
export function createRoot(options = {}) {
  const root = {
    host: options.host || null, plane: options.plane || null, overlay: options.overlay || null,
    camera: options.camera, hostRect: DEFAULT_HOST_RECT, running: options.running !== false,
    rafId: null, _lastTs: null, loop: null, frameCount: 0, applied: null,
    /** States queued for the next write (`dirty`) and read (`measure`) phases. */
    dirty: new Set(), measure: new Set(),
    hooks: { structure: new Set(), read: new Set(), write: new Set(), busy: new Set() },
    /** The promoted view root (null: the host), the blit elements above it, and the id index (`./root.js`). */
    view: null, chain: null, ids: new Map()
  };
  root.loop = (timestamp) => loopStep(root, timestamp);
  return root;
}

/**
 * Frame delta in reference frames (1 = one 60Hz frame) from the rAF timestamp, so motion runs at one rate on
 * any refresh rate. A non-finite timestamp resets the clock's `_lastTs` and counts as one frame.
 */
export function frameDelta(clock, timestamp) {
  const previous = clock._lastTs;
  clock._lastTs = Number.isFinite(timestamp) ? timestamp : null;
  if (previous === null || clock._lastTs === null) return 1;
  return Math.min(Math.max(timestamp - previous, 0), MAX_FRAME_DELTA_MS) / FRAME_MS;
}

/** The idle rule: whether the root has any reason to run another frame. */
export function needsFrame(root) {
  if (root.dirty.size > 0 || root.measure.size > 0 || root.camera.isAnimating === true) return true;
  for (const busy of root.hooks.busy) if (busy()) return true;
  return false;
}

/** Ask for a frame, unless one is already on its way or the root is stopped. */
export function schedule(root) {
  if (!root.running || root.rafId !== null || typeof requestAnimationFrame === 'undefined') return false;
  root.rafId = requestAnimationFrame(root.loop);
  return true;
}

/** One turn of the loop: run this frame, then ask for the next only if needed. */
export function loopStep(root, timestamp) {
  if (!root.running) return;
  root.rafId = null;
  runFrame(root, frameDelta(root, timestamp));

  if (needsFrame(root)) schedule(root);
  if (root.rafId === null) root._lastTs = null;
}

/**
 * Execute one frame synchronously: camera, structure, reads, writes.
 * @param {object} root the root record
 * @param {number} [dt] elapsed time in reference frames
 */
export function runFrame(root, dt = 1) {
  // A camera that moves on its own (the motion add-on's) steps here.
  root.camera.update?.(dt * FRAME_MS);
  const cameraMoved = syncCamera(root);
  // A camera move is the cheapest reliable moment to re-read the host box, before any pass moves an element.
  if (cameraMoved && root.host) root.hostRect = root.host.getBoundingClientRect();
  const ctx = { dt, camera: root.camera, hostRect: root.hostRect, cameraMoved };

  for (const pass of root.hooks.structure) pass(ctx);
  for (const pass of root.hooks.read) pass(ctx);
  for (const pass of root.hooks.write) pass(ctx);
  root.frameCount += 1;
}

/** Whether the camera differs from the one last written to the plane. */
function syncCamera(root) {
  const { x, y, scale, perspective, rotateX, rotateY } = root.camera;
  const a = root.applied;
  if (a && a.x === x && a.y === y && a.scale === scale && a.perspective === perspective
    && a.rotateX === rotateX && a.rotateY === rotateY) return false;
  root.applied = { x, y, scale, perspective, rotateX, rotateY };
  return true;
}

/** Empty a queue and run `fn` on each blit still in the document (one removed since, even by a port, is skipped). */
function drain(queue, fn) {
  if (queue.size === 0) return;
  const states = Array.from(queue);
  queue.clear();
  for (const state of states) if (state.el.isConnected) fn(state);
}

/** A blit root's own read pass: measure every queued blit. First in the read phase (`./root.js`). */
export function measureBlits(root) {
  drain(root.measure, measure);
}

/** A blit root's own write pass: every dirty blit through its port. First in the write phase. */
export function paintBlits(root) {
  drain(root.dirty, (state) => paint(root, state));
}

/** Read one blit's layout box (`offset*`: layout space, unaffected by zoom) and its scope container's offset. */
function measure(state) {
  const element = state.el;
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  if (width > 0 && height > 0) {
    state.mw = width;
    state.mh = height;
  }

  const scope = scopeContainerOf(element);
  if (scope !== element) {
    state.sx = Number(scope.offsetLeft) || 0;
    state.sy = Number(scope.offsetTop) || 0;
  }
}

/** Hand one blit to its port. A size the port wrote is re-read next frame, so declared and measured agree. */
export function paint(root, state) {
  const port = state.port || defaultPort;
  const resized = state.changed.has('w') || state.changed.has('h');

  port(state.handle, { changed: state.changed, first: !state.painted, camera: root ? root.camera : null });
  state.painted = true;
  state.changed.clear();

  if (root && resized) root.measure.add(state);
}
