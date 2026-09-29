/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * offload: DOM virtualisation. A top-level blit carrying the trait whose global
 * box has left the visible canvas, past a margin in screen pixels, is parked -
 * taken out of the document behind its anchor, state and running traits kept -
 * and put back the frame the camera brings it into range again. Nested blits ride their top-level
 * blit, so only those are tested.
 *
 *   blit.use({ offload });
 *   app.blit({ id: 'far', x: 9000, offload: true });          // default margin
 *   app.blit({ id: 'edge', offload: { margin: 0 } });         // the instant it clears the edge
 *
 * The sweep runs in the structure phase, only on a frame the camera moved or a
 * blit just joined: a still camera does no offload work.
 */
import { schedule } from '../core/frame.js';
import { parentElementOf, stateOf, boundsOf } from '../core/state.js';
import { park, unpark } from './park.js';

/** The record an anchor comment holds a place for: how a walker reads an offloaded blit where it sits. */
export { parkedStateOf } from './park.js';

/** Screen pixels of clearance before a blit is parked. */
export const DEFAULT_OFFLOAD_MARGIN = 400;

/** @type {WeakMap<object, {members: Map<object, number>, pending: boolean, off: Function}>} root -> its sweep */
const SWEEPS = /* @__PURE__ */ new WeakMap();

/** The canvas rectangle the host shows through `camera`. */
export function visibleRect(camera, hostRect) {
  const { x, y, scale } = camera;
  return { minX: -x / scale, minY: -y / scale, maxX: (hostRect.width - x) / scale, maxY: (hostRect.height - y) / scale };
}

/** Whether a box lies wholly beyond `rect` grown by `margin` on every side; touching it keeps it. */
export function isOutside(bounds, rect, margin) {
  return bounds.x + bounds.w < rect.minX - margin || bounds.x > rect.maxX + margin
    || bounds.y + bounds.h < rect.minY - margin || bounds.y > rect.maxY + margin;
}

/** Whether `b` is parked by the sweep. */
export function isOffloaded(b) {
  const state = stateOf(b.el);
  const root = stateOf(parentElementOf(b.el))?.root;
  return Boolean(state?.anchor) && Boolean(root && SWEEPS.get(root)?.members.has(state));
}

/** Park or restore each member against the camera; members only, and only when something moved. */
function sweep(root, record, ctx) {
  if (!ctx.cameraMoved && !record.pending) return;
  record.pending = false;
  const rect = visibleRect(root.camera, ctx.hostRect);
  for (const [state, margin] of record.members) {
    const outside = isOutside(boundsOf(state), rect, margin / root.camera.scale);
    if (outside === Boolean(state.anchor)) continue;
    if (outside) park(state, true);
    else if (unpark(state, true)) root.measure.add(state);
  }
}

/** The root's sweep, installed on first use. */
function sweepOf(root) {
  let record = SWEEPS.get(root);
  if (!record) {
    record = { members: new Map(), pending: true, off: null };
    const pass = (ctx) => sweep(root, record, ctx);
    root.hooks.structure.add(pass);
    record.off = () => root.hooks.structure.delete(pass);
    SWEEPS.set(root, record);
  }
  return record;
}

/** The named trait: on a top-level blit, join the root's sweep; `{margin}` overrides the default. */
export function offload(b, options, root) {
  if (!root || parentElementOf(b.el) !== root.host) return undefined;
  const state = stateOf(b.el);
  const margin = Number.isFinite(options?.margin) ? options.margin : DEFAULT_OFFLOAD_MARGIN;
  const record = sweepOf(root);
  record.members.set(state, margin);
  record.pending = true;
  schedule(root);
  return () => {
    record.members.delete(state);
    if (state.anchor) unpark(state, true);
    if (record.members.size === 0) {
      record.off();
      SWEEPS.delete(root);
    }
  };
}
