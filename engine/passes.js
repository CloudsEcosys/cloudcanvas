/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The Pin engine's frame passes, registered on a core frame root
 * (`../core/frame.js`) and run in this order:
 *
 *   structure  begin (the frame's dirt, the camera version, the context),
 *              the offload sweep, the structure flush
 *   read       [physics, trait ticks]  measurement
 *   write      contents, placement, motion hints, scope wells, the plane and
 *              SVG-layer transform, the SVG groups, [cursors]
 *
 * The bracketed passes are the session's, threaded in through `extra`. Each
 * pass takes the `ConjugateRenderer` that owns the sets it works over; the
 * renderer itself is a facade over them. Only dirty Pins are touched, and the
 * `busy` predicate is what keeps the loop alive while any of them are.
 */
import { defaultPort, formatTransform3D } from '../core/port.js';
import { stateOf } from '../core/state.js';
import { forEachChild } from '../pins/pin-hierarchy.js';
import { flushStructure, isDormant } from './mounting.js';
import { runOffloadSweep } from './offload.js';
import { isFlowParent } from './scope-well.js';

/**
 * Register every pass on `root`, in phase order.
 * @param {import('./renderer.js').ConjugateRenderer} renderer
 * @param {object} root the core frame root
 * @param {{read?: Function[], write?: Function[], busy?: Function[]}} [extra]
 *        the session's passes: `read` runs before measurement, `write` after the SVG groups
 */
export function registerPasses(renderer, root, extra = {}) {
  const { structure, read, write, busy } = root.hooks;
  structure.add((ctx) => beginFrame(renderer, ctx));
  structure.add(() => runOffloadSweep(renderer, renderer.context));
  structure.add(() => flushStructure(renderer));

  for (const pass of extra.read || []) read.add(pass);
  read.add(() => measurePass(renderer));

  write.add(() => contentsPass(renderer));
  write.add(() => placementPass(renderer));
  write.add(() => renderer.motionHints.sweep(root.frameCount));
  write.add(() => wellsPass(renderer));
  write.add(() => planePass(renderer));
  write.add(() => svgPass(renderer));
  for (const pass of extra.write || []) write.add(pass);

  busy.add(() => hasWork(renderer));
  for (const pass of extra.busy || []) busy.add(pass);
}

/* ------------------ STRUCTURE ------------------ */

/** Open the frame: fresh dirt, the camera version, and the context every pass reads. */
function beginFrame(renderer, ctx) {
  renderer._frameDirty.clear();
  if (ctx.cameraMoved) renderer.viewportVersion += 1;
  renderer.context = renderer._contextFor(ctx);
}

/* ------------------ READ ------------------ */

/** Every layout read of the frame: the queued Pins, a hidden one skipped. */
function measurePass(renderer) {
  const queue = renderer.measureQueue;
  if (queue.size === 0) return 0;

  const queued = Array.from(queue);
  queue.clear();

  let measured = 0;
  for (const pin of queued) {
    // A hidden Pin has no layout box; its cached size stays authoritative.
    if (!pin.element || isDormant(pin)) continue;
    if (measurePin(renderer, pin)) measured += 1;
  }
  return measured;
}

/**
 * Measure one Pin, recording a geometry change for the global SVG pass. A
 * resize moves a Pin's bounds as much as a translation does, and so does a flow
 * child whose flex/grid origin shifted without its particle moving at all.
 */
function measurePin(renderer, pin) {
  const { width, height } = pin.particle;
  const offset = pin._scopeOffset;
  const scopeX = offset ? offset.x : 0;
  const scopeY = offset ? offset.y : 0;
  const flow = pin._flowOrigin;
  const wasFlow = Boolean(flow);
  const flowX = flow ? flow.x : 0;
  const flowY = flow ? flow.y : 0;

  if (!pin.measureLayout()) return false;

  const sizeChanged = pin.particle.width !== width || pin.particle.height !== height;
  const scopeChanged = Boolean(pin._scopeOffset
    && (pin._scopeOffset.x !== scopeX || pin._scopeOffset.y !== scopeY));
  const flowNow = pin._flowOrigin;
  const flowChanged = Boolean(flowNow) !== wasFlow
    || Boolean(flowNow && (flowNow.x !== flowX || flowNow.y !== flowY));

  if (sizeChanged || scopeChanged || flowChanged) renderer._frameDirty.add(pin);
  // A size change the write phase did not originate also reflows the flow
  // neighbours; gated by the compare above, so it settles rather than loops.
  if (sizeChanged) reflowFlowNeighbours(renderer, pin);
  return true;
}

/**
 * Re-queue the flow children whose live origin a size change moved: the
 * container's children when `pin` is a flow container, its siblings when it is
 * a flow child. Their `_flowOrigin` is refreshed by the next read phase, which
 * writes no layout, so the cascade stops the moment a size repeats.
 */
export function reflowFlowNeighbours(renderer, pin) {
  let container = null;
  if (isFlowParent(pin)) container = pin;
  else if (pin.parent && isFlowParent(pin.parent)) container = pin.parent;
  if (!container) return false;

  // A resized child grew its container's box; refresh that measurement too.
  if (container !== pin && container.element) renderer.measureQueue.add(container);
  // The allocation-free child walk; read-only, so it honours its no-reorder contract.
  forEachChild(container, queueLiveChildMeasure, renderer);
  return true;
}

/** `forEachChild` visitor: re-queue a live flow child for the next read phase. */
function queueLiveChildMeasure(child, renderer) {
  if (renderer.liveSet.has(child) && child.element) renderer.measureQueue.add(child);
}

/* ------------------ WRITE ------------------ */

/**
 * Render contents for live, dirty Pins. A dirty Pin that is asleep keeps its
 * flag rather than losing the update: it renders once, on the frame it wakes.
 */
function contentsPass(renderer) {
  if (renderer.dirtyContent.size === 0) return 0;

  const dirty = Array.from(renderer.dirtyContent);
  renderer.dirtyContent.clear();

  let rendered = 0;
  for (const pin of dirty) {
    if (!renderer.activeSet.has(pin) || !pin.element) continue;
    if (!renderer.liveSet.has(pin)) {
      renderer.dirtyContent.add(pin);
      continue;
    }

    pin.renderContent(renderer.context);
    // New content means a new box: measure it in the next read phase, and
    // re-lay its flow neighbours (the authoritative reflow trigger for a resize).
    renderer.measureQueue.add(pin);
    renderer._frameDirty.add(pin);
    reflowFlowNeighbours(renderer, pin);
    rendered += 1;
  }
  return rendered;
}

/**
 * Place the Pins that moved, through the core port and its diff cache: a still
 * Pin costs no DOM write and no string. A flow child is placed by its parent's
 * flex/grid flow and gets no transform at all; a sleeping Pin keeps its flag
 * for the frame it wakes.
 */
function placementPass(renderer) {
  if (renderer.dirtyPlacement.size === 0) return 0;

  const moved = Array.from(renderer.dirtyPlacement);
  renderer.dirtyPlacement.clear();

  let written = 0;
  for (const pin of moved) {
    if (!renderer.activeSet.has(pin) || !pin.element) continue;
    if (!renderer.liveSet.has(pin)) {
      renderer.dirtyPlacement.add(pin);
      continue;
    }
    if (placePin(renderer, pin)) written += 1;
  }
  return written;
}

/** One Pin through the port; a written transform earns the compositor hint. */
function placePin(renderer, pin) {
  const parent = pin.parent;
  if (parent && parent.layout && parent.layout !== 'free') return false;
  if (!defaultPort(stateOf(pin.element))) return false;

  renderer.motionHints.mark(pin, renderer.frameRoot.frameCount);
  renderer._frameDirty.add(pin);
  return true;
}

/**
 * Wells are sized from the positions written just above, and before the camera
 * transform, so a scope that grew this frame is already the right shape when
 * the plane it lives on is redrawn. Nothing here reads layout.
 */
function wellsPass(renderer) {
  return renderer.scopeWells.update({
    frameDirty: renderer._frameDirty,
    isLive: renderer._isLive,
    onWrite: renderer._onWellWritten
  });
}

/**
 * Rewrite the camera transform only when the camera version moved. The SVG
 * layer gets the *same* string as the plane: both are drawn in canvas
 * coordinates and projected by one transform, so a connector is correct at zoom.
 */
function planePass(renderer) {
  if (renderer._appliedViewportVersion === renderer.viewportVersion) return false;

  const camera = renderer.frameRoot.camera;
  const plane = renderer.planeElement;
  if (!camera || !plane || !plane.style) return false;

  const transform = formatTransform3D(camera.x, camera.y, 0, camera.scale);
  plane.style.transform = transform;
  const svgElement = renderer.svgLayer.element;
  if (svgElement && svgElement.style) svgElement.style.transform = transform;

  renderer._appliedViewportVersion = renderer.viewportVersion;
  return true;
}

/** The global SVG pass, gated per trait group; last, so it sees final geometry. */
function svgPass(renderer) {
  const session = renderer.session;
  return renderer.svgLayer.render({
    manager: renderer.pinManager || (session ? session.pinManager : null),
    context: renderer.context,
    viewportVersion: renderer.viewportVersion,
    isDirty: renderer._isGlobalDirty
  });
}

/* ------------------ IDLE ------------------ */

/** Whether any pass still has actionable work: a sleeping Pin's held flags do not count. */
function hasWork(renderer) {
  return renderer.dirtyStructure.size > 0
    || renderer.measureQueue.size > 0
    || renderer.motionHints.size > 0
    || renderer._offloadPending === true
    || hasLive(renderer.dirtyContent, renderer.liveSet)
    || hasLive(renderer.dirtyPlacement, renderer.liveSet);
}

/** Whether any Pin in `queued` is live, without allocating. */
function hasLive(queued, liveSet) {
  for (const pin of queued) {
    if (liveSet.has(pin)) return true;
  }
  return false;
}
