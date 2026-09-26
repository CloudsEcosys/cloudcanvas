/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The frame: one read phase, one write phase, and the loop that runs them.
 *
 * A root asks for a frame only while it has something to do - a dirty blit, a
 * pending measurement, a camera in flight - and stops the moment it settles.
 * Every layout read comes before the first port write. Structure (creating and
 * removing elements) is not a phase: it happens at the call, because the DOM
 * tree is the hierarchy. The clock is shared with `../engine/frame.js`.
 */
import { defaultPort, formatTransform3D } from './port.js';
import { scopeContainerOf } from './state.js';

/** Duration of one reference frame at 60Hz, in milliseconds. */
export const FRAME_MS = 16.67;

/** Largest frame delta the simulation will accept (guards tab-switch stalls). */
export const MAX_FRAME_DELTA_MS = 50;

/** The two phases an extension hook may join. */
export const PHASES = /* @__PURE__ */ Object.freeze(['read', 'write']);

/**
 * Frame delta in reference frames (1 = one 60Hz frame) from the rAF timestamp,
 * so motion runs at one rate on any refresh rate. A non-finite timestamp
 * resets the clock's `_lastTs` and counts as one frame.
 */
export function frameDelta(clock, timestamp) {
  if (!Number.isFinite(timestamp)) {
    clock._lastTs = null;
    return 1;
  }

  const previous = clock._lastTs;
  clock._lastTs = timestamp;
  if (previous === null) return 1;

  const elapsedMs = Math.min(Math.max(timestamp - previous, 0), MAX_FRAME_DELTA_MS);
  return elapsedMs / FRAME_MS;
}

/** Whether the root has any reason to run another frame. */
export function needsFrame(root) {
  return root.dirty.size > 0 || root.measure.size > 0 || root.camera.isAnimating === true;
}

/** Ask for a frame, unless one is already on its way. */
export function schedule(root) {
  if (root.rafId !== null || typeof requestAnimationFrame === 'undefined') return false;
  root.rafId = requestAnimationFrame(root.loop);
  return true;
}

/** One turn of the loop: run this frame, then ask for the next only if needed. */
export function loopStep(root, timestamp) {
  root.rafId = null;
  runFrame(root, frameDelta(root, timestamp));

  if (needsFrame(root)) schedule(root);
  else root._lastTs = null;
}

/**
 * Execute one frame synchronously: camera, reads, writes.
 * @param {object} root the root record
 * @param {number} [dt] elapsed time in reference frames
 */
export function runFrame(root, dt = 1) {
  // A camera that moves on its own (the motion add-on's) steps here.
  root.camera.update?.(dt * FRAME_MS);
  const cameraMoved = syncCamera(root);
  const ctx = { dt, camera: root.camera, hostRect: root.hostRect };

  readPhase(root, cameraMoved, ctx);
  writePhase(root, cameraMoved, ctx);
  root.frameCount += 1;
}

/** Whether the camera differs from the one last written to the plane. */
function syncCamera(root) {
  const { x, y, scale } = root.camera;
  const applied = root.applied;
  if (applied && applied.x === x && applied.y === y && applied.scale === scale) return false;

  root.applied = { x, y, scale };
  return true;
}

/**
 * Empty a queue and run `fn` on each blit still in the document: one removed
 * since it was queued, even by an earlier port in this pass, is skipped.
 */
function drain(queue, fn) {
  if (queue.size === 0) return;
  const states = Array.from(queue);
  queue.clear();
  for (const state of states) {
    if (state.el.isConnected) fn(state);
  }
}

/** Every layout read of the frame, before any write. */
function readPhase(root, cameraMoved, ctx) {
  // A camera move is the cheapest reliable moment to re-read the host box.
  if (cameraMoved) {
    root.hostRect = root.host.getBoundingClientRect();
    ctx.hostRect = root.hostRect;
  }
  drain(root.measure, measure);
  for (const hook of root.hooks.read) hook(ctx);
}

/**
 * Read one blit's layout box, and where its scope container sits inside it.
 * `offsetWidth/Height` are layout-space, unaffected by the plane's zoom.
 */
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

/** Ports for dirty blits, the plane transform for a moved camera, then hooks. */
function writePhase(root, cameraMoved, ctx) {
  drain(root.dirty, (state) => paint(root, state));
  if (cameraMoved) {
    const { x, y, scale } = root.camera;
    root.plane.style.transform = formatTransform3D(x, y, 0, scale);
  }
  for (const hook of root.hooks.write) hook(ctx);
}

/**
 * Hand one blit to its port. A size the port wrote is re-read next frame, so
 * the declared and measured boxes never disagree for long.
 */
export function paint(root, state) {
  const port = state.port || defaultPort;
  const resized = state.changed.has('w') || state.changed.has('h');

  port(state.handle, { changed: state.changed, first: !state.painted, camera: root ? root.camera : null });
  state.painted = true;
  state.changed.clear();

  if (root && resized) root.measure.add(state);
}
